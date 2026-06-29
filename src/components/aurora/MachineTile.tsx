import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Package, Thermometer } from "lucide-react";
import { machineLine } from "@/lib/coach";

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

export function MachineTile({
  m,
  dense = false,
  personality = false,
}: {
  m: MachineTileData;
  dense?: boolean;
  personality?: boolean;  // Show living "voice" lines (e.g. on Home)
}) {
  const online = m.status === "online";

  // Generate a living line
  const aliveLine = personality
    ? machineLine({
        distance_km: m.distance_km,
        stock_level: m.stock_level,
        nextRefillHour: undefined,
        hasItemLow: m.stock_level <= 2,
      })
    : null;

  return (
    <Link
      to="/machines/$id"
      params={{ id: m.id }}
      className="card-aurora press group relative flex flex-col gap-4 p-6 transition sm:p-7"
    >
      {/* Live status line at top */}
      {personality && aliveLine && (
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full pulse-dot"
            style={{ background: online ? "var(--primary)" : "var(--ink-3)", boxShadow: online ? "0 0 8px var(--primary-glow)" : "none" }}
          />
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--primary)" }}>
            {aliveLine}
          </p>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {!personality && (
            <div className="mb-1.5 flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: online ? "var(--primary)" : "var(--ink-3)" }}
              />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: online ? "var(--primary)" : "var(--ink-3)" }}>
                {online ? "online" : m.status === "maintenance" ? "manutenção" : "offline"}
              </span>
            </div>
          )}
          <h3 className={personality ? "text-headline" : "text-title-lg"} style={{ color: "var(--ink-1)" }}>
            {m.name}
          </h3>
          <p className="mt-1.5 truncate text-body-sm" style={{ color: "var(--ink-2)" }}>{m.address}</p>
        </div>

        {m.distance_km != null && !personality && (
          <p className="shrink-0 font-display text-[17px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>
            {m.distance_km.toFixed(1)}
            <span className="ml-0.5 text-[11px] font-normal" style={{ color: "var(--ink-3)" }}>km</span>
          </p>
        )}
      </div>

      {!dense && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]" style={{ color: "var(--ink-2)" }}>
          <span className="inline-flex items-center gap-1.5">
            <Package size={13} strokeWidth={1.7} />
            {m.stock_level} pratos
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
