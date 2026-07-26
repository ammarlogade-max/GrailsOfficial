# Grail's Official

A premium sneaker e-commerce platform, built from the Grail's Official SRS v2.0.
This repo now runs in **two modes**:

- **Mock mode** (default, no setup): realistic in-memory/localStorage data via
  Zustand, exactly as before — great for UI work with zero backend.
- **Production mode**: a real Supabase backend (Postgres + Auth + Storage +
  Edge Functions) and real Razorpay payments, once you add credentials.

**→ See `SETUP.md` for the full step-by-step guide to going live** (creating
the Supabase project, running migrations, Razorpay setup, deployment).

`npm run dev` works immediately in mock mode with no configuration.

---

## Current build status

Being upfront about what's real vs. what's still mock-only, so nothing here
gets mistaken for further along than it is:

### ✅ Real (when Supabase is configured)
- **Database**: complete schema for every domain in the SRS — catalog,
  orders, reviews, coupons/offers, homepage CMS, support/returns, media,
  audit logs, staff/roles, email templates, shipping (`supabase/migrations/`).
  Verified by actually running all 6 migrations against a real Postgres
  instance and exercising `place_order`, `validate_coupon`, `track_order`,
  and the review-rating trigger directly — not just written, tested.
- **Row Level Security**: every table locked down by default, with explicit
  policies for public storefront reads, customer-owned data, and
  permission-gated staff writes (`0004_rls.sql`).
- **Auth**: real Supabase Auth for customers (email/password) and staff
  (checked against `staff_members` + `roles`), with automatic profile
  creation on signup. Falls back to instant mock login when unconfigured.
- **Checkout**: Cash on Delivery calls the `place_order` Postgres function
  directly (atomic: validates stock, computes totals, redeems coupons,
  decrements inventory). UPI/Card payments go through Razorpay Checkout,
  with signature verification happening **server-side** in a Supabase Edge
  Function before the order is ever created.
- **Orders**: the admin Orders list/detail and the customer's Account →
  Orders now both read and write real orders (status updates, courier/
  tracking info, internal notes).
- **Catalog**: Products, Categories, and Collections (admin list + create +
  edit + delete, including product images/sizes/colors and collection
  membership) now read and write the real database, with the storefront
  (homepage, listing, PDP) loading the real catalog on app start.
- **Reviews**: product page reviews, a customer's own review history, and
  admin moderation (approve/hide/pin/reply) all read and write real data.
- **Coupons & Offers**: admin CRUD is real. Checkout coupon validation goes
  through the `validate_coupon` database function rather than reading the
  coupons table directly — customers can never SELECT coupon codes, only
  validate one they already have, which stops code-scraping.
- **Wishlist & Addresses**: tied to the signed-in customer's real
  `wishlist_items` and `addresses` tables. Guests keep a local-only
  wishlist since there's no account to attach it to.
- **Homepage CMS & Website Settings**: branding, hero section, announcement
  bar, offer banners (including add/remove), and homepage sections all
  read and write the real `store_settings` / `homepage_hero` /
  `announcement_bar` / `homepage_banners` / `homepage_sections` tables.
  Text fields autosave on blur rather than on every keystroke, so editing
  doesn't spam the database.

- **Support Tickets & Returns**: admin ticket list, replies, and status
  updates, plus return/exchange request tracking, all read and write real
  data.
- **Media Library**: uploads go to real Supabase Storage (not a simulated
  button) — pick a file, it lands in the `media` bucket and gets recorded
  in `media_assets` with a real public URL.
- **Notifications**: admin alerts (new orders, low stock, new reviews,
  etc.) read from and write back to `admin_notifications`.
- **Staff & Roles**: staff list and role permissions are real; activating/
  deactivating a staff member writes to the database. Creating a brand-new
  staff login still needs one manual SQL step (documented in-app and in
  SETUP.md) since that requires the Supabase service role, which the
  browser can't safely hold.
