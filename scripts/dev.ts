import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { coverLimit } from '../covers/model';
import { coverRoutes } from './cover-routes';
import { coverStore, databaseLabel, databasePath, workSlugs } from './covers';
import { cleanTerminalLine, renderDevOverview, terminalPresentation } from './dev-output';
import { pageEntries, redirectTo, root } from './pages';

async function start() {
  const routes: Record<string, Bun.HTMLBundle | Response> = {};
  const entries = await pageEntries();
  for (const entry of entries) {
    const url = pathToFileURL(join(root, entry));
    const path = `/${entry}`.slice(0, -'index.html'.length);
    const { default: html } = await import(url.href);
    routes[path] = html;
    routes[`/${entry}`] = redirectTo(path);
    if (path !== '/') routes[path.slice(0, -1)] = redirectTo(path);
  }
  const store = coverStore(databasePath);
  try {
    await store.initialize();
  } catch {
    throw new Error(`无法初始化 SQLite，请确认 ${databaseLabel} 可写且数据库文件有效。`);
  }
  const slugs = workSlugs(entries);
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: process.env.PORT ?? 3000,
    development: { hmr: true, console: true },
    maxRequestBodySize: coverLimit,
    routes: { ...routes, ...coverRoutes(store, slugs) },
  });

  console.log(renderDevOverview({
    title: 'Vibe 图解', url: server.url.href,
    left: [`作品：${slugs.size} 部`], right: ['模式：开发（热更新）'],
    status: ['服务：运行中', `SQLite：已就绪 (${databaseLabel})`],
  }, terminalPresentation(process.stdout, process.env, process.platform)));
}

try {
  await start();
} catch (error) {
  console.error(`启动失败：${cleanTerminalLine(error instanceof Error ? error.message : String(error))}`);
  process.exit(1);
}
