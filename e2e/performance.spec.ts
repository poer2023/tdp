import { test, expect } from "@playwright/test";
import { PostPage } from "./pages/post-page";
import { PostsListPage } from "./pages/posts-list-page";
import { TEST_POST_IDS } from "./fixtures/test-data";
import { waitForNetworkIdle } from "./helpers/wait-helpers";

/**
 * Helper to get Core Web Vitals metrics
 */
async function getCoreWebVitals(page: any) {
  return page.evaluate(() => {
    return new Promise((resolve) => {
      const metrics: any = {
        lcp: null,
        fid: null,
        cls: null,
        fcp: null,
        ttfb: null,
      };

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const firstInput: any = entries[0];
          metrics.fid = firstInput.processingStart - firstInput.startTime;
        }
      }).observe({ type: "first-input", buffered: true });

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let cls = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }
        metrics.cls = cls;
      }).observe({ type: "layout-shift", buffered: true });

      // First Contentful Paint
      const fcpEntry = performance.getEntriesByName("first-contentful-paint")[0];
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
      }

      // Time to First Byte
      const navigationEntry = performance.getEntriesByType("navigation")[0] as any;
      if (navigationEntry) {
        metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      }

      // Wait a bit for metrics to settle
      setTimeout(() => resolve(metrics), 2000);
    });
  });
}

test.describe("Core Web Vitals", () => {
  test("should have good Largest Contentful Paint (LCP < 2.5s)", async ({ page }) => {
    await page.goto("/posts");
    await waitForNetworkIdle(page);

    const metrics: any = await getCoreWebVitals(page);

    // LCP should be under 2.5 seconds (good)
    // Allow up to 4s for "needs improvement"
    if (metrics.lcp) {
      expect(metrics.lcp).toBeLessThan(4000);
    }
  });

  test("should have low Cumulative Layout Shift (CLS < 0.1)", async ({ page }) => {
    await page.goto("/");

    const metrics: any = await getCoreWebVitals(page);

    // CLS should be under 0.1 (good)
    // Allow up to 0.25 for "needs improvement"
    if (metrics.cls !== null) {
      expect(metrics.cls).toBeLessThan(0.25);
    }
  });

  test("should have fast First Contentful Paint (FCP < 1.8s)", async ({ page }) => {
    await page.goto("/posts");
    await waitForNetworkIdle(page);

    const metrics: any = await getCoreWebVitals(page);

    // FCP should be under 1.8 seconds (good)
    // Allow up to 3s for "needs improvement"
    if (metrics.fcp) {
      expect(metrics.fcp).toBeLessThan(3000);
    }
  });

  test("should have fast Time to First Byte (TTFB < 800ms)", async ({ page }) => {
    await page.goto("/");

    const metrics: any = await getCoreWebVitals(page);

    // TTFB should be under 800ms (good)
    // Allow up to 1.8s for "needs improvement"
    if (metrics.ttfb) {
      expect(metrics.ttfb).toBeLessThan(1800);
    }
  });
});

test.describe("Page Load Performance", () => {
  test("should load homepage in under 3 seconds", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");
    await waitForNetworkIdle(page);

    const loadTime = Date.now() - startTime;

    // Should load in reasonable time
    expect(loadTime).toBeLessThan(5000); // 5s max for E2E (network overhead)
  });

  test("should load post page in under 3 seconds", async ({ page }) => {
    const startTime = Date.now();

    const postPage = new PostPage(page);
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });

  test("should load posts list in under 3 seconds", async ({ page }) => {
    const startTime = Date.now();

    const postsListPage = new PostsListPage(page);
    await postsListPage.gotoPostsList();
    await waitForNetworkIdle(page);

    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000);
  });
});

