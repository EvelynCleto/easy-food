import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  Calendar,
  ChevronRight,
  ClipboardList,
  Droplets,
  Plus,
  ScanLine,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { useDailyNutrition } from "@/hooks/useDailyNutrition";
import { grantAchievement, syncStreak } from "@/lib/achievements";
import { celebrate, haptic } from "@/lib/celebrate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EasyFood — alimentação inteligente" },
      { name: "description", content: "EasyFood: IA nutricional e refeições saudáveis em máquinas inteligentes." },
    ],
  }),
  component: HomePage,
});

/* ─── SVG progress ring ──────────────────────────────────────────────── */
function ProgressRing({ pct }: { pct: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}
        style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.34,1.56,0.64,1)" }}
      />
      <text x="70" y="66" textAnchor="middle" fontSize="26" fontWeight="700" fontFamily="Space Grotesk, Inter, sans-serif" fill="var(--ink-1)">{pct}%</text>
      <text x="70" y="84" textAnchor="middle" fontSize="11" fill="var(--ink-3)" fontFamily="Inter, sans-serif">progresso</text>
    </svg>
  );
}

/* ─── Decorative plant SVG ───────────────────────────────────────────── */
function PlantDecor() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl"
      aria-hidden
    >
      {/* soft green ambient */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/4 h-[110%] w-[90%]"
        style={{
          background:
            "radial-gradient(ellipse 70% 80% at 60% 70%, rgba(30,134,84,0.08) 0%, transparent 70%)",
        }}
      />
      {/* SVG leaves */}
      <svg
        className="absolute bottom-0 right-0 h-[85%]"
        viewBox="0 0 260 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.55 }}
      >
        {/* stem */}
        <path d="M130 340 Q128 260 120 200 Q115 160 100 120" stroke="#2DAB6B" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* large left leaf */}
        <path d="M120 200 Q60 160 30 90 Q80 100 110 160 Z" fill="#2DAB6B" opacity="0.55" />
        {/* large right leaf */}
        <path d="M115 160 Q180 100 230 40 Q200 120 130 170 Z" fill="#1E8654" opacity="0.5" />
        {/* medium left leaf */}
        <path d="M108 130 Q55 90 20 30 Q75 55 105 120 Z" fill="#2DAB6B" opacity="0.40" />
        {/* top right leaf */}
        <path d="M100 120 Q170 60 240 0 Q190 80 120 130 Z" fill="#1E8654" opacity="0.38" />
        {/* small leaf */}
        <path d="M118 250 Q85 230 70 195 Q95 205 120 240 Z" fill="#2DAB6B" opacity="0.30" />
      </svg>
    </div>
  );
}

/* ─── Map decoration for machine card ───────────────────────────────── */
function MapDecor() {
  return (
    <div className="relative h-28 w-full overflow-hidden rounded-xl" style={{ background: "#1a2e1e" }}>
      {/* grid lines */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 112" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 20} x2="200" y2={i * 20} stroke="#2d4a32" strokeWidth="0.8" />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="112" stroke="#2d4a32" strokeWidth="0.8" />
        ))}
        {/* roads */}
        <rect x="60" y="0" width="12" height="112" fill="#243828" />
        <rect x="0" y="44" width="200" height="10" fill="#243828" />
        {/* green pin */}
        <circle cx="66" cy="50" r="8" fill="#2DAB6B" />
        <circle cx="66" cy="50" r="4" fill="white" />
        <line x1="66" y1="58" x2="66" y2="65" stroke="#2DAB6B" strokeWidth="2.5" strokeLinecap="round" />
        {/* pulse ring */}
        <circle cx="66" cy="50" r="14" fill="none" stroke="#2DAB6B" strokeWidth="1.5" opacity="0.35" />
      </svg>
    </div>
  );
}

