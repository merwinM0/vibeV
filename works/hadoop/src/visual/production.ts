import { color, mix, type Ink, type PathKind, type Point } from './ink';
import { orderDate, orders } from '../orders';

export const { data, ctl, dim, ink, mr, spark, hive, hbase, off } = color;
export type Box = { x: number; y: number; w: number; title: string; note?: string; hue?: string };

export function reveal(p: Ink, t: number, at: number, draw: () => void, x = 960, y = 545) {
  const q = p.progress(t, at, at + .55);
  if (q > 0) p.alpha(q, () => p.move(x, y, 0, 46 * (1 - q), .92 + .08 * q, draw));
}

export function box(p: Ink, b: Box, live = true, height = 114) {
  const { x, y, w, title, note, hue = data } = b;
  p.panel(x, y, w, height, hue, live);
  p.text(title, x + 22, y + (note ? 46 : height / 2 + 11), title.length > 17 ? 26 : 32, hue);
  if (note) p.text(note, x + 22, y + 86, 26, live ? ink : dim);
}

export function route(p: Ink, t: number, from: number, to: number, points: readonly Point[], kind: PathKind, size = 24) {
  p.route(points, kind, null, t >= from);
  p.transfer(points, kind, t, from, to, size);
  const [x, y] = points[points.length - 1];
  p.impact(x, y, t - to, kind === 'data' ? data : ctl, 82);
}

export function lanes(p: Ink, x: number, y: number, w: number, h: number, label: string, hue = data) {
  p.panel(x, y, w, h, hue, false);
  p.text(label, x + 23, y + 40, 28, hue);
  p.line([[x + 23, y + 54], [x + w - 23, y + 54]], `${hue}48`);
}

export function gauge(p: Ink, x: number, y: number, w: number, label: string, q: number, hue = ctl) {
  p.text(label, x, y, 27, dim);
  p.rect(x, y + 13, w, 13, '#26394a', undefined, 2);
  p.rect(x, y + 13, w * q, 13, hue, undefined, 2);
  for (let i = 1; i < 8; i++) p.line([[x + i * w / 8, y + 12], [x + i * w / 8, y + 27]], '#101b2d99');
}

export function sign(p: Ink, label: string, x: number, y: number, hue: string) {
  p.tag(label, x, y, hue, 26);
}

export function chain(p: Ink, t: number, boxes: readonly Box[], kind: PathKind, speed = 1.15) {
  boxes.slice(1).forEach((b, i) => {
    const prev = boxes[i];
    route(p, t, .45 + i * speed, .45 + (i + 1) * speed, [[prev.x + prev.w, prev.y + 57], [b.x, b.y + 57]], kind);
  });
  boxes.forEach((b, i) => box(p, b, i === 0 || t >= .45 + i * speed));
}

export const summary = [...new Set(orders.map((order) => order.province))].map((province) => {
  const rows = orders.filter((order) => order.province === province);
  return { province, count: rows.length, total: rows.reduce((sum, order) => sum + Number(order.amount), 0), hue: province === '江苏' ? mr : hive };
});

export const sqlLines = [
  'SELECT province, COUNT(*) AS orders,',
  '       SUM(amount) AS gmv',
  'FROM dwd_orders',
  `WHERE dt = '${orderDate}'`,
  'GROUP BY province;',
];

export function code(p: Ink, x: number, y: number, w: number, title: string, lines: readonly string[], active = -1, hue = hive) {
  lanes(p, x, y, w, 82 + lines.length * 52, title, hue);
  lines.forEach((line, i) => {
    const row = y + 73 + i * 52;
    if (active === i) p.rect(x + 16, row - 2, w - 32, 47, `${hue}19`, `${hue}72`, 3);
    p.text(line, x + 29, row + 33, 29, active === i ? hue : ink, 'left', 650, true);
  });
}

export function table(p: Ink, x: number, y: number, w: number, t: number, title = '查询结果 / 样例') {
  lanes(p, x, y, w, 273, title, hive);
  const offset = [27, Math.round(w * .39), Math.round(w * .68)];
  ['province', 'orders', 'gmv'].forEach((v, i) => p.text(v, x + offset[i], y + 103, 26, dim, 'left', 600, true));
  summary.forEach((row, i) => reveal(p, t, i * .48, () => {
    const yy = y + 167 + i * 62;
    p.line([[x + 25, yy - 37], [x + w - 25, yy - 37]], '#7d9db74d');
    p.text(row.province, x + offset[0], yy, 31, row.hue);
    p.text(String(row.count), x + offset[1], yy, 33, ink, 'left', 700, true);
    p.text(String(row.total), x + offset[2], yy, 33, row.hue, 'left', 700, true);
  }, x + w / 2, y + 180));
}

export function bars(p: Ink, x: number, y: number, w: number, h: number, t: number) {
  lanes(p, x, y, w, h, '销售额 GMV / 样例', hive);
  const floor = y + h - 77;
  p.line([[x + 35, floor], [x + w - 35, floor]], '#8caac17d');
  summary.forEach((r, i) => {
    const xx = x + w * (i === 0 ? .31 : .69);
    const q = p.progress(t, i * .3, 1.5 + i * .3);
    const top = floor - (h - 165) * r.total / 175 * q;
    const width = Math.min(144, w * .22);
    p.rect(xx - width / 2, top, width, Math.max(1, floor - top), r.hue, undefined, 8);
    p.text(String(Math.round(q * r.total)), xx, top - 17, 35, r.hue, 'center', 740, true);
    p.text(`${r.province} / ${r.count} 单`, xx, floor + 43, 27, ink, 'center');
  });
}

export function folio(p: Ink, x: number, y: number, heading: string, copy: string, hue = data) {
  p.file(x, y, 85, hue);
  p.text(heading, x + 110, y + 41, 33, hue);
  p.text(copy, x + 110, y + 82, 27, ink);
}

export function kv(p: Ink, x: number, y: number, label: string, hue: string, w = 220) {
  p.rect(x, y, w, 58, `${hue}29`, hue, 12);
  p.text(label, x + w / 2, y + 40, 29, hue, 'center', 670);
}

export function slide(p: Ink, t: number, from: number, to: number, a: Point, b: Point, draw: (x: number, y: number) => void) {
  const q = p.progress(t, from, to);
  draw(mix(a[0], b[0], q), mix(a[1], b[1], q));
}
