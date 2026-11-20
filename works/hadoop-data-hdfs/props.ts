import pixels from './props.csv' with { type: 'text' };

// Original pixel art: horizontal rectangles on a shared whole-pixel grid, back to front.
const sprites = { crate: [], console: [] } as Record<'crate' | 'console', { x: number; y: number; w: number; h: number; color: string }[]>;
for (const row of pixels.trim().split(/\r?\n/).slice(1)) {
  const [sprite, x, y, w, h, color] = row.split(',');
  if (sprite !== 'crate' && sprite !== 'console') throw new Error(`Unknown prop: ${sprite}`);
  sprites[sprite].push({ x: +x, y: +y, w: +w, h: +h, color });
}
export function drawProp(ctx: CanvasRenderingContext2D, sprite: keyof typeof sprites, left: number, top: number, unit: number) {
  for (const { x, y, w, h, color } of sprites[sprite]) {
    ctx.fillStyle = color;
    ctx.fillRect(left + x * unit, top + y * unit, w * unit, h * unit);
  }
}
