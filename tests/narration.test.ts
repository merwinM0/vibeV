import { expect, test } from 'bun:test';
import { narrationClips, narrationFrameAt } from '../works/hadoop/src/narration';
import { duration, FPS, frameAt, scenes } from '../works/hadoop/src/timeline';

test('adding narration leaves every original animation frame and shot boundary unchanged', () => {
  for (let i = 0; i <= duration * FPS; i++) {
    const seconds = i / FPS;
    const original = frameAt(seconds);
    const narrated = narrationFrameAt(seconds);
    expect(narrated.scene).toBe(original.scene);
    expect(narrated.elapsed).toBe(original.elapsed);
    expect(narrated.frame).toBe(original.frame);
  }
});

test('each audio edit fits its shot and switches captions at the placement frame', () => {
  let previousEnd = 0;
  for (const clip of narrationClips) {
    const start = clip.atFrame / FPS;
    const length = clip.outPoint - clip.inPoint;
    const end = start + length;
    const narrated = narrationFrameAt(start);
    expect(length).toBeGreaterThan(0);
    expect(start).toBeGreaterThanOrEqual(previousEnd);
    expect(end).toBeLessThanOrEqual(narrated.scene.end);
    expect(narrated.scene.id).toBe(clip.id);
    expect(narrated.caption).toBe(clip.caption);
    expect(narrationFrameAt(start + length / 2).caption).toBe(clip.caption);
    expect(narrationFrameAt((clip.atFrame - 1) / FPS).caption).not.toBe(clip.caption);
    previousEnd = end;
  }
});

test('missing speech keeps the original captions; re-ordered lines follow the storyboard', () => {
  const voiced = new Set(narrationClips.map(({ id }) => id));
  const unvoiced = scenes.filter(({ id }) => !voiced.has(id));
  expect(unvoiced.map(({ id }) => id)).toEqual(['S01', 'S03', 'S04', 'S05', 'S07', 'S20', 'S30', 'S32', 'S38']);
  for (const scene of unvoiced) {
    for (const [at] of scene.cues) expect(narrationFrameAt(scene.start + at)).toEqual(frameAt(scene.start + at));
  }
  // The unrecorded direct DataNode write still has its original caption.
  expect(narrationFrameAt(67)).toEqual(frameAt(67));
  expect(narrationFrameAt(178.5).caption).toBe('局部求和可选。');
  expect(narrationFrameAt(183.5).caption).toContain('Shuffle');
  expect(narrationClips.filter(({ caption }) => caption.includes('AI 生成'))).toHaveLength(1);
});
