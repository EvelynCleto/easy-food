import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { MachineCard, type MachineData } from "@/components/MachineCard";
import { MetricRing } from "@/components/premium/MetricRing";
import { useDailyNutrition } from "@/hooks/useDailyNutrition";
import { greetingFor } from "@/lib/recommendations";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EasyFood — refeições saudáveis em máquinas inteligentes" },
      { name: "description", content: "Compre refeições saudáveis em máquinas EasyFood." },
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
      const { data } = await supabase.from("categories").select("id,name,slug").order("sort_order");
      return data ?? [];
    },
  });

  const { data: machines = [] } = useQuery({
    queryKey: ["machines"],
    queryFn: async () => {
      const { data } = await supabase.from("machines").select("id,name,address,status,stock_level").limit(6);
      return (data ?? []) as MachineData[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products", activeCat, query],
    queryFn: async () => {
      let q = supabase.from("products").select("id,name,image_url,price,promo_price,calories,rating,is_featured,category_id");
      if (activeCat) q = q.eq("category_id", activeCat);
      if (query) q = q.ilike("name", `%${query}%`);
      const { data } = await q.limit(24);
      return (data ?? []) as (ProductCardData & { is_featured: boolean })[];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles")
        .select("full_name,calorie_goal,protein_goal,water_goal_ml,onboarding_completed")
        .eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (profile && profile.onboarding_completed === false) navigate({ to: "/onboarding" });
  }, [profile, navigate]);

  const { data: daily } = useDailyNutrition();

  if (!user) return null;

  const firstName = (profile?.full_name ?? user.email ?? "").split(/[\s@]/)[0];
  const calGoal = (profile as { calorie_goal?: number } | null)?.calorie_goal ?? 2000;
  const proteinGoal = (profile as { protein_goal?: number } | null)?.protein_goal ?? 120;
  const waterGoal = (profile as { water_goal_ml?: number } | null)?.water_goal_ml ?? 2500;

  return (
    <AppShell>
      {/* HERO */}
      <section className="mb-16 lg:mb-24">
        <p className="text-[13px] font-medium text-muted-foreground">
          {greetingFor(firstName)}
        </p>
        <h1 className="text-hero mt-2 text-foreground">
          Coma melhor.<br />
          <span className="text-muted-foreground">Viva mais leve.</span>
        </h1>
        <p className="mt-6 max-w-xl text-body-lg text-muted-foreground">
          Refeições saudáveis prontas em máquinas inteligentes perto de você.
          Análise nutricional com IA. Tudo em segundos.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/catalog" className="btn-primary">Ver pratos</Link>
          <Link to="/machines" className="btn-secondary">Encontrar máquina</Link>
        </div>
      </section>

      {/* DAILY PROGRESS */}
      <section className="mb-16 lg:mb-24">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-title-1">Seu dia</h2>
            <p className="text-caption mt-1">Progresso nutricional de hoje</p>
          </div>
          <Link to="/nutrition" className="btn-ghost">
            Analisar refeição →
          </Link>
        </header>
        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          <MetricRing
            value={daily?.calories ?? 0} max={calGoal}
            label="Calorias" unit=" kcal"
          />
          <MetricRing
            value={daily?.protein ?? 0} max={proteinGoal}
            label="Proteína" unit="g"
            color="var(--color-warning)"
          />
          <MetricRing
            value={daily?.water_ml ?? 0} max={waterGoal}
            label="Água" unit="ml"
            color="var(--color-chart-3)"
          />
        </div>
      </section>

      {/* SEARCH */}
      <section className="mb-12">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pratos, ingredientes..."
            className="h-14 w-full rounded-2xl bg-surface pl-14 pr-5 text-[17px] text-foreground outline-none transition placeholder:text-muted-foreground focus:bg-card focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mb-16">
        <h2 className="text-title-2 mb-5">Categorias</h2>
        <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <CatPill active={!activeCat} onClick={() => setActiveCat(null)}>Todas</CatPill>
          {categories.map((c) => (
            <CatPill key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
              {c.name}
            </CatPill>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="mb-16 lg:mb-24">
        <header className="mb-8 flex items-end justify-between">
          <h2 className="text-title-1">Em destaque</h2>
          <Link to="/catalog" className="btn-ghost">Ver tudo →</Link>
        </header>
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {products.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* MACHINES */}
      <section className="mb-16 lg:mb-24">
        <header className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-title-1">Máquinas próximas</h2>
            <p className="text-caption mt-1">{machines.length} disponíveis</p>
          </div>
          <Link to="/machines" className="btn-ghost">Ver mapa →</Link>
        </header>
        <div className="divide-y divide-border/60 border-y border-border/60">
          {machines.slice(0, 5).map((m) => (
            <MachineCard key={m.id} m={{ ...m, distance_km: Math.random() * 3 + 0.2 }} />
          ))}
        </div>
      </section>

      {/* MEAL PLAN CTA */}
      <section className="mb-16 overflow-hidden rounded-3xl bg-foreground py-16 text-center text-background lg:py-24">
        <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-background/60">Inteligência</p>
        <h2 className="text-display mt-4">
          Seu plano alimentar,<br />feito por IA.
        </h2>
        <p className="mx-auto mt-6 max-w-md px-6 text-body-lg text-background/70">
          7 dias de refeições escolhidas pra sua meta, com pratos disponíveis nas máquinas.
        </p>
        <div className="mt-8">
          <Link
            to="/meal-plan"
            className="inline-flex h-12 items-center justify-center rounded-full bg-background px-8 text-[15px] font-semibold text-foreground transition hover:opacity-90"
          >
            Criar plano
          </Link>
        </div>
      </section>
    </AppShell>
  );
}

function CatPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-medium transition ${
        active
          ? "bg-foreground text-background"
          : "bg-surface text-foreground/80 hover:bg-surface/70 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
