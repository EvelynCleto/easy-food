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

  // Group by day
  const groups = notes.reduce<Record<string, typeof notes>>((acc, n) => {
    const key = new Date(n.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
    (acc[key] ||= []).push(n);
    return acc;
  }, {});

  return (
    <div className="animate-rise mx-auto max-w-[760px]">
      <header className="mb-10 flex items-baseline justify-between">
        <div>
          <p className="text-eyebrow">central</p>
          <h1 className="text-display-m mt-3">Notificações</h1>
        </div>
        <button onClick={() => markAll.mutate()} className="btn-ghost">
          Marcar como lidas
        </button>
      </header>

      {notes.length === 0 ? (
        <div className="card-flat grid h-60 place-items-center">
          <p className="text-caption">Sem notificações</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groups).map(([day, group]) => (
            <section key={day}>
              <p className="text-eyebrow mb-4">{day}</p>
              <div className="card-nested overflow-hidden">
                {group.map((n, i) => (
                  <div key={n.id} className="flex gap-4 px-5 py-4" style={{ borderTop: i > 0 ? "0.5px solid var(--hairline)" : "none" }}>
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: n.read ? "transparent" : "var(--primary)", boxShadow: n.read ? "none" : "0 0 8px var(--primary-glow)" }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-[14.5px] font-semibold" style={{ color: "var(--ink-1)" }}>{n.title}</h3>
                        <span className="shrink-0 text-[12px]" style={{ color: "var(--ink-3)" }}>
                          {new Date(n.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {n.body && <p className="mt-1 text-body-sm" style={{ color: "var(--ink-2)" }}>{n.body}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
