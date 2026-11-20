import { actorAt, speechScale } from '../../avatar/performance';
import type { ActorKey, Acting } from '../../avatar/performance';
import { storyCues, smooth } from './timeline';
import type { SampleFrame } from './timeline';

function at(at: number, [x, y, scale, yaw]: readonly [number, number, number, number], action: Acting | 'idle', walk?: boolean): ActorKey {
  return { at, x, y, scale, yaw, action, walk };
}
const close = [470, 1155, 19, .24] as const;
const pad = [485, 738, 9.2, -.46] as const;
const closePad = [450, 743, 9.2, -.54] as const;
const beside = [1720, 885, 9.7, -.46] as const;
const chair = [1718, 885, 9.7, -.29] as const;
const keys = [
  at(0, close, 'inspect'), at(1.2, close, 'inspect'), at(2.2, close, 'think'), at(2.55, close, 'think'),
  at(4.2, pad, 'tap'), at(storyCues.open, pad, 'tap'), at(5.6, pad, 'idle'),
  at(9.5, pad, 'idle'), at(10.5, pad, 'think'), at(12.7, pad, 'think'), at(14.25, pad, 'carry'), at(15.9, pad, 'carry'),
  at(storyCues.place, closePad, 'place'), at(18.05, closePad, 'place'), at(19.7, pad, 'idle'),
  at(24, pad, 'idle'), at(24.6, pad, 'idle', true), at(30.2, [1415, 800, 9.5, .35], 'idle', true),
  at(33.2, beside, 'idle'), at(34.8, chair, 'sit'), at(40.8, chair, 'sit'),
  at(storyCues.lookup, chair, 'seatedTap'), at(42.5, chair, 'seatedTap'), at(43.5, chair, 'sit'),
  at(48.0, chair, 'seatedPoint'), at(50.2, chair, 'seatedPoint'), at(51.4, chair, 'sit'),
  at(55.2, chair, 'sit'), at(57, chair, 'seatedThink'), at(58.65, chair, 'seatedThink'),
  at(59.9, chair, 'seatedPoint'), at(60.8, chair, 'seatedPoint'), at(62.3, chair, 'sit'),
  at(67.2, chair, 'sit'), at(68.4, chair, 'seatedThink'), at(75.1, chair, 'seatedThink'),
  at(storyCues.retry, chair, 'seatedTap'), at(77.0, chair, 'seatedTap'), at(78.8, chair, 'sit'),
  at(86.5, chair, 'sit'), at(87.7, chair, 'seatedPoint'), at(90.6, chair, 'seatedPoint'),
  at(93.2, chair, 'seatedPoint'), at(97, chair, 'seatedPoint'), at(98.4, chair, 'sit'),
  at(100.3, chair, 'sit'), at(102.2, [1737, 868, 9.1, .04], 'recline'), at(106, [1737, 868, 9.1, .04], 'recline'),
] as const satisfies readonly [ActorKey, ...ActorKey[]];
const speaking = [[.4, 2.35], [5.3, 7.7], [8.2, 12.8], [15, 17.6], [19.8, 23.7], [28.7, 33], [34.8, 37.35],
  [38.4, 41.5], [43.6, 45.65], [47.3, 50.5], [53.1, 55.3], [56.4, 58.7], [62.1, 65.7], [67.35, 71.6],
  [73.05, 75.7], [79.1, 82.2], [85.5, 89.4], [92.7, 95.3], [97.2, 99.2], [100.6, 105.4]] as const;

export function hostPose(state: SampleFrame, reduced: boolean) {
  return { ...actorAt(keys, state.seconds, reduced), headScale: speechScale(state.seconds, speaking, reduced) };
}

export function propAt(state: SampleFrame, reduced: boolean) {
  const time = state.seconds;
  if (reduced || time >= 2.6 || time < .15) {
    if (time < 14.25 || time >= storyCues.launch) return { mode: 'none', release: 0 } as const;
    if (reduced) return { mode: 'intake', release: 1 } as const;
    const release = smooth((time - 16.4) / (storyCues.place - 16.4));
    return { mode: release > 0 ? 'intake' : 'held', release } as const;
  }
  return { mode: 'receipt', release: 0 } as const;
}
