import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
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
      <div className="mx-auto max-w-[640px] py-20 text-center">
        <h1 className="text-display">Carrinho</h1>
        <p className="mt-6 text-body-lg text-muted-foreground">Seu carrinho está vazio.</p>
        <Link to="/catalog" className="btn-primary mt-10">Explorar pratos</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <h1 className="text-display">Carrinho</h1>
      <p className="text-caption mt-2">{items.length} {items.length === 1 ? "item" : "itens"}</p>

      <div className="mt-12 divide-y divide-border/60 border-y border-border/60">
        {items.map((it) => (
          <div key={it.productId} className="flex gap-5 py-6">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface">
              {it.image && <img src={it.image} alt={it.name} className="h-full w-full object-cover" />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-[15px] font-medium text-foreground">{it.name}</h3>
                  <p className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">{brl(it.price)}</p>
                </div>
                <button onClick={() => remove(it.productId)} className="text-muted-foreground transition hover:text-destructive" aria-label="Remover">
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="mt-3 inline-flex w-fit items-center gap-3 rounded-full bg-surface px-1.5 py-1.5">
                <button onClick={() => setQty(it.productId, it.quantity - 1)} className="grid h-7 w-7 place-items-center rounded-full bg-card text-foreground transition hover:opacity-70">
                  <Minus size={14} />
                </button>
                <span className="min-w-[20px] text-center text-[14px] font-semibold tabular-nums">{it.quantity}</span>
                <button onClick={() => setQty(it.productId, it.quantity + 1)} className="grid h-7 w-7 place-items-center rounded-full bg-card text-foreground transition hover:opacity-70">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 space-y-3 text-[15px]">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span><span className="tabular-nums">{brl(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Taxa de serviço</span><span className="tabular-nums">{brl(fee)}</span>
        </div>
      </div>

      <div className="mt-6 flex items-baseline justify-between border-t border-border/60 pt-6">
        <span className="text-title-3">Total</span>
        <span className="font-display text-3xl font-bold tracking-tight tabular-nums">{brl(total)}</span>
      </div>

      <button onClick={() => navigate({ to: "/checkout" })} className="btn-primary mt-10 w-full">
        Ir para o checkout
      </button>
    </div>
  );
}
