import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { customers } from "../data/customers";
import { enforceRateLimit } from "../lib/rateLimit";
import { sanitizeText } from "../lib/sanitize";
import { needsMfaChallenge, verifyLoginChallenge } from "../lib/mfa";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  /** Call once at app startup (see src/lib/useAuthInit.ts) to restore/subscribe to the real Supabase session. No-ops in mock mode. */
  init: () => Promise<void>;
  login: (email: string, password?: string) => Promise<void>;
  register: (fullName: string, email: string, phone: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,

      init: async () => {
        if (!isSupabaseConfigured) return; // mock mode: persisted user is restored by `persist` middleware already
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) await hydrateFromSession(data.session.user.id, data.session.user.email || "", set);

        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            await hydrateFromSession(session.user.id, session.user.email || "", set);
          } else {
            set({ user: null });
          }
        });
      },

      login: async (email, password) => {
        if (!isSupabaseConfigured) {
          // Mock mode: log in as a matching demo customer (any password accepted)
          const existing = customers.find((c) => c.email.toLowerCase() === email.toLowerCase());
          set({
            user: existing
              ? { id: existing.id, fullName: existing.fullName, email: existing.email, phone: existing.phone }
              : { id: "cust-demo", fullName: "Demo Customer", email, phone: "9876543210" },
            error: null,
          });
          return;
        }
        set({ loading: true, error: null });
        try {
          await enforceRateLimit(`login:${email.toLowerCase()}`, 8, 300);
        } catch (err) {
          set({ loading: false, error: err instanceof Error ? err.message : "Too many attempts" });
          throw err;
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: password || "" });
        if (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
        if (data.user) await hydrateFromSession(data.user.id, data.user.email || "", set);
        set({ loading: false });
      },

      register: async (fullName, email, phone, password) => {
        const cleanName = sanitizeText(fullName);
        if (!isSupabaseConfigured) {
          set({ user: { id: "cust-new", fullName: cleanName, email, phone }, error: null });
          return;
        }
        set({ loading: true, error: null });
        try {
          await enforceRateLimit(`register:${email.toLowerCase()}`, 5, 600);
        } catch (err) {
          set({ loading: false, error: err instanceof Error ? err.message : "Too many attempts" });
          throw err;
        }
        const redirectTo = import.meta.env.VITE_SITE_URL || window.location.origin;
        const { data, error } = await supabase.auth.signUp({
          email,
          password: password || "",
          options: {
            data: { full_name: cleanName, phone },
            emailRedirectTo: `${redirectTo}/login`,
          },
        });
        if (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
        if (data.user) await hydrateFromSession(data.user.id, data.user.email || "", set);
        set({ loading: false });
      },

      logout: async () => {
        if (isSupabaseConfigured) await supabase.auth.signOut();
        set({ user: null });
      },
    }),
    { name: "urbankicks-auth", partialize: (state) => (isSupabaseConfigured ? {} : { user: state.user }) }
  )
);

async function hydrateFromSession(userId: string, email: string, set: (partial: Partial<AuthState>) => void) {
  const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", userId).single();
  set({
    user: { id: userId, fullName: profile?.full_name || "", email, phone: profile?.phone || "" },
    error: null,
  });
}

// ---------------------------------------------------------------------------
// Admin auth — same Supabase session, but requires an active staff_members row
// ---------------------------------------------------------------------------
interface AdminAuthState {
  isAdmin: boolean;
  adminUser: { name: string; email: string; roleId: string } | null;
  loading: boolean;
  error: string | null;
  mfaPending: { factorId: string } | null;
  init: () => Promise<void>;
  login: (email: string, password?: string) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      isAdmin: false,
      adminUser: null,
      loading: false,
      error: null,
      mfaPending: null,

      init: async () => {
        if (!isSupabaseConfigured) return;
        set({ loading: true });
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          await hydrateStaff(data.session.user.id, set);
        } else {
          set({ isAdmin: false, adminUser: null, mfaPending: null, error: null });
        }
        set({ loading: false });
      },

      login: async (email, password) => {
        if (!isSupabaseConfigured) {
          // Mock mode: any credentials sign in as a demo super admin
          set({ isAdmin: true, adminUser: { name: "Admin User", email: email || "admin@urbankicks.in", roleId: "super_admin" }, error: null });
          return;
        }
        set({ loading: true, error: null });
        try {
          await enforceRateLimit(`admin-login:${email.toLowerCase()}`, 5, 300);
        } catch (err) {
          set({ loading: false, error: err instanceof Error ? err.message : "Too many attempts" });
          throw err;
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: password || "" });
        if (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
        if (data.user) {
          const mfaCheck = await needsMfaChallenge();
          if (mfaCheck.required && mfaCheck.factorId) {
            // Password was correct, but this account has 2FA enrolled —
            // pause here rather than granting admin access. hydrateStaff
            // (and the login-alert it fires) only runs after verifyMfa
            // succeeds below.
            set({ loading: false, mfaPending: { factorId: mfaCheck.factorId } });
            return;
          }
          await hydrateStaff(data.user.id, set, true);
        }
        set({ loading: false });
      },

      verifyMfa: async (code) => {
        const pending = get().mfaPending;
        if (!pending) return;
        set({ loading: true, error: null });
        try {
          await verifyLoginChallenge(pending.factorId, code);
          set({ mfaPending: null });
          const { data } = await supabase.auth.getUser();
          if (data.user) await hydrateStaff(data.user.id, set, true);
        } catch (err) {
          set({ error: err instanceof Error ? err.message : "Invalid code" });
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      logout: async () => {
        if (isSupabaseConfigured) await supabase.auth.signOut();
        set({ isAdmin: false, adminUser: null, mfaPending: null });
      },
    }),
    { name: "urbankicks-admin-auth", partialize: (state) => (isSupabaseConfigured ? {} : { isAdmin: state.isAdmin, adminUser: state.adminUser }) }
  )
);

async function hydrateStaff(userId: string, set: (partial: Partial<AdminAuthState>) => void, logLogin = false) {
  const { data: staff, error } = await supabase.from("staff_members").select("name, email, role_id, active").eq("id", userId).single();
  if (error || !staff || !staff.active) {
    await supabase.auth.signOut();
    set({ isAdmin: false, adminUser: null, error: "This account does not have admin access." });
    return;
  }
  set({ isAdmin: true, adminUser: { name: staff.name, email: staff.email, roleId: staff.role_id }, error: null });
  if (logLogin) {
    // Fire-and-forget: records this login in the audit trail and alerts other
    // staff (except the super admin logging in, to avoid self-notifying).
    supabase.rpc("log_admin_login", { p_email: staff.email, p_role: staff.role_id }).then(({ error: logErr }) => {
      if (logErr) console.error("log_admin_login failed:", logErr.message);
    });
  }
}
