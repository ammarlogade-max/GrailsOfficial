-- ============================================================================
-- UrbanKicks — 0005_storage.sql
-- Storage buckets: product images, banners/hero, general media — all public
-- read (needed for the storefront), staff-only write.
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('banners', 'banners', true),
  ('media', 'media', true)
on conflict (id) do nothing;

-- Public read for all three buckets (storefront images must load without auth)
create policy "public_read_product_images" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "public_read_banners" on storage.objects for select
  using (bucket_id = 'banners');
create policy "public_read_media" on storage.objects for select
  using (bucket_id = 'media');

-- Staff-only write (upload/update/delete) gated by products/homepage/media permissions
create policy "staff_write_product_images" on storage.objects for insert
  with check (bucket_id = 'product-images' and public.has_permission('products.edit'));
create policy "staff_update_product_images" on storage.objects for update
  using (bucket_id = 'product-images' and public.has_permission('products.edit'));
create policy "staff_delete_product_images" on storage.objects for delete
  using (bucket_id = 'product-images' and public.has_permission('products.edit'));

create policy "staff_write_banners" on storage.objects for insert
  with check (bucket_id = 'banners' and public.has_permission('banners.manage'));
create policy "staff_update_banners" on storage.objects for update
  using (bucket_id = 'banners' and public.has_permission('banners.manage'));
create policy "staff_delete_banners" on storage.objects for delete
  using (bucket_id = 'banners' and public.has_permission('banners.manage'));

create policy "staff_write_media" on storage.objects for insert
  with check (bucket_id = 'media' and public.is_staff());
create policy "staff_update_media" on storage.objects for update
  using (bucket_id = 'media' and public.is_staff());
create policy "staff_delete_media" on storage.objects for delete
  using (bucket_id = 'media' and public.is_staff());
