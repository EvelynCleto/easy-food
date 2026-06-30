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
  const r = 48;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;

  return (
    <svg width="126" height="126" viewBox="0 0 126 126">
      <circle cx="63" cy="63" r={r} fill="none" stroke="#E7EAE3" strokeWidth="9" />
      <circle
        cx="63"
        cy="63"
        r={r}
        fill="none"
        stroke="#6A9E4E"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        strokeDashoffset={c / 4}
      />
      <text
        x="63"
        y="68"
        textAnchor="middle"
        fontSize="29"
        fontWeight="400"
        fontFamily="Inter, system-ui, sans-serif"
        fill="#0A2418"
      >
        {value}%
      </text>
    </svg>
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
      <div className="ef-logo">
        <span>easy</span>
        <span>food</span>
      </div>

      <nav className="ef-nav">
        {nav.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`ef-nav-item ${index === 0 ? "active" : ""}`}
            >
              <Icon size={20} strokeWidth={1.7} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="ef-premium">
        <div className="ef-premium-icon">
          <Crown size={14} />
        </div>
        <strong>Seja Premium</strong>
        <p>Mais benefícios e inteligência para sua jornada.</p>
        <Link to="/premium">
          Ver planos
          <ChevronRight size={13} />
        </Link>
      </div>

      <div className="ef-user">
        <div className="ef-avatar" />
        <span>Maria Silva</span>
        <ChevronDown size={14} />
      </div>
    </aside>
  );
}

function LeafArt() {
  return (
    <div className="ef-leaf-art" aria-hidden>
      <div className="ef-leaf-shadow" />
      <svg viewBox="0 0 430 420" fill="none">
        <path d="M208 407C206 326 188 250 153 168C130 116 99 69 52 25" stroke="#78AD83" strokeWidth="4.2" strokeLinecap="round" opacity=".55"/>
        <path d="M154 170C96 156 54 109 32 44C95 58 140 98 154 170Z" fill="#6DBE8C" opacity=".48"/>
        <path d="M178 240C119 232 78 198 51 145C113 153 162 187 178 240Z" fill="#6DBE8C" opacity=".36"/>
        <path d="M194 307C148 299 113 270 91 225C142 231 182 259 194 307Z" fill="#6DBE8C" opacity=".25"/>
        <path d="M146 150C202 89 267 61 371 63C319 135 238 172 146 150Z" fill="#6DBE8C" opacity=".42"/>
        <path d="M176 222C233 170 298 150 392 166C332 235 254 252 176 222Z" fill="#6DBE8C" opacity=".31"/>
      </svg>
    </div>
  );
}

