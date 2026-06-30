import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock,
  Grid3X3,
  Image as ImageIcon,
  Lightbulb,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  ZapOff,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { analyzeMeal, type NutritionResult } from "@/lib/nutrition.functions";
import { grantAchievement, checkHealthyWeek } from "@/lib/achievements";
import { makeThumbnail } from "@/lib/image";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/nutrition/")({
  head: () => ({ meta: [{ title: "Escaneie sua refeição — EasyFood" }] }),
  component: NutritionPage,
});

const ANALYZING_MESSAGES = [
  "Identificando os alimentos...",
  "Estimando as porções...",
  "Calculando proteínas e carboidratos...",
  "Montando suas dicas personalizadas...",
];

function useAnalyzingMessage(active: boolean) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) { setIdx(0); return; }
    const id = setInterval(() => setIdx((i) => Math.min(i + 1, ANALYZING_MESSAGES.length - 1)), 1400);
    return () => clearInterval(id);
  }, [active]);
  return ANALYZING_MESSAGES[idx];
}

/* ─── corner guides for viewfinder ─────────────────────────────────── */
function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const base: React.CSSProperties = { position: "absolute", width: 28, height: 28 };
  const styles: Record<string, React.CSSProperties> = {
    tl: { ...base, top: 0, left: 0, borderTop: "2.5px solid #fff", borderLeft: "2.5px solid #fff", borderTopLeftRadius: 6 },
    tr: { ...base, top: 0, right: 0, borderTop: "2.5px solid #fff", borderRight: "2.5px solid #fff", borderTopRightRadius: 6 },
    bl: { ...base, bottom: 0, left: 0, borderBottom: "2.5px solid #fff", borderLeft: "2.5px solid #fff", borderBottomLeftRadius: 6 },
    br: { ...base, bottom: 0, right: 0, borderBottom: "2.5px solid #fff", borderRight: "2.5px solid #fff", borderBottomRightRadius: 6 },
  };
  return <div style={styles[pos]} />;
}

/* ─── circular progress for result page ────────────────────────────── */
function CalRing({ pct }: { pct: number }) {
  const r = 56;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="148" height="148" viewBox="0 0 148 148">
      <circle cx="74" cy="74" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
      <circle
        cx="74" cy="74" r={r} fill="none"
        stroke="var(--primary)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}
        style={{ transition: "stroke-dasharray 1s ease" }}
      />
      <text x="74" y="69" textAnchor="middle" fontSize="26" fontWeight="700"
        fontFamily="Space Grotesk, Inter, sans-serif" fill="var(--ink-1)">{pct}%</text>
      <text x="74" y="87" textAnchor="middle" fontSize="10" fill="var(--ink-3)"
        fontFamily="Inter, sans-serif">da meta diária</text>
    </svg>
  );
}

