import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Crown, ShoppingBag, Sparkles, Utensils, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PulseCard } from "@/components/aurora/PulseCard";
import { IntentCard } from "@/components/aurora/IntentCard";
import { MachineTile, type MachineTileData } from "@/components/aurora/MachineTile";
import { DiscoveryCard } from "@/components/aurora/DiscoveryCard";
import { StreakFlame } from "@/components/premium/StreakFlame";
import { loadSubscription, planById } from "@/lib/subscription";
import { brl } from "@/lib/format";
import { useDailyNutrition } from "@/hooks/useDailyNutrition";
import { computeIntent, streakNarrative, todayString } from "@/lib/intent";
import { coachGreeting } from "@/lib/coach";
import { grantAchievement, syncStreak } from "@/lib/achievements";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EasyFood — alimentação inteligente" },
      { name: "description", content: "EasyFood: IA nutricional e refeições saudáveis em máquinas inteligentes." },
    ],
  }),
  component: HomePage,
});

type LastAnalysis = {
  id: string;
  meal_type: string | null;
  calories: number | null;
  protein: number | null;
  score: number | null;
  created_at: string;
};

type MealPlanMeta = {
  id: string;
  goal: string;
  created_at: string;
};

const MEAL_EMOJI: Record<string, string> = {
  "café da manhã": "☀️",
  almoço: "🍽",
  lanche: "🥪",
  jantar: "🌙",
};

