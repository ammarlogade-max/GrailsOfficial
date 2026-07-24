/**
 * Optional: loads the demo catalog (categories, products, collections) into
 * your real Supabase project so you have realistic data to test against
 * before you add your own inventory.
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (never the anon key —
 * this script needs to bypass RLS to seed data) as environment variables.
 *
 * Run with:  npm run seed:demo
 */
import { createClient } from "@supabase/supabase-js";
import { categories } from "../src/data/categories";
import { products } from "../src/data/products";
import { collections } from "../src/data/collections";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  console.error("Example: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx npm run seed:demo");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function main() {
  console.log("Seeding categories...");
  const categoryIdMap = new Map<string, string>();
  for (const c of categories) {
    const { data, error } = await supabase
      .from("categories")
      .upsert(
        {
          name: c.name,
          slug: c.slug,
          description: c.description,
          icon: c.icon,
          sort_order: c.sortOrder,
          seo_title: c.seoTitle,
          seo_description: c.seoDescription,
          active: c.active,
        },
        { onConflict: "slug" }
      )
      .select("id, slug")
      .single();
    if (error) throw error;
    categoryIdMap.set(c.id, data.id);
  }
  console.log(`  ${categoryIdMap.size} categories done.`);

  console.log("Seeding products...");
  const productIdMap = new Map<string, string>();
  for (const p of products) {
    const { data, error } = await supabase
      .from("products")
      .upsert(
        {
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          barcode: p.barcode,
          category_id: categoryIdMap.get(p.categoryId),
          brand: p.brand,
          description: p.description,
          highlights: p.highlights,
          specifications: p.specifications,
          shipping_info: p.shippingInfo,
          return_policy: p.returnPolicy,
          price: p.price,
          original_price: p.originalPrice,
          material: p.material,
          weight: p.weight,
          status: p.status,
          featured: p.featured,
          trending: p.trending,
          best_seller: p.bestSeller,
          new_arrival: p.newArrival,
          stock: p.stock,
          low_stock_threshold: p.lowStockThreshold,
          seo_title: p.seoTitle,
          seo_description: p.seoDescription,
          seo_keywords: p.seoKeywords,
          sort_order: p.sortOrder,
        },
        { onConflict: "slug" }
      )
      .select("id, slug")
      .single();
    if (error) throw error;
    productIdMap.set(p.id, data.id);

    // Images
    await supabase.from("product_images").delete().eq("product_id", data.id);
    await supabase
      .from("product_images")
      .insert(p.images.map((url, i) => ({ product_id: data.id, url, sort_order: i })));

    // Sizes
    await supabase.from("product_sizes").delete().eq("product_id", data.id);
    await supabase
      .from("product_sizes")
      .insert(p.availableSizes.map((size) => ({ product_id: data.id, size })));

    // Colors
    await supabase.from("product_colors").delete().eq("product_id", data.id);
    await supabase
      .from("product_colors")
      .insert(p.availableColors.map((c, i) => ({ product_id: data.id, name: c.name, hex: c.hex, sort_order: i })));
  }
  console.log(`  ${productIdMap.size} products done.`);

  console.log("Seeding collections...");
  for (const col of collections) {
    const { data, error } = await supabase
      .from("collections")
      .upsert(
        {
          name: col.name,
          slug: col.slug,
          description: col.description,
          section_title: col.sectionTitle,
          show_on_homepage: col.showOnHomepage,
          homepage_sort_order: col.homepageSortOrder,
          banner_photo_url: col.bannerPhoto,
          active: col.active,
        },
        { onConflict: "slug" }
      )
      .select("id, slug")
      .single();
    if (error) throw error;

    await supabase.from("collection_products").delete().eq("collection_id", data.id);
    await supabase.from("collection_products").insert(
      col.productIds
        .map((pid) => productIdMap.get(pid))
        .filter(Boolean)
        .map((pid, i) => ({ collection_id: data.id, product_id: pid, sort_order: i }))
    );
  }
  console.log(`  ${collections.length} collections done.`);

  console.log("\n✅ Demo catalog seeded successfully.");
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
