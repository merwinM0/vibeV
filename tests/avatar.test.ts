import { expect, test } from 'bun:test';
import { dimensions, parts, detectModel, skinUV } from '../avatar/skin';
import { phaseLength, poseAt, rotate } from '../avatar/motion';
import { duration, frameCount, sampleFilm, shots } from '../works/mc-avatar/film';

test('both arm layouts preserve the atlas bounds and the second skin layer', () => {
  expect(dimensions('leftArm', 'slim')).toEqual([3, 12, 4]);
  expect(skinUV('rightArm', 'classic').front).toEqual([44, 20, 4, 12]);
  expect(skinUV('leftArm', 'slim', true).front).toEqual([52, 52, 3, 12]);
  expect(skinUV('head', 'slim', true).front).toEqual([40, 8, 8, 8]);
  for (const part of parts) for (const variant of ['classic', 'slim'] as const) for (const outer of [false, true]) {
    for (const [x, y, width, height] of Object.values(skinUV(part, variant, outer))) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x + width).toBeLessThanOrEqual(64);
      expect(y + height).toBeLessThanOrEqual(64);
    }
  }
});

test('the alpha hint checks both arms and does not read transparent RGB', () => {
  const rgba = new Uint8ClampedArray(64 * 64 * 4);
  for (const variant of [[55, 20], [47, 63]]) {
    const idx = (variant[0] + variant[1] * 64) * 4;
    rgba[idx] = 255;
    expect(detectModel(rgba)).toBe('slim');
    rgba[idx + 3] = 255;
    expect(detectModel(rgba)).toBe('classic');
    rgba[idx + 3] = 0;
  }
  expect(() => detectModel(new Uint8Array(4))).toThrow(RangeError);
});

test('walk alternates opposite arms and legs, while pointing and nodding isolate their joints', () => {
  const first = poseAt('walk', phaseLength * .25);
  const next = poseAt('walk', phaseLength * .75);
  expect(first.angles.leftLeg[0]).toBeLessThan(0);
  const stride = Math.abs(first.angles.leftLeg[0]);
  expect(12 + first.lift - 12 * Math.cos(stride) - 2 * Math.sin(stride)).toBeCloseTo(0);
  expect(first.angles.leftLeg).toEqual(first.angles.rightArm);
  expect(next.angles.rightLeg).toEqual(next.angles.leftArm);
  expect(next.angles.leftLeg[0]).toBeGreaterThan(0);
  expect(poseAt('walk', phaseLength * .25, 0).angles.leftLeg[0]).toBeCloseTo(0);
  const mid = poseAt('point', 1.2);
  expect(rotate([0, -1, 0], mid.angles.leftArm)[0]).toBeGreaterThan(.9);
  expect(mid.angles.rightArm).toEqual([0, 0, 0]);
  expect(poseAt('point', 4).angles.leftArm[2]).toBe(0);
  expect(rotate([0, 0, 1], poseAt('nod', .62).angles.head)[1]).toBeLessThan(0);
});

test('the sample spans exactly 30 seconds, with stable seek results across all cuts', () => {
  expect(duration).toBe(30);
  expect(frameCount).toBe(900);
  for (let i = 1; i < shots.length; i++) {
    expect(sampleFilm(shots[i].start - 1).index).toBe(i - 1);
    expect(sampleFilm(shots[i].start)).toEqual({ frame: shots[i].start, index: i, shot: shots[i], time: 0 });
  }
  expect(sampleFilm(900)).toEqual(sampleFilm(899));
  expect(sampleFilm(-100)).toEqual(sampleFilm(0));
});
