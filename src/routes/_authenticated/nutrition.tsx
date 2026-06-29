import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Loader2, RefreshCw, Save, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { analyzeMeal, type NutritionResult } from "@/lib/nutrition.functions";
import { NutritionCoach } from "@/components/premium/NutritionCoach";

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
        toast.success("Refeição analisada!");
      } catch (e: any) {
        toast.error(e?.message ?? "Falha na análise");
      } finally {
        setBusy(false);
      }
    };
    reader.readAsDataURL(f);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">IA Nutricional</h1>
          <p className="text-sm text-muted-foreground">Tire uma foto da refeição e receba a análise instantânea.</p>
        </div>
        <Link to="/nutrition/dashboard" className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1.5 text-xs font-semibold ring-1 ring-border hover:bg-accent">
          <TrendingUp size={14} /> Dashboard
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl bg-card ring-1 ring-border/60">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-accent/40 to-background">
          {preview ? (
            <img src={preview} alt="Refeição" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-center">
              <div>
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary"><Sparkles size={28} /></div>
                <p className="mt-3 text-sm text-muted-foreground">Faça upload ou tire uma foto</p>
              </div>
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          )}
        </div>
        <div className="flex gap-2 p-3">
          <input ref={fileInput} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <button onClick={() => fileInput.current?.click()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground">
            <Camera size={16} /> {preview ? "Nova foto" : "Abrir câmera"}
          </button>
          {preview && (
            <button onClick={() => { setPreview(null); setResult(null); }} className="grid h-12 w-12 place-items-center rounded-xl border border-input">
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="space-y-3">
          <NutritionCoach score={result.score} suggestions={result.ai_suggestions} mealType={result.meal_type} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[["Calorias",`${result.calories}`,"kcal"],["Proteínas",`${result.protein}`,"g"],["Carboidratos",`${result.carbs}`,"g"],["Fibras",`${result.fiber}`,"g"],["Gorduras",`${result.fat}`,"g"]].map(([k,v,u]) => (
              <div key={k} className="rounded-xl bg-card p-3 text-center ring-1 ring-border/60">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
                <div className="mt-0.5 text-lg font-bold">{v}<span className="text-xs font-normal text-muted-foreground"> {u}</span></div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
            <h2 className="text-sm font-semibold">Alimentos identificados</h2>
            <ul className="mt-2 space-y-1.5 text-sm">
              {result.foods.map((f, i) => (
                <li key={i} className="flex justify-between border-b border-border/40 pb-1.5 last:border-0">
                  <span className="font-medium">{f.name}</span>
                  <span className="text-muted-foreground">{f.quantity}</span>
                </li>
              ))}
            </ul>
            {result.notes && <p className="mt-3 text-xs italic text-muted-foreground">{result.notes}</p>}
          </div>
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground">
            <Save size={16} /> Salvo no histórico
          </button>
        </div>
      )}
    </div>
  );
}