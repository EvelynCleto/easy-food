import { useCallback, useEffect, useState } from "react";

const KEY = "easyfood_recent_v1";
const MAX = 12;

export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" && localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {}
  }, []);

  const push = useCallback((id: string) => {
    setIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setIds([]);
    try {
      localStorage.removeItem(KEY);
    } catch {}
  }, []);

  return { ids, push, clear };
}