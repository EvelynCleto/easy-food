import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, CreditCard, Loader2, QrCode, Wallet } from "lucide-react";
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
    queryFn: async () => (await supabase.from("machines").select("id,name,address,status").eq("status", "online")).data ?? [],
  });

  const fee = items.length ? 3.9 : 0;
  const total = Math.max(0, subtotal + fee - appliedDiscount);

  async function applyCoupon() {
    if (!coupon) return;
    try {
      const r = await validateCoupon({ data: { code: coupon, subtotal } });
      if (!r.ok) { toast.error(r.error); return; }
      setAppliedDiscount(r.discount); setAppliedCouponId(r.id);
      toast.success(`Cupom aplicado: -${brl(r.discount)}`);
    } catch { toast.error("Não foi possível validar o cupom"); }
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
    if (error || !order) { toast.error(error?.message ?? "Falha"); setBusy(false); return; }
    await supabase.from("order_items").insert(items.map((i) => ({
      order_id: order.id, product_id: i.productId, quantity: i.quantity,
      unit_price: i.price, product_name: i.name, product_image: i.image,
    })));
    const provider = getProviderForMethod(method);
    const result = await provider.create({ orderId: order.id, userId: user.id, amount: total, method, description: `EasyFood ${order.id.slice(0,8)}` });
    await supabase.from("payments").insert({
      order_id: order.id, user_id: user.id, method,
      status: result.status === "approved" ? "approved" : "pending", amount: total,
      pix_code: result.pixCode ?? null,
    });
    await supabase.from("notifications").insert({
      user_id: user.id, type: "order",
      title: result.status === "approved" ? "Pedido confirmado!" : "Pedido aguardando pagamento",
      body: result.status === "approved" ? `Retire na máquina com o código ${pickupCode}.` : `Pague o PIX em até 30 min. Código ${pickupCode}.`,
    });
    if (result.status === "approved") {
      await supabase.from("loyalty_events").insert({ user_id: user.id, kind: "order", points: 10, meta: { order_id: order.id, amount: total } });
    }
    clear(); setBusy(false);
    toast.success(result.message ?? "Pedido criado!");
    navigate({ to: "/orders/$id", params: { id: order.id } });
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[520px] py-20 text-center">
        <p className="text-[15px] text-muted-foreground">Carrinho vazio.</p>
      </div>
    );
  }

  const methods: { id: Method; label: string; Icon: typeof CreditCard }[] = [
    { id: "pix", label: "PIX", Icon: QrCode },
    { id: "credit_card", label: "Crédito", Icon: CreditCard },
    { id: "debit_card", label: "Débito", Icon: CreditCard },
    { id: "meal_voucher", label: "VR", Icon: Wallet },
  ];

  return (
    <div className="mx-auto max-w-[860px]">
      <header className="mb-10">
        <h1 className="text-display">Finalizar pedido</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">Escolha máquina e forma de pagamento</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          {/* Machine */}
          <section className="card-base p-6 sm:p-7">
            <h2 className="text-title-3 mb-5">Onde retirar</h2>
            <div className="space-y-2">
              {machines.map((m) => {
                const active = machineId === m.id;
                return (
                  <button
                    key={m.id} onClick={() => setMachineId(m.id)}
                    className={`flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition ${
                      active ? "bg-accent" : "hover:bg-surface"
                    }`}
                  >
                    <div className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${
                      active ? "border-primary bg-primary" : "border-border"
                    }`}>
                      {active && <Check size={14} className="text-primary-foreground" strokeWidth={3} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold">{m.name}</div>
                      <div className="text-[13px] text-muted-foreground">{m.address}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Payment */}
          <section className="card-base p-6 sm:p-7">
            <h2 className="text-title-3 mb-5">Forma de pagamento</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {methods.map(({ id, label, Icon }) => {
                const active = method === id;
                return (
                  <button
                    key={id} onClick={() => setMethod(id)}
                    className={`flex flex-col items-center gap-2 rounded-2xl py-5 transition ${
                      active ? "bg-foreground text-background" : "bg-surface hover:opacity-80"
                    }`}
                  >
                    <Icon size={22} strokeWidth={1.8} />
                    <span className="text-[13px] font-semibold">{label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Coupon */}
          <section className="card-base p-6 sm:p-7">
            <h2 className="text-title-3 mb-5">Cupom de desconto</h2>
            <div className="flex gap-2">
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="Digite o código"
                className="input-field flex-1 uppercase"
              />
              <button onClick={applyCoupon} className="btn-secondary px-6">Aplicar</button>
            </div>
            {appliedDiscount > 0 && (
              <p className="mt-3 text-[13px] font-semibold text-primary">
                ✓ Desconto de {brl(appliedDiscount)} aplicado
              </p>
            )}
          </section>
        </div>

        {/* Summary sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card-base p-6">
            <h2 className="text-title-3">Resumo</h2>
            <div className="mt-5 space-y-3 text-[15px]">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span className="text-foreground tabular-nums">{brl(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Taxa</span><span className="text-foreground tabular-nums">{brl(fee)}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Desconto</span><span className="tabular-nums">-{brl(appliedDiscount)}</span>
                </div>
              )}
            </div>
            <div className="mt-5 flex items-baseline justify-between border-t border-border/60 pt-5">
              <span className="text-[15px] font-semibold">Total</span>
              <span className="font-display text-[28px] font-bold tracking-tight tabular-nums">{brl(total)}</span>
            </div>
            <button onClick={placeOrder} disabled={busy} className="btn-primary mt-6 w-full">
              {busy && <Loader2 size={16} className="animate-spin" />}
              Pagar {brl(total)}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
