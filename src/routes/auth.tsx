import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, HelpCircle, Loader2, Lock, Mail, Users } from "lucide-react";
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
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  function emailLooksValid(v: string) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInlineError(null);

    if (!emailLooksValid(email)) { setInlineError("Digite um e-mail válido."); return; }
    if (mode !== "reset" && password.length < 6) { setInlineError("A senha precisa de pelo menos 6 caracteres."); return; }
    if (mode === "signup" && !name.trim()) { setInlineError("Como podemos te chamar?"); return; }

    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          setInlineError(
            error.includes("Invalid login credentials") ? "E-mail ou senha incorretos." :
            error.includes("Email not confirmed") ? "Confirme seu e-mail antes de entrar." :
            error.includes("Too many requests") ? "Muitas tentativas. Aguarde alguns minutos." :
            error,
          );
        } else {
          toast.success("Que bom te ver de novo 👋");
        }
      } else if (mode === "signup") {
        const { error } = await signUp(email, password, name);
        if (error) {
          setInlineError(
            error.includes("already registered") || error.includes("User already registered") ? "Este e-mail já está em uso." :
            error.includes("Password should be") ? "A senha deve ter pelo menos 6 caracteres." :
            error.includes("rate limit") ? "Muitas tentativas. Aguarde alguns minutos." :
            error,
          );
        } else {
          toast.success("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
          setMode("login");
        }
      } else {
        const { error } = await resetPassword(email);
        if (error) setInlineError(error);
        else { toast.success("Link de recuperação enviado para " + email); setMode("login"); }
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
    <div className="min-h-screen grid lg:grid-cols-[1fr_1fr]" style={{ background: "#FFFFFF" }}>
      {/* LEFT COLUMN — hidden on mobile */}
      <div
        className="hidden lg:flex lg:flex-col relative overflow-hidden"
        style={{ background: "var(--background, #F3F3EE)" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-10 pt-10">
          <Logo />
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition hover:bg-black/5"
            style={{ borderColor: "var(--hairline, #E5E5E0)", color: "var(--ink-2, #6B6B63)" }}
          >
            <HelpCircle size={15} />
            Precisa de ajuda?
          </button>
        </div>

        {/* Center content */}
        <div className="flex flex-1 flex-col justify-center pl-16 pr-10">
          <h1
            className="font-display font-semibold leading-tight"
            style={{ fontSize: "clamp(2.5rem, 3.5vw, 3.5rem)", color: "var(--ink-1, #1A1A14)" }}
          >
            Comer bem
            <br />
            <span style={{ color: "var(--primary, #2DAB6B)" }}>nunca foi tão fácil.</span>
          </h1>
          <p
            className="mt-5 text-[15px] leading-relaxed"
            style={{ color: "var(--ink-2, #6B6B63)" }}
          >
            Seu plano alimentar inteligente, simples
            <br />
            e feito para você.
          </p>
        </div>

        {/* Bottom area — food bowl placeholder + stats card */}
        <div className="relative mt-auto">
          {/* Food bowl photo placeholder */}
          <div
            className="mx-10 mb-0 h-56 rounded-t-3xl"
            style={{ background: "var(--sage, #8FAF8A)", opacity: 0.35 }}
          />
          {/* Stats card */}
          <div
            className="absolute bottom-8 left-10 rounded-2xl bg-white p-4 shadow-lg"
            style={{ maxWidth: 280 }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: "color-mix(in srgb, var(--primary, #2DAB6B) 12%, transparent)" }}
              >
                <Users size={18} style={{ color: "var(--primary, #2DAB6B)" }} />
              </div>
              <div>
                <p
                  className="text-[22px] font-bold leading-none"
                  style={{ color: "var(--primary, #2DAB6B)" }}
                >
                  28.432+
                </p>
                <p
                  className="mt-1 text-[12px] leading-snug"
                  style={{ color: "var(--ink-2, #6B6B63)" }}
                >
                  refeições saudáveis consumidas hoje pela nossa comunidade
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN — form */}
      <div
        className="flex items-center justify-center px-8 py-12"
        style={{ background: "#FFFFFF" }}
      >
        <div className="w-full max-w-[460px]">
          {/* Mobile logo */}
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>

          {/* Heading */}
          <h2 className="text-[22px] font-bold" style={{ color: "var(--ink-1, #1A1A14)" }}>
            {mode === "login"
              ? "Bem-vindo de volta! 👋"
              : mode === "signup"
                ? "Criar sua conta 🌿"
                : "Recuperar senha 🔑"}
          </h2>
          <p className="mt-1 text-[14px]" style={{ color: "var(--ink-2, #6B6B63)" }}>
            {mode === "login"
              ? "Entre na sua conta para continuar."
              : mode === "signup"
                ? "Crie sua conta e comece agora."
                : "Enviaremos um link para o seu e-mail."}
          </p>

          <div className="mt-6" />

          {/* Social buttons — only login */}
          {mode === "login" && (
            <>
              {/* Google */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 rounded-xl border px-4 h-12 text-[14px] font-medium transition hover:bg-gray-50 disabled:opacity-50"
                style={{ borderColor: "var(--hairline, #E5E5E0)", color: "var(--ink-1, #1A1A14)", background: "#FFFFFF" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                  <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84Z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
                </svg>
                Continuar com Google
              </button>

              {/* Apple */}
              <button
                type="button"
                disabled={busy}
                className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border px-4 h-12 text-[14px] font-medium transition hover:bg-gray-50 disabled:opacity-50"
                style={{ borderColor: "var(--hairline, #E5E5E0)", color: "var(--ink-1, #1A1A14)", background: "#FFFFFF" }}
              >
                {/* Apple icon SVG */}
                <svg width="17" height="17" viewBox="0 0 814 1000" aria-hidden fill="currentColor">
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-43.4-150.3-109.7C85.6 683.5 51.3 560.5 51.3 443.4 51.3 227.6 186.1 113.4 318.9 113.4c61.6 0 113.4 40.8 152.6 40.8 37.5 0 96.9-43.4 165.9-43.4zm-170.3-34.5c-8.3-38.2-31.7-89-71.9-124.5-35.2-32.4-80.5-54.2-125.8-54.2-1.3 0-2.6 0-3.9.1 1.3 40.2 16.6 80.5 44.9 112.5 27.7 31.4 77.4 56.9 156.7 66.1z" />
                </svg>
                Continuar com Apple
              </button>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: "var(--hairline, #E5E5E0)" }} />
                <span className="text-[12px]" style={{ color: "var(--ink-3, #9B9B93)" }}>ou</span>
                <div className="h-px flex-1" style={{ background: "var(--hairline, #E5E5E0)" }} />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--ink-1, #1A1A14)" }}>
                  Nome
                </label>
                <input
                  required
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 w-full rounded-xl border px-4 text-[14px] outline-none transition focus:ring-2"
                  style={{
                    borderColor: "var(--hairline, #E5E5E0)",
                    color: "var(--ink-1, #1A1A14)",
                    background: "#FFFFFF",
                  }}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--ink-1, #1A1A14)" }}>
                E-mail
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--ink-3, #9B9B93)" }}
                />
                <input
                  required
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-xl border pl-10 pr-4 text-[14px] outline-none transition focus:ring-2"
                  style={{
                    borderColor: "var(--hairline, #E5E5E0)",
                    color: "var(--ink-1, #1A1A14)",
                    background: "#FFFFFF",
                  }}
                />
              </div>
            </div>

            {/* Password */}
            {mode !== "reset" && (
              <div>
                <label className="mb-1.5 block text-[13px] font-medium" style={{ color: "var(--ink-1, #1A1A14)" }}>
                  Senha
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--ink-3, #9B9B93)" }}
                  />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "••••••••"}
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-xl border pl-10 pr-11 text-[14px] outline-none transition focus:ring-2"
                    style={{
                      borderColor: "var(--hairline, #E5E5E0)",
                      color: "var(--ink-1, #1A1A14)",
                      background: "#FFFFFF",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 transition hover:opacity-70"
                    style={{ color: "var(--ink-3, #9B9B93)" }}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {mode === "signup" && password.length > 0 && password.length < 6 && (
                  <p className="mt-1.5 text-[12px]" style={{ color: "var(--destructive, #E53E3E)" }}>
                    Senha muito curta — mínimo 6 caracteres
                  </p>
                )}
              </div>
            )}

            {/* Remember me + Forgot password */}
            {mode === "login" && (
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-[13px]" style={{ color: "var(--ink-2, #6B6B63)" }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded accent-green-600"
                  />
                  Lembrar de mim
                </label>
                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className="text-[13px] font-medium transition hover:opacity-70"
                  style={{ color: "var(--primary, #2DAB6B)" }}
                >
                  Esqueceu sua senha?
                </button>
              </div>
            )}

            {/* Inline error */}
            {inlineError && (
              <p
                role="alert"
                className="rounded-xl px-4 py-3 text-[13px] font-medium"
                style={{
                  background: "color-mix(in srgb, var(--destructive, #E53E3E) 12%, transparent)",
                  color: "var(--destructive, #E53E3E)",
                }}
              >
                {inlineError}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-xl text-[16px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              style={{
                background: "var(--ink-1, #1A1A14)",
                height: "3.25rem",
              }}
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              {mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar link"}
            </button>
          </form>

          {/* Back to login (reset / signup modes) */}
          {mode !== "login" && (
            <button
              type="button"
              onClick={() => setMode("login")}
              className="mt-4 w-full text-center text-[13px] transition hover:opacity-70"
              style={{ color: "var(--ink-2, #6B6B63)" }}
            >
              ← Voltar para entrar
            </button>
          )}

          {/* Create account link */}
          {mode === "login" && (
            <p className="mt-5 text-center text-[13px]" style={{ color: "var(--ink-2, #6B6B63)" }}>
              Não tem uma conta?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="font-semibold transition hover:opacity-70"
                style={{ color: "var(--primary, #2DAB6B)" }}
              >
                Criar gratuitamente
              </button>
            </p>
          )}

          {/* Footer */}
          <p className="mt-10 text-center text-[11px]" style={{ color: "var(--ink-3, #9B9B93)" }}>
            © 2024 EasyFood. Todos os direitos reservados.{" "}
            <span className="mx-1">·</span>
            <button type="button" className="hover:underline">Política de Privacidade</button>
            <span className="mx-1">·</span>
            <button type="button" className="hover:underline">Termos de Uso</button>
          </p>
        </div>
      </div>
    </div>
  );
}
