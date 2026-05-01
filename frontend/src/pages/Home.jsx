import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle, Phone, Sparkles, Star, Check, MapPin, Clock, Zap, Palette, ShoppingBag, GraduationCap, Heart } from "lucide-react";
import api from "../lib/api";

const HERO_IMG = "https://customer-assets.emergentagent.com/job_a9385893-2db1-4c60-9d30-98a00b2907c1/artifacts/1z5p7qlm_tmp_8573562d-5d66-4082-af3e-8a6292a431ad.jpeg";

const STATS = [
  { label: "Clients Served", value: "500+", color: "#7c3aed" },
  { label: "Orders Completed", value: "1,200+", color: "#14b8a6" },
  { label: "Fast Response", value: "< 5 min", color: "#25D366" },
  { label: "Years Experience", value: "7+", color: "#f59e0b" },
];

export default function Home() {
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    api.get("/services").then((r) => setServices(r.data.slice(0, 6)));
    api.get("/testimonials").then((r) => setTestimonials(r.data));
    api.get("/gallery").then((r) => setGallery(r.data));
  }, []);

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative min-h-[92vh] overflow-hidden" data-testid="home-hero">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute inset-0 radial-purple" />
        <img src={HERO_IMG} alt="Neon Studio" className="absolute right-0 top-0 w-full md:w-[60%] h-full object-cover opacity-40 md:opacity-60 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05050A] via-[#05050A]/80 to-transparent" />

        {/* Floating design tool badges */}
        <div className="absolute top-28 left-[8%] animate-floaty hidden lg:block">
          <div className="glass px-4 py-3 rounded-2xl flex items-center gap-2 neon-purple">
            <Palette size={16} className="text-[#7c3aed]" />
            <span className="text-sm">Design Studio</span>
          </div>
        </div>
        <div className="absolute top-48 right-[12%] animate-floaty hidden lg:block" style={{ animationDelay: "1.5s" }}>
          <div className="glass px-4 py-3 rounded-2xl flex items-center gap-2 neon-teal">
            <Sparkles size={16} className="text-[#14b8a6]" />
            <span className="text-sm">AI-Ready</span>
          </div>
        </div>
        <div className="absolute bottom-36 left-[18%] animate-floaty hidden lg:block" style={{ animationDelay: "0.8s" }}>
          <div className="glass px-4 py-3 rounded-2xl flex items-center gap-2">
            <MessageCircle size={16} className="text-[#25D366]" />
            <span className="text-sm">WhatsApp in 5 min</span>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 min-h-[92vh] flex flex-col justify-center">
          <div className="max-w-3xl animate-rise">
            <div className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs text-white/80 mb-6" data-testid="home-badge">
              <MapPin size={12} className="text-[#14b8a6]" /> Rohini, Delhi
              <span className="w-1 h-1 bg-white/30 rounded-full" />
              <Clock size={12} /> 8 AM – 8 PM
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] mb-6" data-testid="home-hero-title">
              Creative designs &<br />
              <span className="gradient-text">digital services</span>
              <br />tailored for every need
            </h1>
            <p className="text-lg text-white/70 max-w-xl mb-8 animate-rise delay-100" data-testid="home-hero-subtitle">
              From wedding invites and Guruji frames to complete e-commerce stores, AI prompts and Canva-style design tools — GurucraftPro is your one-stop creative studio.
            </p>
            <div className="flex flex-wrap gap-3 animate-rise delay-200">
              <a
                href="https://wa.me/918527837527?text=Hi%2C%20I%20want%20GurucraftPro"
                target="_blank" rel="noreferrer"
                className="btn-whatsapp" data-testid="home-hero-whatsapp"
              >
                <MessageCircle size={18} /> Chat on WhatsApp
              </a>
              <Link to="/services" className="btn-primary" data-testid="home-hero-services">
                Explore Services <ArrowRight size={16} />
              </Link>
              <Link to="/studio" className="btn-secondary" data-testid="home-hero-studio">
                <Palette size={16} /> Design Studio
              </Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl animate-rise delay-300">
            {STATS.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-4" data-testid={`home-stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="font-display text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-white/60 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES GRID — Tetris Bento */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24" data-testid="home-services">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <p className="text-[#14b8a6] text-sm tracking-widest uppercase mb-2">What we do</p>
            <h2 className="font-display text-4xl sm:text-5xl">Services Made to Move Your Brand</h2>
          </div>
          <Link to="/services" className="text-white/70 hover:text-white inline-flex items-center gap-1 text-sm">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
          {services.map((s, i) => {
            const layout = [
              "md:col-span-4 md:row-span-2", "md:col-span-2",
              "md:col-span-2", "md:col-span-2",
              "md:col-span-3", "md:col-span-3",
            ][i] || "md:col-span-2";
            const tall = i === 0;
            return (
              <Link
                to={`/services/${s.slug}`}
                key={s.id}
                className={`card-dark group relative overflow-hidden ${layout} ${tall ? "min-h-[400px]" : "min-h-[220px]"}`}
                data-testid={`home-service-${s.slug}`}
              >
                <img src={s.image} alt={s.title} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-[#05050A]/70 to-transparent" />
                <div className="relative p-6 h-full flex flex-col justify-end">
                  <span className="text-xs text-[#14b8a6] tracking-wider uppercase">{s.category}</span>
                  <h3 className="font-display text-2xl md:text-3xl mt-1">{s.title}</h3>
                  <p className="text-sm text-white/70 mt-2 line-clamp-2">{s.short_desc}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-2xl text-[#7c3aed]">₹{s.price.toLocaleString("en-IN")}</span>
                      {s.original_price && <span className="text-xs line-through text-white/40">₹{s.original_price.toLocaleString("en-IN")}</span>}
                    </div>
                    <ArrowRight className="text-white/60 group-hover:text-[#14b8a6] group-hover:translate-x-1 transition-all" size={18} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FEATURE STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" data-testid="home-features">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Palette, title: "Canva-style Studio", color: "#7c3aed" },
            { icon: ShoppingBag, title: "Digital Shop", color: "#14b8a6" },
            { icon: GraduationCap, title: "Learning Hub", color: "#f59e0b" },
            { icon: Heart, title: "Guruji Artworks", color: "#ec4899" },
          ].map((f) => {
            const Ic = f.icon;
            return (
              <div key={f.title} className="card-dark p-5 flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ background: `${f.color}22`, color: f.color }}>
                  <Ic size={20} />
                </div>
                <span className="text-sm">{f.title}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* GALLERY PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24" data-testid="home-gallery">
        <div className="mb-10">
          <p className="text-[#14b8a6] text-sm tracking-widest uppercase mb-2">Portfolio</p>
          <h2 className="font-display text-4xl sm:text-5xl">Our Recent Work</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gallery.slice(0, 8).map((g, i) => (
            <div key={g.id} className={`relative group overflow-hidden rounded-xl card-dark ${i === 0 || i === 5 ? "md:row-span-2 md:col-span-2" : ""}`}>
              <img src={g.image} alt={g.title} loading="lazy" className="w-full h-full object-cover aspect-square group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />
              <div className="absolute bottom-3 left-3 text-sm font-medium">{g.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24" data-testid="home-testimonials">
        <p className="text-[#14b8a6] text-sm tracking-widest uppercase mb-2">Loved by locals</p>
        <h2 className="font-display text-4xl sm:text-5xl mb-10">What Our Clients Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.map((t) => (
            <div key={t.id} className="card-dark p-6" data-testid={`home-testimonial-${t.id}`}>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={14} className="fill-[#f59e0b] text-[#f59e0b]" />)}
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div className="border-t border-white/10 pt-3">
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-white/50">{t.location}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="home-cta">
        <div className="glass rounded-3xl p-10 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 radial-purple opacity-70" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-3xl md:text-5xl mb-3">Ready to start your project?</h2>
              <p className="text-white/70 max-w-xl">Chat with Annu ji on WhatsApp for instant quote & free consultation.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="tel:+918527837527" className="btn-secondary" data-testid="home-cta-call">
                <Phone size={16} /> Call Now
              </a>
              <a href="https://wa.me/918527837527?text=Hi%2C%20I%20want%20to%20start%20a%20project" target="_blank" rel="noreferrer" className="btn-whatsapp" data-testid="home-cta-whatsapp">
                <MessageCircle size={16} /> WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
