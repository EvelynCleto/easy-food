import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Flame,
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
  Wheat,
  Droplets,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { brl } from "@/lib/format";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { haptic, celebrate } from "@/lib/celebrate";

export const Route = createFileRoute("/_authenticated/product/$id")({
  component: ProductPage,
});

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={14}
            strokeWidth={1.5}
            fill={s <= Math.round(rating) ? "#F59E0B" : "none"}
            style={{ color: s <= Math.round(rating) ? "#F59E0B" : "var(--ink-3)" }}
          />
        ))}
      </div>
      <span className="text-[13px] font-semibold" style={{ color: "#F59E0B" }}>
        {rating.toFixed(1)}
      </span>
      <span className="text-[12px]" style={{ color: "var(--ink-3)" }}>
        ({count} avaliações)
      </span>
    </div>
  );
}

function MacroCell({ icon: Icon, label, value, unit, color }: { icon: any; label: string; value?: number | null; unit: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center gap-1.5 rounded-2xl p-3"
      style={{ background: "var(--surface)" }}
    >
      <div className="grid h-8 w-8 place-items-center rounded-full" style={{ background: color + "20" }}>
        <Icon size={16} style={{ color }} />
      </div>
      <p className="text-[11px]" style={{ color: "var(--ink-3)" }}>{label}</p>
      <p className="text-[15px] font-bold" style={{ color: "var(--ink-1)" }}>
        {value ?? "—"}<span className="text-[11px] font-normal">{unit}</span>
      </p>
    </div>
  );
}

function ProductPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { push: pushRecent } = useRecentlyViewed();
  const [qty, setQty] = useState(1);

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

  if (!product) {
    return (
      <div className="grid h-[60vh] place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: "var(--primary)" }} />
          <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>Carregando produto…</p>
        </div>
      </div>
    );
  }

  const price = Number(product.promo_price ?? product.price);
  const originalPrice = product.promo_price ? Number(product.price) : null;
  const rating = Number(product.rating ?? 4.5);
  const reviewCount = reviews.length || 128;
  const tags: string[] = Array.isArray(product.tags) ? product.tags : [];
  const aiSuggestions: string[] = Array.isArray((product as any).ai_suggestions) ? (product as any).ai_suggestions : [];

  function handleBuy() {
    for (let i = 0; i < qty; i++) {
      cart.add({ productId: product!.id, name: product!.name, price, image: product!.image_url });
    }
    haptic(20);
    celebrate();
    toast.success(`${qty}× ${product!.name} adicionado`);
  }

  return (
    <div>
      {/* Back nav */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate({ to: "/catalog" })}
          className="flex items-center gap-2 text-[13px] font-medium transition hover:opacity-70"
          style={{ color: "var(--ink-2)" }}
        >
          <div
            className="grid h-9 w-9 place-items-center rounded-full"
            style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
          >
            <ArrowLeft size={16} />
          </div>
          Refeição do dia
        </button>
      </div>

      {/* Main 2-col grid */}
      <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
        {/* LEFT — Content */}
        <div>
          {/* Badge */}
          {tags[0] && (
            <div
              className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold"
              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
            >
              ✦ {tags[0]}
            </div>
          )}

          {/* Product name */}
          <h1
            className="text-[clamp(2rem,4vw+0.5rem,3.2rem)] font-bold leading-[1.05]"
            style={{ color: "var(--ink-1)", fontFamily: "var(--font-display)" }}
          >
            {product.name}
          </h1>

          {/* Stars */}
          <div className="mt-3">
            <StarRow rating={rating} count={reviewCount} />
          </div>

          {/* Tag pills */}
          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-3 py-1 text-[12px] font-medium"
                  style={{ background: "var(--surface)", color: "var(--ink-2)" }}
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="mt-4 text-[14px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
              {product.description}
            </p>
          )}

          {/* Macros grid */}
          <div className="mt-6 grid grid-cols-4 gap-3">
            <MacroCell icon={Flame}    label="Calorias" value={product.calories} unit=" kcal" color="#EF4444" />
            <MacroCell icon={Zap}      label="Proteína" value={product.protein}  unit="g"     color="#1E8654" />
            <MacroCell icon={Wheat}    label="Carbs"    value={product.carbs}    unit="g"     color="#F59E0B" />
            <MacroCell icon={Droplets} label="Gorduras" value={product.fat}      unit="g"     color="#8B5CF6" />
          </div>

          {/* AI suggestion card */}
          {aiSuggestions[0] && (
            <div
              className="mt-6 flex gap-3 rounded-2xl p-4"
              style={{ background: "var(--surface)", border: "1px solid var(--hairline)" }}
            >
              <div
                className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl"
                style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
              >
                <Sparkles size={15} />
              </div>
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--primary)" }}>
                  Análise da IA
                </p>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
                  {aiSuggestions[0]}
                </p>
              </div>
            </div>
          )}

          {/* Ingredient row (icons) */}
          {Array.isArray(product.ingredients) && product.ingredients.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
                Ingredientes
              </p>
              <div className="flex flex-wrap gap-2">
                {(product.ingredients as string[]).slice(0, 8).map((ing) => (
                  <span
                    key={ing}
                    className="rounded-full px-3 py-1.5 text-[12px] font-medium"
                    style={{ background: "var(--card)", border: "1px solid var(--hairline)", color: "var(--ink-2)" }}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="mt-8">
              <p className="mb-4 text-[13px] font-bold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
                Avaliações
              </p>
              <div className="flex flex-col gap-3">
                {reviews.map((r: any, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-4"
                    style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
                  >
                    <div className="mb-1.5 flex items-center gap-2">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={11} fill={s <= r.rating ? "#F59E0B" : "none"} style={{ color: "#F59E0B" }} />
                      ))}
                    </div>
                    {r.comment && (
                      <p className="text-[13px]" style={{ color: "var(--ink-2)" }}>{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar products */}
          {similar.length > 0 && (
            <div className="mt-10">
              <p className="mb-4 text-[14px] font-bold" style={{ color: "var(--ink-1)" }}>Você também pode gostar</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {similar.map((s) => <ProductCard key={s.id} p={s} />)}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Hero image + buy card */}
        <div className="lg:sticky lg:top-8 flex flex-col gap-5 h-fit">
          {/* Hero image */}
          <div
            className="relative aspect-square overflow-hidden rounded-3xl"
            style={{ background: "var(--surface)" }}
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-8xl">🥗</div>
            )}
            {/* Fav button */}
            <button
              onClick={() => toggleFav.mutate()}
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full transition hover:scale-110"
              style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)" }}
            >
              <Heart
                size={18}
                strokeWidth={1.8}
                fill={fav ? "#EF4444" : "none"}
                style={{ color: fav ? "#EF4444" : "var(--ink-2)" }}
              />
            </button>
            {/* Promo badge */}
            {product.promo_price && (
              <div
                className="absolute left-4 top-4 rounded-full px-3 py-1 text-[12px] font-bold"
                style={{ background: "var(--primary)", color: "#fff" }}
              >
                PROMO
              </div>
            )}
          </div>

          {/* Buy card */}
          <div
            className="rounded-3xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
          >
            {/* Price */}
            <div className="flex items-end gap-2 mb-4">
              <span className="text-[28px] font-bold leading-none" style={{ color: "var(--ink-1)" }}>
                {brl(price * qty)}
              </span>
              {originalPrice && (
                <span className="mb-0.5 text-[14px] line-through" style={{ color: "var(--ink-3)" }}>
                  {brl(originalPrice)}
                </span>
              )}
            </div>

            {/* Quantity row */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[13px] font-medium" style={{ color: "var(--ink-2)" }}>Quantidade</span>
              <div
                className="flex items-center gap-0"
                style={{ background: "var(--surface)", borderRadius: "999px" }}
              >
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-9 w-9 place-items-center rounded-full transition hover:opacity-70"
                  style={{ color: "var(--ink-2)" }}
                >
                  <Minus size={14} strokeWidth={2.5} />
                </button>
                <span className="min-w-[24px] text-center text-[15px] font-bold" style={{ color: "var(--ink-1)" }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="grid h-9 w-9 place-items-center rounded-full transition hover:opacity-70"
                  style={{ color: "var(--ink-2)" }}
                >
                  <Plus size={14} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Buy button */}
            <button
              onClick={handleBuy}
              className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-[15px] font-bold transition hover:opacity-90 active:scale-[0.98]"
              style={{ background: "var(--ink-1)", color: "#fff" }}
            >
              <span className="flex items-center gap-2">
                <ShoppingBag size={17} strokeWidth={2} />
                Comprar agora
              </span>
              <span>{brl(price * qty)}</span>
            </button>

            {/* Add to favorites */}
            <button
              onClick={() => toggleFav.mutate()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[13px] font-semibold transition hover:opacity-80"
              style={{
                background: fav ? "#FEF2F2" : "var(--surface)",
                color: fav ? "#EF4444" : "var(--ink-2)",
              }}
            >
              <Heart size={14} fill={fav ? "#EF4444" : "none"} style={{ color: fav ? "#EF4444" : "var(--ink-2)" }} />
              {fav ? "Salvo nos favoritos" : "Salvar nos favoritos"}
            </button>
          </div>
        </div>
      </div>

      {/* Extra bottom padding for mobile so fixed bar has room */}
      <div className="h-24 lg:hidden" />
    </div>
  );
}
