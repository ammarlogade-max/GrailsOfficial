-- ============================================================================
-- Grail's Official — 0001_schema.sql
-- Core tables: catalog, customers, orders, reviews, coupons/offers
-- ============================================================================
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users — created via trigger on signup, see 0003)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  avatar_initials text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Home',
  name text not null,
  phone text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_id_idx on public.addresses(user_id);

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  icon text default '👟',
  sort_order int not null default 0,
  seo_title text default '',
  seo_description text default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  section_title text default '',
  show_on_homepage boolean not null default false,
  homepage_sort_order int not null default 0,
  banner_photo_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text not null unique,
  barcode text,
  category_id uuid references public.categories(id) on delete set null,
  brand text not null,
  description text default '',
  highlights text[] not null default '{}',
  specifications jsonb not null default '{}',
  shipping_info text default '',
  return_policy text default '',
  price numeric(10,2) not null check (price >= 0),
  original_price numeric(10,2) not null check (original_price >= 0),
  material text default '',
  weight int default 0,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  trending boolean not null default false,
  best_seller boolean not null default false,
  new_arrival boolean not null default true,
  stock int not null default 0 check (stock >= 0),
  low_stock_threshold int not null default 10,
  seo_title text default '',
  seo_description text default '',
  seo_keywords text default '',
  sort_order int not null default 0,
  avg_rating numeric(2,1) not null default 0,
  num_reviews int not null default 0,
  total_sold int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_id_idx on public.products(category_id);
create index products_status_idx on public.products(status);
create index products_brand_idx on public.products(brand);
create index products_featured_idx on public.products(featured) where featured = true;
create index products_trending_idx on public.products(trending) where trending = true;
create index products_best_seller_idx on public.products(best_seller) where best_seller = true;
create index products_new_arrival_idx on public.products(new_arrival) where new_arrival = true;

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  sort_order int not null default 0
);
create index product_images_product_id_idx on public.product_images(product_id);

create table public.product_videos (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null
);

create table public.product_sizes (
  product_id uuid not null references public.products(id) on delete cascade,
  size numeric(3,1) not null,
  primary key (product_id, size)
);

create table public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  hex text not null,
  sort_order int not null default 0
);
create index product_colors_product_id_idx on public.product_colors(product_id);

create table public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order int not null default 0,
  primary key (collection_id, product_id)
);

-- ---------------------------------------------------------------------------
-- Wishlist
-- ---------------------------------------------------------------------------
create table public.wishlist_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.profiles(id) on delete set null,
  guest_email text,
  guest_phone text,
  shipping_name text not null,
  shipping_phone text not null,
  shipping_line1 text not null,
  shipping_line2 text,
  shipping_city text not null,
  shipping_state text not null,
  shipping_pincode text not null,
  subtotal numeric(10,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  shipping_charge numeric(10,2) not null default 0,
  cod_charge numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  payment_method text not null check (payment_method in ('cod','upi','online','whatsapp')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  razorpay_order_id text,
  razorpay_payment_id text,
  coupon_code text,
  status text not null default 'pending' check (status in
    ('pending','confirmed','processing','packed','shipped','out_for_delivery','delivered',
     'cancelled','return_requested','returned','refunded')),
  courier_name text,
  tracking_number text,
  customer_note text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_customer_id_idx on public.orders(customer_id);
create index orders_status_idx on public.orders(status);
create index orders_created_at_idx on public.orders(created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  brand text not null,
  sku text not null,
  size numeric(3,1) not null,
  color text not null,
  unit_price numeric(10,2) not null,
  original_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  photo_url text
);
create index order_items_order_id_idx on public.order_items(order_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  at timestamptz not null default now()
);
create index order_status_history_order_id_idx on public.order_status_history(order_id);

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  order_id uuid references public.orders(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  title text not null default '',
  body text not null default '',
  images text[] default '{}',
  status text not null default 'pending' check (status in ('pending','approved','hidden')),
  pinned boolean not null default false,
  admin_reply text,
  helpful_count int not null default 0,
  created_at timestamptz not null default now()
);
create index reviews_product_id_idx on public.reviews(product_id);
create index reviews_status_idx on public.reviews(status);

-- ---------------------------------------------------------------------------
-- Coupons & Offers
-- ---------------------------------------------------------------------------
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text default '',
  type text not null check (type in ('percentage','fixed','free_shipping')),
  value numeric(10,2) not null default 0,
  min_order_amount numeric(10,2) not null default 0,
  max_discount numeric(10,2),
  max_uses int,
  uses_per_user int not null default 1,
  current_uses int not null default 0,
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  type text not null check (type in ('percentage','fixed','buy_x_get_y','free_shipping')),
  value numeric(10,2) not null default 0,
  applies_to text not null default 'all' check (applies_to in ('all','category','collection','product')),
  applies_to_id uuid,
  show_on_homepage boolean not null default false,
  badge_text text default '',
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
