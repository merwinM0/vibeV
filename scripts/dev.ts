import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { pageEntries, redirectTo, root } from './pages';

const routes: Record<string, Bun.HTMLBundle | Response> = {};
for (const entry of await pageEntries()) {
  const url = pathToFileURL(join(root, entry));
  const path = `/${entry}`.slice(0, -'index.html'.length);
  const { default: html } = await import(url.href);
  routes[path] = html;
  routes[`/${entry}`] = redirectTo(path);
  if (path !== '/') routes[path.slice(0, -1)] = redirectTo(path);
}

const server = Bun.serve({
  hostname: '127.0.0.1',
  port: process.env.PORT ?? 3000,
  development: { hmr: true, console: true },
  routes,
});

console.log(`Vibe 图解：${server.url}`);
