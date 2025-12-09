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
 * Extract Douban User ID from HTML response
 */
function extractDoubanUserId(html: string): string | null {
  // Method 1: Extract from URL in HTML (e.g., href="/people/123456789/")
  const userIdPatterns = [
    /\/people\/(\d+)\//, // Standard user ID in URLs
    /data-uid="(\d+)"/, // data-uid attribute
    /user_id[=:]"?(\d+)"?/i, // user_id in various formats
  ];

  for (const pattern of userIdPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validate Douban Cookie and extract user ID
 */
async function validateDoubanCredential(value: string): Promise<ValidationResult> {
  try {
    // First, check if cookie contains required fields
    if (!value.includes("bid=") && !value.includes("dbcl2=")) {
      return {
        isValid: false,
        error: "Cookie missing required Douban authentication fields (bid or dbcl2)",
      };
    }

    const headers = {
      Cookie: value,
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://www.douban.com/",
    };

    // Try to access personal homepage which will redirect to user's profile
    const mineResponse = await fetch("https://www.douban.com/mine/", {
      headers,
      signal: AbortSignal.timeout(10000),
      redirect: "follow", // Follow redirects to get to user page
    });

    let userId: string | null = null;

    // If we get a successful response, try to extract user ID from HTML
    if (mineResponse.ok) {
      const html = await mineResponse.text();
      userId = extractDoubanUserId(html);

      // Also try to extract from final URL after redirects
      if (!userId) {
        const finalUrl = mineResponse.url;
        const urlMatch = finalUrl.match(/\/people\/(\d+)/);
        if (urlMatch && urlMatch[1]) {
          userId = urlMatch[1];
        }
      }

      if (userId) {
        return {
          isValid: true,
          message: "Douban Cookie is valid, user ID extracted successfully",
          metadata: {
            userId,
            extractionMethod: "profile_redirect",
          },
        };
      }

      // Cookie is valid but couldn't extract user ID
      return {
        isValid: true,
        message: "Douban Cookie is valid but could not auto-extract user ID",
        metadata: {
          warning: "Please manually add userId to metadata",
        },
      };
    }

    // Try alternative validation method: access user's movie collection
    const collectionUrl = "https://movie.douban.com/mine";
    const collectionResponse = await fetch(collectionUrl, {
      headers,
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });

    if (collectionResponse.ok) {
      const html = await collectionResponse.text();
      userId = extractDoubanUserId(html);

      // Try to extract from final URL
      if (!userId) {
        const finalUrl = collectionResponse.url;
        const urlMatch = finalUrl.match(/\/people\/(\d+)/);
        if (urlMatch && urlMatch[1]) {
          userId = urlMatch[1];
        }
      }

      if (userId) {
        return {
          isValid: true,
          message: "Douban Cookie is valid (verified via movie collection), user ID extracted",
          metadata: {
            userId,
            extractionMethod: "collection_redirect",
          },
        };
      }

      return {
        isValid: true,
        message: "Douban Cookie is valid (verified via movie collection)",
        metadata: {
          warning: "Could not auto-extract user ID, please add manually",
        },
      };
    }

    // Check account page as fallback
    const accountResponse = await fetch("https://www.douban.com/accounts/", {
      headers,
      signal: AbortSignal.timeout(10000),
      redirect: "manual",
    });

    // If redirected to login, cookie is invalid
    if (accountResponse.status === 302 || accountResponse.status === 301) {
      const location = accountResponse.headers.get("location") || "";
      if (location.includes("passport.douban.com") || location.includes("login")) {
        return {
          isValid: false,
          error: "Douban cookie is invalid or expired (redirected to login page)",
        };
      }
    }

    return {
      isValid: false,
      error: `Douban validation failed: could not verify cookie validity`,
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
 * Validate GitHub Personal Access Token
 */
async function validateGitHubCredential(value: string): Promise<ValidationResult> {
  try {
    // GitHub tokens should start with specific prefixes
    const validPrefixes = ["ghp_", "gho_", "ghu_", "ghs_", "ghr_"];
    const hasValidPrefix = validPrefixes.some((prefix) => value.startsWith(prefix));

    if (!hasValidPrefix && value.length < 40) {
      return {
        isValid: false,
        error: "Invalid GitHub token format (must start with ghp_, gho_, ghu_, ghs_, or ghr_)",
      };
    }

    // Test API call to get authenticated user
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${value}`,
        Accept: "application/vnd.github.v3+json",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        isValid: false,
        error: `GitHub API returned ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    if (data.login) {
      return {
        isValid: true,
        message: "GitHub Personal Access Token is valid",
        metadata: {
          username: data.login,
          name: data.name,
          publicRepos: data.public_repos,
        },
      };
    }

    return {
      isValid: false,
      error: "Invalid GitHub API response",
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error validating GitHub credential",
    };
  }
}

/**
 * Validate DeepSeek API Key
 */
async function validateDeepSeekCredential(value: string): Promise<ValidationResult> {
  try {
    // DeepSeek API keys should start with "sk-"
    if (!value || !value.startsWith("sk-")) {
      return {
        isValid: false,
        error: "Invalid DeepSeek API Key format (must start with sk-)",
      };
    }

    // Test API call with a minimal chat completion request
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${value}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 1, // Minimal tokens to save cost
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        isValid: false,
        error: `DeepSeek API returned ${response.status}: ${errorData.error?.message || response.statusText}`,
      };
    }

    const data = await response.json();
    if (data.id && data.choices) {
      return {
        isValid: true,
        message: "DeepSeek API Key is valid",
        metadata: {
          model: data.model,
          testSuccessful: true,
        },
      };
    }

    return {
      isValid: false,
      error: "Invalid DeepSeek API response",
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error validating DeepSeek credential",
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
    case CredentialPlatform.STEAM:
      return validateSteamCredential(value);

    case CredentialPlatform.BILIBILI:
      return validateBilibiliCredential(value);

    case CredentialPlatform.DOUBAN:
      return validateDoubanCredential(value);

    case CredentialPlatform.HOYOVERSE:
      return validateHoyoverseCredential(value);

    case CredentialPlatform.JELLYFIN:
      return validateJellyfinCredential(value);

    case CredentialPlatform.GITHUB:
      return validateGitHubCredential(value);

    case CredentialPlatform.DEEPSEEK:
      return validateDeepSeekCredential(value);

    default:
      return {
        isValid: false,
        error: `Platform ${platform} validation not implemented`,
      };
  }
}
