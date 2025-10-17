/**
 * HoYoverse API Client for Zenless Zone Zero
 * Using unofficial HoYoLab Battle Chronicle API
 *
 * Note: This uses reverse-engineered API endpoints.
 * For production use, consider using michos-api package:
 * npm install michos-api
 */

interface ZZZIndexData {
  stats: {
    active_days: number; // 登录天数
    avatar_num: number; // 角色数量
    world_level_name: string; // 绳网等级
    cur_period_zone: string; // 当前式舆防卫战
    buddy_num: number; // 邦布数量
  };
  avatar_list: Array<{
    id: number;
    name: string;
    name_mi18n: string;
    element_type: number;
    rarity: string;
    level: number;
    rank: number; // 命座
  }>;
}

interface ZZZShiyuDefence {
  schedule_id: number;
  begin_time: { year: number; month: number; day: number };
  end_time: { year: number; month: number; day: number };
  ratings: Record<
    string,
    {
      times: string; // 挑战次数
      rating: string; // 评级
    }
  >;
}

interface HoYoLabResponse<T> {
  retcode: number;
  message: string;
  data: T | null;
}

export class HoYoAPIClient {
  private baseURL = "https://api-takumi-record.mihoyo.com";
  private cookie: string;
  private uid: string;
  private region: string;

  constructor(cookie: string, uid: string, region = "cn_gf01") {
    if (!cookie || !uid) {
      throw new Error("HoYoLab cookie and UID are required");
    }
    this.cookie = cookie;
    this.uid = uid;
    this.region = region;
  }

  /**
   * Make authenticated request to HoYoLab API
   */
  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      Cookie: this.cookie,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
      "Accept-Language": "zh-CN,zh;q=0.9",
      Origin: "https://www.hoyolab.com",
      Referer: "https://www.hoyolab.com/",
    };

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HoYoLab API error: ${response.statusText}`);
    }

    const data: HoYoLabResponse<T> = await response.json();
    if (data.retcode !== 0) {
      throw new Error(`HoYoLab API error: ${data.message} (${data.retcode})`);
    }

    if (!data.data) {
      throw new Error("No data returned from HoYoLab API");
    }

    return data.data;
  }

  /**
   * Get Zenless Zone Zero basic info (level, characters, etc)
   */
  async getZZZIndex(): Promise<ZZZIndexData> {
    const endpoint = `/game_record/app/zzz/api/index?role_id=${this.uid}&server=${this.region}`;
    return this.request<ZZZIndexData>(endpoint);
  }

  /**
   * Get Zenless Zone Zero Shiyu Defence (式舆防卫战) data
   */
  async getZZZShiyuDefence(): Promise<ZZZShiyuDefence | null> {
    try {
      const endpoint = `/game_record/app/zzz/api/challenge?role_id=${this.uid}&server=${this.region}&schedule_type=1`;
      return await this.request<ZZZShiyuDefence>(endpoint);
    } catch (error) {
      // Shiyu Defence data may not be available
      console.warn("Failed to fetch Shiyu Defence data:", error);
      return null;
    }
  }

  /**
   * Estimate playtime based on various metrics
   * Since HoYoLab doesn't provide direct playtime data,
   * we estimate based on level, login days, and activity
   */
  estimatePlaytime(data: ZZZIndexData): {
    estimatedHours: number;
    confidence: "low" | "medium" | "high";
  } {
    const { active_days, avatar_num } = data.stats;

    // Rough estimation formula:
    // - Each login day: ~1-2 hours average
    // - Each character: indicates ~2-3 hours of playtime
    const baseHours = active_days * 1.5;
    const characterHours = avatar_num * 2.5;
    const estimatedHours = Math.round(baseHours + characterHours * 0.5);

    // Confidence based on data richness
    let confidence: "low" | "medium" | "high" = "low";
    if (active_days > 30 && avatar_num > 5) {
      confidence = "high";
    } else if (active_days > 10 || avatar_num > 3) {
      confidence = "medium";
    }

    return {
      estimatedHours,
      confidence,
    };
  }

  /**
   * Generate activity score (0-100) for heatmap
   */
  calculateActivityScore(data: ZZZIndexData, shiyuData: ZZZShiyuDefence | null): number {
    let score = 0;

    // Base score from characters and level
    score += Math.min(data.stats.avatar_num * 5, 40);

    // Add score for Shiyu Defence participation
    if (shiyuData) {
      const totalChallenges = Object.values(shiyuData.ratings).reduce(
        (sum, rating) => sum + parseInt(rating.times || "0"),
        0
      );
      score += Math.min(totalChallenges * 10, 30);
    }

    // Add bonus for active days
    score += Math.min(data.stats.active_days / 10, 30);

    return Math.min(Math.round(score), 100);
  }
}

/**
 * Singleton instance
 */
let hoyoClient: HoYoAPIClient | null = null;

export function getHoYoClient(): HoYoAPIClient {
  if (!hoyoClient) {
    const cookie = process.env.HOYO_COOKIE;
    const uid = process.env.HOYO_UID;
    const region = process.env.HOYO_REGION || "cn_gf01";

    if (!cookie || !uid) {
      throw new Error("HOYO_COOKIE and HOYO_UID environment variables are required");
    }

    hoyoClient = new HoYoAPIClient(cookie, uid, region);
  }
  return hoyoClient;
}

/**
 * Type exports for use in other modules
 */
export type { ZZZIndexData, ZZZShiyuDefence };
