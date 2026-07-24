import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Minus, Plus, Trash2, Tag, X, ShoppingBag } from "lucide-react";
import { useCartStore } from "../../store/cartStore";
import { useCatalogStore } from "../../store/catalogStore";
import { useCMSStore } from "../../store/cmsStore";
import { useToastStore } from "../../store/toastStore";
import ProductImage from "../../components/customer/ProductImage";
import { formatINR } from "../../lib/format";
import { useSEO } from "../../lib/useSEO";

export default function Cart() {
  useSEO({ title: "Your Cart", index: false });

  const { lines, setQuantity, removeLine, couponCode, discountAmount, applyCoupon, removeCoupon } = useCartStore();
  const { products } = useCatalogStore();
  const settings = useCMSStore((s) => s.settings);
  const showToast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState("");
  const [applying, setApplying] = useState(false);

  const items = lines
    .map((l) => ({ line: l, product: products.find((p) => p.id === l.productId) }))
    .filter((i) => i.product);

  const subtotal = items.reduce((s, i) => s + (i.product!.price * i.line.quantity), 0);
  const shipping = subtotal >= settings.freeShippingThreshold || subtotal === 0 ? 0 : settings.standardShippingCharge;
  const total = subtotal - discountAmount + shipping;

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setApplying(true);
    const cartItems = items.map((i) => ({ productId: i.product!.id, subtotal: i.product!.price * i.line.quantity }));
    const result = await applyCoupon(couponInput.trim(), cartItems);
    setApplying(false);
    showToast(result.message, result.success ? "success" : "error");
    if (result.success) setCouponInput("");
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <ShoppingBag size={48} className="mx-auto text-neutral-300" />
        <h2 className="font-display text-2xl mt-4">Your Cart is Empty</h2>
        <p className="text-neutral-500 text-sm mt-1">Looks like you haven't added any sneakers yet.</p>
        <Link to="/products" className="btn btn-primary mt-6 inline-flex">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-display text-3xl sm:text-4xl mb-6">Shopping Cart</h1>
      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-4">
          {items.map(({ line, product }) => (
            <div key={`${line.productId}-${line.size}-${line.color}`} className="flex gap-4 border border-neutral-200 rounded-xl p-3">
              <div className="w-24 h-24 bg-neutral-50 rounded-lg overflow-hidden shrink-0">
                <ProductImage src={product!.images[0]} alt={product!.name} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{product!.name}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Size: {line.size} · Color: {line.color}</p>
                  </div>
                  <button onClick={() => removeLine(line.productId, line.size, line.color)} className="text-neutral-400 hover:text-rose-500 shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-neutral-200 rounded-lg">
                    <button onClick={() => setQuantity(line.productId, line.size, line.color, line.quantity - 1)} className="p-1.5"><Minus size={13} /></button>
                    <span className="w-7 text-center text-sm">{line.quantity}</span>
                    <button onClick={() => setQuantity(line.productId, line.size, line.color, line.quantity + 1)} className="p-1.5"><Plus size={13} /></button>
                  </div>
                  <span className="font-semibold text-sm">{formatINR(product!.price * line.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card p-5 h-fit">
          <h3 className="font-semibold mb-4">Order Summary</h3>
          {couponCode ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4 text-sm">
              <span className="text-green-700 font-medium">{couponCode} applied</span>
              <button onClick={removeCoupon} className="text-green-700 hover:text-green-900"><X size={14} /></button>
            </div>
          ) : (
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="input pl-8 !py-2 text-sm"
                />
              </div>
              <button onClick={handleApplyCoupon} disabled={applying} className="btn btn-outline btn-sm">{applying ? "..." : "Apply"}</button>
            </div>
          )}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{formatINR(subtotal)}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({couponCode})</span><span>-{formatINR(discountAmount)}</span></div>}
            <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span>{shipping === 0 ? "FREE" : formatINR(shipping)}</span></div>
          </div>
          <div className="border-t border-neutral-200 mt-3 pt-3 flex justify-between font-semibold">
            <span>Total</span><span>{formatINR(total)}</span>
          </div>
          <button onClick={() => navigate("/checkout")} className="btn btn-primary w-full mt-5">Proceed to Checkout</button>
          <Link to="/products" className="block text-center text-sm text-neutral-500 mt-3 hover:text-neutral-800">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
