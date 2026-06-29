import { ChevronRight } from "lucide-react";

export type MachineData = {
  id: string;
  name: string;
  address: string;
  status: "online" | "offline" | "maintenance";
  stock_level: number;
  distance_km?: number;
};

export function MachineCard({ m }: { m: MachineData }) {
  const online = m.status === "online";
  return (
    <div className="group flex min-w-[260px] cursor-pointer items-center gap-4 py-4 transition">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface">
        <span
          className={`h-2 w-2 rounded-full ${
            online ? "bg-primary" : m.status === "maintenance" ? "bg-warning" : "bg-muted-foreground"
          }`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15px] font-medium text-foreground">{m.name}</h3>
        <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
          {m.distance_km != null ? `${m.distance_km.toFixed(1)} km · ` : ""}
          {m.address}
        </p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-muted-foreground/60 transition group-hover:translate-x-0.5" />
    </div>
  );
}