- **Audit Logs**: reads the real `audit_logs` table. Nothing in this build
  writes to it yet (no domain currently logs its own changes there), so
  expect it to stay empty until that's added — noting this honestly rather
  than leaving it silently non-functional.
- **Email Templates**: real read/edit/save against `email_templates`.
  Nothing sends these emails yet — that would need an email provider
  (e.g. Resend, Postmark) wired into an Edge Function, which is a
  reasonable next step but out of scope for the storefront itself.
- **Shipping Zones**: real zones with rates, including adding a new zone
  with its first rate.
- **Dashboard, Analytics, and Reports**: now trigger their own real order
  fetch on load rather than relying on another page having loaded them
  first, so the numbers are accurate however you navigate in.

At this point every admin domain in the original spec reads and writes
the real database when Supabase is configured. What's left is mostly
polish rather than new plumbing:
- Inventory bulk-edit tools (multi-select price/stock updates)
- Sending real transactional emails from the templates above
- Populating audit logs automatically from admin actions
- A self-service "invite staff" flow via an Edge Function + Admin API

Each store in `src/store/` follows the same pattern: check
`isSupabaseConfigured`, branch to real Supabase queries, map snake_case
rows to the existing camelCase types, and keep the mock array as the
offline fallback.

---

## SRS v2.0 compliance — Phase 1 (Security & Permissions)

The SRS v2.0 addendum calls for granular permissions, automatic audit
logging, and several security hardening items marked "never later." This
phase closes those, adapted to run on our stack (Vite SPA, not the
TanStack Start SSR the SRS assumed) rather than requiring a rewrite:

- **Granular permissions**: real `permissions` + `role_permissions` tables
  (not just a flat array) back `has_permission()`, and the admin sidebar
  now actually hides sections a staff member's role can't access —
  previously everyone saw every tab regardless of role.
- **Automatic audit logging**: database triggers fire on every write to
  products, orders, coupons, offers, categories, collections, homepage
  content, and staff — no domain has to remember to log itself anymore.
  Admin logins are logged and alert other staff too.
- **Input sanitization**: every free-text field a customer or admin can
  submit (product descriptions, reviews, support replies, order notes,
  coupon/offer descriptions, CMS text, email templates) is stripped of
  HTML/scripts via DOMPurify before it's ever written to the database —
  verified end-to-end that a `<script>` tag in a product description gets
  fully stripped, not just hidden by escaping.
- **Rate limiting**: login, register, and admin login all check a
  database-backed attempt counter before hitting Supabase Auth. This is a
  complement to (not a replacement for) Supabase Auth's own built-in abuse
  protection, since a browser can't enforce anything a determined caller
  can't bypass by hitting the API directly.
- Expanded `store_settings` (logo/favicon, more theme colors, fonts, more
  socials, GTM, Search Console), coupon/offer category-scoping columns,
  support ticket SLA fields, `ip_rules` and `error_logs` tables, and a
  `faqs` table — schema is ready; admin UI for IP rules, error log
  viewing, and FAQs is still pending (Phase 4).

## SRS v2.0 compliance — Phase 2 (SEO)

The SRS assumed TanStack Start SSR for this; adapted below to work as a
client-rendered SPA.

- **Per-page SEO** (`src/lib/useSEO.ts`): every real page sets its own
  title, meta description, canonical URL, Open Graph/Twitter tags, and
  `robots` directive — verified in a real browser, page by page, that
  these actually change on navigation and reset correctly (not just
  written and assumed to work). Product pages carry full `Product`
  JSON-LD (price, availability, rating); the homepage carries
  `Organization` JSON-LD.
- Cart, Checkout, Login, Register, the whole Account section, and the
  whole Admin section are `noindex` — nothing behind a login or mid
  checkout should show up in search results.
- **Found and fixed a real bug** while verifying this: `useThemeSync`
  (mounted once at the app root, never unmounts) was also setting
  `document.title`, and because React fires child-component effects
  before parent-component effects on mount, it ran *after* every page's
  `useSEO` and silently overwrote every page back to the site-wide
  default title. Confirmed the fix by checking actual `document.title`
  in the browser across four different pages before shipping this.
