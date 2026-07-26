import { create } from "zustand";
import type { Product, Category, Collection } from "../data/types";
import { supabase } from "../lib/supabase";
import { isUuid } from "../lib/isUuid";
import { sanitizeText } from "../lib/sanitize";

interface CatalogState {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  upsertProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (id: string, stock: number) => Promise<void>;
  bulkUpdateStock: (updates: { id: string; stock: number }[]) => Promise<void>;
  upsertCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  upsertCollection: (collection: Collection) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || "",
    icon: row.icon || "👟",
    sortOrder: row.sort_order,
    seoTitle: row.seo_title || "",
    seoDescription: row.seo_description || "",
    active: row.active,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProduct(row: any): Product {
  const images = [...(row.product_images || [])].sort((a, b) => a.sort_order - b.sort_order);
  const sizes = [...(row.product_sizes || [])].sort((a, b) => Number(a.size) - Number(b.size));
  const colors = [...(row.product_colors || [])].sort((a, b) => a.sort_order - b.sort_order);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    barcode: row.barcode || "",
    categoryId: row.category_id,
    brand: row.brand,
    description: row.description || "",
    highlights: row.highlights || [],
    specifications: row.specifications || {},
    shippingInfo: row.shipping_info || "",
    returnPolicy: row.return_policy || "",
    price: Number(row.price),
    originalPrice: Number(row.original_price),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    images: images.length ? images.map((i: any) => i.url) : [""],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    availableSizes: sizes.map((s: any) => Number(s.size)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    availableColors: colors.map((c: any) => ({ name: c.name, hex: c.hex })),
    material: row.material || "",
    weight: row.weight || 0,
    status: row.status,
    featured: row.featured,
    trending: row.trending,
    bestSeller: row.best_seller,
    newArrival: row.new_arrival,
    stock: row.stock,
    lowStockThreshold: row.low_stock_threshold,
    seoTitle: row.seo_title || "",
    seoDescription: row.seo_description || "",
    seoKeywords: row.seo_keywords || "",
    sortOrder: row.sort_order,
    numReviews: row.num_reviews,
    avgRating: Number(row.avg_rating),
    totalSold: row.total_sold,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCollection(row: any): Collection {
  const cps = [...(row.collection_products || [])].sort((a, b) => a.sort_order - b.sort_order);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || "",
    sectionTitle: row.section_title || "",
    showOnHomepage: row.show_on_homepage,
    homepageSortOrder: row.homepage_sort_order,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    productIds: cps.map((cp: any) => cp.product_id),
    active: row.active,
    bannerPhoto: row.banner_photo_url || undefined,
  };
}

async function saveProductChildren(productId: string, product: Product) {
  await supabase.from("product_images").delete().eq("product_id", productId);
  if (product.images.length) {
    await supabase.from("product_images").insert(product.images.map((url, i) => ({ product_id: productId, url, sort_order: i })));
  }
  await supabase.from("product_sizes").delete().eq("product_id", productId);
  if (product.availableSizes.length) {
    await supabase.from("product_sizes").insert(product.availableSizes.map((size) => ({ product_id: productId, size })));
  }
  await supabase.from("product_colors").delete().eq("product_id", productId);
  if (product.availableColors.length) {
    await supabase
      .from("product_colors")
      .insert(product.availableColors.map((c, i) => ({ product_id: productId, name: c.name, hex: c.hex, sort_order: i })));
  }
}

export const useCatalogStore = create<CatalogState>()(
  (set) => ({
    products: [],
    categories: [],
    collections: [],
    loading: false,
    loaded: false,

    fetchAll: async () => {
      set({ loading: true });
      const [{ data: cats, error: catErr }, { data: prods, error: prodErr }, { data: cols, error: colErr }] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("products").select("*, product_images(*), product_sizes(*), product_colors(*)").order("sort_order"),
        supabase.from("collections").select("*, collection_products(*)"),
      ]);
      if (catErr) console.error("fetchAll categories failed:", catErr.message);
      if (prodErr) console.error("fetchAll products failed:", prodErr.message);
      if (colErr) console.error("fetchAll collections failed:", colErr.message);
      set({
        categories: (cats || []).map(mapCategory),
        products: (prods || []).map(mapProduct),
        collections: (cols || []).map(mapCollection),
        loading: false,
        loaded: true,
      });
    },

    upsertProduct: async (rawProduct) => {
      const product: Product = {
        ...rawProduct,
        name: sanitizeText(rawProduct.name),
        description: sanitizeText(rawProduct.description),
        highlights: rawProduct.highlights.map(sanitizeText),
        material: sanitizeText(rawProduct.material),
        shippingInfo: sanitizeText(rawProduct.shippingInfo),
        returnPolicy: sanitizeText(rawProduct.returnPolicy),
        seoTitle: sanitizeText(rawProduct.seoTitle),
        seoDescription: sanitizeText(rawProduct.seoDescription),
      };
      const isNew = !isUuid(product.id);
      const payload = {
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        barcode: product.barcode || null,
        category_id: isUuid(product.categoryId) ? product.categoryId : null,
        brand: product.brand,
        description: product.description,
        highlights: product.highlights,
        specifications: product.specifications,
        shipping_info: product.shippingInfo,
        return_policy: product.returnPolicy,
        price: product.price,
        original_price: product.originalPrice,
        material: product.material,
        weight: product.weight,
        status: product.status,
        featured: product.featured,
        trending: product.trending,
        best_seller: product.bestSeller,
        new_arrival: product.newArrival,
        stock: product.stock,
        low_stock_threshold: product.lowStockThreshold,
        seo_title: product.seoTitle,
        seo_description: product.seoDescription,
        seo_keywords: product.seoKeywords,
        sort_order: product.sortOrder,
      };
      let savedId = product.id;
      if (isNew) {
        let attempt = payload;
        let { data, error } = await supabase.from("products").insert(attempt).select("id").single();
        if (error && (error.code === "23505" || /unique/i.test(error.message || ""))) {
          const suffix = Math.random().toString(36).slice(2, 6);
          attempt = {
            ...attempt,
            slug: `${attempt.slug}-${suffix}`,
            sku: `${attempt.sku}-${suffix}`,
          };
          const retry = await supabase.from("products").insert(attempt).select("id").single();
          data = retry.data || data;
          error = retry.error;
        }
        if (error || !data) throw new Error(error?.message || "Failed to create product");
        savedId = data.id;
      } else {
        const { error } = await supabase.from("products").update(payload).eq("id", product.id);
        if (error) throw error;
      }
      await saveProductChildren(savedId, product);
      const { data: full, error: refetchErr } = await supabase
        .from("products")
        .select("*, product_images(*), product_sizes(*), product_colors(*)")
        .eq("id", savedId)
        .single();
      if (refetchErr) throw refetchErr;
      const saved = mapProduct(full);
      set((s) => ({
        products: s.products.some((p) => p.id === saved.id) ? s.products.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...s.products],
      }));
    },

    deleteProduct: async (id) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
    },

