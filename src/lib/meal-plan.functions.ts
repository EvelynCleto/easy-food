import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  goal: z.enum(["emagrecimento", "manutencao", "ganho_massa", "saude"]),
});

type Meal = { name: string; product_match?: string | null; calories: number; protein: number; carbs: number; fat: number; note?: string };
type Day = { day: string; meals: { cafe: Meal; almoco: Meal; lanche: Meal; jantar: Meal } };
export type MealPlan = { goal: string; days: Day[]; total_calories: number; total_protein: number };

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

function fallback(goal: string): MealPlan {
  const baseKcal = goal === "emagrecimento" ? 1700 : goal === "ganho_massa" ? 2600 : 2100;
  const baseProt = goal === "ganho_massa" ? 160 : 120;
  const days: Day[] = DAYS.map((d) => ({
    day: d,
    meals: {
      cafe: { name: "Tapioca de frango + ovo", calories: 380, protein: 28, carbs: 35, fat: 12 },
      almoco: { name: "Frango grelhado, arroz integral e brócolis", calories: 620, protein: 48, carbs: 60, fat: 14 },
      lanche: { name: "Iogurte natural com frutas e granola", calories: 250, protein: 14, carbs: 30, fat: 6 },
      jantar: { name: "Salmão, batata-doce e salada", calories: 560, protein: 38, carbs: 45, fat: 22 },
    },
  }));
  return { goal, days, total_calories: baseKcal * 7, total_protein: baseProt * 7 };
}

export const generateMealPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }): Promise<MealPlan & { id: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    let plan: MealPlan = fallback(data.goal);

    // Load profile + available products
    const [{ data: profile }, { data: products }] = await Promise.all([
      context.supabase.from("profiles").select("calorie_goal,protein_goal,weight_kg,dietary_restrictions,allergies,favorite_foods").eq("id", context.userId).maybeSingle(),
      context.supabase.from("products").select("name,calories,protein,carbs,fat,tags").limit(40),
    ]);

    if (apiKey) {
      try {
        const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
        const gw = createLovableAiGatewayProvider(apiKey);
        const model = gw("google/gemini-2.5-flash");
        const catalog = (products ?? []).map((p) => p.name).join(", ");
        const sys = `Você é um nutricionista esportivo. Crie um plano alimentar de 7 dias (segunda a domingo) com 4 refeições por dia (cafe, almoco, lanche, jantar). Use prioritariamente alimentos compatíveis com o catálogo da máquina: ${catalog}. Restrições: ${(profile?.dietary_restrictions ?? []).join(", ") || "nenhuma"}. Alergias: ${(profile?.allergies ?? []).join(", ") || "nenhuma"}. Meta diária: ${profile?.calorie_goal ?? 2000} kcal, ${profile?.protein_goal ?? 120}g proteína. Objetivo: ${data.goal}. Responda APENAS JSON: {"days":[{"day":"Segunda","meals":{"cafe":{"name":"","calories":n,"protein":n,"carbs":n,"fat":n,"product_match":"nome ou null","note":"frase curta"},"almoco":{...},"lanche":{...},"jantar":{...}}}, ... 7 dias]}`;
        const { text } = await generateText({
          model,
          messages: [{ role: "system", content: sys }, { role: "user", content: "Gere o plano." }],
        });
        const cleaned = text.replace(/```json|```/g, "").trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]) as { days: Day[] };
          if (Array.isArray(parsed.days) && parsed.days.length) {
            const totalKcal = parsed.days.reduce((s, d) => s + d.meals.cafe.calories + d.meals.almoco.calories + d.meals.lanche.calories + d.meals.jantar.calories, 0);
            const totalProt = parsed.days.reduce((s, d) => s + d.meals.cafe.protein + d.meals.almoco.protein + d.meals.lanche.protein + d.meals.jantar.protein, 0);
            plan = { goal: data.goal, days: parsed.days, total_calories: totalKcal, total_protein: totalProt };
          }
        }
      } catch (e) {
        console.error("Meal plan AI failed", e);
      }
    }

    const { data: row, error } = await context.supabase
      .from("meal_plans")
      .insert({
        user_id: context.userId,
        goal: data.goal,
        plan: plan as never,
        total_calories: Math.round(plan.total_calories),
        total_protein: plan.total_protein,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ...plan, id: row!.id };
  });

export const getLatestMealPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<(MealPlan & { id: string }) | null> => {
    const { data } = await context.supabase
      .from("meal_plans")
      .select("id, plan, goal, total_calories, total_protein")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
    const plan = data.plan as unknown as MealPlan;
    return { ...plan, goal: data.goal, total_calories: data.total_calories ?? 0, total_protein: Number(data.total_protein ?? 0), id: data.id };
  });