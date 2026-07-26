import { create } from "zustand";
import type { Coupon, Offer } from "../data/types";
import { supabase } from "../lib/supabase";
import { sanitizeText } from "../lib/sanitize";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (id: string) => UUID_RE.test(id);

interface PromoState {
  coupons: Coupon[];
  offers: Offer[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  upsertCoupon: (c: Coupon) => Promise<void>;
  deleteCoupon: (id: string) => Promise<void>;
  toggleCoupon: (id: string) => Promise<void>;
  upsertOffer: (o: Offer) => Promise<void>;
  deleteOffer: (id: string) => Promise<void>;
  toggleOffer: (id: string) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCoupon(row: any): Coupon {
  return {
    id: row.id,
    code: row.code,
    description: row.description || "",
    type: row.type,
    value: Number(row.value),
    minOrderAmount: Number(row.min_order_amount),
    maxDiscount: row.max_discount != null ? Number(row.max_discount) : undefined,
    maxUses: row.max_uses,
    usesPerUser: row.uses_per_user,
    currentUses: row.current_uses,
    active: row.active,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    appliesTo: row.applies_to || "all",
    categoryIds: row.category_ids || [],
    productIds: row.product_ids || [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOffer(row: any): Offer {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    type: row.type,
    value: Number(row.value),
    appliesTo: row.applies_to,
    categoryIds: row.category_ids || [],
    collectionIds: row.collection_ids || [],
    productIds: row.product_ids || [],
    showOnHomepage: row.show_on_homepage,
    badgeText: row.badge_text || "",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    active: row.active,
  };
}

export const usePromoStore = create<PromoState>()(
  (set, get) => ({
    coupons: [],
    offers: [],
    loading: false,
    loaded: false,

    fetchAll: async () => {
      set({ loading: true });
      const [{ data: coupons, error: cErr }, { data: offers, error: oErr }] = await Promise.all([
        supabase.from("coupons").select("*").order("created_at", { ascending: false }),
        supabase.from("offers").select("*").order("created_at", { ascending: false }),
      ]);
      if (cErr) console.error("fetch coupons failed:", cErr.message);
      if (oErr) console.error("fetch offers failed:", oErr.message);
      set({ coupons: (coupons || []).map(mapCoupon), offers: (offers || []).map(mapOffer), loading: false, loaded: true });
    },

    upsertCoupon: async (rawC) => {
      const c: Coupon = { ...rawC, description: sanitizeText(rawC.description) };
      const payload = {
        code: c.code.toUpperCase(),
        description: c.description,
        type: c.type,
        value: c.value,
        min_order_amount: c.minOrderAmount,
        max_discount: c.maxDiscount ?? null,
        max_uses: c.maxUses,
        uses_per_user: c.usesPerUser,
        active: c.active,
        starts_at: c.startsAt,
        ends_at: c.endsAt,
        applies_to: c.appliesTo,
        category_ids: c.categoryIds,
        product_ids: c.productIds,
      };
      if (!isUuid(c.id)) {
        const { data, error } = await supabase.from("coupons").insert(payload).select().single();
        if (error) throw error;
        set((s) => ({ coupons: [mapCoupon(data), ...s.coupons] }));
      } else {
        const { data, error } = await supabase.from("coupons").update(payload).eq("id", c.id).select().single();
        if (error) throw error;
        const saved = mapCoupon(data);
        set((s) => ({ coupons: s.coupons.map((x) => (x.id === saved.id ? saved : x)) }));
      }
    },

    deleteCoupon: async (id) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
      set((s) => ({ coupons: s.coupons.filter((c) => c.id !== id) }));
    },

    toggleCoupon: async (id) => {
      const current = get().coupons.find((c) => c.id === id);
      if (!current) return;
      const nextActive = !current.active;
      const { error } = await supabase.from("coupons").update({ active: nextActive }).eq("id", id);
      if (error) throw error;
      set((s) => ({ coupons: s.coupons.map((c) => (c.id === id ? { ...c, active: nextActive } : c)) }));
    },

    upsertOffer: async (rawO) => {
      const o: Offer = { ...rawO, description: sanitizeText(rawO.description), badgeText: sanitizeText(rawO.badgeText) };
      const payload = {
        name: o.name,
        description: o.description,
        type: o.type,
        value: o.value,
        applies_to: o.appliesTo,
        show_on_homepage: o.showOnHomepage,
        badge_text: o.badgeText,
        active: o.active,
        starts_at: o.startsAt,
        ends_at: o.endsAt,
        category_ids: o.categoryIds,
        collection_ids: o.collectionIds,
        product_ids: o.productIds,
      };
      if (!isUuid(o.id)) {
        const { data, error } = await supabase.from("offers").insert(payload).select().single();
        if (error) throw error;
        set((s) => ({ offers: [mapOffer(data), ...s.offers] }));
      } else {
        const { data, error } = await supabase.from("offers").update(payload).eq("id", o.id).select().single();
        if (error) throw error;
        const saved = mapOffer(data);
        set((s) => ({ offers: s.offers.map((x) => (x.id === saved.id ? saved : x)) }));
      }
    },

    deleteOffer: async (id) => {
      const { error } = await supabase.from("offers").delete().eq("id", id);
      if (error) throw error;
      set((s) => ({ offers: s.offers.filter((o) => o.id !== id) }));
    },

    toggleOffer: async (id) => {
      const current = get().offers.find((o) => o.id === id);
      if (!current) return;
      const nextActive = !current.active;
      const { error } = await supabase.from("offers").update({ active: nextActive }).eq("id", id);
      if (error) throw error;
      set((s) => ({ offers: s.offers.map((o) => (o.id === id ? { ...o, active: nextActive } : o)) }));
    },
  })
);