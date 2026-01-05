import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Cloudflare API Configuration
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    // Calculate date range
    const now = new Date();
    let daysBack = 30;
    if (period === "7d") daysBack = 7;
    else if (period === "90d") daysBack = 90;
    else if (period === "all") daysBack = 365;

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = now.toISOString().split("T")[0];

    // If no Cloudflare credentials, return empty data with error message
    if (!CF_API_TOKEN || !CF_ZONE_ID) {
      console.warn("Cloudflare API credentials not configured");
      return NextResponse.json({
        trafficData: [],
        sourceData: [],
        pageVisitData: [],
        deviceData: [],
        error: "Cloudflare API not configured. Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID environment variables.",
      });
    }

    // GraphQL query for Cloudflare Analytics API
    // Using httpRequests1dGroups for daily aggregated data
    const query = `
      query GetZoneAnalytics($zoneTag: string!, $since: Date!, $until: Date!) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            httpRequests1dGroups(
              filter: { date_geq: $since, date_leq: $until }
              limit: 120
              orderBy: [date_ASC]
            ) {
              dimensions {
                date
              }
              sum {
                pageViews
                requests
              }
              uniq {
                uniques
              }
            }
          }
        }
      }
    `;

    const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          zoneTag: CF_ZONE_ID,
          since: startDateStr,
          until: endDateStr,
        },
      }),
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("Cloudflare API returned non-JSON:", responseText.substring(0, 500));
      return NextResponse.json(
        { error: "Invalid response from Cloudflare API" },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error("Cloudflare API HTTP error:", response.status, data);
      return NextResponse.json(
        { error: `Cloudflare API error: ${response.status}` },
        { status: 500 }
      );
    }

    if (data.errors && data.errors.length > 0) {
      console.error("Cloudflare GraphQL errors:", JSON.stringify(data.errors, null, 2));
      return NextResponse.json(
        {
          error: data.errors[0]?.message || "GraphQL error",
          details: data.errors
        },
        { status: 500 }
      );
    }

    const zone = data.data?.viewer?.zones?.[0];
    if (!zone) {
      console.log("No zone data found, returning empty arrays");
      return NextResponse.json({
        trafficData: [],
        sourceData: [],
        pageVisitData: [],
        deviceData: [],
      });
    }

    // Transform daily traffic data
    const trafficData = (zone.httpRequests1dGroups || []).map((day: {
      dimensions: { date: string };
      sum: { pageViews: number; requests: number };
      uniq: { uniques: number };
    }) => ({
      date: day.dimensions.date,
      visits: day.sum?.pageViews || 0,
      unique: day.uniq?.uniques || 0,
    }));

    // For source data (referrers), page visits, and device data,
    // we need separate queries or use different datasets
    // For now, return simulated/placeholder data based on totals
    const totalPageViews = trafficData.reduce((sum: number, d: { visits: number }) => sum + d.visits, 0);
    const totalUniques = trafficData.reduce((sum: number, d: { unique: number }) => sum + d.unique, 0);

    // Placeholder source data (Cloudflare requires Pro plan or higher for detailed breakdowns)
    const sourceData = [
      { name: "Direct", value: Math.round(totalPageViews * 0.4), color: "#3b82f6" },
      { name: "Google", value: Math.round(totalPageViews * 0.25), color: "#10b981" },
      { name: "Social", value: Math.round(totalPageViews * 0.15), color: "#f59e0b" },
      { name: "Referral", value: Math.round(totalPageViews * 0.2), color: "#8b5cf6" },
    ].filter(s => s.value > 0);

    // Placeholder page visit data
    const pageVisitData = [
      { path: "/", title: "Home", visits: Math.round(totalPageViews * 0.3) },
      { path: "/blog", title: "Blog", visits: Math.round(totalPageViews * 0.2) },
      { path: "/about", title: "About", visits: Math.round(totalPageViews * 0.15) },
      { path: "/moments", title: "Moments", visits: Math.round(totalPageViews * 0.1) },
      { path: "/gallery", title: "Gallery", visits: Math.round(totalPageViews * 0.1) },
    ].filter(p => p.visits > 0);

    // Placeholder device data
    const deviceData = [
      { name: "Desktop", value: 55, color: "#3b82f6" },
      { name: "Mobile", value: 40, color: "#10b981" },
      { name: "Tablet", value: 5, color: "#f59e0b" },
    ];

    return NextResponse.json({
      trafficData,
      sourceData,
      pageVisitData,
      deviceData,
      meta: {
        totalPageViews,
        totalUniques,
        period,
        startDate: startDateStr,
        endDate: endDateStr,
      }
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error", details: message },
      { status: 500 }
    );
  }
}
