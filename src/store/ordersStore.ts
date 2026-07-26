import { create } from "zustand";
import type { Order, OrderStatus } from "../data/types";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";
import { sanitizeText } from "../lib/sanitize";

interface OrdersState {
  orders: Order[];
  loading: boolean;
  loaded: boolean;
  /** Admin: load every order. Customer: pass a customerId to load just their own. */
  fetchOrders: (customerId?: string) => Promise<void>;
  fetchOrderById: (id: string) => Promise<Order | null>;
  addOrder: (order: Order) => void;
  updateStatus: (id: string, status: OrderStatus) => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: OrderStatus) => Promise<void>;
  updateOrder: (id: string, patch: Partial<Order>) => Promise<void>;
}

const ORDER_SELECT = "*, order_items(*), order_status_history(*)";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbOrder(row: any): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    guestEmail: row.guest_email ?? undefined,
    guestPhone: row.guest_phone ?? undefined,
    shippingName: row.shipping_name,
    shippingPhone: row.shipping_phone,
    shippingLine1: row.shipping_line1,
    shippingLine2: row.shipping_line2 ?? undefined,
    shippingCity: row.shipping_city,
    shippingState: row.shipping_state,
    shippingPincode: row.shipping_pincode,
    items: (row.order_items || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((it: any) => ({
        productId: it.product_id,
        productName: it.product_name,
        brand: it.brand,
        sku: it.sku,
        size: Number(it.size),
        color: it.color,
        unitPrice: Number(it.unit_price),
        originalPrice: Number(it.original_price),
        quantity: it.quantity,
        photo: it.photo_url || "",
      })),
    subtotal: Number(row.subtotal),
    discountAmount: Number(row.discount_amount),
    shippingCharge: Number(row.shipping_charge),
    codCharge: Number(row.cod_charge),
    total: Number(row.total),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    couponCode: row.coupon_code ?? undefined,
    status: row.status,
    courierName: row.courier_name ?? undefined,
    trackingNumber: row.tracking_number ?? undefined,
    customerNote: row.customer_note ?? undefined,
    adminNote: row.admin_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    statusHistory: (row.order_status_history || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((h: any) => ({ status: h.status, at: h.at }))
      .sort((a: { at: string }, b: { at: string }) => +new Date(a.at) - +new Date(b.at)),
  };
}

export const useOrdersStore = create<OrdersState>()(
  (set) => ({
    orders: [],
    loading: false,
    loaded: false,

    fetchOrders: async (customerId) => {
      set({ loading: true });
      let query = supabase.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false });
      if (customerId) query = query.eq("customer_id", customerId);
      const { data, error } = await query;
      if (error) {
        console.error("fetchOrders failed:", error.message);
        set({ loading: false, loaded: true });
        return;
      }
      set({ orders: (data || []).map(mapDbOrder), loading: false, loaded: true });
    },

    fetchOrderById: async (id) => {
      const { data, error } = await supabase.from("orders").select(ORDER_SELECT).eq("id", id).single();
      if (error || !data) return null;
      const order = mapDbOrder(data);
      set((s) => ({ orders: s.orders.some((o) => o.id === id) ? s.orders.map((o) => (o.id === id ? order : o)) : [order, ...s.orders] }));
      return order;
    },

    addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),

    updateStatus: async (id, status) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
      await supabase.from("order_status_history").insert({ order_id: id, status });
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === id
            ? { ...o, status, updatedAt: new Date().toISOString(), statusHistory: [...o.statusHistory, { status, at: new Date().toISOString() }] }
            : o
        ),
      }));
    },

    bulkUpdateStatus: async (ids, status) => {
      const at = new Date().toISOString();
      const results = await Promise.allSettled(
        ids.map(async (id) => {
          const { error } = await supabase.from("orders").update({ status }).eq("id", id);
          if (error) throw error;
          await supabase.from("order_status_history").insert({ order_id: id, status });
        })
      );
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) throw new Error(`${failed.length} of ${ids.length} orders failed to update`);
      set((s) => ({
        orders: s.orders.map((o) =>
          ids.includes(o.id) ? { ...o, status, updatedAt: at, statusHistory: [...o.statusHistory, { status, at }] } : o
        ),
      }));
    },

    updateOrder: async (id, rawPatch) => {
      const patch = {
        ...rawPatch,
        adminNote: rawPatch.adminNote !== undefined ? sanitizeText(rawPatch.adminNote) : undefined,
        courierName: rawPatch.courierName !== undefined ? sanitizeText(rawPatch.courierName) : undefined,
        trackingNumber: rawPatch.trackingNumber !== undefined ? sanitizeText(rawPatch.trackingNumber) : undefined,
      };
      const dbPatch: Database["public"]["Tables"]["orders"]["Update"] = {};
      if (patch.adminNote !== undefined) dbPatch.admin_note = patch.adminNote;
      if (patch.courierName !== undefined) dbPatch.courier_name = patch.courierName;
      if (patch.trackingNumber !== undefined) dbPatch.tracking_number = patch.trackingNumber;
      if (Object.keys(dbPatch).length > 0) {
        const { error } = await supabase.from("orders").update(dbPatch).eq("id", id);
        if (error) throw error;
      }
      set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));
    },
  })
);