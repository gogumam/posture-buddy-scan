import { describe, expect, it } from "vitest";
import { PROTOTYPE_LAYOUTS, SENSOR_SIZE } from "./prototype-layouts";

describe("isolated prototype sensor layouts", () => {
  it("uses provisional 35 × 35 × 10 mm dimensions in metres", () => {
    expect(SENSOR_SIZE).toEqual([0.035, 0.035, 0.01]);
  });
  it("provides exactly the requested A, B and C compositions", () => {
    expect(PROTOTYPE_LAYOUTS.A.sensors.map((s) => s.id)).toEqual(["center"]);
    expect(PROTOTYPE_LAYOUTS.B.sensors.map((s) => s.id)).toEqual(["center", "left-thigh", "right-thigh"]);
    expect(PROTOTYPE_LAYOUTS.C.sensors.map((s) => s.id)).toEqual(["center", "left-pelvis", "right-pelvis"]);
  });
  it("keeps connection paths symmetric and independent of BLE state", () => {
    expect(PROTOTYPE_LAYOUTS.A.paths).toHaveLength(0);
    for (const id of ["B", "C"] as const) {
      const [left, right] = PROTOTYPE_LAYOUTS[id].paths;
      expect(left.map(([x, y, z]) => [x === 0 ? 0 : -x, y, z])).toEqual(right);
    }
  });
});