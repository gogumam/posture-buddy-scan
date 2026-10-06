import {
  METRIC_META,
  METRIC_ORDER,
  type ExerciseCompletion,
  type ImuSample,
  type MeasurementSource,
  type MetricValue,
  type PostureMeasurement,
} from "./posture-types";

/**
 * Local-only persistence. By design we never store photos or camera frames —
 * only the derived numeric metrics. This keeps the prototype privacy-friendly
 * and makes the same records reusable when real sensor input is added.
 */

const MEASURE_KEY = "posture.measurements.v1";
const EXERCISE_KEY = "posture.exercises.v1";

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — prototype keeps working in memory */
  }
}

export function todayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/* ---------------------------------------------------------------- measurements */

export function getMeasurements(): PostureMeasurement[] {
  const list = read<PostureMeasurement[]>(MEASURE_KEY, []);
  if (list.length === 0) {
    const seeded = seedMeasurements();
    write(MEASURE_KEY, seeded);
    return seeded;
  }
  return [...list].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function getMeasurement(id: string): PostureMeasurement | null {
  return getMeasurements().find((m) => m.id === id) ?? null;
}

export function latestMeasurement(): PostureMeasurement | null {
  return getMeasurements()[0] ?? null;
}

export function saveMeasurement(m: PostureMeasurement) {
  const list = read<PostureMeasurement[]>(MEASURE_KEY, []);
  write(MEASURE_KEY, [m, ...list]);
  notify();
}

export function clearAll() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(MEASURE_KEY);
  window.localStorage.removeItem(EXERCISE_KEY);
  notify();
}

/* ------------------------------------------------------------------- exercises */

export function getCompletions(): ExerciseCompletion[] {
  return read<ExerciseCompletion[]>(EXERCISE_KEY, []);
}

export function isCompleted(exerciseId: string, date = todayKey()): boolean {
  return getCompletions().some((c) => c.exerciseId === exerciseId && c.date === date);
}

export function toggleCompletion(exerciseId: string, date = todayKey()) {
  const list = getCompletions();
  const exists = list.some((c) => c.exerciseId === exerciseId && c.date === date);
  write(
    EXERCISE_KEY,
    exists
      ? list.filter((c) => !(c.exerciseId === exerciseId && c.date === date))
      : [...list, { exerciseId, date }],
  );
  notify();
}

/** Completion rate over the last `days` days, assuming `perDay` recommended items. */
export function completionRate(days = 7, perDay = 4): number {
  const completions = getCompletions();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startKey = todayKey(start);
  const done = completions.filter((c) => c.date >= startKey).length;
  return Math.min(100, Math.round((done / (days * perDay)) * 100));
}

export function dailyCompletionCounts(days = 7): Array<{ date: string; count: number }> {
  const completions = getCompletions();
  const out: Array<{ date: string; count: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = todayKey(d);
    out.push({ date: key, count: completions.filter((c) => c.date === key).length });
  }
  return out;
}

/* ------------------------------------------------------------ change subscription */

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* -------------------------------------------------------------- demo analysis */

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function sign() {
  return Math.random() > 0.5 ? 1 : -1;
}

/**
 * Demo screening engine.
 *
 * NOTE: this is NOT a pose-estimation model. It produces plausible,
 * self-consistent example values so the end-to-end flow can be experienced.
 * Replacing this function with a real CV/IMU pipeline is the only change
 * needed for the rest of the app to work with real data.
 */
export function runDemoAnalysis(opts: {
  source: MeasurementSource;
  views: Array<"front" | "side">;
  /** Deterministic bias so repeat measurements trend instead of jumping. */
  baseline?: PostureMeasurement | null;
}): PostureMeasurement {
  const { source, views, baseline } = opts;

  const metrics: MetricValue[] = METRIC_ORDER.map((key) => {
    const meta = METRIC_META[key];
    const prev = baseline?.metrics.find((v) => v.key === key)?.value;
    const base =
      prev !== undefined
        ? prev * rand(0.65, 1.05)
        : sign() * rand(meta.lowThreshold * 0.4, meta.observeThreshold * 1.25);
    const jitter = sign() * rand(0, meta.lowThreshold * 0.35);
    const value = Math.max(-meta.scaleMax, Math.min(meta.scaleMax, base + jitter));
    return { key, value: Math.round(value * 10) / 10, unit: meta.unit };
  });

  const confidence =
    Math.round(
      (views.length === 2 ? rand(0.78, 0.95) : rand(0.52, 0.82)) * (source === "camera_demo" ? 1 : 0.97) * 100,
    ) / 100;

  return {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    source,
    confidence,
    views,
    metrics,
  };
}

/** Placeholder stream generator for the sensor-readiness screen. */
export function mockImuSamples(count = 12, sensorId = "IMU-PELVIS-01"): ImuSample[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(now - (count - i) * 100).toISOString(),
    sensor_id: sensorId,
    accel_x: Math.round(rand(-0.4, 0.4) * 1000) / 1000,
    accel_y: Math.round(rand(9.5, 10.1) * 1000) / 1000,
    accel_z: Math.round(rand(-0.5, 0.5) * 1000) / 1000,
    gyro_x: Math.round(rand(-2, 2) * 100) / 100,
    gyro_y: Math.round(rand(-2, 2) * 100) / 100,
    gyro_z: Math.round(rand(-2, 2) * 100) / 100,
    roll: Math.round(rand(-3, 3) * 100) / 100,
    pitch: Math.round(rand(-6, 2) * 100) / 100,
    yaw: Math.round(rand(-4, 4) * 100) / 100,
  }));
}

/* ------------------------------------------------------------------- seed data */

function seedMeasurements(): PostureMeasurement[] {
  const out: PostureMeasurement[] = [];
  const dayOffsets = [21, 14, 9, 5, 2];
  let prev: PostureMeasurement | null = null;
  for (const offset of dayOffsets) {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    d.setHours(9, 12, 0, 0);
    const m = runDemoAnalysis({ source: "camera_demo", views: ["front", "side"], baseline: prev });
    m.id = `seed_${offset}`;
    m.timestamp = d.toISOString();
    m.confidence = 0.86;
    out.push(m);
    prev = m;
  }
  return out.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
