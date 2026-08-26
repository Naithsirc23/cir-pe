import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createPrivateApi, listenPrivateApi } from "./api";
import { PrivateStore } from "./store";

const tempDirectories: string[] = [];

afterEach(() => {
  while (tempDirectories.length) rmSync(tempDirectories.pop()!, { recursive: true, force: true });
});

async function startTestApi() {
  const directory = mkdtempSync(join(tmpdir(), "cir-private-api-"));
  tempDirectories.push(directory);
  const store = new PrivateStore(join(directory, "projects.sqlite"));
  store.upsertCategories([{ name: "Producto", color: "#4F46E5", position: 0 }]);
  store.syncProjects([
    {
      githubId: "30001",
      name: "cir-pe",
      fullName: "Naithsirc23/cir-pe",
      description: "Dashboard personal",
      repositoryUrl: "https://github.com/Naithsirc23/cir-pe",
      homepageUrl: null,
      language: "TypeScript",
      topics: ["pwa"],
      visibility: "public",
      isArchived: false,
      isFork: false,
      githubUpdatedAt: "2026-08-25T00:00:00.000Z",
      githubPushedAt: "2026-08-25T00:00:00.000Z",
    },
  ], "2026-08-25T00:00:00.000Z");
  store.applyOrganization({
    categories: [{ name: "Producto", color: "#4F46E5", position: 0 }],
    projects: [{ githubId: "30001", category: "Producto", position: 0, nextAction: "Configurar lectura privada", blockerReason: null, notes: "Solo disponible en la tailnet." }],
  });
  const server = createPrivateApi({ store, allowedOrigins: ["https://cir-projects-dashboard.vercel.app"], now: () => new Date("2026-08-25T01:00:00.000Z") });
  await listenPrivateApi(server, 0);
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No se obtuvo un puerto de prueba.");
  return { store, server, baseUrl: `http://127.0.0.1:${address.port}` };
}

describe("API privada de CIR Projects", () => {
  it("expone salud, categorías y proyectos mediante GET", async () => {
    const { server, store, baseUrl } = await startTestApi();
    try {
      const health = await fetch(`${baseUrl}/api/health`);
      expect(health.status).toBe(200);
      await expect(health.json()).resolves.toMatchObject({ readOnlyMode: true, database: "ready", lastSyncedAt: "2026-08-25T00:00:00.000Z" });

      const categories = await fetch(`${baseUrl}/api/categories`);
      await expect(categories.json()).resolves.toMatchObject({ categories: [{ name: "Producto", projectCount: 1 }] });

      const projects = await fetch(`${baseUrl}/api/projects?limit=1`);
      await expect(projects.json()).resolves.toMatchObject({ total: 1, projects: [{ githubId: "30001", name: "cir-pe", categoryName: "Producto", nextAction: "Configurar lectura privada", topics: ["pwa"] }] });
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
      store.close();
    }
  });

  it("rechaza métodos de escritura y limita CORS al origen configurado", async () => {
    const { server, store, baseUrl } = await startTestApi();
    try {
      const rejected = await fetch(`${baseUrl}/api/projects`, { method: "PATCH" });
      expect(rejected.status).toBe(405);
      expect(rejected.headers.get("allow")).toBe("GET, OPTIONS");

      const acceptedOrigin = await fetch(`${baseUrl}/api/projects`, { headers: { Origin: "https://cir-projects-dashboard.vercel.app" } });
      expect(acceptedOrigin.headers.get("access-control-allow-origin")).toBe("https://cir-projects-dashboard.vercel.app");

      const rejectedOrigin = await fetch(`${baseUrl}/api/projects`, { headers: { Origin: "https://otro.example" } });
      expect(rejectedOrigin.headers.get("access-control-allow-origin")).toBeNull();
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
      store.close();
    }
  });
});
