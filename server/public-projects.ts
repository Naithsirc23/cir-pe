import type { GitHubRepository } from "./github";

/** Modelo transitorio para que el dashboard personal funcione con repositorios públicos sin base de datos. */
export function toPublicDashboardProject(repository: GitHubRepository, syncedAt = new Date()) {
  return {
    id: Number(repository.githubId),
    githubId: repository.githubId,
    name: repository.name,
    fullName: repository.fullName,
    description: repository.description,
    repositoryUrl: repository.repositoryUrl,
    homepageUrl: repository.homepageUrl,
    demoUrl: repository.homepageUrl,
    documentationUrl: null,
    language: repository.language,
    topics: repository.topics,
    visibility: repository.visibility,
    isArchived: repository.isArchived,
    isFork: repository.isFork,
    githubCreatedAt: repository.githubCreatedAt,
    githubUpdatedAt: repository.githubUpdatedAt,
    githubPushedAt: repository.githubPushedAt,
    categoryId: null,
    categoryName: null,
    categoryColor: null,
    status: repository.isArchived ? ("pausado" as const) : repository.homepageUrl ? ("publicado" as const) : ("activo" as const),
    priority: "media" as const,
    phase: repository.isArchived ? "Archivado" : repository.homepageUrl ? "Publicado" : "En desarrollo",
    progress: repository.homepageUrl ? 100 : 0,
    nextAction: null,
    notes: null,
    milestoneAt: null,
    lastSyncedAt: syncedAt,
  };
}
