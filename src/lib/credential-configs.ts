/**
 * Platform-specific credential configurations
 * Defines the required fields and instructions for each platform
 */

import { CredentialPlatform, CredentialType } from "@prisma/client";

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
        name: "cookie",
        label: {
          en: "Cookie String",
          zh: "Cookie 字符串",
        },
        type: "textarea",
        placeholder: {
          en: "SESSDATA=xxx; bili_jct=xxx; DedeUserID=xxx; ...",
          zh: "SESSDATA=xxx; bili_jct=xxx; DedeUserID=xxx; ...",
        },
        required: true,
        validate: (value) => value.includes("SESSDATA="),
        helperText: {
          en: "Must contain 'SESSDATA' field",
          zh: "必须包含 'SESSDATA' 字段",
        },
      },
    ],
    instructions: {
      en: [
        "Open https://www.bilibili.com in your browser and log in",
        "Open browser Developer Tools (F12 or Right-click → Inspect)",
        "Go to the 'Application' tab (Chrome) or 'Storage' tab (Firefox)",
        "In the left sidebar, expand 'Cookies' and select 'https://www.bilibili.com'",
        "Find and copy the following cookie values:",
        "  - SESSDATA (required)",
        "  - bili_jct (optional but recommended)",
        "  - DedeUserID (optional)",
        "Format as: SESSDATA=xxx; bili_jct=xxx; DedeUserID=xxx",
        "Or copy all cookies from the 'Network' tab request headers",
      ],
      zh: [
        "在浏览器中打开 https://www.bilibili.com 并登录",
        "打开浏览器开发者工具（F12 或右键→检查）",
        "转到【应用程序】（Application）标签（Chrome）或【存储】（Storage）标签（Firefox）",
        "在左侧边栏中展开【Cookies】并选择【https://www.bilibili.com】",
        "查找并复制以下 cookie 值：",
        "  - SESSDATA（必需）",
        "  - bili_jct（可选但推荐）",
        "  - DedeUserID（可选）",
        "格式为：SESSDATA=xxx; bili_jct=xxx; DedeUserID=xxx",
        "或从【网络】（Network）标签的请求头中复制所有 cookies",
      ],
    },
  },

  [CredentialPlatform.DOUBAN]: {
    type: CredentialType.COOKIE,
    fields: [
      {
        name: "cookie",
        label: {
          en: "Cookie String",
          zh: "Cookie 字符串",
        },
        type: "textarea",
        placeholder: {
          en: "bid=xxx; dbcl2=xxx; ck=xxx; ...",
          zh: "bid=xxx; dbcl2=xxx; ck=xxx; ...",
        },
        required: true,
        validate: (value) => value.includes("bid=") || value.includes("dbcl2="),
        helperText: {
          en: "Must contain 'bid' or 'dbcl2' field",
          zh: "必须包含 'bid' 或 'dbcl2' 字段",
        },
      },
    ],
    instructions: {
      en: [
        "Open https://www.douban.com in your browser and log in",
        "Open browser Developer Tools (F12 or Right-click → Inspect)",
        "Go to the 'Application' tab (Chrome) or 'Storage' tab (Firefox)",
        "In the left sidebar, expand 'Cookies' and select 'https://www.douban.com'",
        "Find and copy the following cookie values:",
        "  - bid (browser identifier)",
        "  - dbcl2 (login token, required)",
        "  - ck (optional)",
        "Format as: bid=xxx; dbcl2=xxx; ck=xxx",
        "Or copy all cookies from the 'Network' tab request headers",
      ],
      zh: [
        "在浏览器中打开 https://www.douban.com 并登录",
        "打开浏览器开发者工具（F12 或右键→检查）",
        "转到【应用程序】（Application）标签（Chrome）或【存储】（Storage）标签（Firefox）",
        "在左侧边栏中展开【Cookies】并选择【https://www.douban.com】",
        "查找并复制以下 cookie 值：",
        "  - bid（浏览器标识符）",
        "  - dbcl2（登录令牌，必需）",
        "  - ck（可选）",
        "格式为：bid=xxx; dbcl2=xxx; ck=xxx",
        "或从【网络】（Network）标签的请求头中复制所有 cookies",
      ],
    },
  },

  [CredentialPlatform.HOYOVERSE]: {
    type: CredentialType.COOKIE,
    fields: [
      {
        name: "cookie",
        label: {
          en: "Cookie String",
          zh: "Cookie 字符串",
        },
        type: "textarea",
        placeholder: {
          en: "ltoken=xxx; ltuid=xxx; ...",
          zh: "ltoken=xxx; ltuid=xxx; ...",
        },
        required: true,
        validate: (value) => value.includes("ltoken=") && value.includes("ltuid="),
        helperText: {
          en: "Must contain both 'ltoken' and 'ltuid' fields",
          zh: "必须同时包含 'ltoken' 和 'ltuid' 字段",
        },
      },
    ],
    instructions: {
      en: [
        "Open https://www.miyoushe.com (miHoYo Community) in your browser and log in",
        "Open browser Developer Tools (F12 or Right-click → Inspect)",
        "Go to the 'Application' tab (Chrome) or 'Storage' tab (Firefox)",
        "In the left sidebar, expand 'Cookies' and select 'https://www.miyoushe.com'",
        "Find and copy the following cookie values (both required):",
        "  - ltoken (login token)",
        "  - ltuid (login user ID)",
        "Format as: ltoken=xxx; ltuid=xxx",
        "Note: These cookies are used for Genshin Impact, Honkai, and other HoYoverse games",
      ],
      zh: [
        "在浏览器中打开 https://www.miyoushe.com（米游社）并登录",
        "打开浏览器开发者工具（F12 或右键→检查）",
        "转到【应用程序】（Application）标签（Chrome）或【存储】（Storage）标签（Firefox）",
        "在左侧边栏中展开【Cookies】并选择【https://www.miyoushe.com】",
        "查找并复制以下 cookie 值（两个都必需）：",
        "  - ltoken（登录令牌）",
        "  - ltuid（登录用户 ID）",
        "格式为：ltoken=xxx; ltuid=xxx",
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
    case CredentialPlatform.DOUBAN:
    case CredentialPlatform.HOYOVERSE:
      return {
        type: config.type,
        value: formValues.cookie || "",
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
    metadata?: Record<string, unknown> | null | { [key: string]: unknown };
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
    case CredentialPlatform.DOUBAN:
    case CredentialPlatform.HOYOVERSE:
      return {
        cookie: credential.value,
      };

    case CredentialPlatform.JELLYFIN:
      return {
        apiToken: credential.value,
        serverUrl: (credential.metadata as { jellyfinUrl?: string })?.jellyfinUrl || "",
      };

    default:
      return {};
  }
}
