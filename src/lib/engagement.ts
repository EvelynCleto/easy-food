// Lightweight, client-side engagement flags (no DB) used to drive daily missions.

const COACH_USED_KEY = "easyfood_coach_used_v1";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Records that the user talked to the coach today. */
export function markCoachUsedToday(): void {
  try { localStorage.setItem(COACH_USED_KEY, todayKey()); } catch { /* ignore */ }
}

/** Whether the user has talked to the coach today. */
export function usedCoachToday(): boolean {
  try { return localStorage.getItem(COACH_USED_KEY) === todayKey(); } catch { return false; }
}
