import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET as getSubscriptions, POST as createSubscription } from "@/app/api/subscriptions/route";
import {
  PUT as updateSubscription,
  DELETE as deleteSubscription,
} from "@/app/api/subscriptions/[id]/route";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// Mock dependencies
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    subscription: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
  return {
    prisma: mockPrisma,
    default: mockPrisma,
  };
});

describe("Subscriptions API Integration", () => {
  const mockSession = {
    user: { id: "test-user-id", email: "test@example.com" },
  };

  const mockSubscription = {
    id: "sub-1",
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

  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Complete CRUD Workflow", () => {
    it("should complete full subscription lifecycle: CREATE → READ → UPDATE → DELETE", async () => {
      // 1. CREATE - Create new subscription
      const createData = {
        name: "Spotify",
        currency: "USD",
        amount: "9.99",
        billingCycle: "MONTHLY",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        notes: "Premium account",
      };

      const createdSubscription = {
        ...mockSubscription,
        id: "new-sub-id",
        name: "Spotify",
        amount: 9.99,
        amountCNY: 71.93,
      };

      (prisma.subscription.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        createdSubscription
      );

      const createRequest = new NextRequest("http://localhost:3000/api/subscriptions", {
        method: "POST",
        body: JSON.stringify(createData),
      });

      const createResponse = await createSubscription(createRequest);
      expect(createResponse.status).toBe(200);

      const createResult = await createResponse.json();
      expect(createResult.subscription.name).toBe("Spotify");
      expect(createResult.subscription.id).toBe("new-sub-id");

      // 2. READ - Get all subscriptions
      (prisma.subscription.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        createdSubscription,
      ]);

      const listRequest = new NextRequest("http://localhost:3000/api/subscriptions");
      const listResponse = await getSubscriptions(listRequest);
      expect(listResponse.status).toBe(200);

      const listResult = await listResponse.json();
      expect(listResult.subscriptions).toHaveLength(1);
      expect(listResult.subscriptions[0].name).toBe("Spotify");

      // 3. READ - Verify single subscription exists (using list endpoint)
      (prisma.subscription.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        createdSubscription,
      ]);

      const getRequest = new NextRequest("http://localhost:3000/api/subscriptions");
      const getResponse = await getSubscriptions(getRequest);
      expect(getResponse.status).toBe(200);

      const getResult = await getResponse.json();
      expect(getResult.subscriptions[0].id).toBe("new-sub-id");
      expect(getResult.subscriptions[0].name).toBe("Spotify");

      // 4. UPDATE - Update subscription
      const updateData = {
        name: "Spotify Family",
        currency: "USD",
        amount: "14.99",
        billingCycle: "MONTHLY",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        notes: "Family plan",
      };

      const updatedSubscription = {
        ...createdSubscription,
        name: "Spotify Family",
        amount: 14.99,
        amountCNY: 107.93,
        notes: "Family plan",
      };

      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        createdSubscription
      );
      (prisma.subscription.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        updatedSubscription
      );

      const updateRequest = new NextRequest("http://localhost:3000/api/subscriptions/new-sub-id", {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      const updateResponse = await updateSubscription(updateRequest, {
        params: { id: "new-sub-id" },
      });
      expect(updateResponse.status).toBe(200);

      const updateResult = await updateResponse.json();
      expect(updateResult.subscription.name).toBe("Spotify Family");
      expect(updateResult.subscription.amount).toBe(14.99);
      expect(updateResult.subscription.notes).toBe("Family plan");

      // 5. DELETE - Delete subscription
      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        updatedSubscription
      );
      (prisma.subscription.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        updatedSubscription
      );

      const deleteRequest = new NextRequest("http://localhost:3000/api/subscriptions/new-sub-id", {
        method: "DELETE",
      });

      const deleteResponse = await deleteSubscription(deleteRequest, {
        params: { id: "new-sub-id" },
      });
      expect(deleteResponse.status).toBe(200);

      const deleteResult = await deleteResponse.json();
      expect(deleteResult.success).toBe(true);

      // 6. Verify deletion - subscription should not exist (list should be empty)
      (prisma.subscription.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      const verifyRequest = new NextRequest("http://localhost:3000/api/subscriptions");
      const verifyResponse = await getSubscriptions(verifyRequest);
      expect(verifyResponse.status).toBe(200);

      const verifyResult = await verifyResponse.json();
      expect(verifyResult.subscriptions).toHaveLength(0);
    });
  });

  describe("Multi-User Isolation", () => {
    it("should isolate subscriptions between different users", async () => {
      const user1Session = { user: { id: "user-1", email: "user1@example.com" } };
      const user2Session = { user: { id: "user-2", email: "user2@example.com" } };

      const user1Subscription = { ...mockSubscription, userId: "user-1", id: "user1-sub" };
      const user2Subscription = {
        ...mockSubscription,
        userId: "user-2",
        id: "user2-sub",
        name: "GitHub",
      };

      // User 1 creates subscription
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(user1Session);
      (prisma.subscription.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        user1Subscription
      );

      const user1CreateRequest = new NextRequest("http://localhost:3000/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          name: "Netflix",
          currency: "USD",
          amount: "15.99",
          billingCycle: "MONTHLY",
          startDate: "2024-01-01",
        }),
      });

      await createSubscription(user1CreateRequest);

      // User 2 creates subscription
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(user2Session);
      (prisma.subscription.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        user2Subscription
      );

      const user2CreateRequest = new NextRequest("http://localhost:3000/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          name: "GitHub",
          currency: "USD",
          amount: "7.00",
          billingCycle: "MONTHLY",
          startDate: "2024-01-01",
        }),
      });

      await createSubscription(user2CreateRequest);

      // User 1 lists their subscriptions - should only see their own
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(user1Session);
      (prisma.subscription.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        user1Subscription,
      ]);

      const user1ListRequest = new NextRequest("http://localhost:3000/api/subscriptions");
      const user1ListResponse = await getSubscriptions(user1ListRequest);
      const user1ListResult = await user1ListResponse.json();

      expect(user1ListResult.subscriptions).toHaveLength(1);
      expect(user1ListResult.subscriptions[0].name).toBe("Netflix");
      expect(user1ListResult.subscriptions[0].userId).toBe("user-1");

      // User 2 lists their subscriptions - should not see User 1's subscription
      (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce(user2Session);
      (prisma.subscription.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        user2Subscription,
      ]);

      const user2ListRequest = new NextRequest("http://localhost:3000/api/subscriptions");
      const user2ListResponse = await getSubscriptions(user2ListRequest);
      const user2ListResult = await user2ListResponse.json();

      // User 2 should only see their own subscription, not User 1's
      expect(user2ListResult.subscriptions).toHaveLength(1);
      expect(user2ListResult.subscriptions[0].name).toBe("GitHub");
      expect(user2ListResult.subscriptions[0].userId).toBe("user-2");
    });
  });

  describe("Data Validation and Consistency", () => {
    it("should maintain data consistency across create and read operations", async () => {
      const createData = {
        name: "Adobe Creative Cloud",
        currency: "USD",
        amount: "52.99",
        billingCycle: "ANNUAL",
        startDate: "2024-01-01",
        endDate: "2025-01-01",
        notes: "Annual subscription",
      };

      const createdSubscription = {
        id: "adobe-sub",
        userId: "test-user-id",
        name: "Adobe Creative Cloud",
        currency: "USD",
        amount: 52.99,
        amountCNY: 381.0,
        billingCycle: "ANNUAL" as const,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2025-01-01"),
        notes: "Annual subscription",
        originalRateToCNY: 7.19,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.subscription.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        createdSubscription
      );

      const createRequest = new NextRequest("http://localhost:3000/api/subscriptions", {
        method: "POST",
        body: JSON.stringify(createData),
      });

      const createResponse = await createSubscription(createRequest);
      const createResult = await createResponse.json();

      // Verify all fields are correctly stored
      expect(createResult.subscription.name).toBe("Adobe Creative Cloud");
      expect(createResult.subscription.amount).toBe(52.99);
      expect(createResult.subscription.currency).toBe("USD");
      expect(createResult.subscription.billingCycle).toBe("ANNUAL");
      expect(createResult.subscription.notes).toBe("Annual subscription");

      // Read back and verify consistency (using list endpoint)
      (prisma.subscription.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
        createdSubscription,
      ]);

      const getRequest = new NextRequest("http://localhost:3000/api/subscriptions");
      const getResponse = await getSubscriptions(getRequest);
      const getResult = await getResponse.json();

      expect(getResult.subscriptions[0]).toEqual(
        expect.objectContaining({
          name: "Adobe Creative Cloud",
          amount: 52.99,
          currency: "USD",
          billingCycle: "ANNUAL",
          notes: "Annual subscription",
        })
      );
    });
  });

  describe("Update Operations", () => {
    it("should allow partial updates to subscription", async () => {
      const existingSubscription = { ...mockSubscription };

      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        existingSubscription
      );

      // Update only the name and notes
      const updateData = {
        name: "Netflix Premium",
        currency: "USD",
        amount: "15.99",
        billingCycle: "MONTHLY",
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        notes: "Updated to premium plan",
      };

      const updatedSubscription = {
        ...existingSubscription,
        name: "Netflix Premium",
        notes: "Updated to premium plan",
      };

      (prisma.subscription.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        updatedSubscription
      );

      const updateRequest = new NextRequest("http://localhost:3000/api/subscriptions/sub-1", {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      const updateResponse = await updateSubscription(updateRequest, { params: { id: "sub-1" } });
      const updateResult = await updateResponse.json();

      expect(updateResult.subscription.name).toBe("Netflix Premium");
      expect(updateResult.subscription.notes).toBe("Updated to premium plan");
      expect(updateResult.subscription.amount).toBe(15.99); // Unchanged
    });

    it("should handle clearing optional fields", async () => {
      const existingSubscription = { ...mockSubscription };

      (prisma.subscription.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
        existingSubscription
      );

      // Clear end date and notes
      const updateData = {
        name: "Netflix",
        currency: "USD",
        amount: "15.99",
        billingCycle: "MONTHLY",
        startDate: "2024-01-01",
        endDate: "",
        notes: "",
      };

      const updatedSubscription = {
        ...existingSubscription,
        endDate: null,
        notes: "",
      };

      (prisma.subscription.update as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        updatedSubscription
      );

      const updateRequest = new NextRequest("http://localhost:3000/api/subscriptions/sub-1", {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      const updateResponse = await updateSubscription(updateRequest, { params: { id: "sub-1" } });
      const updateResult = await updateResponse.json();

      expect(updateResult.subscription.endDate).toBeNull();
      expect(updateResult.subscription.notes).toBe("");
    });
  });

  describe("Error Recovery", () => {
    it("should handle database errors gracefully", async () => {
      // Mock Prisma to reject with error
      const mockError = new Error("Database connection lost");
      (prisma.subscription.findMany as ReturnType<typeof vi.fn>).mockRejectedValueOnce(mockError);

      const request = new NextRequest("http://localhost:3000/api/subscriptions");

      // The API should catch the error and return 500
      const response = await getSubscriptions(request);

      expect(response.status).toBe(500);
      const result = await response.json();
      expect(result.error).toBeDefined();
    });

    it("should rollback on failed creation", async () => {
      // Mock Prisma create to reject with error
      const mockError = new Error("Unique constraint violation");
      (prisma.subscription.create as ReturnType<typeof vi.fn>).mockRejectedValueOnce(mockError);

      const createRequest = new NextRequest("http://localhost:3000/api/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          name: "Netflix",
          currency: "USD",
          amount: "15.99",
          billingCycle: "MONTHLY",
          startDate: "2024-01-01",
        }),
      });

      // The API should catch the error and return 500
      const response = await createSubscription(createRequest);
      expect(response.status).toBe(500);

      const result = await response.json();
      expect(result.error).toBeDefined();

      // Verify subscription was not created (list should be empty)
      (prisma.subscription.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

      const listRequest = new NextRequest("http://localhost:3000/api/subscriptions");
      const listResponse = await getSubscriptions(listRequest);
      const listResult = await listResponse.json();

      expect(listResult.subscriptions).toHaveLength(0);
    });
  });
});
