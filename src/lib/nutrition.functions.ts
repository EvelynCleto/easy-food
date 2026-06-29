import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  imageBase64: z.string().min(20),
});

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

function extractBase64Image(dataUrl: string): {
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  base64: string;
} {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Imagem inválida. Envie uma imagem em base64/dataURL.");
  }

  const rawMediaType = match[1];
  const base64 = match[2];

  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;

  if (!allowed.includes(rawMediaType as any)) {
    throw new Error(`Formato de imagem não suportado: ${rawMediaType}`);
  }

  return {
    mediaType: rawMediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
    base64,
  };
}

function getTextFromAnthropicResponse(response: Anthropic.Messages.Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function parseNutritionJson(text: string): NutritionResult {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error(`A IA não retornou JSON válido. Resposta: ${cleaned.slice(0, 500)}`);
  }

  const parsed = JSON.parse(match[0]) as NutritionResult;

  return {
    foods: Array.isArray(parsed.foods) ? parsed.foods : [],
    calories: Number(parsed.calories || 0),
    protein: Number(parsed.protein || 0),
    carbs: Number(parsed.carbs || 0),
    fiber: Number(parsed.fiber || 0),
    fat: Number(parsed.fat || 0),
    notes: parsed.notes,
    score: parsed.score == null ? undefined : Number(parsed.score),
    ai_suggestions: Array.isArray(parsed.ai_suggestions) ? parsed.ai_suggestions : [],
    meal_type: parsed.meal_type,
  };
}

export const analyzeMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }): Promise<NutritionResult & { id: string }> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY não configurada no ambiente.");
    }

    const { mediaType, base64 } = extractBase64Image(data.imageBase64);

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system:
        "Você é um Nutricionista Coach. Analise a imagem da refeição e responda APENAS JSON válido no formato: {\"foods\":[{\"name\":\"...\",\"quantity\":\"...\"}],\"calories\":number,\"protein\":number,\"carbs\":number,\"fiber\":number,\"fat\":number,\"score\":number,\"ai_suggestions\":[\"dica 1\",\"dica 2\",\"dica 3\"],\"meal_type\":\"café da manhã|almoço|lanche|jantar\",\"notes\":\"frase curta\"}. Valores em gramas, calorias em kcal. Não use markdown.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identifique os alimentos visíveis nesta refeição e estime os nutrientes com realismo.",
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
          ],
        },
      ],
    });

    const text = getTextFromAnthropicResponse(response);
    const parsed = parseNutritionJson(text);

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

    if (error) {
      throw new Error(error.message);
    }

    return { ...parsed, id: row!.id };
  });
