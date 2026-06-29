import { Sparkles } from "lucide-react";

export function levelFromXp(xp: number) {
  // 100, 250, 450, 700, 1000, ... quadratic-ish
  let level = 1;
  let need = 100;
  let acc = 0;
  while (xp >= acc + need) {
    acc += need;
    level++;
    need = Math.round(need * 1.5);
  }
  return { level, currentXp: xp - acc, nextLevelXp: need };
}

export function XpBar({ xp = 0, compact = false }: { xp?: number; compact?: boolean }) {
  const { level, currentXp, nextLevelXp } = levelFromXp(xp);
  const pct = Math.min(100, (currentXp / nextLevelXp) * 100);
  return (
    <div className={compact ? "flex items-center gap-2" : "rounded-2xl bg-card p-4 ring-1 ring-border/60"}>
      <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.16_140)] text-primary-foreground shadow">
        <Sparkles size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold">Nível {level}</span>
          <span className="text-muted-foreground">{currentXp}/{nextLevelXp} XP</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-[oklch(0.7_0.17_140)] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}