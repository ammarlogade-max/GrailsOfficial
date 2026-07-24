import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { useCMSStore } from "../../store/cmsStore";
import { useCartStore } from "../../store/cartStore";
import { useWishlistStore } from "../../store/wishlistStore";
import { useAuthStore } from "../../store/authStore";
import { categories } from "../../data/categories";

export default function Header() {
  const settings = useCMSStore((s) => s.settings);
  const cartCount = useCartStore((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  const wishlistCount = useWishlistStore((s) => s.productIds.length);
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/products${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          <div className="flex items-center gap-1 min-w-0">
            <button className="lg:hidden p-2 -ml-2 shrink-0" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
            <Link to="/" className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-8 h-8 rounded flex items-center justify-center text-white font-display text-lg shrink-0"
                style={{ background: "var(--color-secondary)" }}
              >
                U
              </span>
              <span className="font-display text-lg sm:text-2xl tracking-tight truncate" style={{ color: "var(--color-secondary)" }}>
                {settings.brandName}
              </span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-7 font-label text-[0.95rem]">
            {categories.slice(0, 5).map((c) => (
              <Link key={c.id} to={`/products?category=${c.slug}`} className="hover:text-[var(--color-primary)] transition-colors">
                {c.name}
              </Link>
            ))}
            <Link to="/products?filter=sale" className="text-[var(--color-primary)]">
              Sale
            </Link>
          </nav>

          <form onSubmit={submitSearch} className="hidden md:flex items-center flex-1 max-w-sm relative">
            <Search size={16} className="absolute left-3 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sneakers, brands..."
              className="input pl-9 !py-2 text-sm"
            />
          </form>

          <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
            <button className="md:hidden p-1.5 sm:p-2 text-neutral-700" onClick={() => navigate("/products")} aria-label="Search">
              <Search size={20} />
            </button>
            <Link to="/wishlist" className="relative p-1.5 sm:p-2 text-neutral-700" aria-label="Wishlist">
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[var(--color-primary)] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative p-1.5 sm:p-2 text-neutral-700" aria-label="Cart">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[var(--color-primary)] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link to={user ? "/account" : "/login"} className="p-2 text-neutral-700 hidden sm:block" aria-label="Account">
              <User size={20} />
            </Link>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl p-5 flex flex-col gap-1 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <span className="font-display text-xl">{settings.brandName}</span>
              <button onClick={() => setMobileOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitSearch} className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="input pl-9 !py-2 text-sm" />
            </form>
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/products?category=${c.slug}`}
                onClick={() => setMobileOpen(false)}
                className="py-2.5 font-label text-base border-b border-neutral-100"
              >
                {c.icon} {c.name}
              </Link>
            ))}
            <Link to={user ? "/account" : "/login"} onClick={() => setMobileOpen(false)} className="py-2.5 font-label text-base mt-2">
              {user ? "My Account" : "Login / Register"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
