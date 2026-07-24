import { useEffect, useRef, useState } from "react";
import { Upload, Loader2, Check } from "lucide-react";
import { useMediaStore } from "../../store/mediaStore";
import { useToastStore } from "../../store/toastStore";
import Modal from "../ui/Modal";
import ProductImage from "../customer/ProductImage";
import type { MediaAsset } from "../../data/types";

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  folder?: MediaAsset["folder"];
}

/**
 * Shared "pick a product photo" experience: browse what's already in the
 * Media Library, or upload a new file on the spot — either way you leave
 * with a real URL, not a hand-typed one. Used from the Product Editor so
 * images always come from a governed library instead of ad-hoc pasted
 * links.
 */
export default function MediaPickerModal({ open, onClose, onSelect, folder = "products" }: MediaPickerModalProps) {
  const { assets, loading, fetchAll, uploadFile, uploading } = useMediaStore();
  const showToast = useToastStore((s) => s.show);
  const [query, setQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) fetchAll();
  }, [open, fetchAll]);

  const filtered = assets.filter((a) => a.fileType === "image" && a.fileName.toLowerCase().includes(query.toLowerCase()));

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadFile(file, folder);
      showToast("Uploaded — select it below", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Upload failed", "error");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Choose a Photo" size="lg">
      <div className="space-y-3">
        <div className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search media library..." className="input flex-1" />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn btn-outline btn-sm shrink-0">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload New
          </button>
        </div>

        {loading && <p className="text-sm text-neutral-400">Loading library...</p>}

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-96 overflow-y-auto">
          {filtered.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                onSelect(a.photo);
                onClose();
              }}
              className="aspect-square rounded-lg overflow-hidden border-2 border-neutral-200 hover:border-[var(--color-primary)] relative group"
              title={a.fileName}
            >
              <ProductImage src={a.photo} alt={a.altText} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Check size={20} className="text-white" />
              </div>
            </button>
          ))}
        </div>
        {!loading && filtered.length === 0 && <p className="text-sm text-neutral-400 text-center py-6">No images yet — upload one above.</p>}
      </div>
    </Modal>
  );
}
