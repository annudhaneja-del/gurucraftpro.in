import React, { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import {
  LayoutDashboard, Package, Box, Star, Image as Img, GraduationCap, LayoutTemplate,
  Ticket, MessageSquare, Users, TrendingUp, Plus, Trash2, Save, Inbox
} from "lucide-react";

const TABS = [
  { id: "stats", label: "Overview", icon: LayoutDashboard },
  { id: "services", label: "Services", icon: Package },
  { id: "products", label: "Products", icon: Box },
  { id: "learning", label: "Learning", icon: GraduationCap },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "testimonials", label: "Testimonials", icon: Star },
  { id: "gallery", label: "Gallery", icon: Img },
  { id: "coupons", label: "Coupons", icon: Ticket },
  { id: "orders", label: "Orders", icon: TrendingUp },
  { id: "contacts", label: "Messages", icon: MessageSquare },
  { id: "users", label: "Users", icon: Users },
];

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState("stats");

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col md:flex-row" data-testid="admin-page">
      <aside className="md:w-56 md:min-h-[calc(100vh-64px)] border-r border-white/10 bg-[#0a0a12] p-3 overflow-x-auto md:overflow-x-visible">
        <p className="text-xs text-white/50 px-2 py-1 uppercase tracking-wider">Admin · {user?.name}</p>
        <nav className="flex md:flex-col gap-1 mt-2">
          {TABS.map((t) => {
            const Ic = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${tab === t.id ? "bg-[#7c3aed] text-white" : "text-white/60 hover:bg-white/5"}`}
                data-testid={`admin-tab-${t.id}`}
              >
                <Ic size={14} /> {t.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        {tab === "stats" && <Stats />}
        {tab === "services" && <CrudPanel name="services" endpoint="/services" fields={serviceFields} titleKey="title" />}
        {tab === "products" && <CrudPanel name="products" endpoint="/products" fields={productFields} titleKey="title" />}
        {tab === "learning" && <CrudPanel name="learning" endpoint="/learning" fields={learningFields} titleKey="title" />}
        {tab === "templates" && <CrudPanel name="templates" endpoint="/templates" fields={templateFields} titleKey="name" />}
        {tab === "testimonials" && <CrudPanel name="testimonials" endpoint="/testimonials" fields={testimonialFields} titleKey="name" />}
        {tab === "gallery" && <CrudPanel name="gallery" endpoint="/gallery" fields={galleryFields} titleKey="title" />}
        {tab === "coupons" && <CrudPanel name="coupons" endpoint="/coupons" fields={couponFields} titleKey="code" />}
        {tab === "orders" && <OrdersList />}
        {tab === "contacts" && <ContactsList />}
        {tab === "users" && <UsersList />}
      </main>
    </div>
  );
}

// ---- Stats ----
function Stats() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/admin/stats").then((r) => setS(r.data)); }, []);
  if (!s) return <div className="text-white/60">Loading...</div>;
  const cards = [
    { label: "Total Users", value: s.users, color: "#7c3aed" },
    { label: "Orders", value: s.orders, color: "#14b8a6" },
    { label: "Paid Orders", value: s.paid_orders, color: "#25D366" },
    { label: "Revenue", value: `₹${s.revenue.toLocaleString("en-IN")}`, color: "#f59e0b" },
    { label: "Services", value: s.services, color: "#ec4899" },
    { label: "Products", value: s.products, color: "#06b6d4" },
    { label: "Messages", value: s.contacts, color: "#a855f7" },
  ];
  return (
    <div>
      <h1 className="font-display text-4xl mb-6">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card-dark p-5" data-testid={`admin-stat-${c.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">{c.label}</p>
            <p className="font-display text-3xl" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Generic CRUD ----
function CrudPanel({ name, endpoint, fields, titleKey }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(defaults(fields));
  const [editingId, setEditingId] = useState(null);

  const load = () => api.get(endpoint).then((r) => setItems(r.data));
  useEffect(() => { load(); }, [endpoint]);

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = preparePayload(form, fields);
      if (editingId) {
        await api.put(`${endpoint}/${editingId}`, payload);
        toast.success("Updated");
      } else {
        await api.post(endpoint, payload);
        toast.success("Created");
      }
      setForm(defaults(fields));
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Save failed");
    }
  };

  const del = async (id) => {
    if (!window.confirm("Delete?")) return;
    await api.delete(`${endpoint}/${id}`);
    toast.success("Deleted");
    load();
  };

  const edit = (it) => {
    const f = {};
    fields.forEach((fld) => {
      if (fld.type === "list") f[fld.name] = (it[fld.name] || []).join(", ");
      else f[fld.name] = it[fld.name] ?? (fld.type === "boolean" ? false : fld.type === "number" ? 0 : "");
    });
    setForm(f);
    setEditingId(it.id);
  };

  return (
    <div>
      <h1 className="font-display text-4xl mb-6 capitalize">{name}</h1>
      <form onSubmit={save} className="card-dark p-5 mb-6 grid grid-cols-1 md:grid-cols-2 gap-3" data-testid={`admin-${name}-form`}>
        {fields.map((f) => (
          <FieldInput key={f.name} field={f} value={form[f.name]} onChange={(v) => setForm({ ...form, [f.name]: v })} />
        ))}
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="btn-primary" data-testid={`admin-${name}-save`}>
            <Save size={14} /> {editingId ? "Update" : "Create"}
          </button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(defaults(fields)); }} className="btn-secondary">Cancel</button>}
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <div key={it.id} className="card-dark p-4" data-testid={`admin-${name}-item-${it.id}`}>
            {it.image || it.thumbnail ? <img src={it.image || it.thumbnail} alt="" className="w-full h-32 object-cover rounded mb-2" /> : null}
            <p className="font-medium text-sm truncate">{it[titleKey]}</p>
            {it.category && <p className="text-xs text-white/50">{it.category}</p>}
            {it.price !== undefined && <p className="text-xs text-[#7c3aed]">₹{it.price}</p>}
            {it.percent !== undefined && <p className="text-xs text-[#14b8a6]">{it.percent}% OFF</p>}
            <div className="flex gap-2 mt-3">
              {fields.length > 2 && <button onClick={() => edit(it)} className="btn-secondary text-xs py-1 px-3">Edit</button>}
              <button onClick={() => del(it.id)} className="text-red-400 text-xs py-1 px-3 border border-red-400/30 rounded-full inline-flex items-center gap-1"><Trash2 size={10} /> Del</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-white/50 col-span-3">No {name} yet.</p>}
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange }) {
  if (field.type === "boolean") return (
    <label className="flex items-center gap-2 text-sm col-span-2"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {field.label}</label>
  );
  if (field.type === "textarea") return (
    <label className="text-xs md:col-span-2">{field.label}
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg text-sm" rows={3} />
    </label>
  );
  if (field.type === "select") return (
    <label className="text-xs">{field.label}
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg text-sm">
        {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
  return (
    <label className="text-xs">{field.label}
      <input
        type={field.type === "number" ? "number" : "text"}
        value={value ?? ""} onChange={(e) => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
        className="w-full mt-1 px-3 py-2 rounded-lg text-sm" placeholder={field.placeholder}
      />
    </label>
  );
}

const defaults = (fields) => {
  const o = {};
  fields.forEach((f) => { o[f.name] = f.type === "boolean" ? false : f.type === "number" ? 0 : ""; });
  return o;
};
const preparePayload = (form, fields) => {
  const o = {};
  fields.forEach((f) => {
    if (f.type === "list") o[f.name] = (form[f.name] || "").split(",").map((s) => s.trim()).filter(Boolean);
    else o[f.name] = form[f.name];
  });
  return o;
};

const serviceFields = [
  { name: "title", label: "Title", type: "text" },
  { name: "slug", label: "Slug", type: "text" },
  { name: "category", label: "Category", type: "text" },
  { name: "short_desc", label: "Short description", type: "text" },
  { name: "description", label: "Full description", type: "textarea" },
  { name: "price", label: "Price (₹)", type: "number" },
  { name: "original_price", label: "Original Price", type: "number" },
  { name: "image", label: "Image URL", type: "text" },
  { name: "features", label: "Features (comma-sep)", type: "list" },
  { name: "whatsapp_message", label: "WhatsApp Message", type: "text" },
  { name: "featured", label: "Featured", type: "boolean" },
];
const productFields = [
  { name: "title", label: "Title", type: "text" },
  { name: "category", label: "Category", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "price", label: "Price (₹)", type: "number" },
  { name: "original_price", label: "Original Price", type: "number" },
  { name: "image", label: "Image URL", type: "text" },
  { name: "stock", label: "Stock", type: "number" },
  { name: "file_url", label: "Download URL", type: "text" },
];
const learningFields = [
  { name: "title", label: "Title", type: "text" },
  { name: "type", label: "Type", type: "select", options: ["pdf", "course", "prompt"] },
  { name: "description", label: "Description", type: "textarea" },
  { name: "price", label: "Price (₹)", type: "number" },
  { name: "is_free", label: "Free", type: "boolean" },
  { name: "image", label: "Image URL", type: "text" },
  { name: "file_url", label: "File URL", type: "text" },
  { name: "content", label: "Content", type: "textarea" },
];
const templateFields = [
  { name: "name", label: "Name", type: "text" },
  { name: "category", label: "Category", type: "text" },
  { name: "thumbnail", label: "Thumbnail URL", type: "text" },
];
const testimonialFields = [
  { name: "name", label: "Name", type: "text" },
  { name: "location", label: "Location", type: "text" },
  { name: "rating", label: "Rating", type: "number" },
  { name: "text", label: "Text", type: "textarea" },
  { name: "avatar", label: "Avatar URL", type: "text" },
];
const galleryFields = [
  { name: "title", label: "Title", type: "text" },
  { name: "image", label: "Image URL", type: "text" },
  { name: "category", label: "Category", type: "text" },
];
const couponFields = [
  { name: "code", label: "Code", type: "text" },
  { name: "percent", label: "Percent", type: "number" },
  { name: "active", label: "Active", type: "boolean" },
];

// ---- Orders ----
function OrdersList() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.get("/orders").then((r) => setOrders(r.data)); }, []);
  const updateStatus = async (id, status) => {
    await api.put(`/orders/${id}/status`, null, { params: { status_val: status } });
    toast.success("Updated");
    api.get("/orders").then((r) => setOrders(r.data));
  };
  return (
    <div>
      <h1 className="font-display text-4xl mb-6">Orders</h1>
      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="card-dark p-4 flex flex-wrap gap-4 items-center justify-between" data-testid={`admin-order-${o.id}`}>
            <div>
              <p className="font-mono text-xs text-white/50">{o.id.slice(0, 8)}</p>
              <p className="text-sm">{o.customer_name} · {o.customer_phone}</p>
              <p className="text-xs text-white/60">{o.items.map((i) => i.title).join(", ")}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-xl text-[#7c3aed]">₹{o.total}</p>
              <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} className="mt-1 px-2 py-1 rounded text-xs">
                {["pending", "paid", "cancelled", "shipped", "delivered"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ))}
        {orders.length === 0 && <p className="text-white/50">No orders yet.</p>}
      </div>
    </div>
  );
}

