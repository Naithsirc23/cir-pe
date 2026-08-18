import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getPersonalWorkspaceUserId } from "./db";
import { fetchGitHubRepositories } from "./github";
import { toPublicDashboardProject } from "./public-projects";
import { autoAssignCategoriesByTopics, createCategory, deleteCategory, getProject, listCategories, listProjects, syncProjectsFromGitHub, updateCategory, updateProject } from "./projects";

const projectStatus = z.enum(["activo", "pausado", "publicado", "en riesgo"]);
const projectPriority = z.enum(["alta", "media", "baja"]);

async function hasPersistentWorkspace() {
  const { getDb } = await import("./db");
  return Boolean(await getDb());
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  categories: router({
    list: publicProcedure.query(async () => (await hasPersistentWorkspace()) ? listCategories(await getPersonalWorkspaceUserId()) : []),
    create: publicProcedure
      .input(z.object({ name: z.string().trim().min(1).max(64), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/) }))
      .mutation(async ({ input }) => createCategory(await getPersonalWorkspaceUserId(), input)),
    update: publicProcedure
      .input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(1).max(64), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/) }))
      .mutation(async ({ input }) => updateCategory(await getPersonalWorkspaceUserId(), input.id, { name: input.name, color: input.color })),
    delete: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => deleteCategory(await getPersonalWorkspaceUserId(), input.id)),
  }),
  projects: router({
    list: publicProcedure.query(async () => {
      if (await hasPersistentWorkspace()) {
        const ownerId = await getPersonalWorkspaceUserId();
        const persistedProjects = await listProjects(ownerId);
        if (persistedProjects.length > 0) return persistedProjects;

        const repositories = await fetchGitHubRepositories();
        await syncProjectsFromGitHub(ownerId, repositories);
        return listProjects(ownerId);
      }
      const syncedAt = new Date();
      return (await fetchGitHubRepositories()).map(repository => toPublicDashboardProject(repository, syncedAt));
    }),
    get: publicProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        if (await hasPersistentWorkspace()) return getProject(await getPersonalWorkspaceUserId(), input.id);
        const project = (await fetchGitHubRepositories()).map(repository => toPublicDashboardProject(repository)).find(item => item.id === input.id);
        return project ?? null;
      }),
    sync: publicProcedure.mutation(async () => {
      const repositories = await fetchGitHubRepositories();
      if (!(await hasPersistentWorkspace())) return { synced: repositories.length, syncedAt: new Date(), persistent: false };
      return syncProjectsFromGitHub(await getPersonalWorkspaceUserId(), repositories);
    }),
    autoAssignCategories: publicProcedure.mutation(async () => autoAssignCategoriesByTopics(await getPersonalWorkspaceUserId())),
    update: publicProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          categoryId: z.number().int().positive().nullable().optional(),
          status: projectStatus.optional(),
          priority: projectPriority.optional(),
          phase: z.string().trim().min(1).max(80).optional(),
          progress: z.number().int().min(0).max(100).optional(),
          nextAction: z.string().max(2000).nullable().optional(),
          notes: z.string().max(10000).nullable().optional(),
          demoUrl: z.string().url().max(1024).nullable().optional(),
          documentationUrl: z.string().url().max(1024).nullable().optional(),
          milestoneAt: z.date().nullable().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...values } = input;
        await updateProject(await getPersonalWorkspaceUserId(), id, values);
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
