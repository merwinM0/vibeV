import { expect, test } from 'bun:test';
import { narrationChapters, narrationDuration, narrationFrameAt, narrationShots } from '../works/hadoop/src/narration';
import { chapters, FPS } from '../works/hadoop/src/timeline';

test('all narrated lines switch at their authored frame and preserve visual beat anchors', () => {
  let previous = '';
  let frame = -1;
  for (const shot of narrationShots) {
    expect(shot.cues[0].frame).toBe(shot.start);
    for (const cue of shot.cues) {
      expect(cue.frame).toBeGreaterThan(frame);
      expect(cue.frame).toBeLessThan(shot.end);
      if (frame >= 0) expect(narrationFrameAt((cue.frame - 1) / FPS).caption).toBe(previous);
      const rendered = narrationFrameAt(cue.frame / FPS);
      expect(rendered.caption).toBe(cue.caption);
      expect(rendered.scene.id).toBe(shot.scene.id);
      if (cue.visualTime !== undefined) expect(rendered.elapsed).toBeCloseTo(cue.visualTime, 8);
      previous = rendered.caption;
      frame = cue.frame;
    }
    const afterShot = narrationFrameAt((shot.end - 1) / FPS);
    expect(afterShot.elapsed).toBeCloseTo(shot.scene.end - shot.scene.start - 1 / FPS, 8);
  }
});

test('chapter and recording joins land on the right speech without replaying the disclosure', () => {
  expect(narrationChapters.map(({ id }) => id)).toEqual(chapters.map(({ id }) => id));
  for (const chapter of narrationChapters) expect(narrationFrameAt(chapter.start).scene.chapter).toBe(chapter.id);
  expect(narrationFrameAt(44.97).caption).toContain('MapReduce 或 Spark');
  expect(narrationFrameAt(89).caption).toBe('报表回答卖多少，');
  expect(narrationFrameAt(130).caption).toContain('Oozie');
  expect(narrationShots.flatMap(({ cues }) => cues).filter(({ caption }) => caption.includes('AI 生成'))).toHaveLength(1);
  expect(narrationFrameAt(narrationDuration + 1)).toEqual(narrationFrameAt(narrationDuration));
  expect(narrationFrameAt(narrationDuration).caption).toBe('此内容由 AI 生成。');
});
