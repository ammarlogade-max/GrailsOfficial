import { create } from "zustand";
import { supabase } from "../lib/supabase";

export interface IPRule {
  id: string;
  ipAddress: string;
  type: "allow" | "block";
  reason: string;
  scope: "all" | "admin" | "api";
  active: boolean;
  createdAt: string;
}

interface IPRuleState {
  rules: IPRule[];
  loading: boolean;
  fetchAll: () => Promise<void>;
  addRule: (rule: Omit<IPRule, "id" | "createdAt">) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRule(row: any): IPRule {
  return { id: row.id, ipAddress: row.ip_address, type: row.type, reason: row.reason || "", scope: row.scope, active: row.active, createdAt: row.created_at };
}

export const useIPRuleStore = create<IPRuleState>()((set) => ({
  rules: [],
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from("ip_rules").select("*").order("created_at", { ascending: false });
    if (error) console.error("fetch ip_rules failed:", error.message);
    set({ rules: (data || []).map(mapRule), loading: false });
  },

  addRule: async (rule) => {
    const { data, error } = await supabase
      .from("ip_rules")
      .insert({ ip_address: rule.ipAddress, type: rule.type, reason: rule.reason, scope: rule.scope, active: rule.active })
      .select()
      .single();
    if (error) throw error;
    set((s) => ({ rules: [mapRule(data), ...s.rules] }));
  },

  deleteRule: async (id) => {
    const { error } = await supabase.from("ip_rules").delete().eq("id", id);
    if (error) throw error;
    set((s) => ({ rules: s.rules.filter((r) => r.id !== id) }));
  },
}));