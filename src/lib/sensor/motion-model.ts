import type { TestType } from "./types";

/**
 * Demo kinematics — a pure, deterministic model of pelvis motion used ONLY by
 * Demo Sensor Mode and seed data. It is not physiology; it just produces
 * plausible, self-consistent angles so the full UX can be validated.
 */

export interface SegmentAngles {
  roll: number;
  pitch: number;
  yaw: number;
}

export interface SubjectBias {
  roll: number;
  pitch: number;
  yaw: number;
  leftRomScale: number;
  rightRomScale: number;
  swayScale: number;
}

export const DEFAULT_BIAS: SubjectBias = {
  roll: 1.9,
  pitch: 9.5,
  yaw: 2.6,
  leftRomScale: 1,
  rightRomScale: 0.8,
  swayScale: 1,
};

/** factor < 1 moves the demo subject toward symmetry, > 1 away from it. */
export function scaledBias(b: SubjectBias, factor: number): SubjectBias {
  return {
    roll: b.roll * factor,
    pitch: 8 + (b.pitch - 8) * factor,
    yaw: b.yaw * factor,
    leftRomScale: b.leftRomScale,
    rightRomScale: 1 - (1 - b.rightRomScale) * factor,
    swayScale: b.swayScale,
  };
}

function wobble(t: number, seed: number) {
  return (
    0.6 * Math.sin(1.3 * t + seed) +
    0.3 * Math.sin(2.9 * t + seed * 2.1) +
    0.1 * Math.sin(7.1 * t + seed * 3.7)
  );
}

export interface PelvisTruth {
  center: SegmentAngles;
  left: SegmentAngles;
  right: SegmentAngles;
  /** linear acceleration intensity (m/s²) — adds accelerometer noise */
  motion: number;
}

export function pelvisTruth(test: TestType, t: number, b: SubjectBias): PelvisTruth {
  if (test === "walk") {
    const ph = 2 * Math.PI * 0.9 * t;
    const s = Math.sin(ph);
    const roll = b.roll + s * (s > 0 ? 4.2 : 3.4);
    const ys = Math.sin(ph + 0.5);
    const yaw = b.yaw + ys * (ys > 0 ? 5 : 4.2);
    const pitch = b.pitch + 1.6 * Math.sin(2 * ph);
    return {
      center: { roll, pitch, yaw },
      left: { roll: roll + 0.6 * s, pitch: pitch + 6 * b.leftRomScale * s, yaw },
      right: { roll: roll - 0.6 * s, pitch: pitch - 6 * b.rightRomScale * s, yaw },
      motion: 2.5,
    };
  }
  if (test === "squat") {
    const d = (1 - Math.cos((2 * Math.PI * t) / 4)) / 2;
    const roll = b.roll + 2.2 * d * Math.sign(b.roll || 1) + 0.2 * wobble(t, 1);
    const pitch = b.pitch + 22 * d;
    const yaw = b.yaw + 2.5 * d;
    return {
      center: { roll, pitch, yaw },
      left: { roll, pitch: pitch + 4 * d * b.leftRomScale, yaw },
      right: { roll, pitch: pitch + 4 * d * b.rightRomScale, yaw },
      motion: 1.2 * d,
    };
  }
  if (test === "single_leg") {
    const phaseT = t % 16;
    const leftStance = Math.floor(t / 16) % 2 === 0;
    const ramp = Math.min(1, phaseT / 1.2);
    const drop = leftStance ? -3 : 4.6;
    const roll = b.roll + drop * ramp + 0.8 * wobble(t, 2);
    const pitch = b.pitch + 1 + 0.6 * wobble(t, 3);
    const yaw = b.yaw + (leftStance ? -2 : 2.6) * ramp + 0.5 * wobble(t, 4);
    return {
      center: { roll, pitch, yaw },
      left: { roll, pitch: pitch + 0.8 * b.leftRomScale * wobble(t, 5), yaw },
      right: { roll, pitch: pitch + 0.8 * b.rightRomScale * wobble(t, 6), yaw },
      motion: 0.4,
    };
  }
  // static
  const sway = 0.25 * b.swayScale;
  const roll = b.roll + sway * wobble(t, 1);
  const pitch = b.pitch + sway * wobble(t * 0.8, 2);
  const yaw = b.yaw + 0.4 * wobble(t * 0.5, 3);
  return {
    center: { roll, pitch, yaw },
    left: { roll: roll + 0.2 * wobble(t, 4), pitch: pitch + 0.35 * b.leftRomScale * wobble(t, 5), yaw },
    right: { roll: roll + 0.2 * wobble(t, 6), pitch: pitch + 0.35 * b.rightRomScale * wobble(t, 7), yaw },
    motion: 0.05,
  };
}
