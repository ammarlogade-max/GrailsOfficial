import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * True once real Supabase credentials are configured. Until then the app
 * falls back to local mock data (see each store's comments) so `npm run dev`
 * still works out of the box for UI development without a backend.
 */
export const isSupabaseConfigured = Boolean(
  url && anonKey && !url.includes("your-project-ref") && !anonKey.includes("your-anon-public-key")
);

if (!isSupabaseConfigured && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    "[UrbanKicks] Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing). " +
      "Running against local mock data. See SETUP.md to connect a real backend."
  );
}

export const supabase = createClient<Database>(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
