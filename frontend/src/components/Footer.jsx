import React from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Clock, Instagram, Facebook, Youtube } from "lucide-react";

const LOGO = "https://customer-assets.emergentagent.com/job_a9385893-2db1-4c60-9d30-98a00b2907c1/artifacts/31j8kh2p_tmp_4c1cc7d1-61c9-4235-b652-ccc5ce1cff98.jpeg";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#020205] pt-16 pb-8 mt-24" data-testid="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <img src={LOGO} alt="GurucraftPro" className="h-10 w-10 rounded-md object-cover" />
            <span className="font-display text-xl font-bold">
              Guru<span className="text-[#7c3aed]">craft</span><span className="text-[#14b8a6]">Pro</span>
            </span>
          </div>
          <p className="text-white/60 text-sm leading-relaxed">Creative designs and digital services tailored for every need. Proudly made in Rohini, Delhi.</p>
          <div className="flex gap-3 mt-4">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="p-2 rounded-full border border-white/10 hover:border-[#7c3aed] hover:text-[#7c3aed]" data-testid="footer-ig"><Instagram size={16} /></a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="p-2 rounded-full border border-white/10 hover:border-[#14b8a6] hover:text-[#14b8a6]" data-testid="footer-fb"><Facebook size={16} /></a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="p-2 rounded-full border border-white/10 hover:border-red-500 hover:text-red-500" data-testid="footer-yt"><Youtube size={16} /></a>
          </div>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4">Quick Links</h4>
          <ul className="space-y-2 text-white/60 text-sm">
            <li><Link to="/services" className="hover:text-white">All Services</Link></li>
            <li><Link to="/shop" className="hover:text-white">Shop</Link></li>
            <li><Link to="/learn" className="hover:text-white">Learn</Link></li>
            <li><Link to="/studio" className="hover:text-white">Design Studio</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4">Contact</h4>
          <ul className="space-y-3 text-white/60 text-sm">
            <li className="flex items-start gap-2"><Phone size={14} className="mt-1" /><a href="tel:+918527837527" className="hover:text-white">+91 8527 837 527</a></li>
            <li className="flex items-start gap-2"><Mail size={14} className="mt-1" /><a href="mailto:annudhaneja@gmail.com" className="hover:text-white">annudhaneja@gmail.com</a></li>
            <li className="flex items-start gap-2"><MapPin size={14} className="mt-1" />Rohini, Delhi — 110085</li>
            <li className="flex items-start gap-2"><Clock size={14} className="mt-1" />8 AM – 8 PM, Daily</li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-lg mb-4">Trust</h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/50 flex items-center justify-center text-[#7c3aed] font-bold">500+</div>
              <span className="text-white/70">Clients Served</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#14b8a6]/20 border border-[#14b8a6]/50 flex items-center justify-center text-[#14b8a6] font-bold">1.2k</div>
              <span className="text-white/70">Orders Completed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#25D366]/20 border border-[#25D366]/50 flex items-center justify-center text-[#25D366] font-bold">⚡</div>
              <span className="text-white/70">Fast Response</span>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-white/10 text-center text-xs text-white/40">
        © {new Date().getFullYear()} GurucraftPro • Owner: Annu Dhaneja • All rights reserved.
      </div>
    </footer>
  );
}
