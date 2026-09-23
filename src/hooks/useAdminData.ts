"use client";

import { useCallback, useEffect, useState } from "react";

/** Small fetch-and-refresh hook for admin tables. */
export function useAdminData<T>(url: string) {
  const [data, setData] = useState<T[] | null>(null);
  const load = useCallback(async () => {
    const res = await fetch(url);
    const d = await res.json();
    setData(d.bookings ?? d.pireps ?? []);
  }, [url]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, load };
}
