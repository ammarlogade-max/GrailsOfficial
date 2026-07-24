import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useCatalogStore } from "../../store/catalogStore";
import { useToastStore } from "../../store/toastStore";
import Modal from "../../components/ui/Modal";
import Toggle from "../../components/ui/Toggle";
import type { Category } from "../../data/types";

const blank: Category = { id: "", name: "", slug: "", description: "", icon: "👟", sortOrder: 0, seoTitle: "", seoDescription: "", active: true };

export default function CategoriesAdmin() {
  const { categories, upsertCategory, deleteCategory, products } = useCatalogStore();
  const showToast = useToastStore((s) => s.show);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Category>(blank);

  function openNew() { setForm({ ...blank, id: `cat-${Date.now()}` }); setOpen(true); }
  function openEdit(c: Category) { setForm(c); setOpen(true); }
  async function save() {
    if (!form.name) { showToast("Category name required", "error"); return; }
    try {
      await upsertCategory({ ...form, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-") });
      showToast("Category saved", "success");
      setOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save category", "error");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCategory(id);
      showToast("Category removed", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove category", "error");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-neutral-500">Manage the categories customers browse by.</p>
        <button onClick={openNew} className="btn btn-primary btn-sm"><Plus size={14} /> Add Category</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{c.icon}</span>
                <div>
                  <p className="font-medium text-sm">{c.name}</p>
                  <p className="text-xs text-neutral-400">{products.filter((p) => p.categoryId === c.id).length} products</p>
                </div>
              </div>
              <span className={`badge ${c.active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"}`}>{c.active ? "Active" : "Hidden"}</span>
            </div>
            <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{c.description}</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => openEdit(c)} className="btn btn-outline btn-sm flex-1"><Pencil size={12} /> Edit</button>
              <button onClick={() => handleDelete(c.id)} className="p-2 text-neutral-400 hover:text-rose-500"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={form.name ? "Edit Category" : "New Category"}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </div>
            <div>
              <label className="field-label">Icon (emoji)</label>
              <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="field-label">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="textarea" rows={2} />
          </div>
          <div className="flex items-center justify-between">
            <label className="field-label mb-0">Active</label>
            <Toggle on={form.active} onChange={(v) => setForm({ ...form, active: v })} />
          </div>
          <button onClick={save} className="btn btn-primary w-full">Save Category</button>
        </div>
      </Modal>
    </div>
  );
}
