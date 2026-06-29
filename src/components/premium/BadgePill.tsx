import { cn } from "@/lib/format";

const TONES: Record<string, string> = {
  default: "bg-foreground/10 text-foreground",
  primary: "bg-primary/15 text-primary",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
  info: "bg-[oklch(0.6_0.15_250)]/15 text-[oklch(0.55_0.15_250)]",
  success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

const MAP: Record<string, keyof typeof TONES> = {
  "Mais vendido": "warning",
  Recomendado: "primary",
  Lançamento: "info",
  Promo: "destructive",
  "Low Carb": "success",
  Vegano: "success",
  "Sem glúten": "info",
  "Café da manhã": "info",
  Detox: "success",
};

export function BadgePill({ label, tone }: { label: string; tone?: keyof typeof TONES }) {
  const t = tone ?? MAP[label] ?? "default";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        TONES[t],
      )}
    >
      {label}
    </span>
  );
}