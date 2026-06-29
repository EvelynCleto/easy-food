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
    <div className="animate-rise mx-auto max-w-[860px]">
      <header className="mb-10">
        <p className="text-eyebrow">histórico</p>
        <h1 className="text-display-m mt-3">Pedidos</h1>
      </header>

      <div className="relative">
        <Search size={17} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-3)" }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por código"
          className="input-aurora" style={{ paddingLeft: "3rem", height: "48px" }} />
      </div>

      <div className="no-scrollbar mt-5 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={cn("shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition")}
            style={{
              background: filter === f.id ? "var(--ink-1)" : "var(--surface)",
              color: filter === f.id ? "var(--card)" : "var(--ink-2)",
            }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-8 card-nested overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-caption">Nenhum pedido encontrado</div>
        ) : (
          filtered.map((o, i) => (
            <Link key={o.id} to="/orders/$id" params={{ id: o.id }}
              className="group flex items-center gap-4 px-5 py-5 transition hover:opacity-80"
              style={{ borderTop: i > 0 ? "0.5px solid var(--hairline)" : "none" }}>
              <div className="min-w-0 flex-1">
                <p className="text-caption">#{o.id.slice(0,8).toUpperCase()} · {new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                <p className="mt-1 text-[14.5px] font-semibold" style={{ color: "var(--ink-1)" }}>{statusLabel(o.status)}</p>
                {o.pickup_code && <p className="mt-1 font-mono text-[12.5px]" style={{ color: "var(--ink-2)" }}>Código {o.pickup_code}</p>}
              </div>
              <span className="font-display text-[17px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>{brl(o.total)}</span>
              <ChevronRight size={17} className="shrink-0 transition group-hover:translate-x-0.5" style={{ color: "var(--ink-3)" }} />
            </Link>
          ))
        )}
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
