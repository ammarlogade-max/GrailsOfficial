import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import AnnouncementBar from "./AnnouncementBar";
import Header from "./Header";
import Footer from "./Footer";
import Toaster from "../ui/Toaster";
import { useThemeSync } from "../../lib/useThemeSync";
import { useAuthStore } from "../../store/authStore";
import { useWishlistStore } from "../../store/wishlistStore";

export default function CustomerLayout() {
  useThemeSync();
  const location = useLocation();
  const userId = useAuthStore((s) => s.user?.id);
  const fetchWishlist = useWishlistStore((s) => s.fetchForUser);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (userId) fetchWishlist();
  }, [userId, fetchWishlist]);

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
