import { drawAvatar, handAnchor } from '../../avatar/draw';
import { poseAt } from '../../avatar/motion';
import type { Pose, Vec3 } from '../../avatar/motion';
import { prepareSkin } from '../../avatar/skin';
import { smooth, writeLaunch } from './timeline';
import { arrivalRings, intake, worldPoint } from './stage';
import type { SampleFrame } from './timeline';

type Stance = { yaw: number; head: Vec3; left: Vec3; right: Vec3; move?: number };
const placement = [
  [1690, 909, 10], [1700, 901, 8], [439, 738, 8.7], [1642, 881, 8],
  [1730, 900, 8.4], [542, 730, 7.2], [1712, 885, 8.3], [1715, 876, 7.9],
  [1675, 905, 8.6], [1718, 908, 8.5], [1610, 883, 9.5], [1704, 907, 9.7],
] as const;
const stance: Record<SampleFrame['beat']['gesture'], Stance> = {
  present: { yaw: .18, head: [-.08, .1, .04], left: [-.37, 0, 1.02], right: [-.28, 0, -.83] },
  inspect: { yaw: -.37, head: [.19, -.25, -.14], left: [-.24, 0, .26], right: [-.6, 0, -.38] },
  pass: { yaw: -.32, head: [.07, -.33, 0], left: [-1.05, 0, .24], right: [-.43, .18, -1.41] },
  trace: { yaw: -.46, head: [-.08, -.18, -.06], left: [-.3, 0, .2], right: [-.28, 0, -1.83] },
  focus: { yaw: -.31, head: [.12, -.26, -.04], left: [-.2, 0, .29], right: [-.2, .12, -1.05] },
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

export function hostPose({ beat, local, length, route, index }: SampleFrame, reduced: boolean) {
  const { yaw, head, left, right, move } = stance[beat.gesture];
  const [x, y, scale] = placement[index];
  const isWrite = route === 'write';
  const carrying = isWrite && local < writeLaunch;
  const setting = smooth((local - 1.45) / 1.2);
  const retreat = isWrite ? (reduced ? Number(!carrying) : smooth((local - writeLaunch) / 1.1)) : 0;
  const hold = beat.gesture === 'focus' ? length - 1.65 : 2.65;
  const gesture = smooth((local - .18) / .77) * (1 - smooth((local - hold) / .94));
  const amount = carrying ? 1 : reduced ? .6 : gesture;
  const stepping = !reduced && ((move && local < 1.14) || (retreat > 0 && retreat < 1));
  const pose: Pose = poseAt(stepping ? 'walk' : 'idle', isWrite ? local - writeLaunch : local, stepping ? .4 : 0);
  const scaleAngle = (v: Vec3): Vec3 => [v[0] * amount, v[1] * amount, v[2] * amount];
  pose.angles.head = scaleAngle(carrying ? [.18, -.35, -.05] : head);
  if (!stepping) {
    pose.angles.leftArm = scaleAngle(carrying ? [-1.05, -.45, -.42] : left);
    pose.angles.rightArm = scaleAngle(carrying ? [-.65 + setting * .58, .15, -1.05 + setting * .72] : right);
  }
  const offset = (move ?? 0) * (reduced ? 1 : smooth(local / 1.14));
  return {
    pose, yaw: -.12 + (carrying ? -.49 : yaw) * amount,
    x: x + offset - (isWrite ? 50 * (carrying ? setting : 1) : 0) + 45 * retreat,
    y: y + (isWrite ? 14 * (carrying ? setting : 1 - retreat) : 0), scale, offset,
    headScale: speechScale(local, reduced),
  };
}

export function propAt(state: SampleFrame, reduced: boolean) {
  if (state.route !== 'write' || state.local >= writeLaunch) return { mode: 'none', release: 0 } as const;
  if (reduced) return { mode: 'supply', release: 1 } as const;
  const release = smooth((state.local - 1.72) / 1.11);
  return { mode: release === 0 ? 'held' : 'supply', release } as const;
}

const cyan = '#54e8ff';
const socket = worldPoint(intake.x, intake.y);

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = cyan;
  ctx.shadowBlur = 19;
  ctx.strokeStyle = cyan;
  ctx.lineWidth = 2;
  ctx.fillStyle = '#143849';
  ctx.beginPath();
  ctx.moveTo(0, -size * .74);
  ctx.lineTo(size, -size * .32);
  ctx.lineTo(size, size * .52);
  ctx.lineTo(0, size * .88);
  ctx.lineTo(-size, size * .52);
  ctx.lineTo(-size, -size * .32);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#2b6676';
  ctx.beginPath(); ctx.moveTo(0, -size * .74); ctx.lineTo(size, -size * .32); ctx.lineTo(0, size * .07); ctx.lineTo(-size, -size * .32); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f0fbff';
  ctx.font = `bold ${size * .68}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('B2', 0, size * .47);
  ctx.restore();
}

function drawArrivals(ctx: CanvasRenderingContext2D, state: SampleFrame) {
  for (const { x, y, q } of arrivalRings(state)) {
    ctx.save();
    ctx.strokeStyle = ctx.fillStyle = cyan;
    ctx.globalAlpha = (1 - q) * .56;
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(x, y, 10 + 43 * q, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4 + .19;
      const travel = 17 + (i % 2 ? 45 : 61) * q;
      ctx.beginPath(); ctx.arc(x + Math.cos(angle) * travel, y + Math.sin(angle) * travel, 2.7 - q, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

export async function makeHost(canvas: HTMLCanvasElement, image: HTMLImageElement) {
  const skin = { ...await prepareSkin(image), model: 'slim' as const };
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  return (state: SampleFrame, reduced: boolean) => {
    const view = hostPose(state, reduced);
    const { x, y, scale } = view;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!reduced) drawArrivals(ctx, state);
    ctx.fillStyle = '#1e2637';
    ctx.beginPath();
    ctx.ellipse(x + 4, y + 3, scale * 10.2, scale * .92, 0, 0, 2 * Math.PI);
    ctx.fill();
    drawAvatar(ctx, skin, view);
    const prop = propAt(state, reduced);
    if (prop.mode !== 'none') {
      const grip = handAnchor(skin, view, 'rightArm');
      const q = prop.release;
      drawBlock(ctx, grip.x * (1 - q) + socket.x * q, (grip.y - 15) * (1 - q) + socket.y * q, 24 * (1 - q) + 17 * q);
    }
  };
}