function ContactsList() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get("/contact").then((r) => setList(r.data)); }, []);
  return (
    <div>
      <h1 className="font-display text-4xl mb-6">Messages</h1>
      <div className="space-y-2">
        {list.map((c) => (
          <div key={c.id} className="card-dark p-4" data-testid={`admin-msg-${c.id}`}>
            <div className="flex justify-between mb-1">
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-white/50">{new Date(c.created_at).toLocaleString()}</span>
            </div>
            <p className="text-xs text-white/60 mb-1">{c.email} · {c.phone}</p>
            {c.subject && <p className="text-sm text-[#14b8a6]">Subject: {c.subject}</p>}
            <p className="text-sm text-white/80 mt-1">{c.message}</p>
          </div>
        ))}
        {list.length === 0 && <div className="text-white/50 flex items-center gap-2"><Inbox size={16} /> No messages yet.</div>}
      </div>
    </div>
  );
}

function UsersList() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get("/admin/users").then((r) => setList(r.data)); }, []);
  return (
    <div>
      <h1 className="font-display text-4xl mb-6">Users</h1>
      <div className="space-y-2">
        {list.map((u) => (
          <div key={u.id} className="card-dark p-4 flex justify-between items-center" data-testid={`admin-user-${u.id}`}>
            <div>
              <p className="font-medium">{u.name} <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-[#7c3aed]" : "bg-white/10"}`}>{u.role}</span></p>
              <p className="text-xs text-white/60">{u.email} · {u.phone || "—"}</p>
            </div>
            <span className="text-xs text-white/40">{new Date(u.created_at).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
