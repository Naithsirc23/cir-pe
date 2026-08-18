import { relativeDate, type DashboardProject } from "@/lib/project-filters";
import { QueryErrorNotice } from "@/components/AccessNotice";
import { trpc } from "@/lib/trpc";
import { Activity, ArrowUpRight, Github, LoaderCircle } from "lucide-react";

export default function ActivityPage() {
  const projectsQuery = trpc.projects.list.useQuery();
  const projects = (projectsQuery.data ?? []) as DashboardProject[];
  return <div className="page-enter"><header className="page-heading"><div><p className="eyebrow"><Activity className="h-3.5 w-3.5" />SEÑALES DE DESARROLLO</p><h1>La actividad que <span>importa.</span></h1><p className="page-subtitle">Un pulso sencillo de los cambios más recientes que llegan desde GitHub.</p></div></header>{projectsQuery.isLoading ? <div className="loading-state"><LoaderCircle className="h-5 w-5 animate-spin" />Cargando actividad...</div> : projectsQuery.isError ? <QueryErrorNotice onRetry={() => projectsQuery.refetch()} /> : <section className="activity-timeline">{projects.length ? projects.slice().sort((a,b) => Number(b.githubPushedAt) - Number(a.githubPushedAt)).map(project => <article className="timeline-entry" key={project.id}><span className="timeline-node"><Github className="h-4 w-4" /></span><div className="timeline-entry-content"><div><p className="eyebrow">{relativeDate(project.githubPushedAt)}</p><h2>{project.name}</h2><p>{project.description || "El repositorio ha sido actualizado en GitHub."}</p></div><a href={project.repositoryUrl} target="_blank" rel="noreferrer" className="subtle-link">Abrir repositorio <ArrowUpRight className="h-4 w-4" /></a></div></article>) : <div className="empty-state slim"><span className="empty-state-icon"><Activity className="h-6 w-6" /></span><h2>Aún no hay actividad sincronizada.</h2><p>Cuando importes tus repositorios, aquí verás sus actualizaciones recientes.</p></div>}</section>}</div>;
}
