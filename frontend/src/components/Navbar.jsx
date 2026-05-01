import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Phone, MessageCircle, Menu, X, ShoppingBag, User, LogOut } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";

const LOGO = "https://customer-assets.emergentagent.com/job_a9385893-2db1-4c60-9d30-98a00b2907c1/artifacts/31j8kh2p_tmp_4c1cc7d1-61c9-4235-b652-ccc5ce1cff98.jpeg";

const links = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/studio", label: "Design Studio" },
  { to: "/dressing-room", label: "Try-On" },
  { to: "/ar-view", label: "AR Wall" },
  { to: "/shop", label: "Shop" },
  { to: "/learn", label: "Learn" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10" data-testid="site-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group" data-testid="nav-logo">
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#14b8a6] blur-lg opacity-60 group-hover:opacity-90 transition-opacity" />
            <img src={LOGO} alt="GurucraftPro" className="relative h-11 w-11 rounded-lg object-cover logo-glow" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight leading-none">
            Guru<span className="text-[#7c3aed]">craft</span><span className="text-[#14b8a6]">Pro</span>
            <span className="block text-[9px] font-normal text-white/40 tracking-[0.25em] uppercase mt-0.5 font-sans">Crafting Digital Experiences</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              data-testid={`nav-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? "text-white" : "text-white/60 hover:text-white"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href="tel:+918527837527" className="text-white/70 hover:text-[#14b8a6] transition-colors p-2" data-testid="nav-call-btn" title="Call">
            <Phone size={18} />
          </a>
          <a
            href="https://wa.me/918527837527?text=Hi%2C%20I%20want%20to%20know%20more%20about%20GurucraftPro"
            target="_blank" rel="noreferrer"
            className="btn-whatsapp text-sm py-2 px-3"
            data-testid="nav-whatsapp-btn"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
          <Link to="/shop" className="relative text-white/70 hover:text-white p-2" data-testid="nav-cart-btn">
            <ShoppingBag size={18} />
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#7c3aed] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {items.length}
              </span>
            )}
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link to={user.role === "admin" ? "/admin" : "/dashboard"} className="text-sm text-white/80 hover:text-white flex items-center gap-1" data-testid="nav-account-link">
                <User size={16} /> {user.name.split(" ")[0]}
              </Link>
              <button onClick={() => { logout(); navigate("/"); }} className="text-white/50 hover:text-white" data-testid="nav-logout-btn" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary text-sm py-2 px-4" data-testid="nav-login-btn">Login</Link>
          )}
        </div>

        <button className="lg:hidden text-white p-2" onClick={() => setOpen(!open)} data-testid="nav-mobile-toggle">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/10 bg-[#05050A]/95 backdrop-blur-xl px-4 pb-4" data-testid="nav-mobile-panel">
          <div className="flex flex-col gap-3 pt-3">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                end={l.to === "/"}
                data-testid={`nav-mobile-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={({ isActive }) =>
                  `py-2 ${isActive ? "text-white" : "text-white/70"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <div className="flex gap-2 pt-2">
              <a href="tel:+918527837527" className="btn-secondary flex-1 justify-center text-sm" data-testid="nav-mobile-call">
                <Phone size={16} /> Call
              </a>
              <a href="https://wa.me/918527837527" target="_blank" rel="noreferrer" className="btn-whatsapp flex-1 justify-center text-sm" data-testid="nav-mobile-whatsapp">
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
            {!user && (
              <Link to="/login" onClick={() => setOpen(false)} className="btn-primary text-center text-sm" data-testid="nav-mobile-login">Login / Signup</Link>
            )}
            {user && (
              <Link to={user.role === "admin" ? "/admin" : "/dashboard"} onClick={() => setOpen(false)} className="btn-primary text-center text-sm" data-testid="nav-mobile-dashboard">
                {user.role === "admin" ? "Admin Panel" : "Dashboard"}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
