import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Bell, ChevronDown, LogOut, ExternalLink } from "lucide-react";
import { useAdminAuthStore } from "../../store/authStore";
import { useNotificationsStore } from "../../store/notificationsStore";
import { timeAgo } from "../../lib/format";

export default function AdminTopbar({ onMenuClick, title }: { onMenuClick: () => void; title: string }) {
  const { adminUser, logout } = useAdminAuthStore();
  const { notifications, markRead, markAllRead } = useNotificationsStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-1 -ml-1">
          <Menu size={22} />
        </button>
        <h1 className="font-display text-xl tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/" target="_blank" className="hidden sm:flex btn btn-ghost btn-sm gap-1.5 text-neutral-600">
          View Store <ExternalLink size={13} />
        </Link>
        <div className="relative">
          <button onClick={() => { setShowNotifs((v) => !v); setShowUser(false); }} className="relative p-2 rounded-full hover:bg-neutral-100">
            <Bell size={19} />
            {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />}
          </button>
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                <span className="font-semibold text-sm">Notifications</span>
                <button onClick={markAllRead} className="text-xs text-[var(--color-primary)] font-medium">Mark all read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`w-full text-left px-4 py-3 border-b border-neutral-50 hover:bg-neutral-50 ${!n.read ? "bg-orange-50/50" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0" />}
                      <div className={!n.read ? "" : "ml-3.5"}>
                        <p className="text-sm font-medium text-neutral-800">{n.title}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{n.body}</p>
                        <p className="text-[10px] text-neutral-400 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <button onClick={() => { setShowUser((v) => !v); setShowNotifs(false); }} className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-neutral-100">
            <span className="w-8 h-8 rounded-full bg-[var(--color-secondary)] text-white flex items-center justify-center text-xs font-semibold">
              {adminUser?.name?.slice(0, 2).toUpperCase()}
            </span>
            <ChevronDown size={14} className="hidden sm:block" />
          </button>
          {showUser && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-100">
                <p className="text-sm font-medium">{adminUser?.name}</p>
                <p className="text-xs text-neutral-500">{adminUser?.email}</p>
              </div>
              <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50">
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
