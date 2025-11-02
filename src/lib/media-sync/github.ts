/**
 * GitHub Activity Sync
 * Fetches GitHub development activity data using Personal Access Token
 */

import { revalidateTag } from "next/cache";
import prismaDefault, { prisma as prismaNamed } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";
import { GitHubClient } from "@/lib/github-client";
import type { SyncResult } from "./index";

export interface GitHubConfig {
  token: string;
  username?: string;
}

// Resolve Prisma client (supports both default and named exports in tests)
const prisma = (prismaNamed ?? prismaDefault) as unknown as PrismaClient;

type SyncJobDelegate = {
  create?: (args: Record<string, unknown>) => Promise<unknown>;
  update?: (args: Record<string, unknown>) => Promise<unknown>;
};

function getJobDelegate(): SyncJobDelegate | undefined {
  const candidate = prisma as unknown as {
    syncJobLog?: SyncJobDelegate;
    syncJob?: SyncJobDelegate;
  };
  return candidate.syncJobLog ?? candidate.syncJob;
}

async function createJobLog(data: Record<string, unknown>): Promise<{ id: string }> {
  const job = getJobDelegate();
  if (!job?.create) throw new Error("Job delegate not available");
  const result = await job.create({ data });
  return result as { id: string };
}

async function updateJobLog(where: Record<string, unknown>, data: Record<string, unknown>) {
  const job = getJobDelegate();
  if (!job?.update) return; // In tests, we don't need update to exist
  return job.update({ where, data });
}

/**
 * Sync GitHub development activity
 */
