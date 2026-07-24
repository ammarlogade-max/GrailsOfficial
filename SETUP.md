# UrbanKicks — Production Setup Guide

This gets you from this zip to a live site with a real database, real
authentication, and real Razorpay payments. Follow it in order.

**Time estimate:** 45–90 minutes for a first-time setup.

---

## 0. What you'll need

- A [Supabase](https://supabase.com) account (free tier is enough to start)
- A [Razorpay](https://razorpay.com) account (needs KYC/business docs approved before you can accept **live** payments — test mode works immediately)
- A [Vercel](https://vercel.com) account (or Netlify — instructions for both below)
- Node.js 18+ and npm installed locally
- The [Supabase CLI](https://supabase.com/docs/guides/cli): `npm install -g supabase`

---

## 1. Create your Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**.
2. Pick a name, a strong database password (save it somewhere), and a region close to your customers (e.g. Mumbai/`ap-south-1` for India).
3. Wait ~2 minutes for provisioning.
4. Go to **Settings → API** and copy:
   - **Project URL** → this is `VITE_SUPABASE_URL`
   - **anon public key** → this is `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → keep this secret, you'll need it once for seeding data (never put it in the frontend)

---

## 2. Run the database migrations

The full schema (tables, RLS policies, functions, triggers, storage buckets) is in `supabase/migrations/`. Apply them with the Supabase CLI:

```bash
supabase login
supabase link --project-ref <your-project-ref>   # found in your project URL / Settings > General
supabase db push
```

This runs, in order:
- `0001_schema.sql` — catalog, customers, orders, reviews, coupons/offers
- `0002_cms_and_admin.sql` — homepage CMS, staff/roles, support, media, shipping
- `0003_functions_triggers.sql` — auto-profile creation, order numbers, atomic checkout (`place_order`), rating aggregation, coupon validation, guest tracking
- `0004_rls.sql` — Row Level Security policies for every table
- `0005_storage.sql` — storage buckets (`product-images`, `banners`, `media`)
- `0006_reference_data.sql` — roles, email templates, shipping zones, footer, default homepage content

**Alternative (no CLI):** paste each file's contents into the Supabase Dashboard's **SQL Editor** and run them in the numbered order above.

---

## 3. Configure the frontend

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon key>
VITE_RAZORPAY_KEY_ID=<your Razorpay key id — see step 5>
```

Then:
```bash
npm install
npm run dev
```

The app auto-detects real credentials and switches out of demo mode — you'll see a console message in dev mode if it's still running on mock data.

---

## 4. Create your first admin user

Admin access requires a row in `staff_members` linked to a real Supabase Auth user — there's no "default" admin account for security reasons.

1. Go to your live site (or `localhost:5173`) → **Register** as a normal customer with the email you want to use for admin.
2. Confirm the email if Supabase email confirmation is enabled (Authentication → Providers → Email).
3. In the Supabase Dashboard → **Authentication → Users**, copy that user's **UUID**.
4. In the **SQL Editor**, run:
   ```sql
   insert into public.staff_members (id, name, email, role_id, active)
   values ('<paste-the-uuid>', 'Your Name', 'you@example.com', 'super_admin', true);
   ```
5. Go to `/admin/login` on your site and sign in with that email/password. You now have full admin access.

Repeat step 4 with a different `role_id` (`store_manager`, `inventory_manager`, `customer_support`, `marketing_manager`) to add teammates with restricted permissions — see `public.roles` for what each can do.

---

## 5. Set up Razorpay

1. Create a [Razorpay account](https://dashboard.razorpay.com/signup). Test mode works immediately; live payments need KYC approval (usually 1–2 business days for a registered business).
2. Go to **Settings → API Keys** → generate a Key ID + Key Secret (use **Test Mode** keys first).
3. Put the **Key ID** in your frontend's `.env.local` as `VITE_RAZORPAY_KEY_ID` (safe to expose — it's public by design).
4. The **Key Secret** goes ONLY into your Supabase Edge Function secrets (never the frontend):
   ```bash
   supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxxxx
   supabase secrets set RAZORPAY_KEY_SECRET=xxxxxxxxxxxxx
   ```
5. Deploy the two payment Edge Functions:
   ```bash
   supabase functions deploy create-razorpay-order
   supabase functions deploy verify-razorpay-payment
   ```
   The `verify-razorpay-payment` function also needs your project URL and service role key as secrets (it uses these to call `place_order` after confirming the payment is genuine):
   ```bash
   supabase secrets set SUPABASE_URL=https://<your-project-ref>.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your service role key>
   ```
6. When you're ready to go live: switch to **Live Mode** keys in Razorpay (after KYC is approved) and update the same secrets/env var with the live key id/secret.

Cash on Delivery needs none of this — it's handled entirely by the `place_order` database function.

---

## 5.5 SEO: sitemap.xml and robots.txt

This app is a client-rendered SPA (no server rendering), so `sitemap.xml`
and `robots.txt` are generated by two small Supabase Edge Functions instead
of static files — that way the sitemap always reflects your live product
catalog rather than going stale.

1. Deploy both functions:
   ```bash
   supabase functions deploy sitemap --no-verify-jwt
   supabase functions deploy robots --no-verify-jwt
   ```
2. Set the site URL secret (used to build absolute URLs in the output):
   ```bash
   supabase secrets set SITE_URL=https://yourdomain.com
   ```
3. Point your real domain's `/sitemap.xml` and `/robots.txt` at these
   functions with a rewrite rule. On **Vercel**, add to `vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/sitemap.xml", "destination": "https://<project-ref>.supabase.co/functions/v1/sitemap" },
       { "source": "/robots.txt", "destination": "https://<project-ref>.supabase.co/functions/v1/robots" }
     ]
   }
   ```
   On **Netlify**, add to `netlify.toml`:
   ```toml
   [[redirects]]
     from = "/sitemap.xml"
     to = "https://<project-ref>.supabase.co/functions/v1/sitemap"
     status = 200
   [[redirects]]
     from = "/robots.txt"
     to = "https://<project-ref>.supabase.co/functions/v1/robots"
     status = 200
   ```
4. Submit `https://yourdomain.com/sitemap.xml` to Google Search Console
   once it's live.

Per-page titles, meta descriptions, Open Graph tags, and JSON-LD structured
data (Product schema on product pages, Organization schema on the
homepage) are handled client-side by `src/lib/useSEO.ts` — search engines
that execute JavaScript (Google does) pick these up on page load. This
isn't equivalent to true server-side rendering, but it recovers most of
the practical SEO value without a framework rewrite.

---

## 6. (Optional) Seed the demo catalog

If you want realistic sample products/categories/collections to test with before adding your own inventory:

```bash
SUPABASE_URL=https://<your-project-ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<your service role key> \
npm run seed:demo
```

This is safe to run multiple times (it upserts by slug/SKU). Delete the seeded rows from the admin panel whenever you're ready to add real products.

---

## 7. Deploy the frontend

### Option A: Vercel (recommended)
```bash
npm install -g vercel
vercel
```
When prompted, set the same three env vars from `.env.local` in the Vercel project settings (**Settings → Environment Variables**), then redeploy. Vercel auto-detects the Vite build (`npm run build`, output `dist/`).

### Option B: Netlify
```bash
npm install -g netlify-cli
netlify deploy --build
```
Set the env vars in **Site settings → Environment variables**, same as above.

### Custom domain
Both Vercel and Netlify have a **Domains** tab — add your domain there and follow their DNS instructions (usually a CNAME or A record with your registrar).

### Client-side routing
This is a single-page app using React Router. Both Vercel and Netlify handle SPA fallback automatically for Vite projects, but if you deploy elsewhere, make sure your host rewrites all unmatched routes to `/index.html`.

---

## 8. Post-launch checklist

- [ ] Update `store_settings` in the admin panel (or SQL) with your real brand name, WhatsApp number, support email, business address, and social links.
- [ ] Replace the demo product photography — see `CREDITS.md` and `src/lib/images.ts` for where the placeholder photos are wired in.
- [ ] Review/adjust `shipping_zones` and `shipping_rates` for your actual courier rates.
- [ ] Switch Razorpay to live keys once KYC is approved (step 5.6).
- [ ] Set up a custom SMTP provider in Supabase (**Authentication → Email Templates → SMTP Settings**) so password reset / confirmation emails don't come from Supabase's shared, rate-limited sender.
- [ ] Turn on Supabase's daily backups (Settings → Database → Backups) once you have real customer data.
- [ ] Add your Google Analytics / Meta Pixel IDs in **Admin → Website Settings**.

---

## Architecture notes

- **Mock-mode fallback:** every store checks `isSupabaseConfigured` (`src/lib/supabase.ts`) and falls back to local mock data if env vars aren't set. This means `npm run dev` always works for UI development even without a backend — useful for onboarding new developers or previewing design changes.
- **`place_order` is the single source of truth for checkout.** It validates stock, computes totals, redeems coupons, decrements inventory, and writes the order — all atomically in one Postgres transaction. Both the COD path and the post-payment-verification path call the same function, so there's exactly one way an order gets created.
- **RLS is deny-by-default.** Every table has Row Level Security enabled; policies explicitly allow what should be visible. If something looks empty after go-live, check the relevant policy in `supabase/migrations/0004_rls.sql` before assuming it's a frontend bug.
- **Permissions are data, not code.** `public.roles.permissions` is a plain text array checked by `has_permission()`. Add a new role or tweak an existing one entirely via SQL/admin UI — no redeploy needed.
