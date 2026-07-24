import { useEffect } from "react";
import { useNotificationsStore } from "../../store/notificationsStore";
import { timeAgo } from "../../lib/format";
import { Bell, ShoppingCart, AlertTriangle, Star, Undo2, XCircle, Ticket } from "lucide-react";

const iconMap: Record<string, typeof Bell> = {
  new_order: ShoppingCart, low_stock: AlertTriangle, new_review: Star, return_requested: Undo2, failed_payment: XCircle, coupon_usage_limit: Ticket,
};

export default function NotificationsAdmin() {
  const { notifications, fetchAll, markRead, markAllRead } = useNotificationsStore();

  useEffect(() => { fetchAll(); }, [fetchAll]);
  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-5">
        <p className="text-sm text-neutral-500">{notifications.filter((n) => !n.read).length} unread notifications</p>
        <button onClick={markAllRead} className="text-sm text-[var(--color-primary)] font-medium">Mark all as read</button>
      </div>
      <div className="card divide-y divide-neutral-100">
        {notifications.map((n) => {
          const Icon = iconMap[n.type] || Bell;
          return (
            <button key={n.id} onClick={() => markRead(n.id)} className={`w-full text-left flex items-start gap-3 p-4 hover:bg-neutral-50 ${!n.read ? "bg-orange-50/40" : ""}`}>
              <span className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center shrink-0"><Icon size={16} className="text-neutral-600" /></span>
              <div className="flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{n.body}</p>
                <p className="text-[10px] text-neutral-400 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] mt-1.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
