import React, { useState } from "react";
import { useCart } from "../lib/cart";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { CreditCard, MessageCircle, Tag, Trash2 } from "lucide-react";

export default function Checkout() {
  const { items, total, remove, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [discountPct, setDiscountPct] = useState(0);
  const [info, setInfo] = useState({
    name: user?.name || "", email: user?.email || "", phone: user?.phone || "",
  });
  const [processing, setProcessing] = useState(false);

  const discount = total * (discountPct / 100);
  const payable = Math.max(0, total - discount);

  const applyCoupon = async () => {
    try {
      const r = await api.get(`/coupons/validate`, { params: { code: coupon } });
      setDiscountPct(r.data.percent);
      toast.success(`Applied ${r.data.percent}% off`);
    } catch {
      toast.error("Invalid coupon");
      setDiscountPct(0);
    }
  };

  const placeOrder = async () => {
    if (items.length === 0) { toast.error("Cart empty"); return; }
    if (!info.name || !info.email || !info.phone) { toast.error("Please fill all fields"); return; }
    setProcessing(true);
    try {
      // Create order
      const orderRes = await api.post("/orders", {
        items: items.map(i => ({ item_id: i.item_id, item_type: i.item_type, title: i.title, price: i.price, qty: i.qty })),
        coupon_code: discountPct > 0 ? coupon : null,
        customer_name: info.name, customer_email: info.email, customer_phone: info.phone,
      });
      const order = orderRes.data;
      // Get payment config
      const cfg = await api.get("/payments/config");
      const rzpOrder = await api.post("/payments/create-order", { amount: order.total, order_id: order.id });

      if (cfg.data.enabled && rzpOrder.data.key_id && window.Razorpay) {
        const options = {
          key: cfg.data.key_id,
          amount: rzpOrder.data.amount,
          currency: "INR",
          name: "GurucraftPro",
          description: items.map(i => i.title).join(", "),
          order_id: rzpOrder.data.razorpay_order_id,
          handler: async (resp) => {
            await api.post("/payments/verify", {
              order_id: order.id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            toast.success("Payment successful!");
            clear();
            const msg = `Order ${order.id.slice(0, 8)} confirmed · ₹${order.total} · Thanks!`;
            window.open(`https://wa.me/918527837527?text=${encodeURIComponent(msg)}`, "_blank");
            navigate("/dashboard");
          },
          prefill: { name: info.name, email: info.email, contact: info.phone },
          theme: { color: "#7c3aed" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Mock flow
        await api.post("/payments/verify", {
          order_id: order.id,
          razorpay_order_id: rzpOrder.data.razorpay_order_id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: "mock",
        });
        toast.success("Order placed (mock payment) — we'll contact you on WhatsApp");
        clear();
        const msg = `New order placed! Order: ${order.id.slice(0, 8)} · Amount: ₹${order.total} · Items: ${items.map(i => i.title).join(", ")}`;
        window.open(`https://wa.me/918527837527?text=${encodeURIComponent(msg)}`, "_blank");
        navigate("/dashboard");
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Order failed");
    } finally { setProcessing(false); }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-16" data-testid="checkout-page">
      <h1 className="font-display text-5xl mb-8">Checkout</h1>
      {items.length === 0 ? (
        <div className="card-dark p-8 text-center text-white/60">Your cart is empty. <button onClick={() => navigate("/shop")} className="text-[#14b8a6]">Browse shop →</button></div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="card-dark p-6">
            <h2 className="font-display text-2xl mb-4">Items ({items.length})</h2>
            <div className="space-y-3 mb-4">
              {items.map((i) => (
                <div key={i.item_id} className="flex items-center justify-between pb-3 border-b border-white/5" data-testid={`checkout-item-${i.item_id}`}>
                  <div>
                    <p className="font-medium text-sm">{i.title}</p>
                    <p className="text-xs text-white/50">{i.item_type} × {i.qty}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-[#7c3aed]">₹{i.price * i.qty}</span>
                    <button onClick={() => remove(i.item_id)} className="text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Tag size={14} className="text-white/40" />
              <input placeholder="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value)} className="flex-1 px-3 py-2 rounded text-sm" data-testid="checkout-coupon" />
              <button onClick={applyCoupon} className="btn-secondary text-sm py-2 px-4" data-testid="checkout-apply-coupon">Apply</button>
            </div>
            <div className="mt-6 space-y-2 pt-4 border-t border-white/10 text-sm">
              <div className="flex justify-between"><span className="text-white/60">Subtotal</span><span>₹{total}</span></div>
              {discountPct > 0 && <div className="flex justify-between text-[#14b8a6]"><span>Discount ({discountPct}%)</span><span>-₹{discount.toFixed(0)}</span></div>}
              <div className="flex justify-between text-lg font-display pt-2 border-t border-white/10"><span>Total</span><span className="text-[#7c3aed]">₹{payable.toFixed(0)}</span></div>
            </div>
          </div>

          <div className="card-dark p-6">
            <h2 className="font-display text-2xl mb-4">Your Info</h2>
            <div className="space-y-3">
              <input placeholder="Full Name" value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} className="w-full px-4 py-3 rounded-lg" data-testid="checkout-name" />
              <input placeholder="Email" type="email" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} className="w-full px-4 py-3 rounded-lg" data-testid="checkout-email" />
              <input placeholder="Phone" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} className="w-full px-4 py-3 rounded-lg" data-testid="checkout-phone" />
            </div>
            <button onClick={placeOrder} disabled={processing} className="btn-primary w-full justify-center mt-6" data-testid="checkout-pay">
              <CreditCard size={16} /> {processing ? "Processing..." : `Pay ₹${payable.toFixed(0)}`}
            </button>
            <p className="text-xs text-white/50 text-center mt-3">Supports UPI, Cards, Wallets via Razorpay</p>
            <div className="border-t border-white/10 my-4" />
            <a
              href={`https://wa.me/918527837527?text=${encodeURIComponent(`Hi, I want to order: ${items.map(i => i.title).join(", ")} — Total ₹${payable.toFixed(0)}`)}`}
              target="_blank" rel="noreferrer" className="btn-whatsapp w-full justify-center" data-testid="checkout-whatsapp"
            >
              <MessageCircle size={16} /> Order via WhatsApp Instead
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
