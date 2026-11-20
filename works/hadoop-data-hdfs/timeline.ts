export const fps = 30;
export const duration = 106;
export const frameCount = duration * fps;
export const storyCues = { open: 4.5, place: 17.5, launch: 18, lookup: 42, retry: 76.5 } as const;
export const writeLaunch = storyCues.launch - 15;
export const writeTravel = 5.7;
export const repairLaunch = .65;
export const repairTravel = 3.3;

export const chapters = [
  { cue: '01', source: '第 06 章节选', title: '写入管线', description: '同一个 B2，沿管线写出三份。', start: 0 },
  { cue: '02', source: '第 06 章节选', title: '读取与校验', description: '先查位置，再直接读可用副本。', start: 38 },
  { cue: '03', source: '第 07 章节选', title: '失联与补副本', description: '改读和恢复冗余，是两件事。', start: 67 },
] as const;

export type NodeState = 'empty' | 'copy' | 'suspect' | 'offline' | 'corrupt';
export type Route = 'none' | 'request' | 'reply' | 'locate' | 'write' | 'ack' | 'readA' | 'readB' | 'heartbeat' | 'order' | 'repair';
type Beat = { start: number; title: string; deck: string; caption: string; tag: string; meta: string;
  route: Route; states: readonly [NodeState, NodeState, NodeState, NodeState] };
const empty = ['empty', 'empty', 'empty', 'empty'] as const;
const triple = ['copy', 'copy', 'copy', 'empty'] as const;
const down = ['offline', 'copy', 'copy', 'empty'] as const;

export const beats: readonly Beat[] = [
  { start: 0, title: '镇长要查昨天的账', deck: 'MC 交易站 · 16 日交易明细',
    caption: '镇长要查昨晚那笔六颗绿宝石的橡木交易。明细文件已经整理好，先把它存住。', tag: '创建请求', meta: '登记文件路径',
    route: 'request', states: empty },
  { start: 8, title: '拿到 B2 的写入目标', deck: 'NameNode 选节点，不接收文件内容',
    caption: '分配新块时，NameNode 返回本例的目标：甲、乙、丙。', tag: '返回目标', meta: 'B2 → 甲、乙、丙',
    route: 'reply', states: empty },
  { start: 15, title: '同一个 B2，沿管线转发', deck: '三台写的是 B2 的副本，不是三个不同的逻辑块',
    caption: '客户端把 B2 的字节分包发给甲，甲边写边转给乙，乙再转给丙。', tag: '数据包 →', meta: '不转发文件字节',
    route: 'write', states: triple },
  { start: 28, title: '确认反向回来', deck: '这是数据包的确认，不是整文件写完',
    caption: '确认由丙经乙、甲回到客户端；全部块写完后，还要成功关闭文件。', tag: '← ACK 数据包确认', meta: '数据绕过 NameNode',
    route: 'ack', states: triple },
  { start: 38, title: '现在，把明细读回来', deck: '要核对那笔交易，先拿回文件数据；HDFS 不按交易编号查账',
    caption: '要核对那笔橡木账，先读明细文件。按下查位置，客户端才去问 NameNode。', tag: '查询 B2 的位置', meta: '候选：甲、乙、丙',
    route: 'locate', states: triple },
  { start: 46, title: '直接读较近的副本', deck: '本例先读甲，字节直接回到客户端',
    caption: '客户端从较近且可用的甲读取 B2，并检查读回的数据。', tag: '← 从甲读 B2', meta: '只负责提供位置',
    route: 'readA', states: triple },
  { start: 56, title: '校验不符，就换副本', deck: '这是一个独立的损坏假设，不是节点失联',
    caption: '如果甲返回的内容校验不符，客户端可以改从乙读，不必拼三份。', tag: '← 从乙读 B2', meta: '尚有可读副本',
    route: 'readB', states: ['corrupt', 'copy', 'copy', 'empty'] },
  { start: 67, title: '换个故障：甲不再报心跳', deck: '心跳报告在线；块报告列出已持有的块',
    caption: '甲失联后，NameNode 不是立刻判死；要等到心跳超时。', tag: '心跳中断 · 等待超时', meta: '等待超时判定',
    route: 'heartbeat', states: ['suspect', 'copy', 'copy', 'empty'] },
  { start: 75, title: '少一份，B2 仍然可读', deck: '甲超时后不可用；乙、丙仍各有一份',
    caption: '这次改读乙。要读完整个文件，其他块也得各有一份可读副本。', tag: '← 从乙读 B2', meta: '甲超时 · 已标为不可用',
    route: 'readB', states: down },
  { start: 85, title: '能读，还没恢复到三份', deck: 'NameNode 调度，DataNode 复制',
    caption: '有合适的节点时，NameNode 安排乙把 B2 复制给丁。', tag: '安排复制 · 乙 → 丁', meta: '下达补副本指令',
    route: 'order', states: down },
  { start: 92, title: '乙发字节，丁存副本', deck: '调度走控制层；B2 的字节在节点之间传输',
    caption: '乙向丁传输 B2；等丁的副本就绪，可用副本回到三份。', tag: '补副本 · 乙 → 丁', meta: '本次只补 B2',
    route: 'repair', states: ['offline', 'copy', 'copy', 'copy'] },
  { start: 100, title: '回到三份，不等于有备份', deck: '一个逻辑块 B2 · 三个可读副本：乙、丙、丁',
    caption: '如果同一块的所有副本都丢失，HDFS 不能凭空补出来。', tag: '补齐完成 · 3 / 3', meta: '副本不是独立备份',
    route: 'none', states: ['offline', 'copy', 'copy', 'copy'] },
];

