import { motion } from "framer-motion";
import { Flame } from "lucide-react";

const WEEKDAY = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** Duolingo-style streak: animated flame, big day count, and a 7-day trail. */
export function StreakFlame({ streak }: { streak: number }) {
  const active = streak > 0;

  // Last 7 days ending today; the most recent `min(streak,7)` are lit.
  const today = new Date().getDay();
  const lastDays = Array.from({ length: 7 }, (_, i) => {
    const offsetFromToday = 6 - i; // 6 days ago ... today
    const lit = offsetFromToday < Math.min(streak, 7);
    return { label: WEEKDAY[(today - offsetFromToday + 7) % 7].slice(0, 3), lit, isToday: offsetFromToday === 0 };
  });

  const message = !active
    ? "Comece sua sequência hoje"
    : streak < 3
      ? "Tá começando — bora manter!"
      : streak < 7
        ? "Sequência firme 🔥"
        : streak < 30
          ? "Você tá voando 🚀"
          : "Lendário 👑";

  return (
    <div className="flex items-center gap-4 rounded-[24px] p-5" style={{ background: "var(--card)", boxShadow: "0 1px 3px rgba(10,11,13,0.05), 0 16px 40px -20px rgba(10,11,13,0.1)" }}>
      <motion.div
        initial={{ scale: 0.85 }}
        animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={active ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
        style={{
          background: active
            ? "linear-gradient(135deg, #FF9F43 0%, #FF6B35 100%)"
            : "var(--surface)",
        }}
      >
        <Flame size={26} strokeWidth={2} color={active ? "#fff" : "var(--ink-3)"} fill={active ? "#fff" : "none"} />
      </motion.div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[26px] font-semibold leading-none tabular-nums" style={{ color: "var(--ink-1)" }}>{streak}</span>
          <span className="text-[13px] font-medium" style={{ color: "var(--ink-2)" }}>{streak === 1 ? "dia" : "dias"} seguidos</span>
        </div>
        <p className="mt-1 text-caption">{message}</p>
        <div className="mt-2.5 flex gap-1.5">
          {lastDays.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="grid h-6 w-6 place-items-center rounded-full transition-colors"
                style={{
                  background: d.lit ? "linear-gradient(135deg, #FF9F43, #FF6B35)" : "var(--surface-2)",
                  boxShadow: d.isToday ? "0 0 0 2px var(--card), 0 0 0 3.5px #FF6B35" : "none",
                }}
              >
                {d.lit && <Flame size={11} color="#fff" fill="#fff" />}
              </div>
              <span className="text-[11px]" style={{ color: d.isToday ? "var(--ink-1)" : "var(--ink-3)", fontWeight: d.isToday ? 700 : 400 }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
