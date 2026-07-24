import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useFAQStore } from "../../store/faqStore";
import { useToastStore } from "../../store/toastStore";
import Modal from "../../components/ui/Modal";
import Toggle from "../../components/ui/Toggle";
import type { FAQ } from "../../data/types";

const categories = ["general", "shipping", "payments", "returns", "products", "account"];

const blank: FAQ = { id: "", question: "", answer: "", category: "general", sortOrder: 0, active: true };

export default function FAQsAdmin() {
  const { faqs, loading, fetchAll, upsertFAQ, deleteFAQ, toggleFAQ } = useFAQStore();
  const showToast = useToastStore((s) => s.show);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FAQ | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (editing === "__new__") { setForm({ ...blank, id: `faq-${Date.now()}`, sortOrder: faqs.length + 1 }); return; }
    setForm(faqs.find((f) => f.id === editing) || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  async function save() {
    if (!form || !form.question || !form.answer) {
      showToast("Question and answer are required", "error");
      return;
    }
    setSaving(true);
    try {
      await upsertFAQ(form);
      showToast("FAQ saved", "success");
      setEditing(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save FAQ", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleFAQ(id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update FAQ", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    try {
      await deleteFAQ(id);
      showToast("FAQ removed", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove FAQ", "error");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-neutral-500">Shown on the storefront's help/FAQ section.</p>
        <button onClick={() => setEditing("__new__")} className="btn btn-primary btn-sm"><Plus size={14} /> Add FAQ</button>
      </div>

      {loading && <div className="flex items-center gap-2 text-sm text-neutral-400 mb-4"><Loader2 size={14} className="animate-spin" /> Loading...</div>}

      <div className="card divide-y divide-neutral-100">
        {faqs.map((f) => (
          <div key={f.id} className="flex items-start justify-between gap-4 p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="badge bg-neutral-100 text-neutral-500 capitalize">{f.category}</span>
                <p className="font-medium text-sm">{f.question}</p>
              </div>
              <p className="text-sm text-neutral-500 mt-1">{f.answer}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Toggle on={f.active} onChange={() => handleToggle(f.id)} />
              <button onClick={() => setEditing(f.id)} className="p-1.5 text-neutral-500 hover:text-neutral-900"><Pencil size={14} /></button>
              <button onClick={() => handleDelete(f.id)} className="p-1.5 text-neutral-400 hover:text-rose-500"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {!loading && faqs.length === 0 && <p className="text-center text-sm text-neutral-400 py-10">No FAQs yet.</p>}
      </div>

      <Modal open={!!form} onClose={() => setEditing(null)} title={form?.id.startsWith("faq-") && !faqs.some((f) => f.id === form.id) ? "New FAQ" : "Edit FAQ"}>
        {form && (
          <div className="space-y-3">
            <div>
              <label className="field-label">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="select">
                {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div><label className="field-label">Question</label><input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="input" /></div>
            <div><label className="field-label">Answer</label><textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="textarea" rows={4} /></div>
            <div className="flex items-center justify-between"><label className="field-label mb-0">Active</label><Toggle on={form.active} onChange={(v) => setForm({ ...form, active: v })} /></div>
            <button onClick={save} disabled={saving} className="btn btn-primary w-full">{saving ? "Saving..." : "Save FAQ"}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
