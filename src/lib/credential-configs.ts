/**
 * Platform-specific credential configurations
 * Defines the required fields and instructions for each platform
 */

import { CredentialPlatform, CredentialType } from "@prisma/client";

/**
 * Helper function to parse cookie string into individual fields
 * Example: "SESSDATA=xxx; bili_jct=yyy" → { SESSDATA: "xxx", bili_jct: "yyy" }
 */
export function parseCookieString(
  cookieString: string,
  fieldNames: string[]
): Record<string, string> {
  const result: Record<string, string> = {};

  // Handle empty cookie string
  if (!cookieString) {
    return result;
  }

  // Split by semicolon and parse each key=value pair
  const pairs = cookieString.split(";").map((s) => s.trim());

  for (const pair of pairs) {
    const [key, ...valueParts] = pair.split("=");
    const value = valueParts.join("="); // Handle values with '=' in them

    if (key && value && fieldNames.includes(key)) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Helper function to assemble cookie fields into cookie string
 * Example: { SESSDATA: "xxx", bili_jct: "yyy" } → "SESSDATA=xxx; bili_jct=yyy"
 */
export function assembleCookieString(fields: Record<string, string>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(fields)) {
    if (value && value.trim()) {
      // Only include non-empty values
      parts.push(`${key}=${value}`);
    }
  }

  return parts.join("; ");
}

export interface CredentialField {
  name: string;
  label: {
    en: string;
    zh: string;
  };
  type: "text" | "textarea" | "password";
  placeholder?: {
    en: string;
    zh: string;
  };
  required: boolean;
  validate?: (value: string) => boolean;
  helperText?: {
    en: string;
    zh: string;
  };
}

export interface PlatformConfig {
  type: CredentialType;
  fields: CredentialField[];
  instructions: {
    en: string[];
    zh: string[];
  };
  exampleImage?: string; // Optional screenshot URL for instructions
}

export const PLATFORM_CONFIGS: Record<CredentialPlatform, PlatformConfig> = {
  [CredentialPlatform.STEAM]: {
    type: CredentialType.API_KEY,
    fields: [
      {
        name: "apiKey",
        label: {
          en: "Steam Web API Key",
          zh: "Steam Web API 密钥",
        },
        type: "password",
        placeholder: {
          en: "Enter your Steam Web API Key",
          zh: "输入你的 Steam Web API 密钥",
        },
        required: true,
        validate: (value) => value.length >= 20,
        helperText: {
          en: "A 32-character hexadecimal key",
          zh: "32 位十六进制密钥",
        },
      },
      {
        name: "steamUserId",
        label: {
          en: "Steam User ID (64-bit)",
          zh: "Steam 用户 ID（64位）",
        },
        type: "text",
        placeholder: {
          en: "76561198000000000",
          zh: "76561198000000000",
        },
        required: true,
        validate: (value) => /^765\d{14}$/.test(value),
        helperText: {
          en: "Your 17-digit Steam ID starting with 765",
          zh: "你的 17 位 Steam ID，以 765 开头",
        },
      },
    ],
    instructions: {
      en: [
        "Visit https://steamcommunity.com/dev/apikey",
        "Log in with your Steam account",
        "Enter a domain name (can be any, e.g., localhost)",
        "Click 'Register' to generate your API key",
        "Copy the generated API key",
        "To find your Steam ID, visit your Steam profile and copy the number from the URL",
      ],
      zh: [
        "访问 https://steamcommunity.com/dev/apikey",
        "使用 Steam 账号登录",
        "输入域名（可以是任意域名，例如 localhost）",
        "点击【注册】生成 API 密钥",
        "复制生成的 API 密钥",
        "要查找 Steam ID，访问你的 Steam 个人资料页面，从 URL 中复制数字",
      ],
    },
  },

  [CredentialPlatform.GITHUB]: {
    type: CredentialType.PERSONAL_ACCESS_TOKEN,
    fields: [
      {
        name: "token",
        label: {
          en: "Personal Access Token",
          zh: "个人访问令牌",
        },
        type: "password",
        placeholder: {
          en: "ghp_xxxxxxxxxxxxxxxxxxxx",
          zh: "ghp_xxxxxxxxxxxxxxxxxxxx",
        },
        required: true,
        validate: (value) => value.startsWith("ghp_") || value.startsWith("github_pat_"),
        helperText: {
          en: "Should start with 'ghp_' or 'github_pat_'",
          zh: "应以 'ghp_' 或 'github_pat_' 开头",
        },
      },
    ],
    instructions: {
      en: [
        "Go to GitHub Settings: https://github.com/settings/tokens",
        "Click 'Developer settings' in the left sidebar",
        "Click 'Personal access tokens' → 'Tokens (classic)'",
        "Click 'Generate new token' → 'Generate new token (classic)'",
        "Enter a note to describe the token",
        "Select expiration (recommended: 90 days or custom)",
        "Select scopes: check 'repo' for full repository access",
        "Click 'Generate token' at the bottom",
        "Copy the token immediately (you won't be able to see it again)",
      ],
      zh: [
        "访问 GitHub 设置：https://github.com/settings/tokens",
        "点击左侧边栏的【开发者设置】（Developer settings）",
        "点击【个人访问令牌】（Personal access tokens）→【令牌（经典版）】（Tokens classic）",
        "点击【生成新令牌】（Generate new token）→【生成新令牌（经典版）】",
        "输入备注以描述该令牌",
        "选择过期时间（建议：90 天或自定义）",
        "选择权限范围：勾选 'repo' 以获得完整的仓库访问权限",
        "点击底部的【生成令牌】（Generate token）",
        "立即复制令牌（之后将无法再次查看）",
      ],
    },
  },

  [CredentialPlatform.BILIBILI]: {
    type: CredentialType.COOKIE,
    fields: [
      {
        name: "SESSDATA",
        label: {
          en: "SESSDATA",
          zh: "SESSDATA",
        },
        type: "password",
        placeholder: {
          en: "Enter SESSDATA cookie value",
          zh: "输入 SESSDATA cookie 值",
        },
        required: true,
        validate: (value) => value.length > 0,
        helperText: {
          en: "Required cookie field for Bilibili authentication",
          zh: "B站认证必需的 cookie 字段",
        },
      },
      {
        name: "bili_jct",
        label: {
          en: "bili_jct",
          zh: "bili_jct",
        },
        type: "password",
        placeholder: {
          en: "Enter bili_jct cookie value (optional)",
          zh: "输入 bili_jct cookie 值（可选）",
        },
        required: false,
        helperText: {
          en: "Optional but recommended for full functionality",
          zh: "可选但推荐填写以获得完整功能",
        },
      },
      {
        name: "DedeUserID",
        label: {
          en: "DedeUserID",
          zh: "DedeUserID",
        },
        type: "text",
        placeholder: {
          en: "Enter DedeUserID cookie value (optional)",
          zh: "输入 DedeUserID cookie 值（可选）",
        },
        required: false,
        helperText: {
          en: "Optional user identifier cookie",
          zh: "可选的用户标识 cookie",
        },
      },
    ],
    instructions: {
      en: [
        "Open https://www.bilibili.com in your browser and log in",
        "Open browser Developer Tools (F12 or Right-click → Inspect)",
        "Go to the 'Application' tab (Chrome) or 'Storage' tab (Firefox)",
        "In the left sidebar, expand 'Cookies' and select 'https://www.bilibili.com'",
        "Find and copy the cookie values individually:",
        "  - SESSDATA (required): Copy the 'Value' column",
        "  - bili_jct (optional but recommended): Copy the 'Value' column",
        "  - DedeUserID (optional): Copy the 'Value' column",
        "Paste each value into the corresponding field below",
      ],
      zh: [
        "在浏览器中打开 https://www.bilibili.com 并登录",
        "打开浏览器开发者工具（F12 或右键→检查）",
        "转到【应用程序】（Application）标签（Chrome）或【存储】（Storage）标签（Firefox）",
        "在左侧边栏中展开【Cookies】并选择【https://www.bilibili.com】",
        "分别查找并复制以下 cookie 值：",
        "  - SESSDATA（必需）：复制【值】列的内容",
        "  - bili_jct（可选但推荐）：复制【值】列的内容",
        "  - DedeUserID（可选）：复制【值】列的内容",
        "将每个值粘贴到下方对应的字段中",
      ],
    },
  },

  [CredentialPlatform.DOUBAN]: {
    type: CredentialType.COOKIE,
    fields: [
      {
        name: "bid",
        label: {
          en: "bid",
          zh: "bid",
        },
        type: "password",
        placeholder: {
          en: "Enter bid cookie value (optional)",
          zh: "输入 bid cookie 值（可选）",
        },
        required: false,
        helperText: {
          en: "Browser identifier cookie (optional)",
          zh: "浏览器标识符 cookie（可选）",
        },
      },
      {
        name: "dbcl2",
        label: {
          en: "dbcl2",
          zh: "dbcl2",
        },
        type: "password",
        placeholder: {
          en: "Enter dbcl2 cookie value",
          zh: "输入 dbcl2 cookie 值",
        },
        required: true,
        validate: (value) => value.length > 0,
        helperText: {
          en: "Login token cookie (required)",
          zh: "登录令牌 cookie（必需）",
        },
      },
      {
        name: "ck",
        label: {
          en: "ck",
          zh: "ck",
        },
        type: "password",
        placeholder: {
          en: "Enter ck cookie value (optional)",
          zh: "输入 ck cookie 值（可选）",
        },
        required: false,
        helperText: {
          en: "Optional cookie for additional functionality",
          zh: "可选的附加功能 cookie",
        },
      },
    ],
    instructions: {
      en: [
        "Open https://www.douban.com in your browser and log in",
        "Open browser Developer Tools (F12 or Right-click → Inspect)",
        "Go to the 'Application' tab (Chrome) or 'Storage' tab (Firefox)",
        "In the left sidebar, expand 'Cookies' and select 'https://www.douban.com'",
        "Find and copy the cookie values individually:",
        "  - dbcl2 (required): Copy the 'Value' column - this is the main authentication token",
        "  - bid (optional): Copy the 'Value' column - browser identifier",
        "  - ck (optional): Copy the 'Value' column - additional verification key",
        "Paste each value into the corresponding field below",
        "Note: Only dbcl2 is required for basic functionality",
      ],
      zh: [
        "在浏览器中打开 https://www.douban.com 并登录",
        "打开浏览器开发者工具（F12 或右键→检查）",
        "转到【应用程序】（Application）标签（Chrome）或【存储】（Storage）标签（Firefox）",
        "在左侧边栏中展开【Cookies】并选择【https://www.douban.com】",
        "分别查找并复制以下 cookie 值：",
        "  - dbcl2（必需）：复制【值】列的内容 - 这是主要的认证令牌",
        "  - bid（可选）：复制【值】列的内容 - 浏览器标识符",
        "  - ck（可选）：复制【值】列的内容 - 附加验证密钥",
        "将每个值粘贴到下方对应的字段中",
        "注意：只有 dbcl2 是必需的，其他字段可选",
      ],
    },
  },

  [CredentialPlatform.HOYOVERSE]: {
    type: CredentialType.COOKIE,
    fields: [
      {
        name: "ltoken",
        label: {
          en: "ltoken",
          zh: "ltoken",
        },
        type: "password",
        placeholder: {
          en: "Enter ltoken cookie value",
          zh: "输入 ltoken cookie 值",
        },
        required: true,
        validate: (value) => value.length > 0,
        helperText: {
          en: "Login token (required)",
          zh: "登录令牌（必需）",
        },
      },
      {
        name: "ltuid",
        label: {
          en: "ltuid",
          zh: "ltuid",
        },
        type: "text",
        placeholder: {
          en: "Enter ltuid cookie value",
          zh: "输入 ltuid cookie 值",
        },
        required: true,
        validate: (value) => value.length > 0,
        helperText: {
          en: "Login user ID (required)",
          zh: "登录用户 ID（必需）",
        },
      },
    ],
    instructions: {
      en: [
        "Open https://www.miyoushe.com (miHoYo Community) in your browser and log in",
        "Open browser Developer Tools (F12 or Right-click → Inspect)",
        "Go to the 'Application' tab (Chrome) or 'Storage' tab (Firefox)",
        "In the left sidebar, expand 'Cookies' and select 'https://www.miyoushe.com'",
        "Find and copy both required cookie values:",
        "  - ltoken (required): Copy the 'Value' column",
        "  - ltuid (required): Copy the 'Value' column",
        "Paste each value into the corresponding field below",
        "Note: These cookies are used for Genshin Impact, Honkai, and other HoYoverse games",
      ],
      zh: [
        "在浏览器中打开 https://www.miyoushe.com（米游社）并登录",
        "打开浏览器开发者工具（F12 或右键→检查）",
        "转到【应用程序】（Application）标签（Chrome）或【存储】（Storage）标签（Firefox）",
        "在左侧边栏中展开【Cookies】并选择【https://www.miyoushe.com】",
        "查找并复制以下两个必需的 cookie 值：",
        "  - ltoken（必需）：复制【值】列的内容",
        "  - ltuid（必需）：复制【值】列的内容",
        "将每个值粘贴到下方对应的字段中",
        "注意：这些 cookies 用于原神、崩坏等米哈游游戏",
      ],
    },
  },

  [CredentialPlatform.JELLYFIN]: {
    type: CredentialType.API_KEY,
    fields: [
      {
        name: "apiToken",
        label: {
          en: "API Token",
          zh: "API 令牌",
        },
        type: "password",
        placeholder: {
          en: "Enter your Jellyfin API token",
          zh: "输入你的 Jellyfin API 令牌",
        },
        required: true,
        validate: (value) => value.length >= 20,
        helperText: {
          en: "A unique token generated by Jellyfin",
          zh: "由 Jellyfin 生成的唯一令牌",
        },
      },
      {
        name: "serverUrl",
        label: {
          en: "Server URL",
          zh: "服务器 URL",
        },
        type: "text",
        placeholder: {
          en: "https://jellyfin.example.com or http://localhost:8096",
          zh: "https://jellyfin.example.com 或 http://localhost:8096",
        },
        required: true,
        validate: (value) => value.startsWith("http://") || value.startsWith("https://"),
        helperText: {
          en: "The full URL of your Jellyfin server",
          zh: "你的 Jellyfin 服务器的完整 URL",
        },
      },
    ],
    instructions: {
      en: [
        "Open your Jellyfin server in a browser and log in",
        "Click on your profile icon in the top right",
        "Select 'Dashboard' from the dropdown menu",
        "In the left sidebar, go to 'Advanced' section",
        "Click 'API Keys'",
        "Click the '+' button to create a new API key",
        "Enter an app name (e.g., 'TDP Integration')",
        "Copy the generated API key immediately",
        "For Server URL, use the URL you access Jellyfin with (e.g., http://localhost:8096)",
      ],
      zh: [
        "在浏览器中打开你的 Jellyfin 服务器并登录",
        "点击右上角的个人资料图标",
        "从下拉菜单中选择【控制台】（Dashboard）",
        "在左侧边栏中，转到【高级】（Advanced）部分",
        "点击【API 密钥】（API Keys）",
        "点击【+】按钮创建新的 API 密钥",
        "输入应用名称（例如【TDP 集成】）",
        "立即复制生成的 API 密钥",
        "服务器 URL 使用你访问 Jellyfin 的地址（例如 http://localhost:8096）",
      ],
    },
  },
};

/**
 * Helper function to assemble credential value and metadata from form fields
 */
export function assembleCredentialData(
  platform: CredentialPlatform,
  formValues: Record<string, string>
): {
  type: CredentialType;
  value: string;
  metadata?: Record<string, unknown>;
} {
  const config = PLATFORM_CONFIGS[platform];

  switch (platform) {
    case CredentialPlatform.STEAM:
      return {
        type: config.type,
        value: formValues.apiKey || "",
        metadata: {
          steamUserId: formValues.steamUserId || "",
        },
      };

    case CredentialPlatform.GITHUB:
      return {
        type: config.type,
        value: formValues.token || "",
      };

    case CredentialPlatform.BILIBILI:
      // Assemble multiple cookie fields into cookie string
      return {
        type: config.type,
        value: assembleCookieString({
          SESSDATA: formValues.SESSDATA || "",
          bili_jct: formValues.bili_jct || "",
          DedeUserID: formValues.DedeUserID || "",
        }),
      };

    case CredentialPlatform.DOUBAN:
      // Assemble multiple cookie fields into cookie string
      return {
        type: config.type,
        value: assembleCookieString({
          bid: formValues.bid || "",
          dbcl2: formValues.dbcl2 || "",
          ck: formValues.ck || "",
        }),
      };

    case CredentialPlatform.HOYOVERSE:
      // Assemble multiple cookie fields into cookie string
      return {
        type: config.type,
        value: assembleCookieString({
          ltoken: formValues.ltoken || "",
          ltuid: formValues.ltuid || "",
        }),
      };

    case CredentialPlatform.JELLYFIN:
      return {
        type: config.type,
        value: formValues.apiToken || "",
        metadata: {
          jellyfinUrl: formValues.serverUrl || "",
        },
      };

    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

/**
 * Helper function to extract form values from existing credential
 */
export function extractCredentialFormValues(
  platform: CredentialPlatform,
  credential: {
    value: string;
    metadata?: unknown;
  }
): Record<string, string> {
  switch (platform) {
    case CredentialPlatform.STEAM:
      return {
        apiKey: credential.value,
        steamUserId: (credential.metadata as { steamUserId?: string })?.steamUserId || "",
      };

    case CredentialPlatform.GITHUB:
      return {
        token: credential.value,
      };

    case CredentialPlatform.BILIBILI:
      return parseCookieString(credential.value, ["SESSDATA", "bili_jct", "DedeUserID"]);

    case CredentialPlatform.DOUBAN:
      return parseCookieString(credential.value, ["bid", "dbcl2", "ck"]);

    case CredentialPlatform.HOYOVERSE:
      return parseCookieString(credential.value, ["ltoken", "ltuid"]);

    case CredentialPlatform.JELLYFIN:
      return {
        apiToken: credential.value,
        serverUrl: (credential.metadata as { jellyfinUrl?: string })?.jellyfinUrl || "",
      };

    default:
      return {};
  }
}