    updateStock: async (id, stock) => {
      const { error } = await supabase.from("products").update({ stock }).eq("id", id);
      if (error) throw error;
      set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, stock } : p)) }));
    },

    bulkUpdateStock: async (updates) => {
      const results = await Promise.allSettled(
        updates.map(({ id, stock }) => supabase.from("products").update({ stock }).eq("id", id))
      );
      const failed = results.filter((r) => r.status === "rejected" || (r.status === "fulfilled" && r.value.error));
      if (failed.length > 0) throw new Error(`${failed.length} of ${updates.length} products failed to update`);
      set((s) => ({
        products: s.products.map((p) => {
          const match = updates.find((u) => u.id === p.id);
          return match ? { ...p, stock: match.stock } : p;
        }),
      }));
    },

    upsertCategory: async (rawCategory) => {
      const category: Category = { ...rawCategory, name: sanitizeText(rawCategory.name), description: sanitizeText(rawCategory.description), seoTitle: sanitizeText(rawCategory.seoTitle), seoDescription: sanitizeText(rawCategory.seoDescription) };
      const isNew = !isUuid(category.id);
      const payload = {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        sort_order: category.sortOrder,
        seo_title: category.seoTitle,
        seo_description: category.seoDescription,
        active: category.active,
      };
      if (isNew) {
        const { data, error } = await supabase.from("categories").insert(payload).select().single();
        if (error) throw error;
        set((s) => ({ categories: [...s.categories, mapCategory(data)] }));
      } else {
        const { data, error } = await supabase.from("categories").update(payload).eq("id", category.id).select().single();
        if (error) throw error;
        const saved = mapCategory(data);
        set((s) => ({ categories: s.categories.map((c) => (c.id === saved.id ? saved : c)) }));
      }
    },

    deleteCategory: async (id) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      set((s) => ({
        categories: s.categories.filter((c) => c.id !== id),
        products: s.products.map((p) => (p.categoryId === id ? { ...p, categoryId: "" } : p)),
      }));
    },

    upsertCollection: async (rawCollection) => {
      const collection: Collection = { ...rawCollection, name: sanitizeText(rawCollection.name), description: sanitizeText(rawCollection.description), sectionTitle: sanitizeText(rawCollection.sectionTitle) };
      const isNew = !isUuid(collection.id);
      const payload = {
        name: collection.name,
        slug: collection.slug,
        description: collection.description,
        section_title: collection.sectionTitle,
        show_on_homepage: collection.showOnHomepage,
        homepage_sort_order: collection.homepageSortOrder,
        banner_photo_url: collection.bannerPhoto || null,
        active: collection.active,
      };
      let savedId = collection.id;
      if (isNew) {
        const { data, error } = await supabase.from("collections").insert(payload).select("id").single();
        if (error) throw error;
        savedId = data.id;
      } else {
        const { error } = await supabase.from("collections").update(payload).eq("id", collection.id);
        if (error) throw error;
      }
      await supabase.from("collection_products").delete().eq("collection_id", savedId);
      if (collection.productIds.length) {
        await supabase
          .from("collection_products")
          .insert(collection.productIds.map((pid, i) => ({ collection_id: savedId, product_id: pid, sort_order: i })));
      }
      const { data: full, error: refetchErr } = await supabase
        .from("collections")
        .select("*, collection_products(*)")
        .eq("id", savedId)
        .single();
      if (refetchErr) throw refetchErr;
      const saved = mapCollection(full);
      set((s) => ({
        collections: s.collections.some((c) => c.id === saved.id)
          ? s.collections.map((c) => (c.id === saved.id ? saved : c))
          : [...s.collections, saved],
      }));
    },

    deleteCollection: async (id) => {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
      set((s) => ({ collections: s.collections.filter((c) => c.id !== id) }));
    },
  })
);