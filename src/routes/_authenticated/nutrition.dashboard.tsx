import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Scale, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { WaterTracker } from "@/components/premium/WaterTracker";
import { XpBar } from "@/components/premium/XpBar";
import { MetricRing } from "@/components/premium/MetricRing";
import { HealthScoreCard } from "@/components/premium/HealthScoreCard";
import { computeHealthScore } from "@/lib/health-score";

export const Route = createFileRoute("/_authenticated/nutrition/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [newWeight, setNewWeight] = useState<string>("");

  const { data: profile } = useQuery({
    queryKey: ["profile-dash", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("calorie_goal,protein_goal,water_goal_ml,weight_kg,height_cm,xp,goal")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: weights = [] } = useQuery({
    queryKey: ["weights", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("weight_logs")
        .select("weight_kg, logged_at")
        .eq("user_id", user!.id)
        .order("logged_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  const addWeight = useMutation({
    mutationFn: async (w: number) => {
      if (!user) return;
      const { error } = await supabase.from("weight_logs").insert({ user_id: user.id, weight_kg: w });
      if (error) throw error;
      await supabase.from("profiles").update({ weight_kg: w }).eq("id", user.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weights"] });
      qc.invalidateQueries({ queryKey: ["profile-dash"] });
      setNewWeight("");
      toast.success("Peso registrado");
    },
  });

  const { data: rows = [] } = useQuery({
    queryKey: ["nutri-history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("nutritional_analysis").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(60);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const { data: waterToday = 0 } = useQuery({
    queryKey: ["water-today", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { data, error } = await supabase.from("water_logs").select("amount_ml").eq("user_id", user!.id).gte("logged_at", start.toISOString());
      if (error) throw new Error(error.message);
      return (data ?? []).reduce((s, r) => s + (r.amount_ml ?? 0), 0);
    },
  });

  const today = new Date().toDateString();
  const todayRows = rows.filter((r) => new Date(r.created_at).toDateString() === today);
  const totals = todayRows.reduce((a, r) => ({
    calories: a.calories + (r.calories ?? 0),
    protein: a.protein + Number(r.protein ?? 0),
    carbs: a.carbs + Number(r.carbs ?? 0),
    fiber: a.fiber + Number(r.fiber ?? 0),
    fat: a.fat + Number(r.fat ?? 0),
  }), { calories: 0, protein: 0, carbs: 0, fiber: 0, fat: 0 });

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const total = rows.filter((r) => new Date(r.created_at).toDateString() === key).reduce((a, r) => a + (r.calories ?? 0), 0);
    const scoreRows = rows.filter((r) => new Date(r.created_at).toDateString() === key && r.score != null);
    const score = scoreRows.length ? scoreRows.reduce((a, r) => a + Number(r.score), 0) / scoreRows.length : 0;
    return { label: d.toLocaleDateString("pt-BR", { weekday: "short" }), total, score };
  });
  const max = Math.max(1, ...days.map((d) => d.total));

  const calorieGoal = profile?.calorie_goal ?? 2000;
  const proteinGoal = profile?.protein_goal ?? 120;
  const adherenceDays = days.filter((d) => d.total > 0).length;
  const weekScores = rows.filter((r) => r.score != null);
  const avgScore = weekScores.length ? weekScores.reduce((a, r) => a + Number(r.score), 0) / weekScores.length : 0;
  const health = computeHealthScore({
    caloriesToday: totals.calories,
    calorieGoal,
    proteinToday: totals.protein,
    proteinGoal,
    waterTodayMl: waterToday,
    waterGoalMl: profile?.water_goal_ml ?? 2500,
    activeDaysLast7: adherenceDays,
    avgMealScore: avgScore,
  });
  const weightTrend = weights.length >= 2 ? Number(weights[0].weight_kg) - Number(weights[weights.length - 1].weight_kg) : 0;
  const bmi = profile?.weight_kg && profile?.height_cm ? Number(profile.weight_kg) / Math.pow(Number(profile.height_cm) / 100, 2) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Saúde</h1>
          <p className="text-sm text-muted-foreground">Sua evolução, ao estilo Apple Health.</p>
        </div>
      </div>

      <XpBar xp={profile?.xp ?? 0} />

      <HealthScoreCard score={health.score} breakdown={health.breakdown} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col items-center rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.5_0.16_140)] p-5 text-primary-foreground">
          <div className="text-xs uppercase opacity-90">Calorias hoje</div>
          <MetricRing value={totals.calories} max={calorieGoal} label="kcal" unit="" color="hsl(0 0% 100%)" />
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
          <div className="text-xs uppercase text-muted-foreground">Proteína</div>
          <div className="mt-1 text-2xl font-bold">{totals.protein.toFixed(0)}<span className="text-sm text-muted-foreground">/{proteinGoal}g</span></div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.min(100, (totals.protein / proteinGoal) * 100)}%` }} />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {totals.protein < proteinGoal
              ? `Faltam ${(proteinGoal - totals.protein).toFixed(0)}g para sua meta.`
              : "Meta de proteína batida 🎉"}
          </div>
        </div>
        <WaterTracker goalMl={profile?.water_goal_ml ?? 2500} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
          <div className="text-xs uppercase text-muted-foreground">Carboidratos</div>
          <div className="mt-1 text-2xl font-bold">{totals.carbs.toFixed(0)}<span className="text-sm text-muted-foreground">g</span></div>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
          <div className="text-xs uppercase text-muted-foreground">Gorduras</div>
          <div className="mt-1 text-2xl font-bold">{totals.fat.toFixed(0)}<span className="text-sm text-muted-foreground">g</span></div>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
          <div className="text-xs uppercase text-muted-foreground">Fibras</div>
          <div className="mt-1 text-2xl font-bold">{totals.fiber.toFixed(0)}<span className="text-sm text-muted-foreground">g</span></div>
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Evolução semanal</h2>
          <span className="text-[11px] text-muted-foreground">{adherenceDays}/7 dias ativos</span>
        </div>
        <div className="mt-4 flex h-32 items-end gap-2">
          {days.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="relative w-full rounded-t-md bg-gradient-to-t from-primary to-primary/60 transition-all" style={{ height: `${(d.total / max) * 100}%`, minHeight: 4 }}>
                {d.score > 0 && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-600">{d.score.toFixed(1)}</span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground">{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-1.5 text-sm font-semibold"><Scale size={14} /> Peso</h2>
            <div className="text-xs text-muted-foreground">
              Atual: <strong className="text-foreground">{profile?.weight_kg ? `${Number(profile.weight_kg).toFixed(1)} kg` : "—"}</strong>
              {bmi && <> · IMC {bmi.toFixed(1)}</>}
            </div>
          </div>
          {weightTrend !== 0 && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${weightTrend < 0 ? "text-emerald-600" : "text-amber-600"}`}>
              {weightTrend < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
              {Math.abs(weightTrend).toFixed(1)} kg
            </div>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <input type="number" step="0.1" placeholder="Novo peso (kg)" value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm" />
          <button disabled={!newWeight || addWeight.isPending} onClick={() => addWeight.mutate(Number(newWeight))}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
            Registrar
          </button>
        </div>
        {weights.length > 1 && (
          <div className="mt-3 flex h-16 items-end gap-1">
            {[...weights].reverse().slice(-14).map((w, i) => {
              const arr = weights.map((x) => Number(x.weight_kg));
              const mn = Math.min(...arr) - 0.5;
              const mx = Math.max(...arr) + 0.5;
              const h = ((Number(w.weight_kg) - mn) / (mx - mn || 1)) * 100;
              return <div key={i} className="flex-1 rounded-t bg-emerald-500/70" style={{ height: `${h}%`, minHeight: 4 }} />;
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Histórico recente</h2>
          <Link to="/nutrition/history" className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
            Ver tudo →
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {rows.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma análise ainda.</p>}
          {rows.slice(0, 10).map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl bg-surface p-3 text-sm">
              <div>
                <div className="flex items-center gap-2 font-semibold">
                  {r.calories} kcal
                  {r.score != null && <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">{Number(r.score).toFixed(1)}</span>}
                  {r.meal_type && <span className="text-[10px] uppercase text-muted-foreground">· {r.meal_type}</span>}
                </div>
                <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</div>
              </div>
              <div className="text-xs text-muted-foreground">P {Number(r.protein).toFixed(0)}g · C {Number(r.carbs).toFixed(0)}g · G {Number(r.fat).toFixed(0)}g</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}