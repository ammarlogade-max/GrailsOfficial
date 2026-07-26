import { useEffect, useState } from "react";
import { Plus, MapPin, Trash2, Loader2 } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useToastStore } from "../../store/toastStore";
import Modal from "../../components/ui/Modal";
import { supabase } from "../../lib/supabase";
import type { Address } from "../../data/types";

export default function AccountAddresses() {
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: "Home", name: user?.fullName || "", phone: user?.phone || "", line1: "", city: "", state: "Maharashtra", pincode: "" });

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("fetch addresses failed:", error.message);
        } else {
          setAddresses(
            (data || []).map((r) => ({
              id: r.id,
              label: r.label,
              name: r.name,
              phone: r.phone,
              line1: r.line1,
              city: r.city,
              state: r.state,
              pincode: r.pincode,
              isDefault: r.is_default,
            }))
          );
        }
        setLoading(false);
      });
  }, [user?.id]);

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (user?.id) {
        const { data, error } = await supabase
          .from("addresses")
          .insert({ user_id: user.id, is_default: addresses.length === 0, ...form })
          .select()
          .single();
        if (error) throw error;
        setAddresses((a) => [
          ...a,
          { id: data.id, label: data.label, name: data.name, phone: data.phone, line1: data.line1, city: data.city, state: data.state, pincode: data.pincode, isDefault: data.is_default },
        ]);
      }
      setOpen(false);
      showToast("Address added", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to add address", "error");
    } finally {
      setSaving(false);
    }
  }

  async function removeAddress(id: string) {
    try {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
      setAddresses((s) => s.filter((x) => x.id !== id));
      showToast("Address removed", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove address", "error");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Saved Addresses</h3>
        <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm"><Plus size={14} /> Add Address</button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-neutral-400"><Loader2 size={14} className="animate-spin" /> Loading addresses...</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a.id} className="card p-4 relative">
              {a.isDefault && <span className="badge bg-neutral-900 text-white absolute top-3 right-3">Default</span>}
              <div className="flex items-center gap-2 mb-1.5">
                <MapPin size={14} className="text-[var(--color-primary)]" />
                <span className="font-medium text-sm">{a.label}</span>
              </div>
              <p className="text-sm text-neutral-700">{a.name}</p>
              <p className="text-sm text-neutral-500">{a.line1}, {a.city}, {a.state} - {a.pincode}</p>
              <p className="text-sm text-neutral-500">{a.phone}</p>
              <div className="flex gap-3 mt-3">
                <button onClick={() => removeAddress(a.id)} className="text-xs text-rose-500 flex items-center gap-1"><Trash2 size={12} /> Remove</button>
              </div>
            </div>
          ))}
          {addresses.length === 0 && <p className="text-sm text-neutral-500">No saved addresses.</p>}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add New Address">
        <form onSubmit={addAddress} className="space-y-3">
          <div>
            <label className="field-label">Label</label>
            <select value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="select">
              <option>Home</option><option>Work</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className="field-label">Full Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
          </div>
          <div>
            <label className="field-label">Address</label>
            <input required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">City</label>
              <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" />
            </div>
            <div>
              <label className="field-label">Pincode</label>
              <input required value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} className="input" />
            </div>
          </div>
          <button disabled={saving} className="btn btn-primary w-full">{saving ? "Saving..." : "Save Address"}</button>
        </form>
      </Modal>
    </div>
  );
}