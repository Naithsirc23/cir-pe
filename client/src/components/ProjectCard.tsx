import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type DashboardProject, relativeDate, statusLabel } from "@/lib/project-filters";
import { ArrowUpRight, CircleDot, Github, Layers3 } from "lucide-react";
import { Link } from "wouter";

const statusStyles = {
  activo: "status-active",
  pausado: "status-paused",
  publicado: "status-published",
  "en riesgo": "status-risk",
};

export default function ProjectCard({ project }: { project: DashboardProject }) {
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

      <div className="mt-5 flex flex-wrap gap-2">
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
