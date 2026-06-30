import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/catalog")({
  component: CatalogPage,
});

type Sort = "popular" | "rating" | "price_asc" | "price_desc";
type Filters = {
  q: string;
  catId: string | null;
  smartId: string | null;
  goal: string | null;
  maxCal: number;
  minProtein: number;
  maxPrice: number;
  sort: Sort;
};

const GOALS = ["ganho de massa", "emagrecimento", "definição", "saúde geral"];
const DEFAULT: Filters = {
  q: "", catId: null, smartId: null, goal: null,
  maxCal: 1000, minProtein: 0, maxPrice: 100, sort: "popular",
};

type Row = ProductCardData & { category_id: string | null; protein?: number | null };

function CatalogPage() {
  const { user } = useAuth();
  const [f, setF] = useState<Filters>(DEFAULT);
  const [qInput, setQInput] = useState("");
  const [open, setOpen] = useState(false);

  // Debounce the search field so we don't refetch on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setF((p) => (p.q === qInput ? p : { ...p, q: qInput })), 250);
    return () => clearTimeout(id);
  }, [qInput]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("id,name").order("sort_order")).data ?? [],
  });

  const { data: favoriteIds = [] } = useQuery({
    queryKey: ["favorite-ids", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("product_id").eq("user_id", user!.id);
      return (data ?? []).map((d) => d.product_id);
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["catalog", f, favoriteIds],
    queryFn: async () => {
      let q = supabase.from("products").select("id,name,image_url,price,promo_price,calories,protein,rating,category_id,nutrition_goals");
      if (f.q) q = q.ilike("name", `%${f.q}%`);
      if (f.catId) q = q.eq("category_id", f.catId);
      if (f.maxCal < 1000) q = q.lte("calories", f.maxCal);
      if (f.minProtein > 0) q = q.gte("protein", f.minProtein);
      if (f.maxPrice < 100) q = q.lte("price", f.maxPrice);
      if (f.goal) q = q.contains("nutrition_goals", [f.goal]);

      // Smart category filters
      if (f.smartId === "high-protein") q = q.gte("protein", 30);
      if (f.smartId === "low-cal")     q = q.lte("calories", 400);
      if (f.smartId === "favorites" && favoriteIds.length) q = q.in("id", favoriteIds);
      if (f.smartId === "post-workout") q = q.gte("protein", 25).lte("calories", 600);

      switch (f.sort) {
        case "rating": q = q.order("rating", { ascending: false }); break;
        case "price_asc": q = q.order("price", { ascending: true }); break;
        case "price_desc": q = q.order("price", { ascending: false }); break;
        default: q = q.order("sold_count", { ascending: false, nullsFirst: false });
      }
      const { data } = await q.limit(60);
      return (data ?? []) as Row[];
    },
  });

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; reset: () => void }[] = [];
    if (f.q) chips.push({ key: "q", label: `"${f.q}"`, reset: () => { setQInput(""); setF((p) => ({ ...p, q: "" })); } });
    if (f.catId) {
      const c = categories.find((c) => c.id === f.catId);
      chips.push({ key: "cat", label: c?.name ?? "categoria", reset: () => setF((p) => ({ ...p, catId: null })) });
    }
    if (f.goal) chips.push({ key: "goal", label: f.goal, reset: () => setF((p) => ({ ...p, goal: null })) });
    if (f.maxCal < 1000) chips.push({ key: "cal", label: `até ${f.maxCal} kcal`, reset: () => setF((p) => ({ ...p, maxCal: 1000 })) });
    if (f.minProtein > 0) chips.push({ key: "p", label: `${f.minProtein}g+ proteína`, reset: () => setF((p) => ({ ...p, minProtein: 0 })) });
    if (f.maxPrice < 100) chips.push({ key: "price", label: `até R$ ${f.maxPrice}`, reset: () => setF((p) => ({ ...p, maxPrice: 100 })) });
    return chips;
  }, [f, categories]);

  const smartCats = [
    { id: null, label: "Recomendados" },
    { id: "high-protein", label: "Alta proteína" },
    { id: "post-workout", label: "Depois do treino" },
    { id: "low-cal", label: "Refeições leves" },
    ...(favoriteIds.length > 0 ? [{ id: "favorites", label: "Favoritos" }] : []),
  ];

  return (
    <div className="animate-rise">
      <header className="mb-8">
        <p className="text-eyebrow">catálogo</p>
        <h1 className="text-display-m mt-3">Pratos</h1>
        <p className="mt-3 text-body-sm" style={{ color: "var(--ink-2)" }}>
          {isLoading ? "Carregando..." : `${products.length} ${products.length === 1 ? "prato" : "pratos"}`}
        </p>
      </header>

      {/* SEARCH */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-3)" }} />
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Buscar pratos, ingredientes..."
            aria-label="Buscar pratos"
            className="input-aurora pr-5"
            style={{ paddingLeft: "3rem", height: "48px" }}
          />
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-full transition",
            open ? "" : "hover:opacity-80",
          )}
          style={{
            background: open ? "var(--ink-1)" : "var(--surface)",
            color: open ? "var(--card)" : "var(--ink-1)",
          }}
          aria-label="Filtros"
        >
          <SlidersHorizontal size={17} />
        </button>
      </div>

      {/* SMART CATEGORIES (AI) */}
      <div className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {smartCats.map((c) => {
          const active = f.smartId === c.id;
          return (
            <button
              key={c.id ?? "all"}
              onClick={() => setF((p) => ({ ...p, smartId: c.id, catId: null }))}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-[13.5px] font-semibold transition",
                active ? "text-white" : "",
              )}
              style={{
                background: active ? "var(--ink-1)" : "var(--surface)",
                color: active ? "var(--card)" : "var(--ink-2)",
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* TRADITIONAL CATEGORIES */}
      {categories.length > 0 && (
        <div className="no-scrollbar -mx-5 mb-6 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <CatPill active={!f.catId} onClick={() => setF((p) => ({ ...p, catId: null }))}>Todas</CatPill>
          {categories.map((c) => (
            <CatPill key={c.id} active={f.catId === c.id} onClick={() => setF((p) => ({ ...p, catId: c.id, smartId: null }))}>
              {c.name}
            </CatPill>
          ))}
        </div>
      )}

      {/* Active chips */}
      {activeChips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {activeChips.map((c) => (
            <button key={c.key} onClick={c.reset}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition hover:opacity-80"
              style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>
              {c.label} <X size={12} strokeWidth={2.4} />
            </button>
          ))}
          <button onClick={() => { setQInput(""); setF(DEFAULT); }} className="text-[12.5px] font-semibold transition hover:opacity-70" style={{ color: "var(--primary)" }}>
            Limpar tudo
          </button>
        </div>
      )}

      {/* Advanced filters drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 overflow-hidden"
          >
            <div className="card-aurora p-6 sm:p-8">
              <div className="grid gap-6 sm:grid-cols-3">
                <Range label="Calorias máximas" value={f.maxCal} min={100} max={1000} step={50} unit="kcal" onChange={(v) => setF((p) => ({ ...p, maxCal: v }))} />
                <Range label="Proteína mínima" value={f.minProtein} min={0} max={60} step={5} unit="g" onChange={(v) => setF((p) => ({ ...p, minProtein: v }))} />
                <Range label="Preço máximo" value={f.maxPrice} min={10} max={100} step={5} unit="R$" prefix onChange={(v) => setF((p) => ({ ...p, maxPrice: v }))} />
              </div>
              <div className="mt-6">
                <p className="text-eyebrow mb-3">Objetivo</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setF((p) => ({ ...p, goal: null }))}
                    className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition"
                    style={{ background: !f.goal ? "var(--ink-1)" : "var(--surface)", color: !f.goal ? "var(--card)" : "var(--ink-2)" }}>
                    Qualquer
                  </button>
                  {GOALS.map((g) => (
                    <button key={g} onClick={() => setF((p) => ({ ...p, goal: g }))}
                      className="rounded-full px-4 py-1.5 text-[13px] font-semibold capitalize transition"
                      style={{ background: f.goal === g ? "var(--ink-1)" : "var(--surface)", color: f.goal === g ? "var(--card)" : "var(--ink-2)" }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GRID */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="aspect-[4/5] w-full rounded-[20px] shimmer" />
              <div className="mt-3.5 h-4 w-3/4 rounded shimmer" />
              <div className="mt-2 h-4 w-1/2 rounded shimmer" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card-flat grid h-80 place-items-center text-center">
          <div>
            <p className="text-headline">Nada encontrado</p>
            <p className="mt-2 text-body-sm" style={{ color: "var(--ink-2)" }}>Tente ajustar os filtros</p>
            <button onClick={() => { setQInput(""); setF(DEFAULT); }} className="btn-primary mt-6">Limpar filtros</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}

function CatPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 rounded-full px-4 py-2 text-[13.5px] font-semibold transition"
      style={{
        background: active ? "var(--ink-1)" : "var(--surface)",
        color: active ? "var(--card)" : "var(--ink-2)",
      }}
    >
      {children}
    </button>
  );
}

function Range({ label, value, min, max, step, unit, prefix, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit?: string; prefix?: boolean; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-eyebrow">{label}</p>
        <p className="font-display text-[15px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>
          {prefix ? `${unit} ${value}` : `${value} ${unit ?? ""}`}
        </p>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}
