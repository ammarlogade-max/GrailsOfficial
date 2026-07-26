import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Heart, Truck, RotateCcw, ShieldCheck, ChevronRight, Minus, Plus, Star } from "lucide-react";
import { useCatalogStore } from "../../store/catalogStore";
import { useReviewsStore } from "../../store/reviewsStore";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { useWishlistStore } from "../../store/wishlistStore";
import { useToastStore } from "../../store/toastStore";
import ProductImage from "../../components/customer/ProductImage";
import Rating from "../../components/ui/Rating";
import ProductGrid from "../../components/customer/ProductGrid";
import { formatDate, formatINR } from "../../lib/format";
import { useSEO, SITE_URL } from "../../lib/useSEO";
import { getVisibleProducts } from "../../lib/catalogVisibility";

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { products, categories } = useCatalogStore();
  const visibleProducts = getVisibleProducts(products);
  const product = visibleProducts.find((p) => p.slug === slug);
  const allReviews = useReviewsStore((s) => s.reviews);
  const fetchForProduct = useReviewsStore((s) => s.fetchForProduct);
  const addReview = useReviewsStore((s) => s.addReview);
  const user = useAuthStore((s) => s.user);
  const reviews = allReviews.filter((r) => r.productId === product?.id && r.status === "approved");
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", body: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (product) fetchForProduct(product.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!product || !user) return;
    setSubmittingReview(true);
    try {
      await addReview({
        id: `rev-${Date.now()}`,
        productId: product.id,
        customerId: user.id,
        customerName: user.fullName,
        rating: reviewForm.rating,
        title: reviewForm.title,
        body: reviewForm.body,
        status: "pending",
        pinned: false,
        helpfulCount: 0,
        createdAt: new Date().toISOString(),
      });
      showToast("Thanks! Your review is awaiting approval.", "success");
      setReviewForm({ rating: 5, title: "", body: "" });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to submit review", "error");
    } finally {
      setSubmittingReview(false);
    }
  }
  const addItem = useCartStore((s) => s.addItem);
  const isWishlisted = useWishlistStore((s) => (product ? s.isWishlisted(product.id) : false));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const showToast = useToastStore((s) => s.show);

  const [activeImg, setActiveImg] = useState(0);
  const [color, setColor] = useState(product?.availableColors[0]?.name || "");
  const [size, setSize] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"description" | "specs" | "reviews">("description");

  const related = useMemo(() => {
    if (!product) return [];
    return visibleProducts.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4);
  }, [visibleProducts, product]);

  useSEO({
    title: product ? product.name : "Product Not Found",
    description: product ? (product.seoDescription || product.description.slice(0, 160)) : undefined,
    image: product?.images[0],
    path: product ? `/product/${product.slug}` : undefined,
    type: "product",
    index: !!product,
    jsonLd: product
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: product.images,
            description: product.description,
            sku: product.sku,
            brand: { "@type": "Brand", name: product.brand },
            offers: {
              "@type": "Offer",
              url: `${SITE_URL}/product/${product.slug}`,
              priceCurrency: "INR",
              price: product.price,
              availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            },
            ...(product.numReviews > 0
              ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.avgRating, reviewCount: product.numReviews } }
              : {}),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
              ...(categories.find((c) => c.id === product.categoryId)
                ? [{ "@type": "ListItem", position: 2, name: categories.find((c) => c.id === product.categoryId)!.name, item: `${SITE_URL}/products?category=${categories.find((c) => c.id === product.categoryId)!.slug}` }]
                : []),
              { "@type": "ListItem", position: categories.find((c) => c.id === product.categoryId) ? 3 : 2, name: product.name, item: `${SITE_URL}/product/${product.slug}` },
            ],
          },
        ]
      : undefined,
  });

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-neutral-500">Product not found.</p>
        <Link to="/products" className="btn btn-primary mt-4 inline-flex">Back to Shop</Link>
      </div>
    );
  }

  const category = categories.find((c) => c.id === product.categoryId);
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  function handleAddToCart(goToCheckout = false) {
    if (!size) {
      showToast("Please select a size", "error");
      return;
    }
    addItem(product!, size, color, qty);
    showToast("Added to cart!", "success");
    if (goToCheckout) navigate("/checkout");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-5 flex-wrap">
        <Link to="/">Home</Link>
        <ChevronRight size={12} />
        <Link to={`/products?category=${category?.slug}`}>{category?.name}</Link>
        <ChevronRight size={12} />
        <span className="text-neutral-800">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div>
          <div className="aspect-square bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200">
            <ProductImage src={product.images[activeImg]} alt={product.name} eager />
          </div>
          <div className="flex gap-3 mt-3">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${activeImg === i ? "border-[var(--color-primary)]" : "border-neutral-200"}`}
              >
                <ProductImage src={img} alt={`${product.name} view ${i + 1}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-400 font-label">{product.brand}</div>
          <h1 className="font-display text-3xl sm:text-4xl mt-1 uppercase">{product.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Rating value={product.avgRating} showValue count={product.numReviews} />
          </div>
          <div className="flex items-baseline gap-3 mt-4">
            <span className="text-3xl font-bold">{formatINR(product.price)}</span>
            {discount > 0 && (
              <>
                <span className="text-lg text-neutral-400 line-through">{formatINR(product.originalPrice)}</span>
                <span className="badge bg-rose-600 text-white">{discount}% OFF</span>
              </>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-1">Inclusive of all taxes</p>

          {/* Color */}
          <div className="mt-6">
            <h4 className="field-label">Color: <span className="text-neutral-800 normal-case font-medium">{color}</span></h4>
            <div className="flex gap-2.5">
              {product.availableColors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  className={`w-9 h-9 rounded-full border-2 ${color === c.name ? "border-[var(--color-primary)]" : "border-neutral-200"}`}
                  style={{ background: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
            <p className="text-xs text-neutral-400 mt-1.5">Photos show a representative colorway; actual shade may vary slightly.</p>
          </div>

          {/* Size */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h4 className="field-label mb-0">Select Size (UK)</h4>
              <button className="text-xs text-[var(--color-primary)] font-medium">Size Guide</button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-2">
              {product.availableSizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`py-2 rounded-lg border text-sm font-medium ${
                    size === s
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                      : "border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity + Actions */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center border border-neutral-200 rounded-lg">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5"><Minus size={14} /></button>
              <span className="w-8 text-center text-sm">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="p-2.5"><Plus size={14} /></button>
            </div>
            <span className="text-sm text-neutral-500">{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</span>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={() => handleAddToCart(false)} disabled={product.stock === 0} className="btn btn-dark flex-1">
              Add to Cart
            </button>
            <button onClick={() => handleAddToCart(true)} disabled={product.stock === 0} className="btn btn-primary flex-1">
              Buy Now
            </button>
            <button
              onClick={async () => { try { await toggleWishlist(product.id); showToast(isWishlisted ? "Removed from wishlist" : "Added to wishlist"); } catch { showToast("Failed to update wishlist", "error"); } }}
              className="btn btn-outline btn-icon"
              aria-label="Wishlist"
            >
              <Heart size={18} className={isWishlisted ? "fill-rose-500 text-rose-500" : ""} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 text-xs text-neutral-600">
            <div className="flex flex-col items-center text-center gap-1.5 p-3 border border-neutral-200 rounded-lg">
              <Truck size={18} className="text-[var(--color-primary)]" /> {product.shippingInfo}
            </div>
            <div className="flex flex-col items-center text-center gap-1.5 p-3 border border-neutral-200 rounded-lg">
              <RotateCcw size={18} className="text-[var(--color-primary)]" /> {product.returnPolicy}
            </div>
            <div className="flex flex-col items-center text-center gap-1.5 p-3 border border-neutral-200 rounded-lg">
              <ShieldCheck size={18} className="text-[var(--color-primary)]" /> Quality checked
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-14">
        <div className="flex gap-6 border-b border-neutral-200">
          {(["description", "specs", "reviews"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 font-label text-sm tracking-wide capitalize ${tab === t ? "border-b-2 border-[var(--color-primary)] text-neutral-900" : "text-neutral-400"}`}
            >
              {t === "specs" ? "Specifications" : t} {t === "reviews" && `(${reviews.length})`}
            </button>
          ))}
        </div>
        <div className="py-6">
          {tab === "description" && (
            <div>
              <p className="text-neutral-700 leading-relaxed max-w-2xl">{product.description}</p>
              <ul className="mt-4 space-y-1.5">
                {product.highlights.map((h) => (
                  <li key={h} className="text-sm text-neutral-600 flex gap-2">
                    <span className="text-[var(--color-primary)]">✓</span> {h}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === "specs" && (
            <table className="text-sm w-full max-w-lg">
              <tbody>
                {Object.entries(product.specifications).map(([k, v]) => (
                  <tr key={k} className="border-b border-neutral-100">
                    <td className="py-2.5 text-neutral-500 w-1/3">{k}</td>
                    <td className="py-2.5 font-medium">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "reviews" && (
            <div className="space-y-5 max-w-2xl">
              {user ? (
                <form onSubmit={submitReview} className="card p-4 mb-2">
                  <h4 className="font-semibold text-sm mb-2">Write a Review</h4>
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}>
                        <Star size={20} className={n <= reviewForm.rating ? "fill-amber-400 text-amber-400" : "fill-neutral-200 text-neutral-200"} />
                      </button>
                    ))}
                  </div>
                  <input
                    required
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Review title"
                    className="input mb-2"
                  />
                  <textarea
                    required
                    value={reviewForm.body}
                    onChange={(e) => setReviewForm((f) => ({ ...f, body: e.target.value }))}
                    placeholder="Share your thoughts about this product..."
                    className="textarea mb-2"
                    rows={3}
                  />
                  <button disabled={submittingReview} className="btn btn-primary btn-sm">{submittingReview ? "Submitting..." : "Submit Review"}</button>
                </form>
              ) : (
                <p className="text-sm text-neutral-500">
                  <Link to="/login" className="text-[var(--color-primary)] font-medium">Log in</Link> to write a review.
                </p>
              )}
              {reviews.length === 0 && <p className="text-sm text-neutral-500">No reviews yet for this product.</p>}
              {reviews.map((r) => (
                <div key={r.id} className="border-b border-neutral-100 pb-5">
                  <div className="flex items-center justify-between">
                    <Rating value={r.rating} size={13} />
                    <span className="text-xs text-neutral-400">{formatDate(r.createdAt)}</span>
                  </div>
                  <p className="font-medium text-sm mt-1.5">{r.title}</p>
                  <p className="text-sm text-neutral-600 mt-1">{r.body}</p>
                  <p className="text-xs text-neutral-400 mt-2 font-label">— {r.customerName}</p>
                  {r.adminReply && (
                    <div className="mt-2 bg-neutral-50 rounded-lg p-3 text-xs text-neutral-600">
                      <span className="font-semibold">Grail's Official Team:</span> {r.adminReply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-14">
          <h3 className="text-display text-2xl mb-5">You May Also Like</h3>
          <ProductGrid products={related} />
        </div>
      )}
    </div>
  );
}
