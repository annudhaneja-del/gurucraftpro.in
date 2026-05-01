import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, MessageCircle, Phone, Sparkles, Star, MapPin, Clock,
  Palette, ShoppingBag, GraduationCap, Heart, Award, Zap, Users, ShieldCheck,
  Instagram, ChevronRight, Play
} from "lucide-react";
import api from "../lib/api";

const HERO_IMG = "https://customer-assets.emergentagent.com/job_a9385893-2db1-4c60-9d30-98a00b2907c1/artifacts/1z5p7qlm_tmp_8573562d-5d66-4082-af3e-8a6292a431ad.jpeg";
const GURUJI_IMG = "https://customer-assets.emergentagent.com/job_craftpro-services/artifacts/qfqd193x_tmp_8573562d-5d66-4082-af3e-8a6292a431ad.jpeg";
const LOGO = "https://customer-assets.emergentagent.com/job_a9385893-2db1-4c60-9d30-98a00b2907c1/artifacts/31j8kh2p_tmp_4c1cc7d1-61c9-4235-b652-ccc5ce1cff98.jpeg";

const STATS = [
  { label: "Clients Served", value: 500, suffix: "+", color: "#7c3aed", icon: Users },
  { label: "Orders Completed", value: 1200, suffix: "+", color: "#14b8a6", icon: Award },
  { label: "Response Time", value: 5, suffix: " min", color: "#25D366", icon: Zap },
  { label: "Years Experience", value: 7, suffix: "+", color: "#f59e0b", icon: ShieldCheck },
];

const MARQUEE_ITEMS = [
  "Wedding Invites", "Guruji Frames", "E-commerce Stores", "Canva Templates",
  "Logo Design", "Brand Identity", "AI Prompt Packs", "Product Photography",
  "Social Media Kits", "Learning Courses",
];

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal-on-scroll");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("revealed"); });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function Counter({ value, suffix, duration = 1800 }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setN(Math.floor(eased * value));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [value, duration]);
  return <span ref={ref}>{n.toLocaleString("en-IN")}{suffix}</span>;
}

