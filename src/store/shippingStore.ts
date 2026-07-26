import { create } from "zustand";
import type { ShippingZone } from "../data/types";
import { supabase } from "../lib/supabase";

interface ShippingState {
  zones: ShippingZone[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  toggleZoneActive: (id: string) => Promise<void>;
  addZone: (zone: ShippingZone) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapZone(row: any): ShippingZone {
  return {
    id: row.id,
    name: row.name,
    states: row.states || [],
    active: row.active,
    rates: (row.shipping_rates || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (r: any) => ({ name: r.name, type: r.type, baseRate: Number(r.base_rate), freeAbove: r.free_above != null ? Number(r.free_above) : undefined, minDays: r.min_days, maxDays: r.max_days, courier: r.courier || "" })
    ),
  };
}

export const useShippingStore = create<ShippingState>()(
  (set, get) => ({
    zones: [],
    loading: false,
    loaded: false,

    fetchAll: async () => {
      set({ loading: true });
      const { data, error } = await supabase.from("shipping_zones").select("*, shipping_rates(*)").order("name");
      if (error) console.error("fetch shipping_zones failed:", error.message);
      set({ zones: (data || []).map(mapZone), loading: false, loaded: true });
    },

    toggleZoneActive: async (id) => {
      const current = get().zones.find((z) => z.id === id);
      if (!current) return;
      const nextActive = !current.active;
      const { error } = await supabase.from("shipping_zones").update({ active: nextActive }).eq("id", id);
      if (error) throw error;
      set((s) => ({ zones: s.zones.map((z) => (z.id === id ? { ...z, active: nextActive } : z)) }));
    },

    addZone: async (zone) => {
      const { data, error } = await supabase.from("shipping_zones").insert({ name: zone.name, states: zone.states, active: zone.active }).select().single();
      if (error) throw error;
      if (zone.rates.length) {
        await supabase.from("shipping_rates").insert(
          zone.rates.map((r) => ({ zone_id: data.id, name: r.name, type: r.type, base_rate: r.baseRate, free_above: r.freeAbove ?? null, min_days: r.minDays, max_days: r.maxDays, courier: r.courier }))
        );
      }
      set((s) => ({ zones: [...s.zones, { ...zone, id: data.id }] }));
    },
  })
);