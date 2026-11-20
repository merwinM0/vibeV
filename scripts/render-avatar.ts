import { mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { duration, fps, frameCount } from '../works/mc-avatar/film';
import { root } from './pages';

const chrome = process.env.CHROMIUM_BIN || ['chromium', 'chromium-browser', 'google-chrome', 'chrome-headless-shell']
  .map((name) => Bun.which(name)).find(Boolean);
const ffmpeg = Bun.which('ffmpeg');
if (!chrome || !ffmpeg) throw new Error('需要 Chromium 和 FFmpeg；可用 CHROMIUM_BIN 指定浏览器路径。');
const narration = join(root, 'works/mc-avatar/dub/narration.mp3');
if (!await Bun.file(narration).exists()) throw new Error('找不到配音，请先运行 bun run avatar:dub。');
const result = await Bun.build({ entrypoints: [join(root, 'avatar/capture.ts')], target: 'browser', format: 'iife', minify: true });
if (!result.success || result.outputs.length !== 1) throw new Error('无法构建样片渲染器。');
const framesScript = await result.outputs[0].text();
const outputDir = join(root, 'exports');
await mkdir(outputDir, { recursive: true });
const profile = await mkdtemp(join(tmpdir(), 'vibev-chrome-'));
const prefix = `/${crypto.randomUUID()}/`;
const output = join(outputDir, 'mc-avatar-30s.mp4');
const temporary = join(outputDir, `.${crypto.randomUUID()}.mp4`);
const encoder = Bun.spawn([ffmpeg, '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps),
  '-vcodec', 'png', '-i', 'pipe:0', '-i', narration, '-map', '0:v:0', '-map', '1:a:0',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'fast',
  '-c:a', 'aac', '-b:a', '96k', '-t', String(duration), '-movflags', '+faststart', temporary],
  { stdin: 'pipe', stdout: 'ignore', stderr: 'inherit' });
let server: Bun.Server<undefined> | undefined;
let browser: Bun.Subprocess | undefined;
let timer: ReturnType<typeof setTimeout> | undefined;
let next = 0;
let busy = false;
let failure = '';
try {
  server = Bun.serve({ hostname: '127.0.0.1', port: 0, development: false, maxRequestBodySize: 8 * 1024 * 1024,
    async fetch(request) {
      const path = new URL(request.url).pathname;
      if (!path.startsWith(prefix)) return new Response(null, { status: 404 });
      const resource = path.slice(prefix.length);
      if (request.method === 'GET') {
        if (!resource) return new Response('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>vibeV frame renderer</title><script defer src="capture.js"></script></html>', { headers: { 'Content-Type': 'text/html;charset=utf-8' } });
        if (resource === 'capture.js') return new Response(framesScript, { headers: { 'Content-Type': 'text/javascript' } });
        if (resource === 'skin.png') return new Response(Bun.file(join(root, 'avatar/mc_mon.png')));
      }
      if (request.method === 'POST' && request.headers.get('Origin') === server?.url.origin) {
        if (resource === 'failed') {
          failure = (await request.text()).slice(0, 500);
          encoder.kill();
          return new Response(null, { status: 204 });
        }
        if (resource === `frame/${next}` && next < frameCount && !busy && request.headers.get('Content-Type') === 'image/png') {
          busy = true;
          try {
            encoder.stdin.write(await request.bytes());
            await encoder.stdin.flush();
            if (++next === frameCount) await encoder.stdin.end();
            return new Response(null, { status: 204 });
          } finally { busy = false; }
        }
      }
      return new Response(null, { status: 404 });
    },
  });
  console.log(`正在渲染 ${frameCount} 帧，输出：exports/mc-avatar-30s.mp4`);
  browser = Bun.spawn([chrome, '--headless', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run',
    `--user-data-dir=${profile}`, new URL(prefix, server.url).href], { stdout: 'ignore', stderr: 'ignore' });
  const code = await Promise.race([
    encoder.exited,
    browser.exited.then(() => { throw new Error(`浏览器提前退出（已渲染 ${next} 帧）。`); }),
    new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`渲染超时（已渲染 ${next} 帧）。`)), 180_000); }),
  ]);
  if (code !== 0 || next !== frameCount) throw new Error(`渲染失败（${next}/${frameCount} 帧）。${failure.replace(/[\p{Cc}\p{Bidi_Control}]/gu, ' ')}`);
  await rename(temporary, output);
  console.log('渲染完成：exports/mc-avatar-30s.mp4');
} finally {
  clearTimeout(timer);
  browser?.kill();
  if (encoder.exitCode === null) encoder.kill();
  await server?.stop(true);
  await Promise.all([browser?.exited, encoder.exited]);
  await rm(profile, { recursive: true, force: true });
  await rm(temporary, { force: true });
}