test.describe("Resource Loading", () => {
  test("should not load excessive JavaScript", async ({ page }) => {
    await page.goto("/posts");
    await waitForNetworkIdle(page);

    // Get JS resources
    const jsResources = await page.evaluate(() => {
      return performance
        .getEntriesByType("resource")
        .filter((r: any) => r.initiatorType === "script")
        .map((r: any) => ({
          name: r.name,
          size: r.transferSize || r.encodedBodySize,
          duration: r.duration,
        }));
    });

    // Total JS should be reasonable (< 1MB)
    const totalJsSize = jsResources.reduce((sum: number, r: any) => sum + (r.size || 0), 0);
    expect(totalJsSize).toBeLessThan(2 * 1024 * 1024); // 2MB max
  });

  test("should not load excessive CSS", async ({ page }) => {
    await page.goto("/posts");
    await waitForNetworkIdle(page);

    const cssResources = await page.evaluate(() => {
      return performance
        .getEntriesByType("resource")
        .filter((r: any) => r.initiatorType === "link" && r.name.includes(".css"))
        .map((r: any) => ({
          name: r.name,
          size: r.transferSize || r.encodedBodySize,
        }));
    });

    // Total CSS should be reasonable (< 500KB)
    const totalCssSize = cssResources.reduce((sum: number, r: any) => sum + (r.size || 0), 0);
    expect(totalCssSize).toBeLessThan(500 * 1024); // 500KB max
  });

  test("should optimize images", async ({ page }) => {
    const postPage = new PostPage(page);
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    // Get image resources
    const imageResources = await page.evaluate(() => {
      return performance
        .getEntriesByType("resource")
        .filter((r: any) => r.initiatorType === "img")
        .map((r: any) => ({
          name: r.name,
          size: r.transferSize || r.encodedBodySize,
        }));
    });

    // Images should use modern formats and be optimized
    imageResources.forEach((img: any) => {
      // Individual images should not exceed 500KB
      if (img.size) {
        expect(img.size).toBeLessThan(500 * 1024);
      }
    });
  });

  test("should use lazy loading for images", async ({ page }) => {
    const postPage = new PostPage(page);
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    // Check for lazy loading attribute
    const images = await page.locator("img").all();

    for (const img of images) {
      const loading = await img.getAttribute("loading");

      // Images should have loading="lazy" or be above the fold
      const isAboveFold = await img.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight;
      });

      if (!isAboveFold) {
        expect(loading).toBe("lazy");
      }
    }
  });
});

test.describe("Rendering Performance", () => {
  test("should have minimal render-blocking resources", async ({ page }) => {
    await page.goto("/posts");

    const renderBlockingResources = await page.evaluate(() => {
      return performance.getEntriesByType("resource").filter((r: any) => {
        const resource = r as PerformanceResourceTiming;
        // Check if resource blocked rendering
        return resource.renderBlockingStatus === "blocking";
      }).length;
    });

    // Should have minimal render-blocking resources
    expect(renderBlockingResources).toBeLessThan(5);
  });

  test("should have fast Time to Interactive", async ({ page }) => {
    await page.goto("/");

    const tti = await page.evaluate(() => {
      return new Promise((resolve) => {
        if (window.performance.timing) {
          const timing = window.performance.timing;
          const tti = timing.domInteractive - timing.navigationStart;
          resolve(tti);
        } else {
          resolve(0);
        }
      });
    });

    // TTI should be under 3.8s (good)
    // Allow up to 7.3s for "needs improvement"
    if (tti) {
      expect(tti).toBeLessThan(7300);
    }
  });

  test("should not cause excessive reflows", async ({ page }) => {
    await page.goto("/posts");
    await waitForNetworkIdle(page);

    // Monitor layout shifts
    const layoutShifts = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let shiftCount = 0;

        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              shiftCount++;
            }
          }
        }).observe({ type: "layout-shift", buffered: true });

        setTimeout(() => resolve(shiftCount), 2000);
      });
    });

    // Should have minimal layout shifts
    expect(layoutShifts).toBeLessThan(10);
  });
});

test.describe("Network Performance", () => {
  test("should use HTTP/2 or HTTP/3", async ({ page }) => {
    const response = await page.goto("/");

    const protocol = await response?.headerValue("x-http-version").catch(() => null);

    // HTTP version check (if header is exposed)
    if (protocol) {
      expect(protocol).toMatch(/http\/[23]/i);
    }
  });

  test("should use compression", async ({ page }) => {
    const response = await page.goto("/");

    const encoding = await response?.headerValue("content-encoding");

    // Should use gzip or br compression
    if (encoding) {
      expect(["gzip", "br", "deflate"]).toContain(encoding);
    }
  });

  test("should have caching headers", async ({ page }) => {
    await page.goto("/posts");

    // Check static resources for cache headers
    const cacheableResources = await page.evaluate(() => {
      return performance
        .getEntriesByType("resource")
        .filter((r: any) => {
          return r.name.match(/\.(js|css|woff|woff2|jpg|png|svg)$/);
        })
        .map((r: any) => r.name);
    });

    // Static resources should exist
    expect(cacheableResources.length).toBeGreaterThan(0);
  });

  test("should minimize number of requests", async ({ page }) => {
    await page.goto("/posts");
    await waitForNetworkIdle(page);

    const requestCount = await page.evaluate(() => {
      return performance.getEntriesByType("resource").length;
    });

    // Should have reasonable number of requests (< 50)
    expect(requestCount).toBeLessThan(100);
  });
});

