import { Link } from "@tanstack/react-router";
import { brl } from "@/lib/format";

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
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-surface">
        {p.image_url ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : null}
        {p.promo_price && (
          <span className="absolute left-3 top-3 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background">
            Oferta
          </span>
        )}
      </div>
      <div className="px-1 pt-3">
        <h3 className="line-clamp-1 text-[15px] font-medium leading-snug text-foreground">
          {p.name}
        </h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            {brl(price)}
          </span>
          {p.promo_price && (
            <span className="text-[13px] text-muted-foreground line-through">{brl(p.price)}</span>
          )}
        </div>
        {p.calories != null && (
          <p className="mt-0.5 text-[13px] text-muted-foreground">{p.calories} kcal</p>
        )}
      </div>
    </Link>
  );
}
