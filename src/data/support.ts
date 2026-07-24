import type { SupportTicket, ReturnRequest } from "./types";
import { orders } from "./orders";
import { customers } from "./customers";

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const subjects = [
  { subject: "Order not delivered yet", category: "delivery" },
  { subject: "Wrong size received", category: "return_refund" },
  { subject: "Product quality query before buying", category: "product_query" },
  { subject: "Refund not credited", category: "payment" },
  { subject: "Need to change delivery address", category: "order_issue" },
  { subject: "Website checkout error", category: "technical" },
  { subject: "Loved the product — feedback", category: "feedback" },
  { subject: "Exchange request for defective item", category: "return_refund" },
];

const staffNames = ["Rhea D'Souza", "Amit Kulkarni", "Sanya Kapoor"];

export const supportTickets: SupportTicket[] = Array.from({ length: 22 }).map((_, i) => {
  const customer = customers[(i * 2) % customers.length];
  const s = subjects[i % subjects.length];
  const priority: SupportTicket["priority"] = ["low", "normal", "normal", "high", "urgent"][i % 5] as SupportTicket["priority"];
  const status: SupportTicket["status"] = ["open", "assigned", "in_progress", "waiting_customer", "resolved", "closed"][i % 6] as SupportTicket["status"];
  const order = orders[(i * 5) % orders.length];
  return {
    id: `tkt-${String(i + 1).padStart(3, "0")}`,
    ticketNumber: `TK-2026${String(1000 + i)}`,
    customerName: customer.fullName,
    customerEmail: customer.email,
    orderId: i % 3 !== 0 ? order.id : undefined,
    subject: s.subject,
    category: s.category,
    priority,
    status,
    assignedTo: status !== "open" ? staffNames[i % staffNames.length] : undefined,
    messages: [
      { sender: "customer", body: s.subject + ". Please help resolve this at the earliest.", at: daysAgoIso(5 - (i % 5)) },
      ...(status !== "open" ? [{ sender: "staff" as const, body: "Thanks for reaching out — we're looking into this and will update you shortly.", at: daysAgoIso(4 - (i % 4)) }] : []),
    ],
    createdAt: daysAgoIso(5 - (i % 5) + i * 0.3),
  };
});

const reasons = ["wrong_size", "defective", "not_as_described", "other"];

export const returnRequests: ReturnRequest[] = Array.from({ length: 14 }).map((_, i) => {
  const order = orders[(i * 3 + 2) % orders.length];
  const customer = customers.find((c) => c.id === order.customerId) ?? customers[0];
  const status: ReturnRequest["status"] = [
    "requested", "under_review", "approved", "pickup_scheduled", "received", "refund_initiated", "refunded", "closed", "rejected",
  ][i % 9] as ReturnRequest["status"];
  return {
    id: `ret-${String(i + 1).padStart(3, "0")}`,
    requestNumber: `RT-2026${String(1000 + i)}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: customer.fullName,
    type: i % 4 === 0 ? "exchange" : "return",
    reason: reasons[i % reasons.length],
    reasonDetail: "Item doesn't match expectations, requesting resolution as per 7-day policy.",
    items: order.items.slice(0, 1).map((it) => ({ productName: it.productName, quantity: 1 })),
    status,
    refundAmount: status === "refunded" || status === "refund_initiated" ? order.total : undefined,
    createdAt: daysAgoIso(1 + i * 1.5),
  };
});
