// Hand-written to mirror supabase/migrations/*.sql exactly. If you change the
// schema, update this file to match (or generate it with the Supabase CLI:
// `supabase gen types typescript --project-id <ref> > src/types/database.ts`).

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string; phone: string | null; avatar_initials: string | null; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      addresses: {
        Row: { id: string; user_id: string; label: string; name: string; phone: string; line1: string; line2: string | null; city: string; state: string; pincode: string; is_default: boolean; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["addresses"]["Row"]> & { user_id: string; name: string; phone: string; line1: string; city: string; state: string; pincode: string };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Row"]>;
        Relationships: [];
      };
      categories: {
        Row: { id: string; name: string; slug: string; description: string; icon: string; sort_order: number; seo_title: string; seo_description: string; active: boolean; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & { name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [];
      };
      collections: {
        Row: { id: string; name: string; slug: string; description: string; section_title: string; show_on_homepage: boolean; homepage_sort_order: number; banner_photo_url: string | null; active: boolean; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["collections"]["Row"]> & { name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["collections"]["Row"]>;
        Relationships: [];
      };
      collection_products: {
        Row: { collection_id: string; product_id: string; sort_order: number };
        Insert: Database["public"]["Tables"]["collection_products"]["Row"];
        Update: Partial<Database["public"]["Tables"]["collection_products"]["Row"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string; name: string; slug: string; sku: string; barcode: string | null; category_id: string | null;
          brand: string; description: string; highlights: string[]; specifications: Record<string, string>;
          shipping_info: string; return_policy: string; price: number; original_price: number; material: string;
          weight: number; status: "draft" | "published" | "archived"; featured: boolean; trending: boolean;
          best_seller: boolean; new_arrival: boolean; stock: number; low_stock_threshold: number; seo_title: string;
          seo_description: string; seo_keywords: string; sort_order: number; avg_rating: number; num_reviews: number;
          total_sold: number; created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & { name: string; slug: string; sku: string; brand: string; price: number; original_price: number };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Relationships: [];
      };
      product_images: {
        Row: { id: string; product_id: string; url: string; sort_order: number };
        Insert: Partial<Database["public"]["Tables"]["product_images"]["Row"]> & { product_id: string; url: string };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Row"]>;
        Relationships: [];
      };
      product_sizes: {
        Row: { product_id: string; size: number };
        Insert: Database["public"]["Tables"]["product_sizes"]["Row"];
        Update: Partial<Database["public"]["Tables"]["product_sizes"]["Row"]>;
        Relationships: [];
      };
      product_colors: {
        Row: { id: string; product_id: string; name: string; hex: string; sort_order: number };
        Insert: Partial<Database["public"]["Tables"]["product_colors"]["Row"]> & { product_id: string; name: string; hex: string };
        Update: Partial<Database["public"]["Tables"]["product_colors"]["Row"]>;
        Relationships: [];
      };
      wishlist_items: {
        Row: { user_id: string; product_id: string; created_at: string };
        Insert: { user_id: string; product_id: string };
        Update: Partial<Database["public"]["Tables"]["wishlist_items"]["Row"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string; order_number: string; customer_id: string | null; guest_email: string | null; guest_phone: string | null;
          shipping_name: string; shipping_phone: string; shipping_line1: string; shipping_line2: string | null;
          shipping_city: string; shipping_state: string; shipping_pincode: string; subtotal: number; discount_amount: number;
          shipping_charge: number; cod_charge: number; total: number; payment_method: "cod" | "upi" | "online" | "whatsapp";
          payment_status: "pending" | "paid" | "failed" | "refunded"; razorpay_order_id: string | null; razorpay_payment_id: string | null;
          coupon_code: string | null; status: string; courier_name: string | null; tracking_number: string | null;
          customer_note: string | null; admin_note: string | null; created_at: string; updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Relationships: [];
      };
      order_items: {
        Row: { id: string; order_id: string; product_id: string | null; product_name: string; brand: string; sku: string; size: number; color: string; unit_price: number; original_price: number; quantity: number; photo_url: string | null };
        Insert: Partial<Database["public"]["Tables"]["order_items"]["Row"]> & { order_id: string };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
        Relationships: [];
      };
      order_status_history: {
        Row: { id: string; order_id: string; status: string; at: string };
        Insert: Partial<Database["public"]["Tables"]["order_status_history"]["Row"]> & { order_id: string; status: string };
        Update: Partial<Database["public"]["Tables"]["order_status_history"]["Row"]>;
        Relationships: [];
      };
      reviews: {
        Row: { id: string; product_id: string; customer_id: string | null; customer_name: string; order_id: string | null; rating: number; title: string; body: string; images: string[] | null; status: "pending" | "approved" | "hidden"; pinned: boolean; admin_reply: string | null; helpful_count: number; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["reviews"]["Row"]> & { product_id: string; customer_name: string; rating: number };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Row"]>;
        Relationships: [];
      };
      coupons: {
        Row: { id: string; code: string; description: string; type: "percentage" | "fixed" | "free_shipping"; value: number; min_order_amount: number; max_discount: number | null; max_uses: number | null; uses_per_user: number; current_uses: number; active: boolean; starts_at: string; ends_at: string; created_at: string; applies_to: "all" | "category" | "product"; category_ids: string[]; product_ids: string[] };
        Insert: Partial<Database["public"]["Tables"]["coupons"]["Row"]> & { code: string; type: "percentage" | "fixed" | "free_shipping"; ends_at: string };
        Update: Partial<Database["public"]["Tables"]["coupons"]["Row"]>;
        Relationships: [];
      };
      offers: {
        Row: { id: string; name: string; description: string; type: string; value: number; applies_to: string; applies_to_id: string | null; show_on_homepage: boolean; badge_text: string; starts_at: string; ends_at: string; active: boolean; created_at: string; category_ids: string[]; collection_ids: string[]; product_ids: string[] };
        Insert: Partial<Database["public"]["Tables"]["offers"]["Row"]> & { name: string; type: string; ends_at: string };
        Update: Partial<Database["public"]["Tables"]["offers"]["Row"]>;
        Relationships: [];
      };
      store_settings: {
        Row: { id: boolean; brand_name: string; brand_tagline: string; logo_url: string; logo_dark_url: string; favicon_url: string; primary_color: string; secondary_color: string; button_color: string; accent_color: string; background_color: string; text_color: string; button_text_color: string; font_heading: string; font_body: string; whatsapp_number: string; support_email: string; support_phone: string; business_address: string; instagram_url: string; facebook_url: string; youtube_url: string; twitter_url: string; tiktok_url: string; currency_symbol: string; currency_code: string; upi_id: string; free_shipping_threshold: number; standard_shipping_charge: number; express_shipping_charge: number; cod_charge: number; cod_available: boolean; google_analytics_id: string; meta_pixel_id: string; microsoft_clarity_id: string; google_tag_manager_id: string; google_search_console_code: string; seo_default_title: string; seo_default_description: string; seo_default_keywords: string; seo_title_template: string; og_default_image: string; footer_about_text: string; footer_copyright_text: string; reviews_enabled: boolean; wishlist_enabled: boolean; guest_checkout_enabled: boolean; coupons_enabled: boolean; require_2fa_for_admin: boolean; uptime_monitor_url: string; newsletter_enabled: boolean; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["store_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["store_settings"]["Row"]>;
        Relationships: [];
      };
      homepage_hero: {
        Row: { id: boolean; heading: string; subheading: string; offer_badge_text: string; cta_primary_text: string; cta_primary_link: string; cta_secondary_text: string; cta_secondary_link: string; bg_type: "image" | "video" | "color"; photo_url: string; video_url: string; poster_image: string; overlay_opacity: number; text_alignment: "left" | "center" | "right"; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["homepage_hero"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["homepage_hero"]["Row"]>;
        Relationships: [];
      };
      announcement_bar: {
        Row: { id: boolean; text: string; bg_color: string; text_color: string; scroll_speed: number; active: boolean; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["announcement_bar"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["announcement_bar"]["Row"]>;
        Relationships: [];
      };
      homepage_banners: {
        Row: { id: string; title: string; subtitle: string; button_text: string; button_link: string; badge_text: string; badge_color: string; photo_url: string; active: boolean; sort_order: number };
        Insert: Partial<Database["public"]["Tables"]["homepage_banners"]["Row"]> & { title: string };
        Update: Partial<Database["public"]["Tables"]["homepage_banners"]["Row"]>;
        Relationships: [];
      };
      homepage_sections: {
        Row: { id: string; section_type: string; title: string; subtitle: string; collection_id: string | null; active: boolean; sort_order: number; product_limit: number };
        Insert: Partial<Database["public"]["Tables"]["homepage_sections"]["Row"]> & { section_type: string; title: string };
        Update: Partial<Database["public"]["Tables"]["homepage_sections"]["Row"]>;
        Relationships: [];
      };
      support_tickets: {
        Row: { id: string; ticket_number: string; customer_id: string | null; customer_name: string; customer_email: string; order_id: string | null; subject: string; category: string; priority: string; status: string; assigned_to: string | null; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]> & { ticket_number: string; customer_name: string; customer_email: string; subject: string };
        Update: Partial<Database["public"]["Tables"]["support_tickets"]["Row"]>;
        Relationships: [];
      };
      support_messages: {
        Row: { id: string; ticket_id: string; sender: "customer" | "staff"; body: string; at: string };
        Insert: Partial<Database["public"]["Tables"]["support_messages"]["Row"]> & { ticket_id: string; sender: "customer" | "staff"; body: string };
        Update: Partial<Database["public"]["Tables"]["support_messages"]["Row"]>;
        Relationships: [];
      };
      return_requests: {
        Row: { id: string; request_number: string; order_id: string; customer_id: string | null; type: "return" | "exchange"; reason: string; reason_detail: string | null; items: unknown; status: string; refund_amount: number | null; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["return_requests"]["Row"]> & { request_number: string; order_id: string; reason: string };
        Update: Partial<Database["public"]["Tables"]["return_requests"]["Row"]>;
        Relationships: [];
      };
      media_assets: {
        Row: { id: string; file_name: string; folder: string; file_type: "image" | "video"; alt_text: string; storage_path: string; file_size: number; uploaded_by: string | null; uploaded_at: string };
        Insert: Partial<Database["public"]["Tables"]["media_assets"]["Row"]> & { file_name: string; storage_path: string };
        Update: Partial<Database["public"]["Tables"]["media_assets"]["Row"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: { id: string; actor_email: string; actor_role: string; action: string; entity_type: string; entity_name: string; changed_fields: string[] | null; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]> & { actor_email: string; actor_role: string; action: string; entity_type: string; entity_name: string };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
        Relationships: [];
      };
      admin_notifications: {
        Row: { id: string; type: string; title: string; body: string; link: string; read: boolean; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["admin_notifications"]["Row"]> & { type: string; title: string };
        Update: Partial<Database["public"]["Tables"]["admin_notifications"]["Row"]>;
        Relationships: [];
      };
      staff_members: {
        Row: { id: string; name: string; email: string; role_id: string; active: boolean; last_active: string; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["staff_members"]["Row"]> & { id: string; name: string; email: string; role_id: string };
        Update: Partial<Database["public"]["Tables"]["staff_members"]["Row"]>;
        Relationships: [];
      };
      roles: {
        Row: { id: string; display_name: string; description: string; is_system_role: boolean; permissions: string[] };
        Insert: Partial<Database["public"]["Tables"]["roles"]["Row"]> & { id: string; display_name: string };
        Update: Partial<Database["public"]["Tables"]["roles"]["Row"]>;
        Relationships: [];
      };
      email_templates: {
        Row: { id: string; key: string; name: string; subject: string; body: string; active: boolean };
        Insert: Partial<Database["public"]["Tables"]["email_templates"]["Row"]> & { key: string; name: string; subject: string; body: string };
        Update: Partial<Database["public"]["Tables"]["email_templates"]["Row"]>;
        Relationships: [];
      };
      faqs: {
        Row: { id: string; question: string; answer: string; category: string; sort_order: number; active: boolean; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["faqs"]["Row"]> & { question: string; answer: string };
        Update: Partial<Database["public"]["Tables"]["faqs"]["Row"]>;
        Relationships: [];
      };
      error_logs: {
        Row: { id: string; level: "error" | "warning" | "info"; message: string; stack: string | null; component: string | null; route: string | null; user_id: string | null; browser: string | null; os: string | null; metadata: unknown; resolved: boolean; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["error_logs"]["Row"]> & { message: string };
        Update: Partial<Database["public"]["Tables"]["error_logs"]["Row"]>;
        Relationships: [];
      };
      ip_rules: {
        Row: { id: string; ip_address: string; type: "allow" | "block"; reason: string; scope: "all" | "admin" | "api"; active: boolean; expires_at: string | null; created_by: string | null; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["ip_rules"]["Row"]> & { ip_address: string; type: "allow" | "block" };
        Update: Partial<Database["public"]["Tables"]["ip_rules"]["Row"]>;
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: { id: string; email: string; subscribed_at: string; active: boolean };
        Insert: Partial<Database["public"]["Tables"]["newsletter_subscribers"]["Row"]> & { email: string };
        Update: Partial<Database["public"]["Tables"]["newsletter_subscribers"]["Row"]>;
        Relationships: [];
      };
      shipping_zones: {
        Row: { id: string; name: string; states: string[]; active: boolean };
        Insert: Partial<Database["public"]["Tables"]["shipping_zones"]["Row"]> & { name: string };
        Update: Partial<Database["public"]["Tables"]["shipping_zones"]["Row"]>;
        Relationships: [];
      };
      shipping_rates: {
        Row: { id: string; zone_id: string; name: string; type: string; base_rate: number; free_above: number | null; min_days: number; max_days: number; courier: string };
        Insert: Partial<Database["public"]["Tables"]["shipping_rates"]["Row"]> & { zone_id: string; name: string };
        Update: Partial<Database["public"]["Tables"]["shipping_rates"]["Row"]>;
        Relationships: [];
      };
      footer_link_groups: {
        Row: { id: string; group_name: string; sort_order: number };
        Insert: Partial<Database["public"]["Tables"]["footer_link_groups"]["Row"]> & { group_name: string };
        Update: Partial<Database["public"]["Tables"]["footer_link_groups"]["Row"]>;
        Relationships: [];
      };
      footer_links: {
        Row: { id: string; group_id: string; label: string; url: string; sort_order: number };
        Insert: Partial<Database["public"]["Tables"]["footer_links"]["Row"]> & { group_id: string; label: string; url: string };
        Update: Partial<Database["public"]["Tables"]["footer_links"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      place_order: {
        Args: {
          p_customer_id: string | null;
          p_guest_email: string | null;
          p_guest_phone: string | null;
          p_shipping: Record<string, string>;
          p_items: unknown[];
          p_payment_method: string;
          p_coupon_code: string | null;
          p_razorpay_order_id: string | null;
        };
        Returns: Database["public"]["Tables"]["orders"]["Row"];
      };
      validate_coupon: {
        Args: { p_code: string; p_cart_items: { product_id: string; subtotal: number }[] };
        Returns: { valid: boolean; message: string; discount_amount: number; coupon_type: string }[];
      };
      track_order: {
        Args: { p_order_number: string; p_phone: string };
        Returns: { order_number: string; status: string; courier_name: string | null; tracking_number: string | null; created_at: string }[];
      };
      admin_dashboard_stats: {
        Args: Record<string, never>;
        Returns: { total_revenue: number; total_orders: number; pending_orders: number; total_customers: number; low_stock_count: number };
      };
      check_rate_limit: {
        Args: { p_bucket_key: string; p_max_attempts: number; p_window_seconds: number };
        Returns: boolean;
      };
      log_admin_login: {
        Args: { p_email: string; p_role: string };
        Returns: void;
      };
    };
  };
}
