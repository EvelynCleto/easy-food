/* Coach IA — voice & copy generator
 * Generates personalized, conversational greetings and observations.
 * Treats AI as a character (Coach), not as a component.
 */

type Ctx = {
  hour: number;
  firstName: string;
  calories: number;
  caloriesGoal: number;
  protein: number;
  proteinGoal: number;
  water: number;
  waterGoal: number;
  streak: number;
  isReturning?: boolean;  // logged in recently
};

/** A short, human line. Replaces the generic "Bom dia, Evelyn". */
export function coachGreeting(c: Ctx): { lead: string; name: string } {
  const { hour, firstName, streak } = c;
  const calPct = c.calories / Math.max(c.caloriesGoal, 1);
  const proteinPct = c.protein / Math.max(c.proteinGoal, 1);

  // Morning greetings — set the day
  if (hour >= 6 && hour < 12) {
    if (streak >= 7) return { lead: `bom dia · ${streak} dias seguidos`, name: firstName };
    if (streak >= 3) return { lead: `bom dia · ${streak} dias seguindo a rotina`, name: firstName };
    return { lead: "bom dia", name: firstName };
  }

  // Afternoon — progress matters
  if (hour >= 12 && hour < 18) {
    if (calPct >= 0.9) return { lead: "você está perto da meta de hoje", name: firstName };
    if (calPct >= 0.5) return { lead: "bom ritmo", name: firstName };
    return { lead: "boa tarde", name: firstName };
  }

  // Evening — reflection
  if (hour >= 18 && hour < 22) {
    if (proteinPct >= 0.9) return { lead: "meta de proteína atingida hoje", name: firstName };
    if (calPct >= 1) return { lead: "dia completo", name: firstName };
    return { lead: "boa noite", name: firstName };
  }

  // Late night
  return { lead: "está atento mesmo tarde", name: firstName };
}

/** A subtle line that appears in the corner — "Bom te ver novamente." */
export function coachWelcomeBack(c: Pick<Ctx, "isReturning" | "streak">): string | null {
  if (c.isReturning && c.streak >= 1) return "bom te ver novamente";
  return null;
}

/** Coach observation about the meal — appears in nutrition analysis */
export function coachMealObservation(score: number, mealType?: string): string {
  if (score >= 8.5) return `${mealType || "Essa refeição"} fecha bem o seu dia.`;
  if (score >= 7) return "Boa escolha — equilibrada para esse momento.";
  if (score >= 5) return "Refeição ok. Dá pra ajustar um pouco.";
  return "Vamos compensar nas próximas refeições.";
}

/** Machine "personality" — gives the machine a voice */
export function machineLine(opts: {
  distance_km?: number;
  stock_level: number;
  nextRefillHour?: number;
  hasItemLow?: boolean;
}): string {
  const { distance_km, stock_level, nextRefillHour, hasItemLow } = opts;
  if (hasItemLow) return "última unidade do seu favorito";
  if (stock_level <= 3) return `apenas ${stock_level} pratos restantes`;
  if (distance_km != null && distance_km < 0.5) return `a ${Math.round(distance_km * 1000)} metros`;
  if (nextRefillHour) return `reposição às ${nextRefillHour}h`;
  if (distance_km != null) return `a ${distance_km.toFixed(1)} km de você`;
  return "aberta agora";
}

/** Coach signature — appears at bottom of IA-driven cards */
export const COACH_SIGNATURE = "Coach EasyFood";
