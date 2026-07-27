import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { HeroContent } from "../../store/cmsStore";
import ProductImage from "./ProductImage";

interface HeroSectionProps {
  hero: HeroContent;
}

/**
 * Renders the homepage hero per the SRS's HeroSection architecture:
 * <VideoHero/> when bg_type is 'video', <ImageHero/> otherwise. The video
 * path autoplays muted and loops (the only way browsers allow autoplay),
 * is lazy about bandwidth on mobile (preload="metadata", not the whole
 * file), and falls back to the poster/photo image if the video fails to
 * load or can't play — a slow connection or an unsupported codec should
 * never leave the hero blank.
 */
export default function HeroSection({ hero }: HeroSectionProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const alignClass =
    hero.textAlignment === "center"
      ? "items-center text-center mx-auto"
      : hero.textAlignment === "right"
        ? "items-end text-right ml-auto"
        : "items-start text-left";

  const showVideo = hero.bgType === "video" && !!hero.videoUrl && !videoFailed;
  const hasContent = !!hero.heading || !!hero.photo;

  if (!hasContent) return null;

  return (
    <section className="relative overflow-hidden cut-edge-bottom" style={{ background: "var(--color-secondary)" }}>
      <div className="absolute inset-0 opacity-90 overflow-hidden">
        {showVideo ? (
          <video
            className="w-full h-full object-cover scale-110"
            src={hero.videoUrl}
            poster={hero.posterImage || hero.photo}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => setVideoFailed(true)}
          />
        ) : (
          <ProductImage src={hero.photo} alt={hero.heading} eager className="object-cover scale-110" />
        )}
      </div>
      <div className="absolute inset-0" style={{ background: `rgba(10,10,10,${hero.overlayOpacity})` }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-28">
        <div className={`flex flex-col gap-4 sm:gap-5 max-w-xl ${alignClass}`}>
          <span className="hang-tag bg-[var(--color-primary)] text-white w-fit">{hero.offerBadgeText}</span>
          <h1 className="text-display text-white text-4xl sm:text-6xl lg:text-7xl">{hero.heading}</h1>
          <p className="text-neutral-200 text-base sm:text-lg max-w-md">{hero.subheading}</p>
          <div className="flex flex-col sm:flex-row gap-3 mt-1 sm:mt-2">
            <Link to={hero.ctaPrimaryLink} className="btn btn-primary self-start">
              {hero.ctaPrimaryText} <ArrowRight size={16} />
            </Link>
            <Link to={hero.ctaSecondaryLink} className="btn btn-lg text-white border border-white/60 bg-white/10 hover:bg-white/20 self-start">
              {hero.ctaSecondaryText}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}