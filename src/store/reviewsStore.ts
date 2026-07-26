import { create } from "zustand";
import type { Review } from "../data/types";
import { supabase } from "../lib/supabase";
import { sanitizeText } from "../lib/sanitize";

interface ReviewsState {
  reviews: Review[];
  loading: boolean;
  loaded: boolean;
  /** Admin: all reviews. PDP: reviews for one product. Account page: one customer's reviews. */
  fetchAll: () => Promise<void>;
  fetchForProduct: (productId: string) => Promise<void>;
  fetchForCustomer: (customerId: string) => Promise<void>;
  addReview: (review: Review) => Promise<void>;
  setStatus: (id: string, status: Review["status"]) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  reply: (id: string, adminReply: string) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReview(row: any): Review {
  return {
    id: row.id,
    productId: row.product_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    orderId: row.order_id ?? undefined,
    rating: row.rating,
    title: row.title || "",
    body: row.body || "",
    images: row.images ?? undefined,
    status: row.status,
    pinned: row.pinned,
    adminReply: row.admin_reply ?? undefined,
    helpfulCount: row.helpful_count,
    createdAt: row.created_at,
  };
}

export const useReviewsStore = create<ReviewsState>()(
  (set, get) => ({
    reviews: [],
    loading: false,
    loaded: false,

    fetchAll: async () => {
      set({ loading: true });
      const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      if (error) console.error("fetchAll reviews failed:", error.message);
      set({ reviews: (data || []).map(mapReview), loading: false, loaded: true });
    },

    fetchForProduct: async (productId) => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("fetchForProduct reviews failed:", error.message);
        return;
      }
      const fresh = (data || []).map(mapReview);
      set((s) => ({ reviews: [...fresh, ...s.reviews.filter((r) => r.productId !== productId)] }));
    },

    fetchForCustomer: async (customerId) => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("fetchForCustomer reviews failed:", error.message);
        return;
      }
      const fresh = (data || []).map(mapReview);
      set((s) => ({ reviews: [...fresh, ...s.reviews.filter((r) => !fresh.some((f) => f.id === r.id))] }));
    },

    addReview: async (review) => {
      const clean = { ...review, title: sanitizeText(review.title), body: sanitizeText(review.body) };
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          product_id: clean.productId,
          customer_id: clean.customerId,
          customer_name: clean.customerName,
          order_id: clean.orderId || null,
          rating: clean.rating,
          title: clean.title,
          body: clean.body,
        })
        .select()
        .single();
      if (error) throw error;
      set((s) => ({ reviews: [mapReview(data), ...s.reviews] }));
    },

    setStatus: async (id, status) => {
      const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
      if (error) throw error;
      set((s) => ({ reviews: s.reviews.map((r) => (r.id === id ? { ...r, status } : r)) }));
    },

    togglePin: async (id) => {
      const current = get().reviews.find((r) => r.id === id);
      if (!current) return;
      const pinned = !current.pinned;
      const { error } = await supabase.from("reviews").update({ pinned }).eq("id", id);
      if (error) throw error;
      set((s) => ({ reviews: s.reviews.map((r) => (r.id === id ? { ...r, pinned } : r)) }));
    },

    reply: async (id, adminReply) => {
      const clean = sanitizeText(adminReply);
      const { error } = await supabase.from("reviews").update({ admin_reply: clean }).eq("id", id);
      if (error) throw error;
      set((s) => ({ reviews: s.reviews.map((r) => (r.id === id ? { ...r, adminReply: clean } : r)) }));
    },
  })
);