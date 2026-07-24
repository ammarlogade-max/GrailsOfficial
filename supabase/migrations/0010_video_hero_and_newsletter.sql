-- ============================================================================
-- UrbanKicks — 0010_video_hero_and_newsletter.sql
-- Closes a real SRS gap found during audit: homepage_hero.bg_type already
-- supported 'video', but there was no column to actually store a video
-- URL, and the frontend never branched on bg_type at all — it always
-- rendered the image hero. Also adds a newsletter_subscribers table
-- (not in the original SRS, added as a reasonable extra alongside this
-- fix, not represented as an SRS requirement).
-- ============================================================================

alter table public.homepage_hero
  add column if not exists bg_type text not null default 'image' check (bg_type in ('image','video','color')),
  add column if not exists video_url text default '',
  add column if not exists poster_image text default '';

-- The SRS's homepage_sections.section_type enum includes 'video',
-- 'instagram', and 'custom_banner' — only a subset were allowed by the
-- original check constraint.
alter table public.homepage_sections drop constraint if exists homepage_sections_section_type_check;
alter table public.homepage_sections add constraint homepage_sections_section_type_check
  check (section_type in (
    'new_arrivals','best_sellers','trending','featured','collection',
    'categories_grid','brand_story','reviews','video','instagram','custom_banner'
  ));

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  subscribed_at timestamptz not null default now(),
  active boolean not null default true
);
alter table public.newsletter_subscribers enable row level security;
create policy "anyone_can_subscribe" on public.newsletter_subscribers for insert with check (true);
create policy "staff_read_subscribers" on public.newsletter_subscribers for select using (public.is_staff());
create policy "staff_manage_subscribers" on public.newsletter_subscribers for update using (public.is_staff());

alter table public.store_settings add column if not exists newsletter_enabled boolean not null default true;

-- Seeds the Instagram/Lookbook section so the homepage actually shows it
-- out of the box, matching the approved layout — there's no "add new
-- section" admin flow yet (only editing existing seeded sections), so
-- without this row an admin would have no way to add one.
insert into public.homepage_sections (section_type, title, subtitle, active, sort_order, product_limit)
select 'instagram', 'Shop Our Instagram', 'Tag us @urbankicks for a chance to be featured', true,
  coalesce((select max(sort_order) from public.homepage_sections), 0) + 1, 6
where not exists (select 1 from public.homepage_sections where section_type = 'instagram');
