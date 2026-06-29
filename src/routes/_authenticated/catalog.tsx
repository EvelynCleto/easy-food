import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/premium/Skeleton";
import { EmptyState } from "@/components/premium/EmptyState";
import { SectionHeader } from "@/components/premium/SectionHeader";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { cn } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/catalog")({
  component: CatalogPage,
});

type Sort = "popular" | "rating" | "price_asc" | "price_desc";
type Filters = {
  q: string;
  catId: string | null;
  goal: string | null;
  maxCal: number;
  minProtein: number;
  maxPrice: number;
  sort: Sort;
};

const GOALS = [
  "ganho de massa",
  "emagrecimento",
  "definição",
  "saúde geral",
];

const DEFAULT: Filters = {
  q: "",
  catId: null,
  goal: null,
  maxCal: 1000,
  minProtein: 0,
  maxPrice: 100,
  sort: "popular",
};

type Row = ProductCardData & {
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  category_id: string | null;
  badges: string[] | null;
  nutrition_goals: string[] | null;
  sold_count: number | null;
};

function CatalogPage() {
  const [f, setF] = useState<Filters>(DEFAULT);
  const [open, setOpen] = useState(false);
  const { ids: recent } = useRecentlyViewed();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,name").order("sort_order");
      return data ?? [];
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["catalog", f],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select(
          "id,name,image_url,price,promo_price,calories,protein,carbs,fat,rating,category_id,badges,nutrition_goals,sold_count",
        );
      if (f.q) q = q.ilike("name", `%${f.q}%`);
      if (f.catId) q = q.eq("category_id", f.catId);
      if (f.maxCal < 1000) q = q.lte("calories", f.maxCal);
      if (f.minProtein > 0) q = q.gte("protein", f.minProtein);
      if (f.maxPrice < 100) q = q.lte("price", f.maxPrice);
      if (f.goal) q = q.contains("nutrition_goals", [f.goal]);
      switch (f.sort) {
        case "rating": q = q.order("rating", { ascending: false }); break;
        case "price_asc": q = q.order("price", { ascending: true }); break;
        case "price_desc": q = q.order("price", { ascending: false }); break;
        default: q = q.order("sold_count", { ascending: false, nullsFirst: false });
      }
      const { data, error } = await q.limit(60);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const { data: recentProducts = [] } = useQuery({
    queryKey: ["recent-products", recent],
    enabled: recent.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,image_url,price,promo_price,calories,rating")
        .in("id", recent);
      // preserve order
      const map = new Map((data ?? []).map((p) => [p.id, p]));
      return recent.map((id) => map.get(id)).filter(Boolean) as ProductCardData[];
    },
  });

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; reset: () => void }[] = [];
    if (f.q) chips.push({ key: "q", label: `"${f.q}"`, reset: () => setF((p) => ({ ...p, q: "" })) });
    if (f.catId) {
      const c = categories.find((c) => c.id === f.catId);
      chips.push({ key: "cat", label: c?.name ?? "categoria", reset: () => setF((p) => ({ ...p, catId: null })) });
    }
    if (f.goal) chips.push({ key: "goal", label: f.goal, reset: () => setF((p) => ({ ...p, goal: null })) });
    if (f.maxCal < 1000) chips.push({ key: "cal", label: `≤ ${f.maxCal} kcal`, reset: () => setF((p) => ({ ...p, maxCal: 1000 })) });
    if (f.minProtein > 0) chips.push({ key: "p", label: `≥ ${f.minProtein}g proteína`, reset: () => setF((p) => ({ ...p, minProtein: 0 })) });
    if (f.maxPrice < 100) chips.push({ key: "price", label: `≤ R$ ${f.maxPrice}`, reset: () => setF((p) => ({ ...p, maxPrice: 100 })) });
    return chips;
  }, [f, categories]);

  return (
    <div>
      <SectionHeader
        title="Catálogo"
        subtitle={isLoading ? "Carregando..." : `${products.length} resultado(s)`}
      />

      <div className="mb-4 flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-sm ring-1 ring-border/60 focus-within:ring-2 focus-within:ring-primary">
          <Search size={18} className="text-muted-foreground" />
          <input
            value={f.q}
            onChange={(e) => setF((p) => ({ ...p, q: e.target.value }))}
            placeholder="Buscar pratos, ingredientes..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="press grid h-12 w-12 place-items-center rounded-2xl bg-foreground text-background shadow-sm transition hover:opacity-90"
          aria-label="Filtros"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Categories pills */}
      <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        <button
          onClick={() => setF((p) => ({ ...p, catId: null }))}
          className={cn(
            "press shrink-0 rounded-full px-4 py-2 text-sm font-medium",
            !f.catId ? "bg-foreground text-background" : "bg-card ring-1 ring-border",
          )}
        >
          Todas
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setF((p) => ({ ...p, catId: c.id }))}
            className={cn(
              "press shrink-0 rounded-full px-4 py-2 text-sm font-medium",
              f.catId === c.id ? "bg-primary text-primary-foreground" : "bg-card ring-1 ring-border",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {activeChips.map((c) => (
            <button
              key={c.key}
              onClick={c.reset}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
            >
              {c.label} <X size={11} />
            </button>
          ))}
        </div>
        <label className="relative inline-flex items-center gap-1 rounded-full bg-card px-3 py-1.5 text-xs font-medium ring-1 ring-border">
          Ordenar:{" "}
          <select
            value={f.sort}
            onChange={(e) => setF((p) => ({ ...p, sort: e.target.value as Sort }))}
            className="bg-transparent text-xs font-semibold outline-none"
          >
            <option value="popular">Popularidade</option>
            <option value="rating">Avaliação</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
          </select>
          <ChevronDown size={14} />
        </label>
      </div>

      {/* Advanced filters drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card-premium mb-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-3">
              <Range label="Calorias máx." value={f.maxCal} min={100} max={1000} step={50} unit="kcal" onChange={(v) => setF((p) => ({ ...p, maxCal: v }))} />
              <Range label="Proteína mín." value={f.minProtein} min={0} max={60} step={5} unit="g" onChange={(v) => setF((p) => ({ ...p, minProtein: v }))} />
              <Range label="Preço máx." value={f.maxPrice} min={10} max={100} step={5} unit="R$" prefix onChange={(v) => setF((p) => ({ ...p, maxPrice: v }))} />
              <div className="sm:col-span-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Objetivo nutricional</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setF((p) => ({ ...p, goal: null }))}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-semibold",
                      !f.goal ? "bg-foreground text-background" : "bg-surface ring-1 ring-border",
                    )}
                  >
                    Qualquer
                  </button>
                  {GOALS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setF((p) => ({ ...p, goal: g }))}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-semibold capitalize",
                        f.goal === g ? "bg-primary text-primary-foreground" : "bg-surface ring-1 ring-border",
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setF(DEFAULT)}
                className="press col-span-full justify-self-end text-xs font-semibold text-primary"
              >
                Limpar tudo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recently viewed */}
      {recentProducts.length > 0 && !f.q && !f.catId && (
        <section className="mb-6">
          <SectionHeader title="Vistos recentemente" />
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {recentProducts.map((p) => (
              <div key={p.id} className="w-44 shrink-0">
                <ProductCard p={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nada por aqui"
          description="Tente ajustar os filtros ou buscar outro termo."
          action={
            <button
              onClick={() => setF(DEFAULT)}
              className="press rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Limpar filtros
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} badges={p.badges ?? undefined} />
          ))}
        </div>
      )}
    </div>
  );
}

function Range({
  label, value, min, max, step, unit, prefix, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  unit?: string; prefix?: boolean; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-bold tabular-nums">
          {prefix ? `${unit} ${value}` : `${value} ${unit ?? ""}`}
        </p>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}