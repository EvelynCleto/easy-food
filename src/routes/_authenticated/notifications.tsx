import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const markAll = useMutation({
    mutationFn: async () => { await supabase.from("notifications").update({ read: true }).eq("user_id", user!.id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="mx-auto max-w-[760px]">
      <header className="flex items-baseline justify-between">
        <h1 className="text-display">Notificações</h1>
        <button onClick={() => markAll.mutate()} className="btn-ghost">
          Marcar todas como lidas
        </button>
      </header>

      <div className="mt-10 divide-y divide-border/60 border-y border-border/60">
        {notes.length === 0 && (
          <div className="py-20 text-center text-body text-muted-foreground">Nenhuma notificação ainda.</div>
        )}
        {notes.map((n) => (
          <div key={n.id} className="flex gap-4 py-5">
            <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-primary"}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[15px] font-semibold text-foreground">{n.title}</h3>
                <span className="shrink-0 text-[12px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
              </div>
              {n.body && <p className="mt-1 text-[14px] text-muted-foreground">{n.body}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
