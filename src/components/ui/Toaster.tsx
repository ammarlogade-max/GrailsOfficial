import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore } from "../../store/toastStore";

export default function Toaster() {
  const { toasts, dismiss } = useToastStore();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-fade-up flex items-start gap-2.5 bg-white border border-neutral-200 shadow-xl rounded-lg px-4 py-3 text-sm"
        >
          {t.variant === "success" && <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />}
          {t.variant === "error" && <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />}
          {t.variant === "info" && <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />}
          <span className="flex-1 text-neutral-800">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="text-neutral-400 hover:text-neutral-700">
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
