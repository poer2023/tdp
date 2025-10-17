/**
 * Steam Web API Client
 * Documentation: https://steamcommunity.com/dev
 * https://developer.valvesoftware.com/wiki/Steam_Web_API
 */

interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number; // minutes
  playtime_2weeks?: number; // minutes
  img_icon_url?: string;
  img_logo_url?: string;
}

interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
}

interface SteamRecentlyPlayedResponse {
  response: {
    total_count: number;
    games?: SteamGame[];
  };
}

interface SteamOwnedGamesResponse {
  response: {
    game_count: number;
    games?: SteamGame[];
  };
}

interface SteamPlayerSummaryResponse {
  response: {
    players: SteamPlayerSummary[];
  };
}

interface SteamAchievement {
  apiname: string;
  achieved: number; // 1 or 0
  unlocktime: number; // Unix timestamp
  name?: string;
  description?: string;
}

interface SteamAchievementsResponse {
  playerstats: {
    steamID: string;
    gameName: string;
    achievements?: SteamAchievement[];
    success: boolean;
  };
}

interface SteamAppDetailsResponse {
  [appid: string]: {
    success: boolean;
    data?: {
      name: string;
      type: string;
      header_image: string;
      short_description?: string;
    };
  };
}

export class SteamAPIClient {
  private apiKey: string;
  private baseURL = "https://api.steampowered.com";
  private storeURL = "https://store.steampowered.com/api";

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Steam API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Get owned games for a Steam user
   */
  async getOwnedGames(steamId: string): Promise<SteamGame[]> {
    const url = `${this.baseURL}/IPlayerService/GetOwnedGames/v1/`;
    const params = new URLSearchParams({
      key: this.apiKey,
      steamid: steamId,
      include_appinfo: "1",
      include_played_free_games: "1",
    });

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Steam API error: ${response.statusText}`);
    }

    const data: SteamOwnedGamesResponse = await response.json();
    return data.response.games || [];
  }

  /**
   * Get recently played games (last 2 weeks)
   */
  async getRecentlyPlayedGames(steamId: string): Promise<SteamGame[]> {
    const url = `${this.baseURL}/IPlayerService/GetRecentlyPlayedGames/v1/`;
    const params = new URLSearchParams({
      key: this.apiKey,
      steamid: steamId,
      count: "10",
    });

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Steam API error: ${response.statusText}`);
    }

    const data: SteamRecentlyPlayedResponse = await response.json();
    return data.response.games || [];
  }

  /**
   * Get player summary (profile info)
   */
  async getPlayerSummary(steamId: string): Promise<SteamPlayerSummary | null> {
    const url = `${this.baseURL}/ISteamUser/GetPlayerSummaries/v2/`;
    const params = new URLSearchParams({
      key: this.apiKey,
      steamids: steamId,
    });

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Steam API error: ${response.statusText}`);
    }

    const data: SteamPlayerSummaryResponse = await response.json();
    return data.response.players[0] || null;
  }

  /**
   * Get player achievements for a specific game
   */
  async getPlayerAchievements(steamId: string, appId: number): Promise<SteamAchievement[]> {
    const url = `${this.baseURL}/ISteamUserStats/GetPlayerAchievements/v1/`;
    const params = new URLSearchParams({
      key: this.apiKey,
      steamid: steamId,
      appid: appId.toString(),
    });

    try {
      const response = await fetch(`${url}?${params.toString()}`);
      if (!response.ok) {
        // Some games don't have achievements or stats are private
        return [];
      }

      const data: SteamAchievementsResponse = await response.json();
      if (!data.playerstats.success) {
        return [];
      }

      return data.playerstats.achievements || [];
    } catch {
      // Fail gracefully for games without achievements
      return [];
    }
  }

  /**
   * Get game details (name, cover, etc)
   */
  async getGameDetails(appId: number): Promise<{
    name: string;
    cover: string;
    description?: string;
  } | null> {
    const url = `${this.storeURL}/appdetails`;
    const params = new URLSearchParams({
      appids: appId.toString(),
    });

    try {
      const response = await fetch(`${url}?${params.toString()}`);
      if (!response.ok) {
        return null;
      }

      const data: SteamAppDetailsResponse = await response.json();
      const appData = data[appId];

      if (!appData || !appData.success || !appData.data) {
        return null;
      }

      return {
        name: appData.data.name,
        cover: appData.data.header_image,
        description: appData.data.short_description,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get game icon URL
   */
  getGameIconURL(appId: number, iconHash: string): string {
    return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`;
  }

  /**
   * Get game logo URL
   */
  getGameLogoURL(appId: number, logoHash: string): string {
    return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${logoHash}.jpg`;
  }
}

/**
 * Singleton instance
 */
let steamClient: SteamAPIClient | null = null;

export function getSteamClient(): SteamAPIClient {
  if (!steamClient) {
    const apiKey = process.env.STEAM_API_KEY;
    if (!apiKey) {
      throw new Error("STEAM_API_KEY environment variable is not set");
    }
    steamClient = new SteamAPIClient(apiKey);
  }
  return steamClient;
}
