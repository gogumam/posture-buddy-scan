import { MVP_SENSORS } from "./sensor/devices";
import { derivePelvisFrame, summarizeSession } from "./sensor/metrics";
import { DEFAULT_BIAS, pelvisTruth, scaledBias } from "./sensor/motion-model";
import type { PelvisFrame, PelvisSession, SessionTag, TestType } from "./sensor/types";

/** Local-only storage of derived metrics. Raw IMU streams are not persisted. */

const KEY = "pants.sessions.v1";
const listeners = new Set<() => void>();

function readRaw(): PelvisSession[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PelvisSession[]) : null;
  } catch {
    return null;
  }
}

function write(list: PelvisSession[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function subscribeSessions(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getSessions(): PelvisSession[] {
  if (typeof window === "undefined") return [];
  let list = readRaw();
  if (!list) {
    list = seedSessions();
    try {
      window.localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }
  return [...list].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function saveSession(s: PelvisSession) {
  write([s, ...(readRaw() ?? [])]);
}

export function resetSessions() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

function simulate(test: TestType, factor: number, durationSec: number): PelvisFrame[] {
  const bias = scaledBias(DEFAULT_BIAS, factor);
  const frames: PelvisFrame[] = [];
  for (let t = 0; t < durationSec; t += 0.04) {
    const truth = pelvisTruth(test, t, bias);
    frames.push(
      derivePelvisFrame(t, truth.center, truth.left, truth.right, 92 + 3 * Math.sin(t * 0.3)),
    );
  }
  return frames;
}

function seedSessions(): PelvisSession[] {
  const plan: Array<{ days: number; test: TestType; factor: number; tag: SessionTag; hour: number }> = [
    { days: 20, test: "static", factor: 1.2, tag: "baseline", hour: 8 },
    { days: 14, test: "walk", factor: 1.15, tag: "baseline", hour: 19 },
    { days: 9, test: "static", factor: 1.08, tag: "baseline", hour: 8 },
    { days: 5, test: "squat", factor: 1.02, tag: "baseline", hour: 20 },
    { days: 1, test: "static", factor: 1.0, tag: "pre_exercise", hour: 19 },
    { days: 1, test: "static", factor: 0.86, tag: "post_exercise", hour: 20 },
  ];
  return plan
    .map((p, i) => {
      const d = new Date();
      d.setDate(d.getDate() - p.days);
      d.setHours(p.hour, 10, 0, 0);
      const durationSec = p.test === "squat" ? 28 : 30;
      return summarizeSession({
        id: `seed_${i}`,
        timestamp: d.toISOString(),
        frames: simulate(p.test, p.factor, durationSec),
        test: p.test,
        tag: p.tag,
        durationSec,
        sensors: MVP_SENSORS,
        sampleRateHz: 50,
        source: "demo",
      });
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
