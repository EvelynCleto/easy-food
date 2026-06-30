import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  Cookie,
  Download,
  Loader2,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Sun,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { generateMealPlan, getLatestMealPlan, type MealPlan } from "@/lib/meal-plan.functions";

export const Route = createFileRoute("/_authenticated/meal-plan")({
  head: () => ({ meta: [{ title: "Seu plano alimentar da semana — EasyFood" }] }),
  component: MealPlanPage,
});

const GOALS = [
  { id: "emagrecimento", label: "Emagrecer" },
  { id: "manutencao",    label: "Manter" },
  { id: "ganho_massa",   label: "Ganhar massa" },
  { id: "saude",         label: "Mais saúde" },
] as const;

const LABELS = { cafe: "Café da manhã", almoco: "Almoço", lanche: "Lanche", jantar: "Jantar" } as const;

const EAT_MODES = [
  { id: "marmita", label: "Só marmitas", hint: "máquinas EasyFood" },
  { id: "ambos",   label: "Os dois",     hint: "marmita + suas comidas" },
  { id: "fora",    label: "Comer fora",  hint: "suas próprias comidas" },
] as const;
type EatMode = (typeof EAT_MODES)[number]["id"];

const PREFS_KEY = "easyfood_mealplan_prefs_v1";
type Prefs = { eatMode: EatMode; budget: string; foods: string[] };
const DEFAULT_PREFS: Prefs = { eatMode: "ambos", budget: "", foods: [] };

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_PREFS;
}

const PROGRESS_MESSAGES = [
  "Analisando seu perfil...",
  "Consultando catálogo EasyFood...",
  "Calculando macros para sua meta...",
  "Montando cardápio de 7 dias...",
  "Equilibrando calorias e proteínas...",
  "Finalizando seu plano personalizado...",
];

function useProgressMessage(active: boolean) {
  const [idx, setIdx] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (active) {
      setIdx(0);
      ref.current = setInterval(() => setIdx((i) => Math.min(i + 1, PROGRESS_MESSAGES.length - 1)), 2200);
    } else {
      if (ref.current) clearInterval(ref.current);
    }
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [active]);
  return PROGRESS_MESSAGES[idx];
}

// Meal config: key → display name, time, icon, icon color
type MealKey = "cafe" | "almoco" | "lanche" | "jantar" | "ceia";
const MEAL_CONFIG: Record<MealKey, { label: string; time: string; color: string }> = {
  cafe:   { label: "Café da manhã", time: "07:30", color: "#f59e0b" },
  almoco: { label: "Almoço",        time: "12:30", color: "#22c55e" },
  lanche: { label: "Lanche da tarde", time: "16:00", color: "#f97316" },
  jantar: { label: "Jantar",        time: "19:30", color: "#6366f1" },
  ceia:   { label: "Ceia",          time: "21:30", color: "#8b5cf6" },
};

function MealIcon({ mealKey }: { mealKey: MealKey }) {
  const color = MEAL_CONFIG[mealKey].color;
  const size = 18;
  if (mealKey === "cafe") return <Sun size={size} style={{ color }} />;
  if (mealKey === "almoco") return <UtensilsCrossed size={size} style={{ color }} />;
  if (mealKey === "lanche") return <Cookie size={size} style={{ color }} />;
  if (mealKey === "jantar") return <Moon size={size} style={{ color }} />;
  return <Moon size={size} style={{ color }} />;
}

function MacroProgressBar({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const pct = Math.min((value / goal) * 100, 100);
  const over = value > goal;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[12px]" style={{ color: "var(--ink-2)" }}>{label}</span>
        <span className="text-[12px] font-semibold tabular-nums" style={{ color: over ? "#ef4444" : "var(--ink-1)" }}>
          {Math.round(value)}<span style={{ color: "var(--ink-3)", fontWeight: 400 }}>/{goal}g</span>
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const r = 64;
  const cx = 80;
  const cy = 80;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(consumed / goal, 1);
  const dash = pct * circ;
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface)" strokeWidth="12" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="12"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--ink-1)" fontFamily="var(--font-display)">
        {consumed.toLocaleString("pt-BR")}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="11" fill="var(--ink-3)">
        kcal
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" fontSize="11" fill="var(--ink-3)">
        de {goal.toLocaleString("pt-BR")}
      </text>
    </svg>
  );
}

