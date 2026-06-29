import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

type Props = { value: string; size?: number };

export function PixQrCode({ value, size = 220 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0a0a0a", light: "#ffffff" },
    }).catch(() => {});
  }, [value, size]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Código PIX copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative rounded-2xl bg-white p-3 shadow-lg ring-1 ring-black/5">
        <canvas ref={canvasRef} className="block rounded-lg" />
        <div className="pointer-events-none absolute inset-3 animate-[scan_2.4s_ease-in-out_infinite] rounded-lg" style={{
          background: "linear-gradient(180deg, transparent 0%, transparent 45%, color-mix(in oklab, var(--color-primary) 35%, transparent) 50%, transparent 55%, transparent 100%)",
        }} />
      </div>
      <button onClick={copy} className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90">
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copiado" : "Copiar PIX copia e cola"}
      </button>
      <style>{`@keyframes scan { 0%,100% { transform: translateY(-45%);} 50% { transform: translateY(45%);} }`}</style>
    </div>
  );
}