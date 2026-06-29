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
      qc.invalidateQueries({ queryKey: ["profile"] });
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
    return { label: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""), total, score };
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
  const weightSeries = [...weights].reverse().map((w) => Number(w.weight_kg));
  const weightTrend = weights.length >= 2 ? Number(weights[0].weight_kg) - Number(weights[weights.length - 1].weight_kg) : 0;
  const bmi = profile?.weight_kg && profile?.height_cm ? Number(profile.weight_kg) / Math.pow(Number(profile.height_cm) / 100, 2) : null;

  const proteinPct = Math.min(100, (totals.protein / proteinGoal) * 100);

  return (
    <div className="animate-rise mx-auto max-w-3xl">
      <header className="mb-8">
        <p className="text-eyebrow">saúde · progresso</p>
        <h1 className="text-display-m mt-3">Sua evolução</h1>
        <p className="mt-3 text-body-sm" style={{ color: "var(--ink-2)" }}>
          Acompanhe calorias, proteína, hidratação e peso ao longo dos dias.
        </p>
      </header>

      <div className="space-y-4">
        <XpBar xp={profile?.xp ?? 0} />

        <HealthScoreCard score={health.score} breakdown={health.breakdown} />

        {/* Today — calorie ring + protein + water */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div
            className="flex flex-col items-center justify-center rounded-[24px] p-5 text-white"
            style={{ background: "linear-gradient(135deg, #2DAB6B 0%, #1E8654 100%)" }}
          >
            <div className="text-eyebrow" style={{ color: "rgba(255,255,255,0.85)" }}>calorias hoje</div>
            <div className="mt-1">
              <MetricRing value={totals.calories} max={calorieGoal} label="" unit="" color="rgba(255,255,255,0.95)" />
            </div>
          </div>

          <div className="card-nested p-5">
            <p className="text-eyebrow">proteína</p>
            <p className="mt-1 font-display text-[26px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>
              {totals.protein.toFixed(0)}<span className="text-[14px] font-normal" style={{ color: "var(--ink-3)" }}> / {proteinGoal}g</span>
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
              <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${proteinPct}%`, background: proteinPct >= 100 ? "var(--primary)" : "var(--ink-2)" }} />
            </div>
            <p className="mt-2 text-caption">
              {totals.protein < proteinGoal ? `Faltam ${(proteinGoal - totals.protein).toFixed(0)}g hoje.` : "Meta batida 🎉"}
            </p>
          </div>

          <WaterTracker goalMl={profile?.water_goal_ml ?? 2500} />
        </div>

        {/* Macro breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <MacroCell label="Carboidratos" value={totals.carbs} />
          <MacroCell label="Gorduras" value={totals.fat} />
          <MacroCell label="Fibras" value={totals.fiber} />
        </div>

        {/* Weekly evolution */}
        <div className="card-nested p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-eyebrow">evolução semanal</p>
              <h2 className="text-title-lg mt-1">Calorias por dia</h2>
            </div>
            <span className="rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: "var(--accent)", color: "var(--primary)" }}>
              {adherenceDays}/7 dias ativos
            </span>
          </div>
          <div className="mt-6 flex h-40 items-end gap-2.5">
            {days.map((d, i) => {
              const h = (d.total / max) * 100;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-lg transition-all duration-700 ease-out"
                      style={{
                        height: `${Math.max(h, d.total > 0 ? 6 : 2)}%`,
                        background: d.total > 0 ? "linear-gradient(180deg, #2DAB6B 0%, #1E8654 100%)" : "var(--surface-2)",
                      }}
                    >
                      {d.score > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold" style={{ color: "var(--primary)" }}>
                          {d.score.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[10.5px] capitalize" style={{ color: "var(--ink-3)" }}>{d.label}</div>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-caption">Números verdes = nota média da IA naquele dia.</p>
        </div>

        {/* Weight */}
        <div className="card-nested p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-eyebrow flex items-center gap-1.5"><Scale size={13} /> peso</p>
              <p className="mt-1 font-display text-[28px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>
                {profile?.weight_kg ? `${Number(profile.weight_kg).toFixed(1)}` : "—"}
                <span className="text-[14px] font-normal" style={{ color: "var(--ink-3)" }}> kg</span>
              </p>
              {bmi && <p className="text-caption">IMC {bmi.toFixed(1)}</p>}
            </div>
            {weightTrend !== 0 && (
              <div className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold"
                style={{ background: weightTrend < 0 ? "var(--accent)" : "color-mix(in srgb, var(--warning) 18%, transparent)", color: weightTrend < 0 ? "var(--primary)" : "var(--warning)" }}>
                {weightTrend < 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                {Math.abs(weightTrend).toFixed(1)} kg
              </div>
            )}
          </div>

          {weightSeries.length > 1 && <WeightChart data={weightSeries} />}

          <div className="mt-4 flex gap-2">
            <input
              type="number" step="0.1" placeholder="Novo peso (kg)" value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="flex-1 rounded-xl px-4 py-3 text-[14px] outline-none"
              style={{ background: "var(--surface)", color: "var(--ink-1)", border: "0.5px solid var(--hairline)" }}
            />
            <button disabled={!newWeight || addWeight.isPending} onClick={() => addWeight.mutate(Number(newWeight))}
              className="btn-primary shrink-0 px-5">
              Registrar
            </button>
          </div>
        </div>

        {/* Recent history */}
        <div className="card-nested p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-title-lg">Histórico recente</h2>
            <Link to="/nutrition/history" className="text-[12px] font-semibold" style={{ color: "var(--primary)" }}>
              Ver tudo →
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {rows.length === 0 && <p className="text-body-sm" style={{ color: "var(--ink-3)" }}>Nenhuma análise ainda.</p>}
            {rows.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl p-3.5" style={{ background: "var(--surface)" }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: "var(--ink-1)" }}>
                    {r.calories} kcal
                    {r.score != null && <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "var(--accent)", color: "var(--primary)" }}>{Number(r.score).toFixed(1)}</span>}
                    {r.meal_type && <span className="text-[10px] uppercase" style={{ color: "var(--ink-3)" }}>· {r.meal_type}</span>}
                  </div>
                  <div className="text-caption">{new Date(r.created_at).toLocaleString("pt-BR")}</div>
                </div>
                <div className="shrink-0 text-caption">P {Number(r.protein).toFixed(0)} · C {Number(r.carbs).toFixed(0)} · G {Number(r.fat).toFixed(0)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MacroCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-nested p-5">
      <p className="text-eyebrow">{label}</p>
      <p className="mt-1 font-display text-[24px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>
        {value.toFixed(0)}<span className="text-[13px] font-normal" style={{ color: "var(--ink-3)" }}>g</span>
      </p>
    </div>
  );
}

/** Smooth SVG area chart for the weight series. */
function WeightChart({ data }: { data: number[] }) {
  const series = data.slice(-14);
  const w = 320;
  const h = 64;
  const pad = 4;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const pts = series.map((v, i) => {
    const x = pad + (i / Math.max(1, series.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z`;

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#wgrad)" />
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 3 : 1.6} fill="var(--primary)" />
        ))}
      </svg>
    </div>
  );
}
