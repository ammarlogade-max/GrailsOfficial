import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StaffMember, RolePermission } from "../data/types";
import { staffMembers as seedStaff, roles as seedRoles } from "../data/admin-extras";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface StaffState {
  staff: StaffMember[];
  roles: RolePermission[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  toggleStaffActive: (id: string) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStaff(row: any): StaffMember {
  return { id: row.id, name: row.name, email: row.email, roleId: row.role_id, active: row.active, lastActive: row.last_active };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRole(row: any): RolePermission {
  return { id: row.id, name: row.id, displayName: row.display_name, description: row.description || "", isSystemRole: row.is_system_role, permissions: row.permissions || [] };
}

export const useStaffStore = create<StaffState>()(
  persist(
    (set, get) => ({
      staff: isSupabaseConfigured ? [] : seedStaff,
      roles: isSupabaseConfigured ? [] : seedRoles,
      loading: false,
      loaded: !isSupabaseConfigured,

      fetchAll: async () => {
        if (!isSupabaseConfigured) return;
        set({ loading: true });
        const [{ data: staff, error: sErr }, { data: roles, error: rErr }] = await Promise.all([
          supabase.from("staff_members").select("*").order("created_at"),
          supabase.from("roles").select("*"),
        ]);
        if (sErr) console.error("fetch staff_members failed:", sErr.message);
        if (rErr) console.error("fetch roles failed:", rErr.message);
        set({ staff: (staff || []).map(mapStaff), roles: (roles || []).map(mapRole), loading: false, loaded: true });
      },

      toggleStaffActive: async (id) => {
        const current = get().staff.find((s) => s.id === id);
        if (!current) return;
        const nextActive = !current.active;
        if (isSupabaseConfigured) {
          const { error } = await supabase.from("staff_members").update({ active: nextActive }).eq("id", id);
          if (error) throw error;
        }
        set((s) => ({ staff: s.staff.map((m) => (m.id === id ? { ...m, active: nextActive } : m)) }));
      },
    }),
    { name: "urbankicks-staff", partialize: (state) => (isSupabaseConfigured ? {} : { staff: state.staff, roles: state.roles }) }
  )
);
