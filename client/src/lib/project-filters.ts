export type ProjectStatus = "activo" | "pausado" | "publicado" | "en riesgo";
export type ProjectPriority = "alta" | "media" | "baja";

export type DashboardProject = {
  id: number;
  name: string;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  phase: string;
  progress: number;
  blockerReason: string | null;
  language: string | null;
  topics: string[];
  repositoryUrl: string;
  homepageUrl: string | null;
  demoUrl: string | null;
  documentationUrl: string | null;
  nextAction: string | null;
  notes: string | null;
  milestoneAt: Date | null;
  githubPushedAt: Date | null;
  githubUpdatedAt: Date;
  lastSyncedAt: Date;
  visibility: "public" | "private";
};

export type ProjectFilters = {
  query: string;
  categoryId: number | "all";
  status: ProjectStatus | "all";
  priority: ProjectPriority | "all";
};

export const initialProjectFilters: ProjectFilters = {
  query: "",
  categoryId: "all",
  status: "all",
  priority: "all",
};

export function filterProjects(projects: DashboardProject[], filters: ProjectFilters) {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase();

  return projects.filter(project => {
    const matchesQuery = !normalizedQuery || [project.name, project.description ?? "", project.language ?? "", ...project.topics]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery);
    const matchesCategory = filters.categoryId === "all" || project.categoryId === filters.categoryId;
    const matchesStatus = filters.status === "all" || project.status === filters.status;
    const matchesPriority = filters.priority === "all" || project.priority === filters.priority;

    return matchesQuery && matchesCategory && matchesStatus && matchesPriority;
  });
}

export function statusLabel(status: ProjectStatus) {
  return status === "en riesgo" ? "En riesgo" : `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

export function relativeDate(date: Date | null) {
  if (!date) return "Sin actividad";
  const elapsedDays = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (elapsedDays <= 0) return "Hoy";
  if (elapsedDays === 1) return "Ayer";
  if (elapsedDays < 7) return `Hace ${elapsedDays} días`;
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(new Date(date));
}
