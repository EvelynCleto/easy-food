import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Calendar, ChevronRight, CreditCard, Heart, HelpCircle, LogOut,
  MapPin, Receipt, Sparkles, Tag, Target, TrendingDown, User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

  const saveGoal = useMutation({
    mutationFn: async () => {
      if (!user || !goalWeight) return;
      const { error } = await supabase.from("profiles").update({ weight_goal_kg: Number(goalWeight) }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); setEditingGoal(false); toast.success("Meta atualizada"); },
  });

  const items: { icon: typeof UserIcon; label: string; to?: "/orders" | "/favorites" | "/meal-plan" | "/onboarding" }[] = [
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
  const bmi = profile?.weight_kg && profile?.height_cm ? Number(profile.weight_kg) / Math.pow(Number(profile.height_cm) / 100, 2) : null;
  const firstLetter = (profile?.full_name ?? user?.email ?? "?")[0]?.toUpperCase();

  return (
    <div className="mx-auto max-w-[860px]">
      {/* HERO */}
      <header className="flex items-center gap-5">
        <div
          className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full font-display text-[28px] font-bold text-white"
          style={{ background: "linear-gradient(135deg, oklch(0.62 0.165 145) 0%, oklch(0.48 0.155 145) 100%)" }}
        >
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : firstLetter}
        </div>
        <div className="min-w-0">
          <h1 className="text-title-1 truncate">{profile?.full_name ?? "Visitante"}</h1>
          <p className="mt-1 truncate text-[14px] text-muted-foreground">{user?.email}</p>
        </div>
      </header>

      {/* STATS CARD */}
      <div className="card-base mt-8 grid grid-cols-3 divide-x divide-border/60">
        <Stat label="Peso" value={currentW ? `${currentW.toFixed(1)}` : "—"} unit="kg" />
        <Stat label="IMC" value={bmi ? bmi.toFixed(1) : "—"} unit="" />
        <Stat label="Sequência" value={`${profile?.streak_days ?? 0}`} unit="dias" />
      </div>

      {/* WEIGHT GOAL */}
      <section className="card-base mt-6 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
              <Target size={14} strokeWidth={2} />
              Meta de peso
            </div>
            <p className="mt-2 font-display text-[36px] font-bold tracking-tight tabular-nums">
              {goalW ? <>{goalW.toFixed(1)}<span className="ml-1.5 text-[18px] font-normal text-muted-foreground">kg</span></> : "Defina sua meta"}
            </p>
            {lost !== 0 && (
              <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-semibold ${
                lost > 0 ? "bg-accent text-accent-foreground" : "bg-surface text-foreground"
              }`}>
                <TrendingDown size={12} className={lost < 0 ? "rotate-180" : ""} strokeWidth={2.2} />
                {Math.abs(lost).toFixed(1)} kg desde o início
              </div>
            )}
          </div>
          <button
            onClick={() => { setEditingGoal((v) => !v); setGoalWeight(goalW ? String(goalW) : ""); }}
            className="rounded-full bg-surface px-4 py-2 text-[13px] font-semibold transition hover:bg-card hover:shadow-sm"
          >
            {editingGoal ? "Cancelar" : "Editar"}
          </button>
        </div>
        {editingGoal && (
          <div className="mt-5 flex gap-2">
            <input
              type="number" step="0.1" placeholder="Peso alvo (kg)"
              value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)}
              className="input-field flex-1"
            />
            <button onClick={() => saveGoal.mutate()} disabled={saveGoal.isPending} className="btn-primary">
              Salvar
            </button>
          </div>
        )}
      </section>

      {/* MENU */}
      <section className="mt-6">
        <div className="card-base overflow-hidden">
          {items.map((it, i) => {
            const inner = (
              <>
                <span className="flex items-center gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent">
                    <it.icon size={17} strokeWidth={1.8} className="text-accent-foreground" />
                  </span>
                  <span className="text-[15px] font-medium">{it.label}</span>
                </span>
                <ChevronRight size={18} className="text-muted-foreground/50" />
              </>
            );
            const cls = `flex w-full items-center justify-between px-5 py-3.5 text-left transition hover:bg-surface ${
              i > 0 ? "border-t border-border/40" : ""
            }`;
            return it.to ? (
              <Link key={i} to={it.to} className={cls}>{inner}</Link>
            ) : (
              <button key={i} className={cls}>{inner}</button>
            );
          })}
        </div>
      </section>

      <button
        onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-surface py-3.5 text-[14px] font-semibold text-destructive transition hover:bg-destructive/10"
      >
        <LogOut size={16} /> Sair da conta
      </button>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="px-5 py-6 text-center">
      <p className="text-[12.5px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-[26px] font-bold tabular-nums">
        {value}
        {unit && <span className="ml-1 text-[13px] font-normal text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}
