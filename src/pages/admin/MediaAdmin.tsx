import { useEffect, useRef, useState } from "react";
import { Upload, Search, Trash2, Loader2 } from "lucide-react";
import { useMediaStore } from "../../store/mediaStore";
import ProductImage from "../../components/customer/ProductImage";
import { useToastStore } from "../../store/toastStore";
import { formatDate } from "../../lib/format";
import type { MediaAsset } from "../../data/types";

const folders = ["all", "products", "banners", "hero", "brand", "reviews", "general"] as const;

export default function MediaAdmin() {
  const { assets, loading, uploading, fetchAll, uploadFile, deleteAsset } = useMediaStore();
  const showToast = useToastStore((s) => s.show);
  const [folder, setFolder] = useState<(typeof folders)[number]>("all");
  const [query, setQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = assets.filter((m) => (folder === "all" || m.folder === folder) && m.fileName.toLowerCase().includes(query.toLowerCase()));

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const targetFolder = folder === "all" ? "general" : folder;
    try {
      await uploadFile(file, targetFolder as MediaAsset["folder"]);
      showToast("File uploaded", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      e.target.value = "";
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAsset(id);
      showToast("File removed", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove file", "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {folders.map((f) => (
            <button key={f} onClick={() => setFolder(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap ${folder === f ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files..." className="input pl-8 !py-2 text-sm" />
          </div>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelected} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn btn-primary btn-sm">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      {loading && <div className="flex items-center gap-2 text-sm text-neutral-400 mb-4"><Loader2 size={14} className="animate-spin" /> Loading media...</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map((m) => (
          <div key={m.id} className="card overflow-hidden group relative">
            <div className="aspect-square bg-neutral-50"><ProductImage src={m.photo} alt={m.altText} /></div>
            <button onClick={() => handleDelete(m.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-neutral-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={13} />
            </button>
            <div className="p-2">
              <p className="text-[11px] font-medium line-clamp-1">{m.fileName}</p>
              <p className="text-[10px] text-neutral-400">{(m.fileSize / 1024).toFixed(0)} KB · {formatDate(m.uploadedAt)}</p>
            </div>
          </div>
        ))}
      </div>
      {!loading && filtered.length === 0 && <p className="text-center text-sm text-neutral-400 py-10">No media found.</p>}
    </div>
  );
}
