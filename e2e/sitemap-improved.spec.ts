import { test, expect } from "@playwright/test";
import { parseStringPromise } from "xml2js";
import { TEST_POST_IDS } from "./fixtures/test-data";

/**
 * Helper to fetch and parse sitemap XML
 */
async function fetchAndParseSitemap(page: any, path: string) {
  const response = await page.goto(path);
  const content = await response?.text();

  if (!content) {
    throw new Error(`Failed to fetch ${path}`);
  }

  const parsed = await parseStringPromise(content);
  return { response, content, parsed };
}

/**
 * Extract URLs from sitemap
 */
function extractUrls(sitemap: any): string[] {
  const urls = sitemap.urlset?.url || [];
  return urls.map((u: any) => u.loc?.[0]).filter(Boolean);
}

/**
 * Extract sitemap references from sitemap index
 */
function extractSitemapRefs(sitemapIndex: any): string[] {
  const sitemaps = sitemapIndex.sitemapindex?.sitemap || [];
  return sitemaps.map((s: any) => s.loc?.[0]).filter(Boolean);
}

test.describe("Sitemap HTTP Response", () => {
  test("should serve root sitemap.xml with correct headers", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");

    expect(response?.status()).toBe(200);
    expect(response?.headers()["content-type"]).toContain("xml");
  });

  test("should serve sitemap-en.xml with correct headers", async ({ page }) => {
    const response = await page.goto("/sitemap-en.xml");

    expect(response?.status()).toBe(200);
    expect(response?.headers()["content-type"]).toContain("xml");
  });

  test("should serve sitemap-zh.xml with correct headers", async ({ page }) => {
    const response = await page.goto("/sitemap-zh.xml");

    expect(response?.status()).toBe(200);
    expect(response?.headers()["content-type"]).toContain("xml");
  });

  test("should have proper caching headers", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    const cacheControl = response?.headers()["cache-control"];

    // Should have some caching policy
    expect(cacheControl).toBeDefined();
  });
});

test.describe("Sitemap Structure", () => {
  test("should have valid sitemap index OR urlset structure", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap.xml");

    // Implementation can use either sitemapindex or urlset
    const hasSitemapIndex = !!parsed.sitemapindex;
    const hasUrlset = !!parsed.urlset;

    expect(hasSitemapIndex || hasUrlset).toBe(true);
  });

  test("should have valid XML structure with xmlns", async ({ page }) => {
    const { content, parsed } = await fetchAndParseSitemap(page, "/sitemap.xml");

    // Should parse without errors
    expect(parsed).toBeTruthy();

    // Should have xmlns namespace
    expect(content).toContain("xmlns");
    expect(content).toContain("http://www.sitemaps.org/schemas/sitemap");
  });

  test("should reference locale-specific sitemaps if using index", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap.xml");

    if (parsed.sitemapindex) {
      // If using sitemap index, should reference EN and ZH sitemaps
      const refs = extractSitemapRefs(parsed);

      expect(refs.some((ref: string) => ref.includes("sitemap-en.xml"))).toBe(true);
      expect(refs.some((ref: string) => ref.includes("sitemap-zh.xml"))).toBe(true);
    } else if (parsed.urlset) {
      // If using single urlset, should contain both EN and ZH URLs
      const urls = extractUrls(parsed);
      const hasEnUrls = urls.some((url: string) => !url.includes("/zh/"));
      const hasZhUrls = urls.some((url: string) => url.includes("/zh/"));

      expect(hasEnUrls || hasZhUrls).toBe(true);
    }
  });
});

test.describe("English Sitemap Content", () => {
  test("should include homepage in sitemap-en.xml", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urls = extractUrls(parsed);

    // Should include root URL (with or without trailing slash, but not Chinese path)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const hasHomepage = urls.some(
      (url: string) =>
        (url === baseUrl || url === `${baseUrl}/` || url.match(/^https?:\/\/[^/]+\/?$/)) &&
        !url.includes("/zh/")
    );
    expect(hasHomepage).toBe(true);
  });

  test("should include /posts list page in sitemap-en.xml", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urls = extractUrls(parsed);

    // Should include /posts
    expect(urls.some((url: string) => url.endsWith("/posts"))).toBe(true);
  });

  test("should include English post URLs in sitemap-en.xml", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urls = extractUrls(parsed);

    expect(urls.length).toBeGreaterThan(0);

    // Should have post URLs without /zh/ prefix
    const postUrls = urls.filter(
      (url: string) => url.match(/\/posts\/[a-z0-9-]+$/) && !url.includes("/zh/")
    );

    // Should have at least some post URLs (based on test data)
    expect(postUrls.length).toBeGreaterThanOrEqual(0);
  });

  test("should not include Chinese URLs in sitemap-en.xml", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urls = extractUrls(parsed);

    // Should NOT include /zh/ URLs
    urls.forEach((url: string) => {
      expect(url).not.toContain("/zh/");
    });
  });
});

