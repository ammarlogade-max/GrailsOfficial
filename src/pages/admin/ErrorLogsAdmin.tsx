import { useEffect } from "react";
import { AlertTriangle, Info, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useErrorLogStore } from "../../store/errorLogStore";
import { useToastStore } from "../../store/toastStore";
import { formatDateTime } from "../../lib/format";

const levelIcon = { error: AlertCircle, warning: AlertTriangle, info: Info };
const levelColor = { error: "text-rose-500 bg-rose-50", warning: "text-amber-500 bg-amber-50", info: "text-blue-500 bg-blue-50" };

export default function ErrorLogsAdmin() {
  const { logs, loading, fetchAll, markResolved } = useErrorLogStore();
  const showToast = useToastStore((s) => s.show);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleResolve(id: string) {
    try {
      await markResolved(id);
      showToast("Marked as resolved", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update", "error");
    }
  }

  const unresolved = logs.filter((l) => !l.resolved);

  return (
    <div>
      <p className="text-sm text-neutral-500 mb-5">
        Client-side errors reported automatically by the storefront's error boundary. {unresolved.length} unresolved.
      </p>
      {loading && <div className="flex items-center gap-2 text-sm text-neutral-400 mb-4"><Loader2 size={14} className="animate-spin" /> Loading...</div>}
      <div className="card divide-y divide-neutral-100">
        {logs.map((log) => {
          const Icon = levelIcon[log.level];
          return (
            <div key={log.id} className={`flex items-start gap-3 p-4 ${log.resolved ? "opacity-50" : ""}`}>
              <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${levelColor[log.level]}`}>
                <Icon size={15} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2">{log.message}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {log.route && <span>{log.route} · </span>}
                  {log.browser && <span>{log.browser} · </span>}
                  {log.os}
                </p>
                <p className="text-[10px] text-neutral-400 mt-1">{formatDateTime(log.createdAt)}</p>
              </div>
              {!log.resolved && (
                <button onClick={() => handleResolve(log.id)} className="p-1.5 text-neutral-400 hover:text-green-600 shrink-0" title="Mark resolved">
                  <CheckCircle2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {!loading && logs.length === 0 && <p className="text-center text-sm text-neutral-400 py-10">No errors reported — good sign.</p>}
    </div>
  );
}