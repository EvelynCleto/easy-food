import { Link } from "@tanstack/react-router";
import { Flame, Star } from "lucide-react";
import { brl, num } from "@/lib/format";

export type ProductCardData = {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  promo_price: number | null;
  calories: number | null;
  rating: number;
};

export function ProductCard({ p }: { p: ProductCardData; badges?: string[] | null }) {
  const price = p.promo_price ?? p.price;
  return (
    <Link
      to="/product/$id"
      params={{ id: p.id }}
      className="group flex flex-col"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-surface ring-1 ring-border/40">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <Flame size={28} strokeWidth={1.6} className="text-muted-foreground/40" />
          </div>
        )}

        {p.promo_price && (
          <span className="absolute left-3 top-3 rounded-full bg-foreground/90 px-2.5 py-1 text-[11px] font-semibold text-background backdrop-blur">
            -{Math.round(((p.price - p.promo_price) / p.price) * 100)}%
          </span>
        )}

        {p.rating > 0 && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-1 text-[11px] font-semibold backdrop-blur">
            <Star size={11} className="fill-warning text-warning" />
            {num(p.rating, 1)}
          </span>
        )}
      </div>

      <div className="px-1 pt-3.5">
        <h3 className="line-clamp-2 text-[14.5px] font-semibold leading-snug text-foreground">
          {p.name}
        </h3>
        {p.calories != null && (
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            <Flame size={11} className="mr-1 inline -translate-y-[1px]" strokeWidth={2} />
            {p.calories} kcal
          </p>
        )}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[15.5px] font-bold tracking-tight tabular-nums text-foreground">
            {brl(price)}
          </span>
          {p.promo_price && (
            <span className="text-[12.5px] text-muted-foreground line-through tabular-nums">{brl(p.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
