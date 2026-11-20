import { chapters, FPS, scenes, type SceneId } from './timeline';

type Line = readonly [start: number, end: number, shot: SceneId, caption: string, visualBeat?: number];
type Take = { file: string; keepSeconds: number; lines: readonly Line[] };

// Source times (seconds) follow the original delivery in each take. The film
// follows this sequence, never the numeric order of the storyboard's shot IDs.
// Only the identical AI outro is trimmed from p1–p3; p4 keeps the final copy.
export const narrationTakes: readonly Take[] = [
  { file: 'p1.mp3', keepSeconds: 44.95, lines: [
    [.20, 1.55, 'S02', '同一批订单进来，'],
    [1.95, 6.04, 'S06', '存储层先把文件按天放进 HDFS 目录。'],
    [6.32, 8.65, 'S08', 'NameNode 管目录和块位置，'],
    [9.15, 10.62, 'S08', 'DataNode 存数据块。', 3.2],
    [10.86, 12.79, 'S09', '大文件按配置切块。'],
    [13.02, 15.90, 'S10', '写时先向 NameNode 申请目标位置，'],
    [16.26, 17.62, 'S11', '再沿管线传副本，'],
    [17.82, 18.86, 'S12', '并跨机架分布。'],
    [19.48, 20.82, 'S13', '读时先问位置，'],
    [21.00, 22.79, 'S13', '再优先读近的可用副本。', 3.2],
    [23.15, 25.73, 'S14', '节点心跳超时就标记不可用，'],
    [25.94, 27.73, 'S15', '并由 NameNode 安排补副本。'],
    [28.28, 30.00, 'S16', '目录服务也能做高可用。'],
    [30.36, 31.52, 'S17', '仓库数据不动，'],
    [31.91, 34.42, 'S17', '按省汇总的任务去 YARN 申请资源。', 2.5],
    [34.89, 36.77, 'S18', '资源管理器全局分资源，'],
    [37.15, 39.75, 'S18', '节点管理器管本机容器并报状态。'],
    [39.99, 41.32, 'S19', '先起应用主管，'],
    [41.48, 42.57, 'S19', '再申请任务容器。', 3.7],
    [42.92, 44.47, 'S21', '任务尽量挨着数据跑。'],
  ] },
  { file: 'p2.mp3', keepSeconds: 44.05, lines: [
    [.14, 3.03, 'S32', '同一道题可用 MapReduce 或 Spark。'],
    [3.60, 5.14, 'S23', 'Map 读各自输入分片，'],
    [5.42, 7.31, 'S24', '以省份为键、金额为值。'],
    [7.59, 9.95, 'S26', 'Shuffle 先分区，再传输排序。'],
    [10.53, 11.51, 'S25', '局部求和可选。'],
    [11.97, 13.44, 'S27', '每组数单加金额后，'],
    [13.67, 16.53, 'S28', '把汇总结果写回 HDFS 另一目录，'],
    [16.87, 17.99, 'S28', '而不覆盖订单明细。'],
    [18.73, 20.73, 'S29', 'Spark 则把计算排成依赖图，'],
    [20.87, 22.99, 'S29', '由 Driver 协调、Executor 执行。', 3.3],
    [23.28, 24.82, 'S31', '中间结果可缓存，'],
    [25.07, 26.64, 'S31', '但 Shuffle 仍可能用磁盘。', 3],
    [27.42, 28.96, 'S33', 'Hive 作为 SQL 入口，'],
    [29.20, 31.89, 'S34', '查 Metastore 里的列、分区和文件路径。'],
    [32.19, 34.25, 'S34', '订单文件还在 HDFS。'],
    [34.62, 36.62, 'S35', '按天分区后，查询只扫当天。'],
    [36.86, 38.27, 'S36', '查询服务做优化，'],
    [38.44, 40.21, 'S36', '再把执行计划交给计算引擎。', 4.8],
    [40.83, 43.55, 'S37', 'Hive 是入口，不是存储，也不负责分资源。'],
  ] },
  { file: 'p3.mp3', keepSeconds: 41, lines: [
    [.21, 1.59, 'S39', '报表回答卖多少，'],
    [2.00, 3.46, 'S39', '点查发货状态，', 2.7],
    [3.46, 7.04, 'S40', '则从明细单独加工一份进 HBase 服务表。'],
    [7.27, 8.83, 'S41', '以订单号当行键，'],
    [9.07, 12.67, 'S41', '按范围切表分给不同服务器，并避免热点。', 2.8],
    [13.01, 15.92, 'S42', '写入先记预写日志，再更新内存。'],
    [16.18, 19.31, 'S42', '后台刷成 HFile，通常落 HDFS。', 4.15],
    [19.53, 22.34, 'S43', '先找管键的服务器，再按订单号读。'],
    [22.65, 24.22, 'S43', '结果回来是已发货。', 4.4],
    [25.09, 26.88, 'S44', '但查得快不代表数据新。'],
    [27.12, 30.42, 'S44', '服务表每天才装一次，就可能秒回旧状态。', 2.8],
    [30.74, 32.34, 'S45', 'Hive 适合扫表汇总，'],
    [32.73, 34.60, 'S45', 'HBase 适合按行键读写。'],
    [35.34, 36.57, 'S46', '订单到齐先校验，'],
    [36.78, 38.71, 'S46', '报表和服务表各自更新，', 2.85],
    [39.02, 40.47, 'S46', '两边做完再发通知。', 5.2],
  ] },
  { file: 'p4.mp3', keepSeconds: 61.16, lines: [
    [.19, 4.03, 'S47', 'Oozie 曾做工作流编排，但二零二五年已退役。'],
    [4.74, 6.36, 'S48', '编排决定谁先启动，'],
    [6.76, 9.03, 'S48', 'YARN 决定启动后给多少资源。', 2.7],
    [9.39, 12.62, 'S49', 'ZooKeeper 只传协调状态，不传订单数据。'],
    [13.30, 15.98, 'S50', '算挂了可重试，存储有副本，'],
    [16.32, 19.94, 'S50', '工作流能按规则告警，三层各解决一类问题。'],
    [20.80, 23.35, 'S51', '同一天重跑，不能把销售额加两遍。'],
    [23.60, 26.81, 'S51', '比如覆盖当天结果，再核对单数和金额。', 3.2],
    [27.43, 29.06, 'S52', '先验身份，再查权限。'],
    [29.40, 32.91, 'S52', '异常从资源指标、日志和告警里找线索。', 3],
    [33.76, 37.41, 'S53', '最终运营打开报表，对比各省订单数和销售额。'],
    [37.88, 41.05, 'S54', '接口从 HBase 服务表返回这笔订单已发货。'],
    [41.31, 43.85, 'S55', '结果还能给推荐和告警等下游用。'],
    [44.85, 47.69, 'S56', '第二天新分区进仓，再跑校验和发布。'],
    [47.92, 51.29, 'S57', '拉远看，就是存储管文件，资源层管配额，'],
    [51.54, 52.97, 'S57', '计算框架跑任务，', 4.35],
    [53.17, 55.37, 'S57', '最后有分析和点查两个出口。', 6.2],
    [55.64, 57.78, 'S58', '各组件按分工和需要协作。'],
    [59.10, 60.94, 'S59', '此内容由 AI 生成。'],
  ] },
];

