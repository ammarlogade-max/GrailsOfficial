import { ImageOff } from "lucide-react";

interface ProductImageProps {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}

/**
 * Consistent, premium-feeling image treatment for real product photography:
 * neutral backdrop while the photo loads, cover-fit crop, lazy loading by
 * default. Use this everywhere a shoe photo appears so every card, gallery,
 * and admin preview shares the same aspect ratio and lighting feel.
 */
export default function ProductImage({ src, alt, className = "", eager = false }: ProductImageProps) {
  if (!src) {
    return (
      <div className={`w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-300 ${className}`}>
        <ImageOff size={20} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`w-full h-full object-cover bg-neutral-100 ${className}`}
    />
  );
}
