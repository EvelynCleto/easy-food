import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Redefinir senha — EasyFood" }] }),
  component: ResetPage,
});

function ResetPage() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Senha redefinida!");
      navigate({ to: "/" });
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="mt-6 font-display text-2xl font-bold">Nova senha</h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            required minLength={6} type="password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Nova senha"
            className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {busy && <Loader2 size={16} className="animate-spin" />} Salvar
          </button>
        </form>
      </div>
    </div>
  );
}