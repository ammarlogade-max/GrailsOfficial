import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Eye, Loader2, Download, CheckSquare, Square } from "lucide-react";
import { useOrdersStore } from "../../store/ordersStore";
import { useToastStore } from "../../store/toastStore";
import { formatDate, formatINR, STATUS_LABELS, STATUS_COLORS } from "../../lib/format";
import { exportToCSV } from "../../lib/csvExport";
import type { OrderStatus } from "../../data/types";

const statusOptions: OrderStatus[] = ["pending", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "return_requested", "returned", "refunded"];

export default function OrdersAdmin() {
  const { orders, loading, fetchOrders, updateStatus, bulkUpdateStatus } = useOrdersStore();
  const showToast = useToastStore((s) => s.show);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("confirmed");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = orders.filter((o) => {
    if (query && !o.orderNumber.toLowerCase().includes(query.toLowerCase()) && !o.shippingName.toLowerCase().includes(query.toLowerCase())) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    return true;
  });

  const allVisibleSelected = filtered.length > 0 && filtered.every((o) => selected.has(o.id));

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((s) => {
      const next = new Set(s);
      if (allVisibleSelected) filtered.forEach((o) => next.delete(o.id));
      else filtered.forEach((o) => next.add(o.id));
      return next;
    });
  }

  async function handleStatusChange(id: string, status: OrderStatus) {
    try {
      await updateStatus(id, status);
      showToast("Order status updated", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update status", "error");
    }
  }

  async function applyBulkStatus() {
    if (selected.size === 0) return;
    setApplying(true);
    try {
      await bulkUpdateStatus(Array.from(selected), bulkStatus);
      showToast(`Updated ${selected.size} order(s) to ${STATUS_LABELS[bulkStatus]}`, "success");
      setSelected(new Set());
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Bulk update failed", "error");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search order # or customer..." className="input pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select !w-auto text-sm">
          <option value="all">All Status</option>
          {statusOptions.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <button
          onClick={() =>
            exportToCSV(
              filtered.map((o) => ({
                order_number: o.orderNumber, customer: o.shippingName, date: o.createdAt,
                payment_method: o.paymentMethod, payment_status: o.paymentStatus, status: o.status,
                subtotal: o.subtotal, discount: o.discountAmount, shipping: o.shippingCharge, total: o.total,
              })),
              "urbankicks-orders"
            )
          }
          className="btn btn-outline btn-sm"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {selected.size > 0 && (
        <div className="card p-4 mb-4 flex flex-wrap items-center gap-3 bg-neutral-50 border-neutral-200">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <span className="text-sm text-neutral-500">Set status to</span>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as OrderStatus)} className="select !w-auto !py-1.5 text-sm">
            {statusOptions.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <button onClick={applyBulkStatus} disabled={applying} className="btn btn-primary btn-sm">
            {applying ? "Applying..." : "Apply to Selected"}
          </button>
          <button onClick={() => setSelected(new Set())} className="text-sm text-neutral-500 hover:text-neutral-800">Clear selection</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-neutral-400 mb-4">
          <Loader2 size={14} className="animate-spin" /> Loading orders...
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[950px]">
          <thead className="bg-neutral-50 text-neutral-500 text-xs">
            <tr>
              <th className="px-4 py-3 w-8">
                <button onClick={toggleAllVisible} className="text-neutral-400 hover:text-neutral-700 flex items-center">
                  {allVisibleSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium">Order</th>
              <th className="text-left px-4 py-3 font-medium">Customer</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Payment</th>
              <th className="text-left px-4 py-3 font-medium">Total</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className={`border-t border-neutral-100 hover:bg-neutral-50/60 ${selected.has(o.id) ? "bg-[var(--color-primary)]/5" : ""}`}>
                <td className="px-4 py-3">
                  <button onClick={() => toggleOne(o.id)} className="text-neutral-400 hover:text-neutral-700 flex items-center">
                    {selected.has(o.id) ? <CheckSquare size={16} className="text-[var(--color-primary)]" /> : <Square size={16} />}
                  </button>
                </td>
                <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                <td className="px-4 py-3 text-neutral-600">{o.shippingName}</td>
                <td className="px-4 py-3 text-neutral-500">{formatDate(o.createdAt)}</td>
                <td className="px-4 py-3 uppercase text-xs text-neutral-500">{o.paymentMethod}</td>
                <td className="px-4 py-3 font-medium">{formatINR(o.total)}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                    className="text-xs rounded-full px-2 py-1 border-0 font-medium text-white"
                    style={{ background: STATUS_COLORS[o.status] }}
                  >
                    {statusOptions.map((s) => <option key={s} value={s} style={{ color: "#000" }}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/orders/${o.id}`} className="p-1.5 text-neutral-500 hover:text-neutral-900 inline-block"><Eye size={14} /></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && <p className="text-center text-sm text-neutral-400 py-10">No orders match your filters.</p>}
      </div>
    </div>
  );
}
