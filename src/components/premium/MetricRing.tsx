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
  value, max, label, unit = "",
  color = "var(--color-primary)",
  size = 120,
  stroke = 10,
}: Props) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0, value / max));
  const offset = circ * (1 - pct);
  const remaining = Math.max(0, max - value);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            strokeWidth={stroke}
            stroke="color-mix(in oklab, var(--color-muted) 75%, transparent)"
            fill="none"
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            strokeWidth={stroke}
            stroke={color}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[26px] font-bold leading-none tracking-tight text-foreground">
            {Math.round(value)}
          </span>
          <span className="mt-1 text-[11px] font-medium text-muted-foreground">
            de {max}{unit}
          </span>
        </div>
      </div>
      <span className="mt-3.5 text-[13px] font-semibold text-foreground">{label}</span>
      {remaining > 0 && (
        <span className="mt-0.5 text-[11px] text-muted-foreground">faltam {Math.round(remaining)}{unit}</span>
      )}
    </div>
  );
}
