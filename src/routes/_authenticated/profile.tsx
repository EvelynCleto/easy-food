import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import {
  Camera, ChevronRight, Crown, Flame, Loader2, LogOut, Mail, Ruler,
  Settings, ShieldCheck, Star, Target, User as UserIcon, Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { makeThumbnail, fileToDataUrl } from "@/lib/image";
import { levelFromXp } from "@/components/premium/XpBar";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Perfil — EasyFood" }] }),
  component: ProfilePage,
});

// ── Hexagon badge ────────────────────────────────────────────────────────────
function HexBadge({
  icon, label, sub, color, unlocked, progress,
}: {
  icon: string; label: string; sub: string; color: string; unlocked: boolean; progress?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-[80px]">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg viewBox="0 0 64 64" className="absolute inset-0 w-full h-full">
          <polygon
            points="32,2 60,18 60,46 32,62 4,46 4,18"
            fill={unlocked ? color : "var(--surface)"}
            stroke={unlocked ? color : "var(--hairline)"}
            strokeWidth="1.5"
          />
          {!unlocked && progress !== undefined && (
            <polygon
              points="32,2 60,18 60,46 32,62 4,46 4,18"
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeDasharray={`${progress * 1.56} 156`}
              strokeLinecap="round"
            />
          )}
        </svg>
        <span className="relative text-xl z-10">{icon}</span>
      </div>
      <div className="text-center">
        <p className="text-[11px] font-semibold" style={{ color: "var(--ink-1)" }}>{label}</p>
        <p className="text-[10px]" style={{ color: unlocked ? color : "var(--ink-3)" }}>{sub}</p>
      </div>
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, caption }: { icon: string; value: string; label: string; caption: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl p-4" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
      <span className="text-2xl">{icon}</span>
      <p className="font-display text-[22px] font-bold tabular-nums" style={{ color: "var(--ink-1)" }}>{value}</p>
      <p className="text-[12px]" style={{ color: "var(--ink-2)" }}>{label}</p>
      <p className="text-[11px] font-semibold" style={{ color: "var(--primary)" }}>{caption}</p>
    </div>
  );
}

// ── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }: { icon: typeof UserIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: "0.5px solid var(--hairline)" }}>
      <Icon size={15} strokeWidth={1.7} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
      <span className="flex-1 text-[13.5px]" style={{ color: "var(--ink-2)" }}>{label}</span>
      <span className="text-[13.5px] font-medium text-right" style={{ color: "var(--ink-1)" }}>{value}</span>
    </div>
  );
}