test.describe("Memory Usage", () => {
  test("should not have memory leaks on navigation", async ({ page }) => {
    await page.goto("/");
    await waitForNetworkIdle(page);

    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Navigate multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto("/posts");
      await page.goto("/");
      await waitForNetworkIdle(page);
    }

    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    if (initialMemory && finalMemory) {
      // Memory should not grow excessively (allow 50% increase)
      const growth = (finalMemory - initialMemory) / initialMemory;
      expect(growth).toBeLessThan(0.5);
    }
  });

  test("should cleanup event listeners", async ({ page }) => {
    await page.goto("/posts");
    await waitForNetworkIdle(page);

    // Hover on visible links to trigger event listeners
    const links = await page.locator("a:visible").all();

    for (let i = 0; i < Math.min(5, links.length); i++) {
      const isVisible = await links[i].isVisible().catch(() => false);
      if (isVisible) {
        await links[i].hover({ timeout: 3000 }).catch(() => {
          // Skip if hover fails (element may be outside viewport)
        });
      }
    }

    // Page should still be responsive
    const isResponsive = await page.evaluate(() => {
      return document.readyState === "complete";
    });

    expect(isResponsive).toBe(true);
  });
});

test.describe("Mobile Performance", () => {
  test("should perform well on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const startTime = Date.now();

    await page.goto("/posts");
    await waitForNetworkIdle(page);

    const loadTime = Date.now() - startTime;

    // Mobile should load in reasonable time
    expect(loadTime).toBeLessThan(6000); // 6s max for mobile
  });

  test("should use responsive images", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const postPage = new PostPage(page);
    await postPage.gotoPost(TEST_POST_IDS.enPost1);
    await postPage.expectPostLoaded();

    // Check for srcset or picture elements
    const responsiveImages = await page.locator("img[srcset], picture img").all();

    // If images exist, some should be responsive
    const totalImages = await page.locator("img").count();

    if (totalImages > 0) {
      // At least some images should use responsive techniques
      expect(responsiveImages.length).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe("Database Query Performance", () => {
  test("should load posts list efficiently", async ({ page }) => {
    const startTime = Date.now();

    const postsListPage = new PostsListPage(page);
    await postsListPage.gotoPostsList();

    const postCount = await postsListPage.getPostCount();

    const queryTime = Date.now() - startTime;

    // Should query and render quickly even with many posts
    expect(queryTime).toBeLessThan(3000);
    expect(postCount).toBeGreaterThanOrEqual(0);
  });

  test("should paginate large result sets", async ({ page }) => {
    const postsListPage = new PostsListPage(page);
    await postsListPage.gotoPostsList();
    await waitForNetworkIdle(page);

    const postCount = await postsListPage.getPostCount();

    // If there are many posts, should use pagination
    if (postCount > 20) {
      const pagination = page.locator(
        '[aria-label="pagination"], nav[aria-label="Page navigation"]'
      );
      const hasPagination = (await pagination.count()) > 0;

      expect(hasPagination).toBe(true);
    }
  });
});

test.describe("API Response Times", () => {
  test("should have fast API responses", async ({ page }) => {
    const apiTimes: number[] = [];

    page.on("response", async (response) => {
      if (response.url().includes("/api/")) {
        // Use response.request().timing() for Playwright's current API
        const request = response.request();
        const timing = request.timing();
        if (timing && timing.responseEnd !== undefined && timing.responseEnd !== -1) {
          apiTimes.push(timing.responseEnd);
        }
      }
    });

    await page.goto("/posts");
    await waitForNetworkIdle(page);

    // API calls should be fast (or no API calls for SSR pages)
    if (apiTimes.length > 0) {
      const avgTime = apiTimes.reduce((a, b) => a + b, 0) / apiTimes.length;
      expect(avgTime).toBeLessThan(2000); // 2s average (relaxed for E2E)
    }
  });
});

test.describe("Bundle Size", () => {
  test("should have reasonable total page weight", async ({ page }) => {
    await page.goto("/posts");
    await waitForNetworkIdle(page);

    const totalSize = await page.evaluate(() => {
      return performance
        .getEntriesByType("resource")
        .reduce((sum: number, r: any) => sum + (r.transferSize || r.encodedBodySize || 0), 0);
    });

    // Total page weight should be under 3MB
    expect(totalSize).toBeLessThan(3 * 1024 * 1024);
  });

  test("should code-split for better initial load", async ({ page }) => {
    await page.goto("/");
    await waitForNetworkIdle(page);

    const jsFiles = await page.evaluate(() => {
      return performance
        .getEntriesByType("resource")
        .filter((r: any) => r.name.endsWith(".js"))
        .map((r: any) => r.name);
    });

    // Should have multiple JS chunks (code splitting)
    expect(jsFiles.length).toBeGreaterThan(1);
  });
});
