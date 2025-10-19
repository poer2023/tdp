# 外部 API 降级规范指南

## 概述

本文档定义了 TDP 项目中外部 API 调用的统一超时、重试逻辑和降级策略。所有外部依赖（Bilibili、Douban、Steam、HoYoverse）都应遵循这些规范，确保系统在外部服务不可用时能够优雅降级。

## 核心原则

1. **快速失败**：外部 API 失败不应影响核心功能
2. **优雅降级**：返回空态数据而非抛出错误
3. **用户友好**：提供清晰的错误提示和建议
4. **可观测性**：记录所有外部 API 失败日志

---

## 超时与重试配置

### 统一超时设置

```typescript
export const API_TIMEOUTS = {
  /** 快速操作：获取单个资源 */
  FAST: 5000, // 5秒

  /** 标准操作：批量查询 */
  STANDARD: 15000, // 15秒

  /** 慢速操作：大数据同步 */
  SLOW: 30000, // 30秒
} as const;
```

### 重试策略

```typescript
export const RETRY_CONFIG = {
  /** 最大重试次数 */
  MAX_RETRIES: 3,

  /** 初始重试延迟（毫秒） */
  INITIAL_DELAY: 1000,

  /** 指数退避倍数 */
  BACKOFF_MULTIPLIER: 2,

  /** 最大重试延迟（毫秒） */
  MAX_DELAY: 10000,
} as const;

/**
 * 计算重试延迟
 * 第1次重试：1s
 * 第2次重试：2s
 * 第3次重试：4s
 */
function calculateRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.INITIAL_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1);
  return Math.min(delay, RETRY_CONFIG.MAX_DELAY);
}
```

---

## 平台特定配置

### Bilibili API

**用途**：视频、番剧收藏数据同步

```typescript
export const BILIBILI_CONFIG = {
  timeout: API_TIMEOUTS.STANDARD,
  maxRetries: RETRY_CONFIG.MAX_RETRIES,

  // 空态返回值
  emptyResponse: {
    movies: [],
    series: [],
    total: 0,
    lastSyncAt: null,
  },

  // 错误提示映射
  errorMessages: {
    TIMEOUT: "Bilibili API 响应超时，请稍后重试",
    UNAUTHORIZED: "Bilibili 凭证无效，请重新授权",
    RATE_LIMITED: "Bilibili API 访问频率受限，请稍后再试",
    NETWORK_ERROR: "无法连接到 Bilibili 服务器",
    UNKNOWN: "Bilibili 数据同步失败，请检查网络连接",
  },
} as const;
```

### Douban API

**用途**：书籍、电影、音乐收藏数据同步

```typescript
export const DOUBAN_CONFIG = {
  timeout: API_TIMEOUTS.STANDARD,
  maxRetries: RETRY_CONFIG.MAX_RETRIES,

  // 空态返回值
  emptyResponse: {
    books: [],
    movies: [],
    music: [],
    total: 0,
    lastSyncAt: null,
  },

  // 错误提示映射
  errorMessages: {
    TIMEOUT: "豆瓣 API 响应超时，请稍后重试",
    UNAUTHORIZED: "豆瓣凭证无效，请重新授权",
    RATE_LIMITED: "豆瓣 API 访问频率受限，请稍后再试",
    NETWORK_ERROR: "无法连接到豆瓣服务器",
    UNKNOWN: "豆瓣数据同步失败，请检查网络连接",
  },
} as const;
```

### Steam API

**用途**：游戏库、成就、游戏时长数据同步

