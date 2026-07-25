import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useToastStore } from "../../store/toastStore";
import { isSupabaseConfigured } from "../../lib/supabase";
import { useSEO } from "../../lib/useSEO";

export default function Register() {
  useSEO({ title: "Create Your Account", index: false });

  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const showToast = useToastStore((s) => s.show);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(form.fullName, form.email, form.phone, form.password);
      showToast(
        isSupabaseConfigured ? "Account created! Check your email to confirm, then log in." : "Account created successfully!",
        "success"
      );
      navigate(isSupabaseConfigured ? "/login" : "/account");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Registration failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-display text-3xl text-center">Create Account</h1>
      <p className="text-neutral-500 text-sm text-center mt-1">Join Grail's Official for faster checkout & order tracking</p>
      <form onSubmit={submit} className="card p-6 mt-6 space-y-4">
        <div>
          <label className="field-label">Full Name</label>
          <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input" />
        </div>
        <div>
          <label className="field-label">Email</label>
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
        </div>
        <div>
          <label className="field-label">Phone Number</label>
          <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
        </div>
        <div>
          <label className="field-label">Password</label>
          <input required minLength={6} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" />
        </div>
        <button disabled={submitting} className="btn btn-primary w-full">{submitting ? "Creating account..." : "Create Account"}</button>
      </form>
      <p className="text-center text-sm mt-5 text-neutral-500">
        Already have an account? <Link to="/login" className="text-[var(--color-primary)] font-medium">Login</Link>
      </p>
    </div>
  );
}
