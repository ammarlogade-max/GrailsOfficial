import { useEffect } from "react";
import { useCMSStore } from "../store/cmsStore";

export interface SEOOptions {
  /** Page-specific title. Combined with the site's seoTitleTemplate-style suffix. */
  title: string;
  description?: string;
  /** Absolute or site-relative image URL for social share cards. */
  image?: string;
  /** Path (e.g. "/products/nike-air-zoom") used to build the canonical + og:url. */
  path?: string;
  type?: "website" | "product" | "article";
  /** One or more JSON-LD structured data objects (Product, BreadcrumbList, Organization, etc). */
  jsonLd?: object | object[];
  /** Set to false on pages that shouldn't be indexed (cart, checkout, account). */
  index?: boolean;
}

const SITE_URL = "https://urbankicks.in";

function setMeta(selector: string, attr: "content", value: string) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

/**
 * Per-page SEO for a client-rendered SPA: updates <title>, meta description,
 * canonical link, Open Graph/Twitter tags, robots directive, and injects
 * JSON-LD structured data — all client-side, since this app doesn't have
 * server rendering. Search engines that execute JavaScript (Google does)
 * pick these up; it's not equivalent to true SSR but recovers most of the
 * practical SEO value without a framework rewrite.
 *
 * Falls back to the site-wide defaults from Website Settings when a page
 * doesn't override something, and restores those defaults on unmount so
 * the next page starts clean.
 */
export function useSEO(options: SEOOptions) {
  const settings = useCMSStore((s) => s.settings);

  useEffect(() => {
    const title = options.title ? `${options.title} | ${settings.brandName}` : settings.seoDefaultTitle || settings.brandName;
    const description = options.description || settings.seoDefaultDescription;
    const image = options.image || settings.ogDefaultImage || "";
    const url = SITE_URL + (options.path || "");

    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", url);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:image"]', "content", image);
    setMeta('meta[property="og:type"]', "content", options.type || "website");
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[name="robots"]', "content", options.index === false ? "noindex, nofollow" : "index, follow");

    const script = document.getElementById("jsonld-page");
    if (script) {
      script.textContent = options.jsonLd ? JSON.stringify(options.jsonLd) : "";
    }

    return () => {
      // Reset to site-wide defaults so the next page (if it doesn't call
      // useSEO itself) isn't left showing this page's title/tags.
      document.title = settings.seoDefaultTitle || settings.brandName;
      setMeta('meta[name="description"]', "content", settings.seoDefaultDescription);
      const script = document.getElementById("jsonld-page");
      if (script) script.textContent = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.title, options.description, options.image, options.path, options.type, options.index, JSON.stringify(options.jsonLd), settings.brandName]);
}

export { SITE_URL };
