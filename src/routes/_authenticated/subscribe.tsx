import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { brl } from "@/lib/format";
import { PLANS, loadSubscription, saveSubscription, clearSubscription, type ActiveSub, type Plan } from "@/lib/subscription";

export const Route = createFileRoute("/_authenticated/subscribe")({
  component: SubscribePage,
});

function SubscribePage() {
  const [sub, setSub] = useState<ActiveSub | null>(loadSubscription);

  function subscribe(plan: Plan) {
    const next = { planId: plan.id, startedAt: new Date().toISOString() };
    saveSubscription(next);
    setSub(next);
    toast.success(`Assinatura ${plan.name} ativada! 🎉`);
  }
  function cancel() {
    clearSubscription();
    setSub(null);
    toast("Assinatura cancelada.");
  }

  const activePlan = sub ? PLANS.find((p) => p.id === sub.planId) : null;

  return (
    <div className="animate-rise mx-auto max-w-[820px]">
      <header className="mb-8">
        <p className="text-eyebrow" style={{ color: "var(--primary)" }}>◇ assinatura EasyFood</p>
        <h1 className="text-display-m mt-3">Marmita toda semana, sem pensar</h1>
        <p className="mt-3 text-body-sm" style={{ color: "var(--ink-2)" }}>
          Escolha quantas refeições por semana e retire nas máquinas. Mais barato que comprar avulso e renova sozinho.
        </p>
      </header>

      {activePlan && (
        <div className="card-aurora mb-8 flex flex-wrap items-center justify-between gap-4 p-6" style={{ background: "linear-gradient(135deg, var(--accent), var(--card))" }}>
          <div>
            <p className="text-eyebrow" style={{ color: "var(--primary)" }}>plano ativo</p>
            <p className="mt-1 text-headline">EasyFood {activePlan.name}</p>
            <p className="text-body-sm" style={{ color: "var(--ink-2)" }}>
              {activePlan.mealsPerWeek} refeições/semana · {brl(activePlan.weekly)}/semana
            </p>
          </div>
          <button onClick={cancel} className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold" style={{ background: "var(--surface)", color: "var(--destructive)" }}>
            <X size={14} /> Cancelar
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isActive = sub?.planId === plan.id;
          const savings = Math.round((1 - plan.weekly / plan.fullPrice) * 100);
          return (
            <div
              key={plan.id}
              className="relative flex flex-col rounded-[24px] p-6"
              style={{
                background: "var(--card)",
                border: plan.highlight ? "1.5px solid var(--primary)" : "0.5px solid var(--hairline)",
                boxShadow: plan.highlight ? "0 16px 40px -16px var(--primary-glow, rgba(45,171,107,0.4))" : "none",
              }}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                  Mais popular
                </span>
              )}
              <p className="text-eyebrow">{plan.name}</p>
              <p className="mt-2 font-display text-[34px] font-semibold tabular-nums leading-none" style={{ color: "var(--ink-1)" }}>
                {plan.mealsPerWeek}<span className="ml-1 text-[14px] font-normal" style={{ color: "var(--ink-3)" }}>refeições/sem</span>
              </p>
              <div className="mt-4">
                <p className="font-display text-[22px] font-semibold tabular-nums" style={{ color: "var(--ink-1)" }}>
                  {brl(plan.weekly)}<span className="text-[13px] font-normal" style={{ color: "var(--ink-3)" }}>/semana</span>
                </p>
                <p className="text-caption line-through">{brl(plan.fullPrice)}</p>
              </div>
              <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: "var(--accent)", color: "var(--primary)" }}>
                economize {savings}%
              </span>

              <ul className="mt-5 space-y-2 text-[13px]" style={{ color: "var(--ink-2)" }}>
                {[
                  `${plan.mealsPerWeek} marmitas por semana`,
                  "Retirada em qualquer máquina",
                  "Troca de cardápio quando quiser",
                  plan.highlight ? "Análise de IA ilimitada" : "Plano semanal com IA",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={15} className="mt-0.5 shrink-0" style={{ color: "var(--primary)" }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => subscribe(plan)}
                disabled={isActive}
                className="press mt-6 flex items-center justify-center gap-2 rounded-2xl py-3 text-[14px] font-semibold transition disabled:opacity-60"
                style={
                  isActive
                    ? { background: "var(--surface)", color: "var(--ink-2)" }
                    : plan.highlight
                      ? { background: "var(--primary)", color: "var(--primary-foreground)" }
                      : { background: "var(--ink-1)", color: "var(--card)" }
                }
              >
                {isActive ? <><Check size={16} /> Plano atual</> : <><Sparkles size={16} /> Assinar</>}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-caption">
        Você pode pausar ou cancelar quando quiser. Sem multa, sem fidelidade.
      </p>

      <div className="mt-4 text-center">
        <Link to="/catalog" className="text-[13px] font-semibold" style={{ color: "var(--primary)" }}>
          Prefiro comprar avulso →
        </Link>
      </div>
    </div>
  );
}
