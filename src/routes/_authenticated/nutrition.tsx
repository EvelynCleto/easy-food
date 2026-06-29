import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Loader2, RefreshCw, TrendingUp, Upload } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { analyzeMeal, type NutritionResult } from "@/lib/nutrition.functions";
import { IntentCard } from "@/components/aurora/IntentCard";

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
        qc.invalidateQueries({ queryKey: ["daily-nutrition"] });
        qc.invalidateQueries({ queryKey: ["last-analysis"] });
        toast.success("Refeição analisada");
      } catch (e: any) {
        toast.error(e?.message ?? "Falha na análise");
      } finally { setBusy(false); }
    };
    reader.readAsDataURL(f);
  }

  return (
    <div className="animate-rise mx-auto max-w-[920px]">
      <header className="mb-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-eyebrow">análise · IA</p>
          <h1 className="text-display-m mt-3">Refeição</h1>
          <p className="mt-3 text-body-sm" style={{ color: "var(--ink-2)" }}>
            Tire uma foto. A IA identifica os alimentos e calcula nutrientes.
          </p>
        </div>
        <Link to="/nutrition/history" className="btn-secondary hidden h-10 px-5 sm:inline-flex">
          <TrendingUp size={15} /> Histórico
        </Link>
      </header>

      {/* CAPTURE FRAME */}
      <section>
        <div className="card-aurora overflow-hidden">
          <div className="relative aspect-[4/3] sm:aspect-[16/9]" style={{ background: "var(--surface)" }}>
            {preview ? (
              <img src={preview} alt="Refeição" className="plate-photo h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center">
                {/* Capture frame guide */}
                <div className="relative h-48 w-48 sm:h-56 sm:w-56">
                  <CornerGuide pos="tl" />
                  <CornerGuide pos="tr" />
                  <CornerGuide pos="bl" />
                  <CornerGuide pos="br" />
                  <div className="absolute inset-0 grid place-items-center">
                    <Camera size={32} strokeWidth={1.5} style={{ color: "var(--ink-3)" }} />
                  </div>
                </div>
              </div>
            )}
            {busy && (
              <div className="absolute inset-0 grid place-items-center" style={{ background: "color-mix(in srgb, var(--card) 80%, transparent)", backdropFilter: "blur(12px)" }}>
                <div className="text-center">
                  <Loader2 size={28} className="mx-auto animate-spin" style={{ color: "var(--primary)" }} />
                  <p className="mt-3 text-[13px] font-medium" style={{ color: "var(--ink-1)" }}>Analisando...</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 p-5">
            <input ref={fileInput} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <button onClick={() => fileInput.current?.click()} className="btn-primary flex-1">
              {preview ? <RefreshCw size={17} /> : <Upload size={17} />}
              {preview ? "Nova foto" : "Escolher foto"}
            </button>
            {preview && (
              <button onClick={() => { setPreview(null); setResult(null); }}
                className="grid place-items-center rounded-full transition hover:opacity-80"
                style={{ background: "var(--surface)", color: "var(--ink-1)", height: "48px", width: "48px" }}
                aria-label="Limpar">
                <RefreshCw size={17} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* RESULT */}
      {result && (
        <div className="animate-rise-delayed mt-12 space-y-10">
          {/* Score block */}
          {result.score != null && (
            <ScoreBlock score={result.score} mealType={result.meal_type} />
          )}

          {/* Macros */}
          <section>
            <p className="text-eyebrow">macronutrientes</p>
            <h2 className="text-headline mt-3">Composição</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                ["Calorias", result.calories, "kcal"],
                ["Proteína", result.protein, "g"],
                ["Carbos", result.carbs, "g"],
                ["Fibras", result.fiber, "g"],
                ["Gorduras", result.fat, "g"],
              ].map(([k, v, u]) => (
                <div key={k as string} className="card-nested p-5">
                  <p className="text-eyebrow">{k as string}</p>
                  <p className="mt-2 font-display text-[24px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>
                    {v}<span className="ml-1 text-[12px] font-normal" style={{ color: "var(--ink-3)" }}>{u}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Foods */}
          <section>
            <p className="text-eyebrow">identificados</p>
            <h2 className="text-headline mt-3">Alimentos</h2>
            <div className="card-nested mt-6 overflow-hidden">
              {result.foods.map((f, i) => (
                <div key={i} className="flex justify-between px-5 py-4" style={{ borderTop: i > 0 ? "0.5px solid var(--hairline)" : "none" }}>
                  <span className="text-body-sm font-semibold" style={{ color: "var(--ink-1)" }}>{f.name}</span>
                  <span className="text-body-sm" style={{ color: "var(--ink-2)" }}>{f.quantity}</span>
                </div>
              ))}
            </div>
            {result.notes && <p className="mt-4 text-caption italic">{result.notes}</p>}
          </section>

          {/* AI suggestions */}
          {result.ai_suggestions && result.ai_suggestions.length > 0 && (
            <section>
              <p className="text-eyebrow" style={{ color: "var(--ai)" }}>◇ sugestões da IA</p>
              <h2 className="text-headline mt-3">Como melhorar</h2>
              <div className="ai-glow mt-6 space-y-4 p-6 sm:p-7">
                {result.ai_suggestions.map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md mt-0.5" style={{ background: "var(--ai)" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                        <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" />
                      </svg>
                    </div>
                    <p className="flex-1 text-body" style={{ color: "var(--ink-1)" }}>{s}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <IntentCard
            variant="neutral"
            eyebrow="próximo passo"
            title="Mantenha o ritmo da semana"
            description="Veja como sua nutrição está evoluindo ao longo dos dias."
            primaryAction={{ label: "Ver histórico", to: "/nutrition/history" }}
          />
        </div>
      )}
    </div>
  );
}

function ScoreBlock({ score, mealType }: { score: number; mealType?: string }) {
  const color = score >= 7.5 ? "var(--primary)" : score >= 5 ? "var(--warning)" : "var(--destructive)";
  const label = score >= 7.5 ? "Excelente" : score >= 5 ? "Razoável" : "Pode melhorar";
  return (
    <div className="card-aurora flex items-center gap-8 p-7 sm:p-9">
      <div className="relative h-28 w-28 shrink-0">
        <svg width="112" height="112" className="-rotate-90">
          <circle cx="56" cy="56" r="48" strokeWidth="8" stroke="var(--surface-2)" fill="none" />
          <circle
            cx="56" cy="56" r="48" strokeWidth="8" stroke={color}
            strokeLinecap="round" fill="none"
            strokeDasharray={301.6}
            strokeDashoffset={301.6 * (1 - score / 10)}
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-display text-[26px] font-semibold tabular-nums">{score.toFixed(1)}</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-eyebrow">nota nutricional</p>
        <h2 className="text-headline mt-2">{label}</h2>
        {mealType && (
          <p className="mt-1 text-body-sm capitalize" style={{ color: "var(--ink-2)" }}>{mealType}</p>
        )}
      </div>
    </div>
  );
}

function CornerGuide({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const styles: Record<string, React.CSSProperties> = {
    tl: { top: 0, left: 0, borderTop: "2px solid var(--primary)", borderLeft: "2px solid var(--primary)", borderTopLeftRadius: 8 },
    tr: { top: 0, right: 0, borderTop: "2px solid var(--primary)", borderRight: "2px solid var(--primary)", borderTopRightRadius: 8 },
    bl: { bottom: 0, left: 0, borderBottom: "2px solid var(--primary)", borderLeft: "2px solid var(--primary)", borderBottomLeftRadius: 8 },
    br: { bottom: 0, right: 0, borderBottom: "2px solid var(--primary)", borderRight: "2px solid var(--primary)", borderBottomRightRadius: 8 },
  };
  return <div className="absolute h-6 w-6" style={styles[pos]} />;
}
