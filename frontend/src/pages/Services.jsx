import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Search, SlidersHorizontal } from "lucide-react";
import api from "../lib/api";

export default function Services() {
  const [services, setServices] = useState([]);
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [maxPrice, setMaxPrice] = useState(30000);

  useEffect(() => { api.get("/services").then((r) => setServices(r.data)); }, []);

  const categories = useMemo(() => ["all", ...Array.from(new Set(services.map((s) => s.category)))], [services]);
  const filtered = services
    .filter((s) => cat === "all" || s.category === cat)
    .filter((s) => q === "" || `${s.title} ${s.short_desc} ${s.description}`.toLowerCase().includes(q.toLowerCase()))
    .filter((s) => s.price <= maxPrice);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="services-page">
      <div className="mb-10 animate-rise">
        <p className="text-[#14b8a6] text-sm tracking-widest uppercase mb-2">Our Services</p>
        <h1 className="font-display text-5xl sm:text-6xl">What We <span className="gradient-text">Craft</span></h1>
        <p className="text-white/60 mt-4 max-w-2xl">Hand-picked services designed to grow your brand, celebrate your moments, and launch your dreams.</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            placeholder="Search services..."
            value={q} onChange={(e) => setQ(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-full"
            data-testid="services-search"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <SlidersHorizontal size={14} /> Max ₹{maxPrice.toLocaleString("en-IN")}
        </div>
        <input
          type="range" min="500" max="30000" step="500" value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-40 accent-[#7c3aed]"
          data-testid="services-price-range"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-4 py-2 rounded-full text-sm border transition-all ${cat === c ? "bg-[#7c3aed] border-[#7c3aed] text-white" : "border-white/10 text-white/70 hover:border-[#7c3aed]/50"}`}
            data-testid={`services-filter-${c}`}
          >{c === "all" ? "All" : c}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((s) => (
          <div key={s.id} className="card-dark overflow-hidden group" data-testid={`service-card-${s.slug}`}>
            <div className="relative h-52 overflow-hidden">
              <img src={s.image} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#12121A] to-transparent" />
              <span className="absolute top-3 left-3 text-xs bg-[#7c3aed] px-3 py-1 rounded-full">{s.category}</span>
              {s.original_price && (
                <span className="absolute top-3 right-3 text-xs bg-[#14b8a6] text-[#05050A] px-3 py-1 rounded-full font-bold">
                  {Math.round((1 - s.price / s.original_price) * 100)}% OFF
                </span>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-display text-2xl mb-2">{s.title}</h3>
              <p className="text-white/60 text-sm mb-4 line-clamp-2">{s.short_desc}</p>
              <ul className="space-y-1 mb-4">
                {s.features.slice(0, 3).map((f) => (
                  <li key={f} className="text-xs text-white/70 flex items-center gap-2">
                    <Check size={12} className="text-[#14b8a6]" /> {f}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-2xl text-[#7c3aed]">₹{s.price.toLocaleString("en-IN")}</span>
                  {s.original_price && <span className="text-xs line-through text-white/40">₹{s.original_price.toLocaleString("en-IN")}</span>}
                </div>
                <Link to={`/services/${s.slug}`} className="btn-primary text-sm py-2 px-4" data-testid={`service-view-${s.slug}`}>
                  View <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-3 text-center text-white/50 py-20">No services match your filter.</div>}
      </div>
    </div>
  );
}
