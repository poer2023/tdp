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

interface CloudflarePageView {
    sum: {
        pageViews: number;
        requests: number;
        visits: number;
    };
    uniq: {
        uniques: number;
    };
    dimensions: {
        date: string;
    };
}

interface CloudflareTopPath {
    sum: {
        pageViews: number;
    };
    dimensions: {
        requestPath: string;
    };
}

interface CloudflareReferer {
    sum: {
        pageViews: number;
    };
    dimensions: {
        refererHost: string;
    };
}

interface CloudflareDevice {
    sum: {
        pageViews: number;
    };
    dimensions: {
        deviceType: string;
    };
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

        // If no Cloudflare credentials, return empty data
        if (!CF_API_TOKEN || !CF_ZONE_ID) {
            console.warn("Cloudflare API credentials not configured");
            return NextResponse.json({
                trafficData: [],
                sourceData: [],
                pageVisitData: [],
                deviceData: [],
                error: "Cloudflare API not configured. Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID.",
            });
        }

        // GraphQL query for Cloudflare Web Analytics
        const query = `
      query WebAnalytics($zoneTag: String!, $start: String!, $end: String!) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            # Daily traffic data
            httpRequests1dGroups(
              filter: { date_geq: $start, date_leq: $end }
              limit: 120
              orderBy: [date_ASC]
            ) {
              sum {
                pageViews
                requests
                visits
              }
              uniq {
                uniques
              }
              dimensions {
                date
              }
            }
            # Top pages
            httpRequestsAdaptiveGroups(
              filter: { date_geq: $start, date_leq: $end }
              limit: 50
              orderBy: [sum_pageViews_DESC]
            ) {
              sum {
                pageViews
              }
              dimensions {
                requestPath: clientRequestPath
              }
            }
            # Referers (sources)
            httpRequestsAdaptiveGroups(
              filter: { date_geq: $start, date_leq: $end, refererHost_neq: "" }
              limit: 20
              orderBy: [sum_pageViews_DESC]
            ) {
              sum {
                pageViews
              }
              dimensions {
                refererHost
              }
            }
            # Device types
            httpRequestsAdaptiveGroups(
              filter: { date_geq: $start, date_leq: $end }
              limit: 10
              orderBy: [sum_pageViews_DESC]
            ) {
              sum {
                pageViews
              }
              dimensions {
                deviceType
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
                    start: startDateStr,
                    end: endDateStr,
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Cloudflare API error:", errorText);
            return NextResponse.json(
                { error: "Failed to fetch from Cloudflare API" },
                { status: 500 }
            );
        }

        const data = await response.json();

        if (data.errors) {
            console.error("Cloudflare GraphQL errors:", data.errors);
            return NextResponse.json(
                { error: data.errors[0]?.message || "GraphQL error" },
                { status: 500 }
            );
        }

        const zone = data.data?.viewer?.zones?.[0];
        if (!zone) {
            return NextResponse.json({
                trafficData: [],
                sourceData: [],
                pageVisitData: [],
                deviceData: [],
                error: "No data found for this zone",
            });
        }

        // Transform traffic data
        const trafficData = (zone.httpRequests1dGroups || []).map((day: CloudflarePageView) => ({
            date: day.dimensions.date,
            visits: day.sum.pageViews || 0,
            unique: day.uniq.uniques || 0,
        }));

        // Transform page visit data
        const pageVisitData = (zone.httpRequestsAdaptiveGroups || [])
            .filter((p: CloudflareTopPath) => p.dimensions.requestPath)
            .slice(0, 50)
            .map((page: CloudflareTopPath) => ({
                path: page.dimensions.requestPath,
                title: page.dimensions.requestPath,
                visits: page.sum.pageViews,
            }));

        // Transform source data (referers)
        const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];
        const refererData = (zone.httpRequestsAdaptiveGroups || [])
            .filter((r: CloudflareReferer) => r.dimensions.refererHost)
            .slice(0, 10);

        const sourceData = refererData.map((source: CloudflareReferer, i: number) => ({
            name: source.dimensions.refererHost || "Direct",
            value: source.sum.pageViews,
            color: colors[i % colors.length],
        }));

        // Transform device data
        const deviceColors: Record<string, string> = {
            desktop: "#3b82f6",
            mobile: "#10b981",
            tablet: "#f59e0b",
            bot: "#9ca3af",
            unknown: "#d1d5db",
        };

        const deviceGroups = (zone.httpRequestsAdaptiveGroups || [])
            .filter((d: CloudflareDevice) => d.dimensions.deviceType);

        const totalDeviceViews = deviceGroups.reduce((sum: number, d: CloudflareDevice) => sum + d.sum.pageViews, 0);

        const deviceData = deviceGroups.map((device: CloudflareDevice) => ({
            name: device.dimensions.deviceType.charAt(0).toUpperCase() + device.dimensions.deviceType.slice(1),
            value: totalDeviceViews > 0 ? Math.round((device.sum.pageViews / totalDeviceViews) * 100) : 0,
            color: deviceColors[device.dimensions.deviceType.toLowerCase()] || "#9ca3af",
        }));

        return NextResponse.json({
            trafficData,
            sourceData,
            pageVisitData,
            deviceData,
        });
    } catch (error) {
        console.error("Analytics API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
