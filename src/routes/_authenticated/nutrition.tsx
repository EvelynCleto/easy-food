import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Loader2, RefreshCw, Sparkles, TrendingUp, Upload } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { analyzeMeal, type NutritionResult } from "@/lib/nutrition.functions";

export const Route = createFileRoute("/_authenticated/nutrition")({
  component: NutritionPage,
});

function NutritionPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<(NutritionResult & { id?: string }) | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const analyze = useServerFn(analyzeMeal);
  const qc = useQueryClient();

  async function onFile(f: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setBusy(true);
      try {
        const r = await analyze({ data: { imageBase64: dataUrl } });
        setResult(r);
        qc.invalidateQueries({ queryKey: ["nutri-history"] });
        toast.success("Refeição analisada");
      } catch (e: any) {
        toast.error(e?.message ?? "Falha na análise");
      } finally { setBusy(false); }
    };
    reader.readAsDataURL(f);
  }

  const scoreColor =
    result?.score == null ? "var(--color-muted-foreground)"
    : result.score >= 7.5 ? "var(--color-primary)"
    : result.score >= 5 ? "var(--color-warning)"
    : "var(--color-destructive)";

  return (
    <div className="mx-auto max-w-[860px]">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[12px] font-semibold text-accent-foreground">
            <Sparkles size={12} strokeWidth={2.2} /> Coach IA
          </div>
          <h1 className="text-display mt-4">Análise nutricional</h1>
          <p className="mt-3 text-[15px] text-muted-foreground">
            Tire uma foto e a IA identifica os alimentos e calcula nutrientes.
          </p>
        </div>
        <Link to="/nutrition/dashboard" className="btn-secondary hidden h-10 px-5 sm:inline-flex">
          <TrendingUp size={15} /> Histórico
        </Link>
      </header>

      {/* UPLOAD AREA */}
      <section>
        <div className="card-base overflow-hidden">
          <div className="relative aspect-[4/3] bg-surface sm:aspect-[16/9]">
            {preview ? (
              <img src={preview} alt="Refeição" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center">
                <div className="text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent">
                    <Camera size={28} strokeWidth={1.6} className="text-accent-foreground" />
                  </div>
                  <p className="mt-4 text-[14px] text-muted-foreground">Tire ou envie uma foto da sua refeição</p>
                </div>
              </div>
            )}
            {busy && (
              <div className="absolute inset-0 grid place-items-center bg-background/80 backdrop-blur-sm">
                <div className="text-center">
                  <Loader2 size={32} className="mx-auto animate-spin text-primary" />
                  <p className="mt-3 text-[13px] font-medium">Analisando refeição...</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 p-4">
            <input
              ref={fileInput} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
            <button onClick={() => fileInput.current?.click()} className="btn-primary flex-1">
              {preview ? <RefreshCw size={17} /> : <Upload size={17} />}
              {preview ? "Nova foto" : "Escolher foto"}
            </button>
            {preview && (
              <button
                onClick={() => { setPreview(null); setResult(null); }}
                className="grid h-13 w-13 shrink-0 place-items-center rounded-full bg-surface text-foreground transition hover:opacity-80"
                style={{ height: "52px", width: "52px" }}
                aria-label="Limpar"
              >
                <RefreshCw size={17} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* RESULT */}
      {result && (
        <div className="animate-fade-up mt-10 space-y-8">
          {/* Score card */}
          {result.score != null && (
            <div className="card-base flex items-center gap-6 p-6 sm:p-8">
              <div className="relative h-24 w-24 shrink-0">
                <svg width="96" height="96" className="-rotate-90">
                  <circle cx="48" cy="48" r="40" strokeWidth="8" stroke="color-mix(in oklab, var(--color-muted) 75%, transparent)" fill="none" />
                  <circle
                    cx="48" cy="48" r="40" strokeWidth="8" stroke={scoreColor}
                    strokeLinecap="round" fill="none"
                    strokeDasharray={251.3}
                    strokeDashoffset={251.3 * (1 - (result.score / 10))}
                    style={{ transition: "stroke-dashoffset 1s ease-out" }}
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <span className="font-display text-[24px] font-bold tabular-nums">{result.score.toFixed(1)}</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-caption">Nota nutricional</p>
                <h2 className="text-title-2 mt-1">
                  {result.score >= 7.5 ? "Excelente refeição" : result.score >= 5 ? "Refeição razoável" : "Pode melhorar"}
                </h2>
                {result.meal_type && (
                  <p className="mt-1 text-[14px] capitalize text-muted-foreground">{result.meal_type}</p>
                )}
              </div>
            </div>
          )}

          {/* Macros */}
          <div>
            <h2 className="text-title-2 mb-5">Macronutrientes</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                ["Calorias", result.calories, "kcal"],
                ["Proteína", result.protein, "g"],
                ["Carbos", result.carbs, "g"],
                ["Fibras", result.fiber, "g"],
                ["Gorduras", result.fat, "g"],
              ].map(([k, v, u]) => (
                <div key={k as string} className="card-base p-5 text-center">
                  <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">{k}</p>
                  <p className="mt-2 font-display text-[24px] font-bold tabular-nums">{v}</p>
                  <p className="text-[12px] text-muted-foreground">{u}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Foods */}
          <div>
            <h2 className="text-title-2 mb-5">Alimentos identificados</h2>
            <div className="card-base overflow-hidden">
              {result.foods.map((f, i) => (
                <div key={i} className={`flex justify-between px-5 py-3.5 ${i > 0 ? "border-t border-border/40" : ""}`}>
                  <span className="text-[15px] font-medium">{f.name}</span>
                  <span className="text-[14px] text-muted-foreground">{f.quantity}</span>
                </div>
              ))}
            </div>
            {result.notes && <p className="mt-4 text-[13.5px] italic text-muted-foreground">{result.notes}</p>}
          </div>

          {/* Suggestions */}
          {result.ai_suggestions && result.ai_suggestions.length > 0 && (
            <div>
              <h2 className="text-title-2 mb-5">Sugestões do coach</h2>
              <div className="card-tint-mint space-y-4 p-6 sm:p-8">
                {result.ai_suggestions.map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Sparkles size={13} strokeWidth={2.2} />
                    </div>
                    <p className="flex-1 text-[15px] leading-relaxed text-foreground/85">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
