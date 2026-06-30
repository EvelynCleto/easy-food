// Fictitious (local-only) subscription state. No real billing yet — the active
// plan lives in localStorage so the experience feels complete for a demo.

export type Plan = {
  id: string;
  name: string;
  mealsPerWeek: number;
  weekly: number;
  fullPrice: number;
  highlight?: boolean;
};

export const PLANS: Plan[] = [
  { id: "lite", name: "Leve", mealsPerWeek: 3, weekly: 80.10, fullPrice: 89.70 },
  { id: "fit", name: "Fit", mealsPerWeek: 5, weekly: 123.25, fullPrice: 149.50, highlight: true },
  { id: "full", name: "Completo", mealsPerWeek: 7, weekly: 160.30, fullPrice: 209.30 },
];

export type ActiveSub = { planId: string; startedAt: string };

const SUB_KEY = "easyfood_subscription_v1";

export function loadSubscription(): ActiveSub | null {
  if (typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(SUB_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
export function saveSubscription(sub: ActiveSub): void {
  try { localStorage.setItem(SUB_KEY, JSON.stringify(sub)); } catch { /* ignore */ }
}
export function clearSubscription(): void {
  try { localStorage.removeItem(SUB_KEY); } catch { /* ignore */ }
}
export function planById(id: string | undefined): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
