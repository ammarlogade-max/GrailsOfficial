import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, Download } from "lucide-react";
import { useCatalogStore } from "../../store/catalogStore";
import { useToastStore } from "../../store/toastStore";
import ProductImage from "../../components/customer/ProductImage";
import { formatINR } from "../../lib/format";
import { exportToCSV } from "../../lib/csvExport";

export default function ProductsAdmin() {
  const { products, categories, deleteProduct } = useCatalogStore();
  const showToast = useToastStore((s) => s.show);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = products.filter((p) => {
    if (query && !p.name.toLowerCase().includes(query.toLowerCase()) && !p.sku.toLowerCase().includes(query.toLowerCase())) return false;
    if (categoryFilter !== "all" && p.categoryId !== categoryFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    return true;
  });

  async function handleDelete(id: string, name: string) {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      try {
        await deleteProduct(id);
        showToast("Product deleted", "success");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to delete product", "error");
      }
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products or SKU..." className="input pl-9" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="select !w-auto text-sm">
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select !w-auto text-sm">
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <Link to="/admin/products/new" className="btn btn-primary btn-sm"><Plus size={14} /> Add Product</Link>
          <button
            onClick={() =>
              exportToCSV(
                filtered.map((p) => ({
                  sku: p.sku, name: p.name, brand: p.brand, category: categories.find((c) => c.id === p.categoryId)?.name || "",
                  price: p.price, original_price: p.originalPrice, stock: p.stock, status: p.status,
                  avg_rating: p.avgRating, num_reviews: p.numReviews, total_sold: p.totalSold,
                })),
                "urbankicks-products"
              )
            }
            className="btn btn-outline btn-sm"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-neutral-50 text-neutral-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Product</th>
              <th className="text-left px-4 py-3 font-medium">SKU</th>
              <th className="text-left px-4 py-3 font-medium">Category</th>
              <th className="text-left px-4 py-3 font-medium">Price</th>
              <th className="text-left px-4 py-3 font-medium">Stock</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-neutral-100 hover:bg-neutral-50/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-50 rounded-lg overflow-hidden shrink-0"><ProductImage src={p.images[0]} alt={p.name} /></div>
                    <span className="font-medium line-clamp-1 max-w-[220px]">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-500">{p.sku}</td>
                <td className="px-4 py-3 text-neutral-600">{categories.find((c) => c.id === p.categoryId)?.name}</td>
                <td className="px-4 py-3 font-medium">{formatINR(p.price)}</td>
                <td className="px-4 py-3">
                  <span className={p.stock <= p.lowStockThreshold ? "text-amber-600 font-medium" : ""}>{p.stock}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${p.status === "published" ? "bg-green-100 text-green-700" : p.status === "draft" ? "bg-neutral-100 text-neutral-600" : "bg-rose-100 text-rose-600"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link to={`/admin/products/${p.id}`} className="p-1.5 text-neutral-500 hover:text-neutral-900"><Pencil size={14} /></Link>
                    <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 text-neutral-500 hover:text-rose-500"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-sm text-neutral-400 py-10">No products match your filters.</p>}
      </div>
    </div>
  );
}
