import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Dumbbell, Heart, Salad, Scale, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

type Goal = "emagrecimento" | "manutencao" | "ganho_massa" | "saude";
type Sex = "feminino" | "masculino" | "outro";
type Activity = "sedentario" | "leve" | "moderado" | "intenso";

const RESTRICTIONS = ["Glúten", "Lactose", "Vegano", "Vegetariano", "Sem açúcar", "Low carb"];
const ALLERGIES = ["Amendoim", "Castanhas", "Soja", "Ovos", "Frutos do mar", "Crustáceos"];

function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [activity, setActivity] = useState<Activity | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);

  const steps = ["Sobre você", "Corpo", "Rotina", "Objetivo", "Preferências", "Pronto"];

  function toggle(list: string[], v: string, set: (l: string[]) => void) {
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  }

  async function finish() {
    if (!user) return;
    setBusy(true);
    // BMR (Mifflin-St Jeor) + activity for calorie goal
    const w = Number(weight) || 70;
    const h = Number(height) || 170;
    const a = Number(age) || 30;
    const bmrBase = 10 * w + 6.25 * h - 5 * a;
    const bmr = sex === "feminino" ? bmrBase - 161 : bmrBase + 5;
    const factor = { sedentario: 1.2, leve: 1.375, moderado: 1.55, intenso: 1.725 }[activity ?? "leve"];
    let kcal = Math.round(bmr * factor);
    if (goal === "emagrecimento") kcal -= 400;
    if (goal === "ganho_massa") kcal += 350;
    const proteinG = Math.round(w * (goal === "ganho_massa" ? 2 : 1.6));
    const waterMl = Math.max(1500, Math.round(w * 35));

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name || undefined,
        sex: sex ?? undefined,
        age: typeof age === "number" ? age : undefined,
        weight_kg: w,
        height_cm: h,
        activity_level: activity ?? undefined,
        goal: goal ?? undefined,
        dietary_restrictions: restrictions,
        allergies,
        calorie_goal: kcal,
        protein_goal: proteinG,
        water_goal_ml: waterMl,
        onboarding_completed: true,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    if (typeof weight === "number") {
      await supabase.from("weight_logs").insert({ user_id: user.id, weight_kg: weight });
    }
    // Invalidate profile cache so the onboarding guard in Home sees onboarding_completed: true
    await qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Tudo pronto! Bora começar 🚀");
    navigate({ to: "/" });
  }

  function next() { setStep((s) => Math.min(s + 1, steps.length - 1)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  // Same Mifflin-St Jeor math as finish(), for the "Pronto" preview
  function previewGoals() {
    const w = Number(weight), h = Number(height), a = Number(age);
    if (!w || !h || !a || !activity || !goal) return null;
    const bmrBase = 10 * w + 6.25 * h - 5 * a;
    const bmr = sex === "feminino" ? bmrBase - 161 : bmrBase + 5;
    const factor = { sedentario: 1.2, leve: 1.375, moderado: 1.55, intenso: 1.725 }[activity];
    let kcal = Math.round(bmr * factor);
    if (goal === "emagrecimento") kcal -= 400;
    if (goal === "ganho_massa") kcal += 350;
    const protein = Math.round(w * (goal === "ganho_massa" ? 2 : 1.6));
    return { kcal, protein };
  }
  const preview = previewGoals();

  function validateAndNext() {
    if (step === 0) {
      if (!name.trim()) return toast.error("Informe seu nome");
      if (!sex) return toast.error("Selecione uma opção");
      if (typeof age !== "number" || age < 10 || age > 100) return toast.error("Informe uma idade válida");
    }
    if (step === 1) {
      if (typeof weight !== "number" || weight < 30 || weight > 300) return toast.error("Informe seu peso (kg)");
      if (typeof height !== "number" || height < 100 || height > 230) return toast.error("Informe sua altura (cm)");
    }
    if (step === 2 && !activity) return toast.error("Selecione seu nível de atividade");
    if (step === 3 && !goal) return toast.error("Escolha um objetivo");
    next();
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-primary">EasyFood</div>
        <h1 className="font-display text-2xl font-bold">Vamos te conhecer</h1>
        <p className="text-sm text-muted-foreground">Personalizamos sua experiência com base nas suas metas.</p>
      </div>

      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span>Passo {step + 1} de {steps.length}</span>
        <span>{steps[step]}</span>
      </div>
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}
          className="rounded-3xl bg-card p-5 ring-1 ring-border/60">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">Como podemos te chamar?</h2>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
              <div className="grid grid-cols-3 gap-2">
                {(["feminino", "masculino", "outro"] as Sex[]).map((s) => (
                  <button key={s} onClick={() => setSex(s)}
                    className={`rounded-xl border-2 p-3 text-sm capitalize font-semibold transition ${sex === s ? "border-primary bg-primary text-white shadow-md" : "border-input text-muted-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")} placeholder="Idade" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">Suas medidas</h2>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-muted-foreground">Peso (kg)</span>
                  <input type="number" value={weight} onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : "")} className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Altura (cm)</span>
                  <input type="number" value={height} onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : "")} className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm" />
                </label>
              </div>
              {typeof weight === "number" && typeof height === "number" && height > 0 && (
                <div className="rounded-xl bg-muted/50 p-3 text-sm">
                  IMC estimado: <strong>{(weight / Math.pow(height / 100, 2)).toFixed(1)}</strong>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h2 className="font-display text-xl font-bold">Sua rotina</h2>
              <p className="text-xs text-muted-foreground">Nível de atividade física semanal.</p>
              {([
                { id: "sedentario", label: "Sedentário", desc: "Pouco ou nenhum exercício" },
                { id: "leve", label: "Leve", desc: "1-3 dias por semana" },
                { id: "moderado", label: "Moderado", desc: "3-5 dias por semana" },
                { id: "intenso", label: "Intenso", desc: "6-7 dias por semana" },
              ] as { id: Activity; label: string; desc: string }[]).map((o) => (
                <button key={o.id} onClick={() => setActivity(o.id)} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${activity === o.id ? "border-primary bg-primary/10" : "border-input"}`}>
                  <div>
                    <div className="text-sm font-semibold">{o.label}</div>
                    <div className="text-xs text-muted-foreground">{o.desc}</div>
                  </div>
                  {activity === o.id && <Check size={18} className="text-primary" />}
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h2 className="font-display text-xl font-bold">Seu objetivo</h2>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: "emagrecimento", label: "Emagrecer", icon: TrendingDown },
                  { id: "manutencao", label: "Manter peso", icon: Scale },
                  { id: "ganho_massa", label: "Ganhar massa", icon: Dumbbell },
                  { id: "saude", label: "Mais saúde", icon: Heart },
                ] as { id: Goal; label: string; icon: any }[]).map((o) => (
                  <button key={o.id} onClick={() => setGoal(o.id)} className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition ${goal === o.id ? "border-primary bg-primary/10" : "border-input"}`}>
                    <o.icon size={20} className={goal === o.id ? "text-primary" : "text-muted-foreground"} />
                    <div className="text-sm font-semibold">{o.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-display text-xl font-bold">Preferências</h2>
              <div>
                <div className="mb-2 flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Salad size={12} /> Restrições</div>
                <div className="flex flex-wrap gap-2">
                  {RESTRICTIONS.map((r) => (
                    <button key={r} onClick={() => toggle(restrictions, r, setRestrictions)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${restrictions.includes(r) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-2 text-xs font-semibold text-muted-foreground">Alergias</div>
                <div className="flex flex-wrap gap-2">
                  {ALLERGIES.map((r) => (
                    <button key={r} onClick={() => toggle(allergies, r, setAllergies)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${allergies.includes(r) ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"}`}>{r}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary"><Sparkles size={28} /></div>
              <h2 className="font-display text-2xl font-bold">Pronto{name ? `, ${name}` : ""}!</h2>
              <p className="text-sm text-muted-foreground">Calculamos suas metas com base em Mifflin-St Jeor. Você ajusta quando quiser no perfil.</p>
              <div className="grid grid-cols-3 gap-2 text-left">
                <div className="rounded-2xl bg-primary/10 p-3"><div className="text-[10px] uppercase" style={{ color: "var(--primary)" }}>Calorias/dia</div><div className="font-display text-lg font-bold tabular-nums">{preview ? preview.kcal.toLocaleString("pt-BR") : "—"}</div></div>
                <div className="rounded-2xl bg-primary/10 p-3"><div className="text-[10px] uppercase" style={{ color: "var(--primary)" }}>Proteína/dia</div><div className="font-display text-lg font-bold tabular-nums">{preview ? `${preview.protein}g` : "—"}</div></div>
                {typeof weight === "number" && typeof height === "number" ? (
                  <div className="rounded-2xl p-3" style={{ background: "var(--surface)" }}><div className="text-[10px] uppercase" style={{ color: "var(--ink-3)" }}>IMC</div><div className="font-display text-lg font-bold tabular-nums">{(Number(weight) / Math.pow(Number(height) / 100, 2)).toFixed(1)}</div></div>
                ) : (
                  <div className="rounded-2xl p-3" style={{ background: "var(--surface)" }}><div className="text-[10px] uppercase" style={{ color: "var(--ink-3)" }}>XP</div><div className="font-display text-lg font-bold tabular-nums">+50</div></div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-2">
        {step > 0 && (
          <button onClick={back} className="flex items-center gap-1 rounded-xl border border-input px-4 py-3 text-sm font-semibold">
            <ArrowLeft size={14} /> Voltar
          </button>
        )}
        {step < steps.length - 1 ? (
          <button onClick={validateAndNext} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground">
            Continuar <ArrowRight size={14} />
          </button>
        ) : (
          <button disabled={busy} onClick={finish} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {busy ? "Salvando..." : "Começar"}
          </button>
        )}
      </div>
    </div>
  );
}