import { useQuery } from "@tanstack/react-query";
import { Lightbulb, Salad, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Link } from "@tanstack/react-router";

export function SmartCartSummary() {
  const { items } = useCart();
  const { user } = useAuth();
  const ids = items.map((i) => i.productId);

  const { data: products = [] } = useQuery({
    queryKey: ["cart-products", ids.sort().join(",")],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id,calories,protein,carbs,fat,fiber").in("id", ids);
      return data ?? [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-goals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("calorie_goal,protein_goal").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ["cart-suggestions", ids.join(",")],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,image_url,price,fiber,protein,tags")
        .order("sold_count", { ascending: false })
        .limit(20);
      return (data ?? []).filter((p) => !ids.includes(p.id));
    },
  });

  if (items.length === 0) return null;

  const totals = items.reduce(
    (a, it) => {
      const p = products.find((x) => x.id === it.productId);
      if (!p) return a;
      return {
        cal: a.cal + (p.calories ?? 0) * it.quantity,
        protein: a.protein + Number(p.protein ?? 0) * it.quantity,
        carbs: a.carbs + Number(p.carbs ?? 0) * it.quantity,
        fat: a.fat + Number(p.fat ?? 0) * it.quantity,
        fiber: a.fiber + Number(p.fiber ?? 0) * it.quantity,
      };
    },
    { cal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );

  const calGoal = profile?.calorie_goal ?? 2000;
  const proteinGoal = profile?.protein_goal ?? 120;
  const pctOfDaily = Math.round((totals.cal / calGoal) * 100);

  const tips: { text: string; icon: any }[] = [];
  if (totals.fiber < 6) tips.push({ text: "Está faltando fibra. Adicione uma salada ou fruta.", icon: Salad });
  if (totals.protein < proteinGoal * 0.25) tips.push({ text: `Pouca proteína: adicione um item proteico para chegar à sua meta de ${proteinGoal}g/dia.`, icon: Sparkles });
  if (totals.cal > calGoal * 0.6) tips.push({ text: "Refeição calórica — equilibre com pratos mais leves no restante do dia.", icon: Lightbulb });

  const suggestionPool = suggestions.filter((s) => {
    if (totals.fiber < 6) return (s.fiber ?? 0) >= 4;
    if (totals.protein < proteinGoal * 0.25) return Number(s.protein ?? 0) >= 20;
    return true;
  }).slice(0, 3);

  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border/60">
      <div className="border-b border-border/60 bg-primary/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <span className="text-sm font-semibold">Nutri Coach do carrinho</span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2 text-center text-[11px]">
          <Cell label="kcal" value={Math.round(totals.cal)} />
          <Cell label="Proteína" value={`${Math.round(totals.protein)}g`} />
          <Cell label="Fibra" value={`${Math.round(totals.fiber)}g`} />
          <Cell label="% diário" value={`${pctOfDaily}%`} highlight />
        </div>
      </div>
      {tips.length > 0 && (
        <ul className="divide-y divide-border/40">
          {tips.map((t, i) => (
            <li key={i} className="flex items-start gap-2 px-4 py-2.5 text-xs">
              <t.icon size={14} className="mt-0.5 shrink-0 text-amber-500" />
              <span>{t.text}</span>
            </li>
          ))}
        </ul>
      )}
      {suggestionPool.length > 0 && (
        <div className="border-t border-border/40 p-3">
          <div className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Complete sua refeição</div>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {suggestionPool.map((s) => (
              <Link key={s.id} to="/product/$id" params={{ id: s.id }}
                className="flex w-32 shrink-0 flex-col rounded-xl ring-1 ring-border/60 hover:ring-primary">
                <div className="aspect-square w-full overflow-hidden rounded-t-xl bg-muted">
                  {s.image_url && <img src={s.image_url} alt={s.name} className="h-full w-full object-cover" />}
                </div>
                <div className="p-2">
                  <div className="line-clamp-2 text-[11px] font-semibold leading-tight">{s.name}</div>
                  <div className="mt-0.5 text-[10px] text-primary">{Number(s.price ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Cell({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-2 ${highlight ? "bg-primary text-primary-foreground" : "bg-background"}`}>
      <div className="text-[9px] uppercase opacity-80">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}