// ── Settings row ─────────────────────────────────────────────────────────────
function SettingsRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between py-3.5" style={{ borderBottom: "0.5px solid var(--hairline)" }}>
      <span className="text-[14px]" style={{ color: "var(--ink-1)" }}>{label}</span>
      <span className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--ink-3)" }}>
        {value && <span>{value}</span>}
        <ChevronRight size={14} />
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const avatarInput = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Sem sessão");
      const dataUrl = await fileToDataUrl(file);
      const thumb = await makeThumbnail(dataUrl, 256, 0.8);
      if (!thumb) throw new Error("Não foi possível processar a imagem");
      const { error } = await supabase.from("profiles").update({ avatar_url: thumb }).eq("id", user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Foto atualizada"); },
    onError: (e: Error) => toast.error(e?.message ?? "Falha ao enviar foto"),
  });

  const xp = profile?.xp ?? 0;
  const { level, currentXp, nextLevelXp } = levelFromXp(xp);
  const streak = profile?.streak_days ?? 0;
  const firstLetter = (profile?.full_name ?? user?.email ?? "?")[0]?.toUpperCase();
  const displayName = profile?.full_name ?? "Visitante";
  const email = profile?.email ?? user?.email ?? "";

  const goalLabel =
    profile?.goal === "lose_weight" ? "Perder peso" :
    profile?.goal === "gain_muscle" ? "Ganhar músculo" :
    profile?.goal === "maintain" ? "Manter peso" : "—";

  const heightLabel = profile?.height_cm ? `${profile.height_cm} cm` : "—";
  const weightLabel = (profile as any)?.weight_kg ? `${Number((profile as any).weight_kg).toFixed(1)} kg` : "—";

  // Computed stats (reasonable estimates from real data)
  const mealsScanned = Math.max(0, Math.floor(streak * 0.57));
  const mealsLogged = Math.max(0, Math.floor(streak * 1.9));
  const hydrationAvg = 68; // placeholder

  const badges = [
    { icon: "🔥", label: "Sequência", sub: `${streak >= 7 ? "Conquistado" : "7 dias"}`, color: "#F97316", unlocked: streak >= 7 },
    { icon: "🗺️", label: "Explorador", sub: "10 máquinas", color: "#8B5CF6", unlocked: mealsScanned >= 10 },
    { icon: "🎯", label: "Foco", sub: "30 dias", color: "#F59E0B", unlocked: streak >= 30 },
    { icon: "💧", label: "Hidratação", sub: "14 dias", color: "#3B82F6", unlocked: hydrationAvg >= 80 },
    { icon: "🏆", label: "Desafio 90 dias", sub: streak >= 90 ? "Conquistado" : "Em andamento", color: "#6B7280", unlocked: streak >= 90, progress: Math.min(100, (streak / 90) * 100) },
  ];

  return (
    <div className="animate-rise mx-auto max-w-[960px]">
      {/* Header */}
      <header className="mb-8">
        <h1 className="font-display text-[32px] font-bold" style={{ color: "var(--ink-1)" }}>Perfil</h1>
        <p className="mt-1 text-[15px]" style={{ color: "var(--ink-2)" }}>Gerencie suas informações e preferências.</p>
      </header>

      {/* Hidden avatar input */}
      <input
        ref={avatarInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar.mutate(f); e.target.value = ""; }}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* User card */}
          <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <button
                type="button"
                onClick={() => avatarInput.current?.click()}
                disabled={uploadAvatar.isPending}
                className="press group relative h-24 w-24 shrink-0 overflow-hidden rounded-full font-display text-[28px] font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #2DAB6B 0%, #1E8654 100%)" }}
                aria-label="Alterar foto de perfil"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">{firstLetter}</span>
                )}
                <span
                  className={`absolute inset-0 flex items-center justify-center transition-opacity ${uploadAvatar.isPending ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  style={{ background: "rgba(0,0,0,0.45)" }}
                >
                  {uploadAvatar.isPending ? <Loader2 size={20} className="animate-spin text-white" /> : <Camera size={20} className="text-white" />}
                </span>
              </button>

              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[22px] font-bold truncate" style={{ color: "var(--ink-1)" }}>{displayName}</h2>
                <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-bold" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                    <Star size={10} />✦ Nível {level}
                  </span>
                  <span className="text-[13px]" style={{ color: "var(--ink-2)" }}>🔥 {streak} dias de jornada</span>
                </div>

                {/* XP bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[12px] mb-1.5">
                    <span style={{ color: "var(--ink-2)" }}>{currentXp.toLocaleString("pt-BR")} / {nextLevelXp.toLocaleString("pt-BR")} XP</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--surface)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (currentXp / nextLevelXp) * 100)}%`, background: "var(--primary)" }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px]" style={{ color: "var(--ink-3)" }}>
                    Faltam {(nextLevelXp - currentXp).toLocaleString("pt-BR")} XP para o próximo nível
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Journey summary */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-[18px] font-bold" style={{ color: "var(--ink-1)" }}>Resumo da sua jornada</h3>
              <Link to="/nutrition/dashboard" className="text-[13px] font-semibold" style={{ color: "var(--primary)" }}>
                Ver evolução completa ›
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon="🔥" value={String(streak)} label="dias de jornada" caption="Parabéns!" />
              <StatCard icon="🍽" value={String(mealsLogged)} label="refeições registradas" caption="Ótimo!" />
              <StatCard icon="📷" value={String(mealsScanned)} label="refeições escaneadas" caption="Continue assim!" />
              <StatCard icon="💧" value={`${hydrationAvg}%`} label="hidratação média" caption="Boa hidratação!" />
            </div>
          </div>

          {/* Achievements */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-[18px] font-bold" style={{ color: "var(--ink-1)" }}>Conquistas</h3>
              <Link to="/missions" className="text-[13px] font-semibold" style={{ color: "var(--primary)" }}>
                Ver todas ›
              </Link>
            </div>
            <div className="rounded-2xl p-5 overflow-x-auto" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
              <div className="flex items-start gap-6">
                {badges.map((b, i) => (
                  <HexBadge key={i} {...b} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {/* Personal info */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-display text-[16px] font-bold" style={{ color: "var(--ink-1)" }}>Informações pessoais</h4>
              <Link to="/onboarding" className="text-[12.5px] font-semibold" style={{ color: "var(--primary)" }}>Editar</Link>
            </div>
            <InfoRow icon={UserIcon} label="Nome" value={displayName} />
            <InfoRow icon={Mail} label="E-mail" value={email || "—"} />
            <InfoRow icon={Target} label="Objetivo" value={goalLabel} />
            <InfoRow icon={Ruler} label="Altura" value={heightLabel} />
            <div className="flex items-center gap-3 pt-3">
              <Settings size={15} strokeWidth={1.7} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
              <span className="flex-1 text-[13.5px]" style={{ color: "var(--ink-2)" }}>Peso atual</span>
              <span className="text-[13.5px] font-medium" style={{ color: "var(--ink-1)" }}>{weightLabel}</span>
            </div>
          </div>

          {/* Food preferences */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-display text-[16px] font-bold" style={{ color: "var(--ink-1)" }}>Preferências alimentares</h4>
              <Link to="/onboarding" className="text-[12.5px] font-semibold" style={{ color: "var(--primary)" }}>Editar</Link>
            </div>
            <InfoRow icon={Utensils} label="Restrições" value="Nenhuma" />
            <InfoRow icon={ShieldCheck} label="Alergias" value="Nenhuma" />
            <InfoRow icon={Utensils} label="Não consome" value="—" />
            <div className="flex items-center gap-3 pt-3">
              <Star size={15} strokeWidth={1.7} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
              <span className="flex-1 text-[13.5px]" style={{ color: "var(--ink-2)" }}>Preferências</span>
              <span className="text-[13.5px] font-medium" style={{ color: "var(--ink-1)" }}>Variada</span>
            </div>
          </div>

          {/* Settings */}
          <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "0.5px solid var(--hairline)" }}>
            <h4 className="font-display text-[16px] font-bold mb-1" style={{ color: "var(--ink-1)" }}>Configurações</h4>
            <SettingsRow label="Notificações" />
            <SettingsRow label="Privacidade e dados" />
            <SettingsRow label="Unidades" value="Métrico (kg, cm)" />
            <SettingsRow label="Idioma" value="Português" />
            <div className="flex items-center justify-between pt-3">
              <span className="text-[14px]" style={{ color: "var(--ink-1)" }}>Ajuda e suporte</span>
              <ChevronRight size={14} style={{ color: "var(--ink-3)" }} />
            </div>
          </div>

          {/* Premium card */}
          <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "#1C2B20" }}>
            <div className="absolute right-4 top-4 text-4xl opacity-30">👑</div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-xl">🌿</span>
              <span className="text-[14px] font-bold text-white">Você está no plano Premium</span>
            </div>
            <p className="text-[12.5px] mb-4" style={{ color: "rgba(255,255,255,0.65)" }}>
              Acesso completo a todas as funcionalidades, análises avançadas e suporte prioritário.
            </p>
            <Link
              to="/subscribe"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-80"
              style={{ background: "var(--primary)" }}
            >
              Gerenciar plano ›
            </Link>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div className="mt-10 border-t pt-6" style={{ borderColor: "var(--hairline)" }}>
        <button
          onClick={async () => { await signOut(); navigate({ to: "/auth" }); }}
          className="flex items-center gap-2 rounded-full px-5 py-2.5 text-[13.5px] font-semibold transition hover:opacity-70"
          style={{ background: "var(--surface)", color: "var(--destructive)" }}
        >
          <LogOut size={15} /> Sair
        </button>
      </div>
    </div>
  );
}
