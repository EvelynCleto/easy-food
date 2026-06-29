import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Camera, Loader2, RefreshCw } from "lucide-react";
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

  return (
    <div className="mx-auto max-w-[760px]">
      <h1 className="text-display">Análise nutricional</h1>
      <p className="mt-3 text-body-lg text-muted-foreground">
        Tire uma foto da sua refeição. Identificamos os alimentos e calculamos os nutrientes.
      </p>

      <div className="mt-12">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-surface">
          {preview ? (
            <img src={preview} alt="Refeição" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center">
              <Camera size={40} strokeWidth={1.5} className="text-muted-foreground/50" />
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <input ref={fileInput} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <button onClick={() => fileInput.current?.click()} className="btn-primary flex-1">
            <Camera size={17} /> {preview ? "Nova foto" : "Tirar foto"}
          </button>
          {preview && (
            <button onClick={() => { setPreview(null); setResult(null); }}
              className="grid h-12 w-12 place-items-center rounded-full bg-surface text-foreground transition hover:opacity-80">
              <RefreshCw size={17} />
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-16">
          <h2 className="text-title-1">Resultado</h2>

          <div className="mt-8 divide-y divide-border/60 border-y border-border/60">
            {[
              ["Calorias", `${result.calories} kcal`],
              ["Proteínas", `${result.protein} g`],
              ["Carboidratos", `${result.carbs} g`],
              ["Fibras", `${result.fiber} g`],
              ["Gorduras", `${result.fat} g`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-4">
                <span className="text-[15px] text-muted-foreground">{k}</span>
                <span className="text-[15px] font-medium tabular-nums">{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <h2 className="text-title-1">Alimentos identificados</h2>
            <div className="mt-8 divide-y divide-border/60 border-y border-border/60">
              {result.foods.map((f, i) => (
                <div key={i} className="flex justify-between py-3">
                  <span className="text-[15px] font-medium">{f.name}</span>
                  <span className="text-[14px] text-muted-foreground">{f.quantity}</span>
                </div>
              ))}
            </div>
            {result.notes && <p className="mt-6 text-[14px] italic text-muted-foreground">{result.notes}</p>}
          </div>

          {result.ai_suggestions && result.ai_suggestions.length > 0 && (
            <div className="mt-16">
              <h2 className="text-title-1">Sugestões</h2>
              <ul className="mt-6 space-y-3">
                {result.ai_suggestions.map((s, i) => (
                  <li key={i} className="text-body-lg leading-relaxed text-foreground/80">{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
