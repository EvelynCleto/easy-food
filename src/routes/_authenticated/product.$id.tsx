import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, Flame, Heart, MapPin, Package, ShoppingBag, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { brl, cn, num } from "@/lib/format";
import { ProductGallery } from "@/components/premium/ProductGallery";
import { BadgePill } from "@/components/premium/BadgePill";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

export const Route = createFileRoute("/_authenticated/product/$id")({
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { push: pushRecent } = useRecentlyViewed();

  const { data: product } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-goals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("calorie_goal,protein_goal,goal").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (product?.id) pushRecent(product.id);
  }, [product?.id, pushRecent]);

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("rating,comment,created_at").eq("product_id", id).order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const { data: availability = [] } = useQuery({
    queryKey: ["availability", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("machine_products")
        .select("stock,slot,machines(id,name,address,status)")
        .eq("product_id", id)
        .order("stock", { ascending: false })
        .limit(6);
      return (data ?? []) as Array<{ stock: number; slot: string | null; machines: { id: string; name: string; address: string; status: string } | null }>;
    },
  });

  const { data: similar = [] } = useQuery({
    queryKey: ["similar", id, product?.category_id],
    enabled: !!product?.category_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,image_url,price,promo_price,calories,rating")
        .eq("category_id", product!.category_id!)
        .neq("id", id)
        .limit(6);
      return (data ?? []) as ProductCardData[];
    },
  });

  const { data: fav } = useQuery({
    queryKey: ["fav", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("product_id").eq("user_id", user!.id).eq("product_id", id).maybeSingle();
      return !!data;
    },
  });

  const toggleFav = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (fav) await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", id);
      else await supabase.from("favorites").insert({ user_id: user.id, product_id: id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fav", id, user?.id] }),
  });

  if (!product) return <ProductSkeleton />;

  const price = Number(product.promo_price ?? product.price);
  const images = [product.image_url, ...(product.gallery ?? [])].filter(Boolean) as string[];
  const badges = (product.badges as string[] | null) ?? [];
  const tags = (product.tags as string[] | null) ?? [];
  const micros = (product.micros as Record<string, number> | null) ?? {};
  const totalStock = availability.reduce((a, m) => a + (m.stock ?? 0), 0);

  function addToCart() {
    cart.add({ productId: product!.id, name: product!.name, price, image: product!.image_url });
    toast.success("Adicionado ao carrinho");
  }

  return (
    <div className="mx-auto max-w-4xl">
      <button onClick={() => navigate({ to: "/" })} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="overflow-hidden rounded-3xl bg-card p-4 ring-1 ring-border/60 sm:p-6">
        <div className="relative">
          <ProductGallery images={images} alt={product.name} />
          <button onClick={() => toggleFav.mutate()} className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-background/90 shadow ring-1 ring-border/60 backdrop-blur" aria-label="Favoritar">
            <Heart size={18} className={cn(fav ? "fill-destructive text-destructive" : "text-foreground")} />
          </button>
        </div>

        <div className="mt-5">
          {badges.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {badges.map((b) => <BadgePill key={b} label={b} />)}
            </div>
          )}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold sm:text-3xl">{product.name}</h1>
              <p className="mt-1 text-sm text-muted-foreground">por {product.producer ?? "—"}</p>
            </div>
            <div className="text-right">
              <div className="font-display text-3xl font-bold text-primary">{brl(price)}</div>
              {product.promo_price && <div className="text-sm text-muted-foreground line-through">{brl(product.price)}</div>}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Star size={14} className="fill-warning text-warning" />{num(product.rating, 1)} ({product.rating_count})</span>
            {product.calories && <span className="inline-flex items-center gap-1"><Flame size={14} /> {product.calories} kcal</span>}
            {totalStock > 0 && (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><Package size={14} /> {totalStock} em estoque</span>
            )}
          </div>

          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {tags.map((t) => (
                <span key={t} className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground/70 ring-1 ring-border/60">#{t}</span>
              ))}
            </div>
          )}

          <p className="mt-4 text-sm leading-relaxed text-foreground/80">{product.description}</p>

          {profile && product.protein && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-primary/5 p-3 ring-1 ring-primary/20">
              <Sparkles size={14} className="mt-0.5 shrink-0 text-primary" />
              <div className="text-xs">
                <strong className="text-primary">Nutri Coach:</strong>{" "}
                Este prato cobre <strong>{Math.round((Number(product.protein) / (profile.protein_goal ?? 120)) * 100)}%</strong> da sua meta de proteína e{" "}
                <strong>{Math.round(((product.calories ?? 0) / (profile.calorie_goal ?? 2000)) * 100)}%</strong> das suas calorias diárias.
                {profile.goal === "emagrecimento" && (product.calories ?? 0) < 500 && " Ótima opção para sua fase de emagrecimento."}
                {profile.goal === "ganho_massa" && Number(product.protein) >= 30 && " Excelente fonte proteica para ganho de massa."}
              </div>
            </div>
          )}

          {product.ingredients && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold">Ingredientes</h3>
              <p className="mt-1 text-sm text-muted-foreground">{product.ingredients}</p>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-sm font-semibold">Tabela nutricional</h3>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {[
                ["Calorias",`${product.calories ?? 0} kcal`],
                ["Proteínas",`${product.protein ?? 0} g`],
                ["Carboidratos",`${product.carbs ?? 0} g`],
                ["Fibras",`${product.fiber ?? 0} g`],
                ["Gorduras",`${product.fat ?? 0} g`],
                ["Sódio",`${product.sodium_mg ?? 0} mg`],
                ["Açúcares",`${product.sugar_g ?? 0} g`],
              ].map(([k,v]) => (
                <div key={k} className="rounded-xl bg-surface p-3 text-center">
                  <div className="text-[11px] text-muted-foreground">{k}</div>
                  <div className="mt-0.5 text-sm font-bold">{v}</div>
                </div>
              ))}
            </div>

            {Object.keys(micros).length > 0 && (
              <>
                <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Micronutrientes</h4>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {Object.entries(micros).map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-surface p-2.5 text-center">
                      <div className="text-[10px] uppercase text-muted-foreground">{k.replace(/_/g, " ")}</div>
                      <div className="text-xs font-bold tabular-nums">{v}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {availability.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold">Disponível nas máquinas</h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {availability.map((a, i) => a.machines && (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-surface p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{a.machines.name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin size={11} />{a.machines.address}</p>
                    </div>
                    <span className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                      a.stock > 5 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-warning/15 text-warning",
                    )}>
                      {a.stock} un.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-sm font-semibold">Avaliações</h3>
            <div className="mt-2 space-y-2">
              {reviews.length === 0 && <p className="rounded-xl bg-surface p-4 text-sm text-muted-foreground">Ainda sem avaliações. Seja o primeiro!</p>}
              {reviews.map((r, i) => (
                <div key={i} className="rounded-xl bg-surface p-3 text-sm">
                  <div className="flex items-center gap-1 text-warning">
                    {Array.from({ length: r.rating }).map((_, j) => <Star key={j} size={12} className="fill-warning" />)}
                  </div>
                  {r.comment && <p className="mt-1 text-foreground/80">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-display text-lg font-bold">Você também pode gostar</h2>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {similar.map((p) => (
              <div key={p.id} className="w-44 shrink-0">
                <ProductCard p={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="sticky bottom-24 mt-4 flex gap-2 rounded-2xl bg-background/90 p-2 shadow-lg ring-1 ring-border/60 backdrop-blur">
        <button onClick={addToCart} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-input bg-card py-3 text-sm font-semibold hover:bg-accent">
          <ShoppingBag size={16} /> Adicionar
        </button>
        <button onClick={() => { addToCart(); navigate({ to: "/checkout" }); }} className="flex flex-[1.5] items-center justify-center rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">
          Comprar agora
        </button>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse">
      <div className="mb-4 h-5 w-20 rounded bg-muted" />
      <div className="rounded-3xl bg-card p-4 ring-1 ring-border/60 sm:p-6">
        <div className="aspect-[4/3] w-full rounded-2xl bg-muted" />
        <div className="mt-5 space-y-3">
          <div className="h-7 w-2/3 rounded bg-muted" />
          <div className="h-4 w-1/3 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}