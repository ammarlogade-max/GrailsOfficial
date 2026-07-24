import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import Toaster from "../ui/Toaster";
import { useStaffStore } from "../../store/staffStore";
import { useSEO } from "../../lib/useSEO";

const titleMap: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/products": "Products",
  "/admin/categories": "Categories",
  "/admin/collections": "Collections",
  "/admin/inventory": "Inventory",
  "/admin/homepage": "Homepage CMS",
  "/admin/offers": "Offers",
  "/admin/coupons": "Coupons",
  "/admin/orders": "Orders",
  "/admin/customers": "Customers",
  "/admin/reviews": "Reviews",
  "/admin/media": "Media Library",
  "/admin/analytics": "Analytics",
  "/admin/reports": "Reports",
  "/admin/support": "Support Tickets",
  "/admin/notifications": "Notifications",
  "/admin/settings": "Website Settings",
  "/admin/shipping": "Shipping",
  "/admin/faqs": "FAQs",
  "/admin/error-logs": "Error Logs",
  "/admin/email-templates": "Email Templates",
  "/admin/permissions": "Permissions",
  "/admin/audit-logs": "Audit Logs",
};

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const base = "/" + location.pathname.split("/").slice(1, 3).join("/");
  const title = titleMap[base] || titleMap[location.pathname] || "Admin";
  const fetchStaff = useStaffStore((s) => s.fetchAll);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);
  useSEO({ title: `${title} · Admin`, index: false });

  return (
    <div className="flex bg-neutral-50 min-h-screen">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0">
        <AdminTopbar onMenuClick={() => setMobileOpen(true)} title={title} />
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </div>
      <Toaster />
    </div>
  );
}