- **`sitemap.xml` and `robots.txt`** are Supabase Edge Functions (see
  `supabase/functions/sitemap` and `/robots`) rather than static files,
  so the sitemap always reflects the live catalog. Needs a host-level
  rewrite to serve at the real paths — documented in SETUP.md §5.5.

Still not done: BreadcrumbList JSON-LD, and admin UI for most of the new
settings fields (logo upload, fonts, GTM, Search Console) added in Phase
1 — they're in the type and database now but nothing edits them yet.

## SRS v2.0 compliance — Phase 3 (Coupon/Offer Scoping)

- **Category/product-scoped coupons and offers are now real**, not just a
  dropdown that did nothing. Admin can restrict a coupon to specific
  categories or products, and checkout only discounts the matching items
  — not the whole cart.
- The `validate_coupon` database function was rewritten to accept the
  cart's actual contents (not just a total), so it can compute a discount
  scoped to only the matching lines and reject a coupon outright if
  nothing in the cart qualifies. `place_order` was updated to match.
- **Verified with real Postgres, not just read for correctness**: built a
  scoped "20% off Running category only" coupon and confirmed three
  cases — cart with only the scoped item (discount applied), cart with
  only an unrelated item (coupon correctly rejected as "doesn't apply"),
  and a mixed cart (discount applied *only* to the matching line, not the
  full total). Also re-ran the full `place_order` flow end-to-end with a
  scoped coupon and confirmed stock decrement, coupon redemption count,
  and order totals were all correct.
- Note for anyone continuing this: one test run hit a transient
  "insufficient stock" error that didn't reproduce across three
  subsequent clean-database attempts with identical data — it lined up
  with the local Postgres service having just restarted, not a logic
  bug. Flagging it here rather than pretending the one anomaly never
  happened.

## SRS v2.0 compliance — Phase 3 continued (Media Library, Invoices, CSV)

- **Media Library is now actually used**, not just a page that exists on
  its own. The Product Editor's photo slots open a picker that browses
  what's already uploaded or lets you upload a new file on the spot —
  no more hand-pasted URLs.
- **Invoice PDFs**: a "Download Invoice" button on the customer's order
  detail page and the admin order detail page generates a real,
  itemized tax-invoice-style PDF client-side (jsPDF) — verified by
  actually triggering the download and confirming a real PDF file comes
  back, not just that the button exists.
- **CSV export** on Products, Orders, and Customers — verified by
  triggering an actual download and reading the resulting file's
  contents, not just clicking the button and assuming it worked.
- The order-confirmation page's invoice button was cut during
  development: that page only has a lightweight order summary (no line
  items), not enough to build a real invoice from. Rather than fake it,
  that page now links to the full order detail page, which has real
  invoice generation.
- Known cost: jsPDF pulls in an optional `html2canvas` dependency that
  isn't actually used here, which added real weight to the bundle
  (roughly +400KB gzipped). Worth revisiting with a lighter PDF library
  if bundle size becomes a real concern.
- **Bulk actions**: select multiple rows in Inventory to set-or-adjust
  stock across all of them at once, or select multiple Orders to update
  their status in one action. Verified by actually selecting rows,
  applying a bulk change, and confirming the values changed in the UI —
  not just that the button doesn't error.

**Phase 3 is now complete.**

## SRS v2.0 compliance — Phase 4 (in progress)

- **Website Settings** now covers everything added to the database in
  Phase 1: brand logo/dark-logo/favicon (picked from the Media Library,
  not pasted URLs), full theme colors + font selection, Twitter/TikTok,
  UPI ID, express shipping charge, GTM ID, Search Console verification,
  a 2FA-required toggle, an uptime monitor URL, and expanded default-SEO
  fields (title template, keywords, default social share image).
