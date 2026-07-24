import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomepageBanner } from "../../store/cmsStore";
import ProductImage from "./ProductImage";

interface OfferBannerStripProps {
  banners: HomepageBanner[];
}

/**
 * Auto-sliding, infinite-loop promotional banner carousel — the SRS's
 * <OfferBannerStrip/>, reading homepage_banners directly below the hero.
 * Built with plain state + CSS transitions rather than a carousel
 * library: this app already paid a real bundle-size cost once (jsPDF/
 * html2canvas) for a feature that needed it; a 3-slide autoplay
 * carousel doesn't.
 */
export default function OfferBannerStrip({ banners }: OfferBannerStripProps) {
  const active = banners.filter((b) => b.active).sort((a, b) => a.sortOrder - b.sortOrder);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active.length <= 1 || paused) return;
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % active.length), 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [active.length, paused]);

  if (active.length === 0) return null;

  function go(i: number) {
    setIndex((i + active.length) % active.length);
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div
        className="relative rounded-xl overflow-hidden h-56 sm:h-72"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="relative w-full h-full">
          {active.map((b, i) => (
            <Link
              key={b.id}
              to={b.buttonLink}
              className="absolute inset-0 flex items-end transition-opacity duration-700"
              style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? "auto" : "none", background: "var(--color-secondary)" }}
              aria-hidden={i !== index}
            >
              <ProductImage src={b.photo} alt={b.title} className="absolute inset-0 opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <span className="badge absolute top-3 left-3" style={{ background: b.badgeColor, color: "#fff" }}>
                {b.badgeText}
              </span>
              <div className="relative p-4 sm:p-6 text-white">
                <div className="font-display text-2xl sm:text-3xl leading-none">{b.title}</div>
                <div className="text-sm text-neutral-200 mt-1">{b.subtitle}</div>
                <span className="inline-flex items-center gap-1 text-xs font-label mt-2 border-b border-white/60">{b.buttonText}</span>
              </div>
            </Link>
          ))}
        </div>

        {active.length > 1 && (
          <>
            <button
              onClick={() => go(index - 1)}
              aria-label="Previous offer"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => go(index + 1)}
              aria-label="Next offer"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {active.map((b, i) => (
                <button
                  key={b.id}
                  onClick={() => go(i)}
                  aria-label={`Go to offer ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
