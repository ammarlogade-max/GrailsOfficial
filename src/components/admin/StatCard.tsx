import type { LucideIcon } from "lucide-react";

export default function StatCard({
  label, value, icon: Icon, change, changeType = "up", accent = "var(--color-primary)",
}: { label: string; value: string; icon: LucideIcon; change?: string; changeType?: "up" | "down"; accent?: string }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-500 font-medium">{label}</span>
        <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}1a` }}>
          <Icon size={16} style={{ color: accent }} />
        </span>
      </div>
      <div className="text-2xl font-bold mt-2">{value}</div>
      {change && (
        <span className={`text-xs mt-1 inline-block ${changeType === "up" ? "text-green-600" : "text-rose-600"}`}>
          {changeType === "up" ? "↑" : "↓"} {change}
        </span>
      )}
    </div>
  );
}
