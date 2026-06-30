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
        <h1 className="text-headline mt-6">Nova senha</h1>
        <p className="mt-2 text-body-sm" style={{ color: "var(--ink-2)" }}>Escolha uma senha de pelo menos 6 caracteres.</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="sr-only" htmlFor="new-password">Nova senha</label>
          <input
            id="new-password" required minLength={6} type="password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Nova senha"
            className="input-aurora"
          />
          <button disabled={busy} className="btn-primary w-full">
            {busy && <Loader2 size={16} className="animate-spin" />} Salvar
          </button>
        </form>
      </div>
    </div>
  );
}