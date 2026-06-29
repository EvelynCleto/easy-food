import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { brl } from "@/lib/format";
import { cn } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/orders")({
  component: OrdersPage,
});

const FILTERS = [
  { id: "all",       label: "Todos" },
  { id: "active",    label: "Em andamento" },
  { id: "done",      label: "Concluídos" },
  { id: "cancelled", label: "Cancelados" },
] as const;

function OrdersPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [q, setQ] = useState("");

  const { data: orders = [] } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("orders").select("id,status,total,created_at,pickup_code").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const filtered = orders.filter((o) => {
    if (filter === "active" && !["pending","paid","preparing","ready"].includes(o.status)) return false;
    if (filter === "done" && o.status !== "collected") return false;
    if (filter === "cancelled" && !["cancelled","refused"].includes(o.status)) return false;
    if (q && !o.id.includes(q) && !(o.pickup_code ?? "").includes(q)) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-[760px]">
      <h1 className="text-display">Pedidos</h1>

      <div className="relative mt-10">
        <Search size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pelo código"
          className="h-12 w-full rounded-full bg-surface pr-5 text-[15px] outline-none placeholder:text-muted-foreground focus:bg-card focus:ring-2 focus:ring-primary/20"
          style={{ paddingLeft: "3.25rem" }} />
      </div>

      <div className="no-scrollbar mt-5 -mx-6 flex gap-2 overflow-x-auto px-6 pb-1 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={cn("shrink-0 rounded-full px-4 py-2 text-[14px] font-medium transition",
              filter === f.id ? "bg-foreground text-background" : "bg-surface text-foreground/80 hover:text-foreground")}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-8 divide-y divide-border/60 border-y border-border/60">
        {filtered.length === 0 && (
          <div className="py-20 text-center text-body text-muted-foreground">Nenhum pedido encontrado.</div>
        )}
        {filtered.map((o) => (
          <Link key={o.id} to="/orders/$id" params={{ id: o.id }} className="group flex items-center gap-4 py-5 transition">
            <div className="min-w-0 flex-1">
              <p className="text-caption">#{o.id.slice(0,8).toUpperCase()} · {new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
              <p className="mt-1 text-[15px] font-medium">{statusLabel(o.status)}</p>
              {o.pickup_code && <p className="mt-0.5 font-mono text-[13px] text-muted-foreground">Código {o.pickup_code}</p>}
            </div>
            <span className="font-display text-[17px] font-semibold tabular-nums">{brl(o.total)}</span>
            <ChevronRight size={18} className="shrink-0 text-muted-foreground/50 transition group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    pending: "Aguardando pagamento",
    paid: "Pagamento aprovado",
    preparing: "Preparando",
    ready: "Pronto para retirada",
    collected: "Concluído",
    cancelled: "Cancelado",
    refused: "Recusado",
  };
  return map[s] ?? s;
}
