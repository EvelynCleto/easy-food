import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Compass, Home, MapPin, Sparkles, User as UserIcon, ShoppingBag } from "lucide-react";
import { type ReactNode } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./premium/ThemeToggle";
import { CookieBanner } from "./CookieBanner";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/format";

const nav = [
  { to: "/",          icon: Home,      label: "Início"   },
  { to: "/catalog",   icon: Compass,   label: "Catálogo" },
  { to: "/machines",  icon: MapPin,    label: "Máquinas" },
  { to: "/nutrition", icon: Sparkles,  label: "IA Nutri" },
  { to: "/profile",   icon: UserIcon,  label: "Perfil"   },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen flex-col bg-background">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/92 backdrop-blur-2xl">
        <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center gap-6 px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>

          {/* Desktop navigation — forced visible via CSS class */}
          <nav className="desktop-nav hidden flex-1 items-center gap-0.5" translate="no">
            {nav.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  preload="intent"
                  className={cn(
                    "notranslate flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13.5px] font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/60 hover:bg-surface hover:text-foreground",
                  )}
                >
                  <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Spacer for mobile */}
          <div className="flex-1 desktop-nav hidden" />

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              to="/notifications"
              aria-label="Notificações"
              className="grid h-9 w-9 place-items-center rounded-xl text-foreground/55 transition hover:bg-surface hover:text-foreground"
            >
              <Bell size={18} />
            </Link>
            <Link
              to="/cart"
              aria-label="Carrinho"
              className="relative grid h-9 w-9 place-items-center rounded-xl text-foreground/55 transition hover:bg-surface hover:text-foreground"
            >
              <ShoppingBag size={18} />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 pb-24 md:pb-10">
        {children}
      </main>

      {/* ── Mobile bottom nav — only on small screens via CSS class ── */}
      <nav
        translate="no"
        className="mobile-nav fixed bottom-0 left-0 right-0 z-50 hidden border-t border-border/40 bg-background/96 backdrop-blur-2xl"
        style={{ gridTemplateColumns: "repeat(5, 1fr)" }}
      >
        {nav.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              preload="intent"
              className={cn(
                "notranslate flex flex-col items-center justify-center gap-0.5 py-3 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span className={cn(
                "flex h-7 w-7 items-center justify-center rounded-xl transition-colors",
                active ? "bg-primary/12" : "",
              )}>
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              </span>
              <span className="notranslate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <CookieBanner />
    </div>
  );
}
