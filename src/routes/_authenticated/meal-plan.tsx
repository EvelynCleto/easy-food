import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useState } from "react";
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

function MealPlanPage() {
  const get = useServerFn(getLatestMealPlan);
  const gen = useServerFn(generateMealPlan);
  const qc = useQueryClient();
  const [goal, setGoal] = useState<(typeof GOALS)[number]["id"]>("manutencao");

  const { data: plan, isLoading } = useQuery({ queryKey: ["meal-plan"], queryFn: () => get() });

  const mutate = useMutation({
    mutationFn: (g: typeof goal) => gen({ data: { goal: g } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["meal-plan"] }); toast.success("Plano gerado"); },
    onError: (e: any) => toast.error(e?.message ?? "Falha"),
  });

  return (
    <div className="animate-rise mx-auto max-w-[920px]">
      <header className="mb-10">
        <p className="text-eyebrow" style={{ color: "var(--ai)" }}>◇ IA · plano semanal</p>
        <h1 className="text-display-m mt-3">Seu plano</h1>
        <p className="mt-3 text-body-sm" style={{ color: "var(--ink-2)" }}>
          Cardápio de 7 dias usando pratos disponíveis nas máquinas EasyFood.
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

        <button onClick={() => mutate.mutate(goal)} disabled={mutate.isPending} className="btn-primary mt-7">
          {mutate.isPending && <Loader2 size={16} className="animate-spin" />}
          {plan ? "Gerar novo plano" : "Gerar plano"}
        </button>
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
                    return (
                      <div key={k} className="grid gap-2 p-5 sm:grid-cols-[140px_1fr_auto] sm:items-baseline sm:gap-6"
                        style={{ borderTop: j > 0 ? "0.5px solid var(--hairline)" : "none" }}>
                        <p className="text-eyebrow">{LABELS[k]}</p>
                        <div>
                          <p className="text-[14.5px] font-semibold" style={{ color: "var(--ink-1)" }}>{m.name}</p>
                          {m.note && <p className="mt-1 text-caption">{m.note}</p>}
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
        <div className="mt-10 text-center text-caption">
          Escolha um objetivo e clique em gerar.
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
