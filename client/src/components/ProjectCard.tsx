import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type DashboardProject, relativeDate, statusLabel } from "@/lib/project-filters";
import { loadProjectTracking, saveProjectTracking, type ProjectTracking } from "@/lib/project-tracking";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowUpRight, Check, CircleDot, Github, Layers3, PencilLine, X } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const statusStyles = {
  activo: "status-active",
  pausado: "status-paused",
  publicado: "status-published",
  "en riesgo": "status-risk",
};

export default function ProjectCard({ project }: { project: DashboardProject }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tracking, setTracking] = useState<ProjectTracking>(() => loadProjectTracking(project.id, { nextAction: project.nextAction, blockerReason: project.blockerReason }));
  const [draft, setDraft] = useState<ProjectTracking>(tracking);
  const updateProject = trpc.projects.update.useMutation();

  const saveTracking = () => {
    saveProjectTracking(project.id, draft);
    setTracking(draft);
    setIsEditing(false);
    updateProject.mutate({ id: project.id, nextAction: draft.nextAction, blockerReason: draft.blockerReason }, {
      onSuccess: () => toast.success("Seguimiento guardado"),
      onError: () => toast.success("Seguimiento guardado en este dispositivo"),
    });
  };

  return (
    <article className="project-card group">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="project-mark" aria-hidden="true">{project.name.slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold tracking-[-0.02em]">{project.name}</h3>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{project.language || "Repositorio GitHub"}</p>
            </div>
          </div>
        </div>
        <Badge className={`status-badge ${statusStyles[project.status]}`}>{statusLabel(project.status)}</Badge>
      </div>

      <p className="project-description">{project.description || "Aún no hay una descripción para este proyecto."}</p>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">{project.phase}</span>
        <span className="text-xs font-semibold tabular-nums">{project.progress}%</span>
      </div>
      <Progress value={project.progress} className="project-progress mt-2" />

      <section className={tracking.blockerReason ? "project-tracking has-blocker" : "project-tracking"} aria-label={`Seguimiento de ${project.name}`}>
        {isEditing ? <div className="tracking-editor">
          <label>Siguiente tarea<textarea value={draft.nextAction ?? ""} onChange={event => setDraft(current => ({ ...current, nextAction: event.target.value || null }))} placeholder="Define el siguiente paso" maxLength={2000} /></label>
          <label>Motivo de bloqueo<textarea value={draft.blockerReason ?? ""} onChange={event => setDraft(current => ({ ...current, blockerReason: event.target.value || null }))} placeholder="Describe qué impide avanzar" maxLength={2000} /></label>
          <div className="tracking-editor-actions"><button className="tracking-cancel" onClick={() => { setDraft(tracking); setIsEditing(false); }}><X className="h-3.5 w-3.5" />Cancelar</button><button className="tracking-save" onClick={saveTracking} disabled={updateProject.isPending}><Check className="h-3.5 w-3.5" />Guardar</button></div>
        </div> : <>
          <div className="tracking-heading"><span>SIGUIENTE TAREA</span><button onClick={() => { setDraft(tracking); setIsEditing(true); }} aria-label={`Editar seguimiento de ${project.name}`}><PencilLine className="h-3.5 w-3.5" /></button></div>
          <p className="next-action-copy">{tracking.nextAction || "Define la siguiente acción"}</p>
          {tracking.blockerReason && <div className="blocker-copy"><AlertTriangle className="h-3.5 w-3.5" /><span>{tracking.blockerReason}</span></div>}
        </>}
      </section>

      <div className="mt-4 flex flex-wrap gap-2">
        {project.categoryName ? (
          <span className="category-chip" style={{ "--category-color": project.categoryColor || "#4F46E5" } as React.CSSProperties}>
            <span className="category-dot" />{project.categoryName}
          </span>
        ) : (
          <span className="category-chip neutral"><Layers3 className="h-3 w-3" />Sin categoría</span>
        )}
        <span className="category-chip neutral"><CircleDot className="h-3 w-3" />{relativeDate(project.githubPushedAt)}</span>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border/70 pt-4">
        <a href={project.repositoryUrl} target="_blank" rel="noreferrer" className="project-link" aria-label={`Abrir ${project.name} en GitHub`}>
          <Github className="h-4 w-4" />GitHub
        </a>
        <Link href={`/proyectos/${project.id}`} className="project-link project-link-strong">
          Ver proyecto <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </article>
  );
}
