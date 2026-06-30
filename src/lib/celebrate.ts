// Lightweight, dependency-free celebration: a confetti burst + haptic tap.
// Used for the dopamine moments — mission claimed, achievement unlocked, level up.

const COLORS = ["#2DAB6B", "#1E8654", "#6B5BFE", "#FF9F43", "#FFD166", "#FFFFFF"];

export function haptic(pattern: number | number[] = 12): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch { /* ignore */ }
}

type ConfettiOpts = { count?: number; power?: number };

/** Fires a one-shot confetti burst from the top-center of the viewport. */
export function confetti({ count = 90, power = 1 }: ConfettiOpts = {}): void {
  if (typeof document === "undefined") return;

  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "2147483647",
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) { canvas.remove(); return; }
  ctx.scale(dpr, dpr);

  const cx = W / 2;
  const cy = H * 0.28;
  const parts = Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (i % 7) * 0.13;
    const speed = (5 + (i % 9)) * power;
    return {
      x: cx, y: cy,
      vx: Math.cos(angle) * speed * (0.6 + (i % 5) / 5),
      vy: Math.sin(angle) * speed - 6,
      size: 5 + (i % 4) * 2,
      rot: i, vr: (i % 2 ? 1 : -1) * (0.1 + (i % 5) / 20),
      color: COLORS[i % COLORS.length],
      life: 1,
    };
  });

  let raf = 0;
  let frame = 0;
  const tick = () => {
    frame++;
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    for (const p of parts) {
      p.vy += 0.22;            // gravity
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 0.012;
      if (p.life > 0 && p.y < H + 20) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    }
    if (alive && frame < 200) {
      raf = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(raf);
      canvas.remove();
    }
  };
  raf = requestAnimationFrame(tick);
}

/** Celebrate a reward (mission/goal). */
export function celebrate(): void {
  haptic([10, 30, 10]);
  confetti();
}

/** Bigger celebration for a level-up. */
export function celebrateLevelUp(): void {
  haptic([15, 40, 15, 40, 25]);
  confetti({ count: 130, power: 1.25 });
}
