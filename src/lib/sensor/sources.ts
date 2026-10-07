import { NOMINAL_SAMPLE_RATE_HZ, SENSOR_SPECS, initialDevices } from "./devices";
import { DEFAULT_BIAS, pelvisTruth, type SegmentAngles, type SubjectBias } from "./motion-model";
import type { DeviceState, RawImuPacket, SensorId, SourceMode, TestType } from "./types";

/**
 * Transport layer. Anything that can deliver `RawImuPacket`s implements
 * `SensorSource`: the demo generator today, Web Bluetooth or a native mobile
 * BLE bridge later.
 */
export interface SensorSource {
  readonly mode: SourceMode;
  connect(id: SensorId): Promise<void>;
  disconnect(id: SensorId): void;
  disconnectAll(): void;
  onPacket(cb: (p: RawImuPacket) => void): () => void;
  onDevice(cb: (d: DeviceState) => void): () => void;
  /** Demo-only hints; real hardware ignores them. */
  setTest?(test: TestType): void;
  setBias?(bias: SubjectBias): void;
}

const G = 9.81;
const noise = (amp: number) => (Math.random() * 2 - 1) * amp;

export class DemoSensorSource implements SensorSource {
  readonly mode = "demo" as const;
  private packetCbs = new Set<(p: RawImuPacket) => void>();
  private deviceCbs = new Set<(d: DeviceState) => void>();
  private devices = initialDevices();
  private timer: ReturnType<typeof setInterval> | null = null;
  private test: TestType = "static";
  private testStart = Date.now();
  private bias: SubjectBias = DEFAULT_BIAS;
  private prev = new Map<SensorId, SegmentAngles>();
  private tick = 0;

  onPacket(cb: (p: RawImuPacket) => void) {
    this.packetCbs.add(cb);
    return () => this.packetCbs.delete(cb);
  }

  onDevice(cb: (d: DeviceState) => void) {
    this.deviceCbs.add(cb);
    return () => this.deviceCbs.delete(cb);
  }

  setTest(test: TestType) {
    this.test = test;
    this.testStart = Date.now();
  }

  setBias(bias: SubjectBias) {
    this.bias = bias;
  }

  private emitDevice(id: SensorId, patch: Partial<DeviceState>) {
    this.devices[id] = { ...this.devices[id], ...patch };
    this.deviceCbs.forEach((cb) => cb(this.devices[id]));
  }

  connect(id: SensorId): Promise<void> {
    if (!SENSOR_SPECS[id].mvp) {
      return Promise.reject(new Error("허벅지 센서는 향후 확장 슬롯입니다."));
    }
    if (this.devices[id].status === "connected") return Promise.resolve();
    this.emitDevice(id, { status: "scanning" });
    return new Promise((resolve) => {
      setTimeout(() => this.emitDevice(id, { status: "connecting" }), 450 + Math.random() * 300);
      setTimeout(
        () => {
          this.emitDevice(id, {
            status: "connected",
            sampleRateHz: NOMINAL_SAMPLE_RATE_HZ,
            signalQuality: 92,
            rssi: -55 - Math.round(Math.random() * 12),
            lastSeen: Date.now(),
          });
          this.ensureTimer();
          resolve();
        },
        1000 + Math.random() * 500,
      );
    });
  }

  disconnect(id: SensorId) {
    this.prev.delete(id);
    this.emitDevice(id, { status: "disconnected", sampleRateHz: 0, signalQuality: 0, rssi: -100 });
    if (!Object.values(this.devices).some((d) => d.status === "connected")) this.stopTimer();
  }

  disconnectAll() {
    (Object.keys(this.devices) as SensorId[]).forEach((id) => {
      if (this.devices[id].status !== "disconnected") this.disconnect(id);
    });
  }

  private ensureTimer() {
    if (this.timer) return;
    const dtMs = 1000 / NOMINAL_SAMPLE_RATE_HZ;
    this.timer = setInterval(() => this.step(dtMs / 1000), dtMs);
  }

