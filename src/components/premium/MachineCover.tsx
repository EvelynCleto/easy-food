// Apple-style cover for machine cards: deterministic gradient + monogram.
// No photos — eliminates "all images identical" issue and gives elegant, unique cover.

const palettes: Array<[string, string, string]> = [
  ["oklch(0.72 0.16 145)", "oklch(0.62 0.18 155)", "oklch(0.48 0.14 165)"],
  ["oklch(0.74 0.14 220)", "oklch(0.6 0.16 240)", "oklch(0.45 0.15 260)"],
  ["oklch(0.78 0.14 75)",  "oklch(0.66 0.17 55)",  "oklch(0.5 0.16 35)"],
  ["oklch(0.75 0.14 320)", "oklch(0.6 0.17 310)",  "oklch(0.45 0.16 295)"],
  ["oklch(0.78 0.1 195)",  "oklch(0.64 0.12 205)", "oklch(0.48 0.12 220)"],
  ["oklch(0.76 0.13 25)",  "oklch(0.62 0.16 15)",  "oklch(0.46 0.14 5)"],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function initials(name: string) {
  const parts = name.replace(/easyfood/i, "").trim().split(/\s+/).filter(Boolean);
  const t = (parts[0] ?? name).slice(0, 2).toUpperCase();
  return t || "EF";
}

export function MachineCover({
  name,
  id,
  online,
}: {
  name: string;
  id: string;
  online: boolean;
}) {
  const p = palettes[hash(id) % palettes.length];
  const angle = (hash(id + "a") % 60) + 120; // 120-180deg
  const mono = initials(name);

  return (
    <div
      className="relative aspect-[16/8] overflow-hidden"
      style={{
        background: `linear-gradient(${angle}deg, ${p[0]} 0%, ${p[1]} 55%, ${p[2]} 100%)`,
      }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(120% 80% at 80% 0%, rgba(255,255,255,0.35), transparent 60%)",
        }}
      />
      {/* Grain texture for depth */}
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='3'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />
      {/* Monogram */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          translate="no"
          className="notranslate font-display text-[64px] font-bold leading-none tracking-tight text-white/95 drop-shadow-[0_2px_24px_rgba(0,0,0,0.25)] sm:text-[72px]"
        >
          {mono}
        </span>
      </div>
      {/* Status chip — Apple-style frosted */}
      <span
        translate="no"
        className={`notranslate absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${
          online
            ? "bg-white/20 text-white ring-1 ring-white/30"
            : "bg-black/30 text-white/80 ring-1 ring-white/20"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-300" : "bg-white/50"}`}
          style={online ? { boxShadow: "0 0 8px rgba(110,231,183,0.9)" } : undefined}
        />
        {online ? "online" : "offline"}
      </span>
    </div>
  );
}