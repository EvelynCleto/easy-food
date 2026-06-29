import { Link } from "@tanstack/react-router";
import { Flame, Star } from "lucide-react";
import { brl, num } from "@/lib/format";
import { BadgePill } from "@/components/premium/BadgePill";

export type ProductCardData = {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  promo_price: number | null;
  calories: number | null;
  rating: number;
};

export function ProductCard({ p, badges }: { p: ProductCardData; badges?: string[] | null }) {
  const price = p.promo_price ?? p.price;
  const topBadge = badges?.[0];
  return (
    <Link
      to="/product/$id"
      params={{ id: p.id }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : null}
        {topBadge ? (
          <span className="absolute left-2 top-2"><BadgePill label={topBadge} /></span>
        ) : p.promo_price ? (
          <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive-foreground">
            Promo
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-1 text-sm font-semibold">{p.name}</h3>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <Star size={12} className="fill-warning text-warning" /> {num(p.rating, 1)}
          </span>
          {p.calories ? (
            <span className="inline-flex items-center gap-0.5">
              <Flame size={12} /> {p.calories} kcal
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-base font-bold text-foreground">{brl(price)}</span>
          {p.promo_price && (
            <span className="text-xs text-muted-foreground line-through">{brl(p.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}