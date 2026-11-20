import { expect, test } from 'bun:test';
import { narrationChapters, narrationCues, narrationDuration, narrationFrameAt, narrationShots, narrationTakes } from '../works/hadoop/src/narration';
import { chapters, FPS } from '../works/hadoop/src/timeline';

test('recordings and captions stay in source order with no storyboard-driven edits', () => {
  expect(narrationTakes.map(({ file }) => file)).toEqual(['p1.mp3', 'p2.mp3', 'p3.mp3', 'p4.mp3']);
  expect(narrationDuration).toBe(191.16);
  let offset = 0;
  for (const [i, take] of narrationTakes.entries()) {
    const cues = narrationCues.filter((cue) => cue.take === i);
    let previous = 0;
    take.lines.forEach(([start, end], j) => {
      expect(start).toBeGreaterThanOrEqual(previous);
      expect(end).toBeGreaterThan(start);
      expect(end).toBeLessThanOrEqual(take.keepSeconds);
      expect(Math.abs(cues[j].startFrame / FPS - (offset + start))).toBeLessThanOrEqual(.5 / FPS + 1e-8);
      previous = end;
    });
    offset += take.keepSeconds;
  }
  expect(narrationFrameAt(52.65).caption).toBe('Shuffle 先分区，再传输排序。');
  expect(narrationFrameAt(55.60).caption).toBe('局部求和可选。');
  expect(narrationCues.filter(({ caption }) => caption.includes('AI 生成'))).toHaveLength(1);
});

test('captions follow speech at starts, gaps and take joins', () => {
  for (const [i, cue] of narrationCues.entries()) {
    const next = narrationCues[i + 1]?.startFrame ?? Infinity;
    const end = Math.min(cue.endFrame, next);
    expect(narrationFrameAt((cue.startFrame - 1) / FPS).caption).not.toBe(cue.caption);
    expect(narrationFrameAt(cue.startFrame / FPS).caption).toBe(cue.caption);
    expect(narrationFrameAt((end - 1) / FPS).caption).toBe(cue.caption);
    expect(narrationFrameAt(cue.startFrame / FPS).scene.id).toBe(cue.id);
    if (end < next) expect(narrationFrameAt(end / FPS).caption).toBe('');
  }
  expect(narrationFrameAt(45.2).caption).toContain('MapReduce 或 Spark');
  expect(narrationFrameAt(89.4).caption).toBe('报表回答卖多少，');
  expect(narrationFrameAt(130.3).caption).toContain('Oozie');
  expect(narrationFrameAt(190).caption).toBe('此内容由 AI 生成。');
  expect(narrationFrameAt(narrationDuration + 1)).toEqual(narrationFrameAt(narrationDuration));
});

test('retimed visual beats and chapter navigation share a deterministic timeline', () => {
  expect(narrationChapters.map(({ id }) => id)).toEqual(chapters.map(({ id }) => id));
  for (const chapter of narrationChapters) {
    expect(narrationFrameAt(chapter.start).scene.chapter).toBe(chapter.id);
    const mediaTime = Math.floor(chapter.start * 1_000_000) / 1_000_000;
    expect(narrationFrameAt(mediaTime).scene.chapter).toBe(chapter.id);
    if (chapter.start > 0) expect(narrationFrameAt(chapter.start - 1 / FPS).scene.chapter).not.toBe(chapter.id);
  }
  for (const shot of narrationShots) {
    expect(narrationFrameAt(shot.startFrame / FPS).elapsed).toBe(0);
    for (const [i, beat] of shot.beats.entries()) {
      if (i > 0) {
        expect(beat.frame).toBeGreaterThan(shot.beats[i - 1].frame);
        expect(beat.time).toBeGreaterThan(shot.beats[i - 1].time);
      }
      expect(narrationFrameAt(beat.frame / FPS).elapsed).toBeCloseTo(beat.time, 6);
    }
  }
});
