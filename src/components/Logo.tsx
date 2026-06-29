import { Leaf } from "lucide-react";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="grid place-items-center rounded-[10px] bg-primary text-primary-foreground"
        style={{ width: size + 6, height: size + 6, boxShadow: "0 1px 4px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)" }}
      >
        <Leaf size={size - 8} strokeWidth={2.5} />
      </div>
      <span className="font-display text-[17px] font-bold tracking-[-0.03em] text-foreground">
        Easy<span className="text-primary">Food</span>
      </span>
    </div>
  );
}