export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px]"
        style={{
          background: "linear-gradient(135deg, #2DAB6B 0%, #1E8654 100%)",
          boxShadow: "0 1px 2px rgba(30,134,84,0.18), inset 0 1px 0 rgba(255,255,255,0.25)",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      </div>
      {!compact && (
        <span className="font-display text-[17px] font-semibold tracking-[-0.028em]" style={{ color: "var(--ink-1)" }}>
          EasyFood
        </span>
      )}
    </div>
  );
}
