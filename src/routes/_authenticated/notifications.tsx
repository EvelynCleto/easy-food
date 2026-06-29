import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: notes = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const markAll = useMutation({
    mutationFn: async () => { await supabase.from("notifications").update({ read: true }).eq("user_id", user!.id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Notificações</h1>
        <button onClick={() => markAll.mutate()} className="inline-flex items-center gap-1 text-xs font-medium text-primary">
          <CheckCheck size={14} /> Marcar como lidas
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {notes.length === 0 && <p className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground ring-1 ring-border">Nenhuma notificação ainda.</p>}
        {notes.map((n) => (
          <div key={n.id} className={`flex gap-3 rounded-2xl p-4 ring-1 ${n.read ? "bg-card ring-border/60" : "bg-accent/30 ring-primary/30"}`}>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Bell size={16} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{n.title}</h3>
                <span className="shrink-0 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-BR")}</span>
              </div>
              {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}