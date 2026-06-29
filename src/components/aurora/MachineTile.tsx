import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Package, Thermometer } from "lucide-react";

export type MachineTileData = {
  id: string;
  name: string;
  address: string;
  status: "online" | "offline" | "maintenance";
  stock_level: number;
  distance_km?: number;
  temperature_c?: number | null;
  opens_at?: string | null;
  closes_at?: string | null;
};

export function MachineTile({ m, dense = false }: { m: MachineTileData; dense?: boolean }) {
  const online = m.status === "online";
  return (
    <Link
      to="/machines/$id"
      params={{ id: m.id }}
      className="card-nested press group flex flex-col gap-4 p-5 transition hover:shadow-md sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: online ? "var(--primary)" : "var(--ink-3)", boxShadow: online ? "0 0 8px var(--primary-glow)" : "none" }}
            />
            <h3 className="truncate text-title-lg" style={{ color: "var(--ink-1)" }}>{m.name}</h3>
          </div>
          <p className="mt-1.5 truncate text-body-sm" style={{ color: "var(--ink-2)" }}>{m.address}</p>
        </div>
        {m.distance_km != null && (
          <p className="shrink-0 font-display text-[15px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>
            {m.distance_km.toFixed(1)}<span className="ml-0.5 text-[11px] font-normal" style={{ color: "var(--ink-3)" }}>km</span>
          </p>
        )}
      </div>

      {!dense && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]" style={{ color: "var(--ink-2)" }}>
          <span className="inline-flex items-center gap-1.5">
            <Package size={13} strokeWidth={1.7} />
            {m.stock_level} itens
          </span>
          {m.temperature_c != null && (
            <span className="inline-flex items-center gap-1.5">
              <Thermometer size={13} strokeWidth={1.7} />
              {m.temperature_c}°C
            </span>
          )}
          {m.opens_at && m.closes_at && (
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} strokeWidth={1.7} />
              até {m.closes_at.slice(0, 5)}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center gap-1 text-[13.5px] font-semibold" style={{ color: "var(--primary)" }}>
        Ver rota <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
