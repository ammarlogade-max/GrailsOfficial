import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { useAdminAuthStore } from "../../store/authStore";

export default function AdminLogin() {
  const { login, verifyMfa, mfaPending } = useAdminAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      if (!useAdminAuthStore.getState().mfaPending) navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitMfa(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await verifyMfa(mfaCode);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setSubmitting(false);
    }
  }

  if (mfaPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <ShieldCheck size={40} className="mx-auto text-[var(--color-primary)] mb-3" />
            <h1 className="font-display text-2xl text-white">Two-Factor Verification</h1>
            <p className="text-neutral-500 text-sm mt-1">Enter the 6-digit code from your authenticator app</p>
          </div>
          <form onSubmit={submitMfa} className="card bg-white p-6 space-y-4">
            <input
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="input text-center text-lg tracking-[0.3em]"
              placeholder="000000"
              inputMode="numeric"
              autoFocus
              required
            />
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button disabled={submitting || mfaCode.length !== 6} className="btn btn-dark w-full">{submitting ? "Verifying..." : "Verify & Sign In"}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/image.png" alt="Logo" className="w-16 h-16 object-contain mx-auto" />
          <h1 className="font-display text-3xl text-white mt-4">Grail's Official Admin</h1>
          <p className="text-neutral-500 text-sm mt-1">Sign in to manage your store</p>
        </div>
        <form onSubmit={submit} className="card bg-white p-6 space-y-4">
          <div>
            <label className="field-label">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-9" type="email" required />
            </div>
          </div>
          <div>
            <label className="field-label">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-9" type="password" required />
            </div>
          </div>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button disabled={submitting} className="btn btn-dark w-full">{submitting ? "Signing in..." : "Sign In"}</button>
        </form>
      </div>
    </div>
  );
}
