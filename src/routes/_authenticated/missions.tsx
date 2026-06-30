import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Droplet, Beef, Camera, CalendarDays, MessageCircle, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usedCoachToday } from "@/lib/engagement";
import { StreakFlame } from "@/components/premium/StreakFlame";
import { levelFromXp } from "@/components/premium/XpBar";
import { celebrate, celebrateLevelUp } from "@/lib/celebrate";

export const Route = createFileRoute("/_authenticated/missions")({
  component: MissionsPage,
});

const CLAIMED_KEY = "easyfood_missions_claimed_v1";

function loadClaimed(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(CLAIMED_KEY) ?? "{}"); } catch { return {}; }
}
function saveClaimed(c: Record<string, boolean>) {
  try { localStorage.setItem(CLAIMED_KEY, JSON.stringify(c)); } catch { /* ignore */ }
}

function dayPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function weekPeriod() {
  const d = new Date();
  const onejan = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - onejan.getTime()) / 864e5) + onejan.getDay() + 1) / 7);
  return `${d.getFullYear()}-w${week}`;
}

type Mission = {
  id: string;
  icon: typeof Camera;
  title: string;
  hint: string;
  progress: number;
  target: number;
  reward: number;
  period: string;
};

function MissionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [claimed, setClaimed] = useState<Record<string, boolean>>(loadClaimed);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("xp,protein_goal,water_goal_ml,streak_days").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: stats } = useQuery({
    queryKey: ["missions-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const [{ data: meals }, { data: waters }, { data: plan }] = await Promise.all([
        supabase.from("nutritional_analysis").select("protein").gte("created_at", start.toISOString()).eq("user_id", user!.id),
        supabase.from("water_logs").select("amount_ml").gte("logged_at", start.toISOString()).eq("user_id", user!.id),
        supabase.from("meal_plans").select("created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      const mealCount = (meals ?? []).length;
      const protein = (meals ?? []).reduce((s, m) => s + Number(m.protein ?? 0), 0);
      const water = (waters ?? []).reduce((s, w) => s + Number(w.amount_ml ?? 0), 0);
      const planThisWeek = plan ? (Date.now() - new Date(plan.created_at).getTime()) < 7 * 864e5 : false;
      return { mealCount, protein, water, planThisWeek };
    },
  });

  const claim = useMutation({
    mutationFn: async (m: Mission) => {
      if (!user) throw new Error("Sem sessão");
      const currentXp = Number(profile?.xp ?? 0);
      const { error } = await supabase.from("profiles").update({ xp: currentXp + m.reward }).eq("id", user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, m) => {
      const next = { ...claimed, [`${m.id}:${m.period}`]: true };
      setClaimed(next); saveClaimed(next);
      qc.invalidateQueries({ queryKey: ["profile"] });
      const before = Number(profile?.xp ?? 0);
      const leveledUp = levelFromXp(before).level !== levelFromXp(before + m.reward).level;
      if (leveledUp) {
        celebrateLevelUp();
        toast.success(`Você subiu para o nível ${levelFromXp(before + m.reward).level}! 🎉`);
      } else {
        celebrate();
        toast.success(`+${m.reward} XP!`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const proteinGoal = profile?.protein_goal ?? 120;
  const waterGoal = profile?.water_goal_ml ?? 2500;
  const s = stats ?? { mealCount: 0, protein: 0, water: 0, planThisWeek: false };

  const daily: Mission[] = [
    { id: "log_1", icon: Camera, title: "Registre uma refeição", hint: "Analise uma foto hoje", progress: Math.min(s.mealCount, 1), target: 1, reward: 20, period: dayPeriod() },
    { id: "log_3", icon: Sparkles, title: "Registre 3 refeições", hint: "Mantenha o dia completo", progress: Math.min(s.mealCount, 3), target: 3, reward: 50, period: dayPeriod() },
    { id: "protein", icon: Beef, title: "Bata a meta de proteína", hint: `${Math.round(s.protein)}/${proteinGoal}g hoje`, progress: Math.min(s.protein, proteinGoal), target: proteinGoal, reward: 40, period: dayPeriod() },
    { id: "water", icon: Droplet, title: "Hidrate-se", hint: `${(s.water / 1000).toFixed(1)}/${(waterGoal / 1000).toFixed(1)}L hoje`, progress: Math.min(s.water, waterGoal), target: waterGoal, reward: 30, period: dayPeriod() },
    { id: "coach", icon: MessageCircle, title: "Converse com o coach", hint: "Tire uma dúvida com a IA hoje", progress: usedCoachToday() ? 1 : 0, target: 1, reward: 25, period: dayPeriod() },
  ];
  const weekly: Mission[] = [
    { id: "plan", icon: CalendarDays, title: "Gere seu plano da semana", hint: "Cardápio personalizado de 7 dias", progress: s.planThisWeek ? 1 : 0, target: 1, reward: 80, period: weekPeriod() },
  ];

  return (
    <div className="animate-rise mx-auto max-w-[720px]">
      <header className="mb-8">
        <p className="text-eyebrow" style={{ color: "var(--ai)" }}>◇ missões</p>
        <h1 className="text-display-m mt-3">Suas missões</h1>
        <p className="mt-3 text-body-sm" style={{ color: "var(--ink-2)" }}>
          Complete tarefas e ganhe XP de verdade. Renovam todo dia.
        </p>
      </header>

      <div className="mb-8">
        <StreakFlame streak={profile?.streak_days ?? 0} />
      </div>

      <Section title="Hoje" missions={daily} claimed={claimed} onClaim={(m) => claim.mutate(m)} pending={claim.isPending} />
      <div className="mt-8">
        <Section title="Esta semana" missions={weekly} claimed={claimed} onClaim={(m) => claim.mutate(m)} pending={claim.isPending} />
      </div>

      <Link to="/profile" className="mt-8 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[13.5px] font-semibold" style={{ background: "var(--surface)", color: "var(--ink-1)" }}>
        <Trophy size={15} style={{ color: "var(--primary)" }} /> Ver conquistas no perfil
      </Link>
    </div>
  );
}

function Section({ title, missions, claimed, onClaim, pending }: {
  title: string; missions: Mission[]; claimed: Record<string, boolean>;
  onClaim: (m: Mission) => void; pending: boolean;
}) {
  return (
    <section>
      <h2 className="text-title-lg mb-4">{title}</h2>
      <div className="space-y-3">
        {missions.map((m) => {
          const done = m.progress >= m.target;
          const isClaimed = claimed[`${m.id}:${m.period}`];
          const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
          return (
            <div key={m.id} className="card-nested flex items-center gap-4 p-5">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                style={{ background: done ? "var(--accent)" : "var(--surface)", color: done ? "var(--primary)" : "var(--ink-3)" }}>
                <m.icon size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold" style={{ color: "var(--ink-1)" }}>{m.title}</p>
                <p className="text-caption">{m.hint}</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: done ? "var(--primary)" : "var(--ink-2)" }} />
                </div>
              </div>
              <div className="shrink-0">
                {isClaimed ? (
                  <span className="flex items-center gap-1 text-[12px] font-bold" style={{ color: "var(--primary)" }}>
                    <Check size={14} /> +{m.reward}
                  </span>
                ) : done ? (
                  <button
                    onClick={() => onClaim(m)}
                    disabled={pending}
                    className="press rounded-full px-4 py-2 text-[12.5px] font-bold disabled:opacity-50"
                    style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                  >
                    +{m.reward} XP
                  </button>
                ) : (
                  <span className="text-[12px] font-semibold tabular-nums" style={{ color: "var(--ink-3)" }}>+{m.reward}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
