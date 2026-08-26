import { type DashboardProject, statusLabel } from "@/lib/project-filters";
import { QueryErrorNotice } from "@/components/AccessNotice";
import { useDashboardData } from "@/lib/private-dashboard";
import { CircleDotDashed, Flag, LoaderCircle } from "lucide-react";
import { Link } from "wouter";

export default function RoadmapPage() {
  const dashboard = useDashboardData();
  const projects = dashboard.projects as DashboardProject[];
  const phases = Array.from(new Set(projects.map(project => project.phase)));
  return <div className="page-enter"><header className="page-heading"><div><p className="eyebrow"><Flag className="h-3.5 w-3.5" />TRAYECTORIA DE PRODUCTO</p><h1>Un roadmap que <span>respira.</span></h1><p className="page-subtitle">La fase actual de cada repositorio, organizada para que veas el conjunto.</p></div></header>{dashboard.isLoading ? <div className="loading-state"><LoaderCircle className="h-5 w-5 animate-spin" />Cargando roadmap...</div> : dashboard.isError ? <QueryErrorNotice onRetry={() => dashboard.refetch()} /> : projects.length ? <section className="roadmap-board">{phases.map((phase, index) => <div className="roadmap-lane" key={phase}><div className="roadmap-lane-head"><span>{String(index + 1).padStart(2, "0")}</span><h2>{phase}</h2><small>{projects.filter(project => project.phase === phase).length}</small></div>{projects.filter(project => project.phase === phase).map(project => <Link href={`/proyectos/${project.id}`} className="roadmap-item" key={project.id}><div><strong>{project.name}</strong><p>{project.nextAction || "Definir la siguiente acción"}</p></div><span className={`mini-status ${project.status.replace(" ", "-")}`}>{statusLabel(project.status)}</span><div className="roadmap-progress"><i style={{ width: `${project.progress}%` }} /></div></Link>)}</div>)}</section> : <EmptyRoadmap />}</div>;
}

function EmptyRoadmap() { return <section className="empty-state slim"><span className="empty-state-icon"><CircleDotDashed className="h-6 w-6" /></span><h2>El roadmap aparecerá al sincronizar.</h2><p>Importa tus repositorios para empezar a ordenar sus fases y próximos pasos.</p></section>; }
