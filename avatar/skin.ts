export const skinSize = 64;
export type Model = 'classic' | 'slim';
export type Skin = { image: HTMLImageElement; model: Model };
export const parts = ['head', 'body', 'rightArm', 'leftArm', 'rightLeg', 'leftLeg'] as const;
export type Part = typeof parts[number];
export type Rect = readonly [x: number, y: number, width: number, height: number];

const origins = {
  head: [[0, 0], [32, 0]], body: [[16, 16], [16, 32]],
  rightArm: [[40, 16], [40, 32]], leftArm: [[32, 48], [48, 48]],
  rightLeg: [[0, 16], [0, 32]], leftLeg: [[16, 48], [0, 48]],
} as const;

export function dimensions(part: Part, model: Model) {
  const arm = part.endsWith('Arm');
  return part === 'head' ? [8, 8, 8] as const :
    [part === 'body' ? 8 : arm && model === 'slim' ? 3 : 4, 12, 4] as const;
}

export function skinUV(part: Part, model: Model, outer = false) {
  const [u, v] = origins[part][outer ? 1 : 0];
  const [w, h, d] = dimensions(part, model);
  return {
    top: [u + d, v, w, d], bottom: [u + d + w, v, w, d],
    right: [u, v + d, d, h], front: [u + d, v + d, w, h],
    left: [u + d + w, v + d, d, h], back: [u + 2 * d + w, v + d, w, h],
  } satisfies Record<string, Rect>;
}

export function detectModel(rgba: ArrayLike<number>): Model {
  if (rgba.length !== skinSize ** 2 * 4) throw new RangeError('Expected 64×64 RGBA values');
  // On a slim atlas the last two columns of both base arm strips are unused.
  for (const [left, top] of [[54, 20], [46, 52]]) {
    for (let y = top; y < top + 12; y++) {
      for (let x = left; x < left + 2; x++) {
        if (rgba[(x + y * skinSize) * 4 + 3] !== 0) return 'classic';
      }
    }
  }
  return 'slim';
}

export async function prepareSkin(image: HTMLImageElement): Promise<Skin> {
  await image.decode();
  if (image.naturalWidth !== skinSize || image.naturalHeight !== skinSize) throw new RangeError('请选择 64×64 的皮肤展开图。');
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = skinSize;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('无法读取贴图。');
  ctx.drawImage(image, 0, 0);
  return { image, model: detectModel(ctx.getImageData(0, 0, skinSize, skinSize).data) };
}
