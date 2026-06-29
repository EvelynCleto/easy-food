import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, MapPin, Navigation } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/format";
import { useCart } from "@/contexts/CartContext";
import { PixQrCode } from "@/components/premium/PixQrCode";
import { OrderTimeline } from "@/components/premium/OrderTimeline";

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

  if (!order) return <p className="p-8 text-center text-muted-foreground">Carregando...</p>;

  const items = (order.order_items ?? []) as Array<{ product_id: string; product_name: string; product_image: string | null; quantity: number; unit_price: number }>;
  const payment = ((order.payments ?? []) as Array<{ method: string; status: string; pix_code: string | null }>)[0];
  const machine = order.machines as { name: string; address: string; latitude: number | null; longitude: number | null } | null;
  const expiresAt = order.expires_at ? new Date(order.expires_at) : null;
  const remainingMs = expiresAt ? Math.max(0, expiresAt.getTime() - now) : 0;
  const mm = String(Math.floor(remainingMs / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, "0");

  const showPix = payment?.method === "pix" && payment?.status === "pending" && payment.pix_code;
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

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <button onClick={() => navigate({ to: "/orders" })} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Voltar
      </button>

      {showPix ? (
        <div className="rounded-3xl bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] p-6 text-white">
          <div className="text-xs uppercase tracking-wide text-white/70">Pague com PIX</div>
          <div className="mt-1 text-lg font-bold">Aponte a câmera para o QR</div>
          {expiresAt && remainingMs > 0 && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
              <Clock size={12} /> Expira em {mm}:{ss}
            </div>
          )}
          <div className="mt-4">
            <PixQrCode value={payment.pix_code!} />
          </div>
          <button onClick={simulatePaid} className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90">
            Já paguei (simular confirmação)
          </button>
        </div>
      ) : (
        <div className="rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.5_0.16_140)] p-6 text-primary-foreground">
          <div className="text-xs uppercase tracking-wide opacity-90">Código de retirada</div>
          <div className="mt-2 font-mono text-5xl font-black tracking-widest">{order.pickup_code}</div>
          <div className="mt-4 grid place-items-center rounded-2xl bg-white/15 p-4">
            <PixQrCode value={pickupValue} size={180} />
          </div>
          {expiresAt && <p className="mt-3 inline-flex items-center gap-1 text-xs"><Clock size={12} /> Expira em {expiresAt.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</p>}
        </div>
      )}

      <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
        <h2 className="mb-3 text-sm font-semibold">Acompanhe seu pedido</h2>
        <OrderTimeline
          status={order.status}
          createdAt={order.created_at}
          paidAt={order.status !== "pending" ? order.updated_at : null}
          readyAt={["ready", "collected"].includes(order.status) ? order.updated_at : null}
          deliveredAt={order.status === "collected" ? order.updated_at : null}
        />
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
        <div className="text-xs text-muted-foreground">Pedido #{order.id.slice(0,8)}</div>
        <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold capitalize text-accent-foreground">{order.status}</div>
        {machine && (
          <div className="mt-3 flex items-start justify-between gap-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 text-primary" />
              <div><div className="font-semibold">{machine.name}</div><div className="text-xs text-muted-foreground">{machine.address}</div></div>
            </div>
            {machine.latitude && machine.longitude && (
              <button onClick={directions} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20">
                <Navigation size={12} /> Rota
              </button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
        <h2 className="text-sm font-semibold">Itens</h2>
        <div className="mt-3 space-y-3">
          {items.map((it, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                {it.product_image && <img src={it.product_image} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{it.product_name}</div>
                <div className="text-xs text-muted-foreground">{it.quantity}× {brl(it.unit_price)}</div>
              </div>
              <div className="text-sm font-bold">{brl(it.unit_price * it.quantity)}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{brl(order.subtotal)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Taxa</span><span>{brl(order.fee)}</span></div>
          {Number(order.discount) > 0 && <div className="flex justify-between text-primary"><span>Desconto</span><span>-{brl(order.discount)}</span></div>}
          <div className="flex justify-between pt-2 text-base font-bold"><span>Total</span><span className="text-primary">{brl(order.total)}</span></div>
        </div>
        {payment && <p className="mt-3 text-xs text-muted-foreground">Pagamento: {payment.method.toUpperCase()} · <span className="font-semibold capitalize">{payment.status}</span></p>}
      </div>

      <button onClick={() => {
        items.forEach((i) => cart.add({ productId: i.product_id, name: i.product_name, price: Number(i.unit_price), image: i.product_image }, i.quantity));
        navigate({ to: "/cart" });
      }} className="w-full rounded-xl border border-input bg-card py-3 text-sm font-semibold hover:bg-accent">
        Comprar novamente
      </button>
    </div>
  );
}