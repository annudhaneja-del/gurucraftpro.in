import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import {
  Type, Square, Circle, Triangle, Image as ImageIcon, Trash2, Download,
  Undo2, Redo2, Save, Copy, ChevronUp, ChevronDown, Layers, Palette as PaletteIcon,
  FileImage, FileText as FilePdf, LayoutTemplate
} from "lucide-react";

const FONTS = ["Playfair Display", "Outfit", "Arial", "Times New Roman", "Georgia", "Courier New"];
const PALETTE = ["#7c3aed", "#14b8a6", "#f59e0b", "#ec4899", "#ffffff", "#000000", "#ef4444", "#22c55e"];

const uid = () => Math.random().toString(36).slice(2, 10);

export default function DesignStudio() {
  const { user } = useAuth();
  const canvasRef = useRef(null);
  const [canvas, setCanvas] = useState({ width: 1080, height: 1080, background: "#05050A" });
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [scale, setScale] = useState(0.5);
  const dragRef = useRef(null);

  useEffect(() => { api.get("/templates").then((r) => setTemplates(r.data)); }, []);

  // Responsive scale
  useEffect(() => {
    const onResize = () => {
      const container = document.getElementById("canvas-wrap");
      if (!container) return;
      const maxW = container.clientWidth - 40;
      const maxH = window.innerHeight - 260;
      const s = Math.min(maxW / canvas.width, maxH / canvas.height, 1);
      setScale(Math.max(0.2, s));
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [canvas]);

  const pushHistory = (next) => {
    setHistory((h) => [...h, elements]);
    setFuture([]);
    setElements(next);
  };

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setFuture((f) => [elements, ...f]);
    setHistory((h) => h.slice(0, -1));
    setElements(prev);
  };
  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setHistory((h) => [...h, elements]);
    setFuture((f) => f.slice(1));
    setElements(next);
  };

  const addText = () => pushHistory([...elements, { id: uid(), type: "text", text: "Your Text", x: 120, y: 120, w: 500, fontSize: 72, color: "#ffffff", fontFamily: "Playfair Display", bold: false, italic: false }]);
  const addShape = (shape) => {
    const el = { id: uid(), type: shape, x: 200, y: 200, w: 240, h: 240, color: "#7c3aed", rotation: 0 };
    pushHistory([...elements, el]);
  };
  const addImage = () => {
    const url = prompt("Paste image URL:");
    if (!url) return;
    pushHistory([...elements, { id: uid(), type: "image", src: url, x: 100, y: 100, w: 400, h: 400, rotation: 0 }]);
  };
  const uploadImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => pushHistory([...elements, { id: uid(), type: "image", src: reader.result, x: 100, y: 100, w: 400, h: 400, rotation: 0 }]);
    reader.readAsDataURL(file);
  };

  const updateEl = (id, patch) => setElements((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const commitChange = () => setHistory((h) => [...h, elements]);

  const deleteEl = (id) => { pushHistory(elements.filter((e) => e.id !== id)); setSelectedId(null); };
  const duplicateEl = (id) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    pushHistory([...elements, { ...el, id: uid(), x: el.x + 20, y: el.y + 20 }]);
  };
  const moveLayer = (id, dir) => {
    const idx = elements.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const copy = [...elements];
    const swap = dir === "up" ? idx + 1 : idx - 1;
    if (swap < 0 || swap >= copy.length) return;
    [copy[idx], copy[swap]] = [copy[swap], copy[idx]];
    pushHistory(copy);
  };

  const loadTemplate = (t) => {
    setCanvas({ width: t.data.width || 1080, height: t.data.height || 1080, background: t.data.background || "#05050A" });
    const els = (t.data.elements || []).map((e) => {
      if (e.type === "text") return { id: uid(), type: "text", text: e.text, x: e.x, y: e.y, w: e.w || 500, fontSize: e.fontSize || 64, color: e.color || "#fff", fontFamily: e.fontFamily || "Playfair Display" };
      if (e.type === "rect") return { id: uid(), type: "rect", x: e.x, y: e.y, w: e.w, h: e.h, color: e.color || "#7c3aed" };
      return { id: uid(), ...e };
    });
    pushHistory(els);
    toast.success(`Loaded: ${t.name}`);
  };

  // Drag logic
  const onPointerDown = (e, el) => {
    e.stopPropagation();
    setSelectedId(el.id);
    const canvasEl = canvasRef.current;
    const rect = canvasEl.getBoundingClientRect();
    const startX = (e.clientX - rect.left) / scale;
    const startY = (e.clientY - rect.top) / scale;
    dragRef.current = { id: el.id, offsetX: startX - el.x, offsetY: startY - el.y };
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale - dragRef.current.offsetX;
    const y = (e.clientY - rect.top) / scale - dragRef.current.offsetY;
    updateEl(dragRef.current.id, { x, y });
  };
  const onPointerUp = () => {
    if (dragRef.current) commitChange();
    dragRef.current = null;
  };

  const exportPNG = async () => {
    const node = canvasRef.current;
    const canvasEl = await html2canvas(node, { backgroundColor: canvas.background, scale: 2, useCORS: true, allowTaint: true });
    const link = document.createElement("a");
    link.download = "gurucraftpro-design.png";
    link.href = canvasEl.toDataURL("image/png");
    link.click();
  };
  const exportJPG = async () => {
    const node = canvasRef.current;
    const canvasEl = await html2canvas(node, { backgroundColor: canvas.background, scale: 2, useCORS: true, allowTaint: true });
    const link = document.createElement("a");
    link.download = "gurucraftpro-design.jpg";
    link.href = canvasEl.toDataURL("image/jpeg", 0.92);
    link.click();
  };
  const exportPDF = async () => {
    const node = canvasRef.current;
    const canvasEl = await html2canvas(node, { backgroundColor: canvas.background, scale: 2, useCORS: true, allowTaint: true });
    const imgData = canvasEl.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? "l" : "p", unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("gurucraftpro-design.pdf");
  };

  const saveDesign = async () => {
    if (!user) { toast.error("Login to save designs"); return; }
    const node = canvasRef.current;
    const canvasEl = await html2canvas(node, { backgroundColor: canvas.background, scale: 0.5, useCORS: true, allowTaint: true });
    const thumb = canvasEl.toDataURL("image/jpeg", 0.6);
    const name = prompt("Name this design:", `Design ${new Date().toLocaleDateString()}`);
    if (!name) return;
    await api.post("/designs", { name, thumbnail: thumb, data: { canvas, elements } });
    toast.success("Design saved!");
  };

  const selected = elements.find((e) => e.id === selectedId);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#05050A] flex flex-col" data-testid="studio-page">
      {/* Top toolbar */}
      <div className="border-b border-white/10 px-4 py-2 flex items-center justify-between flex-wrap gap-2 bg-[#0a0a12]">
        <div className="flex items-center gap-2">
          <button onClick={addText} className="toolbar-btn" data-testid="studio-add-text"><Type size={16} /> Text</button>
          <button onClick={() => addShape("rect")} className="toolbar-btn" data-testid="studio-add-rect"><Square size={16} /> Rect</button>
          <button onClick={() => addShape("circle")} className="toolbar-btn" data-testid="studio-add-circle"><Circle size={16} /> Circle</button>
          <button onClick={() => addShape("triangle")} className="toolbar-btn" data-testid="studio-add-triangle"><Triangle size={16} /> Tri</button>
          <button onClick={addImage} className="toolbar-btn" data-testid="studio-add-image"><ImageIcon size={16} /> URL Img</button>
          <label className="toolbar-btn cursor-pointer" data-testid="studio-upload-image">
            <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />
            <ImageIcon size={16} /> Upload
          </label>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={!history.length} className="toolbar-btn-icon" data-testid="studio-undo"><Undo2 size={16} /></button>
          <button onClick={redo} disabled={!future.length} className="toolbar-btn-icon" data-testid="studio-redo"><Redo2 size={16} /></button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button onClick={saveDesign} className="toolbar-btn" data-testid="studio-save"><Save size={14} /> Save</button>
          <button onClick={exportPNG} className="toolbar-btn" data-testid="studio-export-png"><FileImage size={14} /> PNG</button>
          <button onClick={exportJPG} className="toolbar-btn" data-testid="studio-export-jpg"><FileImage size={14} /> JPG</button>
          <button onClick={exportPDF} className="toolbar-btn" data-testid="studio-export-pdf"><FilePdf size={14} /> PDF</button>
        </div>
      </div>

      <style>{`
        .toolbar-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 12px; border-radius:8px; font-size:13px; color:#fff; background:#12121A; border:1px solid rgba(255,255,255,0.08); }
        .toolbar-btn:hover { background:#1a1a26; border-color:#7c3aed; }
        .toolbar-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .toolbar-btn-icon { padding:8px; border-radius:8px; color:#fff; background:#12121A; border:1px solid rgba(255,255,255,0.08); }
        .toolbar-btn-icon:hover { background:#1a1a26; border-color:#7c3aed; }
      `}</style>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[240px_1fr_280px]">
        {/* Left: templates */}
        <aside className="border-r border-white/10 p-3 overflow-auto max-h-[calc(100vh-140px)]" data-testid="studio-templates">
          <div className="flex items-center gap-2 mb-3 text-white/80 text-sm"><LayoutTemplate size={14} /> Templates</div>
          <div className="space-y-2">
            {templates.map((t) => (
              <button key={t.id} onClick={() => loadTemplate(t)} className="w-full text-left card-dark overflow-hidden group" data-testid={`studio-tpl-${t.id}`}>
                {t.thumbnail && <img src={t.thumbnail} alt={t.name} className="w-full h-24 object-cover" />}
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{t.name}</p>
                  <p className="text-[10px] text-white/50">{t.category}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <div id="canvas-wrap" className="flex items-center justify-center p-5 overflow-auto bg-[radial-gradient(ellipse_at_center,#0a0a12_0%,#05050A_70%)]"
             onMouseMove={onPointerMove} onMouseUp={onPointerUp} onMouseLeave={onPointerUp}>
          <div
            ref={canvasRef}
            onMouseDown={() => setSelectedId(null)}
            data-testid="studio-canvas"
            style={{
              width: canvas.width,
              height: canvas.height,
              background: canvas.background,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              position: "relative",
              marginBottom: canvas.height * (1 - scale),
              marginRight: canvas.width * (1 - scale),
              boxShadow: "0 0 40px rgba(124,58,237,0.25)",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {elements.map((el) => {
              const common = {
                position: "absolute",
                left: el.x, top: el.y,
                transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                outline: selectedId === el.id ? "2px solid #14b8a6" : "none",
                cursor: "move",
              };
              if (el.type === "text") return (
                <div key={el.id} style={{ ...common, width: el.w, fontSize: el.fontSize, color: el.color, fontFamily: el.fontFamily, fontWeight: el.bold ? 700 : 400, fontStyle: el.italic ? "italic" : "normal", lineHeight: 1.1 }}
                     onMouseDown={(e) => onPointerDown(e, el)}>{el.text}</div>
              );
              if (el.type === "rect") return (<div key={el.id} style={{ ...common, width: el.w, height: el.h, background: el.color }} onMouseDown={(e) => onPointerDown(e, el)} />);
              if (el.type === "circle") return (<div key={el.id} style={{ ...common, width: el.w, height: el.h, background: el.color, borderRadius: "50%" }} onMouseDown={(e) => onPointerDown(e, el)} />);
              if (el.type === "triangle") return (<div key={el.id} style={{ ...common, width: 0, height: 0, borderLeft: `${el.w / 2}px solid transparent`, borderRight: `${el.w / 2}px solid transparent`, borderBottom: `${el.h}px solid ${el.color}`, background: "transparent" }} onMouseDown={(e) => onPointerDown(e, el)} />);
              if (el.type === "image") return (<img key={el.id} src={el.src} alt="" crossOrigin="anonymous" style={{ ...common, width: el.w, height: el.h, objectFit: "cover" }} onMouseDown={(e) => onPointerDown(e, el)} />);
              return null;
            })}
          </div>
        </div>

        {/* Right: properties / layers */}
        <aside className="border-l border-white/10 p-4 overflow-auto max-h-[calc(100vh-140px)]" data-testid="studio-properties">
          <div className="mb-5">
            <p className="text-xs text-white/60 uppercase tracking-wider mb-2">Canvas</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <label className="text-xs">W
                <input type="number" value={canvas.width} onChange={(e) => setCanvas({ ...canvas, width: Number(e.target.value) })} className="w-full px-2 py-1 mt-1 rounded text-sm" />
              </label>
              <label className="text-xs">H
                <input type="number" value={canvas.height} onChange={(e) => setCanvas({ ...canvas, height: Number(e.target.value) })} className="w-full px-2 py-1 mt-1 rounded text-sm" />
              </label>
            </div>
            <p className="text-xs text-white/60 mb-1">Background</p>
            <div className="flex flex-wrap gap-1">
              {PALETTE.map((c) => (
                <button key={c} onClick={() => setCanvas({ ...canvas, background: c })} className="w-6 h-6 rounded border border-white/20" style={{ background: c }} />
              ))}
            </div>
          </div>

          {selected ? (
            <div className="space-y-3 border-t border-white/10 pt-4">
              <p className="text-xs text-white/60 uppercase tracking-wider">Element · {selected.type}</p>
              {selected.type === "text" && (
                <>
                  <textarea value={selected.text} onChange={(e) => updateEl(selected.id, { text: e.target.value })} onBlur={commitChange} className="w-full px-2 py-1 rounded text-sm" rows={2} />
                  <label className="text-xs">Font
                    <select value={selected.fontFamily} onChange={(e) => updateEl(selected.id, { fontFamily: e.target.value })} onBlur={commitChange} className="w-full px-2 py-1 mt-1 rounded text-sm">
                      {FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                    </select>
                  </label>
                  <label className="text-xs">Size
                    <input type="range" min="16" max="240" value={selected.fontSize} onChange={(e) => updateEl(selected.id, { fontSize: Number(e.target.value) })} onMouseUp={commitChange} className="w-full accent-[#7c3aed]" />
                    <span className="text-xs">{selected.fontSize}px</span>
                  </label>
                </>
              )}
              {(selected.type === "rect" || selected.type === "circle" || selected.type === "triangle") && (
                <>
                  <label className="text-xs">Width
                    <input type="number" value={selected.w} onChange={(e) => updateEl(selected.id, { w: Number(e.target.value) })} onBlur={commitChange} className="w-full px-2 py-1 mt-1 rounded text-sm" />
                  </label>
                  <label className="text-xs">Height
                    <input type="number" value={selected.h} onChange={(e) => updateEl(selected.id, { h: Number(e.target.value) })} onBlur={commitChange} className="w-full px-2 py-1 mt-1 rounded text-sm" />
                  </label>
                </>
              )}
              {selected.type === "image" && (
                <>
                  <label className="text-xs">Width
                    <input type="number" value={selected.w} onChange={(e) => updateEl(selected.id, { w: Number(e.target.value) })} onBlur={commitChange} className="w-full px-2 py-1 mt-1 rounded text-sm" />
                  </label>
                  <label className="text-xs">Height
                    <input type="number" value={selected.h} onChange={(e) => updateEl(selected.id, { h: Number(e.target.value) })} onBlur={commitChange} className="w-full px-2 py-1 mt-1 rounded text-sm" />
                  </label>
                </>
              )}
              {selected.type !== "image" && (
                <div>
                  <p className="text-xs mb-1">Color</p>
                  <div className="flex flex-wrap gap-1">
                    {PALETTE.map((c) => (
                      <button key={c} onClick={() => { updateEl(selected.id, { color: c }); commitChange(); }} className="w-6 h-6 rounded border border-white/20" style={{ background: c }} />
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-1 flex-wrap pt-2">
                <button onClick={() => duplicateEl(selected.id)} className="toolbar-btn text-xs" data-testid="studio-duplicate"><Copy size={12} /> Dup</button>
                <button onClick={() => moveLayer(selected.id, "up")} className="toolbar-btn text-xs"><ChevronUp size={12} /></button>
                <button onClick={() => moveLayer(selected.id, "down")} className="toolbar-btn text-xs"><ChevronDown size={12} /></button>
                <button onClick={() => deleteEl(selected.id)} className="toolbar-btn text-xs text-red-400" data-testid="studio-delete"><Trash2 size={12} /></button>
              </div>
            </div>
          ) : (
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-2"><Layers size={14} /> Layers</div>
              <div className="space-y-1">
                {elements.slice().reverse().map((e) => (
                  <button key={e.id} onClick={() => setSelectedId(e.id)} className={`w-full text-left text-xs px-2 py-1.5 rounded ${selectedId === e.id ? "bg-[#7c3aed]" : "hover:bg-white/5"}`}>
                    {e.type === "text" ? `Text: ${e.text.slice(0, 20)}` : e.type}
                  </button>
                ))}
                {elements.length === 0 && <p className="text-xs text-white/40">Add an element to get started</p>}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
