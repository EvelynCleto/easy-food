import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
  Navigation,
  Plus,
  Star,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { brl } from "@/lib/format";
import { haptic } from "@/lib/celebrate";

export const Route = createFileRoute("/_authenticated/machines/$id")({
  component: MachineDetailPage,
});

const FILTER_CHIPS = ["Todas", "Mais pedidas", "Proteínas", "Veganas", "Leves", "Sem glúten", "Low carb"];

/* ─── vending machine SVG ────────────────────────────────────────── */
function VendingMachineSVG() {
  return (
    <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <rect x="10" y="5" width="100" height="170" rx="8" fill="#E8EAE8" stroke="#C8CBC8" strokeWidth="1.5" />
      <rect x="18" y="15" width="84" height="80" rx="4" fill="#2a3a2a" />
      {/* shelves */}
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <rect key={`${row}-${col}`} x={22 + col * 20} y={20 + row * 25} width="15" height="18" rx="2" fill="#3a5a3a" />
        ))
      )}
      <rect x="18" y="100" width="84" height="30" rx="3" fill="#C8CBC8" />
      <rect x="22" y="104" width="76" height="22" rx="2" fill="#1a2a1a" />
      {/* keypad */}
      <rect x="70" y="140" width="28" height="24" rx="3" fill="#D0D3D0" />
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
        <rect key={`k${r}${c}`} x={73 + c * 8} y={143 + r * 7} width="5" height="4" rx="1" fill="#A0A3A0" />
      )))}
      {/* logo */}
      <rect x="18" y="138" width="44" height="28" rx="3" fill="#1E8654" />
      <text x="40" y="156" textAnchor="middle" fontSize="7" fill="white" fontFamily="Inter, sans-serif" fontWeight="600">EasyFood</text>
      {/* slot */}
      <rect x="28" y="170" width="64" height="6" rx="3" fill="#B0B3B0" />
    </svg>
  );
}

