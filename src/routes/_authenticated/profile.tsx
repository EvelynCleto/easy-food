import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Award, Calendar, ChevronRight, CreditCard, Dumbbell, Heart, HelpCircle, LogOut, MapPin, Receipt, Sparkles, Tag, Target, TrendingDown, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { XpBar } from "@/components/premium/XpBar";
import { AchievementBadge } from "@/components/premium/AchievementBadge";

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
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ["achievements", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: all }, { data: mine }] = await Promise.all([
        supabase.from("achievements").select("id,code,title,description,icon,tier,xp_reward").order("xp_reward"),
        supabase.from("user_achievements").select("achievement_id").eq("user_id", user!.id),
      ]);
      const set = new Set((mine ?? []).map((m) => m.achievement_id));
      return (all ?? []).map((a) => ({ ...a, unlocked: set.has(a.id) }));
    },
  });

  const { data: weightHistory = [] } = useQuery({
    queryKey: ["profile-weights", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("weight_logs").select("weight_kg,logged_at").eq("user_id", user!.id).order("logged_at", { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  const saveGoal = useMutation({
    mutationFn: async () => {
      if (!user || !goalWeight) return;
      const { error } = await supabase.from("profiles").update({ weight_goal_kg: Number(goalWeight) }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      setEditingGoal(false);
      toast.success("Meta de peso atualizada");
    },
  });

  const items: { icon: typeof UserIcon; label: string; to?: "/orders" | "/favorites" | "/notifications" | "/meal-plan" | "/onboarding" }[] = [
    { icon: Calendar, label: "Plano semanal IA", to: "/meal-plan" },
    { icon: Receipt, label: "Meus pedidos", to: "/orders" },
    { icon: Heart, label: "Favoritos", to: "/favorites" },
    { icon: UserIcon, label: "Editar perfil", to: "/onboarding" },
    { icon: MapPin, label: "Endereços" },
    { icon: CreditCard, label: "Métodos de pagamento" },
    { icon: Tag, label: "Cupons" },
    { icon: Sparkles, label: "Preferências alimentares" },
    { icon: HelpCircle, label: "Central de ajuda" },
  ];

  const currentW = profile?.weight_kg ? Number(profile.weight_kg) : null;
  const goalW = profile?.weight_goal_kg ? Number(profile.weight_goal_kg) : null;
  const startW = weightHistory.length ? Number(weightHistory[weightHistory.length - 1].weight_kg) : currentW;
  const lost = currentW && startW ? startW - currentW : 0;
  const goalProgress = currentW && goalW && startW && startW !== goalW
    ? Math.min(100, Math.max(0, ((startW - currentW) / (startW - goalW)) * 100))
    : 0;
  const bmi = profile?.weight_kg && profile?.height_cm ? Number(profile.weight_kg) / Math.pow(Number(profile.height_cm) / 100, 2) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.5_0.16_140)] p-6 text-primary-foreground">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-white/20 text-2xl font-bold">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : (profile?.full_name ?? user?.email ?? "?")[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold">{profile?.full_name ?? "EasyFooder"}</h1>
            <p className="truncate text-sm text-primary-foreground/90">{user?.email}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Tile label="Peso" value={currentW ? `${currentW.toFixed(1)}kg` : "—"} />
          <Tile label="IMC" value={bmi ? bmi.toFixed(1) : "—"} />
          <Tile label="Streak" value={`${profile?.streak_days ?? 0}d`} />
        </div>
      </div>

      <XpBar xp={profile?.xp ?? 0} />

      <div className="rounded-3xl bg-card p-5 ring-1 ring-border/60">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground"><Target size={12} /> Meta de peso</div>
            <div className="mt-1 font-display text-2xl font-bold">
              {goalW ? `${goalW.toFixed(1)} kg` : "Defina sua meta"}
            </div>
            {lost !== 0 && (
              <div className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${lost > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                <TrendingDown size={12} className={lost < 0 ? "rotate-180" : ""} />
                {Math.abs(lost).toFixed(1)} kg desde o início
              </div>
            )}
          </div>
          <button onClick={() => { setEditingGoal((v) => !v); setGoalWeight(goalW ? String(goalW) : ""); }}
            className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            {editingGoal ? "Cancelar" : "Editar"}
          </button>
        </div>
        {goalW && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all" style={{ width: `${goalProgress}%` }} />
          </div>
        )}
        {editingGoal && (
          <div className="mt-3 flex gap-2">
            <input type="number" step="0.1" placeholder="Peso alvo (kg)" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)}
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm" />
            <button onClick={() => saveGoal.mutate()} disabled={saveGoal.isPending}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">Salvar</button>
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-card p-5 ring-1 ring-border/60">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-semibold"><Award size={14} className="text-primary" /> Conquistas</div>
          <span className="text-xs text-muted-foreground">{achievements.filter((a) => a.unlocked).length}/{achievements.length}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {achievements.map((a) => <AchievementBadge key={a.id} a={a} />)}
        </div>
      </div>

      {(profile?.training_days_per_week || profile?.training_type) && (
        <div className="rounded-3xl bg-card p-5 ring-1 ring-border/60">
          <div className="flex items-center gap-1.5 text-sm font-semibold"><Dumbbell size={14} className="text-primary" /> Treino</div>
          <div className="mt-2 text-xs text-muted-foreground">
            {profile?.training_type ?? "—"} · {profile?.training_days_per_week ?? 0}× por semana
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border/60">
        {items.map((it, i) => {
          const inner = (
            <>
              <span className="flex items-center gap-3"><it.icon size={18} className="text-primary" />{it.label}</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </>
          );
          const cls = "flex w-full items-center justify-between gap-3 border-b border-border/60 p-4 text-sm last:border-0 hover:bg-accent/40";
          return it.to ? (
            <Link key={i} to={it.to} className={cls}>{inner}</Link>
          ) : (
            <button key={i} className={cls}>{inner}</button>
          );
        })}
      </div>

      <button onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-card py-3 text-sm font-semibold text-destructive hover:bg-destructive/10">
        <LogOut size={16} /> Sair
      </button>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/15 p-3">
      <div className="text-[10px] uppercase opacity-80">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}