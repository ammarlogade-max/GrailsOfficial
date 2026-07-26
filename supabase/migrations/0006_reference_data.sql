-- ============================================================================
-- Grail's Official — 0006_reference_data.sql
-- Configuration data the app needs on day one (NOT demo products — see
-- scripts/seed-demo-catalog.ts for optional sample catalog data).
-- ============================================================================

insert into public.roles (id, display_name, description, is_system_role, permissions) values
  ('super_admin', 'Super Admin', 'Full access to everything.', true, array['*']),
  ('store_manager', 'Store Manager', 'Manage products, orders, and customers.', false,
    array['products.view','products.create','products.edit','orders.view','orders.update_status','customers.view']),
  ('inventory_manager', 'Inventory Manager', 'Manage products and stock levels only.', false,
    array['products.view','products.edit','inventory.view','inventory.edit']),
  ('customer_support', 'Customer Support', 'Manage orders and customer queries.', false,
    array['orders.view','orders.update_status','customers.view','returns.manage']),
  ('marketing_manager', 'Marketing Manager', 'Manage homepage, banners, offers, and coupons.', false,
    array['homepage.edit','banners.manage','collections.manage','coupons.manage','offers.manage','categories.manage']);

insert into public.email_templates (key, name, subject, body, active) values
  ('order_confirmation', 'Order Confirmation', 'Your Grail''s Official order {{order_number}} is confirmed 🎉',
    'Hi {{customer_name}}, thanks for shopping with Grail''s Official! Your order {{order_number}} worth ₹{{total}} has been confirmed and will ship within 2-3 business days.', true),
  ('order_shipped', 'Order Shipped', 'Your order {{order_number}} is on its way 🚚',
    'Good news {{customer_name}}! Your order has been shipped via {{courier_name}}. Track it here: {{tracking_link}}', true),
  ('order_delivered', 'Order Delivered', 'Delivered! Enjoy your new kicks 👟',
    'Hi {{customer_name}}, your order {{order_number}} has been delivered. We''d love to hear your feedback — leave a review!', true),
  ('abandoned_cart', 'Abandoned Cart Reminder', 'You left something in your cart 👀',
    'Hey {{customer_name}}, your cart is waiting! Complete your order before items go out of stock.', true),
  ('return_approved', 'Return Approved', 'Your return request {{request_number}} is approved',
    'Hi {{customer_name}}, your return has been approved. Our courier partner will pick up the item shortly.', true),
  ('password_reset', 'Password Reset', 'Reset your Grail''s Official password',
    'Click the link below to reset your password. This link expires in 30 minutes.', false);

with z1 as (
  insert into public.shipping_zones (name, states, active) values ('Mumbai Local', array['Maharashtra'], true) returning id
), z2 as (
  insert into public.shipping_zones (name, states, active) values ('Maharashtra & Goa', array['Maharashtra','Goa'], true) returning id
), z3 as (
  insert into public.shipping_zones (name, states, active) values ('North India', array['Delhi','Punjab','Haryana','Rajasthan'], true) returning id
), z4 as (
  insert into public.shipping_zones (name, states, active) values ('Pan India', array[]::text[], true) returning id
)
insert into public.shipping_rates (zone_id, name, type, base_rate, free_above, min_days, max_days, courier)
select id, 'Standard', 'flat', 49, 999, 1, 2, 'Delhivery' from z1
union all
select id, 'Express', 'flat', 99, null, 1, 1, 'Shiprocket' from z1
union all
select id, 'Standard', 'flat', 79, 999, 2, 3, 'Delhivery' from z2
union all
select id, 'Standard', 'flat', 99, 999, 3, 5, 'DTDC' from z3
union all
select id, 'Standard', 'flat', 129, 999, 4, 7, 'Shiprocket' from z4;

with g1 as (
  insert into public.footer_link_groups (group_name, sort_order) values ('Shop', 1) returning id
), g2 as (
  insert into public.footer_link_groups (group_name, sort_order) values ('Help', 2) returning id
), g3 as (
  insert into public.footer_link_groups (group_name, sort_order) values ('Company', 3) returning id
)
insert into public.footer_links (group_id, label, url, sort_order)
select id, 'New Arrivals', '/products?sort=newest', 1 from g1
union all select id, 'Best Sellers', '/products?filter=bestseller', 2 from g1
union all select id, 'Collections', '/products', 3 from g1
union all select id, 'Sale', '/collections/festival-sale', 4 from g1
union all select id, 'Track Order', '/track', 1 from g2
union all select id, 'Returns & Exchange', '/account/orders', 2 from g2
union all select id, 'Contact Us', '/', 3 from g2
union all select id, 'About Us', '/', 1 from g3
union all select id, 'Careers', '/', 2 from g3
union all select id, 'Privacy Policy', '/', 3 from g3
union all select id, 'Terms of Service', '/', 4 from g3;

insert into public.homepage_sections (section_type, title, subtitle, active, sort_order, product_limit) values
  ('new_arrivals', 'New Arrivals', 'Fresh drops, just landed', true, 1, 8),
  ('best_sellers', 'Best Sellers', 'Customer favourites', true, 2, 8),
  ('categories_grid', 'Shop by Category', 'Find your perfect fit', true, 3, 8),
  ('trending', '🔥 Trending Now', 'What everyone''s buying', true, 4, 8),
  ('reviews', 'What Our Customers Say', 'Real feedback from real customers', true, 5, 6);

update public.homepage_hero set
  heading = 'India''s Best Sneakers',
  subheading = 'Premium quality, unbeatable prices. COD available across India.',
  offer_badge_text = 'NEW ARRIVALS',
  cta_primary_text = 'Shop Now', cta_primary_link = '/products',
  cta_secondary_text = 'Explore Collections', cta_secondary_link = '/products',
  overlay_opacity = 0.55, text_alignment = 'left'
where id = true;

update public.announcement_bar set
  text = 'FREE DELIVERY ABOVE ₹999 · COD AVAILABLE · NEW ARRIVALS WEEKLY · 7-DAY EASY RETURNS',
  bg_color = '#0a0a0a', text_color = '#ffffff', scroll_speed = 30, active = true
where id = true;
