import { drawAvatar } from '../../avatar/draw';
import { ease, phaseLength, poseAt } from '../../avatar/motion';
import { parts, skinUV } from '../../avatar/skin';
import type { Part, Skin } from '../../avatar/skin';
import { actionFrame, captionCues, fps } from './narration';

export { fps };
export const width = 1920;
export const height = 1080;
export const frameCount = 900;
export const duration = frameCount / fps;
export const shots = [
  { start: 0, title: '一张皮肤，怎么走起来？' },
  { start: 84, title: '先找出六个部件' },
  { start: 288, title: '抬手是绕肩旋转' },
  { start: 469, title: '走路时，两组肢体交替' },
  { start: 672, title: '一张皮肤，演下一幕' },
] as const;

export function sampleFilm(requestedFrame: number) {
  const frame = Number.isFinite(requestedFrame) ? Math.max(0, Math.min(frameCount - 1, Math.floor(requestedFrame))) : 0;
  let index = 0;
  while (index + 1 < shots.length && shots[index + 1].start <= frame) index++;
  const shot = shots[index];
  const caption = captionCues.find(({ start, end }) => start <= frame && frame < end)?.caption ?? '';
  return { frame, index, shot, caption, time: (frame - shot.start) / fps };
}

const palette = { paper: '#ebf5f7', panel: '#f8fbfc', ink: '#122e3a', accent: '#245e64', muted: '#29525e', grid: '#dcebed', rule: '#bad6d7', sand: '#f7e7c7', darkSand: '#77541e' };
const partNames: Record<Part, string> = { head: '头', body: '躯干', rightArm: '右臂', leftArm: '左臂', rightLeg: '右腿', leftLeg: '左腿' };
const white = '#ffffff';
const textFont = '"Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif';

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, fill = palette.ink, weight = 600) {
  ctx.font = `${weight} ${size}px ${textFont}`;
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, radius = 0, stroke?: string) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

function trace(ctx: CanvasRenderingContext2D, points: readonly (readonly [number, number])[], color = palette.accent, weight = 3) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.lineWidth = weight;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function ground(ctx: CanvasRenderingContext2D, x: number, y: number, span = 180) {
  ctx.beginPath();
  ctx.ellipse(x, y, span, 20, 0, 0, 2 * Math.PI);
  ctx.fillStyle = '#deeaec';
  ctx.fill();
}

function atlas(ctx: CanvasRenderingContext2D, skin: Skin, x: number, y: number, pixel: number, part?: Part) {
  const size = 64 * pixel;
  rect(ctx, x - 9, y - 9, size + 18, size + 18, white, 17, palette.rule);
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
    ctx.fillStyle = (row + col) % 2 ? '#edf3f5' : '#dde8ea';
    ctx.fillRect(x + col * 8 * pixel, y + row * 8 * pixel, 8 * pixel, 8 * pixel);
  }
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(skin.image, x, y, size, size);
  ctx.restore();
  if (part) {
    ctx.strokeStyle = palette.darkSand;
    ctx.lineWidth = 3;
    for (const [u, v, w, h] of Object.values(skinUV(part, skin.model))) {
      ctx.fillStyle = '#ffe49955';
      ctx.fillRect(x + u * pixel, y + v * pixel, w * pixel, h * pixel);
      ctx.strokeRect(x + u * pixel, y + v * pixel, w * pixel, h * pixel);
    }
  }
}

function opening(ctx: CanvasRenderingContext2D, skin: Skin, t: number) {
  const stop = ease(.15, 2.45, t);
  atlas(ctx, skin, 219, 340, 5.5);
  label(ctx, '64 × 64 像素', 219, 763, 32, palette.muted, 650);
  trace(ctx, [[665, 518], [866, 518], [846, 500], [866, 518], [846, 536]], palette.accent, 4);
  trace(ctx, [[994, 799], [1675, 799]], palette.rule);
  const x = 1514 - stop * 282;
  ground(ctx, x, 793, 144);
  drawAvatar(ctx, skin, { x, y: 791, scale: 14.7, yaw: -.53 + stop * .64, action: 'walk', time: t, intensity: 1 - ease(1.9, 2.65, t) });
  ctx.save();
  ctx.textAlign = 'center';
  label(ctx, '完整角色', x, 851, 30, palette.muted);
  ctx.restore();
}

function partsScene(ctx: CanvasRenderingContext2D, skin: Skin, t: number, frame: number) {
  // Head, torso and then the four limbs follow the order of the narration.
  const index = actionFrame.parts.reduce((last, at, i) => frame >= at ? i : last, -1);
  const part = parts[index];
  atlas(ctx, skin, 203, 304, 7.25, part);
  label(ctx, '皮肤展开图', 202, 824, 30, palette.muted);
  for (let i = 0; i < parts.length; i++) {
    const x = 774, y = 324 + 73 * i;
    rect(ctx, x, y, 224, 54, i === index ? palette.sand : palette.paper, 9, i === index ? '#dfc088' : undefined);
    label(ctx, `${i + 1}  ${partNames[parts[i]]}`, x + 20, y + 37, 26, i === index ? palette.darkSand : palette.muted, 700);
  }
  ground(ctx, 1361, 805);
  drawAvatar(ctx, skin, { x: 1361, y: 803, scale: 14.8, yaw: -.32 + .76 * ease(.1, 5.5, t), action: 'look', time: t * .85, intensity: .4, highlight: part });
}

