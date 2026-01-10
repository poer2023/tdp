import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  output: "standalone",
  // Disable turbopack when running bundle analysis (webpack required)
  ...(process.env.ANALYZE !== "true" && {
    turbopack: {
      root: __dirname,
    },
  }),
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    globalNotFound: true,
  },
  images: {
    // Optimized sizes for mobile-first: includes 360/414/480 for small screens
    deviceSizes: [360, 414, 480, 640, 828, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    qualities: [75, 80],
    unoptimized: false,
    loader: "custom",
    loaderFile: "./image-loader.ts",
    localPatterns: [
      {
        pathname: "/api/image-proxy",
        search: "",
      },
      {
        pathname: "/api/uploads/**",
        search: "",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "**",
      },
      // Bilibili image CDN (supports both HTTP and HTTPS)
      {
        protocol: "http",
        hostname: "i0.hdslb.com",
        pathname: "**",
      },
      {
        protocol: "http",
        hostname: "i1.hdslb.com",
        pathname: "**",
      },
      {
        protocol: "http",
        hostname: "i2.hdslb.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "i0.hdslb.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "i1.hdslb.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "i2.hdslb.com",
        pathname: "**",
      },
      // Douban image CDN
      {
        protocol: "https",
        hostname: "img1.doubanio.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "img2.doubanio.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "img3.doubanio.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "img9.doubanio.com",
        pathname: "**",
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        // Limit powerful features by default; extend if needed
        value: "geolocation=(self), camera=(), microphone=(), autoplay=()",
      },
    ];

    // Apply HSTS only for production (avoid polluting localhost)
    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }

    return [
      {
        // Apply to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ];
  },
  /* config options here */
};

export default withBundleAnalyzer(nextConfig);
