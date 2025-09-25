import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, afterAll } from "vitest";

// Clean up after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Global test setup
beforeAll(() => {
  // Mock environment variables
  process.env.NODE_ENV = "test";
  process.env.NEXTAUTH_SECRET = "test-secret";
  process.env.DATABASE_URL = "file:./test.db";
});

afterAll(() => {
  // Clean up after all tests
});
