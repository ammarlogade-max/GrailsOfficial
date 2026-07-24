import { Camera } from "lucide-react";
import type { Product } from "../../data/types";
import ProductImage from "./ProductImage";

interface InstagramSectionProps {
  title: string;
  subtitle?: string;
  instagramUrl: string;
  products: Product[];
}

/**
 * The SRS's 'instagram' homepage section type. There's no real
 * Instagram API integration here (that's a genuinely separate project —
 * OAuth, token refresh, rate limits), so this shows a shoppable lookbook
 * grid pulled from the real catalog and links out to the store's actual
 * Instagram profile, which is the honest version of "Instagram section"
 * a project at this stage can actually deliver.
 */
export default function InstagramSection({ title, subtitle, instagramUrl, products }: InstagramSectionProps) {
  const tiles = products.slice(0, 6);
  if (tiles.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
        <div>
          <h2 className="text-display text-2xl sm:text-3xl">{title}</h2>
          {subtitle && <p className="text-neutral-500 text-sm mt-1">{subtitle}</p>}
        </div>
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-label text-[var(--color-primary)]"
          >
            <Camera size={15} /> Follow Us
          </a>
        )}
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
        {tiles.map((p) => (
          <a
            key={p.id}
            href={instagramUrl || "#"}
            target={instagramUrl ? "_blank" : undefined}
            rel="noreferrer"
            className="aspect-square rounded-lg overflow-hidden relative group block"
          >
            <ProductImage src={p.images[0]} alt={p.name} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Camera size={20} className="text-white" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
