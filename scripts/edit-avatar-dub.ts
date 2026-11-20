import { mkdtemp, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fps, frameCount, sampleFilm, shots } from '../works/mc-avatar/film';
import { narrationClips } from '../works/mc-avatar/narration';
import { root } from './pages';

const ffmpeg = Bun.which('ffmpeg');
if (!ffmpeg) throw new Error('剪接配音需要带 libmp3lame 的 FFmpeg。');
const dub = join(root, 'works/mc-avatar/dub');
const source = join(dub, 'p1.mp3');
if (!await Bun.file(source).exists()) throw new Error('找不到原始录音：works/mc-avatar/dub/p1.mp3');

const sampleRate = 24_000;
const samplesPerFrame = sampleRate / fps;
const flags = [ffmpeg, '-hide_banner', '-loglevel', 'error'];
// The source is WAV despite its extension, so let FFmpeg probe the actual format.
const decoded = Bun.spawnSync([...flags, '-i', source, '-ar', String(sampleRate), '-ac', '1', '-f', 's16le', 'pipe:1'], { stderr: 'inherit' });
if (!decoded.success) throw new Error('无法解码原始录音。');
const take = new Int16Array(decoded.stdout.buffer, decoded.stdout.byteOffset, decoded.stdout.byteLength / 2);
const pcm = new Int16Array(frameCount * samplesPerFrame);
let previousEnd = 0;

for (const clip of narrationClips) {
  const from = Math.round(clip.inPoint * sampleRate);
  const to = Math.round(clip.outPoint * sampleRate);
  const length = to - from;
  const offset = clip.atFrame * samplesPerFrame;
  const { index } = sampleFilm(clip.atFrame);
  const shotEnd = shots[index + 1]?.start ?? frameCount;
  if (!Number.isInteger(clip.atFrame) || offset < previousEnd || offset + length > shotEnd * samplesPerFrame ||
      from < 0 || to > take.length || length <= 0) {
    throw new Error(`剪接点越界或重叠：「${clip.caption}」`);
  }
  pcm.set(take.subarray(from, to), offset);
  const fade = Math.min(Math.round(.008 * sampleRate), Math.floor(length / 2));
  for (let i = 0; i < fade; i++) {
    pcm[offset + i] *= i / fade;
    pcm[offset + length - i - 1] *= i / fade;
  }
  previousEnd = offset + length;
}

const temp = await mkdtemp(join(dub, '.audio-'));
try {
  const output = join(temp, 'narration.mp3');
  const encoding = Bun.spawnSync([...flags, '-f', 's16le', '-ar', String(sampleRate), '-ac', '1', '-i', 'pipe:0',
    '-c:a', 'libmp3lame', '-q:a', '3', output], { stdin: new Uint8Array(pcm.buffer), stderr: 'inherit' });
  if (!encoding.success) throw new Error('配音编码失败。');
  await rename(output, join(dub, 'narration.mp3'));
  console.log(`已剪接 ${narrationClips.length} 段配音：works/mc-avatar/dub/narration.mp3`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