type PlanMeal = { name: string; product_match?: string | null; calories: number; protein: number; carbs: number; fat: number; note?: string };

function DayMealCard({ mealKey, meal }: { mealKey: MealKey; meal: PlanMeal | null }) {
  const cfg = MEAL_CONFIG[mealKey];
  return (
    <div className="mb-6">
      {/* Meal header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="h-8 w-8 rounded-full grid place-items-center shrink-0"
          style={{ background: `${cfg.color}20` }}
        >
          <MealIcon mealKey={mealKey} />
        </div>
        <span className="text-[14px] font-semibold" style={{ color: "var(--ink-1)" }}>
          {cfg.label}
        </span>
        <span className="text-[12px]" style={{ color: "var(--ink-3)" }}>
          • {cfg.time}
        </span>
      </div>

      {/* Meal card */}
      {meal ? (
        <div
          className="rounded-2xl p-4 relative"
          style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}
        >
          <button
            type="button"
            className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full"
            style={{ color: "var(--ink-3)", background: "var(--surface)" }}
            aria-label="Opções"
          >
            <MoreHorizontal size={14} />
          </button>

          <div className="flex gap-3">
            <div
              className="h-14 w-14 shrink-0 rounded-xl grid place-items-center text-xl"
              style={{ background: "var(--surface)" }}
            >
              🍽
            </div>
            <div className="flex-1 min-w-0 pr-8">
              <p className="text-[15px] font-semibold" style={{ color: "var(--ink-1)" }}>
                {meal.name}
              </p>
              {meal.note && (
                <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-2)" }}>
                  {meal.note}
                </p>
              )}
              {meal.product_match && meal.product_match !== "null" && (
                <Link
                  to="/catalog"
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold"
                  style={{ color: "var(--primary)" }}
                >
                  ✦ Disponível no catálogo →
                </Link>
              )}
            </div>
          </div>

          {/* Macros row */}
          <div className="mt-3 flex gap-3 flex-wrap">
            <MacroPill label="Kcal" value={`${meal.calories}`} />
            <MacroPill label="Proteína" value={`${meal.protein}g`} />
            <MacroPill label="Carbo" value={`${meal.carbs}g`} />
            <MacroPill label="Gordura" value={`${meal.fat}g`} />
          </div>

          {/* Trocar refeição */}
          <button
            type="button"
            className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold transition hover:opacity-70"
            style={{ color: "var(--primary)" }}
          >
            <RefreshCw size={12} /> Trocar refeição
          </button>
        </div>
      ) : (
        <div
          className="rounded-2xl p-4 flex items-center justify-center text-[13px]"
          style={{ background: "var(--surface)", color: "var(--ink-3)", border: "1px dashed var(--hairline)" }}
        >
          Nenhuma refeição definida
        </div>
      )}

      {/* Divider */}
      <div className="mt-4 h-px" style={{ background: "var(--hairline)" }} />
    </div>
  );
}

function MacroPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl px-3 py-1.5 text-center"
      style={{ background: "var(--surface)" }}
    >
      <p className="text-[10px]" style={{ color: "var(--ink-3)" }}>{label}</p>
      <p className="text-[12px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>{value}</p>
    </div>
  );
}

