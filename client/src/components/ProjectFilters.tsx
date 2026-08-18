import { type ProjectFilters as Filters, type ProjectPriority, type ProjectStatus } from "@/lib/project-filters";
import { Search, SlidersHorizontal, X } from "lucide-react";

type Category = { id: number; name: string; color: string };

export default function ProjectFilters({
  filters,
  categories,
  onChange,
  resultCount,
}: {
  filters: Filters;
  categories: Category[];
  onChange: (next: Filters) => void;
  resultCount: number;
}) {
  const reset = () => onChange({ query: "", categoryId: "all", status: "all", priority: "all" });
  const isFiltered = filters.query || filters.categoryId !== "all" || filters.status !== "all" || filters.priority !== "all";

  return (
    <section className="filters-panel" aria-label="Filtrar proyectos">
      <div className="filters-search-wrap">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={filters.query} onChange={event => onChange({ ...filters, query: event.target.value })} placeholder="Buscar por nombre, descripción o tecnología..." aria-label="Buscar proyectos" />
      </div>
      <div className="filters-controls">
        <SlidersHorizontal className="hidden h-4 w-4 text-muted-foreground sm:block" />
        <select value={filters.categoryId} onChange={event => onChange({ ...filters, categoryId: event.target.value === "all" ? "all" : Number(event.target.value) })} aria-label="Filtrar por categoría">
          <option value="all">Todas las carpetas</option>
          {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select value={filters.status} onChange={event => onChange({ ...filters, status: event.target.value as ProjectStatus | "all" })} aria-label="Filtrar por estado">
          <option value="all">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="pausado">Pausado</option>
          <option value="publicado">Publicado</option>
          <option value="en riesgo">En riesgo</option>
        </select>
        <select value={filters.priority} onChange={event => onChange({ ...filters, priority: event.target.value as ProjectPriority | "all" })} aria-label="Filtrar por prioridad">
          <option value="all">Toda prioridad</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
        {isFiltered ? <button className="icon-button" onClick={reset} aria-label="Limpiar filtros"><X className="h-4 w-4" /></button> : null}
      </div>
      <p className="filters-result">{resultCount} {resultCount === 1 ? "proyecto" : "proyectos"}</p>
    </section>
  );
}
