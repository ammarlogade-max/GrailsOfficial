import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "../data/types";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { usePromoStore } from "./promoStore";
import { useCatalogStore } from "./catalogStore";

export interface CartLine {
  productId: string;
  size: number;
  color: string;
  quantity: number;
}

export interface CartCouponItem {
  productId: string;
  subtotal: number;
}

interface CartState {
  lines: CartLine[];
  couponCode: string | null;
  discountAmount: number;
  addItem: (product: Product, size: number, color: string, qty?: number) => void;
  removeLine: (productId: string, size: number, color: string) => void;
  setQuantity: (productId: string, size: number, color: string, qty: number) => void;
  /** Validates server-side via the validate_coupon RPC (real mode) or the local promo store (mock mode). Takes per-line subtotals so category/product-scoped coupons only discount the matching items. */
  applyCoupon: (code: string, items: CartCouponItem[]) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      couponCode: null,
      discountAmount: 0,
      addItem: (product, size, color, qty = 1) =>
        set((s) => {
          const idx = s.lines.findIndex(
            (l) => l.productId === product.id && l.size === size && l.color === color
          );
          if (idx >= 0) {
            const lines = [...s.lines];
            lines[idx] = { ...lines[idx], quantity: lines[idx].quantity + qty };
            return { lines };
          }
          return { lines: [...s.lines, { productId: product.id, size, color, quantity: qty }] };
        }),
      removeLine: (productId, size, color) =>
        set((s) => ({
          lines: s.lines.filter((l) => !(l.productId === productId && l.size === size && l.color === color)),
        })),
      setQuantity: (productId, size, color, qty) =>
        set((s) => ({
          lines: s.lines
            .map((l) =>
              l.productId === productId && l.size === size && l.color === color ? { ...l, quantity: qty } : l
            )
            .filter((l) => l.quantity > 0),
        })),
      applyCoupon: async (code, items) => {
        const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
        if (isSupabaseConfigured) {
          const { data, error } = await supabase.rpc("validate_coupon", {
            p_code: code,
            p_cart_items: items.map((i) => ({ product_id: i.productId, subtotal: i.subtotal })),
          });
          const result = data?.[0];
          if (error || !result?.valid) {
            return { success: false, message: result?.message || error?.message || "Invalid or expired coupon code" };
          }
          set({ couponCode: code.toUpperCase(), discountAmount: Number(result.discount_amount) });
          return { success: true, message: "Coupon applied" };
        }
        // Mock mode: validate + scope against the local promo store and catalog
        const coupons = usePromoStore.getState().coupons;
        const found = coupons.find((c) => c.code.toLowerCase() === code.toLowerCase() && c.active);
        if (!found) return { success: false, message: "Invalid or expired coupon code" };
        if (subtotal < found.minOrderAmount) return { success: false, message: `Minimum order of ₹${found.minOrderAmount} required` };

        let scopedSubtotal = subtotal;
        if (found.appliesTo === "product") {
          scopedSubtotal = items.filter((i) => found.productIds.includes(i.productId)).reduce((s, i) => s + i.subtotal, 0);
        } else if (found.appliesTo === "category") {
          const products = useCatalogStore.getState().products;
          scopedSubtotal = items
            .filter((i) => found.categoryIds.includes(products.find((p) => p.id === i.productId)?.categoryId || ""))
            .reduce((s, i) => s + i.subtotal, 0);
        }
        if (found.appliesTo !== "all" && scopedSubtotal === 0) {
          return { success: false, message: "This coupon doesn't apply to the items in your cart" };
        }

        const discount =
          found.type === "percentage" ? Math.min(scopedSubtotal * (found.value / 100), found.maxDiscount || Infinity) : found.type === "fixed" ? Math.min(found.value, scopedSubtotal) : 0;
        set({ couponCode: found.code, discountAmount: discount });
        return { success: true, message: "Coupon applied" };
      },
      removeCoupon: () => set({ couponCode: null, discountAmount: 0 }),
      clear: () => set({ lines: [], couponCode: null, discountAmount: 0 }),
    }),
    { name: "urbankicks-cart" }
  )
);
