import { create } from "zustand";
import { persist } from "zustand/middleware";
import { heroPhoto, darkBannerPhoto, categoryHeroPhoto } from "../lib/images";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { sanitizeText } from "../lib/sanitize";

export interface StoreSettings {
  brandName: string;
  brandTagline: string;
  logoUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  buttonColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  buttonTextColor: string;
  fontHeading: string;
  fontBody: string;
  whatsappNumber: string;
  supportEmail: string;
  supportPhone: string;
  businessAddress: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  tiktokUrl: string;
  currencySymbol: string;
  currencyCode: string;
  upiId: string;
  freeShippingThreshold: number;
  standardShippingCharge: number;
  expressShippingCharge: number;
  codCharge: number;
  codAvailable: boolean;
  googleAnalyticsId: string;
  metaPixelId: string;
  microsoftClarityId: string;
  googleTagManagerId: string;
  googleSearchConsoleCode: string;
  seoDefaultTitle: string;
  seoDefaultDescription: string;
  seoDefaultKeywords: string;
  seoTitleTemplate: string;
  ogDefaultImage: string;
  footerAboutText: string;
  footerCopyrightText: string;
  reviewsEnabled: boolean;
  wishlistEnabled: boolean;
  guestCheckoutEnabled: boolean;
  couponsEnabled: boolean;
  require2faForAdmin: boolean;
  uptimeMonitorUrl: string;
  newsletterEnabled: boolean;
}

export interface HeroContent {
  heading: string;
  subheading: string;
  offerBadgeText: string;
  ctaPrimaryText: string;
  ctaPrimaryLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
  bgType: "image" | "video" | "color";
  photo: string;
  videoUrl: string;
  posterImage: string;
  overlayOpacity: number;
  textAlignment: "left" | "center" | "right";
}

export interface HomepageBanner {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  badgeText: string;
  badgeColor: string;
  photo: string;
  active: boolean;
  sortOrder: number;
}

export type SectionType =
  | "new_arrivals" | "best_sellers" | "trending" | "featured" | "collection" | "categories_grid" | "brand_story" | "reviews"
  | "video" | "instagram" | "custom_banner";

export interface HomepageSection {
  id: string;
  sectionType: SectionType;
  title: string;
  subtitle: string;
  collectionId?: string;
  active: boolean;
  sortOrder: number;
  productLimit: number;
}

export interface AnnouncementBar {
  text: string;
  bgColor: string;
  textColor: string;
  scrollSpeed: number;
  active: boolean;
}

export interface FooterLinkGroup {
  groupName: string;
  links: { label: string; url: string }[];
}

