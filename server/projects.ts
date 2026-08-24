import { and, desc, eq, getTableColumns, isNull } from "drizzle-orm";
import { categories, projects } from "../drizzle/schema";
import { getDb } from "./db";
import type { GitHubRepository } from "./github";

function requireDatabase(database: Awaited<ReturnType<typeof getDb>>) {
  if (!database) throw new Error("La base de datos no está disponible.");
  return database;
}

export async function listCategories(ownerId: number) {
  const database = requireDatabase(await getDb());
  return database.select().from(categories).where(eq(categories.ownerId, ownerId)).orderBy(categories.name);
}

export async function createCategory(ownerId: number, input: { name: string; color: string }) {
  const database = requireDatabase(await getDb());
  const result = await database.insert(categories).values({ ownerId, ...input });
  return Number(result[0].insertId);
}

export async function updateCategory(ownerId: number, categoryId: number, input: { name: string; color: string }) {
  const database = requireDatabase(await getDb());
  await database.update(categories).set(input).where(and(eq(categories.id, categoryId), eq(categories.ownerId, ownerId)));
}

export async function deleteCategory(ownerId: number, categoryId: number) {
  const database = requireDatabase(await getDb());
  await database.delete(categories).where(and(eq(categories.id, categoryId), eq(categories.ownerId, ownerId)));
}

export async function listProjects(ownerId: number) {
  const database = requireDatabase(await getDb());
  const rows = await database
    .select({
      ...getTableColumns(projects),
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(projects)
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .where(eq(projects.ownerId, ownerId))
    .orderBy(desc(projects.githubPushedAt));

  return rows.map(row => ({
    ...row,
    topics: JSON.parse(row.topics || "[]") as string[],
  }));
}

export async function getProject(ownerId: number, projectId: number) {
  const database = requireDatabase(await getDb());
  const rows = await database
    .select({
      ...getTableColumns(projects),
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(projects)
    .leftJoin(categories, eq(projects.categoryId, categories.id))
    .where(and(eq(projects.ownerId, ownerId), eq(projects.id, projectId)))
    .limit(1);

  const project = rows[0];
  return project ? { ...project, topics: JSON.parse(project.topics || "[]") as string[] } : null;
}

export async function syncProjectsFromGitHub(ownerId: number, repositories: GitHubRepository[]) {
  const database = requireDatabase(await getDb());
  const syncedAt = new Date();

  for (const repository of repositories) {
    await database
      .insert(projects)
      .values({
        ownerId,
        githubId: repository.githubId,
        name: repository.name,
        fullName: repository.fullName,
        description: repository.description,
        repositoryUrl: repository.repositoryUrl,
        homepageUrl: repository.homepageUrl,
        language: repository.language,
        topics: JSON.stringify(repository.topics),
        visibility: repository.visibility,
        isArchived: repository.isArchived,
        isFork: repository.isFork,
        githubCreatedAt: repository.githubCreatedAt,
        githubUpdatedAt: repository.githubUpdatedAt,
        githubPushedAt: repository.githubPushedAt,
        lastSyncedAt: syncedAt,
      })
      .onDuplicateKeyUpdate({
        set: {
          name: repository.name,
          fullName: repository.fullName,
          description: repository.description,
          repositoryUrl: repository.repositoryUrl,
          homepageUrl: repository.homepageUrl,
          language: repository.language,
          topics: JSON.stringify(repository.topics),
          visibility: repository.visibility,
          isArchived: repository.isArchived,
          isFork: repository.isFork,
          githubUpdatedAt: repository.githubUpdatedAt,
          githubPushedAt: repository.githubPushedAt,
          lastSyncedAt: syncedAt,
        },
      });
  }

  return { synced: repositories.length, syncedAt };
}

function normalizeLabel(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Asigna carpetas a proyectos sin categoría cuando una etiqueta de GitHub coincide con el nombre de la carpeta. */
export async function autoAssignCategoriesByTopics(ownerId: number) {
  const database = requireDatabase(await getDb());
  const ownerCategories = await listCategories(ownerId);
  const uncategorizedProjects = await database
    .select()
    .from(projects)
    .where(and(eq(projects.ownerId, ownerId), isNull(projects.categoryId)));
  let assigned = 0;

  for (const project of uncategorizedProjects) {
    const topics = (JSON.parse(project.topics || "[]") as string[]).map(normalizeLabel);
    const category = ownerCategories.find(candidate => {
      const categoryLabel = normalizeLabel(candidate.name);
      return Boolean(categoryLabel) && topics.some(topic => topic === categoryLabel || topic.includes(categoryLabel) || categoryLabel.includes(topic));
    });
    if (!category) continue;
    await database.update(projects).set({ categoryId: category.id }).where(eq(projects.id, project.id));
    assigned += 1;
  }

  return { assigned };
}

export async function updateProject(
  ownerId: number,
  projectId: number,
  input: {
    categoryId?: number | null;
    status?: "activo" | "pausado" | "publicado" | "en riesgo";
    priority?: "alta" | "media" | "baja";
    phase?: string;
    progress?: number;
    nextAction?: string | null;
    blockerReason?: string | null;
    notes?: string | null;
    demoUrl?: string | null;
    documentationUrl?: string | null;
    milestoneAt?: Date | null;
  },
) {
  const database = requireDatabase(await getDb());
  await database.update(projects).set(input).where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)));
}
