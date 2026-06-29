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
      className="group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/6 hover:ring-border"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface">
            <Flame size={28} className="text-muted-foreground/30" />
          </div>
        )}
        {topBadge ? (
          <span className="absolute left-2.5 top-2.5">
            <BadgePill label={topBadge} />
          </span>
        ) : p.promo_price ? (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-destructive px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive-foreground">
            Promo
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground sm:text-[15px]">
          {p.name}
        </h3>
        <div className="mt-1.5 flex items-center gap-2.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-0.5">
            <Star size={11} className="fill-warning text-warning" />
            {num(p.rating, 1)}
          </span>
          {p.calories ? (
            <span className="inline-flex items-center gap-0.5">
              <Flame size={11} />
              {p.calories} kcal
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">
            {brl(price)}
          </span>
          {p.promo_price && (
            <span className="text-xs text-muted-foreground line-through">{brl(p.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
