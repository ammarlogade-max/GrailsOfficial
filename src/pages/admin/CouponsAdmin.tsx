import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { usePromoStore } from "../../store/promoStore";
import { useCatalogStore } from "../../store/catalogStore";
import { useToastStore } from "../../store/toastStore";
import Toggle from "../../components/ui/Toggle";
import Modal from "../../components/ui/Modal";
import ProductImage from "../../components/customer/ProductImage";
import { formatDate, formatINR } from "../../lib/format";
import type { Coupon } from "../../data/types";

const blank: Coupon = { id: "", code: "", description: "", type: "percentage", value: 10, minOrderAmount: 999, maxUses: 100, usesPerUser: 1, currentUses: 0, active: true, startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 30*86400000).toISOString(), appliesTo: "all", categoryIds: [], productIds: [] };

export default function CouponsAdmin() {
  const { coupons, fetchAll, upsertCoupon, deleteCoupon, toggleCoupon } = usePromoStore();
  const { categories, products } = useCatalogStore();
  const showToast = useToastStore((s) => s.show);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Coupon>(blank);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function save() {
    if (!form.code) { showToast("Coupon code required", "error"); return; }
    try {
      await upsertCoupon({ ...form, code: form.code.toUpperCase() });
      showToast("Coupon saved", "success");
      setOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save coupon", "error");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCoupon(id);
      showToast("Coupon removed", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove coupon", "error");
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleCoupon(id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update coupon", "error");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-neutral-500">Discount codes customers can apply at checkout.</p>
        <button onClick={() => { setForm({ ...blank, id: `cpn-${Date.now()}` }); setOpen(true); }} className="btn btn-primary btn-sm"><Plus size={14} /> Create Coupon</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-neutral-50 text-neutral-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Code</th>
              <th className="text-left px-4 py-3 font-medium">Discount</th>
              <th className="text-left px-4 py-3 font-medium">Min Order</th>
              <th className="text-left px-4 py-3 font-medium">Usage</th>
              <th className="text-left px-4 py-3 font-medium">Valid Until</th>
              <th className="text-left px-4 py-3 font-medium">Active</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t border-neutral-100">
                <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                <td className="px-4 py-3">{c.type === "percentage" ? `${c.value}%` : c.type === "fixed" ? formatINR(c.value) : "Free Shipping"}</td>
                <td className="px-4 py-3 text-neutral-500">{formatINR(c.minOrderAmount)}</td>
                <td className="px-4 py-3 text-neutral-500">{c.currentUses}/{c.maxUses ?? "∞"}</td>
                <td className="px-4 py-3 text-neutral-500">{formatDate(c.endsAt)}</td>
                <td className="px-4 py-3"><Toggle on={c.active} onChange={() => handleToggle(c.id)} /></td>
                <td className="px-4 py-3 text-right flex justify-end gap-2">
                  <button onClick={() => { setForm(c); setOpen(true); }} className="text-xs text-[var(--color-primary)] font-medium">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-neutral-400 hover:text-rose-500"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Coupon Details">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="field-label">Code</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input" /></div>
            <div>
              <label className="field-label">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Coupon["type"] })} className="select">
                <option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option><option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div><label className="field-label">Value</label><input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: +e.target.value })} className="input" /></div>
            <div><label className="field-label">Min Order Amount</label><input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: +e.target.value })} className="input" /></div>
          </div>
          <div><label className="field-label">Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" /></div>
          <div>
            <label className="field-label">Applies To</label>
            <select
              value={form.appliesTo}
              onChange={(e) => setForm({ ...form, appliesTo: e.target.value as Coupon["appliesTo"], categoryIds: [], productIds: [] })}
              className="select"
            >
              <option value="all">All Products</option>
              <option value="category">Specific Categories</option>
              <option value="product">Specific Products</option>
            </select>
          </div>
          {form.appliesTo === "category" && (
            <div>
              <label className="field-label">Categories ({form.categoryIds.length} selected)</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {categories.map((c) => {
                  const selected = form.categoryIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setForm({ ...form, categoryIds: selected ? form.categoryIds.filter((id) => id !== c.id) : [...form.categoryIds, c.id] })
                      }
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${selected ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {form.appliesTo === "product" && (
            <div>
              <label className="field-label">Products ({form.productIds.length} selected)</label>
              <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto">
                {products.map((p) => {
                  const selected = form.productIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setForm({ ...form, productIds: selected ? form.productIds.filter((id) => id !== p.id) : [...form.productIds, p.id] })}
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
          )}
          <button onClick={save} className="btn btn-primary w-full">Save Coupon</button>
        </div>
      </Modal>
    </div>
  );
}
