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
    <div className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-5 py-3.5">
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <Link
              to="/notifications"
              className="press grid h-9 w-9 place-items-center rounded-full text-foreground/60 transition hover:bg-surface hover:text-foreground"
              aria-label="Notificações"
            >
              <Bell size={19} />
            </Link>
            <Link
              to="/cart"
              className="press relative grid h-9 w-9 place-items-center rounded-full text-foreground/60 transition hover:bg-surface hover:text-foreground"
              aria-label="Carrinho"
            >
              <ShoppingBag size={19} />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6">{children}</main>

      <nav
        translate="no"
        className="notranslate fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-background/95 backdrop-blur-xl"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 pb-safe">
          {nav.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                preload="intent"
                className={cn(
                  "flex flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-medium transition-all",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground/70",
                )}
              >
                <span className={cn(
                  "grid h-8 w-8 place-items-center rounded-xl transition-all",
                  active ? "bg-primary/10" : ""
                )}>
                  <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
                </span>
                <span translate="no" className="notranslate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <CookieBanner />
    </div>
  );
}