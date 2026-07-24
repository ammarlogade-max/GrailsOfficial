import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminNotification } from "../data/types";
import { adminNotifications as seed } from "../data/admin-extras";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface NotificationsState {
  notifications: AdminNotification[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapNotification(row: any): AdminNotification {
  return { id: row.id, type: row.type, title: row.title, body: row.body || "", link: row.link || "", read: row.read, createdAt: row.created_at };
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set) => ({
      notifications: isSupabaseConfigured ? [] : seed,
      loading: false,
      loaded: !isSupabaseConfigured,

      fetchAll: async () => {
        if (!isSupabaseConfigured) return;
        set({ loading: true });
        const { data, error } = await supabase.from("admin_notifications").select("*").order("created_at", { ascending: false }).limit(50);
        if (error) console.error("fetch notifications failed:", error.message);
        set({ notifications: (data || []).map(mapNotification), loading: false, loaded: true });
      },

      markRead: async (id) => {
        if (isSupabaseConfigured) {
          const { error } = await supabase.from("admin_notifications").update({ read: true }).eq("id", id);
          if (error) throw error;
        }
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
      },

      markAllRead: async () => {
        if (isSupabaseConfigured) {
          const { error } = await supabase.from("admin_notifications").update({ read: true }).eq("read", false);
          if (error) throw error;
        }
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
      },
    }),
    { name: "urbankicks-notifications", partialize: (state) => (isSupabaseConfigured ? {} : { notifications: state.notifications }) }
  )
);
