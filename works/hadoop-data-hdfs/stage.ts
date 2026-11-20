import { repairLaunch, repairTravel, smooth, writeLaunch, writeTravel } from './timeline';
import type { SampleFrame } from './timeline';

export const stageWidth = 1920;
export const stageHeight = 1080;
export const diagramWidth = 1280;
export const diagramScale = 1500 / diagramWidth;
export const intake = { x: 216, y: 330 };
export const worldPoint = (x: number, y: number) => ({ x: 90 + x * diagramScale, y: 300 + y * diagramScale });

export function lensAt({ route, local, length }: SampleFrame, reduced: boolean) {
  const focus = route === 'repair' ? worldPoint(1133, 406) : route === 'readA' ? worldPoint(277, 426) : null;
  if (!focus || reduced) return { x: stageWidth / 2, y: stageHeight / 2, zoom: 1, shiftX: 0 };
  const emphasis = smooth((local - .55) / 1.25) * smooth((length - local) / 1.22);
  return { ...focus, zoom: 1 + (route === 'repair' ? .095 : .072) * emphasis, shiftX: route === 'repair' ? 46 * emphasis : 0 };
}

export function arrivalRings({ route, local }: SampleFrame) {
  const arrivals = route === 'write'
    ? [[writeLaunch + writeTravel / 3, 365, 441], [writeLaunch + 2 * writeTravel / 3, 621, 441], [writeLaunch + writeTravel, 877, 441]] as const
    : route === 'repair' ? [[repairLaunch + repairTravel, 1133, 391]] as const : [];
  return arrivals.flatMap(([at, x, y]) => local >= at && local < at + .85
    ? [{ q: (local - at) / .85, ...worldPoint(x, y) }] : []);
}
