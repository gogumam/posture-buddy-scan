import { useEffect, useState, useSyncExternalStore } from "react";
import { getSessions, subscribeSessions } from "@/lib/pelvis-store";
import { EMPTY_SNAPSHOT, getHub, type HubSnapshot } from "@/lib/sensor/hub";
import { MVP_SENSORS } from "@/lib/sensor/devices";
import type { PelvisSession } from "@/lib/sensor/types";

export function useSensorHub(): HubSnapshot {
  return useSyncExternalStore(
    (cb) => getHub().subscribe(cb),
    () => getHub().snapshot,
    () => EMPTY_SNAPSHOT,
  );
}

export function connectedCount(snap: HubSnapshot): number {
  return MVP_SENSORS.filter((id) => snap.devices[id].status === "connected").length;
}

/** Sessions are loaded after hydration (localStorage). `null` = not loaded yet. */
export function useSessions(): PelvisSession[] | null {
  const [list, setList] = useState<PelvisSession[] | null>(null);
  useEffect(() => {
    setList(getSessions());
    return subscribeSessions(() => setList(getSessions()));
  }, []);
  return list;
}
