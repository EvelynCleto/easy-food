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

  useEffect(() => { if (!loading && user) navigate({ to: "/" }); }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) toast.error(error); else toast.success("Bem-vindo de volta!");
      } else if (mode === "signup") {
        const { error } = await signUp(email, password, name);
        if (error) toast.error(error); else toast.success("Conta criada!");
      } else {
        const { error } = await resetPassword(email);
        if (error) toast.error(error);
        else { toast.success("E-mail de recuperação enviado."); setMode("login"); }
      }
    } finally { setBusy(false); }
  }

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error(result.error.message ?? "Falha"); setBusy(false); return; }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT — Visual side */}
        <div
          className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-14"
          style={{
            background:
              "radial-gradient(ellipse at top right, oklch(0.65 0.18 145 / 0.35), transparent 60%), linear-gradient(160deg, oklch(0.18 0.02 240) 0%, oklch(0.12 0.015 250) 100%)",
          }}
        >
          <Logo />
          <div className="relative text-white">
            <h2 className="text-hero">
              Comece a se<br />sentir <em className="not-italic text-[oklch(0.78_0.16_145)]">incrível</em>.
            </h2>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-white/60">
              Análise nutricional por IA, planos semanais inteligentes e refeições saudáveis prontas em segundos.
            </p>
            <div className="mt-8 flex items-center gap-6 text-[13px] text-white/50">
              <Stat n="50k+" l="usuárias" />
              <Stat n="4.9" l="avaliação" />
              <Stat n="120+" l="máquinas" />
            </div>
          </div>
          <p className="relative text-[12px] text-white/35">© 2025 EasyFood. Saúde simplificada.</p>
        </div>

        {/* RIGHT — Form */}
        <div className="flex items-center justify-center px-6 py-12 lg:px-12">
          <div className="w-full max-w-[400px]">
            <div className="mb-10 lg:hidden">
              <Logo />
            </div>

            <h1 className="text-display">
              {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Recuperar senha"}
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              {mode === "login"
                ? "Acesse sua conta EasyFood."
                : mode === "signup"
                  ? "Comece sua jornada em segundos."
                  : "Enviaremos um link de recuperação."}
            </p>

            <form onSubmit={handleSubmit} className="mt-10 space-y-3">
              {mode === "signup" && (
                <Field placeholder="Nome completo" value={name} onChange={setName} type="text" required />
              )}
              <Field placeholder="E-mail" value={email} onChange={setEmail} type="email" required />
              {mode !== "reset" && (
                <Field placeholder="Senha" value={password} onChange={setPassword} type="password" required minLength={6} />
              )}

              <button type="submit" disabled={busy} className="btn-primary mt-7 w-full">
                {busy && <Loader2 size={16} className="animate-spin" />}
                {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
              </button>
            </form>

            {mode !== "reset" && (
              <>
                <div className="my-6 flex items-center gap-4 text-[13px] text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  ou
                  <div className="h-px flex-1 bg-border" />
                </div>
                <button onClick={handleGoogle} disabled={busy} className="btn-secondary w-full">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                    <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84Z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
                  </svg>
                  Continuar com Google
                </button>
              </>
            )}

            <div className="mt-10 flex justify-between text-[14px]">
              {mode === "login" ? (
                <>
                  <button onClick={() => setMode("reset")} className="text-muted-foreground hover:text-foreground transition">
                    Esqueci a senha
                  </button>
                  <button onClick={() => setMode("signup")} className="font-semibold text-primary hover:opacity-70 transition">
                    Criar conta
                  </button>
                </>
              ) : (
                <button onClick={() => setMode("login")} className="text-muted-foreground hover:text-foreground transition">
                  ← Voltar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  type, placeholder, value, onChange, required, minLength,
}: {
  type: string; placeholder: string; value: string; onChange: (v: string) => void;
  required?: boolean; minLength?: number;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      required={required}
      minLength={minLength}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-field"
      onFocus={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.background = "var(--card)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "var(--surface)"; }}
    />
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="font-display text-[20px] font-bold text-white">{n}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-white/40">{l}</div>
    </div>
  );
}
