import { Crown, Droplet, Dumbbell, Flame, Leaf, ShoppingBag, Sparkles, Trophy, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/format";

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  flame: Flame,
  droplet: Droplet,
  dumbbell: Dumbbell,
  "shopping-bag": ShoppingBag,
  crown: Crown,
  leaf: Leaf,
  trophy: Trophy,
};

const TIERS: Record<string, string> = {
  bronze: "from-amber-700 to-amber-500",
  silver: "from-slate-400 to-slate-200",
  gold: "from-yellow-500 to-yellow-300",
};

export type AchievementData = {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: string;
  unlocked?: boolean;
  xp_reward?: number;
};

export function AchievementBadge({ a }: { a: AchievementData }) {
  const Icon = ICONS[a.icon] ?? Trophy;
  const grad = TIERS[a.tier] ?? TIERS.bronze;
  return (
    <div className={cn(
      "flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center ring-1 transition",
      a.unlocked ? "bg-card ring-border/60" : "bg-muted/40 ring-border/40 opacity-60",
    )}>
      <div className={cn(
        "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow",
        a.unlocked ? grad : "from-muted to-muted",
      )}>
        <Icon size={20} className={a.unlocked ? "" : "text-muted-foreground"} />
      </div>
      <div className="text-[11px] font-semibold leading-tight line-clamp-2">{a.title}</div>
      <div className="text-[10px] text-muted-foreground line-clamp-2">{a.description}</div>
    </div>
  );
}