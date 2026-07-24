import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Smartphone, CreditCard } from "lucide-react";
import { useCartStore } from "../../store/cartStore";
import { useCatalogStore } from "../../store/catalogStore";
import { useAuthStore } from "../../store/authStore";
import { useOrdersStore } from "../../store/ordersStore";
import { useCMSStore } from "../../store/cmsStore";
import { useToastStore } from "../../store/toastStore";
import ProductImage from "../../components/customer/ProductImage";
import { formatINR } from "../../lib/format";
import type { Order, OrderItem } from "../../data/types";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { loadRazorpayScript, openRazorpayCheckout } from "../../lib/razorpay";
import { useSEO } from "../../lib/useSEO";

export default function Checkout() {
  useSEO({ title: "Checkout", index: false });

  const { lines, clear, couponCode, discountAmount } = useCartStore();
  const { products } = useCatalogStore();
  const user = useAuthStore((s) => s.user);
  const addOrder = useOrdersStore((s) => s.addOrder);
  const settings = useCMSStore((s) => s.settings);
  const showToast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const razorpayEnabled = Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID);

  const [form, setForm] = useState({
    name: user?.fullName || "", phone: user?.phone || "", email: user?.email || "",
    line1: "", line2: "", city: "", state: "Maharashtra", pincode: "",
  });
  const [payment, setPayment] = useState<Order["paymentMethod"]>("cod");
  const [placing, setPlacing] = useState(false);

  const items = lines.map((l) => ({ line: l, product: products.find((p) => p.id === l.productId) })).filter((i) => i.product);
  const subtotal = items.reduce((s, i) => s + i.product!.price * i.line.quantity, 0);
  const shipping = subtotal - discountAmount >= settings.freeShippingThreshold ? 0 : settings.standardShippingCharge;
  const codCharge = payment === "cod" && settings.codAvailable ? settings.codCharge : 0;
  const total = subtotal - discountAmount + shipping + codCharge;

  function updateField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function placeOrderMock() {
    const orderItems: OrderItem[] = items.map((i) => ({
      productId: i.product!.id,
      productName: i.product!.name,
      brand: i.product!.brand,
      sku: i.product!.sku,
      size: i.line.size,
      color: i.line.color,
      unitPrice: i.product!.price,
      originalPrice: i.product!.originalPrice,
      quantity: i.line.quantity,
      photo: i.product!.images[0],
    }));
    const orderId = `order-${Date.now()}`;
    const now = new Date().toISOString();
    const order: Order = {
      id: orderId,
      orderNumber: `UK-${Math.floor(20260000 + Math.random() * 9999)}`,
      customerId: user?.id || null,
      guestEmail: user ? undefined : form.email,
      guestPhone: user ? undefined : form.phone,
      shippingName: form.name,
      shippingPhone: form.phone,
      shippingLine1: form.line1,
      shippingLine2: form.line2,
      shippingCity: form.city,
      shippingState: form.state,
      shippingPincode: form.pincode,
      items: orderItems,
      subtotal,
      discountAmount,
      shippingCharge: shipping,
      codCharge,
      total,
      paymentMethod: payment,
      paymentStatus: payment === "cod" ? "pending" : "paid",
      couponCode: couponCode || undefined,
      status: "confirmed",
      createdAt: now,
      updatedAt: now,
      statusHistory: [{ status: "pending", at: now }, { status: "confirmed", at: now }],
    };
    await new Promise((r) => setTimeout(r, 700));
    addOrder(order);
    clear();
    showToast("Order placed successfully!", "success");
    navigate(`/order-success/${orderId}`);
  }

  function buildOrderPayload() {
    return {
      p_customer_id: user?.id || null,
      p_guest_email: user ? null : form.email,
      p_guest_phone: user ? null : form.phone,
      p_shipping: { name: form.name, phone: form.phone, line1: form.line1, line2: form.line2, city: form.city, state: form.state, pincode: form.pincode },
      p_items: items.map((i) => ({
        product_id: i.product!.id,
        product_name: i.product!.name,
        brand: i.product!.brand,
        sku: i.product!.sku,
        size: i.line.size,
        color: i.line.color,
        unit_price: i.product!.price,
        original_price: i.product!.originalPrice,
        quantity: i.line.quantity,
        photo_url: i.product!.images[0],
      })),
      p_payment_method: payment,
      p_coupon_code: couponCode,
      p_razorpay_order_id: null as string | null,
    };
  }

  async function placeOrderReal() {
    if (payment === "cod") {
      const { data: order, error } = await supabase.rpc("place_order", buildOrderPayload());
      if (error) throw error;
      clear();
      showToast("Order placed successfully!", "success");
      navigate(`/order-success/${order.id}`);
      return;
    }

    // Razorpay flow for upi/online — order is only created server-side after
    // the payment signature is verified (see verify-razorpay-payment function).
    if (!razorpayEnabled) {
      throw new Error("Online payments are not enabled yet. Please choose Cash on Delivery.");
    }

    const { data: rzpOrder, error: rzpError } = await supabase.functions.invoke("create-razorpay-order", {
      body: { amount: total, receipt: `ord_${Date.now()}` },
    });
    if (rzpError || rzpOrder?.error) throw new Error(rzpOrder?.error || rzpError?.message || "Could not start payment");

    await loadRazorpayScript();

    openRazorpayCheckout({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      order_id: rzpOrder.id,
      name: settings.brandName,
      description: `Order for ${items.length} item(s)`,
      prefill: { name: form.name, contact: form.phone, email: form.email || user?.email },
      theme: { color: settings.primaryColor },
      handler: async (response) => {
        try {
          const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-razorpay-payment", {
            body: { ...response, order_payload: buildOrderPayload() },
          });
          if (verifyError || verifyData?.error) throw new Error(verifyData?.error || verifyError?.message || "Payment verification failed");
          clear();
          showToast("Payment successful — order placed!", "success");
          navigate(`/order-success/${verifyData.order.id}`);
        } catch (err) {
          showToast(err instanceof Error ? err.message : "Payment verification failed", "error");
        } finally {
          setPlacing(false);
        }
      },
      modal: { ondismiss: () => setPlacing(false) },
    });
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    setPlacing(true);
    try {
      if (isSupabaseConfigured) {
        await placeOrderReal();
        // Razorpay flow resolves `placing` inside its own handler/dismiss callback
        if (payment === "cod") setPlacing(false);
      } else {
        await placeOrderMock();
        setPlacing(false);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not place order", "error");
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-neutral-500">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-display text-3xl sm:text-4xl mb-6">Checkout</h1>
      <form onSubmit={placeOrder} className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="font-semibold mb-4">Shipping Address</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Full Name</label>
                <input required value={form.name} onChange={(e) => updateField("name", e.target.value)} className="input" />
              </div>
              <div>
                <label className="field-label">Phone Number</label>
                <input required value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="input" />
              </div>
              {!user && (
                <div className="sm:col-span-2">
                  <label className="field-label">Email (for order updates)</label>
                  <input required type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="input" />
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="field-label">Address Line 1</label>
                <input required value={form.line1} onChange={(e) => updateField("line1", e.target.value)} className="input" placeholder="House no, Street, Area" />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">Address Line 2 (optional)</label>
                <input value={form.line2} onChange={(e) => updateField("line2", e.target.value)} className="input" placeholder="Landmark" />
              </div>
              <div>
                <label className="field-label">City</label>
                <input required value={form.city} onChange={(e) => updateField("city", e.target.value)} className="input" />
              </div>
              <div>
                <label className="field-label">State</label>
                <select value={form.state} onChange={(e) => updateField("state", e.target.value)} className="select">
                  {["Maharashtra", "Karnataka", "Delhi", "Gujarat", "Rajasthan", "Telangana"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Pincode</label>
                <input required value={form.pincode} onChange={(e) => updateField("pincode", e.target.value)} className="input" maxLength={6} />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold mb-4">Payment Method</h3>
            <div className="space-y-2.5">
              {([
                { id: "cod", label: "Cash on Delivery", desc: `Pay ₹${settings.codCharge} extra on delivery`, icon: Wallet, disabled: !settings.codAvailable },
                { id: "upi", label: "UPI", desc: razorpayEnabled ? "Pay via Google Pay, PhonePe, Paytm" : "Scanner payment coming soon", icon: Smartphone, disabled: !razorpayEnabled },
                { id: "online", label: "Card / Net Banking", desc: razorpayEnabled ? "Secure payment gateway" : "Online payments coming soon", icon: CreditCard, disabled: !razorpayEnabled },
              ] as const).map((opt) => (
                <label key={opt.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${payment === opt.id ? "border-[var(--color-primary)] bg-orange-50/40" : "border-neutral-200"} ${opt.disabled ? "opacity-40 cursor-not-allowed" : ""}`}>
                  <input type="radio" checked={payment === opt.id} disabled={opt.disabled} onChange={() => setPayment(opt.id)} className="accent-[var(--color-primary)]" />
                  <opt.icon size={18} className="text-neutral-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-neutral-500">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5 h-fit">
          <h3 className="font-semibold mb-4">Order Summary</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
            {items.map(({ line, product }) => (
              <div key={`${line.productId}-${line.size}`} className="flex gap-3">
                <div className="w-14 h-14 bg-neutral-50 rounded-lg overflow-hidden shrink-0">
                  <ProductImage src={product!.images[0]} alt={product!.name} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-clamp-1">{product!.name}</p>
                  <p className="text-[11px] text-neutral-500">Size {line.size} · Qty {line.quantity}</p>
                </div>
                <span className="text-xs font-semibold">{formatINR(product!.price * line.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm border-t border-neutral-200 pt-3">
            <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{formatINR(subtotal)}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount ({couponCode})</span><span>-{formatINR(discountAmount)}</span></div>}
            <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span>{shipping === 0 ? "FREE" : formatINR(shipping)}</span></div>
            {codCharge > 0 && <div className="flex justify-between"><span className="text-neutral-500">COD Charge</span><span>{formatINR(codCharge)}</span></div>}
          </div>
          <div className="border-t border-neutral-200 mt-3 pt-3 flex justify-between font-semibold">
            <span>Total</span><span>{formatINR(total)}</span>
          </div>
          <button disabled={placing} className="btn btn-primary w-full mt-5">
            {placing ? "Placing Order..." : `Place Order · ${formatINR(total)}`}
          </button>
        </div>
      </form>
    </div>
  );
}
