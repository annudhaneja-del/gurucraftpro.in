import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "", phone: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(f);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Signup failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] max-w-md mx-auto px-4 py-16 flex flex-col justify-center" data-testid="signup-page">
      <div className="card-dark p-8">
        <h1 className="font-display text-4xl mb-2">Create Account</h1>
        <p className="text-white/60 text-sm mb-6">Join GurucraftPro and start crafting.</p>
        <form onSubmit={submit} className="space-y-4">
          <input placeholder="Full Name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="w-full px-4 py-3 rounded-lg" data-testid="signup-name" />
          <input type="email" placeholder="Email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="w-full px-4 py-3 rounded-lg" data-testid="signup-email" />
          <input placeholder="Phone (optional)" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="w-full px-4 py-3 rounded-lg" data-testid="signup-phone" />
          <input type="password" placeholder="Password (min 6)" required minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="w-full px-4 py-3 rounded-lg" data-testid="signup-password" />
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center" data-testid="signup-submit">
            <UserPlus size={16} /> {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>
        <p className="text-sm text-white/60 mt-4 text-center">
          Already have an account? <Link to="/login" className="text-[#14b8a6]" data-testid="signup-login-link">Login</Link>
        </p>
      </div>
    </div>
  );
}
