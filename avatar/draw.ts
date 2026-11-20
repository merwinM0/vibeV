import { poseAt, rotate } from './motion';
import type { Action, Limb, Pose, Vec3 } from './motion';
import { dimensions, parts, skinUV } from './skin';
import type { Part, Rect, Skin } from './skin';

export type AvatarView = {
  x: number; y: number; scale: number; yaw?: number; tilt?: number;
  action?: Action; time?: number; intensity?: number; highlight?: Part;
  pose?: Pose; headScale?: number;
};
type Face = keyof ReturnType<typeof skinUV>;
type Surface = { a: Vec3; b: Vec3; c: Vec3; uv: Rect; depth: number };

function faces(x: number, top: number, bottom: number, z: number): Record<Face, [Vec3, Vec3, Vec3, Vec3]> {
  return {
    front: [[-x, top, z], [x, top, z], [-x, bottom, z], [0, 0, 1]],
    back: [[x, top, -z], [-x, top, -z], [x, bottom, -z], [0, 0, -1]],
    right: [[-x, top, -z], [-x, top, z], [-x, bottom, -z], [-1, 0, 0]],
    left: [[x, top, z], [x, top, -z], [x, bottom, z], [1, 0, 0]],
    top: [[-x, top, -z], [x, top, -z], [-x, top, z], [0, 1, 0]],
    bottom: [[-x, bottom, z], [x, bottom, z], [-x, bottom, -z], [0, -1, 0]],
  };
}

function rigFor(skin: Skin, view: AvatarView) {
  const { yaw = .35, tilt = .16, action = 'idle', time = 0, intensity = 1 } = view;
  const pose = view.pose ?? poseAt(action, time, intensity);
  const camera = (p: Vec3) => rotate(rotate(p, [0, yaw, 0]), [tilt, 0, 0]);
  const [armWidth] = dimensions('leftArm', skin.model);
  const pivots: Record<Part, Vec3> = {
    head: [0, 24, 0], body: [0, 24, 0],
    rightArm: [-4 - armWidth / 2, 23, 0], leftArm: [4 + armWidth / 2, 23, 0],
    rightLeg: [-2, 12, 0], leftLeg: [2, 12, 0],
  };
  const pivot = (part: Part) => part.endsWith('Arm') ? -5 : -6;
  const root = pose.root ?? [0, 0, 0];
  function project(part: Part, p: Vec3, lower = false) {
    const [px, py, pz] = pivots[part];
    const joint = pivot(part);
    const bend = pose.bends?.[part as Limb] ?? 0;
    const [u, v, w] = lower ? rotate([p[0], p[1] - joint, p[2]], [bend, 0, 0]) : p;
    const [a, b, c] = rotate([u, v + (lower ? joint : 0), w], pose.angles[part]);
    const [rx, ry, rz] = rotate([a + px, b + py - 12, c + pz], root);
    return camera([rx, ry + 12 + pose.lift, rz]);
  }
  function normal(part: Part, n: Vec3, lower: boolean) {
    const bend = lower ? pose.bends?.[part as Limb] ?? 0 : 0;
    return camera(rotate(rotate(rotate(n, [bend, 0, 0]), pose.angles[part]), root));
  }
  return { pose, pivot, project, normal };
}

export function handAnchor(skin: Skin, view: AvatarView, hand: 'leftArm' | 'rightArm') {
  const [a, b] = rigFor(skin, view).project(hand, [0, -10, 1.6], true);
  return { x: view.x + a * view.scale, y: view.y - b * view.scale };
}

// Geometry is in texture-pixel units, with each cuboid offset relative to its pivot.
export function drawAvatar(ctx: CanvasRenderingContext2D, skin: Skin, view: AvatarView) {
  const { x, y, scale, highlight, headScale = 1 } = view;
  const { pose, pivot, project, normal } = rigFor(skin, view);
  const surfaces: Surface[] = [];
  for (const part of parts) {
    const [w, h, d] = dimensions(part, skin.model);
    const top = part === 'head' ? h : part.endsWith('Arm') ? 1 : 0;
    const bent = !!pose.bends?.[part as Limb];
    const transform = (p: Vec3, lower: boolean) => {
      // Scale both skin layers around the head center, before rotation at the neck.
      const mid = top - h / 2;
      const local: Vec3 = part === 'head' && headScale !== 1
        ? [p[0] * headScale, mid + (p[1] - mid) * headScale, p[2] * headScale] : p;
      return project(part, local, lower);
    };
    for (const outer of [false, true]) {
      const grow = outer ? part === 'head' ? .46 : .22 : 0;
      const uv = skinUV(part, skin.model, outer);
      for (const lower of bent ? [false, true] : [false]) {
        const high = lower ? pivot(part) + .2 : top + grow;
        const low = bent && !lower ? pivot(part) - .2 : top - h - grow;
        const geometry = faces(w / 2 + grow, high, low, d / 2 + grow);
        for (const face of Object.keys(geometry) as Face[]) {
          if (bent && (lower ? face === 'top' : face === 'bottom')) continue;
          const [a, b, c, direction] = geometry[face];
          if (normal(part, direction, lower)[2] <= .0001) continue;
          const A = transform(a, lower), B = transform(b, lower), C = transform(c, lower);
          const [u, v, fw, fh] = uv[face];
          const slice: Rect = bent && face !== 'top' && face !== 'bottom'
            ? [u, v + (lower ? fh / 2 : 0), fw, fh / 2] : uv[face];
          surfaces.push({ a: A, b: B, c: C, uv: slice, depth: (B[2] + C[2]) / 2 + (outer ? .04 : 0) });
        }
      }
    }
  }
  surfaces.sort((a, b) => a.depth - b.depth);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  for (const { a, b, c, uv } of surfaces) {
    ctx.save();
    ctx.transform((b[0] - a[0]) * scale, (a[1] - b[1]) * scale,
      (c[0] - a[0]) * scale, (a[1] - c[1]) * scale, x + a[0] * scale, y - a[1] * scale);
    ctx.drawImage(skin.image, ...uv, 0, 0, 1, 1);
    ctx.restore();
  }
  if (highlight) {
    const [, h] = dimensions(highlight, skin.model);
    const top = highlight === 'head' ? h : highlight.endsWith('Arm') ? 1 : 0;
    const [cx, cy] = project(highlight, [0, top - h / 2, 0]);
    ctx.beginPath();
    ctx.arc(x + cx * scale, y - cy * scale, scale * (highlight === 'head' ? 5.4 : 4.3), 0, 2 * Math.PI);
    ctx.strokeStyle = '#f0c774';
    ctx.lineWidth = Math.max(2, scale * .28);
    ctx.stroke();
  }
  ctx.restore();
}
