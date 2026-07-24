// Supabase Edge Function: verify-razorpay-payment
// Verifies the HMAC-SHA256 signature Razorpay returns after a successful
// checkout, then places the order via the `place_order` RPC using the
// service role (so it's trusted server-side, not the client claiming
// "payment succeeded"). Deploy with:
//   supabase functions deploy verify-razorpay-payment
// Requires secrets: RAZORPAY_KEY_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getClientIp, isBlocked } from "../_shared/ipGuard.ts";

async function hmacSha256Hex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ip = getClientIp(req);
  if (await isBlocked(ip, "api")) {
    return new Response(JSON.stringify({ error: "Request blocked" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_payload } = await req.json();

    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      return new Response(JSON.stringify({ error: "Razorpay is not configured on the server" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expectedSignature = await hmacSha256Hex(`${razorpay_order_id}|${razorpay_payment_id}`, keySecret);
    if (expectedSignature !== razorpay_signature) {
      return new Response(JSON.stringify({ error: "Payment signature verification failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: order, error } = await supabase.rpc("place_order", {
      ...order_payload,
      p_razorpay_order_id: razorpay_order_id,
    });
    if (error) throw error;

    // Mark payment fields that place_order doesn't set directly
    await supabase
      .from("orders")
      .update({ razorpay_payment_id, payment_status: "paid" })
      .eq("id", order.id);

    return new Response(JSON.stringify({ order }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
