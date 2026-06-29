import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Compass, Home, MapPin, Sparkles, User as UserIcon, ShoppingBag } from "lucide-react";
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
    <div className="flex min-h-screen flex-col bg-background">
      {/* HEADER — Apple-style minimal */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-12 w-full max-w-[1120px] items-center px-6 lg:h-14">
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>

          {/* Desktop nav — forced by CSS */}
          <nav className="nav-desktop ml-10 hidden flex-1 items-center gap-1" translate="no">
            {nav.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  preload="intent"
                  className={cn(
                    "notranslate px-3 py-1.5 text-[13.5px] font-normal transition-colors",
                    active ? "text-foreground" : "text-foreground/65 hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Link
              to="/notifications"
              aria-label="Notificações"
              className="grid h-8 w-8 place-items-center rounded-lg text-foreground/65 transition hover:bg-surface hover:text-foreground"
            >
              <Bell size={17} strokeWidth={1.8} />
            </Link>
            <Link
              to="/cart"
              aria-label="Carrinho"
              className="relative grid h-8 w-8 place-items-center rounded-lg text-foreground/65 transition hover:bg-surface hover:text-foreground"
            >
              <ShoppingBag size={17} strokeWidth={1.8} />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-primary px-[3px] text-[10px] font-semibold leading-none text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto w-full max-w-[1120px] flex-1 px-6 pb-24 pt-8 sm:pt-10 lg:pb-16 lg:pt-14">
        {children}
      </main>

      {/* MOBILE BOTTOM NAV — forced via CSS */}
      <nav
        translate="no"
        className="nav-mobile fixed bottom-0 left-0 right-0 z-50 hidden border-t border-border/40 bg-background/92 backdrop-blur-xl"
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
                "notranslate flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.7} />
              <span className="notranslate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <CookieBanner />
    </div>
  );
}
