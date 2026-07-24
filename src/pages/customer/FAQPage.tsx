import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useFAQStore } from "../../store/faqStore";
import { useSEO } from "../../lib/useSEO";

export default function FAQPage() {
  const { faqs, fetchAll } = useFAQStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const active = faqs.filter((f) => f.active).sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useSEO({
    title: "Frequently Asked Questions",
    description: "Answers to common questions about shipping, payments, returns, and more.",
    path: "/faq",
    jsonLd:
      active.length > 0
        ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: active.map((f) => ({
              "@type": "Question",
              name: f.question,
              acceptedAnswer: { "@type": "Answer", text: f.answer },
            })),
          }
        : undefined,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-display text-3xl mb-2">Frequently Asked Questions</h1>
      <p className="text-neutral-500 mb-8">Can't find what you're looking for? Message us on WhatsApp from the footer.</p>
      <div className="space-y-2">
        {active.map((f) => (
          <div key={f.id} className="card overflow-hidden">
            <button
              onClick={() => setOpenId(openId === f.id ? null : f.id)}
              className="w-full flex items-center justify-between gap-4 p-4 text-left"
            >
              <span className="font-medium text-sm">{f.question}</span>
              <ChevronDown size={16} className={`shrink-0 text-neutral-400 transition-transform ${openId === f.id ? "rotate-180" : ""}`} />
            </button>
            {openId === f.id && <div className="px-4 pb-4 text-sm text-neutral-600">{f.answer}</div>}
          </div>
        ))}
        {active.length === 0 && <p className="text-sm text-neutral-400">No FAQs published yet.</p>}
      </div>
    </div>
  );
}
