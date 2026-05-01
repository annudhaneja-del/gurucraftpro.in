import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import api from "../lib/api";
import {
  Upload, Send, Sparkles, IndianRupee, CheckCircle2, ArrowRight,
  Shirt, Frame, Bot, BookOpen, PencilRuler, Palette
} from "lucide-react";

const CATEGORIES = [
  { id: "prompt_pack", label: "AI Prompt Pack", icon: Bot, desc: "Midjourney, GPT, Nano Banana packs", payout: "70%" },
  { id: "template", label: "Design Template", icon: PencilRuler, desc: "Canva/PSD/Figma templates", payout: "65%" },
  { id: "pdf_course", label: "PDF / Course", icon: BookOpen, desc: "Ebooks, playbooks, courses", payout: "70%" },
  { id: "artwork", label: "Wall Artwork", icon: Frame, desc: "Spiritual art, posters, frames", payout: "55%" },
  { id: "clothing", label: "Clothing", icon: Shirt, desc: "AR-ready PNG outfits", payout: "60%" },
  { id: "other", label: "Other", icon: Palette, desc: "Tell us what you have", payout: "Negotiable" },
];

export default function Sell() {
  const [f, setF] = useState({
    name: "", email: "", phone: "",
    content_type: "prompt_pack", title: "", description: "",
    price: 0, sample_url: "", portfolio_url: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/creators/submit", f);
      setDone(true);
      toast.success("Submission received! We'll review within 48h.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Submission failed");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="sell-page">
      <div className="mb-10 animate-rise">
        <p className="text-[#14b8a6] text-sm tracking-widest uppercase mb-2">Creator Studio</p>
        <h1 className="font-display text-5xl sm:text-6xl">Sell Your <span className="gradient-text">Content</span></h1>
        <p className="text-white/60 mt-4 max-w-2xl">
          Creators, designers, artists & AI wizards — list your prompt packs, templates, artwork, PDFs and clothing on GurucraftPro. Keep up to <span className="text-[#14b8a6]">70%</span> of every sale. No monthly fees.
        </p>
      </div>

      {/* How it works */}
      <div className="grid md:grid-cols-4 gap-4 mb-12">
        {[
          { n: 1, t: "Submit", d: "Fill the form with your content details" },
          { n: 2, t: "Review", d: "Our team reviews in 24–48 hours" },
          { n: 3, t: "Launch", d: "We list + promote on WhatsApp & social" },
          { n: 4, t: "Earn", d: "Get paid monthly via UPI/bank" },
        ].map((s) => (
          <div key={s.n} className="card-dark p-5" data-testid={`sell-step-${s.n}`}>
            <div className="w-10 h-10 rounded-full bg-[#7c3aed]/15 text-[#7c3aed] font-display text-xl flex items-center justify-center mb-3">{s.n}</div>
            <p className="font-display text-xl">{s.t}</p>
            <p className="text-xs text-white/60 mt-1">{s.d}</p>
          </div>
        ))}
      </div>

      {done ? (
        <div className="card-dark p-10 text-center max-w-xl mx-auto" data-testid="sell-success">
          <CheckCircle2 className="text-[#25D366] mx-auto mb-4" size={56} />
          <h2 className="font-display text-3xl mb-2">Submission Received!</h2>
          <p className="text-white/60 mb-6">We'll review your content within 48 hours and reach out on WhatsApp/email with next steps.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="btn-secondary text-sm">Back to Home</Link>
            <button onClick={() => { setDone(false); setF({ ...f, title: "", description: "", price: 0, sample_url: "" }); }} className="btn-primary text-sm">
              Submit Another
            </button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr_340px] gap-6">
          <form onSubmit={submit} className="card-dark p-6 space-y-4" data-testid="sell-form">
            <h3 className="font-display text-2xl mb-2">Tell us about your content</h3>

            <div>
              <p className="text-xs text-white/60 mb-2 uppercase tracking-wider">Content Type</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CATEGORIES.map((c) => {
                  const Ic = c.icon;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setF({ ...f, content_type: c.id })}
                      className={`card-dark p-3 text-left transition-all ${f.content_type === c.id ? "ring-2 ring-[#7c3aed] bg-[#7c3aed]/10" : ""}`}
                      data-testid={`sell-type-${c.id}`}
                    >
                      <Ic size={16} className="text-[#14b8a6] mb-2" />
                      <p className="text-sm font-medium">{c.label}</p>
                      <p className="text-[10px] text-white/50 mt-0.5">{c.desc}</p>
                      <p className="text-[10px] text-[#14b8a6] mt-1">Earn {c.payout}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3 pt-2">
              <input placeholder="Your Name *" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="px-4 py-3 rounded-lg" data-testid="sell-name" />
              <input type="email" placeholder="Email *" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="px-4 py-3 rounded-lg" data-testid="sell-email" />
              <input placeholder="WhatsApp / Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="px-4 py-3 rounded-lg" data-testid="sell-phone" />
              <input placeholder="Portfolio URL (optional)" value={f.portfolio_url} onChange={(e) => setF({ ...f, portfolio_url: e.target.value })} className="px-4 py-3 rounded-lg" data-testid="sell-portfolio" />
            </div>

            <input placeholder="Content Title *" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="w-full px-4 py-3 rounded-lg" data-testid="sell-title" />
            <textarea placeholder="Describe what you're selling (features, use cases, what's included)" required rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="w-full px-4 py-3 rounded-lg" data-testid="sell-description" />

            <div className="grid md:grid-cols-2 gap-3">
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input type="number" placeholder="Suggested Price" min="0" value={f.price || ""} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} className="w-full pl-8 pr-4 py-3 rounded-lg" data-testid="sell-price" />
              </div>
              <input placeholder="Sample / Preview URL" value={f.sample_url} onChange={(e) => setF({ ...f, sample_url: e.target.value })} className="px-4 py-3 rounded-lg" data-testid="sell-sample" />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full justify-center" data-testid="sell-submit">
              <Send size={14} /> {submitting ? "Submitting..." : "Submit for Review"}
            </button>
            <p className="text-xs text-white/40 text-center">By submitting you agree to our creator terms — 70/30 revenue split for most categories.</p>
          </form>

          <aside className="card-dark p-6 h-fit space-y-4">
            <h3 className="font-display text-xl">Why sell here?</h3>
            {[
              { t: "70% payout", d: "Keep more than most marketplaces" },
              { t: "Built-in AR", d: "Your clothing/artwork gets AR try-on" },
              { t: "WhatsApp marketing", d: "We promote to 500+ warm clients" },
              { t: "Zero monthly fees", d: "Only pay when you earn" },
              { t: "UPI payouts", d: "Fast Indian payment rails" },
            ].map((b) => (
              <div key={b.t} className="flex items-start gap-3">
                <Sparkles size={16} className="text-[#14b8a6] mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{b.t}</p>
                  <p className="text-xs text-white/55">{b.d}</p>
                </div>
              </div>
            ))}
            <a
              href="https://wa.me/918527837527?text=Hi%2C%20I%20want%20to%20know%20more%20about%20selling%20on%20GurucraftPro"
              target="_blank" rel="noreferrer"
              className="btn-whatsapp w-full justify-center text-sm mt-2"
              data-testid="sell-whatsapp"
            >
              Chat with Annu ji <ArrowRight size={14} />
            </a>
          </aside>
        </div>
      )}
    </div>
  );
}