function MachineDetailPage() {
  const { id } = useParams({ from: "/_authenticated/machines/$id" });
  const [activeFilter, setActiveFilter] = useState("Todas");
  const cart = useCart();

  const { data: machine } = useQuery({
    queryKey: ["machine", id],
    queryFn: async () => {
      const { data } = await supabase.from("machines").select("*").eq("id", id).single();
      return data;
    },
  });

  const { data: stock = [], isLoading } = useQuery({
    queryKey: ["machine-stock", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("machine_products")
        .select("stock, slot, products(id,name,description,image_url,price,promo_price,calories,protein,carbs,fat,rating,tags)")
        .eq("machine_id", id)
        .gt("stock", 0);
      return data ?? [];
    },
  });

  const directionsUrl = machine?.latitude && machine?.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${machine.latitude},${machine.longitude}`
    : machine?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(machine.address)}`
    : "#";

  const products = stock
    .filter((s: any) => s.products)
    .map((s: any) => s.products);

  const filteredProducts = activeFilter === "Todas"
    ? products
    : products.filter((p: any) => {
        if (!p.tags) return false;
        const tags = Array.isArray(p.tags) ? p.tags : [];
        return tags.some((t: string) =>
          t.toLowerCase().includes(activeFilter.toLowerCase()) ||
          activeFilter.toLowerCase().includes(t.toLowerCase())
        );
      });

  const openTime = machine?.opens_at ? String(machine.opens_at).slice(0, 5) : "07:00";
  const closeTime = machine?.closes_at ? String(machine.closes_at).slice(0, 5) : "22:00";

  return (
    <div>
      {/* Top breadcrumb row */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/machines"
          className="flex items-center gap-2 text-[13px] font-medium transition hover:opacity-70"
          style={{ color: "var(--ink-2)" }}
        >
          <div
            className="grid h-9 w-9 place-items-center rounded-full"
            style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
          >
            <ArrowLeft size={16} />
          </div>
          Máquinas
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* MAIN CONTENT */}
        <div>
          {/* Machine headline */}
          <h1
            className="text-[clamp(2rem,4vw+0.5rem,3rem)] font-bold leading-none"
            style={{ color: "var(--ink-1)", fontFamily: "var(--font-display)" }}
          >
            {machine?.name ?? "EasyFood Paulista"}
          </h1>

          {/* Status row */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px]" style={{ color: "var(--ink-2)" }}>
            <span className="flex items-center gap-1.5 font-semibold" style={{ color: "#2DAB6B" }}>
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              {machine?.status === "online" ? "Aberta agora" : machine?.status === "maintenance" ? "Em manutenção" : "Offline"}
            </span>
            <span>•</span>
            <span>{stock.length * 4} refeições disponíveis</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={13} />
              Atualizado há 5 min
            </span>
            {machine?.address && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {machine.address}
                </span>
              </>
            )}
          </div>

          {/* Filter chips */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {FILTER_CHIPS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className="shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition"
                style={
                  activeFilter === f
                    ? { background: "var(--ink-1)", color: "#fff" }
                    : { background: "var(--card)", color: "var(--ink-2)", border: "1px solid var(--hairline)" }
                }
              >
                {f}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-2xl overflow-hidden">
                    <div className="aspect-square rounded-2xl" style={{ background: "var(--surface)" }} />
                    <div className="mt-2 h-4 rounded" style={{ background: "var(--surface)" }} />
                    <div className="mt-1 h-3 w-2/3 rounded" style={{ background: "var(--surface)" }} />
                  </div>
                ))
              : (filteredProducts.length > 0 ? filteredProducts : products).map((p: any) => {
                  const price = p.promo_price ?? p.price;
                  const tags: string[] = Array.isArray(p.tags) ? p.tags : [];
                  const tagBadge = tags[0];

                  return (
                    <div key={p.id} className="group relative flex flex-col">
                      {/* Image */}
                      <div
                        className="relative aspect-square overflow-hidden rounded-2xl"
                        style={{ background: "var(--surface)" }}
                      >
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="h-full w-full object-cover transition group-hover:scale-105"
                            style={{ transitionDuration: "400ms" }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-4xl">🥗</div>
                        )}

                        {/* Tag badge */}
                        {tagBadge && (
                          <div
                            className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                            style={{ background: "var(--primary)", color: "#fff" }}
                          >
                            ✦ {tagBadge}
                          </div>
                        )}

                        {/* Favorite */}
                        <button
                          onClick={(e) => e.preventDefault()}
                          className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full transition"
                          style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)" }}
                        >
                          <Heart size={14} style={{ color: "var(--ink-2)" }} />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="mt-2 flex-1 px-0.5">
                        <p className="text-[14px] font-semibold leading-tight" style={{ color: "var(--ink-1)" }}>
                          {p.name}
                        </p>
                        {p.description && (
                          <p
                            className="mt-0.5 text-[12px] leading-snug"
                            style={{
                              color: "var(--ink-3)",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {p.description}
                          </p>
                        )}

                        {/* Macros + price row */}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-[11px]" style={{ color: "var(--ink-3)" }}>
                            {p.calories && <span>{p.calories} kcal</span>}
                            {p.protein && <span>{p.protein}g proteína</span>}
                          </div>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[14px] font-bold" style={{ color: "var(--ink-1)" }}>
                            {price ? brl(price) : "—"}
                          </span>
                          <button
                            onClick={() => {
                              cart.add({ productId: p.id, name: p.name, price: price ?? 0, image: p.image_url });
                              haptic(12);
                              toast.success("Adicionado ao pedido");
                            }}
                            className="grid h-8 w-8 place-items-center rounded-full transition hover:opacity-80"
                            style={{ background: "var(--ink-1)", color: "#fff" }}
                          >
                            <Plus size={15} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>

          {/* Empty state */}
          {!isLoading && products.length === 0 && (
            <div className="mt-12 text-center">
              <p className="text-[16px] font-semibold" style={{ color: "var(--ink-1)" }}>
                Nenhum produto disponível
              </p>
              <p className="mt-1 text-[13px]" style={{ color: "var(--ink-3)" }}>
                Esta máquina está sendo reabastecida.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="flex flex-col gap-4">
          {/* How it works card */}
          <div
            className="overflow-hidden rounded-2xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
          >
            <p className="text-[13px] font-bold" style={{ color: "var(--ink-1)" }}>
              Retire sua refeição em segundos
            </p>
            <p className="mt-1 text-[12px]" style={{ color: "var(--ink-3)" }}>
              Pague online e retire na máquina.
            </p>

            {/* Vending machine illustration */}
            <div className="mx-auto mt-4 h-32 w-24">
              <VendingMachineSVG />
            </div>

            <button
              className="mt-4 flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-[13px] font-semibold transition hover:opacity-80"
              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
            >
              Como funciona
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Machine info card */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
          >
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
              Informações da máquina
            </p>
            <div className="flex flex-col gap-3">
              {[
                { icon: Clock, label: "Horário", value: `${openTime} – ${closeTime}` },
                { icon: MapPin, label: "Endereço", value: machine?.address ?? "—" },
                { icon: Star, label: "Status", value: machine?.status === "online" ? "Online" : "Offline" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div
                    className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                    style={{ background: "var(--surface)", color: "var(--ink-2)" }}
                  >
                    <Icon size={14} />
                  </div>
                  <div>
                    <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>{label}</p>
                    <p className="text-[13px] font-medium" style={{ color: "var(--ink-1)" }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Directions button */}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition hover:opacity-80"
              style={{ background: "var(--ink-1)", color: "#fff" }}
            >
              <Navigation size={14} />
              Abrir no Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
