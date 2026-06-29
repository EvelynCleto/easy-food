import { Link } from "@tanstack/react-router";
import { Camera, Plus } from "lucide-react";

type Props = {
  date: string;          // "qua · 29 jun"
  streakLine?: string;   // "7 dias cuidando da sua alimentação"
  calories: number;
  caloriesGoal: number;
  protein: number;
  proteinGoal: number;
  carbs: number;
  carbsGoal: number;
  fat: number;
  fatGoal: number;
  water: number;
  waterGoal: number;
  onAddWater?: (ml: number) => void;
};

function fmt(n: number) {
  // Thin space separator for thousands (1 440)
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function PulseCard(props: Props) {
  const cal = props.calories;
  const pct = Math.min(100, Math.round((props.calories / Math.max(props.caloriesGoal, 1)) * 100));
  const calLeft = Math.max(0, props.caloriesGoal - props.calories);
  const waterPct = Math.min(100, Math.round((props.water / Math.max(props.waterGoal, 1)) * 100));

  const macros: { label: string; value: number; goal: number; unit: string }[] = [
    { label: "Proteína", value: props.protein,    goal: props.proteinGoal, unit: "g"  },
    { label: "Carbo",    value: props.carbs,      goal: props.carbsGoal,   unit: "g"  },
    { label: "Gordura",  value: props.fat,        goal: props.fatGoal,     unit: "g"  },
  ];

  return (
    <div
      className="animate-rise relative overflow-hidden rounded-[32px] p-7 sm:p-12"
      style={{
        background: "var(--card)",
        boxShadow:
          "0 1px 3px rgba(10, 11, 13, 0.05), 0 24px 60px -16px rgba(10, 11, 13, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.65)",
      }}
    >
      {/* Subtle ambient glow top-right */}
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-50"
        style={{ background: "radial-gradient(circle, rgba(45,171,107,0.10) 0%, transparent 70%)" }}
      />

      {/* Top line: date + streak */}
      <div className="relative flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-eyebrow">{props.date}</p>
      </div>

      {/* Hero number */}
      <div className="relative mt-7 sm:mt-9">
        <h1
          className="text-display-l tabular-nums"
          style={{ fontVariantNumeric: "tabular-nums", fontSize: "clamp(3.5rem, 8vw + 1rem, 6rem)" }}
        >
          {fmt(cal)}
        </h1>
        <p className="mt-2 text-body" style={{ color: "var(--ink-2)" }}>
          {calLeft > 0 ? (
            <>kcal de hoje · faltam <span className="font-semibold" style={{ color: "var(--ink-1)" }}>{fmt(calLeft)}</span> para a meta</>
          ) : (
            <span className="font-semibold" style={{ color: "var(--primary)" }}>meta de calorias atingida 🎉</span>
          )}
        </p>
      </div>

      {/* Progress bar */}
      <div className="relative mt-7 h-[6px] w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
        <div
          className="h-full rounded-full bar-grow"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #1E8654 0%, #2DAB6B 100%)",
            boxShadow: "0 0 16px rgba(45, 171, 107, 0.45)",
          }}
        />
      </div>

      {/* Macros grid */}
      <div className="relative mt-9 grid grid-cols-3 gap-x-8 gap-y-5 sm:mt-12">
        {macros.map((m) => (
          <Macro key={m.label} {...m} />
        ))}
      </div>

      {/* Water — live value + quick add */}
      <div className="relative mt-7 rounded-2xl p-4 sm:mt-9" style={{ background: "var(--surface)" }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.08em]" style={{ color: "var(--ink-3)" }}>
              💧 Água
            </p>
            <p className="mt-1 font-display text-[20px] font-semibold tabular-nums" style={{ color: waterPct >= 100 ? "var(--primary)" : "var(--ink-1)" }}>
              {(props.water / 1000).toFixed(1)}
              <span className="text-[13px] font-normal" style={{ color: "var(--ink-3)" }}> / {(props.waterGoal / 1000).toFixed(1)} L</span>
            </p>
          </div>
          {props.onAddWater && (
            <div className="flex items-center gap-2">
              {[250, 500].map((ml) => (
                <button
                  key={ml}
                  type="button"
                  onClick={() => props.onAddWater?.(ml)}
                  className="press flex items-center gap-1 rounded-full px-3 py-2 text-[13px] font-semibold transition"
                  style={{ background: "var(--card)", color: "var(--ink-1)" }}
                  aria-label={`Adicionar ${ml}ml de água`}
                >
                  <Plus size={14} strokeWidth={2.4} style={{ color: "var(--primary)" }} />
                  {ml}ml
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-3 h-[4px] w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
          <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${waterPct}%`, background: "var(--primary)" }} />
        </div>
      </div>

      {/* Quick analyze button */}
      <Link
        to="/nutrition/"
        className="press relative mt-7 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[14px] font-semibold transition"
        style={{ background: "var(--ink-1)", color: "var(--card)" }}
      >
        <Camera size={17} strokeWidth={2} />
        Analisar uma refeição
      </Link>
    </div>
  );
}

function Macro({ label, value, goal, unit }: { label: string; value: number; goal: number; unit: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(goal, 1)) * 100));
  const done = pct >= 100;
  return (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-[0.08em]" style={{ color: "var(--ink-3)" }}>
        {label}
      </p>
      <p className="mt-1 font-display text-[20px] font-semibold tabular-nums" style={{ color: done ? "var(--primary)" : "var(--ink-1)" }}>
        {unit === "L" ? value.toFixed(1) : Math.round(value)}
        <span className="ml-0.5 text-[13px] font-normal" style={{ color: "var(--ink-3)" }}>{unit}</span>
      </p>
      <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: done ? "var(--primary)" : "var(--ink-2)" }}
        />
      </div>
    </div>
  );
}
