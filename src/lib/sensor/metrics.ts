import type { AsymmetryLevel } from "@/lib/posture-types";
import type { SegmentAngles } from "./motion-model";
import type {
  PelvisFrame,
  PelvisMetricKey,
  PelvisSession,
  SensorId,
  SessionTag,
  SourceMode,
  TestType,
} from "./types";

/**
 * Pelvic angle derivation + asymmetry metrics. Pure functions — the same code
 * runs on demo data, seed data and (later) real hardware streams.
 */

export interface PelvisMetricMeta {
  key: PelvisMetricKey;
  label: string;
  axis: string;
  unit: "°" | "%";
  description: string;
  posLabel: string;
  negLabel: string;
  low: number;
  observe: number;
  max: number;
  /** how far from "symmetric / reference" the raw value is */
  deviation: (v: number) => number;
}

export const PELVIS_METRICS: Record<PelvisMetricKey, PelvisMetricMeta> = {
  obliquity: {
    key: "obliquity",
    label: "골반 좌우 기울기 평균",
    axis: "Roll",
    unit: "°",
    description: "좌·우 골반 센서 높이 차이로 추정한 평균 좌우 기울기입니다. 0°에 가까울수록 좌우 높이가 비슷합니다.",
    posLabel: "오른쪽이 높음",
    negLabel: "왼쪽이 높음",
    low: 1.5,
    observe: 3.5,
    max: 8,
    deviation: (v) => Math.abs(v),
  },
  tilt: {
    key: "tilt",
    label: "전후 기울기",
    axis: "Pitch",
    unit: "°",
    description: "골반이 앞(+)·뒤(−)로 기울어진 평균 각도입니다. 데모 기준 참고 범위는 4–12° 입니다.",
    posLabel: "앞쪽 기울기",
    negLabel: "뒤쪽 기울기",
    low: 1,
    observe: 3,
    max: 8,
    deviation: (v) => Math.max(0, Math.abs(v - 8) - 4),
  },
  rotationAsym: {
    key: "rotationAsym",
    label: "회전 비대칭",
    axis: "Yaw",
    unit: "°",
    description: "골반이 한쪽 방향으로 더 돌아가 있는 정도입니다. 동작 중에는 좌우 회전 중심의 치우침을 뜻합니다.",
    posLabel: "오른쪽으로 치우침",
    negLabel: "왼쪽으로 치우침",
    low: 2,
    observe: 4.5,
    max: 10,
    deviation: (v) => Math.abs(v),
  },
  motionDiff: {
    key: "motionDiff",
    label: "동작 중 좌우 움직임 차이",
    axis: "L/R",
    unit: "%",
    description: "좌·우 골반 센서가 움직인 평균 폭의 차이입니다. 0%에 가까울수록 양쪽이 비슷하게 움직입니다.",
    posLabel: "왼쪽 움직임이 큼",
    negLabel: "오른쪽 움직임이 큼",
    low: 8,
    observe: 18,
    max: 45,
    deviation: (v) => Math.abs(v),
  },
  romDiff: {
    key: "romDiff",
    label: "좌우 가동범위 차이",
    axis: "L/R",
    unit: "°",
    description: "좌·우 골반 센서의 전후 움직임 범위(5–95% 구간) 차이입니다.",
    posLabel: "왼쪽 범위가 큼",
    negLabel: "오른쪽 범위가 큼",
    low: 2,
    observe: 5,
    max: 14,
    deviation: (v) => Math.abs(v),
  },
};

export const PELVIS_METRIC_ORDER: PelvisMetricKey[] = [
  "obliquity",
  "tilt",
  "rotationAsym",
  "motionDiff",
  "romDiff",
];

export const TEST_META: Record<TestType, { label: string; short: string; durationSec: number; guide: string; dynamic: boolean }> = {
  static: { label: "정적 서기", short: "정적", durationSec: 30, guide: "30초 동안 양발을 골반 너비로 두고 자연스럽게 서 있기", dynamic: false },
  walk: { label: "걷기", short: "걷기", durationSec: 30, guide: "제자리 또는 평지에서 평소 속도로 30초 걷기", dynamic: true },
  squat: { label: "스쿼트", short: "스쿼트", durationSec: 28, guide: "4초 템포로 앉았다 일어서기 약 7회", dynamic: true },
  single_leg: { label: "한발 서기", short: "한발", durationSec: 32, guide: "왼발 16초 → 오른발 16초 번갈아 서기", dynamic: true },
};

export const TAG_LABEL: Record<SessionTag, string> = {
  baseline: "일반 측정",
  pre_exercise: "운동 전",
  post_exercise: "운동 후",
};

