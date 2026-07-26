import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useToastStore } from "../../store/toastStore";
import { useSEO } from "../../lib/useSEO";

export default function Login() {
  useSEO({ title: "Login", index: false });

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      showToast("Welcome back!", "success");
      navigate("/account");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Login failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-display text-3xl text-center">Welcome Back</h1>
      <p className="text-neutral-500 text-sm text-center mt-1">Login to track orders and manage your wishlist</p>
      <form onSubmit={submit} className="card p-6 mt-6 space-y-4">
        <div>
          <label className="field-label">Email</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-9" />
          </div>
        </div>
        <div>
          <label className="field-label">Password</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-9" placeholder="Your password" />
          </div>
        </div>
        <button disabled={submitting} className="btn btn-primary w-full">{submitting ? "Signing in..." : "Login"}</button>
      </form>
      <p className="text-center text-sm mt-5 text-neutral-500">
        New here? <Link to="/register" className="text-[var(--color-primary)] font-medium">Create an account</Link>
      </p>
    </div>
  );
}