function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [now] = useState(() => new Date());

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("profiles")
          .select("full_name,calorie_goal,protein_goal,water_goal_ml,streak_days,onboarding_completed")
          .eq("id", user!.id)
          .maybeSingle()
      ).data,
  });

  useEffect(() => {
    if (profile && (profile as { onboarding_completed?: boolean | null }).onboarding_completed === false) {
      navigate({ to: "/onboarding" });
    }
  }, [profile, navigate]);

  const { data: daily } = useDailyNutrition();

  const { data: nearest } = useQuery({
    queryKey: ["nearest-machine"],
    queryFn: async () => {
      const { data } = await supabase
        .from("machines")
        .select("id,name,address,status,opens_at,closes_at,latitude,longitude")
        .eq("status", "online")
        .limit(1)
        .single();
      return data;
    },
  });

  const { data: featuredProduct } = useQuery({
    queryKey: ["featured-product"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,image_url,description,calories,protein,carbs,fat")
        .order("sold_count", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const firstName = (
    (profile as { full_name?: string } | null)?.full_name ??
    user?.user_metadata?.full_name ??
    user?.email ??
    ""
  ).split(/[\s@]/)[0];

  const calGoal = (profile as { calorie_goal?: number } | null)?.calorie_goal ?? 2000;
  const proteinGoal = (profile as { protein_goal?: number } | null)?.protein_goal ?? 120;
  const waterGoal = (profile as { water_goal_ml?: number } | null)?.water_goal_ml ?? 2500;
  const streak = (profile as { streak_days?: number } | null)?.streak_days ?? 0;

  const calConsumed = Math.round(daily?.calories ?? 0);
  const weeklyPct = Math.min(100, Math.round((calConsumed / calGoal) * 100 * 7 / 7)); // daily pct used as weekly proxy

  // Progress: how far through today's calorie goal
  const progressPct = Math.min(100, Math.round((calConsumed / calGoal) * 100));

  const logWater = useMutation({
    mutationFn: async (ml: number) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("water_logs").insert({
        user_id: user.id,
        amount_ml: ml,
        logged_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
      return ml;
    },
    onSuccess: (ml) => {
      qc.invalidateQueries({ queryKey: ["daily-nutrition"] });
      haptic(10);
      toast.success(`+${ml}ml registrado 💧`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (!user) return;
    syncStreak().then((s) => {
      if (s != null) {
        qc.invalidateQueries({ queryKey: ["profile"] });
        qc.invalidateQueries({ queryKey: ["achievements"] });
      }
    });
  }, [user, qc]);

  useEffect(() => {
    if (!user || !daily) return;
    const checks: Promise<boolean>[] = [];
    if (daily.water_ml >= waterGoal) checks.push(grantAchievement("water_goal"));
    if (daily.protein >= proteinGoal) checks.push(grantAchievement("protein_goal"));
    if (checks.length === 0) return;
    Promise.all(checks).then((res) => {
      if (res.some(Boolean)) qc.invalidateQueries({ queryKey: ["achievements"] });
    });
  }, [user, daily, waterGoal, proteinGoal, qc]);

  /* motivational phrases */
  const phrases = useMemo(() => [
    "Disciplina hoje, liberdade amanhã.",
    "Cada escolha saudável é um voto pelo seu futuro.",
    "O seu corpo agradece cada gole de água.",
    "Pequenos passos constroem grandes transformações.",
    "Cuide-se hoje para colher amanhã.",
  ], []);
  const phrase = phrases[now.getDate() % phrases.length];

  /* opening time */
  const closesAt = nearest?.closes_at
    ? nearest.closes_at.slice(0, 5).replace(":", "h")
    : "22h00";

  if (!user) return null;

  return (
    <AppShell>
      {/* ── Top bar: search + notification ────────────────────────────── */}
      <div className="mb-8 flex items-center justify-end gap-3">
        <div
          className="relative flex flex-1 max-w-sm items-center gap-2 rounded-xl px-4 py-2.5"
          style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
        >
          <Search size={15} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
          <input
            type="search"
            placeholder="Buscar máquinas, refeições..."
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[var(--ink-3)]"
            style={{ color: "var(--ink-1)" }}
          />
        </div>
        <Link
          to="/notifications"
          className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl transition hover:opacity-80"
          style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
        >
          <Bell size={18} style={{ color: "var(--ink-2)" }} />
          {/* green notification dot */}
          <span
            className="absolute right-2 top-2 h-2 w-2 rounded-full"
            style={{ background: "var(--primary)" }}
          />
        </Link>
      </div>

      {/* ── Hero: 2-column grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        {/* LEFT: greeting + headline + progress card */}
        <div className="relative flex flex-col">
          {/* Greeting */}
          <p className="text-[15px] font-medium" style={{ color: "var(--ink-2)" }}>
            Oi, {firstName} 👋
          </p>

          {/* Headline */}
          <h1
            className="mt-2 text-[clamp(2rem,4vw+0.5rem,3rem)] font-bold leading-[1.1] tracking-tight"
            style={{ color: "var(--ink-1)", fontFamily: "var(--font-display)" }}
          >
            Cuidar de você<br />nunca foi tão fácil.
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "var(--ink-2)" }}>
            Pequenas escolhas todos os dias<br />constroem grandes transformações.
          </p>

          {/* Decorative plant */}
          <div
            className="relative mt-6 flex-1 overflow-hidden rounded-3xl lg:min-h-[180px]"
            style={{ background: "linear-gradient(145deg, #f0faf4 0%, #e6f7ed 50%, #f5fdf8 100%)" }}
          >
            <PlantDecor />
            {/* Progress card overlaid at bottom-left */}
            <div
              className="relative z-10 m-4 inline-flex flex-col gap-1 rounded-2xl p-4 sm:p-5"
              style={{
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                maxWidth: 300,
              }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
                Seu progresso semanal
              </p>
              <div className="flex items-center gap-4">
                <ProgressRing pct={progressPct || 72} />
                <div>
                  <p className="text-[15px] font-bold leading-snug" style={{ color: "var(--ink-1)" }}>
                    {progressPct >= 80
                      ? "Você está arrasando! 🔥"
                      : progressPct >= 40
                      ? "Você está no caminho certo!"
                      : "Continue firme, você consegue!"}
                  </p>
                  <Link
                    to="/profile"
                    className="mt-2 flex items-center gap-1 text-[12px] font-semibold"
                    style={{ color: "var(--primary)" }}
                  >
                    Ver evolução <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: machine card + product suggestion */}
        <div className="flex flex-col gap-4">
          {/* Nearest machine — dark card */}
          <div
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: "#111c14" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
                Máquina mais próxima
              </p>
            </div>

            <p
              className="text-[2.8rem] font-bold leading-none tabular-nums"
              style={{ color: "#fff", fontFamily: "var(--font-display)" }}
            >
              {nearest ? "89 m" : "—"}
            </p>
            <p className="mt-1 text-[13px]" style={{ color: "rgba(255,255,255,0.65)" }}>
              {nearest?.address ?? "Carregando localização..."}
            </p>
            {nearest && (
              <p className="mt-0.5 text-[12px] font-semibold" style={{ color: "#2DAB6B" }}>
                Aberta agora até {closesAt}
              </p>
            )}

            {/* Mini map */}
            <div className="mt-3">
              <MapDecor />
            </div>

            <Link
              to="/machines"
              className="mt-3 flex items-center justify-between text-[13px] font-semibold transition"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              Ver todas as máquinas
              <ChevronRight size={15} />
            </Link>
          </div>

          {/* Featured product suggestion */}
          <div
            className="overflow-hidden rounded-2xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[12px] font-semibold" style={{ color: "var(--ink-2)" }}>
                Sugestão para você
              </p>
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
              >
                Novo
              </span>
            </div>

            <div className="flex gap-3">
              {/* Product image */}
              <div
                className="h-24 w-24 shrink-0 overflow-hidden rounded-xl"
                style={{ background: "var(--surface)" }}
              >
                {featuredProduct?.image_url ? (
                  <img
                    src={featuredProduct.image_url}
                    alt={featuredProduct.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl">🥗</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold leading-tight" style={{ color: "var(--ink-1)" }}>
                  {featuredProduct?.name ?? "Frango grelhado com arroz integral"}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed" style={{ color: "var(--ink-3)" }}>
                  Equilibrada, nutritiva e cheia de sabor.
                </p>
              </div>
            </div>

            {/* Macros row */}
            <div className="mt-3 grid grid-cols-4 gap-1 rounded-xl p-2" style={{ background: "var(--surface)" }}>
              {[
                { val: featuredProduct?.calories ?? 480, unit: "kcal", label: "" },
                { val: featuredProduct?.protein ?? 32, unit: "g", label: "Proteína" },
                { val: featuredProduct?.carbs ?? 56, unit: "g", label: "Carbo" },
                { val: featuredProduct?.fat ?? 12, unit: "g", label: "Gordura" },
              ].map((m, i) => (
                <div key={i} className="text-center">
                  <p className="text-[14px] font-bold" style={{ color: "var(--ink-1)" }}>
                    {m.val}<span className="text-[10px] font-normal" style={{ color: "var(--ink-3)" }}>{m.unit}</span>
                  </p>
                  {m.label && <p className="text-[9px]" style={{ color: "var(--ink-3)" }}>{m.label}</p>}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-3 flex gap-2">
              <Link
                to="/catalog"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold transition"
                style={{ background: "var(--ink-1)", color: "var(--card)" }}
              >
                Ver detalhes <ChevronRight size={13} />
              </Link>
              <Link
                to="/catalog"
                className="grid h-10 w-10 place-items-center rounded-xl transition"
                style={{ background: "var(--primary)", color: "#fff" }}
              >
                <Plus size={18} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Frase do dia ─────────────────────────────────────────────── */}
      <div
        className="mt-6 flex items-center gap-4 overflow-hidden rounded-2xl px-6 py-5"
        style={{
          background: "linear-gradient(135deg, #1a2e1e 0%, #0f1f12 60%, #1e3323 100%)",
          position: "relative",
        }}
      >
        {/* landscape silhouette decoration */}
        <svg
          className="pointer-events-none absolute right-0 bottom-0 h-full opacity-25"
          viewBox="0 0 400 90"
          preserveAspectRatio="xMaxYMax meet"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path d="M0 90 Q80 20 160 60 Q200 40 240 50 Q280 20 320 40 Q360 10 400 30 L400 90 Z" fill="#2DAB6B" opacity="0.3" />
          <path d="M0 90 Q100 55 180 70 Q220 60 260 65 Q300 55 340 60 Q370 50 400 55 L400 90 Z" fill="#1E8654" opacity="0.45" />
          {/* walking person silhouette */}
          <circle cx="310" cy="32" r="4" fill="rgba(255,255,255,0.6)" />
          <line x1="310" y1="36" x2="310" y2="50" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
          <line x1="310" y1="42" x2="305" y2="48" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
          <line x1="310" y1="42" x2="315" y2="48" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
          <line x1="310" y1="50" x2="306" y2="58" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
          <line x1="310" y1="50" x2="314" y2="58" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
        </svg>

        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ background: "rgba(45,171,107,0.25)" }}
        >
          <Sparkles size={18} style={{ color: "#2DAB6B" }} />
        </div>
        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
            Frase do dia
          </p>
          <p className="mt-0.5 text-[15px] font-semibold leading-snug" style={{ color: "#fff" }}>
            {phrase}
          </p>
        </div>
      </div>

      {/* ── Ações rápidas ─────────────────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="mb-4 text-[16px] font-bold" style={{ color: "var(--ink-1)" }}>
          Ações rápidas
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              icon: <ScanLine size={22} strokeWidth={1.7} />,
              label: "Escanear refeição",
              desc: "Use a IA para analisar sua refeição",
              to: "/nutrition",
            },
            {
              icon: <Droplets size={22} strokeWidth={1.7} />,
              label: "Registrar água",
              desc: "Acompanhe sua hidratação diária",
              to: "/",
              onClick: () => logWater.mutate(250),
            },
            {
              icon: <BellRing size={22} strokeWidth={1.7} />,
              label: "Próximo lembrete",
              desc: "Sua próxima refeição em 2h 15min",
              to: "/notifications",
            },
            {
              icon: <ClipboardList size={22} strokeWidth={1.7} />,
              label: "Ver meu plano",
              desc: "Seu plano alimentar personalizado",
              to: "/meal-plan",
            },
          ].map(({ icon, label, desc, to, onClick }) => (
            <Link
              key={label}
              to={to}
              onClick={onClick}
              className="flex flex-col gap-3 rounded-2xl p-4 transition hover:opacity-90 active:scale-[0.98]"
              style={{ background: "var(--card)", border: "1px solid var(--hairline)" }}
            >
              <div
                className="grid h-10 w-10 place-items-center rounded-xl"
                style={{ background: "var(--surface)", color: "var(--ink-2)" }}
              >
                {icon}
              </div>
              <div>
                <p className="text-[13px] font-semibold leading-tight" style={{ color: "var(--ink-1)" }}>
                  {label}
                </p>
                <p className="mt-1 text-[11px] leading-snug" style={{ color: "var(--ink-3)" }}>
                  {desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
