import { Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { brl } from "@/lib/format";

export type ProductCardData = {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  promo_price: number | null;
  calories: number | null;
  protein?: number | null;
  rating: number;
};

/**
 * Plate Tile — editorial product card.
 * - 4:5 portrait photo with editorial filter for visual uniformity
 * - Promo shown as discreet strikethrough on previous price (no badge)
 */
export function ProductCard({ p }: { p: ProductCardData; badges?: string[] | null }) {
  const price = p.promo_price ?? p.price;
  return (
    <Link
      to="/product/$id"
      params={{ id: p.id }}
      className="group flex flex-col"
    >
      <div className="card-nested relative aspect-[4/5] overflow-hidden p-2.5">
        <div className="absolute inset-2.5 overflow-hidden rounded-[14px]" style={{ background: "var(--surface)" }}>
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={p.name}
              loading="lazy"
              className="plate-photo h-full w-full object-cover transition duration-[600ms] group-hover:scale-[1.04]"
              style={{ transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)" }}
            />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <Flame size={26} strokeWidth={1.5} style={{ color: "var(--ink-3)" }} />
            </div>
          )}
        </div>
      </div>

      <div className="px-1 pt-3.5">
        <h3 className="line-clamp-2 text-title leading-snug" style={{ color: "var(--ink-1)" }}>
          {p.name}
        </h3>

        <p className="mt-1 text-caption">
          {p.calories ? `${p.calories} kcal` : ""}
          {p.calories && p.protein ? " · " : ""}
          {p.protein ? `${p.protein}g proteína` : ""}
        </p>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-[15px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>
            {brl(price)}
          </span>
          {p.promo_price && (
            <span className="text-[12.5px] tabular-nums line-through" style={{ color: "var(--ink-3)" }}>
              {brl(p.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
