import { MapPin } from "lucide-react";
import { cn } from "@/lib/format";

export type MachineData = {
  id: string;
  name: string;
  address: string;
  status: "online" | "offline" | "maintenance";
  stock_level: number;
  distance_km?: number;
};

export function MachineCard({ m }: { m: MachineData }) {
  const statusColor =
    m.status === "online"
      ? "bg-success text-success-foreground"
      : m.status === "maintenance"
        ? "bg-warning text-foreground"
        : "bg-muted text-muted-foreground";
  return (
    <div className="min-w-[260px] max-w-[280px] rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/60">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-tight">{m.name}</h3>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", statusColor)}>
          {m.status === "online" ? "Aberta" : m.status === "maintenance" ? "Manut." : "Offline"}
        </span>
      </div>
      <p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
        <MapPin size={12} className="mt-0.5 shrink-0" />
        <span className="line-clamp-2">{m.address}</span>
      </p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {m.distance_km != null ? `${m.distance_km.toFixed(1)} km` : "Próxima"}
        </span>
        <span className="font-medium text-foreground">Estoque {m.stock_level}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${m.stock_level}%` }}
        />
      </div>
    </div>
  );
}