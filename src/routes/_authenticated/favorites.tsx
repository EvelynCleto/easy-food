import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/_authenticated/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user } = useAuth();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites")
        .select("products(id,name,image_url,price,promo_price,calories,protein,rating)")
        .eq("user_id", user!.id);
      return (data ?? []).map((r: any) => r.products).filter(Boolean);
    },
  });

  return (
    <div className="animate-rise">
      <header className="mb-10">
        <p className="text-eyebrow">salvos</p>
        <h1 className="text-display-m mt-3">Favoritos</h1>
        <p className="mt-3 text-body-sm" style={{ color: "var(--ink-2)" }}>
          {isLoading ? "Carregando..." : `${products.length} ${products.length === 1 ? "prato salvo" : "pratos salvos"}`}
        </p>
      </header>

      {!isLoading && products.length === 0 ? (
        <div className="card-flat py-20 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ background: "var(--card)" }}>
            <Heart size={20} strokeWidth={1.6} style={{ color: "var(--ink-2)" }} />
          </div>
          <h2 className="text-title-lg mt-6">Nada salvo ainda</h2>
          <p className="mt-2 text-body-sm" style={{ color: "var(--ink-2)" }}>Toque no coração nos pratos para guardá-los aqui.</p>
          <Link to="/catalog" className="btn-primary mt-7 inline-flex">Explorar catálogo</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
          {products.map((p: any) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
