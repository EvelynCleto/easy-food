import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { type ReactNode } from "react";

type IntentVariant = "ai" | "neutral";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string | ReactNode;
  primaryAction?: { label: string; to: string };
  secondaryAction?: { label: string; to: string };
  variant?: IntentVariant;
};

export function IntentCard({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  variant = "ai",
}: Props) {
  const isAI = variant === "ai";
  return (
    <div
      className="relative overflow-hidden rounded-[24px] p-6 sm:p-8"
      style={{
        background: isAI ? "var(--ai-soft)" : "var(--surface)",
        border: isAI ? "0.5px solid color-mix(in srgb, var(--ai) 30%, transparent)" : "0.5px solid var(--hairline)",
      }}
    >
      {eyebrow && (
        <div className="flex items-center gap-2">
          {isAI && (
            <div
              className="grid h-5 w-5 place-items-center rounded-md"
              style={{ background: "var(--ai)" }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" aria-hidden>
                <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" />
              </svg>
            </div>
          )}
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: isAI ? "var(--ai)" : "var(--ink-2)" }}>
            {eyebrow}
          </p>
        </div>
      )}

      <h3 className="text-headline mt-3" style={{ color: "var(--ink-1)" }}>
        {title}
      </h3>

      {description && (
        <div className="mt-2 text-body-sm" style={{ color: "var(--ink-2)" }}>
          {description}
        </div>
      )}

      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {primaryAction && (
            <Link to={primaryAction.to as any} className="btn-primary">
              {primaryAction.label} <ArrowRight size={15} />
            </Link>
          )}
          {secondaryAction && (
            <Link to={secondaryAction.to as any} className="btn-ghost">
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}

      {isAI && (
        <p className="mt-5 text-[11px] font-medium tracking-[0.06em]" style={{ color: "color-mix(in srgb, var(--ai) 75%, var(--ink-3))" }}>
          — Coach EasyFood
        </p>
      )}
    </div>
  );
}
