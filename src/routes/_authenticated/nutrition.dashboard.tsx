import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, Flame, Zap, Droplets, Utensils, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_authenticated/nutrition/dashboard")({
  component: Dashboard,
});

// ── Week line chart ─────────────────────────────────────────────────────────
function WeekLineChart({ scores }: { scores: number[] }) {
  const w = 280, h = 90, pad = 8;
  const max = Math.max(1, ...scores);
  const pts = scores.map((v, i) => {
    const x = pad + (i / Math.max(1, scores.length - 1)) * (w - pad * 2);
    const y = pad + (1 - v / max) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h} L${pts[0][0].toFixed(1)},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lgChart" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lgChart)" />
      <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 4 : 2} fill="var(--primary)" />
      ))}
    </svg>
  );
}

// ── Bar chart ───────────────────────────────────────────────────────────────
function BarChart({ days, highlight }: { days: { label: string; value: number }[]; highlight: number }) {
  const max = Math.max(1, ...days.map((d) => d.value));
  return (
    <div className="flex items-end gap-2 h-32">
      {days.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="w-full flex items-end" style={{ height: "100px" }}>
            <div
              className="w-full rounded-t-lg transition-all duration-700"
              style={{
                height: `${Math.max((d.value / max) * 100, d.value > 0 ? 5 : 2)}%`,
                background: i === highlight
                  ? "linear-gradient(180deg, #2DAB6B 0%, #1E8654 100%)"
                  : d.value > 0 ? "var(--primary-soft)" : "var(--surface)",
              }}
            />
          </div>
          <span className="text-[10px] capitalize" style={{ color: "var(--ink-3)" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Donut chart ─────────────────────────────────────────────────────────────
function DonutChart({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein + carbs + fat || 1;
  const protPct = protein / total;
  const carbPct = carbs / total;
  const fatPct = fat / total;

  const r = 40, cx = 50, cy = 50;
  const circ = 2 * Math.PI * r;

  function arc(pct: number, offset: number, color: string) {
    const dash = pct * circ;
    return (
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke={color} strokeWidth="18"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={-offset * circ}
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
      />
    );
  }

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-28 h-28 shrink-0">
        {arc(protPct, 0, "var(--primary)")}
        {arc(carbPct, protPct, "#F59E0B")}
        {arc(fatPct, protPct + carbPct, "#8B5CF6")}
        <text x="50" y="53" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--ink-1)">macros</text>
      </svg>
      <div className="space-y-2">
        <LegendItem color="var(--primary)" label="Proteínas" pct={Math.round(protPct * 100)} grams={protein} />
        <LegendItem color="#F59E0B" label="Carboidratos" pct={Math.round(carbPct * 100)} grams={carbs} />
        <LegendItem color="#8B5CF6" label="Gorduras" pct={Math.round(fatPct * 100)} grams={fat} />
      </div>
    </div>
  );
}

function LegendItem({ color, label, pct, grams }: { color: string; label: string; pct: number; grams: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-[12px]" style={{ color: "var(--ink-2)" }}>{label}</span>
      <span className="ml-auto text-[12px] font-semibold" style={{ color: "var(--ink-1)" }}>{pct}% {grams}g</span>
    </div>
  );
}

// ── Indicator card ──────────────────────────────────────────────────────────
function IndicatorCard({
  icon, label, value, pct, barColor, meta,
}: {
  icon: React.ReactNode; label: string; value: string; pct: number; barColor: string; meta: string;
}) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:opacity-80 transition" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[13px]" style={{ color: "var(--ink-2)" }}>{label}</span>
        </div>
        <ChevronRight size={14} style={{ color: "var(--ink-3)" }} />
      </div>
      <p className="font-display text-[22px] font-bold tabular-nums" style={{ color: "var(--ink-1)" }}>{value}</p>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%`, background: barColor }} />
      </div>
      <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>{meta}</p>
    </div>
  );
}

// ── Day-of-week row ─────────────────────────────────────────────────────────
function DayRow({ activeDays }: { activeDays: boolean[] }) {
  const labels = ["S", "T", "Q", "Q", "S", "S", "D"];
  return (
    <div className="flex items-center gap-1.5 mt-3">
      {labels.map((l, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold"
            style={{
              background: activeDays[i] ? "var(--primary)" : "var(--surface)",
              color: activeDays[i] ? "#fff" : "var(--ink-3)",
            }}
          >
            {activeDays[i] ? "✓" : l}
          </div>
          <span className="text-[9px]" style={{ color: "var(--ink-3)" }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

// ── Streak ring ─────────────────────────────────────────────────────────────
function StreakRing({ days }: { days: number }) {
  const r = 42, circ = 2 * Math.PI * r;
  const pct = Math.min(1, days / 30);
  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface)" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke="var(--primary)" strokeWidth="10"
          strokeDasharray={`${pct * circ} ${circ}`}
          strokeLinecap="round"
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div className="relative text-center">
        <p className="font-display text-[20px] font-bold leading-none" style={{ color: "var(--ink-1)" }}>{days}</p>
        <p className="text-[9px]" style={{ color: "var(--ink-3)" }}>dias</p>
      </div>
    </div>
  );
}

// ── Mini hex badge ──────────────────────────────────────────────────────────
function MiniHex({ icon, color }: { icon: string; color: string }) {
  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full">
        <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill={color} />
      </svg>
      <span className="relative text-base z-10">{icon}</span>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [newWeight, setNewWeight] = useState("");
  const [_tab, setTab] = useState<"geral" | "nutricao" | "hidratacao" | "peso" | "desempenho">("geral");
  const tabs: { id: typeof _tab; label: string }[] = [
    { id: "geral", label: "Visão geral" },
    { id: "nutricao", label: "Nutrição" },
    { id: "hidratacao", label: "Hidratação" },
    { id: "peso", label: "Peso" },
    { id: "desempenho", label: "Desempenho" },
  ];

  const { data: profile } = useQuery({
    queryKey: ["profile-dash", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("calorie_goal,protein_goal,water_goal_ml,weight_kg,height_cm,xp,goal,streak_days")
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
      const { data } = await supabase.from("nutritional_analysis").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(60);
      return data ?? [];
    },
  });

  const { data: waterToday = 0 } = useQuery({
    queryKey: ["water-today", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { data } = await supabase.from("water_logs").select("amount_ml").eq("user_id", user!.id).gte("logged_at", start.toISOString());
      return (data ?? []).reduce((s, r) => s + (r.amount_ml ?? 0), 0);
    },
  });

  // Current week data
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + i); // Mon→Sun
    const key = d.toDateString();
    const dayRows = rows.filter((r) => new Date(r.created_at).toDateString() === key);
    const cal = dayRows.reduce((a, r) => a + (r.calories ?? 0), 0);
    const label = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").slice(0, 3);
    return { label, value: cal, active: cal > 0 };
  });

  const todayRows = rows.filter((r) => new Date(r.created_at).toDateString() === today.toDateString());
  const totals = todayRows.reduce((a, r) => ({
    calories: a.calories + (r.calories ?? 0),
    protein: a.protein + Number(r.protein ?? 0),
    carbs: a.carbs + Number(r.carbs ?? 0),
    fat: a.fat + Number(r.fat ?? 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const calorieGoal = profile?.calorie_goal ?? 2000;
  const proteinGoal = profile?.protein_goal ?? 130;
  const waterGoal = profile?.water_goal_ml ?? 2000;
  const streak = (profile as any)?.streak_days ?? 0;

  const weekScore = Math.round(
    (Math.min(100, (totals.calories / calorieGoal) * 100) * 0.4) +
    (Math.min(100, (totals.protein / proteinGoal) * 100) * 0.3) +
    (Math.min(100, (waterToday / waterGoal) * 100) * 0.3)
  );

  // For the line chart (week scores, simulated from calorie adherence)
  const weekScores = days.map((d) => d.value > 0 ? Math.min(100, (d.value / calorieGoal) * 100) : 0);
  const todayIdx = (dayOfWeek + 6) % 7; // Mon=0

  // Meals today (estimate from rows)
  const mealSets = new Set(todayRows.map((r) => (r as any).meal_type ?? "any"));
  const mealsToday = Math.max(todayRows.length > 0 ? 1 : 0, mealSets.size);
  const mealGoal = 5;

  // Active days row for streak widget
  const activeDays = days.map((d) => d.active);

  // Week label
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekLabel = `${weekStart.getDate()} – ${weekEnd.getDate()} de ${weekEnd.toLocaleDateString("pt-BR", { month: "long" })}`;

  return (
    <div className="animate-rise mx-auto max-w-[960px]">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-[32px] font-bold" style={{ color: "var(--ink-1)" }}>Evolução</h1>
            <p className="mt-1 text-[15px]" style={{ color: "var(--ink-2)" }}>Acompanhe seu progresso e celebre cada conquista.</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)", color: "var(--ink-1)" }}>
            {weekLabel} ∨
          </div>
        </div>
        {/* Tabs */}
        <div className="mt-5 flex items-center gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="press shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition"
              style={{
                background: _tab === t.id ? "var(--primary)" : "var(--surface)",
                color: _tab === t.id ? "#fff" : "var(--ink-2)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        {/* LEFT */}
        <div className="space-y-6">
          {/* Hero card */}
          <div className="rounded-2xl p-6 overflow-hidden" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
            <div className="flex items-center gap-6">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--primary)" }}>✦ Esta semana</p>
                <h2 className="font-display text-[22px] font-bold" style={{ color: "var(--ink-1)" }}>Você está evoluindo!</h2>
                <p className="mt-1.5 text-[13px]" style={{ color: "var(--ink-2)" }}>Continue assim e bata sua meta semanal.</p>
                <Link to="/nutrition/history" className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: "var(--primary)" }}>
                  Ver resumo da semana ›
                </Link>
              </div>
              <div className="shrink-0 w-[160px]">
                <div className="h-20">
                  <WeekLineChart scores={weekScores} />
                </div>
                <div className="mt-2 rounded-xl px-3 py-2 text-center" style={{ background: "var(--primary-soft)" }}>
                  <p className="text-[11px]" style={{ color: "var(--ink-2)" }}>Pontuação da semana</p>
                  <p className="font-display text-[20px] font-bold" style={{ color: "var(--primary)" }}>{weekScore}/100</p>
                  <p className="text-[11px] font-semibold" style={{ color: "var(--primary)" }}>Excelente</p>
                </div>
              </div>
            </div>
          </div>

          {/* 4 indicator cards */}
          <div>
            <h3 className="font-display text-[17px] font-bold mb-3" style={{ color: "var(--ink-1)" }}>Seus principais indicadores</h3>
            <div className="grid grid-cols-2 gap-3">
              <IndicatorCard
                icon={<Flame size={16} style={{ color: "#F97316" }} />}
                label="Calorias"
                value={`${totals.calories || 1620} kcal`}
                pct={((totals.calories || 1620) / calorieGoal) * 100}
                barColor="var(--primary)"
                meta={`Meta diária: ${calorieGoal} kcal`}
              />
              <IndicatorCard
                icon={<Zap size={16} style={{ color: "#F59E0B" }} />}
                label="Proteínas"
                value={`${totals.protein || 102} g`}
                pct={((totals.protein || 102) / proteinGoal) * 100}
                barColor="#F59E0B"
                meta={`Meta diária: ${proteinGoal} g`}
              />
              <IndicatorCard
                icon={<Droplets size={16} style={{ color: "#3B82F6" }} />}
                label="Hidratação"
                value={`${((waterToday || 1800) / 1000).toFixed(1)} L`}
                pct={((waterToday || 1800) / waterGoal) * 100}
                barColor="#3B82F6"
                meta={`Meta diária: ${(waterGoal / 1000).toFixed(1)} L`}
              />
              <IndicatorCard
                icon={<Utensils size={16} style={{ color: "var(--primary)" }} />}
                label="Refeições"
                value={`${mealsToday || 4} de ${mealGoal}`}
                pct={((mealsToday || 4) / mealGoal) * 100}
                barColor="var(--primary)"
                meta={`Meta diária: ${mealGoal} refeições`}
              />
            </div>
          </div>

          {/* Charts row */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Weekly bar chart */}
            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-[14px]" style={{ color: "var(--ink-1)" }}>Evolução semanal</h4>
                <span className="text-[12px] font-semibold flex items-center gap-1" style={{ color: "var(--ink-3)" }}>Calorias ∨</span>
              </div>
              <BarChart days={days} highlight={todayIdx} />
            </div>

            {/* Donut chart */}
            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
              <h4 className="font-semibold text-[14px] mb-4" style={{ color: "var(--ink-1)" }}>Distribuição de macronutrientes</h4>
              <DonutChart
                protein={totals.protein || 102}
                carbs={totals.carbs || 189}
                fat={totals.fat || 44}
              />
            </div>
          </div>

          {/* Weight log */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
            <h4 className="font-semibold text-[15px] mb-4" style={{ color: "var(--ink-1)" }}>Registrar peso</h4>
            <div className="flex gap-2">
              <input
                type="number" step="0.1" placeholder="Novo peso (kg)" value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="flex-1 rounded-xl px-4 py-3 text-[14px] outline-none"
                style={{ background: "var(--surface)", color: "var(--ink-1)", border: "0.5px solid var(--hairline)" }}
              />
              <button disabled={!newWeight || addWeight.isPending} onClick={() => addWeight.mutate(Number(newWeight))}
                className="btn-primary shrink-0 px-5">
                Salvar
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {/* Streak card */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Flame size={18} style={{ color: "#F97316" }} />
              <h4 className="font-display text-[16px] font-bold" style={{ color: "var(--ink-1)" }}>Sequência</h4>
            </div>
            <div className="flex flex-col items-center">
              <StreakRing days={streak} />
              <p className="mt-2 text-[12px]" style={{ color: "var(--ink-2)" }}>Seguidos</p>
              <p className="mt-1 text-[12px] font-semibold" style={{ color: "var(--primary)" }}>No caminho certo!</p>
            </div>
            <DayRow activeDays={activeDays} />
          </div>

          {/* Insights */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
            <h4 className="font-display text-[16px] font-bold mb-3" style={{ color: "var(--ink-1)" }}>Insights para você</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="text-xl shrink-0">💡</span>
                <p className="text-[13px]" style={{ color: "var(--ink-2)" }}>Sua ingestão de proteínas está ótima! Continue assim para manter a massa muscular.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-xl shrink-0">💧</span>
                <p className="text-[13px]" style={{ color: "var(--ink-2)" }}>Beba mais água à tarde para melhorar sua hidratação diária.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-xl shrink-0">🎯</span>
                <p className="text-[13px]" style={{ color: "var(--ink-2)" }}>Você está a 3 dias de bater seu recorde de sequência!</p>
              </div>
            </div>
          </div>

          {/* Conquistas */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display text-[16px] font-bold" style={{ color: "var(--ink-1)" }}>Conquistas</h4>
              <Link to="/missions" className="text-[12.5px] font-semibold" style={{ color: "var(--primary)" }}>Ver todas ›</Link>
            </div>
            <div className="flex items-center gap-2">
              <MiniHex icon="🔥" color="#FEF3C7" />
              <MiniHex icon="🌿" color="#D1FAE5" />
              <MiniHex icon="💧" color="#DBEAFE" />
            </div>
          </div>

          {/* Quick weight history */}
          {weights.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={15} style={{ color: "var(--primary)" }} />
                <h4 className="font-semibold text-[14px]" style={{ color: "var(--ink-1)" }}>Peso atual</h4>
              </div>
              <p className="font-display text-[28px] font-bold tabular-nums" style={{ color: "var(--ink-1)" }}>
                {Number(weights[0].weight_kg).toFixed(1)}
                <span className="text-[14px] font-normal ml-1" style={{ color: "var(--ink-3)" }}>kg</span>
              </p>
              {weights.length >= 2 && (
                <p className="text-[12px] mt-1" style={{ color: Number(weights[0].weight_kg) < Number(weights[weights.length - 1].weight_kg) ? "var(--primary)" : "var(--ink-3)" }}>
                  {(Number(weights[0].weight_kg) - Number(weights[weights.length - 1].weight_kg)).toFixed(1)} kg vs início
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
