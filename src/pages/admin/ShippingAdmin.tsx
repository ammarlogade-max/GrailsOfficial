import { useEffect, useState } from "react";
import { useShippingStore } from "../../store/shippingStore";
import { useToastStore } from "../../store/toastStore";
import Toggle from "../../components/ui/Toggle";
import Modal from "../../components/ui/Modal";
import { formatINR } from "../../lib/format";
import { Plus, Loader2 } from "lucide-react";

export default function ShippingAdmin() {
  const { zones, loading, fetchAll, toggleZoneActive, addZone } = useShippingStore();
  const showToast = useToastStore((s) => s.show);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", states: "", baseRate: 99, freeAbove: 999, minDays: 2, maxDays: 5, courier: "Delhivery" });

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleToggle(id: string) {
    try {
      await toggleZoneActive(id);
      showToast("Zone updated", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update zone", "error");
    }
  }

  async function handleAddZone() {
    if (!form.name) {
      showToast("Zone name is required", "error");
      return;
    }
    setSaving(true);
    try {
      await addZone({
        id: `zone-${Date.now()}`,
        name: form.name,
        states: form.states.split(",").map((s) => s.trim()).filter(Boolean),
        active: true,
        rates: [{ name: "Standard", type: "flat", baseRate: form.baseRate, freeAbove: form.freeAbove, minDays: form.minDays, maxDays: form.maxDays, courier: form.courier }],
      });
      showToast("Shipping zone added", "success");
      setOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to add zone", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-neutral-500">Configure delivery zones, rates, and courier partners.</p>
        <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm"><Plus size={14} /> Add Zone</button>
      </div>

      {loading && <div className="flex items-center gap-2 text-sm text-neutral-400"><Loader2 size={14} className="animate-spin" /> Loading...</div>}

      {zones.map((z) => (
        <div key={z.id} className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-sm">{z.name}</p>
              <p className="text-xs text-neutral-400">{z.states.length ? z.states.join(", ") : "All remaining states"}</p>
            </div>
            <Toggle on={z.active} onChange={() => handleToggle(z.id)} />
          </div>
          <table className="w-full text-sm">
            <thead className="text-neutral-400 text-xs">
              <tr><th className="text-left pb-2">Rate Name</th><th className="text-left pb-2">Base Rate</th><th className="text-left pb-2">Free Above</th><th className="text-left pb-2">Delivery Time</th><th className="text-left pb-2">Courier</th></tr>
            </thead>
            <tbody>
              {z.rates.map((r, i) => (
                <tr key={i} className="border-t border-neutral-100">
                  <td className="py-2">{r.name}</td>
                  <td className="py-2">{formatINR(r.baseRate)}</td>
                  <td className="py-2">{r.freeAbove ? formatINR(r.freeAbove) : "—"}</td>
                  <td className="py-2">{r.minDays}-{r.maxDays} days</td>
                  <td className="py-2">{r.courier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Shipping Zone">
        <div className="space-y-3">
          <div>
            <label className="field-label">Zone Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. South India" />
          </div>
          <div>
            <label className="field-label">States (comma-separated, blank = all remaining)</label>
            <input value={form.states} onChange={(e) => setForm({ ...form, states: e.target.value })} className="input" placeholder="e.g. Karnataka, Tamil Nadu" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Base Rate (₹)</label>
              <input type="number" value={form.baseRate} onChange={(e) => setForm({ ...form, baseRate: +e.target.value })} className="input" />
            </div>
            <div>
              <label className="field-label">Free Above (₹)</label>
              <input type="number" value={form.freeAbove} onChange={(e) => setForm({ ...form, freeAbove: +e.target.value })} className="input" />
            </div>
            <div>
              <label className="field-label">Min Days</label>
              <input type="number" value={form.minDays} onChange={(e) => setForm({ ...form, minDays: +e.target.value })} className="input" />
            </div>
            <div>
              <label className="field-label">Max Days</label>
              <input type="number" value={form.maxDays} onChange={(e) => setForm({ ...form, maxDays: +e.target.value })} className="input" />
            </div>
          </div>
          <div>
            <label className="field-label">Courier</label>
            <input value={form.courier} onChange={(e) => setForm({ ...form, courier: e.target.value })} className="input" />
          </div>
          <button disabled={saving} onClick={handleAddZone} className="btn btn-primary w-full">{saving ? "Saving..." : "Add Zone"}</button>
        </div>
      </Modal>
    </div>
  );
}
