import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Calendar,
  ChevronDown,
  Download,
  Flame,
  MoreHorizontal,
  Sparkles,
  UtensilsCrossed,
  Camera,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/nutrition/history")({
  component: NutritionHistoryPage,
});

type Analysis = {
  id: string;
  created_at: string;
  meal_type: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  score: number | null;
  notes: string | null;
  ai_suggestions: string[] | null;
  image_url: string | null;
};

type FilterKey = "hoje" | "ontem" | "7dias" | "30dias" | "custom";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "ontem", label: "Ontem" },
  { key: "7dias", label: "7 dias" },
  { key: "30dias", label: "30 dias" },
  { key: "custom", label: "Personalizado" },
];

function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function filterRows(rows: Analysis[], filter: FilterKey): Analysis[] {
  const now = new Date();
  const todayStart = startOfDay(now);
  if (filter === "hoje") {
    return rows.filter((r) => new Date(r.created_at) >= todayStart);
  }
  if (filter === "ontem") {
    const ystStart = new Date(todayStart);
    ystStart.setDate(ystStart.getDate() - 1);
    return rows.filter((r) => {
      const d = new Date(r.created_at);
      return d >= ystStart && d < todayStart;
    });
  }
  if (filter === "7dias") {
    const t = new Date(now);
    t.setDate(t.getDate() - 7);
    return rows.filter((r) => new Date(r.created_at) >= t);
  }
  if (filter === "30dias") {
    const t = new Date(now);
    t.setDate(t.getDate() - 30);
    return rows.filter((r) => new Date(r.created_at) >= t);
  }
  return rows;
}