```typescript
export const STEAM_CONFIG = {
  timeout: API_TIMEOUTS.SLOW, // Steam API 通常较慢
  maxRetries: RETRY_CONFIG.MAX_RETRIES,

  // 空态返回值
  emptyResponse: {
    games: [],
    recentGames: [],
    achievements: [],
    totalGames: 0,
    totalPlaytime: 0,
    lastSyncAt: null,
  },

  // 错误提示映射
  errorMessages: {
    TIMEOUT: "Steam API 响应超时，请稍后重试",
    UNAUTHORIZED: "Steam API Key 无效，请检查配置",
    PRIVATE_PROFILE: "Steam 个人资料为私密状态，请设置为公开",
    RATE_LIMITED: "Steam API 访问频率受限，请稍后再试",
    NETWORK_ERROR: "无法连接到 Steam 服务器",
    UNKNOWN: "Steam 数据同步失败，请检查网络连接",
  },
} as const;
```

### HoYoverse API

**用途**：崩坏：星穹铁道、绝区零等游戏数据同步

```typescript
export const HOYOVERSE_CONFIG = {
  timeout: API_TIMEOUTS.STANDARD,
  maxRetries: RETRY_CONFIG.MAX_RETRIES,

  // 空态返回值
  emptyResponse: {
    characters: [],
    achievements: [],
    stats: {
      activeDays: 0,
      achievementCount: 0,
      avatarCount: 0,
    },
    lastSyncAt: null,
  },

  // 错误提示映射
  errorMessages: {
    TIMEOUT: "米哈游 API 响应超时，请稍后重试",
    UNAUTHORIZED: "米哈游凭证无效，请重新获取 Cookie",
    RATE_LIMITED: "米哈游 API 访问频率受限，请稍后再试",
    NETWORK_ERROR: "无法连接到米哈游服务器",
    UNKNOWN: "游戏数据同步失败，请检查网络连接",
  },
} as const;
```

---

## SyncResult 错误编码规范

### 错误类型定义

```typescript
export enum SyncErrorCode {
  // 网络相关
  TIMEOUT = "TIMEOUT",
  NETWORK_ERROR = "NETWORK_ERROR",

  // 认证相关
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",

  // 限流相关
  RATE_LIMITED = "RATE_LIMITED",

  // 数据相关
  INVALID_RESPONSE = "INVALID_RESPONSE",
  PARSE_ERROR = "PARSE_ERROR",

  // 权限相关
  PRIVATE_PROFILE = "PRIVATE_PROFILE",
  PERMISSION_DENIED = "PERMISSION_DENIED",

  // 其他
  UNKNOWN = "UNKNOWN",
}

export type SyncResult = {
  success: boolean;
  platform: string;
  errorCode?: SyncErrorCode;
  message?: string;
  itemsSuccess?: number;
  itemsFailed?: number;
  timestamp: string;
};
```

### 错误响应示例

```typescript
// 成功响应
const successResult: SyncResult = {
  success: true,
  platform: "STEAM",
  itemsSuccess: 150,
  itemsFailed: 0,
  timestamp: new Date().toISOString(),
};

// 超时错误
const timeoutResult: SyncResult = {
  success: false,
  platform: "BILIBILI",
  errorCode: SyncErrorCode.TIMEOUT,
  message: "Bilibili API 响应超时，请稍后重试",
  itemsSuccess: 0,
  itemsFailed: 1,
  timestamp: new Date().toISOString(),
};

// 认证错误
const authResult: SyncResult = {
  success: false,
  platform: "DOUBAN",
  errorCode: SyncErrorCode.UNAUTHORIZED,
  message: "豆瓣凭证无效，请重新授权",
  itemsSuccess: 0,
  itemsFailed: 1,
  timestamp: new Date().toISOString(),
};
```

---

## 实现示例

### 带重试的 API 调用封装

```typescript
import { API_TIMEOUTS, RETRY_CONFIG, SyncErrorCode, type SyncResult } from "@/config/external-apis";

/**
 * 带超时和重试的外部 API 调用
 */
export async function fetchWithRetry<T>(
  url: string,
  options: {
    timeout?: number;
    maxRetries?: number;
    platform: string;
  }
): Promise<T> {
  const timeout = options.timeout ?? API_TIMEOUTS.STANDARD;
  const maxRetries = options.maxRetries ?? RETRY_CONFIG.MAX_RETRIES;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = calculateRetryDelay(attempt);
        console.warn(
          `[${options.platform}] Attempt ${attempt} failed, retrying in ${delay}ms...`,
          error
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

function calculateRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.INITIAL_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1);
  return Math.min(delay, RETRY_CONFIG.MAX_DELAY);
}
```

