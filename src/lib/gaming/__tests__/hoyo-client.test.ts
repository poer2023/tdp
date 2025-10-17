import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  HoYoAPIClient,
  getHoYoClient,
  type ZZZIndexData,
  type ZZZShiyuDefence,
} from "../hoyo-client";

describe("HoYoAPIClient", () => {
  let client: HoYoAPIClient;
  const mockCookie = "ltoken=test_token; ltuid=123456";
  const mockUid = "100123456";
  const mockRegion = "cn_gf01";

  beforeEach(() => {
    client = new HoYoAPIClient(mockCookie, mockUid, mockRegion);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getZZZIndex", () => {
    it("should fetch ZZZ index data successfully", async () => {
      const mockResponse = {
        retcode: 0,
        message: "OK",
        data: {
          stats: {
            active_days: 45,
            avatar_num: 12,
            world_level_name: "绳网等级 40",
            cur_head_icon_url: "https://example.com/avatar.png",
            buddy_num: 8,
          },
          avatar_list: [
            {
              id: 1,
              name_mi18n: "丽娜",
              full_name_mi18n: "丽娜·路易斯",
              element_type: 1,
              camp_name_mi18n: "维多利亚家政",
              avatar_profession: 1,
              rarity: "S",
              group_icon_path: "https://example.com/avatar1.png",
              hollow_icon_path: "https://example.com/hollow1.png",
            },
            {
              id: 2,
              name_mi18n: "安比",
              full_name_mi18n: "安比·德玛拉",
              element_type: 2,
              camp_name_mi18n: "白祇重工",
              avatar_profession: 2,
              rarity: "A",
              group_icon_path: "https://example.com/avatar2.png",
              hollow_icon_path: "https://example.com/hollow2.png",
            },
          ],
          cur_head_icon: {
            avatar_icon_path: "https://example.com/current_avatar.png",
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const data = await client.getZZZIndex();

      expect(data.stats.active_days).toBe(45);
      expect(data.stats.avatar_num).toBe(12);
      expect(data.avatar_list).toHaveLength(2);
      expect(data.avatar_list[0].rarity).toBe("S");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("role_id=" + mockUid),
        expect.objectContaining({
          headers: expect.objectContaining({
            Cookie: mockCookie,
          }),
        })
      );
    });

    it("should handle API error response", async () => {
      const mockResponse = {
        retcode: -1,
        message: "Invalid UID",
        data: null,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(client.getZZZIndex()).rejects.toThrow("Invalid UID");
    });

    it("should handle network error", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network timeout"));

      await expect(client.getZZZIndex()).rejects.toThrow("Network timeout");
    });

    it("should handle empty avatar list", async () => {
      const mockResponse = {
        retcode: 0,
        message: "OK",
        data: {
          stats: {
            active_days: 1,
            avatar_num: 0,
            world_level_name: "绳网等级 1",
          },
          avatar_list: [],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const data = await client.getZZZIndex();

      expect(data.avatar_list).toEqual([]);
      expect(data.stats.avatar_num).toBe(0);
    });
  });

  describe("getZZZShiyuDefence", () => {
    it("should fetch Shiyu Defence data successfully", async () => {
      const mockResponse = {
        retcode: 0,
        message: "OK",
        data: {
          has_data: true,
          ratings: {
            "1": 1,
            "2": 2,
            "3": 3,
          },
          floors: [
            {
              floor_id: 1,
              rating: "S",
              layer_id: 1,
              buffs: [],
              node_1: {
                avatars: [
                  {
                    id: 1,
                    level: 50,
                    rarity: "S",
                    element_type: 1,
                  },
                ],
                monster_info: {
                  name: "Test Monster",
                  level: 50,
                },
              },
              node_2: {
                avatars: [],
              },
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const data = await client.getZZZShiyuDefence();

      expect(data).not.toBeNull();
      expect(data?.has_data).toBe(true);
      expect(data?.floors).toHaveLength(1);
      expect(data?.ratings).toHaveProperty("1");
    });

    it("should return null when no data available", async () => {
      const mockResponse = {
        retcode: 0,
        message: "OK",
        data: {
          has_data: false,
          ratings: {},
          floors: [],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const data = await client.getZZZShiyuDefence();

      expect(data).toBeNull();
    });

    it("should return null on API failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const data = await client.getZZZShiyuDefence();

      expect(data).toBeNull();
    });
  });

  describe("estimatePlaytime", () => {
    it("should estimate high playtime for veteran players", () => {
      const mockData: ZZZIndexData = {
        stats: {
          active_days: 60,
          avatar_num: 15,
          world_level_name: "绳网等级 50",
          cur_head_icon_url: "",
        },
        avatar_list: [],
      };

      const result = client.estimatePlaytime(mockData);

      // 60 * 1.5 + 15 * 2.5 * 0.5 = 90 + 18.75 = 108.75 -> 109
      expect(result.estimatedHours).toBeGreaterThan(100);
      expect(result.confidence).toBe("high");
    });

    it("should estimate medium playtime for regular players", () => {
      const mockData: ZZZIndexData = {
        stats: {
          active_days: 20,
          avatar_num: 5,
          world_level_name: "绳网等级 25",
          cur_head_icon_url: "",
        },
        avatar_list: [],
      };

      const result = client.estimatePlaytime(mockData);

      // 20 * 1.5 + 5 * 2.5 * 0.5 = 30 + 6.25 = 36.25 -> 36
      expect(result.estimatedHours).toBeGreaterThan(30);
      expect(result.estimatedHours).toBeLessThan(50);
      expect(result.confidence).toBe("medium");
    });

    it("should estimate low playtime for new players", () => {
      const mockData: ZZZIndexData = {
        stats: {
          active_days: 5,
          avatar_num: 2,
          world_level_name: "绳网等级 5",
          cur_head_icon_url: "",
        },
        avatar_list: [],
      };

      const result = client.estimatePlaytime(mockData);

      // 5 * 1.5 + 2 * 2.5 * 0.5 = 7.5 + 2.5 = 10 -> 10
      expect(result.estimatedHours).toBeLessThan(20);
      expect(result.confidence).toBe("low");
    });

    it("should handle edge case: 0 days and 0 characters", () => {
      const mockData: ZZZIndexData = {
        stats: {
          active_days: 0,
          avatar_num: 0,
          world_level_name: "绳网等级 1",
          cur_head_icon_url: "",
        },
        avatar_list: [],
      };

      const result = client.estimatePlaytime(mockData);

      expect(result.estimatedHours).toBe(0);
      expect(result.confidence).toBe("low");
    });

    it("should calculate confidence correctly at boundaries", () => {
      // Test medium/high boundary
      const mediumHighData: ZZZIndexData = {
        stats: {
          active_days: 30,
          avatar_num: 5,
          world_level_name: "",
          cur_head_icon_url: "",
        },
        avatar_list: [],
      };

      const mediumHighResult = client.estimatePlaytime(mediumHighData);
      expect(mediumHighResult.confidence).toBe("medium");

      // Test with 31 days and 6 characters (should be high)
      const highData: ZZZIndexData = {
        stats: {
          active_days: 31,
          avatar_num: 6,
          world_level_name: "",
          cur_head_icon_url: "",
        },
        avatar_list: [],
      };

      const highResult = client.estimatePlaytime(highData);
      expect(highResult.confidence).toBe("high");
    });
  });

  describe("calculateActivityScore", () => {
    it("should calculate high activity score with Shiyu data", () => {
      const mockIndexData: ZZZIndexData = {
        stats: {
          active_days: 50,
          avatar_num: 12,
          world_level_name: "绳网等级 40",
          cur_head_icon_url: "",
        },
        avatar_list: Array(12).fill({
          id: 1,
          name_mi18n: "Test",
          rarity: "S",
        }),
      };

      const mockShiyuData: ZZZShiyuDefence = {
        has_data: true,
        ratings: { "1": 1, "2": 2, "3": 3 },
        floors: Array(10).fill({ floor_id: 1, rating: "S" }),
      };

      const score = client.calculateActivityScore(mockIndexData, mockShiyuData);

      expect(score).toBeGreaterThan(80);
    });

    it("should calculate medium activity score without Shiyu data", () => {
      const mockIndexData: ZZZIndexData = {
        stats: {
          active_days: 20,
          avatar_num: 6,
          world_level_name: "绳网等级 20",
          cur_head_icon_url: "",
        },
        avatar_list: Array(6).fill({
          id: 1,
          name_mi18n: "Test",
          rarity: "A",
        }),
      };

      const score = client.calculateActivityScore(mockIndexData, null);

      expect(score).toBeGreaterThan(40);
      expect(score).toBeLessThan(70);
    });

    it("should calculate low activity score for new players", () => {
      const mockIndexData: ZZZIndexData = {
        stats: {
          active_days: 3,
          avatar_num: 2,
          world_level_name: "绳网等级 5",
          cur_head_icon_url: "",
        },
        avatar_list: Array(2).fill({
          id: 1,
          name_mi18n: "Test",
          rarity: "A",
        }),
      };

      const score = client.calculateActivityScore(mockIndexData, null);

      expect(score).toBeLessThan(30);
    });

    it("should cap activity score at 100", () => {
      const mockIndexData: ZZZIndexData = {
        stats: {
          active_days: 365,
          avatar_num: 50,
          world_level_name: "绳网等级 60",
          cur_head_icon_url: "",
        },
        avatar_list: Array(50).fill({
          id: 1,
          name_mi18n: "Test",
          rarity: "S",
        }),
      };

      const mockShiyuData: ZZZShiyuDefence = {
        has_data: true,
        ratings: { "1": 1, "2": 2, "3": 3 },
        floors: Array(20).fill({ floor_id: 1, rating: "S" }),
      };

      const score = client.calculateActivityScore(mockIndexData, mockShiyuData);

      expect(score).toBeLessThanOrEqual(100);
    });

    it("should handle empty Shiyu floors", () => {
      const mockIndexData: ZZZIndexData = {
        stats: {
          active_days: 30,
          avatar_num: 8,
          world_level_name: "绳网等级 30",
          cur_head_icon_url: "",
        },
        avatar_list: [],
      };

      const mockShiyuData: ZZZShiyuDefence = {
        has_data: true,
        ratings: {},
        floors: [],
      };

      const score = client.calculateActivityScore(mockIndexData, mockShiyuData);

      expect(score).toBeGreaterThan(0);
    });
  });

  describe("getHoYoClient", () => {
    it("should throw error when cookie is not configured", () => {
      const originalCookie = process.env.HOYO_COOKIE;
      const originalUid = process.env.HOYO_UID;
      delete process.env.HOYO_COOKIE;
      delete process.env.HOYO_UID;

      expect(() => getHoYoClient()).toThrow("HOYO_COOKIE not configured");

      process.env.HOYO_COOKIE = originalCookie;
      process.env.HOYO_UID = originalUid;
    });

    it("should throw error when UID is not configured", () => {
      const originalUid = process.env.HOYO_UID;
      process.env.HOYO_COOKIE = mockCookie;
      delete process.env.HOYO_UID;

      expect(() => getHoYoClient()).toThrow("HOYO_UID not configured");

      process.env.HOYO_UID = originalUid;
    });

    it("should return client instance when configured", () => {
      process.env.HOYO_COOKIE = mockCookie;
      process.env.HOYO_UID = mockUid;
      process.env.HOYO_REGION = mockRegion;

      const client = getHoYoClient();

      expect(client).toBeInstanceOf(HoYoAPIClient);
    });

    it("should use default region when not configured", () => {
      process.env.HOYO_COOKIE = mockCookie;
      process.env.HOYO_UID = mockUid;
      delete process.env.HOYO_REGION;

      const client = getHoYoClient();

      expect(client).toBeInstanceOf(HoYoAPIClient);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle malformed cookie", async () => {
      const malformedClient = new HoYoAPIClient("invalid_cookie", mockUid, mockRegion);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(malformedClient.getZZZIndex()).rejects.toThrow();
    });

    it("should handle invalid UID format", async () => {
      const invalidUidClient = new HoYoAPIClient(mockCookie, "invalid", mockRegion);

      const mockResponse = {
        retcode: 1001,
        message: "Invalid UID format",
        data: null,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(invalidUidClient.getZZZIndex()).rejects.toThrow("Invalid UID format");
    });

    it("should handle different regions correctly", async () => {
      const regions = ["cn_gf01", "os_asia", "os_usa", "os_euro"];

      for (const region of regions) {
        const regionalClient = new HoYoAPIClient(mockCookie, mockUid, region);

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            retcode: 0,
            message: "OK",
            data: {
              stats: { active_days: 10, avatar_num: 5 },
              avatar_list: [],
            },
          }),
        });

        await expect(regionalClient.getZZZIndex()).resolves.toBeDefined();
      }
    });

    it("should handle timeout gracefully", async () => {
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Request timeout")), 100);
          })
      );

      await expect(client.getZZZIndex()).rejects.toThrow("Request timeout");
    });

    it("should handle missing optional fields in avatar data", async () => {
      const mockResponse = {
        retcode: 0,
        message: "OK",
        data: {
          stats: {
            active_days: 10,
            avatar_num: 1,
          },
          avatar_list: [
            {
              id: 1,
              name_mi18n: "Test",
              rarity: "A",
              // Missing many optional fields
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const data = await client.getZZZIndex();

      expect(data.avatar_list).toHaveLength(1);
      expect(data.avatar_list[0].id).toBe(1);
    });
  });
});
