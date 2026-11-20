import { clamp, writeLaunch } from './timeline';
import type { NodeState, Route, SampleFrame } from './timeline';
import { intake } from './stage';

const nodes = [
  { x: 24, name: '客户端', kind: 'CLIENT' },
  { x: 277, name: 'DataNode 甲', kind: '机架 01' },
  { x: 533, name: 'DataNode 乙', kind: '机架 02' },
  { x: 789, name: 'DataNode 丙', kind: '机架 02' },
  { x: 1045, name: 'DataNode 丁', kind: '机架 01' },
];

const stroke = {
  none: [], locate: [], request: ['M200 407H239V156H455'], reply: ['M455 156H239V407H200'],
  write: ['M200 441H277', 'M453 441H533', 'M709 441H789'],
  ack: ['M789 441H709', 'M533 441H453', 'M277 441H200'],
  readA: ['M277 441H200'], readB: ['M621 491V521H112V491'],
  heartbeat: ['M365 391V219H507V194'], order: ['M637 194V241H621V391'],
  repair: ['M621 391V352H1133V391'],
} satisfies Record<Route, string[]>;

const motionPaths: Partial<Record<Route, string[]>> = {
  write: [`M${intake.x} ${intake.y}V441H365`, 'M365 441H621', 'M621 441H877'],
  ack: ['M877 441H112'],
};
const controls = new Set<Route>(['request', 'reply', 'ack', 'heartbeat', 'order']);
const states: Record<NodeState, string> = { empty: '—', copy: '●  B2', corrupt: '校验不符', offline: '超时不可用', suspect: '等待超时' };

