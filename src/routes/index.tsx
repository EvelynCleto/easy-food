import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Camera, Flame, MapPin, Search, SlidersHorizontal, Sparkles, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { MachineCard, type MachineData } from "@/components/MachineCard";
import { MetricRing } from "@/components/premium/MetricRing";
import { SectionHeader } from "@/components/premium/SectionHeader";
import { RecommendationCard } from "@/components/premium/RecommendationCard";
import { EmptyState } from "@/components/premium/EmptyState";
import {
  MachineCardSkeleton,
  ProductCardSkeleton,
} from "@/components/premium/Skeleton";
import { useDailyNutrition } from "@/hooks/useDailyNutrition";
import { buildRecommendations, greetingFor } from "@/lib/recommendations";
import { XpBar } from "@/components/premium/XpBar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EasyFood — refeições saudáveis em máquinas inteligentes" },
      {
        name: "description",
        content:
          "Compre refeições saudáveis em máquinas EasyFood. Fitness, low carb, proteica e vegetariana com retirada em segundos.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,slug,icon")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: machines = [], isLoading: loadingMachines } = useQuery({
    queryKey: ["machines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("machines")
        .select("id,name,address,status,stock_level")
        .limit(8);
      if (error) throw error;
      return data as MachineData[];
    },
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products", activeCat, query],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select(
          "id,name,image_url,price,promo_price,calories,protein,carbs,fat,rating,is_featured,category_id",
        );
      if (activeCat) q = q.eq("category_id", activeCat);
      if (query) q = q.ilike("name", `%${query}%`);
      const { data, error } = await q.limit(20);
      if (error) throw error;
      return data as (ProductCardData & {
        is_featured: boolean;
        protein: number | null;
        carbs: number | null;
        fat: number | null;
      })[];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name,calorie_goal,protein_goal,water_goal_ml,streak_days,xp,onboarding_completed")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile && profile.onboarding_completed === false) {
      navigate({ to: "/onboarding" });
    }
  }, [profile, navigate]);

  const { data: daily } = useDailyNutrition();

  if (!user) return null;

  const featured = products.filter((p) => p.is_featured).slice(0, 6);
  const aiRecs = buildRecommendations(products);

  const greeting = greetingFor(profile?.full_name ?? user.email);
  const calGoal = (profile as { calorie_goal?: number } | null)?.calorie_goal ?? 2000;
  const proteinGoal = (profile as { protein_goal?: number } | null)?.protein_goal ?? 120;
  const waterGoal = (profile as { water_goal_ml?: number } | null)?.water_goal_ml ?? 2500;
  const streak = (profile as { streak_days?: number } | null)?.streak_days ?? 0;
  const xp = (profile as { xp?: number } | null)?.xp ?? 0;
  const proteinNow = daily?.protein ?? 0;
  const proteinLeft = Math.max(0, proteinGoal - proteinNow);

  return (
    <AppShell>
      {/* Layout responsivo: coluna única no mobile, duas colunas no desktop */}
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8 xl:grid-cols-[1fr_380px]">

        {/* Coluna principal */}
        <div>
          {/* Greeting card */}
          <section className="card-premium mb-6 overflow-hidden">
            <div className="flex flex-col gap-5 p-5 sm:p-6 lg:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {greeting}
                  </p>
                  <h1 className="mt-1.5 font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                    Hoje você está{" "}
                    <span className="text-primary">no caminho certo</span>
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/12 px-3 py-1.5 text-xs font-semibold text-warning">
                      <Trophy size={13} /> {streak} dias seguidos
                    </span>
                    <Link
                      to="/nutrition"
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/15"
                    >
                      <Camera size={13} /> Analisar refeição
                    </Link>
                  </div>
                </div>
              </div>

              {/* Metric rings */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6">
                <MetricRing
                  value={daily?.calories ?? 0}
                  max={calGoal}
                  label="Calorias"
                  unit=" kcal"
                />
                <MetricRing
                  value={daily?.protein ?? 0}
                  max={proteinGoal}
                  label="Proteína"
                  unit="g"
                  color="oklch(0.75 0.16 75)"
                />
                <MetricRing
                  value={daily?.water_ml ?? 0}
                  max={waterGoal}
                  label="Água"
                  unit="ml"
                  color="oklch(0.55 0.15 250)"
                />
              </div>

              {proteinLeft > 0 && (
                <div className="rounded-xl bg-primary/6 px-4 py-3 text-sm text-foreground/80">
                  Faltam <strong className="text-foreground">{proteinLeft.toFixed(0)}g de proteína</strong> para sua meta.{" "}
                  <Link to="/catalog" className="font-semibold text-primary hover:underline">
                    Ver pratos proteicos →
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Search */}
          <section className="mb-6">
            <div className="flex gap-3">
              <div className="flex flex-1 items-center gap-3 rounded-2xl bg-card px-4 py-3.5 ring-1 ring-border/60 transition focus-within:ring-2 focus-within:ring-primary/40">
                <Search size={18} className="shrink-0 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar pratos, ingredientes..."
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              <Link
                to="/catalog"
                aria-label="Filtros avançados"
                className="press grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-foreground text-background shadow-sm transition hover:opacity-90"
              >
                <SlidersHorizontal size={17} />
              </Link>
            </div>
          </section>

          {/* Categories */}
          <section className="mb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Categorias
            </p>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              <button
                onClick={() => setActiveCat(null)}
                className={`press shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                  !activeCat
                    ? "bg-foreground text-background"
                    : "bg-card text-foreground ring-1 ring-border hover:bg-accent"
                }`}
              >
                Todas
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={`press shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeCat === c.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground ring-1 ring-border hover:bg-accent"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </section>

          {/* AI Recommendations */}
          <section className="mb-6">
            <SectionHeader
              title="Recomendado pra você"
              subtitle="Selecionado pela IA com base no seu perfil"
            />
            {loadingProducts ? (
              <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-56 shrink-0 sm:w-64">
                    <ProductCardSkeleton />
                  </div>
                ))}
              </div>
            ) : aiRecs.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="Sem recomendações ainda"
                description="Faça seu primeiro pedido e a IA começa a aprender seu gosto."
              />
            ) : (
              <div className="no-scrollbar snap-rail -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-2 xl:grid-cols-3">
                {aiRecs.map((r) => (
                  <RecommendationCard key={r.id} item={r} />
                ))}
              </div>
            )}
          </section>

          {/* Featured products */}
          {featured.length > 0 && (
            <section className="mb-6">
              <SectionHeader title="Em destaque" to="/catalog" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
                {featured.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            </section>
          )}

          <section>
            <Link
              to="/catalog"
              className="press flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card py-4 text-sm font-semibold text-primary transition hover:bg-accent"
            >
              Ver catálogo completo →
            </Link>
          </section>
        </div>

        {/* Coluna lateral (desktop) */}
        <div className="mt-6 space-y-4 lg:mt-0">
          {/* XP */}
          <XpBar xp={xp} />

          {/* Meal plan banner */}
          <Link to="/meal-plan" className="block">
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[oklch(0.38_0.18_280)] to-[oklch(0.48_0.2_260)] p-5 text-white transition hover:opacity-95">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider opacity-80">
                    <Sparkles size={11} /> IA · Novo
                  </div>
                  <h3 className="mt-1.5 font-display text-lg font-bold leading-snug">
                    Plano alimentar semanal
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed opacity-75">
                    7 dias de refeições com pratos EasyFood.
                  </p>
                </div>
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15">
                  <Sparkles size={18} />
                </div>
              </div>
            </div>
          </Link>

          {/* Promo banner */}
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.42_0.17_142)] p-5 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Flame size={13} />
              <span className="text-[11px] font-semibold uppercase tracking-wider opacity-90">
                Oferta do dia
              </span>
            </div>
            <h3 className="mt-2.5 font-display text-xl font-bold leading-tight">
              20% off em pratos fitness
            </h3>
            <p className="mt-1 text-sm opacity-85">
              Cupom <strong>FIT20</strong> no checkout.
            </p>
          </div>

          {/* Nearby machines */}
          <section>
            <SectionHeader
              title="Máquinas próximas"
              subtitle={`${machines.length} disponíveis`}
            />
            {loadingMachines ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <MachineCardSkeleton key={i} />
                ))}
              </div>
            ) : machines.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="Nenhuma máquina"
                description="Em breve na sua região."
              />
            ) : (
              <div className="no-scrollbar snap-rail -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-1 sm:overflow-visible sm:px-0 lg:grid-cols-1">
                {machines.slice(0, 4).map((m) => (
                  <MachineCard
                    key={m.id}
                    m={{ ...m, distance_km: Math.random() * 3 + 0.2 }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
