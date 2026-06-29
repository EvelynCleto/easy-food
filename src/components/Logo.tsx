import { Leaf } from "lucide-react";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="grid place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"
        style={{ width: size + 8, height: size + 8 }}
      >
        <Leaf size={size - 6} strokeWidth={2.5} />
      </div>
      <span className="font-display text-xl font-bold tracking-tight">
        Easy<span className="text-primary">Food</span>
      </span>
    </div>
  );
}