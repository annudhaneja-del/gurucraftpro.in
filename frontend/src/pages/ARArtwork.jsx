import React, { useEffect, useRef, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import {
  Camera, Save, RefreshCw, Maximize, RotateCw, Move, ShoppingBag, Sparkles,
  Layers, ChevronLeft, AlertTriangle, Loader2, Square, Frame, ImageIcon,
  MousePointer2, Sun
} from "lucide-react";
import { Link } from "react-router-dom";

const FRAMES = [
  { id: "none", label: "No Frame", style: {} },
  { id: "gold", label: "Gold", style: { padding: 12, background: "linear-gradient(135deg,#b8860b,#f5c518,#b8860b)", boxShadow: "0 0 20px rgba(245,197,24,0.4), inset 0 0 8px rgba(0,0,0,0.3)" } },
  { id: "black", label: "Black Wood", style: { padding: 14, background: "#1a1a1a", boxShadow: "0 0 16px rgba(0,0,0,0.5), inset 0 0 4px rgba(255,255,255,0.05)" } },
  { id: "neon", label: "Neon", style: { padding: 6, background: "#05050A", boxShadow: "0 0 24px rgba(124,58,237,0.6), inset 0 0 12px rgba(20,184,166,0.3)", border: "2px solid #7c3aed" } },
];

const CATS = [
  { id: "all", label: "All" },
  { id: "Spiritual", label: "Spiritual" },
  { id: "Wall Art", label: "Wall Posters" },
];

export default function ARArtwork() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState("all");
  const [selected, setSelected] = useState(null);
  const [pos, setPos] = useState({ x: 50, y: 40 });   // % of container
  const [scale, setScale] = useState(0.35);             // relative to container width
  const [rotate, setRotate] = useState(0);
  const [frame, setFrame] = useState("gold");
  const [light, setLight] = useState(0.8);              // artwork brightness
  const [placed, setPlaced] = useState(false);
  const [status, setStatus] = useState("Requesting camera...");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const dragRef = useRef(null);

  useEffect(() => {
    api.get("/tryon/artwork").then((r) => {
      setItems(r.data);
      if (r.data[0]) setSelected(r.data[0]);
    });
  }, []);

  useEffect(() => {
    let stream;
    (async () => {
      try {
        setStatus("Opening rear camera...");
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
            audio: false,
          });
        } catch {
          // Fallback to any camera
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
        setStatus("");
      } catch (e) {
        console.error(e);
        setError(e.message || "Camera init failed. Please allow camera permission.");
      }
    })();
    return () => { if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, []);

  const filtered = items.filter((i) => cat === "all" || i.category === cat);

  // Drag (mouse + touch)
  const startDrag = (e) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const rect = containerRef.current.getBoundingClientRect();
    dragRef.current = { x: clientX, y: clientY, startX: pos.x, startY: pos.y, w: rect.width, h: rect.height };
  };
  const onMove = (e) => {
    if (!dragRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = ((clientX - dragRef.current.x) / dragRef.current.w) * 100;
    const dy = ((clientY - dragRef.current.y) / dragRef.current.h) * 100;
    setPos({
      x: Math.min(95, Math.max(5, dragRef.current.startX + dx)),
      y: Math.min(95, Math.max(5, dragRef.current.startY + dy)),
    });
  };
  const endDrag = () => { dragRef.current = null; };

  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", endDrag);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", endDrag);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", endDrag);
    };
  });

  const reset = () => {
    setPos({ x: 50, y: 40 }); setScale(0.35); setRotate(0); setPlaced(false);
  };

  const snapshot = async () => {
    const node = containerRef.current;
    try {
      const canvasEl = await html2canvas(node, { useCORS: true, allowTaint: true, backgroundColor: null, scale: 2 });
      const link = document.createElement("a");
      link.download = `gurucraftpro-ar-${Date.now()}.png`;
      link.href = canvasEl.toDataURL("image/png");
      link.click();
      toast.success("Snapshot saved");
      return canvasEl.toDataURL("image/jpeg", 0.7);
    } catch (e) {
      toast.error("Snapshot failed (camera frames may be CORS-protected)");
    }
  };

  const saveLook = async () => {
    if (!user) { toast.error("Login to save"); return; }
    if (!selected) return;
    const node = containerRef.current;
    try {
      const canvasEl = await html2canvas(node, { useCORS: true, allowTaint: true, scale: 1 });
      const thumb = canvasEl.toDataURL("image/jpeg", 0.6);
      await api.post("/looks", {
        name: `${selected.title} on wall — ${new Date().toLocaleString()}`,
        thumbnail: thumb,
        mode: "artwork",
        meta: { item_id: selected.id, item_title: selected.title, pos, scale, rotate, frame },
      });
      toast.success("Placement saved");
    } catch (e) { toast.error("Save failed"); }
  };

  const frameStyle = FRAMES.find((f) => f.id === frame)?.style || {};
  const containerW = containerRef.current?.clientWidth || 800;
  const artworkW = containerW * scale;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#05050A]" data-testid="ar-artwork-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <Link to="/shop" className="text-xs text-white/50 hover:text-white inline-flex items-center gap-1"><ChevronLeft size={12} /> Back</Link>
            <h1 className="font-display text-3xl sm:text-4xl mt-1">AR <span className="gradient-text">Wall Preview</span></h1>
            <p className="text-xs text-white/60 mt-1">See Guruji artwork & frames on YOUR wall before buying</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full border ${ready ? "bg-[#25D366]/20 text-[#25D366] border-[#25D366]/40" : "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40"}`}>
            {ready ? "● LIVE CAMERA" : "Loading"}
          </span>
        </div>

        <div className="grid md:grid-cols-[1fr_280px] gap-4">
          {/* Camera + overlay */}
          <div
            ref={containerRef}
            className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black card-dark select-none"
            data-testid="ar-preview"
            onMouseDown={() => setPlaced(true)}
          >
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted autoPlay />

            {/* Surface detection illusion overlay */}
            {ready && !placed && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-x-0 top-1/3 flex flex-col items-center justify-center gap-2">
                  <div className="glass px-4 py-2 rounded-full text-xs flex items-center gap-2 animate-pulse">
                    <MousePointer2 size={12} /> Tap where you want to place the artwork
                  </div>
                  <svg width="120" height="80" viewBox="0 0 120 80" className="opacity-50">
                    <path d="M20 60 L60 20 L100 60 Z" stroke="#14b8a6" strokeWidth="2" fill="none" strokeDasharray="4" />
                    <circle cx="60" cy="40" r="3" fill="#7c3aed">
                      <animate attributeName="r" from="3" to="10" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="1" to="0" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  </svg>
                </div>
              </div>
            )}

            {/* Artwork overlay */}
            {selected && ready && (
              <div
                onMouseDown={startDrag}
                onTouchStart={startDrag}
                className="absolute cursor-move"
                style={{
                  left: `${pos.x}%`, top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
                  width: artworkW,
                  touchAction: "none",
                  filter: `brightness(${light}) drop-shadow(0 10px 20px rgba(0,0,0,0.55)) drop-shadow(0 4px 8px rgba(0,0,0,0.4))`,
                  transition: "filter 0.2s",
                }}
                data-testid="ar-artwork-overlay"
              >
                <div style={{ ...frameStyle, borderRadius: frame === "neon" ? 8 : 2, display: "inline-block" }}>
                  <img src={selected.image} alt={selected.title} crossOrigin="anonymous" style={{ width: "100%", display: "block", borderRadius: frame === "neon" ? 4 : 0 }} />
                </div>
              </div>
            )}

            {(error || !ready) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#05050A]/85">
                {error ? (
                  <>
                    <AlertTriangle size={32} className="text-[#f59e0b]" />
                    <p className="text-sm text-white/80 text-center px-6">{error}</p>
                    <button onClick={() => window.location.reload()} className="btn-secondary text-sm"><RefreshCw size={12} /> Retry</button>
                  </>
                ) : (
                  <><Loader2 size={28} className="animate-spin text-[#7c3aed]" /><p className="text-xs text-white/70">{status}</p></>
                )}
              </div>
            )}
          </div>

          {/* Side controls */}
          <aside className="card-dark p-4 space-y-4 max-h-[80vh] overflow-auto" data-testid="ar-controls">
            <div>
              <p className="text-xs text-white/60 mb-2 flex items-center gap-1"><Layers size={12} /> Category</p>
              <div className="flex gap-1 flex-wrap">
                {CATS.map((c) => (
                  <button key={c.id} onClick={() => setCat(c.id)} className={`text-xs px-3 py-1 rounded-full border ${cat === c.id ? "bg-[#7c3aed] border-[#7c3aed]" : "border-white/10 text-white/60"}`} data-testid={`ar-cat-${c.id}`}>{c.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-white/60 mb-2 flex items-center gap-1"><ImageIcon size={12} /> Artwork ({filtered.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {filtered.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => setSelected(it)}
                    className={`card-dark overflow-hidden ${selected?.id === it.id ? "ring-2 ring-[#14b8a6]" : ""}`}
                    data-testid={`ar-item-${it.id}`}
                    title={it.title}
                  >
                    <img src={it.image} alt={it.title} className="w-full aspect-square object-cover" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-white/60 mb-2 flex items-center gap-1"><Frame size={12} /> Frame</p>
              <div className="grid grid-cols-2 gap-2">
                {FRAMES.map((f) => (
                  <button key={f.id} onClick={() => setFrame(f.id)} className={`text-xs py-2 rounded border ${frame === f.id ? "bg-[#7c3aed] border-[#7c3aed]" : "border-white/10 text-white/70"}`} data-testid={`ar-frame-${f.id}`}>{f.label}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-white/60 mb-2 flex items-center gap-1"><Maximize size={12} /> Size · {Math.round(scale * 100)}%</p>
              <input type="range" min="0.1" max="0.85" step="0.01" value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full accent-[#7c3aed]" data-testid="ar-scale" />
            </div>
            <div>
              <p className="text-xs text-white/60 mb-2 flex items-center gap-1"><RotateCw size={12} /> Rotate · {rotate}°</p>
              <input type="range" min="-45" max="45" step="1" value={rotate} onChange={(e) => setRotate(Number(e.target.value))} className="w-full accent-[#7c3aed]" data-testid="ar-rotate" />
            </div>
            <div>
              <p className="text-xs text-white/60 mb-2 flex items-center gap-1"><Sun size={12} /> Lighting · {Math.round(light * 100)}%</p>
              <input type="range" min="0.4" max="1.3" step="0.05" value={light} onChange={(e) => setLight(Number(e.target.value))} className="w-full accent-[#7c3aed]" data-testid="ar-lighting" />
            </div>
            <button onClick={reset} className="btn-secondary w-full justify-center text-xs" data-testid="ar-reset"><Sparkles size={12} /> Reset</button>
            <div className="border-t border-white/10 pt-4 space-y-2">
              <button onClick={snapshot} disabled={!ready} className="btn-primary w-full justify-center text-sm" data-testid="ar-snapshot"><Camera size={14} /> Snapshot</button>
              <button onClick={saveLook} disabled={!ready || !user} className="btn-whatsapp w-full justify-center text-sm" data-testid="ar-save"><Save size={14} /> {user ? "Save Placement" : "Login to Save"}</button>
              {selected && (
                <a
                  href={`https://wa.me/918527837527?text=${encodeURIComponent(`Hi, I want to order: ${selected.title} - ₹${selected.price}`)}`}
                  target="_blank" rel="noreferrer"
                  className="btn-secondary w-full justify-center text-sm"
                  data-testid="ar-order"
                ><ShoppingBag size={14} /> Order this art</a>
              )}
            </div>
          </aside>
        </div>

        <p className="text-xs text-white/40 text-center mt-4">
          Tip: On mobile, point at your wall. Drag the artwork to position it. Best with good lighting. Pinch-to-zoom via the Size slider.
        </p>
      </div>
    </div>
  );
}
