import { useEffect, useState } from "react";
import { usePromoStore } from "../../store/promoStore";
import { useCatalogStore } from "../../store/catalogStore";
import ProductImage from "../../components/customer/ProductImage";
import { useToastStore } from "../../store/toastStore";
import Toggle from "../../components/ui/Toggle";
import Modal from "../../components/ui/Modal";
import { formatDate } from "../../lib/format";
import { Plus, Trash2 } from "lucide-react";
import type { Offer } from "../../data/types";

const blank: Offer = {
  id: "", name: "", description: "", type: "percentage", value: 10, appliesTo: "all",
  showOnHomepage: false, badgeText: "", startsAt: new Date().toISOString(),
  endsAt: new Date(Date.now() + 30 * 86400000).toISOString(), active: true,
  categoryIds: [], collectionIds: [], productIds: [],
};

export default function OffersAdmin() {
  const { offers, fetchAll, upsertOffer, deleteOffer, toggleOffer } = usePromoStore();
  const { categories, products, collections } = useCatalogStore();
  const showToast = useToastStore((s) => s.show);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Offer>(blank);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function save() {
    if (!form.name) { showToast("Offer name required", "error"); return; }
    try {
      await upsertOffer(form);
      showToast("Offer saved", "success");
      setOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save offer", "error");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteOffer(id);
      showToast("Offer removed", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove offer", "error");
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleOffer(id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update offer", "error");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-neutral-500">Sitewide and collection-level promotional offers.</p>
        <button onClick={() => { setForm({ ...blank, id: `off-${Date.now()}` }); setOpen(true); }} className="btn btn-primary btn-sm">
          <Plus size={14} /> Create Offer
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {offers.map((o) => (
          <div key={o.id} className="card p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-sm">{o.name}</p>
                <p className="text-xs text-neutral-500 mt-1">{o.description}</p>
              </div>
              <Toggle on={o.active} onChange={() => handleToggle(o.id)} />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="badge bg-[var(--color-primary)] text-white">{o.badgeText}</span>
              <span className={`badge ${o.showOnHomepage ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"}`}>
                {o.showOnHomepage ? "On Homepage" : "Hidden"}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-2">{formatDate(o.startsAt)} — {formatDate(o.endsAt)}</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => { setForm(o); setOpen(true); }} className="btn btn-outline btn-sm flex-1">Edit</button>
              <button onClick={() => handleDelete(o.id)} className="p-2 text-neutral-400 hover:text-rose-500"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Offer Details">
        <div className="space-y-3">
          <div><label className="field-label">Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></div>
          <div><label className="field-label">Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Offer["type"] })} className="select">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
                <option value="buy_x_get_y">Buy X Get Y</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div><label className="field-label">Value</label><input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: +e.target.value })} className="input" /></div>
          </div>
          <div><label className="field-label">Badge Text</label><input value={form.badgeText} onChange={(e) => setForm({ ...form, badgeText: e.target.value })} className="input" /></div>
          <div>
            <label className="field-label">Applies To</label>
            <select
              value={form.appliesTo}
              onChange={(e) => setForm({ ...form, appliesTo: e.target.value as Offer["appliesTo"], categoryIds: [], collectionIds: [], productIds: [] })}
              className="select"
            >
              <option value="all">All Products</option>
              <option value="category">Specific Categories</option>
              <option value="collection">Specific Collections</option>
              <option value="product">Specific Products</option>
            </select>
          </div>
          {form.appliesTo === "category" && (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const selected = form.categoryIds.includes(c.id);
                return (
                  <button key={c.id} type="button" onClick={() => setForm({ ...form, categoryIds: selected ? form.categoryIds.filter((id) => id !== c.id) : [...form.categoryIds, c.id] })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${selected ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}>
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}
          {form.appliesTo === "collection" && (
            <div className="flex flex-wrap gap-2">
              {collections.map((c) => {
                const selected = form.collectionIds.includes(c.id);
                return (
                  <button key={c.id} type="button" onClick={() => setForm({ ...form, collectionIds: selected ? form.collectionIds.filter((id) => id !== c.id) : [...form.collectionIds, c.id] })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${selected ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}>
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}
          {form.appliesTo === "product" && (
            <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
              {products.map((p) => {
                const selected = form.productIds.includes(p.id);
                return (
                  <button key={p.id} type="button" onClick={() => setForm({ ...form, productIds: selected ? form.productIds.filter((id) => id !== p.id) : [...form.productIds, p.id] })}
                    className={`aspect-square rounded-lg overflow-hidden border-2 relative ${selected ? "border-[var(--color-primary)]" : "border-neutral-200"}`} title={p.name}>
                    <ProductImage src={p.images[0]} alt={p.name} />
                    {selected && <div className="absolute inset-0 bg-[var(--color-primary)]/20" />}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center justify-between">
            <label className="field-label mb-0">Show on Homepage</label>
            <Toggle on={form.showOnHomepage} onChange={(v) => setForm({ ...form, showOnHomepage: v })} />
          </div>
          <button onClick={save} className="btn btn-primary w-full">Save Offer</button>
        </div>
      </Modal>
    </div>
  );
}
