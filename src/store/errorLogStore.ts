import { create } from "zustand";
import { supabase } from "../lib/supabase";

export interface ErrorLogEntry {
  id: string;
  level: "error" | "warning" | "info";
  message: string;
  stack?: string;
  component?: string;
  route?: string;
  browser?: string;
  os?: string;
  resolved: boolean;
  createdAt: string;
}

interface ErrorLogState {
  logs: ErrorLogEntry[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  markResolved: (id: string) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLog(row: any): ErrorLogEntry {
  return {
    id: row.id, level: row.level, message: row.message, stack: row.stack ?? undefined,
    component: row.component ?? undefined, route: row.route ?? undefined,
    browser: row.browser ?? undefined, os: row.os ?? undefined, resolved: row.resolved, createdAt: row.created_at,
  };
}

export const useErrorLogStore = create<ErrorLogState>()((set) => ({
  logs: [],
  loading: false,
  loaded: false,

  fetchAll: async () => {
    set({ loading: true });
    const { data, error } = await supabase.from("error_logs").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) console.error("fetch error_logs failed:", error.message);
    set({ logs: (data || []).map(mapLog), loading: false, loaded: true });
  },

  markResolved: async (id) => {
    const { error } = await supabase.from("error_logs").update({ resolved: true }).eq("id", id);
    if (error) throw error;
    set((s) => ({ logs: s.logs.map((l) => (l.id === id ? { ...l, resolved: true } : l)) }));
  },
}));