import { describe, expect, it } from "vitest";
import { toDashboardProject } from "./private-dashboard";

describe("toDashboardProject", () => {
  it("preserva el seguimiento privado y deriva la prioridad de un bloqueo", () => {
    const project = toDashboardProject({
      githubId: "1220245366",
      name: "cir-pe",
      fullName: "Naithsirc23/cir-pe",
      description: null,
      repositoryUrl: "https://github.com/Naithsirc23/cir-pe",
      homepageUrl: null,
      language: "TypeScript",
      topics: ["pwa"],
      visibility: "public",
      isArchived: false,
      isFork: false,
      categoryId: 1,
      categoryName: "Activos",
      categoryColor: "#4F46E5",
      position: 0,
      nextAction: "Validar la API privada",
      blockerReason: "Falta una URL de Tailscale",
      notes: "Datos locales",
      githubUpdatedAt: "2026-08-26T00:00:00.000Z",
      githubPushedAt: "2026-08-26T00:00:00.000Z",
      lastSyncedAt: "2026-08-26T00:00:00.000Z",
    });

    expect(project).toMatchObject({ id: 1220245366, categoryName: "Activos", status: "en riesgo", priority: "alta", nextAction: "Validar la API privada", notes: "Datos locales" });
  });
});
