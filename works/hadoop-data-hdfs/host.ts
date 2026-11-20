import { drawAvatar, handAnchor } from '../../avatar/draw';
import { prepareSkin } from '../../avatar/skin';
import { hostPose, propAt } from './acting';
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

function drawStation(ctx: CanvasRenderingContext2D, state: SampleFrame, hand: { x: number; y: number }, reduced: boolean) {
  const { seconds } = state;
  const after = seconds >= 31.4;
  const first = seconds >= 3.9 && seconds < 5.8;
  const cue = first ? storyCues.open : seconds < 57 ? storyCues.lookup : storyCues.retry;
  const setup = first ? [434, 671, '打开操作台'] as const : [1631, 789, seconds < 67 ? '查位置' : '改读乙'] as const;
  const [x, y, label] = setup;
  if (after) {
    const alpha = smooth((seconds - 31.4) / 2.5);
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = '#283348'; ctx.strokeStyle = '#5f6e89'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(1668, 812, 185, 44, 13); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#333c56'; ctx.fillRect(1688, 856, 12, 30); ctx.fillRect(1823, 856, 12, 30);
    ctx.restore();
  }
  if (!first && (seconds < 38.6 || seconds >= 82) || after && seconds >= 46 && seconds < 67) return;
  const press = seconds >= cue && seconds < cue + 1.05;
  const appear = reduced ? 1 : first ? smooth((seconds - 3.9) / .24) * smooth((5.8 - seconds) / .48) : smooth((seconds - 38.6) / .54);
  ctx.save(); ctx.globalAlpha = appear;
  ctx.strokeStyle = press ? cyan : '#6b8399'; ctx.fillStyle = press ? '#1c4354' : '#1b293d'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(x - 66, y - 23, 132, 46, 11); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#dfedf5'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, y + 1);
  if (press && !reduced) {
    const q = (seconds - cue) / 1.05;
    ctx.globalAlpha = (1 - q) * .8;
    ctx.strokeStyle = cyan;
    ctx.beginPath(); ctx.ellipse(x, y, 66 + q * 26, 24 + q * 14, 0, 0, 2 * Math.PI); ctx.stroke();
    ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(hand.x, hand.y); ctx.lineTo(x, y); ctx.stroke();
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
    drawStation(ctx, state, handAnchor(skin, view, 'rightArm'), reduced);
    if (state.seconds >= 3.5) {
      ctx.fillStyle = '#1e2637';
      ctx.beginPath();
      ctx.ellipse(x + 4, y + 3, scale * 10.2, scale * .92, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
    drawAvatar(ctx, skin, view);
    const prop = propAt(state, reduced);
    if (prop.mode === 'receipt') {
      const grip = handAnchor(skin, view, 'rightArm');
      drawReceipt(ctx, grip.x, grip.y - 17, 48 * (1 - smooth((state.seconds - 2.12) / .48)));
    } else if (prop.mode !== 'none') {
      const grip = handAnchor(skin, view, 'rightArm');
      const q = prop.release;
      drawBlock(ctx, grip.x * (1 - q) + socket.x * q, (grip.y - 15) * (1 - q) + socket.y * q, 24 * (1 - q) + 17 * q);
    }
  };
}
