import { useState } from "react";
import { Search, AlertTriangle, CheckSquare, Square } from "lucide-react";
import { useCatalogStore } from "../../store/catalogStore";
import { useToastStore } from "../../store/toastStore";
import ProductImage from "../../components/customer/ProductImage";

export default function InventoryAdmin() {
  const { products, updateStock, bulkUpdateStock } = useCatalogStore();
  const showToast = useToastStore((s) => s.show);
  const [query, setQuery] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState<"set" | "adjust">("set");
  const [bulkValue, setBulkValue] = useState(0);
  const [applying, setApplying] = useState(false);

  const filtered = products
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))
    .filter((p) => !onlyLow || p.stock <= p.lowStockThreshold);

  const allVisibleSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((s) => {
      if (allVisibleSelected) {
        const next = new Set(s);
        filtered.forEach((p) => next.delete(p.id));
        return next;
      }
      const next = new Set(s);
      filtered.forEach((p) => next.add(p.id));
      return next;
    });
  }

  async function applyBulk() {
    if (selected.size === 0) return;
    setApplying(true);
    try {
      const updates = Array.from(selected).map((id) => {
        const product = products.find((p) => p.id === id)!;
        const stock = bulkMode === "set" ? Math.max(0, bulkValue) : Math.max(0, product.stock + bulkValue);
        return { id, stock };
      });
      await bulkUpdateStock(updates);
      showToast(`Updated stock for ${updates.length} product(s)`, "success");
      setSelected(new Set());
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Bulk update failed", "error");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search SKU or product..." className="input pl-9" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} className="accent-[var(--color-primary)]" />
          Low stock only
        </label>
      </div>

      {selected.size > 0 && (
        <div className="card p-4 mb-4 flex flex-wrap items-center gap-3 bg-neutral-50 border-neutral-200">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <select value={bulkMode} onChange={(e) => setBulkMode(e.target.value as "set" | "adjust")} className="select !w-auto !py-1.5 text-sm">
            <option value="set">Set stock to</option>
            <option value="adjust">Adjust stock by</option>
          </select>
          <input
            type="number"
            value={bulkValue}
            onChange={(e) => setBulkValue(+e.target.value)}
            className="input !py-1.5 !w-24"
            placeholder={bulkMode === "adjust" ? "e.g. -5 or +10" : "e.g. 50"}
          />
          <button onClick={applyBulk} disabled={applying} className="btn btn-primary btn-sm">
            {applying ? "Applying..." : "Apply to Selected"}
          </button>
          <button onClick={() => setSelected(new Set())} className="text-sm text-neutral-500 hover:text-neutral-800">Clear selection</button>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[750px]">
          <thead className="bg-neutral-50 text-neutral-500 text-xs">
            <tr>
              <th className="px-4 py-3 w-8">
                <button onClick={toggleAllVisible} className="text-neutral-400 hover:text-neutral-700 flex items-center">
                  {allVisibleSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              </th>
              <th className="text-left px-4 py-3 font-medium">Product</th>
              <th className="text-left px-4 py-3 font-medium">SKU</th>
              <th className="text-left px-4 py-3 font-medium">Current Stock</th>
              <th className="text-left px-4 py-3 font-medium">Threshold</th>
              <th className="text-left px-4 py-3 font-medium">Update Stock</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className={`border-t border-neutral-100 ${selected.has(p.id) ? "bg-[var(--color-primary)]/5" : ""}`}>
                <td className="px-4 py-3">
                  <button onClick={() => toggleOne(p.id)} className="text-neutral-400 hover:text-neutral-700 flex items-center">
                    {selected.has(p.id) ? <CheckSquare size={16} className="text-[var(--color-primary)]" /> : <Square size={16} />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-neutral-50 rounded-lg overflow-hidden shrink-0"><ProductImage src={p.images[0]} alt={p.name} /></div>
                    <span className="font-medium line-clamp-1 max-w-[200px]">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-500">{p.sku}</td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1.5 ${p.stock <= p.lowStockThreshold ? "text-amber-600 font-medium" : ""}`}>
                    {p.stock <= p.lowStockThreshold && <AlertTriangle size={13} />} {p.stock} units
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-500">{p.lowStockThreshold}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    defaultValue={p.stock}
                    onBlur={async (e) => {
                      try {
                        await updateStock(p.id, +e.target.value);
                        showToast("Stock updated", "success");
                      } catch (err) {
                        showToast(err instanceof Error ? err.message : "Failed to update stock", "error");
                      }
                    }}
                    className="input !py-1.5 !w-24"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
