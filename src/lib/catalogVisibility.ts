import type { Product } from "../data/types";

export function isProductVisible(product: Product): boolean {
  return product.status === "published";
}

export function getVisibleProducts(products: Product[]): Product[] {
  return products.filter(isProductVisible);
}
