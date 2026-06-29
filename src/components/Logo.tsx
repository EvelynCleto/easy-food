import { Leaf } from "lucide-react";

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="grid shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"
        style={{ width: size + 8, height: size + 8 }}
      >
        <Leaf size={size - 8} strokeWidth={2.5} />
      </div>
      <span className="font-display text-[18px] font-bold tracking-[-0.02em] text-foreground">
        Easy<span className="text-primary">Food</span>
      </span>
    </div>
  );
}
