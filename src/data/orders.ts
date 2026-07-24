import type { Order, OrderItem, OrderStatus } from "./types";
import { products } from "./products";
import { customers } from "./customers";

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const statusFlow: OrderStatus[] = [
  "pending", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered",
];

const allStatuses: OrderStatus[] = [
  "pending", "confirmed", "processing", "packed", "shipped", "out_for_delivery",
  "delivered", "delivered", "delivered", "delivered", "cancelled", "return_requested", "returned",
];

function buildHistory(finalStatus: OrderStatus, createdDaysAgo: number) {
  const idx = statusFlow.indexOf(finalStatus);
  const steps = idx === -1 ? [finalStatus] : statusFlow.slice(0, idx + 1);
  return steps.map((status, i) => ({
    status,
    at: daysAgoIso(createdDaysAgo - i * 0.5 < 0 ? 0 : createdDaysAgo - i * 0.5),
  }));
}

function makeItem(productIndex: number, size: number, qty: number): OrderItem {
  const p = products[productIndex % products.length];
  const color = p.availableColors[0];
  return {
    productId: p.id,
    productName: p.name,
    brand: p.brand,
    sku: p.sku,
    size,
    color: color.name,
    unitPrice: p.price,
    originalPrice: p.originalPrice,
    quantity: qty,
    photo: p.images[0],
  };
}

const paymentMethods: Order["paymentMethod"][] = ["cod", "upi", "online", "cod", "cod"];

export const orders: Order[] = Array.from({ length: 48 }).map((_, i) => {
  const customer = customers[i % customers.length];
  const daysAgo = Math.floor((i * 3.1) % 60) + (i % 3);
  const status = allStatuses[i % allStatuses.length];
  const itemCount = 1 + (i % 3);
  const items: OrderItem[] = Array.from({ length: itemCount }).map((_, j) =>
    makeItem(i + j * 7, [7, 8, 9, 10][j % 4], 1 + (j === 0 && i % 5 === 0 ? 1 : 0))
  );
  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const discount = i % 4 === 0 ? Math.round(subtotal * 0.1) : 0;
  const shippingCharge = subtotal >= 999 ? 0 : 99;
  const codCharge = paymentMethods[i % paymentMethods.length] === "cod" ? 49 : 0;
  const total = subtotal - discount + shippingCharge + codCharge;
  const addr = customer.addresses[0];
  return {
    id: `order-${String(i + 1).padStart(3, "0")}`,
    orderNumber: `UK-2026${String(1000 + i)}`,
    customerId: customer.id,
    shippingName: addr.name,
    shippingPhone: addr.phone,
    shippingLine1: addr.line1,
    shippingCity: addr.city,
    shippingState: addr.state,
    shippingPincode: addr.pincode,
    items,
    subtotal,
    discountAmount: discount,
    shippingCharge,
    codCharge,
    total,
    paymentMethod: paymentMethods[i % paymentMethods.length],
    paymentStatus: status === "cancelled" ? "failed" : status === "returned" ? "refunded" : "paid",
    couponCode: discount > 0 ? "FESTIVE10" : undefined,
    status,
    courierName: ["Delhivery", "Shiprocket", "DTDC"][i % 3],
    trackingNumber: status === "shipped" || status === "delivered" || status === "out_for_delivery" ? `TRK${900000 + i}` : undefined,
    createdAt: daysAgoIso(daysAgo),
    updatedAt: daysAgoIso(Math.max(0, daysAgo - 1)),
    statusHistory: buildHistory(status, daysAgo),
  };
});
