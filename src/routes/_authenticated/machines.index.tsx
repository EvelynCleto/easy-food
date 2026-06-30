import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { haversineKm, formatDistance, type LatLng } from "@/lib/geo";
import { Clock, MapPin, Package, Phone, Search, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/machines/")({
  head: () => ({ meta: [{ title: "Máquinas EasyFood perto de você" }] }),
  component: MachinesPage,
});

type Machine = {
  id: string; name: string; address: string;
  latitude: number | null; longitude: number | null;
  status: "online" | "offline" | "maintenance"; stock_level: number;
  image_url: string | null; temperature_c: number | null;
  opens_at: string | null; closes_at: string | null;
};

function useLeaflet() {
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current || typeof window === "undefined") return;
    if ((window as any).L) { loaded.current = true; return; }
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.async = true;
    s.onload = () => { loaded.current = true; window.dispatchEvent(new Event("leaflet-loaded")); };
    document.head.appendChild(s);
  }, []);
}

function isOpenNow(m: Machine): boolean {
  if (m.status !== "online") return false;
  if (!m.opens_at || !m.closes_at) return m.status === "online";
  const now = new Date();
  const [oh, om] = m.opens_at.split(":").map(Number);
  const [ch, cm] = m.closes_at.split(":").map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;
  return nowMins >= openMins && nowMins < closeMins;
}

