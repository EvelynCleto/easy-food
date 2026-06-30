import React from "react";

// Minimal, dependency-free markdown for AI text: **bold**, *italic*, `---`
// horizontal rules, "- " / "• " bullets, and line breaks. Never leaks raw syntax.

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Split on **bold** and *italic*, keeping delimiters
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(regex);
  parts.forEach((part, i) => {
    if (!part) return;
    if (part.startsWith("**") && part.endsWith("**")) {
      nodes.push(<strong key={`${keyBase}-${i}`} style={{ fontWeight: 700, color: "var(--ink-1)" }}>{part.slice(2, -2)}</strong>);
    } else if (part.startsWith("*") && part.endsWith("*")) {
      nodes.push(<em key={`${keyBase}-${i}`}>{part.slice(1, -1)}</em>);
    } else {
      nodes.push(part);
    }
  });
  return nodes;
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const out: React.ReactNode[] = [];
  let bullets: React.ReactNode[] = [];

  const flushBullets = (key: string) => {
    if (bullets.length === 0) return;
    out.push(
      <ul key={key} className="my-1.5 space-y-1 pl-1">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span style={{ color: "var(--primary)" }}>·</span>
            <span className="flex-1">{b}</span>
          </li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    const trimmed = line.trim();
    if (/^(-{3,}|_{3,}|\*{3,})$/.test(trimmed)) {
      flushBullets(`b-${i}`);
      out.push(<hr key={`hr-${i}`} className="my-3" style={{ border: "none", borderTop: "0.5px solid var(--hairline)" }} />);
      return;
    }
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (bulletMatch) {
      bullets.push(<>{renderInline(bulletMatch[1], `bl-${i}`)}</>);
      return;
    }
    flushBullets(`b-${i}`);
    if (trimmed === "") {
      out.push(<div key={`sp-${i}`} className="h-2" />);
      return;
    }
    out.push(<p key={`p-${i}`} className="leading-relaxed">{renderInline(line, `p-${i}`)}</p>);
  });
  flushBullets("b-final");

  return <div className={className}>{out}</div>;
}
