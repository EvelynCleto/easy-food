import { Droplet, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function WaterTracker({ goalMl = 2500 }: { goalMl?: number }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: total = 0 } = useQuery({
    queryKey: ["water-today", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("water_logs")
        .select("amount_ml")
        .eq("user_id", user!.id)
        .gte("logged_at", today.toISOString());
      return (data ?? []).reduce((s, r) => s + (r.amount_ml ?? 0), 0);
    },
  });

  const add = useMutation({
    mutationFn: async (ml: number) => {
      if (!user) return;
      const { error } = await supabase.from("water_logs").insert({
        user_id: user.id,
        amount_ml: ml,
        logged_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["water-today"] });
      qc.invalidateQueries({ queryKey: ["daily-nutrition"] });
      toast.success("Hidratação registrada 💧");
    },
  });

  const pct = Math.min(100, (total / goalMl) * 100);
  const cups = Math.round(goalMl / 250);
  const drunk = Math.round(total / 250);

  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/10 text-sky-500">
            <Droplet size={16} />
          </div>
          <div>
            <div className="text-sm font-semibold">Água</div>
            <div className="text-xs text-muted-foreground">{total} / {goalMl} ml</div>
          </div>
        </div>
        <div className="flex gap-1">
          {[200, 300, 500].map((ml) => (
            <button key={ml} onClick={() => add.mutate(ml)} className="flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-600 hover:bg-sky-500/20">
              <Plus size={10} />{ml}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex gap-0.5">
        {Array.from({ length: cups }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i < drunk ? "bg-sky-500" : "bg-muted"}`} />
        ))}
      </div>
    </div>
  );
}