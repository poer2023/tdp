#!/usr/bin/env node

/**
 * Health check script for Docker container
 * Uses Node.js built-in fetch to check /api/health endpoint
 */

const HEALTH_URL = "http://127.0.0.1:3000/api/health";
const TIMEOUT = 5000;

async function healthCheck() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await fetch(HEALTH_URL, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      process.exit(0);
    } else {
      console.error(`Health check failed with status: ${response.status}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Health check error: ${error.message}`);
    process.exit(1);
  }
}

healthCheck();
