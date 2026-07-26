import { create } from "zustand";
import type { EmailTemplate } from "../data/types";
import { supabase } from "../lib/supabase";
import { sanitizeText, sanitizeBasicHtml } from "../lib/sanitize";

interface EmailTemplatesState {
  templates: EmailTemplate[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  updateTemplate: (id: string, patch: Partial<EmailTemplate>) => void;
  saveTemplate: (id: string) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTemplate(row: any): EmailTemplate {
  return { id: row.id, key: row.key, name: row.name, subject: row.subject, body: row.body, active: row.active };
}

export const useEmailTemplatesStore = create<EmailTemplatesState>()(
  (set, get) => ({
    templates: [],
    loading: false,
    loaded: false,

    fetchAll: async () => {
      set({ loading: true });
      const { data, error } = await supabase.from("email_templates").select("*");
      if (error) console.error("fetch email_templates failed:", error.message);
      set({ templates: (data || []).map(mapTemplate), loading: false, loaded: true });
    },

    updateTemplate: (id, patch) => set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

    saveTemplate: async (id) => {
      const raw = get().templates.find((x) => x.id === id);
      if (!raw) return;
      const t = { ...raw, subject: sanitizeText(raw.subject), body: sanitizeBasicHtml(raw.body) };
      set((s) => ({ templates: s.templates.map((x) => (x.id === id ? t : x)) }));
      const { error } = await supabase.from("email_templates").update({ subject: t.subject, body: t.body, active: t.active }).eq("id", id);
      if (error) throw error;
    },
  })
);