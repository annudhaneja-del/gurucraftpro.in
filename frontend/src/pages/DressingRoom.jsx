import React, { useEffect, useRef, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import {
  Camera, Download, Save, RefreshCw, ShoppingBag, Sparkles, Shirt, Move,
  Maximize, RotateCw, ChevronLeft, AlertTriangle, Loader2
} from "lucide-react";
import { Link } from "react-router-dom";

export default function DressingRoom() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const animRef = useRef(null);
  const poseRef = useRef(null);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [clothImg, setClothImg] = useState(null);
  const [adjust, setAdjust] = useState({ scale: 1.2, offsetX: 0, offsetY: 0, rotate: 0, opacity: 0.92 });
  const [status, setStatus] = useState("Loading AI model...");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  // Fetch clothing items
  useEffect(() => {
    api.get("/tryon/clothing").then((r) => {
      setItems(r.data);
      if (r.data[0]) pickItem(r.data[0]);
    });
  }, []);

  const pickItem = (it) => {
    setSelected(it);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setClothImg(img);
    img.onerror = () => toast.error("Failed to load clothing image");
    img.src = it.image;
  };

  // Wait for TF.js + poseDetection globals
  const waitForLibs = () => new Promise((resolve, reject) => {
    let tries = 0;
    const check = () => {
      if (window.tf && window.poseDetection) return resolve();
      tries++;
      if (tries > 80) return reject(new Error("TensorFlow.js failed to load"));
      setTimeout(check, 200);
    };
    check();
  });

  // Setup camera + pose detector
  useEffect(() => {
    let stream;
    (async () => {
      try {
        setStatus("Loading AI body tracker...");
        await waitForLibs();
        await window.tf.setBackend("webgl");
        await window.tf.ready();

        setStatus("Requesting camera access...");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        const video = videoRef.current;
        video.srcObject = stream;
        await new Promise((r) => (video.onloadedmetadata = r));
        await video.play();

        setStatus("Initializing pose model...");
        detectorRef.current = await window.poseDetection.createDetector(
          window.poseDetection.SupportedModels.MoveNet,
          { modelType: window.poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );

        setReady(true);
        setStatus("");
        draw();
      } catch (e) {
        console.error(e);
        setError(e.message || "Camera/AI init failed. Ensure you allow camera permission.");
        setStatus("");
      }
    })();
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const draw = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width = video.videoWidth || 640;
    const h = canvas.height = video.videoHeight || 480;

    // Mirror the video
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();

    // Detect pose
    if (detectorRef.current) {
      try {
        const poses = await detectorRef.current.estimatePoses(video, { flipHorizontal: true });
        poseRef.current = poses[0];
      } catch (e) { /* skip frame */ }
    }

    const pose = poseRef.current;
    if (pose && clothImg) {
      const kp = Object.fromEntries(pose.keypoints.map((k) => [k.name, k]));
      const ls = kp.left_shoulder, rs = kp.right_shoulder;
      const lh = kp.left_hip, rh = kp.right_hip;

      if (ls?.score > 0.35 && rs?.score > 0.35) {
        const cx = (ls.x + rs.x) / 2 + adjust.offsetX;
        const shoulderW = Math.hypot(ls.x - rs.x, ls.y - rs.y);
        const torsoH = (lh && rh && lh.score > 0.3 && rh.score > 0.3)
          ? Math.hypot(((ls.x + rs.x) / 2) - ((lh.x + rh.x) / 2), ((ls.y + rs.y) / 2) - ((lh.y + rh.y) / 2))
          : shoulderW * 1.6;

        const imgW = shoulderW * 2.4 * adjust.scale;
        const aspect = clothImg.height / clothImg.width;
        const imgH = Math.min(imgW * aspect, torsoH * 2.4 * adjust.scale);
        const topY = (ls.y + rs.y) / 2 - imgH * 0.18 + adjust.offsetY;

        ctx.save();
        ctx.globalAlpha = adjust.opacity;
        ctx.translate(cx, topY + imgH / 2);
        ctx.rotate((adjust.rotate * Math.PI) / 180);
        ctx.drawImage(clothImg, -imgW / 2, -imgH / 2, imgW, imgH);
        ctx.restore();

        // Keypoint dots (faint)
        ctx.fillStyle = "rgba(20, 184, 166, 0.4)";
        [ls, rs, lh, rh].filter(Boolean).forEach((k) => {
          if (k.score > 0.3) {
            ctx.beginPath(); ctx.arc(k.x, k.y, 4, 0, Math.PI * 2); ctx.fill();
          }
        });
      }
    }

    animRef.current = requestAnimationFrame(draw);
  };

  const autoFit = () => setAdjust({ scale: 1.2, offsetX: 0, offsetY: 0, rotate: 0, opacity: 0.92 });

  const capture = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `gurucraftpro-look-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Photo saved to your device");
  };

  const saveLook = async () => {
    if (!user) { toast.error("Login to save looks"); return; }
    if (!selected) return;
    const canvas = canvasRef.current;
    const thumbnail = canvas.toDataURL("image/jpeg", 0.7);
    try {
      await api.post("/looks", {
        name: `${selected.title} — ${new Date().toLocaleString()}`,
        thumbnail,
        mode: "dressing",
        meta: { item_id: selected.id, item_title: selected.title, adjust },
      });
      toast.success("Look saved to your profile");
    } catch (e) {
      toast.error("Save failed");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#05050A]" data-testid="dressing-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Link to="/shop" className="text-xs text-white/50 hover:text-white inline-flex items-center gap-1"><ChevronLeft size={12} /> Back to shop</Link>
            <h1 className="font-display text-3xl sm:text-4xl mt-1">Virtual <span className="gradient-text">Dressing Room</span></h1>
            <p className="text-xs text-white/60 mt-1">AI-powered body tracking · Pick an outfit and see yourself wearing it</p>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full border ${ready ? "bg-[#25D366]/20 text-[#25D366] border-[#25D366]/40" : "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40"}`}>
            {ready ? "● LIVE" : "Loading"}
          </span>
        </div>

        <div className="grid md:grid-cols-[260px_1fr_280px] gap-4">
          {/* Clothing panel */}
          <aside className="card-dark p-3 max-h-[80vh] overflow-auto" data-testid="clothing-panel">
            <div className="flex items-center gap-2 text-sm text-white/80 mb-3"><Shirt size={14} /> Clothing ({items.length})</div>
            <div className="grid grid-cols-2 gap-2">
              {items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => pickItem(it)}
                  className={`card-dark overflow-hidden text-left ${selected?.id === it.id ? "ring-2 ring-[#7c3aed]" : ""}`}
                  data-testid={`cloth-${it.id}`}
                >
                  <img src={it.image} alt={it.title} className="w-full aspect-square object-cover" />
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{it.title}</p>
                    <p className="text-[10px] text-[#7c3aed]">₹{it.price}</p>
                  </div>
                </button>
              ))}
              {items.length === 0 && <p className="text-xs text-white/40 col-span-2">No clothing items yet.</p>}
            </div>
          </aside>

          {/* Preview */}
          <div className="card-dark overflow-hidden relative aspect-[4/3] flex items-center justify-center bg-black" data-testid="preview-area">
            <video ref={videoRef} className="hidden" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
            {(!ready || error) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#05050A]/80 backdrop-blur-sm">
                {error ? (
                  <>
                    <AlertTriangle size={32} className="text-[#f59e0b]" />
                    <p className="text-sm text-white/80 text-center px-6">{error}</p>
                    <button onClick={() => window.location.reload()} className="btn-secondary text-sm"><RefreshCw size={12} /> Retry</button>
                  </>
                ) : (
                  <>
                    <Loader2 size={28} className="animate-spin text-[#7c3aed]" />
                    <p className="text-xs text-white/70">{status}</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <aside className="card-dark p-4 h-fit sticky top-20 space-y-4" data-testid="tryon-controls">
            <div>
              <p className="text-xs text-white/60 mb-2 flex items-center gap-1"><Maximize size={12} /> Size · {adjust.scale.toFixed(2)}×</p>
              <input type="range" min="0.5" max="2.2" step="0.05" value={adjust.scale} onChange={(e) => setAdjust({ ...adjust, scale: Number(e.target.value) })} className="w-full accent-[#7c3aed]" data-testid="adjust-scale" />
            </div>
            <div>
              <p className="text-xs text-white/60 mb-2 flex items-center gap-1"><Move size={12} /> Horizontal · {adjust.offsetX}px</p>
              <input type="range" min="-120" max="120" step="2" value={adjust.offsetX} onChange={(e) => setAdjust({ ...adjust, offsetX: Number(e.target.value) })} className="w-full accent-[#7c3aed]" data-testid="adjust-offx" />
            </div>
            <div>
              <p className="text-xs text-white/60 mb-2 flex items-center gap-1"><Move size={12} /> Vertical · {adjust.offsetY}px</p>
              <input type="range" min="-120" max="120" step="2" value={adjust.offsetY} onChange={(e) => setAdjust({ ...adjust, offsetY: Number(e.target.value) })} className="w-full accent-[#7c3aed]" data-testid="adjust-offy" />
            </div>
            <div>
              <p className="text-xs text-white/60 mb-2 flex items-center gap-1"><RotateCw size={12} /> Rotate · {adjust.rotate}°</p>
              <input type="range" min="-30" max="30" step="1" value={adjust.rotate} onChange={(e) => setAdjust({ ...adjust, rotate: Number(e.target.value) })} className="w-full accent-[#7c3aed]" data-testid="adjust-rotate" />
            </div>
            <div>
              <p className="text-xs text-white/60 mb-2">Blend · {Math.round(adjust.opacity * 100)}%</p>
              <input type="range" min="0.4" max="1" step="0.02" value={adjust.opacity} onChange={(e) => setAdjust({ ...adjust, opacity: Number(e.target.value) })} className="w-full accent-[#7c3aed]" />
            </div>
            <button onClick={autoFit} className="btn-secondary w-full justify-center text-xs" data-testid="auto-fit"><Sparkles size={12} /> Auto-fit</button>

            <div className="border-t border-white/10 pt-4 space-y-2">
              <button onClick={capture} disabled={!ready} className="btn-primary w-full justify-center text-sm" data-testid="capture-photo"><Camera size={14} /> Capture Photo</button>
              <button onClick={saveLook} disabled={!ready || !user} className="btn-whatsapp w-full justify-center text-sm" data-testid="save-look"><Save size={14} /> {user ? "Save Look" : "Login to Save"}</button>
              {selected && (
                <a
                  href={`https://wa.me/918527837527?text=${encodeURIComponent(`Hi, I want to order: ${selected.title} - ₹${selected.price}`)}`}
                  target="_blank" rel="noreferrer"
                  className="btn-secondary w-full justify-center text-sm"
                  data-testid="order-outfit"
                ><ShoppingBag size={14} /> Order via WhatsApp</a>
              )}
            </div>
          </aside>
        </div>

        <p className="text-xs text-white/40 text-center mt-4">
          Tip: Stand 2–3 feet from the camera with good lighting. Adjust size & position to match your body. Works best in Chrome / Edge / Safari.
        </p>
      </div>
    </div>
  );
}
