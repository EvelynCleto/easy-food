import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/orders")({
  component: OrdersPage,
});

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Em andamento" },
  { id: "done", label: "Concluídos" },
  { id: "cancelled", label: "Cancelados" },
] as const;

function OrdersPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [q, setQ] = useState("");

  const { data: orders = [] } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("orders")
        .select("id,status,total,created_at,pickup_code")
        .eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = orders.filter((o) => {
    if (filter === "active" && !["pending","paid","preparing","ready"].includes(o.status)) return false;
    if (filter === "done" && o.status !== "collected") return false;
    if (filter === "cancelled" && !["cancelled","refused"].includes(o.status)) return false;
    if (q && !o.id.includes(q) && !(o.pickup_code ?? "").includes(q)) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold">Meus pedidos</h1>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-card px-3 py-2 ring-1 ring-border/60">
        <Search size={16} className="text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pelo código do pedido" className="w-full bg-transparent text-sm outline-none" />
      </div>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${filter === f.id ? "bg-primary text-primary-foreground" : "bg-card text-foreground ring-1 ring-border"}`}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {filtered.length === 0 && <p className="rounded-2xl bg-card p-10 text-center text-sm text-muted-foreground ring-1 ring-border">Nenhum pedido encontrado.</p>}
        {filtered.map((o) => (
          <Link key={o.id} to="/orders/$id" params={{ id: o.id }}
            className="flex items-center justify-between rounded-2xl bg-card p-4 ring-1 ring-border/60 transition hover:shadow-sm">
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">#{o.id.slice(0,8)} · {new Date(o.created_at).toLocaleDateString("pt-BR")}</div>
              <div className="mt-0.5 font-semibold">{statusLabel(o.status)}</div>
              {o.pickup_code && <div className="mt-0.5 text-xs text-muted-foreground">Código: <span className="font-mono font-bold">{o.pickup_code}</span></div>}
            </div>
            <div className="text-right text-sm font-bold text-primary">{brl(o.total)}</div>
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