  private stopTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private step(dt: number) {
    this.tick++;
    const now = Date.now();
    const t = (now - this.testStart) / 1000;
    const truth = pelvisTruth(this.test, t, this.bias);
    const baseQuality: Record<SensorId, number> = {
      pelvis_center: 96,
      pelvis_left: 91,
      pelvis_right: 88,
      thigh_left: 0,
      thigh_right: 0,
    };

    for (const d of Object.values(this.devices)) {
      if (d.status !== "connected") continue;
      const seg =
        d.id === "pelvis_left" ? truth.left : d.id === "pelvis_right" ? truth.right : truth.center;
      const prev = this.prev.get(d.id) ?? seg;
      this.prev.set(d.id, seg);

      const r = (seg.roll * Math.PI) / 180;
      const p = (seg.pitch * Math.PI) / 180;
      const y = (seg.yaw * Math.PI) / 180;
      const aNoise = 0.04 + truth.motion * 0.12;
      const quality = Math.max(
        40,
        Math.min(100, baseQuality[d.id] + 3 * Math.sin(t * 0.3 + d.rssi) + noise(1.2)),
      );
      const battery = Math.max(0, d.battery - 0.0004);

      const packet: RawImuPacket = {
        timestamp: now,
        sensor_id: d.id,
        accel_x: -G * Math.sin(p) + noise(aNoise),
        accel_y: G * Math.sin(r) * Math.cos(p) + noise(aNoise),
        accel_z: G * Math.cos(r) * Math.cos(p) + noise(aNoise),
        gyro_x: (seg.roll - prev.roll) / dt + noise(0.3),
        gyro_y: (seg.pitch - prev.pitch) / dt + noise(0.3),
        gyro_z: (seg.yaw - prev.yaw) / dt + noise(0.3),
        mag_x: 40 * Math.cos(y) + noise(0.4),
        mag_y: -40 * Math.sin(y) + noise(0.4),
        mag_z: -20 + noise(0.4),
        battery,
        signal_quality: quality,
      };
      this.devices[d.id] = { ...d, battery, signalQuality: quality, lastSeen: now };
      this.packetCbs.forEach((cb) => cb(packet));
      if (this.tick % 25 === 0) this.deviceCbs.forEach((cb) => cb(this.devices[d.id]));
    }
  }
}

/**
 * Web Bluetooth transport — placeholder for real hardware.
 *
 * Proposed GATT layout (to align with firmware):
 *   service  "0000a100-0000-1000-8000-00805f9b34fb"  Smart Pants IMU
 *   char     "0000a101-…"  IMU notify, little-endian packet (see parseImuNotification)
 *   char     "00002a19-…"  Battery Level (standard)
 */
export const IMU_SERVICE_UUID = "0000a100-0000-1000-8000-00805f9b34fb";

/** Packet: u32 ms, i16 accel×3 (mg), i16 gyro×3 (0.1 dps), i16 mag×3 (0.1 µT), u8 battery, u8 quality */
export function parseImuNotification(view: DataView, sensor_id: SensorId, epochOffset = 0): RawImuPacket {
  const i16 = (o: number) => view.getInt16(o, true);
  return {
    timestamp: epochOffset + view.getUint32(0, true),
    sensor_id,
    accel_x: (i16(4) / 1000) * 9.81,
    accel_y: (i16(6) / 1000) * 9.81,
    accel_z: (i16(8) / 1000) * 9.81,
    gyro_x: i16(10) / 10,
    gyro_y: i16(12) / 10,
    gyro_z: i16(14) / 10,
    mag_x: i16(16) / 10,
    mag_y: i16(18) / 10,
    mag_z: i16(20) / 10,
    battery: view.getUint8(22),
    signal_quality: view.getUint8(23),
  };
}

export function isWebBluetoothAvailable(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}
