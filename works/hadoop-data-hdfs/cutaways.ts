import { smooth, storyCues } from './timeline';
import type { SampleFrame } from './timeline';

// Each cut is motivated by the object we need to inspect, not by a timer in the DOM.
const inserts = [
  { id: 'lookup', start: 38, end: storyCues.lookup - .7 },
  { id: 'pulse', start: 67, end: storyCues.retry - .85 },
  { id: 'inventory', start: 100, end: Infinity },
] as const;
export function sheetsAt({ seconds: t }: SampleFrame, reduced: boolean) {
  const rise = (start: number) => reduced ? Number(t >= start) : smooth((t - start) / .65);
  const fall = (end: number) => reduced ? Number(t < end) : smooth((end - t) / .65);
  // Pre-lap the incoming sheet so pausing on a chapter mark never yields a blank shot.
  const lead = reduced ? 0 : .32;
  const insert = inserts.find(({ start, end }) => t >= start - lead && t < end + lead);
  let board = rise(storyCues.open);
  for (const { start, end } of inserts) board *= t < start ? fall(start) : rise(end);
  return { board, id: insert?.id, detail: insert ? rise(insert.start - lead) * fall(insert.end + lead) : 0 };
}

export function makeCutaways(svg: SVGSVGElement) {
  svg.innerHTML = `
    <g id="lookup">
      <path fill="#e4d8bb" d="M32 38H1246V473l-24 16-24-16-24 16-24-16-24 16-24-16-24 16-24-16-24 16-24-16-24 16-24-16H32Z"/>
      <g fill="#463c32"><text x="88" y="114" font-size="30">方块镇交易站　/　调阅联</text>
      <path stroke="#776648" stroke-width="2" stroke-dasharray="10 9" d="M88 151h1090M871 185v223"/>
      <text x="88" y="235" font-size="31">要读的文件</text><text x="88" y="325" font-size="71" font-weight="800">16 日交易明细</text>
      <text x="88" y="405" font-size="31">先按文件路径查位置，不按交易号查账。</text>
      <text x="924" y="235" font-size="30">跟踪块</text><text x="916" y="365" font-size="124" font-weight="800">B2</text></g>
    </g>
    <g id="pulse">
      <rect x="32" y="38" width="1214" height="461" rx="12" fill="#211e28" stroke="#995a68"/>
      <g fill="#f4dade"><text x="86" y="110" font-size="32">NameNode 观察记录　/　甲的心跳</text>
      <text x="86" y="421" font-weight="800" font-size="58" id="pulse-status"></text>
      <text x="1186" y="464" text-anchor="end" font-size="24">时间压缩示意 · 非配置值</text></g>
      <path stroke="#6c505c" stroke-dasharray="4 12" d="M86 260h1100"/>
      <path id="heartbeat-trace" d="M86 260h56l12-8 12-71 12 109 13-30h94l12-8 12-71 12 109 13-30h852" fill="none" stroke="#ff9199" stroke-width="6" pathLength="1"/>
    </g>
    <g id="inventory" fill="#d9f2f1">
      <rect x="32" y="38" width="1214" height="461" rx="12" fill="#142e34" stroke="#538d93"/>
      <text x="86" y="117" font-size="31">交易明细　/　B2 副本清点</text>
      <text x="84" y="238" font-size="89" font-weight="800">一块，三份。</text>
      ${['乙', '丙', '丁'].map((name, i) => `<g class="stamp" transform="translate(${88 + i * 290} 306)"><rect width="250" height="99" fill="none" stroke="#6ab4bd" stroke-width="3"/><text x="24" y="65" font-size="42">${name}　✓ B2</text></g>`).join('')}
    </g>`;
  const panels = [...svg.children];
  const trace = svg.querySelector('#heartbeat-trace')!;
  const status = svg.querySelector('#pulse-status')!;
  const stamps = [...svg.querySelectorAll('.stamp')];
  return (state: SampleFrame, reduced: boolean, sheet: ReturnType<typeof sheetsAt>) => {
    for (const g of panels) g.setAttribute('display', g.id === sheet.id ? 'inline' : 'none');
    svg.style.opacity = String(sheet.detail);
    svg.style.transform = `translateY(${(1 - sheet.detail) * (reduced ? 0 : 9)}%)`;
    if (sheet.id === 'pulse') {
      const q = reduced ? 1 : smooth((state.seconds - 67) / 7.4);
      trace.setAttribute('stroke-dasharray', `${q} 2`);
      status.textContent = state.seconds < 67 ? '观察下一次心跳' : state.seconds >= 75 ? '超时，标为不可用' : '未再收到，等待超时…';
    } else if (sheet.id === 'inventory') {
      stamps.forEach((g, i) => g.setAttribute('opacity', String(reduced ? 1 : smooth((state.seconds - 100.35 - i * .32) / .4))));
    }
  };
}
