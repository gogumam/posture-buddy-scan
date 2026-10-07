import type { RawImuPacket } from "./types";

/**
 * Sensor fusion layer.
 *
 * Every orientation algorithm implements `OrientationFilter`. The MVP ships a
 * complementary filter; Madgwick / Mahony implementations can be dropped in
 * later by adding a class and a case in `createOrientationFilter` — nothing
 * else in the app needs to change.
 *
 * Axis convention (body frame of each IMU):
 *   gyro_x → roll rate (좌우), gyro_y → pitch rate (전후), gyro_z → yaw rate (회전)
 */

export interface Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;
}

export interface Euler {
  roll: number;
  pitch: number;
  yaw: number;
}

export interface OrientationFilter {
  readonly name: string;
  update(packet: RawImuPacket, dtSec: number): Quaternion;
  reset(): void;
}

export type FilterKind = "complementary" | "madgwick" | "mahony";

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

export function eulerToQuat({ roll, pitch, yaw }: Euler): Quaternion {
  const cr = Math.cos((roll * D2R) / 2);
  const sr = Math.sin((roll * D2R) / 2);
  const cp = Math.cos((pitch * D2R) / 2);
  const sp = Math.sin((pitch * D2R) / 2);
  const cy = Math.cos((yaw * D2R) / 2);
  const sy = Math.sin((yaw * D2R) / 2);
  return {
    w: cr * cp * cy + sr * sp * sy,
    x: sr * cp * cy - cr * sp * sy,
    y: cr * sp * cy + sr * cp * sy,
    z: cr * cp * sy - sr * sp * cy,
  };
}

export function quatToEuler(q: Quaternion): Euler {
  const roll = Math.atan2(2 * (q.w * q.x + q.y * q.z), 1 - 2 * (q.x * q.x + q.y * q.y));
  const sinp = Math.max(-1, Math.min(1, 2 * (q.w * q.y - q.z * q.x)));
  const pitch = Math.asin(sinp);
  const yaw = Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
  return { roll: roll * R2D, pitch: pitch * R2D, yaw: yaw * R2D };
}

/** Gravity → roll/pitch and magnetometer → heading. */
export function accelMagAngles(p: RawImuPacket): { roll: number; pitch: number; yaw: number | null } {
  const roll = Math.atan2(p.accel_y, p.accel_z) * R2D;
  const pitch = Math.atan2(-p.accel_x, Math.hypot(p.accel_y, p.accel_z)) * R2D;
  const yaw =
    p.mag_x !== undefined && p.mag_y !== undefined ? Math.atan2(-p.mag_y, p.mag_x) * R2D : null;
  return { roll, pitch, yaw };
}

export class ComplementaryFilter implements OrientationFilter {
  readonly name = "Complementary";
  private state: Euler | null = null;
  constructor(private alpha = 0.96) {}

  update(p: RawImuPacket, dt: number): Quaternion {
    const ref = accelMagAngles(p);
    if (!this.state) {
      this.state = { roll: ref.roll, pitch: ref.pitch, yaw: ref.yaw ?? 0 };
    } else {
      const a = this.alpha;
      const s = this.state;
      s.roll = a * (s.roll + p.gyro_x * dt) + (1 - a) * ref.roll;
      s.pitch = a * (s.pitch + p.gyro_y * dt) + (1 - a) * ref.pitch;
      const gyroYaw = s.yaw + p.gyro_z * dt;
      s.yaw = ref.yaw === null ? gyroYaw : a * gyroYaw + (1 - a) * ref.yaw;
    }
    return eulerToQuat(this.state);
  }

  reset() {
    this.state = null;
  }
}

export function createOrientationFilter(kind: FilterKind = "complementary"): OrientationFilter {
  switch (kind) {
    // TODO(hardware): add MadgwickFilter / MahonyFilter implementing OrientationFilter.
    case "madgwick":
    case "mahony":
    case "complementary":
    default:
      return new ComplementaryFilter();
  }
}