// ── Machine card (horizontal scroll) ────────────────────────────────────────
function MachineScrollCard({
  m, selected, onClick,
}: {
  m: Machine & { distance_km?: number };
  selected: boolean;
  onClick: () => void;
}) {
  const open = isOpenNow(m);
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 w-52 rounded-xl overflow-hidden text-left transition hover:opacity-90"
      style={{
        background: "var(--card)",
        border: selected ? "2px solid var(--primary)" : "1px solid var(--hairline)",
        boxShadow: selected ? "0 0 0 3px var(--primary-soft)" : "none",
      }}
    >
      {/* Photo */}
      <div className="aspect-video w-full overflow-hidden" style={{ background: "var(--surface)" }}>
        {m.image_url ? (
          <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🥗</div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-[13px] truncate" style={{ color: "var(--ink-1)" }}>{m.name}</p>
        {m.distance_km != null && (
          <p className="text-[11px] mt-0.5" style={{ color: "var(--ink-3)" }}>{formatDistance(m.distance_km)}</p>
        )}
        <span
          className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            background: open ? "var(--primary-soft)" : "var(--surface)",
            color: open ? "var(--primary)" : "var(--ink-3)",
          }}
        >
          {open ? "Aberta agora" : m.closes_at ? `Fecha às ${m.closes_at.slice(0, 5)}` : "Fechada"}
        </span>
      </div>
    </button>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
function MachinesPage() {
  useLeaflet();
  const geo = useGeolocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: machines = [] } = useQuery({
    queryKey: ["machines-full"],
    queryFn: async () =>
      (await supabase.from("machines").select("id,name,address,latitude,longitude,status,stock_level,image_url,temperature_c,opens_at,closes_at")).data as Machine[] ?? [],
  });

  const enriched = useMemo(() => {
    if (!geo.position) return machines.map((m) => ({ ...m, distance_km: undefined as number | undefined }));
    return machines.map((m) => ({
      ...m,
      distance_km: m.latitude != null && m.longitude != null
        ? haversineKm(geo.position!, { lat: m.latitude, lng: m.longitude }) : undefined,
    })).sort((a, b) => (a.distance_km ?? 9e9) - (b.distance_km ?? 9e9));
  }, [machines, geo.position]);

  const filtered = useMemo(() => {
    if (!search.trim()) return enriched;
    const q = search.toLowerCase();
    return enriched.filter((m) => m.name.toLowerCase().includes(q) || m.address.toLowerCase().includes(q));
  }, [enriched, search]);

  // Default selected = first (nearest)
  const selectedMachine = enriched.find((m) => m.id === selectedId) ?? enriched[0] ?? null;

  useEffect(() => {
    function init() {
      const L = (window as any).L;
      if (!L || !mapRef.current || mapInstance.current) return;
      const center: LatLng = geo.position ?? { lat: -23.5631, lng: -46.6544 };
      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView([center.lat, center.lng], 13);
      const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
      const tiles = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png"
        : "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png";
      L.tileLayer(tiles, { maxZoom: 19 }).addTo(map);
      mapInstance.current = map;
      enriched.forEach((m, idx) => {
        if (m.latitude == null || m.longitude == null) return;
        const isFirst = idx === 0;
        const icon = L.divIcon({
          className: "easyfood-marker",
          html: `<div style="
            width:28px;height:28px;
            background:${isFirst ? "#1E8654" : "#fff"};
            color:${isFirst ? "#fff" : "#1E8654"};
            border-radius:50%;
            border:2px solid #1E8654;
            box-shadow:0 2px 8px rgba(30,134,84,.35);
            display:flex;align-items:center;justify-content:center;
            font-size:11px;font-weight:700;
          ">${idx + 1}</div>`,
          iconSize: [28, 28], iconAnchor: [14, 14],
        });
        L.marker([m.latitude, m.longitude], { icon }).addTo(map).bindPopup(`<b>${m.name}</b><br>${m.address}`);
      });
    }
    if ((window as any).L) init();
    else window.addEventListener("leaflet-loaded", init);
    return () => window.removeEventListener("leaflet-loaded", init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enriched.length, geo.position?.lat, geo.position?.lng]);

  const open = selectedMachine ? isOpenNow(selectedMachine) : false;

  return (
    <div className="animate-rise">
      {/* Header */}
      <header className="mb-6">
        <h1 className="font-display text-[32px] font-bold" style={{ color: "var(--ink-1)" }}>Máquinas</h1>
        <p className="mt-1 text-[15px]" style={{ color: "var(--ink-2)" }}>
          Encontre máquinas próximas e garanta sua refeição saudável onde estiver.
        </p>
      </header>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-3)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar máquinas…"
            className="w-full rounded-xl py-3 pl-10 pr-4 text-[14px] outline-none"
            style={{ background: "var(--card)", border: "0.5px solid var(--hairline)", color: "var(--ink-1)" }}
          />
        </div>
        <button
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-[13.5px] font-semibold transition hover:opacity-80"
          style={{ background: "var(--card)", border: "0.5px solid var(--hairline)", color: "var(--ink-1)" }}
        >
          <SlidersHorizontal size={15} /> Filtros
        </button>
      </div>

      {/* Map */}
      <div className="overflow-hidden rounded-2xl mb-6" style={{ background: "var(--surface)" }}>
        <div ref={mapRef} className="h-[400px] w-full" />
      </div>

      {/* Horizontal scroll */}
      <div className="mb-8">
        <h2 className="font-display text-[18px] font-bold mb-3" style={{ color: "var(--ink-1)" }}>Próximas de você</h2>
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {filtered.map((m) => (
            <MachineScrollCard
              key={m.id}
              m={m}
              selected={m.id === (selectedMachine?.id ?? null)}
              onClick={() => setSelectedId(m.id)}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-[14px] py-8" style={{ color: "var(--ink-3)" }}>Nenhuma máquina encontrada.</p>
          )}
        </div>
      </div>

      {/* 2-col layout */}
      {selectedMachine && (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Left: full machine list */}
          <div className="space-y-3">
            <h2 className="font-display text-[18px] font-bold" style={{ color: "var(--ink-1)" }}>Todas as máquinas</h2>
            {filtered.map((m) => {
              const mOpen = isOpenNow(m);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  className="w-full text-left rounded-2xl p-4 flex items-center gap-4 transition hover:opacity-90"
                  style={{
                    background: "var(--card)",
                    border: m.id === selectedMachine.id ? "1.5px solid var(--primary)" : "0.5px solid var(--hairline)",
                  }}
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0" style={{ background: "var(--surface)" }}>
                    {m.image_url
                      ? <img src={m.image_url} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">🥗</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-[14px] truncate" style={{ color: "var(--ink-1)" }}>{m.name}</p>
                      {m.distance_km != null && (
                        <span className="shrink-0 text-[12px] font-semibold" style={{ color: "var(--ink-3)" }}>{formatDistance(m.distance_km)}</span>
                      )}
                    </div>
                    <p className="text-[12px] truncate mt-0.5" style={{ color: "var(--ink-2)" }}>{m.address}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: mOpen ? "var(--primary-soft)" : "var(--surface)", color: mOpen ? "var(--primary)" : "var(--ink-3)" }}
                      >
                        {mOpen ? "Aberta agora" : m.closes_at ? `Fecha às ${m.closes_at.slice(0, 5)}` : "Fechada"}
                      </span>
                      <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--ink-3)" }}>
                        <Package size={11} /> {m.stock_level} refeições
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {/* Photo */}
            <div className="aspect-video w-full overflow-hidden rounded-2xl" style={{ background: "var(--surface)" }}>
              {selectedMachine.image_url
                ? <img src={selectedMachine.image_url} alt={selectedMachine.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-6xl">🥗</div>
              }
            </div>

            {/* Status badge + name */}
            <div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold"
                style={{ background: open ? "var(--primary-soft)" : "var(--surface)", color: open ? "var(--primary)" : "var(--ink-3)" }}
              >
                ✦ {open ? "Aberta agora" : "Fechada no momento"}
              </span>
              <h3 className="font-display text-[20px] font-bold mt-2" style={{ color: "var(--ink-1)" }}>{selectedMachine.name}</h3>
              <p className="text-[13px] mt-1" style={{ color: "var(--ink-2)" }}>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} />
                  {selectedMachine.address}
                  {selectedMachine.distance_km != null && ` • ${formatDistance(selectedMachine.distance_km)}`}
                </span>
              </p>
            </div>

            {/* CTA */}
            <div
              className="flex items-center justify-between rounded-2xl px-4 py-3 cursor-pointer hover:opacity-90 transition"
              style={{ background: "var(--primary)" }}
            >
              <div className="flex items-center gap-2.5 text-white">
                <span className="text-xl">🛍</span>
                <span className="text-[14px] font-semibold">Retire sua refeição em segundos</span>
              </div>
              <span className="text-white font-bold">›</span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <Package size={13} />, label: `${selectedMachine.stock_level} refeições`, sub: "disponíveis" },
                { icon: <Clock size={13} />, label: selectedMachine.closes_at ? `Até ${selectedMachine.closes_at.slice(0, 5)}` : "—", sub: "horário" },
                { icon: <span className="text-xs">⚡</span>, label: "3 min", sub: "tempo médio" },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-1 rounded-xl p-3 text-center" style={{ background: "var(--surface)" }}>
                  <span style={{ color: "var(--ink-3)" }}>{s.icon}</span>
                  <p className="text-[11px] font-semibold" style={{ color: "var(--ink-1)" }}>{s.label}</p>
                  <p className="text-[10px]" style={{ color: "var(--ink-3)" }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* "Peça pelo app" card */}
            <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#F0FDF4", border: "0.5px solid #BBF7D0" }}>
              <Phone size={20} style={{ color: "var(--primary)", flexShrink: 0 }} />
              <div className="flex-1">
                <p className="text-[13px] font-semibold" style={{ color: "var(--ink-1)" }}>Peça pelo app e retire sem filas!</p>
                <button className="text-[12px] font-semibold mt-0.5" style={{ color: "var(--primary)" }}>Ver como funciona ›</button>
              </div>
            </div>

            {/* Ver cardápio */}
            <Link
              to="/machines/$id"
              params={{ id: selectedMachine.id }}
              className="block w-full text-center rounded-2xl py-4 text-[15px] font-bold text-white transition hover:opacity-85"
              style={{ background: "#111" }}
            >
              Ver cardápio da máquina →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
