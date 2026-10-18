"use client";
import { useEffect, useState } from "react";
import { session } from "./api";
import type { State } from "./store";

export function useNavigationCounts(
  state: State,
  pathname: string,
  ready: boolean,
) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    const user = session()?.user;
    if (!ready || user?.role !== "ADMIN") return;
    const records = state.navigationRecordIds || {
      leads: state.leads.map((item) => item.id),
      products: state.products.map((item) => item.id),
      sellers: state.sellers.map((item) => item.id),
      buyers: state.buyers.map((item) => item.id),
    };
    const next: Record<string, number> = {};
    for (const [section, ids] of Object.entries(records)) {
      const key = `roxodeal-seen:${user.id}:${section}`;
      let seen: string[] = [];
      try {
        const saved = JSON.parse(localStorage.getItem(key) || "[]");
        if (Array.isArray(saved)) seen = saved;
      } catch {}
      const visited =
        pathname === `/admin/${section}` ||
        pathname.startsWith(`/admin/${section}/`);
      const known = new Set(seen);
      next[section] = visited ? 0 : ids.filter((id) => !known.has(id)).length;
      if (visited) {
        try {
          localStorage.setItem(
            key,
            JSON.stringify([...new Set([...seen, ...ids])]),
          );
        } catch {}
      }
    }
    setCounts(next);
  }, [state, pathname, ready]);
  return counts;
}
