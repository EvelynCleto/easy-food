import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Msg = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const Input = z.object({
  messages: z.array(Msg).min(1).max(20),
});

const GOAL_LABEL: Record<string, string> = {
  emagrecimento: "emagrecimento",
  emagrecer: "emagrecimento",
  manutencao: "manutenção de peso",
  ganho_massa: "ganho de massa muscular",
  saude: "mais saúde no geral",
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const coachChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }): Promise<{ reply: string }> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { reply: "O coach está indisponível agora (IA não configurada). Tente de novo mais tarde." };
    }

    const today = startOfToday().toISOString();
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();

    // Pull the user's real, recent context
    const [{ data: profile }, { data: todayMeals }, { data: weekMeals }, { data: waters }, { data: plan }] = await Promise.all([
      context.supabase.from("profiles").select("full_name,goal,calorie_goal,protein_goal,weight_kg,weight_goal_kg,dietary_restrictions,allergies,streak_days").eq("id", context.userId).maybeSingle(),
      context.supabase.from("nutritional_analysis").select("calories,protein,score,meal_type,foods").gte("created_at", today).eq("user_id", context.userId),
      context.supabase.from("nutritional_analysis").select("calories,score,created_at").gte("created_at", weekAgo).eq("user_id", context.userId),
      context.supabase.from("water_logs").select("amount_ml").gte("logged_at", today).eq("user_id", context.userId),
      context.supabase.from("meal_plans").select("goal,created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const calToday = (todayMeals ?? []).reduce((s, m) => s + Number(m.calories ?? 0), 0);
    const protToday = (todayMeals ?? []).reduce((s, m) => s + Number(m.protein ?? 0), 0);
    const waterToday = (waters ?? []).reduce((s, w) => s + Number(w.amount_ml ?? 0), 0);
    const weekDays = new Set((weekMeals ?? []).map((m) => new Date(m.created_at as string).toDateString())).size;
    const weekScores = (weekMeals ?? []).filter((m) => m.score != null).map((m) => Number(m.score));
    const avgScore = weekScores.length ? (weekScores.reduce((a, b) => a + b, 0) / weekScores.length) : null;
    const todayFoods = (todayMeals ?? []).flatMap((m) => (Array.isArray(m.foods) ? (m.foods as { name?: string }[]).map((f) => f?.name).filter(Boolean) : [])).slice(0, 12);

    const ctx = [
      `Nome: ${profile?.full_name ?? "usuário"}`,
      `Objetivo: ${GOAL_LABEL[profile?.goal ?? ""] ?? profile?.goal ?? "não definido"}`,
      `Meta diária: ${profile?.calorie_goal ?? 2000} kcal, ${profile?.protein_goal ?? 120}g de proteína`,
      profile?.weight_kg ? `Peso atual: ${profile.weight_kg}kg${profile?.weight_goal_kg ? ` (meta ${profile.weight_goal_kg}kg)` : ""}` : null,
      `Restrições: ${(profile?.dietary_restrictions ?? []).join(", ") || "nenhuma"}; Alergias: ${(profile?.allergies ?? []).join(", ") || "nenhuma"}`,
      `Sequência atual: ${profile?.streak_days ?? 0} dias`,
      `HOJE até agora: ${Math.round(calToday)} kcal, ${Math.round(protToday)}g proteína, ${(waterToday / 1000).toFixed(1)}L de água. Refeições registradas hoje: ${(todayMeals ?? []).length}${todayFoods.length ? ` (${todayFoods.join(", ")})` : ""}.`,
      `ÚLTIMOS 7 DIAS: ativo em ${weekDays} dias${avgScore != null ? `, nota média das refeições ${avgScore.toFixed(1)}/10` : ""}.`,
      plan ? `Tem um plano semanal ativo com objetivo "${GOAL_LABEL[plan.goal] ?? plan.goal}".` : `Ainda não gerou um plano semanal.`,
    ].filter(Boolean).join("\n");

    const system = `Você é o Coach EasyFood — um coach de nutrição que conversa como uma pessoa real, em português brasileiro, com tom caloroso, direto e motivador. Use os DADOS REAIS do usuário abaixo para dar respostas específicas e contextualizadas, nunca genéricas. Fale na segunda pessoa ("você"), frases curtas e naturais. Nada de listas clínicas, "considere", "é importante ressaltar" ou disclaimers médicos longos. Quando fizer sentido, faça referência ao que a pessoa comeu/bebeu hoje e à semana dela. Se perguntarem algo fora de nutrição/alimentação/treino, traga de volta com leveza. Você NÃO substitui um nutricionista para condições clínicas — se for o caso, diga isso em uma frase e siga ajudando no que dá.

DADOS DO USUÁRIO:
${ctx}`;

    const anthropic = new Anthropic({ apiKey });
    try {
      const response = await anthropic.messages.create(
        {
          model: "claude-sonnet-4-6",
          max_tokens: 700,
          system,
          messages: data.messages.map((m) => ({ role: m.role, content: m.content })),
        },
        { timeout: 30_000 },
      );
      const reply = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { reply: reply || "Não consegui responder agora. Pode reformular?" };
    } catch {
      return { reply: "Tive um problema pra responder agora. Tenta de novo em instantes 🙏" };
    }
  });
