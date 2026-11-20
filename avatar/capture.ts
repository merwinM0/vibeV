import { prepareSkin } from './skin';
import { drawFilm, frameCount, height, width } from '../works/mc-avatar/film';

async function capture() {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D unavailable');
  const image = new Image();
  image.src = './skin.png';
  const [skin] = await Promise.all([prepareSkin(image), document.fonts.ready]);
  for (let frame = 0; frame < frameCount; frame++) {
    drawFilm(ctx, skin, frame);
    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error(`Canvas frame ${frame} could not be encoded`)), 'image/png');
    });
    const reply = await fetch(`./frame/${frame}`, { method: 'POST', body: png });
    if (!reply.ok) throw new Error(`Frame ${frame}: HTTP ${reply.status}`);
  }
}

void capture().catch(async (error: unknown) => {
  await fetch('./failed', { method: 'POST', body: String(error) });
});
