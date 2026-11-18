export const FPS = 30;
export const duration = 120;
export const chapters = [
  { id: '00', start: 0, end: 26, title: '开场与全局问题', note: '一批订单，两个问题' },
  { id: '01', start: 26, end: 48, title: '数据入湖与组织', note: '订单明细、目录与文件' },
  { id: '02', start: 48, end: duration, title: 'HDFS：分布式存储', note: '块、副本与故障恢复' },
] as const;

export type ChapterId = typeof chapters[number]['id'];
type Cue = readonly [at: number, caption: string];
const story = [
  { id: 'S01', chapter: '00', start: 0, title: '一批订单进入 Hadoop 后，\n会发生什么？', cues: [
    [0, '一条订单不难处理。每天涌入海量订单呢？'],
    [3.2, '既要按省汇总，也要按订单号查状态。'],
  ] },
  { id: 'S02', chapter: '00', start: 6, title: '从清洗好的数据开始', cues: [
    [0, '采集、清洗、去重、校验已经完成。'],
    [2.4, '跟着预处理好的订单进入 Hadoop。'],
  ] },
  { id: 'S03', chapter: '00', start: 12, title: '看图先分层，别画成一条线', cues: [
    [0, 'HDFS 存文件，YARN 分资源，计算框架跑任务。'],
    [3.6, 'MapReduce 和 Spark 是可选方案；分析和点查是两条分支。'],
  ] },
  { id: 'S04', chapter: '00', start: 20, title: 'Hadoop Common 是底座', cues: [
    [0, 'Common 提供共用的库、工具和基础接口。'],
    [2.5, '点线表示依赖，订单数据不经过 Common。'],
  ] },
  { id: 'S05', chapter: '01', start: 26, title: '三条订单，两种问题', cues: [
    [0, '这是同一批订单里的三条样例。'],
    [2.5, '按省份和金额汇总销售额。'],
    [4.3, '按订单号点查：O-1001 已发货。'],
  ] },
  { id: 'S06', chapter: '01', start: 34, title: '按日期组织文件', cues: [
    [0, '在 HDFS 中按日期划分目录。'],
    [3, '这批订单放进 11 月 16 日分区，格式以 Parquet 为例。'],
  ] },
  { id: 'S07', chapter: '01', start: 42, title: '别把每条订单都存成一个文件', cues: [
    [0, '海量小文件会增加元数据和调度开销。'],
    [2.4, '在同一分区合并小文件，记录不变。'],
  ] },
  { id: 'S08', chapter: '02', start: 48, title: 'HDFS：目录和数据分开', cues: [
    [0, 'NameNode 管文件目录和块的位置。'],
    [3.1, '真正的文件数据在各台 DataNode 上。'],
  ] },
  { id: 'S09', chapter: '02', start: 55, title: '先把大文件分成块', cues: [
    [0, '文件按配置切块，B1、B2、B3 只是示例。'],
    [2.9, '不同的块可以放在不同的机器上。'],
  ] },
  { id: 'S10', chapter: '02', start: 62, title: '写入：先问位置，再发数据', cues: [
    [0, '客户端向 NameNode 申请创建文件。'],
    [2.4, 'NameNode 返回目标 DataNode 列表。'],
    [4.6, '文件数据直写 DataNode，不经过 NameNode。'],
  ] },
  { id: 'S11', chapter: '02', start: 71, title: '同一个块，沿管线写出副本', cues: [
    [0, '同一个 B2 沿写入管线依次传给三个节点。'],
    [4.4, '这是一个块的三个副本，副本数可以配置。'],
  ] },
  { id: 'S12', chapter: '02', start: 79, title: '副本不挤在同一个机架', cues: [
    [0, '副本可以分布在不同机架。'],
    [3.5, '若这里的机架 A 失效，仍有机会从机架 B 读。'],
  ] },
  { id: 'S13', chapter: '02', start: 86, title: '读取：定位 B2，再就近读取', cues: [
    [0, '任务先找 NameNode 获取 B2 的副本位置。'],
    [4.1, 'DataNode 直接把块回传，能就近时优先就近。'],
  ] },
  { id: 'S14', chapter: '02', start: 94, title: '一台 DataNode 失联了', cues: [
    [0, 'NameNode 接收节点的心跳和块报告。'],
    [2, 'DN-A 心跳中断，超时后被标记为不可用。'],
    [5.3, '只要还有可读副本，就有机会改道继续读。'],
  ] },
  { id: 'S15', chapter: '02', start: 103, title: '从存活副本补足冗余', cues: [
    [0, '可用副本只剩两个，NameNode 指派重新复制。'],
    [2.5, 'DN-B 把 B2 复制给 DN-D。'],
    [5.7, '副本恢复到三个；这能降低风险，不保证数据不丢。'],
  ] },
  { id: 'S16', chapter: '02', start: 112, title: 'NameNode 高可用：保住目录服务', cues: [
    [0, '可选 HA：Active 写共享日志，Standby 同步。'],
    [3.3, '原 Active 失联，满足条件时可切换。'],
    [5.1, '接任的是目录服务，文件仍留在 DataNode。'],
  ] },
] as const satisfies ReadonlyArray<{ id: string; chapter: ChapterId; start: number; title: string; cues: readonly Cue[] }>;

export type SceneId = typeof story[number]['id'];
export const scenes = story.map((scene, index) => ({ ...scene, end: story[index + 1]?.start ?? duration }));

export function clampTime(seconds: number): number {
  return Number.isFinite(seconds) ? Math.min(duration, Math.max(0, seconds)) : 0;
}

export function frameAt(seconds: number) {
  const frame = Math.min(duration * FPS - 1, Math.floor(clampTime(seconds) * FPS + 1e-8));
  const scene = scenes.find((shot) => frame < shot.end * FPS) ?? scenes[scenes.length - 1];
  const elapsed = (frame - scene.start * FPS) / FPS;
  let caption: string = scene.cues[0][1];
  for (const [at, line] of scene.cues) if (elapsed >= at) caption = line;
  return { frame, scene, elapsed, caption };
}

export function timecode(seconds: number): string {
  const whole = Math.floor(seconds);
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
}
