import { poseAt, rotate } from './motion';
import type { Action, Pose, Vec3 } from './motion';
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
  function project(part: Part, p: Vec3) {
    const [px, py, pz] = pivots[part];
    const [a, b, c] = rotate(p, pose.angles[part]);
    return camera([a + px, b + py + pose.lift, c + pz]);
  }
  return { pose, camera, pivots, project };
}

export function handAnchor(skin: Skin, view: AvatarView, hand: 'leftArm' | 'rightArm') {
  const [a, b] = rigFor(skin, view).project(hand, [0, -10, 1.6]);
  return { x: view.x + a * view.scale, y: view.y - b * view.scale };
}

// Geometry is in texture-pixel units, with each cuboid offset relative to its pivot.
export function drawAvatar(ctx: CanvasRenderingContext2D, skin: Skin, view: AvatarView) {
  const { x, y, scale, highlight, headScale = 1 } = view;
  const { pose, camera, pivots, project } = rigFor(skin, view);
  const surfaces: Surface[] = [];
  for (const part of parts) {
    const [w, h, d] = dimensions(part, skin.model);
    const top = part === 'head' ? h : part.endsWith('Arm') ? 1 : 0;
    const angle = pose.angles[part];
    const transform = (p: Vec3) => {
      // Scale both skin layers around the head center, before rotation at the neck.
      const mid = top - h / 2;
      const local: Vec3 = part === 'head' && headScale !== 1
        ? [p[0] * headScale, mid + (p[1] - mid) * headScale, p[2] * headScale] : p;
      return project(part, local);
    };
    for (const outer of [false, true]) {
      const grow = outer ? part === 'head' ? .46 : .22 : 0;
      const uv = skinUV(part, skin.model, outer);
      const geometry = faces(w / 2 + grow, top + grow, top - h - grow, d / 2 + grow);
      for (const face of Object.keys(geometry) as Face[]) {
        const [a, b, c, normal] = geometry[face];
        if (camera(rotate(normal, angle))[2] <= .0001) continue;
        const A = transform(a), B = transform(b), C = transform(c);
        surfaces.push({
          a: A, b: B, c: C, uv: uv[face],
          depth: (B[2] + C[2]) / 2 + (outer ? .04 : 0),
        });
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
    const [px, py, pz] = pivots[highlight];
    const [, h] = dimensions(highlight, skin.model);
    const top = highlight === 'head' ? h : highlight.endsWith('Arm') ? 1 : 0;
    const [cx, cy] = camera([px, py + top - h / 2 + pose.lift, pz]);
    ctx.beginPath();
    ctx.arc(x + cx * scale, y - cy * scale, scale * (highlight === 'head' ? 5.4 : 4.3), 0, 2 * Math.PI);
    ctx.strokeStyle = '#f0c774';
    ctx.lineWidth = Math.max(2, scale * .28);
    ctx.stroke();
  }
  ctx.restore();
}
