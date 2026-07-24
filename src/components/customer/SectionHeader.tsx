import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function SectionHeader({
  eyebrow, title, subtitle, ctaLink, ctaText = "View All",
}: { eyebrow?: string; title: string; subtitle?: string; ctaLink?: string; ctaText?: string }) {
  return (
    <div className="flex items-end justify-between mb-6 sm:mb-8">
      <div>
        {eyebrow && <div className="eyebrow text-[var(--color-primary)] mb-1.5">{eyebrow}</div>}
        <h2 className="text-display text-3xl sm:text-4xl">{title}</h2>
        {subtitle && <p className="text-neutral-500 mt-1.5 text-sm sm:text-base">{subtitle}</p>}
      </div>
      {ctaLink && (
        <Link to={ctaLink} className="hidden sm:flex items-center gap-1 font-label text-sm shrink-0 hover:text-[var(--color-primary)] transition-colors">
          {ctaText} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
