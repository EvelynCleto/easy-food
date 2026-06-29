import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { MapPin, Navigation, Thermometer, Clock, Package } from "lucide-react";
import { MachineCover } from "@/components/premium/MachineCover";
import { supabase } from "@/integrations/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { haversineKm, formatDistance, googleMapsDirectionsUrl, type LatLng } from "@/lib/geo";
import { MachineCardSkeleton } from "@/components/premium/Skeleton";
import { SectionHeader } from "@/components/premium/SectionHeader";

export const Route = createFileRoute("/_authenticated/machines")({
  component: MachinesPage,
});

type Machine = {
  id: string; name: string; address: string;
  latitude: number | null; longitude: number | null;
  status: string; stock_level: number;
  image_url: string | null; temperature_c: number | null;
  opens_at: string | null; closes_at: string | null;
};

// Lazy-load Leaflet from CDN — no API key needed (OpenStreetMap tiles).
function useLeaflet() {
  const loaded = useRef(false);
  useEffect(() => {
    if (loaded.current || typeof window === "undefined") return;
    if ((window as any).L) { loaded.current = true; return; }
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(css);
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.async = true;
    s.onload = () => { loaded.current = true; window.dispatchEvent(new Event("leaflet-loaded")); };
    document.head.appendChild(s);
  }, []);
}

function MachinesPage() {
  useLeaflet();
  const geo = useGeolocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  const { data: machines = [], isLoading } = useQuery({
    queryKey: ["machines-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machines")
        .select("id,name,address,latitude,longitude,status,stock_level,image_url,temperature_c,opens_at,closes_at");
      if (error) throw error;
      return (data ?? []) as Machine[];
    },
  });

  const enriched = useMemo(() => {
    if (!geo.position) return machines.map((m) => ({ ...m, distance: null as number | null }));
    return machines
      .map((m) => ({
        ...m,
        distance:
          m.latitude != null && m.longitude != null
            ? haversineKm(geo.position!, { lat: m.latitude, lng: m.longitude })
            : null,
      }))
      .sort((a, b) => (a.distance ?? 9e9) - (b.distance ?? 9e9));
  }, [machines, geo.position]);

  // Initialize Leaflet map + markers
  useEffect(() => {
    function init() {
      const L = (window as any).L;
      if (!L || !mapRef.current || mapInstance.current) return;
      const center: LatLng = geo.position ?? { lat: -23.5631, lng: -46.6544 };
      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView([center.lat, center.lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      mapInstance.current = map;
      // user marker
      if (geo.position && !geo.fallback) {
        L.circleMarker([geo.position.lat, geo.position.lng], {
          radius: 8, color: "#55AD2F", fillColor: "#55AD2F", fillOpacity: 0.8,
        }).addTo(map).bindPopup("Você está aqui");
      }
      // machine markers
      enriched.forEach((m) => {
        if (m.latitude == null || m.longitude == null) return;
        const icon = L.divIcon({
          className: "easyfood-marker",
          html: `<div style="background:#55AD2F;color:#fff;border-radius:50%;width:30px;height:30px;display:grid;place-items:center;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.25);font-size:14px;font-weight:700">${m.stock_level > 5 ? "✓" : "!"}</div>`,
          iconSize: [30, 30], iconAnchor: [15, 15],
        });
        const distLabel = m.distance != null ? `<br><b>${formatDistance(m.distance)}</b>` : "";
        L.marker([m.latitude, m.longitude], { icon })
          .addTo(map)
          .bindPopup(`<b>${m.name}</b><br><small>${m.address}</small>${distLabel}`);
      });
    }
    if ((window as any).L) init();
    else window.addEventListener("leaflet-loaded", init);
    return () => window.removeEventListener("leaflet-loaded", init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enriched.length, geo.position?.lat, geo.position?.lng]);

  return (
    <div>
      <SectionHeader
        title="Máquinas próximas"
        subtitle={geo.fallback ? "Mostrando São Paulo (ative localização para ordenação real)" : "Ordenadas pela sua distância"}
      />

      <div className="mb-6 overflow-hidden rounded-3xl ring-1 ring-border/60 shadow-sm">
        <div ref={mapRef} className="h-64 w-full bg-muted sm:h-80" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <MachineCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enriched.map((m) => (
            <MachineRow key={m.id} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MachineRow({ m }: { m: Machine & { distance: number | null } }) {
  const online = m.status === "online";
  const dest = m.latitude != null && m.longitude != null
    ? googleMapsDirectionsUrl({ lat: m.latitude, lng: m.longitude }, m.name)
    : null;
  return (
    <article className="card-premium overflow-hidden">
      <MachineCover name={m.name} id={m.id} online={online} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-[17px] font-semibold tracking-tight">{m.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={12} className="shrink-0" /> <span className="truncate">{m.address}</span>
            </p>
          </div>
          {m.distance != null && (
            <span className="shrink-0 rounded-full bg-foreground/5 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-foreground/80 ring-1 ring-border/60">
              {formatDistance(m.distance)}
            </span>
          )}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-1.5 text-[11px]">
          <Pill icon={Package} label={`${m.stock_level} itens`} />
          <Pill icon={Thermometer} label={`${m.temperature_c ?? 4}°C`} />
          <Pill icon={Clock} label={`${m.opens_at?.slice(0,5) ?? "06:00"}–${m.closes_at?.slice(0,5) ?? "23:00"}`} />
        </div>
        {dest && (
          <a
            href={dest}
            target="_blank"
            rel="noopener noreferrer"
            className="press mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
          >
            <Navigation size={14} /> Como chegar
          </a>
        )}
      </div>
    </article>
  );
}

function Pill({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-foreground/[0.04] px-2 py-1.5 font-medium text-foreground/75 ring-1 ring-border/40">
      <Icon size={11} className="opacity-70" /> <span className="truncate">{label}</span>
    </span>
  );
}