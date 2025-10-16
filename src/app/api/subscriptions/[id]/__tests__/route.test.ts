import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "../route";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// Mock dependencies
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const mockSubscription = {
  id: "test-subscription-id",
  userId: "test-user-id",
  name: "Netflix",
  currency: "USD",
  amount: 15.99,
  amountCNY: 115.0,
  billingCycle: "MONTHLY" as const,
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-12-31"),
  notes: "Premium plan",
  originalRateToCNY: 7.2,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("GET /api/subscriptions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/subscriptions/test-id");
      const response = await GET(request, { params: { id: "test-id" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Successful Retrieval", () => {
    const mockSession = {
      user: { id: "test-user-id", email: "test@example.com" },
    };

    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
    });

    it("should return subscription when it exists and belongs to user", async () => {
      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSubscription
      );

      const request = new NextRequest(
        "http://localhost:3000/api/subscriptions/test-subscription-id"
      );
      const response = await GET(request, { params: { id: "test-subscription-id" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.subscription.name).toBe("Netflix");
      expect(data.subscription.id).toBe("test-subscription-id");
    });

    it("should query by correct subscription id", async () => {
      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSubscription
      );

      const request = new NextRequest(
        "http://localhost:3000/api/subscriptions/test-subscription-id"
      );
      await GET(request, { params: { id: "test-subscription-id" } });

      expect(prisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { id: "test-subscription-id" },
      });
    });
  });

  describe("Not Found", () => {
    const mockSession = {
      user: { id: "test-user-id", email: "test@example.com" },
    };

    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
    });

    it("should return 404 when subscription does not exist", async () => {
      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/subscriptions/nonexistent-id");
      const response = await GET(request, { params: { id: "nonexistent-id" } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Subscription not found");
    });

    it("should return 403 when subscription belongs to different user", async () => {
      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...mockSubscription,
        userId: "different-user-id",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/subscriptions/test-subscription-id"
      );
      const response = await GET(request, { params: { id: "test-subscription-id" } });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Forbidden");
    });
  });

  describe("Error Handling", () => {
    it("should return 500 when database query fails", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        user: { id: "test-user-id" },
      });
      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Database error")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/subscriptions/test-subscription-id"
      );
      const response = await GET(request, { params: { id: "test-subscription-id" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to fetch subscription");
    });
  });
});

describe("PUT /api/subscriptions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/subscriptions/test-id", {
        method: "PUT",
        body: JSON.stringify({}),
      });
      const response = await PUT(request, { params: { id: "test-id" } });

      expect(response.status).toBe(401);
    });
  });

  describe("Validation", () => {
    const mockSession = {
      user: { id: "test-user-id", email: "test@example.com" },
    };

    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSubscription
      );
    });

    it("should return 400 when required fields are missing", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/subscriptions/test-subscription-id",
        {
          method: "PUT",
          body: JSON.stringify({}),
        }
      );
      const response = await PUT(request, { params: { id: "test-subscription-id" } });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("required");
    });

    it("should return 400 when amount is invalid", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/subscriptions/test-subscription-id",
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Netflix",
            currency: "USD",
            amount: "invalid",
            billingCycle: "MONTHLY",
            startDate: "2024-01-01",
          }),
        }
      );
      const response = await PUT(request, { params: { id: "test-subscription-id" } });

      expect(response.status).toBe(400);
    });
  });

  describe("Successful Update", () => {
    const mockSession = {
      user: { id: "test-user-id", email: "test@example.com" },
    };

    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSubscription
      );
    });

    it("should update subscription with all fields", async () => {
      const updatedSubscription = {
        ...mockSubscription,
        name: "Netflix Premium",
        amount: 19.99,
        amountCNY: 143.0,
      };

      (prisma.subscription.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        updatedSubscription
      );

      const request = new NextRequest(
        "http://localhost:3000/api/subscriptions/test-subscription-id",
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Netflix Premium",
            currency: "USD",
            amount: "19.99",
            billingCycle: "MONTHLY",
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            notes: "Premium plan",
          }),
        }
      );

      const response = await PUT(request, { params: { id: "test-subscription-id" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.subscription.name).toBe("Netflix Premium");
      expect(data.subscription.amount).toBe(19.99);
    });

    it("should update subscription with null endDate", async () => {
      const updatedSubscription = {
        ...mockSubscription,
        endDate: null,
      };

      (prisma.subscription.update as ReturnType<typeof vi.fn>).mockResolvedValue(
        updatedSubscription
      );

      const request = new NextRequest(
        "http://localhost:3000/api/subscriptions/test-subscription-id",
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Netflix",
            currency: "USD",
            amount: "15.99",
            billingCycle: "MONTHLY",
            startDate: "2024-01-01",
            endDate: "",
            notes: "",
          }),
        }
      );

      const response = await PUT(request, { params: { id: "test-subscription-id" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.subscription.endDate).toBeNull();
    });

    it("should call prisma update with correct parameters", async () => {
      (prisma.subscription.update as ReturnType<typeof vi.fn>).mockResolvedValue(mockSubscription);

      const request = new NextRequest(
        "http://localhost:3000/api/subscriptions/test-subscription-id",
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Netflix",
            currency: "USD",
            amount: "15.99",
            billingCycle: "MONTHLY",
            startDate: "2024-01-01",
            endDate: "2024-12-31",
            notes: "Updated notes",
          }),
        }
      );

      await PUT(request, { params: { id: "test-subscription-id" } });

      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: "test-subscription-id" },
        data: expect.objectContaining({
          name: "Netflix",
          amount: 15.99,
          notes: "Updated notes",
        }),
      });
    });
  });

  describe("Not Found", () => {
    const mockSession = {
      user: { id: "test-user-id", email: "test@example.com" },
    };

    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
    });

    it("should return 404 when subscription does not exist", async () => {
      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/subscriptions/nonexistent-id", {
        method: "PUT",
        body: JSON.stringify({
          name: "Netflix",
          currency: "USD",
          amount: "15.99",
          billingCycle: "MONTHLY",
          startDate: "2024-01-01",
        }),
      });

      const response = await PUT(request, { params: { id: "nonexistent-id" } });

      expect(response.status).toBe(404);
    });

    it("should return 403 when subscription belongs to different user", async () => {
      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...mockSubscription,
        userId: "different-user-id",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/subscriptions/test-subscription-id",
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Netflix",
            currency: "USD",
            amount: "15.99",
            billingCycle: "MONTHLY",
            startDate: "2024-01-01",
          }),
        }
      );

      const response = await PUT(request, { params: { id: "test-subscription-id" } });

      expect(response.status).toBe(403);
    });
  });

  describe("Error Handling", () => {
    const mockSession = {
      user: { id: "test-user-id", email: "test@example.com" },
    };

    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSubscription
      );
    });

    it("should return 500 when database update fails", async () => {
      (prisma.subscription.update as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Database error")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/subscriptions/test-subscription-id",
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Netflix",
            currency: "USD",
            amount: "15.99",
            billingCycle: "MONTHLY",
            startDate: "2024-01-01",
          }),
        }
      );

      const response = await PUT(request, { params: { id: "test-subscription-id" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to update subscription");
    });
  });
});

