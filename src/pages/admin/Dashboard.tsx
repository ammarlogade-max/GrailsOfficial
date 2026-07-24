import { useEffect } from "react";
import { Link } from "react-router-dom";
import { IndianRupee, ShoppingCart, Users, Package, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useOrdersStore } from "../../store/ordersStore";
import { useCatalogStore } from "../../store/catalogStore";
import { customers } from "../../data/customers";
import StatCard from "../../components/admin/StatCard";
import { formatINR, formatDate, STATUS_LABELS, STATUS_COLORS } from "../../lib/format";

export default function Dashboard() {
  const orders = useOrdersStore((s) => s.orders);
  const fetchOrders = useOrdersStore((s) => s.fetchOrders);
  const products = useCatalogStore((s) => s.products);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const revenue = orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter((o) => ["pending", "confirmed", "processing"].includes(o.status)).length;
  const lowStock = products.filter((p) => p.stock <= p.lowStockThreshold);

  const last14 = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === d.toDateString());
    return { day: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), revenue: dayOrders.reduce((s, o) => s + o.total, 0) };
  });

  const topProducts = [...products].sort((a, b) => b.totalSold - a.totalSold).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={formatINR(revenue)} icon={IndianRupee} change="12.4% vs last month" />
        <StatCard label="Total Orders" value={String(orders.length)} icon={ShoppingCart} change="8.1% vs last month" />
        <StatCard label="Customers" value={String(customers.length)} icon={Users} change="5.3% vs last month" />
        <StatCard label="Pending Orders" value={String(pendingOrders)} icon={Package} changeType="down" change="Needs attention" accent="#eab308" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Revenue — Last 14 Days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={last14}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="day" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v: any) => [formatINR(Number(v)), "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-amber-500" />
            <h3 className="font-semibold">Low Stock Alerts</h3>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {lowStock.slice(0, 6).map((p) => (
              <div key={p.id} className="flex justify-between items-center text-sm">
                <span className="line-clamp-1">{p.name}</span>
                <span className="badge bg-amber-100 text-amber-700 shrink-0 ml-2">{p.stock} left</span>
              </div>
            ))}
            {lowStock.length === 0 && <p className="text-sm text-neutral-400">All products well stocked.</p>}
          </div>
          <Link to="/admin/inventory" className="text-xs text-[var(--color-primary)] font-medium mt-3 inline-block">Manage Inventory →</Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-[var(--color-primary)] font-medium">View All →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-400 text-xs border-b border-neutral-100">
                  <th className="pb-2 font-medium">Order</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id} className="border-b border-neutral-50">
                    <td className="py-2.5"><Link to={`/admin/orders/${o.id}`} className="font-medium hover:text-[var(--color-primary)]">{o.orderNumber}</Link></td>
                    <td className="py-2.5 text-neutral-600">{o.shippingName}</td>
                    <td className="py-2.5"><span className="badge text-white" style={{ background: STATUS_COLORS[o.status] }}>{STATUS_LABELS[o.status]}</span></td>
                    <td className="py-2.5 text-right font-medium">{formatINR(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-4">Top Products</h3>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="font-display text-lg text-neutral-300 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                  <p className="text-xs text-neutral-500">{p.totalSold} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5 text-center py-4 text-xs text-neutral-400">
        Data last synced {formatDate(new Date().toISOString())} — demo data, resets available in Settings.
      </div>
    </div>
  );
}
