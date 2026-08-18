import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Check, FolderPlus, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CategoryManager({ categories }: { categories: { id: number; name: string; color: string }[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#4F46E5");
  const [editing, setEditing] = useState<{ id: number; name: string; color: string } | null>(null);
  const utils = trpc.useUtils();
  const createCategory = trpc.categories.create.useMutation({
    onSuccess: async () => {
      await utils.categories.list.invalidate();
      toast.success("Carpeta creada");
      setName("");
    },
    onError: error => toast.error(error.message),
  });
  const deleteCategory = trpc.categories.delete.useMutation({
    onSuccess: () => utils.categories.list.invalidate(),
    onError: error => toast.error(error.message),
  });
  const updateCategory = trpc.categories.update.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.categories.list.invalidate(), utils.projects.list.invalidate()]);
      setEditing(null);
      toast.success("Carpeta actualizada");
    },
    onError: error => toast.error(error.message),
  });

  const handleCreate = () => {
    if (!name.trim()) return;
    createCategory.mutate({ name: name.trim(), color });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className="secondary-action"><FolderPlus className="h-4 w-4" />Gestionar carpetas</Button></DialogTrigger>
      <DialogContent className="category-dialog">
        <DialogHeader><DialogTitle>Carpetas de proyectos</DialogTitle><DialogDescription>Crea carpetas propias y asígnalas manualmente o por etiquetas de GitHub.</DialogDescription></DialogHeader>
        <div className="category-create-row">
          <input type="color" value={color} onChange={event => setColor(event.target.value)} aria-label="Color de carpeta" />
          <Input value={name} onChange={event => setName(event.target.value)} onKeyDown={event => { if (event.key === "Enter") handleCreate(); }} placeholder="Por ejemplo: Finanzas" maxLength={64} />
          <Button onClick={handleCreate} disabled={createCategory.isPending || !name.trim()}>Crear</Button>
        </div>
        <div className="category-list">
          {categories.length ? categories.map(category => editing?.id === category.id ? (
            <div className="category-list-item editing" key={category.id}>
              <input type="color" value={editing.color} onChange={event => setEditing({ ...editing, color: event.target.value })} aria-label={`Color de ${category.name}`} />
              <Input value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} maxLength={64} aria-label={`Nombre de ${category.name}`} />
              <button onClick={() => updateCategory.mutate(editing)} disabled={updateCategory.isPending || !editing.name.trim()} aria-label="Guardar carpeta" className="icon-button"><Check className="h-4 w-4" /></button>
              <button onClick={() => setEditing(null)} aria-label="Cancelar edición" className="icon-button"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="category-list-item" key={category.id}>
              <span className="category-dot" style={{ background: category.color }} /><span>{category.name}</span>
              <button onClick={() => setEditing(category)} aria-label={`Editar ${category.name}`} className="icon-button"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => deleteCategory.mutate({ id: category.id })} disabled={deleteCategory.isPending} aria-label={`Eliminar ${category.name}`} className="icon-button danger"><Trash2 className="h-4 w-4" /></button>
            </div>
          )) : <p className="empty-inline">Aún no hay carpetas. Crea la primera para organizar tu espacio.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
