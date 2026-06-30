import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Crown,
  Droplets,
  FileText,
  Home,
  MapPin,
  Plus,
  ScanLine,
  Search,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDailyNutrition } from "@/hooks/useDailyNutrition";
import { grantAchievement, syncStreak } from "@/lib/achievements";
import { haptic } from "@/lib/celebrate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EasyFood — alimentação inteligente" },
      {
        name: "description",
        content:
          "EasyFood: IA nutricional e refeições saudáveis em máquinas inteligentes.",
      },
    ],
  }),
  component: HomePage,
});

function ProgressRing({ pct }: { pct: number }) {
  const value = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 72;
  const r = 43;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;

  return (
    <svg width="112" height="112" viewBox="0 0 112 112" className="ef-ring">
      <circle cx="56" cy="56" r={r} fill="none" stroke="#E6E9E2" strokeWidth="8" />
      <circle
        cx="56"
        cy="56"
        r={r}
        fill="none"
        stroke="#6A9E4E"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        strokeDashoffset={c / 4}
      />
      <text
        x="56"
        y="61"
        textAnchor="middle"
        fontSize="24"
        fontWeight="500"
        fontFamily="Inter, system-ui, sans-serif"
        fill="#0A2418"
      >
        {value}%
      </text>
    </svg>
  );
}

function Logo() {
  return (
    <div className="ef-logo" aria-label="EasyFood">
      <span>easy</span>
      <span>food</span>
    </div>
  );
}

function Sidebar() {
  const nav = [
    { label: "Início", icon: Home, to: "/" },
    { label: "Máquinas", icon: MapPin, to: "/machines" },
    { label: "Escanear", icon: ScanLine, to: "/nutrition" },
    { label: "Plano", icon: ClipboardList, to: "/meal-plan" },
    { label: "Evolução", icon: BarChart3, to: "/profile" },
  ];

  return (
    <aside className="ef-sidebar">
      <Logo />

      <nav className="ef-nav">
        {nav.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`ef-nav-item ${index === 0 ? "active" : ""}`}
            >
              <Icon size={19} strokeWidth={1.65} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="ef-premium">
        <div className="ef-premium-icon">
          <Crown size={14} strokeWidth={1.9} />
        </div>
        <strong>Seja Premium</strong>
        <p>Mais benefícios e inteligência para sua jornada.</p>
        <Link to="/premium" className="ef-premium-button">
          Ver planos
          <ChevronRight size={13} />
        </Link>
      </div>

      <div className="ef-user">
        <div className="ef-user-photo" />
        <span>Maria Silva</span>
        <ChevronDown size={14} />
      </div>
    </aside>
  );
}

function LeafArt() {
  return (
    <div className="ef-leaf-art" aria-hidden>
      <div className="ef-leaf-glow" />
      <svg viewBox="0 0 430 420" fill="none">
        <path
          d="M210 407C207 322 188 244 153 166C131 116 99 68 52 25"
          stroke="#79B88D"
          strokeWidth="4"
          strokeLinecap="round"
          opacity=".5"
        />
        <path d="M154 170C96 156 54 109 32 44C95 58 140 98 154 170Z" fill="#77C89C" opacity=".40" />
        <path d="M178 240C119 232 78 198 51 145C113 153 162 187 178 240Z" fill="#77C89C" opacity=".31" />
        <path d="M194 307C148 299 113 270 91 225C142 231 182 259 194 307Z" fill="#77C89C" opacity=".23" />
        <path d="M146 150C202 89 267 61 371 63C319 135 238 172 146 150Z" fill="#77C89C" opacity=".35" />
        <path d="M176 222C233 170 298 150 392 166C332 235 254 252 176 222Z" fill="#77C89C" opacity=".28" />
      </svg>
    </div>
  );
}

