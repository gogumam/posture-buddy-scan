import { useEffect, useState } from "react";
import { subscribe } from "@/lib/posture-store";

/** Re-reads a localStorage-backed value on mount and whenever the store changes. */
export function usePostureData<T>(read: () => T, fallback: T): T {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    setValue(read());
    const unsubscribe = subscribe(() => setValue(read()));
    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}

/** True after hydration — guards browser-only reads from SSR mismatches. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
