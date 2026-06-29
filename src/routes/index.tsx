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
      {/* Greeting + daily progress */}
      <section className="card-premium mb-6 overflow-hidden p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {greeting} 👋
            </p>
            <h1 className="mt-1 font-display text-xl font-bold leading-tight sm:text-2xl">
              Hoje você está <span className="text-primary">no caminho certo</span>
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-semibold text-warning">
                <Trophy size={12} /> {streak}d streak
              </span>
              <Link
                to="/nutrition"
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
              >
                <Camera size={12} /> Analisar refeição
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4">
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
            color="oklch(0.78 0.16 75)"
          />
          <MetricRing
            value={daily?.water_ml ?? 0}
            max={waterGoal}
            label="Água"
            unit="ml"
            color="oklch(0.6 0.15 250)"
          />
        </div>
        {proteinLeft > 0 && (
          <div className="mt-4 rounded-xl bg-primary/5 px-3 py-2 text-xs">
            <strong>Faltam {proteinLeft.toFixed(0)}g de proteína</strong> para sua meta de hoje. Que tal um <Link to="/catalog" className="text-primary underline">prato proteico</Link>?
          </div>
        )}
      </section>

      <div className="mb-6">
        <XpBar xp={xp} />
      </div>

      <Link to="/meal-plan" className="mb-6 block">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[oklch(0.45_0.18_280)] to-[oklch(0.55_0.2_260)] p-5 text-white transition hover:scale-[1.01]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase opacity-90">
                <Sparkles size={12} /> Novo · IA
              </div>
              <h3 className="mt-1 font-display text-lg font-bold leading-tight">Plano alimentar semanal</h3>
              <p className="mt-1 text-xs opacity-90">A IA cria 7 dias de refeições com pratos das máquinas EasyFood.</p>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <Sparkles size={20} />
            </div>
          </div>
        </div>
      </Link>

      {/* Hero search */}
      <section className="mb-6">
        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-sm ring-1 ring-border/60 focus-within:ring-2 focus-within:ring-primary">
            <Search size={18} className="text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar pratos, ingredientes..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Link
            to="/catalog"
            aria-label="Filtros avançados"
            className="press grid h-12 w-12 place-items-center rounded-2xl bg-foreground text-background shadow-sm transition hover:opacity-90"
          >
            <SlidersHorizontal size={18} />
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Categorias
        </h2>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
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
          subtitle="Selecionado pela IA com base no seu perfil e horário"
        />
        {loadingProducts ? (
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-64 shrink-0">
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
          <div className="no-scrollbar snap-rail -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {aiRecs.map((r) => (
              <RecommendationCard key={r.id} item={r} />
            ))}
          </div>
        )}
      </section>

      {/* Promo banner */}
      <section className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.55_0.18_140)] p-6 text-primary-foreground shadow-md">
        <div className="flex items-center gap-2">
          <Flame size={14} />
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Oferta do dia
          </span>
        </div>
        <h3 className="mt-3 font-display text-2xl font-bold leading-tight">
          20% off em pratos fitness
        </h3>
        <p className="mt-1 text-sm text-primary-foreground/90">
          Use o cupom <strong>FIT20</strong> no checkout.
        </p>
      </section>

      {/* Nearby machines */}
      <section className="mb-6">
        <SectionHeader
          title="Máquinas próximas"
          subtitle={`${machines.length} disponíveis perto de você`}
        />
        {loadingMachines ? (
          <div className="no-scrollbar snap-rail -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <MachineCardSkeleton key={i} />
            ))}
          </div>
        ) : machines.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="Nenhuma máquina encontrada"
            description="Estamos chegando na sua região em breve."
          />
        ) : (
          <div className="no-scrollbar snap-rail -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {machines.map((m) => (
              <MachineCard
                key={m.id}
                m={{ ...m, distance_km: Math.random() * 3 + 0.2 }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mb-6">
          <SectionHeader title="Em destaque" to="/" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* Ver tudo */}
      <section className="mt-2">
        <Link
          to="/catalog"
          className="press flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card py-4 text-sm font-semibold text-primary hover:bg-accent"
        >
          Ver catálogo completo →
        </Link>
      </section>
    </AppShell>
  );
}
