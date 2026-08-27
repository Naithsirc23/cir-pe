import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";

const nodeRequire = createRequire(import.meta.url);
const { DatabaseSync: NodeDatabaseSync } = nodeRequire("node:sqlite") as typeof import("node:sqlite");
type SQLiteDatabase = import("node:sqlite").DatabaseSync;

export type PrivateCategory = {
  id: number;
  name: string;
  color: string;
  position: number;
  projectCount: number;
};

export type PrivateProject = {
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
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  categoryPosition: number | null;
  position: number;
  nextAction: string | null;
  blockerReason: string | null;
  notes: string | null;
  githubUpdatedAt: string;
  githubPushedAt: string | null;
  lastSyncedAt: string;
};

export type GitHubProjectInput = Omit<
  PrivateProject,
  | "categoryId"
  | "categoryName"
  | "categoryColor"
  | "categoryPosition"
  | "position"
  | "nextAction"
  | "blockerReason"
  | "notes"
  | "lastSyncedAt"
>;

export type OrganizationConfig = {
  categories: Array<Pick<PrivateCategory, "name" | "color" | "position">>;
  projects: Array<{
    githubId: string;
    category: string | null;
    position: number;
    nextAction?: string | null;
    blockerReason?: string | null;
    notes?: string | null;
  }>;
};

export type ProjectOrganizationUpdate = {
  githubId: string;
  categoryId: number | null;
  position: number;
};

type ProjectRow = Omit<PrivateProject, "topics" | "isArchived" | "isFork"> & {
  topics: string;
  isArchived: number;
  isFork: number;
};

const schema = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    github_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    description TEXT,
    repository_url TEXT NOT NULL,
    homepage_url TEXT,
    language TEXT,
    topics_json TEXT NOT NULL DEFAULT '[]',
    visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
    is_archived INTEGER NOT NULL DEFAULT 0,
    is_fork INTEGER NOT NULL DEFAULT 0,
    github_updated_at TEXT NOT NULL,
    github_pushed_at TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    position INTEGER NOT NULL DEFAULT 0,
    next_action TEXT,
    blocker_reason TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS projects_category_position_idx ON projects(category_id, position);
  CREATE INDEX IF NOT EXISTS categories_position_idx ON categories(position);

  CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY,
    kind TEXT NOT NULL,
    subject TEXT NOT NULL,
    occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    detail_json TEXT NOT NULL DEFAULT '{}'
  );
