import type { Product } from "../../data/types";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products, columns = 4 }: { products: Product[]; columns?: 3 | 4 }) {
  const colClass = columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";
  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-500">
        <p className="font-label text-lg">No products found</p>
        <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
      </div>
    );
  }
  return (
    <div className={`grid grid-cols-2 ${colClass} gap-3 sm:gap-5`}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
