import ProjectCard from "@/components/ProjectCard";
import { QueryErrorNotice } from "@/components/AccessNotice";
import { Button } from "@/components/ui/button";
import { type DashboardProject, relativeDate } from "@/lib/project-filters";
import { useDashboardData } from "@/lib/private-dashboard";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, CheckCircle2, CirclePause, CloudDownload, FolderGit2, LoaderCircle, Sparkles, UploadCloud } from "lucide-react";
import { Link } from "wouter";

function Metric({ label, value, tone, icon: Icon }: { label: string; value: number; tone: string; icon: typeof FolderGit2 }) {
  return <div className="metric-card"><div><p>{label}</p><strong>{value}</strong></div><span className={`metric-icon ${tone}`}><Icon className="h-5 w-5" /></span></div>;
}

export default function Home() {
  const dashboard = useDashboardData();
  const sync = trpc.projects.sync.useMutation({ onSuccess: () => dashboard.refetch() });
  const projects = dashboard.projects as DashboardProject[];
  const active = projects.filter(project => project.status === "activo").length;
  const paused = projects.filter(project => project.status === "pausado").length;
  const published = projects.filter(project => project.status === "publicado").length;
  const milestones = projects.filter(project => project.milestoneAt && project.milestoneAt >= new Date()).sort((a, b) => Number(a.milestoneAt) - Number(b.milestoneAt));
  const attention = projects.filter(project => project.status === "en riesgo" || project.priority === "alta").slice(0, 3);

  return <div className="page-enter">
    <header className="page-heading overview-heading">
      <div><p className="eyebrow"><Sparkles className="h-3.5 w-3.5" />TU ESPACIO DE PROYECTOS</p><h1>Todo lo que estás <span>construyendo.</span></h1><p className="page-subtitle">Una visión clara para decidir qué merece tu atención ahora.</p></div>
      {dashboard.source === "private" ? <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Datos privados · solo lectura</span> : <Button onClick={() => sync.mutate()} disabled={sync.isPending} className="primary-action"><CloudDownload className={`h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />{sync.isPending ? "Sincronizando..." : "Sincronizar GitHub"}</Button>}
    </header>
    {dashboard.isLoading ? <DashboardLoading /> : dashboard.isError ? <QueryErrorNotice onRetry={() => dashboard.refetch()} /> : !projects.length ? <EmptySync onSync={() => sync.mutate()} pending={sync.isPending} /> : <>
      <section className="metrics-grid" aria-label="Indicadores clave"><Metric label="Proyectos activos" value={active} tone="indigo" icon={FolderGit2} /><Metric label="En pausa" value={paused} tone="amber" icon={CirclePause} /><Metric label="Publicados" value={published} tone="green" icon={CheckCircle2} /><Metric label="Próximos hitos" value={milestones.length} tone="violet" icon={UploadCloud} /></section>
      <section className="overview-columns"><div className="overview-section"><div className="section-heading"><div><p className="eyebrow">PROYECTOS DESTACADOS</p><h2>En el foco</h2></div><Link href="/proyectos" className="subtle-link">Ver todos <ArrowUpRight className="h-4 w-4" /></Link></div><div className="project-grid compact">{projects.slice(0, 4).map(project => <ProjectCard key={project.id} project={project} readOnly={dashboard.source === "private"} />)}</div></div><aside className="overview-aside"><section className="attention-card"><p className="eyebrow">ATENCIÓN RECOMENDADA</p><h2>Próximos movimientos</h2>{attention.length ? <div className="attention-list">{attention.map(project => <Link href={`/proyectos/${project.id}`} key={project.id} className="attention-item"><span className="attention-initial">{project.name[0]}</span><span><strong>{project.name}</strong><small>{project.nextAction || "Revisar estado y siguiente acción"}</small></span><ArrowUpRight className="h-4 w-4" /></Link>)}</div> : <p className="empty-inline">No hay alertas. Agrega prioridades o acciones para que esta sección te guíe.</p>}</section><section className="activity-snapshot"><div className="section-heading"><div><p className="eyebrow">PULSO RECIENTE</p><h2>Actividad GitHub</h2></div></div>{projects.slice(0, 4).map(project => <div className="activity-row" key={project.id}><span className="activity-line-dot" /><div><strong>{project.name}</strong><p>Actualizado {relativeDate(project.githubPushedAt)}</p></div></div>)}</section></aside></section>
    </>}
  </div>;
}

function EmptySync({ onSync, pending }: { onSync: () => void; pending: boolean }) { return <section className="empty-state"><span className="empty-state-icon"><FolderGit2 className="h-7 w-7" /></span><p className="eyebrow">CONECTA TU ESPACIO</p><h2>Tus repositorios están a un paso.</h2><p>Importa los repositorios de <strong>Naithsirc23</strong> para convertirlos en proyectos organizables.</p><Button onClick={onSync} disabled={pending} className="primary-action">{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}{pending ? "Sincronizando..." : "Importar desde GitHub"}</Button></section>; }
function DashboardLoading() { return <div className="loading-state"><LoaderCircle className="h-5 w-5 animate-spin" />Cargando tu espacio de trabajo...</div>; }
