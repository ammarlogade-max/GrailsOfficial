import type { MediaAsset, AuditLogEntry, AdminNotification, StaffMember, RolePermission, EmailTemplate, ShippingZone } from "./types";
import { products } from "./products";
import { heroPhoto, darkBannerPhoto } from "../lib/images";

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}
function hoursAgoIso(hours: number) {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

export const mediaAssets: MediaAsset[] = [
  ...products.slice(0, 18).map((p, i) => ({
    id: `media-${i + 1}`,
    fileName: `${p.slug}-01.jpg`,
    folder: "products" as const,
    fileType: "image" as const,
    altText: `${p.name} product shot`,
    photo: p.images[0],
    uploadedAt: daysAgoIso(i),
    fileSize: 240000 + i * 5000,
  })),
  { id: "media-hero-1", fileName: "hero-banner-main.jpg", folder: "hero", fileType: "image", altText: "Homepage hero banner", photo: heroPhoto(), uploadedAt: daysAgoIso(20), fileSize: 610000 },
  { id: "media-banner-1", fileName: "festival-sale-banner.jpg", folder: "banners", fileType: "image", altText: "Festival Sale banner", photo: darkBannerPhoto("sneakersBlackBg"), uploadedAt: daysAgoIso(6), fileSize: 480000 },
  { id: "media-brand-1", fileName: "urbankicks-logo.jpg", folder: "brand", fileType: "image", altText: "UrbanKicks logo", photo: darkBannerPhoto("sneakerDarkProfile"), uploadedAt: daysAgoIso(90), fileSize: 34000 },
];

export const auditLogs: AuditLogEntry[] = [
  { id: "log-1", actorEmail: "admin@urbankicks.in", actorRole: "super_admin", action: "updated", entityType: "product", entityName: "Nike Air Zoom Pulse Runner", changedFields: ["price", "stock"], createdAt: hoursAgoIso(2) },
  { id: "log-2", actorEmail: "marketing@urbankicks.in", actorRole: "marketing_manager", action: "created", entityType: "coupon", entityName: "MONSOON15", createdAt: hoursAgoIso(5) },
  { id: "log-3", actorEmail: "admin@urbankicks.in", actorRole: "super_admin", action: "updated", entityType: "homepage_hero", entityName: "Hero Section", changedFields: ["heading", "bg_image_url"], createdAt: hoursAgoIso(9) },
  { id: "log-4", actorEmail: "support@urbankicks.in", actorRole: "customer_support", action: "status_changed", entityType: "order", entityName: "UK-20261014", changedFields: ["status"], createdAt: hoursAgoIso(14) },
  { id: "log-5", actorEmail: "admin@urbankicks.in", actorRole: "super_admin", action: "deleted", entityType: "banner", entityName: "Diwali Sale Banner", createdAt: hoursAgoIso(30) },
  { id: "log-6", actorEmail: "inventory@urbankicks.in", actorRole: "inventory_manager", action: "updated", entityType: "product", entityName: "Adidas Ultraboost Surge", changedFields: ["stock"], createdAt: hoursAgoIso(48) },
  { id: "log-7", actorEmail: "admin@urbankicks.in", actorRole: "super_admin", action: "created", entityType: "staff_member", entityName: "Rhea D'Souza", createdAt: daysAgoIso(4) },
  { id: "log-8", actorEmail: "marketing@urbankicks.in", actorRole: "marketing_manager", action: "updated", entityType: "collection", entityName: "Jordan Collection", changedFields: ["show_on_homepage"], createdAt: daysAgoIso(6) },
];

export const adminNotifications: AdminNotification[] = [
  { id: "ntf-1", type: "new_order", title: "New order received", body: "Order UK-20261047 worth ₹4,299", link: "/admin/orders", read: false, createdAt: hoursAgoIso(1) },
  { id: "ntf-2", type: "low_stock", title: "Low stock alert", body: "Puma RS-X Chunky has only 12 units left", link: "/admin/inventory", read: false, createdAt: hoursAgoIso(3) },
  { id: "ntf-3", type: "new_review", title: "New review awaiting approval", body: "5★ review on Nike Air Jordan Retro High", link: "/admin/reviews", read: false, createdAt: hoursAgoIso(6) },
  { id: "ntf-4", type: "return_requested", title: "Return requested", body: "RT-20261007 — wrong size", link: "/admin/orders", read: true, createdAt: hoursAgoIso(20) },
  { id: "ntf-5", type: "failed_payment", title: "Payment failed", body: "Order UK-20261032 payment failed", link: "/admin/orders", read: true, createdAt: daysAgoIso(2) },
  { id: "ntf-6", type: "coupon_usage_limit", title: "Coupon nearing limit", body: "EIDFEST20 has reached 90% of max uses", link: "/admin/coupons", read: true, createdAt: daysAgoIso(3) },
];

export const staffMembers: StaffMember[] = [
  { id: "staff-1", name: "Admin User", email: "admin@urbankicks.in", roleId: "super_admin", active: true, lastActive: hoursAgoIso(0.2) },
  { id: "staff-2", name: "Rhea D'Souza", email: "support@urbankicks.in", roleId: "customer_support", active: true, lastActive: hoursAgoIso(1) },
  { id: "staff-3", name: "Amit Kulkarni", email: "inventory@urbankicks.in", roleId: "inventory_manager", active: true, lastActive: hoursAgoIso(4) },
  { id: "staff-4", name: "Sanya Kapoor", email: "marketing@urbankicks.in", roleId: "marketing_manager", active: true, lastActive: hoursAgoIso(2) },
  { id: "staff-5", name: "Farhan Sheikh", email: "manager@urbankicks.in", roleId: "store_manager", active: false, lastActive: daysAgoIso(12) },
];

export const roles: RolePermission[] = [
  { id: "super_admin", name: "super_admin", displayName: "Super Admin", description: "Full access to everything, cannot be modified.", isSystemRole: true, permissions: ["*"] },
  { id: "store_manager", name: "store_manager", displayName: "Store Manager", description: "Manage products, orders, and customers.", isSystemRole: false, permissions: ["products.view", "products.create", "products.edit", "orders.view", "orders.update_status", "customers.view"] },
  { id: "inventory_manager", name: "inventory_manager", displayName: "Inventory Manager", description: "Manage products and stock levels only.", isSystemRole: false, permissions: ["products.view", "products.edit", "inventory.view", "inventory.edit", "inventory.bulk_update"] },
  { id: "customer_support", name: "customer_support", displayName: "Customer Support", description: "Manage orders and customer queries.", isSystemRole: false, permissions: ["orders.view", "orders.add_note", "customers.view", "returns.manage"] },
  { id: "marketing_manager", name: "marketing_manager", displayName: "Marketing Manager", description: "Manage homepage, banners, offers, and coupons.", isSystemRole: false, permissions: ["homepage.edit", "banners.manage", "collections.manage", "coupons.manage", "offers.manage"] },
];

export const emailTemplates: EmailTemplate[] = [
  { id: "et-1", key: "order_confirmation", name: "Order Confirmation", subject: "Your UrbanKicks order {{order_number}} is confirmed 🎉", body: "Hi {{customer_name}}, thanks for shopping with UrbanKicks! Your order {{order_number}} worth ₹{{total}} has been confirmed and will ship within 2-3 business days.", active: true },
  { id: "et-2", key: "order_shipped", name: "Order Shipped", subject: "Your order {{order_number}} is on its way 🚚", body: "Good news {{customer_name}}! Your order has been shipped via {{courier_name}}. Track it here: {{tracking_link}}", active: true },
  { id: "et-3", key: "order_delivered", name: "Order Delivered", subject: "Delivered! Enjoy your new kicks 👟", body: "Hi {{customer_name}}, your order {{order_number}} has been delivered. We'd love to hear your feedback — leave a review!", active: true },
  { id: "et-4", key: "abandoned_cart", name: "Abandoned Cart Reminder", subject: "You left something in your cart 👀", body: "Hey {{customer_name}}, your cart is waiting! Complete your order before items go out of stock.", active: true },
  { id: "et-5", key: "return_approved", name: "Return Approved", subject: "Your return request {{request_number}} is approved", body: "Hi {{customer_name}}, your return has been approved. Our courier partner will pick up the item shortly.", active: true },
  { id: "et-6", key: "password_reset", name: "Password Reset", subject: "Reset your UrbanKicks password", body: "Click the link below to reset your password. This link expires in 30 minutes.", active: false },
];

export const shippingZones: ShippingZone[] = [
  { id: "zone-1", name: "Mumbai Local", states: ["Maharashtra"], active: true, rates: [
    { name: "Standard", type: "flat", baseRate: 49, freeAbove: 999, minDays: 1, maxDays: 2, courier: "Delhivery" },
    { name: "Express", type: "flat", baseRate: 99, minDays: 1, maxDays: 1, courier: "Shiprocket" },
  ]},
  { id: "zone-2", name: "Maharashtra & Goa", states: ["Maharashtra", "Goa"], active: true, rates: [
    { name: "Standard", type: "flat", baseRate: 79, freeAbove: 999, minDays: 2, maxDays: 3, courier: "Delhivery" },
  ]},
  { id: "zone-3", name: "North India", states: ["Delhi", "Punjab", "Haryana", "Rajasthan"], active: true, rates: [
    { name: "Standard", type: "flat", baseRate: 99, freeAbove: 999, minDays: 3, maxDays: 5, courier: "DTDC" },
  ]},
  { id: "zone-4", name: "Pan India", states: [], active: true, rates: [
    { name: "Standard", type: "flat", baseRate: 129, freeAbove: 999, minDays: 4, maxDays: 7, courier: "Shiprocket" },
  ]},
];
