import { useEffect, useState } from "react";

const KEY = "easyfood:cookies-accepted";

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);
  if (!show) return null;
  return (
    <div translate="no" className="notranslate fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md rounded-2xl bg-card p-4 text-sm shadow-lg ring-1 ring-border/60 backdrop-blur">
      <p className="text-foreground/90">
        Usamos cookies para personalizar sua experiência. Ao continuar, você concorda com nossa{" "}
        <a href="/privacidade" className="font-semibold text-primary underline">Política de Privacidade</a>.
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={() => {
            localStorage.setItem(KEY, "essential");
            setShow(false);
          }}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent"
        >
          Só essenciais
        </button>
        <button
          onClick={() => {
            localStorage.setItem(KEY, "all");
            setShow(false);
          }}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}