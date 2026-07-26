-- ============================================================================
-- Grail's Official — 0003_functions_triggers.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger trg_collections_updated_at before update on public.collections
  for each row execute function public.set_updated_at();
create trigger trg_products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger trg_orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger trg_store_settings_updated_at before update on public.store_settings
  for each row execute function public.set_updated_at();
create trigger trg_homepage_hero_updated_at before update on public.homepage_hero
  for each row execute function public.set_updated_at();
create trigger trg_announcement_bar_updated_at before update on public.announcement_bar
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.raw_user_meta_data->>'phone', ''));
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Order number generator: UK-<year><6-digit sequence>
-- ---------------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1000;

create or replace function public.generate_order_number()
returns text language sql as $$
  select 'UK-' || to_char(now(), 'YYYY') || lpad(nextval('public.order_number_seq')::text, 6, '0');
$$;

-- ---------------------------------------------------------------------------
-- Staff / permission helpers (used by RLS policies in 0004)
-- ---------------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.staff_members
    where id = auth.uid() and active = true
  );
$$;

create or replace function public.has_permission(perm text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.staff_members sm
    join public.roles r on r.id = sm.role_id
    where sm.id = auth.uid()
      and sm.active = true
      and ('*' = any(r.permissions) or perm = any(r.permissions))
  );
$$;

-- ---------------------------------------------------------------------------
-- Keep product review aggregates (avg_rating, num_reviews) in sync
-- ---------------------------------------------------------------------------
create or replace function public.refresh_product_rating(p_product_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.products p
  set avg_rating = coalesce((
        select round(avg(rating)::numeric, 1) from public.reviews
        where product_id = p_product_id and status = 'approved'
      ), 0),
      num_reviews = (
        select count(*) from public.reviews
        where product_id = p_product_id and status = 'approved'
      )
  where p.id = p_product_id;
end;
$$;

create or replace function public.trg_reviews_refresh_rating()
returns trigger language plpgsql as $$
begin
  perform public.refresh_product_rating(coalesce(new.product_id, old.product_id));
  return coalesce(new, old);
end;
$$;

create trigger trg_reviews_after_change
  after insert or update or delete on public.reviews
  for each row execute function public.trg_reviews_refresh_rating();

-- ---------------------------------------------------------------------------
-- validate_coupon: server-side coupon validation (used by cart + place_order)
-- ---------------------------------------------------------------------------
create or replace function public.validate_coupon(p_code text, p_subtotal numeric)
returns table (
  valid boolean,
  message text,
  discount_amount numeric,
  coupon_type text
) language plpgsql security definer set search_path = public as $$
declare
  c public.coupons%rowtype;
  computed_discount numeric := 0;
begin
  select * into c from public.coupons where upper(code) = upper(p_code) and active = true;

  if c.id is null then
    return query select false, 'Invalid or expired coupon code', 0::numeric, ''::text;
    return;
  end if;

  if now() < c.starts_at or now() > c.ends_at then
    return query select false, 'This coupon is not currently active', 0::numeric, ''::text;
    return;
  end if;

  if p_subtotal < c.min_order_amount then
    return query select false,
      format('Minimum order of ₹%s required', c.min_order_amount), 0::numeric, ''::text;
    return;
  end if;

  if c.max_uses is not null and c.current_uses >= c.max_uses then
    return query select false, 'This coupon has reached its usage limit', 0::numeric, ''::text;
    return;
  end if;

  if c.type = 'percentage' then
    computed_discount := p_subtotal * (c.value / 100);
    if c.max_discount is not null then
      computed_discount := least(computed_discount, c.max_discount);
    end if;
  elsif c.type = 'fixed' then
    computed_discount := c.value;
  else
    computed_discount := 0; -- free_shipping handled separately by the client/place_order
  end if;

  return query select true, 'Coupon applied', computed_discount, c.type;
end;
$$;

-- ---------------------------------------------------------------------------
-- place_order: atomic checkout — validates stock, creates order + items,
-- decrements stock, redeems coupon, and returns the new order id.
-- Called via supabase.rpc('place_order', {...}) from the client.
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_customer_id uuid,
  p_guest_email text,
  p_guest_phone text,
  p_shipping jsonb,        -- { name, phone, line1, line2, city, state, pincode }
  p_items jsonb,           -- [{ product_id, product_name, brand, sku, size, color, unit_price, original_price, quantity, photo_url }]
  p_payment_method text,
  p_coupon_code text default null,
  p_razorpay_order_id text default null
)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_coupon record;
  v_shipping_charge numeric := 0;
  v_cod_charge numeric := 0;
  v_free_shipping_threshold numeric;
  v_standard_shipping numeric;
  v_cod_fee numeric;
  v_order public.orders%rowtype;
