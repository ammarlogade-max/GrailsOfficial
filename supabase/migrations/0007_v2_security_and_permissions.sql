-- ============================================================================
-- UrbanKicks — 0007_v2_security_and_permissions.sql
-- SRS v2.0 additions: granular permissions, automatic audit logging,
-- rate limiting, IP rules, FAQs, error logs, and expanded settings/scoping
-- columns. Written to be additive and safe to run after 0001-0006.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ADDITION 1: Granular permissions (permissions + role_permissions tables)
-- has_permission() keeps its existing signature so no RLS policy from
-- 0004_rls.sql needs to change — only its internals move from a text[]
-- column to a normalized join table.
-- ---------------------------------------------------------------------------
create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  display_name text not null,
  group_name text not null,
  description text default ''
);

create table public.role_permissions (
  role_id text not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

insert into public.permissions (key, display_name, group_name) values
  ('products.view', 'View Products', 'Products'),
  ('products.create', 'Create Products', 'Products'),
  ('products.edit', 'Edit Products', 'Products'),
  ('products.delete', 'Delete Products', 'Products'),
  ('products.bulk_import', 'Bulk Import Products', 'Products'),
  ('products.export', 'Export Products', 'Products'),
  ('categories.manage', 'Manage Categories', 'Products'),
  ('collections.manage', 'Manage Collections', 'Products'),
  ('inventory.view', 'View Inventory', 'Inventory'),
  ('inventory.edit', 'Edit Inventory', 'Inventory'),
  ('inventory.bulk_update', 'Bulk Update Inventory', 'Inventory'),
  ('orders.view', 'View Orders', 'Orders'),
  ('orders.update_status', 'Update Order Status', 'Orders'),
  ('orders.refund', 'Refund Orders', 'Orders'),
  ('orders.delete', 'Delete Orders', 'Orders'),
  ('orders.export', 'Export Orders', 'Orders'),
  ('orders.add_note', 'Add Order Notes', 'Orders'),
  ('returns.manage', 'Manage Returns', 'Orders'),
  ('homepage.edit', 'Edit Homepage', 'Homepage'),
  ('banners.manage', 'Manage Banners', 'Homepage'),
  ('coupons.manage', 'Manage Coupons', 'Marketing'),
  ('offers.manage', 'Manage Offers', 'Marketing'),
  ('customers.view', 'View Customers', 'Customers'),
  ('customers.edit', 'Edit Customers', 'Customers'),
  ('customers.export', 'Export Customers', 'Customers'),
  ('reviews.manage', 'Manage Reviews', 'Customers'),
  ('support.manage', 'Manage Support Tickets', 'Customers'),
  ('media.upload', 'Upload Media', 'Media'),
  ('media.delete', 'Delete Media', 'Media'),
  ('analytics.view', 'View Analytics', 'Reports'),
  ('reports.export', 'Export Reports', 'Reports'),
  ('settings.edit', 'Edit Settings', 'Settings'),
  ('roles.manage', 'Manage Roles & Staff', 'Settings'),
  ('email_templates.manage', 'Manage Email Templates', 'Settings'),
  ('shipping.manage', 'Manage Shipping', 'Settings');

-- Backfill role_permissions from the existing roles.permissions text[] column
-- so nothing that currently works stops working.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on ('*' = any(r.permissions) or p.key = any(r.permissions));

-- The v1.0 seed only had a text[] of permission keys per role, and a few
-- keys are new in this addendum (didn't exist for staff to have been
-- granted yet). Grant them to the roles that would obviously need them,
-- so turning on real nav-gating doesn't lock existing staff out of things
-- they already had informal access to.
insert into public.role_permissions (role_id, permission_id)
select role_id, p.id from (values
  ('customer_support', 'support.manage'),
  ('marketing_manager', 'support.manage'),
  ('marketing_manager', 'media.upload'),
  ('store_manager', 'media.upload'),
  ('store_manager', 'email_templates.manage'),
  ('store_manager', 'shipping.manage'),
  ('inventory_manager', 'media.upload')
) as grants(role_id, perm_key)
join public.permissions p on p.key = grants.perm_key
on conflict do nothing;

-- Keep the roles.permissions display array in sync with the now-authoritative
-- role_permissions table, so the admin UI's "permission chips" (which read
-- the array for a cheap, join-free display) don't drift from what
-- has_permission() actually enforces.
update public.roles r set permissions = (
  select coalesce(array_agg(p.key order by p.key), '{}')
  from public.role_permissions rp join public.permissions p on p.id = rp.permission_id
  where rp.role_id = r.id
) where r.id != 'super_admin';
-- super_admin keeps its '*' wildcard rather than a 35-item array.

