import { create } from "zustand";
import type { AuditLogEntry } from "../data/types";
import { auditLogs as seed } from "../data/admin-extras";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface AuditState {
  logs: AuditLogEntry[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLog(row: any): AuditLogEntry {
  return {
    id: row.id,
    actorEmail: row.actor_email,
    actorRole: row.actor_role,
    action: row.action,
    entityType: row.entity_type,
    entityName: row.entity_name,
    changedFields: row.changed_fields ?? undefined,
    createdAt: row.created_at,
  };
}

// Read-only: audit logs are written by the database/backend, never edited from the admin UI.
export const useAuditStore = create<AuditState>()((set) => ({
  logs: isSupabaseConfigured ? [] : seed,
  loading: false,
  loaded: !isSupabaseConfigured,

  fetchAll: async () => {
    if (!isSupabaseConfigured) return;
    set({ loading: true });
    const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) console.error("fetch audit_logs failed:", error.message);
    set({ logs: (data || []).map(mapLog), loading: false, loaded: true });
  },
}));
