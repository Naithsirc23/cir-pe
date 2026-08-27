import { describe, expect, it } from "vitest";
import type { DashboardProject } from "./project-filters";
import { groupProjectsByCategory } from "./project-groups";

const project = (id: number, categoryId: number | null) => ({ id, name: `Proyecto ${id}`, categoryId }) as DashboardProject;

describe("groupProjectsByCategory", () => {
  it("conserva las categorías configuradas y reúne los proyectos sin clasificar al final", () => {
    const groups = groupProjectsByCategory([project(1, 2), project(2, null), project(3, 1)], [
      { id: 1, name: "Webs", color: "#4f46e5" },
      { id: 2, name: "Trading", color: "#0f766e" },
    ]);

    expect(groups.map(group => [group.name, group.projects.map(item => item.id)])).toEqual([
      ["Webs", [3]],
      ["Trading", [1]],
      ["Sin categoría", [2]],
    ]);
  });

  it("mantiene visibles las categorías vacías para que puedan organizarse desde la fuente privada", () => {
    const groups = groupProjectsByCategory([project(1, null)], [{ id: 7, name: "Herramientas", color: "#475569" }]);
    expect(groups.map(group => [group.name, group.projects.length])).toEqual([["Herramientas", 0], ["Sin categoría", 1]]);
  });
});
