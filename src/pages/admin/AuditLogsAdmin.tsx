import { useEffect } from "react";
import { useAuditStore } from "../../store/auditStore";
import { formatDateTime } from "../../lib/format";
import { History, Loader2 } from "lucide-react";

const actionColor: Record<string, string> = { created: "bg-green-100 text-green-700", updated: "bg-blue-100 text-blue-700", deleted: "bg-rose-100 text-rose-600", status_changed: "bg-amber-100 text-amber-700" };

export default function AuditLogsAdmin() {
  const { logs, loading, fetchAll } = useAuditStore();

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div>
      <p className="text-sm text-neutral-500 mb-5">A complete, tamper-evident log of every admin action for accountability and compliance.</p>
      {loading && <div className="flex items-center gap-2 text-sm text-neutral-400 mb-4"><Loader2 size={14} className="animate-spin" /> Loading...</div>}
      <div className="card divide-y divide-neutral-100">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 p-4">
            <span className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center shrink-0"><History size={15} className="text-neutral-500" /></span>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-medium">{log.actorEmail}</span> ({log.actorRole.replace(/_/g, " ")})
                <span className={`badge ml-2 ${actionColor[log.action]}`}>{log.action.replace(/_/g, " ")}</span>
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {log.entityType.replace(/_/g, " ")}: <span className="font-medium">{log.entityName}</span>
                {log.changedFields && <span> · fields: {log.changedFields.join(", ")}</span>}
              </p>
              <p className="text-[10px] text-neutral-400 mt-1">{formatDateTime(log.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
      {!loading && logs.length === 0 && <p className="text-center text-sm text-neutral-400 py-10">No audit activity yet.</p>}
    </div>
  );
}
