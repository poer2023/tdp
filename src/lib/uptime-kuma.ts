/**
 * Uptime Kuma API Integration
 *
 * This module provides integration with Uptime Kuma monitoring service.
 * It fetches monitor data and heartbeats from Uptime Kuma API.
 */

const UPTIME_KUMA_BASE_URL = process.env.UPTIME_KUMA_URL || "";
const UPTIME_KUMA_API_KEY = process.env.UPTIME_KUMA_API_KEY || "";

export interface UptimeKumaMonitor {
  id: number;
  name: string;
  url: string;
  type: string;
  interval: number;
  active: boolean;
  description?: string;
}

export interface UptimeKumaHeartbeat {
  monitorID: number;
  status: 0 | 1 | 2; // 0: down, 1: up, 2: pending
  time: string;
  msg: string;
  ping: number | null;
  important: boolean;
  duration: number;
}

export interface MonitorStats {
  uptime_24h: number;
  uptime_30d: number;
  avg_ping: number;
  status: "up" | "down" | "pending";
}

/**
 * Fetch all monitors from Uptime Kuma
 */
export async function fetchMonitors(): Promise<UptimeKumaMonitor[]> {
  try {
    const response = await fetch(`${UPTIME_KUMA_BASE_URL}/api/monitors`, {
      headers: {
        Authorization: `Bearer ${UPTIME_KUMA_API_KEY}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 0 }, // Don't cache
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch monitors: ${response.statusText}`);
    }

    const data = await response.json();
    return data.monitors || [];
  } catch (error) {
    console.error("Error fetching Uptime Kuma monitors:", error);
    throw error;
  }
}

/**
 * Fetch heartbeats for a specific monitor
 */
export async function fetchMonitorHeartbeats(
  monitorId: number,
  limit: number = 100
): Promise<UptimeKumaHeartbeat[]> {
  try {
    const response = await fetch(
      `${UPTIME_KUMA_BASE_URL}/api/monitors/${monitorId}/heartbeats?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${UPTIME_KUMA_API_KEY}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch heartbeats: ${response.statusText}`);
    }

    const data = await response.json();
    return data.heartbeats || [];
  } catch (error) {
    console.error(`Error fetching heartbeats for monitor ${monitorId}:`, error);
    throw error;
  }
}

/**
 * Fetch monitor statistics (uptime and performance)
 */
export async function fetchMonitorStats(monitorId: number): Promise<MonitorStats | null> {
  try {
    const response = await fetch(`${UPTIME_KUMA_BASE_URL}/api/monitors/${monitorId}/stats`, {
      headers: {
        Authorization: `Bearer ${UPTIME_KUMA_API_KEY}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.warn(`Failed to fetch stats for monitor ${monitorId}`);
      return null;
    }

    const data = await response.json();
    return data.stats || null;
  } catch (error) {
    console.error(`Error fetching stats for monitor ${monitorId}:`, error);
    return null;
  }
}

/**
 * Map Uptime Kuma status to our MonitorStatus enum
 */
export function mapUptimeKumaStatus(status: 0 | 1 | 2): "UP" | "DOWN" | "PENDING" {
  switch (status) {
    case 1:
      return "UP";
    case 0:
      return "DOWN";
    case 2:
      return "PENDING";
    default:
      return "PENDING";
  }
}

/**
 * Map Uptime Kuma monitor type to our MonitorType enum
 */
export function mapMonitorType(type: string): "HTTP" | "TCP" | "PING" | "DNS" | "KEYWORD" {
  const typeUpper = type.toUpperCase();
  if (["HTTP", "TCP", "PING", "DNS", "KEYWORD"].includes(typeUpper)) {
    return typeUpper as "HTTP" | "TCP" | "PING" | "DNS" | "KEYWORD";
  }
  return "HTTP"; // Default to HTTP
}

/**
 * Validate Uptime Kuma connection
 */
export async function validateConnection(): Promise<boolean> {
  if (!UPTIME_KUMA_BASE_URL || !UPTIME_KUMA_API_KEY) {
    console.warn("Uptime Kuma credentials not configured");
    return false;
  }

  try {
    const response = await fetch(`${UPTIME_KUMA_BASE_URL}/api/health`, {
      headers: {
        Authorization: `Bearer ${UPTIME_KUMA_API_KEY}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to validate Uptime Kuma connection:", error);
    return false;
  }
}
