-- ============================================================================
-- Grail's Official — 0009_faq_seed.sql
-- Seeds starter FAQ content (the faqs table from 0007 shipped empty) and
-- adds a real "FAQs" footer link, matching the mock-mode defaults so a
-- fresh production install isn't missing content the demo already shows.
-- ============================================================================

insert into public.faqs (question, answer, category, sort_order, active) values
  ('Are these products authentic?', 'Grail''s Official sells premium replica sneakers — we''re upfront that these are not authentic brand-licensed products. We focus on build quality and value for money.', 'general', 1, true),
  ('How long does delivery take?', 'Most orders are delivered within 2-5 business days depending on your location. You''ll get tracking details once your order ships.', 'shipping', 2, true),
  ('Is Cash on Delivery available?', 'Yes — COD is available on all orders with a small COD handling fee. You can also pay online via UPI or card for a smoother checkout.', 'payments', 3, true),
  ('What''s your return policy?', 'We offer a 7-day easy return and exchange window from the date of delivery, as long as the product is unused and in its original packaging.', 'returns', 4, true);

insert into public.footer_links (group_id, label, url, sort_order)
select id, 'FAQs', '/faq', 3 from public.footer_link_groups where group_name = 'Help';

update public.footer_links set sort_order = 4
where label = 'Contact Us' and group_id in (select id from public.footer_link_groups where group_name = 'Help');
