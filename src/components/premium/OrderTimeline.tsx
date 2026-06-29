import { Check, Clock, MapPin, Package, Sparkles } from "lucide-react";

type Step = { key: string; label: string; at?: string | null; icon: React.ComponentType<{ size?: number }>; };

export function OrderTimeline({ status, createdAt, paidAt, readyAt, deliveredAt }: {
  status: string;
  createdAt?: string | null;
  paidAt?: string | null;
  readyAt?: string | null;
  deliveredAt?: string | null;
}) {
  const steps: Step[] = [
    { key: "created", label: "Pedido criado", at: createdAt, icon: Sparkles },
    { key: "paid", label: "Pagamento aprovado", at: paidAt, icon: Check },
    { key: "ready", label: "Pronto na máquina", at: readyAt, icon: Package },
    { key: "delivered", label: "Retirado", at: deliveredAt, icon: MapPin },
  ];
  const order = ["pending", "paid", "ready", "collected"];
  const activeIdx = Math.max(0, order.indexOf(status));
  return (
    <ol className="relative space-y-4 pl-6">
      <span className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
      {steps.map((s, i) => {
        const done = i <= activeIdx;
        const Icon = s.icon;
        return (
          <li key={s.key} className="relative">
            <span className={`absolute -left-6 top-0.5 grid h-6 w-6 place-items-center rounded-full ring-4 ring-background ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {done ? <Check size={12} /> : <Icon size={12} />}
            </span>
            <div className="flex items-baseline justify-between gap-3">
              <div className={`text-sm ${done ? "font-semibold" : "text-muted-foreground"}`}>{s.label}</div>
              {s.at && <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Clock size={10} /> {new Date(s.at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}