let centiseconds = 0;
export const narrationCues = narrationTakes.flatMap(({ keepSeconds, lines }, take) => {
  const offset = centiseconds / 100;
  centiseconds += Math.round(keepSeconds * 100);
  return lines.map(([start, end, id, caption, visualBeat]) => ({
    take, id, caption, visualBeat,
    startFrame: Math.round((offset + start) * FPS),
    endFrame: Math.ceil((offset + end) * FPS - 1e-8) + 3,
  }));
});
export const narrationDuration = centiseconds / 100;
const frameCount = Math.ceil(narrationDuration * FPS);

const starts = narrationCues.flatMap((cue, index) => {
  if (cue.id === narrationCues[index - 1]?.id) return [];
  const scene = scenes.find(({ id }) => id === cue.id);
  if (!scene) throw new Error(`Unknown storyboard shot: ${cue.id}`);
  return [{ scene, cueIndex: index, startFrame: index === 0 ? 0 : cue.startFrame }];
});
export const narrationShots = starts.map((shot, index) => {
  const next = starts[index + 1];
  const endFrame = next?.startFrame ?? frameCount;
  const finalBeat = shot.scene.end - shot.scene.start - 1 / FPS;
  const cues = narrationCues.slice(shot.cueIndex, next?.cueIndex);
  const beats = [
    { frame: shot.startFrame, time: 0 },
    ...cues.flatMap((cue) => cue.visualBeat === undefined ? [] : [{ frame: cue.startFrame, time: cue.visualBeat }]),
    { frame: endFrame - 1, time: finalBeat },
  ];
  return { ...shot, endFrame, beats };
});

export const narrationChapters = chapters.flatMap((chapter) => {
  const first = narrationShots.find(({ scene }) => scene.chapter === chapter.id);
  return first ? [{ id: chapter.id, title: chapter.title, start: first.startFrame / FPS }] : [];
});

export function narrationFrameAt(seconds: number) {
  const time = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  // Media elements may round a seek to just below the exact frame boundary.
  const frame = Math.min(frameCount - 1, Math.floor((time + .000002) * FPS));
  const shot = narrationShots.find(({ endFrame }) => frame < endFrame) ?? narrationShots[narrationShots.length - 1];
  const nextCue = narrationCues.findIndex(({ startFrame }) => startFrame > frame);
  const cue = narrationCues[(nextCue < 0 ? narrationCues.length : nextCue) - 1];
  const caption = cue?.id === shot.scene.id && frame < cue.endFrame ? cue.caption : '';
  const nextIndex = shot.beats.findIndex((beat) => frame <= beat.frame && beat.frame > shot.startFrame);
  const next = shot.beats[nextIndex];
  const prev = shot.beats[nextIndex - 1];
  const elapsed = next && prev ? prev.time + (next.time - prev.time) * (frame - prev.frame) / (next.frame - prev.frame) : 0;
  return { scene: shot.scene, frame, elapsed, caption };
}
