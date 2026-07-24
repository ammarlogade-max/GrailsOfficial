import { useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { useOrdersStore } from "../../store/ordersStore";
import { useCatalogStore } from "../../store/catalogStore";
import StatCard from "../../components/admin/StatCard";
import { TrendingUp, Users, ShoppingBag, Percent } from "lucide-react";
import { formatINR } from "../../lib/format";

const COLORS = ["#f97316", "#0a0a0a", "#8a8a8a", "#e11d48", "#1c2b4a", "#16a34a"];

export default function AnalyticsAdmin() {
  const orders = useOrdersStore((s) => s.orders);
  const fetchOrders = useOrdersStore((s) => s.fetchOrders);
  const { products, categories } = useCatalogStore();

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const monthly = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const label = d.toLocaleDateString("en-IN", { month: "short" });
    const monthOrders = orders.filter((o) => new Date(o.createdAt).getMonth() === d.getMonth());
    return { month: label, revenue: monthOrders.reduce((s, o) => s + o.total, 0), orders: monthOrders.length };
  });

  const categoryData = categories.map((c) => ({
    name: c.name,
    value: products.filter((p) => p.categoryId === c.id).reduce((s, p) => s + p.totalSold, 0),
  })).filter((c) => c.value > 0);

  const brandData = Array.from(new Set(products.map((p) => p.brand))).map((brand) => ({
    brand,
    sold: products.filter((p) => p.brand === brand).reduce((s, p) => s + p.totalSold, 0),
  })).sort((a, b) => b.sold - a.sold).slice(0, 6);

  const conversionRate = 3.2;
  const avgOrderValue = orders.length ? orders.reduce((s, o) => s + o.total, 0) / orders.length : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Avg Order Value" value={formatINR(avgOrderValue)} icon={ShoppingBag} change="4.2%" />
        <StatCard label="Conversion Rate" value={`${conversionRate}%`} icon={Percent} change="0.4%" />
        <StatCard label="Repeat Customers" value="34%" icon={Users} change="2.1%" />
        <StatCard label="Growth (MoM)" value="12.4%" icon={TrendingUp} change="Steady" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Revenue Trend (6 months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip formatter={(v: any) => [formatINR(Number(v)), "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Orders per Month</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="orders" fill="#0a0a0a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Top Brands by Units Sold</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={brandData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
              <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="brand" fontSize={11} tickLine={false} axisLine={false} width={80} />
              <Tooltip />
              <Bar dataKey="sold" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
