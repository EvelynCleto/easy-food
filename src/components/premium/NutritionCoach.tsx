import { Lightbulb, Sparkles } from "lucide-react";

export function NutritionCoach({ score, suggestions, mealType }: { score?: number | null; suggestions?: string[] | null; mealType?: string | null }) {
  if (!score && !suggestions?.length) return null;
  const color = !score ? "bg-muted" : score >= 8 ? "bg-emerald-500" : score >= 6 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border/60">
      <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
            <Sparkles size={14} />
          </div>
          <div>
            <div className="text-sm font-semibold">Nutri Coach IA</div>
            {mealType && <div className="text-[10px] uppercase text-muted-foreground">{mealType}</div>}
          </div>
        </div>
        {score != null && (
          <div className="flex items-baseline gap-1">
            <span className={`grid h-10 w-10 place-items-center rounded-full text-white text-sm font-bold ${color}`}>
              {Number(score).toFixed(1)}
            </span>
            <span className="text-[10px] text-muted-foreground">/10</span>
          </div>
        )}
      </div>
      {!!suggestions?.length && (
        <ul className="divide-y divide-border/40">
          {suggestions.map((s, i) => (
            <li key={i} className="flex gap-2 px-4 py-3 text-sm">
              <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-500" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}