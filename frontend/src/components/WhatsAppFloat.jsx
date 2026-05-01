import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";

const QUICK = [
  "Hi, I want GurucraftPro",
  "Hi, I need image editing",
  "Hi, I want Wedding Invite design",
  "Hi, I need a consultation call",
  "Hi, I'm interested in Guruji Art Works",
];

export default function WhatsAppFloat() {
  const [open, setOpen] = useState(false);
  const base = "https://wa.me/918527837527?text=";

  return (
    <div className="fixed bottom-6 right-6 z-[60]" data-testid="whatsapp-float">
      {open && (
        <div className="mb-3 w-72 glass rounded-2xl p-3 border border-[#25D366]/30 animate-rise" data-testid="whatsapp-quick-panel">
          <p className="text-xs text-white/70 mb-2 px-1">Quick messages</p>
          <div className="flex flex-col gap-1.5">
            {QUICK.map((m) => (
              <a
                key={m}
                href={`${base}${encodeURIComponent(m)}`}
                target="_blank" rel="noreferrer"
                className="text-sm text-white/90 bg-[#12121A] hover:bg-[#25D366]/20 hover:text-[#25D366] px-3 py-2 rounded-lg transition-colors"
                data-testid={`whatsapp-quick-${m.slice(0, 10).replace(/\W+/g, "-").toLowerCase()}`}
              >
                {m}
              </a>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_8px_28px_rgba(37,211,102,0.45)] hover:scale-110 transition-transform"
        data-testid="whatsapp-float-toggle"
        aria-label="WhatsApp"
      >
        {open ? <X size={22} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
