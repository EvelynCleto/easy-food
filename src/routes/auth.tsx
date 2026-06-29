import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
      { name: "description", content: "Entre ou crie sua conta EasyFood." },
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

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) toast.error(error);
        else toast.success("Bem-vindo de volta!");
      } else if (mode === "signup") {
        const { error } = await signUp(email, password, name);
        if (error) toast.error(error);
        else toast.success("Conta criada! Verifique seu e-mail se necessário.");
      } else {
        const { error } = await resetPassword(email);
        if (error) toast.error(error);
        else {
          toast.success("E-mail de recuperação enviado.");
          setMode("login");
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Falha no login com Google");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-gradient-to-br from-primary to-[oklch(0.45_0.15_140)] p-12 text-primary-foreground md:flex md:flex-col md:justify-between">
        <Logo />
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">
            Refeições saudáveis,<br /> retirada em segundos.
          </h2>
          <p className="mt-3 max-w-md text-primary-foreground/90">
            EasyFood conecta você às máquinas inteligentes de comida saudável mais próximas, com
            análise nutricional por IA.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/70">© EasyFood</p>
      </div>

      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 md:hidden">
            <Logo />
          </div>
          <h1 className="font-display text-2xl font-bold">
            {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Acesse sua conta EasyFood."
              : mode === "signup"
                ? "Comece a pedir refeições saudáveis."
                : "Enviaremos um link para seu e-mail."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3" aria-label={mode === "signup" ? "Criar conta" : mode === "login" ? "Entrar" : "Recuperar senha"}>
            {mode === "signup" && (
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            )}
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {mode !== "reset" && (
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                minLength={6}
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            )}
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
            </button>
          </form>

          {mode !== "reset" && (
            <>
              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
              </div>
              <button
                onClick={handleGoogle}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-card py-3 text-sm font-medium transition hover:bg-accent disabled:opacity-60"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                  <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84Z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
                </svg>
                Continuar com Google
              </button>
            </>
          )}

          <div className="mt-6 flex justify-between text-xs">
            {mode === "login" ? (
              <>
                <button onClick={() => setMode("reset")} className="text-muted-foreground hover:text-foreground">
                  Esqueci a senha
                </button>
                <button onClick={() => setMode("signup")} className="font-medium text-primary">
                  Criar conta
                </button>
              </>
            ) : (
              <button onClick={() => setMode("login")} className="text-muted-foreground hover:text-foreground">
                ← Voltar ao login
              </button>
            )}
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link to="/">Continuar como visitante</Link>
          </p>
        </div>
      </div>
    </div>
  );
}