export function levelOfPelvis(key: PelvisMetricKey, v: number): AsymmetryLevel {
  const m = PELVIS_METRICS[key];
  const d = m.deviation(v);
  if (d <= m.low) return "low";
  if (d <= m.observe) return "moderate";
  return "observe";
}

export function formatMetric(key: PelvisMetricKey, v: number): string {
  const m = PELVIS_METRICS[key];
  const n = Math.abs(v) < 10 ? v.toFixed(1) : v.toFixed(0);
  return `${v > 0 ? "+" : ""}${n}${m.unit}`;
}

export function directionLabel(key: PelvisMetricKey, v: number): string {
  const m = PELVIS_METRICS[key];
  if (key !== "tilt" && m.deviation(v) <= m.low * 0.4) return "거의 대칭";
  return v >= 0 ? m.posLabel : m.negLabel;
}

export function derivePelvisFrame(
  t: number,
  c: SegmentAngles,
  l: SegmentAngles | undefined,
  r: SegmentAngles | undefined,
  quality: number,
): PelvisFrame {
  const L = l ?? c;
  const R = r ?? c;
  return {
    t,
    roll: c.roll * 0.5 + (L.roll + R.roll) / 4,
    pitch: c.pitch,
    yaw: c.yaw,
    leftPitch: L.pitch,
    rightPitch: R.pitch,
    leftRoll: L.roll,
    rightRoll: R.roll,
    quality,
  };
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
function pct(xs: number[], p: number) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))))] ?? 0;
}
const r1 = (v: number) => Math.round(v * 10) / 10;

export function computeMetrics(frames: PelvisFrame[]) {
  const lp = frames.map((f) => f.leftPitch);
  const rp = frames.map((f) => f.rightPitch);
  const leftRom = pct(lp, 95) - pct(lp, 5);
  const rightRom = pct(rp, 95) - pct(rp, 5);
  const mL = mean(lp);
  const mR = mean(rp);
  const exL = mean(lp.map((v) => Math.abs(v - mL)));
  const exR = mean(rp.map((v) => Math.abs(v - mR)));
  const avg = Math.max(0.4, (exL + exR) / 2);
  const metrics: Record<PelvisMetricKey, number> = {
    obliquity: r1(mean(frames.map((f) => f.roll))),
    tilt: r1(mean(frames.map((f) => f.pitch))),
    rotationAsym: r1(mean(frames.map((f) => f.yaw))),
    motionDiff: r1(Math.max(-60, Math.min(60, ((exL - exR) / avg) * 100))),
    romDiff: r1(leftRom - rightRom),
  };
  return { metrics, leftRom: r1(leftRom), rightRom: r1(rightRom) };
}

export function symmetryIndex(metrics: Record<PelvisMetricKey, number>): number {
  const ratios = PELVIS_METRIC_ORDER.map((k) => {
    const m = PELVIS_METRICS[k];
    return Math.min(1, m.deviation(metrics[k]) / m.max);
  });
  return Math.round((1 - mean(ratios)) * 100);
}

export function downsampleTrace(frames: PelvisFrame[], n = 150) {
  if (!frames.length) return [];
  const t0 = frames[0]?.t ?? 0;
  const step = Math.max(1, Math.floor(frames.length / n));
  const out: PelvisSession["trace"] = [];
  for (let i = 0; i < frames.length; i += step) {
    const f = frames[i];
    if (!f) continue;
    out.push({ t: r1(f.t - t0), roll: r1(f.roll), pitch: r1(f.pitch), yaw: r1(f.yaw) });
  }
  return out;
}

export function summarizeSession(opts: {
  frames: PelvisFrame[];
  test: TestType;
  tag: SessionTag;
  durationSec: number;
  sensors: SensorId[];
  sampleRateHz: number;
  source: SourceMode;
  timestamp?: string;
  id?: string;
}): PelvisSession {
  const { frames } = opts;
  const { metrics, leftRom, rightRom } = computeMetrics(frames);
  const signalQuality = Math.round(mean(frames.map((f) => f.quality)));
  const expected = (opts.durationSec * opts.sampleRateHz) / 2;
  const completeness = Math.min(1, frames.length / Math.max(1, expected));
  const sensorFactor = Math.min(1, opts.sensors.length / 3);
  const confidence =
    Math.round((signalQuality / 100) * completeness * (0.7 + 0.3 * sensorFactor) * 100) / 100;
  return {
    id: opts.id ?? `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: opts.timestamp ?? new Date().toISOString(),
    test: opts.test,
    tag: opts.tag,
    durationSec: opts.durationSec,
    source: opts.source,
    sensors: opts.sensors,
    sampleRateHz: opts.sampleRateHz,
    metrics,
    leftRom,
    rightRom,
    signalQuality,
    confidence,
    symmetryIndex: symmetryIndex(metrics),
    trace: downsampleTrace(frames),
  };
}
