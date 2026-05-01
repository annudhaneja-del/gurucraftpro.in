import React, { useState } from "react";
import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

export default function Contact() {
  const [f, setF] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/contact", f);
      toast.success("Message sent! We'll respond within 5 minutes.");
      setF({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      toast.error("Failed to send. Try WhatsApp instead.");
    } finally { setSending(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="contact-page">
      <div className="mb-10">
        <p className="text-[#14b8a6] text-sm tracking-widest uppercase mb-2">Let's Connect</p>
        <h1 className="font-display text-5xl">Get In Touch</h1>
        <p className="text-white/60 mt-3 max-w-xl">Have a project in mind? Reach out on WhatsApp for instant response or drop a message below.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {[
              { icon: Phone, label: "Call", value: "+91 8527 837 527", href: "tel:+918527837527", color: "#7c3aed" },
              { icon: MessageCircle, label: "WhatsApp", value: "+91 8527 837 527", href: "https://wa.me/918527837527", color: "#25D366" },
              { icon: Mail, label: "Email", value: "annudhaneja@gmail.com", href: "mailto:annudhaneja@gmail.com", color: "#14b8a6" },
              { icon: Clock, label: "Hours", value: "8 AM – 8 PM", href: "#", color: "#f59e0b" },
            ].map((c) => {
              const Ic = c.icon;
              return (
                <a key={c.label} href={c.href} target="_blank" rel="noreferrer" className="card-dark p-5 block" data-testid={`contact-${c.label.toLowerCase()}`}>
                  <Ic size={20} style={{ color: c.color }} />
                  <p className="text-xs text-white/50 mt-3 uppercase tracking-wider">{c.label}</p>
                  <p className="text-sm font-medium mt-1 break-all">{c.value}</p>
                </a>
              );
            })}
          </div>

          <div className="card-dark p-4 flex items-start gap-3 mb-4">
            <MapPin className="text-[#7c3aed] mt-1" size={18} />
            <div>
              <p className="font-medium">GurucraftPro</p>
              <p className="text-white/60 text-sm">Rohini, Delhi — 110085</p>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/10" data-testid="contact-map">
            <iframe
              title="Rohini Delhi Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14006.027055!2d77.10!3d28.7386!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d05e4e4e4e4e4%3A0x0!2sRohini%2C%20Delhi!5e0!3m2!1sen!2sin!4v1710000000000"
              width="100%" height="300" style={{ border: 0, filter: "invert(0.9) hue-rotate(180deg)" }}
              allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <form onSubmit={submit} className="card-dark p-6 space-y-4" data-testid="contact-form">
          <h3 className="font-display text-2xl mb-2">Send a Message</h3>
          <input placeholder="Your Name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="w-full px-4 py-3 rounded-lg" data-testid="contact-name" />
          <input type="email" placeholder="Email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="w-full px-4 py-3 rounded-lg" data-testid="contact-email" />
          <input placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="w-full px-4 py-3 rounded-lg" data-testid="contact-phone" />
          <input placeholder="Subject" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className="w-full px-4 py-3 rounded-lg" data-testid="contact-subject" />
          <textarea placeholder="Your message..." required rows={5} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} className="w-full px-4 py-3 rounded-lg" data-testid="contact-message" />
          <button type="submit" disabled={sending} className="btn-primary w-full justify-center" data-testid="contact-submit">
            <Send size={16} /> {sending ? "Sending..." : "Send Message"}
          </button>
          <a href="https://wa.me/918527837527" target="_blank" rel="noreferrer" className="btn-whatsapp w-full justify-center" data-testid="contact-whatsapp-cta">
            <MessageCircle size={16} /> Or Chat on WhatsApp
          </a>
        </form>
      </div>
    </div>
  );
}
