import { supabase } from "@/integrations/supabase/client";

/**
 * Grants an achievement to the current user by its `code` (idempotent).
 * Safe to call optimistically after a triggering event — duplicates are
 * ignored and any failure is swallowed so it never blocks the main flow.
 */
export async function grantAchievement(code: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: ach } = await supabase
      .from("achievements")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!ach) return false;

    const { error } = await supabase
      .from("user_achievements")
      .upsert(
        { user_id: user.id, achievement_id: ach.id },
        { onConflict: "user_id,achievement_id", ignoreDuplicates: true },
      );
    return !error;
  } catch {
    return false;
  }
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/**
 * Derives the current consecutive-day streak from real activity (water logs +
 * meal analyses) — no dedicated column needed. Persists it to
 * `profiles.streak_days`, grants the streak achievements, and returns the
 * streak (or null if not signed in). Safe to call on every app open.
 */
export async function syncStreak(): Promise<number | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const since = new Date();
    since.setDate(since.getDate() - 60);
    since.setHours(0, 0, 0, 0);

    const [{ data: analyses }, { data: waters }] = await Promise.all([
      supabase.from("nutritional_analysis").select("created_at").eq("user_id", user.id).gte("created_at", since.toISOString()),
      supabase.from("water_logs").select("logged_at").eq("user_id", user.id).gte("logged_at", since.toISOString()),
    ]);

    const days = new Set<string>();
    (analyses ?? []).forEach((r) => days.add(dayKey(new Date(r.created_at as string))));
    (waters ?? []).forEach((r) => days.add(dayKey(new Date((r as { logged_at: string }).logged_at))));
    // The user is active right now — count today.
    days.add(dayKey(new Date()));

    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    while (days.has(dayKey(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    await supabase.from("profiles").update({ streak_days: streak }).eq("id", user.id);

    if (streak >= 3) await grantAchievement("streak_3");
    if (streak >= 7) await grantAchievement("streak_7");
    if (streak >= 30) await grantAchievement("streak_30");

    return streak;
  } catch {
    return null;
  }
}

/** Grants order milestones (first order + 10 orders). Call after a purchase. */
export async function checkOrderAchievements(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    let granted = await grantAchievement("first_order");
    if ((count ?? 0) >= 10) granted = (await grantAchievement("orders_10")) || granted;
    return granted;
  } catch {
    return false;
  }
}

/** Grants "Semana Saudável" when the user logged 7 distinct days with avg score 8+. */
export async function checkHealthyWeek(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("nutritional_analysis")
      .select("score,created_at")
      .eq("user_id", user.id)
      .not("score", "is", null)
      .gte("created_at", since.toISOString());

    const rows = data ?? [];
    if (rows.length === 0) return false;

    const days = new Set(rows.map((r) => dayKey(new Date(r.created_at as string))));
    const avg = rows.reduce((s, r) => s + Number(r.score ?? 0), 0) / rows.length;

    if (days.size >= 7 && avg >= 8) return grantAchievement("healthy_week");
    return false;
  } catch {
    return false;
  }
}
