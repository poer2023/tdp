/**
 * Steam Game History Sync
 * Fetches user's recently played games from Steam API
 */

export interface SteamConfig {
  apiKey: string;
  steamId: string;
}

export interface SteamGame {
  appid: number;
  name: string;
  playtime_2weeks?: number; // Minutes played in last 2 weeks
  playtime_forever: number; // Total minutes played
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
  img_icon_url: string; // Icon hash
  img_logo_url: string; // Logo hash
  rtime_last_played: number; // Unix timestamp of last play
}

interface SteamApiResponse {
  response: {
    total_count: number;
    games: SteamGame[];
  };
}

/**
 * Fetch Steam recently played games (last 2 weeks)
 * @param config User's Steam API configuration
 * @param count Maximum number of games to fetch (default: 20)
 */
export async function fetchSteamRecentlyPlayed(
  config: SteamConfig,
  count: number = 20
): Promise<SteamGame[]> {
  try {
    const url = "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/";
    const params = new URLSearchParams({
      key: config.apiKey,
      steamid: config.steamId,
      count: count.toString(),
    });

    const response = await fetch(`${url}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status} ${response.statusText}`);
    }

    const data: SteamApiResponse = await response.json();

    if (!data.response?.games) {
      return [];
    }

    return data.response.games;
  } catch (error) {
    console.error("[Steam] Failed to fetch recently played games:", error);
    throw error;
  }
}

/**
 * Normalize Steam game items to our internal MediaWatch format
 */
export function normalizeSteamGame(game: SteamGame) {
  // Calculate activity percentage (playtime in last 2 weeks / total playtime)
  const activityPercent =
    game.playtime_forever > 0 && game.playtime_2weeks
      ? Math.min(Math.round((game.playtime_2weeks / game.playtime_forever) * 100), 100)
      : 0;

  // Build image URLs
  const iconUrl = game.img_icon_url
    ? `https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
    : null;

  // Handle rtime_last_played: if 0 or invalid, use current time as fallback
  const lastPlayedTimestamp =
    game.rtime_last_played > 0 ? game.rtime_last_played * 1000 : Date.now();

  return {
    platform: "STEAM" as const,
    externalId: game.appid.toString(),
    type: "game" as const,
    title: game.name,
    cover: iconUrl,
    url: `https://store.steampowered.com/app/${game.appid}`,
    watchedAt: new Date(lastPlayedTimestamp),
    progress: activityPercent,
    duration: Math.round(game.playtime_forever), // Total playtime in minutes
    metadata: {
      playtime_2weeks: game.playtime_2weeks || 0,
      playtime_forever: game.playtime_forever,
      playtime_windows: game.playtime_windows_forever || 0,
      playtime_mac: game.playtime_mac_forever || 0,
      playtime_linux: game.playtime_linux_forever || 0,
      appid: game.appid,
    },
  };
}
