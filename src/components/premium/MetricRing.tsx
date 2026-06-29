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
  color = "var(--primary)",
  size = 124,
  stroke = 8,
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
            cx={size / 2} cy={size / 2} r={radius}
            strokeWidth={stroke}
            stroke="var(--surface-2)"
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
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[26px] font-semibold tabular-nums leading-none" style={{ color: "var(--ink-1)" }}>
            {Math.round(value)}
          </span>
          <span className="mt-1 text-[11px]" style={{ color: "var(--ink-3)" }}>
            de {max}{unit}
          </span>
        </div>
      </div>
      <span className="mt-3.5 text-[13px] font-semibold" style={{ color: "var(--ink-1)" }}>{label}</span>
    </div>
  );
}
