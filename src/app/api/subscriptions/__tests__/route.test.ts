import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../route";
import { NextRequest } from "next/server";
import { auth } from "@/auth";

// Mock dependencies
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    subscription: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";

const mockPrisma = vi.mocked(prisma);
const mockAuth = vi.mocked(auth);

describe("GET /api/subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/subscriptions");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 401 when session has no user", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const request = new NextRequest("http://localhost:3000/api/subscriptions");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe("Successful Retrieval", () => {
    const mockSession = {
      user: { id: "test-user-id", email: "test@example.com" },
    };

    const mockSubscriptions = [
      {
        id: "sub-1",
        userId: "test-user-id",
        name: "Netflix",
        currency: "USD",
        amount: 15.99,
        amountCNY: 115.0,
        billingCycle: "MONTHLY",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        notes: "Premium plan",
        originalRateToCNY: 7.2,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
      {
        id: "sub-2",
        userId: "test-user-id",
        name: "GitHub",
        currency: "USD",
        amount: 7.0,
        amountCNY: 50.0,
        billingCycle: "MONTHLY",
        startDate: new Date("2024-01-01"),
        endDate: null,
        notes: "",
        originalRateToCNY: 7.14,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
    ];

    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSession);
    });

    it("should return all subscriptions for authenticated user", async () => {
      mockPrisma.subscription.findMany.mockResolvedValue(mockSubscriptions);

      const request = new NextRequest("http://localhost:3000/api/subscriptions");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.subscriptions).toHaveLength(2);
      expect(data.subscriptions[0].name).toBe("Netflix");
    });

    it("should filter subscriptions by userId", async () => {
      const request = new NextRequest("http://localhost:3000/api/subscriptions");
      await GET(request);

      expect(mockPrisma.subscription.findMany).toHaveBeenCalledWith({
        where: { userId: "test-user-id" },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should return empty array when user has no subscriptions", async () => {
      mockPrisma.subscription.findMany.mockResolvedValue([]);

      const request = new NextRequest("http://localhost:3000/api/subscriptions");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.subscriptions).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    it("should return 500 when database query fails", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "test-user-id" },
      });
      mockPrisma.subscription.findMany.mockRejectedValue(new Error("Database connection failed"));

      const request = new NextRequest("http://localhost:3000/api/subscriptions");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to fetch subscriptions");
    });
  });
});

describe("POST /api/subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe("Validation", () => {
    const mockSession = {
      user: { id: "test-user-id", email: "test@example.com" },
    };

    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSession);
    });

    it("should return 400 when required fields are missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("required");
    });

    it("should return 400 when name is missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          currency: "USD",
          amount: "10.00",
          billingCycle: "MONTHLY",
          startDate: "2024-01-01",
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 400 when amount is missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          name: "Netflix",
          currency: "USD",
          billingCycle: "MONTHLY",
          startDate: "2024-01-01",
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 400 when amount is not a valid number", async () => {
      const request = new NextRequest("http://localhost:3000/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          name: "Netflix",
          currency: "USD",
          amount: "invalid",
          billingCycle: "MONTHLY",
          startDate: "2024-01-01",
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 400 when startDate is missing", async () => {
      const request = new NextRequest("http://localhost:3000/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          name: "Netflix",
          currency: "USD",
          amount: "10.00",
          billingCycle: "MONTHLY",
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 400 when billingCycle is invalid", async () => {
      const request = new NextRequest("http://localhost:3000/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          name: "Netflix",
          currency: "USD",
          amount: "10.00",
          billingCycle: "INVALID",
          startDate: "2024-01-01",
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe("Successful Creation", () => {
    const mockSession = {
      user: { id: "test-user-id", email: "test@example.com" },
    };

    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSession);
    });

    it("should create subscription with all fields", async () => {
      const newSubscription = {
        id: "new-sub-id",
        userId: "test-user-id",
        name: "Netflix",
        currency: "USD",
        amount: 15.99,
        amountCNY: 115.0,
        billingCycle: "MONTHLY",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        notes: "Premium plan",
        originalRateToCNY: 7.2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.subscription.create.mockResolvedValue(newSubscription);

      const request = new NextRequest("http://localhost:3000/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          name: "Netflix",
          currency: "USD",
          amount: "15.99",
          billingCycle: "MONTHLY",
          startDate: "2024-01-01",
          endDate: "2024-12-31",
          notes: "Premium plan",
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.subscription.name).toBe("Netflix");
      expect(data.subscription.amount).toBe(15.99);
    });

    it("should create subscription without optional fields", async () => {
      const newSubscription = {
        id: "new-sub-id",
        userId: "test-user-id",
        name: "GitHub",
        currency: "USD",
        amount: 7.0,
        amountCNY: 50.0,
        billingCycle: "MONTHLY",
        startDate: new Date("2024-01-01"),
        endDate: null,
        notes: "",
        originalRateToCNY: 7.14,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.subscription.create.mockResolvedValue(newSubscription);

      const request = new NextRequest("http://localhost:3000/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          name: "GitHub",
          currency: "USD",
          amount: "7.00",
          billingCycle: "MONTHLY",
          startDate: "2024-01-01",
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.subscription.endDate).toBeNull();
      expect(data.subscription.notes).toBe("");
    });

    it("should associate subscription with authenticated user", async () => {
      mockPrisma.subscription.create.mockResolvedValue({
        id: "new-id",
        userId: "test-user-id",
        name: "Test",
        currency: "USD",
        amount: 10,
        amountCNY: 70,
        billingCycle: "MONTHLY",
        startDate: new Date(),
        endDate: null,
        notes: "",
        originalRateToCNY: 7.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new NextRequest("http://localhost:3000/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          name: "Test",
          currency: "USD",
          amount: "10.00",
          billingCycle: "MONTHLY",
          startDate: "2024-01-01",
        }),
      });

      await POST(request);

      expect(mockPrisma.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "test-user-id",
          }),
        })
      );
    });
  });

  describe("Error Handling", () => {
    const mockSession = {
      user: { id: "test-user-id", email: "test@example.com" },
    };

    beforeEach(() => {
      mockAuth.mockResolvedValue(mockSession);
    });

    it("should return 500 when database creation fails", async () => {
      mockPrisma.subscription.create.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          name: "Netflix",
          currency: "USD",
          amount: "15.99",
          billingCycle: "MONTHLY",
          startDate: "2024-01-01",
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to create subscription");
    });

    it("should return 400 when request body is invalid JSON", async () => {
      const request = new NextRequest("http://localhost:3000/api/subscriptions", {
        method: "POST",
        body: "invalid json",
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
