import { Link } from "@tanstack/react-router";
import { Flame, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { brl } from "@/lib/format";

export type RecommendationItem = {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  promo_price: number | null;
  calories: number | null;
  protein: number | null;
  reason: string;
};

export function RecommendationCard({ item }: { item: RecommendationItem }) {
  const price = item.promo_price ?? item.price;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="card-premium w-64 shrink-0 overflow-hidden"
    >
      <Link to="/product/$id" params={{ id: item.id }} className="block">
        <div className="relative aspect-[5/3] bg-muted">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
          ) : null}
          <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[10px] font-semibold text-primary backdrop-blur">
            <Sparkles size={11} /> IA
          </div>
        </div>
        <div className="p-3">
          <p className="line-clamp-1 text-xs text-muted-foreground">{item.reason}</p>
          <h3 className="mt-1 line-clamp-1 font-semibold leading-tight">{item.name}</h3>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-display text-base font-bold text-primary">
              {brl(price)}
            </span>
            {item.calories != null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                <Flame size={10} /> {Math.round(item.calories)} kcal
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}