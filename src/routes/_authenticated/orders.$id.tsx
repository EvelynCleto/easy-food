import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Clock, MapPin, Navigation, Package, QrCode, Star, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";
import { useCart } from "@/contexts/CartContext";
import { PixQrCode } from "@/components/premium/PixQrCode";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const cart = useCart();

  const { data: order, refetch } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders")
        .select("*, machines(name,address,latitude,longitude), order_items(*), payments(*)")
        .eq("id", id).single();
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!order) return (
    <div className="grid h-[60vh] place-items-center">
      <p style={{ color: "var(--ink-3)" }}>Carregando pedido...</p>
    </div>
  );

  const items = (order.order_items ?? []) as Array<{ product_id: string; product_name: string; product_image: string | null; quantity: number; unit_price: number }>;
  const payment = ((order.payments ?? []) as Array<{ method: string; status: string; pix_code: string | null }>)[0];
  const machine = order.machines as { name: string; address: string; latitude: number | null; longitude: number | null } | null;
  const expiresAt = order.expires_at ? new Date(order.expires_at) : null;
  const remainingMs = expiresAt ? Math.max(0, expiresAt.getTime() - now) : 0;
  const mm = String(Math.floor(remainingMs / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, "0");

  const showPix = payment?.method === "pix" && payment?.status === "pending" && payment.pix_code;
  const isCollected = order.status === "collected";
  const pickupValue = `EASYFOOD:${order.pickup_code}:${order.id.slice(0, 8)}`;

  async function simulatePaid() {
    await supabase.from("payments").update({ status: "approved" }).eq("order_id", order!.id);
    await supabase.from("orders").update({ status: "paid" }).eq("id", order!.id);
    refetch();
  }

  function directions() {
    if (!machine?.latitude || !machine?.longitude) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${machine.latitude},${machine.longitude}`, "_blank");
  }

  /* ── SUCCESS STATE ────────────────────────────────────────────── */
  if (isCollected) {
    return (
      <div className="mx-auto max-w-[1000px]">
        <button
          onClick={() => navigate({ to: "/" })}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium transition hover:opacity-70"
          style={{ color: "var(--ink-2)" }}
        >
          <ArrowLeft size={15} /> Voltar ao início
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div
              className="relative overflow-hidden rounded-3xl p-8 text-center"
              style={{ background: "linear-gradient(135deg, #E5EFE8 0%, #F3F3EE 100%)", border: "1px solid var(--hairline)" }}
            >
              {["#2D6A4C","#F59E0B","#3B82F6","#EF4444","#8B5CF6"].map((c, i) => (
                <div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    background: c,
                    width: 8 + (i % 3) * 4,
                    height: 8 + (i % 3) * 4,
                    top: `${10 + i * 18}%`,
                    left: i % 2 === 0 ? `${5 + i * 4}%` : `${75 + i * 3}%`,
                    opacity: 0.7,
                    transform: `rotate(${i * 45}deg)`,
                  }}
                />
              ))}
              <div
                className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full"
                style={{ background: "var(--primary)", boxShadow: "0 0 0 8px rgba(45,106,76,0.15)" }}
              >
                <CheckCircle2 size={40} style={{ color: "#fff" }} strokeWidth={2} />
              </div>
              <h1
                className="text-[28px] font-bold"
                style={{ color: "var(--ink-1)", fontFamily: "var(--font-display)" }}
              >
                Compra concluída!
              </h1>
              <p className="mt-1 text-[14px]" style={{ color: "var(--ink-2)" }}>
                Sua refeição foi retirada com sucesso. Bom apetite!
              </p>
            </div>

            <div
              className="mt-5 rounded-2xl p-5"
              style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
            >
              <p className="mb-4 text-[15px] font-semibold" style={{ color: "var(--ink-1)" }}>
                O que acontece agora?
              </p>
              <div className="flex flex-col gap-4">
                {[
                  { icon: "🍽️", title: "Aproveite sua refeição", desc: "Sua comida está fresca e pronta para ser saboreada." },
                  { icon: "📊", title: "Registre no Scanner IA", desc: "Escaneie sua refeição para calcular os nutrientes." },
                  { icon: "🏆", title: "Acumule pontos", desc: "Você ganhou +10 XP neste pedido. Continue assim!" },
                  { icon: "⭐", title: "Avalie sua experiência", desc: "Seu feedback nos ajuda a melhorar." },
                ].map(({ icon, title, desc }, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl"
                      style={{ background: "var(--surface)" }}
                    >
                      {icon}
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold" style={{ color: "var(--ink-1)" }}>{title}</p>
                      <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="mt-4 flex items-center gap-4 rounded-2xl p-5"
              style={{ background: "var(--ink-1)" }}
            >
              <div
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <Trophy size={22} style={{ color: "#F59E0B" }} />
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-white">Você ganhou +30 XP! 🎉</p>
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Continue pedindo para subir de nível mais rápido.
                </p>
              </div>
              <Star size={18} style={{ color: "#F59E0B", flexShrink: 0 }} />
            </div>

            <button
              onClick={() => {
                items.forEach((i) => cart.add({ productId: i.product_id, name: i.product_name, price: Number(i.unit_price), image: i.product_image }, i.quantity));
                navigate({ to: "/cart" });
              }}
              className="mt-4 w-full rounded-2xl py-3.5 text-[14px] font-semibold transition hover:opacity-80"
              style={{ background: "var(--surface)", color: "var(--ink-1)", border: "1px solid var(--hairline)" }}
            >
              Pedir novamente
            </button>
          </div>

          <div>
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
            >
              <p className="mb-3 text-[13px] font-semibold" style={{ color: "var(--ink-1)" }}>Resumo do pedido</p>
              <p className="mb-3 text-[11px]" style={{ color: "var(--ink-3)" }}>
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <div className="flex flex-col gap-3">
                {items.map((it, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg" style={{ background: "var(--surface)" }}>
                      {it.product_image && <img src={it.product_image} alt={it.product_name} className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[13px] font-medium" style={{ color: "var(--ink-1)" }}>{it.product_name}</p>
                      <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>{it.quantity}×</p>
                    </div>
                    <span className="text-[13px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>
                      {brl(it.unit_price * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1.5 pt-4 text-[13px]" style={{ borderTop: "1px solid var(--hairline)" }}>
                <div className="flex justify-between" style={{ color: "var(--ink-2)" }}>
                  <span>Subtotal</span><span>{brl(order.subtotal)}</span>
                </div>
                <div className="flex justify-between" style={{ color: "var(--ink-2)" }}>
                  <span>Taxa</span><span>{brl(order.fee)}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between" style={{ color: "var(--primary)" }}>
                    <span>Desconto</span><span>-{brl(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 text-[15px] font-bold" style={{ borderTop: "1px solid var(--hairline)" }}>
                  <span style={{ color: "var(--ink-1)" }}>Total</span>
                  <span style={{ color: "var(--primary)" }}>{brl(order.total)}</span>
                </div>
              </div>
              {payment && (
                <p className="mt-3 text-[11px]" style={{ color: "var(--ink-3)" }}>
                  Pago via {payment.method.replace("_", " ").toUpperCase()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── PIX PAYMENT STATE ──────────────────────────────────────────── */
  if (showPix) {
    return (
      <div className="mx-auto max-w-[900px]">
        <button
          onClick={() => navigate({ to: "/orders" })}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium transition hover:opacity-70"
          style={{ color: "var(--ink-2)" }}
        >
          <ArrowLeft size={15} /> Meus pedidos
        </button>
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div>
            <div
              className="rounded-3xl p-7 text-center"
              style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)" }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                Pague com PIX
              </p>
              <h1 className="text-[22px] font-bold text-white mb-4">Aponte a câmera para o QR</h1>
              {expiresAt && remainingMs > 0 && (
                <div
                  className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold"
                  style={{ background: "rgba(245,158,11,0.2)", color: "#F59E0B" }}
                >
                  <Clock size={13} /> Expira em {mm}:{ss}
                </div>
              )}
              <div className="mx-auto max-w-[220px] rounded-2xl bg-white p-4">
                <PixQrCode value={payment.pix_code!} />
              </div>
              {import.meta.env.DEV && (
                <button
                  onClick={simulatePaid}
                  className="mt-5 w-full rounded-xl py-3 text-[13px] font-bold transition hover:opacity-90"
                  style={{ background: "var(--primary)", color: "#fff" }}
                >
                  Simular pagamento aprovado
                </button>
              )}
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}>
            <p className="mb-3 text-[13px] font-semibold" style={{ color: "var(--ink-1)" }}>Resumo</p>
            {machine && (
              <div className="mb-3 flex items-start gap-2">
                <MapPin size={15} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: "var(--ink-1)" }}>{machine.name}</p>
                  <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>{machine.address}</p>
                </div>
              </div>
            )}
            <div
              className="flex justify-between text-[15px] font-bold pt-3"
              style={{ borderTop: "1px solid var(--hairline)", color: "var(--ink-1)" }}
            >
              <span>Total</span><span style={{ color: "var(--primary)" }}>{brl(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── PICKUP STATE ───────────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-[1000px]">
      <button
        onClick={() => navigate({ to: "/orders" })}
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium transition hover:opacity-70"
        style={{ color: "var(--ink-2)" }}
      >
        <ArrowLeft size={15} /> Meus pedidos
      </button>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div
                className="grid h-9 w-9 place-items-center rounded-xl"
                style={{ background: "var(--primary-soft)" }}
              >
                <QrCode size={18} style={{ color: "var(--primary)" }} />
              </div>
              <h1 className="text-[24px] font-bold" style={{ color: "var(--ink-1)", fontFamily: "var(--font-display)" }}>
                Retire sua refeição
              </h1>
            </div>
            <p className="text-[13px]" style={{ color: "var(--ink-2)" }}>
              Mostre o QR Code na máquina para retirar seu pedido
            </p>
          </div>

          <div
            className="rounded-3xl p-6 text-center"
            style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
          >
            {expiresAt && remainingMs > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--ink-3)" }}>
                  Expira em
                </p>
                <p
                  className="text-[52px] font-black tabular-nums leading-none"
                  style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}
                >
                  {mm}:{ss}
                </p>
              </div>
            )}

            <div
              className="mx-auto max-w-[220px] rounded-2xl p-4"
              style={{ background: "#fff", border: "1px solid var(--hairline)" }}
            >
              <PixQrCode value={pickupValue} size={200} />
            </div>

            <p className="mt-4 text-[13px]" style={{ color: "var(--ink-3)" }}>
              Código: <strong style={{ color: "var(--ink-1)", fontFamily: "monospace" }}>{order.pickup_code}</strong>
            </p>
          </div>

          <div
            className="mt-5 rounded-2xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
          >
            <p className="mb-4 text-[14px] font-semibold" style={{ color: "var(--ink-1)" }}>Como retirar?</p>
            <div className="flex flex-col gap-4">
              {[
                { step: "1", icon: MapPin, title: "Vá até a máquina", desc: machine?.name ?? "Dirija-se à máquina selecionada" },
                { step: "2", icon: QrCode, title: "Escaneie o QR Code", desc: "Aproxime o celular do leitor da máquina" },
                { step: "3", icon: Package, title: "Retire sua refeição", desc: "A máquina abrirá o compartimento automaticamente" },
              ].map(({ step, icon: Icon, title, desc }) => (
                <div key={step} className="flex items-start gap-4">
                  <div
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-bold"
                    style={{ background: "var(--primary)", color: "#fff" }}
                  >
                    {step}
                  </div>
                  <div className="flex items-start gap-3 flex-1">
                    <Icon size={16} style={{ color: "var(--ink-3)", flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: "var(--ink-1)" }}>{title}</p>
                      <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>{desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {machine && (
            <div
              className="rounded-2xl p-5"
              style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
            >
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--ink-3)" }}>
                Máquina
              </p>
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                  style={{ background: "var(--primary-soft)" }}
                >
                  <MapPin size={16} style={{ color: "var(--primary)" }} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: "var(--ink-1)" }}>{machine.name}</p>
                  <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>{machine.address}</p>
                </div>
              </div>
              {machine.latitude && machine.longitude && (
                <button
                  onClick={directions}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition hover:opacity-80"
                  style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                >
                  <Navigation size={14} /> Ver rota
                </button>
              )}
            </div>
          )}

          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
          >
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--ink-3)" }}>
              Detalhes
            </p>
            <div className="flex flex-col gap-2">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg" style={{ background: "var(--surface)" }}>
                    {it.product_image && <img src={it.product_image} alt={it.product_name} className="h-full w-full object-cover" />}
                  </div>
                  <p className="flex-1 truncate text-[12px] font-medium" style={{ color: "var(--ink-1)" }}>
                    {it.quantity}× {it.product_name}
                  </p>
                  <span className="text-[12px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>
                    {brl(it.unit_price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div
              className="mt-3 flex justify-between pt-3 text-[14px] font-bold"
              style={{ borderTop: "1px solid var(--hairline)", color: "var(--ink-1)" }}
            >
              <span>Total</span>
              <span style={{ color: "var(--primary)" }}>{brl(order.total)}</span>
            </div>
          </div>

          <button
            onClick={() => {
              items.forEach((i) => cart.add({ productId: i.product_id, name: i.product_name, price: Number(i.unit_price), image: i.product_image }, i.quantity));
              navigate({ to: "/cart" });
            }}
            className="w-full rounded-2xl py-3 text-[13px] font-semibold transition hover:opacity-80"
            style={{ background: "var(--surface)", color: "var(--ink-1)", border: "1px solid var(--hairline)" }}
          >
            Pedir novamente
          </button>
        </div>
      </div>
    </div>
  );
}
