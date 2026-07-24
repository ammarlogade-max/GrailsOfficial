import { useState } from "react";
import { Search, Download } from "lucide-react";
import { customers } from "../../data/customers";
import { useOrdersStore } from "../../store/ordersStore";
import Modal from "../../components/ui/Modal";
import { formatDate, formatINR, STATUS_LABELS, STATUS_COLORS } from "../../lib/format";
import { exportToCSV } from "../../lib/csvExport";

export default function CustomersAdmin() {
  const orders = useOrdersStore((s) => s.orders);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const customer = customers.find((c) => c.id === selected);
  const customerOrders = orders.filter((o) => o.customerId === selected);

  const filtered = customers.filter((c) => c.fullName.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="relative max-w-sm flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers..." className="input pl-9" />
        </div>
        <button
          onClick={() =>
            exportToCSV(
              filtered.map((c) => ({
                name: c.fullName, email: c.email, phone: c.phone,
                orders: orders.filter((o) => o.customerId === c.id).length,
                total_spent: orders.filter((o) => o.customerId === c.id).reduce((s, o) => s + o.total, 0),
                joined: c.joinedAt,
              })),
              "urbankicks-customers"
            )
          }
          className="btn btn-outline btn-sm shrink-0"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-neutral-50 text-neutral-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Customer</th>
              <th className="text-left px-4 py-3 font-medium">Contact</th>
              <th className="text-left px-4 py-3 font-medium">Orders</th>
              <th className="text-left px-4 py-3 font-medium">Total Spent</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} onClick={() => setSelected(c.id)} className="border-t border-neutral-100 hover:bg-neutral-50/60 cursor-pointer">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-neutral-900 text-white text-xs flex items-center justify-center font-medium">{c.avatarInitials}</span>
                    <div>
                      <p className="font-medium">{c.fullName}</p>
                      {c.tags.length > 0 && <span className="badge bg-orange-100 text-orange-700 mt-0.5">{c.tags[0]}</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-500 text-xs">{c.email}<br />{c.phone}</td>
                <td className="px-4 py-3">{c.totalOrders}</td>
                <td className="px-4 py-3 font-medium">{formatINR(c.totalSpent)}</td>
                <td className="px-4 py-3"><span className={`badge ${c.status === "active" ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-600"}`}>{c.status}</span></td>
                <td className="px-4 py-3 text-neutral-500 text-xs">{formatDate(c.joinedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!customer} onClose={() => setSelected(null)} title={customer?.fullName || ""} size="lg">
        {customer && (
          <div>
            <div className="grid sm:grid-cols-3 gap-3 mb-5 text-sm">
              <div className="card p-3"><p className="text-neutral-400 text-xs">Email</p><p className="font-medium">{customer.email}</p></div>
              <div className="card p-3"><p className="text-neutral-400 text-xs">Phone</p><p className="font-medium">{customer.phone}</p></div>
              <div className="card p-3"><p className="text-neutral-400 text-xs">Total Spent</p><p className="font-medium">{formatINR(customer.totalSpent)}</p></div>
            </div>
            <h4 className="font-semibold text-sm mb-2">Order History</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customerOrders.length === 0 && <p className="text-sm text-neutral-400">No orders yet.</p>}
              {customerOrders.map((o) => (
                <div key={o.id} className="flex justify-between items-center text-sm border-b border-neutral-100 py-2">
                  <span>{o.orderNumber}</span>
                  <span className="badge text-white" style={{ background: STATUS_COLORS[o.status] }}>{STATUS_LABELS[o.status]}</span>
                  <span className="font-medium">{formatINR(o.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
