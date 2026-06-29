import { Leaf } from "lucide-react";

export function Logo({ size = 24 }: { size?: number }) {
  const box = size + 8;
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="grid shrink-0 place-items-center rounded-[11px] bg-primary text-primary-foreground"
        style={{
          width: box,
          height: box,
          boxShadow: "0 1px 3px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)",
        }}
      >
        <Leaf size={size - 6} strokeWidth={2.5} />
      </div>
      <span className="font-display text-[17px] font-bold tracking-[-0.025em] text-foreground">
        Easy<span className="text-primary">Food</span>
      </span>
    </div>
  );
}
