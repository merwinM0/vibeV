import { clamp01, ease, poseAt } from './motion';
import type { Limb, Pose, Vec3 } from './motion';

export const actingLabels = {
  inspect: '低头查单', think: '托腮思考', tap: '按下操作台', carry: '捧住道具', place: '俯身放置',
  sit: '坐下继续讲', seatedThink: '坐姿托腮', seatedTap: '坐姿操作', seatedPoint: '坐姿指向', recline: '侧躺托头',
} as const;
export type Acting = keyof typeof actingLabels;
const zero: Vec3 = [0, 0, 0];
const base = (angle: Partial<Pose['angles']>, lift = 0, bends?: Pose['bends'], root?: Vec3): Pose =>
  ({ angles: { ...poseAt('idle', 0, 0).angles, ...angle }, lift, bends, root });
const seat = (angle: Partial<Pose['angles']> = {}, bends: Pose['bends'] = {}) => base({
  leftLeg: [-1.42, 0, .1], rightLeg: [-1.49, 0, -.09], head: [.06, -.15, 0],
  rightArm: [-.35, 0, -.13], leftArm: [-.25, 0, .15], ...angle,
}, -5, { leftLeg: 1.32, rightLeg: 1.35, ...bends });
const poses: Record<Acting, Pose> = {
  inspect: base({ head: [.34, -.18, -.05], rightArm: [-.86, .15, -.19], leftArm: [-.7, -.18, .19] }, -.7, { rightArm: -.76, leftArm: -.53 }, [.13, 0, 0]),
  think: base({ head: [.17, -.1, .13], rightArm: [-.66, .2, .28], leftArm: [-.47, -.12, -.2] }, 0, { rightArm: -1.89, leftArm: -.88 }, [.04, 0, -.08]),
  tap: base({ head: [.25, -.18, 0], rightArm: [-1.12, .18, -.39], leftArm: [-.16, 0, .16] }, -1.6, { rightArm: -.43, rightLeg: .26, leftLeg: .2 }, [.18, 0, 0]),
  carry: base({ head: [.11, -.26, 0], rightArm: [-1.02, .13, -.48], leftArm: [-.95, -.22, -.36] }, 0, { rightArm: -.65, leftArm: -.76 }),
  place: base({ head: [.3, -.25, 0], rightArm: [-.43, .26, -.57], leftArm: [-.32, -.14, -.24], leftLeg: [-.21, 0, 0], rightLeg: [-.2, 0, 0] }, -3, { rightArm: -.4, leftArm: -.45, leftLeg: .43, rightLeg: .47 }, [.34, 0, 0]),
  sit: seat(),
  seatedThink: seat({ head: [.18, -.38, .11], rightArm: [-.67, .19, .25], leftArm: [-.31, -.16, -.12] }, { rightArm: -1.95, leftArm: -.65 }),
  seatedTap: seat({ head: [.19, -.35, 0], rightArm: [-1.26, .25, -.55] }, { rightArm: -.3 }),
  seatedPoint: seat({ head: [.1, -.35, 0], rightArm: [-.29, .16, -1.06] }, { rightArm: -.21 }),
  recline: base({ head: [.13, -.1, .22], rightArm: [-.53, .24, .34], leftArm: [-.41, 0, .29], leftLeg: [-.27, 0, 0], rightLeg: [-.1, 0, 0] }, -5.4,
    { rightArm: -2.03, leftArm: -.48, leftLeg: .48, rightLeg: .16 }, [.05, 0, 1.28]),
};

const mix = (a: number, b: number, q: number) => a + (b - a) * q;
const vector = (a: Vec3, b: Vec3, q: number): Vec3 => [mix(a[0], b[0], q), mix(a[1], b[1], q), mix(a[2], b[2], q)];
const limbs: Limb[] = ['rightArm', 'leftArm', 'rightLeg', 'leftLeg'];
export function blendPose(from: Pose, to: Pose, q: number): Pose {
  const angles = { ...from.angles };
  for (const part of Object.keys(angles) as (keyof typeof angles)[]) angles[part] = vector(from.angles[part], to.angles[part], q);
  const bends: Pose['bends'] = {};
  for (const limb of limbs) bends[limb] = mix(from.bends?.[limb] ?? 0, to.bends?.[limb] ?? 0, q);
  return { angles, lift: mix(from.lift, to.lift, q), bends, root: vector(from.root ?? zero, to.root ?? zero, q) };
}

export function actingPose(action: Acting | 'idle', amount = 1): Pose {
  const neutral = poseAt('idle', 0, 0);
  return action === 'idle' ? neutral : blendPose(neutral, poses[action], clamp01(amount));
}

export type ActorKey = { at: number; x: number; y: number; scale: number; yaw: number; action: Acting | 'idle'; walk?: boolean };
// The outgoing key holds until the next transition; identical x/y stays planted.
export function actorAt(keys: readonly [ActorKey, ...ActorKey[]], t: number, reduced = false) {
  const next = keys.findIndex(key => key.at > t);
  const from = keys[next === -1 ? keys.length - 1 : Math.max(next - 1, 0)];
  const to = next > 0 ? keys[next] : from;
  const elapsed = t - from.at;
  const q = from === to ? 0 : ease(from.at, to.at, t);
  const pose = blendPose(actingPose(from.action), actingPose(to.action), q);
  const stride = from.walk && from !== to && !reduced ? Math.sin(Math.PI * q) : 0;
  if (stride > 0) {
    const step = poseAt('walk', elapsed, stride * .74);
    for (const limb of limbs) {
      const a = pose.angles[limb], b = step.angles[limb];
      pose.angles[limb] = [a[0] + b[0] * (limb.endsWith('Arm') && from.action !== 'idle' ? .25 : 1), a[1], a[2]];
    }
    pose.lift += step.lift;
  }
  return { x: mix(from.x, to.x, q), y: mix(from.y, to.y, q), scale: mix(from.scale, to.scale, q), yaw: mix(from.yaw, to.yaw, q), pose };
}

// A speech window gates denser, uneven syllable-sized pulses. No sound is implied.
export function speechScale(time: number, windows: readonly (readonly [number, number])[], reduced = false) {
  if (reduced) return 1;
  const window = windows.find(([from, to]) => time > from && time < to);
  if (!window) return 1;
  const [from, to] = window;
  const t = time - from;
  const pattern = [.23, .26, .2, .3, .24, .27];
  const cycle = 1.5;
  let phase = t % cycle;
  let i = 0;
  while (i < pattern.length - 1 && phase >= pattern[i]) phase -= pattern[i++];
  const attack = ease(from, from + .12, time) * (1 - ease(to - .17, to, time));
  return 1 + attack * (.015 + (i % 3) * .003) * Math.sin(Math.PI * phase / pattern[i]) ** 2;
}
