import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Package, MessageCircle } from "lucide-react";
import { useCMSStore } from "../../store/cmsStore";
import { formatINR, formatDate } from "../../lib/format";
import { supabase } from "../../lib/supabase";
import { useSEO } from "../../lib/useSEO";

interface SimpleOrder {
  id: string;
  orderNumber: string;
  shippingName: string;
  createdAt: string;
  paymentMethod: string;
  shippingLine1: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  total: number;
}

export default function OrderSuccess() {
  useSEO({ title: "Order Confirmed", index: false });

  const { orderId } = useParams();
  const settings = useCMSStore((s) => s.settings);
  const [realOrder, setRealOrder] = useState<SimpleOrder | null | undefined>(undefined);

  useEffect(() => {
    if (!orderId) return;
    supabase
      .from("orders")
      .select("id, order_number, shipping_name, created_at, payment_method, shipping_line1, shipping_city, shipping_state, shipping_pincode, total")
      .eq("id", orderId)
      .single()
      .then(({ data }) => {
        setRealOrder(
          data
            ? {
                id: data.id,
                orderNumber: data.order_number,
                shippingName: data.shipping_name,
                createdAt: data.created_at,
                paymentMethod: data.payment_method,
                shippingLine1: data.shipping_line1,
                shippingCity: data.shipping_city,
                shippingState: data.shipping_state,
                shippingPincode: data.shipping_pincode,
                total: data.total,
              }
            : null
        );
      });
  }, [orderId]);

  if (realOrder === undefined) {
    return <div className="max-w-lg mx-auto px-4 py-24 text-center text-neutral-400">Loading your order...</div>;
  }

  if (!realOrder) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-neutral-500">Order not found.</p>
        <Link to="/" className="btn btn-primary mt-4 inline-flex">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <CheckCircle2 size={56} className="mx-auto text-green-500" />
      <h1 className="text-display text-3xl sm:text-4xl mt-4">Order Confirmed!</h1>
      <p className="text-neutral-500 mt-2">
        Thank you {realOrder.shippingName.split(" ")[0]}! Your order <span className="font-semibold text-neutral-800">{realOrder.orderNumber}</span> has been placed.
      </p>

      <div className="card p-5 text-left mt-8">
        <div className="flex justify-between text-sm mb-3">
          <span className="text-neutral-500">Order Date</span>
          <span>{formatDate(realOrder.createdAt)}</span>
        </div>
        <div className="flex justify-between text-sm mb-3">
          <span className="text-neutral-500">Payment Method</span>
          <span className="capitalize">{realOrder.paymentMethod === "cod" ? "Cash on Delivery" : realOrder.paymentMethod}</span>
        </div>
        <div className="flex justify-between text-sm mb-3">
          <span className="text-neutral-500">Delivery Address</span>
          <span className="text-right max-w-[60%]">{realOrder.shippingLine1}, {realOrder.shippingCity}, {realOrder.shippingState} {realOrder.shippingPincode}</span>
        </div>
        <div className="border-t border-neutral-200 pt-3 flex justify-between font-semibold">
          <span>Total Paid</span><span>{formatINR(realOrder.total)}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
        <Link to={`/account/orders/${realOrder.id}`} className="btn btn-dark">
          <Package size={16} /> Track Order & Download Invoice
        </Link>
        <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="btn btn-outline">
          <MessageCircle size={16} /> Message Us on WhatsApp
        </a>
        <Link to="/products" className="btn btn-primary">Continue Shopping</Link>
      </div>
    </div>
  );
}