// Generates a real, always-current sitemap.xml from the live database.
// This is our stand-in for the SRS's TanStack Start server route — since
// this app is a client-rendered SPA, there's no server process to hang a
// file route off, so an Edge Function serves the same purpose: a URL that
// runs server-side code and returns fresh XML on every request.
//
// Deploy: supabase functions deploy sitemap --no-verify-jwt
// Then add a rewrite at your host so /sitemap.xml points here — see
// SETUP.md for the exact Vercel/Netlify config.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://urbankicks.in";

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function urlEntry(loc: string, lastmod?: string, priority = "0.7", changefreq = "weekly") {
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""}    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const [{ data: products }, { data: categories }, { data: collections }] = await Promise.all([
    supabase.from("products").select("slug, updated_at").eq("status", "active"),
    supabase.from("categories").select("slug").eq("active", true),
    supabase.from("collections").select("slug").eq("active", true),
  ]);

  const staticPages = ["", "/products", "/track", "/login", "/register"];

  const entries = [
    ...staticPages.map((p) => urlEntry(`${SITE_URL}${p}`, undefined, p === "" ? "1.0" : "0.6", "daily")),
    ...(categories ?? []).map((c) => urlEntry(`${SITE_URL}/products?category=${c.slug}`, undefined, "0.8")),
    ...(collections ?? []).map((c) => urlEntry(`${SITE_URL}/collections/${c.slug}`, undefined, "0.8")),
    ...(products ?? []).map((p) => urlEntry(`${SITE_URL}/product/${p.slug}`, p.updated_at?.slice(0, 10), "0.9")),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
});
