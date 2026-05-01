import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import api from "../lib/api";
import { Package, Download, Palette, User as UserIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [designs, setDesigns] = useState([]);

  useEffect(() => {
    api.get("/orders/me").then((r) => setOrders(r.data)).catch(() => {});
    api.get("/designs").then((r) => setDesigns(r.data)).catch(() => {});
  }, []);

  const deleteDesign = async (id) => {
    await api.delete(`/designs/${id}`);
    setDesigns((prev) => prev.filter((d) => d.id !== id));
    toast.success("Design deleted");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" data-testid="dashboard-page">
      <div className="mb-8">
        <p className="text-[#14b8a6] text-sm tracking-widest uppercase mb-2">Dashboard</p>
        <h1 className="font-display text-5xl">Hi, {user?.name?.split(" ")[0]}</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <div className="card-dark p-5">
          <Package className="text-[#7c3aed] mb-2" size={20} />
          <p className="text-xs text-white/50 uppercase tracking-wider">Orders</p>
          <p className="font-display text-3xl">{orders.length}</p>
        </div>
        <div className="card-dark p-5">
          <Palette className="text-[#14b8a6] mb-2" size={20} />
          <p className="text-xs text-white/50 uppercase tracking-wider">Saved Designs</p>
          <p className="font-display text-3xl">{designs.length}</p>
        </div>
        <div className="card-dark p-5">
          <UserIcon className="text-[#f59e0b] mb-2" size={20} />
          <p className="text-xs text-white/50 uppercase tracking-wider">Email</p>
          <p className="text-sm truncate">{user?.email}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-display text-2xl mb-4">Recent Orders</h2>
          <div className="space-y-2">
            {orders.length === 0 && <p className="text-white/50 text-sm">No orders yet.</p>}
            {orders.map((o) => (
              <div key={o.id} className="card-dark p-4 flex justify-between items-center" data-testid={`dashboard-order-${o.id}`}>
                <div>
                  <p className="text-sm font-medium">{o.items.map(i => i.title).join(", ")}</p>
                  <p className="text-xs text-white/50">₹{o.total} · {o.status}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${o.status === "paid" ? "bg-[#25D366]/20 text-[#25D366]" : "bg-white/10"}`}>{o.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl">Saved Designs</h2>
            <Link to="/studio" className="text-xs text-[#14b8a6]">+ New design</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {designs.length === 0 && <p className="text-white/50 text-sm col-span-2">No designs saved. <Link to="/studio" className="text-[#14b8a6]">Open Studio →</Link></p>}
            {designs.map((d) => (
              <div key={d.id} className="card-dark overflow-hidden relative group" data-testid={`dashboard-design-${d.id}`}>
                {d.thumbnail && <img src={d.thumbnail} alt={d.name} className="w-full aspect-square object-cover" />}
                <div className="p-3">
                  <p className="text-sm font-medium truncate">{d.name}</p>
                </div>
                <button onClick={() => deleteDesign(d.id)} className="absolute top-2 right-2 bg-red-500/70 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
