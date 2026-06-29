import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PulseCard } from "@/components/aurora/PulseCard";
import { IntentCard } from "@/components/aurora/IntentCard";
import { MachineTile, type MachineTileData } from "@/components/aurora/MachineTile";
import { DiscoveryCard } from "@/components/aurora/DiscoveryCard";
import { useDailyNutrition } from "@/hooks/useDailyNutrition";
import { computeIntent, streakNarrative, todayString } from "@/lib/intent";
import { coachGreeting } from "@/lib/coach";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EasyFood — alimentação inteligente" },
      { name: "description", content: "EasyFood: IA nutricional e refeições saudáveis em máquinas inteligentes." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  // Update hour at most once per minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles")
      .select("full_name,calorie_goal,protein_goal,water_goal_ml,streak_days,onboarding_completed")
      .eq("id", user!.id).maybeSingle()).data,
  });

  useEffect(() => {
    if (profile && (profile as any).onboarding_completed === false) {
      navigate({ to: "/onboarding" });
    }
  }, [profile, navigate]);

  const { data: daily } = useDailyNutrition();

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
    queryFn: async () => (await supabase.from("categories").select("id,name,slug").order("sort_order")).data ?? [],
  });

  const firstName = ((profile as any)?.full_name ?? user?.email ?? "").split(/[\s@]/)[0];
  const calGoal = (profile as any)?.calorie_goal ?? 2000;
  const proteinGoal = (profile as any)?.protein_goal ?? 120;
  const waterGoal = (profile as any)?.water_goal_ml ?? 2500;
  const streak = (profile as any)?.streak_days ?? 0;
  const hour = now.getHours();

  // Derived goals
  const carbsGoal = Math.round((calGoal * 0.45) / 4);
  const fatGoal = Math.round((calGoal * 0.30) / 9);

  const intent = useMemo(() => computeIntent({
    hour,
    calories: daily?.calories ?? 0,
    caloriesGoal: calGoal,
    protein: daily?.protein ?? 0,
    proteinGoal,
    water: daily?.water_ml ?? 0,
    waterGoal,
  }), [hour, daily, calGoal, proteinGoal, waterGoal]);

  const streakLine = streakNarrative(streak);
  const coach = coachGreeting({
    hour, firstName, streak,
    calories: daily?.calories ?? 0, caloriesGoal: calGoal,
    protein: daily?.protein ?? 0, proteinGoal,
    water: daily?.water_ml ?? 0, waterGoal,
  });

  const discoveryCards = useMemo(() => {
    const cards: { eyebrow: string; title: string; image?: string | null; to: string; variant?: "ai" | "default" }[] = [];
    cards.push({ eyebrow: "esta semana",  title: "Mais saudáveis",     image: featured[0]?.image_url, to: "/catalog" });
    cards.push({ eyebrow: "para você",    title: "Alta proteína",      image: featured[1]?.image_url, to: "/catalog",   variant: "ai" });
    cards.push({ eyebrow: "rotina",       title: "Plano semanal IA",   image: featured[2]?.image_url, to: "/meal-plan", variant: "ai" });
    if (categories.length > 0) {
      const first = categories[0];
      cards.push({ eyebrow: first.name.toLowerCase(), title: `Pratos ${first.name}`, image: featured[3]?.image_url, to: "/catalog" });
    }
    return cards;
  }, [featured, categories]);

  if (!user) return null;

  return (
    <AppShell>
      {/* Greeting — Coach voice */}
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

      {/* PULSE CARD — HERO (dominant visual weight) */}
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
        />
      </section>

      {/* INTENT — IA Coach speaking */}
      <section className="mb-4 animate-rise-delayed">
        <IntentCard
          eyebrow={intent.eyebrow}
          title={intent.title}
          description={intent.description}
          primaryAction={intent.primaryAction}
          secondaryAction={intent.secondaryAction}
        />
      </section>

      {/* NEAREST MACHINE — with personality */}
      {nearest && (
        <section className="mb-14 animate-rise-2">
          <MachineTile
            m={{ ...nearest, distance_km: 0.34 }}
            personality
          />
        </section>
      )}

      {/* DISCOVERY */}
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
