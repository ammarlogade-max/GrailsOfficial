import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { useCatalogStore } from "../../store/catalogStore";
import ProductGrid from "../../components/customer/ProductGrid";
import type { Product } from "../../data/types";
import { useSEO, SITE_URL } from "../../lib/useSEO";

export default function ProductListing() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, categories, collections, } = useCatalogStore();
  const [showFilters, setShowFilters] = useState(false);

  const categorySlug = searchParams.get("category");
  const q = searchParams.get("q")?.toLowerCase();
  const filter = searchParams.get("filter");
  const sort = searchParams.get("sort") || "relevance";
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(6000);

  const collection = slug ? collections.find((c) => c.slug === slug) : null;
  const category = categorySlug ? categories.find((c) => c.slug === categorySlug) : null;
  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brand))).sort(), [products]);

  let list: Product[] = products;
  if (collection) list = collection.productIds.map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[];
  if (category) list = list.filter((p) => p.categoryId === category.id);
  if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  if (filter === "sale") list = list.filter((p) => p.price < p.originalPrice);
  if (filter === "bestseller") list = list.filter((p) => p.bestSeller);
  if (filter === "newarrival") list = list.filter((p) => p.newArrival);
  if (selectedBrands.length) list = list.filter((p) => selectedBrands.includes(p.brand));
  list = list.filter((p) => p.price <= maxPrice);

  list = [...list];
  if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
  else if (sort === "newest") list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  else if (sort === "rating") list.sort((a, b) => b.avgRating - a.avgRating);

  const pageTitle = collection?.name || category?.name || (q ? `Search: "${q}"` : "All Products");

  useSEO({
    title: pageTitle,
    description: collection?.description || category?.description || `Shop ${pageTitle.toLowerCase()} at UrbanKicks — premium replica sneakers with COD and free shipping above ₹999.`,
    path: slug ? `/collections/${slug}` : categorySlug ? `/products?category=${categorySlug}` : "/products",
    index: !q, // search-result pages are noindex; category/collection pages are indexable
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Products", item: `${SITE_URL}/products` },
        ...(collection || category ? [{ "@type": "ListItem", position: 3, name: pageTitle, item: `${SITE_URL}${slug ? `/collections/${slug}` : `/products?category=${categorySlug}`}` }] : []),
      ],
    },
  });

  function toggleBrand(b: string) {
    setSelectedBrands((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  }

  const FiltersPanel = (
    <div className="space-y-6">
      <div>
        <h4 className="font-label text-sm tracking-wide mb-3">Category</h4>
        <div className="space-y-1.5 text-sm">
          <button
            onClick={() => setSearchParams((p) => { p.delete("category"); return p; })}
            className={`block ${!categorySlug ? "text-[var(--color-primary)] font-medium" : "text-neutral-600"}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSearchParams((p) => { p.set("category", c.slug); return p; })}
              className={`block ${categorySlug === c.slug ? "text-[var(--color-primary)] font-medium" : "text-neutral-600"}`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-label text-sm tracking-wide mb-3">Brand</h4>
        <div className="space-y-1.5">
          {brands.map((b) => (
            <label key={b} className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={selectedBrands.includes(b)} onChange={() => toggleBrand(b)} className="accent-[var(--color-primary)]" />
              {b}
            </label>
          ))}
        </div>
      </div>
      <div>
        <h4 className="font-label text-sm tracking-wide mb-3">Max Price: ₹{maxPrice.toLocaleString("en-IN")}</h4>
        <input type="range" min={1000} max={6000} step={100} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="w-full accent-[var(--color-primary)]" />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-display text-3xl sm:text-4xl">{pageTitle}</h1>
          <p className="text-sm text-neutral-500 mt-1">{list.length} products</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(true)} className="btn btn-outline btn-sm lg:hidden">
            <SlidersHorizontal size={14} /> Filters
          </button>
          <select
            value={sort}
            onChange={(e) => setSearchParams((p) => { p.set("sort", e.target.value); return p; })}
            className="select !w-auto text-sm"
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        <aside className="hidden lg:block">{FiltersPanel}</aside>
        <ProductGrid products={list} />
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={() => setShowFilters(false)}><X size={18} /></button>
            </div>
            {FiltersPanel}
            <button onClick={() => setShowFilters(false)} className="btn btn-primary w-full mt-6">Show {list.length} results</button>
          </div>
        </div>
      )}
    </div>
  );
}
