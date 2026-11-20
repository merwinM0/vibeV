import { mkdtemp, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { narrationClips } from '../works/hadoop/src/narration';
import { duration, FPS, scenes } from '../works/hadoop/src/timeline';
import { root } from './pages';

const ffmpeg = Bun.which('ffmpeg');
if (!ffmpeg) throw new Error('重新剪接配音需要带 libmp3lame 的 FFmpeg。');
const dub = join(root, 'works/hadoop/dub');
const sampleRate = 24_000;
const fadeSamples = Math.round(.008 * sampleRate);
const pcm = new Int16Array(duration * sampleRate);
const inputs = new Map<number, Int16Array>();
const flags = [ffmpeg, '-hide_banner', '-loglevel', 'error'];
let previousEnd = 0;

for (const clip of narrationClips) {
  let take = inputs.get(clip.take);
  if (!take) {
    const path = join(dub, `p${clip.take}.mp3`);
    if (!await Bun.file(path).exists()) throw new Error(`找不到原始录音：${path}`);
    // FFmpeg probes the actual format even when the source has an .mp3 extension.
    const decoded = Bun.spawnSync([...flags, '-i', path, '-ar', String(sampleRate), '-ac', '1', '-f', 's16le', 'pipe:1'], { stderr: 'inherit' });
    if (!decoded.success) throw new Error(`无法读取录音：${path}`);
    take = new Int16Array(decoded.stdout.buffer, decoded.stdout.byteOffset, decoded.stdout.byteLength / 2);
    inputs.set(clip.take, take);
  }
  const from = Math.round(clip.inPoint * sampleRate);
  const to = Math.round(clip.outPoint * sampleRate);
  const length = to - from;
  const at = clip.atFrame * sampleRate / FPS;
  const scene = scenes.find(({ id }) => id === clip.id);
  if (!scene || at < scene.start * sampleRate || at < previousEnd || at + length > scene.end * sampleRate || from < 0 || to > take.length || length <= 0) {
    throw new Error(`剪接点越界或重叠：${clip.id}「${clip.caption}」`);
  }
  pcm.set(take.subarray(from, to), at);
  // Smooth the cut edges without stretching speech or changing its pitch.
  const fade = Math.min(fadeSamples, Math.floor(length / 2));
  for (let i = 0; i < fade; i++) {
    pcm[at + i] *= i / fade;
    pcm[at + length - 1 - i] *= i / fade;
  }
  previousEnd = at + length;
}

const temporary = await mkdtemp(join(dub, '.audio-'));
try {
  const input = join(temporary, 'narration.pcm');
  const output = join(temporary, 'narration.mp3');
  await Bun.write(input, new Uint8Array(pcm.buffer));
  const code = await Bun.spawn([...flags, '-f', 's16le', '-ar', String(sampleRate), '-ac', '1', '-i', input,
    '-c:a', 'libmp3lame', '-q:a', '3', output], { stderr: 'inherit' }).exited;
  if (code !== 0) throw new Error('配音编码失败。');
  await rename(output, join(dub, 'narration.mp3'));
  console.log(`已剪接 ${narrationClips.length} 段配音到 ${duration} 秒原分镜：works/hadoop/dub/narration.mp3`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