function MapArt() {
  return (
    <svg className="ef-map-art" viewBox="0 0 380 150" preserveAspectRatio="none" aria-hidden>
      <rect width="380" height="150" rx="22" fill="#142F1C" />
      {Array.from({ length: 8 }).map((_, i) => (
        <path key={`h-${i}`} d={`M0 ${i * 22 + 10}H380`} stroke="#33543A" strokeWidth="1" />
      ))}
      {Array.from({ length: 11 }).map((_, i) => (
        <path key={`v-${i}`} d={`M${i * 39 + 14} 0V150`} stroke="#33543A" strokeWidth="1" />
      ))}
      <rect x="112" width="33" height="150" fill="#243F2A" />
      <rect y="47" width="380" height="15" fill="#243F2A" />
      <circle cx="128" cy="58" r="34" fill="#6FC653" opacity=".13" />
      <circle cx="128" cy="58" r="21" fill="#6FC653" opacity=".22" />
      <circle cx="128" cy="58" r="10" fill="#63C84F" />
      <circle cx="128" cy="58" r="5" fill="white" />
      <path d="M128 69V84" stroke="#2DAB6B" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function Landscape() {
  return (
    <svg className="ef-landscape" viewBox="0 0 760 84" preserveAspectRatio="none" aria-hidden>
      <path d="M0 84C108 36 178 55 265 35C365 12 445 40 543 21C620 8 686 19 760 0V84H0Z" fill="#879B7D" opacity=".24" />
      <path d="M0 84C124 55 210 66 326 50C455 31 560 52 760 31V84H0Z" fill="#334434" opacity=".26" />
      <circle cx="650" cy="20" r="3.6" fill="#0B2419" opacity=".68" />
      <path d="M650 25V43M650 33L642 43M650 33L658 43M650 43L643 58M650 43L658 59" stroke="#0B2419" strokeWidth="1.7" strokeLinecap="round" opacity=".68" />
    </svg>
  );
}

function FoodImage({ src, alt }: { src?: string | null; alt: string }) {
  if (src) return <img src={src} alt={alt} />;

  return (
    <div className="ef-food-fallback">
      <div className="ef-plate">🥗</div>
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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400;500;600;700;800&display=swap');

        html,
        body,
        #root {
          width: 100%;
          height: 100%;
          overflow: hidden !important;
          margin: 0 !important;
          background: #fbfaf7 !important;
        }

        * {
          box-sizing: border-box;
        }

        .ef-page {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #fbfaf7;
          color: #0a2418;
          display: grid;
          grid-template-columns: 184px minmax(0, 1fr);
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        }

        .ef-sidebar {
          height: 100vh;
          background: rgba(255,255,255,.77);
          border-right: 1px solid rgba(10,36,24,.055);
          box-shadow: 12px 0 34px rgba(10,36,24,.035);
          border-radius: 0 35px 35px 0;
          padding: 36px 24px 26px;
          display: flex;
          flex-direction: column;
          z-index: 20;
        }

        .ef-logo {
          width: 70px;
          margin-left: 26px;
          color: #0a2418;
          font-size: 25px;
          font-weight: 800;
          line-height: .78;
          letter-spacing: -.065em;
          display: grid;
        }

        .ef-nav {
          margin-top: 57px;
          display: grid;
          gap: 16px;
        }

        .ef-nav-item {
          height: 48px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 0 17px;
          color: rgba(10,36,24,.58);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
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

        .ef-premium a {
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

        .ef-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 34%, #f2c5a7 0 18%, transparent 19%),
            radial-gradient(circle at 50% 77%, #7d3d23 0 26%, transparent 27%),
            linear-gradient(135deg, #ead2bd, #c88d65);
        }

        .ef-main {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }

        .ef-search {
          position: absolute;
          top: 39px;
          right: 220px;
          width: 310px;
          height: 48px;
          border-radius: 17px;
          background: rgba(255,255,255,.82);
          border: 1px solid rgba(10,36,24,.085);
          box-shadow: 0 16px 42px rgba(10,36,24,.04);
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 0 20px;
          z-index: 5;
        }

        .ef-search input {
          border: 0;
          outline: 0;
          background: transparent;
          width: 100%;
          height: 100%;
          font-size: 13px;
          color: #0a2418;
        }

        .ef-search input::placeholder {
          color: rgba(10,36,24,.42);
        }

        .ef-bell {
          position: absolute;
          top: 39px;
          right: 143px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255,255,255,.82);
          border: 1px solid rgba(10,36,24,.085);
          color: #0a2418;
          display: grid;
          place-items: center;
          box-shadow: 0 16px 42px rgba(10,36,24,.04);
          z-index: 5;
        }

        .ef-bell span {
          position: absolute;
          right: 11px;
          top: 10px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #70ad4c;
        }

        .ef-greeting {
          position: absolute;
          left: 91px;
          top: 122px;
          margin: 0;
          color: rgba(10,36,24,.52);
          font-size: 18px;
          font-weight: 400;
          letter-spacing: -.02em;
          z-index: 6;
        }

        .ef-title {
          position: absolute;
          left: 91px;
          top: 168px;
          margin: 0;
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 66px;
          line-height: .99;
          font-weight: 500;
          letter-spacing: -.052em;
          color: #0a2418;
          width: 560px;
          z-index: 6;
        }

        .ef-subtitle {
          position: absolute;
          left: 91px;
          top: 352px;
          margin: 0;
          color: rgba(10,36,24,.48);
          font-size: 16px;
          line-height: 1.48;
          letter-spacing: -.02em;
          z-index: 6;
        }

        .ef-leaf-art {
          position: absolute;
          left: 462px;
          top: 205px;
          width: 360px;
          height: 348px;
          z-index: 1;
          opacity: .86;
        }

        .ef-leaf-art svg {
          position: absolute;
          width: 100%;
          height: 100%;
          transform: rotate(-11deg);
        }

        .ef-leaf-shadow {
          position: absolute;
          inset: 16px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(91,151,85,.11), transparent 68%);
          filter: blur(22px);
        }

        .ef-progress-card {
          position: absolute;
          left: 91px;
          top: 454px;
          width: 350px;
          height: 155px;
          border-radius: 24px;
          background: rgba(255,255,255,.82);
          border: 1px solid rgba(10,36,24,.085);
          box-shadow: 0 22px 54px rgba(10,36,24,.07);
          display: flex;
          align-items: center;
          padding: 0 26px;
          gap: 23px;
          z-index: 6;
        }

        .ef-progress-copy small {
          color: rgba(10,36,24,.42);
          display: block;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 13px;
        }

        .ef-progress-copy strong {
          display: block;
          font-family: "Cormorant Garamond", Georgia, serif;
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

        .ef-machine-card {
          position: absolute;
          right: 143px;
          top: 111px;
          width: 420px;
          height: 228px;
          border-radius: 26px;
          background: #0d2118;
          color: white;
          box-shadow: 0 25px 64px rgba(10,36,24,.18);
          overflow: hidden;
          padding: 25px 25px 21px;
          z-index: 6;
        }

        .ef-machine-card small {
          font-size: 13px;
          color: rgba(255,255,255,.82);
        }

        .ef-distance {
          margin-top: 13px;
          font-size: 34px;
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
          right: -40px;
          top: 49px;
          width: 245px;
          height: 114px;
          opacity: .72;
          transform: rotate(-7deg);
        }

        .ef-machine-card a {
          position: absolute;
          left: 25px;
          bottom: 21px;
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
          position: absolute;
          right: 143px;
          top: 363px;
          width: 420px;
          height: 249px;
          border-radius: 25px;
          background: rgba(255,255,255,.82);
          border: 1px solid rgba(10,36,24,.085);
          box-shadow: 0 24px 62px rgba(10,36,24,.06);
          padding: 22px;
          z-index: 6;
        }

        .ef-food-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
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
          display: grid;
          place-items: center;
          font-size: 44px;
          background: #f8f6ef;
          box-shadow: inset 0 0 0 7px #eee6dc;
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
          position: absolute;
          left: 91px;
          right: 143px;
          top: 638px;
          height: 75px;
          border-radius: 18px;
          background: linear-gradient(90deg, #eef3e4 0%, #f5f5ee 52%, #e1e9d9 100%);
          overflow: hidden;
          display: flex;
          align-items: center;
          padding-left: 28px;
          z-index: 6;
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

        .ef-actions-title {
          position: absolute;
          left: 106px;
          top: 729px;
          font-size: 12.5px;
          font-weight: 500;
          color: #0a2418;
          z-index: 6;
        }

        .ef-actions {
          position: absolute;
          left: 91px;
          right: 143px;
          top: 759px;
          height: 96px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          z-index: 6;
        }

        .ef-action {
          height: 96px;
          border-radius: 19px;
          background: rgba(255,255,255,.82);
          border: 1px solid rgba(10,36,24,.085);
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

        @media (max-height: 820px) {
          .ef-actions-title,
          .ef-actions {
            display: none;
          }
        }
      `}</style>

      <Sidebar />

      <main className="ef-main">
        <div className="ef-search">
          <Search size={16} strokeWidth={1.8} color="rgba(10,36,24,.42)" />
          <input placeholder="Buscar máquinas, refeições..." />
        </div>

        <Link to="/notifications" className="ef-bell">
          <Bell size={18} strokeWidth={1.75} />
          <span />
        </Link>

        <LeafArt />

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

        <div className="ef-actions-title">Ações rápidas</div>

        <section className="ef-actions">
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
        </section>
      </main>
    </div>
  );
}
