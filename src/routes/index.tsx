import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Droplets,
  Home,
  MapPin,
  Plus,
  ScanLine,
  Search,
  Sparkles,
  BarChart3,
  FileText,
  Crown,
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
  const r = 57;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;

  return (
    <svg width="146" height="146" viewBox="0 0 146 146">
      <circle cx="73" cy="73" r={r} fill="none" stroke="#E7EAE3" strokeWidth="10" />
      <circle
        cx="73"
        cy="73"
        r={r}
        fill="none"
        stroke="#5F9446"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        strokeDashoffset={c / 4}
      />
      <text
        x="73"
        y="77"
        textAnchor="middle"
        fontSize="31"
        fontWeight="500"
        fontFamily="Inter, system-ui, sans-serif"
        fill="#0B2419"
      >
        {value}%
      </text>
    </svg>
  );
}

function Logo() {
  return (
    <div className="ef-logo">
      <span>easy</span>
      <span className="leaf">❧</span>
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
              <Icon size={21} strokeWidth={1.75} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="ef-premium">
        <div className="ef-premium-icon">
          <Crown size={15} strokeWidth={1.9} />
        </div>
        <strong>Seja Premium</strong>
        <p>Mais benefícios e inteligência para sua jornada.</p>
        <Link to="/premium" className="ef-premium-button">
          Ver planos
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="ef-user">
        <div className="ef-user-photo" />
        <span>Maria Silva</span>
        <ChevronDown size={15} />
      </div>
    </aside>
  );
}

function LeafArt() {
  return (
    <div className="ef-leaf-art" aria-hidden>
      <div className="ef-leaf-blur" />
      <svg viewBox="0 0 480 460" fill="none">
        <path
          d="M236 445C232 350 210 262 168 174C143 119 108 70 56 25"
          stroke="#74B58D"
          strokeWidth="5"
          strokeLinecap="round"
          opacity=".48"
        />
        <path d="M171 180C104 164 55 110 30 38C102 54 154 98 171 180Z" fill="#72BD9B" opacity=".43" />
        <path d="M199 258C133 249 85 212 54 150C124 159 180 196 199 258Z" fill="#72BD9B" opacity=".34" />
        <path d="M217 331C165 322 126 290 101 240C157 247 202 278 217 331Z" fill="#72BD9B" opacity=".24" />
        <path d="M162 161C226 90 302 59 421 61C362 145 268 185 162 161Z" fill="#72BD9B" opacity=".38" />
        <path d="M196 240C261 181 335 157 444 175C376 254 285 274 196 240Z" fill="#72BD9B" opacity=".31" />
      </svg>
    </div>
  );
}

