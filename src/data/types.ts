export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string;
  categoryId: string;
  brand: string;
  description: string;
  highlights: string[];
  specifications: Record<string, string>;
  shippingInfo: string;
  returnPolicy: string;
  price: number;
  originalPrice: number;
  images: string[]; // real product photo URLs
  videoUrl?: string;
  availableSizes: number[];
  availableColors: ProductColor[];
  material: string;
  weight: number;
  status: "draft" | "published" | "archived";
  featured: boolean;
  trending: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  stock: number;
  lowStockThreshold: number;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  sortOrder: number;
  numReviews: number;
  avgRating: number;
  totalSold: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
  active: boolean;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  sectionTitle: string;
  showOnHomepage: boolean;
  homepageSortOrder: number;
  productIds: string[];
  active: boolean;
  bannerPhoto?: string;
}

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarInitials: string;
  joinedAt: string;
  addresses: Address[];
  totalOrders: number;
  totalSpent: number;
  status: "active" | "blocked";
  tags: string[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  brand: string;
  sku: string;
  size: number;
  color: string;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  photo: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "returned"
  | "refunded";

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string | null;
  guestEmail?: string;
  guestPhone?: string;
  shippingName: string;
  shippingPhone: string;
  shippingLine1: string;
  shippingLine2?: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  shippingCharge: number;
  codCharge: number;
  total: number;
  paymentMethod: "cod" | "upi" | "online" | "whatsapp";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  couponCode?: string;
  status: OrderStatus;
  courierName?: string;
  trackingNumber?: string;
  customerNote?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: { status: OrderStatus; at: string }[];
}

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  orderId?: string;
  rating: number;
  title: string;
  body: string;
  images?: string[];
  status: "pending" | "approved" | "hidden";
  pinned: boolean;
  adminReply?: string;
  helpfulCount: number;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  maxUses: number | null;
  usesPerUser: number;
  currentUses: number;
  active: boolean;
  startsAt: string;
  endsAt: string;
  appliesTo: "all" | "category" | "product";
  categoryIds: string[];
  productIds: string[];
}

export interface Offer {
  id: string;
  name: string;
  description: string;
  type: "percentage" | "fixed" | "buy_x_get_y" | "free_shipping";
  value: number;
  appliesTo: "all" | "category" | "collection" | "product";
  categoryIds: string[];
  collectionIds: string[];
  productIds: string[];
  showOnHomepage: boolean;
  badgeText: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  orderId?: string;
  subject: string;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  status: "open" | "assigned" | "in_progress" | "waiting_customer" | "resolved" | "closed";
  assignedTo?: string;
  messages: { sender: "customer" | "staff"; body: string; at: string }[];
  createdAt: string;
}

export interface ReturnRequest {
  id: string;
  requestNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  type: "return" | "exchange";
  reason: string;
  reasonDetail?: string;
  items: { productName: string; quantity: number }[];
  status:
    | "requested"
    | "under_review"
    | "approved"
    | "rejected"
    | "pickup_scheduled"
    | "picked_up"
    | "received"
    | "refund_initiated"
    | "refunded"
    | "closed";
  refundAmount?: number;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  fileName: string;
  folder: "products" | "banners" | "hero" | "brand" | "reviews" | "general";
  fileType: "image" | "video";
  altText: string;
  photo: string;
  uploadedAt: string;
  fileSize: number;
}

export interface AuditLogEntry {
  id: string;
  actorEmail: string;
  actorRole: string;
  action: "created" | "updated" | "deleted" | "status_changed";
  entityType: string;
  entityName: string;
  changedFields?: string[];
  createdAt: string;
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  roleId: string;
  active: boolean;
  lastActive: string;
}

export interface RolePermission {
  id: string;
  name: string;
  displayName: string;
  description: string;
  isSystemRole: boolean;
  permissions: string[];
}

export interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  subject: string;
  body: string;
  active: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  active: boolean;
}

export interface ShippingZone {
  id: string;
  name: string;
  states: string[];
  active: boolean;
  rates: { name: string; type: string; baseRate: number; freeAbove?: number; minDays: number; maxDays: number; courier: string }[];
}
