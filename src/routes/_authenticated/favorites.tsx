import { createFileRoute, Link } from "@tanstack/react-router";
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
      const { data } = await supabase.from("favorites")
        .select("products(id,name,image_url,price,promo_price,calories,rating)")
        .eq("user_id", user!.id);
      return (data ?? []).map((r: any) => r.products).filter(Boolean);
    },
  });

  return (
    <div>
      <h1 className="text-display">Favoritos</h1>
      <p className="text-caption mt-2">
        {isLoading ? "Carregando..." : `${products.length} ${products.length === 1 ? "prato salvo" : "pratos salvos"}`}
      </p>

      {!isLoading && products.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="text-title-3">Nada por aqui ainda</p>
          <p className="mt-2 text-body text-muted-foreground">Salve seus pratos preferidos para encontrar fácil depois.</p>
          <Link to="/catalog" className="btn-primary mt-8">Explorar catálogo</Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p: any) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
