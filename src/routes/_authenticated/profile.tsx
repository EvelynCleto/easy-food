import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Calendar, ChevronRight, Heart, Lock, LogOut,
  Receipt, User as UserIcon, TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { streakNarrative } from "@/lib/intent";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalWeight, setGoalWeight] = useState<string>("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: weightHistory = [] } = useQuery({
    queryKey: ["profile-weights", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("weight_logs").select("weight_kg,logged_at").eq("user_id", user!.id).order("logged_at", { ascending: false }).limit(10)).data ?? [],
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ["achievements", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: all }, { data: mine }] = await Promise.all([
        supabase.from("achievements").select("id,title,description,xp_reward").order("xp_reward"),
        supabase.from("user_achievements").select("achievement_id,unlocked_at").eq("user_id", user!.id),
      ]);
      const map = new Map((mine ?? []).map((m) => [m.achievement_id, m.unlocked_at]));
      return (all ?? []).map((a) => ({ ...a, unlocked: map.has(a.id), unlocked_at: map.get(a.id) ?? null }));
    },
  });

  const saveGoal = useMutation({
    mutationFn: async () => {
      if (!user || !goalWeight) return;
      const { error } = await supabase.from("profiles").update({ weight_goal_kg: Number(goalWeight) }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); setEditingGoal(false); toast.success("Meta atualizada"); },
  });

  const items: { icon: typeof UserIcon; label: string; to: "/orders" | "/favorites" | "/meal-plan" | "/onboarding" }[] = [
    { icon: Calendar, label: "Plano semanal", to: "/meal-plan" },
    { icon: Receipt, label: "Pedidos", to: "/orders" },
    { icon: Heart, label: "Favoritos", to: "/favorites" },
    { icon: UserIcon, label: "Editar perfil", to: "/onboarding" },
  ];

  const currentW = profile?.weight_kg ? Number(profile.weight_kg) : null;
  const goalW = profile?.weight_goal_kg ? Number(profile.weight_goal_kg) : null;
  const startW = weightHistory.length ? Number(weightHistory[weightHistory.length - 1].weight_kg) : currentW;
  const lost = currentW && startW ? startW - currentW : 0;
  const bmi = profile?.weight_kg && profile?.height_cm ? Number(profile.weight_kg) / Math.pow(Number(profile.height_cm) / 100, 2) : null;
  const firstLetter = (profile?.full_name ?? user?.email ?? "?")[0]?.toUpperCase();
  const streak = profile?.streak_days ?? 0;
  const xp = profile?.xp ?? 0;
  const level = Math.floor(xp / 100) + 1;
  const xpInLevel = xp % 100;
  const streakLine = streakNarrative(streak);

  return (
    <div className="animate-rise mx-auto max-w-[920px]">
      {/* HEADER */}
      <header className="flex items-center gap-5">
        <div
          className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full font-display text-[26px] font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #2DAB6B 0%, #1E8654 100%)" }}
        >
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : firstLetter}
        </div>
        <div className="min-w-0">
          <h1 className="text-headline truncate">{profile?.full_name ?? "Visitante"}</h1>
          <p className="mt-1 truncate text-body-sm" style={{ color: "var(--ink-2)" }}>{user?.email}</p>
        </div>
      </header>

      {/* STATS */}
      <div className="card-aurora mt-8 grid grid-cols-3" style={{ padding: 0 }}>
        <Stat label="Peso" value={currentW ? `${currentW.toFixed(1)}` : "—"} unit="kg" />
        <Stat label="IMC" value={bmi ? bmi.toFixed(1) : "—"} unit="" divided />
        <Stat label="Sequência" value={`${streak}`} unit="dias" divided />
      </div>

      {/* SUA JORNADA */}
      <section className="mt-12">
        <p className="text-eyebrow">progresso</p>
        <h2 className="text-headline mt-3">Sua jornada</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Level */}
          <div className="card-nested p-6">
            <p className="text-eyebrow">nível</p>
            <p className="mt-2 font-display text-[32px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>{level}</p>
            <p className="text-body-sm" style={{ color: "var(--ink-2)" }}>{xpInLevel} / 100 XP</p>
            <div className="mt-4 h-[5px] w-full overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${xpInLevel}%`, background: "var(--primary)" }} />
            </div>
          </div>

          {/* Streak narrative */}
          <div className="card-nested p-6">
            <p className="text-eyebrow">consistência</p>
            <p className="mt-2 font-display text-[32px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>{streak}</p>
            <p className="text-body-sm" style={{ color: "var(--ink-2)" }}>
              {streakLine ?? "comece sua sequência hoje"}
            </p>
          </div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="mt-4 card-nested overflow-hidden">
            <div className="px-6 py-5" style={{ borderBottom: "0.5px solid var(--hairline)" }}>
              <p className="text-eyebrow">conquistas</p>
              <p className="mt-1 text-body-sm" style={{ color: "var(--ink-2)" }}>
                {achievements.filter((a) => a.unlocked).length} de {achievements.length}
              </p>
            </div>
            {achievements.slice(0, 5).map((a, i) => (
              <div key={a.id} className="flex items-center gap-4 px-6 py-4" style={{ borderTop: i > 0 ? "0.5px solid var(--hairline)" : "none" }}>
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                  style={{
                    background: a.unlocked ? "var(--accent)" : "var(--surface)",
                    color: a.unlocked ? "var(--primary)" : "var(--ink-3)",
                  }}
                >
                  {a.unlocked
                    ? <span className="text-[14px] font-bold">✓</span>
                    : <Lock size={13} strokeWidth={1.8} />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-semibold" style={{ color: a.unlocked ? "var(--ink-1)" : "var(--ink-3)" }}>
                    {a.title}
                  </p>
                  <p className="truncate text-caption">{a.description}</p>
                  {!a.unlocked && (
                    <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--ink-3)" }}>
                      +{a.xp_reward} XP ao desbloquear
                    </p>
                  )}
                </div>
                {a.unlocked && a.unlocked_at && (
                  <p className="text-caption shrink-0">
                    {new Date(a.unlocked_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* WEIGHT GOAL */}
      <section className="card-nested mt-6 p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-eyebrow">meta de peso</p>
            <p className="mt-2 font-display text-[32px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>
              {goalW ? <>{goalW.toFixed(1)}<span className="ml-1 text-[15px] font-normal" style={{ color: "var(--ink-3)" }}>kg</span></> : "—"}
            </p>
            {lost !== 0 && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-caption">
                <TrendingDown size={12} className={lost < 0 ? "rotate-180" : ""} />
                {Math.abs(lost).toFixed(1)} kg desde o início
              </div>
            )}
          </div>
          <button
            onClick={() => { setEditingGoal((v) => !v); setGoalWeight(goalW ? String(goalW) : ""); }}
            className="rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition hover:opacity-80"
            style={{ background: "var(--surface)", color: "var(--ink-1)" }}
          >
            {editingGoal ? "Cancelar" : "Editar"}
          </button>
        </div>
        {editingGoal && (
          <div className="mt-4 flex gap-2">
            <input
              type="number" step="0.1" placeholder="Peso alvo (kg)"
              value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)}
              className="input-aurora flex-1"
            />
            <button onClick={() => saveGoal.mutate()} disabled={saveGoal.isPending} className="btn-primary">
              Salvar
            </button>
          </div>
        )}
      </section>

      {/* MENU */}
      <section className="mt-6">
        <div className="card-nested overflow-hidden">
          {items.map((it, i) => (
            <Link key={i} to={it.to}
              className="flex w-full items-center justify-between px-5 py-4 transition hover:opacity-80"
              style={i > 0 ? { borderTop: "0.5px solid var(--hairline)" } : {}}
            >
              <span className="flex items-center gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: "var(--surface)" }}>
                  <it.icon size={15} strokeWidth={1.7} style={{ color: "var(--ink-2)" }} />
                </span>
                <span className="text-[14.5px] font-medium" style={{ color: "var(--ink-1)" }}>{it.label}</span>
              </span>
              <ChevronRight size={16} style={{ color: "var(--ink-3)" }} />
            </Link>
          ))}
        </div>
      </section>

      <button
        onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[13.5px] font-semibold transition hover:opacity-70"
        style={{ background: "var(--surface)", color: "var(--destructive)" }}
      >
        <LogOut size={15} /> Sair da conta
      </button>
    </div>
  );
}

function Stat({ label, value, unit, divided }: { label: string; value: string; unit: string; divided?: boolean }) {
  return (
    <div className="px-5 py-7 text-center" style={divided ? { borderLeft: "0.5px solid var(--hairline)" } : {}}>
      <p className="text-eyebrow">{label}</p>
      <p className="mt-2 font-display text-[24px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>
        {value}
        {unit && <span className="ml-1 text-[12px] font-normal" style={{ color: "var(--ink-3)" }}>{unit}</span>}
      </p>
    </div>
  );
}
