export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] text-white"
        style={{
          background: "linear-gradient(135deg, oklch(0.62 0.165 145) 0%, oklch(0.48 0.155 145) 100%)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.06)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      </div>
      {!compact && (
        <span className="font-display text-[19px] font-bold tracking-[-0.025em] text-foreground">
          EasyFood
        </span>
      )}
    </div>
  );
}
