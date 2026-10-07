import { MVP_SENSORS, NOMINAL_SAMPLE_RATE_HZ, initialDevices } from "./devices";
import { createOrientationFilter, quatToEuler, type OrientationFilter } from "./fusion";
import { derivePelvisFrame, summarizeSession } from "./metrics";
import { DEFAULT_BIAS, scaledBias } from "./motion-model";
import { DemoSensorSource, type SensorSource } from "./sources";
import type {
  DeviceState,
  PelvisFrame,
  PelvisSession,
  RawImuPacket,
  SensorId,
  SensorSample,
  SessionTag,
  SourceMode,
  TestType,
} from "./types";

/**
 * SensorHub — the single pipeline:  SensorSource (BLE/demo) → OrientationFilter
 * (fusion) → derivePelvisFrame → recording → summarizeSession.
 * UI only reads `snapshot` via useSensorHub().
 */

export interface RecordingState {
  test: TestType;
  tag: SessionTag;
  durationSec: number;
  elapsedSec: number;
}

export interface HubSnapshot {
  mode: SourceMode;
  devices: Record<SensorId, DeviceState>;
  frame: PelvisFrame | null;
  history: PelvisFrame[];
  samples: Partial<Record<SensorId, SensorSample>>;
  test: TestType;
  recording: RecordingState | null;
  filterName: string;
}

const RING = 250; // 10 s at 25 Hz analysis rate

export const EMPTY_SNAPSHOT: HubSnapshot = {
  mode: "demo",
  devices: initialDevices(),
  frame: null,
  history: [],
  samples: {},
  test: "static",
  recording: null,
  filterName: "Complementary",
};

class SensorHub {
  private source: SensorSource;
  private filters = new Map<SensorId, OrientationFilter>();
  private lastTs = new Map<SensorId, number>();
  private samples: Partial<Record<SensorId, SensorSample>> = {};
  private ring: PelvisFrame[] = [];
  private devices = initialDevices();
  private test: TestType = "static";
  private centerCount = 0;
  private listeners = new Set<() => void>();
  private dirty = false;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private rec: {
    state: RecordingState;
    frames: PelvisFrame[];
    startT: number;
    resolve: (s: PelvisSession) => void;
    reject: (e: Error) => void;
  } | null = null;

  snapshot: HubSnapshot = EMPTY_SNAPSHOT;

  constructor(source: SensorSource) {
    this.source = source;
    source.onPacket((p) => this.ingest(p));
    source.onDevice((d) => {
      this.devices = { ...this.devices, [d.id]: d };
      if (d.status !== "connected") {
        delete this.samples[d.id];
        this.filters.get(d.id)?.reset();
        this.lastTs.delete(d.id);
      }
      this.dirty = true;
    });
  }

  subscribe(cb: () => void) {
    this.listeners.add(cb);
    if (!this.flushTimer) {
      this.flushTimer = setInterval(() => this.flush(), 80);
    }
    return () => {
      this.listeners.delete(cb);
    };
  }

  private flush() {
    if (!this.dirty) return;
    this.dirty = false;
    this.snapshot = {
      mode: this.source.mode,
      devices: this.devices,
      frame: this.ring[this.ring.length - 1] ?? null,
      history: this.ring.slice(),
      samples: { ...this.samples },
      test: this.test,
      recording: this.rec ? { ...this.rec.state } : null,
      filterName: this.filters.get("pelvis_center")?.name ?? "Complementary",
    };
    this.listeners.forEach((l) => l());
  }

  private ingest(p: RawImuPacket) {
    const prev = this.lastTs.get(p.sensor_id);
    const dt = prev ? Math.max(0.001, (p.timestamp - prev) / 1000) : 1 / NOMINAL_SAMPLE_RATE_HZ;
    this.lastTs.set(p.sensor_id, p.timestamp);
    let f = this.filters.get(p.sensor_id);
    if (!f) {
      f = createOrientationFilter("complementary");
      this.filters.set(p.sensor_id, f);
    }
    const q = f.update(p, dt);
    const e = quatToEuler(q);
    this.samples[p.sensor_id] = {
      ...p,
      quaternion_w: q.w,
      quaternion_x: q.x,
      quaternion_y: q.y,
      quaternion_z: q.z,
      roll: e.roll,
      pitch: e.pitch,
      yaw: e.yaw,
    };
    if (p.sensor_id === "pelvis_center") {
      this.centerCount++;
      if (this.centerCount % 2 === 0) this.pushFrame(p.timestamp / 1000);
    }
    this.dirty = true;
  }

  private pushFrame(t: number) {
    const c = this.samples.pelvis_center;
    if (!c) return;
    const l = this.samples.pelvis_left;
    const r = this.samples.pelvis_right;
    const quality = Math.min(c.signal_quality, l?.signal_quality ?? 100, r?.signal_quality ?? 100);
    const frame = derivePelvisFrame(t, c, l, r, quality);
    this.ring.push(frame);
    if (this.ring.length > RING) this.ring.shift();

    if (this.rec) {
      this.rec.frames.push(frame);
      this.rec.state.elapsedSec = t - this.rec.startT;
      if (this.rec.state.elapsedSec >= this.rec.state.durationSec) this.finish();
    }
  }

  private finish() {
    const rec = this.rec;
    if (!rec) return;
    this.rec = null;
    const sensors = MVP_SENSORS.filter((id) => this.devices[id].status === "connected");
    rec.resolve(
      summarizeSession({
        frames: rec.frames,
        test: rec.state.test,
        tag: rec.state.tag,
        durationSec: rec.state.durationSec,
        sensors,
        sampleRateHz: NOMINAL_SAMPLE_RATE_HZ,
        source: this.source.mode,
      }),
    );
    this.dirty = true;
  }

  connect(id: SensorId) {
    return this.source.connect(id);
  }

  connectAll() {
    return Promise.all(MVP_SENSORS.map((id) => this.source.connect(id)));
  }

  disconnect(id: SensorId) {
    this.source.disconnect(id);
  }

  disconnectAll() {
    this.cancelRecording();
    this.source.disconnectAll();
  }

  setTest(test: TestType) {
    if (this.rec) return;
    this.test = test;
    this.source.setTest?.(test);
    this.dirty = true;
  }

  startRecording(opts: { test: TestType; tag: SessionTag; durationSec: number }): Promise<PelvisSession> {
    if (this.devices.pelvis_center.status !== "connected") {
      return Promise.reject(new Error("중앙 골반 센서가 연결되어 있지 않습니다."));
    }
    this.cancelRecording();
    this.test = opts.test;
    this.source.setTest?.(opts.test);
    // Demo only: post-exercise sessions drift slightly toward symmetry.
    const factor = opts.tag === "post_exercise" ? 0.78 + Math.random() * 0.1 : 0.92 + Math.random() * 0.18;
    this.source.setBias?.(scaledBias(DEFAULT_BIAS, factor));
    return new Promise((resolve, reject) => {
      this.rec = {
        state: { ...opts, elapsedSec: 0 },
        frames: [],
        startT: Date.now() / 1000,
        resolve,
        reject,
      };
      this.dirty = true;
    });
  }

  cancelRecording() {
    if (!this.rec) return;
    this.rec.reject(new Error("cancelled"));
    this.rec = null;
    this.dirty = true;
  }
}

let hub: SensorHub | null = null;

/** Lazy singleton — swap `new DemoSensorSource()` for a BLE source later. */
export function getHub(): SensorHub {
  if (!hub) hub = new SensorHub(new DemoSensorSource());
  return hub;
}
