/**
 * Gaming Data Sync Service
 * Unified service for syncing data from Steam and HoYoverse
 */

import { getSteamClient } from "./steam-client";
import { getHoYoClient } from "./hoyo-client";
import prisma from "@/lib/prisma";
import { GamePlatform, SyncJobStatus } from "@prisma/client";
import type { SteamAPIClient } from "./steam-client";
import type { HoYoAPIClient } from "./hoyo-client";

export interface SyncResult {
  success: boolean;
  platform: GamePlatform;
  message?: string;
  gamesUpdated?: number;
  sessionsCreated?: number;
  achievementsUpdated?: number;
  error?: string;
  syncedAt?: Date | string;
}

export class GamingSyncService {
  private cachedSteamClient?: SteamAPIClient;
  private cachedHoYoClient?: HoYoAPIClient;

  // These are intentionally public so tests can inject fakes without relying on module env
  public steamClient?: SteamAPIClient;
  public hoyoClient?: HoYoAPIClient;

  private resolveSteamClient(): SteamAPIClient {
    if (this.steamClient) {
      return this.steamClient;
    }
    if (!this.cachedSteamClient) {
      this.cachedSteamClient = getSteamClient();
    }
    return this.cachedSteamClient;
  }

  private resolveHoYoClient(): HoYoAPIClient {
    if (this.hoyoClient) {
      return this.hoyoClient;
    }
    if (!this.cachedHoYoClient) {
      this.cachedHoYoClient = getHoYoClient();
    }
    return this.cachedHoYoClient;
  }

