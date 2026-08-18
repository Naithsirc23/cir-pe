import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, unique, varchar } from "drizzle-orm/mysql-core";

/** Tabla de usuarios que respalda la autenticación del dashboard. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const categories = mysqlTable(
  "categories",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 64 }).notNull(),
    color: varchar("color", { length: 16 }).notNull().default("#4F46E5"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    unique("categories_owner_name_unique").on(table.ownerId, table.name),
    index("categories_owner_index").on(table.ownerId),
  ],
);

export const projects = mysqlTable(
  "projects",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    categoryId: int("categoryId").references(() => categories.id, { onDelete: "set null" }),
    githubId: varchar("githubId", { length: 32 }).notNull(),
    name: varchar("name", { length: 256 }).notNull(),
    fullName: varchar("fullName", { length: 512 }).notNull(),
    description: text("description"),
    repositoryUrl: varchar("repositoryUrl", { length: 1024 }).notNull(),
    homepageUrl: varchar("homepageUrl", { length: 1024 }),
    demoUrl: varchar("demoUrl", { length: 1024 }),
    documentationUrl: varchar("documentationUrl", { length: 1024 }),
    language: varchar("language", { length: 80 }),
    topics: text("topics").notNull(),
    visibility: mysqlEnum("visibility", ["public", "private"]).notNull().default("public"),
    isArchived: boolean("isArchived").notNull().default(false),
    isFork: boolean("isFork").notNull().default(false),
    status: mysqlEnum("status", ["activo", "pausado", "publicado", "en riesgo"]).notNull().default("activo"),
    priority: mysqlEnum("priority", ["alta", "media", "baja"]).notNull().default("media"),
    phase: varchar("phase", { length: 80 }).notNull().default("Desarrollo"),
    progress: int("progress").notNull().default(0),
    nextAction: text("nextAction"),
    notes: text("notes"),
    milestoneAt: timestamp("milestoneAt"),
    githubCreatedAt: timestamp("githubCreatedAt").notNull(),
    githubUpdatedAt: timestamp("githubUpdatedAt").notNull(),
    githubPushedAt: timestamp("githubPushedAt"),
    lastSyncedAt: timestamp("lastSyncedAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    unique("projects_owner_github_unique").on(table.ownerId, table.githubId),
    index("projects_owner_index").on(table.ownerId),
    index("projects_category_index").on(table.categoryId),
  ],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Project = typeof projects.$inferSelect;
