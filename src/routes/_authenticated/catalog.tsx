import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
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

const GOALS = ["ganho de massa", "emagrecimento", "definição", "saúde geral"];
const DEFAULT: Filters = { q: "", catId: null, goal: null, maxCal: 1000, minProtein: 0, maxPrice: 100, sort: "popular" };
type Row = ProductCardData & { category_id: string | null };

function CatalogPage() {
  const [f, setF] = useState<Filters>(DEFAULT);
  const [open, setOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("id,name").order("sort_order")).data ?? [],
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["catalog", f],
    queryFn: async () => {
      let q = supabase.from("products").select("id,name,image_url,price,promo_price,calories,rating,category_id");
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
      const { data } = await q.limit(60);
      return (data ?? []) as Row[];
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
    if (f.maxCal < 1000) chips.push({ key: "cal", label: `até ${f.maxCal} kcal`, reset: () => setF((p) => ({ ...p, maxCal: 1000 })) });
    if (f.minProtein > 0) chips.push({ key: "p", label: `${f.minProtein}g+ proteína`, reset: () => setF((p) => ({ ...p, minProtein: 0 })) });
    if (f.maxPrice < 100) chips.push({ key: "price", label: `até R$ ${f.maxPrice}`, reset: () => setF((p) => ({ ...p, maxPrice: 100 })) });
    return chips;
  }, [f, categories]);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-display">Catálogo</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {isLoading ? "Carregando..." : `${products.length} pratos disponíveis`}
        </p>
      </header>

      {/* Search + Filter button */}
      <div className="mb-5 flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={f.q}
            onChange={(e) => setF((p) => ({ ...p, q: e.target.value }))}
            placeholder="Buscar pratos, ingredientes..."
            className="h-13 w-full rounded-full bg-surface text-[15px] outline-none placeholder:text-muted-foreground focus:bg-card focus:ring-2 focus:ring-primary/20"
            style={{ paddingLeft: "3.25rem", paddingRight: "1.25rem", height: "52px" }}
          />
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "grid h-13 w-13 shrink-0 place-items-center rounded-full transition",
            open ? "bg-foreground text-background" : "bg-surface text-foreground hover:opacity-80",
          )}
          style={{ height: "52px", width: "52px" }}
          aria-label="Filtros"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Sort + Categories */}
      <div className="no-scrollbar mb-3 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <button
          onClick={() => setF((p) => ({ ...p, catId: null }))}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-[13.5px] font-semibold transition",
            !f.catId ? "bg-foreground text-background" : "bg-surface text-foreground/75 hover:text-foreground",
          )}
        >Todas</button>
        {categories.map((c) => (
          <button key={c.id}
            onClick={() => setF((p) => ({ ...p, catId: c.id }))}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-[13.5px] font-semibold transition",
              f.catId === c.id ? "bg-foreground text-background" : "bg-surface text-foreground/75 hover:text-foreground",
            )}
          >{c.name}</button>
        ))}
      </div>

      {/* Active chips */}
      {activeChips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {activeChips.map((c) => (
            <button key={c.key} onClick={c.reset}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[13px] font-semibold text-accent-foreground transition hover:opacity-80">
              {c.label} <X size={13} strokeWidth={2.4} />
            </button>
          ))}
          <button onClick={() => setF(DEFAULT)} className="text-[13px] font-semibold text-primary transition hover:opacity-70">
            Limpar tudo
          </button>
        </div>
      )}

      {/* Advanced filters */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <div className="card-base p-6 sm:p-8">
              <div className="grid gap-6 sm:grid-cols-3">
                <Range label="Calorias máximas" value={f.maxCal} min={100} max={1000} step={50} unit="kcal" onChange={(v) => setF((p) => ({ ...p, maxCal: v }))} />
                <Range label="Proteína mínima" value={f.minProtein} min={0} max={60} step={5} unit="g" onChange={(v) => setF((p) => ({ ...p, minProtein: v }))} />
                <Range label="Preço máximo" value={f.maxPrice} min={10} max={100} step={5} unit="R$" prefix onChange={(v) => setF((p) => ({ ...p, maxPrice: v }))} />
              </div>
              <div className="mt-6">
                <p className="mb-3 text-[13px] font-semibold text-foreground">Objetivo</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setF((p) => ({ ...p, goal: null }))}
                    className={cn("rounded-full px-4 py-1.5 text-[13px] font-semibold transition",
                      !f.goal ? "bg-foreground text-background" : "bg-surface text-foreground/80")}>
                    Qualquer
                  </button>
                  {GOALS.map((g) => (
                    <button key={g} onClick={() => setF((p) => ({ ...p, goal: g }))}
                      className={cn("rounded-full px-4 py-1.5 text-[13px] font-semibold capitalize transition",
                        f.goal === g ? "bg-foreground text-background" : "bg-surface text-foreground/80")}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="aspect-square w-full rounded-[20px] bg-surface" />
              <div className="mt-3.5 h-4 w-3/4 rounded bg-surface" />
              <div className="mt-2 h-4 w-1/2 rounded bg-surface" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card-flat grid h-80 place-items-center text-center">
          <div>
            <p className="text-title-3">Nada encontrado</p>
            <p className="mt-2 text-[14px] text-muted-foreground">Tente ajustar os filtros</p>
            <button onClick={() => setF(DEFAULT)} className="btn-primary mt-6">Limpar filtros</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}

function Range({ label, value, min, max, step, unit, prefix, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit?: string; prefix?: boolean; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-[13px] font-semibold text-foreground">{label}</p>
        <p className="text-[15px] font-bold tabular-nums">{prefix ? `${unit} ${value}` : `${value} ${unit ?? ""}`}</p>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}
