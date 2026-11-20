import type { Part } from './skin';

export const actions = ['idle', 'walk', 'look', 'point', 'nod'] as const;
export type Action = typeof actions[number];
export type Vec3 = readonly [number, number, number];
export type Pose = { angles: Record<Part, Vec3>; lift: number };
export const phaseLength = 1.14;
export const clamp01 = (q: number) => Math.max(0, Math.min(1, q));
export function ease(from: number, to: number, time: number) {
  const q = clamp01((time - from) / (to - from));
  return q * q * (3 - 2 * q);
}

export function poseAt(action: Action, time: number, intensity = 1): Pose {
  const amount = clamp01(intensity);
  const neutral: Vec3 = [0, 0, 0];
  const angles: Pose['angles'] = { head: neutral, body: neutral, rightArm: neutral, leftArm: neutral, rightLeg: neutral, leftLeg: neutral };
  let lift = .12 * (1 + Math.sin(time * 3)) * amount;
  if (action === 'walk') {
    const phase = time * 2 * Math.PI / phaseLength;
    const stride = Math.sin(phase) * .64 * amount;
    angles.leftLeg = angles.rightArm = [-stride, 0, 0];
    angles.rightLeg = angles.leftArm = [stride, 0, 0];
    angles.head = [0, -.12 * stride, 0];
    // Keep the lowest corner of the 12 × 4 leg geometry on the floor during a stride.
    lift = 12 * (Math.cos(stride) - 1) + 2 * Math.abs(Math.sin(stride));
  } else if (action === 'look') {
    angles.head = [0, (.64 * Math.sin(time * 2.1)) * amount, 0];
  } else if (action === 'point') {
    const raise = ease(.18, .9, time) * (1 - ease(2.75, 3.48, time)) * amount;
    angles.leftArm = [-.18 * raise, 0, 1.51 * raise];
    angles.head = [.05 * raise, .32 * raise, 0];
  } else if (action === 'nod') {
    const nod = ease(.2, .62, time) * (1 - ease(.66, 1.1, time));
    angles.head = [.47 * nod * amount, 0, 0];
  } else {
    angles.rightArm = [0, 0, -.055 * amount];
    angles.leftArm = [0, 0, .055 * amount];
  }
  return { angles, lift };
}

// Local pitch, yaw, roll around a part's own pivot.
export function rotate([x, y, z]: Vec3, [rx, ry, rz]: Vec3): Vec3 {
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  const py = y * cx - z * sx;
  const pz = y * sx + z * cx;
  const qx = x * cy + pz * sy;
  return [qx * cz - py * sz, qx * sz + py * cz, -x * sy + pz * cy];
}
