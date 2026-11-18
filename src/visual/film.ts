import { chapters, type scenes, type SceneId } from '../timeline';
import { color, eased, H, Ink, noise, W, type Painter } from './ink';
import { common, directories, ecosystem, intake, opening, ordersTable, smallFiles } from './intro';
import { acrossRacks, highAvailability, outage, pipeline, readPath, recover, split, warehouse, writePath } from './hdfs';

const paintings = {
  S01: opening, S02: intake, S03: ecosystem, S04: common,
  S05: ordersTable, S06: directories, S07: smallFiles,
  S08: warehouse, S09: split, S10: writePath, S11: pipeline, S12: acrossRacks,
  S13: readPath, S14: outage, S15: recover, S16: highAvailability,
} satisfies Record<SceneId, Painter>;

type Scene = typeof scenes[number];

function paintBackdrop(p: Ink) {
  p.rect(0, 0, W, H, color.bg);
  p.glow(1150, 582, 1180, '#213b564f');
  for (let x = 96; x <= 1824; x += 48) p.line([[x, 143], [x, 884]], '#46688c14', 1);
  for (let y = 161; y < 885; y += 48) p.line([[96, y], [1824, y]], '#46688c16', 1);
  for (let i = 0; i < 1500; i++) {
    p.dot(noise(i * 3) * W, noise(i * 3 + 1) * H, .45 + noise(i * 3 + 2) * 1.1, i % 6 === 0 ? '#03081476' : '#b1c6dc0e');
  }
  const shade = p.ctx.createLinearGradient(0, 849, 0, H);
  shade.addColorStop(0, '#0b102000');
  shade.addColorStop(.66, '#0b1020d9');
  shade.addColorStop(1, '#090e1a');
  p.rect(0, 849, W, H - 849, shade);
  p.line([[96, 142], [1824, 142]], '#8fb9d148', 1.5);
  p.line([[96, 892], [1824, 892]], '#8fb9d125', 1.5);
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
    const chapter = chapters.find((part) => part.id === scene.chapter);
    p.ctx.drawImage(this.backdrop, 0, 0);
    p.rect(97, 97, 48, 26, '#76dcfa26', '#76dcfa67', 3);
    p.text(scene.chapter, 121, 117, 19, color.data, 'center', 700, true);
    p.text(chapter?.title ?? '', 163, 118, 27, color.dim);
    p.text(scene.id, 1824, 118, 27, color.data, 'right', 680, true);

    const position = scene.id === 'S01' ? 228 : 245;
    scene.title.split('\n').forEach((text, i) => p.text(text, 107, position + i * 87, scene.id === 'S01' ? 77 : 64, color.ink, 'left', 760));
    p.ctx.save();
    p.ctx.beginPath();
    p.ctx.rect(96, 282, 1728, 607);
    p.ctx.clip();
    p.alpha(scene.id === 'S01' || !motion ? 1 : .83 + .17 * eased(t, 0, .46), () => paintings[scene.id](p, t, motion));
    p.ctx.restore();
  }
}
