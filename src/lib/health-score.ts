// Computes a 0-100 Health Score from daily activity signals.
// Pondera: água (25), proteína (25), calorias (20 perto da meta), frequência (15),
// nota média das refeições da semana (15).

export type HealthInputs = {
  caloriesToday: number;
  calorieGoal: number;
  proteinToday: number;
  proteinGoal: number;
  waterTodayMl: number;
  waterGoalMl: number;
  activeDaysLast7: number;
  avgMealScore?: number | null; // 0-10
};

export function computeHealthScore(i: HealthInputs) {
  const waterPct = clamp(i.waterTodayMl / Math.max(1, i.waterGoalMl));
  const proteinPct = clamp(i.proteinToday / Math.max(1, i.proteinGoal));
  const caloriePct = caloriesProximity(i.caloriesToday, i.calorieGoal);
  const frequency = clamp(i.activeDaysLast7 / 7);
  const meal = clamp((i.avgMealScore ?? 0) / 10);

  const score = Math.round(
    waterPct * 25 +
      proteinPct * 25 +
      caloriePct * 20 +
      frequency * 15 +
      meal * 15,
  );
  return { score, breakdown: { waterPct, proteinPct, caloriePct, frequency, meal } };
}

function clamp(n: number) {
  if (!isFinite(n) || n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function caloriesProximity(cur: number, goal: number) {
  if (goal <= 0) return 0;
  const ratio = cur / goal;
  if (ratio >= 0.9 && ratio <= 1.1) return 1;
  if (ratio >= 0.75 && ratio <= 1.25) return 0.7;
  if (ratio >= 0.5 && ratio <= 1.5) return 0.4;
  return 0.15;
}

export function scoreColor(s: number) {
  if (s >= 80) return "from-emerald-500 to-emerald-400";
  if (s >= 60) return "from-amber-500 to-amber-400";
  if (s >= 40) return "from-orange-500 to-orange-400";
  return "from-rose-500 to-rose-400";
}

export function scoreLabel(s: number) {
  if (s >= 85) return "Excelente";
  if (s >= 70) return "Muito bom";
  if (s >= 50) return "Bom";
  if (s >= 30) return "Atenção";
  return "Crítico";
}