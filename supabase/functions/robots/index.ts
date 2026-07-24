// Serves robots.txt, pointing crawlers at the dynamic sitemap function and
// blocking admin/account/checkout paths from being indexed.
// Deploy: supabase functions deploy robots --no-verify-jwt
// Then add a rewrite at your host so /robots.txt points here.
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://urbankicks.in";

Deno.serve(() => {
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /account
Disallow: /cart
Disallow: /checkout
Disallow: /login
Disallow: /register

Sitemap: ${SITE_URL}/sitemap.xml
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" } });
});
