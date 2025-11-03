#!/usr/bin/env node

/**
 * Coverage Summary Script
 * Generates a human-readable coverage summary from vitest coverage reports
 */

const fs = require("fs");
const path = require("path");

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function getStatusColor(percentage, threshold) {
  if (percentage >= threshold) return "green";
  if (percentage >= threshold - 5) return "yellow";
  return "red";
}

function getStatusIcon(percentage, threshold) {
  if (percentage >= threshold) return "✅";
  if (percentage >= threshold - 5) return "⚠️";
  return "❌";
}

function formatPercentage(value, threshold) {
  const color = getStatusColor(value, threshold);
  const icon = getStatusIcon(value, threshold);
  return `${icon} ${colorize(value.toFixed(2) + "%", color)} (threshold: ${threshold}%)`;
}

function generateSummary() {
  const coveragePath = path.join(process.cwd(), "coverage", "coverage-summary.json");

  if (!fs.existsSync(coveragePath)) {
    console.error(colorize("❌ Coverage report not found", "red"));
    console.error(colorize("💡 Run: npm run test:coverage", "yellow"));
    process.exit(1);
  }

  const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"));
  const total = coverage.total;

  // Define thresholds
  const thresholds = {
    lines: 75,
    functions: 70,
    branches: 70,
    statements: 75,
  };

  console.log("\n" + colorize("═══════════════════════════════════════════════", "cyan"));
  console.log(colorize("📊 TEST COVERAGE SUMMARY", "cyan", "bold"));
  console.log(colorize("═══════════════════════════════════════════════", "cyan"));
  console.log("");

  let allPassed = true;

  // Check each metric
  const metrics = ["lines", "functions", "branches", "statements"];
  metrics.forEach((metric) => {
    const value = total[metric].pct;
    const threshold = thresholds[metric];
    const passed = value >= threshold;

    if (!passed) allPassed = false;

    const label = metric.charAt(0).toUpperCase() + metric.slice(1).padEnd(11);
    console.log(`${label}: ${formatPercentage(value, threshold)}`);
  });

  console.log("");
  console.log(colorize("═══════════════════════════════════════════════", "cyan"));

  if (allPassed) {
    console.log(colorize("✅ ALL COVERAGE THRESHOLDS MET!", "green", "bold"));
  } else {
    console.log(colorize("❌ COVERAGE THRESHOLDS NOT MET", "red", "bold"));
    console.log("");
    console.log(colorize("💡 Tip: View detailed coverage report:", "yellow"));
    console.log(colorize("   open coverage/index.html", "yellow"));
  }

  console.log(colorize("═══════════════════════════════════════════════", "cyan"));
  console.log("");

  // Write badge data for CI
  const badgeData = {
    schemaVersion: 1,
    label: "coverage",
    message: `${total.lines.pct.toFixed(1)}%`,
    color: allPassed ? "green" : total.lines.pct >= 70 ? "yellow" : "red",
  };

  const badgePath = path.join(process.cwd(), "coverage", "badge.json");
  fs.writeFileSync(badgePath, JSON.stringify(badgeData, null, 2));

  // Exit with error if thresholds not met
  process.exit(allPassed ? 0 : 1);
}

// Run the summary
generateSummary();
