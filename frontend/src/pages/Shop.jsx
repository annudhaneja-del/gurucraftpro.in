import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "../lib/cart";
import { Search, ShoppingCart, Filter } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [maxPrice, setMaxPrice] = useState(5000);
  const { add, items, total, remove } = useCart();
  const navigate = useNavigate();

  useEffect(() => { api.get("/products").then((r) => setProducts(r.data)); }, []);
  const categories = useMemo(() => ["all", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
  const filtered = products.filter((p) =>
    (cat === "all" || p.category === cat) &&
    (q === "" || p.title.toLowerCase().includes(q.toLowerCase())) &&
    p.price <= maxPrice
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="shop-page">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <p className="text-[#14b8a6] text-sm tracking-widest uppercase mb-2">Digital Shop</p>
          <h1 className="font-display text-5xl">Digital Products</h1>
        </div>
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text" placeholder="Search products..."
            value={q} onChange={(e) => setQ(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl"
            data-testid="shop-search"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-[240px_1fr] gap-8">
        <aside className="card-dark p-5 h-fit sticky top-20">
          <div className="flex items-center gap-2 mb-4"><Filter size={14} /><span className="font-medium text-sm">Filters</span></div>
          <div className="mb-6">
            <p className="text-xs text-white/60 mb-2 uppercase tracking-wider">Category</p>
            <div className="space-y-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${cat === c ? "bg-[#7c3aed] text-white" : "hover:bg-white/5 text-white/70"}`}
                  data-testid={`shop-cat-${c}`}
                >{c === "all" ? "All" : c}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-2 uppercase tracking-wider">Max Price ₹{maxPrice}</p>
            <input type="range" min="0" max="5000" step="100" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[#7c3aed]" data-testid="shop-price-range" />
          </div>
        </aside>

        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {filtered.map((p) => (
              <div key={p.id} className="card-dark overflow-hidden group" data-testid={`shop-product-${p.id}`}>
                <div className="relative h-48 overflow-hidden">
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <span className="absolute top-3 left-3 text-xs bg-[#14b8a6] text-[#05050A] px-2 py-0.5 rounded-full font-bold">{p.category}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-medium line-clamp-1">{p.title}</h3>
                  <p className="text-xs text-white/60 mt-1 line-clamp-2 min-h-[32px]">{p.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <span className="font-display text-xl text-[#7c3aed]">₹{p.price}</span>
                      {p.original_price && <span className="text-xs line-through text-white/40 ml-2">₹{p.original_price}</span>}
                    </div>
                    <button
                      onClick={() => { add({ item_id: p.id, item_type: "product", title: p.title, price: p.price }); toast.success("Added to cart"); }}
                      className="text-xs bg-[#7c3aed] hover:bg-[#8b5cf6] px-3 py-1.5 rounded-full inline-flex items-center gap-1"
                      data-testid={`shop-add-${p.id}`}
                    ><ShoppingCart size={12} /> Add</button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="col-span-3 text-center text-white/50 py-20">No products match your filter.</div>}
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="fixed bottom-6 left-6 glass rounded-2xl p-4 border border-[#7c3aed]/40 z-40 w-80" data-testid="shop-cart-panel">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Cart ({items.length})</h4>
            <span className="font-display text-[#7c3aed]">₹{total}</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-auto mb-3">
            {items.map((i) => (
              <div key={i.item_id} className="flex justify-between text-xs">
                <span className="truncate">{i.title} × {i.qty}</span>
                <button onClick={() => remove(i.item_id)} className="text-red-400 ml-2">×</button>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/checkout")} className="btn-primary w-full justify-center text-sm" data-testid="shop-checkout">Checkout</button>
        </div>
      )}
    </div>
  );
}
