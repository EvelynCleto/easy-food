import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — EasyFood" },
      { name: "description", content: "Acesse sua conta EasyFood." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, signUp, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!loading && user) navigate({ to: "/" }); }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) toast.error(error); else toast.success("Bem-vinda de volta");
      } else if (mode === "signup") {
        const { error } = await signUp(email, password, name);
        if (error) toast.error(error); else toast.success("Conta criada");
      } else {
        const { error } = await resetPassword(email);
        if (error) toast.error(error);
        else { toast.success("Link enviado para o seu e-mail"); setMode("login"); }
      }
    } finally { setBusy(false); }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error(result.error.message ?? "Falha no login"); setBusy(false); return; }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
        {/* LEFT — Aurora visual */}
        <div
          className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-14"
          style={{
            background:
              "radial-gradient(ellipse 100% 80% at 0% 0%, rgba(45,171,107,.20), transparent 60%)," +
              "radial-gradient(ellipse 60% 80% at 100% 100%, rgba(107,91,254,.18), transparent 60%)," +
              "#0A0B0D",
          }}
        >
          <Logo />

          <div className="relative">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/40">
              Smart Food OS
            </p>
            <h1
              className="mt-5 font-display font-semibold tracking-[-0.045em] text-white"
              style={{ fontSize: "clamp(2.5rem, 4vw, 4rem)", lineHeight: 1.02 }}
            >
              A tecnologia<br />que sabe o que<br />você precisa comer.
            </h1>
            <p className="mt-7 max-w-md text-[15px] leading-relaxed text-white/55">
              Análise nutricional por IA, planos personalizados e refeições prontas em máquinas inteligentes.
            </p>

            <div className="mt-10 grid max-w-md grid-cols-3 gap-6">
              <Stat n="50k+" l="usuárias" />
              <Stat n="4.9" l="avaliação" />
              <Stat n="120+" l="máquinas" />
            </div>
          </div>

          <p className="relative text-[11px] text-white/30">© 2026 EasyFood. Saúde simplificada.</p>
        </div>

        {/* RIGHT — Form */}
        <div className="flex items-center justify-center px-6 py-12 lg:px-16">
          <div className="w-full max-w-[400px]">
            <div className="mb-12 lg:hidden">
              <Logo />
            </div>

            <h1 className="text-display-m" style={{ color: "var(--ink-1)" }}>
              {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha"}
            </h1>
            <p className="mt-3 text-body-sm" style={{ color: "var(--ink-2)" }}>
              {mode === "login"
                ? "Acesse sua conta EasyFood."
                : mode === "signup"
                  ? "Em segundos. Sem fricção."
                  : "Enviaremos um link para o seu e-mail."}
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-3">
              {mode === "signup" && (
                <input className="input-aurora" required type="text" placeholder="Nome"
                  value={name} onChange={(e) => setName(e.target.value)} />
              )}
              <input className="input-aurora" required type="email" placeholder="E-mail"
                value={email} onChange={(e) => setEmail(e.target.value)} />
              {mode !== "reset" && (
                <input className="input-aurora" required type="password" placeholder="Senha"
                  minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              )}

              <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
                {busy && <Loader2 size={16} className="animate-spin" />}
                {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
              </button>
            </form>

            {mode !== "reset" && (
              <>
                <div className="my-6 flex items-center gap-4 text-[12.5px]" style={{ color: "var(--ink-3)" }}>
                  <div className="hairline flex-1" />
                  ou
                  <div className="hairline flex-1" />
                </div>
                <button onClick={handleGoogle} disabled={busy} className="btn-secondary w-full">
                  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                    <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84Z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
                  </svg>
                  Continuar com Google
                </button>
              </>
            )}

            <div className="mt-10 flex justify-between text-[13.5px]">
              {mode === "login" ? (
                <>
                  <button onClick={() => setMode("reset")} className="transition hover:opacity-70" style={{ color: "var(--ink-2)" }}>
                    Esqueci a senha
                  </button>
                  <button onClick={() => setMode("signup")} className="font-semibold transition hover:opacity-70" style={{ color: "var(--primary)" }}>
                    Criar conta
                  </button>
                </>
              ) : (
                <button onClick={() => setMode("login")} className="transition hover:opacity-70" style={{ color: "var(--ink-2)" }}>
                  ← Voltar para entrar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="font-display text-[22px] font-semibold tabular-nums text-white">{n}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-white/40">{l}</div>
    </div>
  );
}
