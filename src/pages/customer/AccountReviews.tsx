import { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useReviewsStore } from "../../store/reviewsStore";
import { useCatalogStore } from "../../store/catalogStore";
import Rating from "../../components/ui/Rating";
import { formatDate } from "../../lib/format";

export default function AccountReviews() {
  const user = useAuthStore((s) => s.user);
  const allReviews = useReviewsStore((s) => s.reviews);
  const fetchForCustomer = useReviewsStore((s) => s.fetchForCustomer);
  const reviews = allReviews.filter((r) => r.customerId === user?.id);
  const products = useCatalogStore((s) => s.products);

  useEffect(() => {
    if (user?.id) fetchForCustomer(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (reviews.length === 0) return <p className="text-neutral-500 text-sm">You haven't written any reviews yet.</p>;

  return (
    <div className="space-y-4">
      {reviews.map((r) => {
        const product = products.find((p) => p.id === r.productId);
        return (
          <div key={r.id} className="card p-4">
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium">{product?.name}</p>
              <span className="text-xs text-neutral-400">{formatDate(r.createdAt)}</span>
            </div>
            <Rating value={r.rating} size={13} />
            <p className="text-sm font-medium mt-2">{r.title}</p>
            <p className="text-sm text-neutral-600 mt-1">{r.body}</p>
            <span className={`badge mt-2 inline-block ${r.status === "approved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {r.status === "approved" ? "Published" : "Pending Approval"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
