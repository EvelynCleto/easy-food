import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar, ChevronRight, CreditCard, Heart, HelpCircle, LogOut, MapPin, Receipt, Sparkles, Tag, User as UserIcon } from "lucide-react";
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

  const saveGoal = useMutation({
    mutationFn: async () => {
      if (!user || !goalWeight) return;
      const { error } = await supabase.from("profiles").update({ weight_goal_kg: Number(goalWeight) }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); setEditingGoal(false); toast.success("Meta atualizada"); },
  });

  const items: { icon: typeof UserIcon; label: string; to?: "/orders" | "/favorites" | "/meal-plan" | "/onboarding" }[] = [
    { icon: Calendar, label: "Plano semanal", to: "/meal-plan" },
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
  const bmi = profile?.weight_kg && profile?.height_cm ? Number(profile.weight_kg) / Math.pow(Number(profile.height_cm) / 100, 2) : null;
  const firstLetter = (profile?.full_name ?? user?.email ?? "?")[0]?.toUpperCase();

  return (
    <div className="mx-auto max-w-[760px]">
      {/* Header */}
      <header className="flex items-center gap-5">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-surface font-display text-3xl font-semibold text-foreground">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : firstLetter}
        </div>
        <div className="min-w-0">
          <h1 className="text-title-1 truncate">{profile?.full_name ?? "Visitante"}</h1>
          <p className="text-caption mt-1 truncate">{user?.email}</p>
        </div>
      </header>

      {/* Stats */}
      <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-border/60">
        <Stat label="Peso" value={currentW ? `${currentW.toFixed(1)} kg` : "—"} />
        <Stat label="IMC" value={bmi ? bmi.toFixed(1) : "—"} />
        <Stat label="Sequência" value={`${profile?.streak_days ?? 0} dias`} />
      </div>

      {/* Goal */}
      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-title-3">Meta de peso</h2>
          <button onClick={() => { setEditingGoal((v) => !v); setGoalWeight(goalW ? String(goalW) : ""); }} className="btn-ghost">
            {editingGoal ? "Cancelar" : "Editar"}
          </button>
        </div>
        <p className="mt-2 font-display text-4xl font-bold tracking-tight">
          {goalW ? `${goalW.toFixed(1)} kg` : "—"}
        </p>
        {editingGoal && (
          <div className="mt-4 flex gap-2">
            <input type="number" step="0.1" placeholder="Peso alvo (kg)" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)}
              className="input-field flex-1" />
            <button onClick={() => saveGoal.mutate()} disabled={saveGoal.isPending} className="btn-primary">Salvar</button>
          </div>
        )}
      </section>

      {/* Menu — iOS list */}
      <section className="mt-12">
        <div className="overflow-hidden rounded-2xl bg-surface">
          {items.map((it, i) => {
            const inner = (
              <>
                <span className="flex items-center gap-4">
                  <it.icon size={18} strokeWidth={1.8} className="text-foreground/70" />
                  <span className="text-[15px] font-normal">{it.label}</span>
                </span>
                <ChevronRight size={17} className="text-muted-foreground/50" />
              </>
            );
            const cls = "flex w-full items-center justify-between px-5 py-3.5 text-left transition hover:bg-card";
            return it.to ? (
              <Link key={i} to={it.to} className={`${cls} ${i > 0 ? "border-t border-border/40" : ""}`}>{inner}</Link>
            ) : (
              <button key={i} className={`${cls} ${i > 0 ? "border-t border-border/40" : ""}`}>{inner}</button>
            );
          })}
        </div>
      </section>

      <button onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
        className="mt-8 flex w-full items-center justify-center gap-2 py-4 text-[15px] font-medium text-destructive transition hover:opacity-70">
        <LogOut size={16} /> Sair
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background px-5 py-5 text-center">
      <p className="text-caption">{label}</p>
      <p className="mt-1 font-display text-[22px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}