const GOAL_LABEL: Record<string, string> = {
  emagrecimento: "Emagrecimento",
  manutencao: "Manutenção",
  ganho_massa: "Ganho de massa",
  saude: "Saúde",
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)} dias`;
}

function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("profiles")
          .select("full_name,calorie_goal,protein_goal,water_goal_ml,streak_days,onboarding_completed")
          .eq("id", user!.id)
          .maybeSingle()
      ).data,
  });

  useEffect(() => {
    // Only redirect if explicitly false — null/undefined means new user who hasn't done onboarding yet
    if (profile && (profile as { onboarding_completed?: boolean | null }).onboarding_completed === false) {
      navigate({ to: "/onboarding" });
    }
  }, [profile, navigate]);

  const { data: daily } = useDailyNutrition();

  // Fictitious subscription (local-only) — read after mount to avoid SSR mismatch
  const [sub, setSub] = useState<ReturnType<typeof loadSubscription>>(null);
  useEffect(() => { setSub(loadSubscription()); }, []);
  const subPlan = sub ? planById(sub.planId) : null;

  const { data: nearest } = useQuery({
    queryKey: ["nearest-machine"],
    queryFn: async () => {
      const { data } = await supabase
        .from("machines")
        .select("id,name,address,status,stock_level,temperature_c,opens_at,closes_at,latitude,longitude")
        .eq("status", "online")
        .limit(1)
        .single();
      return data as (MachineTileData & { latitude: number | null; longitude: number | null }) | null;
    },
  });

  const { data: featured = [] } = useQuery({
    queryKey: ["discover"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,image_url,category_id,nutrition_goals")
        .order("sold_count", { ascending: false, nullsFirst: false })
        .limit(8);
      return data ?? [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-light"],
    queryFn: async () =>
      (await supabase.from("categories").select("id,name,slug").order("sort_order")).data ?? [],
  });

  const { data: lastAnalysis } = useQuery({
    queryKey: ["last-analysis", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("nutritional_analysis")
        .select("id,meal_type,calories,protein,score,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as LastAnalysis | null;
    },
  });

  const { data: mealPlanMeta } = useQuery({
    queryKey: ["meal-plan-meta", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("meal_plans")
        .select("id,goal,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as MealPlanMeta | null;
    },
  });

  const firstName = (
    (profile as { full_name?: string } | null)?.full_name ??
    user?.email ??
    ""
  ).split(/[\s@]/)[0];
  const calGoal = (profile as { calorie_goal?: number } | null)?.calorie_goal ?? 2000;
  const proteinGoal = (profile as { protein_goal?: number } | null)?.protein_goal ?? 120;
  const waterGoal = (profile as { water_goal_ml?: number } | null)?.water_goal_ml ?? 2500;
  const streak = (profile as { streak_days?: number } | null)?.streak_days ?? 0;
  const hour = now.getHours();

  const carbsGoal = Math.round((calGoal * 0.45) / 4);
  const fatGoal = Math.round((calGoal * 0.3) / 9);

  const qc = useQueryClient();
  const logWater = useMutation({
    mutationFn: async (ml: number) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("water_logs").insert({
        user_id: user.id,
        amount_ml: ml,
        logged_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
      return ml;
    },
    onSuccess: (ml) => {
      qc.invalidateQueries({ queryKey: ["water-today"] });
      qc.invalidateQueries({ queryKey: ["daily-nutrition"] });
      toast.success(`+${ml}ml registrado 💧`);
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  // Update the consecutive-day streak (and streak achievements) once per app open.
  useEffect(() => {
    if (!user) return;
    syncStreak().then((s) => {
      if (s != null) {
        qc.invalidateQueries({ queryKey: ["profile"] });
        qc.invalidateQueries({ queryKey: ["achievements"] });
      }
    });
  }, [user, qc]);

  // Grant daily-goal achievements when the user crosses their water / protein goals.
  useEffect(() => {
    if (!user || !daily) return;
    const checks: Promise<boolean>[] = [];
    if (daily.water_ml >= waterGoal) checks.push(grantAchievement("water_goal"));
    if (daily.protein >= proteinGoal) checks.push(grantAchievement("protein_goal"));
    if (checks.length === 0) return;
    Promise.all(checks).then((res) => {
      if (res.some(Boolean)) qc.invalidateQueries({ queryKey: ["achievements"] });
    });
  }, [user, daily, waterGoal, proteinGoal, qc]);

  const rawIntent = useMemo(
    () =>
      computeIntent({
        hour,
        calories: daily?.calories ?? 0,
        caloriesGoal: calGoal,
        protein: daily?.protein ?? 0,
        proteinGoal,
        water: daily?.water_ml ?? 0,
        waterGoal,
      }),
    [hour, daily, calGoal, proteinGoal, waterGoal],
  );

  // Replace navigation with direct action for water intent
  const intent = useMemo(() => {
    if (!rawIntent.isWaterIntent) return rawIntent;
    return {
      ...rawIntent,
      primaryAction: {
        label: rawIntent.primaryAction.label,
        onClick: () => logWater.mutate(250),
      },
    };
  }, [rawIntent, logWater]);

  const streakLine = streakNarrative(streak);
  const coach = coachGreeting({
    hour,
    firstName,
    streak,
    calories: daily?.calories ?? 0,
    caloriesGoal: calGoal,
    protein: daily?.protein ?? 0,
    proteinGoal,
    water: daily?.water_ml ?? 0,
    waterGoal,
  });

  const discoveryCards = useMemo(() => {
    const cards: {
      eyebrow: string;
      title: string;
      image?: string | null;
      to: string;
      variant?: "ai" | "default";
    }[] = [];
    cards.push({ eyebrow: "esta semana", title: "Mais saudáveis", image: featured[0]?.image_url, to: "/catalog" });
    cards.push({ eyebrow: "para você", title: "Alta proteína", image: featured[1]?.image_url, to: "/catalog", variant: "ai" });
    cards.push({ eyebrow: "rotina", title: "Plano semanal IA", image: featured[2]?.image_url, to: "/meal-plan", variant: "ai" });
    if (categories.length > 0) {
      const first = categories[0];
      cards.push({
        eyebrow: first.name.toLowerCase(),
        title: `Pratos ${first.name}`,
        image: featured[3]?.image_url,
        to: "/catalog",
      });
    }
    return cards;
  }, [featured, categories]);

  if (!user) return null;

  return (
    <AppShell>
      {/* 1. Saudação */}
      <header className="animate-rise mb-8 sm:mb-10">
        <p className="text-eyebrow">{todayString(now)}</p>
        <h1 className="text-display-m mt-3" style={{ color: "var(--ink-1)" }}>
          <span style={{ color: "var(--ink-2)" }}>{coach.lead}</span>
          {coach.name && (
            <>
              <br />
              <span style={{ color: "var(--ink-1)" }}>{coach.name}</span>
            </>
          )}
        </h1>
      </header>

      {/* Streak */}
      <section className="animate-rise mb-6">
        <StreakFlame streak={streak} />
      </section>

      {/* 2. PulseCard */}
      <section className="mb-8">
        <PulseCard
          date={`${todayString(now)}${streakLine ? ` · ${streakLine}` : ""}`}
          calories={Math.round(daily?.calories ?? 0)}
          caloriesGoal={calGoal}
          protein={Math.round(daily?.protein ?? 0)}
          proteinGoal={proteinGoal}
          carbs={Math.round(daily?.carbs ?? 0)}
          carbsGoal={carbsGoal}
          fat={Math.round(daily?.fat ?? 0)}
          fatGoal={fatGoal}
          water={daily?.water_ml ?? 0}
          waterGoal={waterGoal}
          onAddWater={(ml) => logWater.mutate(ml)}
        />
      </section>

      {/* 4. Última análise IA */}
      <section className="mb-8 animate-rise-delayed">
        {lastAnalysis ? (
          <Link to="/nutrition/history" className="card-aurora block p-5 transition hover:opacity-90 active:scale-[0.99]">
            <div className="flex items-center justify-between">
              <p className="text-eyebrow">última análise IA</p>
              <span className="text-[11px] font-semibold" style={{ color: "var(--primary)" }}>
                Ver histórico →
              </span>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-xl"
                style={{ background: "var(--surface)" }}
              >
                {MEAL_EMOJI[lastAnalysis.meal_type?.toLowerCase() ?? ""] ?? "🍽"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {lastAnalysis.meal_type && (
                    <span className="text-sm font-semibold capitalize">{lastAnalysis.meal_type}</span>
                  )}
                  {lastAnalysis.score != null && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                      Nota {Number(lastAnalysis.score).toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{lastAnalysis.calories ?? 0} kcal</span>
                  <span>{Number(lastAnalysis.protein ?? 0).toFixed(0)}g proteína</span>
                  <span>{timeAgo(lastAnalysis.created_at)}</span>
                </div>
              </div>
              <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
            </div>
          </Link>
        ) : (
          <div className="card-aurora flex items-center justify-between p-5">
            <div>
              <p className="text-eyebrow">análise IA</p>
              <p className="mt-1 text-sm font-semibold" style={{ color: "var(--ink-1)" }}>
                Nenhuma análise ainda
              </p>
            </div>
            <Link to="/nutrition" className="btn-primary shrink-0 text-sm">
              Analisar agora
            </Link>
          </div>
        )}
      </section>

      {/* 5. IntentCard */}
      <section className="mb-8 animate-rise-delayed">
        <IntentCard
          eyebrow={intent.eyebrow}
          title={intent.title}
          description={intent.description}
          primaryAction={intent.primaryAction}
          secondaryAction={intent.secondaryAction}
        />
      </section>

      {/* 6. Plano Alimentar IA */}
      <section className="mb-8 animate-rise-2">
        <div
          className="card-aurora overflow-hidden p-5"
          style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--ai) 8%, var(--card)), var(--card))" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl"
                style={{ background: "color-mix(in srgb, var(--ai) 12%, var(--surface))" }}
              >
                🥗
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ai)" }}>
                  ◇ IA
                </p>
                <p className="text-[15px] font-bold" style={{ color: "var(--ink-1)" }}>
                  Plano Alimentar
                </p>
              </div>
            </div>
            <Link
              to="/meal-plan"
              className="shrink-0 rounded-xl px-4 py-2 text-[13px] font-semibold transition"
              style={{ background: "var(--ai)", color: "#fff" }}
            >
              {mealPlanMeta ? "Ver plano" : "Criar plano"}
            </Link>
          </div>
          {mealPlanMeta ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Objetivo: <strong style={{ color: "var(--ink-1)" }}>{GOAL_LABEL[mealPlanMeta.goal] ?? mealPlanMeta.goal}</strong>
              {" · "}Última atualização{" "}
              {new Date(mealPlanMeta.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </p>
          ) : (
            <p className="mt-3 text-xs" style={{ color: "var(--ink-2)" }}>
              A IA monta um plano alimentar personalizado para sua meta.
            </p>
          )}
        </div>
      </section>

      {/* Assinatura */}
      <section className="mb-8 animate-rise-2">
        {subPlan ? (
          <Link to="/subscribe" className="card-aurora flex items-center gap-4 p-5 transition hover:opacity-90 active:scale-[0.99]" style={{ background: "linear-gradient(135deg, var(--accent), var(--card))" }}>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              <Crown size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--primary)" }}>plano ativo</p>
              <p className="text-[15px] font-bold" style={{ color: "var(--ink-1)" }}>EasyFood {subPlan.name}</p>
              <p className="text-caption">{subPlan.mealsPerWeek} refeições/semana · {brl(subPlan.weekly)}/sem · renova automático</p>
            </div>
            <ChevronRight size={16} style={{ color: "var(--ink-3)" }} />
          </Link>
        ) : (
          <Link to="/subscribe" className="card-aurora flex items-center gap-4 p-5 transition hover:opacity-90 active:scale-[0.99]">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: "var(--surface)", color: "var(--primary)" }}>
              <Crown size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold" style={{ color: "var(--ink-1)" }}>Assine e economize até 23%</p>
              <p className="text-caption">Marmita toda semana nas máquinas, sem pensar.</p>
            </div>
            <span className="shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>Ver planos</span>
          </Link>
        )}
      </section>

      {/* 7. Acesso rápido */}
      <section className="mb-8 animate-rise-2">
        <h2 className="text-headline mb-4">⚡ Acesso rápido</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            { icon: <Utensils size={20} />, label: "Analisar", to: "/nutrition/" },
            { icon: <Sparkles size={20} />, label: "Coach IA", to: "/nutrition/coach" },
            { icon: "🥗", label: "Plano", to: "/meal-plan", isEmoji: true },
            { icon: <ShoppingBag size={20} />, label: "Catálogo", to: "/catalog" },
          ].map(({ icon, label, to, isEmoji }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col items-center gap-2 rounded-2xl py-4 transition hover:opacity-80 active:scale-95"
              style={{ background: "var(--surface)" }}
            >
              <div
                className="grid h-10 w-10 place-items-center rounded-xl"
                style={{ background: "var(--card)", color: "var(--primary)" }}
              >
                {isEmoji ? <span className="text-xl">{icon as string}</span> : icon}
              </div>
              <span className="text-[11px] font-semibold" style={{ color: "var(--ink-2)" }}>
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. Nearest Machine */}
      {nearest && (
        <section className="mb-14 animate-rise-2">
          <MachineTile m={{ ...nearest, distance_km: 0.34 }} personality />
        </section>
      )}

      {/* 9. Discovery */}
      <section className="mb-12 animate-rise-2">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-headline">Vale descobrir</h2>
          <Link to="/catalog" className="btn-ghost">
            Ver tudo →
          </Link>
        </div>

        <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {discoveryCards.map((d, i) => (
            <DiscoveryCard key={i} {...d} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
