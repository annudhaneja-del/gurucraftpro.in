import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { BookOpen, Sparkles, FileText, Download, Lock } from "lucide-react";
import { useCart } from "../lib/cart";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const TYPE_ICON = { pdf: FileText, course: BookOpen, prompt: Sparkles };
const TYPE_COLOR = { pdf: "#14b8a6", course: "#7c3aed", prompt: "#f59e0b" };

export default function Learn() {
  const [items, setItems] = useState([]);
  const { add } = useCart();
  const navigate = useNavigate();

  useEffect(() => { api.get("/learning").then((r) => setItems(r.data)); }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="learn-page">
      <div className="mb-10 animate-rise">
        <p className="text-[#14b8a6] text-sm tracking-widest uppercase mb-2">Learning Hub</p>
        <h1 className="font-display text-5xl">Learn. <span className="gradient-text">Create. Grow.</span></h1>
        <p className="text-white/60 mt-4 max-w-xl">PDF guides, AI prompt packs, and self-paced courses — free & premium.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((l) => {
          const Ic = TYPE_ICON[l.type] || FileText;
          const color = TYPE_COLOR[l.type] || "#7c3aed";
          return (
            <div key={l.id} className="card-dark overflow-hidden group" data-testid={`learn-${l.id}`}>
              <div className="relative h-48 overflow-hidden">
                <img src={l.image} alt={l.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12121A] to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: color + "22", color }}>
                  <Ic size={12} /> {l.type.toUpperCase()}
                </div>
                {l.is_free && <span className="absolute top-3 right-3 text-xs bg-[#25D366] text-white px-2 py-0.5 rounded-full">FREE</span>}
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl mb-2">{l.title}</h3>
                <p className="text-white/60 text-sm mb-4 line-clamp-2">{l.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg" style={{ color }}>
                    {l.is_free ? "Free" : `₹${l.price}`}
                  </span>
                  {l.is_free ? (
                    <button onClick={() => toast.info("Login required to download (coming soon)")} className="btn-secondary text-sm py-2 px-4" data-testid={`learn-download-${l.id}`}>
                      <Download size={14} /> Access
                    </button>
                  ) : (
                    <button
                      onClick={() => { add({ item_id: l.id, item_type: "learning", title: l.title, price: l.price }); toast.success("Added to cart"); navigate("/checkout"); }}
                      className="btn-primary text-sm py-2 px-4"
                      data-testid={`learn-buy-${l.id}`}
                    >
                      <Lock size={14} /> Unlock
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
