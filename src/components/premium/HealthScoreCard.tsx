import { Activity, TrendingUp } from "lucide-react";
import { scoreColor, scoreLabel } from "@/lib/health-score";

type Props = {
  score: number;
  trend?: number;
  breakdown?: { waterPct: number; proteinPct: number; caloriePct: number; frequency: number; meal: number };
};

export function HealthScoreCard({ score, trend = 0, breakdown }: Props) {
  const grad = scoreColor(score);
  const label = scoreLabel(score);
  const radius = 56;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - score / 100);
  return (
    <div className="overflow-hidden rounded-3xl bg-card p-5 ring-1 ring-border/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
            <Activity size={12} /> Health Score
          </div>
          <div className="mt-1 font-display text-3xl font-bold leading-none">{label}</div>
          {trend !== 0 && (
            <div className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${trend > 0 ? "text-emerald-600" : "text-rose-600"}`}>
              <TrendingUp size={12} className={trend < 0 ? "rotate-180" : ""} />
              {trend > 0 ? "+" : ""}{trend}% vs últimas 4 semanas
            </div>
          )}
        </div>
        <div className="relative" style={{ width: 140, height: 140 }}>
          <svg viewBox="0 0 140 140" className="-rotate-90">
            <circle cx={70} cy={70} r={radius} stroke="color-mix(in oklab, var(--color-border) 70%, transparent)" strokeWidth={12} fill="none" />
            <defs>
              <linearGradient id="hs-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={cssFromGrad(grad).from} />
                <stop offset="100%" stopColor={cssFromGrad(grad).to} />
              </linearGradient>
            </defs>
            <circle cx={70} cy={70} r={radius} stroke="url(#hs-grad)" strokeWidth={12} strokeLinecap="round" fill="none"
              strokeDasharray={circ} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s ease-out" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display text-4xl font-black tabular-nums">{score}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">/ 100</div>
          </div>
        </div>
      </div>
      {breakdown && (
        <div className="mt-4 grid grid-cols-5 gap-1.5 text-[10px]">
          {[
            { l: "Água", v: breakdown.waterPct, c: "bg-sky-500" },
            { l: "Proteína", v: breakdown.proteinPct, c: "bg-rose-500" },
            { l: "Calorias", v: breakdown.caloriePct, c: "bg-amber-500" },
            { l: "Freq.", v: breakdown.frequency, c: "bg-purple-500" },
            { l: "Nota", v: breakdown.meal, c: "bg-emerald-500" },
          ].map((b) => (
            <div key={b.l}>
              <div className="mb-1 text-center text-muted-foreground">{b.l}</div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full ${b.c}`} style={{ width: `${Math.round(b.v * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function cssFromGrad(grad: string) {
  // grad like "from-emerald-500 to-emerald-400"
  const map: Record<string, string> = {
    "emerald-500": "#10b981",
    "emerald-400": "#34d399",
    "amber-500": "#f59e0b",
    "amber-400": "#fbbf24",
    "orange-500": "#f97316",
    "orange-400": "#fb923c",
    "rose-500": "#f43f5e",
    "rose-400": "#fb7185",
  };
  const tokens = grad.split(" ");
  const from = tokens[0].replace("from-", "");
  const to = tokens[1].replace("to-", "");
  return { from: map[from] ?? "#10b981", to: map[to] ?? "#34d399" };
}