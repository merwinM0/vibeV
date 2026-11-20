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

test('each subtitle follows the measured speech rather than the edit point', () => {
  let previousEnd = 0;
  let previousCaptionEnd = 0;
  expect(narrationClips).toHaveLength(73);
  for (const clip of narrationClips) {
    const start = clip.atFrame / FPS;
    const end = start + clip.outPoint - clip.inPoint;
    const { scene } = narrationFrameAt(start);
    expect(clip.id).toBe(scene.id);
    expect(start).toBeGreaterThanOrEqual(previousEnd);
    expect(end).toBeLessThanOrEqual(scene.end);
    expect(clip.inPoint).toBeLessThan(clip.speechIn);
    expect(clip.speechIn).toBeLessThan(clip.speechOut);
    expect(clip.speechOut).toBeLessThan(clip.outPoint);
    expect(clip.startFrame).toBeGreaterThanOrEqual(previousCaptionEnd);
    expect(clip.startFrame).toBeGreaterThan(clip.atFrame);
    expect(clip.endFrame / FPS).toBeLessThanOrEqual(scene.end);
    expect(narrationFrameAt((clip.startFrame - 1) / FPS).caption).not.toBe(clip.caption);
    expect(narrationFrameAt(clip.startFrame / FPS).caption).toBe(clip.caption);
    expect(narrationFrameAt((clip.endFrame - 1) / FPS).caption).toBe(clip.caption);
    expect(narrationFrameAt(clip.endFrame / FPS).caption).not.toBe(clip.caption);
    previousEnd = end;
    previousCaptionEnd = clip.endFrame;
  }
});

test('silent gaps do not replace a spoken line with a stale storyboard caption', () => {
  expect(narrationFrameAt(71.6).caption).toBe('');
  expect(narrationFrameAt(71.7).caption).toBe('再沿管线传副本，');
  expect(narrationFrameAt(73.2).caption).toBe('');
  expect(narrationFrameAt(136.25).caption).toBe('');
  expect(narrationFrameAt(136.8).caption).toBe('再申请任务容器。');
  // The unvoiced summary is visible before the spoken credit, not under it.
  expect(narrationFrameAt(430).caption).toBe(frameAt(430).caption);
  expect(narrationFrameAt(433.1).caption).toBe('此内容由 AI 生成。');
  expect(narrationFrameAt(duration).caption).toBe('');
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
