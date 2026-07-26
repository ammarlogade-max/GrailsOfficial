-- ============================================================================
-- Grail's Official — 0004_rls.sql
-- Row Level Security: public storefront read access, owner-only customer
-- data, and staff/permission-gated admin access.
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.collection_products enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_videos enable row level security;
alter table public.product_sizes enable row level security;
alter table public.product_colors enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.reviews enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.offers enable row level security;
alter table public.store_settings enable row level security;
alter table public.homepage_hero enable row level security;
alter table public.announcement_bar enable row level security;
alter table public.homepage_banners enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.footer_link_groups enable row level security;
alter table public.footer_links enable row level security;
alter table public.roles enable row level security;
alter table public.staff_members enable row level security;
alter table public.audit_logs enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.return_requests enable row level security;
alter table public.media_assets enable row level security;
alter table public.email_templates enable row level security;
alter table public.shipping_zones enable row level security;
alter table public.shipping_rates enable row level security;

-- ---------------------------------------------------------------------------
-- Profiles & addresses — owner or staff
-- ---------------------------------------------------------------------------
create policy "profiles_select_own_or_staff" on public.profiles for select
  using (id = auth.uid() or public.is_staff());
create policy "profiles_update_own" on public.profiles for update
  using (id = auth.uid());

create policy "addresses_all_own" on public.addresses for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "addresses_select_staff" on public.addresses for select
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- Catalog — public reads published/active rows; staff manage everything
-- ---------------------------------------------------------------------------
create policy "categories_public_read" on public.categories for select
  using (active = true or public.is_staff());
create policy "categories_staff_write" on public.categories for insert
  with check (public.has_permission('categories.manage'));
create policy "categories_staff_update" on public.categories for update
  using (public.has_permission('categories.manage'));
create policy "categories_staff_delete" on public.categories for delete
  using (public.has_permission('categories.manage'));

create policy "collections_public_read" on public.collections for select
  using (active = true or public.is_staff());
create policy "collections_staff_write" on public.collections for insert
  with check (public.has_permission('collections.manage'));
create policy "collections_staff_update" on public.collections for update
  using (public.has_permission('collections.manage'));
create policy "collections_staff_delete" on public.collections for delete
  using (public.has_permission('collections.manage'));

create policy "collection_products_public_read" on public.collection_products for select using (true);
create policy "collection_products_staff_write" on public.collection_products for insert
  with check (public.has_permission('collections.manage'));
create policy "collection_products_staff_delete" on public.collection_products for delete
  using (public.has_permission('collections.manage'));

create policy "products_public_read" on public.products for select
  using (status = 'published' or public.is_staff());
create policy "products_staff_write" on public.products for insert
  with check (public.has_permission('products.create'));
create policy "products_staff_update" on public.products for update
  using (public.has_permission('products.edit'));
create policy "products_staff_delete" on public.products for delete
  using (public.has_permission('products.edit'));

create policy "product_images_public_read" on public.product_images for select using (true);
create policy "product_images_staff_write" on public.product_images for all
  using (public.has_permission('products.edit')) with check (public.has_permission('products.edit'));

create policy "product_videos_public_read" on public.product_videos for select using (true);
create policy "product_videos_staff_write" on public.product_videos for all
  using (public.has_permission('products.edit')) with check (public.has_permission('products.edit'));

create policy "product_sizes_public_read" on public.product_sizes for select using (true);
create policy "product_sizes_staff_write" on public.product_sizes for all
  using (public.has_permission('products.edit')) with check (public.has_permission('products.edit'));

create policy "product_colors_public_read" on public.product_colors for select using (true);
create policy "product_colors_staff_write" on public.product_colors for all
  using (public.has_permission('products.edit')) with check (public.has_permission('products.edit'));

-- ---------------------------------------------------------------------------
-- Wishlist — owner only
-- ---------------------------------------------------------------------------
create policy "wishlist_all_own" on public.wishlist_items for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Orders — customer sees own; all writes go through the place_order RPC
-- (security definer, bypasses RLS) except staff status updates
-- ---------------------------------------------------------------------------
create policy "orders_select_own_or_staff" on public.orders for select
  using (customer_id = auth.uid() or public.is_staff());
create policy "orders_staff_update" on public.orders for update
  using (public.has_permission('orders.update_status'));

create policy "order_items_select_via_order" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_staff())));

create policy "order_status_history_select_via_order" on public.order_status_history for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.customer_id = auth.uid() or public.is_staff())));
create policy "order_status_history_staff_insert" on public.order_status_history for insert
  with check (public.has_permission('orders.update_status'));

-- ---------------------------------------------------------------------------
-- Reviews — public reads approved; customers manage their own; staff all
-- ---------------------------------------------------------------------------
create policy "reviews_public_read" on public.reviews for select
  using (status = 'approved' or customer_id = auth.uid() or public.is_staff());
create policy "reviews_customer_insert" on public.reviews for insert
  with check (customer_id = auth.uid());
create policy "reviews_customer_update_own" on public.reviews for update
  using (customer_id = auth.uid() and status = 'pending');
create policy "reviews_staff_moderate" on public.reviews for update
  using (public.has_permission('reviews.manage'));

-- ---------------------------------------------------------------------------
-- Coupons & offers — active offers are public marketing content; coupon
-- codes themselves are NOT publicly selectable (validated via validate_coupon
-- RPC only) to prevent scraping/brute-forcing codes.
-- ---------------------------------------------------------------------------
create policy "coupons_staff_only" on public.coupons for select using (public.is_staff());
create policy "coupons_staff_write" on public.coupons for all
  using (public.has_permission('coupons.manage')) with check (public.has_permission('coupons.manage'));

