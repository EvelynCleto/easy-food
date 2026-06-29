import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Loader2, QrCode, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { brl } from "@/lib/format";
import { getProviderForMethod, type PaymentMethod } from "@/lib/payments";
import { validateCoupon } from "@/lib/coupons.functions";

export const Route = createFileRoute("/_authenticated/checkout")({
  component: CheckoutPage,
});

type Method = PaymentMethod;

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [machineId, setMachineId] = useState<string>("");
  const [coupon, setCoupon] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);
  const [method, setMethod] = useState<Method>("pix");
  const [busy, setBusy] = useState(false);

  const { data: machines = [] } = useQuery({
    queryKey: ["machines-online"],
    queryFn: async () => {
      const { data } = await supabase.from("machines").select("id,name,address,status").eq("status", "online");
      return data ?? [];
    },
  });

  const fee = items.length ? 3.9 : 0;
  const total = Math.max(0, subtotal + fee - appliedDiscount);

  async function applyCoupon() {
    if (!coupon) return;
    try {
      const result = await validateCoupon({ data: { code: coupon, subtotal } });
      if (!result.ok) { toast.error(result.error); return; }
      setAppliedDiscount(result.discount);
      setAppliedCouponId(result.id);
      toast.success(`Cupom aplicado: -${brl(result.discount)}`);
    } catch {
      toast.error("Não foi possível validar o cupom");
    }
  }

  async function placeOrder() {
    if (!user || items.length === 0) return;
    if (!machineId) { toast.error("Escolha uma máquina"); return; }
    setBusy(true);
    const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const initialStatus = method === "pix" ? "pending" : "paid";
    const { data: order, error } = await supabase.from("orders").insert({
      user_id: user.id, machine_id: machineId, coupon_id: appliedCouponId,
      status: initialStatus, subtotal, fee, discount: appliedDiscount, total,
      pickup_code: pickupCode, expires_at: expiresAt,
    }).select("id").single();
    if (error || !order) { toast.error(error?.message ?? "Falha ao criar pedido"); setBusy(false); return; }
    await supabase.from("order_items").insert(items.map((i) => ({
      order_id: order.id, product_id: i.productId, quantity: i.quantity,
      unit_price: i.price, product_name: i.name, product_image: i.image,
    })));
    const provider = getProviderForMethod(method);
    const result = await provider.create({
      orderId: order.id, userId: user.id, amount: total, method,
      description: `EasyFood pedido ${order.id.slice(0, 8)}`,
    });
    await supabase.from("payments").insert({
      order_id: order.id, user_id: user.id, method,
      status: result.status === "approved" ? "approved" : "pending",
      amount: total,
      pix_code: result.pixCode ?? null,
    });
    await supabase.from("notifications").insert({
      user_id: user.id, type: "order",
      title: result.status === "approved" ? "Pedido confirmado!" : "Pedido aguardando pagamento",
      body: result.status === "approved"
        ? `Retire na máquina com o código ${pickupCode}.`
        : `Pague o PIX em até 30 min. Código de retirada ${pickupCode}.`,
    });
    if (result.status === "approved") {
      await supabase.from("loyalty_events").insert({
        user_id: user.id, kind: "order", points: 10,
        meta: { order_id: order.id, amount: total },
      });
    }
    clear();
    setBusy(false);
    toast.success(result.message ?? "Pedido criado!");
    navigate({ to: "/orders/$id", params: { id: order.id } });
  }

  if (items.length === 0) {
    return <p className="rounded-2xl bg-card p-8 text-center text-muted-foreground ring-1 ring-border">Seu carrinho está vazio.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-bold">Checkout</h1>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
        <h2 className="text-sm font-semibold">Escolher máquina</h2>
        <div className="mt-3 space-y-2">
          {machines.map((m) => (
            <label key={m.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${machineId === m.id ? "border-primary bg-accent/30" : "border-input"}`}>
              <input type="radio" name="machine" checked={machineId === m.id} onChange={() => setMachineId(m.id)} className="mt-1 accent-[#55AD2F]" />
              <div>
                <div className="font-semibold">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.address}</div>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
        <h2 className="text-sm font-semibold">Pagamento</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {([["pix","PIX",QrCode],["credit_card","Crédito",CreditCard],["debit_card","Débito",CreditCard],["meal_voucher","VR",Wallet]] as const).map(([id,label,Icon]) => (
            <button key={id} onClick={() => setMethod(id)} className={`flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-medium transition ${method === id ? "border-primary bg-accent/30 text-primary" : "border-input"}`}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
        <h2 className="text-sm font-semibold">Cupom</h2>
        <div className="mt-3 flex gap-2">
          <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Digite o código"
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm uppercase outline-none focus:border-primary" />
          <button onClick={applyCoupon} className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background">Aplicar</button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Experimente: EASY10, FIT20, BEMVINDO</p>
      </section>

      <section className="rounded-2xl bg-card p-4 ring-1 ring-border/60 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{brl(subtotal)}</span></div>
        <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Taxa</span><span>{brl(fee)}</span></div>
        {appliedDiscount > 0 && (
          <div className="mt-1 flex justify-between text-primary"><span>Desconto</span><span>-{brl(appliedDiscount)}</span></div>
        )}
        <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-bold"><span>Total</span><span className="text-primary">{brl(total)}</span></div>
      </section>

      <button onClick={placeOrder} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60">
        {busy && <Loader2 size={16} className="animate-spin" />}
        Finalizar pagamento — {brl(total)}
      </button>
    </div>
  );
}