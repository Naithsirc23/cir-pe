import CategoryManager from "@/components/CategoryManager";
import { QueryErrorNotice } from "@/components/AccessNotice";
import ProjectCard from "@/components/ProjectCard";
import ProjectFilters from "@/components/ProjectFilters";
import { Button } from "@/components/ui/button";
import { filterProjects, initialProjectFilters, type DashboardProject, type ProjectFilters as Filters } from "@/lib/project-filters";
import { trpc } from "@/lib/trpc";
import { CloudDownload, FolderSearch, LoaderCircle, Tags } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function ProjectsPage() {
  const [filters, setFilters] = useState<Filters>(initialProjectFilters);
  const projectsQuery = trpc.projects.list.useQuery();
  const categoriesQuery = trpc.categories.list.useQuery();
  const utils = trpc.useUtils();
  const sync = trpc.projects.sync.useMutation({ onSuccess: async result => { await projectsQuery.refetch(); toast.success(`${result.synced} repositorios sincronizados`); }, onError: error => toast.error(error.message) });
  const autoAssign = trpc.projects.autoAssignCategories.useMutation({ onSuccess: async result => { await projectsQuery.refetch(); toast.success(`${result.assigned} proyectos organizados por etiquetas`); }, onError: error => toast.error(error.message) });
  const projects = (projectsQuery.data ?? []) as DashboardProject[];
  const categories = categoriesQuery.data ?? [];
  const filtered = useMemo(() => filterProjects(projects, filters), [projects, filters]);

  return <div className="page-enter">
    <header className="page-heading"><div><p className="eyebrow"><FolderSearch className="h-3.5 w-3.5" />BIBLIOTECA DE PROYECTOS</p><h1>Proyectos, con <span>contexto.</span></h1><p className="page-subtitle">Filtra, organiza en carpetas y mantén visible la siguiente acción de cada repositorio.</p></div><div className="page-actions"><CategoryManager categories={categories} /><Button variant="outline" className="secondary-action" onClick={() => autoAssign.mutate()} disabled={autoAssign.isPending || !categories.length}><Tags className="h-4 w-4" />{autoAssign.isPending ? "Organizando..." : "Usar etiquetas"}</Button><Button className="primary-action" onClick={() => sync.mutate()} disabled={sync.isPending}>{sync.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}Sincronizar</Button></div></header>
    <ProjectFilters filters={filters} categories={categories} onChange={setFilters} resultCount={filtered.length} />
    {projectsQuery.isLoading || categoriesQuery.isLoading ? <div className="loading-state"><LoaderCircle className="h-5 w-5 animate-spin" />Cargando proyectos...</div> : projectsQuery.isError || categoriesQuery.isError ? <QueryErrorNotice onRetry={() => { projectsQuery.refetch(); categoriesQuery.refetch(); }} /> : filtered.length ? <section className="project-grid">{filtered.map(project => <ProjectCard key={project.id} project={project} />)}</section> : <section className="empty-state slim"><span className="empty-state-icon"><FolderSearch className="h-6 w-6" /></span><h2>{projects.length ? "No encontramos proyectos con esos filtros." : "Aún no hay proyectos en el espacio."}</h2><p>{projects.length ? "Prueba a limpiar los filtros o busca con otra palabra." : "Sincroniza GitHub para importar tus repositorios."}</p>{!projects.length && <Button onClick={() => sync.mutate()} className="primary-action"><CloudDownload className="h-4 w-4" />Sincronizar GitHub</Button>}</section>}
  </div>;
}
