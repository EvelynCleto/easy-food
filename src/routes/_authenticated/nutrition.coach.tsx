import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Send, Sparkles, Trash2 } from "lucide-react";
import { coachChat, getCoachHistory, clearCoachHistory } from "@/lib/coach.functions";
import { markCoachUsedToday } from "@/lib/engagement";
import { Markdown } from "@/components/Markdown";

export const Route = createFileRoute("/_authenticated/nutrition/coach")({
  component: CoachPage,
});

type ChatMsg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "easyfood_coach_chat_v1";
const SUGGESTIONS = [
  "Como foi minha semana?",
  "O que comer antes do treino?",
  "Tô batendo minha meta de proteína?",
  "Me dá uma ideia de jantar leve",
];

function loadHistory(): ChatMsg[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function CoachPage() {
  const chat = useServerFn(coachChat);
  const loadServerHistory = useServerFn(getCoachHistory);
  const clearServer = useServerFn(clearCoachHistory);
  const [messages, setMessages] = useState<ChatMsg[]>(loadHistory);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Prefer the server-persisted history (cross-device); fall back to localStorage.
  useEffect(() => {
    loadServerHistory()
      .then((rows) => { if (rows.length > 0) setMessages(rows); })
      .catch(() => { /* keep localStorage */ });
  }, [loadServerHistory]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20))); } catch { /* ignore */ }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    markCoachUsedToday();
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setPending(true);
    try {
      const { reply } = await chat({ data: { messages: next.slice(-12) } });
      setPending(false);
      // Reveal the answer progressively (streaming feel) word by word
      const words = reply.split(" ");
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      for (let i = 0; i < words.length; i++) {
        const partial = words.slice(0, i + 1).join(" ");
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: partial };
          return copy;
        });
        await new Promise((r) => setTimeout(r, 22));
      }
    } catch {
      setPending(false);
      setMessages((m) => [...m, { role: "assistant", content: "Tive um problema pra responder agora. Tenta de novo 🙏" }]);
    }
  }

  async function clearAll() {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    clearServer().catch(() => { /* ignore */ });
  }

  return (
    <div className="animate-rise mx-auto flex h-[calc(100vh-9rem)] max-w-[720px] flex-col lg:h-[calc(100vh-7rem)]">
      <header className="mb-5 flex items-center gap-4">
        <Link to="/nutrition" className="grid h-10 w-10 shrink-0 place-items-center rounded-full" style={{ background: "var(--surface)" }}>
          <ChevronLeft size={18} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: "linear-gradient(135deg, var(--ai), #6d4bd8)" }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-headline leading-tight">Coach IA</h1>
            <p className="text-caption">conhece seu histórico de verdade</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearAll}
            className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-full transition hover:opacity-80"
            style={{ background: "var(--surface)", color: "var(--ink-3)" }}
            aria-label="Limpar conversa"
          >
            <Trash2 size={16} />
          </button>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="card-aurora p-6">
            <p className="text-body" style={{ color: "var(--ink-1)" }}>
              Oi! Eu sou seu coach. Eu vejo o que você registrou hoje e na semana, então pode perguntar de verdade — sobre suas metas, o que comer, como tá indo.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="press rounded-full px-4 py-2 text-[13px] font-medium transition"
                  style={{ background: "var(--surface)", color: "var(--ink-1)" }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3 text-[14.5px]"
              style={
                m.role === "user"
                  ? { background: "var(--ink-1)", color: "var(--card)" }
                  : { background: "var(--surface)", color: "var(--ink-1)" }
              }
            >
              {m.role === "assistant"
                ? <Markdown text={m.content} className="space-y-1" />
                : <span className="whitespace-pre-wrap">{m.content}</span>}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl px-4 py-3.5" style={{ background: "var(--surface)" }}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 animate-bounce rounded-full" style={{ background: "var(--ink-3)", animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Persistent quick-action chips */}
      {messages.length > 0 && !pending && (
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2 pt-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="press shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-medium transition"
              style={{ background: "var(--surface)", color: "var(--ink-1)", border: "0.5px solid var(--hairline)" }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 pt-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          rows={1}
          placeholder="Pergunte ao seu coach..."
          className="max-h-32 flex-1 resize-none rounded-2xl px-4 py-3 text-[14.5px] outline-none"
          style={{ background: "var(--surface)", color: "var(--ink-1)", border: "0.5px solid var(--hairline)" }}
        />
        <button
          onClick={() => send(input)}
          disabled={pending || !input.trim()}
          className="press grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition disabled:opacity-40"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          aria-label="Enviar"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
