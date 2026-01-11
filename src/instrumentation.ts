/**
 * Next.js Instrumentation - runs once on server startup
 * 
 * This file is used for one-time startup tasks like database migrations.
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
    // Only run on Node.js server (not edge runtime)
    if (process.env.NEXT_RUNTIME === "nodejs") {
        // Dynamic import to avoid bundling node-only modules in edge
        const { runStartupMigrations } = await import("./lib/startup-migrations");
        // Run migrations asynchronously to not block startup
        runStartupMigrations().catch(console.error);
    }
}
