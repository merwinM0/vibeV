import { describe, expect, test } from 'bun:test';
import { chapters, duration, FPS, frameAt, scenes, timecode } from '../src/timeline';
import { PlaybackClock } from '../src/clock';

const starts = [0, 12, 26, 40, 52, 65, 80, 93, 107, 121, 137, 153, 167, 182, 197, 211];

describe('approved 00–02 timeline', () => {
  test('uses the storyboard boundaries and ends after S16 with no extra space', () => {
    expect(scenes.map<number>((scene) => scene.start)).toEqual(starts);
    expect(scenes.map<number>((scene) => scene.end)).toEqual([...starts.slice(1), 224]);
    expect(timecode(duration)).toBe('03:44');
    expect(chapters.map((chapter) => [chapter.start, chapter.end])).toEqual([[0, 52], [52, 93], [93, 224]]);
    for (const [i, scene] of scenes.entries()) {
      expect<string>(frameAt(scene.start).scene.id).toBe(`S${String(i + 1).padStart(2, '0')}`);
      expect(frameAt(scene.end - 1 / FPS).scene.id).toBe(scene.id);
      expect(chapters.some((chapter) => chapter.id === scene.chapter && chapter.start <= scene.start && scene.end <= chapter.end)).toBe(true);
    }
  });

  test('keeps the last picture and subtitle visible at the end', () => {
    const last = frameAt(224);
    expect(last.scene.id).toBe('S16');
    expect(last.frame).toBe(6719);
    expect(frameAt(225)).toEqual(last);
    expect(frameAt(-3)).toEqual(frameAt(0));
    expect(frameAt(NaN)).toEqual(frameAt(0));
  });

  test('switches captions at their frame, independent of seek order', () => {
    for (const scene of scenes) {
      expect(scene.cues[0][0]).toBe(0);
      let previous = -1;
      let previousCaption = '';
      for (const [offset, caption] of scene.cues) {
        expect(offset).toBeGreaterThan(previous);
        expect(offset).toBeLessThan(scene.end - scene.start);
        expect(frameAt(scene.start + offset).caption).toBe(caption);
        if (offset > 0) expect(frameAt(scene.start + offset - 1 / FPS).caption).toBe(previousCaption);
        previous = offset;
        previousCaption = caption;
      }
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
    clock.seek(93, 200);
    expect(clock.current(1200)).toBe(94);
    clock.seek(duration, 2000);
    expect(clock.playing).toBe(false);
    expect(clock.current(3000)).toBe(224);
    clock.play(3000);
    expect(clock.current(3000)).toBe(0);
    expect(clock.current(227500)).toBe(224);
    clock.pause(227500);
    expect(clock.playing).toBe(false);
    clock.seek(-8, 229000);
    expect(clock.current(229000)).toBe(0);
  });
});
