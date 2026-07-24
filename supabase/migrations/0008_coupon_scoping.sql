-- ============================================================================
-- UrbanKicks — 0008_coupon_scoping.sql
-- Makes the coupons.applies_to/category_ids/product_ids columns from
-- 0007 actually mean something: validate_coupon now takes the cart's
-- contents (not just a total) so it can compute a discount scoped to only
-- the matching items, and reject coupons that don't apply to anything in
-- the cart. place_order is updated to match the new signature.
-- ============================================================================

drop function if exists public.validate_coupon(text, numeric);

create or replace function public.validate_coupon(p_code text, p_cart_items jsonb)
returns table (
  valid boolean,
  message text,
  discount_amount numeric,
  coupon_type text
) language plpgsql security definer set search_path = public as $$
declare
  c public.coupons%rowtype;
  computed_discount numeric := 0;
  v_subtotal numeric := 0;
  v_scoped_subtotal numeric := 0;
  v_item jsonb;
  v_category_id uuid;
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

  -- Sum the full cart (min_order_amount always applies to the whole order)
  -- and separately the portion of the cart this coupon actually scopes to.
  for v_item in select * from jsonb_array_elements(p_cart_items) loop
    v_subtotal := v_subtotal + (v_item->>'subtotal')::numeric;

    if c.applies_to = 'all' then
      v_scoped_subtotal := v_scoped_subtotal + (v_item->>'subtotal')::numeric;
    elsif c.applies_to = 'product' then
      if (v_item->>'product_id')::uuid = any(c.product_ids) then
        v_scoped_subtotal := v_scoped_subtotal + (v_item->>'subtotal')::numeric;
      end if;
    elsif c.applies_to = 'category' then
      select category_id into v_category_id from public.products where id = (v_item->>'product_id')::uuid;
      if v_category_id = any(c.category_ids) then
        v_scoped_subtotal := v_scoped_subtotal + (v_item->>'subtotal')::numeric;
      end if;
    end if;
  end loop;

  if p_cart_items is null or jsonb_array_length(p_cart_items) = 0 then
    v_subtotal := 0;
  end if;

  if v_subtotal < c.min_order_amount then
    return query select false, format('Minimum order of ₹%s required', c.min_order_amount), 0::numeric, ''::text;
    return;
  end if;

  if c.applies_to != 'all' and v_scoped_subtotal = 0 then
    return query select false, 'This coupon doesn''t apply to the items in your cart', 0::numeric, ''::text;
    return;
  end if;

  if c.max_uses is not null and c.current_uses >= c.max_uses then
    return query select false, 'This coupon has reached its usage limit', 0::numeric, ''::text;
    return;
  end if;

  if c.type = 'percentage' then
    computed_discount := v_scoped_subtotal * (c.value / 100);
    if c.max_discount is not null then
      computed_discount := least(computed_discount, c.max_discount);
    end if;
  elsif c.type = 'fixed' then
    computed_discount := least(c.value, v_scoped_subtotal); -- never discount more than the scoped portion
  else
    computed_discount := 0; -- free_shipping handled separately by the client/place_order
  end if;

  return query select true, 'Coupon applied', computed_discount, c.type;
end;
$$;

-- place_order builds the {product_id, subtotal} array from its own items
-- payload so the client doesn't need to change how it calls place_order.
-- Everything else here is unchanged from the original 0003 definition —
-- only the coupon-validation step (2) is different, to pass cart contents
-- instead of a bare total.
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
  v_cart_items jsonb := '[]'::jsonb;
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
    v_cart_items := v_cart_items || jsonb_build_object(
      'product_id', v_item->>'product_id',
      'subtotal', (v_item->>'unit_price')::numeric * (v_item->>'quantity')::int
    );
  end loop;

  -- 2. Coupon (now scope-aware — passes cart contents, not just a total)
  if p_coupon_code is not null then
    select * into v_coupon from public.validate_coupon(p_coupon_code, v_cart_items);
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
