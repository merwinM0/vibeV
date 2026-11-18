import { chapters, type scenes, type SceneId } from '../timeline';
import { chapterHues, color, H, Ink, W, type Painter } from './ink';
import { common, directories, ecosystem, intake, opening, ordersTable, smallFiles } from './intro';
import { acrossRacks, highAvailability, outage, pipeline, readPath, recover, split, warehouse, writePath } from './hdfs';
import { compute } from './compute';
import { query } from './query';
import { operations } from './operations';

const paintings = {
  S01: opening, S02: intake, S03: ecosystem, S04: common,
  S05: ordersTable, S06: directories, S07: smallFiles,
  S08: warehouse, S09: split, S10: writePath, S11: pipeline, S12: acrossRacks,
  S13: readPath, S14: outage, S15: recover, S16: highAvailability,
  ...compute, ...query, ...operations,
} satisfies Record<SceneId, Painter>;

type Scene = typeof scenes[number];

function paintBackdrop(p: Ink) {
  p.rect(0, 0, W, H, color.bg);
  p.rect(96, 282, 1728, 607, '#10131a', undefined, 22);
  for (let x = 144; x < 1824; x += 48) p.line([[x, 282], [x, 889]], color.grid, 1);
  for (let y = 330; y < 889; y += 48) p.line([[96, y], [1824, y]], color.grid, 1);
  p.line([[96, 142], [1824, 142]], '#343a47', 2);
}

export class Film {
  private readonly backdrop: HTMLCanvasElement;
  private readonly p: Ink;

  constructor(ctx: CanvasRenderingContext2D) {
    this.p = new Ink(ctx);
    this.backdrop = document.createElement('canvas');
    this.backdrop.width = W;
    this.backdrop.height = H;
    const base = this.backdrop.getContext('2d', { alpha: false });
    if (!base) throw new Error('Failed to create the stage background');
    paintBackdrop(new Ink(base));
  }

  draw(scene: Scene, t: number, motion: boolean) {
    const p = this.p;
    p.motion = motion;
    const chapter = chapters.find((part) => part.id === scene.chapter);
    p.ctx.drawImage(this.backdrop, 0, 0);
    const hue = chapterHues[Number(scene.chapter)] ?? color.data;
    p.rect(97, 96, 48, 30, hue, undefined, 7);
    p.text(scene.chapter, 121, 118, 20, color.bg, 'center', 800, true);
    p.text(chapter?.title ?? '', 163, 120, 27, color.dim);
    p.text(scene.id, 1824, 118, 26, hue, 'right', 700, true);

    const position = scene.id === 'S01' ? 228 : 245;
    scene.title.split('\n').forEach((text, i) => p.text(text, 107, position + i * 87, scene.id === 'S01' ? 77 : 64, color.ink, 'left', 760));
    p.ctx.save();
    p.ctx.beginPath();
    p.ctx.rect(96, 282, 1728, 607);
    p.ctx.clip();
    paintings[scene.id](p, t, motion);
    p.ctx.restore();
  }
}
