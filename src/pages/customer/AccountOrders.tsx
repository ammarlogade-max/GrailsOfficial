import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Loader2 } from "lucide-react";
import { useOrdersStore } from "../../store/ordersStore";
import { useAuthStore } from "../../store/authStore";
import { formatDate, formatINR, STATUS_LABELS, STATUS_COLORS } from "../../lib/format";
import ProductImage from "../../components/customer/ProductImage";

export default function AccountOrders() {
  const user = useAuthStore((s) => s.user);
  const { orders, loading, fetchOrders } = useOrdersStore();

  useEffect(() => {
    if (user?.id) fetchOrders(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (loading) {
    return (
      <div className="card p-10 text-center text-neutral-400 flex items-center justify-center gap-2">
        <Loader2 size={16} className="animate-spin" /> Loading your orders...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="card p-10 text-center">
        <Package size={40} className="mx-auto text-neutral-300" />
        <p className="text-neutral-500 mt-3">No orders yet.</p>
        <Link to="/products" className="btn btn-primary mt-5 inline-flex">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <Link key={o.id} to={`/account/orders/${o.id}`} className="card p-4 flex items-center gap-4 hover:border-neutral-300 transition-colors">
          <div className="w-16 h-16 bg-neutral-50 rounded-lg overflow-hidden shrink-0">
            <ProductImage src={o.items[0]?.photo} alt={o.items[0]?.productName || o.orderNumber} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <p className="font-medium text-sm">{o.orderNumber}</p>
              <span className="badge text-white" style={{ background: STATUS_COLORS[o.status] }}>{STATUS_LABELS[o.status]}</span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">{o.items.length} item(s) · Placed on {formatDate(o.createdAt)}</p>
          </div>
          <span className="font-semibold text-sm shrink-0">{formatINR(o.total)}</span>
        </Link>
      ))}
    </div>
  );
}