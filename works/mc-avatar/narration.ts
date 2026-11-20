export const fps = 30;

type Clip = {
  atFrame: number;
  inPoint: number;
  outPoint: number;
  speech: readonly [start: number, end: number];
  caption: string;
};

// Source times in dub/p1.mp3, checked against the waveform and words in the take.
// The edit includes quiet padding; the visible caption follows the voice, not the cut.
const edits = {
  intro: { atFrame: 15, inPoint: .12, outPoint: 1.73, speech: [.17, 1.68], caption: '一张小小的皮肤，' },
  parts: { atFrame: 85, inPoint: 1.74, outPoint: 5.58, speech: [1.78, 5.50], caption: '先被贴到头、身体和四肢的各个面上，' },
  look: { atFrame: 205, inPoint: 5.62, outPoint: 7.49, speech: [5.70, 7.38], caption: '决定角色长什么样。' },
  raise: { atFrame: 291, inPoint: 7.61, outPoint: 9.24, speech: [7.67, 9.16], caption: '想让角色抬手？' },
  unchanged: { atFrame: 344, inPoint: 9.34, outPoint: 10.19, speech: [9.40, 10.13], caption: '不用改图，' },
  shoulder: { atFrame: 375, inPoint: 10.20, outPoint: 12.73, speech: [10.26, 12.65], caption: '只要让手臂绕肩膀转就行。' },
  firstStep: { atFrame: 472, inPoint: 12.89, outPoint: 16.43, speech: [12.95, 16.35], caption: '走路时，左腿和右臂一起向前，' },
  nextStep: { atFrame: 584, inPoint: 16.51, outPoint: 18.87, speech: [16.58, 18.75], caption: '下一步换右腿和左臂。' },
  nod: { atFrame: 675, inPoint: 18.99, outPoint: 21.17, speech: [19.07, 21.07], caption: '点头也是同一个道理：' },
  texture: { atFrame: 744, inPoint: 21.73, outPoint: 23.21, speech: [21.80, 23.11], caption: '贴图决定外观，' },
  joints: { atFrame: 792, inPoint: 23.40, outPoint: 24.93, speech: [23.48, 24.87], caption: '关节决定动作。' },
  credit: { atFrame: 839, inPoint: 26.10, outPoint: 28.12, speech: [26.22, 27.97], caption: '此内容由 AI 生成。' },
} as const satisfies Record<string, Clip>;

export const narrationClips: readonly Clip[] = Object.values(edits);

export function sourceFrame(clip: Clip, sourceTime: number) {
  return clip.atFrame + (sourceTime - clip.inPoint) * fps;
}

const readingTailFrames = 3;
export const captionCues = narrationClips.map((clip, index) => {
  const start = Math.round(sourceFrame(clip, clip.speech[0]));
  const next = narrationClips[index + 1];
  const nextStart = next ? Math.round(sourceFrame(next, next.speech[0])) : Infinity;
  const end = Math.min(nextStart, Math.ceil(sourceFrame(clip, clip.speech[1]) + readingTailFrames));
  return { start, end, caption: clip.caption };
});

// Timing for gestures is mapped from spoken terms in the same takes, not percentages of shot length.
export const actionFrame = {
  parts: [2.74, 3.37, 4.18, 4.40, 4.62, 4.84].map((time) => Math.round(sourceFrame(edits.parts, time))),
  shoulder: Math.round(sourceFrame(edits.shoulder, 11.49)),
  firstStep: Math.round(sourceFrame(edits.firstStep, 14.05)),
  nextStep: Math.round(sourceFrame(edits.nextStep, 16.58)),
  nod: Math.round(sourceFrame(edits.nod, 19.07)),
  texture: Math.round(sourceFrame(edits.texture, 21.80)),
  joints: Math.round(sourceFrame(edits.joints, 23.48)),
};
