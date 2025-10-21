/**
 * GitHub API Client
 * Provides methods to fetch GitHub user data, repositories, commits, and contribution graphs
 */

import type { GitHubUser, GitHubRepo, GitHubCommit, ContributionDay } from "@/types/github-data";

export interface GitHubClientConfig {
  token: string;
  username?: string; // Optional: if not provided, will fetch authenticated user
}

export class GitHubClient {
  private token: string;
  private username: string | null = null;
  private baseUrl = "https://api.github.com";

  constructor(config: GitHubClientConfig) {
    this.token = config.token;
    this.username = config.username || null;
  }

  /**
   * Make authenticated request to GitHub API
   */
  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/vnd.github.v3+json",
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`GitHub API Error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get authenticated user information
   * Used for validation and to get username if not provided
   */
  async getUser(): Promise<GitHubUser> {
    const user = await this.fetch<GitHubUser>("/user");
    if (!this.username) {
      this.username = user.login;
    }
    return user;
  }

  /**
   * Get user's repositories
   */
  async getRepositories(
    options: {
      page?: number;
      perPage?: number;
      sort?: "created" | "updated" | "pushed" | "full_name";
    } = {}
  ): Promise<GitHubRepo[]> {
    const { page = 1, perPage = 30, sort = "updated" } = options;
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      sort,
      direction: "desc",
    });

    return this.fetch<GitHubRepo[]>(`/user/repos?${params}`);
  }

  /**
   * Get commits for a specific repository
   */
  async getRepoCommits(
    owner: string,
    repo: string,
    options: { since?: string; until?: string; perPage?: number } = {}
  ): Promise<GitHubCommit[]> {
    const { since, until, perPage = 100 } = options;
    const params = new URLSearchParams({
      per_page: perPage.toString(),
    });

    if (since) params.append("since", since);
    if (until) params.append("until", until);

    return this.fetch<GitHubCommit[]>(`/repos/${owner}/${repo}/commits?${params}`);
  }

  /**
   * Get user's total commit count for a time period
   * Note: This uses the search API which has stricter rate limits
   */
  async getCommitCount(options: { since?: Date; until?: Date } = {}): Promise<number> {
    const { since, until } = options;
    const username = this.username || (await this.getUser()).login;

    const query = [`author:${username}`];
    if (since) query.push(`committer-date:>=${since.toISOString().split("T")[0]}`);
    if (until) query.push(`committer-date:<=${until.toISOString().split("T")[0]}`);

    const params = new URLSearchParams({
      q: query.join(" "),
      per_page: "1",
    });

    const result = await this.fetch<{ total_count: number }>(`/search/commits?${params}`, {
      headers: { Accept: "application/vnd.github.cloak-preview+json" },
    });

    return result.total_count;
  }

  /**
   * Get user's pull requests
   */
  async getPullRequests(
    options: {
      state?: "open" | "closed" | "all";
      since?: Date;
    } = {}
  ): Promise<number> {
    const { state = "all", since } = options;
    const username = this.username || (await this.getUser()).login;

    const query = [`is:pr`, `author:${username}`];
    if (state !== "all") query.push(`is:${state}`);
    if (since) query.push(`created:>=${since.toISOString().split("T")[0]}`);

    const params = new URLSearchParams({
      q: query.join(" "),
      per_page: "1",
    });

    const result = await this.fetch<{ total_count: number }>(`/search/issues?${params}`);
    return result.total_count;
  }

  /**
   * Get user's total stars received
   */
  async getTotalStars(): Promise<number> {
    const repos = await this.getRepositories({ perPage: 100 });
    return repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  }

  /**
   * Get contribution graph using GraphQL API
   * Returns daily contribution counts for the past year
   */
  async getContributionGraph(): Promise<ContributionDay[]> {
    const username = this.username || (await this.getUser()).login;

    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables: { username } }),
    });

    if (!response.ok) {
      throw new Error(`GitHub GraphQL Error: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GitHub GraphQL Error: ${result.errors[0].message}`);
    }

    const weeks = result.data.user.contributionsCollection.contributionCalendar.weeks;
    const days: ContributionDay[] = [];

    for (const week of weeks) {
      for (const day of week.contributionDays) {
        days.push({
          date: new Date(day.date),
          value: day.contributionCount,
        });
      }
    }

    return days;
  }

  /**
   * Get current streak (consecutive days with contributions)
   */
  async getCurrentStreak(): Promise<number> {
    const contributions = await this.getContributionGraph();

    // Sort by date descending
    const sorted = contributions.sort((a, b) => b.date.getTime() - a.date.getTime());

    let streak = 0;
    for (const day of sorted) {
      if (day.value > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Get active repositories (with commits in the last 30 days)
   */
  async getActiveRepositories(limit: number = 5): Promise<GitHubRepo[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const repos = await this.getRepositories({ perPage: 100, sort: "pushed" });

    return repos
      .filter((repo) => {
        const pushedAt = new Date(repo.pushed_at || 0);
        return pushedAt >= thirtyDaysAgo;
      })
      .slice(0, limit);
  }
}

/**
 * Validate GitHub Personal Access Token
 */
export async function validateGitHubToken(token: string): Promise<{
  isValid: boolean;
  username?: string;
  error?: string;
}> {
  try {
    const client = new GitHubClient({ token });
    const user = await client.getUser();

    return {
      isValid: true,
      username: user.login,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
