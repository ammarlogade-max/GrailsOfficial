import { create } from "zustand";
import type { FAQ } from "../data/types";
import { supabase } from "../lib/supabase";
import { sanitizeText } from "../lib/sanitize";

interface FAQState {
  faqs: FAQ[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  upsertFAQ: (faq: FAQ) => Promise<void>;
  deleteFAQ: (id: string) => Promise<void>;
  toggleFAQ: (id: string) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapFAQ(row: any): FAQ {
  return { id: row.id, question: row.question, answer: row.answer, category: row.category || "general", sortOrder: row.sort_order, active: row.active };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (id: string) => UUID_RE.test(id);

export const useFAQStore = create<FAQState>()(
  (set, get) => ({
    faqs: [],
    loading: false,
    loaded: false,

    fetchAll: async () => {
      set({ loading: true });
      const { data, error } = await supabase.from("faqs").select("*").order("sort_order");
      if (error) console.error("fetch faqs failed:", error.message);
      set({ faqs: (data || []).map(mapFAQ), loading: false, loaded: true });
    },

    upsertFAQ: async (rawFaq) => {
      const faq: FAQ = { ...rawFaq, question: sanitizeText(rawFaq.question), answer: sanitizeText(rawFaq.answer) };
      const payload = { question: faq.question, answer: faq.answer, category: faq.category, sort_order: faq.sortOrder, active: faq.active };
      if (!isUuid(faq.id)) {
        const { data, error } = await supabase.from("faqs").insert(payload).select().single();
        if (error) throw error;
        set((s) => ({ faqs: [...s.faqs, mapFAQ(data)] }));
      } else {
        const { data, error } = await supabase.from("faqs").update(payload).eq("id", faq.id).select().single();
        if (error) throw error;
        const saved = mapFAQ(data);
        set((s) => ({ faqs: s.faqs.map((f) => (f.id === saved.id ? saved : f)) }));
      }
    },

    deleteFAQ: async (id) => {
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      if (error) throw error;
      set((s) => ({ faqs: s.faqs.filter((f) => f.id !== id) }));
    },

    toggleFAQ: async (id) => {
      const current = get().faqs.find((f) => f.id === id);
      if (!current) return;
      const nextActive = !current.active;
      const { error } = await supabase.from("faqs").update({ active: nextActive }).eq("id", id);
      if (error) throw error;
      set((s) => ({ faqs: s.faqs.map((f) => (f.id === id ? { ...f, active: nextActive } : f)) }));
    },
  })
);