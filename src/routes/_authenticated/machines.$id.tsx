import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, MapPin, Navigation, Package, PackageOpen, Thermometer, Users, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/premium/Skeleton";
import { EmptyState } from "@/components/premium/EmptyState";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/machines/$id")({
  component: MachineDetailPage,
});

function MachineDetailPage() {
  const { id } = useParams({ from: "/_authenticated/machines/$id" });

  const { data: machine } = useQuery({
    queryKey: ["machine", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("machines").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: stock = [], isLoading } = useQuery({
    queryKey: ["machine-stock", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machine_products")
        .select("stock, slot, products(id,name,image_url,price,promo_price,calories,protein,carbs,fat,rating)")
        .eq("machine_id", id)
        .gt("stock", 0);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!machine) {
    return <div className="grid h-64 place-items-center text-sm text-muted-foreground">Carregando máquina…</div>;
  }

  const statusColor =
    machine.status === "online" ? "bg-emerald-500"
      : machine.status === "maintenance" ? "bg-amber-500"
        : "bg-rose-500";

  const directionsUrl = machine.latitude && machine.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${machine.latitude},${machine.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(machine.address ?? machine.name)}`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/machines" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} /> Máquinas
      </Link>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-[oklch(0.45_0.18_140)] p-6 text-primary-foreground">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase">
              <span className={`inline-block h-2 w-2 rounded-full ${statusColor}`} />
              {machine.status === "online" ? "Aberta agora" : machine.status === "maintenance" ? "Em manutenção" : "Offline"}
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold">{machine.name}</h1>
            <p className="mt-1 flex items-start gap-1 text-sm opacity-90">
              <MapPin size={14} className="mt-0.5 shrink-0" />
              <span>{machine.address}{machine.city ? `, ${machine.city}` : ""}</span>
            </p>
          </div>
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold backdrop-blur hover:bg-white/25">
            <Navigation size={14} /> Rota
          </a>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { icon: Package, label: "Estoque", value: `${machine.stock_level ?? 0}%` },
            { icon: Thermometer, label: "Temp.", value: machine.temperature_c != null ? `${machine.temperature_c}°C` : "—" },
            { icon: Users, label: "Fila", value: `${machine.queue_size ?? 0}` },
            { icon: Clock, label: "Funciona", value: machine.opens_at && machine.closes_at ? `${String(machine.opens_at).slice(0,5)}–${String(machine.closes_at).slice(0,5)}` : "24h" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl bg-white/10 p-3 backdrop-blur">
              <m.icon size={14} className="opacity-80" />
              <div className="mt-1 text-[10px] uppercase opacity-80">{m.label}</div>
              <div className="font-bold">{m.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Nível de estoque</div>
            <div className="text-xs text-muted-foreground">Atualizado em tempo real</div>
          </div>
          <div className="flex items-center gap-1 text-xs text-emerald-600"><Zap size={12} /> Ao vivo</div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all" style={{ width: `${machine.stock_level ?? 0}%` }} />
        </div>
        {machine.next_refill_at && (
          <div className="mt-2 text-xs text-muted-foreground">
            Próx. reposição: {new Date(machine.next_refill_at).toLocaleString("pt-BR")}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-bold">Disponível agora</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : stock.length === 0 ? (
          <EmptyState icon={PackageOpen} title="Sem produtos disponíveis" description="Esta máquina está sendo reposta." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {stock.map((s: any) => s.products && (
              <div key={s.products.id} className="relative">
                <ProductCard p={s.products as ProductCardData} />
                <div className="absolute right-2 top-2 z-10 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-semibold ring-1 ring-border/60 backdrop-blur">
                  {s.stock} un.
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}