create policy "coupon_redemptions_staff_read" on public.coupon_redemptions for select using (public.is_staff());

create policy "offers_public_read" on public.offers for select
  using (active = true or public.is_staff());
create policy "offers_staff_write" on public.offers for all
  using (public.has_permission('offers.manage')) with check (public.has_permission('offers.manage'));

-- ---------------------------------------------------------------------------
-- Homepage CMS & site content — public read, marketing-permission write
-- ---------------------------------------------------------------------------
create policy "store_settings_public_read" on public.store_settings for select using (true);
create policy "store_settings_staff_write" on public.store_settings for update
  using (public.has_permission('settings.manage'));

create policy "homepage_hero_public_read" on public.homepage_hero for select using (true);
create policy "homepage_hero_staff_write" on public.homepage_hero for update
  using (public.has_permission('homepage.edit'));

create policy "announcement_bar_public_read" on public.announcement_bar for select using (true);
create policy "announcement_bar_staff_write" on public.announcement_bar for update
  using (public.has_permission('homepage.edit'));

create policy "homepage_banners_public_read" on public.homepage_banners for select using (active = true or public.is_staff());
create policy "homepage_banners_staff_write" on public.homepage_banners for all
  using (public.has_permission('banners.manage')) with check (public.has_permission('banners.manage'));

create policy "homepage_sections_public_read" on public.homepage_sections for select using (active = true or public.is_staff());
create policy "homepage_sections_staff_write" on public.homepage_sections for all
  using (public.has_permission('homepage.edit')) with check (public.has_permission('homepage.edit'));

create policy "footer_groups_public_read" on public.footer_link_groups for select using (true);
create policy "footer_groups_staff_write" on public.footer_link_groups for all
  using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

create policy "footer_links_public_read" on public.footer_links for select using (true);
create policy "footer_links_staff_write" on public.footer_links for all
  using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

-- ---------------------------------------------------------------------------
-- Roles & staff — only staff.manage permission (super_admin) may write
-- ---------------------------------------------------------------------------
create policy "roles_staff_read" on public.roles for select using (public.is_staff());
create policy "roles_manage" on public.roles for all
  using (public.has_permission('staff.manage')) with check (public.has_permission('staff.manage'));

create policy "staff_members_self_or_manager_read" on public.staff_members for select
  using (id = auth.uid() or public.has_permission('staff.manage'));
create policy "staff_members_manage" on public.staff_members for insert
  with check (public.has_permission('staff.manage'));
create policy "staff_members_manage_update" on public.staff_members for update
  using (public.has_permission('staff.manage'));
create policy "staff_members_manage_delete" on public.staff_members for delete
  using (public.has_permission('staff.manage'));

-- ---------------------------------------------------------------------------
-- Audit logs & notifications — staff only, insert via security-definer RPCs
-- ---------------------------------------------------------------------------
create policy "audit_logs_staff_read" on public.audit_logs for select using (public.is_staff());
create policy "admin_notifications_staff_all" on public.admin_notifications for all
  using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Support tickets & returns — customer owns their own; staff full access
-- ---------------------------------------------------------------------------
create policy "support_tickets_owner_or_staff" on public.support_tickets for select
  using (customer_id = auth.uid() or customer_email = auth.jwt() ->> 'email' or public.is_staff());
create policy "support_tickets_customer_insert" on public.support_tickets for insert
  with check (customer_id = auth.uid() or customer_id is null);
create policy "support_tickets_staff_update" on public.support_tickets for update
  using (public.has_permission('returns.manage') or public.is_staff());

create policy "support_messages_via_ticket" on public.support_messages for select
  using (exists (select 1 from public.support_tickets t where t.id = ticket_id
    and (t.customer_id = auth.uid() or t.customer_email = auth.jwt() ->> 'email' or public.is_staff())));
create policy "support_messages_insert" on public.support_messages for insert
  with check (exists (select 1 from public.support_tickets t where t.id = ticket_id
    and (t.customer_id = auth.uid() or public.is_staff())));

create policy "return_requests_owner_or_staff" on public.return_requests for select
  using (customer_id = auth.uid() or public.is_staff());
create policy "return_requests_customer_insert" on public.return_requests for insert
  with check (customer_id = auth.uid());
create policy "return_requests_staff_update" on public.return_requests for update
  using (public.has_permission('returns.manage'));

-- ---------------------------------------------------------------------------
-- Media library & email templates — staff only
-- ---------------------------------------------------------------------------
create policy "media_assets_staff_all" on public.media_assets for all
  using (public.is_staff()) with check (public.is_staff());

create policy "email_templates_staff_read" on public.email_templates for select using (public.is_staff());
create policy "email_templates_staff_write" on public.email_templates for update
  using (public.has_permission('settings.manage'));

-- ---------------------------------------------------------------------------
-- Shipping — public read (checkout needs to compute shipping), staff write
-- ---------------------------------------------------------------------------
create policy "shipping_zones_public_read" on public.shipping_zones for select using (active = true or public.is_staff());
create policy "shipping_zones_staff_write" on public.shipping_zones for all
  using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));

create policy "shipping_rates_public_read" on public.shipping_rates for select using (true);
create policy "shipping_rates_staff_write" on public.shipping_rates for all
  using (public.has_permission('settings.manage')) with check (public.has_permission('settings.manage'));
