import { useWishlistStore } from "../../store/wishlistStore";
import { useCatalogStore } from "../../store/catalogStore";
import ProductGrid from "../../components/customer/ProductGrid";

export default function AccountWishlist() {
  const productIds = useWishlistStore((s) => s.productIds);
  const products = useCatalogStore((s) => s.products);
  const items = productIds.map((id) => products.find((p) => p.id === id)).filter(Boolean) as typeof products;
  if (items.length === 0) return <p className="text-neutral-500 text-sm">No items in your wishlist yet.</p>;
  return <ProductGrid products={items} columns={3} />;
}
