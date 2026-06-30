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
    queryFn: async () => (await supabase.from("products").select("id,name,image_url,price,promo_price,calories,protein,rating").eq("category_id", product!.category_id!).neq("id", id).limit(4)).data as ProductCardData[] ?? [],
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

  if (!product) return <div className="grid h-[60vh] place-items-center"><span className="text-caption">Carregando...</span></div>;

  const price = Number(product.promo_price ?? product.price);

  function addToCart() {
    try {
      cart.add({ productId: product!.id, name: product!.name, price, image: product!.image_url });
      toast.success("Adicionado ao carrinho");
    } catch {
      toast.error("Não foi possível adicionar ao carrinho. Tente de novo.");
    }
  }

  const macros: { label: string; value: string; unit: string }[] = [
    { label: "Calorias", value: `${product.calories ?? 0}`, unit: "kcal" },
    { label: "Proteínas", value: `${product.protein ?? 0}`, unit: "g" },
    { label: "Carbos", value: `${product.carbs ?? 0}`, unit: "g" },
    { label: "Fibras", value: `${product.fiber ?? 0}`, unit: "g" },
    { label: "Gorduras", value: `${product.fat ?? 0}`, unit: "g" },
    { label: "Sódio", value: `${product.sodium_mg ?? 0}`, unit: "mg" },
  ];

  return (
    <div className="animate-rise mx-auto max-w-[1080px]">
      <button onClick={() => navigate({ to: "/catalog" })}
        className="mb-6 inline-flex items-center gap-1.5 text-[13.5px] font-medium transition hover:opacity-70" style={{ color: "var(--ink-2)" }}>
        <ArrowLeft size={15} /> Voltar
      </button>

      {/* HERO */}
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="relative">
          <div className="card-nested aspect-[4/5] overflow-hidden p-4">
            <div className="h-full w-full overflow-hidden rounded-[18px]" style={{ background: "var(--surface)" }}>
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="plate-photo h-full w-full object-cover" />
              )}
            </div>
          </div>
          <button onClick={() => toggleFav.mutate()}
            className="press absolute right-6 top-6 grid h-11 w-11 place-items-center rounded-full transition"
            style={{ background: "color-mix(in srgb, var(--card) 85%, transparent)", backdropFilter: "blur(12px)" }}
            aria-label="Favoritar">
            <Heart size={17} className={cn(fav && "fill-current")} style={{ color: fav ? "var(--destructive)" : "var(--ink-1)" }} />
          </button>
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-eyebrow">{product.producer ?? "EasyFood"}</p>
          <h1 className="text-display-m mt-3" style={{ color: "var(--ink-1)" }}>{product.name}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-body-sm" style={{ color: "var(--ink-2)" }}>
            {product.rating > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Star size={14} style={{ fill: "var(--warning)", color: "var(--warning)" }} />
                <span className="font-semibold" style={{ color: "var(--ink-1)" }}>{num(product.rating, 1)}</span>
                <span className="text-caption">({product.rating_count})</span>
              </span>
            )}
            {product.calories && (
              <span className="inline-flex items-center gap-1.5">
                <Flame size={14} strokeWidth={1.7} /> {product.calories} kcal
              </span>
            )}
          </div>

          <div className="mt-7 flex items-baseline gap-3">
            <span className="font-display text-[44px] font-semibold tabular-nums tracking-tight" style={{ color: "var(--ink-1)" }}>
              {brl(price)}
            </span>
            {product.promo_price && (
              <span className="text-[16px] tabular-nums line-through" style={{ color: "var(--ink-3)" }}>{brl(product.price)}</span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 text-body" style={{ color: "var(--ink-2)" }}>{product.description}</p>
          )}

          <div className="mt-8 flex gap-3">
            <button onClick={addToCart} className="btn-secondary flex-1">
              <ShoppingBag size={16} /> Adicionar
            </button>
            <button onClick={() => { addToCart(); navigate({ to: "/checkout" }); }} className="btn-primary flex-1">
              Comprar
            </button>
          </div>
        </div>
      </div>

      {/* NUTRITION */}
      <section className="mt-20">
        <p className="text-eyebrow">por porção</p>
        <h2 className="text-headline mt-3">Informação nutricional</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {macros.map((m) => (
            <div key={m.label} className="card-nested p-5">
              <p className="text-eyebrow">{m.label}</p>
              <p className="mt-2 font-display text-[22px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>
                {m.value}<span className="ml-1 text-[12px] font-normal" style={{ color: "var(--ink-3)" }}>{m.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* INGREDIENTS */}
      {product.ingredients && (
        <section className="mt-16">
          <h2 className="text-headline">Ingredientes</h2>
          <p className="mt-5 text-body" style={{ color: "var(--ink-2)" }}>{product.ingredients}</p>
        </section>
      )}

      {/* REVIEWS */}
      <section className="mt-16">
        <h2 className="text-headline">Avaliações</h2>
        {reviews.length === 0 ? (
          <p className="mt-4 text-body-sm" style={{ color: "var(--ink-3)" }}>Ainda sem avaliações</p>
        ) : (
          <div className="card-nested mt-6 overflow-hidden">
            {reviews.map((r, i) => (
              <div key={i} className={cn("p-5", i > 0 && "border-t")} style={{ borderColor: "var(--hairline)" }}>
                <div className="flex items-center gap-1">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} size={13} style={{ fill: "var(--warning)", color: "var(--warning)" }} />
                  ))}
                </div>
                {r.comment && <p className="mt-2 text-body-sm" style={{ color: "var(--ink-1)" }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SIMILAR */}
      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="text-headline">Você também pode gostar</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
            {similar.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