function NutritionPage() {
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<(NutritionResult & { id?: string }) | null>(null);
  const [tab, setTab] = useState<"foto" | "galeria">("foto");
  const [flash, setFlash] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const analyze = useServerFn(analyzeMeal);
  const qc = useQueryClient();
  const analyzingMsg = useAnalyzingMessage(busy);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("profiles").select("calorie_goal").eq("id", user!.id).maybeSingle()).data,
  });
  const calGoal = (profile as { calorie_goal?: number } | null)?.calorie_goal ?? 2000;

  async function onFile(f: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setBusy(true);
      try {
        const thumbnail = await makeThumbnail(dataUrl);
        const r = await analyze({ data: { imageBase64: dataUrl, thumbnail } });
        setResult(r);
        qc.invalidateQueries({ queryKey: ["nutri-history"] });
        qc.invalidateQueries({ queryKey: ["daily-nutrition"] });
        qc.invalidateQueries({ queryKey: ["last-analysis"] });
        const [firstMeal, healthyWeek] = await Promise.all([
          grantAchievement("first_meal"),
          checkHealthyWeek(),
        ]);
        if (firstMeal || healthyWeek) qc.invalidateQueries({ queryKey: ["achievements"] });
        toast.success("Refeição analisada");
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Falha na análise");
      } finally {
        setBusy(false);
      }
    };
    reader.readAsDataURL(f);
  }

  function reset() {
    setPreview(null);
    setResult(null);
    setBusy(false);
  }

  /* ── RESULT VIEW ─────────────────────────────────────────────────── */
  if (result && preview) {
    const calPct = Math.min(100, Math.round(((result.calories ?? 0) / calGoal) * 100));
    const calLeft = Math.max(0, calGoal - (result.calories ?? 0));

    const nutrients = [
      { icon: Target, label: "Alta em proteína", desc: "Ótima para construção e recuperação muscular.", color: "var(--macro-protein)" },
      { icon: ShieldCheck, label: "Rica em fibras", desc: "Ajuda na digestão e promove maior saciedade.", color: "var(--primary)" },
      { icon: Shield, label: "Fonte de vitaminas", desc: "Contém vitamina A, C e do complexo B.", color: "#8B5CF6" },
    ];

    const suggestions = [
      { name: "Salada verde", kcal: 40, desc: "Mais fibras e micronutrientes para sua refeição." },
      { name: "Abacate", kcal: 80, desc: "Gorduras boas que ajudam na saciedade." },
      { name: "Frutas vermelhas", kcal: 60, desc: "Antioxidantes que ajudam na recuperação muscular." },
    ];

    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* LEFT */}
        <div>
          {/* Back header */}
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={reset}
              className="grid h-9 w-9 place-items-center rounded-full transition hover:opacity-80"
              style={{ background: "var(--surface)", color: "var(--ink-2)" }}
            >
              <ArrowLeft size={17} />
            </button>
            <span className="text-[15px] font-semibold" style={{ color: "var(--ink-1)" }}>Resultado da análise</span>
          </div>

          {/* Title */}
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: "var(--primary-soft)" }}>
              <Sparkles size={16} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <h1 className="text-[22px] font-bold" style={{ color: "var(--ink-1)", fontFamily: "var(--font-display)" }}>
                Análise concluída!
              </h1>
              <p className="text-[13px]" style={{ color: "var(--ink-2)" }}>
                Nossa IA analisou sua refeição escaneada.
              </p>
            </div>
          </div>

          {/* Image + macros 2-col */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Image */}
            <div className="relative overflow-hidden rounded-2xl">
              <img src={preview} alt="Refeição" className="h-full w-full object-cover" style={{ minHeight: 240 }} />
              <div
                className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
              >
                <span className="text-[12px] font-semibold text-white">Foto escaneada</span>
                <CheckCircle2 size={14} style={{ color: "#2DAB6B" }} />
              </div>
            </div>

            {/* Info card */}
            <div className="flex flex-col gap-3">
              <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}>
                <h2 className="text-[16px] font-bold leading-tight" style={{ color: "var(--ink-1)", fontFamily: "var(--font-display)" }}>
                  {result.foods.length > 0
                    ? result.foods.map((f) => f.name).join(", ")
                    : "Refeição identificada"}
                </h2>
                {result.foods.length > 0 && (
                  <p className="mt-1 text-[12px]" style={{ color: "var(--ink-3)" }}>
                    Identificamos {result.foods.length} alimentos principais
                  </p>
                )}

                {/* Good choice banner */}
                {result.score != null && result.score >= 6 && (
                  <div
                    className="mt-3 flex items-start gap-2 rounded-xl p-3"
                    style={{ background: "var(--primary-soft)" }}
                  >
                    <Sparkles size={14} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: "var(--primary)" }}>
                        Parece ser uma ótima escolha!
                      </p>
                      <p className="text-[12px]" style={{ color: "var(--ink-2)" }}>
                        Refeição equilibrada, rica em proteínas e carboidratos complexos.
                      </p>
                    </div>
                  </div>
                )}

                {/* Macros summary */}
                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
                    Resumo nutricional
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--ink-3)" }}>Por porção estimada</p>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {[
                      { val: result.calories ?? 0, unit: "kcal", label: "Energia", icon: "🔥" },
                      { val: Math.round(result.protein ?? 0), unit: "g", label: "Proteína", icon: "💚" },
                      { val: Math.round(result.carbs ?? 0), unit: "g", label: "Carboidratos", icon: "🌿" },
                      { val: Math.round(result.fat ?? 0), unit: "g", label: "Gorduras", icon: "💧" },
                    ].map((m, i) => (
                      <div key={i} className="text-center">
                        <div className="text-lg">{m.icon}</div>
                        <p className="text-[16px] font-bold" style={{ color: "var(--ink-1)" }}>
                          {m.val}<span className="text-[10px] font-normal" style={{ color: "var(--ink-3)" }}>{m.unit}</span>
                        </p>
                        <p className="text-[9px]" style={{ color: "var(--ink-3)" }}>{m.label}</p>
                        {result.score != null && (
                          <p className="text-[9px]" style={{ color: "var(--ink-3)" }}>
                            {Math.round((m.val / (i === 0 ? 2000 : i === 1 ? 150 : i === 2 ? 250 : 65)) * 100)}% VD*
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  {result.score != null && (
                    <p className="mt-2 text-[9px]" style={{ color: "var(--ink-3)" }}>
                      * Valores diários com base em uma dieta de 2.000 kcal.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Nutrients badges */}
          <div className="mt-5">
            <p className="mb-3 text-[14px] font-semibold" style={{ color: "var(--ink-1)" }}>
              Principais nutrientes desta refeição
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {nutrients.map(({ icon: Icon, label, desc, color }) => (
                <div
                  key={label}
                  className="flex flex-col gap-2 rounded-2xl p-4"
                  style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
                >
                  <div className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${color}18` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <p className="text-[13px] font-semibold" style={{ color: "var(--ink-1)" }}>{label}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--ink-3)" }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Register CTA */}
          <div
            className="mt-5 flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
            style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
          >
            <div>
              <p className="text-[15px] font-semibold" style={{ color: "var(--ink-1)" }}>
                Deseja registrar esta refeição?
              </p>
              <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
                Ela será adicionada ao seu diário alimentar.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={reset}
                className="rounded-xl px-4 py-2.5 text-[13px] font-semibold transition hover:opacity-80"
                style={{ background: "var(--surface)", color: "var(--ink-2)" }}
              >
                Registrar depois
              </button>
              <Link
                to="/nutrition/history"
                className="rounded-xl px-4 py-2.5 text-[13px] font-semibold transition hover:opacity-90"
                style={{ background: "var(--ink-1)", color: "#fff" }}
              >
                Registrar refeição
              </Link>
            </div>
          </div>

          {/* AI disclaimer */}
          <div
            className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3"
            style={{ background: "var(--surface)" }}
          >
            <ShieldCheck size={16} style={{ color: "var(--ink-3)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="text-[12px] font-semibold" style={{ color: "var(--ink-2)" }}>Análise feita com IA do EasyFood</p>
              <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>
                As informações podem variar de acordo com os ingredientes e preparo.
              </p>
            </div>
            <button className="ml-auto shrink-0 text-[11px] font-semibold" style={{ color: "var(--primary)" }}>
              Saiba mais sobre a análise ⓘ
            </button>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="flex flex-col gap-4">
          {/* Cal ring */}
          <div
            className="rounded-2xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
          >
            <p className="mb-4 text-[13px] font-semibold" style={{ color: "var(--ink-1)" }}>
              Essa refeição representa
            </p>
            <div className="flex items-center gap-4">
              <CalRing pct={calPct} />
              <div>
                <p className="text-[13px] font-semibold leading-snug" style={{ color: "var(--ink-1)" }}>
                  da sua meta diária de calorias
                </p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--ink-3)" }}>
                  Faltam {calLeft} kcal para sua meta de hoje
                </p>
              </div>
            </div>
          </div>

          {/* Dica da IA */}
          {result.ai_suggestions && result.ai_suggestions.length > 0 && (
            <div
              className="rounded-2xl p-4"
              style={{ background: "var(--primary-soft)", border: "1px solid rgba(30,134,84,0.15)" }}
            >
              <div className="mb-2 flex items-center gap-2">
                <Sparkles size={14} style={{ color: "var(--primary)" }} />
                <p className="text-[12px] font-semibold" style={{ color: "var(--primary)" }}>Dica da IA</p>
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-1)" }}>
                {result.ai_suggestions[0]}
              </p>
            </div>
          )}

          {/* Sugestões */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
          >
            <p className="mb-3 text-[13px] font-semibold" style={{ color: "var(--ink-1)" }}>
              Sugestões personalizadas
            </p>
            <div className="flex flex-col gap-3">
              {suggestions.map(({ name, kcal, desc }) => (
                <div key={name} className="flex items-center gap-3">
                  <div
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg"
                    style={{ background: "var(--surface)" }}
                  >
                    🥗
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold" style={{ color: "var(--ink-1)" }}>{name}</p>
                    <p className="text-[11px]" style={{ color: "var(--primary)" }}>+ {kcal} kcal</p>
                    <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>{desc}</p>
                  </div>
                  <button
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full border transition hover:opacity-80"
                    style={{ borderColor: "var(--hairline)", color: "var(--ink-2)" }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>
            <Link
              to="/catalog"
              className="mt-4 flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-[13px] font-semibold transition"
              style={{ background: "var(--surface)", color: "var(--ink-1)" }}
            >
              Ver mais sugestões
              <ChevronRight size={14} style={{ color: "var(--ink-3)" }} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── ANALYZING VIEW ─────────────────────────────────────────────── */
  if (busy) {
    const steps = [
      { label: "Detectando alimentos", done: true },
      { label: "Calculando nutrientes", active: true },
      { label: "Comparando com seu objetivo", done: false },
      { label: "Gerando recomendações", done: false },
    ];
    const stepsDone = steps.filter((s) => s.done).length;
    const pct = Math.round(((stepsDone + 0.5) / steps.length) * 100);

    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* LEFT */}
        <div>
          <h1
            className="mb-2 text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-tight"
            style={{ color: "var(--ink-1)", fontFamily: "var(--font-display)" }}
          >
            Analisando sua refeição...
          </h1>
          <p className="mb-8 text-[14px]" style={{ color: "var(--ink-2)" }}>
            Nossa IA está identificando os nutrientes da sua foto.
          </p>

          {/* Animated leaf ring */}
          <div className="flex justify-center mb-8">
            <div className="relative h-44 w-44">
              <svg className="h-full w-full" viewBox="0 0 176 176">
                <circle cx="88" cy="88" r="76" fill="none" stroke="var(--surface)" strokeWidth="10" />
                <circle
                  cx="88" cy="88" r="76"
                  fill="none" stroke="var(--primary)" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${pct * 4.78} 478`}
                  strokeDashoffset="120"
                  style={{ transition: "stroke-dasharray 1s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="grid h-20 w-20 place-items-center rounded-full"
                  style={{ background: "var(--primary-soft)" }}
                >
                  <span className="text-4xl">🍃</span>
                </div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-6">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full"
                  style={{
                    background: s.done ? "var(--primary)" : s.active ? "var(--primary-soft)" : "var(--surface)",
                  }}
                >
                  {s.done ? (
                    <CheckCircle2 size={14} style={{ color: "#fff" }} strokeWidth={2.5} />
                  ) : s.active ? (
                    <Loader2 size={14} style={{ color: "var(--primary)" }} className="animate-spin" />
                  ) : (
                    <span className="text-[10px] font-bold" style={{ color: "var(--ink-3)" }}>{i + 1}</span>
                  )}
                </div>
                <span
                  className="text-[14px] font-medium"
                  style={{
                    color: s.done ? "var(--ink-1)" : s.active ? "var(--primary)" : "var(--ink-3)",
                    fontWeight: s.active ? 600 : undefined,
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="rounded-full overflow-hidden h-2" style={{ background: "var(--surface)" }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct}%`, background: "var(--primary)" }}
            />
          </div>
          <p className="mt-2 text-[12px]" style={{ color: "var(--ink-3)" }}>
            Análise em andamento... {stepsDone} de {steps.length} etapas concluídas
          </p>
        </div>

        {/* RIGHT sidebar */}
        <div className="flex flex-col gap-4">
          {preview && (
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--hairline)" }}>
              <img src={preview} alt="Sua refeição" className="h-40 w-full object-cover" />
              <div className="p-3" style={{ background: "var(--card)" }}>
                <p className="text-[12px] font-semibold" style={{ color: "var(--ink-1)" }}>Sua refeição</p>
                <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>Foto enviada para análise</p>
              </div>
            </div>
          )}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}>
            <p className="mb-3 text-[13px] font-semibold" style={{ color: "var(--ink-1)" }}>Por que escanear?</p>
            <div className="space-y-3">
              {[
                { icon: "🎯", text: "Veja se a refeição está alinhada ao seu objetivo" },
                { icon: "📊", text: "Macros e calorias calculados automaticamente" },
                { icon: "💡", text: "Receba recomendações personalizadas" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{icon}</span>
                  <p className="text-[12px] leading-relaxed" style={{ color: "var(--ink-2)" }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── SCAN VIEW ───────────────────────────────────────────────────── */
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      {/* LEFT: camera + options */}
      <div>
        <h1
          className="mb-2 text-[clamp(1.8rem,3vw+0.5rem,2.6rem)] font-bold leading-tight"
          style={{ color: "var(--ink-1)", fontFamily: "var(--font-display)" }}
        >
          Escaneie sua refeição
        </h1>
        <p className="mb-6 text-[14px]" style={{ color: "var(--ink-2)" }}>
          Nossa IA vai analisar os nutrientes e te dar recomendações personalizadas em segundos.
        </p>

        {/* Camera viewfinder */}
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{ background: "#1a1a1a", aspectRatio: "4/3" }}
        >
          {/* Preview or empty state */}
          {preview ? (
            <img src={preview} alt="Pré-visualização" className="h-full w-full object-cover" />
          ) : (
            <div
              className="h-full w-full bg-cover bg-center"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80')",
                filter: "brightness(0.7)",
              }}
            />
          )}

          {/* Corner guides */}
          {!preview && (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-52 w-72">
                  <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
                </div>
              </div>
              {/* Center hint */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <div
                  className="rounded-full px-4 py-1.5 text-[12px] font-semibold text-white"
                  style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
                >
                  Centralize a refeição no quadro
                </div>
              </div>
            </>
          )}

          {/* Loading spinner */}
          {busy && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            >
              <div
                className="grid h-14 w-14 place-items-center rounded-full"
                style={{ border: "3px solid var(--primary)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }}
              >
                <Loader2 size={24} className="animate-spin" style={{ color: "var(--primary)" }} />
              </div>
              <p className="text-[13px] font-semibold text-white">{analyzingMsg}</p>
            </div>
          )}

          {/* Bottom controls */}
          <div className="absolute bottom-4 left-0 right-0 flex items-center justify-between px-5">
            {/* Flash toggle */}
            <button
              onClick={() => setFlash((f) => !f)}
              className="grid h-10 w-10 place-items-center rounded-full transition"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", color: flash ? "#FFD700" : "#fff" }}
            >
              {flash ? <Zap size={18} /> : <ZapOff size={18} />}
            </button>

            {/* Foto / Galeria tabs */}
            <div className="flex rounded-full p-1" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}>
              {(["Foto", "Galeria"] as const).map((t) => {
                const active = (t === "Foto" ? "foto" : "galeria") === tab;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t === "Foto" ? "foto" : "galeria")}
                    className="rounded-full px-5 py-1.5 text-[13px] font-semibold transition"
                    style={{ background: active ? "#fff" : "transparent", color: active ? "#111" : "#fff" }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            {/* Rotate */}
            <button
              className="grid h-10 w-10 place-items-center rounded-full transition"
              style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", color: "#fff" }}
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* Hidden inputs */}
        <input ref={fileInput} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        <input ref={galleryInput} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />

        {/* Trigger button */}
        <button
          onClick={() => tab === "foto" ? fileInput.current?.click() : galleryInput.current?.click()}
          disabled={busy}
          className="mt-4 hidden"
        >
          Analisar
        </button>

        {/* Bottom option cards */}
        <p className="mt-6 mb-3 text-[13px]" style={{ color: "var(--ink-2)" }}>
          Ou escolha uma opção abaixo para começar
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: ImageIcon, label: "Minhas fotos", desc: "Escolha da galeria", onClick: () => galleryInput.current?.click() },
            { icon: Clock, label: "Histórico", desc: "Reveja análises anteriores", to: "/nutrition/history" },
            { icon: Scale, label: "Dicas de porções", desc: "Aprenda a estimar porções", to: "/nutrition/history" },
          ].map(({ icon: Icon, label, desc, onClick, to }) => {
            const inner = (
              <div
                className="flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer transition hover:opacity-80"
                style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
                onClick={onClick}
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: "var(--surface)", color: "var(--ink-2)" }}>
                  <Icon size={17} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: "var(--ink-1)" }}>{label}</p>
                  <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>{desc}</p>
                </div>
              </div>
            );
            return to ? <Link key={label} to={to as any}>{inner}</Link> : <div key={label}>{inner}</div>;
          })}
        </div>
      </div>

      {/* RIGHT: features + tips */}
      <div className="flex flex-col gap-5">
        {/* Feature highlight */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
        >
          <div
            className="mb-4 grid h-12 w-12 place-items-center rounded-2xl"
            style={{ background: "var(--primary-soft)" }}
          >
            <Sparkles size={20} style={{ color: "var(--primary)" }} />
          </div>
          <h2
            className="text-[20px] font-bold leading-snug"
            style={{ color: "var(--ink-1)", fontFamily: "var(--font-display)" }}
          >
            A IA do EasyFood identifica os nutrientes e te ajuda a fazer melhores escolhas.
          </h2>
          <div className="mt-5 flex flex-col gap-4">
            {[
              { icon: Grid3X3, label: "Análise nutricional completa", desc: "Calorias, macros e micronutrientes." },
              { icon: Sparkles, label: "Recomendações inteligentes", desc: "Dicas personalizadas para seus objetivos." },
              { icon: TrendingUp, label: "Registro automático", desc: "Salve no seu diário com um toque." },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div
                  className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                  style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                >
                  <Icon size={15} />
                </div>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: "var(--ink-1)" }}>{label}</p>
                  <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips card */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--primary-soft)", border: "1px solid rgba(30,134,84,0.15)" }}
        >
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb size={15} style={{ color: "var(--primary)" }} />
            <p className="text-[13px] font-semibold" style={{ color: "var(--primary)" }}>
              Dicas para uma boa análise
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {["Boa iluminação", "Foto de cima", "Mostre todos os alimentos"].map((tip) => (
              <div key={tip} className="flex items-center gap-2">
                <CheckCircle2 size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
                <p className="text-[13px]" style={{ color: "var(--ink-1)" }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Analyze CTA */}
        <button
          onClick={() => fileInput.current?.click()}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold transition hover:opacity-90 disabled:opacity-60"
          style={{ background: "var(--ink-1)", color: "#fff" }}
        >
          <Camera size={18} />
          {busy ? "Analisando..." : "Analisar refeição"}
        </button>
      </div>
    </div>
  );
}
