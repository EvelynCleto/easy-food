import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowRight, Camera, ChevronRight, Flame, MapPin, Search, Sparkles, Trophy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
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

type MachineRow = {
  id: string; name: string; address: string;
  status: "online" | "offline" | "maintenance"; stock_level: number;
};

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
    queryFn: async () => (await supabase.from("categories").select("id,name,slug").order("sort_order")).data ?? [],
  });

  const { data: machines = [] } = useQuery({
    queryKey: ["machines"],
    queryFn: async () => (await supabase.from("machines").select("id,name,address,status,stock_level").limit(8)).data as MachineRow[] ?? [],
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
    queryFn: async () => (await supabase.from("profiles")
      .select("full_name,calorie_goal,protein_goal,water_goal_ml,streak_days,xp,onboarding_completed")
      .eq("id", user!.id).maybeSingle()).data,
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
  const streak = (profile as { streak_days?: number } | null)?.streak_days ?? 0;

  const featured = products.filter((p) => p.is_featured);
  const onlineMachines = machines.filter((m) => m.status === "online");

  return (
    <AppShell>
      {/* ───── HERO GREETING ───── */}
      <section className="animate-fade-up mb-10">
        <p className="text-[14px] font-medium text-muted-foreground">
          {greetingFor(firstName)}
        </p>
        <h1 className="text-display mt-1.5 text-foreground">
          {firstName ? `${firstName},` : "Olá,"} pronta para se cuidar?
        </h1>

        {streak > 0 && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-3.5 py-2 text-[13px] font-semibold text-accent-foreground">
            <Trophy size={14} strokeWidth={2.2} />
            {streak} {streak === 1 ? "dia" : "dias"} de sequência
          </div>
        )}
      </section>

      {/* ───── DAILY SUMMARY CARD ───── */}
      <section className="animate-fade-up mb-12">
        <div className="card-base p-6 sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-caption">Resumo de hoje</p>
              <h2 className="text-title-1 mt-1">Sua nutrição diária</h2>
            </div>
            <Link to="/nutrition" className="btn-ghost">
              Detalhes <ArrowRight size={15} />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-6">
            <MetricRing
              value={daily?.calories ?? 0} max={calGoal}
              label="Calorias" unit=" kcal"
              color="var(--color-primary)"
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
        </div>
      </section>

      {/* ───── QUICK ACTIONS ───── */}
      <section className="animate-fade-up mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          to="/nutrition"
          title="Analisar refeição"
          description="Tire uma foto e a IA calcula tudo"
          icon={Camera}
          tint="mint"
        />
        <ActionCard
          to="/meal-plan"
          title="Plano semanal"
          description="7 dias prontos pra sua meta"
          icon={Sparkles}
          tint="lavender"
        />
        <ActionCard
          to="/machines"
          title="Máquinas próximas"
          description={`${onlineMachines.length} disponíveis agora`}
          icon={MapPin}
          tint="amber"
        />
      </section>

      {/* ───── SEARCH ───── */}
      <section className="animate-fade-up mb-8">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar pratos, ingredientes..."
            className="h-14 w-full rounded-full bg-surface text-[16px] text-foreground outline-none transition placeholder:text-muted-foreground focus:bg-card focus:ring-2 focus:ring-primary/20"
            style={{ paddingLeft: "3.25rem", paddingRight: "1.25rem" }}
          />
        </div>
      </section>

      {/* ───── CATEGORIES ───── */}
      <section className="animate-fade-up mb-12">
        <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <CatPill active={!activeCat} onClick={() => setActiveCat(null)}>Todas</CatPill>
          {categories.map((c) => (
            <CatPill key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
              {c.name}
            </CatPill>
          ))}
        </div>
      </section>

      {/* ───── FEATURED ───── */}
      <section className="animate-fade-up mb-14">
        <header className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-title-1">Em destaque</h2>
            <p className="text-caption mt-1">Selecionados para você</p>
          </div>
          <Link to="/catalog" className="btn-ghost">
            Ver tudo <ArrowRight size={15} />
          </Link>
        </header>
        {products.length === 0 ? (
          <div className="card-flat grid h-44 place-items-center">
            <p className="text-body text-muted-foreground">Nenhum prato encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {(featured.length > 0 ? featured : products).slice(0, 8).map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      {/* ───── NEARBY MACHINES ───── */}
      {onlineMachines.length > 0 && (
        <section className="animate-fade-up mb-14">
          <header className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-title-1">Máquinas perto de você</h2>
              <p className="text-caption mt-1">{onlineMachines.length} abertas agora</p>
            </div>
            <Link to="/machines" className="btn-ghost">
              Mapa <ArrowRight size={15} />
            </Link>
          </header>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {onlineMachines.slice(0, 6).map((m) => (
              <MachineMini key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}

      {/* ───── COACH CTA ───── */}
      <section className="animate-fade-up mb-8 overflow-hidden rounded-[28px] bg-foreground p-8 text-background sm:p-12">
        <div className="grid items-center gap-8 sm:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-background/10 px-3 py-1.5 text-[12px] font-medium uppercase tracking-wider text-background/80">
              <Sparkles size={12} strokeWidth={2.2} /> Coach IA
            </div>
            <h2 className="text-display mt-4 text-background">
              Sua nutricionista<br />no bolso.
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-background/65">
              A IA monta seu cardápio semanal usando os pratos das máquinas perto de você.
              Personalizado para sua meta.
            </p>
            <div className="mt-7">
              <Link
                to="/meal-plan"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-background px-7 text-[15px] font-semibold text-foreground transition hover:opacity-90 active:scale-[0.98]"
              >
                Criar meu plano <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          <div className="relative hidden sm:block">
            <div className="absolute right-0 top-1/2 grid h-44 w-44 -translate-y-1/2 place-items-center rounded-full bg-background/8">
              <Sparkles size={64} strokeWidth={1.2} className="text-background/40" />
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function CatPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2.5 text-[13.5px] font-semibold transition-all ${
        active
          ? "bg-foreground text-background"
          : "bg-surface text-foreground/75 hover:bg-surface/60 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ActionCard({
  to, title, description, icon: Icon, tint,
}: {
  to: string;
  title: string;
  description: string;
  icon: typeof Camera;
  tint: "mint" | "amber" | "sky" | "coral" | "lavender";
}) {
  const tintClass = {
    mint: "card-tint-mint",
    amber: "card-tint-amber",
    sky: "card-tint-sky",
    coral: "card-tint-coral",
    lavender: "card-tint-lavender",
  }[tint];

  return (
    <Link
      to={to as any}
      className={`${tintClass} group relative overflow-hidden p-6 transition hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="grid h-12 w-12 place-items-center rounded-[14px] bg-card/60 text-foreground/85">
        <Icon size={22} strokeWidth={1.8} />
      </div>
      <h3 className="text-title-3 mt-5 text-foreground">{title}</h3>
      <p className="mt-1 text-[13.5px] text-foreground/65">{description}</p>
      <ChevronRight
        size={18}
        className="absolute right-5 top-5 text-foreground/30 transition group-hover:translate-x-0.5 group-hover:text-foreground/60"
      />
    </Link>
  );
}

function MachineMini({ m }: { m: MachineRow }) {
  return (
    <Link
      to="/machines/$id"
      params={{ id: m.id }}
      className="group flex items-center gap-3 rounded-2xl bg-surface p-4 transition hover:bg-card hover:shadow-sm"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent">
        <MapPin size={18} strokeWidth={1.8} className="text-accent-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-[14.5px] font-semibold text-foreground">{m.name}</h4>
        <p className="truncate text-[12.5px] text-muted-foreground">{m.address}</p>
      </div>
      <ChevronRight size={17} className="shrink-0 text-muted-foreground/50 transition group-hover:translate-x-0.5" />
    </Link>
  );
}
