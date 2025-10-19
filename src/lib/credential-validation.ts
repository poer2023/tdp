/**
 * Credential Validation Service
 * Validates credentials against external platforms
 */

import { CredentialPlatform, CredentialType } from "@prisma/client";

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Validate Steam API Key
 */
async function validateSteamCredential(value: string): Promise<ValidationResult> {
  try {
    // Steam API Key format: usually 32 characters hex
    if (!value || value.length < 20) {
      return {
        isValid: false,
        error: "Invalid Steam API Key format",
      };
    }

    // Test API call to validate key
    const steamId = process.env.STEAM_USER_ID || "76561198000000000";
    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${value}&steamids=${steamId}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      return {
        isValid: false,
        error: `Steam API returned ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    if (data.response && data.response.players) {
      return {
        isValid: true,
        message: "Steam API Key is valid",
        metadata: {
          playersReturned: data.response.players.length,
        },
      };
    }

    return {
      isValid: false,
      error: "Invalid response from Steam API",
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error validating Steam credential",
    };
  }
}

/**
 * Validate Bilibili Cookie
 */
async function validateBilibiliCredential(value: string): Promise<ValidationResult> {
  try {
    // Extract SESSDATA from cookie string
    const sessdataMatch = value.match(/SESSDATA=([^;]+)/);
    if (!sessdataMatch) {
      return {
        isValid: false,
        error: "SESSDATA not found in cookie",
      };
    }

    // Test API call to validate cookie
    const response = await fetch("https://api.bilibili.com/x/space/myinfo", {
      headers: {
        Cookie: value,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        isValid: false,
        error: `Bilibili API returned ${response.status}`,
      };
    }

    const data = await response.json();
    if (data.code === 0 && data.data) {
      return {
        isValid: true,
        message: "Bilibili Cookie is valid",
        metadata: {
          mid: data.data.mid,
          name: data.data.name,
          level: data.data.level,
        },
      };
    }

    return {
      isValid: false,
      error: data.message || "Invalid Bilibili cookie",
    };
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof Error ? error.message : "Unknown error validating Bilibili credential",
    };
  }
}

/**
 * Validate Douban Cookie
 */
async function validateDoubanCredential(value: string): Promise<ValidationResult> {
  try {
    // Test API call to validate cookie
    const response = await fetch("https://www.douban.com/mine/", {
      headers: {
        Cookie: value,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      signal: AbortSignal.timeout(5000),
      redirect: "manual", // Don't follow redirects (302 = not logged in)
    });

    // If we get 200, cookie is valid
    if (response.status === 200) {
      return {
        isValid: true,
        message: "Douban Cookie is valid",
      };
    }

    // If we get 302, cookie is invalid or expired
    if (response.status === 302) {
      return {
        isValid: false,
        error: "Douban cookie is invalid or expired (redirected to login)",
      };
    }

    return {
      isValid: false,
      error: `Douban returned unexpected status: ${response.status}`,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error validating Douban credential",
    };
  }
}

/**
 * Validate HoYoverse Cookie
 */
async function validateHoyoverseCredential(value: string): Promise<ValidationResult> {
  try {
    // Extract ltoken and ltuid from cookie
    const ltokenMatch = value.match(/ltoken=([^;]+)/);
    const ltuidMatch = value.match(/ltuid=([^;]+)/);

    if (!ltokenMatch || !ltuidMatch) {
      return {
        isValid: false,
        error: "ltoken or ltuid not found in cookie",
      };
    }

    // Test API call (get game list)
    const response = await fetch(
      "https://api-takumi-record.mihoyo.com/game_record/card/wapi/getGameRecordCard",
      {
        headers: {
          Cookie: value,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      return {
        isValid: false,
        error: `HoYoverse API returned ${response.status}`,
      };
    }

    const data = await response.json();
    if (data.retcode === 0) {
      return {
        isValid: true,
        message: "HoYoverse Cookie is valid",
        metadata: {
          games: data.data?.list?.length || 0,
        },
      };
    }

    return {
      isValid: false,
      error: data.message || "Invalid HoYoverse cookie",
    };
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof Error ? error.message : "Unknown error validating HoYoverse credential",
    };
  }
}

/**
 * Validate Jellyfin API Token
 */
async function validateJellyfinCredential(value: string): Promise<ValidationResult> {
  try {
    const jellyfinUrl = process.env.JELLYFIN_URL;
    if (!jellyfinUrl) {
      return {
        isValid: false,
        error: "JELLYFIN_URL environment variable not configured",
      };
    }

    // Test API call to get system info
    const response = await fetch(`${jellyfinUrl}/System/Info`, {
      headers: {
        "X-Emby-Token": value,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        isValid: false,
        error: `Jellyfin API returned ${response.status}`,
      };
    }

    const data = await response.json();
    if (data.ServerName) {
      return {
        isValid: true,
        message: "Jellyfin API Token is valid",
        metadata: {
          serverName: data.ServerName,
          version: data.Version,
        },
      };
    }

    return {
      isValid: false,
      error: "Invalid Jellyfin API response",
    };
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof Error ? error.message : "Unknown error validating Jellyfin credential",
    };
  }
}

/**
 * Main validation function
 */
export async function validateCredential(
  platform: CredentialPlatform,
  type: CredentialType,
  value: string
): Promise<ValidationResult> {
  switch (platform) {
    case "STEAM":
      return validateSteamCredential(value);

    case "BILIBILI":
      return validateBilibiliCredential(value);

    case "DOUBAN":
      return validateDoubanCredential(value);

    case "HOYOVERSE":
      return validateHoyoverseCredential(value);

    case "JELLYFIN":
      return validateJellyfinCredential(value);

    default:
      return {
        isValid: false,
        error: `Platform ${platform} validation not implemented`,
      };
  }
}
