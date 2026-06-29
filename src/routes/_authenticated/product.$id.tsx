import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowLeft, Flame, Heart, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { brl, cn, num } from "@/lib/format";
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
    queryFn: async () => (await supabase.from("products").select("*").eq("id", id).single()).data,
  });

  useEffect(() => { if (product?.id) pushRecent(product.id); }, [product?.id, pushRecent]);

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => (await supabase.from("reviews").select("rating,comment,created_at").eq("product_id", id).order("created_at", { ascending: false }).limit(5)).data ?? [],
  });

  const { data: similar = [] } = useQuery({
    queryKey: ["similar", id, product?.category_id],
    enabled: !!product?.category_id,
    queryFn: async () => (await supabase.from("products").select("id,name,image_url,price,promo_price,calories,rating").eq("category_id", product!.category_id!).neq("id", id).limit(4)).data as ProductCardData[] ?? [],
  });

  const { data: fav } = useQuery({
    queryKey: ["fav", id, user?.id],
    enabled: !!user,
    queryFn: async () => !!(await supabase.from("favorites").select("product_id").eq("user_id", user!.id).eq("product_id", id).maybeSingle()).data,
  });

  const toggleFav = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (fav) await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", id);
      else await supabase.from("favorites").insert({ user_id: user.id, product_id: id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fav", id, user?.id] }),
  });

  if (!product) return <div className="py-20 text-center text-muted-foreground">Carregando...</div>;

  const price = Number(product.promo_price ?? product.price);

  function addToCart() {
    cart.add({ productId: product!.id, name: product!.name, price, image: product!.image_url });
    toast.success("Adicionado ao carrinho");
  }

  const macros: [string, string][] = [
    ["Calorias", `${product.calories ?? 0} kcal`],
    ["Proteínas", `${product.protein ?? 0}g`],
    ["Carboidratos", `${product.carbs ?? 0}g`],
    ["Fibras", `${product.fiber ?? 0}g`],
    ["Gorduras", `${product.fat ?? 0}g`],
    ["Sódio", `${product.sodium_mg ?? 0}mg`],
  ];

  return (
    <div className="mx-auto max-w-[1080px]">
      <button onClick={() => navigate({ to: "/catalog" })}
        className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground transition hover:text-foreground">
        <ArrowLeft size={16} /> Voltar
      </button>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* IMAGE */}
        <div className="relative">
          <div className="aspect-square overflow-hidden rounded-[28px] bg-surface">
            {product.image_url && <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />}
          </div>
          <button
            onClick={() => toggleFav.mutate()}
            className="absolute right-5 top-5 grid h-12 w-12 place-items-center rounded-full bg-card/85 shadow-sm backdrop-blur-md transition hover:bg-card"
            aria-label="Favoritar"
          >
            <Heart size={19} className={cn(fav ? "fill-destructive text-destructive" : "text-foreground")} />
          </button>
        </div>

        {/* INFO */}
        <div className="flex flex-col">
          <p className="text-caption">{product.producer ?? "EasyFood"}</p>
          <h1 className="text-display mt-2">{product.name}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-muted-foreground">
            {product.rating > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Star size={14} className="fill-warning text-warning" />
                <span className="font-semibold text-foreground">{num(product.rating, 1)}</span>
                ({product.rating_count} avaliações)
              </span>
            )}
            {product.calories && (
              <span className="inline-flex items-center gap-1.5">
                <Flame size={14} strokeWidth={1.8} />
                {product.calories} kcal
              </span>
            )}
          </div>

          <div className="mt-7 flex items-baseline gap-3">
            <span className="font-display text-[40px] font-bold tracking-tight tabular-nums">{brl(price)}</span>
            {product.promo_price && (
              <span className="text-[17px] text-muted-foreground line-through tabular-nums">{brl(product.price)}</span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 text-[15.5px] leading-relaxed text-muted-foreground">{product.description}</p>
          )}

          <div className="mt-8 flex gap-3">
            <button onClick={addToCart} className="btn-secondary flex-1">
              <ShoppingBag size={17} /> Adicionar
            </button>
            <button onClick={() => { addToCart(); navigate({ to: "/checkout" }); }} className="btn-primary flex-1">
              Comprar agora
            </button>
          </div>
        </div>
      </div>

      {/* NUTRITION */}
      <section className="mt-20">
        <h2 className="text-title-1">Informação nutricional</h2>
        <p className="mt-2 text-[14px] text-muted-foreground">Por porção</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {macros.map(([k, v]) => (
            <div key={k} className="card-base p-5">
              <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">{k}</p>
              <p className="mt-2 font-display text-[20px] font-bold tabular-nums">{v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* INGREDIENTS */}
      {product.ingredients && (
        <section className="mt-16">
          <h2 className="text-title-1">Ingredientes</h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-muted-foreground">{product.ingredients}</p>
        </section>
      )}

      {/* REVIEWS */}
      <section className="mt-16">
        <h2 className="text-title-1">Avaliações</h2>
        {reviews.length === 0 ? (
          <p className="mt-5 text-[14px] text-muted-foreground">Ainda sem avaliações.</p>
        ) : (
          <div className="card-base mt-6 overflow-hidden">
            {reviews.map((r, i) => (
              <div key={i} className={`p-5 ${i > 0 ? "border-t border-border/40" : ""}`}>
                <div className="flex items-center gap-1">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} size={14} className="fill-warning text-warning" />
                  ))}
                </div>
                {r.comment && <p className="mt-2 text-[15px] leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SIMILAR */}
      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="text-title-1">Você também pode gostar</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {similar.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