  /**
   * Sync Steam data for a user
   */
  async syncSteamData(steamId: string): Promise<SyncResult> {
    const startTime = Date.now();
    let jobId: string | null = null;

    try {
      const job = await prisma.gamingSyncLog.create({
        data: {
          platform: GamePlatform.STEAM,
          status: SyncJobStatus.RUNNING,
        },
      });
      jobId = job.id;

      const steamClient = this.resolveSteamClient();
      const optionalSteamClient = steamClient as Partial<SteamAPIClient>;

      // 1. Update Steam profile
      const profile = await steamClient.getPlayerSummary(steamId);
      if (profile) {
        const personaName =
          (profile as { personaname?: string }).personaname ??
          (profile as { personaName?: string }).personaName ??
          "";
        const profileUrl =
          (profile as { profileurl?: string | null }).profileurl ??
          (profile as { profileUrl?: string | null }).profileUrl ??
          null;
        const avatar =
          (profile as { avatarfull?: string | null }).avatarfull ??
          (profile as { avatar?: string | null }).avatar ??
          null;

        await prisma.steamProfile.upsert({
          where: { steamId },
          create: {
            steamId,
            personaName,
            profileUrl,
            avatar,
            lastSyncAt: new Date(),
          },
          update: {
            personaName,
            profileUrl,
            avatar,
            lastSyncAt: new Date(),
          },
        });
      }

      // 2. Get owned games
      const ownedGames = await steamClient.getOwnedGames(steamId);

      // 3. Get recently played games
      const recentGames = await steamClient.getRecentlyPlayedGames(steamId);

      const normalizedOwnedGames = ownedGames.filter(
        (game) => typeof game.appId === "number" && !Number.isNaN(game.appId)
      );
      const normalizedRecentGames = recentGames.filter(
        (game) => typeof game.appId === "number" && !Number.isNaN(game.appId)
      );

      // 4. Update games in database
      let gamesUpdated = 0;
      let sessionsCreated = 0;
      let achievementsUpdated = 0;

      for (const steamGame of normalizedOwnedGames) {
        const appIdNumber = steamGame.appId;
        const appId = appIdNumber.toString();

        // Fetch high-quality game cover from Steam (prioritize recently played games)
        const isRecentlyPlayed = normalizedRecentGames.some((g) => g.appId === appIdNumber);
        let gameCover: string | undefined;

        if (isRecentlyPlayed && typeof optionalSteamClient.getGameDetails === "function") {
          // For recently played games, fetch high-quality cover
          try {
            const gameDetails = await optionalSteamClient.getGameDetails(appIdNumber);
            if (gameDetails) {
              gameCover = gameDetails.cover;
            }
          } catch (error) {
            console.warn(`Failed to fetch details for ${steamGame.name}:`, error);
          }
        }

        // Fallback to logo URL
        if (
          !gameCover &&
          steamGame.imgLogoUrl &&
          typeof optionalSteamClient.getGameLogoURL === "function"
        ) {
          gameCover = optionalSteamClient.getGameLogoURL(appIdNumber, steamGame.imgLogoUrl);
        }

        // Upsert game
        const game = await prisma.game.upsert({
          where: {
            platform_platformId: {
              platform: GamePlatform.STEAM,
              platformId: appId,
            },
          },
          create: {
            platformId: appId,
            platform: GamePlatform.STEAM,
            name: steamGame.name,
            cover: gameCover,
          },
          update: {
            name: steamGame.name,
            cover: gameCover,
          },
        });

        gamesUpdated++;

        // Create session record for games played recently (last 2 weeks)
        const recentGame = normalizedRecentGames.find((g) => g.appId === appIdNumber);
        if (recentGame && recentGame.playtime2Weeks) {
          // Estimate session based on playtime increase
          const now = new Date();
          const sessionStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

          await prisma.gameSession.create({
            data: {
              gameId: game.id,
              platform: GamePlatform.STEAM,
              startTime: sessionStart,
              endTime: now,
              duration: recentGame.playtime2Weeks,
            },
          });

          sessionsCreated++;
        }

        // Fetch and update achievements (for recently played games only)
        if (recentGame && typeof optionalSteamClient.getPlayerAchievements === "function") {
          try {
            const achievements =
              (await optionalSteamClient.getPlayerAchievements(steamId, appIdNumber)) ?? [];

            for (const ach of achievements) {
              const achievementId = ach.apiName;
              const isUnlocked = ach.achieved === true;
              const unlockedAt =
                isUnlocked && ach.unlockTime ? new Date(ach.unlockTime * 1000) : null;

              await prisma.gameAchievement.upsert({
                where: {
                  gameId_achievementId: {
                    gameId: game.id,
                    achievementId,
                  },
                },
                create: {
                  gameId: game.id,
                  achievementId,
                  name: ach.name || achievementId,
                  description: ach.description,
                  isUnlocked,
                  unlockedAt,
                },
                update: {
                  name: ach.name || achievementId,
                  description: ach.description,
                  isUnlocked,
                  unlockedAt,
                },
              });

              achievementsUpdated++;
            }
          } catch (error) {
            // Some games don't have achievements
            console.warn(`Failed to fetch achievements for ${steamGame.name}:`, error);
          }
        }
      }

      // Log success
      const duration = Date.now() - startTime;
      if (jobId) {
        await prisma.gamingSyncLog.update({
          where: { id: jobId },
          data: {
            status: SyncJobStatus.SUCCESS,
            syncedAt: new Date(),
            duration,
            message: `Synced ${gamesUpdated} games, ${sessionsCreated} sessions, ${achievementsUpdated} achievements`,
          },
        });
      }

      return {
        success: true,
        platform: GamePlatform.STEAM,
        gamesUpdated,
        sessionsCreated,
        achievementsUpdated,
        message: "Steam data synced successfully",
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (jobId) {
        await prisma.gamingSyncLog.update({
          where: { id: jobId },
          data: {
            status: SyncJobStatus.FAILED,
            syncedAt: new Date(),
            duration,
            message: errorMessage,
            errorStack: error instanceof Error ? error.stack : undefined,
          },
        });
      } else {
        await prisma.gamingSyncLog.create({
          data: {
            platform: GamePlatform.STEAM,
            status: SyncJobStatus.FAILED,
            message: errorMessage,
            errorStack: error instanceof Error ? error.stack : undefined,
            duration,
          },
        });
      }

      return {
        success: false,
        platform: GamePlatform.STEAM,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }

  /**
   * Sync Zenless Zone Zero (HoYoverse) data
   */
  async syncZZZData(uid: string): Promise<SyncResult> {
    const startTime = Date.now();
    let jobId: string | null = null;

    try {
      const job = await prisma.gamingSyncLog.create({
        data: {
          platform: GamePlatform.HOYOVERSE,
          status: SyncJobStatus.RUNNING,
        },
      });
      jobId = job.id;

      const hoyoClient = this.resolveHoYoClient();
      const optionalHoYoClient = hoyoClient as Partial<HoYoAPIClient>;

      // 1. Get ZZZ index data
      const indexData = await hoyoClient.getZZZIndex();
      const shiyuData = (await optionalHoYoClient.getZZZShiyuDefence?.()) ?? null;
      optionalHoYoClient.calculateActivityScore?.(indexData, shiyuData);

      // 2. Update HoYo profile
      await prisma.hoyoProfile.upsert({
        where: { uid },
        create: {
          uid,
          nickname: "Player", // HoYoLab doesn't provide nickname in this endpoint
          level: parseInt(indexData.stats.world_level_name) || 1,
          loginDays: indexData.stats.active_days,
          lastSyncAt: new Date(),
        },
        update: {
          level: parseInt(indexData.stats.world_level_name) || 1,
          loginDays: indexData.stats.active_days,
          lastSyncAt: new Date(),
        },
      });

      // 3. Upsert Zenless Zone Zero game
      const game = await prisma.game.upsert({
        where: {
          platform_platformId: {
            platform: GamePlatform.HOYOVERSE,
            platformId: "zenless",
          },
        },
        create: {
          platformId: "zenless",
          platform: GamePlatform.HOYOVERSE,
          name: "Zenless Zone Zero",
          nameZh: "绝区零",
          cover: "/images/about/zzz-cover.jpg", // You'll need to add this image
        },
        update: {
          name: "Zenless Zone Zero",
          nameZh: "绝区零",
        },
      });

      // 4. Create session record with estimated playtime
      const { estimatedHours = 0 } = optionalHoYoClient.estimatePlaytime
        ? optionalHoYoClient.estimatePlaytime(indexData)
        : { estimatedHours: 0 };
      const now = new Date();
      const sessionStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last week

      await prisma.gameSession.create({
        data: {
          gameId: game.id,
          platform: GamePlatform.HOYOVERSE,
          startTime: sessionStart,
          endTime: now,
          duration: Math.round(estimatedHours * 60),
          hoyoLevel: parseInt(indexData.stats.world_level_name) || 1,
        },
      });

      // 5. Update character achievements
      let achievementsUpdated = 0;
      for (const character of indexData.avatar_list) {
        await prisma.gameAchievement.upsert({
          where: {
            gameId_achievementId: {
              gameId: game.id,
              achievementId: `character_${character.id}`,
            },
          },
          create: {
            gameId: game.id,
            achievementId: `character_${character.id}`,
            name: character.name,
            nameZh: character.name_mi18n,
            description: `Obtained ${character.name}`,
            isUnlocked: true,
            unlockedAt: new Date(),
          },
          update: {
            name: character.name,
            nameZh: character.name_mi18n,
          },
        });

        achievementsUpdated++;
      }

      // Log success
      const duration = Date.now() - startTime;
      if (jobId) {
        await prisma.gamingSyncLog.update({
          where: { id: jobId },
          data: {
            status: SyncJobStatus.SUCCESS,
            syncedAt: new Date(),
            duration,
            message: `Synced ZZZ data: ${indexData.stats.avatar_num} characters, ${indexData.stats.active_days} login days`,
          },
        });
      }

      return {
        success: true,
        platform: GamePlatform.HOYOVERSE,
        gamesUpdated: 1,
        sessionsCreated: 1,
        achievementsUpdated,
        message: "Zenless Zone Zero data synced successfully",
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (jobId) {
        await prisma.gamingSyncLog.update({
          where: { id: jobId },
          data: {
            status: SyncJobStatus.FAILED,
            syncedAt: new Date(),
            duration,
            message: errorMessage,
            errorStack: error instanceof Error ? error.stack : undefined,
          },
        });
      } else {
        await prisma.gamingSyncLog.create({
          data: {
            platform: GamePlatform.HOYOVERSE,
            status: SyncJobStatus.FAILED,
            message: errorMessage,
            errorStack: error instanceof Error ? error.stack : undefined,
            duration,
          },
        });
      }

      return {
        success: false,
        platform: GamePlatform.HOYOVERSE,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }

  /**
   * Sync all gaming platforms
   */
  async syncAllPlatforms(): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    // Sync Steam
    const steamId = process.env.STEAM_USER_ID;
    if (steamId) {
      const steamResult = await this.syncSteamData(steamId);
      results.push(steamResult);
    } else {
      console.warn("STEAM_USER_ID not configured, skipping Steam sync");
    }

    // Sync HoYoverse/ZZZ
    const hoyoUid = process.env.HOYO_UID;
    if (hoyoUid) {
      const zzzResult = await this.syncZZZData(hoyoUid);
      results.push(zzzResult);
    } else {
      console.warn("HOYO_UID not configured, skipping ZZZ sync");
    }

    return results;
  }
}

/**
 * Singleton instance
 */
let syncService: GamingSyncService | null = null;

export function getGamingSyncService(): GamingSyncService {
  if (!syncService) {
    syncService = new GamingSyncService();
  }
  return syncService;
}
