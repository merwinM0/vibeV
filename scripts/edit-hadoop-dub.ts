import { mkdtemp, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { narrationDuration, narrationTakes } from '../works/hadoop/src/narration';
import { root } from './pages';

const ffmpeg = Bun.which('ffmpeg');
if (!ffmpeg) throw new Error('合并配音需要带 libmp3lame 的 FFmpeg。');
const dub = join(root, 'works/hadoop/dub');
const sampleRate = 24_000;
const audioFormat = ['-ar', String(sampleRate), '-ac', '1', '-f', 's16le'];
const flags = [ffmpeg, '-hide_banner', '-loglevel', 'error'];
const pcm = new Uint8Array(Math.round(narrationDuration * sampleRate) * 2);
let offset = 0;

for (const { file, keepSeconds } of narrationTakes) {
  const path = join(dub, file);
  if (!await Bun.file(path).exists()) throw new Error(`找不到原始录音：${path}`);
  // FFmpeg probes the source format; some takes are WAV despite their names.
  const decoded = Bun.spawnSync([...flags, '-i', path, ...audioFormat, 'pipe:1'], { stderr: 'inherit' });
  const end = Math.round(keepSeconds * sampleRate) * 2;
  if (!decoded.success || decoded.stdout.length < end) throw new Error(`无法读取完整的录音：${path}`);
  pcm.set(decoded.stdout.subarray(0, end), offset);
  offset += end;
}

const temporary = await mkdtemp(join(dub, '.audio-'));
try {
  const input = join(temporary, 'narration.pcm');
  const output = join(temporary, 'narration.mp3');
  await Bun.write(input, pcm);
  const code = await Bun.spawn([...flags, ...audioFormat, '-i', input,
    '-c:a', 'libmp3lame', '-q:a', '3', output], { stderr: 'inherit' }).exited;
  if (code !== 0) throw new Error('配音编码失败。');
  await rename(output, join(dub, 'narration.mp3'));
  console.log(`已按 ${narrationTakes.map(({ file }) => file).join(' → ')} 合并 ${narrationDuration} 秒配音：works/hadoop/dub/narration.mp3`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
