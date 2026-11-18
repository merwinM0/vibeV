export const W = 1920;
export const H = 1080;
export const color = {
  bg: '#0c0e12', ink: '#fafbff', dim: '#c1c7da', grid: '#222734',
  data: '#54e8ff', ctl: '#ffb653', dep: '#c9cde3', off: '#ff6e78',
  hdfs: '#54e8ff', yarn: '#ffb653', mr: '#58efad', spark: '#d3a3ff',
  hive: '#ffe16a', hbase: '#ff858d', workflow: '#c3b6ff', zk: '#d8e2ee',
};

export const chapterHues = [color.data, color.mr, color.hdfs, color.yarn, color.spark,
  color.hive, color.hbase, color.workflow, color.mr, color.data] as const;

function tint(hue: string, amount: number) {
  const rgb = Number.parseInt(hue.slice(1, 7), 16);
  const channel = (shift: number) => Math.round(23 + ((rgb >> shift & 255) - 23) * amount);
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
}

export type Point = readonly [x: number, y: number];
export type PathKind = 'data' | 'control' | 'dependency';
const sans = '"PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", system-ui, sans-serif';
const mono = '"SFMono-Regular", Consolas, "Liberation Mono", monospace';
export const mix = (a: number, b: number, q: number) => a + (b - a) * q;
export const eased = (t: number, a: number, b: number) => {
  const q = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return q * q * (3 - 2 * q);
};
export const phase = (t: number, length: number) => ((t % length) + length) % length / length;
export const noise = (i: number) => {
  const value = Math.sin(i * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
};

export class Ink {
  motion = true;

  constructor(readonly ctx: CanvasRenderingContext2D) {}

  // Scale/move illustration only; caption and section header stay anchored.
  move(x: number, y: number, dx: number, dy: number, zoom: number, draw: () => void) {
    const c = this.ctx;
    c.save();
    if (this.motion) {
      c.translate(x + dx, y + dy);
      c.scale(zoom, zoom);
      c.translate(-x, -y);
    }
    draw();
    c.restore();
  }

  progress(t: number, from: number, to: number) {
    return this.motion ? eased(t, from, to) : Number(t >= (from + to) / 2);
  }

  impact(x: number, y: number, time: number, hue = color.data, size = 72) {
    if (!this.motion || time < 0 || time >= .62) return;
    const q = eased(time, 0, .62);
    this.alpha((1 - q) * .74, () => {
      const c = this.ctx;
      c.beginPath();
      c.ellipse(x, y, size * (.26 + .74 * q), size * (.10 + .25 * q), 0, 0, Math.PI * 2);
      c.lineWidth = 3;
      c.strokeStyle = hue;
      c.stroke();
    });
  }

  // Uses the actual route geometry. Solid data carries a cube; controls stay dashed.
  transfer(points: readonly Point[], kind: PathKind, t: number, from: number, to: number, size = 27) {
    if (t < from || t >= to) return;
    const q = eased(t, from, to);
    const [x, y] = this.motion ? along(points, q) : points[q < .5 ? 0 : points.length - 1];
    const hue = kind === 'data' ? color.data : color.ctl;
    if (kind === 'data') {
      if (this.motion) {
        for (let i = 3; i > 0; i--) {
          if (q < i * .027) continue;
          const [tx, ty] = along(points, q - i * .027);
          this.alpha(.12 / i, () => this.cube(tx, ty, size, hue));
        }
      }
      this.cube(x, y, size, hue);
    } else {
      this.rect(x - 13, y - 9, 26, 18, '#483929', hue, 3);
      this.line([[x - 6, y - 2], [x + 6, y - 2]], hue, 2);
      this.line([[x - 6, y + 3], [x + 3, y + 3]], hue, 2);
    }
  }

  text(value: string, x: number, y: number, size = 32, fill = color.ink,
    align: CanvasTextAlign = 'left', weight = 600, technical = false) {
    const c = this.ctx;
    c.font = `${weight} ${size}px ${technical ? `${mono}, ${sans}` : sans}`;
    c.textAlign = align;
    c.textBaseline = 'alphabetic';
    c.fillStyle = fill;
    c.fillText(value, x, y);
  }

  alpha(value: number, draw: () => void) {
    const c = this.ctx;
    c.save();
    c.globalAlpha *= value;
    draw();
    c.restore();
  }

  rect(x: number, y: number, w: number, h: number, fill: string, stroke?: string, r = 0, strokeWidth = 2) {
    const c = this.ctx;
    c.beginPath();
    c.roundRect(x, y, w, h, r);
    c.fillStyle = fill;
    c.fill();
    if (stroke) {
      c.lineWidth = strokeWidth;
      c.strokeStyle = stroke;
      c.stroke();
    }
  }

  poly(points: readonly Point[], fill: string, stroke?: string) {
    const c = this.ctx;
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    if (stroke) {
      c.lineWidth = 1.5;
      c.strokeStyle = stroke;
      c.stroke();
    }
  }

  line(points: readonly Point[], fill: string, width = 2, dash: number[] = []) {
    const c = this.ctx;
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.lineWidth = width;
    c.strokeStyle = fill;
    c.lineJoin = 'round';
    c.setLineDash(dash);
    c.stroke();
    c.setLineDash([]);
  }

  dot(x: number, y: number, r: number, fill: string) {
    const c = this.ctx;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
  }

  panel(x: number, y: number, w: number, h: number, hue = color.data, strong = true) {
    this.rect(x, y, w, h, tint(hue, strong ? .19 : .055), `${hue}${strong ? 'ec' : '68'}`, 15, strong ? 3 : 2);
  }

  tag(value: string, x: number, y: number, hue = color.dim, size = 27) {
    const c = this.ctx;
    c.font = `600 ${size}px ${sans}`;
    const width = Math.ceil(c.measureText(value).width) + 32;
    this.rect(x, y, width, size + 22, tint(hue, .13), `${hue}92`, 11);
    this.text(value, x + 16, y + size + 1, size, hue);
    return width;
  }

  route(points: readonly Point[], kind: PathKind, progress: number | null = null, active = true, arrow = true) {
    const hue = kind === 'data' ? color.data : kind === 'control' ? color.ctl : color.dep;
    const dash = kind === 'data' ? [] : kind === 'control' ? [15, 12] : [2, 10];
    this.line(points, `${hue}${active ? 'ff' : '60'}`, active ? 4 : 2.5, dash);
    if (arrow) {
      const [x, y] = points[points.length - 1];
      const [x0, y0] = points[points.length - 2];
      const angle = Math.atan2(y - y0, x - x0);
      this.poly([[x, y], [x - 15 * Math.cos(angle - .5), y - 15 * Math.sin(angle - .5)],
        [x - 15 * Math.cos(angle + .5), y - 15 * Math.sin(angle + .5)]], `${hue}${active ? 'ef' : '55'}`);
    }
    if (progress !== null && active) {
      const [x, y] = along(points, progress);
      if (kind === 'data') this.poly([[x, y - 8], [x + 8, y], [x, y + 8], [x - 8, y]], hue);
      else this.dot(x, y, 5, hue);
    }
  }

  cube(x: number, y: number, s: number, hue = color.data, label = '') {
    const top: Point = [x, y - s * .65];
    const left: Point = [x - s, y - s * .22];
    const right: Point = [x + s, y - s * .22];
    const mid: Point = [x, y + s * .22];
    const edge = `${hue}d8`;
    this.poly([top, right, mid, left], tint(hue, .84), edge);
    this.poly([left, mid, [x, y + s * 1.07], [x - s, y + s * .63]], tint(hue, .53), edge);
    this.poly([mid, right, [x + s, y + s * .63], [x, y + s * 1.07]], tint(hue, .31), edge);
    if (label) this.text(label, x, y + s * 1.07 + 38, 28, hue, 'center', 650, true);
  }

  file(x: number, y: number, s: number, hue = color.data) {
    this.poly([[x, y], [x + s * .66, y], [x + s, y + s * .34], [x + s, y + s * 1.16], [x, y + s * 1.16]], tint(hue, .33), hue);
    this.line([[x + s * .66, y], [x + s * .66, y + s * .34], [x + s, y + s * .34]], `${hue}a8`, 1.5);
    if (s >= 25) {
      this.line([[x + s * .19, y + s * .58], [x + s * .81, y + s * .58]], `${hue}83`, 2);
      this.line([[x + s * .19, y + s * .78], [x + s * .68, y + s * .78]], `${hue}83`, 2);
    }
  }

  legend(items: readonly [PathKind, string][], x = 114, y = 856) {
    items.forEach(([type, label], i) => {
      const left = x + i * 325;
      this.route([[left, y - 10], [left + 55, y - 10]], type, null, true, false);
      this.text(label, left + 73, y, 26, color.dim);
    });
  }
}

export function along(points: readonly Point[], progress: number): Point {
  const lengths = points.slice(1).map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let remaining = lengths.reduce((a, b) => a + b, 0) * Math.min(1, Math.max(0, progress));
  for (let i = 0; i < lengths.length; i++) {
    const length = lengths[i];
    if (length > 0 && remaining <= length) {
      const a = points[i], b = points[i + 1];
      return [mix(a[0], b[0], remaining / length), mix(a[1], b[1], remaining / length)];
    }
    remaining -= length;
  }
  return points[points.length - 1];
}

export type Painter = (p: Ink, t: number, motion: boolean) => void;
