import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell, Compass, Home, MapPin, Sparkles, User as UserIcon, ShoppingBag,
} from "lucide-react";
import { type ReactNode } from "react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./premium/ThemeToggle";
import { CookieBanner } from "./CookieBanner";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/format";

const nav = [
  { to: "/",          icon: Home,     label: "Início"   },
  { to: "/catalog",   icon: Compass,  label: "Catálogo" },
  { to: "/machines",  icon: MapPin,   label: "Máquinas" },
  { to: "/nutrition", icon: Sparkles, label: "Nutri"    },
  { to: "/profile",   icon: UserIcon, label: "Perfil"   },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { count } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* ───────── DESKTOP SIDEBAR ───────── */}
      <aside className="nav-desktop hidden w-[244px] shrink-0 flex-col border-r border-border/50 bg-background px-5 py-6">
        <Link to="/" className="px-2">
          <Logo />
        </Link>

        <nav className="mt-10 flex flex-col gap-0.5" translate="no">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                preload="intent"
                className={cn(
                  "notranslate group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/70 hover:bg-surface hover:text-foreground",
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center justify-between gap-1 border-t border-border/50 pt-4">
          <Link
            to="/notifications"
            aria-label="Notificações"
            className="btn-icon h-9 w-9"
          >
            <Bell size={17} strokeWidth={1.8} />
          </Link>
          <Link
            to="/cart"
            aria-label="Carrinho"
            className="btn-icon relative h-9 w-9"
          >
            <ShoppingBag size={17} strokeWidth={1.8} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          <ThemeToggle />
        </div>
      </aside>

      {/* ───────── MAIN COLUMN ───────── */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Mobile header */}
        <header className="nav-mobile sticky top-0 z-40 hidden border-b border-border/40 bg-background/85 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between px-5 safe-top">
            <Link to="/" className="shrink-0"><Logo /></Link>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Link to="/notifications" aria-label="Notificações" className="btn-icon h-9 w-9">
                <Bell size={17} strokeWidth={1.8} />
              </Link>
              <Link to="/cart" aria-label="Carrinho" className="btn-icon relative h-9 w-9">
                <ShoppingBag size={17} strokeWidth={1.8} />
                {count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
                    {count}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 pb-28 pt-8 sm:px-8 lg:pb-12 lg:pt-12">
          {children}
        </main>
      </div>

      {/* ───────── MOBILE BOTTOM NAV ───────── */}
      <nav
        translate="no"
        className="nav-mobile fixed bottom-0 left-0 right-0 z-50 hidden border-t border-border/40 bg-background/95 backdrop-blur-xl safe-bottom"
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
                "notranslate flex flex-col items-center justify-center gap-1 py-2.5 text-[10.5px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                  active ? "bg-accent" : "",
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
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
