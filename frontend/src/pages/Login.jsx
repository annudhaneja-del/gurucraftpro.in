import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome, ${user.name}!`);
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] max-w-md mx-auto px-4 py-16 flex flex-col justify-center" data-testid="login-page">
      <div className="card-dark p-8">
        <h1 className="font-display text-4xl mb-2">Welcome Back</h1>
        <p className="text-white/60 text-sm mb-6">Login to access your dashboard & saved designs.</p>
        <form onSubmit={submit} className="space-y-4">
          <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg" data-testid="login-email" />
          <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg" data-testid="login-password" />
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center" data-testid="login-submit">
            <LogIn size={16} /> {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-sm text-white/60 mt-4 text-center">
          New here? <Link to="/signup" className="text-[#14b8a6]" data-testid="login-signup-link">Create an account</Link>
        </p>
        <div className="text-xs text-white/40 mt-6 border-t border-white/10 pt-4">
          <p>Admin: admin@gurucraftpro.in / Gurucraftpro</p>
        </div>
      </div>
    </div>
  );
}