### Steam 数据同步示例

```typescript
import { STEAM_CONFIG, SyncErrorCode, type SyncResult } from "@/config/external-apis";
import { fetchWithRetry } from "@/lib/fetch-with-retry";

export async function syncSteamData(steamId: string): Promise<SyncResult> {
  try {
    const data = await fetchWithRetry(`https://api.steampowered.com/...`, {
      timeout: STEAM_CONFIG.timeout,
      maxRetries: STEAM_CONFIG.maxRetries,
      platform: "STEAM",
    });

    // 处理数据...

    return {
      success: true,
      platform: "STEAM",
      itemsSuccess: data.games.length,
      itemsFailed: 0,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Steam Sync] Failed:", error);

    const errorCode = determineErrorCode(error);
    const message = STEAM_CONFIG.errorMessages[errorCode];

    return {
      success: false,
      platform: "STEAM",
      errorCode,
      message,
      itemsSuccess: 0,
      itemsFailed: 1,
      timestamp: new Date().toISOString(),
    };
  }
}

function determineErrorCode(error: unknown): SyncErrorCode {
  if (error instanceof Error) {
    if (error.name === "AbortError") return SyncErrorCode.TIMEOUT;
    if (error.message.includes("401")) return SyncErrorCode.UNAUTHORIZED;
    if (error.message.includes("429")) return SyncErrorCode.RATE_LIMITED;
    if (error.message.includes("403")) return SyncErrorCode.PRIVATE_PROFILE;
  }
  return SyncErrorCode.UNKNOWN;
}
```

---

## 监控与日志

### 日志格式规范

```typescript
// 成功日志
console.info("[External API] Steam sync completed", {
  platform: "STEAM",
  duration: 2340,
  itemsSuccess: 150,
  timestamp: new Date().toISOString(),
});

// 重试日志
console.warn("[External API] Bilibili API retry", {
  platform: "BILIBILI",
  attempt: 2,
  maxRetries: 3,
  error: "TIMEOUT",
  timestamp: new Date().toISOString(),
});

// 失败日志
console.error("[External API] Douban sync failed", {
  platform: "DOUBAN",
  errorCode: "UNAUTHORIZED",
  message: "豆瓣凭证无效，请重新授权",
  timestamp: new Date().toISOString(),
});
```

### 性能监控指标

- **成功率**：成功同步次数 / 总同步次数
- **平均响应时间**：所有成功请求的平均耗时
- **超时率**：超时次数 / 总请求次数
- **重试率**：需要重试的请求数 / 总请求数

---

## 最佳实践

### ✅ 推荐做法

1. **总是使用超时**：所有外部 API 调用必须设置超时
2. **智能重试**：仅对临时性错误（超时、网络错误）重试
3. **返回空态**：失败时返回空数据结构，而非抛出异常
4. **记录日志**：记录所有失败情况用于监控和调试
5. **用户提示**：提供清晰的错误原因和建议操作

### ❌ 避免做法

1. **无限重试**：避免无限循环重试导致资源耗尽
2. **固定延迟**：使用指数退避而非固定重试延迟
3. **静默失败**：失败时不记录日志难以追踪问题
4. **技术错误暴露**：向用户显示技术错误信息
5. **阻塞主流程**：外部 API 失败不应影响核心功能

---

## 相关文档

- [模块化发布与功能开关实施方案](./modular-development-playbook.md)
- [数据库降级工具使用指南](../src/lib/utils/db-fallback.ts)
- [模块化改造待办清单](./modular-development-todolist.md)

---

_最后更新：2025-02-11_
