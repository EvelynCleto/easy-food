import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Camera, ChevronLeft, Star, UtensilsCrossed, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Markdown } from "@/components/Markdown";

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

const MEAL_EMOJI: Record<string, string> = {
  "café da manhã": "☀️",
  almoço: "🍽",
  lanche: "🥪",
  jantar: "🌙",
};

function NutritionHistoryPage() {
  const { user } = useAuth();
  const [zoom, setZoom] = useState<string | null>(null);

  const { data: rows = [], isLoading, error } = useQuery({
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

  return (
    <div className="animate-rise mx-auto max-w-[720px]">
      <header className="mb-10 flex items-center gap-4">
        <Link
          to="/nutrition"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full"
          style={{ background: "var(--surface)" }}
        >
          <ChevronLeft size={18} />
        </Link>
        <div>
          <p className="text-eyebrow">nutrição · IA</p>
          <h1 className="text-display-m mt-1">Histórico</h1>
        </div>
      </header>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Erro ao carregar histórico: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && rows.length === 0 && (
        <div className="flex flex-col items-center gap-6 py-20 text-center">
          <div
            className="grid h-20 w-20 place-items-center rounded-3xl"
            style={{ background: "var(--surface)" }}
          >
            <UtensilsCrossed size={32} style={{ color: "var(--ink-3)" }} />
          </div>
          <div>
            <h2 className="text-headline">Nenhuma análise ainda</h2>
            <p className="mt-2 text-body-sm" style={{ color: "var(--ink-2)" }}>
              Você ainda não analisou nenhuma refeição.
            </p>
          </div>
          <Link to="/nutrition" className="btn-primary">
            <Camera size={16} /> Analisar primeira refeição
          </Link>
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-4">
          {rows.map((r) => {
            const date = new Date(r.created_at);
            const mealKey = r.meal_type?.toLowerCase() ?? "";
            const emoji = MEAL_EMOJI[mealKey] ?? "🍽";
            const suggestions = Array.isArray(r.ai_suggestions) ? r.ai_suggestions : [];

            return (
              <div key={r.id} className="card-aurora overflow-hidden p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  {r.image_url ? (
                    <button
                      type="button"
                      onClick={() => setZoom(r.image_url)}
                      className="press h-16 w-16 shrink-0 overflow-hidden rounded-xl"
                      aria-label="Ampliar foto"
                    >
                      <img
                        src={r.image_url}
                        alt="Refeição"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ) : (
                    <div
                      className="grid h-16 w-16 shrink-0 place-items-center rounded-xl text-2xl"
                      style={{ background: "var(--surface)" }}
                    >
                      {emoji}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {r.meal_type && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize"
                          style={{ background: "var(--surface)", color: "var(--ink-2)" }}
                        >
                          {r.meal_type}
                        </span>
                      )}
                      {r.score != null && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                          <Star size={9} fill="currentColor" />
                          {Number(r.score).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {date.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      ·{" "}
                      {date.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-lg font-bold tabular-nums">{r.calories ?? 0}</div>
                    <div className="text-[11px] text-muted-foreground">kcal</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  {(
                    [
                      ["Proteína", r.protein],
                      ["Carbos", r.carbs],
                      ["Gordura", r.fat],
                      ["Fibras", r.fiber],
                    ] as [string, number | null][]
                  ).map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl p-3 text-center"
                      style={{ background: "var(--surface)" }}
                    >
                      <div className="text-[11px] text-muted-foreground">{label}</div>
                      <div className="mt-0.5 text-sm font-bold tabular-nums">
                        {Number(value ?? 0).toFixed(0)}
                        <span className="text-[10px] font-normal text-muted-foreground">g</span>
                      </div>
                    </div>
                  ))}
                </div>

                {r.notes && (
                  <div className="mt-3 text-xs italic" style={{ color: "var(--ink-2)" }}>
                    <Markdown text={r.notes} />
                  </div>
                )}

                {suggestions.length > 0 && (
                  <div
                    className="mt-4 rounded-xl p-4"
                    style={{ background: "var(--surface)" }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--ai)" }}
                    >
                      ◇ Sugestões da IA
                    </p>
                    <ul className="mt-2 space-y-1">
                      {suggestions.map((s, i) => (
                        <li key={i} className="flex gap-2 text-xs" style={{ color: "var(--ink-1)" }}>
                          <span style={{ color: "var(--ai)" }}>·</span>
                          <span className="flex-1"><Markdown text={s} /></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {zoom && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center p-6"
          style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }}
          onClick={() => setZoom(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setZoom(null)}
            className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full"
            style={{ background: "rgba(255,255,255,0.16)", color: "#fff" }}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
          <img
            src={zoom}
            alt="Refeição ampliada"
            className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
