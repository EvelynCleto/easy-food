import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cart")({
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, setQty, remove } = useCart();
  const navigate = useNavigate();
  const fee = items.length ? 3.9 : 0;
  const total = subtotal + fee;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[520px] py-12 text-center sm:py-20">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-accent">
          <ShoppingBag size={32} strokeWidth={1.6} className="text-accent-foreground" />
        </div>
        <h1 className="text-display mt-8">Seu carrinho está vazio</h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          Que tal explorar nossos pratos saudáveis?
        </p>
        <Link to="/catalog" className="btn-primary mt-8 inline-flex">
          Explorar pratos <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[860px]">
      <header className="mb-8">
        <h1 className="text-display">Carrinho</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "itens"}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Items */}
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.productId} className="card-base flex gap-4 p-4 sm:p-5">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-surface sm:h-28 sm:w-28">
                {it.image && <img src={it.image} alt={it.name} className="h-full w-full object-cover" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-[15px] font-semibold text-foreground">{it.name}</h3>
                    <p className="mt-1 text-[15px] font-bold tabular-nums text-foreground">{brl(it.price)}</p>
                  </div>
                  <button
                    onClick={() => remove(it.productId)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-surface hover:text-destructive"
                    aria-label="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-surface p-1">
                  <button
                    onClick={() => setQty(it.productId, it.quantity - 1)}
                    className="grid h-8 w-8 place-items-center rounded-full bg-card text-foreground shadow-sm transition hover:opacity-70"
                    aria-label="Diminuir"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="min-w-[28px] text-center text-[14px] font-bold tabular-nums">{it.quantity}</span>
                  <button
                    onClick={() => setQty(it.productId, it.quantity + 1)}
                    className="grid h-8 w-8 place-items-center rounded-full bg-card text-foreground shadow-sm transition hover:opacity-70"
                    aria-label="Aumentar"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-base p-6">
            <h2 className="text-title-3">Resumo</h2>
            <div className="mt-5 space-y-3 text-[15px]">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground tabular-nums">{brl(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxa de serviço</span>
                <span className="text-foreground tabular-nums">{brl(fee)}</span>
              </div>
            </div>
            <div className="mt-5 flex items-baseline justify-between border-t border-border/60 pt-5">
              <span className="text-[15px] font-semibold">Total</span>
              <span className="font-display text-[28px] font-bold tracking-tight tabular-nums">{brl(total)}</span>
            </div>
            <button onClick={() => navigate({ to: "/checkout" })} className="btn-primary mt-6 w-full">
              Ir para checkout <ArrowRight size={16} />
            </button>
            <p className="mt-4 text-center text-[12.5px] text-muted-foreground">
              Pagamento seguro · Retirada em segundos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
