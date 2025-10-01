import { test, expect } from "@playwright/test";

const COVER_IMAGE = "a4421d362c75440695f137158cf9fc8b.jpeg";
const GALLERY_IMAGE = "d2983206585b4d9e8676bb2ee32d3182.jpg";

test.describe("Upload API Optimization", () => {
  test.describe("Basic Functionality", () => {
    test("should serve image via new API route - covers", async ({ request }) => {
      const response = await request.get(`/api/uploads/covers/${COVER_IMAGE}`);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("image");
    });

    test("should serve image via new API route - gallery", async ({ request }) => {
      const response = await request.get(`/api/uploads/gallery/${GALLERY_IMAGE}`);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("image");
    });

    test("should serve image via old path with rewrites - covers", async ({ request }) => {
      const response = await request.get(`/uploads/covers/${COVER_IMAGE}`);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("image");
    });

    test("should serve image via old path with rewrites - gallery", async ({ request }) => {
      const response = await request.get(`/uploads/gallery/${GALLERY_IMAGE}`);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("image");
    });
  });

  test.describe("HTTP Caching", () => {
    test("should include Cache-Control header with immutable", async ({ request }) => {
      const response = await request.get(`/api/uploads/covers/${COVER_IMAGE}`);
      const cacheControl = response.headers()["cache-control"];

      expect(cacheControl).toBeTruthy();
      expect(cacheControl).toContain("public");
      expect(cacheControl).toContain("max-age=31536000");
      expect(cacheControl).toContain("immutable");
    });

    test("should include ETag header", async ({ request }) => {
      const response = await request.get(`/api/uploads/covers/${COVER_IMAGE}`);
      const etag = response.headers()["etag"];

      expect(etag).toBeTruthy();
      expect(etag).toMatch(/^".*"$/); // ETag should be quoted
    });

    test("should include Last-Modified header", async ({ request }) => {
      const response = await request.get(`/api/uploads/covers/${COVER_IMAGE}`);
      const lastModified = response.headers()["last-modified"];

      expect(lastModified).toBeTruthy();
      // Should be a valid HTTP date
      expect(new Date(lastModified).toString()).not.toBe("Invalid Date");
    });

    test("should return 304 with If-None-Match", async ({ request }) => {
      // First request to get ETag
      const firstResponse = await request.get(`/api/uploads/covers/${COVER_IMAGE}`);
      const etag = firstResponse.headers()["etag"];
      expect(etag).toBeTruthy();

      // Second request with If-None-Match
      const secondResponse = await request.get(`/api/uploads/covers/${COVER_IMAGE}`, {
        headers: {
          "If-None-Match": etag,
        },
      });

      expect(secondResponse.status()).toBe(304);
    });

    test("should return 304 with If-Modified-Since", async ({ request }) => {
      // First request to get Last-Modified
      const firstResponse = await request.get(`/api/uploads/covers/${COVER_IMAGE}`);
      const lastModified = firstResponse.headers()["last-modified"];
      expect(lastModified).toBeTruthy();

      // Second request with If-Modified-Since
      const secondResponse = await request.get(`/api/uploads/covers/${COVER_IMAGE}`, {
        headers: {
          "If-Modified-Since": lastModified,
        },
      });

      expect(secondResponse.status()).toBe(304);
    });
  });

  test.describe("Security", () => {
    test("should prevent directory traversal attacks", async ({ request }) => {
      const maliciousPath = "/api/uploads/../../etc/passwd";
      const response = await request.get(maliciousPath);

      // Accept both 403 (explicit rejection) and 404 (not found after path normalization)
      // Both responses successfully prevent unauthorized access
      expect([403, 404]).toContain(response.status());
    });

    test("should return 404 for non-existent files", async ({ request }) => {
      const response = await request.get("/api/uploads/covers/nonexistent.jpg");

      expect(response.status()).toBe(404);
    });
  });

  test.describe("Technical Features", () => {
    test("should support HEAD method", async ({ request }) => {
      const response = await request.head(`/api/uploads/covers/${COVER_IMAGE}`);

      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("image");
      expect(response.headers()["content-length"]).toBeTruthy();
      expect(response.headers()["etag"]).toBeTruthy();
      expect(response.headers()["last-modified"]).toBeTruthy();

      // HEAD should not return body
      const body = await response.body();
      expect(body.length).toBe(0);
    });

    test("should return correct MIME type for JPEG", async ({ request }) => {
      const response = await request.get(`/api/uploads/covers/${COVER_IMAGE}`);
      const contentType = response.headers()["content-type"];

      expect(contentType).toBe("image/jpeg");
    });

    test("should return correct Content-Length", async ({ request }) => {
      const response = await request.get(`/api/uploads/covers/${COVER_IMAGE}`);
      const contentLength = parseInt(response.headers()["content-length"]);
      const body = await response.body();

      expect(contentLength).toBeGreaterThan(0);
      expect(contentLength).toBe(body.length);
    });
  });
});
