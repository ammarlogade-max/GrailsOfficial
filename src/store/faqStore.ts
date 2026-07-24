import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FAQ } from "../data/types";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { sanitizeText } from "../lib/sanitize";

const seed: FAQ[] = [
  { id: "faq-1", question: "Are these products authentic?", answer: "UrbanKicks sells premium replica sneakers — we're upfront that these are not authentic brand-licensed products. We focus on build quality and value for money.", category: "general", sortOrder: 1, active: true },
  { id: "faq-2", question: "How long does delivery take?", answer: "Most orders are delivered within 2-5 business days depending on your location. You'll get tracking details once your order ships.", category: "shipping", sortOrder: 2, active: true },
  { id: "faq-3", question: "Is Cash on Delivery available?", answer: "Yes — COD is available on all orders with a small COD handling fee. You can also pay online via UPI or card for a smoother checkout.", category: "payments", sortOrder: 3, active: true },
  { id: "faq-4", question: "What's your return policy?", answer: "We offer a 7-day easy return and exchange window from the date of delivery, as long as the product is unused and in its original packaging.", category: "returns", sortOrder: 4, active: true },
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (id: string) => UUID_RE.test(id);

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

export const useFAQStore = create<FAQState>()(
  persist(
    (set, get) => ({
      faqs: isSupabaseConfigured ? [] : seed,
      loading: false,
      loaded: !isSupabaseConfigured,

      fetchAll: async () => {
        if (!isSupabaseConfigured) return;
        set({ loading: true });
        const { data, error } = await supabase.from("faqs").select("*").order("sort_order");
        if (error) console.error("fetch faqs failed:", error.message);
        set({ faqs: (data || []).map(mapFAQ), loading: false, loaded: true });
      },

      upsertFAQ: async (rawFaq) => {
        const faq: FAQ = { ...rawFaq, question: sanitizeText(rawFaq.question), answer: sanitizeText(rawFaq.answer) };
        if (isSupabaseConfigured) {
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
          return;
        }
        set((s) => ({ faqs: s.faqs.some((f) => f.id === faq.id) ? s.faqs.map((f) => (f.id === faq.id ? faq : f)) : [...s.faqs, faq] }));
      },

      deleteFAQ: async (id) => {
        if (isSupabaseConfigured) {
          const { error } = await supabase.from("faqs").delete().eq("id", id);
          if (error) throw error;
        }
        set((s) => ({ faqs: s.faqs.filter((f) => f.id !== id) }));
      },

      toggleFAQ: async (id) => {
        const current = get().faqs.find((f) => f.id === id);
        if (!current) return;
        const nextActive = !current.active;
        if (isSupabaseConfigured) {
          const { error } = await supabase.from("faqs").update({ active: nextActive }).eq("id", id);
          if (error) throw error;
        }
        set((s) => ({ faqs: s.faqs.map((f) => (f.id === id ? { ...f, active: nextActive } : f)) }));
      },
    }),
    { name: "urbankicks-faqs", partialize: (state) => (isSupabaseConfigured ? {} : { faqs: state.faqs }) }
  )
);