function formatSectionDate(filter: FilterKey): string {
  const now = new Date();
  if (filter === "ontem") {
    now.setDate(now.getDate() - 1);
  }
  return now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

function CalorieRing({
  consumed,
  goal,
}: {
  consumed: number;
  goal: number;
}) {
  const r = 64;
  const cx = 80;
  const cy = 80;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(consumed / goal, 1);
  const dash = pct * circ;
  return (
    <div className="flex flex-col items-center">
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
    </div>
  );
}

function MacroBar({
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
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-1">
        <span style={{ color: "var(--ink-2)" }}>{label}</span>
        <span style={{ color: "var(--ink-1)" }} className="font-semibold tabular-nums">
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

function NutritionHistoryPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterKey>("hoje");
  const [showAll, setShowAll] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["nutri-history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nutritional_analysis")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return (data ?? []) as Analysis[];
    },
  });

  const filtered = filterRows(rows, filter);
  const displayed = showAll ? filtered : filtered.slice(0, 6);

  const totalCal = filtered.reduce((s, r) => s + (r.calories ?? 0), 0);
  const totalProt = filtered.reduce((s, r) => s + (r.protein ?? 0), 0);
  const totalCarb = filtered.reduce((s, r) => s + (r.carbs ?? 0), 0);
  const totalFat = filtered.reduce((s, r) => s + (r.fat ?? 0), 0);
  const totalFiber = filtered.reduce((s, r) => s + (r.fiber ?? 0), 0);

  const sectionLabel =
    filter === "hoje"
      ? "Hoje"
      : filter === "ontem"
      ? "Ontem"
      : filter === "7dias"
      ? "Últimos 7 dias"
      : filter === "30dias"
      ? "Últimos 30 dias"
      : "Período personalizado";

  const sectionDate = formatSectionDate(filter);

  return (
    <div className="animate-rise mx-auto max-w-[960px]">
      {/* Header */}
      <header className="mb-6">
        <h1
          className="text-[32px] font-bold leading-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--ink-1)" }}
        >
          Histórico
        </h1>
        <p className="mt-1 text-[14px]" style={{ color: "var(--ink-2)" }}>
          Acompanhe suas refeições e escolhas diárias.
        </p>
      </header>

      {/* Filter tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => { setFilter(f.key); setShowAll(false); }}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition"
            style={{
              background: filter === f.key ? "var(--ink-1)" : "var(--card)",
              color: filter === f.key ? "var(--card)" : "var(--ink-2)",
              border: filter === f.key ? "none" : "1px solid var(--hairline)",
            }}
          >
            {f.key === "custom" && <Calendar size={13} />}
            {f.label}
          </button>
        ))}
      </div>

      {/* Main 2-col grid */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* LEFT: Timeline */}
        <div>
          {isLoading && (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ background: "var(--card)" }} />
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-6 py-20 text-center">
              <div className="grid h-20 w-20 place-items-center rounded-3xl" style={{ background: "var(--surface)" }}>
                <UtensilsCrossed size={32} style={{ color: "var(--ink-3)" }} />
              </div>
              <div>
                <h2 className="text-[18px] font-semibold" style={{ color: "var(--ink-1)" }}>
                  Nenhuma refeição neste período
                </h2>
                <p className="mt-2 text-[13px]" style={{ color: "var(--ink-2)" }}>
                  Analise uma refeição para ver o histórico aqui.
                </p>
              </div>
              <Link to="/nutrition" className="btn-primary">
                <Camera size={16} /> Analisar refeição
              </Link>
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <>
              {/* Section header */}
              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-[15px] font-semibold capitalize" style={{ color: "var(--ink-1)" }}>
                  {sectionLabel}, {sectionDate.split(", ").slice(1).join(", ")}
                </span>
                <span className="text-[13px] font-semibold" style={{ color: "var(--primary)" }}>
                  {totalCal.toLocaleString("pt-BR")} kcal consumidas
                </span>
              </div>

              {/* Timeline entries */}
              <div className="space-y-3">
                {displayed.map((r) => {
                  const date = new Date(r.created_at);
                  const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                  const foodName = r.notes?.split("\n")[0]?.replace(/^#+\s*/, "") || r.meal_type || "Refeição";

                  return (
                    <div
                      key={r.id}
                      className="flex items-start gap-3 rounded-2xl p-4"
                      style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}
                    >
                      {/* Time + dot */}
                      <div className="flex flex-col items-center gap-1 shrink-0 pt-1" style={{ minWidth: 36 }}>
                        <span className="text-[11px] tabular-nums" style={{ color: "var(--ink-3)" }}>
                          {timeStr}
                        </span>
                        <div className="h-2 w-2 rounded-full mt-1" style={{ background: "var(--primary)" }} />
                      </div>

                      {/* Food photo */}
                      {r.image_url ? (
                        <img
                          src={r.image_url}
                          alt="Refeição"
                          className="h-16 w-16 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div
                          className="h-16 w-16 shrink-0 rounded-xl grid place-items-center text-2xl"
                          style={{ background: "var(--surface)" }}
                        >
                          🍽
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14px] font-semibold truncate" style={{ color: "var(--ink-1)" }}>
                            {foodName}
                          </span>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-1"
                            style={{ background: "rgba(34,197,94,0.12)", color: "#16a34a" }}
                          >
                            ✦ Escaneado
                          </span>
                        </div>
                        <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-3)" }}>
                          Análise por IA • {r.calories ?? 0} kcal
                        </p>
                        <div className="mt-2 flex gap-4">
                          <MacroChip label="Proteína" value={r.protein} />
                          <MacroChip label="Carbo" value={r.carbs} />
                          <MacroChip label="Gordura" value={r.fat} />
                        </div>
                      </div>

                      {/* Menu */}
                      <button
                        type="button"
                        className="shrink-0 grid h-8 w-8 place-items-center rounded-full"
                        style={{ color: "var(--ink-3)" }}
                        aria-label="Opções"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Show more */}
              {!showAll && filtered.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-semibold transition"
                  style={{ color: "var(--ink-2)", border: "1px solid var(--hairline)", background: "var(--card)" }}
                >
                  Ver todas as refeições <ChevronDown size={14} />
                </button>
              )}
            </>
          )}
        </div>

        {/* RIGHT Sidebar */}
        <div className="space-y-4">
          {/* Resumo do dia */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
            <h3 className="text-[14px] font-semibold mb-4" style={{ color: "var(--ink-1)" }}>
              Resumo do dia
            </h3>
            <CalorieRing consumed={totalCal} goal={2200} />
            <div className="mt-4 space-y-3">
              <MacroBar label="Proteínas" value={totalProt} goal={130} color="#22c55e" />
              <MacroBar label="Carboidratos" value={totalCarb} goal={250} color="#f59e0b" />
              <MacroBar label="Gorduras" value={totalFat} goal={70} color="#a855f7" />
              <MacroBar label="Fibras" value={totalFiber} goal={25} color="#22c55e" />
            </div>
          </div>

          {/* Insights do dia */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} style={{ color: "#22c55e" }} />
              <h3 className="text-[14px] font-semibold" style={{ color: "var(--ink-1)" }}>
                Insights do dia
              </h3>
            </div>
            <div className="space-y-3">
              <InsightRow
                text={
                  totalProt >= 100
                    ? "Ótima ingestão de proteínas hoje! Continue assim."
                    : "Tente aumentar o consumo de proteínas ao longo do dia."
                }
              />
              <InsightRow
                text={
                  totalCal < 2200
                    ? "Você ainda tem espaço para mais uma refeição nutritiva."
                    : "Você atingiu sua meta calórica diária."
                }
              />
            </div>
          </div>

          {/* Sequência */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Flame size={18} style={{ color: "#f97316" }} />
              <span className="text-[22px] font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--ink-1)" }}>
                18 dias
              </span>
            </div>
            <p className="text-[12px] mb-4" style={{ color: "var(--ink-2)" }}>
              Seguidos no caminho certo
            </p>
            <div className="grid grid-cols-7 gap-1">
              {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[10px]" style={{ color: "var(--ink-3)" }}>{d}</span>
                  <div
                    className="h-6 w-6 rounded-full grid place-items-center text-[10px]"
                    style={{
                      background: i < 5 ? "var(--primary)" : "var(--surface)",
                      color: i < 5 ? "#fff" : "var(--ink-3)",
                    }}
                  >
                    {i < 5 ? "✓" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exportar */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-semibold"
            style={{ color: "var(--ink-2)", border: "1px solid var(--hairline)", background: "var(--card)" }}
          >
            <Download size={14} /> Exportar dados
          </button>
        </div>
      </div>
    </div>
  );
}

function MacroChip({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="text-center">
      <span className="text-[12px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>
        {Number(value ?? 0).toFixed(0)}g
      </span>
      <span className="ml-1 text-[11px]" style={{ color: "var(--ink-3)" }}>
        {label}
      </span>
    </div>
  );
}

function InsightRow({ text }: { text: string }) {
  return (
    <div
      className="flex gap-2 rounded-xl p-3 text-[12px]"
      style={{ background: "var(--surface)", color: "var(--ink-2)" }}
    >
      <span style={{ color: "#22c55e" }}>✦</span>
      <span>{text}</span>
    </div>
  );
}
