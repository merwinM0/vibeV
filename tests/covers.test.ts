import { expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { coverLimit } from '../covers/model';
import { coverRoutes } from '../scripts/cover-routes';
import { coverStore, exportCovers, identifyCover, workSlugs } from '../scripts/covers';

const png = Uint8Array.fromBase64('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jG3sAAAAASUVORK5CYII=');
const slugs = workSlugs(['index.html', 'works/hadoop/index.html', 'works/not-a-page/extra/index.html', 'works/Bad_Identifier/index.html']);

test('the live cover API uploads, persists, replaces and removes a work cover', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'vibev-covers-'));
  const path = join(temp, 'db/covers.sqlite');
  const store = coverStore(path);
  await store.initialize();
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', development: false,
    maxRequestBodySize: coverLimit, routes: coverRoutes(store, slugs), fetch: () => new Response(null, { status: 404 }) });
  try {
    const origin = server.url.origin;
    const request = (path: string, init?: RequestInit) => fetch(new URL(path, origin), init);
    const cover = '/api/covers/hadoop';
    const listing = '/covers/index.json';
    const put = (body: BodyInit, type = 'image/png'): RequestInit => ({ method: 'PUT', body, headers: { Origin: origin, 'Content-Type': type } });
    expect(await (await request(listing)).json()).toEqual({ editable: true, images: {} });
    expect((await request('/covers/hadoop.png')).status).toBe(404);
    expect((await request('/db/covers.sqlite')).status).toBe(404);
    expect((await request('/api/covers/not-a-page', put(png))).status).toBe(404);
    expect((await request(cover, { ...put(png), headers: { Origin: 'https://example.org', 'Content-Type': 'image/png' } })).status).toBe(403);
    expect((await request(cover)).headers.get('Allow')).toBe('PUT, DELETE');
    expect((await request(cover, put(png, 'image/svg+xml'))).status).toBe(415);
    expect((await request(cover, put('not a PNG'))).status).toBe(415);
    expect((await request(cover, put(new Uint8Array(coverLimit + 1)))).status).toBe(413);
    expect((await request(cover, put(png))).status).toBe(204);
    expect(await (await request(listing)).json()).toEqual({ editable: true, images: { hadoop: 'png' } });
    expect(coverStore(path).get('hadoop')?.bytes).toEqual(png);

    const picture = await request('/covers/hadoop.png');
    expect(picture.headers.get('Content-Type')).toBe('image/png');
    expect(picture.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(picture.headers.get('Cache-Control')).toBe('no-store');
    expect(await picture.bytes()).toEqual(png);
    const head = await request('/covers/hadoop.png', { method: 'HEAD' });
    expect(head.status).toBe(200);
    expect(await head.text()).toBe('');

    const second = png.slice();
    second[second.length - 1] = 1;
    expect((await request(cover, put(second))).status).toBe(204);
    const dist = join(temp, 'dist');
    await exportCovers(dist, slugs, path);
    expect(await Bun.file(join(dist, 'covers/index.json')).json()).toEqual({ editable: false, images: { hadoop: 'png' } });
    expect(await Bun.file(join(dist, 'covers/hadoop.png')).bytes()).toEqual(second);
    expect(await Bun.file(join(dist, 'db/covers.sqlite')).exists()).toBe(false);

    expect((await request(cover, { method: 'DELETE', headers: { Origin: origin } })).status).toBe(204);
    expect(await (await request(listing)).json()).toEqual({ editable: true, images: {} });
    expect((await request('/covers/hadoop.png')).status).toBe(404);
  } finally {
    await server.stop(true);
    await rm(temp, { recursive: true, force: true });
  }
});

test('cover signatures must match the declared format', () => {
  expect(identifyCover(png, 'image/jpeg')).toBeUndefined();
  expect(identifyCover(Uint8Array.of(255, 216, 255, 224), 'image/jpeg')).toBe('jpg');
  expect(identifyCover(new TextEncoder().encode('RIFF1234WEBP'), 'image/webp')).toBe('webp');
  expect(identifyCover(new TextEncoder().encode('RIFF1234WAVE'), 'image/webp')).toBeUndefined();
});
