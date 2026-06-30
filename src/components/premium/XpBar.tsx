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
    <div className={compact ? "flex items-center gap-3" : "card-nested flex items-center gap-3 p-4"}>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: "linear-gradient(135deg, #2DAB6B 0%, #1E8654 100%)", color: "#fff" }}>
        <Sparkles size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-semibold" style={{ color: "var(--ink-1)" }}>Nível {level}</span>
          <span style={{ color: "var(--ink-3)" }}>{currentXp}/{nextLevelXp} XP</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #1E8654, #2DAB6B)" }} />
        </div>
      </div>
    </div>
  );
}