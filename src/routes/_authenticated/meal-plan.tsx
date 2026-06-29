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
  { id: "manutencao",    label: "Manter peso" },
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
    <div className="mx-auto max-w-[840px]">
      <h1 className="text-display">Plano semanal</h1>
      <p className="mt-3 text-body-lg text-muted-foreground">
        Cardápio personalizado de 7 dias com pratos disponíveis nas máquinas EasyFood.
      </p>

      <section className="mt-12">
        <h2 className="text-title-3 mb-4">Seu objetivo</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {GOALS.map((g) => (
            <button key={g.id} onClick={() => setGoal(g.id)}
              className={`rounded-2xl px-5 py-4 text-[14px] font-medium transition ${
                goal === g.id ? "bg-foreground text-background" : "bg-surface text-foreground/80 hover:text-foreground"
              }`}>
              {g.label}
            </button>
          ))}
        </div>

        <button onClick={() => mutate.mutate(goal)} disabled={mutate.isPending} className="btn-primary mt-8 w-full sm:w-auto">
          {mutate.isPending && <Loader2 size={16} className="animate-spin" />}
          {plan ? "Gerar novo plano" : "Gerar plano"}
        </button>
      </section>

      {isLoading && <div className="grid h-40 place-items-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>}

      {plan && (
        <div className="mt-16">
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-border/60">
            <Stat label="Calorias / semana" value={`${plan.total_calories.toLocaleString("pt-BR")}`} unit="kcal" />
            <Stat label="Proteína / semana" value={`${Math.round(plan.total_protein)}`} unit="g" />
            <Stat label="Refeições" value={`${plan.days.length * 4}`} unit="" />
          </div>

          <div className="mt-12 space-y-12">
            {plan.days.map((d, i) => (
              <section key={i}>
                <header className="flex items-baseline justify-between pb-4">
                  <h3 className="text-title-2">{d.day}</h3>
                  <p className="text-caption">{Object.values(d.meals).reduce((s, m) => s + (m?.calories ?? 0), 0)} kcal</p>
                </header>
                <div className="divide-y divide-border/60 border-y border-border/60">
                  {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((k) => {
                    const m = d.meals[k];
                    if (!m) return null;
                    return (
                      <div key={k} className="grid gap-1 py-4 sm:grid-cols-[120px_1fr_auto] sm:items-baseline sm:gap-6">
                        <span className="text-[13px] text-muted-foreground">{LABELS[k]}</span>
                        <div>
                          <p className="text-[15px] font-medium">{m.name}</p>
                          {m.note && <p className="mt-1 text-[13px] text-muted-foreground">{m.note}</p>}
                        </div>
                        <span className="text-[13px] tabular-nums text-muted-foreground sm:text-right">
                          {m.calories} kcal · {m.protein}g P
                        </span>
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
        <div className="mt-16 text-center text-body text-muted-foreground">
          Escolha um objetivo acima e clique em gerar.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-background p-6">
      <p className="text-caption">{label}</p>
      <p className="mt-2 font-display text-[28px] font-semibold tabular-nums">
        {value}{unit && <span className="ml-1 text-[15px] font-normal text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}
