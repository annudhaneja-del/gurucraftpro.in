import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Check, MessageCircle, ShoppingCart, ArrowLeft } from "lucide-react";
import api from "../lib/api";
import { useCart } from "../lib/cart";
import { toast } from "sonner";

export default function ServiceDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [s, setS] = useState(null);

  useEffect(() => {
    api.get(`/services/${slug}`).then((r) => setS(r.data)).catch(() => navigate("/services"));
  }, [slug, navigate]);

  if (!s) return <div className="min-h-[60vh] flex items-center justify-center text-white/60">Loading...</div>;

  const waMsg = s.whatsapp_message || `Hi, I'm interested in ${s.title}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" data-testid="service-detail">
      <Link to="/services" className="text-white/60 hover:text-white inline-flex items-center gap-1 text-sm mb-6"><ArrowLeft size={14} /> Back to services</Link>
      <div className="grid md:grid-cols-2 gap-10">
        <div className="rounded-2xl overflow-hidden card-dark">
          <img src={s.image} alt={s.title} className="w-full h-[480px] object-cover" />
        </div>
        <div>
          <span className="text-xs bg-[#7c3aed] px-3 py-1 rounded-full">{s.category}</span>
          <h1 className="font-display text-4xl sm:text-5xl mt-3" data-testid="service-title">{s.title}</h1>
          <p className="text-white/70 mt-4 leading-relaxed">{s.description || s.short_desc}</p>
          <div className="flex items-baseline gap-3 mt-6">
            <span className="font-display text-4xl text-[#7c3aed]">₹{s.price.toLocaleString("en-IN")}</span>
            {s.original_price && <span className="line-through text-white/40">₹{s.original_price.toLocaleString("en-IN")}</span>}
          </div>
          <ul className="mt-6 space-y-2">
            {s.features.map((f) => (
              <li key={f} className="text-white/80 flex items-center gap-2">
                <Check size={16} className="text-[#14b8a6]" /> {f}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 mt-8">
            <button
              onClick={() => { add({ item_id: s.id, item_type: "service", title: s.title, price: s.price }); toast.success("Added to cart"); }}
              className="btn-primary" data-testid="service-add-cart"
            >
              <ShoppingCart size={16} /> Add to Cart
            </button>
            <button
              onClick={() => { add({ item_id: s.id, item_type: "service", title: s.title, price: s.price }); navigate("/checkout"); }}
              className="btn-secondary" data-testid="service-buy-now"
            >
              Buy Now
            </button>
            <a href={`https://wa.me/918527837527?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noreferrer" className="btn-whatsapp" data-testid="service-whatsapp">
              <MessageCircle size={16} /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
