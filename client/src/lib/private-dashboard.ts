import { useQuery } from "@tanstack/react-query";
import { type DashboardProject, type ProjectPriority, type ProjectStatus } from "./project-filters";
import { trpc } from "./trpc";

type PrivateApiProject = {
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
  position: number;
  nextAction: string | null;
  blockerReason: string | null;
  notes: string | null;
  githubUpdatedAt: string;
  githubPushedAt: string | null;
  lastSyncedAt: string | null;
};

export type DashboardCategory = { id: number; name: string; color: string };

type PrivateApiPayload = {
  readOnlyMode: true;
  projects: PrivateApiProject[];
  categories: DashboardCategory[];
};

const configuredPrivateApiUrl = import.meta.env.VITE_CIR_PRIVATE_API_URL?.replace(/\/$/, "") || null;

function projectStatus(project: PrivateApiProject): ProjectStatus {
  if (project.blockerReason) return "en riesgo";
  if (project.isArchived) return "pausado";
  if (project.homepageUrl) return "publicado";
  return "activo";
}

function projectPriority(project: PrivateApiProject): ProjectPriority {
  if (project.blockerReason) return "alta";
  if (project.nextAction) return "media";
  return "baja";
}

export function toDashboardProject(project: PrivateApiProject): DashboardProject {
  return {
    id: Number(project.githubId),
    name: project.name,
    description: project.description,
    categoryId: project.categoryId,
    categoryName: project.categoryName,
    categoryColor: project.categoryColor,
    status: projectStatus(project),
    priority: projectPriority(project),
    phase: project.isArchived ? "Mantenimiento" : project.homepageUrl ? "Publicado" : "Desarrollo",
    progress: project.isArchived || project.homepageUrl ? 100 : 50,
    blockerReason: project.blockerReason,
    language: project.language,
    topics: project.topics,
    repositoryUrl: project.repositoryUrl,
    homepageUrl: project.homepageUrl,
    demoUrl: null,
    documentationUrl: null,
    nextAction: project.nextAction,
    notes: project.notes,
    milestoneAt: null,
    githubPushedAt: project.githubPushedAt ? new Date(project.githubPushedAt) : null,
    githubUpdatedAt: new Date(project.githubUpdatedAt),
    lastSyncedAt: new Date(project.lastSyncedAt ?? project.githubUpdatedAt),
    visibility: project.visibility,
  };
}

async function fetchPrivateDashboard(apiUrl: string): Promise<PrivateApiPayload> {
  const [projectsResponse, categoriesResponse] = await Promise.all([
    fetch(`${apiUrl}/api/projects?limit=100`, { credentials: "omit", cache: "no-store" }),
    fetch(`${apiUrl}/api/categories`, { credentials: "omit", cache: "no-store" }),
  ]);
  if (!projectsResponse.ok || !categoriesResponse.ok) throw new Error("La fuente privada no está disponible.");

  const projectsPayload = (await projectsResponse.json()) as { readOnlyMode?: boolean; projects?: PrivateApiProject[] };
  const categoriesPayload = (await categoriesResponse.json()) as { readOnlyMode?: boolean; categories?: DashboardCategory[] };
  if (!projectsPayload.readOnlyMode || !categoriesPayload.readOnlyMode || !Array.isArray(projectsPayload.projects) || !Array.isArray(categoriesPayload.categories)) {
    throw new Error("La fuente privada devolvió un formato no compatible.");
  }

  return { readOnlyMode: true, projects: projectsPayload.projects, categories: categoriesPayload.categories };
}

export function useDashboardData() {
  const publicProjects = trpc.projects.list.useQuery();
  const publicCategories = trpc.categories.list.useQuery();
  const privateData = useQuery({
    queryKey: ["cir-private-dashboard", configuredPrivateApiUrl],
    queryFn: () => fetchPrivateDashboard(configuredPrivateApiUrl!),
    enabled: Boolean(configuredPrivateApiUrl),
    retry: 1,
    retryDelay: 1_000,
  });

  const isPrivate = privateData.isSuccess;
  const projects = isPrivate ? privateData.data.projects.map(toDashboardProject) : ((publicProjects.data ?? []) as DashboardProject[]);
  const categories = isPrivate ? privateData.data.categories : (publicCategories.data ?? [] as DashboardCategory[]);

  return {
    projects,
    categories,
    source: isPrivate ? "private" as const : "public" as const,
    isPrivateConfigured: Boolean(configuredPrivateApiUrl),
    isLoading: !projects.length && (privateData.isLoading || publicProjects.isLoading),
    isError: !projects.length && !privateData.isLoading && publicProjects.isError,
    privateUnavailable: Boolean(configuredPrivateApiUrl && !isPrivate && privateData.isError),
    refetch: async () => { await Promise.all([publicProjects.refetch(), publicCategories.refetch(), privateData.refetch()]); },
    retryPrivate: privateData.refetch,
  };
}
