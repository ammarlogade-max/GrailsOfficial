-- ============================================================================
-- Grail's Official — 0002_cms_and_admin.sql
-- Homepage CMS, staff/roles, support, returns, media, audit, email, shipping
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Store settings (singleton row)
-- ---------------------------------------------------------------------------
create table public.store_settings (
  id boolean primary key default true constraint single_row check (id),
  brand_name text not null default 'Grail''s Official',
  brand_tagline text not null default 'Premium Replica Sneakers',
  primary_color text not null default '#f97316',
  secondary_color text not null default '#0a0a0a',
  button_color text not null default '#f97316',
  whatsapp_number text default '',
  support_email text default '',
  support_phone text default '',
  business_address text default '',
  instagram_url text default '',
  facebook_url text default '',
  youtube_url text default '',
  currency_symbol text not null default '₹',
  free_shipping_threshold numeric(10,2) not null default 999,
  standard_shipping_charge numeric(10,2) not null default 99,
  cod_charge numeric(10,2) not null default 49,
  cod_available boolean not null default true,
  google_analytics_id text default '',
  meta_pixel_id text default '',
  microsoft_clarity_id text default '',
  seo_default_title text default '',
  seo_default_description text default '',
  footer_about_text text default '',
  footer_copyright_text text default '',
  reviews_enabled boolean not null default true,
  wishlist_enabled boolean not null default true,
  guest_checkout_enabled boolean not null default true,
  coupons_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.store_settings (id) values (true);

create table public.homepage_hero (
  id boolean primary key default true constraint single_row check (id),
  heading text default '',
  subheading text default '',
  offer_badge_text text default '',
  cta_primary_text text default '',
  cta_primary_link text default '',
  cta_secondary_text text default '',
  cta_secondary_link text default '',
  photo_url text default '',
  overlay_opacity numeric(3,2) not null default 0.55,
  text_alignment text not null default 'left' check (text_alignment in ('left','center','right')),
  updated_at timestamptz not null default now()
);
insert into public.homepage_hero (id) values (true);

create table public.announcement_bar (
  id boolean primary key default true constraint single_row check (id),
  text text default '',
  bg_color text not null default '#0a0a0a',
  text_color text not null default '#ffffff',
  scroll_speed int not null default 30,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.announcement_bar (id) values (true);

create table public.homepage_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text default '',
  button_text text default '',
  button_link text default '',
  badge_text text default '',
  badge_color text default '#f97316',
  photo_url text default '',
  active boolean not null default true,
  sort_order int not null default 0
);

create table public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_type text not null check (section_type in
    ('new_arrivals','best_sellers','trending','featured','collection','categories_grid','brand_story','reviews')),
  title text not null,
  subtitle text default '',
  collection_id uuid references public.collections(id) on delete set null,
  active boolean not null default true,
  sort_order int not null default 0,
  product_limit int not null default 8
);

create table public.footer_link_groups (
  id uuid primary key default gen_random_uuid(),
  group_name text not null,
  sort_order int not null default 0
);

create table public.footer_links (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.footer_link_groups(id) on delete cascade,
  label text not null,
  url text not null,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- Roles, permissions, staff
-- ---------------------------------------------------------------------------
create table public.roles (
  id text primary key,
  display_name text not null,
  description text default '',
  is_system_role boolean not null default false,
  permissions text[] not null default '{}'
);

create table public.staff_members (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role_id text not null references public.roles(id),
  active boolean not null default true,
  last_active timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  actor_role text not null,
  action text not null check (action in ('created','updated','deleted','status_changed')),
  entity_type text not null,
  entity_name text not null,
  changed_fields text[],
  created_at timestamptz not null default now()
);
create index audit_logs_created_at_idx on public.audit_logs(created_at desc);

create table public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  body text default '',
  link text default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Support & returns
-- ---------------------------------------------------------------------------
create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  customer_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  order_id uuid references public.orders(id) on delete set null,
  subject text not null,
  category text default 'general',
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'open' check (status in
    ('open','assigned','in_progress','waiting_customer','resolved','closed')),
  assigned_to uuid references public.staff_members(id),
  created_at timestamptz not null default now()
);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender text not null check (sender in ('customer','staff')),
  body text not null,
  at timestamptz not null default now()
);
create index support_messages_ticket_id_idx on public.support_messages(ticket_id);

create table public.return_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique,
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete set null,
  type text not null default 'return' check (type in ('return','exchange')),
  reason text not null,
  reason_detail text,
  items jsonb not null default '[]',
  status text not null default 'requested' check (status in
    ('requested','under_review','approved','rejected','pickup_scheduled','picked_up',
     'received','refund_initiated','refunded','closed')),
  refund_amount numeric(10,2),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Media library
-- ---------------------------------------------------------------------------
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  folder text not null default 'general' check (folder in ('products','banners','hero','brand','reviews','general')),
  file_type text not null default 'image' check (file_type in ('image','video')),
  alt_text text default '',
  storage_path text not null,
  file_size int default 0,
  uploaded_by uuid references public.staff_members(id),
  uploaded_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Email templates
-- ---------------------------------------------------------------------------
create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  subject text not null,
  body text not null,
  active boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Shipping
-- ---------------------------------------------------------------------------
create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  states text[] not null default '{}',
  active boolean not null default true
);

create table public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.shipping_zones(id) on delete cascade,
  name text not null,
  type text not null default 'flat',
  base_rate numeric(10,2) not null default 0,
  free_above numeric(10,2),
  min_days int not null default 2,
  max_days int not null default 5,
  courier text default ''
);
