import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Plus, X, ImagePlus } from "lucide-react";
import { useCatalogStore } from "../../store/catalogStore";
import { useToastStore } from "../../store/toastStore";
import Toggle from "../../components/ui/Toggle";
import ProductImage from "../../components/customer/ProductImage";
import MediaPickerModal from "../../components/admin/MediaPickerModal";
import type { Product } from "../../data/types";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const DEFAULT_PHOTO = "https://images.unsplash.com/photo-1676379827610-c380c52db0c6?auto=format&fit=crop&w=900&q=80";

export default function ProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, categories, upsertProduct } = useCatalogStore();
  const showToast = useToastStore((s) => s.show);
  const existing = id ? products.find((p) => p.id === id) : undefined;

  const [form, setForm] = useState<Product>(
    existing || {
      id: `prod-${Date.now()}`,
      name: "", slug: "", sku: "", barcode: "",
      categoryId: categories[0]?.id || "",
      brand: "", description: "", highlights: [], specifications: {},
      shippingInfo: "Ships in 2-3 business days. Free delivery above ₹999.",
      returnPolicy: "7-day easy return & exchange policy.",
      price: 0, originalPrice: 0, images: [DEFAULT_PHOTO, DEFAULT_PHOTO, DEFAULT_PHOTO],
      availableSizes: [6, 7, 8, 9, 10, 11], availableColors: [{ name: "Default", hex: "#0a0a0a" }],
      material: "", weight: 300, status: "published",
      featured: false, trending: false, bestSeller: false, newArrival: true,
      stock: 0, lowStockThreshold: 10,
      seoTitle: "", seoDescription: "", seoKeywords: "",
      sortOrder: 0, numReviews: 0, avgRating: 0, totalSold: 0,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
  );
  const [highlightInput, setHighlightInput] = useState("");
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!form.name || !form.brand) {
      showToast("Please fill in product name and brand", "error");
      return;
    }
    const slug = form.slug || slugify(`${form.brand} ${form.name}`);
    try {
      await upsertProduct({ ...form, slug, updatedAt: new Date().toISOString() });
      showToast(existing ? "Product updated" : "Product created", "success");
      navigate("/admin/products");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save product", "error");
    }
  }

  function toggleSize(s: number) {
    update("availableSizes", form.availableSizes.includes(s) ? form.availableSizes.filter((x) => x !== s) : [...form.availableSizes, s].sort((a, b) => a - b));
  }

  function addColor() {
    update("availableColors", [...form.availableColors, { name: "New Color", hex: "#888888" }]);
  }

  function updateColor(i: number, patch: Partial<{ name: string; hex: string }>) {
    const next = [...form.availableColors];
    next[i] = { ...next[i], ...patch };
    update("availableColors", next);
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-lg">{existing ? "Edit Product" : "Add New Product"}</h2>
        <button onClick={save} className="btn btn-primary"><Save size={15} /> Save Product</button>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-sm">General Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Product Name</label>
                <input value={form.name} onChange={(e) => update("name", e.target.value)} className="input" />
              </div>
              <div>
                <label className="field-label">Brand</label>
                <input value={form.brand} onChange={(e) => update("brand", e.target.value)} className="input" />
              </div>
              <div>
                <label className="field-label">Category</label>
                <select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)} className="select">
                  {!categories.length && <option value="">No categories found</option>}
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">SKU</label>
                <input value={form.sku} onChange={(e) => update("sku", e.target.value)} className="input" />
              </div>
              <div>
                <label className="field-label">Material</label>
                <input value={form.material} onChange={(e) => update("material", e.target.value)} className="input" />
              </div>
              <div>
                <label className="field-label">Weight (g)</label>
                <input type="number" value={form.weight} onChange={(e) => update("weight", +e.target.value)} className="input" />
              </div>
            </div>
            <div>
              <label className="field-label">Description</label>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)} className="textarea" rows={4} />
            </div>
            <div>
              <label className="field-label">Highlights</label>
              <div className="flex gap-2 mb-2">
                <input value={highlightInput} onChange={(e) => setHighlightInput(e.target.value)} className="input" placeholder="Add a highlight and press Add" />
                <button
                  type="button"
                  onClick={() => { if (highlightInput) { update("highlights", [...form.highlights, highlightInput]); setHighlightInput(""); } }}
                  className="btn btn-outline btn-sm"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.highlights.map((h, i) => (
                  <span key={i} className="badge bg-neutral-100 text-neutral-700 gap-1.5">
                    {h}
                    <button onClick={() => update("highlights", form.highlights.filter((_, idx) => idx !== i))}><X size={11} /></button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-sm">Pricing & Inventory</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="field-label">Selling Price (₹)</label>
                <input type="number" value={form.price} onChange={(e) => update("price", +e.target.value)} className="input" />
              </div>
              <div>
                <label className="field-label">MRP / Original Price (₹)</label>
                <input type="number" value={form.originalPrice} onChange={(e) => update("originalPrice", +e.target.value)} className="input" />
              </div>
              <div>
                <label className="field-label">Stock Quantity</label>
                <input type="number" value={form.stock} onChange={(e) => update("stock", +e.target.value)} className="input" />
              </div>
              <div>
                <label className="field-label">Low Stock Threshold</label>
                <input type="number" value={form.lowStockThreshold} onChange={(e) => update("lowStockThreshold", +e.target.value)} className="input" />
              </div>
              <div>
                <label className="field-label">Status</label>
                <select value={form.status} onChange={(e) => update("status", e.target.value as Product["status"])} className="select">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-sm">Variants</h3>
            <div>
              <label className="field-label">Available Sizes (UK)</label>
              <div className="flex flex-wrap gap-2">
                {[6, 7, 8, 9, 10, 11, 12, 13].map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSize(s)}
                    className={`w-10 h-10 rounded-lg border text-sm ${form.availableSizes.includes(s) ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white" : "border-neutral-200"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="field-label">Colors</label>
              <div className="space-y-2">
                {form.availableColors.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="color" value={c.hex} onChange={(e) => updateColor(i, { hex: e.target.value })} className="w-9 h-9 rounded border border-neutral-200" />
                    <input value={c.name} onChange={(e) => updateColor(i, { name: e.target.value })} className="input !py-1.5" />
                    <button onClick={() => update("availableColors", form.availableColors.filter((_, idx) => idx !== i))} className="text-neutral-400 hover:text-rose-500"><X size={15} /></button>
                  </div>
                ))}
                <button onClick={addColor} className="btn btn-outline btn-sm"><Plus size={13} /> Add Color</button>
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-sm">SEO</h3>
            <div>
              <label className="field-label">SEO Title</label>
              <input value={form.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} className="input" />
            </div>
            <div>
              <label className="field-label">SEO Description</label>
              <textarea value={form.seoDescription} onChange={(e) => update("seoDescription", e.target.value)} className="textarea" rows={2} />
            </div>
            <div>
              <label className="field-label">SEO Keywords</label>
              <input value={form.seoKeywords} onChange={(e) => update("seoKeywords", e.target.value)} className="input" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <p className="eyebrow text-neutral-400 mb-2">Product Photos</p>
            <div className="aspect-square bg-neutral-50 rounded-lg overflow-hidden mb-3">
              <ProductImage src={form.images[0] || DEFAULT_PHOTO} alt={form.name || "Product preview"} />
            </div>
            <div className="space-y-2">
              {form.images.map((url, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => setPickerSlot(i)}
                    className="w-10 h-10 rounded-md overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200 hover:border-[var(--color-primary)] relative group"
                    title="Choose from Media Library"
                  >
                    <ProductImage src={url || DEFAULT_PHOTO} alt={`Image ${i + 1}`} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImagePlus size={14} className="text-white" />
                    </div>
                  </button>
                  <input
                    value={url}
                    onChange={(e) => {
                      const next = [...form.images];
                      next[i] = e.target.value;
                      update("images", next);
                    }}
                    className="input !py-1.5 text-xs"
                    placeholder="Image URL, or click the thumbnail to browse the library"
                  />
                  {form.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => update("images", form.images.filter((_, idx) => idx !== i))}
                      className="text-neutral-400 hover:text-rose-500 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => update("images", [...form.images, ""])}
                className="btn btn-outline btn-sm w-full"
              >
                <Plus size={14} /> Add Image Slot
              </button>
            </div>
            <p className="text-xs text-neutral-400 mt-2">Click a thumbnail to choose from the Media Library or upload a new photo.</p>
          </div>
          <MediaPickerModal
            open={pickerSlot !== null}
            onClose={() => setPickerSlot(null)}
            folder="products"
            onSelect={(url) => {
              if (pickerSlot === null) return;
              const next = [...form.images];
              next[pickerSlot] = url;
              update("images", next);
            }}
          />
          <div className="card p-4 space-y-3">
            <p className="eyebrow text-neutral-400">Visibility Flags</p>
            <div className="flex items-center justify-between text-sm"><span>Featured</span><Toggle on={form.featured} onChange={(v) => update("featured", v)} /></div>
            <div className="flex items-center justify-between text-sm"><span>Trending</span><Toggle on={form.trending} onChange={(v) => update("trending", v)} /></div>
            <div className="flex items-center justify-between text-sm"><span>Best Seller</span><Toggle on={form.bestSeller} onChange={(v) => update("bestSeller", v)} /></div>
            <div className="flex items-center justify-between text-sm"><span>New Arrival</span><Toggle on={form.newArrival} onChange={(v) => update("newArrival", v)} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