export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export function smooth(v: number) { const q = clamp(v); return q * q * (3 - 2 * q); }

function activeAt(marks: readonly { start: number }[], seconds: number) {
  const next = marks.findIndex(mark => mark.start > seconds);
  return next === -1 ? marks.length - 1 : next - 1;
}

export function frameAt(position: number) {
  const frame = Math.max(0, Math.min(frameCount, Math.floor(position)));
  const seconds = frame / fps;
  const index = activeAt(beats, seconds);
  const chapter = activeAt(chapters, seconds);
  const beat = beats[index];
  const local = seconds - beat.start;
  const length = (beats[index + 1]?.start ?? duration) - beat.start;
  // The same clock drives the character's contact, the reveal and the request.
  const waiting = index === 0 && seconds < storyCues.open || beat.route === 'locate' && seconds < storyCues.lookup
    || beat.states[0] === 'offline' && beat.route === 'readB' && seconds < storyCues.retry;
  const lookupReply = storyCues.lookup + 1.8;
  const route = waiting ? 'none' : beat.route === 'locate' ? seconds < lookupReply ? 'request' : 'reply' : beat.route;
  const tag = index === 0 && waiting ? '' : waiting ? '等待操作'
    : beat.route === 'locate' && route === 'reply' ? '返回 B2 的位置'
    : route === 'write' && local < writeLaunch ? '演示道具 · 放到客户端写入口' : beat.tag;
  const start = index === 0 ? storyCues.open : beat.route === 'locate' ? route === 'reply' ? lookupReply : storyCues.lookup
    : beat.states[0] === 'offline' && beat.route === 'readB' ? storyCues.retry : beat.start + (route === 'write' ? writeLaunch : repairLaunch);
  const travel = route === 'write' ? writeTravel : route === 'repair' ? repairTravel : beat.route === 'locate' ? 1.55 : index === 0 ? 2.4 : 3.8;
  const progress = waiting ? 0 : clamp((seconds - start) / travel);
  const diagramReveal = smooth((seconds - storyCues.open) / .8);
  const sceneReveal = (index === 0 ? 1 : smooth((local + .12) / .64))
    * (index === beats.length - 1 ? 1 : smooth((length - local + .12) / .42));
  const routeReveal = waiting ? 0 : smooth((seconds - start + (route === 'write' ? .55 : .12)) / .46);
  const caption = index === 0 && seconds >= storyCues.open ? '打开写入操作台。客户端先向 NameNode 申请创建文件，不把字节交给它。' : beat.caption;
  const meta = beat.route === 'locate' && route !== 'reply' ? '按文件路径查位置' : beat.meta;
  const states = beat.states.map((state, i): NodeState => {
    if (beat.route === 'write' && progress < [1 / 3, 2 / 3, 1][i]) return 'empty';
    if (beat.route === 'repair' && i === 3 && progress < 1) return 'empty';
    return state;
  });
  const copies = states.filter(state => state === 'copy').length;
  return { frame, seconds, index, chapter, beat, route, tag, progress, local, length, states, copies, caption, meta, diagramReveal, sceneReveal, routeReveal };
}
export type SampleFrame = ReturnType<typeof frameAt>;

export function timecode(frame: number) {
  const seconds = Math.floor(frame / fps);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
