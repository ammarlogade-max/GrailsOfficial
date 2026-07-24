import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { useCatalogStore } from "../../store/catalogStore";
import { useToastStore } from "../../store/toastStore";
import Modal from "../../components/ui/Modal";
import Toggle from "../../components/ui/Toggle";
import ProductImage from "../../components/customer/ProductImage";
import type { Collection } from "../../data/types";

const blank: Collection = {
  id: "", name: "", slug: "", description: "", sectionTitle: "",
  showOnHomepage: false, homepageSortOrder: 0, productIds: [], active: true,
};

export default function CollectionsAdmin() {
  const { collections, products, upsertCollection, deleteCollection } = useCatalogStore();
  const showToast = useToastStore((s) => s.show);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Collection | null>(null);
  const [saving, setSaving] = useState(false);
  const original = collections.find((c) => c.id === editing);

  useEffect(() => {
    setForm(original ? { ...original } : null);
  }, [editing]); // eslint-disable-line react-hooks/exhaustive-deps

  function openNew() {
    setEditing("__new__");
    setForm({ ...blank, id: `col-${Date.now()}` });
  }

  async function handleDelete(id: string) {
    try {
      await deleteCollection(id);
      showToast("Collection removed", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove collection", "error");
    }
  }

  async function save() {
    if (!form) return;
    if (!form.name) {
      showToast("Collection name is required", "error");
      return;
    }
    setSaving(true);
    try {
      await upsertCollection({ ...form, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-") });
      showToast("Collection saved", "success");
      setEditing(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save collection", "error");
    } finally {
      setSaving(false);
    }
  }

  function toggleProduct(productId: string) {
    if (!form) return;
    const selected = form.productIds.includes(productId);
    setForm({ ...form, productIds: selected ? form.productIds.filter((id) => id !== productId) : [...form.productIds, productId] });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-neutral-500">Curated product groups shown on the homepage or as landing pages.</p>
        <button onClick={openNew} className="btn btn-primary btn-sm"><Plus size={14} /> Add Collection</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((c) => (
          <div key={c.id} className="card overflow-hidden">
            <div className="h-28 bg-neutral-100">{c.bannerPhoto && <ProductImage src={c.bannerPhoto} alt={c.name} />}</div>
            <div className="p-4">
              <div className="flex justify-between items-start">
                <p className="font-medium text-sm">{c.name}</p>
                <span className={`badge ${c.active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"}`}>{c.active ? "Active" : "Hidden"}</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">{c.productIds.length} products · {c.showOnHomepage ? "On homepage" : "Not on homepage"}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setEditing(c.id)} className="btn btn-outline btn-sm flex-1"><Pencil size={12} /> Edit</button>
                <button onClick={() => handleDelete(c.id)} className="p-2 text-neutral-400 hover:text-rose-500"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!form} onClose={() => setEditing(null)} title={form?.name || "New Collection"} size="lg">
        {form && (
          <div className="space-y-4">
            <div>
              <label className="field-label">Collection Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </div>
            <div>
              <label className="field-label">Homepage Section Title</label>
              <input value={form.sectionTitle} onChange={(e) => setForm({ ...form, sectionTitle: e.target.value })} className="input" />
            </div>
            <div className="flex items-center justify-between">
              <label className="field-label mb-0">Show on Homepage</label>
              <Toggle on={form.showOnHomepage} onChange={(v) => setForm({ ...form, showOnHomepage: v })} />
            </div>
            <div>
              <label className="field-label">Products in Collection ({form.productIds.length})</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                {products.map((p) => {
                  const selected = form.productIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 relative ${selected ? "border-[var(--color-primary)]" : "border-neutral-200"}`}
                      title={p.name}
                    >
                      <ProductImage src={p.images[0]} alt={p.name} />
                      {selected && <div className="absolute inset-0 bg-[var(--color-primary)]/20" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={save} disabled={saving} className="btn btn-primary w-full"><Save size={14} /> {saving ? "Saving..." : "Save Collection"}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
