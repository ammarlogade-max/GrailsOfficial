import { Navigate, NavLink, Outlet } from "react-router-dom";
import { Package, Heart, User, MapPin, Star, LogOut } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useSEO } from "../../lib/useSEO";

const tabs = [
  { to: "/account/orders", label: "Orders", icon: Package },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/profile", label: "Profile", icon: User },
  { to: "/account/addresses", label: "Addresses", icon: MapPin },
  { to: "/account/reviews", label: "My Reviews", icon: Star },
];

export default function Account() {
  const { user, logout } = useAuthStore();
  useSEO({ title: "My Account", index: false });
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <span className="w-12 h-12 rounded-full bg-[var(--color-secondary)] text-white flex items-center justify-center font-semibold">
          {user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </span>
        <div>
          <h1 className="font-display text-2xl">{user.fullName}</h1>
          <p className="text-sm text-neutral-500">{user.email}</p>
        </div>
      </div>
      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap ${
                  isActive ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium" : "text-neutral-600 hover:bg-neutral-50"
                }`
              }
            >
              <t.icon size={16} /> {t.label}
            </NavLink>
          ))}
          <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-rose-600 hover:bg-rose-50 mt-2">
            <LogOut size={16} /> Logout
          </button>
        </nav>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