interface CMSState {
  settings: StoreSettings;
  hero: HeroContent;
  banners: HomepageBanner[];
  sections: HomepageSection[];
  announcement: AnnouncementBar;
  footerGroups: FooterLinkGroup[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  updateSettings: (patch: Partial<StoreSettings>) => void;
  persistSettings: () => Promise<void>;
  updateHero: (patch: Partial<HeroContent>) => void;
  persistHero: () => Promise<void>;
  updateAnnouncement: (patch: Partial<AnnouncementBar>) => void;
  persistAnnouncement: () => Promise<void>;
  updateBanner: (id: string, patch: Partial<HomepageBanner>) => void;
  persistBanner: (id: string) => Promise<void>;
  addBanner: (banner: HomepageBanner) => Promise<void>;
  removeBanner: (id: string) => Promise<void>;
  reorderBanners: (banners: HomepageBanner[]) => void;
  updateSection: (id: string, patch: Partial<HomepageSection>) => void;
  persistSection: (id: string) => Promise<void>;
  reorderSections: (sections: HomepageSection[]) => void;
  resetDemo: () => void;
}

const defaultSettings: StoreSettings = {
  brandName: "Grail's Official",
  brandTagline: "Premium Replica Sneakers",
  logoUrl: "",
  logoDarkUrl: "",
  faviconUrl: "",
  primaryColor: "#f97316",
  secondaryColor: "#0a0a0a",
  buttonColor: "#f97316",
  accentColor: "#f97316",
  backgroundColor: "#ffffff",
  textColor: "#0a0a0a",
  buttonTextColor: "#ffffff",
  fontHeading: "Inter",
  fontBody: "Inter",
  whatsappNumber: "+91 98765 43210",
  supportEmail: "support@grailsofficial.in",
  supportPhone: "+91 98765 43210",
  businessAddress: "Shop 12, Neral Main Road, Raigad, Maharashtra 410101",
  instagramUrl: "https://instagram.com/grailsoffcl",
  facebookUrl: "https://facebook.com/grailsoffcl",
  youtubeUrl: "https://youtube.com/@grailsoffcl",
  twitterUrl: "",
  tiktokUrl: "",
  currencySymbol: "₹",
  currencyCode: "INR",
  upiId: "",
  freeShippingThreshold: 999,
  standardShippingCharge: 99,
  expressShippingCharge: 199,
  codCharge: 49,
  codAvailable: true,
  googleAnalyticsId: "G-XXXXXXXXXX",
  metaPixelId: "",
  microsoftClarityId: "",
  googleTagManagerId: "",
  googleSearchConsoleCode: "",
  seoDefaultTitle: "Grail's Official — Premium Replica Sneakers",
  seoDefaultDescription: "Shop premium replica sneakers online. COD available, free shipping above ₹999, 7-day returns. India's trusted sneaker store.",
  seoDefaultKeywords: "replica sneakers, sneakers india, cod sneakers, premium replica shoes",
  seoTitleTemplate: "%s | Grail's Official",
  ogDefaultImage: "",
  footerAboutText: "Grail's Official brings you premium quality replica sneakers at honest prices — for the sneakerheads who know their kicks.",
  footerCopyrightText: "© 2026 Grail's Official. All rights reserved.",
  reviewsEnabled: true,
  wishlistEnabled: true,
  guestCheckoutEnabled: true,
  couponsEnabled: true,
  require2faForAdmin: false,
  uptimeMonitorUrl: "",
  newsletterEnabled: true,
};

const defaultHero: HeroContent = {
  heading: "India's Best Replica Sneakers",
  subheading: "Premium quality, unbeatable prices. COD available across India.",
  offerBadgeText: "UP TO 60% OFF",
  ctaPrimaryText: "Shop Now",
  ctaPrimaryLink: "/products",
  ctaSecondaryText: "Explore Jordans",
  ctaSecondaryLink: "/collections/jordan-collection",
  bgType: "image",
  photo: heroPhoto(),
  videoUrl: "",
  posterImage: "",
  overlayOpacity: 0.55,
  textAlignment: "left",
};

const defaultBanners: HomepageBanner[] = [
  { id: "ban-1", title: "Festival Sale", subtitle: "Up to 60% off sitewide", buttonText: "Shop the Sale", buttonLink: "/collections/festival-sale", badgeText: "60% OFF", badgeColor: "#e11d48", photo: darkBannerPhoto("sneakersBlackBg"), active: true, sortOrder: 1 },
  { id: "ban-2", title: "Jordan Collection", subtitle: "Retro exclusives just dropped", buttonText: "Explore", buttonLink: "/collections/jordan-collection", badgeText: "NEW", badgeColor: "#f97316", photo: categoryHeroPhoto("cat-basketball"), active: true, sortOrder: 2 },
  { id: "ban-3", title: "Monsoon Ready", subtitle: "Grippy soles for the rains", buttonText: "Shop Now", buttonLink: "/collections/monsoon-ready", badgeText: "TRENDING", badgeColor: "#0a0a0a", photo: categoryHeroPhoto("cat-training"), active: true, sortOrder: 3 },
];

const defaultSections: HomepageSection[] = [
  { id: "sec-1", sectionType: "new_arrivals", title: "New Arrivals", subtitle: "Fresh drops, just landed", active: true, sortOrder: 1, productLimit: 8 },
  { id: "sec-2", sectionType: "best_sellers", title: "Best Sellers", subtitle: "Customer favourites", active: true, sortOrder: 2, productLimit: 8 },
  { id: "sec-3", sectionType: "collection", title: "🎉 Festival Sale", subtitle: "Our biggest markdowns of the season", collectionId: "col-festival", active: true, sortOrder: 3, productLimit: 8 },
  { id: "sec-4", sectionType: "categories_grid", title: "Shop by Category", subtitle: "Find your perfect fit", active: true, sortOrder: 4, productLimit: 8 },
  { id: "sec-5", sectionType: "trending", title: "🔥 Trending Now", subtitle: "What everyone's buying", active: true, sortOrder: 5, productLimit: 8 },
  { id: "sec-6", sectionType: "collection", title: "Jordan Exclusives", subtitle: "Iconic silhouettes for the culture", collectionId: "col-jordan", active: true, sortOrder: 6, productLimit: 8 },
  { id: "sec-7", sectionType: "reviews", title: "What Our Customers Say", subtitle: "10,000+ happy sneakerheads", active: true, sortOrder: 7, productLimit: 6 },
  { id: "sec-8", sectionType: "instagram", title: "Shop Our Instagram", subtitle: "Tag us @grailsoffcl for a chance to be featured", active: true, sortOrder: 8, productLimit: 6 },
];

const defaultAnnouncement: AnnouncementBar = {
  text: "FREE DELIVERY ABOVE ₹999 · COD AVAILABLE · NEW ARRIVALS WEEKLY · 7-DAY EASY RETURNS",
  bgColor: "#0a0a0a",
  textColor: "#ffffff",
  scrollSpeed: 30,
  active: true,
};

const defaultFooterGroups: FooterLinkGroup[] = [
  { groupName: "Shop", links: [
    { label: "New Arrivals", url: "/products?sort=newest" },
    { label: "Best Sellers", url: "/products?filter=bestseller" },
    { label: "Collections", url: "/products" },
    { label: "Sale", url: "/collections/festival-sale" },
  ]},
  { groupName: "Help", links: [
    { label: "Track Order", url: "/track" },
    { label: "Returns & Exchange", url: "/account/orders" },
    { label: "FAQs", url: "/faq" },
    { label: "Contact Us", url: "/" },
  ]},
  { groupName: "Company", links: [
    { label: "About Us", url: "/" },
    { label: "Careers", url: "/" },
    { label: "Privacy Policy", url: "/" },
    { label: "Terms of Service", url: "/" },
  ]},
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSettings(row: any): StoreSettings {
  return {
    brandName: row.brand_name, brandTagline: row.brand_tagline,
    logoUrl: row.logo_url || "", logoDarkUrl: row.logo_dark_url || "", faviconUrl: row.favicon_url || "",
    primaryColor: row.primary_color, secondaryColor: row.secondary_color, buttonColor: row.button_color,
    accentColor: row.accent_color || row.primary_color, backgroundColor: row.background_color || "#ffffff",
    textColor: row.text_color || "#0a0a0a", buttonTextColor: row.button_text_color || "#ffffff",
    fontHeading: row.font_heading || "Inter", fontBody: row.font_body || "Inter",
    whatsappNumber: row.whatsapp_number || "",
    supportEmail: row.support_email || "", supportPhone: row.support_phone || "", businessAddress: row.business_address || "",
    instagramUrl: row.instagram_url || "", facebookUrl: row.facebook_url || "", youtubeUrl: row.youtube_url || "",
    twitterUrl: row.twitter_url || "", tiktokUrl: row.tiktok_url || "",
    currencySymbol: row.currency_symbol, currencyCode: row.currency_code || "INR", upiId: row.upi_id || "",
    freeShippingThreshold: Number(row.free_shipping_threshold),
    standardShippingCharge: Number(row.standard_shipping_charge), expressShippingCharge: Number(row.express_shipping_charge ?? 199),
    codCharge: Number(row.cod_charge),
    codAvailable: row.cod_available, googleAnalyticsId: row.google_analytics_id || "", metaPixelId: row.meta_pixel_id || "",
    microsoftClarityId: row.microsoft_clarity_id || "", googleTagManagerId: row.google_tag_manager_id || "",
    googleSearchConsoleCode: row.google_search_console_code || "",
    seoDefaultTitle: row.seo_default_title || "",
    seoDefaultDescription: row.seo_default_description || "", seoDefaultKeywords: row.seo_default_keywords || "",
    seoTitleTemplate: row.seo_title_template || "%s | Grail's Official", ogDefaultImage: row.og_default_image || "",
    footerAboutText: row.footer_about_text || "",
    footerCopyrightText: row.footer_copyright_text || "", reviewsEnabled: row.reviews_enabled,
    wishlistEnabled: row.wishlist_enabled, guestCheckoutEnabled: row.guest_checkout_enabled, couponsEnabled: row.coupons_enabled,
    require2faForAdmin: row.require_2fa_for_admin || false, uptimeMonitorUrl: row.uptime_monitor_url || "",
    newsletterEnabled: row.newsletter_enabled ?? true,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHero(row: any): HeroContent {
  return {
    heading: row.heading || "", subheading: row.subheading || "", offerBadgeText: row.offer_badge_text || "",
    ctaPrimaryText: row.cta_primary_text || "", ctaPrimaryLink: row.cta_primary_link || "",
    ctaSecondaryText: row.cta_secondary_text || "", ctaSecondaryLink: row.cta_secondary_link || "",
    bgType: row.bg_type || "image", photo: row.photo_url || heroPhoto(), videoUrl: row.video_url || "", posterImage: row.poster_image || "",
    overlayOpacity: Number(row.overlay_opacity), textAlignment: row.text_alignment,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAnnouncement(row: any): AnnouncementBar {
  return { text: row.text || "", bgColor: row.bg_color, textColor: row.text_color, scrollSpeed: row.scroll_speed, active: row.active };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBanner(row: any): HomepageBanner {
  return {
    id: row.id, title: row.title, subtitle: row.subtitle || "", buttonText: row.button_text || "",
    buttonLink: row.button_link || "", badgeText: row.badge_text || "", badgeColor: row.badge_color || "#f97316",
    photo: row.photo_url || "", active: row.active, sortOrder: row.sort_order,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSection(row: any): HomepageSection {
  return {
    id: row.id, sectionType: row.section_type, title: row.title, subtitle: row.subtitle || "",
    collectionId: row.collection_id ?? undefined, active: row.active, sortOrder: row.sort_order, productLimit: row.product_limit,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (id: string) => UUID_RE.test(id);

export const useCMSStore = create<CMSState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      hero: defaultHero,
      banners: defaultBanners,
      sections: defaultSections,
      announcement: defaultAnnouncement,
      footerGroups: defaultFooterGroups,
      loading: false,
      loaded: !isSupabaseConfigured,

      fetchAll: async () => {
        if (!isSupabaseConfigured) return;
        set({ loading: true });
        const [
          { data: settingsRow, error: sErr },
          { data: heroRow, error: hErr },
          { data: annRow, error: aErr },
          { data: bannerRows, error: bErr },
          { data: sectionRows, error: secErr },
          { data: groupRows, error: gErr },
        ] = await Promise.all([
          supabase.from("store_settings").select("*").single(),
          supabase.from("homepage_hero").select("*").single(),
          supabase.from("announcement_bar").select("*").single(),
          supabase.from("homepage_banners").select("*").order("sort_order"),
          supabase.from("homepage_sections").select("*").order("sort_order"),
          supabase.from("footer_link_groups").select("*, footer_links(*)").order("sort_order"),
        ]);
        if (sErr) console.error("fetch store_settings failed:", sErr.message);
        if (hErr) console.error("fetch homepage_hero failed:", hErr.message);
        if (aErr) console.error("fetch announcement_bar failed:", aErr.message);
        if (bErr) console.error("fetch homepage_banners failed:", bErr.message);
        if (secErr) console.error("fetch homepage_sections failed:", secErr.message);
        if (gErr) console.error("fetch footer_link_groups failed:", gErr.message);
        set({
          settings: settingsRow ? mapSettings(settingsRow) : defaultSettings,
          hero: heroRow ? mapHero(heroRow) : defaultHero,
          announcement: annRow ? mapAnnouncement(annRow) : defaultAnnouncement,
          banners: bannerRows ? bannerRows.map(mapBanner) : [],
          sections: sectionRows ? sectionRows.map(mapSection) : [],
          footerGroups: groupRows
            ? groupRows.map((g) => ({
                groupName: g.group_name,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                links: [...(g.footer_links || [])].sort((a: any, b: any) => a.sort_order - b.sort_order).map((l: any) => ({ label: l.label, url: l.url })),
              }))
            : defaultFooterGroups,
          loading: false,
          loaded: true,
        });
      },

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      persistSettings: async () => {
        if (!isSupabaseConfigured) return;
        const clean = {
          ...get().settings,
          brandTagline: sanitizeText(get().settings.brandTagline),
          businessAddress: sanitizeText(get().settings.businessAddress),
          seoDefaultTitle: sanitizeText(get().settings.seoDefaultTitle),
          seoDefaultDescription: sanitizeText(get().settings.seoDefaultDescription),
          footerAboutText: sanitizeText(get().settings.footerAboutText),
          footerCopyrightText: sanitizeText(get().settings.footerCopyrightText),
        };
        set({ settings: clean });
        const s = clean;
        const { error } = await supabase
          .from("store_settings")
          .update({
            brand_name: s.brandName, brand_tagline: s.brandTagline,
            logo_url: s.logoUrl, logo_dark_url: s.logoDarkUrl, favicon_url: s.faviconUrl,
            primary_color: s.primaryColor, secondary_color: s.secondaryColor, button_color: s.buttonColor,
            accent_color: s.accentColor, background_color: s.backgroundColor, text_color: s.textColor, button_text_color: s.buttonTextColor,
            font_heading: s.fontHeading, font_body: s.fontBody,
            whatsapp_number: s.whatsappNumber,
            support_email: s.supportEmail, support_phone: s.supportPhone, business_address: s.businessAddress,
            instagram_url: s.instagramUrl, facebook_url: s.facebookUrl, youtube_url: s.youtubeUrl,
            twitter_url: s.twitterUrl, tiktok_url: s.tiktokUrl,
            currency_symbol: s.currencySymbol, currency_code: s.currencyCode, upi_id: s.upiId,
            free_shipping_threshold: s.freeShippingThreshold,
            standard_shipping_charge: s.standardShippingCharge, express_shipping_charge: s.expressShippingCharge,
            cod_charge: s.codCharge, cod_available: s.codAvailable,
            google_analytics_id: s.googleAnalyticsId, meta_pixel_id: s.metaPixelId, microsoft_clarity_id: s.microsoftClarityId,
            google_tag_manager_id: s.googleTagManagerId, google_search_console_code: s.googleSearchConsoleCode,
            seo_default_title: s.seoDefaultTitle, seo_default_description: s.seoDefaultDescription,
            seo_default_keywords: s.seoDefaultKeywords, seo_title_template: s.seoTitleTemplate, og_default_image: s.ogDefaultImage,
            footer_about_text: s.footerAboutText, footer_copyright_text: s.footerCopyrightText,
            reviews_enabled: s.reviewsEnabled, wishlist_enabled: s.wishlistEnabled,
            guest_checkout_enabled: s.guestCheckoutEnabled, coupons_enabled: s.couponsEnabled,
            require_2fa_for_admin: s.require2faForAdmin, uptime_monitor_url: s.uptimeMonitorUrl, newsletter_enabled: s.newsletterEnabled,
          })
          .eq("id", true);
        if (error) throw error;
      },

      updateHero: (patch) => set((s) => ({ hero: { ...s.hero, ...patch } })),
      persistHero: async () => {
        if (!isSupabaseConfigured) return;
        const clean = {
          ...get().hero,
          heading: sanitizeText(get().hero.heading),
          subheading: sanitizeText(get().hero.subheading),
          offerBadgeText: sanitizeText(get().hero.offerBadgeText),
          ctaPrimaryText: sanitizeText(get().hero.ctaPrimaryText),
          ctaSecondaryText: sanitizeText(get().hero.ctaSecondaryText),
        };
        set({ hero: clean });
        const h = clean;
        const { error } = await supabase
          .from("homepage_hero")
          .update({
            heading: h.heading, subheading: h.subheading, offer_badge_text: h.offerBadgeText,
            cta_primary_text: h.ctaPrimaryText, cta_primary_link: h.ctaPrimaryLink,
            cta_secondary_text: h.ctaSecondaryText, cta_secondary_link: h.ctaSecondaryLink,
            bg_type: h.bgType, photo_url: h.photo, video_url: h.videoUrl, poster_image: h.posterImage,
            overlay_opacity: h.overlayOpacity, text_alignment: h.textAlignment,
          })
          .eq("id", true);
        if (error) throw error;
      },

      updateAnnouncement: (patch) => set((s) => ({ announcement: { ...s.announcement, ...patch } })),
      persistAnnouncement: async () => {
        if (!isSupabaseConfigured) return;
        const clean = { ...get().announcement, text: sanitizeText(get().announcement.text) };
        set({ announcement: clean });
        const a = clean;
        const { error } = await supabase
          .from("announcement_bar")
          .update({ text: a.text, bg_color: a.bgColor, text_color: a.textColor, scroll_speed: a.scrollSpeed, active: a.active })
          .eq("id", true);
        if (error) throw error;
      },

      updateBanner: (id, patch) => set((s) => ({ banners: s.banners.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      persistBanner: async (id) => {
        if (!isSupabaseConfigured) return;
        const raw = get().banners.find((x) => x.id === id);
        if (!raw) return;
        const b = { ...raw, title: sanitizeText(raw.title), subtitle: sanitizeText(raw.subtitle), buttonText: sanitizeText(raw.buttonText), badgeText: sanitizeText(raw.badgeText) };
        set((s) => ({ banners: s.banners.map((x) => (x.id === id ? b : x)) }));
        const { error } = await supabase
          .from("homepage_banners")
          .update({
            title: b.title, subtitle: b.subtitle, button_text: b.buttonText, button_link: b.buttonLink,
            badge_text: b.badgeText, badge_color: b.badgeColor, photo_url: b.photo, active: b.active, sort_order: b.sortOrder,
          })
          .eq("id", id);
        if (error) throw error;
      },
      addBanner: async (rawBanner) => {
        const banner = { ...rawBanner, title: sanitizeText(rawBanner.title), subtitle: sanitizeText(rawBanner.subtitle) };
        if (isSupabaseConfigured) {
          const { data, error } = await supabase
            .from("homepage_banners")
            .insert({
              title: banner.title, subtitle: banner.subtitle, button_text: banner.buttonText, button_link: banner.buttonLink,
              badge_text: banner.badgeText, badge_color: banner.badgeColor, photo_url: banner.photo, active: banner.active, sort_order: banner.sortOrder,
            })
            .select()
            .single();
          if (error) throw error;
          set((s) => ({ banners: [...s.banners, mapBanner(data)] }));
          return;
        }
        set((s) => ({ banners: [...s.banners, banner] }));
      },
      removeBanner: async (id) => {
        if (isSupabaseConfigured && isUuid(id)) {
          const { error } = await supabase.from("homepage_banners").delete().eq("id", id);
          if (error) throw error;
        }
        set((s) => ({ banners: s.banners.filter((b) => b.id !== id) }));
      },
      reorderBanners: (banners) => set({ banners }),

      updateSection: (id, patch) => set((s) => ({ sections: s.sections.map((sec) => (sec.id === id ? { ...sec, ...patch } : sec)) })),
      persistSection: async (id) => {
        if (!isSupabaseConfigured) return;
        const raw = get().sections.find((x) => x.id === id);
        if (!raw) return;
        const sec = { ...raw, title: sanitizeText(raw.title), subtitle: sanitizeText(raw.subtitle) };
        set((s) => ({ sections: s.sections.map((x) => (x.id === id ? sec : x)) }));
        const { error } = await supabase
          .from("homepage_sections")
          .update({ title: sec.title, subtitle: sec.subtitle, active: sec.active, sort_order: sec.sortOrder, product_limit: sec.productLimit })
          .eq("id", id);
        if (error) throw error;
      },
      reorderSections: (sections) => set({ sections }),

      resetDemo: () =>
        set({
          settings: defaultSettings,
          hero: defaultHero,
          banners: defaultBanners,
          sections: defaultSections,
          announcement: defaultAnnouncement,
          footerGroups: defaultFooterGroups,
        }),
    }),
    {
      name: "urbankicks-cms",
      partialize: (state) =>
        isSupabaseConfigured
          ? {}
          : { settings: state.settings, hero: state.hero, banners: state.banners, sections: state.sections, announcement: state.announcement, footerGroups: state.footerGroups },
    }
  )
);
