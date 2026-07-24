import { Star } from "lucide-react";

export default function Rating({ value, size = 14, showValue = false, count }: { value: number; size?: number; showValue?: boolean; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-neutral-200 text-neutral-200"}
          />
        ))}
      </div>
      {showValue && <span className="text-sm text-neutral-600 ml-1">{value.toFixed(1)}</span>}
      {count !== undefined && <span className="text-sm text-neutral-400">({count})</span>}
    </div>
  );
}
