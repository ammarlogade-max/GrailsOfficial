import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { useNewsletterStore } from "../../store/newsletterStore";

/**
 * Email capture section. Not part of the original SRS text (verified —
 * there's no "newsletter" requirement anywhere in the spec), added as a
 * reasonable low-risk extra since it was requested. Actually persists to
 * a real newsletter_subscribers table rather than just being decorative
 * UI that goes nowhere.
 */
export default function NewsletterSignup() {
  const { subscribe, subscribed, loading } = useNewsletterStore();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await subscribe(email);
    setMessage({ text: result.message, ok: result.success });
    if (result.success) setEmail("");
  }

  return (
    <section className="py-14" style={{ background: "var(--color-secondary)" }}>
      <div className="max-w-xl mx-auto px-4 text-center">
        <Mail size={28} className="mx-auto text-[var(--color-primary)] mb-3" />
        <h2 className="text-display text-2xl sm:text-3xl text-white">Stay in the Loop</h2>
        <p className="text-neutral-400 text-sm mt-2 mb-6">Get early access to new drops, restocks, and subscriber-only offers.</p>
        {subscribed ? (
          <p className="flex items-center justify-center gap-2 text-white text-sm">
            <Check size={16} className="text-green-400" /> {message?.text}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input flex-1 !bg-white"
            />
            <button disabled={loading} className="btn btn-primary shrink-0">
              {loading ? "Joining..." : "Subscribe"}
            </button>
          </form>
        )}
        {message && !message.ok && <p className="text-rose-400 text-sm mt-3">{message.text}</p>}
      </div>
    </section>
  );
}
