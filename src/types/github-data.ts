/**
 * GitHub API Data Types
 */

export interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  name: string | null;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
  };
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    id: number;
  } | null;
  committer: {
    login: string;
    id: number;
  } | null;
}

export interface ContributionDay {
  date: Date;
  value: number;
}

/**
 * Normalized GitHub statistics for frontend display
 */
export interface GitHubStats {
  thisWeek: {
    commits: number;
    repos: number;
  };
  thisMonth: {
    commits: number;
    pullRequests: number;
  };
  thisYear: {
    stars: number;
    repos: number;
  };
  currentStreak: number;
}

export interface GitHubLanguageStat {
  name: string;
  percentage: number;
  hours: number;
}

export interface GitHubActiveRepo {
  name: string;
  fullName: string;
  language: string | null;
  commitsThisMonth: number;
  lastCommit: {
    date: Date;
    message: string;
  };
}
