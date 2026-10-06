/**
 * Data model for posture screening.
 *
 * Designed to be forward-compatible with wearable IMU sensors:
 * a `PostureMeasurement` carries a `source` field, and sensor streams are
 * modelled separately as `ImuSample` records that can be attached to a
 * measurement later (see `sensorSummary`).
 */

export type MeasurementSource = "camera_demo" | "photo_upload" | "imu_sensor" | "manual";

export type AsymmetryLevel = "low" | "moderate" | "observe";

export type MetricKey =
  | "shoulderHeightDiff"
  | "pelvisHeightDiff"
  | "pelvisRotation"
  | "trunkTilt"
  | "weightShift";

/** One screening metric value. Units are kept explicit for sensor fusion later. */
export interface MetricValue {
  key: MetricKey;
  /** Signed value. Positive = right side higher / shifted right. */
  value: number;
  unit: "mm" | "deg" | "%";
}

export interface PostureMeasurement {
  id: string;
  /** ISO timestamp — same clock base as IMU samples. */
  timestamp: string;
  source: MeasurementSource;
  /** 0–1 analysis confidence. Low values trigger a re-measure prompt. */
  confidence: number;
  views: Array<"front" | "side">;
  metrics: MetricValue[];
  /** Attached when an IMU sensor contributed to this measurement. */
  sensorSummary?: ImuSummary;
  notes?: string;
}

/** Raw wearable sample shape — matches a future BLE IMU / smartwatch payload. */
export interface ImuSample {
  timestamp: string;
  sensor_id: string;
  accel_x: number;
  accel_y: number;
  accel_z: number;
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
  roll: number;
  pitch: number;
  yaw: number;
}

export interface ImuSummary {
  sensor_id: string;
  sampleCount: number;
  meanRoll: number;
  meanPitch: number;
  meanYaw: number;
}

export interface ExerciseCompletion {
  /** YYYY-MM-DD */
  date: string;
  exerciseId: string;
}

export interface MetricMeta {
  key: MetricKey;
  label: string;
  unit: "mm" | "deg" | "%";
  /** Value at or below this is "비대칭 낮음". */
  lowThreshold: number;
  /** Above this is "관찰 필요". */
  observeThreshold: number;
  /** Max for gauge scaling. */
  scaleMax: number;
  description: string;
  leftLabel: string;
  rightLabel: string;
}

export const METRIC_META: Record<MetricKey, MetricMeta> = {
  shoulderHeightDiff: {
    key: "shoulderHeightDiff",
    label: "어깨 높이 차이",
    unit: "mm",
    lowThreshold: 6,
    observeThreshold: 14,
    scaleMax: 30,
    description:
      "좌우 어깨 끝점의 높이 차이를 추정한 값입니다. 가방을 한쪽으로만 메는 습관이나 책상 자세와 관련이 있을 수 있습니다.",
    leftLabel: "왼쪽이 높음",
    rightLabel: "오른쪽이 높음",
  },
  pelvisHeightDiff: {
    key: "pelvisHeightDiff",
    label: "골반 좌우 높이 차이",
    unit: "mm",
    lowThreshold: 5,
    observeThreshold: 12,
    scaleMax: 28,
    description:
      "좌우 골반(장골능) 높이의 차이 추정값입니다. 한쪽 다리에 체중을 실어 서는 습관과 함께 나타나는 경우가 많습니다.",
    leftLabel: "왼쪽이 높음",
    rightLabel: "오른쪽이 높음",
  },
  pelvisRotation: {
    key: "pelvisRotation",
    label: "골반 회전/기울기",
    unit: "deg",
    lowThreshold: 2.5,
    observeThreshold: 6,
    scaleMax: 12,
    description:
      "골반이 좌우로 돌아간 정도의 추정 각도입니다. 고관절 가동 범위 차이와 함께 관찰하면 도움이 됩니다.",
    leftLabel: "왼쪽으로 회전",
    rightLabel: "오른쪽으로 회전",
  },
  trunkTilt: {
    key: "trunkTilt",
    label: "몸통 기울기",
    unit: "deg",
    lowThreshold: 2,
    observeThreshold: 5,
    scaleMax: 10,
    description:
      "어깨 중심과 골반 중심을 이은 축이 수직선에서 벗어난 각도입니다. 측면 촬영에서는 상체의 앞뒤 기울기도 함께 반영됩니다.",
    leftLabel: "왼쪽으로 기울어짐",
    rightLabel: "오른쪽으로 기울어짐",
  },
  weightShift: {
    key: "weightShift",
    label: "체중 이동",
    unit: "%",
    lowThreshold: 4,
    observeThreshold: 10,
    scaleMax: 25,
    description:
      "좌우 발에 실린 체중 분포의 치우침 추정값입니다. 0%에 가까울수록 양발에 고르게 서 있는 상태입니다.",
    leftLabel: "왼발 쪽",
    rightLabel: "오른발 쪽",
  },
};

export const METRIC_ORDER: MetricKey[] = [
  "pelvisHeightDiff",
  "pelvisRotation",
  "shoulderHeightDiff",
  "trunkTilt",
  "weightShift",
];

export function levelOf(key: MetricKey, value: number): AsymmetryLevel {
  const meta = METRIC_META[key];
  const abs = Math.abs(value);
  if (abs <= meta.lowThreshold) return "low";
  if (abs <= meta.observeThreshold) return "moderate";
  return "observe";
}

export const LEVEL_LABEL: Record<AsymmetryLevel, string> = {
  low: "비대칭 낮음",
  moderate: "약간의 차이",
  observe: "관찰 필요",
};

/** Overall screening level = the most noticeable metric. */
export function overallLevel(m: PostureMeasurement): AsymmetryLevel {
  const levels = m.metrics.map((v) => levelOf(v.key, v.value));
  if (levels.includes("observe")) return "observe";
  if (levels.includes("moderate")) return "moderate";
  return "low";
}

export function metricValue(m: PostureMeasurement, key: MetricKey): number {
  return m.metrics.find((v) => v.key === key)?.value ?? 0;
}

/** Simple 0–100 balance index, higher = more symmetric. For trend charts. */
export function balanceScore(m: PostureMeasurement): number {
  const ratios = m.metrics.map((v) => {
    const meta = METRIC_META[v.key];
    return Math.min(1, Math.abs(v.value) / meta.scaleMax);
  });
  const mean = ratios.reduce((a, b) => a + b, 0) / Math.max(1, ratios.length);
  return Math.round((1 - mean) * 100);
}
