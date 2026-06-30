import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart2,
  Bell,
  ClipboardList,
  Compass,
  Crown,
  Home,
  MapPin,
  ScanLine,
  ShoppingBag,
  ChevronDown,
} from "lucide-react";
import { type ReactNode } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./premium/ThemeToggle";
import { CookieBanner } from "./CookieBanner";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn, brl } from "@/lib/format";

const navItems = [
  { to: "/",           label: "Início",   icon: Home        },
  { to: "/catalog",    label: "Explorar", icon: Compass     },
  { to: "/machines",   label: "Máquinas", icon: MapPin      },
  { to: "/nutrition",  label: "Escanear", icon: ScanLine    },
  { to: "/meal-plan",  label: "Plano",    icon: ClipboardList },
  { to: "/profile",    label: "Evolução", icon: BarChart2   },
] as const;

const navMobile = [
  { to: "/",           icon: Home,         label: "Início"   },
  { to: "/catalog",    icon: ShoppingBag,  label: "Cardápio" },
  { to: "/nutrition",  icon: ScanLine,     label: "Escanear" },
  { to: "/profile",    icon: BarChart2,    label: "Evolução" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { count, subtotal } = useCart();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showCartBar = count > 0 && !pathname.startsWith("/cart") && !pathname.startsWith("/checkout");

  const firstName = (user?.user_metadata?.full_name ?? user?.email ?? "Você").split(/[\s@]/)[0];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* ═════════ DESKTOP SIDEBAR ═════════ */}
      <aside
        className="nav-desktop fixed left-0 top-0 hidden h-screen w-[200px] flex-col py-7"
        style={{
          background: "var(--card)",
          borderRight: "1px solid var(--hairline)",
        }}
      >
        {/* Logo */}
        <div className="px-5 mb-8">
          <Link to="/"><Logo /></Link>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5 px-3 flex-1" translate="no">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                preload="intent"
                className="notranslate group flex min-h-[44px] items-center gap-3 rounded-[10px] px-3 py-2.5 transition"
                style={{
                  background: active ? "var(--primary-soft)" : "transparent",
                  color: active ? "var(--primary)" : "var(--ink-2)",
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={active ? 2.2 : 1.7}
                  style={{ color: active ? "var(--primary)" : "var(--ink-3)", flexShrink: 0 }}
                />
                <span
                  className={cn(
                    "text-[14px] transition-colors",
                    active ? "font-semibold" : "font-medium group-hover:text-foreground",
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Premium CTA */}
        <div className="mx-3 mb-4">
          <div
            className="rounded-2xl p-4"
            style={{ background: "var(--surface)" }}
          >
            <div className="mb-2 flex items-center gap-2">
              <div
                className="grid h-7 w-7 place-items-center rounded-lg"
                style={{ background: "var(--primary)", color: "#fff" }}
              >
                <Crown size={14} strokeWidth={2} />
              </div>
              <span className="text-[13px] font-bold" style={{ color: "var(--ink-1)" }}>
                Seja Premium
              </span>
            </div>
            <p className="mb-3 text-[11px] leading-tight" style={{ color: "var(--ink-3)" }}>
              Mais benefícios e inteligência para sua jornada.
            </p>
            <Link
              to="/subscribe"
              className="flex items-center justify-between rounded-xl px-3 py-2 text-[12px] font-semibold transition"
              style={{ background: "var(--card)", color: "var(--primary)" }}
            >
              Ver planos
              <span style={{ color: "var(--ink-3)" }}>›</span>
            </Link>
          </div>
        </div>

        {/* User profile */}
        <div
          className="mx-3 flex items-center gap-3 rounded-xl px-3 py-3 cursor-pointer transition hover:opacity-80"
          style={{ borderTop: "1px solid var(--hairline)" }}
        >
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-bold"
            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
          >
            {firstName[0]?.toUpperCase() ?? "U"}
          </div>
          <span className="flex-1 text-[13px] font-semibold truncate" style={{ color: "var(--ink-1)" }}>
            {firstName}
          </span>
          <ChevronDown size={14} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
        </div>
      </aside>

      {/* ═════════ MOBILE HEADER ═════════ */}
      <header
        className="nav-mobile sticky top-0 z-40 hidden"
        style={{
          background: "color-mix(in srgb, var(--background) 80%, transparent)",
          backdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "0.5px solid var(--hairline)",
        }}
      >
        <div className="flex h-14 items-center justify-between px-5">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <Link to="/notifications" aria-label="Notificações" className="btn-icon">
              <Bell size={17} strokeWidth={1.6} />
            </Link>
            <Link to="/cart" aria-label="Carrinho" className="btn-icon relative">
              <ShoppingBag size={17} strokeWidth={1.6} />
              {count > 0 && (
                <span
                  className="absolute right-1.5 top-1.5 grid h-[15px] min-w-[15px] place-items-center rounded-full px-1 text-[9.5px] font-bold leading-none"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ═════════ MAIN ═════════ */}
      <main className="main-with-sidebar mx-auto w-full max-w-[1200px] px-5 pb-28 pt-6 sm:px-8 lg:px-12 lg:pb-16 lg:pt-8">
        {children}
      </main>

      {/* ═════════ MOBILE — CAPSULE NAV ═════════ */}
      <nav
        translate="no"
        className="nav-mobile fixed bottom-0 left-0 right-0 z-50 hidden safe-bottom"
        style={{
          background: "color-mix(in srgb, var(--card) 80%, transparent)",
          backdropFilter: "blur(32px) saturate(200%)",
          borderTop: "0.5px solid var(--hairline)",
        }}
      >
        <div className="mx-auto grid max-w-md grid-cols-4 px-2 py-1.5">
          {navMobile.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                preload="intent"
                className="notranslate relative flex flex-col items-center justify-center gap-1 py-2.5"
              >
                <span
                  className="flex h-9 w-14 items-center justify-center rounded-full transition-all"
                  style={{ background: active ? "var(--accent)" : "transparent" }}
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.2 : 1.6}
                    color={active ? "var(--primary)" : "var(--ink-2)"}
                  />
                </span>
                <span
                  className="text-[10.5px] font-medium"
                  style={{ color: active ? "var(--primary)" : "var(--ink-2)" }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ═════════ FLOATING CART CTA ═════════ */}
      {showCartBar && (
        <div className="fixed inset-x-0 bottom-24 z-50 px-5 lg:bottom-8 lg:left-[200px] lg:px-12">
          <Link
            to="/cart"
            className="press mx-auto flex max-w-md items-center justify-between gap-4 rounded-2xl px-5 py-4 shadow-lg transition active:scale-[0.98] lg:max-w-lg"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              boxShadow: "0 12px 32px -8px var(--primary-glow, rgba(45,171,107,0.5))",
            }}
          >
            <span className="flex items-center gap-3">
              <span
                className="relative grid h-10 w-10 place-items-center rounded-full"
                style={{ background: "rgba(255,255,255,0.18)" }}
              >
                <ShoppingBag size={19} strokeWidth={2} />
                <span
                  className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold leading-none"
                  style={{ background: "#fff", color: "var(--primary)" }}
                >
                  {count}
                </span>
              </span>
              <span className="text-[15px] font-bold">Ver carrinho</span>
            </span>
            <span className="text-[16px] font-bold tabular-nums">{brl(subtotal)}</span>
          </Link>
        </div>
      )}

      <CookieBanner />
    </div>
  );
}

export { MapPin as _MapPin };
