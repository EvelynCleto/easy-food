import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { MachineTile } from "@/components/aurora/MachineTile";
import { supabase } from "@/integrations/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { haversineKm, type LatLng } from "@/lib/geo";

export const Route = createFileRoute("/_authenticated/machines/")({
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
    if (!geo.position) return machines.map((m) => ({ ...m, distance_km: undefined as number | undefined }));
    return machines.map((m) => ({
      ...m,
      distance_km: m.latitude != null && m.longitude != null
        ? haversineKm(geo.position!, { lat: m.latitude, lng: m.longitude }) : undefined,
    })).sort((a, b) => (a.distance_km ?? 9e9) - (b.distance_km ?? 9e9));
  }, [machines, geo.position]);

  useEffect(() => {
    function init() {
      const L = (window as any).L;
      if (!L || !mapRef.current || mapInstance.current) return;
      const center: LatLng = geo.position ?? { lat: -23.5631, lng: -46.6544 };
      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView([center.lat, center.lng], 13);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      mapInstance.current = map;
      enriched.forEach((m) => {
        if (m.latitude == null || m.longitude == null) return;
        const icon = L.divIcon({
          className: "easyfood-marker",
          html: `<div style="width:12px;height:12px;background:#1E8654;border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(30,134,84,.35)"></div>`,
          iconSize: [12,12], iconAnchor: [6,6],
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
    <div className="animate-rise">
      <header className="mb-8">
        <p className="text-eyebrow">rede EasyFood</p>
        <h1 className="text-display-m mt-3">Máquinas</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-body-sm" style={{ color: "var(--ink-2)" }}>
            {geo.fallback ? "Mostrando São Paulo (ative a localização para precisão)" : "Ordenadas por distância de você"}
          </p>
          {machines.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold" style={{ background: "var(--accent)", color: "var(--primary)" }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "var(--primary)" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--primary)" }} />
              </span>
              {machines.filter((m) => m.status === "online").length} online agora
            </span>
          )}
        </div>
      </header>

      <div className="overflow-hidden rounded-[28px]" style={{ background: "var(--surface)" }}>
        <div ref={mapRef} className="h-72 w-full sm:h-[420px]" />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {enriched.map((m) => <MachineTile key={m.id} m={m} />)}
      </div>
    </div>
  );
}
