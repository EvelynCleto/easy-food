import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type DailyTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water_ml: number;
};

const empty: DailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, water_ml: 0 };

export function useDailyNutrition() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["daily-nutrition", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const [{ data, error }, { data: waters }] = await Promise.all([
        supabase
          .from("nutritional_analysis")
          .select("calories,protein,carbs,fat,fiber")
          .eq("user_id", user!.id)
          .gte("created_at", start.toISOString()),
        supabase
          .from("water_logs")
          .select("amount_ml")
          .eq("user_id", user!.id)
          .gte("logged_at", start.toISOString()),
      ]);
      if (error) throw error;
      const totals = (data ?? []).reduce<DailyTotals>(
        (acc, r) => ({
          calories: acc.calories + Number(r.calories ?? 0),
          protein: acc.protein + Number(r.protein ?? 0),
          carbs: acc.carbs + Number(r.carbs ?? 0),
          fat: acc.fat + Number(r.fat ?? 0),
          fiber: acc.fiber + Number(r.fiber ?? 0),
          water_ml: acc.water_ml,
        }),
        empty,
      );
      totals.water_ml = (waters ?? []).reduce((a, r) => a + Number((r as { amount_ml?: number }).amount_ml ?? 0), 0);
      return totals;
    },
  });
}