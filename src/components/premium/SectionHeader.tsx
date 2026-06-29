import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { type ReactNode } from "react";

export function SectionHeader({
  title,
  subtitle,
  action,
  to,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  to?: string;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-lg font-bold leading-tight">{title}</h2>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action ?? (to ? (
        <Link
          to={to}
          className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-primary"
        >
          Ver tudo <ChevronRight size={14} />
        </Link>
      ) : null)}
    </div>
  );
}