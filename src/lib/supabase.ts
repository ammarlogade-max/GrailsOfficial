import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function requireEnv(name: string, value: string | undefined) {
  if (!value || value.includes("your-project-ref") || value.includes("your-anon-public-key")) {
    throw new Error(`${name} is required. Configure Supabase before running Grail's Official.`);
  }
  return value;
}

export const supabase = createClient<Database>(
  requireEnv("VITE_SUPABASE_URL", url),
  requireEnv("VITE_SUPABASE_ANON_KEY", anonKey),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);