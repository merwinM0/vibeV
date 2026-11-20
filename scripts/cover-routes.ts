import { coverLimit, formatTypes } from '../covers/model';
import { identifyCover } from './covers';
import type { coverStore } from './covers';

const noCache = { 'Cache-Control': 'no-store' };
const problem = (status: number, error: string, headers = {}) => Response.json({ error }, {
  status, headers: { ...noCache, ...headers },
});

export function coverRoutes(store: ReturnType<typeof coverStore>, slugs: Set<string>) {
  return {
    '/covers/*': (request: Request) => {
      const { pathname } = new URL(request.url);
      const head = request.method === 'HEAD';
      if (!head && request.method !== 'GET') return problem(405, 'Method not allowed', { Allow: 'GET, HEAD' });
      if (pathname === '/covers/index.json') {
        const index = Response.json({ editable: true, images: store.index(slugs) }, { headers: noCache });
        return head ? new Response(null, { headers: index.headers }) : index;
      }
      const match = /^\/covers\/([a-z0-9-]+)\.(png|jpg|webp)$/.exec(pathname);
      if (!match || !slugs.has(match[1])) return problem(404, 'Cover not found');
      const cover = store.get(match[1]);
      if (!cover || cover.format !== match[2]) return problem(404, 'Cover not found');
      return new Response(head ? null : cover.bytes, { headers: {
        ...noCache, 'Content-Type': formatTypes[cover.format], 'X-Content-Type-Options': 'nosniff',
        'Content-Length': String(cover.bytes.length),
      } });
    },
    '/api/covers/*': async (request: Request) => {
      const url = new URL(request.url);
      const slug = url.pathname.slice('/api/covers/'.length);
      if (!slugs.has(slug)) return problem(404, 'Work not found');
      if (request.method !== 'PUT' && request.method !== 'DELETE') {
        return problem(405, 'Method not allowed', { Allow: 'PUT, DELETE' });
      }
      // This editor is for the loopback server only; reject cross-origin browser writes.
      if (!['127.0.0.1', 'localhost'].includes(url.hostname) || request.headers.get('Origin') !== url.origin) {
        return problem(403, 'Local same-origin request required');
      }
      if (request.method === 'DELETE') {
        store.remove(slug);
      } else {
        const mime = request.headers.get('Content-Type');
        if (!Object.values<string>(formatTypes).some((type) => type === mime)) return problem(415, 'Unsupported image type');
        if (Number(request.headers.get('Content-Length')) > coverLimit) return problem(413, 'Image exceeds 5 MB');
        const bytes = await request.bytes();
        if (bytes.length > coverLimit) return problem(413, 'Image exceeds 5 MB');
        const format = identifyCover(bytes, mime);
        if (!format) return problem(415, 'Image content does not match its type');
        store.put(slug, { format, bytes });
      }
      return new Response(null, { status: 204, headers: noCache });
    },
  };
}
