import { useEffect, useState } from "react";
import { Pin, Reply } from "lucide-react";
import { useReviewsStore } from "../../store/reviewsStore";
import { useCatalogStore } from "../../store/catalogStore";
import { useToastStore } from "../../store/toastStore";
import Rating from "../../components/ui/Rating";
import Modal from "../../components/ui/Modal";
import { formatDate } from "../../lib/format";

export default function ReviewsAdmin() {
  const { reviews, fetchAll, setStatus, togglePin, reply } = useReviewsStore();
  const products = useCatalogStore((s) => s.products);
  const showToast = useToastStore((s) => s.show);
  const [statusFilter, setStatusFilter] = useState("all");
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = reviews.filter((r) => statusFilter === "all" || r.status === statusFilter);

  async function handleSetStatus(id: string, status: "approved" | "hidden") {
    try {
      await setStatus(id, status);
      showToast(status === "approved" ? "Review approved" : "Review hidden", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update review", "error");
    }
  }

  async function handleTogglePin(id: string) {
    try {
      await togglePin(id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update review", "error");
    }
  }

  async function handleReply() {
    if (!replyTarget) return;
    try {
      await reply(replyTarget, replyText);
      showToast("Reply posted", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to post reply", "error");
    } finally {
      setReplyTarget(null);
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {["all", "pending", "approved", "hidden"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${statusFilter === s ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}>
            {s} {s !== "all" && `(${reviews.filter((r) => r.status === s).length})`}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map((r) => {
          const product = products.find((p) => p.id === r.productId);
          return (
            <div key={r.id} className="card p-4">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <p className="text-sm font-medium">{product?.name}</p>
                  <p className="text-xs text-neutral-400">{r.customerName} · {formatDate(r.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${r.status === "approved" ? "bg-green-100 text-green-700" : r.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-neutral-100 text-neutral-500"}`}>{r.status}</span>
                  {r.pinned && <span className="badge bg-orange-100 text-orange-700">Pinned</span>}
                </div>
              </div>
              <Rating value={r.rating} size={13} />
              <p className="text-sm font-medium mt-1.5">{r.title}</p>
              <p className="text-sm text-neutral-600 mt-1">{r.body}</p>
              {r.adminReply && <div className="mt-2 bg-neutral-50 rounded-lg p-2.5 text-xs text-neutral-600"><span className="font-semibold">Reply:</span> {r.adminReply}</div>}
              <div className="flex gap-2 mt-3">
                {r.status !== "approved" && <button onClick={() => handleSetStatus(r.id, "approved")} className="btn btn-outline btn-sm">Approve</button>}
                {r.status !== "hidden" && <button onClick={() => handleSetStatus(r.id, "hidden")} className="btn btn-outline btn-sm">Hide</button>}
                <button onClick={() => handleTogglePin(r.id)} className="btn btn-outline btn-sm"><Pin size={12} /> {r.pinned ? "Unpin" : "Pin"}</button>
                <button onClick={() => { setReplyTarget(r.id); setReplyText(r.adminReply || ""); }} className="btn btn-outline btn-sm"><Reply size={12} /> Reply</button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!replyTarget} onClose={() => setReplyTarget(null)} title="Reply to Review">
        <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} className="textarea" rows={3} />
        <button onClick={handleReply} className="btn btn-primary w-full mt-3">
          Post Reply
        </button>
      </Modal>
    </div>
  );
}
