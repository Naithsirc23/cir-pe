import { PrivateStore, type GitHubProjectInput } from "./store";

type GitHubRepository = {
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
  updated_at: string;
  pushed_at: string | null;
  owner: { login: string };
};

function headers(token?: string) {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "cir-private-service",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchGitHubProjects(username: string, token = process.env.GITHUB_TOKEN): Promise<GitHubProjectInput[]> {
  const projects: GitHubProjectInput[] = [];

  for (let page = 1; page <= 10; page += 1) {
    const endpoint = token
      ? `https://api.github.com/user/repos?affiliation=owner&sort=updated&direction=desc&per_page=100&page=${page}`
      : `https://api.github.com/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&direction=desc&per_page=100&page=${page}`;
    const response = await fetch(endpoint, { headers: headers(token) });
    if (!response.ok) throw new Error(`GitHub API respondió ${response.status}.`);
    const repositories = (await response.json()) as GitHubRepository[];

    for (const repository of repositories) {
      if (repository.owner.login.toLowerCase() !== username.toLowerCase()) continue;
      projects.push({
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
        githubUpdatedAt: repository.updated_at,
        githubPushedAt: repository.pushed_at,
      });
    }

    if (repositories.length < 100) break;
  }

  return projects;
}

export async function syncGitHubProjects(store: PrivateStore, username = process.env.CIR_GITHUB_USERNAME || "Naithsirc23") {
  const projects = await fetchGitHubProjects(username);
  store.syncProjects(projects);
  return projects.length;
}
