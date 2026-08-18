import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { fetchGitHubRepositories } from "./github";
import { autoAssignCategoriesByTopics, createCategory, deleteCategory, getProject, listCategories, listProjects, syncProjectsFromGitHub, updateCategory, updateProject } from "./projects";

const projectStatus = z.enum(["activo", "pausado", "publicado", "en riesgo"]);
const projectPriority = z.enum(["alta", "media", "baja"]);

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
    list: protectedProcedure.query(({ ctx }) => listCategories(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({ name: z.string().trim().min(1).max(64), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/) }))
      .mutation(({ ctx, input }) => createCategory(ctx.user.id, input)),
    update: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(1).max(64), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/) }))
      .mutation(({ ctx, input }) => updateCategory(ctx.user.id, input.id, { name: input.name, color: input.color })),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ ctx, input }) => deleteCategory(ctx.user.id, input.id)),
  }),
  projects: router({
    list: protectedProcedure.query(({ ctx }) => listProjects(ctx.user.id)),
    get: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(({ ctx, input }) => getProject(ctx.user.id, input.id)),
    sync: adminProcedure.mutation(async ({ ctx }) => {
      const repositories = await fetchGitHubRepositories();
      return syncProjectsFromGitHub(ctx.user.id, repositories);
    }),
    autoAssignCategories: protectedProcedure.mutation(({ ctx }) => autoAssignCategoriesByTopics(ctx.user.id)),
    update: protectedProcedure
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
      .mutation(async ({ ctx, input }) => {
        const { id, ...values } = input;
        await updateProject(ctx.user.id, id, values);
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