-- roles.permissions stays as-is for now (cheap read for the admin UI to show
-- a role's permission chips without a join) but is no longer what
-- has_permission() checks — role_permissions is now the source of truth.
create or replace function public.has_permission(perm text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.staff_members sm
    join public.roles r on r.id = sm.role_id
    where sm.id = auth.uid()
      and sm.active = true
      and (
        r.id = 'super_admin'
        or exists (
          select 1 from public.role_permissions rp
          join public.permissions p on p.id = rp.permission_id
          where rp.role_id = r.id and p.key = perm
        )
      )
  );
$$;

alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
create policy "staff_read_permissions" on public.permissions for select using (public.is_staff());
create policy "staff_manage_permissions" on public.permissions for all using (public.has_permission('roles.manage')) with check (public.has_permission('roles.manage'));
create policy "staff_read_role_permissions" on public.role_permissions for select using (public.is_staff());
create policy "staff_manage_role_permissions" on public.role_permissions for all using (public.has_permission('roles.manage')) with check (public.has_permission('roles.manage'));

-- ---------------------------------------------------------------------------
-- ADDITION 2: Automatic audit logging (was manual/empty — now fires from
-- database triggers so nothing has to remember to log itself)
-- ---------------------------------------------------------------------------
alter table public.audit_logs
  add column if not exists actor_id uuid references public.profiles(id) on delete set null,
  add column if not exists entity_id uuid,
  add column if not exists old_values jsonb,
  add column if not exists new_values jsonb;

alter table public.audit_logs drop constraint if exists audit_logs_action_check;
alter table public.audit_logs add constraint audit_logs_action_check
  check (action in ('created','updated','deleted','status_changed','admin_login'));

create or replace function public.audit_trigger_fn()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_name_col text := coalesce(TG_ARGV[0], 'name');
  v_entity_name text;
  v_actor_email text;
  v_actor_role text;
  v_changed_fields text[];
begin
  v_entity_name := coalesce(to_jsonb(NEW) ->> v_name_col, to_jsonb(OLD) ->> v_name_col, TG_TABLE_NAME);

  select sm.email, r.id into v_actor_email, v_actor_role
  from public.staff_members sm join public.roles r on r.id = sm.role_id
  where sm.id = auth.uid();

  if TG_OP = 'UPDATE' then
    select array_agg(key) into v_changed_fields
    from jsonb_each(to_jsonb(NEW))
    where to_jsonb(NEW) -> key is distinct from to_jsonb(OLD) -> key
      and key not in ('updated_at');
  end if;

  insert into public.audit_logs (
    actor_id, actor_email, actor_role, action, entity_type, entity_id, entity_name,
    old_values, new_values, changed_fields
  ) values (
    auth.uid(), coalesce(v_actor_email, 'system'), coalesce(v_actor_role, 'system'),
    case TG_OP when 'INSERT' then 'created' when 'UPDATE' then 'updated' when 'DELETE' then 'deleted' end,
    TG_TABLE_NAME, coalesce(NEW.id, OLD.id), v_entity_name,
    case when TG_OP != 'INSERT' then to_jsonb(OLD) else null end,
    case when TG_OP != 'DELETE' then to_jsonb(NEW) else null end,
    v_changed_fields
  );
  return coalesce(NEW, OLD);
end;
$$;

create trigger audit_products after insert or update or delete on public.products
  for each row execute function public.audit_trigger_fn('name');
create trigger audit_categories after insert or update or delete on public.categories
  for each row execute function public.audit_trigger_fn('name');
create trigger audit_collections after insert or update or delete on public.collections
  for each row execute function public.audit_trigger_fn('name');
create trigger audit_orders after insert or update or delete on public.orders
  for each row execute function public.audit_trigger_fn('order_number');
create trigger audit_coupons after insert or update or delete on public.coupons
  for each row execute function public.audit_trigger_fn('code');
create trigger audit_offers after insert or update or delete on public.offers
  for each row execute function public.audit_trigger_fn('name');
create trigger audit_homepage_banners after insert or update or delete on public.homepage_banners
  for each row execute function public.audit_trigger_fn('title');
create trigger audit_homepage_hero after update on public.homepage_hero
  for each row execute function public.audit_trigger_fn('heading');
create trigger audit_store_settings after update on public.store_settings
  for each row execute function public.audit_trigger_fn('brand_name');
create trigger audit_staff_members after insert or update or delete on public.staff_members
  for each row execute function public.audit_trigger_fn('name');

-- Read-only for staff; nothing (not even super_admin) can edit/delete history.
drop policy if exists "staff_read_audit_logs" on public.audit_logs;
create policy "staff_read_audit_logs" on public.audit_logs for select using (public.is_staff());

-- ---------------------------------------------------------------------------
-- ADDITION 3: Login rate limiting (login/register attempt throttling)
-- Real auth calls (supabase.auth.signInWithPassword) can't be intercepted by
-- RLS since they hit the Auth service directly, not a table — so the app
-- calls check_rate_limit() itself immediately before attempting sign-in/
-- sign-up, and records the attempt regardless of outcome. This is enforced
-- client-side (bypassable by someone calling the Auth API directly) and is
-- a complement to, not a replacement for, Supabase Auth's own built-in
-- abuse protection on the auth endpoints.
-- ---------------------------------------------------------------------------
create table public.rate_limit_log (
  id uuid primary key default gen_random_uuid(),
  bucket_key text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_log_bucket_idx on public.rate_limit_log(bucket_key, created_at desc);

create or replace function public.check_rate_limit(p_bucket_key text, p_max_attempts int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  select count(*) into v_count from public.rate_limit_log
  where bucket_key = p_bucket_key and created_at > now() - (p_window_seconds || ' seconds')::interval;

  if v_count >= p_max_attempts then
    return false;
  end if;

  insert into public.rate_limit_log (bucket_key) values (p_bucket_key);
  delete from public.rate_limit_log where created_at < now() - interval '1 day';
  return true;
end;
$$;

alter table public.rate_limit_log enable row level security;
create policy "anon_can_check_rate_limit" on public.rate_limit_log for insert with check (true);
create policy "staff_read_rate_limit" on public.rate_limit_log for select using (public.is_staff());

-- ---------------------------------------------------------------------------
-- ADDITION 4: IP allow/block list (enforced in Edge Functions, not RLS —
-- Postgres RLS has no access to the caller's real IP)
-- ---------------------------------------------------------------------------
create table public.ip_rules (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null,
  type text not null check (type in ('allow','block')),
  reason text default '',
  scope text not null default 'all' check (scope in ('all','admin','api')),
  active boolean not null default true,
  expires_at timestamptz,
  created_by uuid references public.staff_members(id),
  created_at timestamptz not null default now()
);
alter table public.ip_rules enable row level security;
create policy "staff_manage_ip_rules" on public.ip_rules for all
  using (public.has_permission('settings.edit')) with check (public.has_permission('settings.edit'));

-- ---------------------------------------------------------------------------
-- ADDITION 5: Error logs (client-side React Error Boundary writes here)
-- ---------------------------------------------------------------------------
create table public.error_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'error' check (level in ('error','warning','info')),
  message text not null,
  stack text,
  component text,
  route text,
  user_id uuid references public.profiles(id) on delete set null,
  browser text,
  os text,
  metadata jsonb,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.error_logs enable row level security;
create policy "anyone_can_report_errors" on public.error_logs for insert with check (true);
create policy "staff_read_error_logs" on public.error_logs for select using (public.is_staff());
create policy "staff_resolve_error_logs" on public.error_logs for update using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- ADDITION 6: FAQs (editable from admin, public read)
-- ---------------------------------------------------------------------------
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text default 'general',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.faqs enable row level security;
create policy "public_read_active_faqs" on public.faqs for select using (active = true or public.is_staff());
create policy "staff_manage_faqs" on public.faqs for insert with check (public.has_permission('settings.edit'));
create policy "staff_update_faqs" on public.faqs for update using (public.has_permission('settings.edit'));
create policy "staff_delete_faqs" on public.faqs for delete using (public.has_permission('settings.edit'));

-- ---------------------------------------------------------------------------
-- ADDITION 7: Coupon/offer scoping (category/collection/product-specific)
-- ---------------------------------------------------------------------------
alter table public.coupons
  add column if not exists applies_to text not null default 'all' check (applies_to in ('all','category','product')),
  add column if not exists category_ids uuid[] default '{}',
  add column if not exists product_ids uuid[] default '{}';

alter table public.offers
  add column if not exists category_ids uuid[] default '{}',
  add column if not exists collection_ids uuid[] default '{}',
  add column if not exists product_ids uuid[] default '{}';

-- ---------------------------------------------------------------------------
-- ADDITION 8: Support ticket SLA fields
-- ---------------------------------------------------------------------------
alter table public.support_tickets
  add column if not exists first_response_at timestamptz,
  add column if not exists resolved_at timestamptz,
  add column if not exists satisfaction_rating int check (satisfaction_rating between 1 and 5);

-- ---------------------------------------------------------------------------
-- ADDITION 9: Expanded store_settings (brand assets, more theme control,
-- more integrations, 2FA enforcement flag, uptime monitor)
-- ---------------------------------------------------------------------------
alter table public.store_settings
  add column if not exists logo_url text default '',
  add column if not exists logo_dark_url text default '',
  add column if not exists favicon_url text default '',
  add column if not exists accent_color text not null default '#f97316',
  add column if not exists background_color text not null default '#ffffff',
  add column if not exists text_color text not null default '#0a0a0a',
  add column if not exists button_text_color text not null default '#ffffff',
  add column if not exists font_heading text not null default 'Inter',
  add column if not exists font_body text not null default 'Inter',
  add column if not exists twitter_url text default '',
  add column if not exists tiktok_url text default '',
  add column if not exists currency_code text not null default 'INR',
  add column if not exists upi_id text default '',
  add column if not exists express_shipping_charge numeric(10,2) not null default 199,
  add column if not exists google_tag_manager_id text default '',
  add column if not exists google_search_console_code text default '',
  add column if not exists og_default_image text default '',
  add column if not exists seo_title_template text not null default '%s | UrbanKicks',
  add column if not exists seo_default_keywords text default '',
  add column if not exists require_2fa_for_admin boolean not null default false,
  add column if not exists uptime_monitor_url text default '';

-- ---------------------------------------------------------------------------
-- ADDITION 10: Admin login alerts — audit_logs entry + admin_notifications
-- entry, called from the frontend right after a successful admin sign-in.
-- ---------------------------------------------------------------------------
create or replace function public.log_admin_login(p_email text, p_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_id, actor_email, actor_role, action, entity_type, entity_name)
  values (auth.uid(), p_email, p_role, 'admin_login', 'staff_member', p_email);

  insert into public.admin_notifications (type, title, body, link)
  select 'admin_login', 'Admin login', p_email || ' (' || p_role || ') just signed in.', '/admin/audit-logs'
  where p_role != 'super_admin'; -- don't spam super_admin with their own logins
end;
$$;
