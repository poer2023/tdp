/**
 * Gaming Data Sync Service
 * Unified service for syncing data from Steam and HoYoverse
 */

import { getSteamClient } from "./steam-client";
import { getHoYoClient } from "./hoyo-client";
import prisma from "@/lib/prisma";
import { GamePlatform, SyncJobStatus } from "@prisma/client";

interface SyncResult {
  success: boolean;
  platform: GamePlatform;
  message?: string;
  gamesUpdated?: number;
  sessionsCreated?: number;
  achievementsUpdated?: number;
}

export class GamingSyncService {
  /**
   * Sync Steam data for a user
   */
  async syncSteamData(steamId: string): Promise<SyncResult> {
    const startTime = Date.now();

    try {
      await prisma.gamingSyncLog.create({
        data: {
          platform: GamePlatform.STEAM,
          status: SyncJobStatus.RUNNING,
        },
      });

      const steamClient = getSteamClient();

      // 1. Update Steam profile
      const profile = await steamClient.getPlayerSummary(steamId);
      if (profile) {
        await prisma.steamProfile.upsert({
          where: { steamId },
          create: {
            steamId,
            personaName: profile.personaname,
            profileUrl: profile.profileurl,
            avatar: profile.avatarfull,
            lastSyncAt: new Date(),
          },
          update: {
            personaName: profile.personaname,
            profileUrl: profile.profileurl,
            avatar: profile.avatarfull,
            lastSyncAt: new Date(),
          },
        });
      }

      // 2. Get owned games
      const ownedGames = await steamClient.getOwnedGames(steamId);

      // 3. Get recently played games
      const recentGames = await steamClient.getRecentlyPlayedGames(steamId);

      // 4. Update games in database
      let gamesUpdated = 0;
      let sessionsCreated = 0;
      let achievementsUpdated = 0;

      for (const steamGame of ownedGames) {
        // Upsert game
        const game = await prisma.game.upsert({
          where: {
            platform_platformId: {
              platform: GamePlatform.STEAM,
              platformId: steamGame.appid.toString(),
            },
          },
          create: {
            platformId: steamGame.appid.toString(),
            platform: GamePlatform.STEAM,
            name: steamGame.name,
            cover: steamGame.img_logo_url
              ? steamClient.getGameLogoURL(steamGame.appid, steamGame.img_logo_url)
              : undefined,
          },
          update: {
            name: steamGame.name,
            cover: steamGame.img_logo_url
              ? steamClient.getGameLogoURL(steamGame.appid, steamGame.img_logo_url)
              : undefined,
          },
        });

        gamesUpdated++;

        // Create session record for games played recently (last 2 weeks)
        const recentGame = recentGames.find((g) => g.appid === steamGame.appid);
        if (recentGame && recentGame.playtime_2weeks) {
          // Estimate session based on playtime increase
          const now = new Date();
          const sessionStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

          await prisma.gameSession.create({
            data: {
              gameId: game.id,
              platform: GamePlatform.STEAM,
              startTime: sessionStart,
              endTime: now,
              duration: recentGame.playtime_2weeks,
            },
          });

          sessionsCreated++;
        }

        // Fetch and update achievements (for recently played games only)
        if (recentGame) {
          try {
            const achievements = await steamClient.getPlayerAchievements(steamId, steamGame.appid);

            for (const ach of achievements) {
              await prisma.gameAchievement.upsert({
                where: {
                  gameId_achievementId: {
                    gameId: game.id,
                    achievementId: ach.apiname,
                  },
                },
                create: {
                  gameId: game.id,
                  achievementId: ach.apiname,
                  name: ach.name || ach.apiname,
                  description: ach.description,
                  isUnlocked: ach.achieved === 1,
                  unlockedAt: ach.achieved === 1 ? new Date(ach.unlocktime * 1000) : null,
                },
                update: {
                  name: ach.name || ach.apiname,
                  description: ach.description,
                  isUnlocked: ach.achieved === 1,
                  unlockedAt: ach.achieved === 1 ? new Date(ach.unlocktime * 1000) : null,
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
      await prisma.gamingSyncLog.create({
        data: {
          platform: GamePlatform.STEAM,
          status: SyncJobStatus.SUCCESS,
          message: `Synced ${gamesUpdated} games, ${sessionsCreated} sessions, ${achievementsUpdated} achievements`,
          duration,
        },
      });

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

      await prisma.gamingSyncLog.create({
        data: {
          platform: GamePlatform.STEAM,
          status: SyncJobStatus.FAILED,
          message: errorMessage,
          errorStack: error instanceof Error ? error.stack : undefined,
          duration,
        },
      });

      return {
        success: false,
        platform: GamePlatform.STEAM,
        message: errorMessage,
      };
    }
  }

  /**
   * Sync Zenless Zone Zero (HoYoverse) data
   */
  async syncZZZData(uid: string): Promise<SyncResult> {
    const startTime = Date.now();

    try {
      await prisma.gamingSyncLog.create({
        data: {
          platform: GamePlatform.HOYOVERSE,
          status: SyncJobStatus.RUNNING,
        },
      });

      const hoyoClient = getHoYoClient();

      // 1. Get ZZZ index data
      const indexData = await hoyoClient.getZZZIndex();
      const _shiyuData = await hoyoClient.getZZZShiyuDefence();

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
      const { estimatedHours } = hoyoClient.estimatePlaytime(indexData);
      const now = new Date();
      const sessionStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last week

      await prisma.gameSession.create({
        data: {
          gameId: game.id,
          platform: GamePlatform.HOYOVERSE,
          startTime: sessionStart,
          endTime: now,
          duration: Math.round((estimatedHours * 60) / indexData.stats.active_days), // Average per session
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
      await prisma.gamingSyncLog.create({
        data: {
          platform: GamePlatform.HOYOVERSE,
          status: SyncJobStatus.SUCCESS,
          message: `Synced ZZZ data: ${indexData.stats.avatar_num} characters, ${indexData.stats.active_days} login days`,
          duration,
        },
      });

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

      await prisma.gamingSyncLog.create({
        data: {
          platform: GamePlatform.HOYOVERSE,
          status: SyncJobStatus.FAILED,
          message: errorMessage,
          errorStack: error instanceof Error ? error.stack : undefined,
          duration,
        },
      });

      return {
        success: false,
        platform: GamePlatform.HOYOVERSE,
        message: errorMessage,
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
