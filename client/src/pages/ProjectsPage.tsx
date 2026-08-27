import CategoryManager from "@/components/CategoryManager";
import { QueryErrorNotice } from "@/components/AccessNotice";
import ProjectCard from "@/components/ProjectCard";
import ProjectFilters from "@/components/ProjectFilters";
import { Button } from "@/components/ui/button";
import { filterProjects, initialProjectFilters, type DashboardProject, type ProjectFilters as Filters } from "@/lib/project-filters";
import { groupProjectsByCategory } from "@/lib/project-groups";
import { useDashboardData } from "@/lib/private-dashboard";
import { trpc } from "@/lib/trpc";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { closestCorners, DndContext, KeyboardSensor, PointerSensor, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, CloudDownload, FolderOpen, FolderSearch, LoaderCircle, Tags } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type GroupLike = ReturnType<typeof groupProjectsByCategory>[number];

function ProjectDropZone({ group, categories, canOrganize, assigningCategory, onAssignCategory }: { group: GroupLike; categories: ReturnType<typeof useDashboardData>["categories"]; canOrganize: boolean; assigningCategory: boolean; onAssignCategory: (projectId: number, categoryId: number | null) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id });
  return <div ref={setNodeRef} className={isOver ? "category-drop-zone is-over" : "category-drop-zone"}><SortableContext items={group.projects.map(project => `project:${project.id}`)} strategy={rectSortingStrategy}>{group.projects.length ? <section className="project-grid">{group.projects.map(project => <SortableProjectCard key={project.id} project={project} categories={categories} canOrganize={canOrganize} assigningCategory={assigningCategory} onAssignCategory={onAssignCategory} />)}</section> : <p className="category-empty-copy">Arrastra una card aquí o usa el selector Carpeta.</p>}</SortableContext></div>;
}

function SortableProjectCard({ project, categories, canOrganize, assigningCategory, onAssignCategory }: { project: DashboardProject; categories: ReturnType<typeof useDashboardData>["categories"]; canOrganize: boolean; assigningCategory: boolean; onAssignCategory: (projectId: number, categoryId: number | null) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `project:${project.id}`, disabled: !canOrganize, data: { categoryId: project.categoryId } });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? "sortable-project is-dragging" : "sortable-project"}><ProjectCard project={project} readOnly={true} categories={categories} canOrganize={canOrganize} assigningCategory={assigningCategory} onAssignCategory={categoryId => onAssignCategory(project.id, categoryId)} dragHandleProps={{ ...attributes, ...listeners }} /></div>;
}

