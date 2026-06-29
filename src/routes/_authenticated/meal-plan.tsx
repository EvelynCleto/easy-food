import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, Coffee, Dumbbell, Heart, Loader2, Salad, Sparkles, Sunset, TrendingDown, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { generateMealPlan, getLatestMealPlan, type MealPlan } from "@/lib/meal-plan.functions";

export const Route = createFileRoute("/_authenticated/meal-plan")({
  component: MealPlanPage,
});

const GOALS = [
  { id: "emagrecimento", label: "Emagrecer", icon: TrendingDown, color: "from-rose-500 to-rose-400" },
  { id: "manutencao", label: "Manter", icon: Heart, color: "from-sky-500 to-sky-400" },
  { id: "ganho_massa", label: "Ganhar massa", icon: Dumbbell, color: "from-amber-500 to-amber-400" },
  { id: "saude", label: "Mais saúde", icon: Salad, color: "from-emerald-500 to-emerald-400" },
] as const;

function MealPlanPage() {
  const get = useServerFn(getLatestMealPlan);
  const gen = useServerFn(generateMealPlan);
  const qc = useQueryClient();
  const [goal, setGoal] = useState<(typeof GOALS)[number]["id"]>("manutencao");

  const { data: plan, isLoading } = useQuery({ queryKey: ["meal-plan"], queryFn: () => get() });

  const mutate = useMutation({
    mutationFn: (g: typeof goal) => gen({ data: { goal: g } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meal-plan"] });
      toast.success("Plano semanal gerado pela IA!");
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao gerar plano"),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
          <Sparkles size={12} /> Nutri Coach IA
        </div>
        <h1 className="font-display text-2xl font-bold">Plano semanal</h1>
        <p className="text-sm text-muted-foreground">A IA cria um cardápio de 7 dias usando os pratos disponíveis nas máquinas EasyFood.</p>
      </div>

      <div className="rounded-3xl bg-card p-4 ring-1 ring-border/60">
        <div className="text-xs font-semibold text-muted-foreground">Escolha seu objetivo</div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GOALS.map((g) => (
            <button key={g.id} onClick={() => setGoal(g.id)}
              className={`flex items-center gap-2 rounded-2xl border p-3 text-left transition ${goal === g.id ? "border-primary bg-primary/10" : "border-input"}`}>
              <div className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${g.color} text-white`}>
                <g.icon size={14} />
              </div>
              <span className="text-sm font-semibold">{g.label}</span>
            </button>
          ))}
        </div>
        <button onClick={() => mutate.mutate(goal)} disabled={mutate.isPending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
          {mutate.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {plan ? "Regenerar plano da semana" : "Gerar meu plano semanal"}
        </button>
      </div>

      {isLoading && <div className="grid h-40 place-items-center"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>}

      {plan && <PlanView plan={plan} />}
      {!isLoading && !plan && (
        <div className="grid place-items-center rounded-2xl bg-card p-8 text-center ring-1 ring-border/60">
          <Calendar size={28} className="text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Você ainda não gerou um plano. Escolha um objetivo acima e clique em gerar.</p>
        </div>
      )}
    </div>
  );
}

const ICONS = { cafe: Coffee, almoco: UtensilsCrossed, lanche: Salad, jantar: Sunset } as const;
const LABELS = { cafe: "Café da manhã", almoco: "Almoço", lanche: "Lanche", jantar: "Jantar" } as const;

function PlanView({ plan }: { plan: MealPlan }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Calorias / semana" value={`${plan.total_calories.toLocaleString("pt-BR")} kcal`} />
        <Stat label="Proteína / semana" value={`${Math.round(plan.total_protein)}g`} />
        <Stat label="Refeições" value={`${plan.days.length * 4}`} />
      </div>
      {plan.days.map((d, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
          className="overflow-hidden rounded-2xl bg-card ring-1 ring-border/60">
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2">
            <div className="font-display text-sm font-bold">{d.day}</div>
            <div className="text-[10px] uppercase text-muted-foreground">
              {Object.values(d.meals).reduce((s, m) => s + (m?.calories ?? 0), 0)} kcal
            </div>
          </div>
          <div className="divide-y divide-border/40">
            {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((k) => {
              const m = d.meals[k];
              if (!m) return null;
              const Icon = ICONS[k];
              return (
                <div key={k} className="flex items-start gap-3 p-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{LABELS[k]}</span>
                      <span className="text-[10px] text-muted-foreground">{m.calories} kcal · P {m.protein}g</span>
                    </div>
                    <div className="text-sm font-semibold leading-tight">{m.name}</div>
                    {m.note && <div className="text-xs text-muted-foreground">{m.note}</div>}
                    {m.product_match && (
                      <div className="mt-1 inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                        Disponível: {m.product_match}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card p-3 ring-1 ring-border/60">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-bold">{value}</div>
    </div>
  );
}