`;

function toProject(row: ProjectRow): PrivateProject {
  let topics: string[] = [];
  try {
    const parsed = JSON.parse(row.topics);
    topics = Array.isArray(parsed) ? parsed.filter((topic): topic is string => typeof topic === "string") : [];
  } catch {
    topics = [];
  }

  return {
    ...row,
    topics,
    isArchived: Boolean(row.isArchived),
    isFork: Boolean(row.isFork),
  };
}

export class PrivateStore {
  readonly db: SQLiteDatabase;

  constructor(databasePath: string) {
    const resolvedPath = resolve(databasePath);
    mkdirSync(dirname(resolvedPath), { recursive: true });
    this.db = new NodeDatabaseSync(resolvedPath);
    this.db.exec(schema);
  }

  close() {
    this.db.close();
  }

  health(writeEnabled = false) {
    const row = this.db.prepare("SELECT value FROM metadata WHERE key = 'last_sync_at'").get() as { value: string } | undefined;
    return {
      database: "ready" as const,
      readOnlyMode: !writeEnabled,
      lastSyncedAt: row?.value ?? null,
    };
  }

  listCategories(): PrivateCategory[] {
    return this.db
      .prepare(
        `SELECT c.id, c.name, c.color, c.position, COUNT(p.github_id) AS projectCount
         FROM categories c
         LEFT JOIN projects p ON p.category_id = c.id
         GROUP BY c.id
         ORDER BY c.position ASC, c.name COLLATE NOCASE ASC`,
      )
      .all() as PrivateCategory[];
  }

  listProjects(limit = 50, offset = 0): { projects: PrivateProject[]; total: number } {
    const total = (this.db.prepare("SELECT COUNT(*) AS count FROM projects").get() as { count: number }).count;
    const rows = this.db
      .prepare(
        `SELECT
          p.github_id AS githubId,
          p.name,
          p.full_name AS fullName,
          p.description,
          p.repository_url AS repositoryUrl,
          p.homepage_url AS homepageUrl,
          p.language,
          p.topics_json AS topics,
          p.visibility,
          p.is_archived AS isArchived,
          p.is_fork AS isFork,
          p.category_id AS categoryId,
          c.name AS categoryName,
          c.color AS categoryColor,
          c.position AS categoryPosition,
          p.position,
          p.next_action AS nextAction,
          p.blocker_reason AS blockerReason,
          p.notes,
          p.github_updated_at AS githubUpdatedAt,
          p.github_pushed_at AS githubPushedAt,
          (SELECT value FROM metadata WHERE key = 'last_sync_at') AS lastSyncedAt
        FROM projects p
        LEFT JOIN categories c ON c.id = p.category_id
        ORDER BY COALESCE(c.position, 2147483647) ASC, p.position ASC, p.name COLLATE NOCASE ASC
        LIMIT ? OFFSET ?`,
      )
      .all(limit, offset) as ProjectRow[];

    return { projects: rows.map(toProject), total };
  }

  getProject(githubId: string): PrivateProject | null {
    const row = this.db
      .prepare(
        `SELECT
          p.github_id AS githubId,
          p.name,
          p.full_name AS fullName,
          p.description,
          p.repository_url AS repositoryUrl,
          p.homepage_url AS homepageUrl,
          p.language,
          p.topics_json AS topics,
          p.visibility,
          p.is_archived AS isArchived,
          p.is_fork AS isFork,
          p.category_id AS categoryId,
          c.name AS categoryName,
          c.color AS categoryColor,
          c.position AS categoryPosition,
          p.position,
          p.next_action AS nextAction,
          p.blocker_reason AS blockerReason,
          p.notes,
          p.github_updated_at AS githubUpdatedAt,
          p.github_pushed_at AS githubPushedAt,
          (SELECT value FROM metadata WHERE key = 'last_sync_at') AS lastSyncedAt
        FROM projects p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.github_id = ?`,
      )
      .get(githubId) as ProjectRow | undefined;
    return row ? toProject(row) : null;
  }

  upsertCategories(categories: Array<Pick<PrivateCategory, "name" | "color" | "position">>) {
    const statement = this.db.prepare(
      `INSERT INTO categories (name, color, position)
       VALUES (?, ?, ?)
       ON CONFLICT(name) DO UPDATE SET color = excluded.color, position = excluded.position, updated_at = CURRENT_TIMESTAMP`,
    );

    this.db.exec("BEGIN");
    try {
      for (const category of categories) {
        statement.run(category.name.trim(), category.color, category.position);
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  applyOrganization(config: OrganizationConfig) {
    const updateProject = this.db.prepare(
      `UPDATE projects
       SET category_id = CASE WHEN ? IS NULL THEN NULL ELSE (SELECT id FROM categories WHERE name = ?) END,
           position = ?,
           next_action = ?,
           blocker_reason = ?,
           notes = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE github_id = ?`,
    );

    this.db.exec("BEGIN");
    try {
      const categoryNames = new Set(config.categories.map(category => category.name.trim()));
      if (categoryNames.size !== config.categories.length || categoryNames.has("")) {
        throw new Error("Cada categoría debe tener un nombre único.");
      }

      for (const category of config.categories) {
        this.db
          .prepare(
            `INSERT INTO categories (name, color, position)
             VALUES (?, ?, ?)
             ON CONFLICT(name) DO UPDATE SET color = excluded.color, position = excluded.position, updated_at = CURRENT_TIMESTAMP`,
          )
          .run(category.name.trim(), category.color, category.position);
      }

      for (const project of config.projects) {
        if (project.category && !categoryNames.has(project.category)) {
          throw new Error(`La categoría '${project.category}' no está definida en categories.`);
        }
        const result = updateProject.run(
          project.category,
          project.category,
          project.position,
          project.nextAction ?? null,
          project.blockerReason ?? null,
          project.notes ?? null,
          project.githubId,
        );
        if (result.changes !== 1) throw new Error(`No existe el proyecto con githubId '${project.githubId}'. Ejecuta primero sync-github.`);
      }

      this.db
        .prepare("INSERT INTO audit_events (kind, subject, detail_json) VALUES (?, ?, ?)")
        .run("organization_import", "projects", JSON.stringify({ categories: config.categories.length, projects: config.projects.length }));
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  assignProjectCategory(githubId: string, categoryId: number | null) {
    if (categoryId !== null) {
      const category = this.db.prepare("SELECT id FROM categories WHERE id = ?").get(categoryId) as { id: number } | undefined;
      if (!category) throw new Error("La categoría indicada no existe.");
    }
    const nextPosition = this.db.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS value FROM projects WHERE category_id IS ?").get(categoryId) as { value: number };
    const result = this.db.prepare("UPDATE projects SET category_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE github_id = ?").run(categoryId, nextPosition.value, githubId);
    if (result.changes !== 1) throw new Error("El proyecto indicado no existe.");
    this.db.prepare("INSERT INTO audit_events (kind, subject, detail_json) VALUES (?, ?, ?)").run("project_category_assigned", githubId, JSON.stringify({ categoryId }));
  }

  reorderProjects(updates: ProjectOrganizationUpdate[]) {
    const seen = new Set<string>();
    this.db.exec("BEGIN");
    try {
      for (const update of updates) {
        if (!update.githubId || seen.has(update.githubId)) throw new Error("Cada proyecto solo puede aparecer una vez en el orden.");
        if (!Number.isInteger(update.position) || update.position < 0) throw new Error("La posición del proyecto no es válida.");
        if (update.categoryId !== null) {
          const category = this.db.prepare("SELECT id FROM categories WHERE id = ?").get(update.categoryId) as { id: number } | undefined;
          if (!category) throw new Error("La categoría indicada no existe.");
        }
        const result = this.db.prepare("UPDATE projects SET category_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE github_id = ?").run(update.categoryId, update.position, update.githubId);
        if (result.changes !== 1) throw new Error(`No existe el proyecto con githubId '${update.githubId}'.`);
        seen.add(update.githubId);
      }
      this.db.prepare("INSERT INTO audit_events (kind, subject, detail_json) VALUES (?, ?, ?)").run("projects_reordered", "projects", JSON.stringify({ count: updates.length }));
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  reorderCategories(categoryIds: number[]) {
    const ids = new Set(categoryIds);
    if (ids.size !== categoryIds.length || categoryIds.some(id => !Number.isInteger(id) || id < 1)) throw new Error("El orden de categorías no es válido.");
    const storedCount = (this.db.prepare("SELECT COUNT(*) AS count FROM categories").get() as { count: number }).count;
    if (storedCount !== categoryIds.length) throw new Error("El orden debe incluir todas las categorías.");
    this.db.exec("BEGIN");
    try {
      const update = this.db.prepare("UPDATE categories SET position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
      categoryIds.forEach((id, position) => {
        if (update.run(position, id).changes !== 1) throw new Error("La categoría indicada no existe.");
      });
      this.db.prepare("INSERT INTO audit_events (kind, subject, detail_json) VALUES (?, ?, ?)").run("categories_reordered", "categories", JSON.stringify({ count: categoryIds.length }));
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  syncProjects(projects: GitHubProjectInput[], syncedAt = new Date().toISOString()) {
    const nextPosition = this.db.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS value FROM projects");
    const upsert = this.db.prepare(
      `INSERT INTO projects (
        github_id, name, full_name, description, repository_url, homepage_url, language, topics_json,
        visibility, is_archived, is_fork, github_updated_at, github_pushed_at, position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(github_id) DO UPDATE SET
        name = excluded.name,
        full_name = excluded.full_name,
        description = excluded.description,
        repository_url = excluded.repository_url,
        homepage_url = excluded.homepage_url,
        language = excluded.language,
        topics_json = excluded.topics_json,
        visibility = excluded.visibility,
        is_archived = excluded.is_archived,
        is_fork = excluded.is_fork,
        github_updated_at = excluded.github_updated_at,
        github_pushed_at = excluded.github_pushed_at,
        updated_at = CURRENT_TIMESTAMP`,
    );
    const metadata = this.db.prepare(
      "INSERT INTO metadata (key, value) VALUES ('last_sync_at', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    );
    const event = this.db.prepare("INSERT INTO audit_events (kind, subject, detail_json) VALUES (?, ?, ?)");

    this.db.exec("BEGIN");
    try {
      for (const project of projects) {
        const position = (nextPosition.get() as { value: number }).value;
        upsert.run(
          project.githubId,
          project.name,
          project.fullName,
          project.description,
          project.repositoryUrl,
          project.homepageUrl,
          project.language,
          JSON.stringify(project.topics),
          project.visibility,
          Number(project.isArchived),
          Number(project.isFork),
          project.githubUpdatedAt,
          project.githubPushedAt,
          position,
        );
      }
      metadata.run(syncedAt);
      event.run("github_sync", "projects", JSON.stringify({ count: projects.length, syncedAt }));
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}
