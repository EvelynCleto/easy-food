/* IA contextual logic — computes the "Próximo passo" suggestion based on time + nutrition */

export type Intent = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: { label: string; to: string };
  secondaryAction?: { label: string; to: string };
};

type Ctx = {
  hour: number;
  calories: number;
  caloriesGoal: number;
  protein: number;
  proteinGoal: number;
  water: number;
  waterGoal: number;
};

function fmt(n: number) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function computeIntent(c: Ctx): Intent {
  const calLeft = c.caloriesGoal - c.calories;
  const proteinLeft = c.proteinGoal - c.protein;
  const waterLeft = c.waterGoal - c.water;
  const proteinPct = c.protein / Math.max(c.proteinGoal, 1);
  const waterPct = c.water / Math.max(c.waterGoal, 1);

  // Late morning — almoço
  if (c.hour >= 11 && c.hour < 14) {
    return {
      eyebrow: "EasyFood sugere",
      title: "Hora de um bom almoço",
      description: calLeft > 600
        ? `Você está ${fmt(calLeft)} kcal abaixo da meta. Considere algo proteico para repor energia.`
        : "Mantenha o ritmo. Um almoço balanceado fecha bem o dia.",
      primaryAction: { label: "Ver opções", to: "/catalog" },
      secondaryAction: { label: "criar plano", to: "/meal-plan" },
    };
  }

  // Afternoon — water gap
  if (c.hour >= 14 && c.hour < 17 && waterPct < 0.5) {
    return {
      eyebrow: "Lembrete suave",
      title: "Hidrate-se",
      description: `Você bebeu ${(c.water/1000).toFixed(1)} L hoje, faltam ${(waterLeft/1000).toFixed(1)} L para a meta.`,
      primaryAction: { label: "Marcar 250 ml", to: "/nutrition" },
    };
  }

  // Late afternoon / pre-dinner — protein gap
  if (c.hour >= 17 && c.hour < 20 && proteinLeft > 25) {
    return {
      eyebrow: "EasyFood sugere",
      title: "Faltam proteínas no seu dia",
      description: `${fmt(proteinLeft)}g restantes para sua meta. Um jantar proteico fecha o dia bem.`,
      primaryAction: { label: "Pratos com proteína", to: "/catalog" },
    };
  }

  // Evening — wind down
  if (c.hour >= 20 || c.hour < 6) {
    return {
      eyebrow: "Resumo do dia",
      title: proteinPct >= 0.9 ? "Excelente trabalho hoje" : "Quase lá",
      description: proteinPct >= 0.9
        ? "Suas metas foram atingidas. Seu corpo agradece."
        : "Algumas metas ficaram pendentes — amanhã é uma nova oportunidade.",
      primaryAction: { label: "Ver progresso", to: "/profile" },
    };
  }

  // Early morning — café da manhã
  if (c.hour >= 6 && c.hour < 11) {
    return {
      eyebrow: "EasyFood sugere",
      title: "Comece o dia bem",
      description: "Um café da manhã rico em proteína ajuda a manter saciedade até o almoço.",
      primaryAction: { label: "Ver opções", to: "/catalog" },
    };
  }

  // Fallback
  return {
    eyebrow: "EasyFood sugere",
    title: "Que tal um plano semanal?",
    description: "A IA monta um cardápio personalizado para sua meta.",
    primaryAction: { label: "Criar plano", to: "/meal-plan" },
  };
}

export function streakNarrative(days: number): string | undefined {
  if (days < 3) return undefined;
  if (days >= 30) return `${days} dias cuidando da sua alimentação`;
  if (days >= 7) return `${days} dias seguindo sua rotina`;
  return `${days} dias cuidando da sua alimentação`;
}

export function todayString(d = new Date()): string {
  const weekdays = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${weekdays[d.getDay()]} · ${d.getDate()} ${months[d.getMonth()]}`;
}

export function greetingForHour(name: string, hour: number): string {
  if (hour < 12) return `Bom dia${name ? `, ${name}` : ""}`;
  if (hour < 18) return `Boa tarde${name ? `, ${name}` : ""}`;
  return `Boa noite${name ? `, ${name}` : ""}`;
}
