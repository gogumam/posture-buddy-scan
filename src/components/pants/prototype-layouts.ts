export type LayoutId = "A" | "B" | "C";
export type Point3 = [number, number, number];
export interface PrototypeSensor {
  id: string;
  label: string;
  position: Point3;
  rotation?: Point3;
}
// Metres; +Y is up, +Z is the garment front. Independent of live IMU IDs.
export const SENSOR_SIZE: Point3 = [0.035, 0.035, 0.01];
const center: PrototypeSensor = { id: "center", label: "중앙 골반", position: [0, 0.2, -0.151] };
export const PROTOTYPE_LAYOUTS: Record<LayoutId, { title: string; composition: string; difference: string; sensors: PrototypeSensor[]; paths: Point3[][] }> = {
  A: {
    title: "중앙 골반", composition: "중앙 골반 × 1",
    difference: "골반 기준 자세를 살펴보는 단일 센서 구성",
    sensors: [center], paths: [],
  },
  B: {
    title: "골반 + 허벅지", composition: "중앙 골반 × 1 · 양 허벅지 × 2",
    difference: "골반과 양 허벅지 움직임을 함께 비교하는 구성",
    sensors: [center, { id: "left-thigh", label: "좌측 허벅지", position: [0.117, -0.105, -0.12] }, { id: "right-thigh", label: "우측 허벅지", position: [-0.117, -0.105, -0.12] }],
    paths: [
      [[0, 0.2, -0.16], [0.08, 0.14, -0.15], [0.117, 0.025, -0.145], [0.117, -0.105, -0.13]],
      [[0, 0.2, -0.16], [-0.08, 0.14, -0.15], [-0.117, 0.025, -0.145], [-0.117, -0.105, -0.13]],
    ],
  },
  C: {
    title: "골반 좌·중·우", composition: "좌측 · 중앙 · 우측 골반 × 3",
    difference: "골반의 세 위치를 비교하는 구성 · 기존 MVP 배치",
    sensors: [center, { id: "left-pelvis", label: "좌측 골반", position: [0.18, 0.2, -0.097], rotation: [0, -0.65, 0] }, { id: "right-pelvis", label: "우측 골반", position: [-0.18, 0.2, -0.097], rotation: [0, 0.65, 0] }],
    paths: [
      [[0, 0.2, -0.16], [0.09, 0.2, -0.149], [0.18, 0.2, -0.106]],
      [[0, 0.2, -0.16], [-0.09, 0.2, -0.149], [-0.18, 0.2, -0.106]],
    ],
  },
};