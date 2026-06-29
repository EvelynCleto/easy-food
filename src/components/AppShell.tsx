import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Compass, Home, MapPin, Sparkles, User as UserIcon, ShoppingBag } from "lucide-react";
import { type ReactNode } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./premium/ThemeToggle";
import { CookieBanner } from "./CookieBanner";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/format";

const nav = [
  { to: "/", icon: Home, label: "Início" },
  { to: "/catalog", icon: Compass, label: "Catálogo" },
  { to: "/machines", icon: MapPin, label: "Máquinas" },
  { to: "/nutrition", icon: Sparkles, label: "IA Nutri" },
  { to: "/profile", icon: UserIcon, label: "Perfil" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-1 md:flex" translate="no">
            {nav.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  preload="intent"
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-primary/8 text-primary"
                      : "text-muted-foreground hover:bg-surface hover:text-foreground",
                  )}
                >
                  <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                  <span className="notranslate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Link
              to="/notifications"
              className="grid h-9 w-9 place-items-center rounded-xl text-foreground/60 transition hover:bg-surface hover:text-foreground"
              aria-label="Notificações"
            >
              <Bell size={18} />
            </Link>
            <Link
              to="/cart"
              className="relative grid h-9 w-9 place-items-center rounded-xl text-foreground/60 transition hover:bg-surface hover:text-foreground"
              aria-label="Carrinho"
            >
              <ShoppingBag size={18} />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-8 md:pb-8">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav
        translate="no"
        className="notranslate fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/95 backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid max-w-sm grid-cols-5">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                preload="intent"
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-all",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-lg transition-all",
                    active ? "bg-primary/10" : "",
                  )}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                </span>
                <span className="notranslate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <CookieBanner />
    </div>
  );
}
