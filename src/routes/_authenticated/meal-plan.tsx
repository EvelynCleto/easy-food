import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { generateMealPlan, getLatestMealPlan, type MealPlan } from "@/lib/meal-plan.functions";

export const Route = createFileRoute("/_authenticated/meal-plan")({
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

function MealPlanPage() {
  const get = useServerFn(getLatestMealPlan);
  const gen = useServerFn(generateMealPlan);
  const qc = useQueryClient();
  const [goal, setGoal] = useState<(typeof GOALS)[number]["id"]>("manutencao");
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [foodInput, setFoodInput] = useState("");

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["meal-plan"] }); toast.success("Plano gerado com sucesso!"); },
    onError: (e: Error) => toast.error(e?.message ?? "Falha ao gerar plano. Tente novamente."),
  });

  const activeMsg = useProgressMessage(mutate.isPending);

  return (
    <div className="animate-rise mx-auto max-w-[920px]">
      <header className="mb-10">
        <p className="text-eyebrow" style={{ color: "var(--ai)" }}>◇ IA · plano semanal</p>
        <h1 className="text-display-m mt-3">Seu plano</h1>
        <p className="mt-3 text-body-sm" style={{ color: "var(--ink-2)" }}>
          Cardápio de 7 dias que mistura as marmitas das máquinas EasyFood com as suas próprias comidas e o seu orçamento.
        </p>
      </header>

      <section className="card-aurora p-6 sm:p-8">
        <p className="text-eyebrow">objetivo</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {GOALS.map((g) => {
            const active = goal === g.id;
            return (
              <button key={g.id} onClick={() => setGoal(g.id)}
                className="press rounded-2xl px-5 py-4 text-[13.5px] font-semibold transition"
                style={{
                  background: active ? "var(--ink-1)" : "var(--surface)",
                  color: active ? "var(--card)" : "var(--ink-1)",
                }}>
                {g.label}
              </button>
            );
          })}
        </div>

        {/* Como você quer comer */}
        <p className="text-eyebrow mt-8">como você quer comer</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {EAT_MODES.map((m) => {
            const active = prefs.eatMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, eatMode: m.id }))}
                className="press rounded-2xl px-3 py-3 text-center transition"
                style={{
                  background: active ? "var(--ai)" : "var(--surface)",
                  color: active ? "#fff" : "var(--ink-1)",
                }}
              >
                <span className="block text-[13px] font-semibold">{m.label}</span>
                <span className="mt-0.5 block text-[10.5px]" style={{ color: active ? "rgba(255,255,255,0.8)" : "var(--ink-3)" }}>{m.hint}</span>
              </button>
            );
          })}
        </div>

        {/* Suas comidas */}
        {prefs.eatMode !== "marmita" && (
          <>
            <p className="text-eyebrow mt-8">o que você costuma comer / comprar</p>
            <p className="mt-1 text-[12px]" style={{ color: "var(--ink-3)" }}>
              Adicione pratos e alimentos do seu dia a dia — a IA mistura com as marmitas das máquinas.
            </p>
            <div className="mt-3 flex gap-2">
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
                className="press grid w-12 shrink-0 place-items-center rounded-xl"
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

        {/* Orçamento */}
        <p className="text-eyebrow mt-8">orçamento por refeição (opcional)</p>
        <div className="mt-3 flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "var(--surface)", border: "0.5px solid var(--hairline)", maxWidth: 220 }}>
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
                  background: "var(--ai)",
                }}
              />
            </div>
            <span className="text-[11px] tabular-nums" style={{ color: "var(--ink-3)" }}>
              {Math.round(((PROGRESS_MESSAGES.indexOf(activeMsg) + 1) / PROGRESS_MESSAGES.length) * 100)}%
            </span>
          </div>
        )}
      </section>

      {isLoading && <div className="mt-10 grid h-32 place-items-center"><Loader2 size={20} className="animate-spin" style={{ color: "var(--ink-3)" }} /></div>}

      {plan && (
        <div className="animate-rise-delayed mt-10">
          <div className="card-aurora grid grid-cols-3 mb-10" style={{ padding: 0 }}>
            <PStat label="Calorias / semana" value={`${plan.total_calories.toLocaleString("pt-BR")}`} unit="kcal" />
            <PStat label="Proteína / semana" value={`${Math.round(plan.total_protein)}`} unit="g" divided />
            <PStat label="Refeições" value={`${plan.days.length * 4}`} unit="" divided />
          </div>

          <div className="space-y-10">
            {plan.days.map((d, i) => (
              <section key={i}>
                <div className="mb-4 flex items-baseline justify-between">
                  <h3 className="text-title-lg">{d.day}</h3>
                  <p className="text-caption tabular-nums">{Object.values(d.meals).reduce((s, m) => s + (m?.calories ?? 0), 0)} kcal</p>
                </div>
                <div className="card-nested overflow-hidden">
                  {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((k, j) => {
                    const m = d.meals[k];
                    if (!m) return null;
                    const hasMatch = m.product_match && m.product_match !== "null";
                    return (
                      <div key={k} className="grid gap-2 p-5 sm:grid-cols-[140px_1fr_auto] sm:items-baseline sm:gap-6"
                        style={{ borderTop: j > 0 ? "0.5px solid var(--hairline)" : "none" }}>
                        <p className="text-eyebrow">{LABELS[k]}</p>
                        <div>
                          <p className="text-[14.5px] font-semibold" style={{ color: "var(--ink-1)" }}>{m.name}</p>
                          {m.note && <p className="mt-1 text-caption">{m.note}</p>}
                          {hasMatch ? (
                            <Link
                              to="/catalog"
                              className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold"
                              style={{ color: "var(--primary)" }}
                            >
                              ◇ Disponível no catálogo →
                            </Link>
                          ) : (
                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "var(--ink-3)" }}>
                              ◦ sua comida
                            </span>
                          )}
                        </div>
                        <p className="text-caption tabular-nums sm:text-right">
                          {m.calories} kcal · {m.protein}g P
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !plan && (
        <div className="mt-10 flex flex-col items-center gap-4 py-12 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-3xl" style={{ background: "var(--surface)" }}>
            <Sparkles size={28} style={{ color: "var(--ai)" }} />
          </div>
          <p className="text-headline">Ainda sem plano gerado</p>
          <p className="text-body-sm" style={{ color: "var(--ink-2)" }}>
            Escolha um objetivo acima e clique em "Gerar plano" para criar seu cardápio semanal personalizado.
          </p>
        </div>
      )}
    </div>
  );
}

function PStat({ label, value, unit, divided }: { label: string; value: string; unit: string; divided?: boolean }) {
  return (
    <div className="p-6" style={divided ? { borderLeft: "0.5px solid var(--hairline)" } : {}}>
      <p className="text-eyebrow">{label}</p>
      <p className="mt-2 font-display text-[22px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>
        {value}{unit && <span className="ml-1 text-[13px] font-normal" style={{ color: "var(--ink-3)" }}>{unit}</span>}
      </p>
    </div>
  );
}
