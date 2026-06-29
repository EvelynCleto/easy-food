import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { Navigation, Thermometer, Clock, Package, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { haversineKm, formatDistance, googleMapsDirectionsUrl, type LatLng } from "@/lib/geo";

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

function MachinesPage() {
  useLeaflet();
  const geo = useGeolocation();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  const { data: machines = [] } = useQuery({
    queryKey: ["machines-full"],
    queryFn: async () => (await supabase.from("machines").select("id,name,address,latitude,longitude,status,stock_level,image_url,temperature_c,opens_at,closes_at")).data as Machine[] ?? [],
  });

  const enriched = useMemo(() => {
    if (!geo.position) return machines.map((m) => ({ ...m, distance: null as number | null }));
    return machines.map((m) => ({
      ...m,
      distance: m.latitude != null && m.longitude != null
        ? haversineKm(geo.position!, { lat: m.latitude, lng: m.longitude }) : null,
    })).sort((a, b) => (a.distance ?? 9e9) - (b.distance ?? 9e9));
  }, [machines, geo.position]);

  useEffect(() => {
    function init() {
      const L = (window as any).L;
      if (!L || !mapRef.current || mapInstance.current) return;
      const center: LatLng = geo.position ?? { lat: -23.5631, lng: -46.6544 };
      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([center.lat, center.lng], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      mapInstance.current = map;
      enriched.forEach((m) => {
        if (m.latitude == null || m.longitude == null) return;
        const icon = L.divIcon({
          className: "easyfood-marker",
          html: `<div style="width:14px;height:14px;background:#1d8847;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25)"></div>`,
          iconSize: [14,14], iconAnchor: [7,7],
        });
        L.marker([m.latitude, m.longitude], { icon }).addTo(map).bindPopup(`<b>${m.name}</b>`);
      });
    }
    if ((window as any).L) init();
    else window.addEventListener("leaflet-loaded", init);
    return () => window.removeEventListener("leaflet-loaded", init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enriched.length, geo.position?.lat, geo.position?.lng]);

  return (
    <div>
      <h1 className="text-display">Máquinas</h1>
      <p className="text-caption mt-2">
        {geo.fallback ? "Mostrando São Paulo (ative localização para ver as mais próximas)" : "Ordenadas por distância"}
      </p>

      <div className="mt-10 overflow-hidden rounded-3xl">
        <div ref={mapRef} className="h-80 w-full bg-surface sm:h-[420px]" />
      </div>

      <div className="mt-10 divide-y divide-border/60 border-y border-border/60">
        {enriched.map((m) => <MachineRow key={m.id} m={m} />)}
      </div>
    </div>
  );
}

function MachineRow({ m }: { m: Machine & { distance: number | null } }) {
  const online = m.status === "online";
  const dest = m.latitude != null && m.longitude != null ? googleMapsDirectionsUrl({ lat: m.latitude, lng: m.longitude }, m.name) : null;
  return (
    <article className="grid items-center gap-5 py-6 sm:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="truncate text-[17px] font-semibold">{m.name}</h3>
          <span className={`h-2 w-2 shrink-0 rounded-full ${online ? "bg-primary" : "bg-muted-foreground"}`} />
        </div>
        <p className="mt-1 text-[14px] text-muted-foreground">
          {m.distance != null && <span>{formatDistance(m.distance)} · </span>}{m.address}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Package size={14} strokeWidth={1.8} />{m.stock_level} itens</span>
          <span className="inline-flex items-center gap-1.5"><Thermometer size={14} strokeWidth={1.8} />{m.temperature_c ?? 4}°C</span>
          <span className="inline-flex items-center gap-1.5"><Clock size={14} strokeWidth={1.8} />{m.opens_at?.slice(0,5) ?? "06:00"}–{m.closes_at?.slice(0,5) ?? "23:00"}</span>
        </div>
      </div>
      {dest && (
        <a href={dest} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-surface px-5 py-2.5 text-[13px] font-medium transition hover:bg-surface/70">
          <Navigation size={14} strokeWidth={1.8} /> Como chegar <ChevronRight size={14} />
        </a>
      )}
    </article>
  );
}
