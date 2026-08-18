export const GITHUB_USERNAME = "Naithsirc23";

type GitHubApiRepository = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  private: boolean;
  archived: boolean;
  fork: boolean;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  owner: { login: string };
};

type GitHubAccount = { login: string };

export type GitHubRepository = {
  githubId: string;
  name: string;
  fullName: string;
  description: string | null;
  repositoryUrl: string;
  homepageUrl: string | null;
  language: string | null;
  topics: string[];
  visibility: "public" | "private";
  isArchived: boolean;
  isFork: boolean;
  githubCreatedAt: Date;
  githubUpdatedAt: Date;
  githubPushedAt: Date | null;
};

function headers(token?: string) {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function requestGitHub<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: headers(token),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API respondió ${response.status}: ${body.slice(0, 180)}`);
  }

  return (await response.json()) as T;
}

export function normalizeGitHubRepository(repository: GitHubApiRepository): GitHubRepository {
  return {
    githubId: String(repository.id),
    name: repository.name,
    fullName: repository.full_name,
    description: repository.description,
    repositoryUrl: repository.html_url,
    homepageUrl: repository.homepage || null,
    language: repository.language,
    topics: repository.topics ?? [],
    visibility: repository.private ? "private" : "public",
    isArchived: repository.archived,
    isFork: repository.fork,
    githubCreatedAt: new Date(repository.created_at),
    githubUpdatedAt: new Date(repository.updated_at),
    githubPushedAt: repository.pushed_at ? new Date(repository.pushed_at) : null,
  };
}

/** Obtiene repositorios propios de la cuenta configurada, incluyendo privados cuando existe un token válido. */
export async function fetchGitHubRepositories(): Promise<GitHubRepository[]> {
  const token = process.env.GITHUB_TOKEN;

  if (token) {
    const account = await requestGitHub<GitHubAccount>("/user", token);
    if (account.login.toLowerCase() !== GITHUB_USERNAME.toLowerCase()) {
      throw new Error(`El token de GitHub debe pertenecer a ${GITHUB_USERNAME}.`);
    }
  }

  const repositories: GitHubApiRepository[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const path = token
      ? `/user/repos?affiliation=owner&sort=updated&direction=desc&per_page=100&page=${page}`
      : `/users/${GITHUB_USERNAME}/repos?type=owner&sort=updated&direction=desc&per_page=100&page=${page}`;
    const pageRepositories = await requestGitHub<GitHubApiRepository[]>(path, token);
    repositories.push(...pageRepositories);
    if (pageRepositories.length < 100) break;
  }

  return repositories
    .filter(repository => repository.owner.login.toLowerCase() === GITHUB_USERNAME.toLowerCase())
    .map(normalizeGitHubRepository);
}
