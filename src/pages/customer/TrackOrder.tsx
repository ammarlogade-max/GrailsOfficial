import { useState } from "react";
import { Search, PackageSearch } from "lucide-react";
import { useOrdersStore } from "../../store/ordersStore";
import { STATUS_LABELS, formatDate } from "../../lib/format";
import type { Order } from "../../data/types";
import { useSEO } from "../../lib/useSEO";

export default function TrackOrder() {
  useSEO({ title: "Track Your Order", index: true });

  const orders = useOrdersStore((s) => s.orders);
  const [orderNumber, setOrderNumber] = useState("");
  const [result, setResult] = useState<Order | null | "not_found">(null);

  function search(e: React.FormEvent) {
    e.preventDefault();
    const found = orders.find((o) => o.orderNumber.toLowerCase() === orderNumber.trim().toLowerCase());
    setResult(found || "not_found");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <PackageSearch size={40} className="mx-auto text-[var(--color-primary)]" />
      <h1 className="text-display text-3xl text-center mt-3">Track Your Order</h1>
      <p className="text-neutral-500 text-sm text-center mt-1">Enter your order number to see live status</p>
      <form onSubmit={search} className="flex gap-2 mt-6">
        <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="e.g. UK-20261005" className="input" />
        <button className="btn btn-primary"><Search size={16} /></button>
      </form>
      {result === "not_found" && <p className="text-sm text-rose-500 mt-4 text-center">No order found with that number. Try e.g. UK-20261000</p>}
      {result && result !== "not_found" && (
        <div className="card p-5 mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">{result.orderNumber}</span>
            <span className="badge bg-neutral-900 text-white">{STATUS_LABELS[result.status]}</span>
          </div>
          <p className="text-xs text-neutral-500">Placed on {formatDate(result.createdAt)}</p>
          {result.trackingNumber && <p className="text-xs text-neutral-500 mt-1">Tracking: {result.trackingNumber} via {result.courierName}</p>}
        </div>
      )}
    </div>
  );
}
