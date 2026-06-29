import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ imageBase64: z.string().min(20) });

export type NutritionResult = {
  foods: { name: string; quantity: string }[];
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  fat: number;
  notes?: string;
  score?: number;
  ai_suggestions?: string[];
  meal_type?: string;
};

const FALLBACK: NutritionResult = {
  foods: [
    { name: "Arroz integral", quantity: "1 xícara (~150g)" },
    { name: "Frango grelhado", quantity: "1 filé (~120g)" },
    { name: "Salada de folhas", quantity: "1 prato" },
  ],
  calories: 480,
  protein: 38,
  carbs: 52,
  fiber: 6,
  fat: 12,
  notes: "Análise estimada — IA indisponível, mostrando exemplo.",
  score: 7.8,
  ai_suggestions: [
    "Adicione brócolis ou couve para aumentar fibras.",
    "Boa fonte de proteína magra — mantenha essa base.",
    "Inclua azeite de oliva cru para gorduras boas.",
  ],
  meal_type: "almoço",
};

export const analyzeMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }): Promise<NutritionResult & { id: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    let parsed: NutritionResult = FALLBACK;

    if (apiKey) {
      try {
        const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
        const gw = createLovableAiGatewayProvider(apiKey);
        const model = gw("google/gemini-2.5-flash");
        const { text } = await generateText({
          model,
          messages: [
            {
              role: "system",
              content:
                "Você é um Nutricionista Coach. Analise a imagem da refeição e responda APENAS JSON válido: {\"foods\":[{\"name\":\"...\",\"quantity\":\"...\"}],\"calories\":number,\"protein\":number,\"carbs\":number,\"fiber\":number,\"fat\":number,\"score\":number (0-10, qualidade nutricional global),\"ai_suggestions\":[\"3 dicas curtas e práticas em PT-BR para melhorar essa refeição\"],\"meal_type\":\"café da manhã|almoço|lanche|jantar\",\"notes\":\"frase curta\"}. Valores em gramas (calorias em kcal). NÃO use markdown.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Identifique os alimentos e estime a nutrição." },
                { type: "image", image: data.imageBase64 },
              ],
            },
          ],
        });
        const cleaned = text.replace(/```json|```/g, "").trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]) as NutritionResult;
      } catch (e) {
        console.error("AI analysis failed", e);
      }
    }

    const { data: row, error } = await context.supabase
      .from("nutritional_analysis")
      .insert({
        user_id: context.userId,
        foods: parsed.foods,
        calories: Math.round(parsed.calories || 0),
        protein: parsed.protein || 0,
        carbs: parsed.carbs || 0,
        fiber: parsed.fiber || 0,
        fat: parsed.fat || 0,
        notes: parsed.notes,
        score: parsed.score ?? null,
        ai_suggestions: parsed.ai_suggestions ?? [],
        meal_type: parsed.meal_type ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ...parsed, id: row!.id };
  });