import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Compass, Home, Sparkles, User as UserIcon, ShoppingBag, MapPin } from "lucide-react";
import { type ReactNode } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./premium/ThemeToggle";
import { CookieBanner } from "./CookieBanner";
import { useCart } from "@/contexts/CartContext";
import { cn, brl } from "@/lib/format";

const navItems = [
  { to: "/",          label: "Início"   },
  { to: "/catalog",   label: "Catálogo" },
  { to: "/nutrition/", label: "Nutri"    },
  { to: "/machines/",  label: "Máquinas" },
  { to: "/profile",   label: "Perfil"   },
] as const;

const navMobile = [
  { to: "/",          icon: Home,     label: "Início"   },
  { to: "/catalog",   icon: Compass,  label: "Catálogo" },
  { to: "/nutrition/", icon: Sparkles, label: "Nutri"    },
  { to: "/profile",   icon: UserIcon, label: "Perfil"   },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { count, subtotal } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showCartBar = count > 0 && !pathname.startsWith("/cart") && !pathname.startsWith("/checkout");

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "short", day: "numeric", month: "short",
  }).replace(",", " ·").toLowerCase().replace(/\./g, "");

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* ═════════ DESKTOP — GLASS SIDEBAR ═════════ */}
      <aside
        className="nav-desktop fixed left-0 top-0 hidden h-screen w-[240px] flex-col px-6 py-7"
        style={{ background: "color-mix(in srgb, var(--background) 70%, transparent)", backdropFilter: "blur(20px) saturate(180%)" }}
      >
        <Link to="/" className="px-2">
          <Logo />
        </Link>

        <nav className="mt-12 flex flex-col gap-0.5" translate="no">
          {navItems.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                preload="intent"
                className="notranslate group relative flex items-center rounded-[10px] px-3 py-2 transition"
                style={{
                  color: active ? "var(--ink-1)" : "var(--ink-2)",
                  background: "transparent",
                }}
              >
                <span
                  className="absolute left-0 h-1 w-1 -translate-x-3 rounded-full transition-opacity"
                  style={{
                    background: "var(--primary)",
                    opacity: active ? 1 : 0,
                  }}
                />
                <span
                  className={cn(
                    "text-[14.5px] transition-colors",
                    active ? "font-semibold" : "font-medium group-hover:text-foreground",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <div className="hairline mb-4" />
          <p className="text-eyebrow mb-3 px-2">{today}</p>
          <div className="flex items-center gap-1 px-1">
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
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* ═════════ MOBILE HEADER ═════════ */}
      <header className="nav-mobile sticky top-0 z-40 hidden" style={{ background: "color-mix(in srgb, var(--background) 80%, transparent)", backdropFilter: "blur(20px) saturate(180%)" }}>
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
      <main className="main-with-sidebar mx-auto w-full max-w-[1200px] px-5 pb-28 pt-6 sm:px-8 lg:px-16 lg:pb-16 lg:pt-12">
        {children}
      </main>

      {/* ═════════ MOBILE — CAPSULE NAV ═════════ */}
      <nav
        translate="no"
        className="nav-mobile fixed bottom-0 left-0 right-0 z-50 hidden safe-bottom"
        style={{ background: "color-mix(in srgb, var(--card) 80%, transparent)", backdropFilter: "blur(32px) saturate(200%)", borderTop: "0.5px solid var(--hairline)" }}
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
                  style={{
                    background: active ? "var(--accent)" : "transparent",
                  }}
                >
                  <Icon size={20} strokeWidth={active ? 2.2 : 1.6} color={active ? "var(--primary)" : "var(--ink-2)"} />
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
        <div className="fixed inset-x-0 bottom-24 z-50 px-5 lg:bottom-8 lg:left-[240px] lg:px-16">
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
              <span className="relative grid h-10 w-10 place-items-center rounded-full" style={{ background: "rgba(255,255,255,0.18)" }}>
                <ShoppingBag size={19} strokeWidth={2} />
                <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold leading-none" style={{ background: "#fff", color: "var(--primary)" }}>
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

export { MapPin as _MapPin };  // keep import alive
