import { supabase, isSupabaseConfigured } from "./supabase";

/**
 * Throttles repeated attempts at a sensitive action (login, register) using
 * the check_rate_limit() Postgres function. No-ops in mock mode. Throws a
 * friendly error if the caller has exceeded the allowed attempts in the
 * time window, so callers can just try/catch around their existing flow.
 *
 * This is a complement to, not a replacement for, Supabase Auth's own
 * built-in abuse protection on the auth endpoints — it can't see a
 * request's real IP from the browser, so it keys on the email/identifier
 * being attempted instead.
 */
export async function enforceRateLimit(bucketKey: string, maxAttempts = 5, windowSeconds = 300) {
  if (!isSupabaseConfigured) return;
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_bucket_key: bucketKey,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });
  if (error) return; // fail open on infra errors — don't lock people out because of a network blip
  if (data === false) {
    throw new Error(`Too many attempts. Please wait a few minutes and try again.`);
  }
}