export default function ProjectsPage() {
  const [filters, setFilters] = useState<Filters>(initialProjectFilters);
  const dashboard = useDashboardData();
  const sync = trpc.projects.sync.useMutation({ onSuccess: async result => { await dashboard.refetch(); toast.success(`${result.synced} repositorios sincronizados`); }, onError: error => toast.error(error.message) });
  const autoAssign = trpc.projects.autoAssignCategories.useMutation({ onSuccess: async result => { await dashboard.refetch(); toast.success(`${result.assigned} proyectos organizados por etiquetas`); }, onError: error => toast.error(error.message) });
  const projects = dashboard.projects as DashboardProject[];
  const categories = dashboard.categories;
  const filtered = useMemo(() => filterProjects(projects, filters), [projects, filters]);
  const categoryGroups = useMemo(() => groupProjectsByCategory(filtered, categories), [filtered, categories]);
  const initiallyOpenGroups = useMemo(() => categoryGroups.filter(group => group.projects.length).map(group => group.id), [categoryGroups]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const organizationIsFiltered = filters.query !== "" || filters.categoryId !== "all" || filters.status !== "all" || filters.priority !== "all";
  const canOrganize = dashboard.canOrganize && !organizationIsFiltered;

  const saveProjectAssignment = (projectId: number, categoryId: number | null) => {
    dashboard.assignCategory.mutate({ githubId: String(projectId), categoryId }, { onSuccess: () => toast.success("Categoría guardada en tu organización privada"), onError: error => toast.error(error.message) });
  };
  const moveCategory = (categoryId: number, direction: -1 | 1) => {
    const orderedIds = categories.map(category => category.id);
    const index = orderedIds.indexOf(categoryId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= orderedIds.length) return;
    [orderedIds[index], orderedIds[nextIndex]] = [orderedIds[nextIndex], orderedIds[index]];
    dashboard.reorderCategories.mutate(orderedIds, { onSuccess: () => toast.success("Orden de categorías guardado"), onError: error => toast.error(error.message) });
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id).replace("project:", "");
    const overId = event.over ? String(event.over.id) : null;
    if (!overId || !canOrganize) return;
    const allGroups = groupProjectsByCategory(projects, categories);
    const sourceGroup = allGroups.find(group => group.projects.some(project => String(project.id) === activeId));
    const targetGroup = allGroups.find(group => group.id === overId || group.projects.some(project => `project:${project.id}` === overId));
    if (!sourceGroup || !targetGroup) return;
    const movedProject = sourceGroup.projects.find(project => String(project.id) === activeId);
    if (!movedProject) return;
    const withoutSource = sourceGroup.projects.filter(project => String(project.id) !== activeId);
    const withoutTarget = targetGroup === sourceGroup ? withoutSource : targetGroup.projects.filter(project => String(project.id) !== activeId);
    const foundTargetIndex = withoutTarget.findIndex(project => `project:${project.id}` === overId);
    const targetIndex = foundTargetIndex < 0 ? withoutTarget.length : foundTargetIndex;
    const destination = [...withoutTarget];
    destination.splice(targetIndex, 0, movedProject);
    const changedGroups = targetGroup === sourceGroup ? [{ ...sourceGroup, projects: destination }] : [{ ...sourceGroup, projects: withoutSource }, { ...targetGroup, projects: destination }];
    const updates = changedGroups.flatMap(group => group.projects.map((project, position) => ({ githubId: String(project.id), categoryId: group.unassigned ? null : Number(group.id.replace("category-", "")), position })));
    dashboard.reorderProjects.mutate(updates, { onSuccess: () => toast.success("Proyecto reubicado en tu organización privada"), onError: error => toast.error(error.message) });
  };

  return <div className="page-enter">
    <header className="page-heading"><div><p className="eyebrow"><FolderSearch className="h-3.5 w-3.5" />BIBLIOTECA DE PROYECTOS</p><h1>Proyectos, con <span>contexto.</span></h1><p className="page-subtitle">Filtra, organiza en carpetas y mantén visible la siguiente acción de cada repositorio.</p></div><div className="page-actions">{dashboard.source === "private" ? <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Datos privados · organiza desde Linux</span> : <><CategoryManager categories={categories} /><Button variant="outline" className="secondary-action" onClick={() => autoAssign.mutate()} disabled={autoAssign.isPending || !categories.length}><Tags className="h-4 w-4" />{autoAssign.isPending ? "Organizando..." : "Usar etiquetas"}</Button><Button className="primary-action" onClick={() => sync.mutate()} disabled={sync.isPending}>{sync.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}Sincronizar</Button></>}</div></header>
    {dashboard.privateUnavailable && <section className="private-source-notice" role="status"><div><span>Conexión privada en pausa</span><p>Estás viendo GitHub mientras la API local de tu tailnet no está disponible en este dispositivo.</p></div><Button variant="outline" className="secondary-action" onClick={() => dashboard.retryPrivate()}>Reintentar</Button></section>}
    <ProjectFilters filters={filters} categories={categories} onChange={setFilters} resultCount={filtered.length} />
    {dashboard.source === "private" && <p className="organization-helper">{canOrganize ? "Arrastra una card a otra categoría o usa el selector Carpeta dentro de la card. El orden se guarda en SQLite." : dashboard.canOrganize ? "Limpia los filtros para reorganizar mediante arrastrar y soltar." : "La API privada está en modo solo lectura. Habilita CIR_PRIVATE_WRITE_ENABLED=true en tu equipo Linux para organizar."}</p>}
    {dashboard.isLoading ? <div className="loading-state"><LoaderCircle className="h-5 w-5 animate-spin" />Cargando proyectos...</div> : dashboard.isError ? <QueryErrorNotice onRetry={() => dashboard.refetch()} /> : filtered.length ? <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}><Accordion key={initiallyOpenGroups.join("|")} type="multiple" defaultValue={initiallyOpenGroups} className="category-accordion" aria-label="Proyectos agrupados por categoría">{categoryGroups.map((group, index) => <AccordionItem key={group.id} value={group.id} className="category-accordion-item">{canOrganize && !group.unassigned && <div className="category-order-controls"><button type="button" onClick={() => moveCategory(Number(group.id.replace("category-", "")), -1)} disabled={index === 0 || dashboard.reorderCategories.isPending} aria-label={`Subir ${group.name}`}><ChevronUp className="h-3.5 w-3.5" /></button><button type="button" onClick={() => moveCategory(Number(group.id.replace("category-", "")), 1)} disabled={index === categories.length - 1 || dashboard.reorderCategories.isPending} aria-label={`Bajar ${group.name}`}><ChevronDown className="h-3.5 w-3.5" /></button></div>}<AccordionTrigger className="category-accordion-trigger"><span className="category-accordion-title"><i style={{ "--category-color": group.color ?? "var(--muted-foreground)" } as React.CSSProperties}><FolderOpen className="h-4 w-4" /></i><span><b>{group.name}</b><small>{group.projects.length} {group.projects.length === 1 ? "proyecto" : "proyectos"}</small></span></span><span className="category-accordion-summary">{group.unassigned ? "Por organizar" : group.projects.length ? "Ver proyectos" : "Sin proyectos"}</span></AccordionTrigger><AccordionContent className="category-accordion-content"><ProjectDropZone group={group} categories={categories} canOrganize={canOrganize} assigningCategory={dashboard.assignCategory.isPending || dashboard.reorderProjects.isPending} onAssignCategory={saveProjectAssignment} /></AccordionContent></AccordionItem>)}</Accordion></DndContext> : <section className="empty-state slim"><span className="empty-state-icon"><FolderSearch className="h-6 w-6" /></span><h2>{projects.length ? "No encontramos proyectos con esos filtros." : "Aún no hay proyectos en el espacio."}</h2><p>{projects.length ? "Prueba a limpiar los filtros o busca con otra palabra." : "Sincroniza GitHub para importar tus repositorios."}</p>{!projects.length && <Button onClick={() => sync.mutate()} className="primary-action"><CloudDownload className="h-4 w-4" />Sincronizar GitHub</Button>}</section>}
  </div>;
}