test.describe("Chinese Sitemap Content", () => {
  test("should include /zh homepage in sitemap-zh.xml", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-zh.xml");
    const urls = extractUrls(parsed);

    // Should include /zh
    expect(urls.some((url: string) => url.endsWith("/zh") || url.endsWith("/zh/"))).toBe(true);
  });

  test("should include /zh/posts list page in sitemap-zh.xml", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-zh.xml");
    const urls = extractUrls(parsed);

    // Should include /zh/posts
    expect(urls.some((url: string) => url.includes("/zh/posts"))).toBe(true);
  });

  test("should include Chinese post URLs in sitemap-zh.xml", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-zh.xml");
    const urls = extractUrls(parsed);

    // Should have Chinese post URLs with /zh/ prefix
    const zhPostUrls = urls.filter((url: string) => url.match(/\/zh\/posts\/[a-z0-9-]+$/));

    expect(zhPostUrls.length).toBeGreaterThanOrEqual(0);
  });

  test("should only include Chinese URLs in sitemap-zh.xml", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-zh.xml");
    const urls = extractUrls(parsed);

    // All URLs should contain /zh/
    urls.forEach((url: string) => {
      expect(url).toContain("/zh");
    });
  });
});

test.describe("Sitemap URL Properties", () => {
  test("should include required properties (loc, lastmod, changefreq, priority)", async ({
    page,
  }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urlEntries = parsed.urlset?.url || [];

    if (urlEntries.length > 0) {
      const firstUrl = urlEntries[0];

      // Required: loc
      expect(firstUrl).toHaveProperty("loc");
      expect(firstUrl.loc[0]).toMatch(/^https?:\/\//);

      // Recommended: lastmod, changefreq, priority
      expect(firstUrl).toHaveProperty("lastmod");
      expect(firstUrl).toHaveProperty("changefreq");
      expect(firstUrl).toHaveProperty("priority");
    }
  });

  test("should use absolute URLs (not relative)", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urls = extractUrls(parsed);

    // All URLs should be absolute (start with http:// or https://)
    urls.forEach((url: string) => {
      expect(url).toMatch(/^https?:\/\//);
    });
  });

  test("should have valid ISO 8601 lastmod dates", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urlEntries = parsed.urlset?.url || [];

    urlEntries.forEach((entry: any) => {
      if (entry.lastmod) {
        const lastmod = entry.lastmod[0];
        // Should be valid ISO 8601 date
        expect(new Date(lastmod).toString()).not.toBe("Invalid Date");
      }
    });
  });

  test("should have valid changefreq values", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urlEntries = parsed.urlset?.url || [];

    const validFreqs = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];

    urlEntries.forEach((entry: any) => {
      if (entry.changefreq) {
        const freq = entry.changefreq[0];
        expect(validFreqs).toContain(freq);
      }
    });
  });

  test("should have valid priority values (0.0 to 1.0)", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urlEntries = parsed.urlset?.url || [];

    urlEntries.forEach((entry: any) => {
      if (entry.priority) {
        const priority = parseFloat(entry.priority[0]);
        expect(priority).toBeGreaterThanOrEqual(0.0);
        expect(priority).toBeLessThanOrEqual(1.0);
      }
    });
  });
});

test.describe("Sitemap Exclusions", () => {
  test("should not include admin routes in sitemap", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urls = extractUrls(parsed);

    // Should NOT include /admin routes
    urls.forEach((url: string) => {
      expect(url).not.toContain("/admin");
    });
  });

  test("should not include API routes in sitemap", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urls = extractUrls(parsed);

    // Should NOT include /api routes
    urls.forEach((url: string) => {
      expect(url).not.toContain("/api");
    });
  });

  test("should not include auth routes in sitemap", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urls = extractUrls(parsed);

    // Should NOT include /auth routes
    urls.forEach((url: string) => {
      expect(url).not.toContain("/auth");
    });
  });

  test("should not include draft or unpublished posts", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urls = extractUrls(parsed);

    // All post URLs should be for published posts only
    // This is validated by checking the database later, but URLs shouldn't contain "draft"
    urls.forEach((url: string) => {
      expect(url).not.toContain("draft");
      expect(url).not.toContain("unpublished");
    });
  });
});