begin
  select free_shipping_threshold, standard_shipping_charge, cod_charge
    into v_free_shipping_threshold, v_standard_shipping, v_cod_fee
    from public.store_settings limit 1;

  -- 1. Validate stock & compute subtotal, locking rows to prevent oversell
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from public.products
      where id = (v_item->>'product_id')::uuid
      for update;

    if v_product.id is null then
      raise exception 'Product % no longer exists', (v_item->>'product_id');
    end if;
    if v_product.stock < (v_item->>'quantity')::int then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;

    v_subtotal := v_subtotal + (v_item->>'unit_price')::numeric * (v_item->>'quantity')::int;
  end loop;

  -- 2. Coupon
  if p_coupon_code is not null then
    select * into v_coupon from public.validate_coupon(p_coupon_code, v_subtotal);
    if not v_coupon.valid then
      raise exception '%', v_coupon.message;
    end if;
    v_discount := v_coupon.discount_amount;
  end if;

  -- 3. Shipping & COD charge
  v_shipping_charge := case when v_subtotal >= v_free_shipping_threshold then 0 else v_standard_shipping end;
  v_cod_charge := case when p_payment_method = 'cod' then v_cod_fee else 0 end;

  -- 4. Create order
  insert into public.orders (
    order_number, customer_id, guest_email, guest_phone,
    shipping_name, shipping_phone, shipping_line1, shipping_line2, shipping_city, shipping_state, shipping_pincode,
    subtotal, discount_amount, shipping_charge, cod_charge, total,
    payment_method, payment_status, razorpay_order_id, coupon_code, status
  ) values (
    public.generate_order_number(), p_customer_id, p_guest_email, p_guest_phone,
    p_shipping->>'name', p_shipping->>'phone', p_shipping->>'line1', p_shipping->>'line2',
    p_shipping->>'city', p_shipping->>'state', p_shipping->>'pincode',
    v_subtotal, v_discount, v_shipping_charge, v_cod_charge,
    v_subtotal - v_discount + v_shipping_charge + v_cod_charge,
    p_payment_method,
    case when p_payment_method = 'cod' then 'pending' else 'paid' end,
    p_razorpay_order_id, p_coupon_code, 'confirmed'
  ) returning * into v_order;

  insert into public.order_status_history (order_id, status) values (v_order.id, 'pending');
  insert into public.order_status_history (order_id, status) values (v_order.id, 'confirmed');

  -- 5. Order items + stock decrement + total_sold increment
  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.order_items (
      order_id, product_id, product_name, brand, sku, size, color,
      unit_price, original_price, quantity, photo_url
    ) values (
      v_order.id, (v_item->>'product_id')::uuid, v_item->>'product_name', v_item->>'brand', v_item->>'sku',
      (v_item->>'size')::numeric, v_item->>'color',
      (v_item->>'unit_price')::numeric, (v_item->>'original_price')::numeric,
      (v_item->>'quantity')::int, v_item->>'photo_url'
    );

    update public.products
      set stock = stock - (v_item->>'quantity')::int,
          total_sold = total_sold + (v_item->>'quantity')::int
      where id = (v_item->>'product_id')::uuid;
  end loop;

  -- 6. Coupon redemption
  if p_coupon_code is not null then
    update public.coupons set current_uses = current_uses + 1 where upper(code) = upper(p_coupon_code);
    insert into public.coupon_redemptions (coupon_id, order_id, user_id)
      select id, v_order.id, p_customer_id from public.coupons where upper(code) = upper(p_coupon_code);
  end if;

  -- 7. Notify admins
  insert into public.admin_notifications (type, title, body, link)
  values ('new_order', 'New order received', format('Order %s worth ₹%s', v_order.order_number, v_order.total), '/admin/orders');

  return v_order;
end;
$$;

-- ---------------------------------------------------------------------------
-- track_order: public/guest-safe order lookup (no auth required)
-- ---------------------------------------------------------------------------
create or replace function public.track_order(p_order_number text, p_phone text)
returns table (
  order_number text,
  status text,
  courier_name text,
  tracking_number text,
  created_at timestamptz
) language sql security definer set search_path = public as $$
  select order_number, status, courier_name, tracking_number, created_at
  from public.orders
  where order_number = p_order_number
    and (shipping_phone = p_phone or guest_phone = p_phone);
$$;

-- ---------------------------------------------------------------------------
-- admin_dashboard_stats: single aggregated call for the admin dashboard
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'total_revenue', coalesce((select sum(total) from public.orders where payment_status = 'paid'), 0),
    'total_orders', (select count(*) from public.orders),
    'pending_orders', (select count(*) from public.orders where status in ('pending','confirmed','processing')),
    'total_customers', (select count(*) from public.profiles),
    'low_stock_count', (select count(*) from public.products where stock <= low_stock_threshold and status = 'published')
  );
$$;
