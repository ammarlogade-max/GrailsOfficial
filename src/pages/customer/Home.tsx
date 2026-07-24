import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Truck, ShieldCheck, RotateCcw, Wallet } from "lucide-react";
import { useCMSStore } from "../../store/cmsStore";
import { useCatalogStore } from "../../store/catalogStore";
import { useReviewsStore } from "../../store/reviewsStore";
import ProductGrid from "../../components/customer/ProductGrid";
import SectionHeader from "../../components/customer/SectionHeader";
import HeroSection from "../../components/customer/HeroSection";
import OfferBannerStrip from "../../components/customer/OfferBannerStrip";
import InstagramSection from "../../components/customer/InstagramSection";
import NewsletterSignup from "../../components/customer/NewsletterSignup";
import Rating from "../../components/ui/Rating";
import type { HomepageSection } from "../../store/cmsStore";
import type { Product } from "../../data/types";
import { useSEO, SITE_URL } from "../../lib/useSEO";

function resolveProducts(section: HomepageSection, products: Product[], collections: ReturnType<typeof useCatalogStore.getState>["collections"]): Product[] {
  let list: Product[] = [];
  if (section.sectionType === "new_arrivals") list = [...products].filter((p) => p.newArrival || true).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  else if (section.sectionType === "best_sellers") list = [...products].sort((a, b) => b.totalSold - a.totalSold);
  else if (section.sectionType === "trending") list = products.filter((p) => p.trending);
  else if (section.sectionType === "featured") list = products.filter((p) => p.featured);
  else if (section.sectionType === "collection") {
    const col = collections.find((c) => c.id === section.collectionId);
    list = col ? (col.productIds.map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[]) : [];
  }
  return list.slice(0, section.productLimit);
}

export default function Home() {
  const { hero, banners, sections, settings } = useCMSStore();
  const { products, categories, collections } = useCatalogStore();
  const allReviews = useReviewsStore((s) => s.reviews);
  const fetchAllReviews = useReviewsStore((s) => s.fetchAll);
  const pinnedReviews = allReviews.filter((r) => r.status === "approved" && r.pinned).slice(0, 6);
  const fallbackReviews = allReviews.filter((r) => r.status === "approved").slice(0, 6);
  const featuredReviews = pinnedReviews.length ? pinnedReviews : fallbackReviews;

  useSEO({
    title: settings.brandTagline,
    description: settings.seoDefaultDescription,
    path: "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: settings.brandName,
      url: SITE_URL,
      sameAs: [settings.instagramUrl, settings.facebookUrl, settings.youtubeUrl].filter(Boolean),
    },
  });

  useEffect(() => {
    fetchAllReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <HeroSection hero={hero} />

      {/* TRUST STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-1 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {[
          { icon: Truck, label: `Free shipping above ${settings.currencySymbol}${settings.freeShippingThreshold}` },
          { icon: Wallet, label: settings.codAvailable ? "Cash on Delivery available" : "Secure online payments" },
          { icon: RotateCcw, label: "7-day easy returns" },
          { icon: ShieldCheck, label: "Premium quality checked" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2.5 p-3 rounded-lg border border-neutral-200">
            <Icon size={20} className="text-[var(--color-primary)] shrink-0" />
            <span className="text-neutral-700 leading-tight">{label}</span>
          </div>
        ))}
      </section>

      <OfferBannerStrip banners={banners} />

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <SectionHeader eyebrow="Shop by" title="Categories" subtitle="Find your perfect fit" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {categories.filter((c) => c.active).map((c) => (
            <Link key={c.id} to={`/products?category=${c.slug}`} className="flex flex-col items-center gap-2 group">
              <div className="w-full aspect-square rounded-xl bg-neutral-100 flex items-center justify-center text-3xl group-hover:bg-[var(--color-primary)]/10 transition-colors border border-neutral-200">
                {c.icon}
              </div>
              <span className="text-xs sm:text-sm font-medium text-center">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* DYNAMIC SECTIONS FROM CMS */}
      {sections.filter((s) => s.active).sort((a, b) => a.sortOrder - b.sortOrder).map((section) => {
        if (section.sectionType === "categories_grid" || section.sectionType === "reviews") return null;
        if (section.sectionType === "instagram") {
          return (
            <InstagramSection
              key={section.id}
              title={section.title}
              subtitle={section.subtitle}
              instagramUrl={settings.instagramUrl}
              products={[...products].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))}
            />
          );
        }
        // 'video' and 'custom_banner' section types exist in the schema
        // (per the SRS's section_type enum) but don't have dedicated
        // renderers yet — skip rather than crash on an unbuilt type.
        if (section.sectionType === "video" || section.sectionType === "custom_banner") return null;
        const list = resolveProducts(section, products, collections);
        if (list.length === 0) return null;
        return (
          <section key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <SectionHeader title={section.title} subtitle={section.subtitle} ctaLink="/products" />
            <ProductGrid products={list} />
          </section>
        );
      })}

      {/* REVIEWS */}
      {sections.find((s) => s.sectionType === "reviews" && s.active) && featuredReviews.length > 0 && (
        <section className="py-14" style={{ background: "var(--color-surface)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <SectionHeader eyebrow="Testimonials" title="What Our Customers Say" subtitle="10,000+ happy sneakerheads across India" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredReviews.map((r) => (
                <div key={r.id} className="card p-5">
                  <Rating value={r.rating} size={13} />
                  <p className="font-medium mt-2 text-sm">{r.title}</p>
                  <p className="text-sm text-neutral-600 mt-1.5 line-clamp-2">{r.body}</p>
                  <p className="text-xs text-neutral-400 mt-3 font-label">— {r.customerName}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WHATSAPP CTA (existing functionality — preserved as-is) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="rounded-2xl p-8 sm:p-12 text-center" style={{ background: "var(--color-secondary)" }}>
          <h3 className="text-display text-white text-3xl sm:text-4xl">Never Miss A Drop</h3>
          <p className="text-neutral-400 mt-2 max-w-md mx-auto text-sm">Get early access to new arrivals and exclusive offers on WhatsApp.</p>
          <a
            href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary btn-lg mt-5"
          >
            Join on WhatsApp
          </a>
        </div>
      </section>

      {settings.newsletterEnabled && <NewsletterSignup />}
    </div>
  );
}
