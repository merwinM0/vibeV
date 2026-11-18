export const FPS = 30;
export const duration = 224;
export const chapters = [
  { id: '00', start: 0, end: 52, title: '开场与全局问题', note: '一批订单，两个问题' },
  { id: '01', start: 52, end: 93, title: '数据入湖与组织', note: '订单明细、目录与文件' },
  { id: '02', start: 93, end: duration, title: 'HDFS：分布式存储', note: '块、副本与故障恢复' },
] as const;

export type ChapterId = typeof chapters[number]['id'];
type Cue = readonly [at: number, caption: string];
const story = [
  { id: 'S01', chapter: '00', start: 0, title: '一批订单进入 Hadoop 后，\n会发生什么？', cues: [
    [0, '从一条订单开始：如果每天都有海量订单，我们该怎么处理？'],
    [6, '既要统计各省的订单数和销售额，也要能查到单笔订单的状态。'],
  ] },
  { id: 'S02', chapter: '00', start: 12, title: '从清洗好的数据开始', cues: [
    [0, '采集、清洗、去重和校验已经完成。'],
    [7, '接下来，跟着这批订单进入 Hadoop。'],
  ] },
  { id: 'S03', chapter: '00', start: 26, title: '看图先分层，别画成一条线', cues: [
    [0, 'HDFS 保存文件，YARN 为应用分配资源，计算框架执行任务。'],
    [7, 'MapReduce 和 Spark 是可选计算方案；SQL 分析和订单点查是两条分支。'],
  ] },
  { id: 'S04', chapter: '00', start: 40, title: 'Hadoop Common 是底座', cues: [
    [0, 'Common 为 Hadoop 核心模块提供共用的文件系统接口、工具与运行基础。'],
    [6, '这里的点线是依赖关系。订单并不会流过 Common。'],
  ] },
  { id: 'S05', chapter: '01', start: 52, title: '三条订单，两种问题', cues: [
    [0, '先看样例明细：订单号、用户、省份、金额、状态和时间。'],
    [6, '汇总统计看日期、省份和金额；按订单号就能查到一条订单的状态。'],
  ] },
  { id: 'S06', chapter: '01', start: 65, title: '按日期组织文件', cues: [
    [0, '把清洗好的订单写入 HDFS，例如按日期划分目录。'],
    [7, '这里用 Parquet 举例。目录和格式规划好了，数据更好扫描和管理。'],
  ] },
  { id: 'S07', chapter: '01', start: 80, title: '别把每条订单都存成一个文件', cues: [
    [0, '文件数量太多，元数据和后续任务的调度开销都会增加。'],
    [6, '在合适的分区内合并小文件。记录没变，但文件更少、大小更合理。'],
  ] },
  { id: 'S08', chapter: '02', start: 93, title: 'HDFS：目录和数据分开', cues: [
    [0, 'HDFS 让多台机器一起存文件。NameNode 管文件目录和块的位置。'],
    [7, '真正的文件数据在各台 DataNode 上。'],
  ] },
  { id: 'S09', chapter: '02', start: 107, title: '先把大文件分成块', cues: [
    [0, 'HDFS 按配置将文件分块。画面中的三个块只是示例。'],
    [6, '不同的数据块可以分布在不同机器上，大文件不必塞进一台机器。'],
  ] },
  { id: 'S10', chapter: '02', start: 121, title: '写入：先问位置，再发数据', cues: [
    [0, '客户端向 NameNode 申请创建文件。'],
    [5, 'NameNode 返回目标 DataNode 列表。'],
    [10, '客户端直接把块发给 DataNode，文件内容不经过 NameNode。'],
  ] },
  { id: 'S11', chapter: '02', start: 137, title: '同一个块，沿管线写出副本', cues: [
    [0, '副本数可配置。这里设为 3，把同一个块 B2 沿写入管线传递。'],
    [8, 'DN-A、DN-B、DN-C 都保存 B2 的一个副本，不是三个不同数据块。'],
  ] },
  { id: 'S12', chapter: '02', start: 153, title: '副本不挤在同一个机架', cues: [
    [0, '放置副本会考虑机架布局。这里示意两个机架上的三个 B2 副本。'],
    [7, '一台机器或部分机架不可用时，仍有机会从其他副本读到数据。'],
  ] },
  { id: 'S13', chapter: '02', start: 167, title: '读取：定位 B2，再就近读取', cues: [
    [0, '计算任务先通过 NameNode 获取 B2 的副本位置。'],
    [7, '任务直接从 DataNode 读取块数据，条件允许时优先选就近副本。'],
  ] },
  { id: 'S14', chapter: '02', start: 182, title: '一台 DataNode 失联了', cues: [
    [0, 'DataNode 用心跳报告存活，也用块报告告知 NameNode 自己持有哪些块。'],
    [5, 'DN-A 停止发送心跳。NameNode 超时后将它标记为不可用。'],
    [10, '只要还有可读副本，客户端就有机会改从其他节点继续读取。'],
  ] },
  { id: 'S15', chapter: '02', start: 197, title: '从存活副本补足冗余', cues: [
    [0, 'B2 的可用副本低于目标数。NameNode 安排健康节点重新复制。'],
    [7, 'DN-D 补上 B2 的新副本。重新复制能降低风险，不能保证数据不丢。'],
  ] },
  { id: 'S16', chapter: '02', start: 211, title: 'NameNode 高可用：保住目录服务', cues: [
    [0, '可选 HA 部署：Active 写入共享编辑日志，Standby 读取日志并同步元数据。'],
    [7, '满足故障切换条件时，Standby 可以接任；文件数据仍由 DataNode 保存。'],
  ] },
] as const satisfies ReadonlyArray<{ id: string; chapter: ChapterId; start: number; title: string; cues: readonly Cue[] }>;

export type SceneId = typeof story[number]['id'];
export const scenes = story.map((scene, index) => ({ ...scene, end: story[index + 1]?.start ?? duration }));

export function clampTime(seconds: number): number {
  return Number.isFinite(seconds) ? Math.min(duration, Math.max(0, seconds)) : 0;
}

export function frameAt(seconds: number) {
  const frame = Math.min(duration * FPS - 1, Math.floor(clampTime(seconds) * FPS + 1e-8));
  const sceneTime = frame / FPS;
  const scene = scenes.find((shot) => sceneTime < shot.end) ?? scenes[scenes.length - 1];
  const elapsed = sceneTime - scene.start;
  let caption: string = scene.cues[0][1];
  for (const [at, line] of scene.cues) if (elapsed + 1e-8 >= at) caption = line;
  return { frame, scene, elapsed, caption };
}

export function timecode(seconds: number): string {
  const whole = Math.floor(seconds);
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
}
