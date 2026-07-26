import { create } from "zustand";
import type { AdminNotification } from "../data/types";
import { supabase } from "../lib/supabase";

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
  (set) => ({
    notifications: [],
    loading: false,
    loaded: false,

    fetchAll: async () => {
      set({ loading: true });
      const { data, error } = await supabase.from("admin_notifications").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) console.error("fetch notifications failed:", error.message);
      set({ notifications: (data || []).map(mapNotification), loading: false, loaded: true });
    },

    markRead: async (id) => {
      const { error } = await supabase.from("admin_notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
      set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    },

    markAllRead: async () => {
      const { error } = await supabase.from("admin_notifications").update({ read: true }).eq("read", false);
      if (error) throw error;
      set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
    },
  })
);