describe("DELETE /api/subscriptions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/subscriptions/test-id", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: { id: "test-id" } });

      expect(response.status).toBe(401);
    });
  });

  describe("Successful Deletion", () => {
    const mockSession = {
      user: { id: "test-user-id", email: "test@example.com" },
    };

    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSubscription
      );
    });

    it("should delete subscription when it exists and belongs to user", async () => {
      (prisma.subscription.delete as ReturnType<typeof vi.fn>).mockResolvedValue(mockSubscription);

      const request = new NextRequest(
        "http://localhost:3000/api/subscriptions/test-subscription-id",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, { params: { id: "test-subscription-id" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe("Subscription deleted successfully");
    });

    it("should call prisma delete with correct id", async () => {
      (prisma.subscription.delete as ReturnType<typeof vi.fn>).mockResolvedValue(mockSubscription);

      const request = new NextRequest(
        "http://localhost:3000/api/subscriptions/test-subscription-id",
        {
          method: "DELETE",
        }
      );

      await DELETE(request, { params: { id: "test-subscription-id" } });

      expect(prisma.subscription.delete).toHaveBeenCalledWith({
        where: { id: "test-subscription-id" },
      });
    });
  });

  describe("Not Found", () => {
    const mockSession = {
      user: { id: "test-user-id", email: "test@example.com" },
    };

    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
    });

    it("should return 404 when subscription does not exist", async () => {
      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/subscriptions/nonexistent-id", {
        method: "DELETE",
      });

      const response = await DELETE(request, { params: { id: "nonexistent-id" } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe("Subscription not found");
    });

    it("should return 403 when subscription belongs to different user", async () => {
      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...mockSubscription,
        userId: "different-user-id",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/subscriptions/test-subscription-id",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, { params: { id: "test-subscription-id" } });

      expect(response.status).toBe(403);
    });
  });

  describe("Error Handling", () => {
    const mockSession = {
      user: { id: "test-user-id", email: "test@example.com" },
    };

    beforeEach(() => {
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockSubscription
      );
    });

    it("should return 500 when database deletion fails", async () => {
      (prisma.subscription.delete as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Database error")
      );

      const request = new NextRequest(
        "http://localhost:3000/api/subscriptions/test-subscription-id",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, { params: { id: "test-subscription-id" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe("Failed to delete subscription");
    });
  });
});
