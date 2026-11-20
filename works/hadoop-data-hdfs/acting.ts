import { actorAt, speechScale } from '../../avatar/performance';
import type { ActorKey, Acting } from '../../avatar/performance';
import { storyCues, smooth } from './timeline';
import type { SampleFrame } from './timeline';

function at(at: number, [x, y, scale, yaw]: readonly [number, number, number, number], action: Acting | 'idle', walk?: boolean): ActorKey {
  return { at, x, y, scale, yaw, action, walk };
}
const close = [455, 890, 16, .24] as const;
const pad = [225, 833, 10, 1.03] as const;
const closePad = [288, 817, 9.3, 1.16] as const;
const chair = [210, 854, 10, 1.03] as const;
const aisle = [115, 850, 9.4, .96] as const;
const wings = [-148, 851, 9.4, -.97] as const;
const keys = [
  at(0, close, 'inspect'), at(1.2, close, 'inspect'), at(2.2, close, 'think'), at(2.55, close, 'think'),
  at(4.2, pad, 'tap'), at(storyCues.open, pad, 'tap'), at(5.6, pad, 'idle'),
  at(9.5, pad, 'idle'), at(10.5, pad, 'think'), at(12.7, pad, 'think'), at(14.25, pad, 'carry'), at(15.9, pad, 'carry'),
  at(storyCues.place, closePad, 'place'), at(18.05, closePad, 'place'), at(19.7, pad, 'idle'),
  at(23.8, pad, 'idle'), at(24.6, pad, 'idle', true), at(28.6, wings, 'idle'),
  at(34.2, wings, 'carry', true), at(37.7, chair, 'carry'), at(39.2, chair, 'sit'), at(40.8, chair, 'sit'),
  at(storyCues.lookup, chair, 'seatedTap'), at(42.5, chair, 'seatedTap'), at(43.5, chair, 'sit'),
  at(47.7, chair, 'seatedPoint'), at(50.2, chair, 'seatedPoint'), at(52, chair, 'sit'),
  at(55.5, chair, 'sit'), at(57.1, chair, 'seatedThink'), at(59.3, chair, 'seatedThink'),
  at(61, chair, 'seatedPoint'), at(63.4, chair, 'seatedPoint'), at(65, chair, 'sit'),
  at(67.3, chair, 'sit'), at(68.5, chair, 'idle', true), at(70.3, aisle, 'think'), at(73.8, aisle, 'think', true),
  at(storyCues.retry, pad, 'tap'), at(77.2, pad, 'tap'), at(79.2, pad, 'idle', true),
  at(83.6, wings, 'idle'), at(97.7, wings, 'carry', true), at(100.8, aisle, 'carry'),
  at(102.2, pad, 'inspect'), at(106, pad, 'inspect'),
] as const satisfies readonly [ActorKey, ...ActorKey[]];
const speaking = [[.4, 2.35], [5.3, 7.7], [8.2, 12.8], [15, 17.6], [19.8, 23.7], [28.7, 33], [34.8, 37.35],
  [38.4, 41.5], [43.6, 45.65], [47.3, 50.5], [53.1, 55.3], [56.4, 58.7], [62.1, 65.7], [67.35, 71.6],
  [73.05, 75.7], [79.1, 82.2], [85.5, 89.4], [92.7, 95.3], [97.2, 99.2], [100.6, 105.4]] as const;

export function hostPose(state: SampleFrame, reduced: boolean) {
  return { ...actorAt(keys, state.seconds, reduced), headScale: speechScale(state.seconds, speaking, reduced) };
}

export function propAt(state: SampleFrame, reduced: boolean) {
  const time = state.seconds;
  if (time >= 101.8 || time >= 34.2 && time < 38) return { mode: 'receipt', release: 0 } as const;
  if (time >= 2.6 || time < .15) {
    if (time < 14.25 || time >= storyCues.launch) return { mode: 'none', release: 0 } as const;
    if (reduced) return { mode: 'intake', release: 1 } as const;
    const release = smooth((time - 16.4) / (storyCues.place - 16.4));
    return { mode: release > 0 ? 'intake' : 'held', release } as const;
  }
  return { mode: 'receipt', release: 0 } as const;
}
