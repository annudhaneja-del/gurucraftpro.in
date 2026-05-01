import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import {
  Package, Download, Palette, User as UserIcon, Trash2, Save,
  FileDown, LogOut, KeyRound, MessageCircle
} from "lucide-react";
import { toast } from "sonner";

const TABS = [
  { id: "overview", label: "Overview", icon: UserIcon },
  { id: "orders", label: "Orders", icon: Package },
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "designs", label: "Saved Designs", icon: Palette },
  { id: "profile", label: "Profile", icon: KeyRound },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("overview");
  const [orders, setOrders] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [downloads, setDownloads] = useState([]);

  useEffect(() => {
    api.get("/orders/me").then((r) => setOrders(r.data)).catch(() => {});
    api.get("/designs").then((r) => setDesigns(r.data)).catch(() => {});
    api.get("/downloads/me").then((r) => setDownloads(r.data)).catch(() => {});
  }, []);

  const deleteDesign = async (id) => {
    await api.delete(`/designs/${id}`);
    setDesigns((prev) => prev.filter((d) => d.id !== id));
    toast.success("Design deleted");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="dashboard-page">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-[#14b8a6] text-sm tracking-widest uppercase mb-2">Dashboard</p>
          <h1 className="font-display text-5xl">Hi, {user?.name?.split(" ")[0]}</h1>
          <p className="text-white/50 text-sm mt-1">{user?.email}</p>
        </div>
        <button onClick={logout} className="btn-secondary text-sm" data-testid="dashboard-logout">
          <LogOut size={14} /> Logout
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto mb-6 border-b border-white/10 pb-2">
        {TABS.map((t) => {
          const Ic = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap ${tab === t.id ? "bg-[#7c3aed] text-white" : "text-white/60 hover:bg-white/5"}`}
              data-testid={`dash-tab-${t.id}`}
            >
              <Ic size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <Overview orders={orders} designs={designs} downloads={downloads} />}
      {tab === "orders" && <OrdersTab orders={orders} />}
      {tab === "downloads" && <DownloadsTab downloads={downloads} />}
      {tab === "designs" && <DesignsTab designs={designs} onDelete={deleteDesign} />}
      {tab === "profile" && <ProfileTab />}
    </div>
  );
}

function Overview({ orders, designs, downloads }) {
  return (
    <div className="grid md:grid-cols-4 gap-4">
      {[
        { icon: Package, label: "Orders", value: orders.length, color: "#7c3aed" },
        { icon: Download, label: "Downloads", value: downloads.length, color: "#14b8a6" },
        { icon: Palette, label: "Saved Designs", value: designs.length, color: "#f59e0b" },
        { icon: UserIcon, label: "Member", value: "Active", color: "#ec4899" },
      ].map((s) => {
        const Ic = s.icon;
        return (
          <div key={s.label} className="card-dark p-5" data-testid={`dash-stat-${s.label.toLowerCase()}`}>
            <Ic style={{ color: s.color }} className="mb-2" size={20} />
            <p className="text-xs text-white/50 uppercase tracking-wider">{s.label}</p>
            <p className="font-display text-3xl mt-1">{s.value}</p>
          </div>
        );
      })}
    </div>
  );
}

function OrdersTab({ orders }) {
  if (orders.length === 0) return <div className="card-dark p-8 text-center text-white/50">No orders yet. <Link to="/shop" className="text-[#14b8a6]">Browse shop →</Link></div>;
  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="card-dark p-5" data-testid={`dash-order-${o.id}`}>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
            <div>
              <p className="font-mono text-xs text-white/50">#{o.id.slice(0, 8)}</p>
              <p className="text-sm font-medium mt-1">{o.items.map((i) => i.title).join(", ")}</p>
              <p className="text-xs text-white/50 mt-1">{new Date(o.created_at).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-xl text-[#7c3aed]">₹{o.total}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === "paid" ? "bg-[#25D366]/20 text-[#25D366]" : o.status === "pending" ? "bg-[#f59e0b]/20 text-[#f59e0b]" : "bg-white/10"}`}>{o.status}</span>
            </div>
          </div>
          <div className="flex gap-2 pt-3 border-t border-white/10">
            <a
              href={`https://wa.me/918527837527?text=${encodeURIComponent(`Hi, about order ${o.id.slice(0, 8)}`)}`}
              target="_blank" rel="noreferrer" className="btn-whatsapp text-xs py-1 px-3"
            ><MessageCircle size={12} /> Support</a>
          </div>
        </div>
      ))}
    </div>
  );
}

