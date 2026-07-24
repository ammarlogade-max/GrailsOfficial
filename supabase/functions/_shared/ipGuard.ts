// Checks the caller's IP against the ip_rules table before letting a
// request proceed. This lives in Edge Functions (not RLS/Postgres)
// because Postgres has no visibility into the HTTP request's source IP —
// only the edge runtime sees that, via the x-forwarded-for header set by
// Supabase's proxy.
import { createClient } from "jsr:@supabase/supabase-js@2";

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

/**
 * Returns true if the request should be BLOCKED. Checks explicit blocks
 * first (always wins), then — only if an allow-list exists for this
 * scope — requires the IP to be on it. No rows for the scope means no
 * restriction (fail open, not fail closed, so a misconfigured or empty
 * ip_rules table never locks out real customers).
 */
export async function isBlocked(ip: string, scope: "all" | "admin" | "api"): Promise<boolean> {
  if (ip === "unknown") return false;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: rules } = await supabase
    .from("ip_rules")
    .select("ip_address, type")
    .eq("active", true)
    .in("scope", scope === "all" ? ["all"] : ["all", scope]);

  if (!rules || rules.length === 0) return false;

  const blocked = rules.filter((r) => r.type === "block").map((r) => r.ip_address);
  if (blocked.includes(ip)) return true;

  const allowList = rules.filter((r) => r.type === "allow").map((r) => r.ip_address);
  if (allowList.length > 0 && !allowList.includes(ip)) return true;

  return false;
}
