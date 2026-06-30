import { Link } from "@tanstack/react-router";
import { Flame, Plus } from "lucide-react";
import { toast } from "sonner";
import { brl } from "@/lib/format";
import { useCart } from "@/contexts/CartContext";
import { haptic } from "@/lib/celebrate";

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
 * Plate Tile — editorial product card with one-tap add-to-cart.
 * Uses the "stretched link" pattern so the whole card navigates to the product
 * while the "+" button (above it) adds straight to the cart.
 */
export function ProductCard({ p }: { p: ProductCardData; badges?: string[] | null }) {
  const cart = useCart();
  const price = p.promo_price ?? p.price;

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    cart.add({ productId: p.id, name: p.name, price, image: p.image_url });
    haptic(12);
    toast.success("Adicionado ao pedido");
  }

  return (
    <div className="group relative flex flex-col">
      <Link
        to="/product/$id"
        params={{ id: p.id }}
        aria-label={p.name}
        className="absolute inset-0 z-0 rounded-[20px]"
      />
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
        {/* Quick add — sits above the stretched link */}
        <button
          type="button"
          onClick={quickAdd}
          aria-label={`Adicionar ${p.name} ao pedido`}
          className="press absolute bottom-3.5 right-3.5 z-10 grid h-10 w-10 place-items-center rounded-full shadow-lg transition active:scale-90"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          <Plus size={20} strokeWidth={2.4} />
        </button>
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
    </div>
  );
}
