import { cn } from "@/lib/format";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-xl", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="card-premium overflow-hidden p-3">
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
      <Skeleton className="mt-3 h-5 w-1/3" />
    </div>
  );
}

export function MachineCardSkeleton() {
  return (
    <div className="card-premium w-60 shrink-0 p-4">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-4 h-8 w-full rounded-full" />
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="card-premium p-4">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="mt-3 h-6 w-24" />
    </div>
  );
}