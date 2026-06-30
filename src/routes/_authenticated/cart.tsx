import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({ meta: [{ title: "Seu pedido — EasyFood" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, setQty, remove } = useCart();
  const navigate = useNavigate();
  const fee = items.length ? 3.9 : 0;
  const total = subtotal + fee;

  const { data: suggestions = [] } = useQuery({
    queryKey: ["cart-suggestions"],
    queryFn: async () =>
      ((await supabase
        .from("products")
        .select("id,name,image_url,price,promo_price,calories,protein,rating")
        .order("sold_count", { ascending: false, nullsFirst: false })
        .limit(4)).data ?? []) as ProductCardData[],
  });

  if (items.length === 0) {
    return (
      <div className="animate-rise mx-auto max-w-[680px] py-12 sm:py-16">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full" style={{ background: "var(--surface)" }}>
            <ShoppingBag size={26} strokeWidth={1.6} style={{ color: "var(--ink-2)" }} />
          </div>
          <h1 className="text-display-m mt-8">Ainda sem nada aqui</h1>
          <p className="mt-3 text-body" style={{ color: "var(--ink-2)" }}>
            Separei uns pratos que combinam com você hoje.
          </p>
        </div>
        {suggestions.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
            {suggestions.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
        <div className="mt-10 text-center">
          <Link to="/catalog" className="btn-primary inline-flex">
            Ver catálogo completo <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise mx-auto max-w-[1000px]">
      <header className="mb-10">
        <p className="text-eyebrow">checkout</p>
        <h1 className="text-display-m mt-3">Carrinho</h1>
        <p className="mt-3 text-body-sm" style={{ color: "var(--ink-2)" }}>
          {items.length} {items.length === 1 ? "item" : "itens"}
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        {/* Items */}
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.productId} className="card-nested flex gap-4 p-4 sm:p-5">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[14px] sm:h-28 sm:w-28" style={{ background: "var(--surface)" }}>
                {it.image && <img src={it.image} alt={it.name} className="plate-photo h-full w-full object-cover" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-[14.5px] font-semibold" style={{ color: "var(--ink-1)" }}>{it.name}</h3>
                    <p className="mt-1 text-[14px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>{brl(it.price)}</p>
                  </div>
                  <button onClick={() => remove(it.productId)}
                    className="btn-icon"
                    aria-label="Remover">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="mt-3 inline-flex w-fit items-center gap-2 rounded-full p-1" style={{ background: "var(--surface)" }}>
                  <button onClick={() => setQty(it.productId, it.quantity - 1)}
                    className="press grid h-7 w-7 place-items-center rounded-full transition"
                    style={{ background: "var(--card)", color: "var(--ink-1)" }}
                    aria-label="Diminuir">
                    <Minus size={13} />
                  </button>
                  <span className="min-w-[28px] text-center text-[13.5px] font-semibold tabular-nums">{it.quantity}</span>
                  <button onClick={() => setQty(it.productId, it.quantity + 1)}
                    className="press grid h-7 w-7 place-items-center rounded-full transition"
                    style={{ background: "var(--card)", color: "var(--ink-1)" }}
                    aria-label="Aumentar">
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-aurora p-6">
            <p className="text-eyebrow">resumo</p>
            <div className="mt-5 space-y-3 text-body-sm">
              <Row label="Subtotal" value={brl(subtotal)} />
              <Row label="Taxa de serviço" value={brl(fee)} />
            </div>
            <div className="mt-5 flex items-baseline justify-between pt-5" style={{ borderTop: "0.5px solid var(--hairline)" }}>
              <span className="text-[14.5px] font-semibold" style={{ color: "var(--ink-1)" }}>Total</span>
              <span className="font-display text-[28px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>{brl(total)}</span>
            </div>
            <button onClick={() => navigate({ to: "/checkout" })} className="btn-primary mt-6 w-full">
              Ir para o checkout <ArrowRight size={15} />
            </button>
            <p className="mt-4 text-center text-caption">Pagamento seguro · Retirada em segundos</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: "var(--ink-2)" }}>{label}</span>
      <span className="tabular-nums" style={{ color: "var(--ink-1)" }}>{value}</span>
    </div>
  );
}