- **FAQs**: real admin CRUD (`/admin/faqs`) plus an actual public `/faq`
  page with `FAQPage` JSON-LD — this wasn't just an admin table with no
  storefront-facing purpose. Linked for real from the footer's Help
  section (which previously had a placeholder "Shipping Info" link
  pointing nowhere).
- Verified by actually creating a FAQ in the admin panel and confirming
  it appears in the public FAQ accordion, and by running all 9
  migrations fresh end-to-end.

## SRS v2.0 compliance — Phase 4 continued (Error Logging & 2FA)

- **Error logging is real now, not just a table.** A React Error Boundary
  wraps the whole app, catches rendering errors, reports them to
  `error_logs` with the route/browser/OS/stack trace, and shows a
  friendly recovery screen instead of a blank white page. A global
  `unhandledrejection` listener catches async errors React's own boundary
  can't see. Admin can view and resolve them at `/admin/error-logs`.
- **Two-factor authentication is fully wired**, not just a settings
  toggle: staff can enroll a TOTP authenticator (QR code + manual secret
  fallback) under Permissions → My Security, and — this is the part that
  actually matters — logging in with a correct password no longer
  grants admin access on its own if 2FA is enrolled. The login flow
  pauses at a 6-digit code screen and only completes (including the
  admin-login audit log entry) after that code verifies.
- Both features correctly detect and explain that they're not applicable
  in mock/demo mode, rather than either crashing or silently pretending
  to work.

## SRS v2.0 compliance — Phase 4 complete

- **IP allow/block enforcement**: real, not just a table. The two payment
  Edge Functions (`create-razorpay-order`, `verify-razorpay-payment`) now
  check the caller's IP against `ip_rules` before doing anything else,
  with a fail-open design (an empty or misconfigured rules table never
  locks out real customers). Manageable from Website Settings → Security.
  Full site-wide IP blocking would need every request routed through an
  Edge Function gateway, which is a bigger architectural change than this
  storefront's direct-to-Supabase pattern — documented here rather than
  overclaiming coverage this doesn't have.
- **Image compression**: uploads through the Media Library are resized
  and re-encoded client-side (canvas API, not a new dependency — this app
  already learned the jsPDF/html2canvas lesson about bundle-size cost)
  before hitting Supabase Storage.
- **PWA**: a real manifest.json and a service worker that caches the app
  shell (never API/Supabase calls, so it can't show stale product data).
  Known gap: the manifest uses the existing SVG favicon rather than
  dedicated 192x192/512x512 PNG icons, which is a rough edge on iOS "Add
  to Home Screen" specifically — worth generating real icon assets before
  treating this as fully production-polished.
- **BreadcrumbList JSON-LD** on product and category/collection pages,
  alongside the existing Product/Organization schema.

This closes every item from the original SRS v2.0 gap analysis.

**One thing worth knowing if you continue this project**: while doing the
final verification pass, the admin Error Logs page intermittently timed
out in Playwright — but only during the Vite *dev server*, only after
~30 rapid sequential navigations in one browser session, and it never
reproduced in isolation (6/6 clean runs) or against the actual production
build (`vite build` + `vite preview`, 0 errors/timeouts across all 35
routes). Diagnosed as dev-server/sandbox resource pressure, not an app
defect — but flagging it rather than pretending the one anomaly never
happened.

---

## What's included (full feature list)



### Customer storefront
Homepage (hero, offer banners, categories, CMS-driven product sections),
product listing with filters/search/sort, product detail (size + color
selection, reviews), cart, coupon-aware checkout (COD/UPI/Card via
Razorpay), order success, wishlist, login/register, account area (orders,
wishlist, profile, addresses, reviews), guest order tracking.

### Admin dashboard
Dashboard, Homepage CMS, Products, Categories, Collections, Orders,
Customers, Coupons, Offers, Inventory, Media Library, Analytics, Reports,
Website Settings, Notifications, Reviews, Support Tickets + Returns,
Permissions/Roles, Audit Logs, Email Templates, Shipping.

## Tech stack

- **Vite + React 19 + TypeScript**, **Tailwind CSS v4**, **React Router**
- **Zustand** (mock-mode state / local cart & wishlist)
- **Supabase** — Postgres, Auth, Storage, Edge Functions (production mode)
- **Razorpay** — COD/UPI/card checkout
- **Recharts** for admin analytics charts, **lucide-react** for icons

## Product photography

No product photography was supplied, so products use free, commercially-
licensed Unsplash photos as placeholders (credits in `CREDITS.md`, wired in
via `src/lib/images.ts`). Swap these for real product shoots before launch.

## Homepage SRS compliance fix + full repo audit

A user-requested audit against the actual SRS v2 text turned up a real gap
(the homepage architecture diagram specifies `<VideoHero/>` vs
`<ImageHero/>` and a separate `<OfferBannerStrip/>` carousel — the code
only ever rendered a static image hero and a static banner grid) plus
several things that weren't in the SRS at all, which are called out as
such rather than folded in silently:

- **Video hero**: `bg_type` ('image'/'video'/'color') is now a real,
  wired field — previously it existed on the type but was hardcoded to
  "image" everywhere. Video autoplays muted/looped, falls back to a
  poster image on load failure, manageable from Homepage CMS → Hero
  Section (upload or paste a URL).
- **Offer banner carousel**: the 3 promotional banners now auto-slide
  (5s interval, pauses on hover), with manual arrows and dot navigation
  — replacing the static 3-column grid.
- **Instagram/Lookbook section**: the schema already had an `'instagram'`
  section type with no renderer; now shows a shoppable grid from the real
  catalog linking to the store's Instagram profile (there's no real
  Instagram API integration — that's its own project — so this is the
  honest version of that section).
