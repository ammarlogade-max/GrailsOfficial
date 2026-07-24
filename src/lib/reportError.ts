import { supabase, isSupabaseConfigured } from "./supabase";

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Unknown";
}

function detectOS(): string {
  const platform = navigator.userAgent;
  if (platform.includes("Win")) return "Windows";
  if (platform.includes("Mac")) return "macOS";
  if (platform.includes("Linux")) return "Linux";
  if (platform.includes("Android")) return "Android";
  if (platform.includes("iPhone") || platform.includes("iPad")) return "iOS";
  return "Unknown";
}

/**
 * Records a client-side error to the error_logs table so it's visible in
 * the admin panel instead of only ever existing in a customer's browser
 * console where nobody on the team will ever see it. Best-effort and
 * silent on failure — reporting an error should never itself throw or
 * block the UI from recovering.
 */
export function reportError(
  message: string,
  options: { stack?: string; component?: string; level?: "error" | "warning" | "info"; metadata?: Record<string, unknown> } = {}
) {
  if (!isSupabaseConfigured) {
    console.error("[reportError – mock mode, not persisted]", message, options);
    return;
  }
  supabase
    .from("error_logs")
    .insert({
      level: options.level || "error",
      message: message.slice(0, 2000),
      stack: options.stack?.slice(0, 4000),
      component: options.component,
      route: window.location.pathname,
      browser: detectBrowser(),
      os: detectOS(),
      metadata: options.metadata,
    })
    .then(({ error }) => {
      if (error) console.error("reportError failed to persist:", error.message);
    });
}