function hingeScene(ctx: CanvasRenderingContext2D, skin: Skin, _t: number, frame: number) {
  const actionTime = Math.min(1.5, .18 + Math.max(0, (frame - actionFrame.shoulder) / fps));
  const angle = poseAt('point', actionTime).angles.leftArm[2];
  const x = 1196, y = 475, size = 187;
  ground(ctx, 588, 808);
  drawAvatar(ctx, skin, { x: 588, y: 803, scale: 15.7, yaw: .20, action: 'point', time: actionTime });
  rect(ctx, 968, 316, 665, 465, palette.paper, 21, palette.rule);
  label(ctx, '同一条手臂', 1017, 395, 38, palette.ink, 730);
  label(ctx, '换的是绕肩的角度', 1017, 727, 29, palette.muted);
  ctx.setLineDash([10, 9]);
  trace(ctx, [[x, y], [x, y + size]], '#65868a', 5);
  ctx.setLineDash([]);
  const end = [x + Math.sin(angle) * size, y + Math.cos(angle) * size] as const;
  trace(ctx, [[x, y], end], palette.accent, 28);
  rect(ctx, x - 13, y - 13, 26, 26, '#f0c774', 13, palette.darkSand);
  label(ctx, '肩关节', 1303, 610, 27, palette.muted);
  trace(ctx, [[1290, 600], [1256, 600], [x + 14, y + 14]], palette.rule, 3);
}

function walkScene(ctx: CanvasRenderingContext2D, skin: Skin, _t: number, frame: number) {
  // Hold each opposite-limb pose until the narration calls for the next step.
  const step = ease(actionFrame.firstStep, actionFrame.firstStep + 24, frame);
  const swap = ease(actionFrame.nextStep, actionFrame.nextStep + 27, frame);
  const stride = phaseLength * (.25 * step + .5 * swap);
  const x = 540 + 82 * step + 120 * swap;
  for (let i = 0; i < 13; i++) {
    const tick = 228 + i * 61;
    trace(ctx, [[tick, 793], [tick, 807]], palette.rule, 2);
  }
  trace(ctx, [[210, 800], [980, 800]], palette.rule, 3);
  ground(ctx, x, 794, 137);
  drawAvatar(ctx, skin, { x, y: 794, scale: 14.5, yaw: 1.01, action: 'walk', time: stride });
  const pitch = poseAt('walk', stride).angles.leftLeg[0];
  const pair = Math.abs(pitch) < .001 ? -1 : pitch < 0 ? 0 : 1;
  rect(ctx, 1060, 348, 600, 389, palette.paper, 20, palette.rule);
  label(ctx, '此刻向前', 1110, 421, 36, palette.ink, 730);
  ['左腿 ＋ 右臂', '右腿 ＋ 左臂'].forEach((value, i) => {
    const y = 458 + 112 * i;
    rect(ctx, 1108, y, 504, 89, i === pair ? palette.accent : white, 10, palette.rule);
    label(ctx, i === pair ? `▶  ${value}` : `    ${value}`, 1136, y + 58, 35, i === pair ? white : palette.muted, 700);
  });
}

function closing(ctx: CanvasRenderingContext2D, skin: Skin, t: number, frame: number) {
  ground(ctx, 577, 814);
  drawAvatar(ctx, skin, { x: 577, y: 811, scale: 15.8, yaw: .47 * (1 - ease(0, .55, t)), action: 'nod', time: .2 + Math.max(0, (frame - actionFrame.nod) / fps) });
  if (frame < actionFrame.texture) return;
  rect(ctx, 903, 342, 820, 423, palette.accent, 23);
  label(ctx, '贴图定外观', 972, 483, 72, white, 760);
  trace(ctx, [[971, 534], [1639, 534]], '#70a0a4', 2);
  if (frame >= actionFrame.joints) label(ctx, '关节定动作', 972, 652, 72, white, 760);
}

const painters = [opening, partsScene, hingeScene, walkScene, closing];

export function drawFilm(ctx: CanvasRenderingContext2D, skin: Skin, frame: number) {
  const { index, shot, caption, time, frame: safeFrame } = sampleFilm(frame);
  ctx.save();
  rect(ctx, 0, 0, width, height, palette.paper);
  ctx.fillStyle = '#cadfe3';
  for (let x = 108; x < 1820; x += 48) for (let y = 224; y < 918; y += 48) ctx.fillRect(x, y, 2, 2);
  rect(ctx, 114, 216, 1692, 676, palette.panel, 25, palette.rule);
  trace(ctx, [[114, 120], [1806, 120]], palette.rule, 2);
  label(ctx, 'vibeV 图解', 114, 92, 30, palette.muted, 700);
  label(ctx, `0${index + 1} / 05`, 1690, 92, 27, palette.muted);
  label(ctx, shot.title, 114, 189, 53, palette.ink, 750);
  painters[index](ctx, skin, time, safeFrame);
  if (caption) {
    ctx.font = `700 44px ${textFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4; // Painting the fill afterwards leaves a 2 px outer outline at 1080p.
    ctx.strokeStyle = '#000';
    ctx.fillStyle = white;
    ctx.strokeText(caption, width / 2, 991);
    ctx.fillText(caption, width / 2, 991);
  }
  ctx.restore();
}
