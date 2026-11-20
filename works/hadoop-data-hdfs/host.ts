import { drawAvatar, handAnchor } from '../../avatar/draw';
import { prepareSkin } from '../../avatar/skin';
import { hostPose, propAt } from './acting';
import { drawProp } from './props';
import { smooth, storyCues } from './timeline';
import { arrivalRings, intake, worldPoint } from './stage';
import type { SampleFrame } from './timeline';

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

function drawReceipt(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-.12);
  ctx.fillStyle = '#f7e5b7'; ctx.fillRect(-w / 2, -w, w, w * 1.32);
  ctx.fillStyle = '#694b32';
  for (let i = 0; i < 3; i++) ctx.fillRect(-w * .34, -w * (.69 - i * .22), w * (.65 - i * .12), w * .065);
  ctx.restore();
}

function drawStation(ctx: CanvasRenderingContext2D, t: number, reduced: boolean) {
  const onSet = (from: number, to: number) => reduced ? Number(t >= from && t < to)
    : smooth((t - from) / .65) * smooth((to - t) / .65);
  ctx.save();
  const seated = onSet(35, 70);
  if (seated) {
    ctx.globalAlpha = seated;
    drawProp(ctx, 'crate', 138, 780, 5.8);
  }
  const lookup = t >= 35 && t < 48;
  const cue = lookup ? storyCues.lookup : t < 35 ? storyCues.open : storyCues.retry;
  const visible = onSet(3.45, 8) + onSet(37.2, 47.6) + onSet(74, 80);
  if (visible) {
    ctx.globalAlpha = visible;
    const x = lookup ? 257 : 280, y = lookup ? 694 : 659;
    drawProp(ctx, 'console', x, y, 7);
    if (t >= cue && t < cue + 1.2) {
      ctx.fillStyle = cyan;
      ctx.fillRect(x + 7, y + 7, 35, 14);
    }
  }
  ctx.restore();
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
    if (state.seconds >= 3.5) {
      ctx.fillStyle = '#1e2637';
      ctx.beginPath();
      ctx.ellipse(x + 4, y + 3, scale * 10.2, scale * .92, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
    drawStation(ctx, state.seconds, reduced);
    drawAvatar(ctx, skin, view);
    const prop = propAt(state, reduced);
    if (prop.mode === 'receipt') {
      const grip = handAnchor(skin, view, 'rightArm');
      const size = state.seconds < 3 ? 48 * (reduced ? 1 : 1 - smooth((state.seconds - 2.12) / .48)) : 32;
      drawReceipt(ctx, grip.x, grip.y - 17, size);
    } else if (prop.mode !== 'none') {
      const grip = handAnchor(skin, view, 'rightArm');
      const q = prop.release;
      drawBlock(ctx, grip.x * (1 - q) + socket.x * q, (grip.y - 15) * (1 - q) + socket.y * q, 24 * (1 - q) + 17 * q);
    }
  };
}