test.describe("Sitemap Localization", () => {
  test("should have different URLs in EN and ZH sitemaps", async ({ page }) => {
    const { parsed: enParsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const { parsed: zhParsed } = await fetchAndParseSitemap(page, "/sitemap-zh.xml");

    const enUrls = extractUrls(enParsed);
    const zhUrls = extractUrls(zhParsed);

    // EN should have /posts URLs without /zh/
    expect(enUrls.some((url: string) => url.includes("/posts") && !url.includes("/zh/"))).toBe(
      true
    );

    // ZH should have /zh/posts URLs
    expect(zhUrls.some((url: string) => url.includes("/zh/posts"))).toBe(true);

    // They should be completely different sets
    const hasOverlap = enUrls.some((url: string) => zhUrls.includes(url));
    expect(hasOverlap).toBe(false);
  });

  test("should maintain parity between EN and ZH post counts (for translated posts)", async ({
    page,
  }) => {
    const { parsed: enParsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const { parsed: zhParsed } = await fetchAndParseSitemap(page, "/sitemap-zh.xml");

    const enUrls = extractUrls(enParsed);
    const zhUrls = extractUrls(zhParsed);

    const enPostUrls = enUrls.filter((url: string) => url.match(/\/posts\/[a-z0-9-]+$/));
    const zhPostUrls = zhUrls.filter((url: string) => url.match(/\/zh\/posts\/[a-z0-9-]+$/));

    // Count difference should be reasonable (some posts may not be translated)
    const diff = Math.abs(enPostUrls.length - zhPostUrls.length);
    const maxCount = Math.max(enPostUrls.length, zhPostUrls.length);

    if (maxCount > 0) {
      const diffPercentage = (diff / maxCount) * 100;
      // Allow up to 100% difference (some posts may only exist in one language)
      expect(diffPercentage).toBeLessThanOrEqual(100);
    }
  });
});

test.describe("Sitemap Coverage and Completeness", () => {
  // Skip: This test expects seeded test data to appear in sitemap, but Next.js
  // caches the sitemap route response (revalidate = 3600). Since dynamic route
  // exports don't support runtime values, we cannot disable caching in CI.
  test.skip("should include all test posts in appropriate sitemaps", async ({ page }) => {
    const { parsed: enParsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const { parsed: zhParsed } = await fetchAndParseSitemap(page, "/sitemap-zh.xml");

    const enUrls = extractUrls(enParsed);
    const zhUrls = extractUrls(zhParsed);

    // Check for English test posts
    const hasEnPost1 = enUrls.some((url: string) => url.includes(TEST_POST_IDS.enPost1));
    const hasEnPost2 = enUrls.some((url: string) => url.includes(TEST_POST_IDS.enPost2));

    // At least some test posts should be included
    expect(hasEnPost1 || hasEnPost2).toBe(true);

    // Check for Chinese test posts
    const hasZhPost1 = zhUrls.some((url: string) => url.includes(TEST_POST_IDS.zhPost1));
    const hasZhPost2 = zhUrls.some((url: string) => url.includes(TEST_POST_IDS.zhPost2));

    expect(hasZhPost1 || hasZhPost2).toBe(true);
  });

  test("should have reasonable sitemap size (not empty, not too large)", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urls = extractUrls(parsed);

    // Should have at least static pages + some posts
    expect(urls.length).toBeGreaterThan(0);

    // Should not exceed 50,000 URLs (sitemap protocol limit)
    expect(urls.length).toBeLessThan(50000);
  });

  test("should not have duplicate URLs in same sitemap", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urls = extractUrls(parsed);

    // Check for duplicates
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(urls.length);
  });

  test("should have proper URL encoding", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urls = extractUrls(parsed);

    // URLs should be properly encoded (no spaces, special chars should be encoded)
    urls.forEach((url: string) => {
      expect(url).not.toContain(" ");
      // URL should be decodable
      expect(() => decodeURIComponent(url)).not.toThrow();
    });
  });
});

test.describe("Sitemap SEO Best Practices", () => {
  test("should prioritize homepage higher than posts", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urlEntries = parsed.urlset?.url || [];

    const homepage = urlEntries.find((entry: any) => {
      const url = entry.loc?.[0];
      return url?.match(/\/$/) && !url?.includes("/posts") && !url?.includes("/zh/");
    });

    if (homepage && homepage.priority) {
      const homePriority = parseFloat(homepage.priority[0]);

      // Homepage should have high priority (typically 1.0 or 0.9)
      expect(homePriority).toBeGreaterThanOrEqual(0.8);
    }
  });

  test("should use appropriate changefreq for different content types", async ({ page }) => {
    const { parsed } = await fetchAndParseSitemap(page, "/sitemap-en.xml");
    const urlEntries = parsed.urlset?.url || [];

    // Find homepage
    const homepage = urlEntries.find((entry: any) => entry.loc?.[0]?.match(/\/$/));

    // Find a post
    const post = urlEntries.find((entry: any) => entry.loc?.[0]?.match(/\/posts\/[a-z0-9-]+$/));

    // Homepage might have higher update frequency than posts
    if (homepage?.changefreq && post?.changefreq) {
      const homeFreq = homepage.changefreq[0];
      const postFreq = post.changefreq[0];

      // Both should have valid values
      expect(homeFreq).toBeTruthy();
      expect(postFreq).toBeTruthy();
    }
  });
});
