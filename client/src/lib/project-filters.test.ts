import { describe, expect, it } from "vitest";
import { filterProjects, type DashboardProject } from "./project-filters";

const baseProject: DashboardProject = {
  id: 1,
  name: "ELICONTABLE",
  description: "Gestión financiera para negocios.",
  categoryId: 7,
  categoryName: "Finanzas",
  categoryColor: "#4F46E5",
  status: "activo",
  priority: "alta",
  phase: "Desarrollo",
  progress: 65,
  language: "TypeScript",
  topics: ["finanzas", "saas"],
  repositoryUrl: "https://github.com/Naithsirc23/ELICONTABLE",
  homepageUrl: null,
  demoUrl: null,
  documentationUrl: null,
  nextAction: null,
  notes: null,
  milestoneAt: null,
  githubPushedAt: null,
  githubUpdatedAt: new Date("2026-08-18T00:00:00Z"),
  lastSyncedAt: new Date("2026-08-18T00:00:00Z"),
  visibility: "public",
};

describe("filterProjects", () => {
  const projects: DashboardProject[] = [
    baseProject,
    { ...baseProject, id: 2, name: "London-BOS", description: "Planificador de viajes", categoryId: 8, categoryName: "Viajes", status: "pausado", priority: "media", topics: ["travel"] },
    { ...baseProject, id: 3, name: "KRONOS", categoryId: null, categoryName: null, status: "publicado", priority: "baja", language: "Python", topics: ["automation"] },
  ];

  it("combina los filtros de categoría, estado y prioridad", () => {
    expect(filterProjects(projects, { query: "", categoryId: 7, status: "activo", priority: "alta" }).map(project => project.name)).toEqual(["ELICONTABLE"]);
  });

  it("encuentra coincidencias en nombre, descripción, lenguaje y etiquetas", () => {
    expect(filterProjects(projects, { query: "travel", categoryId: "all", status: "all", priority: "all" }).map(project => project.name)).toEqual(["London-BOS"]);
    expect(filterProjects(projects, { query: "python", categoryId: "all", status: "all", priority: "all" }).map(project => project.name)).toEqual(["KRONOS"]);
  });
});