export default function Home() {
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [parY, setParY] = useState(0);

  useEffect(() => {
    api.get("/services").then((r) => setServices(r.data.slice(0, 6)));
    api.get("/testimonials").then((r) => setTestimonials(r.data));
    api.get("/gallery").then((r) => setGallery(r.data));
  }, []);

  useEffect(() => {
    const onScroll = () => setParY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useReveal();

  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative min-h-[92vh] overflow-hidden" data-testid="home-hero">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute inset-0 radial-purple" />
        <img
          src={HERO_IMG}
          alt="Neon Studio"
          className="absolute right-0 top-0 w-full md:w-[60%] h-full object-cover opacity-40 md:opacity-55 mix-blend-luminosity parallax-slow"
          style={{ transform: `translateY(${parY * 0.25}px)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05050A] via-[#05050A]/85 to-[#05050A]/20" />

        {/* Floating design tool badges */}
        <div className="absolute top-28 left-[8%] animate-floaty hidden lg:block">
          <div className="glass px-4 py-3 rounded-2xl flex items-center gap-2 neon-purple animate-glow-pulse">
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
        <div className="absolute top-1/3 right-[5%] hidden lg:block">
          <div className="w-24 h-24 rounded-full border border-[#7c3aed]/30 animate-spin-slow flex items-center justify-center">
            <img src={LOGO} alt="" className="w-14 h-14 rounded-lg object-cover logo-glow" />
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 min-h-[92vh] flex flex-col justify-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs text-white/80 mb-6 animate-rise" data-testid="home-badge">
              <MapPin size={12} className="text-[#14b8a6]" /> Rohini, Delhi
              <span className="w-1 h-1 bg-white/30 rounded-full" />
              <Clock size={12} /> 8 AM – 8 PM
              <span className="w-1 h-1 bg-white/30 rounded-full" />
              <span className="text-[#25D366]">● LIVE</span>
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] mb-6 animate-rise delay-100" data-testid="home-hero-title">
              Creative designs &<br />
              <span className="shimmer-text">digital services</span>
              <br />tailored for every need
            </h1>
            <p className="text-lg text-white/70 max-w-xl mb-8 animate-rise delay-200">
              From wedding invites and Guruji frames to complete e-commerce stores, AI prompts and Canva-style design tools — GurucraftPro is your one-stop creative studio in Rohini, Delhi.
            </p>
            <div className="flex flex-wrap gap-3 animate-rise delay-300">
              <a href="https://wa.me/918527837527?text=Hi%2C%20I%20want%20GurucraftPro" target="_blank" rel="noreferrer" className="btn-whatsapp" data-testid="home-hero-whatsapp">
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

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl animate-rise delay-400">
            {STATS.map((s) => {
              const Ic = s.icon;
              return (
                <div key={s.label} className="glass rounded-2xl p-4 hover:border-[#7c3aed]/50 transition-colors group" data-testid={`home-stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <Ic size={16} className="mb-2 opacity-70" style={{ color: s.color }} />
                  <div className="font-display text-3xl font-bold" style={{ color: s.color }}>
                    <Counter value={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-xs text-white/60 mt-1">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MARQUEE STRIP */}
      <section className="py-6 border-y border-white/10 overflow-hidden bg-[#0a0a12]">
        <div className="flex gap-10 whitespace-nowrap animate-marquee">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <Sparkles size={14} className="text-[#14b8a6]" />
              <span className="font-display text-2xl md:text-3xl text-white/30 hover:text-white transition-colors">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* MEET ANNU JI / ABOUT SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24" data-testid="home-about">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative reveal-on-scroll">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#7c3aed]/30 to-[#14b8a6]/30 blur-3xl rounded-full" />
            <div className="relative aspect-square overflow-hidden rounded-3xl card-dark animate-glow-pulse">
              <img src={GURUJI_IMG} alt="Guruji" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05050A]/60 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-xs text-white/60 uppercase tracking-widest">Divine Blessings</p>
                <p className="font-display text-2xl mt-1">Jai Guruji</p>
              </div>
              <span className="absolute top-5 right-5 glass px-3 py-1 rounded-full text-xs">✨ Guruji Art Works</span>
            </div>
            <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full border-2 border-[#14b8a6]/40 animate-spin-slow hidden md:flex items-center justify-center">
              <p className="font-display text-sm text-[#14b8a6] tracking-widest">BLESSED</p>
            </div>
          </div>

          <div className="reveal-on-scroll">
            <p className="text-[#14b8a6] text-sm tracking-widest uppercase mb-3">About the Studio</p>
            <h2 className="font-display text-4xl sm:text-5xl mb-6">
              Crafted with love by <span className="gradient-text">Annu Dhaneja</span>
            </h2>
            <p className="text-white/70 leading-relaxed mb-4">
              For over 7 years, GurucraftPro has been Rohini's go-to creative studio — blending traditional Indian aesthetics with cutting-edge digital craft. From intimate wedding invites to complete e-commerce empires, every project carries the same promise: premium quality, personal touch, divine blessings.
            </p>
            <p className="text-white/70 leading-relaxed mb-6">
              Whether you need a spiritual Guruji frame for your home mandir, a Canva-style design tool for your business, or a full D2C store launch — we bring craftsmanship, technology, and heart together.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { icon: Heart, text: "100% Hand-crafted" },
                { icon: Zap, text: "24hr Delivery" },
                { icon: ShieldCheck, text: "Money-back Guarantee" },
                { icon: Award, text: "7+ Yrs Experience" },
              ].map((f) => {
                const Ic = f.icon;
                return (
                  <div key={f.text} className="flex items-center gap-2 text-sm text-white/80">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#7c3aed]/15 text-[#7c3aed]"><Ic size={14} /></div>
                    {f.text}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3">
              <a href="https://wa.me/918527837527?text=Hi%20Annu%20ji%2C%20I%20want%20to%20talk" target="_blank" rel="noreferrer" className="btn-whatsapp text-sm">
                <MessageCircle size={16} /> Talk to Annu ji
              </a>
              <Link to="/services" className="btn-secondary text-sm">View Services <ChevronRight size={14} /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES GRID — Tetris Bento */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24" data-testid="home-services">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 reveal-on-scroll">
          <div>
            <p className="text-[#14b8a6] text-sm tracking-widest uppercase mb-2">What we do</p>
            <h2 className="font-display text-4xl sm:text-5xl">Services Made to <span className="gradient-text">Move Your Brand</span></h2>
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
                className={`card-dark group relative overflow-hidden ${layout} ${tall ? "min-h-[440px]" : "min-h-[240px]"} reveal-on-scroll`}
                style={{ transitionDelay: `${i * 80}ms` }}
                data-testid={`home-service-${s.slug}`}
              >
                <img src={s.image} alt={s.title} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-[#05050A]/70 to-transparent" />
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all">
                  <ArrowRight size={16} className="text-[#14b8a6]" />
                </div>
                <div className="relative p-6 h-full flex flex-col justify-end">
                  <span className="text-xs text-[#14b8a6] tracking-wider uppercase">{s.category}</span>
                  <h3 className="font-display text-2xl md:text-3xl mt-1">{s.title}</h3>
                  <p className="text-sm text-white/70 mt-2 line-clamp-2">{s.short_desc}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-2xl text-[#7c3aed]">₹{s.price.toLocaleString("en-IN")}</span>
                      {s.original_price && <span className="text-xs line-through text-white/40">₹{s.original_price.toLocaleString("en-IN")}</span>}
                    </div>
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
          ].map((f, i) => {
            const Ic = f.icon;
            return (
              <div key={f.title} className="card-dark p-5 flex items-center gap-3 reveal-on-scroll" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="w-11 h-11 rounded-lg flex items-center justify-center transition-transform hover:rotate-6 hover:scale-110" style={{ background: `${f.color}22`, color: f.color }}>
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
        <div className="mb-10 reveal-on-scroll">
          <p className="text-[#14b8a6] text-sm tracking-widest uppercase mb-2">Portfolio</p>
          <h2 className="font-display text-4xl sm:text-5xl">Our Recent <span className="gradient-text">Work</span></h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gallery.slice(0, 8).map((g, i) => (
            <div
              key={g.id}
              className={`relative group overflow-hidden rounded-xl card-dark reveal-on-scroll ${i === 0 || i === 5 ? "md:row-span-2 md:col-span-2" : ""}`}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <img src={g.image} alt={g.title} loading="lazy" className="w-full h-full object-cover aspect-square group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-transparent to-transparent opacity-70 group-hover:opacity-95 transition-opacity" />
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between translate-y-2 group-hover:translate-y-0 transition-transform">
                <div className="text-sm font-medium">{g.title}</div>
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight size={14} className="text-[#14b8a6]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24" data-testid="home-testimonials">
        <div className="reveal-on-scroll">
          <p className="text-[#14b8a6] text-sm tracking-widest uppercase mb-2">Loved by locals</p>
          <h2 className="font-display text-4xl sm:text-5xl mb-10">What Our <span className="gradient-text">Clients Say</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.map((t, i) => (
            <div key={t.id} className="card-dark p-6 reveal-on-scroll" style={{ transitionDelay: `${i * 80}ms` }} data-testid={`home-testimonial-${t.id}`}>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={14} className="fill-[#f59e0b] text-[#f59e0b]" />)}
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div className="border-t border-white/10 pt-3">
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-white/50 flex items-center gap-1 mt-0.5"><MapPin size={10} /> {t.location}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="home-cta">
        <div className="glass rounded-3xl p-10 md:p-16 relative overflow-hidden animate-glow-pulse">
          <div className="absolute inset-0 radial-purple opacity-70" />
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[#7c3aed]/20 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-[#14b8a6]/20 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-3xl md:text-5xl mb-3">Ready to start your <span className="gradient-text">project?</span></h2>
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
