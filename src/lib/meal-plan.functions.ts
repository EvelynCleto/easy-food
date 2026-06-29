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

type CatalogProduct = { name: string; calories: number | null; protein: number | null; carbs: number | null; fat: number | null; tags?: string[] | null };

// Fallback that uses ONLY real catalog products so the user never sees a
// suggestion they can't actually buy on a machine. Each meal references the
// exact product via product_match. If the catalog is empty (edge case), a
// minimal generic plan is returned without claiming catalog availability.
function fallbackFromCatalog(goal: string, products: CatalogProduct[] | null | undefined): MealPlan {
  const list = (products ?? []).filter((p) => p && p.name);

  const toMeal = (p: CatalogProduct): Meal => ({
    name: p.name,
    product_match: p.name,
    calories: Math.round(Number(p.calories ?? 0)),
    protein: Number(p.protein ?? 0),
    carbs: Number(p.carbs ?? 0),
    fat: Number(p.fat ?? 0),
  });

  const days: Day[] = DAYS.map((d, di) => {
    if (list.length === 0) {
      const generic: Meal = { name: "Refeição saudável EasyFood", calories: 450, protein: 30, carbs: 40, fat: 14 };
      return { day: d, meals: { cafe: generic, almoco: generic, lanche: generic, jantar: generic } };
    }
    const at = (offset: number) => toMeal(list[(di * 4 + offset) % list.length]);
    return { day: d, meals: { cafe: at(0), almoco: at(1), lanche: at(2), jantar: at(3) } };
  });

  const total_calories = days.reduce((sum, day) => sum + Object.values(day.meals).reduce((s, m) => s + (m?.calories ?? 0), 0), 0);
  const total_protein = days.reduce((sum, day) => sum + Object.values(day.meals).reduce((s, m) => s + (m?.protein ?? 0), 0), 0);
  return { goal, days, total_calories, total_protein };
}

export const generateMealPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }): Promise<MealPlan & { id: string }> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    // Load profile + available products
    const [{ data: profile }, { data: products }] = await Promise.all([
      context.supabase.from("profiles").select("calorie_goal,protein_goal,weight_kg,dietary_restrictions,allergies,favorite_foods").eq("id", context.userId).maybeSingle(),
      context.supabase.from("products").select("name,calories,protein,carbs,fat,tags").limit(40),
    ]);

    // Catalog-based fallback — never invents dishes outside the catalog.
    let plan: MealPlan = fallbackFromCatalog(data.goal, products);

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
1. USE PRIORITARIAMENTE os produtos do catálogo acima em TODAS as refeições — o usuário só pode comprar o que está no catálogo. Quando usar um produto do catálogo, o campo product_match DEVE ser o nome exato dele.
2. Só sugira uma refeição fora do catálogo se nenhum produto servir para aquele encaixe; nesse caso use uma receita caseira simples e defina product_match como null.
3. Varie os pratos ao longo dos 7 dias — não repita o mesmo produto mais de 3 vezes
4. Cada nota (note) deve ser personalizada ao objetivo do usuário (ex: para emagrecer, mencione o déficit; para ganho de massa, mencione a janela anabólica)
5. Respeite ESTRITAMENTE as alergias e restrições

Responda APENAS JSON sem markdown: {"days":[{"day":"Segunda","meals":{"cafe":{"name":"","calories":n,"protein":n,"carbs":n,"fat":n,"product_match":"nome exato do catálogo ou null","note":"dica personalizada ao objetivo"},"almoco":{...},"lanche":{...},"jantar":{...}}}, ... todos os 7 dias]}`;

const response = await anthropic.messages.create(
  {
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: sys,
    messages: [
      {
        role: "user",
        content: "Gere o plano.",
      },
    ],
  },
  { timeout: 30_000 },
);

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