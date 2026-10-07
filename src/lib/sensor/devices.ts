import type { DeviceState, SensorId } from "./types";

export interface SensorSpec {
  id: SensorId;
  name: string;
  label: string;
  placement: string;
  role: string;
  mvp: boolean;
}

export const SENSOR_SPECS: Record<SensorId, SensorSpec> = {
  pelvis_center: {
    id: "pelvis_center",
    name: "Center Pelvis IMU",
    label: "중앙 골반 센서",
    placement: "허리 밴드 뒤쪽 중앙 (천골 위)",
    role: "골반 전체의 기준 자세(Roll·Pitch·Yaw)",
    mvp: true,
  },
  pelvis_left: {
    id: "pelvis_left",
    name: "Left Pelvis IMU",
    label: "좌측 골반 센서",
    placement: "왼쪽 장골능 부근 허리 밴드",
    role: "왼쪽 골반의 높이·전후 움직임",
    mvp: true,
  },
  pelvis_right: {
    id: "pelvis_right",
    name: "Right Pelvis IMU",
    label: "우측 골반 센서",
    placement: "오른쪽 장골능 부근 허리 밴드",
    role: "오른쪽 골반의 높이·전후 움직임",
    mvp: true,
  },
  thigh_left: {
    id: "thigh_left",
    name: "Left Thigh IMU",
    label: "좌측 허벅지 센서",
    placement: "왼쪽 대퇴 중간 바깥쪽 (확장 예정)",
    role: "고관절 굴곡·회전 각도 보정",
    mvp: false,
  },
  thigh_right: {
    id: "thigh_right",
    name: "Right Thigh IMU",
    label: "우측 허벅지 센서",
    placement: "오른쪽 대퇴 중간 바깥쪽 (확장 예정)",
    role: "고관절 굴곡·회전 각도 보정",
    mvp: false,
  },
};

export const MVP_SENSORS: SensorId[] = ["pelvis_center", "pelvis_left", "pelvis_right"];
export const FUTURE_SENSORS: SensorId[] = ["thigh_left", "thigh_right"];
export const ALL_SENSORS: SensorId[] = [...MVP_SENSORS, ...FUTURE_SENSORS];

export const NOMINAL_SAMPLE_RATE_HZ = 50;

const START_BATTERY: Record<SensorId, number> = {
  pelvis_center: 92,
  pelvis_left: 78,
  pelvis_right: 85,
  thigh_left: 0,
  thigh_right: 0,
};

export function initialDevices(): Record<SensorId, DeviceState> {
  const out = {} as Record<SensorId, DeviceState>;
  for (const id of ALL_SENSORS) {
    out[id] = {
      id,
      status: "disconnected",
      battery: START_BATTERY[id],
      sampleRateHz: 0,
      signalQuality: 0,
      rssi: -100,
      firmware: SENSOR_SPECS[id].mvp ? "demo-0.3.1" : "-",
      lastSeen: null,
    };
  }
  return out;
}
