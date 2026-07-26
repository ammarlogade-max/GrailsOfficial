import { create } from "zustand";
import type { SupportTicket, ReturnRequest } from "../data/types";
import { supabase } from "../lib/supabase";
import { sanitizeText } from "../lib/sanitize";

interface SupportState {
  tickets: SupportTicket[];
  returns: ReturnRequest[];
  loading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  updateTicketStatus: (id: string, status: SupportTicket["status"]) => Promise<void>;
  replyTicket: (id: string, body: string) => Promise<void>;
  updateReturnStatus: (id: string, status: ReturnRequest["status"]) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTicket(row: any): SupportTicket {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    orderId: row.order_id ?? undefined,
    subject: row.subject,
    category: row.category || "general",
    priority: row.priority,
    status: row.status,
    assignedTo: row.assigned_to ?? undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messages: (row.support_messages || []).map((m: any) => ({ sender: m.sender, body: m.body, at: m.at })).sort((a: { at: string }, b: { at: string }) => +new Date(a.at) - +new Date(b.at)),
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReturn(row: any): ReturnRequest {
  return {
    id: row.id,
    requestNumber: row.request_number,
    orderId: row.order_id,
    orderNumber: row.orders?.order_number || "",
    customerName: row.profiles?.full_name || "Guest",
    type: row.type,
    reason: row.reason,
    reasonDetail: row.reason_detail ?? undefined,
    items: row.items || [],
    status: row.status,
    refundAmount: row.refund_amount != null ? Number(row.refund_amount) : undefined,
    createdAt: row.created_at,
  };
}

export const useSupportStore = create<SupportState>()(
  (set) => ({
    tickets: [],
    returns: [],
    loading: false,
    loaded: false,

    fetchAll: async () => {
      set({ loading: true });
      const [{ data: tickets, error: tErr }, { data: returns, error: rErr }] = await Promise.all([
        supabase.from("support_tickets").select("*, support_messages(*)").order("created_at", { ascending: false }),
        supabase.from("return_requests").select("*, orders(order_number), profiles(full_name)").order("created_at", { ascending: false }),
      ]);
      if (tErr) console.error("fetch support_tickets failed:", tErr.message);
      if (rErr) console.error("fetch return_requests failed:", rErr.message);
      set({ tickets: (tickets || []).map(mapTicket), returns: (returns || []).map(mapReturn), loading: false, loaded: true });
    },

    updateTicketStatus: async (id, status) => {
      const { error } = await supabase.from("support_tickets").update({ status }).eq("id", id);
      if (error) throw error;
      set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, status } : t)) }));
    },

    replyTicket: async (id, rawBody) => {
      const body = sanitizeText(rawBody);
      const at = new Date().toISOString();
      const { error: msgErr } = await supabase.from("support_messages").insert({ ticket_id: id, sender: "staff", body });
      if (msgErr) throw msgErr;
      const { error: statusErr } = await supabase.from("support_tickets").update({ status: "waiting_customer" }).eq("id", id);
      if (statusErr) throw statusErr;
      set((s) => ({
        tickets: s.tickets.map((t) =>
          t.id === id ? { ...t, status: "waiting_customer", messages: [...t.messages, { sender: "staff" as const, body, at }] } : t
        ),
      }));
    },

    updateReturnStatus: async (id, status) => {
      const { error } = await supabase.from("return_requests").update({ status }).eq("id", id);
      if (error) throw error;
      set((s) => ({ returns: s.returns.map((r) => (r.id === id ? { ...r, status } : r)) }));
    },
  })
);