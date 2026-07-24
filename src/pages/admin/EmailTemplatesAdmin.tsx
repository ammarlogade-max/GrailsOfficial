import { useEffect, useState } from "react";
import { useEmailTemplatesStore } from "../../store/emailTemplatesStore";
import { useToastStore } from "../../store/toastStore";
import Toggle from "../../components/ui/Toggle";
import { Loader2 } from "lucide-react";

export default function EmailTemplatesAdmin() {
  const { templates, loading, fetchAll, updateTemplate, saveTemplate } = useEmailTemplatesStore();
  const [active, setActive] = useState<string | undefined>(undefined);
  const showToast = useToastStore((s) => s.show);
  const current = templates.find((t) => t.id === active) || templates[0];

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (!active && templates[0]) setActive(templates[0].id); }, [active, templates]);

  async function handleSave() {
    if (!current) return;
    try {
      await saveTemplate(current.id);
      showToast("Template saved", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save template", "error");
    }
  }

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6">
      {loading && <div className="flex items-center gap-2 text-sm text-neutral-400 col-span-full"><Loader2 size={14} className="animate-spin" /> Loading templates...</div>}
      <div className="card divide-y divide-neutral-100">
        {templates.map((t) => (
          <button key={t.id} onClick={() => setActive(t.id)} className={`w-full text-left p-3.5 flex items-center justify-between ${current?.id === t.id ? "bg-neutral-50" : ""}`}>
            <span className="text-sm font-medium">{t.name}</span>
            <span className={`w-2 h-2 rounded-full ${t.active ? "bg-green-500" : "bg-neutral-300"}`} />
          </button>
        ))}
      </div>
      {current && (
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{current.name}</h3>
            <Toggle on={current.active} onChange={(v) => updateTemplate(current.id, { active: v })} />
          </div>
          <div>
            <label className="field-label">Subject Line</label>
            <input value={current.subject} onChange={(e) => updateTemplate(current.id, { subject: e.target.value })} className="input" />
          </div>
          <div>
            <label className="field-label">Email Body</label>
            <textarea value={current.body} onChange={(e) => updateTemplate(current.id, { body: e.target.value })} className="textarea" rows={6} />
          </div>
          <p className="text-xs text-neutral-400">Use variables like {"{{customer_name}}"}, {"{{order_number}}"}, {"{{total}}"} — they'll be filled in automatically when sent.</p>
          <button onClick={handleSave} className="btn btn-primary btn-sm">Save Template</button>
        </div>
      )}
    </div>
  );
}
