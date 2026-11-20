import type { NodeState, Route, SampleFrame } from './timeline';

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

const motionPaths: Partial<Record<Route, string>> = { write: 'M112 441H877', ack: 'M877 441H112' };
const controls = new Set<Route>(['request', 'reply', 'ack', 'heartbeat', 'order']);
const states: Record<NodeState, string> = { empty: '—', copy: '●  B2', corrupt: '校验不符', offline: '超时不可用', suspect: '等待超时' };

export function makeDiagram(svg: SVGSVGElement) {
  svg.innerHTML = `
    <defs>
      <marker id="arrow-control" markerWidth="9" markerHeight="10" refX="7" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1l6 4-6 4" fill="none" stroke="var(--control-edge)" stroke-width="2"/></marker>
      <marker id="arrow-data" markerWidth="13" markerHeight="14" refX="10" refY="7" orient="auto" markerUnits="userSpaceOnUse"><path d="M2 2l8 5-8 5" fill="none" stroke="var(--accent)" stroke-width="2.8"/></marker>
      <marker id="arrow-ack" markerWidth="13" markerHeight="14" refX="10" refY="7" orient="auto" markerUnits="userSpaceOnUse"><path d="M2 2l8 5-8 5" fill="none" stroke="var(--control-edge)" stroke-width="2.5"/></marker>
    </defs>
    <rect class="layer" x="1" y="1" width="1278" height="263" rx="26"/>
    <rect class="layer data-layer" x="1" y="282" width="1278" height="283" rx="26"/>
    <text class="diagram-eyebrow" x="28" y="46">01 / 控制和元数据</text>
    <path class="legend-line control" d="M1030 38h42"/><text class="diagram-legend" x="1090" y="46">虚线 · 请求／确认</text>
    <text class="diagram-eyebrow" x="28" y="330">02 / 数据传输</text>
    <path class="legend-line data" d="M1030 322h42"/><text class="diagram-legend" x="1090" y="330">实线 · 文件字节</text>
    <g id="routes" fill="none"><path class="route"/><path class="route"/><path class="route"/></g>
    <path id="motion-path" fill="none" stroke="none"/>
    <circle id="packet" r="8" visibility="hidden"/>
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
    <text class="route-tag" id="route-tag" x="1249" y="543" text-anchor="end"></text>`;

  const lines = [...svg.querySelectorAll<SVGPathElement>('.route')];
  const motion = svg.querySelector<SVGPathElement>('#motion-path')!;
  const token = svg.querySelector<SVGCircleElement>('#packet')!;
  const statusCards = [...svg.querySelectorAll<SVGGElement>('.node')].slice(1);
  const meta = svg.querySelector('#meta-label')!;
  const tag = svg.querySelector('#route-tag')!;
  let routeKey = '';
  let routeLength = 0;
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
      const trajectory = motionPaths[route] ?? segments[0] ?? '';
      motion.setAttribute('d', trajectory);
      routeLength = trajectory ? motion.getTotalLength() : 0;
      token.setAttribute('class', control ? 'control-token' : 'data-token');
      meta.textContent = beat.meta;
      tag.textContent = state.tag;
    }
    const progress = state.progress;
    const show = routeLength > 0 && progress > 0 && progress < 1 && !reduced && route !== 'heartbeat';
    token.setAttribute('visibility', show ? 'visible' : 'hidden');
    if (show) {
      const p = motion.getPointAtLength(progress * routeLength);
      token.setAttribute('cx', String(p.x));
      token.setAttribute('cy', String(p.y));
    }
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
