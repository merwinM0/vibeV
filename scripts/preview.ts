import { readdir } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
const files = await readdir(dist, { withFileTypes: true }).catch(() => {
  throw new Error('Run bun run build before starting the preview.');
});
const routes = new Map(files.filter((file) => file.isFile()).map((file) => [`/${file.name}`, new URL(file.name, dist)]));
if (!routes.has('/index.html')) throw new Error('Missing dist/index.html. Run bun run build.');

const server = Bun.serve({
  hostname: '127.0.0.1',
  port: process.env.PORT ?? 4173,
  fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const pathname = new URL(request.url).pathname;
    const fileURL = routes.get(pathname === '/' ? '/index.html' : pathname);
    if (!fileURL) return new Response('Not found', { status: 404 });
    const file = Bun.file(fileURL);
    return new Response(request.method === 'HEAD' ? null : file, { headers: { 'Content-Type': file.type } });
  },
});

console.log(`Hadoop Vibe: ${server.url}`);
