import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FileText } from "lucide-react";
import { useOrdersStore } from "../../store/ordersStore";
import { useCMSStore } from "../../store/cmsStore";
import { formatDateTime, formatINR, STATUS_LABELS, STATUS_COLORS } from "../../lib/format";
import { useToastStore } from "../../store/toastStore";
import ProductImage from "../../components/customer/ProductImage";
import { downloadInvoice } from "../../lib/invoice";
import type { Order, OrderStatus } from "../../data/types";

const statusOptions: OrderStatus[] = ["pending", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "return_requested", "returned", "refunded"];

export default function OrderDetailAdmin() {
  const { id } = useParams();
  const { orders, updateStatus, updateOrder, fetchOrderById } = useOrdersStore();
  const settings = useCMSStore((s) => s.settings);
  const showToast = useToastStore((s) => s.show);
  const storeOrder = orders.find((o) => o.id === id);
  const [order, setOrder] = useState<Order | null | undefined>(storeOrder);
  const [note, setNote] = useState(storeOrder?.adminNote || "");
  const [courier, setCourier] = useState(storeOrder?.courierName || "");
  const [tracking, setTracking] = useState(storeOrder?.trackingNumber || "");

  useEffect(() => {
    if (storeOrder) {
      setOrder(storeOrder);
      setNote(storeOrder.adminNote || "");
      setCourier(storeOrder.courierName || "");
      setTracking(storeOrder.trackingNumber || "");
      return;
    }
    if (!id) return;
    fetchOrderById(id).then((o) => {
      setOrder(o);
      if (o) {
        setNote(o.adminNote || "");
        setCourier(o.courierName || "");
        setTracking(o.trackingNumber || "");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, storeOrder?.id]);

  if (order === undefined) return <p className="text-neutral-400">Loading order...</p>;
  if (!order) return <p className="text-neutral-500">Order not found.</p>;

  async function handleStatusChange(status: OrderStatus) {
    try {
      await updateStatus(order!.id, status);
      showToast("Order status updated", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update status", "error");
    }
  }

  async function saveNote() {
    try {
      await updateOrder(order!.id, { adminNote: note });
      showToast("Note saved", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save note", "error");
    }
  }

  async function saveShippingInfo() {
    try {
      await updateOrder(order!.id, { courierName: courier, trackingNumber: tracking });
      showToast("Shipping info saved", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save shipping info", "error");
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-lg">{order.orderNumber}</h2>
          <p className="text-xs text-neutral-500">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => downloadInvoice(order, settings)} className="btn btn-outline btn-sm">
            <FileText size={14} /> Download Invoice
          </button>
          <Link to="/admin/orders" className="text-sm text-[var(--color-primary)]">← Back to Orders</Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-3">Items</h3>
            {order.items.map((it, i) => (
              <div key={i} className="flex gap-3 py-2 border-b border-neutral-50 last:border-0">
                <div className="w-14 h-14 bg-neutral-50 rounded-lg overflow-hidden shrink-0"><ProductImage src={it.photo} alt={it.productName} /></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{it.productName}</p>
                  <p className="text-xs text-neutral-500">SKU {it.sku} · Size {it.size} · {it.color} · Qty {it.quantity}</p>
                </div>
                <span className="text-sm font-semibold">{formatINR(it.unitPrice * it.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-neutral-200 mt-3 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span>{formatINR(order.shippingCharge)}</span></div>
              <div className="flex justify-between font-semibold"><span>Total</span><span>{formatINR(order.total)}</span></div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-3">Status History</h3>
            <div className="space-y-3">
              {order.statusHistory.map((h, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[h.status] }} />
                  <span className="font-medium">{STATUS_LABELS[h.status]}</span>
                  <span className="text-neutral-400 text-xs ml-auto">{formatDateTime(h.at)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-2">Internal Note</h3>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="textarea" rows={3} placeholder="Add a note for your team..." />
            <button onClick={saveNote} className="btn btn-outline btn-sm mt-2">Save Note</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-3">Update Status</h3>
            <select value={order.status} onChange={(e) => handleStatusChange(e.target.value as OrderStatus)} className="select">
              {statusOptions.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
            <div className="mt-4 space-y-2">
              <div>
                <label className="field-label">Courier</label>
                <input value={courier} onChange={(e) => setCourier(e.target.value)} className="input !py-1.5 text-sm" placeholder="e.g. Delhivery" />
              </div>
              <div>
                <label className="field-label">Tracking Number</label>
                <input value={tracking} onChange={(e) => setTracking(e.target.value)} className="input !py-1.5 text-sm" placeholder="e.g. TRK123456" />
              </div>
              <button onClick={saveShippingInfo} className="btn btn-outline btn-sm w-full">Save Shipping Info</button>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-2">Customer & Shipping</h3>
            <p className="text-sm">{order.shippingName}</p>
            <p className="text-xs text-neutral-500">{order.shippingPhone}</p>
            <p className="text-xs text-neutral-500 mt-2">{order.shippingLine1}, {order.shippingCity}, {order.shippingState} - {order.shippingPincode}</p>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-2">Payment</h3>
            <p className="text-sm capitalize">{order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod}</p>
            <span className={`badge mt-1 inline-block ${order.paymentStatus === "paid" ? "bg-green-100 text-green-700" : order.paymentStatus === "failed" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700"}`}>
              {order.paymentStatus}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
