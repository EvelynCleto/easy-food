import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
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
    const apiKey = process.env.ANTHROPIC_API_KEY;
    let plan: MealPlan = fallback(data.goal);

    // Load profile + available products
    const [{ data: profile }, { data: products }] = await Promise.all([
      context.supabase.from("profiles").select("calorie_goal,protein_goal,weight_kg,dietary_restrictions,allergies,favorite_foods").eq("id", context.userId).maybeSingle(),
      context.supabase.from("products").select("name,calories,protein,carbs,fat,tags").limit(40),
    ]);

    if (apiKey) {
      try {
const anthropic = new Anthropic({ apiKey });

const catalog = (products ?? []).map((p) => `${p.name} (${p.calories}kcal, P:${p.protein}g, C:${p.carbs}g, G:${p.fat}g, tags:${(p.tags ?? []).join(",")})`).join(" | ");

const goalLabel: Record<string, string> = {
  emagrecimento: "emagrecer — déficit calórico moderado, alta proteína, baixo carboidrato refinado",
  manutencao: "manutenção — macros equilibrados para manter peso e composição corporal",
  ganho_massa: "ganho de massa muscular — superávit calórico, proteína muito alta (2g/kg), carboidratos complexos",
  saude: "mais saúde — alimentos variados, alta fibra, micronutrientes, baixo sódio e açúcar",
};

const sys = `Você é um nutricionista esportivo especializado em nutrição de precisão. Crie um plano alimentar personalizado de 7 dias.

PERFIL DO USUÁRIO:
- Objetivo: ${goalLabel[data.goal] ?? data.goal}
- Meta calórica diária: ${profile?.calorie_goal ?? 2000} kcal
- Meta de proteína diária: ${profile?.protein_goal ?? 120}g
- Peso: ${profile?.weight_kg ?? "não informado"}kg
- Restrições alimentares: ${(profile?.dietary_restrictions ?? []).join(", ") || "nenhuma"}
- Alergias: ${(profile?.allergies ?? []).join(", ") || "nenhuma"}

CATÁLOGO EasyFood (USE ESSES PRODUTOS quando possível — campo product_match deve ser o nome exato):
${catalog}

REGRAS:
1. Para almoço e lanche, PREFIRA produtos do catálogo acima quando compatíveis com o objetivo
2. Para café da manhã e jantar, pode sugerir refeições caseiras saudáveis
3. Varie os pratos ao longo dos 7 dias — não repita o mesmo produto mais de 3 vezes
4. Cada nota (note) deve ser personalizada ao objetivo do usuário (ex: para emagrecer, mencione o déficit; para ganho de massa, mencione a janela anabólica)
5. Respeite ESTRITAMENTE as alergias e restrições

Responda APENAS JSON sem markdown: {"days":[{"day":"Segunda","meals":{"cafe":{"name":"","calories":n,"protein":n,"carbs":n,"fat":n,"product_match":"nome exato do catálogo ou null","note":"dica personalizada ao objetivo"},"almoco":{...},"lanche":{...},"jantar":{...}}}, ... todos os 7 dias]}`;

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 2000,
  system: sys,
  messages: [
    {
      role: "user",
      content: "Gere o plano.",
    },
  ],
});

const text = response.content
  .filter((block): block is Anthropic.TextBlock => block.type === "text")
  .map((block) => block.text)
  .join("\n");

        const cleaned = text.replace(/```json|```/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as { days?: Day[] };
          if (Array.isArray(parsed.days) && parsed.days.length > 0) {
            const total_calories = parsed.days.reduce(
              (sum, day) => sum + Object.values(day.meals).reduce((s, m) => s + (m?.calories ?? 0), 0), 0
            );
            const total_protein = parsed.days.reduce(
              (sum, day) => sum + Object.values(day.meals).reduce((s, m) => s + (m?.protein ?? 0), 0), 0
            );
            plan = { goal: data.goal, days: parsed.days, total_calories, total_protein };
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