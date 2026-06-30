import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, CreditCard, Loader2, QrCode, Wallet, Tag, ShieldCheck, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { brl } from "@/lib/format";
import { getProviderForMethod, type PaymentMethod } from "@/lib/payments";
import { validateCoupon } from "@/lib/coupons.functions";
import { checkOrderAchievements } from "@/lib/achievements";

export const Route = createFileRoute("/_authenticated/checkout")({
  component: CheckoutPage,
});

type Method = PaymentMethod;

const STEPS = ["Refeição", "Máquina", "Pagamento", "Confirmação"];

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [machineId, setMachineId] = useState<string>("");
  const [coupon, setCoupon] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);
  const [method, setMethod] = useState<Method>("credit_card");
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
      toast.success(`Cupom: -${brl(r.discount)}`);
    } catch { toast.error("Cupom inválido"); }
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
      title: result.status === "approved" ? "Pedido confirmado" : "Aguardando pagamento",
      body: result.status === "approved" ? `Retire na máquina com o código ${pickupCode}.` : `Pague o PIX em até 30 min. Código ${pickupCode}.`,
    });
    if (result.status === "approved") {
      await supabase.from("loyalty_events").insert({ user_id: user.id, kind: "order", points: 10, meta: { order_id: order.id, amount: total } });
    }
    void checkOrderAchievements();
    clear(); setBusy(false);
    toast.success(result.message ?? "Pedido criado");
    navigate({ to: "/orders/$id", params: { id: order.id } });
  }

  if (items.length === 0) {
    return <div className="grid h-[60vh] place-items-center" style={{ color: "var(--ink-3)" }}>Carrinho vazio.</div>;
  }

  const payMethods: { id: Method; label: string; sub: string; Icon: typeof CreditCard }[] = [
    { id: "credit_card", label: "Cartão de crédito", sub: "Visa, Mastercard, Elo", Icon: CreditCard },
    { id: "pix",         label: "Pix",               sub: "Transferência instantânea", Icon: QrCode },
    { id: "debit_card",  label: "Carteira digital",  sub: "Apple Pay, Google Pay",    Icon: Wallet },
    { id: "meal_voucher",label: "Vale-refeição",      sub: "Alelo, Sodexo, VR",        Icon: Ticket },
  ];

  return (
    <div className="mx-auto max-w-[1100px]">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-0">
        {STEPS.map((s, i) => {
          const done = i < 2;
          const active = i === 2;
          return (
            <div key={s} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold transition"
                  style={{
                    background: done ? "var(--primary)" : active ? "var(--ink-1)" : "var(--surface)",
                    color: done || active ? "#fff" : "var(--ink-3)",
                  }}
                >
                  {done ? <Check size={13} strokeWidth={3} /> : i + 1}
                </div>
                <span
                  className="hidden text-[13px] font-semibold sm:block"
                  style={{ color: active ? "var(--ink-1)" : done ? "var(--primary)" : "var(--ink-3)" }}
                >
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mx-3 h-px w-8 sm:w-16" style={{ background: done ? "var(--primary)" : "var(--hairline)" }} />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* Resumo do pedido */}
          <section className="rounded-2xl p-5 sm:p-6" style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--ink-3)" }}>1. Resumo do pedido</p>
            <div className="flex flex-col gap-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div
                    className="h-14 w-14 shrink-0 overflow-hidden rounded-xl"
                    style={{ background: "var(--surface)" }}
                  >
                    {item.image && <img src={item.image} alt={item.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[14px] font-semibold" style={{ color: "var(--ink-1)" }}>{item.name}</p>
                    <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>{item.quantity}× {brl(item.price)}</p>
                    <div className="mt-1 flex gap-2">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                        ~420 kcal
                      </span>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "var(--surface)", color: "var(--ink-3)" }}>
                        32g prot.
                      </span>
                    </div>
                  </div>
                  <span className="text-[15px] font-bold tabular-nums" style={{ color: "var(--ink-1)" }}>
                    {brl(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Machine selector */}
            {machines.length > 0 && (
              <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--hairline)" }}>
                <p className="mb-2 text-[12px] font-semibold" style={{ color: "var(--ink-2)" }}>Máquina de retirada</p>
                <div className="flex flex-col gap-1">
                  {machines.slice(0, 3).map((m) => {
                    const active = machineId === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMachineId(m.id)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:opacity-80"
                        style={{ background: active ? "var(--primary-soft)" : "var(--surface)" }}
                      >
                        <div
                          className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
                          style={{
                            background: active ? "var(--primary)" : "transparent",
                            border: active ? "none" : "1.5px solid var(--ink-3)",
                          }}
                        >
                          {active && <Check size={11} className="text-white" strokeWidth={3.5} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold" style={{ color: active ? "var(--primary)" : "var(--ink-1)" }}>{m.name}</p>
                          <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>{m.address}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Pagamento */}
          <section className="rounded-2xl p-5 sm:p-6" style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--ink-3)" }}>2. Pagamento</p>
            <div className="flex flex-col gap-2">
              {payMethods.map(({ id, label, sub, Icon }) => {
                const active = method === id;
                return (
                  <button
                    key={id}
                    onClick={() => setMethod(id)}
                    className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-left transition"
                    style={{
                      background: active ? "var(--primary-soft)" : "var(--surface)",
                      border: active ? "1.5px solid var(--primary)" : "1.5px solid transparent",
                    }}
                  >
                    <div
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                      style={{ background: active ? "var(--primary)" : "var(--card)" }}
                    >
                      <Icon size={18} style={{ color: active ? "#fff" : "var(--ink-2)" }} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold" style={{ color: "var(--ink-1)" }}>{label}</p>
                      <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>{sub}</p>
                    </div>
                    <div
                      className="grid h-5 w-5 shrink-0 place-items-center rounded-full transition"
                      style={{
                        background: active ? "var(--primary)" : "transparent",
                        border: active ? "none" : "1.5px solid var(--ink-3)",
                      }}
                    >
                      {active && <Check size={11} className="text-white" strokeWidth={3.5} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="lg:sticky lg:top-24 lg:self-start flex flex-col gap-4">
          {/* Total card */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}>
            <p className="mb-4 text-[13px] font-semibold" style={{ color: "var(--ink-1)" }}>Total do pedido</p>
            <div className="space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <span style={{ color: "var(--ink-2)" }}>Subtotal</span>
                <span className="tabular-nums font-medium" style={{ color: "var(--ink-1)" }}>{brl(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--ink-2)" }}>Taxa de serviço</span>
                <span className="tabular-nums font-medium" style={{ color: "var(--ink-1)" }}>{brl(fee)}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--primary)" }}>Desconto</span>
                  <span className="tabular-nums font-medium" style={{ color: "var(--primary)" }}>-{brl(appliedDiscount)}</span>
                </div>
              )}
            </div>

            {/* Coupon row */}
            <div className="mt-3 flex gap-2">
              <div
                className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: "var(--surface)" }}
              >
                <Tag size={14} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="Cupom de desconto"
                  className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-[var(--ink-3)]"
                  style={{ color: "var(--ink-1)" }}
                />
              </div>
              <button
                onClick={applyCoupon}
                className="rounded-xl px-3 py-2 text-[12px] font-semibold transition hover:opacity-80"
                style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
              >
                Aplicar
              </button>
            </div>

            <div
              className="mt-4 flex items-baseline justify-between pt-4"
              style={{ borderTop: "1px solid var(--hairline)" }}
            >
              <span className="text-[14px] font-semibold" style={{ color: "var(--ink-1)" }}>Total</span>
              <span className="text-[26px] font-bold tabular-nums" style={{ color: "var(--ink-1)", fontFamily: "var(--font-display)" }}>
                {brl(total)}
              </span>
            </div>
          </div>

          {/* Benefits */}
          <div className="rounded-2xl p-4" style={{ background: "var(--primary-soft)" }}>
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck size={14} style={{ color: "var(--primary)" }} />
              <p className="text-[12px] font-semibold" style={{ color: "var(--primary)" }}>Benefícios incluídos</p>
            </div>
            {["Retirada em até 10 min", "Produto fresco garantido", "+10 XP por pedido"].map((b) => (
              <div key={b} className="flex items-center gap-2 py-1">
                <Check size={12} style={{ color: "var(--primary)", flexShrink: 0 }} strokeWidth={2.5} />
                <span className="text-[12px]" style={{ color: "var(--ink-1)" }}>{b}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={placeOrder}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold transition hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--ink-1)", color: "#fff" }}
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {busy ? "Processando..." : `Confirmar pagamento • ${brl(total)}`}
          </button>
        </aside>
      </div>
    </div>
  );
}
