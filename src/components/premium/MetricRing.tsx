import { motion } from "framer-motion";

type Props = {
  value: number;
  max: number;
  label: string;
  unit?: string;
  color?: string;
  size?: number;
  stroke?: number;
};

export function MetricRing({
  value,
  max,
  label,
  unit = "",
  color = "var(--color-primary)",
  size = 108,
  stroke = 9,
}: Props) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0, value / max));
  const offset = circ * (1 - pct);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            stroke="color-mix(in oklab, var(--color-border) 70%, transparent)"
            fill="none"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            stroke={color}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
          <span className="font-display text-[22px] font-semibold leading-none tracking-tight">
            {Math.round(value)}
          </span>
          <span className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            / {max}{unit}
          </span>
        </div>
      </div>
      <span className="mt-2 text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}