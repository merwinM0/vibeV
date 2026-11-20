import { fileURLToPath } from 'node:url';
import { coverLimit } from '../covers/model';
import { coverRoutes } from './cover-routes';
import { coverStore, databasePath, workSlugs } from './covers';
import { redirectTo } from './pages';

const dist = new URL('../dist/', import.meta.url);
if (!await Bun.file(new URL('index.html', dist)).exists()) throw new Error('Run bun run build before starting the preview.');
const files = new Map<string, URL>();
for await (const path of new Bun.Glob('**/*').scan(fileURLToPath(dist))) {
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  files.set(`/${encoded}`, new URL(encoded, dist));
}

const store = coverStore(databasePath);
await store.initialize();
const slugs = workSlugs(Array.from(files.keys(), (path) => path.slice(1)));
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: process.env.PORT ?? 4173,
  development: false,
  maxRequestBodySize: coverLimit,
  routes: coverRoutes(store, slugs),
  fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const { pathname, search } = new URL(request.url);
    if (!pathname.endsWith('/') && files.has(`${pathname}/index.html`)) {
      return redirectTo(`${pathname}/${search}`);
    }
    const fileURL = files.get(pathname.endsWith('/') ? `${pathname}index.html` : pathname);
    if (!fileURL) return new Response('Not found', { status: 404 });
    const file = Bun.file(fileURL);
    return new Response(request.method === 'HEAD' ? null : file, { headers: { 'Content-Type': file.type } });
  },
});

console.log(`Vibe 图解：${server.url}`);
