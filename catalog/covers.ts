import { imagePath, readCoverIndex } from '../covers/model';

async function showCovers() {
  const { images } = await readCoverIndex('./');
  for (const tile of document.querySelectorAll<HTMLElement>('[data-cover]')) {
    const slug = tile.dataset.cover;
    if (!slug) continue;
    const format = images.get(slug);
    if (!format) {
      tile.replaceChildren();
      continue;
    }
    const image = new Image();
    image.alt = '';
    image.decoding = 'async';
    image.addEventListener('error', () => image.remove(), { once: true });
    image.src = `./${imagePath(slug, format)}`;
    tile.replaceChildren(image);
  }
}

function refreshCovers() {
  void showCovers().catch(() => { /* The gray placeholder is also the offline fallback. */ });
}

refreshCovers();
window.addEventListener('pageshow', (event) => {
  if (event.persisted) refreshCovers();
});
