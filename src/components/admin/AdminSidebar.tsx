import { NavLink } from "react-router-dom";
import { useEffect } from "react";
import {
  LayoutDashboard, Layers, Tags, FolderTree, Boxes, Palette, BadgePercent, Ticket,
  ShoppingCart, Users, Star, Image, BarChart3, FileBarChart, LifeBuoy, Bell,
  Settings, Truck, Mail, ShieldCheck, History, HelpCircle, Bug, X,
} from "lucide-react";
import { useAdminAuthStore } from "../../store/authStore";
import { useStaffStore } from "../../store/staffStore";

const groups = [
  { label: "Overview", items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }] },
  {
    label: "Catalog",
    items: [
      { to: "/admin/products", label: "Products", icon: Layers, permission: "products.view" },
      { to: "/admin/categories", label: "Categories", icon: FolderTree, permission: "categories.manage" },
      { to: "/admin/collections", label: "Collections", icon: Tags, permission: "collections.manage" },
      { to: "/admin/inventory", label: "Inventory", icon: Boxes, permission: "inventory.view" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { to: "/admin/homepage", label: "Homepage CMS", icon: Palette, permission: "homepage.edit" },
      { to: "/admin/offers", label: "Offers", icon: BadgePercent, permission: "offers.manage" },
      { to: "/admin/coupons", label: "Coupons", icon: Ticket, permission: "coupons.manage" },
    ],
  },
  {
    label: "Sales",
    items: [
      { to: "/admin/orders", label: "Orders", icon: ShoppingCart, permission: "orders.view" },
      { to: "/admin/customers", label: "Customers", icon: Users, permission: "customers.view" },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/admin/reviews", label: "Reviews", icon: Star, permission: "reviews.manage" },
      { to: "/admin/media", label: "Media Library", icon: Image, permission: "media.upload" },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3, permission: "analytics.view" },
      { to: "/admin/reports", label: "Reports", icon: FileBarChart, permission: "analytics.view" },
    ],
  },
  {
    label: "Support",
    items: [
      { to: "/admin/support", label: "Support Tickets", icon: LifeBuoy, permission: "support.manage" },
      { to: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/admin/settings", label: "Website Settings", icon: Settings, permission: "settings.edit" },
      { to: "/admin/faqs", label: "FAQs", icon: HelpCircle, permission: "settings.edit" },
      { to: "/admin/shipping", label: "Shipping", icon: Truck, permission: "shipping.manage" },
      { to: "/admin/email-templates", label: "Email Templates", icon: Mail, permission: "email_templates.manage" },
      { to: "/admin/permissions", label: "Permissions", icon: ShieldCheck, permission: "roles.manage" },
      { to: "/admin/audit-logs", label: "Audit Logs", icon: History, permission: "roles.manage" },
      { to: "/admin/error-logs", label: "Error Logs", icon: Bug, permission: "roles.manage" },
    ],
  },
];

export default function AdminSidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const roleId = useAdminAuthStore((s) => s.adminUser?.roleId);
  const { roles, loaded, fetchAll } = useStaffStore();

  useEffect(() => {
    if (!loaded) fetchAll();
  }, [fetchAll, loaded]);

  const rolePermissions = roles.find((r) => r.id === roleId)?.permissions ?? [];
  const canSee = (permission?: string) =>
    !permission || roleId === "super_admin" || rolePermissions.includes("*") || rolePermissions.includes(permission);

  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter((item) => canSee("permission" in item ? item.permission : undefined)) }))
    .filter((g) => g.items.length > 0);

  const content = (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-neutral-300 w-64 shrink-0">
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <img src="/image.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-display text-lg text-white tracking-tight">Grail's Official</span>
        </div>
        <button onClick={onClose} className="lg:hidden text-neutral-400">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-3 admin-scrollbar-thin">
        {visibleGroups.map((g) => (
          <div key={g.label} className="mb-4">
            <div className="px-5 text-[10px] uppercase tracking-wider text-neutral-500 font-label mb-1.5">{g.label}</div>
            {g.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={"end" in item ? item.end : false}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-5 py-2 text-sm transition-colors border-l-2 ${
                    isActive
                      ? "bg-white/10 text-white border-[var(--color-primary)]"
                      : "border-transparent hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block h-screen sticky top-0">{content}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="absolute left-0 top-0 bottom-0">{content}</div>
        </div>
      )}
    </>
  );
}
