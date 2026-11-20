import { drawAvatar } from '../../avatar/draw';
import { poseAt } from '../../avatar/motion';
import type { Pose, Vec3 } from '../../avatar/motion';
import { prepareSkin } from '../../avatar/skin';
import { smooth } from './timeline';
import type { SampleFrame } from './timeline';

type Stance = { yaw: number; head: Vec3; left: Vec3; right: Vec3; move?: number };
const stance: Record<SampleFrame['beat']['gesture'], Stance> = {
  present: { yaw: .18, head: [-.08, .1, .04], left: [-.37, 0, 1.02], right: [-.28, 0, -.83] },
  inspect: { yaw: -.37, head: [.19, -.25, -.14], left: [-.24, 0, .26], right: [-.6, 0, -.38] },
  pass: { yaw: -.32, head: [.07, -.33, 0], left: [-1.05, 0, .24], right: [-.43, .18, -1.41] },
  trace: { yaw: -.46, head: [-.08, -.18, -.06], left: [-.3, 0, .2], right: [-.28, 0, -1.83] },
  nod: { yaw: .12, head: [.35, .02, 0], left: [-.24, 0, .4], right: [-.32, 0, -.35] },
  switch: { yaw: -.23, head: [.11, -.39, -.1], left: [-1.04, .36, .76], right: [-.37, 0, -.3] },
  stepBack: { yaw: .28, head: [-.12, .11, .07], left: [-.23, 0, .42], right: [-.26, 0, -.48], move: 41 },
};

const accents = [[.34, .38], [1.06, .29], [1.62, .47], [2.38, .31], [2.98, .37], [3.76, .29], [4.31, .4]] as const;
// Preview envelopes only: the sample has no recording or claimed speech alignment.
export function speechScale(second: number, reduced = false) {
  if (reduced) return 1;
  return 1 + .024 * Math.max(...accents.map(([start, length]) => {
    const p = (second - start) / length;
    return p <= 0 || p >= 1 ? 0 : Math.sin(Math.PI * p) ** 2;
  }));
}

export function hostPose({ beat, local }: SampleFrame, reduced: boolean) {
  const { yaw, head, left, right, move } = stance[beat.gesture];
  const gesture = smooth((local - .18) / .77) * (1 - smooth((local - 2.65) / .94));
  const amount = reduced ? .6 : gesture;
  const stepping = !reduced && move && local < 1.14;
  const pose: Pose = poseAt(stepping ? 'walk' : 'idle', local, stepping ? .4 : 0);
  const scaleAngle = (v: Vec3): Vec3 => [v[0] * amount, v[1] * amount, v[2] * amount];
  pose.angles.head = scaleAngle(head);
  if (!stepping) {
    pose.angles.leftArm = scaleAngle(left);
    pose.angles.rightArm = scaleAngle(right);
  }
  return { pose, yaw: (-.12 + yaw * amount), offset: (move ?? 0) * (reduced ? 1 : smooth(local / 1.14)), headScale: speechScale(local, reduced) };
}

export async function makeHost(canvas: HTMLCanvasElement, image: HTMLImageElement) {
  const skin = { ...await prepareSkin(image), model: 'slim' as const };
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  return (state: SampleFrame, reduced: boolean) => {
    const { pose, yaw, offset, headScale } = hostPose(state, reduced);
    const x = 209 + offset;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ccdfdd';
    ctx.beginPath();
    ctx.ellipse(x + 5, 328, 95, 12, 0, 0, 2 * Math.PI);
    ctx.fill();
    drawAvatar(ctx, skin, { x, y: 326, scale: 9.35, yaw, pose, headScale });
  };
}
