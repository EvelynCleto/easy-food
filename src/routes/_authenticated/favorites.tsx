import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
      const { data } = await supabase
        .from("favorites")
        .select("products(id,name,image_url,price,promo_price,calories,rating)")
        .eq("user_id", user!.id);
      return (data ?? []).map((r: any) => r.products).filter(Boolean);
    },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Favoritos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isLoading ? "Carregando..." : `${products.length} produto(s) salvos`}
      </p>
      {isLoading ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground ring-1 ring-border">
          Você ainda não favoritou nenhum produto.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p: any) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}