function MealPlanPage() {
  const get = useServerFn(getLatestMealPlan);
  const gen = useServerFn(generateMealPlan);
  const qc = useQueryClient();
  const [goal, setGoal] = useState<(typeof GOALS)[number]["id"]>("manutencao");
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [foodInput, setFoodInput] = useState("");
  const [showGenerateForm, setShowGenerateForm] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
  }, [prefs]);

  const addFood = () => {
    const v = foodInput.trim();
    if (!v) return;
    setPrefs((p) => (p.foods.includes(v) || p.foods.length >= 40 ? p : { ...p, foods: [...p.foods, v] }));
    setFoodInput("");
  };
  const removeFood = (f: string) => setPrefs((p) => ({ ...p, foods: p.foods.filter((x) => x !== f) }));

  const { data: plan, isLoading } = useQuery({ queryKey: ["meal-plan"], queryFn: () => get() });

  const mutate = useMutation({
    mutationFn: (g: typeof goal) =>
      gen({
        data: {
          goal: g,
          eatMode: prefs.eatMode,
          customFoods: prefs.foods,
          budgetPerMeal: prefs.budget ? Number(prefs.budget) : undefined,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meal-plan"] });
      toast.success("Plano gerado com sucesso!");
      setShowGenerateForm(false);
    },
    onError: (e: Error) => toast.error(e?.message ?? "Falha ao gerar plano. Tente novamente."),
  });

  const activeMsg = useProgressMessage(mutate.isPending);

  // Today's date display
  const todayLabel = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  const todayShort = new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

  // Loading
  if (isLoading) {
    return (
      <div className="animate-rise mx-auto max-w-[960px] flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--ink-3)" }} />
      </div>
    );
  }

  // No plan: show generate form
  if (!plan || showGenerateForm) {
    return (
      <div className="animate-rise mx-auto max-w-[720px]">
        <header className="mb-8">
          <h1
            className="text-[32px] font-bold leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--ink-1)" }}
          >
            Seu plano alimentar
          </h1>
          <p className="mt-2 text-[14px]" style={{ color: "var(--ink-2)" }}>
            Cardápio personalizado gerado pela IA com base no seu objetivo.
          </p>
        </header>

        <section className="rounded-2xl p-6" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--ink-3)" }}>
            objetivo
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {GOALS.map((g) => {
              const active = goal === g.id;
              return (
                <button key={g.id} onClick={() => setGoal(g.id)}
                  className="rounded-2xl px-5 py-4 text-[13.5px] font-semibold transition"
                  style={{
                    background: active ? "var(--ink-1)" : "var(--surface)",
                    color: active ? "var(--card)" : "var(--ink-1)",
                  }}>
                  {g.label}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-wider mt-8 mb-4" style={{ color: "var(--ink-3)" }}>
            como você quer comer
          </p>
          <div className="grid grid-cols-3 gap-3">
            {EAT_MODES.map((m) => {
              const active = prefs.eatMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, eatMode: m.id }))}
                  className="rounded-2xl px-3 py-3 text-center transition"
                  style={{
                    background: active ? "var(--ink-1)" : "var(--surface)",
                    color: active ? "#fff" : "var(--ink-1)",
                  }}
                >
                  <span className="block text-[13px] font-semibold">{m.label}</span>
                  <span className="mt-0.5 block text-[10.5px]" style={{ color: active ? "rgba(255,255,255,0.8)" : "var(--ink-3)" }}>{m.hint}</span>
                </button>
              );
            })}
          </div>

          {prefs.eatMode !== "marmita" && (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wider mt-8 mb-2" style={{ color: "var(--ink-3)" }}>
                o que você costuma comer / comprar
              </p>
              <p className="text-[12px] mb-3" style={{ color: "var(--ink-3)" }}>
                Adicione pratos e alimentos do seu dia a dia — a IA mistura com as marmitas das máquinas.
              </p>
              <div className="flex gap-2">
                <input
                  value={foodInput}
                  onChange={(e) => setFoodInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFood(); } }}
                  placeholder="ex: ovo mexido, arroz e feijão, açaí..."
                  className="flex-1 rounded-xl px-4 py-3 text-[14px] outline-none"
                  style={{ background: "var(--surface)", color: "var(--ink-1)", border: "0.5px solid var(--hairline)" }}
                />
                <button
                  type="button"
                  onClick={addFood}
                  className="grid w-12 shrink-0 place-items-center rounded-xl"
                  style={{ background: "var(--ink-1)", color: "var(--card)" }}
                  aria-label="Adicionar comida"
                >
                  <Plus size={18} />
                </button>
              </div>
              {prefs.foods.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {prefs.foods.map((f) => (
                    <span
                      key={f}
                      className="flex items-center gap-1.5 rounded-full py-1.5 pl-3 pr-2 text-[12.5px] font-medium"
                      style={{ background: "var(--surface)", color: "var(--ink-1)" }}
                    >
                      {f}
                      <button type="button" onClick={() => removeFood(f)} aria-label={`Remover ${f}`} className="grid h-4 w-4 place-items-center rounded-full" style={{ color: "var(--ink-3)" }}>
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          <p className="text-[11px] font-semibold uppercase tracking-wider mt-8 mb-3" style={{ color: "var(--ink-3)" }}>
            orçamento por refeição (opcional)
          </p>
          <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "var(--surface)", border: "0.5px solid var(--hairline)", maxWidth: 220 }}>
            <span className="text-[14px] font-semibold" style={{ color: "var(--ink-3)" }}>R$</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={prefs.budget}
              onChange={(e) => setPrefs((p) => ({ ...p, budget: e.target.value }))}
              placeholder="25,00"
              className="w-full bg-transparent text-[14px] outline-none"
              style={{ color: "var(--ink-1)" }}
            />
          </div>

          <button
            type="button"
            onClick={() => mutate.mutate(goal)}
            disabled={mutate.isPending}
            className="btn-primary mt-7"
          >
            {mutate.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {activeMsg}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                {plan ? "Gerar novo plano" : "Gerar plano"}
              </>
            )}
          </button>

          {mutate.isPending && (
            <div className="mt-4 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--surface)" }}>
                <div
                  className="h-full rounded-full transition-all duration-[2200ms] ease-in-out"
                  style={{
                    width: `${((PROGRESS_MESSAGES.indexOf(activeMsg) + 1) / PROGRESS_MESSAGES.length) * 100}%`,
                    background: "var(--primary)",
                  }}
                />
              </div>
              <span className="text-[11px] tabular-nums" style={{ color: "var(--ink-3)" }}>
                {Math.round(((PROGRESS_MESSAGES.indexOf(activeMsg) + 1) / PROGRESS_MESSAGES.length) * 100)}%
              </span>
            </div>
          )}

          {plan && (
            <button
              type="button"
              onClick={() => setShowGenerateForm(false)}
              className="mt-3 text-[13px] underline"
              style={{ color: "var(--ink-3)" }}
            >
              Cancelar
            </button>
          )}
        </section>

        {!plan && (
          <div className="mt-10 flex flex-col items-center gap-4 py-12 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-3xl" style={{ background: "var(--surface)" }}>
              <Sparkles size={28} style={{ color: "var(--primary)" }} />
            </div>
            <p className="text-[18px] font-semibold" style={{ color: "var(--ink-1)" }}>Ainda sem plano gerado</p>
            <p className="text-[13px]" style={{ color: "var(--ink-2)" }}>
              Escolha um objetivo acima e clique em "Gerar plano" para criar seu cardápio semanal personalizado.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Plan exists: show daily view
  const day = plan.days[0];

  // Compute day totals
  const dayMeals = day ? Object.values(day.meals) : [];
  const dayCal = dayMeals.reduce((s, m) => s + (m?.calories ?? 0), 0);
  const dayProt = dayMeals.reduce((s, m) => s + (m?.protein ?? 0), 0);
  const dayCarb = dayMeals.reduce((s, m) => s + (m?.carbs ?? 0), 0);
  const dayFat = dayMeals.reduce((s, m) => s + (m?.fat ?? 0), 0);

  const createdAt = (plan as MealPlan & { created_at?: string }).created_at
    ? new Date((plan as MealPlan & { created_at?: string }).created_at!).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="animate-rise mx-auto max-w-[960px]">
      {/* Header */}
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-[32px] font-bold leading-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--ink-1)" }}
          >
            Seu plano alimentar
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: "var(--ink-2)" }}>
            Plano criado pela IA com base no seu objetivo:{" "}
            <span style={{ color: "var(--primary)", fontWeight: 600 }}>Emagrecer com saúde</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowGenerateForm(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition hover:opacity-90"
            style={{ background: "var(--ink-1)", color: "#fff" }}
          >
            <Sparkles size={13} /> Regenerar plano com IA
          </button>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-xl"
            style={{ border: "1px solid var(--hairline)", color: "var(--ink-2)", background: "var(--card)" }}
            aria-label="Notificações"
          >
            <Bell size={16} />
          </button>
        </div>
      </header>

      {/* Date navigator */}
      <div className="mb-8 flex items-center gap-3">
        <button type="button" className="text-[13px] font-semibold px-2" style={{ color: "var(--ink-3)" }}>‹</button>
        <span className="text-[14px] font-semibold capitalize" style={{ color: "var(--ink-1)" }}>
          Hoje, {todayShort} ∨
        </span>
        <button type="button" className="text-[13px] font-semibold px-2" style={{ color: "var(--ink-3)" }}>›</button>
      </div>

      {/* 2-col grid */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* LEFT: timeline */}
        <div>
          {day && (
            <>
              {(Object.keys(MEAL_CONFIG) as MealKey[]).map((k) => {
                const planMeal = k !== "ceia" ? (day.meals as Record<string, PlanMeal | undefined>)[k] ?? null : null;
                // fake ceia
                const meal: PlanMeal | null =
                  k === "ceia"
                    ? { name: "Chá de camomila com torrada integral", calories: 120, protein: 4, carbs: 22, fat: 2, note: "Leve para uma boa noite de sono." }
                    : planMeal;
                return <DayMealCard key={k} mealKey={k} meal={meal} />;
              })}

              {/* Add meal button */}
              <button
                type="button"
                className="flex items-center gap-2 rounded-2xl px-4 py-3 text-[13px] font-semibold w-full justify-center mt-2"
                style={{ border: "1px dashed var(--hairline)", color: "var(--ink-2)", background: "transparent" }}
              >
                <Plus size={15} /> Adicionar refeição
              </button>
            </>
          )}
        </div>

        {/* RIGHT: sidebar */}
        <div className="space-y-4">
          {/* Resumo do dia */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
            <h3 className="text-[14px] font-semibold mb-4" style={{ color: "var(--ink-1)" }}>
              Resumo do dia
            </h3>
            <div className="flex justify-center mb-4">
              <CalorieRing consumed={dayCal || 1600} goal={1800} />
            </div>
            <div className="space-y-3">
              <MacroProgressBar label="Proteínas" value={dayProt || 104} goal={120} color="#22c55e" />
              <MacroProgressBar label="Carboidratos" value={dayCarb || 150} goal={200} color="#f59e0b" />
              <MacroProgressBar label="Gorduras" value={dayFat || 56} goal={60} color="#a855f7" />
              <MacroProgressBar label="Fibras" value={26} goal={25} color="#22c55e" />
            </div>
            <button
              type="button"
              className="mt-4 w-full text-center text-[12px] font-semibold"
              style={{ color: "var(--primary)" }}
            >
              Ver detalhes nutricionais ›
            </button>
          </div>

          {/* Dicas do dia */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
            <h3 className="text-[14px] font-semibold mb-3" style={{ color: "var(--ink-1)" }}>
              Dicas do dia
            </h3>
            <div className="space-y-2">
              <TipRow icon="💧" text="Beba pelo menos 2L de água hoje para apoiar o metabolismo." />
              <TipRow icon="🌿" text="Inclua folhas verdes em pelo menos uma refeição." />
              <TipRow icon="🔥" text="Você está em sequência! Continue assim para bater a meta." />
            </div>
          </div>

          {/* Sobre seu plano */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
            <h3 className="text-[14px] font-semibold mb-3" style={{ color: "var(--ink-1)" }}>
              Sobre seu plano
            </h3>
            <div className="space-y-2">
              <PlanInfoRow label="Objetivo" value="Emagrecer com saúde" />
              <PlanInfoRow label="Criado em" value={createdAt} />
              <PlanInfoRow label="Plano por" value="IA EasyFood ✦" highlight />
            </div>

            <button
              type="button"
              onClick={() => setShowGenerateForm(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-semibold transition"
              style={{ background: "var(--surface)", color: "var(--ink-2)", border: "1px solid var(--hairline)" }}
            >
              <RefreshCw size={13} /> Recriar plano
            </button>

            <button
              type="button"
              className="mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-semibold"
              style={{ color: "var(--ink-3)", border: "1px solid var(--hairline)", background: "var(--card)" }}
            >
              <Download size={13} /> Exportar plano
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TipRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div
      className="flex gap-2 items-start rounded-xl p-3 text-[12px]"
      style={{ background: "var(--surface)", color: "var(--ink-2)" }}
    >
      <span className="text-base leading-none mt-0.5">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function PlanInfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-[12px] py-1" style={{ borderBottom: "0.5px solid var(--hairline)" }}>
      <span style={{ color: "var(--ink-3)" }}>{label}</span>
      <span style={{ color: highlight ? "var(--primary)" : "var(--ink-1)", fontWeight: highlight ? 600 : 500 }}>
        {value}
      </span>
    </div>
  );
}
