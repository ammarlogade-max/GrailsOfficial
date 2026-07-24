import { useEffect, useState } from "react";
import { useSupportStore } from "../../store/supportStore";
import { useToastStore } from "../../store/toastStore";
import Modal from "../../components/ui/Modal";
import { formatDateTime, timeAgo } from "../../lib/format";
import type { SupportTicket, ReturnRequest } from "../../data/types";

const ticketStatuses: SupportTicket["status"][] = ["open", "assigned", "in_progress", "waiting_customer", "resolved", "closed"];
const returnStatuses: ReturnRequest["status"][] = ["requested", "under_review", "approved", "rejected", "pickup_scheduled", "picked_up", "received", "refund_initiated", "refunded", "closed"];

const priorityColor: Record<string, string> = { low: "bg-neutral-100 text-neutral-600", normal: "bg-blue-100 text-blue-700", high: "bg-amber-100 text-amber-700", urgent: "bg-rose-100 text-rose-600" };

export default function SupportAdmin() {
  const { tickets, returns, fetchAll, updateTicketStatus, replyTicket, updateReturnStatus } = useSupportStore();
  const showToast = useToastStore((s) => s.show);
  const [view, setView] = useState<"tickets" | "returns">("tickets");
  const [activeTicket, setActiveTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const ticket = tickets.find((t) => t.id === activeTicket);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleTicketStatus(id: string, status: SupportTicket["status"]) {
    try {
      await updateTicketStatus(id, status);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update ticket", "error");
    }
  }

  async function handleReturnStatus(id: string, status: ReturnRequest["status"]) {
    try {
      await updateReturnStatus(id, status);
      showToast("Return status updated", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update return", "error");
    }
  }

  async function handleReply() {
    if (!ticket || !replyText) return;
    try {
      await replyTicket(ticket.id, replyText);
      setReplyText("");
      showToast("Reply sent", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to send reply", "error");
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-5">
        <button onClick={() => setView("tickets")} className={`px-4 py-2 rounded-lg text-sm font-medium ${view === "tickets" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}>Support Tickets ({tickets.length})</button>
        <button onClick={() => setView("returns")} className={`px-4 py-2 rounded-lg text-sm font-medium ${view === "returns" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}>Returns & Exchanges ({returns.length})</button>
      </div>

      {view === "tickets" && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-neutral-50 text-neutral-500 text-xs">
              <tr><th className="text-left px-4 py-3 font-medium">Ticket</th><th className="text-left px-4 py-3 font-medium">Customer</th><th className="text-left px-4 py-3 font-medium">Subject</th><th className="text-left px-4 py-3 font-medium">Priority</th><th className="text-left px-4 py-3 font-medium">Status</th><th className="text-left px-4 py-3 font-medium">Updated</th></tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} onClick={() => setActiveTicket(t.id)} className="border-t border-neutral-100 hover:bg-neutral-50/60 cursor-pointer">
                  <td className="px-4 py-3 font-mono text-xs">{t.ticketNumber}</td>
                  <td className="px-4 py-3">{t.customerName}</td>
                  <td className="px-4 py-3 line-clamp-1 max-w-[220px]">{t.subject}</td>
                  <td className="px-4 py-3"><span className={`badge ${priorityColor[t.priority]}`}>{t.priority}</span></td>
                  <td className="px-4 py-3 capitalize text-xs text-neutral-600">{t.status.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-xs text-neutral-400">{timeAgo(t.messages[t.messages.length - 1]?.at || t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "returns" && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-neutral-50 text-neutral-500 text-xs">
              <tr><th className="text-left px-4 py-3 font-medium">Request</th><th className="text-left px-4 py-3 font-medium">Order</th><th className="text-left px-4 py-3 font-medium">Customer</th><th className="text-left px-4 py-3 font-medium">Type</th><th className="text-left px-4 py-3 font-medium">Reason</th><th className="text-left px-4 py-3 font-medium">Status</th></tr>
            </thead>
            <tbody>
              {returns.map((r) => (
                <tr key={r.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-mono text-xs">{r.requestNumber}</td>
                  <td className="px-4 py-3">{r.orderNumber}</td>
                  <td className="px-4 py-3">{r.customerName}</td>
                  <td className="px-4 py-3 capitalize">{r.type}</td>
                  <td className="px-4 py-3 text-neutral-500 capitalize">{r.reason.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    <select value={r.status} onChange={(e) => handleReturnStatus(r.id, e.target.value as ReturnRequest["status"])} className="select !w-auto !py-1 text-xs">
                      {returnStatuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!ticket} onClose={() => setActiveTicket(null)} title={ticket?.ticketNumber || ""} size="lg">
        {ticket && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="font-medium text-sm">{ticket.subject}</p>
                <p className="text-xs text-neutral-400">{ticket.customerName} · {ticket.customerEmail}</p>
              </div>
              <select value={ticket.status} onChange={(e) => handleTicketStatus(ticket.id, e.target.value as SupportTicket["status"])} className="select !w-auto text-sm">
                {ticketStatuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {ticket.messages.map((m, i) => (
                <div key={i} className={`max-w-[80%] p-3 rounded-lg text-sm ${m.sender === "staff" ? "bg-[var(--color-primary)]/10 ml-auto" : "bg-neutral-100"}`}>
                  <p>{m.body}</p>
                  <p className="text-[10px] text-neutral-400 mt-1">{formatDateTime(m.at)}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={replyText} onChange={(e) => setReplyText(e.target.value)} className="input" placeholder="Type a reply..." />
              <button onClick={handleReply} className="btn btn-primary">
                Send
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
