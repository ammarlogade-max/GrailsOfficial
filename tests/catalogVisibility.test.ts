import test from "node:test";
import assert from "node:assert/strict";
import type { Product } from "../src/data/types";
import { getVisibleProducts, isProductVisible } from "../src/lib/catalogVisibility";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    name: "Test Product",
    slug: "test-product",
    sku: "SKU-1",
    barcode: "",
    categoryId: "cat-1",
    brand: "Test Brand",
    description: "",
    highlights: [],
    specifications: {},
    shippingInfo: "",
    returnPolicy: "",
    price: 1000,
    originalPrice: 1200,
    images: [""],
    availableSizes: [8],
    availableColors: [],
    material: "",
    weight: 300,
    status: "published",
    featured: false,
    trending: false,
    bestSeller: false,
    newArrival: false,
    stock: 10,
    lowStockThreshold: 5,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    sortOrder: 0,
    numReviews: 0,
    avgRating: 0,
    totalSold: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

test("published products are visible", () => {
  assert.equal(isProductVisible(makeProduct({ status: "published" })), true);
});

test("draft and archived products are hidden from the storefront", () => {
  assert.equal(isProductVisible(makeProduct({ status: "draft" })), false);
  assert.equal(isProductVisible(makeProduct({ status: "archived" })), false);
});

test("visible product helpers filter the storefront list", () => {
  const products = [
    makeProduct({ id: "a", status: "published" }),
    makeProduct({ id: "b", status: "draft" }),
    makeProduct({ id: "c", status: "published" }),
  ];

  assert.deepEqual(getVisibleProducts(products).map((p) => p.id), ["a", "c"]);
});
