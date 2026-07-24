import { X } from "lucide-react";
import { type ReactNode } from "react";

export default function Modal({
  open, onClose, title, children, size = "md",
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; size?: "sm" | "md" | "lg" | "xl" }) {
  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${widths[size]} max-h-[88vh] flex flex-col animate-fade-up`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <h3 className="font-semibold text-neutral-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
