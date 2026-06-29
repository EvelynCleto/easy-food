import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

type Props = {
  eyebrow: string;
  title: string;
  image?: string | null;
  to: string;
  productCount?: number;
  /** "ai" applies ametista accent on eyebrow */
  variant?: "default" | "ai";
};

export function DiscoveryCard({ eyebrow, title, image, to, productCount, variant = "default" }: Props) {
  const isAI = variant === "ai";
  return (
    <Link
      to={to as any}
      className="card-nested group relative aspect-[3/4] w-[240px] shrink-0 overflow-hidden transition hover:shadow-md sm:w-auto"
    >
      <div className="absolute inset-0">
        {image ? (
          <img src={image} alt="" className="plate-photo h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]" />
        ) : (
          <div className="h-full w-full" style={{ background: "linear-gradient(160deg, var(--surface-2) 0%, var(--surface) 100%)" }} />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.55) 100%)" }} />
      </div>

      <div className="relative flex h-full flex-col justify-end p-5 text-white">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: isAI ? "#C4BFFF" : "rgba(255,255,255,0.75)" }}
        >
          {isAI ? "◇ " : ""}{eyebrow}
        </p>
        <h3 className="mt-2 font-display text-[22px] font-semibold leading-[1.15] tracking-[-0.025em]">{title}</h3>
        {productCount != null && (
          <p className="mt-2 text-[12.5px] text-white/70">{productCount} pratos</p>
        )}

        <ArrowUpRight size={18} className="absolute right-5 top-5 text-white/80 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  );
}
