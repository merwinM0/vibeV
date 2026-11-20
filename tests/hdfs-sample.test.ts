import { describe, expect, test } from 'bun:test';
import { hostPose, propAt, speechScale } from '../works/hadoop-data-hdfs/host';
import { arrivalRings, lensAt, worldPoint } from '../works/hadoop-data-hdfs/stage';
import { beats, chapters, fps, frameAt, frameCount, timecode } from '../works/hadoop-data-hdfs/timeline';

const at = (seconds: number) => frameAt(seconds * fps);

describe('HDFS sample', () => {
  test('one frame table keeps chapter boundaries, shot boundaries and the held ending aligned', () => {
    expect(frameCount).toBe(3180);
    for (const [i, shot] of beats.entries()) {
      expect(at(shot.start).index).toBe(i);
      if (i > 0) expect(frameAt(shot.start * fps - 1).index).toBe(i - 1);
    }
    for (const [i, chapter] of chapters.entries()) expect(at(chapter.start).chapter).toBe(i);
    expect(frameAt(-1).index).toBe(0);
    expect(frameAt(frameCount + 1).beat).toBe(beats.at(-1)!);
    expect(timecode(frameCount)).toBe('01:46');
  });

  test('B2 copies appear in pipeline order, while ACK is a separate return', () => {
    expect(at(0).route).toBe('request');
    expect(at(9).route).toBe('reply');
    expect(at(15).states).toEqual(['empty', 'empty', 'empty', 'empty']);
    expect(at(18.5).states).toEqual(['empty', 'empty', 'empty', 'empty']);
    expect(at(20).states).toEqual(['copy', 'empty', 'empty', 'empty']);
    expect(at(22).states).toEqual(['copy', 'copy', 'empty', 'empty']);
    expect(at(24).states).toEqual(['copy', 'copy', 'copy', 'empty']);
    expect(at(29).route).toBe('ack');
  });

  test('locate, read, checksum branch and node loss are distinct events', () => {
    expect(at(38).route).toBe('request');
    expect(at(42).route).toBe('reply');
    expect(at(47).route).toBe('readA');
    expect(at(56).states[0]).toBe('corrupt');
    expect(at(67).states[0]).toBe('suspect');
    const failure = at(77);
    expect(failure.states).toEqual(['offline', 'copy', 'copy', 'empty']);
    expect(failure.route).toBe('readB');
    expect(at(86).route).toBe('order');
    expect(at(93).copies).toBe(2);
    expect(at(96).states).toEqual(['offline', 'copy', 'copy', 'copy']);
    expect(at(77)).toEqual(failure);
  });

  test('B2 is held, released into the stage, then becomes a packet; framing follows the explained node', () => {
    expect(propAt(at(16), false)).toEqual({ mode: 'held', release: 0 });
    expect(propAt(at(17), false).release).toBeGreaterThan(0);
    expect(propAt(at(17), false).release).toBeLessThan(1);
    expect(propAt(at(18), false).mode).toBe('none');
    expect(propAt(at(16), true)).toEqual({ mode: 'supply', release: 1 });
    expect(hostPose(at(16), false).x).toBeLessThan(500);
    expect(hostPose(at(29), false).x).toBeGreaterThan(1500);
    expect(lensAt(at(95), false)).toMatchObject(worldPoint(1133, 406));
    expect(lensAt(at(95), false).zoom).toBeGreaterThan(1);
    expect(lensAt(at(95), true).zoom).toBe(1);
    expect(arrivalRings(at(93))).toHaveLength(0);
    expect(arrivalRings(at(96.2))).toHaveLength(1);
    expect(arrivalRings(at(97.3))).toHaveLength(0);
  });

  test('host speech scaling is subtle and returns to rest; reduced motion removes scaling', () => {
    expect(speechScale(0)).toBe(1);
    expect(speechScale(.53)).toBeCloseTo(1.024, 5);
    expect(speechScale(.53, true)).toBe(1);
    expect(speechScale(5)).toBe(1);
    const frame = at(16.2);
    const pose = hostPose(frame, false);
    expect(pose.pose.angles.leftArm).not.toEqual(hostPose(at(1.2), false).pose.angles.leftArm);
    expect(hostPose(at(101.8), false).offset).toBeGreaterThan(0);
    expect(hostPose(frame, false)).toEqual(pose);
  });
});
