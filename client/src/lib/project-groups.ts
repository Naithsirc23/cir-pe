import type { DashboardProject } from "./project-filters";

export type ProjectCategoryGroup = {
  id: string;
  name: string;
  color: string | null;
  projects: DashboardProject[];
  unassigned?: boolean;
};

type CategoryLike = { id: number; name: string; color: string | null };

/** Mantiene el orden de las categorías y reúne los repositorios no clasificados al final. */
export function groupProjectsByCategory(projects: DashboardProject[], categories: CategoryLike[]): ProjectCategoryGroup[] {
  const groups = categories.map(category => ({
    id: `category-${category.id}`,
    name: category.name,
    color: category.color,
    projects: [] as DashboardProject[],
  }));
  const byCategoryId = new Map(categories.map((category, index) => [category.id, groups[index]]));
  const unassigned: ProjectCategoryGroup = { id: "unassigned", name: "Sin categoría", color: null, projects: [], unassigned: true };

  projects.forEach(project => {
    const group = project.categoryId === null ? undefined : byCategoryId.get(project.categoryId);
    (group ?? unassigned).projects.push(project);
  });

  return [...groups, ...(unassigned.projects.length ? [unassigned] : [])];
}