function MapArt() {
  return (
    <div className="ef-map-art" aria-hidden>
      <svg viewBox="0 0 360 118" preserveAspectRatio="none">
        <rect width="360" height="118" rx="20" fill="#17351F" />
        {Array.from({ length: 7 }).map((_, i) => (
          <path key={`h-${i}`} d={`M0 ${i * 20 + 9}H360`} stroke="#335A3D" strokeWidth="1" />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <path key={`v-${i}`} d={`M${i * 38 + 14} 0V118`} stroke="#335A3D" strokeWidth="1" />
        ))}
        <rect x="108" width="31" height="118" fill="#24432B" />
        <rect y="40" width="360" height="14" fill="#24432B" />
        <circle cx="124" cy="51" r="29" fill="#6FC653" opacity=".13" />
        <circle cx="124" cy="51" r="18" fill="#6FC653" opacity=".23" />
        <circle cx="124" cy="51" r="10" fill="#63C84F" />
        <circle cx="124" cy="51" r="5" fill="white" />
        <path d="M124 62V76" stroke="#2DAB6B" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Landscape() {
  return (
    <svg className="ef-landscape" viewBox="0 0 760 78" preserveAspectRatio="none" aria-hidden>
      <path d="M0 78C108 33 178 52 265 32C365 10 445 38 543 20C620 7 686 18 760 0V78H0Z" fill="#7F9276" opacity=".22" />
      <path d="M0 78C124 52 210 63 326 47C455 29 560 50 760 29V78H0Z" fill="#344235" opacity=".25" />
      <circle cx="650" cy="18" r="3.5" fill="#0B2419" opacity=".65" />
      <path d="M650 23V40M650 31L642 40M650 31L658 40M650 40L643 54M650 40L658 55" stroke="#0B2419" strokeWidth="1.7" strokeLinecap="round" opacity=".65" />
    </svg>
  );
}

function FoodImage({ src, alt }: { src?: string | null; alt: string }) {
  if (src) return <img src={src} alt={alt} />;

  return (
    <div className="ef-food-fallback">
      <div className="ef-plate">
        <span>🍗</span>
        <span>🥦</span>
        <span>🍚</span>
      </div>
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
          .select(
            "full_name,calorie_goal,protein_goal,water_goal_ml,streak_days,onboarding_completed",
          )
          .eq("id", user!.id)
          .maybeSingle()
      ).data,
  });

  useEffect(() => {
    if (
      profile &&
      (profile as { onboarding_completed?: boolean | null })
        .onboarding_completed === false
    ) {
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

  const calorieGoal =
    (profile as { calorie_goal?: number } | null)?.calorie_goal ?? 2000;
  const proteinGoal =
    (profile as { protein_goal?: number } | null)?.protein_goal ?? 120;
  const waterGoal =
    (profile as { water_goal_ml?: number } | null)?.water_goal_ml ?? 2500;

  const calories = Math.round(daily?.calories ?? 0);
  const progressPct = Math.min(
    100,
    Math.max(0, Math.round((calories / calorieGoal) * 100)),
  );
  const visualProgress = progressPct || 72;

  const closesAt = nearest?.closes_at
    ? nearest.closes_at.slice(0, 5).replace(":", "h")
    : "22h00";

  const phrases = useMemo(
    () => [
      "Disciplina hoje, liberdade amanhã.",
      "Pequenas escolhas constroem grandes transformações.",
      "Você não precisa ser perfeito, só consistente.",
      "O próximo passo é sempre o mais importante.",
      "Cuidar de você também é produtividade.",
    ],
    [],
  );

  const phrase = phrases[now.getDate() % phrases.length];

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

    syncStreak().then((synced) => {
      if (synced != null) {
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

    Promise.all(checks).then((results) => {
      if (results.some(Boolean)) qc.invalidateQueries({ queryKey: ["achievements"] });
    });
  }, [user, daily, waterGoal, proteinGoal, qc]);

  if (!user) return null;

  return (
    <div className="ef-page">
      <style>{`
        html,
        body,
        #root {
          width: 100%;
          min-width: 0;
          height: 100%;
          overflow: hidden !important;
          background: #fbfaf7 !important;
        }

        * {
          box-sizing: border-box;
        }

        :root {
          --ef-bg: #fbfaf7;
          --ef-ink: #0a2418;
          --ef-muted: rgba(10,36,24,.54);
          --ef-card: rgba(255,255,255,.82);
          --ef-line: rgba(10,36,24,.085);
          --ef-green: #6A9E4E;
          --ef-dark: #0d2118;
          --ef-shadow: 0 22px 54px rgba(10,36,24,.07);
        }

        .ef-page {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: var(--ef-bg);
          color: var(--ef-ink);
          display: grid;
          grid-template-columns: 184px minmax(0, 1fr);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .ef-sidebar {
          width: 184px;
          height: 100vh;
          background: rgba(255,255,255,.76);
          border-right: 1px solid rgba(10,36,24,.055);
          box-shadow: 12px 0 34px rgba(10,36,24,.035);
          border-radius: 0 34px 34px 0;
          padding: 36px 24px 26px;
          display: flex;
          flex-direction: column;
          z-index: 20;
        }

        .ef-logo {
          width: 78px;
          margin-left: 24px;
          font-size: 25px;
          font-weight: 800;
          line-height: .78;
          letter-spacing: -.065em;
          color: #0a2418;
          display: grid;
        }

        .ef-nav {
          margin-top: 55px;
          display: grid;
          gap: 15px;
        }

        .ef-nav-item {
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 0 17px;
          color: rgba(10,36,24,.58);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: -.015em;
        }

        .ef-nav-item.active {
          background: #eef3e8;
          color: #0a2418;
        }

        .ef-premium {
          margin-top: auto;
          height: 186px;
          border: 1px solid rgba(10,36,24,.08);
          background: rgba(255,255,255,.68);
          border-radius: 16px;
          padding: 18px 16px 15px;
          box-shadow: 0 16px 38px rgba(10,36,24,.045);
        }

        .ef-premium-icon {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #e7f1da;
          color: #6A9E4E;
          display: grid;
          place-items: center;
          margin-bottom: 12px;
        }

        .ef-premium strong {
          display: block;
          font-size: 13px;
          color: #0a2418;
          margin-bottom: 8px;
        }

        .ef-premium p {
          color: rgba(10,36,24,.50);
          font-size: 12px;
          line-height: 1.38;
          margin: 0 0 15px;
        }

        .ef-premium-button {
          height: 36px;
          border-radius: 11px;
          background: #f1f3ec;
          padding: 0 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #0a2418;
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
        }

        .ef-user {
          margin-top: 24px;
          height: 36px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(10,36,24,.62);
          font-size: 12px;
        }

        .ef-user-photo {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 34%, #f2c5a7 0 18%, transparent 19%),
            radial-gradient(circle at 50% 77%, #7d3d23 0 26%, transparent 27%),
            linear-gradient(135deg, #ead2bd, #c88d65);
          box-shadow: inset 0 0 0 1px rgba(10,36,24,.08);
        }

        .ef-main {
          position: relative;
          height: 100vh;
          overflow: hidden;
          padding: 41px 76px 40px 92px;
        }

        .ef-topbar {
          position: relative;
          z-index: 5;
          display: flex;
          justify-content: flex-end;
          gap: 28px;
          align-items: center;
          height: 56px;
          margin-bottom: 38px;
        }

        .ef-search {
          width: 340px;
          height: 48px;
          border-radius: 18px;
          background: rgba(255,255,255,.80);
          border: 1px solid var(--ef-line);
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 0 20px;
          box-shadow: 0 16px 42px rgba(10,36,24,.04);
        }

        .ef-search input {
          border: none;
          outline: none;
          background: transparent;
          width: 100%;
          height: 100%;
          font-size: 13px;
          color: var(--ef-ink);
        }

        .ef-search input::placeholder {
          color: rgba(10,36,24,.42);
        }

        .ef-bell {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,.80);
          border: 1px solid var(--ef-line);
          display: grid;
          place-items: center;
          position: relative;
          color: var(--ef-ink);
          box-shadow: 0 16px 42px rgba(10,36,24,.04);
        }

        .ef-bell-dot {
          position: absolute;
          right: 12px;
          top: 10px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #70ad4c;
        }

        .ef-hero-grid {
          position: relative;
          z-index: 5;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 420px;
          gap: 78px;
          align-items: start;
        }

        .ef-greeting {
          color: rgba(10,36,24,.52);
          font-size: 18px;
          font-weight: 400;
          letter-spacing: -.02em;
          margin: 7px 0 0;
        }

        .ef-title {
          margin: 25px 0 0;
          font-family: "Cormorant Garamond", "Playfair Display", Georgia, serif;
          font-size: 56px;
          line-height: .99;
          font-weight: 500;
          letter-spacing: -.052em;
          color: #0a2418;
          max-width: 550px;
        }

        .ef-subtitle {
          margin: 31px 0 0;
          max-width: 390px;
          color: rgba(10,36,24,.48);
          font-size: 16px;
          line-height: 1.48;
          letter-spacing: -.02em;
        }

        .ef-leaf-art {
          position: absolute;
          left: 49.8%;
          top: 178px;
          width: 360px;
          height: 348px;
          z-index: 0;
          opacity: .88;
        }

        .ef-leaf-art svg {
          position: absolute;
          width: 100%;
          height: 100%;
          transform: rotate(-11deg);
        }

        .ef-leaf-glow {
          position: absolute;
          inset: 16px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(91,151,85,.12), transparent 68%);
          filter: blur(22px);
        }

        .ef-progress-card {
          width: 350px;
          height: 155px;
          border-radius: 24px;
          background: rgba(255,255,255,.82);
          border: 1px solid var(--ef-line);
          box-shadow: var(--ef-shadow);
          backdrop-filter: blur(18px);
          display: flex;
          align-items: center;
          padding: 0 26px;
          gap: 23px;
          margin-top: 69px;
          position: relative;
          z-index: 2;
        }

        .ef-progress-copy small {
          display: block;
          color: rgba(10,36,24,.42);
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 13px;
        }

        .ef-progress-copy strong {
          display: block;
          font-family: "Cormorant Garamond", "Playfair Display", Georgia, serif;
          color: #0a2418;
          font-size: 20px;
          line-height: 1.13;
          font-weight: 500;
          letter-spacing: -.035em;
        }

        .ef-progress-copy a {
          margin-top: 17px;
          color: rgba(10,36,24,.48);
          font-size: 12px;
          text-decoration: none;
          display: inline-flex;
          gap: 7px;
          align-items: center;
        }

        .ef-right {
          display: grid;
          gap: 23px;
        }

        .ef-machine-card {
          height: 228px;
          border-radius: 26px;
          background: #0d2118;
          padding: 25px 25px 21px;
          color: white;
          box-shadow: 0 25px 64px rgba(10,36,24,.18);
          overflow: hidden;
          position: relative;
        }

        .ef-machine-card small {
          font-size: 13px;
          color: rgba(255,255,255,.82);
          display: block;
        }

        .ef-distance {
          margin-top: 13px;
          font-size: 30px;
          line-height: 1;
          font-weight: 400;
          letter-spacing: -.04em;
          position: relative;
          z-index: 2;
        }

        .ef-machine-address {
          margin-top: 10px;
          font-size: 12.5px;
          color: rgba(255,255,255,.82);
          position: relative;
          z-index: 2;
        }

        .ef-machine-open {
          margin-top: 7px;
          color: #7ed957;
          font-size: 12.5px;
          font-weight: 500;
          position: relative;
          z-index: 2;
        }

        .ef-map-art {
          position: absolute;
          right: -44px;
          top: 48px;
          width: 245px;
          height: 114px;
          opacity: .72;
          transform: rotate(-7deg);
        }

        .ef-machine-card a {
          margin-top: 32px;
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 11px;
          border-radius: 12px;
          height: 39px;
          padding: 0 15px;
          background: rgba(255,255,255,.10);
          color: rgba(255,255,255,.92);
          text-decoration: none;
          font-size: 12px;
        }

        .ef-food-card {
          height: 249px;
          border-radius: 25px;
          background: rgba(255,255,255,.82);
          border: 1px solid var(--ef-line);
          box-shadow: 0 24px 62px rgba(10,36,24,.06);
          padding: 22px;
        }

        .ef-food-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 15px;
        }

        .ef-food-head span:first-child {
          font-size: 12.5px;
          color: #0a2418;
        }

        .ef-new {
          background: #e6f1db;
          color: #6d9d44;
          font-size: 12px;
          padding: 5px 11px;
          border-radius: 8px;
        }

        .ef-food-body {
          display: grid;
          grid-template-columns: 136px 1fr;
          gap: 18px;
        }

        .ef-food-image {
          width: 136px;
          height: 136px;
          border-radius: 17px;
          overflow: hidden;
          background: #eef0eb;
        }

        .ef-food-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ef-food-fallback {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          background: radial-gradient(circle at center, #e9efe2, #f7f7f2);
        }

        .ef-plate {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: #f8f6ef;
          display: grid;
          place-items: center;
          box-shadow: inset 0 0 0 7px #eee6dc;
          font-size: 25px;
        }

        .ef-food-copy h2 {
          margin: 2px 0 0;
          font-size: 16px;
          line-height: 1.19;
          letter-spacing: -.025em;
          color: #0a2418;
        }

        .ef-food-copy p {
          margin: 10px 0 0;
          color: rgba(10,36,24,.46);
          font-size: 12.5px;
          line-height: 1.43;
        }

        .ef-macros {
          margin-top: 15px;
          height: 42px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #efefe9;
          border-radius: 9px;
          overflow: hidden;
        }

        .ef-macro {
          display: grid;
          place-items: center;
          text-align: center;
        }

        .ef-macro strong {
          font-size: 12px;
          color: #0a2418;
          letter-spacing: -.02em;
        }

        .ef-macro small {
          display: block;
          font-size: 8px;
          color: rgba(10,36,24,.45);
        }

        .ef-food-actions {
          display: flex;
          gap: 10px;
          margin-top: 14px;
        }

        .ef-food-button {
          height: 38px;
          flex: 1;
          border-radius: 12px;
          background: #0d2118;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
        }

        .ef-plus {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #0d2118;
          color: white;
          display: grid;
          place-items: center;
          text-decoration: none;
        }

        .ef-phrase {
          margin-top: 35px;
          height: 75px;
          border-radius: 18px;
          background: linear-gradient(90deg, #eef3e4 0%, #f5f5ee 52%, #e1e9d9 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          padding-left: 28px;
          z-index: 5;
        }

        .ef-spark {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #5f9446;
          display: grid;
          place-items: center;
          color: white;
          margin-right: 24px;
        }

        .ef-phrase small {
          color: rgba(10,36,24,.42);
          font-size: 11px;
          display: block;
          margin-bottom: 5px;
        }

        .ef-phrase strong {
          color: #0a2418;
          font-size: 13px;
          font-weight: 500;
        }

        .ef-landscape {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 57%;
          height: 100%;
        }

        .ef-actions {
          margin-top: 18px;
          position: relative;
          z-index: 5;
        }

        .ef-actions h3 {
          margin: 0 0 15px 14px;
          font-size: 12.5px;
          font-weight: 500;
          color: #0a2418;
        }

        .ef-actions-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .ef-action {
          height: 96px;
          border-radius: 19px;
          background: rgba(255,255,255,.82);
          border: 1px solid var(--ef-line);
          box-shadow: 0 18px 45px rgba(10,36,24,.04);
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 0 18px;
          color: #0a2418;
          text-decoration: none;
        }

        .ef-action-icon {
          width: 49px;
          height: 49px;
          border-radius: 50%;
          background: #f1f3ec;
          display: grid;
          place-items: center;
          flex: none;
        }

        .ef-action strong {
          display: block;
          font-size: 13px;
          margin-bottom: 6px;
        }

        .ef-action p {
          margin: 0;
          font-size: 11.5px;
          line-height: 1.34;
          color: rgba(10,36,24,.46);
        }

        @media (max-width: 1180px) {
          .ef-page {
            grid-template-columns: 160px minmax(0, 1fr);
          }

          .ef-main {
            padding-left: 50px;
            padding-right: 50px;
          }

          .ef-hero-grid {
            gap: 42px;
            grid-template-columns: minmax(0, 1fr) 390px;
          }

          .ef-title {
            font-size: 50px;
          }
        }
      `}</style>

      <Sidebar />

      <main className="ef-main">
        <LeafArt />

        <header className="ef-topbar">
          <div className="ef-search">
            <Search size={16} strokeWidth={1.8} color="rgba(10,36,24,.42)" />
            <input placeholder="Buscar máquinas, refeições..." />
          </div>

          <Link to="/notifications" className="ef-bell">
            <Bell size={18} strokeWidth={1.75} />
            <span className="ef-bell-dot" />
          </Link>
        </header>

        <section className="ef-hero-grid">
          <div>
            <p className="ef-greeting">Oi, Maria 👋</p>

            <h1 className="ef-title">
              Cuidar de você
              <br />
              nunca foi tão fácil.
            </h1>

            <p className="ef-subtitle">
              Pequenas escolhas todos os dias
              <br />
              constroem grandes transformações.
            </p>

            <div className="ef-progress-card">
              <ProgressRing pct={visualProgress} />

              <div className="ef-progress-copy">
                <small>Seu progresso semanal</small>
                <strong>
                  Você está no
                  <br />
                  caminho certo!
                </strong>
                <Link to="/profile">
                  Ver evolução
                  <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          </div>

          <aside className="ef-right">
            <section className="ef-machine-card">
              <small>Máquina mais próxima</small>
              <div className="ef-distance">{nearest ? "89 m" : "—"}</div>
              <div className="ef-machine-address">
                {nearest?.address ?? "Rua Pamplona, 145"}
              </div>
              <div className="ef-machine-open">
                Aberta agora até {nearest ? closesAt : "22h00"}
              </div>
              <MapArt />
              <Link to="/machines">
                Ver todas as máquinas
                <ChevronRight size={14} />
              </Link>
            </section>

            <section className="ef-food-card">
              <div className="ef-food-head">
                <span>Sugestão para você</span>
                <span className="ef-new">Novo</span>
              </div>

              <div className="ef-food-body">
                <div className="ef-food-image">
                  <FoodImage
                    src={featuredProduct?.image_url}
                    alt={featuredProduct?.name ?? "Frango grelhado com arroz integral"}
                  />
                </div>

                <div className="ef-food-copy">
                  <h2>
                    {featuredProduct?.name ?? (
                      <>
                        Frango grelhado
                        <br />
                        com arroz integral
                      </>
                    )}
                  </h2>
                  <p>
                    {featuredProduct?.description ??
                      "Equilibrada, nutritiva e cheia de sabor."}
                  </p>

                  <div className="ef-macros">
                    {[
                      { value: featuredProduct?.calories ?? 480, unit: "kcal", label: "" },
                      { value: featuredProduct?.protein ?? 32, unit: "g", label: "Proteína" },
                      { value: featuredProduct?.carbs ?? 56, unit: "g", label: "Carbo" },
                      { value: featuredProduct?.fat ?? 12, unit: "g", label: "Gordura" },
                    ].map((macro) => (
                      <div className="ef-macro" key={macro.label || "kcal"}>
                        <div>
                          <strong>
                            {macro.value}
                            {macro.unit}
                          </strong>
                          {macro.label && <small>{macro.label}</small>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="ef-food-actions">
                    <Link to="/catalog" className="ef-food-button">
                      Ver detalhes
                      <ChevronRight size={13} />
                    </Link>
                    <Link to="/catalog" className="ef-plus">
                      <Plus size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </section>

        <section className="ef-phrase">
          <div className="ef-spark">
            <Sparkles size={22} strokeWidth={1.7} />
          </div>

          <div>
            <small>Frase do dia</small>
            <strong>{phrase}</strong>
          </div>

          <Landscape />
        </section>

        <section className="ef-actions">
          <h3>Ações rápidas</h3>

          <div className="ef-actions-grid">
            {[
              {
                icon: <ScanLine size={21} strokeWidth={1.65} />,
                label: "Escanear refeição",
                desc: "Use a IA para analisar sua refeição",
                to: "/nutrition",
              },
              {
                icon: <Droplets size={21} strokeWidth={1.65} />,
                label: "Registrar água",
                desc: "Acompanhe sua hidratação diária",
                to: "/",
                onClick: () => logWater.mutate(250),
              },
              {
                icon: <BellRing size={21} strokeWidth={1.65} />,
                label: "Próximo lembrete",
                desc: "Sua próxima refeição em 2h 15min",
                to: "/notifications",
              },
              {
                icon: <FileText size={21} strokeWidth={1.65} />,
                label: "Ver meu plano",
                desc: "Seu plano alimentar personalizado",
                to: "/meal-plan",
              },
            ].map(({ icon, label, desc, to, onClick }) => (
              <Link key={label} to={to} onClick={onClick} className="ef-action">
                <div className="ef-action-icon">{icon}</div>
                <div>
                  <strong>{label}</strong>
                  <p>{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
