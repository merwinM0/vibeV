import { describe, expect, test } from 'bun:test';
import { actingPose, speechScale } from '../avatar/performance';
import { hostPose, propAt } from '../works/hadoop-data-hdfs/acting';
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
    expect(at(0).route).toBe('none');
    expect(at(0).diagramReveal).toBe(0);
    expect(at(4.5).route).toBe('request');
    expect(at(5.5).diagramReveal).toBe(1);
    expect(at(9).route).toBe('reply');
    expect(at(15).states).toEqual(['empty', 'empty', 'empty', 'empty']);
    expect(at(18.5).states).toEqual(['empty', 'empty', 'empty', 'empty']);
    expect(at(20).states).toEqual(['copy', 'empty', 'empty', 'empty']);
    expect(at(22).states).toEqual(['copy', 'copy', 'empty', 'empty']);
    expect(at(24).states).toEqual(['copy', 'copy', 'copy', 'empty']);
    expect(at(29).route).toBe('ack');
  });

  test('locate, read, checksum branch and node loss are distinct events', () => {
    expect(at(38).route).toBe('none');
    expect(at(42).route).toBe('request');
    expect(at(44).route).toBe('reply');
    expect(at(47).route).toBe('readA');
    expect(at(56).states[0]).toBe('corrupt');
    expect(at(67).states[0]).toBe('suspect');
    const failure = at(77);
    expect(failure.states).toEqual(['offline', 'copy', 'copy', 'empty']);
    expect(at(76).route).toBe('none');
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
    expect(propAt(at(16), true)).toEqual({ mode: 'intake', release: 1 });
    expect(hostPose(at(16), false).x).toBeLessThan(500);
    expect(hostPose(at(29), false).x).toBeGreaterThan(900);
    expect(hostPose(at(38), false).x).toBe(hostPose(at(76.5), false).x);
    expect(lensAt(at(95), false)).toMatchObject(worldPoint(1133, 406));
    expect(lensAt(at(95), false).zoom).toBeGreaterThan(1);
    expect(lensAt(at(95), true).zoom).toBe(1);
    expect(arrivalRings(at(93))).toHaveLength(0);
    expect(arrivalRings(at(96.2))).toHaveLength(1);
    expect(arrivalRings(at(97.3))).toHaveLength(0);
  });

  test('host speech scaling is subtle and returns to rest; reduced motion removes scaling', () => {
    const window = [[0, 2]] as const;
    expect(speechScale(0, window)).toBe(1);
    expect(speechScale(.36, window)).toBeGreaterThan(1.017);
    expect(speechScale(.36, window, true)).toBe(1);
    expect(speechScale(5, window)).toBe(1);
    const samples = Array.from({ length: 60 }, (_, i) => speechScale(i / 30, window));
    expect(samples.filter((v, i) => v > 1.008 && v > samples[i - 1] && v > samples[i + 1]).length).toBeGreaterThanOrEqual(6);
    expect(actingPose('seatedThink').bends?.rightArm).toBeLessThan(-1.8);
    expect(hostPose(at(103), false).pose.root?.[2]).toBeGreaterThan(1);
    for (const beat of beats.slice(1)) {
      const left = hostPose(frameAt(beat.start * fps - 1), false);
      const right = hostPose(at(beat.start), false);
      expect(Math.abs(right.scale - left.scale)).toBeLessThan(.16);
      expect(Math.abs(right.x - left.x)).toBeLessThan(13);
    }
    const frame = at(16.2);
    expect(hostPose(frame, false)).toEqual(hostPose(frame, false));
  });
});