export function makeDiagram(svg: SVGSVGElement) {
  svg.innerHTML = `
    <defs>
      <marker id="arrow-control" markerWidth="9" markerHeight="10" refX="7" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1l6 4-6 4" fill="none" stroke="var(--film-control)" stroke-width="2"/></marker>
      <marker id="arrow-data" markerWidth="13" markerHeight="14" refX="10" refY="7" orient="auto" markerUnits="userSpaceOnUse"><path d="M2 2l8 5-8 5" fill="none" stroke="var(--film-data)" stroke-width="2.8"/></marker>
      <marker id="arrow-ack" markerWidth="13" markerHeight="14" refX="10" refY="7" orient="auto" markerUnits="userSpaceOnUse"><path d="M2 2l8 5-8 5" fill="none" stroke="var(--film-control)" stroke-width="2.5"/></marker>
    </defs>
    <rect class="layer" x="1" y="1" width="1278" height="263" rx="26"/>
    <rect class="layer data-layer" x="1" y="282" width="1278" height="283" rx="26"/>
    <text class="diagram-eyebrow" x="28" y="46">01 / 控制和元数据</text>
    <path class="legend-line control" d="M1030 38h42"/><text class="diagram-legend" x="1090" y="46">虚线 · 请求／确认</text>
    <text class="diagram-eyebrow" x="28" y="330">02 / 数据传输</text>
    <path class="legend-line data" d="M1030 322h42"/><text class="diagram-legend" x="1090" y="330">实线 · 文件字节</text>
    <g id="routes" fill="none"><path class="route"/><path class="route"/><path class="route"/></g>
    <g id="intake" visibility="hidden"><rect class="intake" x="${intake.x - 24}" y="${intake.y - 24}" width="48" height="48" rx="9"/></g>
    <g id="motion-paths"><path fill="none" stroke="none"/><path fill="none" stroke="none"/><path fill="none" stroke="none"/></g>
    <g transform="translate(455 81)">
      <rect class="name-card" width="365" height="113" rx="20"/>
      <g class="nn-icon" transform="translate(20 24)"><rect width="49" height="49" rx="13"/><path d="M13 16h23M13 24.5h23M13 33h15"/></g>
      <text class="node-title" x="85" y="46">NameNode</text>
      <text class="node-note" x="85" y="81">目录、文件和块位置</text>
    </g>
    <g transform="translate(904 103)">
      <text class="diagram-legend" x="0" y="21">当前操作</text>
      <text class="meta-label" id="meta-label" x="0" y="62"></text>
    </g>
    <g id="node-cards">${nodes.map(({ x, name, kind }, i) => `
      <g class="node" data-state="${i === 0 ? 'client' : 'empty'}" transform="translate(${x} 391)">
        <text class="node-rack mono" x="8" y="-13">${kind}</text>
        <rect class="data-card" width="176" height="100" rx="17"/>
        <text class="node-title" x="15" y="37">${name}</text>
        <text class="node-note state-label" x="15" y="75">${i === 0 ? '文件读写' : '—'}</text>
      </g>`).join('')}
    </g>
    <g id="signals" visibility="hidden">${Array.from({ length: 7 }, (_, i) => `<circle class="signal ${i === 0 ? 'signal-lead' : ''}" r="${i === 0 ? 7.8 : 4 - i * .37}" opacity="${1 - i * .12}"/>`).join('')}</g>
    <text class="route-tag" id="route-tag" x="1249" y="543" text-anchor="end"></text>`;

  const lines = [...svg.querySelectorAll<SVGPathElement>('.route')];
  const motion = [...svg.querySelectorAll<SVGPathElement>('#motion-paths path')];
  const token = svg.querySelector<SVGGElement>('#signals')!;
  const sparks = [...token.querySelectorAll('circle')];
  const socket = svg.querySelector('#intake')!;
  const routeGroup = svg.querySelector('#routes')!;
  const statusCards = [...svg.querySelectorAll<SVGGElement>('.node')].slice(1);
  const meta = svg.querySelector('#meta-label')!;
  const tag = svg.querySelector('#route-tag')!;
  let routeKey = '';
  let lengths: number[] = [];
  let lastStates = '';

  return (state: SampleFrame, reduced: boolean) => {
    const { beat, route } = state;
    const key = `${state.index}/${route}`;
    if (routeKey !== key) {
      routeKey = key;
      const segments = stroke[route];
      const control = controls.has(route);
      const marker = route === 'ack' ? 'ack' : control ? 'control' : 'data';
      for (const [i, path] of lines.entries()) {
        path.setAttribute('d', segments[i] ?? '');
        path.setAttribute('class', `route ${control ? 'control' : 'data'}${route === 'heartbeat' ? ' interrupted' : ''}`);
        path.setAttribute('marker-end', segments[i] && route !== 'heartbeat' ? `url(#arrow-${marker})` : 'none');
      }
      const trajectories = motionPaths[route] ?? segments.slice(0, 1);
      lengths = motion.map((path, i) => {
        const d = trajectories[i] ?? '';
        path.setAttribute('d', d);
        return d ? path.getTotalLength() : 0;
      }).slice(0, trajectories.length);
      sparks.forEach(spark => spark.classList.toggle('control-signal', control));
      socket.setAttribute('visibility', route === 'write' ? 'visible' : 'hidden');
      meta.textContent = beat.meta;
    }
    if (tag.textContent !== state.tag) tag.textContent = state.tag;
    const progress = state.progress;
    const show = lengths.length > 0 && progress > 0 && progress < 1 && !reduced && route !== 'heartbeat';
    token.setAttribute('visibility', show ? 'visible' : 'hidden');
    routeGroup.setAttribute('opacity', route === 'write' && state.local < writeLaunch ? '.32' : '1');
    if (show) sparks.forEach((spark, i) => {
      const q = (progress - .014 * i) * lengths.length;
      spark.setAttribute('visibility', q < 0 ? 'hidden' : 'inherit');
      const part = Math.min(lengths.length - 1, Math.max(0, Math.floor(q)));
      const p = motion[part].getPointAtLength(clamp(q - part) * lengths[part]);
      spark.setAttribute('cx', String(p.x));
      spark.setAttribute('cy', String(p.y));
    });
    else sparks.forEach(spark => {
      spark.removeAttribute('visibility');
      spark.removeAttribute('cx');
      spark.removeAttribute('cy');
    });
    const signature = state.states.join('/');
    if (signature !== lastStates) {
      lastStates = signature;
      state.states.forEach((status, i) => {
        const node = statusCards[i];
        node.dataset.state = status;
        node.querySelector('.state-label')!.textContent = states[status];
      });
    }
  };
}
