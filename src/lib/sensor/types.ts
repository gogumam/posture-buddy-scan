/**
 * Smart-pants sensor data model.
 *
 * The shape mirrors what real IMU firmware will stream over BLE so the demo
 * source can be swapped for Web Bluetooth / a native BLE layer without touching
 * fusion, metrics or UI code.
 */

export type SensorId =
  | "pelvis_center"
  | "pelvis_left"
  | "pelvis_right"
  /* future expansion slots */
  | "thigh_left"
  | "thigh_right";

export type ConnectionStatus = "disconnected" | "scanning" | "connecting" | "connected";

export type SourceMode = "demo" | "web_bluetooth";

/** What the hardware sends: raw inertial data + device health. */
export interface RawImuPacket {
  /** Epoch milliseconds. */
  timestamp: number;
  sensor_id: SensorId;
  /** m/s² */
  accel_x: number;
  accel_y: number;
  accel_z: number;
  /** deg/s */
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
  /** µT — optional, only on 9-axis IMUs. */
  mag_x?: number;
  mag_y?: number;
  mag_z?: number;
  /** 0–100 % */
  battery: number;
  /** 0–100 link / data quality */
  signal_quality: number;
}

/** Raw packet enriched by the orientation filter (sensor fusion). */
export interface SensorSample extends RawImuPacket {
  quaternion_w: number;
  quaternion_x: number;
  quaternion_y: number;
  quaternion_z: number;
  /** deg — Roll = 좌우 기울기 */
  roll: number;
  /** deg — Pitch = 전후 기울기 */
  pitch: number;
  /** deg — Yaw = 회전 */
  yaw: number;
}

export interface DeviceState {
  id: SensorId;
  status: ConnectionStatus;
  battery: number;
  sampleRateHz: number;
  signalQuality: number;
  rssi: number;
  firmware: string;
  lastSeen: number | null;
}

export type TestType = "static" | "walk" | "squat" | "single_leg";

export type SessionTag = "baseline" | "pre_exercise" | "post_exercise";

/** Pelvis-level angles derived from the sensor set, at the analysis rate. */
export interface PelvisFrame {
  /** seconds */
  t: number;
  roll: number;
  pitch: number;
  yaw: number;
  leftPitch: number;
  rightPitch: number;
  leftRoll: number;
  rightRoll: number;
  quality: number;
}

export type PelvisMetricKey = "obliquity" | "tilt" | "rotationAsym" | "motionDiff" | "romDiff";

export interface PelvisSession {
  id: string;
  timestamp: string;
  test: TestType;
  tag: SessionTag;
  durationSec: number;
  source: SourceMode;
  sensors: SensorId[];
  sampleRateHz: number;
  metrics: Record<PelvisMetricKey, number>;
  leftRom: number;
  rightRom: number;
  /** 0–100 */
  signalQuality: number;
  /** 0–1 */
  confidence: number;
  /** 0–100, higher = more symmetric. Not a medical score. */
  symmetryIndex: number;
  /** Downsampled pelvis trace for charts. */
  trace: Array<{ t: number; roll: number; pitch: number; yaw: number }>;
}
