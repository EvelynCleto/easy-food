import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { brl } from "@/lib/format";
import { SmartCartSummary } from "@/components/premium/SmartCartSummary";

export const Route = createFileRoute("/_authenticated/cart")({
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, setQty, remove } = useCart();
  const navigate = useNavigate();
  const fee = items.length ? 3.9 : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 font-display text-2xl font-bold">Carrinho</h1>
      {items.length === 0 ? (
        <div className="rounded-2xl bg-card p-10 text-center ring-1 ring-border">
          <p className="text-muted-foreground">Seu carrinho está vazio.</p>
          <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary">
            Explorar produtos →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <SmartCartSummary />
          {items.map((it) => (
            <div key={it.productId} className="flex gap-3 rounded-2xl bg-card p-3 ring-1 ring-border/60">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                {it.image && <img src={it.image} alt={it.name} className="h-full w-full object-cover" />}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate text-sm font-semibold">{it.name}</h3>
                  <button onClick={() => remove(it.productId)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-sm font-bold text-primary">{brl(it.price)}</p>
                <div className="mt-auto flex items-center gap-2">
                  <button onClick={() => setQty(it.productId, it.quantity - 1)} className="grid h-8 w-8 place-items-center rounded-full border border-input">
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{it.quantity}</span>
                  <button onClick={() => setQty(it.productId, it.quantity + 1)} className="grid h-8 w-8 place-items-center rounded-full border border-input">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{brl(subtotal)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa de serviço</span>
              <span>{brl(fee)}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-bold">
              <span>Total</span>
              <span className="text-primary">{brl(subtotal + fee)}</span>
            </div>
          </div>
          <button onClick={() => navigate({ to: "/checkout" })} className="w-full rounded-xl bg-primary py-4 text-sm font-semibold text-primary-foreground hover:opacity-90">
            Ir para o checkout
          </button>
        </div>
      )}
    </div>
  );
}