function MapCardArt() {
  return (
    <div className="ef-map-art">
      <svg viewBox="0 0 430 145" preserveAspectRatio="none">
        <rect width="430" height="145" rx="22" fill="#183520" />
        {Array.from({ length: 8 }).map((_, index) => (
          <path
            key={`h-${index}`}
            d={`M0 ${index * 23 + 12}H430`}
            stroke="#31583A"
            strokeWidth="1.25"
          />
        ))}
        {Array.from({ length: 11 }).map((_, index) => (
          <path
            key={`v-${index}`}
            d={`M${index * 43 + 18} 0V145`}
            stroke="#31583A"
            strokeWidth="1.25"
          />
        ))}
        <rect x="122" width="37" height="145" fill="#233F29" />
        <rect y="48" width="430" height="16" fill="#233F29" />
        <circle cx="141" cy="61" r="35" fill="#6FC653" opacity=".14" />
        <circle cx="141" cy="61" r="22" fill="#6FC653" opacity=".22" />
        <circle cx="141" cy="61" r="11" fill="#63C84F" />
        <circle cx="141" cy="61" r="5" fill="white" />
        <path d="M141 72V87" stroke="#2DAB6B" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Landscape() {
  return (
    <svg className="ef-landscape" viewBox="0 0 760 92" preserveAspectRatio="none" aria-hidden>
      <path d="M0 92C108 39 178 61 265 38C365 12 445 45 543 24C620 8 686 21 760 0V92H0Z" fill="#7F9276" opacity=".25" />
      <path d="M0 92C124 62 210 75 326 56C455 35 560 59 760 34V92H0Z" fill="#344235" opacity=".28" />
      <circle cx="650" cy="20" r="4" fill="#0B2419" opacity=".7" />
      <path d="M650 25V46M650 34L641 45M650 34L659 45M650 46L642 62M650 46L659 63" stroke="#0B2419" strokeWidth="2" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

function FoodImage({ src, alt }: { src?: string | null; alt: string }) {
  if (src) return <img src={src} alt={alt} />;

  return (
    <div className="ef-food-fallback">
      <div className="plate">
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
        :root {
          --ef-bg: #fbfaf7;
          --ef-ink: #0b2419;
          --ef-muted: rgba(11, 36, 25, .54);
          --ef-soft: #f1f3ec;
          --ef-green: #5f9446;
          --ef-dark: #0d2118;
          --ef-line: rgba(11, 36, 25, .085);
          --ef-shadow: 0 28px 80px rgba(11, 36, 25, .075);
        }

        .ef-page {
          min-height: 100vh;
          width: 100%;
          background: var(--ef-bg);
          color: var(--ef-ink);
          display: grid;
          grid-template-columns: 230px minmax(0, 1fr);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .ef-sidebar {
          min-height: 100vh;
          background: rgba(255,255,255,.72);
          border-right: 1px solid rgba(11,36,25,.055);
          box-shadow: 14px 0 40px rgba(11,36,25,.035);
          border-radius: 0 36px 36px 0;
          padding: 45px 26px 34px;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .ef-logo {
          font-size: 31px;
          font-weight: 800;
          line-height: .82;
          letter-spacing: -.065em;
          color: #0b2419;
          width: 86px;
          margin-left: 27px;
          display: grid;
        }

        .ef-logo .leaf {
          color: #7fb356;
          font-size: 18px;
          line-height: 0;
          margin-left: 0;
          transform: translate(1px, -2px);
        }

        .ef-nav {
          margin-top: 68px;
          display: grid;
          gap: 17px;
        }

        .ef-nav-item {
          height: 58px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 0 24px;
          color: rgba(11,36,25,.62);
          text-decoration: none;
          font-size: 16px;
          font-weight: 500;
          letter-spacing: -.015em;
        }

        .ef-nav-item.active {
          background: #eef3e8;
          color: #0b2419;
        }

        .ef-premium {
          margin-top: auto;
          border: 1px solid rgba(11,36,25,.08);
          background: rgba(255,255,255,.66);
          border-radius: 18px;
          padding: 21px 18px 18px;
          box-shadow: 0 18px 44px rgba(11,36,25,.045);
        }

        .ef-premium-icon {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #e7f1da;
          color: #5f9446;
          display: grid;
          place-items: center;
          margin-bottom: 13px;
        }

        .ef-premium strong {
          display: block;
          font-size: 15px;
          color: #0b2419;
          margin-bottom: 9px;
        }

        .ef-premium p {
          color: rgba(11,36,25,.52);
          font-size: 14px;
          line-height: 1.45;
          margin: 0 0 20px;
        }

        .ef-premium-button {
          height: 44px;
          border-radius: 13px;
          background: #f1f3ec;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #0b2419;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
        }

        .ef-user {
          margin-top: 29px;
          height: 52px;
          display: flex;
          align-items: center;
          gap: 13px;
          color: rgba(11,36,25,.62);
          font-size: 14px;
        }

        .ef-user-photo {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 37%, #f2c5a7 0 18%, transparent 19%),
            radial-gradient(circle at 50% 76%, #7d3d23 0 26%, transparent 27%),
            linear-gradient(135deg, #ead2bd, #c88d65);
          box-shadow: inset 0 0 0 1px rgba(11,36,25,.08);
        }

        .ef-main {
          position: relative;
          overflow: hidden;
          padding: 48px 96px 64px 118px;
        }

        .ef-topbar {
          position: relative;
          z-index: 5;
          display: flex;
          justify-content: flex-end;
          gap: 29px;
          align-items: center;
          margin-bottom: 51px;
        }

        .ef-search {
          width: 400px;
          height: 59px;
          border-radius: 20px;
          background: rgba(255,255,255,.78);
          border: 1px solid var(--ef-line);
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 0 24px;
          box-shadow: 0 18px 50px rgba(11,36,25,.045);
        }

        .ef-search input {
          border: none;
          outline: none;
          background: transparent;
          width: 100%;
          height: 100%;
          font-size: 15px;
          color: var(--ef-ink);
        }

        .ef-search input::placeholder {
          color: rgba(11,36,25,.42);
        }

        .ef-bell {
          width: 59px;
          height: 59px;
          border-radius: 50%;
          background: rgba(255,255,255,.78);
          border: 1px solid var(--ef-line);
          display: grid;
          place-items: center;
          position: relative;
          color: var(--ef-ink);
          box-shadow: 0 18px 50px rgba(11,36,25,.045);
        }

        .ef-bell-dot {
          position: absolute;
          right: 14px;
          top: 13px;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #70ad4c;
        }

        .ef-hero-grid {
          position: relative;
          z-index: 5;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 520px;
          gap: 76px;
          align-items: start;
        }

        .ef-greeting {
          color: rgba(11,36,25,.52);
          font-size: 22px;
          font-weight: 400;
          letter-spacing: -.02em;
          margin: 0;
        }

        .ef-title {
          margin: 27px 0 0;
          font-family: "Cormorant Garamond", "Playfair Display", Georgia, serif;
          font-size: 78px;
          line-height: .98;
          font-weight: 500;
          letter-spacing: -.055em;
          color: #0b2419;
          max-width: 650px;
        }

        .ef-subtitle {
          margin: 42px 0 0;
          max-width: 390px;
          color: rgba(11,36,25,.48);
          font-size: 18px;
          line-height: 1.5;
          letter-spacing: -.02em;
        }

        .ef-hero-stage {
          height: 292px;
          position: relative;
          margin-top: 73px;
        }

        .ef-leaf-art {
          position: absolute;
          left: 45%;
          top: 179px;
          width: 430px;
          height: 420px;
          z-index: 0;
          opacity: .95;
        }

        .ef-leaf-art svg {
          position: absolute;
          width: 100%;
          height: 100%;
          transform: rotate(-11deg);
        }

        .ef-leaf-blur {
          position: absolute;
          inset: 22px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(91,151,85,.12), transparent 68%);
          filter: blur(22px);
        }

        .ef-progress-card {
          width: 417px;
          height: 224px;
          border-radius: 29px;
          background: rgba(255,255,255,.82);
          border: 1px solid var(--ef-line);
          box-shadow: var(--ef-shadow);
          backdrop-filter: blur(18px);
          display: flex;
          align-items: center;
          padding: 0 32px;
          gap: 28px;
          position: relative;
          z-index: 2;
        }

        .ef-progress-copy small {
          display: block;
          color: rgba(11,36,25,.42);
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 18px;
        }

        .ef-progress-copy strong {
          display: block;
          font-family: "Cormorant Garamond", "Playfair Display", Georgia, serif;
          color: #0b2419;
          font-size: 25px;
          line-height: 1.12;
          font-weight: 500;
          letter-spacing: -.035em;
        }

        .ef-progress-copy a {
          margin-top: 25px;
          color: rgba(11,36,25,.48);
          font-size: 13px;
          text-decoration: none;
          display: inline-flex;
          gap: 8px;
          align-items: center;
        }

        .ef-right {
          display: grid;
          gap: 25px;
        }

        .ef-machine-card {
          height: 276px;
          border-radius: 29px;
          background: #0d2118;
          padding: 31px 31px 26px;
          color: white;
          box-shadow: 0 27px 70px rgba(11,36,25,.18);
          overflow: hidden;
        }

        .ef-machine-card small {
          font-size: 14px;
          color: rgba(255,255,255,.82);
          display: block;
        }

        .ef-distance {
          margin-top: 14px;
          font-size: 35px;
          line-height: 1;
          font-weight: 400;
          letter-spacing: -.04em;
        }

        .ef-machine-address {
          margin-top: 12px;
          font-size: 14px;
          color: rgba(255,255,255,.82);
        }

        .ef-machine-open {
          margin-top: 8px;
          color: #7ed957;
          font-size: 14px;
          font-weight: 500;
        }

        .ef-map-art {
          margin-top: -90px;
          margin-left: 205px;
          width: 290px;
          height: 151px;
          opacity: .72;
          transform: rotate(-7deg);
        }

        .ef-machine-card a {
          margin-top: -2px;
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 13px;
          border-radius: 14px;
          height: 44px;
          padding: 0 18px;
          background: rgba(255,255,255,.10);
          color: rgba(255,255,255,.92);
          text-decoration: none;
          font-size: 13px;
        }

        .ef-food-card {
          height: 296px;
          border-radius: 28px;
          background: rgba(255,255,255,.82);
          border: 1px solid var(--ef-line);
          box-shadow: 0 26px 70px rgba(11,36,25,.065);
          padding: 26px;
        }

        .ef-food-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
        }

        .ef-food-head span:first-child {
          font-size: 14px;
          color: #0b2419;
        }

        .ef-new {
          background: #e6f1db;
          color: #6d9d44;
          font-size: 14px;
          padding: 6px 13px;
          border-radius: 8px;
        }

        .ef-food-body {
          display: grid;
          grid-template-columns: 167px 1fr;
          gap: 25px;
        }

        .ef-food-image {
          width: 167px;
          height: 167px;
          border-radius: 19px;
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

        .ef-food-fallback .plate {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: #f8f6ef;
          display: grid;
          place-items: center;
          box-shadow: inset 0 0 0 8px #eee6dc;
          font-size: 30px;
        }

        .ef-food-copy h2 {
          margin: 5px 0 0;
          font-size: 19px;
          line-height: 1.2;
          letter-spacing: -.025em;
          color: #0b2419;
        }

        .ef-food-copy p {
          margin: 16px 0 0;
          color: rgba(11,36,25,.46);
          font-size: 14px;
          line-height: 1.5;
        }

        .ef-macros {
          margin-top: 22px;
          height: 54px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #efefe9;
          border-radius: 10px;
          overflow: hidden;
        }

        .ef-macro {
          display: grid;
          place-items: center;
          text-align: center;
        }

        .ef-macro strong {
          font-size: 15px;
          color: #0b2419;
          letter-spacing: -.02em;
        }

        .ef-macro small {
          display: block;
          font-size: 10px;
          color: rgba(11,36,25,.45);
        }

        .ef-food-actions {
          display: flex;
          gap: 12px;
          margin-top: 19px;
        }

        .ef-food-button {
          height: 45px;
          flex: 1;
          border-radius: 14px;
          background: #0d2118;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
        }

        .ef-plus {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: #0d2118;
          color: white;
          display: grid;
          place-items: center;
          text-decoration: none;
        }

        .ef-phrase {
          margin-top: 50px;
          height: 93px;
          border-radius: 19px;
          background: linear-gradient(90deg, #eef3e4 0%, #f5f5ee 52%, #e1e9d9 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          padding-left: 31px;
          z-index: 5;
        }

        .ef-spark {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #5f9446;
          display: grid;
          place-items: center;
          color: white;
          margin-right: 27px;
        }

        .ef-phrase small {
          color: rgba(11,36,25,.42);
          font-size: 12px;
          display: block;
          margin-bottom: 6px;
        }

        .ef-phrase strong {
          color: #0b2419;
          font-size: 15px;
          font-weight: 500;
        }

        .ef-landscape {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 58%;
          height: 100%;
        }

        .ef-actions {
          margin-top: 22px;
          position: relative;
          z-index: 5;
        }

        .ef-actions h3 {
          margin: 0 0 21px 18px;
          font-size: 14px;
          font-weight: 500;
          color: #0b2419;
        }

        .ef-actions-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 30px;
        }

        .ef-action {
          height: 145px;
          border-radius: 22px;
          background: rgba(255,255,255,.82);
          border: 1px solid var(--ef-line);
          box-shadow: 0 22px 60px rgba(11,36,25,.045);
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 0 24px;
          color: #0b2419;
          text-decoration: none;
        }

        .ef-action-icon {
          width: 65px;
          height: 65px;
          border-radius: 50%;
          background: #f1f3ec;
          display: grid;
          place-items: center;
          flex: none;
        }

        .ef-action strong {
          display: block;
          font-size: 15px;
          margin-bottom: 9px;
        }

        .ef-action p {
          margin: 0;
          font-size: 13px;
          line-height: 1.4;
          color: rgba(11,36,25,.46);
        }

        @media (max-width: 1280px) {
          .ef-main { padding-left: 72px; padding-right: 72px; }
          .ef-hero-grid { grid-template-columns: 1fr; }
          .ef-right { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .ef-actions-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 900px) {
          .ef-page { grid-template-columns: 1fr; }
          .ef-sidebar { display: none; }
          .ef-main { padding: 30px 22px; }
          .ef-title { font-size: 52px; }
          .ef-search { display: none; }
          .ef-hero-grid { gap: 30px; }
          .ef-right { grid-template-columns: 1fr; }
          .ef-actions-grid { grid-template-columns: 1fr; }
          .ef-progress-card { width: 100%; }
          .ef-leaf-art { display: none; }
        }
      `}</style>

      <Sidebar />

      <main className="ef-main">
        <LeafArt />

        <header className="ef-topbar">
          <div className="ef-search">
            <Search size={18} strokeWidth={1.8} color="rgba(11,36,25,.42)" />
            <input placeholder="Buscar máquinas, refeições..." />
          </div>

          <Link to="/notifications" className="ef-bell">
            <Bell size={20} strokeWidth={1.75} />
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

            <div className="ef-hero-stage">
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
                    <ChevronRight size={14} />
                  </Link>
                </div>
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
              <MapCardArt />
              <Link to="/machines">
                Ver todas as máquinas
                <ChevronRight size={15} />
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
                      <ChevronRight size={14} />
                    </Link>
                    <Link to="/catalog" className="ef-plus">
                      <Plus size={21} />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </section>

        <section className="ef-phrase">
          <div className="ef-spark">
            <Sparkles size={27} strokeWidth={1.7} />
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
                icon: <ScanLine size={26} strokeWidth={1.65} />,
                label: "Escanear refeição",
                desc: "Use a IA para analisar sua refeição",
                to: "/nutrition",
              },
              {
                icon: <Droplets size={26} strokeWidth={1.65} />,
                label: "Registrar água",
                desc: "Acompanhe sua hidratação diária",
                to: "/",
                onClick: () => logWater.mutate(250),
              },
              {
                icon: <BellRing size={26} strokeWidth={1.65} />,
                label: "Próximo lembrete",
                desc: "Sua próxima refeição em 2h 15min",
                to: "/notifications",
              },
              {
                icon: <FileText size={26} strokeWidth={1.65} />,
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
