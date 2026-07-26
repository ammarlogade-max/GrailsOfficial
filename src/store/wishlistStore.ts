import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "./authStore";

interface WishlistState {
  productIds: string[];
  loaded: boolean;
  /** Loads the signed-in user's real wishlist from Supabase. Call after login. */
  fetchForUser: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  remove: (productId: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],
      loaded: false,

      fetchForUser: async () => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return;
        const { data, error } = await supabase.from("wishlist_items").select("product_id").eq("user_id", userId);
        if (error) {
          console.error("fetchForUser wishlist failed:", error.message);
          return;
        }
        set({ productIds: (data || []).map((r) => r.product_id), loaded: true });
      },

      toggle: async (productId) => {
        const userId = useAuthStore.getState().user?.id;
        const isWishlisted = get().productIds.includes(productId);
        if (userId) {
          if (isWishlisted) {
            const { error } = await supabase.from("wishlist_items").delete().eq("user_id", userId).eq("product_id", productId);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("wishlist_items").insert({ user_id: userId, product_id: productId });
            if (error) throw error;
          }
        }
        set((s) => ({
          productIds: isWishlisted ? s.productIds.filter((id) => id !== productId) : [...s.productIds, productId],
        }));
      },

      isWishlisted: (productId) => get().productIds.includes(productId),

      remove: async (productId) => {
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          const { error } = await supabase.from("wishlist_items").delete().eq("user_id", userId).eq("product_id", productId);
          if (error) throw error;
        }
        set((s) => ({ productIds: s.productIds.filter((id) => id !== productId) }));
      },
    }),
    { name: "urbankicks-wishlist", partialize: () => ({}) }
  )
);