function DownloadsTab({ downloads }) {
  if (downloads.length === 0) return (
    <div className="card-dark p-8 text-center text-white/50">
      No downloads yet. Purchased digital products and learning content will appear here.
    </div>
  );
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {downloads.map((d, i) => (
        <div key={`${d.order_id}-${i}`} className="card-dark overflow-hidden" data-testid={`dash-download-${i}`}>
          {d.image && <img src={d.image} alt={d.title} className="w-full h-40 object-cover" />}
          <div className="p-4">
            <p className="text-xs text-[#14b8a6] uppercase tracking-wider">{d.type}</p>
            <h3 className="font-medium mt-1 line-clamp-2">{d.title}</h3>
            <p className="text-xs text-white/40 mt-1">{new Date(d.date).toLocaleDateString()}</p>
            {d.file_url ? (
              <a href={d.file_url} target="_blank" rel="noreferrer" className="btn-primary text-xs mt-3 w-full justify-center" data-testid={`dash-download-btn-${i}`}>
                <FileDown size={12} /> Download
              </a>
            ) : (
              <a
                href={`https://wa.me/918527837527?text=${encodeURIComponent(`Hi, please send download link for: ${d.title}`)}`}
                target="_blank" rel="noreferrer" className="btn-whatsapp text-xs mt-3 w-full justify-center"
              ><MessageCircle size={12} /> Request on WhatsApp</a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DesignsTab({ designs, onDelete }) {
  if (designs.length === 0) return (
    <div className="card-dark p-8 text-center text-white/50">
      No designs saved. <Link to="/studio" className="text-[#14b8a6]">Open Design Studio →</Link>
    </div>
  );
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Link to="/studio" className="btn-primary text-sm"><Palette size={14} /> New Design</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {designs.map((d) => (
          <div key={d.id} className="card-dark overflow-hidden relative group" data-testid={`dash-design-${d.id}`}>
            {d.thumbnail && <img src={d.thumbnail} alt={d.name} className="w-full aspect-square object-cover" />}
            <div className="p-3">
              <p className="text-sm font-medium truncate">{d.name}</p>
              <p className="text-[10px] text-white/40">{new Date(d.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={() => onDelete(d.id)} className="absolute top-2 right-2 bg-red-500/70 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const [f, setF] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [pw, setPw] = useState({ current_password: "", new_password: "" });
  const [saving, setSaving] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/auth/me", f);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update failed");
    } finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (!pw.current_password || !pw.new_password) return toast.error("Fill both fields");
    setSaving(true);
    try {
      await api.put("/auth/me", pw);
      toast.success("Password changed");
      setPw({ current_password: "", new_password: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Change failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6" data-testid="dash-profile">
      <form onSubmit={saveProfile} className="card-dark p-6 space-y-4">
        <h3 className="font-display text-2xl">Personal Info</h3>
        <label className="block text-xs">Name
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-lg" data-testid="profile-name" />
        </label>
        <label className="block text-xs">Phone
          <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="w-full mt-1 px-4 py-3 rounded-lg" data-testid="profile-phone" />
        </label>
        <div className="text-xs text-white/50">Email: {user?.email} (cannot be changed)</div>
        <button type="submit" disabled={saving} className="btn-primary w-full justify-center" data-testid="profile-save">
          <Save size={14} /> {saving ? "Saving..." : "Save"}
        </button>
      </form>

      <form onSubmit={changePassword} className="card-dark p-6 space-y-4">
        <h3 className="font-display text-2xl">Change Password</h3>
        <input type="password" placeholder="Current password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} className="w-full px-4 py-3 rounded-lg" data-testid="profile-current-password" />
        <input type="password" placeholder="New password (min 6)" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} className="w-full px-4 py-3 rounded-lg" data-testid="profile-new-password" />
        <button type="submit" disabled={saving} className="btn-primary w-full justify-center" data-testid="profile-change-password">
          <KeyRound size={14} /> {saving ? "..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
