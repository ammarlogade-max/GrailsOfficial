import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import type { Product } from "../../data/types";
import ProductImage from "./ProductImage";
import Rating from "../ui/Rating";
import { formatINR } from "../../lib/format";
import { useWishlistStore } from "../../store/wishlistStore";
import { useToastStore } from "../../store/toastStore";

export default function ProductCard({ product }: { product: Product }) {
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const toggle = useWishlistStore((s) => s.toggle);
  const showToast = useToastStore((s) => s.show);
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  return (
    <Link to={`/product/${product.slug}`} className="product-card group block relative">
      <div className="relative aspect-square bg-neutral-50 overflow-hidden">
        <ProductImage src={product.images[0]} alt={product.name} className="transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.newArrival && <span className="badge bg-[var(--color-secondary)] text-white">New</span>}
          {discount > 0 && <span className="badge bg-rose-600 text-white">{discount}% OFF</span>}
          {product.stock <= product.lowStockThreshold && product.stock > 0 && (
            <span className="badge bg-amber-500 text-white">Low Stock</span>
          )}
          {product.stock === 0 && <span className="badge bg-neutral-500 text-white">Sold Out</span>}
        </div>
        <button
          onClick={async (e) => {
            e.preventDefault();
            try {
              await toggle(product.id);
              showToast(isWishlisted ? "Removed from wishlist" : "Added to wishlist", "success");
            } catch {
              showToast("Failed to update wishlist", "error");
            }
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:scale-110 transition-transform"
          aria-label="Toggle wishlist"
        >
          <Heart size={15} className={isWishlisted ? "fill-rose-500 text-rose-500" : "text-neutral-600"} />
        </button>
      </div>
      <div className="p-3">
        <div className="text-[11px] uppercase tracking-wide text-neutral-400 font-label">{product.brand}</div>
        <div className="text-sm font-medium text-neutral-900 line-clamp-1 mt-0.5">{product.name}</div>
        <div className="mt-1">
          <Rating value={product.avgRating} size={12} />
        </div>
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="font-semibold text-neutral-900">{formatINR(product.price)}</span>
          {discount > 0 && <span className="text-xs text-neutral-400 line-through">{formatINR(product.originalPrice)}</span>}
        </div>
      </div>
    </Link>
  );
}
