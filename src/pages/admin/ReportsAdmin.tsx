import { useEffect } from "react";
import { Download } from "lucide-react";
import { useOrdersStore } from "../../store/ordersStore";
import { useCatalogStore } from "../../store/catalogStore";
import { useToastStore } from "../../store/toastStore";
import { formatINR, formatDate } from "../../lib/format";

const reportTypes = [
  { id: "sales", name: "Sales Report", desc: "Revenue, orders, and refunds by date range" },
  { id: "inventory", name: "Inventory Report", desc: "Stock levels and low-stock items" },
  { id: "customer", name: "Customer Report", desc: "New vs returning customers, LTV" },
  { id: "product", name: "Product Performance", desc: "Best/worst sellers, conversion by product" },
  { id: "coupon", name: "Coupon Usage Report", desc: "Redemption rates and discount impact" },
  { id: "tax", name: "Tax Summary", desc: "GST collected by state" },
];

export default function ReportsAdmin() {
  const orders = useOrdersStore((s) => s.orders);
  const fetchOrders = useOrdersStore((s) => s.fetchOrders);
  const products = useCatalogStore((s) => s.products);
  const showToast = useToastStore((s) => s.show);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((r) => (
          <div key={r.id} className="card p-4">
            <p className="font-medium text-sm">{r.name}</p>
            <p className="text-xs text-neutral-500 mt-1">{r.desc}</p>
            <button onClick={() => showToast(`${r.name} exported (CSV)`, "success")} className="btn btn-outline btn-sm mt-3 w-full">
              <Download size={13} /> Export CSV
            </button>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-4">Recent Sales — Detailed Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="text-neutral-400 text-xs border-b border-neutral-100">
              <tr><th className="text-left pb-2">Order</th><th className="text-left pb-2">Date</th><th className="text-left pb-2">Items</th><th className="text-right pb-2">Total</th></tr>
            </thead>
            <tbody>
              {orders.slice(0, 10).map((o) => (
                <tr key={o.id} className="border-b border-neutral-50">
                  <td className="py-2 font-medium">{o.orderNumber}</td>
                  <td className="py-2 text-neutral-500">{formatDate(o.createdAt)}</td>
                  <td className="py-2 text-neutral-500">{o.items.length}</td>
                  <td className="py-2 text-right font-medium">{formatINR(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-4">Inventory Snapshot</h3>
        <p className="text-sm text-neutral-500">{products.length} products tracked · {products.filter((p) => p.stock <= p.lowStockThreshold).length} below threshold · {products.filter((p) => p.stock === 0).length} out of stock</p>
      </div>
    </div>
  );
}
