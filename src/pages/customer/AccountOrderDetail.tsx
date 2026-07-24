import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Circle, FileText } from "lucide-react";
import { useOrdersStore } from "../../store/ordersStore";
import { useCMSStore } from "../../store/cmsStore";
import { formatINR, formatDateTime, STATUS_LABELS } from "../../lib/format";
import ProductImage from "../../components/customer/ProductImage";
import { downloadInvoice } from "../../lib/invoice";
import type { Order, OrderStatus } from "../../data/types";

const flow: OrderStatus[] = ["confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered"];

export default function AccountOrderDetail() {
  const { orderId } = useParams();
  const storeOrder = useOrdersStore((s) => s.orders.find((o) => o.id === orderId));
  const fetchOrderById = useOrdersStore((s) => s.fetchOrderById);
  const settings = useCMSStore((s) => s.settings);
  const [order, setOrder] = useState<Order | null | undefined>(storeOrder);

  useEffect(() => {
    if (storeOrder) { setOrder(storeOrder); return; }
    if (!orderId) return;
    fetchOrderById(orderId).then(setOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, storeOrder?.id]);

  if (order === undefined) return <p className="text-neutral-400">Loading order...</p>;
  if (!order) return <p className="text-neutral-500">Order not found.</p>;

  const currentIdx = flow.indexOf(order.status);
  const isCancelledLike = ["cancelled", "return_requested", "returned", "refunded"].includes(order.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-semibold text-lg">{order.orderNumber}</h2>
          <p className="text-xs text-neutral-500">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <Link to="/account/orders" className="text-sm text-[var(--color-primary)]">Back to Orders</Link>
      </div>

      {!isCancelledLike ? (
        <div className="card p-5">
          <div className="flex items-center justify-between">
            {flow.map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center relative">
                {i > 0 && <div className={`absolute h-0.5 top-3 -left-1/2 w-full ${i <= currentIdx ? "bg-[var(--color-primary)]" : "bg-neutral-200"}`} />}
                {i <= currentIdx ? (
                  <CheckCircle2 size={22} className="text-[var(--color-primary)] bg-white relative z-10" />
                ) : (
                  <Circle size={22} className="text-neutral-300 bg-white relative z-10" />
                )}
                <span className="text-[10px] sm:text-xs mt-1.5 text-center capitalize">{STATUS_LABELS[s]}</span>
              </div>
            ))}
          </div>
          {order.trackingNumber && (
            <p className="text-xs text-neutral-500 text-center mt-4">
              Tracking ID: <span className="font-mono">{order.trackingNumber}</span> via {order.courierName}
            </p>
          )}
        </div>
      ) : (
        <div className="card p-5 text-center">
          <span className="badge bg-rose-100 text-rose-600">{STATUS_LABELS[order.status]}</span>
        </div>
      )}

      <div className="card p-5">
        <h3 className="font-semibold mb-3 text-sm">Items</h3>
        <div className="space-y-3">
          {order.items.map((it, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-14 h-14 bg-neutral-50 rounded-lg overflow-hidden shrink-0">
                <ProductImage src={it.photo} alt={it.productName} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{it.productName}</p>
                <p className="text-xs text-neutral-500">Size {it.size} · {it.color} · Qty {it.quantity}</p>
              </div>
              <span className="text-sm font-semibold">{formatINR(it.unitPrice * it.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-neutral-200 mt-4 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
          {order.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatINR(order.discountAmount)}</span></div>}
          <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span>{order.shippingCharge === 0 ? "FREE" : formatINR(order.shippingCharge)}</span></div>
          <div className="flex justify-between font-semibold pt-1"><span>Total</span><span>{formatINR(order.total)}</span></div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-2 text-sm">Delivery Address</h3>
        <p className="text-sm text-neutral-600">
          {order.shippingName}, {order.shippingLine1}{order.shippingLine2 ? `, ${order.shippingLine2}` : ""}, {order.shippingCity}, {order.shippingState} - {order.shippingPincode}
        </p>
        <p className="text-sm text-neutral-500 mt-1">Phone: {order.shippingPhone}</p>
      </div>

      {order.status === "delivered" && (
        <button className="btn btn-outline">Request Return / Exchange</button>
      )}
      <button onClick={() => downloadInvoice(order, settings)} className="btn btn-outline">
        <FileText size={15} /> Download Invoice
      </button>
    </div>
  );
}
