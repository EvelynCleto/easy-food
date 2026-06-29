import type { RecommendationItem } from "@/components/premium/RecommendationCard";

type ProductRow = {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  promo_price: number | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

export function buildRecommendations(products: ProductRow[]): RecommendationItem[] {
  const hour = new Date().getHours();
  const slot = hour < 11 ? "breakfast" : hour < 15 ? "lunch" : hour < 18 ? "snack" : "dinner";
  const reasonFor = (p: ProductRow): string => {
    if (slot === "breakfast" && (p.protein ?? 0) >= 20) return "Café da manhã proteico";
    if (slot === "lunch" && (p.calories ?? 0) <= 600) return "Almoço equilibrado";
    if (slot === "snack" && (p.calories ?? 0) < 350) return "Lanche leve pra tarde";
    if (slot === "dinner" && (p.carbs ?? 0) < 30) return "Jantar low carb";
    if ((p.protein ?? 0) >= 30) return "Alta proteína · ideal pós treino";
    if ((p.calories ?? 0) <= 400) return "Baixa caloria · pra meta de déficit";
    return "Combina com seu perfil";
  };
  return products.slice(0, 8).map((p) => ({
    id: p.id,
    name: p.name,
    image_url: p.image_url,
    price: Number(p.price),
    promo_price: p.promo_price != null ? Number(p.promo_price) : null,
    calories: p.calories != null ? Number(p.calories) : null,
    protein: p.protein != null ? Number(p.protein) : null,
    reason: reasonFor(p),
  }));
}

export function greetingFor(name?: string | null) {
  const h = new Date().getHours();
  const part = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  const first = (name ?? "").split(" ")[0] || "";
  return first ? `${part}, ${first}` : part;
}