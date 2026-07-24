import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useWishlistStore } from "../../store/wishlistStore";
import { useCatalogStore } from "../../store/catalogStore";
import ProductGrid from "../../components/customer/ProductGrid";
import { useSEO } from "../../lib/useSEO";

export default function Wishlist() {
  useSEO({ title: "My Wishlist", index: false });

  const productIds = useWishlistStore((s) => s.productIds);
  const products = useCatalogStore((s) => s.products);
  const items = productIds.map((id) => products.find((p) => p.id === id)).filter(Boolean) as typeof products;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-display text-3xl sm:text-4xl mb-6">My Wishlist</h1>
      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={48} className="mx-auto text-neutral-300" />
          <p className="text-neutral-500 mt-4">Your wishlist is empty.</p>
          <Link to="/products" className="btn btn-primary mt-6 inline-flex">Explore Products</Link>
        </div>
      ) : (
        <ProductGrid products={items} />
      )}
    </div>
  );
}