- **Newsletter signup**: verified against the SRS text directly — no
  "newsletter" requirement exists anywhere in it. Built anyway as a
  reasonable low-risk addition, but flagged as an enhancement, not a
  compliance fix, so scope isn't misrepresented. Real signup, writes to
  an actual `newsletter_subscribers` table.
- Existing homepage functionality (WhatsApp CTA, trust strip, dynamic
  CMS-ordered sections, all customer stores) preserved as-is.

**Two real bugs found and fixed during the broader audit this was part
of**, reproducible at the 320px breakpoint on every page: the header's
icon cluster overflowed the viewport by ~20px, and the homepage hero's
zoomed background image leaked past its clipping container due to a
`clip-path`/`transform` browser interaction. Both verified fixed across
6 breakpoints × 5 pages (30 checks, 0 overflow remaining) — and along
the way, two of my own build/serve steps silently produced stale output
(a background build that didn't finish, then a preview server serving
yesterday's bundle) — caught by checking actual compiled output for the
fix rather than trusting a command's exit status, which is worth
knowing if you're continuing this project and something looks done but
isn't behaving like it.

Also found in the audit: TypeScript/lint are both completely clean (0
errors across 114 files), every one of 39 database tables has RLS
enabled, no hardcoded localhost URLs or leaked secrets — and one
harmless piece of dead schema (`product_videos` table, built in the
original v1.0 pass, never wired to any frontend code — left in place
rather than dropped, since removing a live table needs your say-so).

## Folder structure

```
supabase/
  migrations/     Numbered SQL migrations — schema, RLS, functions, storage, reference data
  functions/       Edge Functions: create-razorpay-order, verify-razorpay-payment
scripts/
  seed-demo-catalog.ts   Optional: loads the demo catalog into a real Supabase project
src/
  data/           Mock data (used when Supabase isn't configured)
  types/database.ts  Hand-written TS types mirroring the SQL schema
  lib/            supabase client, razorpay helper, formatting, theme sync
  store/          Zustand stores — some now branch on isSupabaseConfigured (auth done; rest pending)
  components/     layout/, customer/, admin/, ui/
  pages/          customer/, admin/
App.tsx           Full route tree
SETUP.md          Step-by-step: Supabase project → migrations → Razorpay → deploy
CREDITS.md        Photo attributions
```
