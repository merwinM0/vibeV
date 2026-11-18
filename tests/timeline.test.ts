import { describe, expect, test } from 'bun:test';
import { chapters, duration, FPS, frameAt, scenes, timecode } from '../works/hadoop/src/timeline';
import { PlaybackClock } from '../works/hadoop/src/clock';

const storyboard = new URL('../Hadoop生态圈_Vibe视频_完整分镜表.md', import.meta.url);
const toSeconds = (timestamp: string) => {
  const [minutes, seconds] = timestamp.split(':').map(Number);
  return minutes * 60 + seconds;
};

describe('full 00–09 timeline', () => {
  test('uses all storyboard boundaries and ends after S59 with no extra space', async () => {
    const text = await Bun.file(storyboard).text();
    const rows = [...text.matchAll(/\*\*(S\d{2})\*\*<br>(\d\d:\d\d)–(\d\d:\d\d)<br>(\d+) 秒/g)];
    expect(rows).toHaveLength(59);
    expect(scenes.map((scene) => ({ id: String(scene.id), start: Number(scene.start), end: Number(scene.end) })))
      .toEqual(rows.map(([, id, start, end]) => ({ id, start: toSeconds(start), end: toSeconds(end) })));
    for (const [, , start, end, length] of rows) {
      expect(toSeconds(end) - toSeconds(start)).toBe(Number(length));
      expect(Number(length)).toBeGreaterThanOrEqual(6);
      expect(Number(length)).toBeLessThanOrEqual(9);
    }
    expect(timecode(duration)).toBe('07:15');
    const parts = [...text.matchAll(/^\| (\d\d)｜.*? \| (\d\d:\d\d)–(\d\d:\d\d) \|/gm)];
    expect(parts).toHaveLength(10);
    expect(chapters.map<[string, number, number]>(({ id, start, end }) => [id, start, end]))
      .toEqual(parts.map(([, id, start, end]) => [id, toSeconds(start), toSeconds(end)]));
    expect(frameAt(120).scene.id).toBe('S17');
    const retimed = text.slice(text.indexOf('### 03｜'), text.indexOf('## 3.'));
    const cuePairs = [...retimed.matchAll(/^\| \*\*S\d{2}\*\*[^|]*\|[^|]*\| (.*?)<br>(.*?) \|/gm)];
    expect(cuePairs).toHaveLength(43);
    expect(scenes.slice(16).map((scene) => scene.cues.map(([, caption]): string => caption)))
      .toEqual(cuePairs.map(([, first, second]) => [first, second]));
    for (const [i, scene] of scenes.entries()) {
      expect<string>(frameAt(scene.start).scene.id).toBe(`S${String(i + 1).padStart(2, '0')}`);
      expect(frameAt(scene.end - 1 / FPS).scene.id).toBe(scene.id);
      expect(chapters.some((chapter) => chapter.id === scene.chapter && chapter.start <= scene.start && scene.end <= chapter.end)).toBe(true);
    }
  });

  test('keeps the last picture and subtitle visible at the end', () => {
    const last = frameAt(duration);
    expect(last.scene.id).toBe('S59');
    expect(last.frame).toBe(13049);
    expect(frameAt(duration + 1)).toEqual(last);
    expect(frameAt(-3)).toEqual(frameAt(0));
    expect(frameAt(NaN)).toEqual(frameAt(0));
  });

  test('switches captions at their frame, independent of seek order', () => {
    for (const scene of scenes) {
      expect(scene.cues[0][0]).toBe(0);
      let previous = -1;
      let previousCaption = '';
      for (const [offset, caption] of scene.cues) {
        expect(offset * FPS).toBeCloseTo(Math.round(offset * FPS), 6);
        if (previous >= 0) expect(Math.round((offset - previous) * FPS)).toBeGreaterThanOrEqual(54);
        expect(offset).toBeGreaterThan(previous);
        expect(offset).toBeLessThan(scene.end - scene.start);
        expect(frameAt(scene.start + offset).caption).toBe(caption);
        if (offset > 0) expect(frameAt(scene.start + offset - 1 / FPS).caption).toBe(previousCaption);
        previous = offset;
        previousCaption = caption;
      }
      expect(Math.round((scene.end - scene.start - previous) * FPS)).toBeGreaterThanOrEqual(54);
    }
  });
});

describe('playback clock', () => {
  test('does not drift with sparse samples and preserves a paused position', () => {
    const clock = new PlaybackClock();
    expect(clock.playing).toBe(false);
    clock.play(1000);
    expect(clock.current(7500)).toBe(6.5);
    clock.pause(7500);
    expect(clock.current(12000)).toBe(6.5);
    clock.play(21000);
    expect(clock.current(22000)).toBe(7.5);
  });

  test('seeks while playing, stops at duration, and restarts from zero', () => {
    const clock = new PlaybackClock();
    clock.play(100);
    clock.seek(48, 200);
    expect(clock.current(1200)).toBe(49);
    clock.seek(duration, 2000);
    expect(clock.playing).toBe(false);
    expect(clock.current(3000)).toBe(duration);
    clock.play(3000);
    expect(clock.current(3000)).toBe(0);
    const afterEnd = 3000 + duration * 1000 + 500;
    expect(clock.current(afterEnd)).toBe(duration);
    clock.pause(afterEnd);
    expect(clock.playing).toBe(false);
    clock.seek(-8, afterEnd + 2000);
    expect(clock.current(afterEnd + 2000)).toBe(0);
  });
});