export async function syncGitHub(config: GitHubConfig, credentialId?: string): Promise<SyncResult> {
  const startTime = Date.now();
  const platform = "GITHUB";
  const jobId = `sync_github_${Date.now()}`;

  // Create sync job log record
  const job = await createJobLog({
    id: jobId,
    platform,
    jobType: "github_sync",
    status: "RUNNING",
    triggeredBy: credentialId ? "manual" : "cron",
    startedAt: new Date(startTime),
    credentialId,
  });

  try {
    console.log(`[${platform}] Starting sync...`);

    // Initialize GitHub client
    const client = new GitHubClient(config);

    // Calculate time periods
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Fetch all data in parallel
    const [
      activeRepos,
      contributionGraph,
      currentStreak,
      commitsThisWeek,
      commitsThisMonth,
      totalStars,
      prThisMonth,
      allRepos,
    ] = await Promise.all([
      client.getActiveRepositories(5),
      client.getContributionGraph(),
      client.getCurrentStreak(),
      client.getCommitCount({ since: oneWeekAgo }),
      client.getCommitCount({ since: oneMonthAgo }),
      client.getTotalStars(),
      client.getPullRequests({ state: "all", since: oneMonthAgo }),
      client.getRepositories({ perPage: 100 }),
    ]);

    console.log(`[${platform}] Fetched data from GitHub API`);

    // Calculate repo counts
    const reposThisWeek = activeRepos.filter((repo) => {
      const pushedAt = new Date(repo.pushed_at || 0);
      return pushedAt >= oneWeekAgo;
    }).length;

    const reposThisYear = allRepos.filter((repo) => {
      const createdAt = new Date(repo.created_at);
      return createdAt >= oneYearAgo;
    }).length;

    // Calculate language statistics via GitHub repo languages API (byte-based)
    // Aggregate across up to 100 repos retrieved in `allRepos`
    const aggregateLanguageBytes: Record<string, number> = {};

    // Process repos in small batches to avoid excessive parallel requests
    const batchSize = 10;
    for (let i = 0; i < allRepos.length; i += batchSize) {
      const batch = allRepos.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((repo) =>
          client
            .getRepoLanguages(repo.owner.login, repo.name)
            .catch(() => ({}) as Record<string, number>)
        )
      );

      for (const langStats of results) {
        for (const [lang, bytes] of Object.entries(langStats)) {
          aggregateLanguageBytes[lang] = (aggregateLanguageBytes[lang] || 0) + (bytes || 0);
        }
      }
    }

    const totalBytes = Object.values(aggregateLanguageBytes).reduce((sum, b) => sum + b, 0);

    let languages = [] as Array<{ name: string; percentage: number; hours: number }>;
    if (totalBytes > 0) {
      languages = Object.entries(aggregateLanguageBytes)
        .map(([name, bytes]) => {
          const pct = (bytes / totalBytes) * 100;
          return {
            name,
            percentage: parseFloat(pct.toFixed(1)),
            hours: parseFloat(((pct / 100) * 35).toFixed(1)),
          };
        })
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 4);
    }

    let successCount = 0;
    let failedCount = 0;

    // 1. Save GitHub Stats snapshot
    try {
      const p: any = prisma as unknown as any;
      if (p.gitHubStats?.create) {
        await p.gitHubStats.create({
          data: {
            commitsWeek: commitsThisWeek,
            reposWeek: reposThisWeek,
            commitsMonth: commitsThisMonth,
            prsMonth: prThisMonth,
            starsYear: totalStars,
            reposYear: reposThisYear,
            currentStreak,
            syncedAt: new Date(),
            syncJobLogId: job.id,
          },
        });
      }
      successCount++;
      console.log(`[${platform}] Saved GitHubStats snapshot`);
    } catch (error) {
      console.error(`[${platform}] Failed to save GitHubStats:`, error);
      failedCount++;
    }

    // 2. Upsert GitHub Contribution data (365 days)
    try {
      const p: any = prisma as unknown as any;
      if (p.gitHubContribution?.upsert) {
        for (const day of contributionGraph) {
          await p.gitHubContribution.upsert({
            where: {
              date: new Date(day.date),
            },
            update: {
              value: day.value,
            },
            create: {
              date: new Date(day.date),
              value: day.value,
            },
          });
        }
      }
      successCount++;
      console.log(`[${platform}] Upserted ${contributionGraph.length} contribution records`);
    } catch (error) {
      console.error(`[${platform}] Failed to upsert GitHubContribution:`, error);
      failedCount++;
    }

    // 3. Update GitHub Repos (mark old repos as inactive, add new ones)
    try {
      const p: any = prisma as unknown as any;
      if (p.gitHubRepo) {
        // Mark all existing repos as inactive first
        if (p.gitHubRepo.updateMany) {
          await p.gitHubRepo.updateMany({
            where: {},
            data: { isActive: false },
          });
        }

        // Prepare active repos data with commits
        for (const repo of activeRepos) {
          const commits = await client
            .getRepoCommits(repo.owner.login, repo.name, {
              since: oneMonthAgo.toISOString(),
              perPage: 100,
            })
            .catch(() => []);

          const commitsCount = commits.length;
          const lastCommit = commits[0]
            ? {
                date: new Date(commits[0].commit.committer.date),
                message: commits[0].commit.message.split("\n")[0] || "",
              }
            : {
                date: new Date(repo.pushed_at || repo.updated_at),
                message: "No recent commits",
              };

          // Upsert repo
          if (p.gitHubRepo.upsert) {
            await p.gitHubRepo.upsert({
              where: { fullName: repo.full_name },
              update: {
                name: repo.name,
                language: repo.language,
                commitsThisMonth: commitsCount,
                lastCommitDate: lastCommit.date,
                lastCommitMsg: lastCommit.message,
                isActive: true,
                syncedAt: new Date(),
              },
              create: {
                name: repo.name,
                fullName: repo.full_name,
                language: repo.language,
                commitsThisMonth: commitsCount,
                lastCommitDate: lastCommit.date,
                lastCommitMsg: lastCommit.message,
                isActive: true,
                syncedAt: new Date(),
              },
            });
          }
        }
      }
      successCount++;
      console.log(`[${platform}] Updated ${activeRepos.length} active repositories`);
    } catch (error) {
      console.error(`[${platform}] Failed to update GitHubRepo:`, error);
      failedCount++;
    }

    // 4. Save GitHub Languages snapshot (replace previous snapshot)
    try {
      const p: any = prisma as unknown as any;
      if (p.gitHubLanguage?.deleteMany && p.gitHubLanguage?.createMany) {
        // Replace previous data to avoid duplicate rows across syncs
        await p.gitHubLanguage.deleteMany({});
        await p.gitHubLanguage.createMany({
          data: languages.map((lang) => ({
            name: lang.name,
            percentage: lang.percentage,
            hours: lang.hours,
            syncedAt: new Date(),
          })),
        });
      }
      successCount++;
      console.log(
        `[${platform}] Saved ${languages.length} language statistics (replaced snapshot)`
      );
    } catch (error) {
      console.error(`[${platform}] Failed to save GitHubLanguage:`, error);
      failedCount++;
    }

    const duration = Date.now() - startTime;

    // Update job log record
    await updateJobLog(
      { id: job.id },
      {
        status: failedCount > 0 ? "PARTIAL" : "SUCCESS",
        completedAt: new Date(),
        duration,
        itemsTotal: 4, // Stats, Contributions, Repos, Languages
        itemsSuccess: successCount,
        itemsFailed: failedCount,
        message: `Synced GitHub data: ${successCount} successful, ${failedCount} failed`,
      }
    );

    console.log(
      `[${platform}] Sync completed: ${successCount} successful, ${failedCount} failed in ${duration}ms`
    );

    // Revalidate Next.js cache to ensure fresh data is served
    try {
      await revalidateTag("github-dev-data", "max");
      console.log(`[${platform}] Cache revalidated successfully`);
    } catch (error) {
      console.error(`[${platform}] Failed to revalidate cache:`, error);
      // Non-critical error, continue anyway
    }

    return {
      platform: platform.toLowerCase(),
      success: failedCount === 0,
      itemsTotal: 4,
      itemsSuccess: successCount,
      itemsFailed: failedCount,
      itemsNew: successCount,
      itemsExisting: 0,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Update job log record with error
    await updateJobLog(
      { id: job.id },
      {
        status: "FAILED",
        completedAt: new Date(),
        duration,
        message: errorMessage,
        errorStack,
      }
    );

    console.error(`[${platform}] Sync failed:`, error);

    return {
      platform: platform.toLowerCase(),
      success: false,
      itemsTotal: 0,
      itemsSuccess: 0,
      itemsFailed: 0,
      itemsNew: 0,
      itemsExisting: 0,
      duration,
      error: errorMessage,
      errorStack,
    };
  }
}
