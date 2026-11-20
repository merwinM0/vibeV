import { FPS, frameAt, scenes, type SceneId } from './timeline';

type Take = 1 | 2 | 3 | 4;
type Edit = readonly [beat: number, inPoint: number, outPoint: number, caption: string];
type Shot = readonly [scene: SceneId, take: Take, edits: readonly Edit[]];

// Place each cut at a beat in the original shot. The in/out points are seconds
// in p1–p4, including a little room for edits between phrases at normal speed.
const editList: readonly Shot[] = [
  ['S02', 1, [[1.6, .14, 1.63, '同一批订单进来，']]],
  ['S06', 1, [[.8, 1.86, 6.14, '存储层先把文件按天放进 HDFS 目录。']]],
  ['S08', 1, [[.2, 6.18, 8.74, 'NameNode 管目录和块位置，'], [3.3, 9.05, 10.71, 'DataNode 存数据块。']]],
  ['S09', 1, [[.3, 10.78, 12.88, '大文件按配置切块。']]],
  ['S10', 1, [[.4, 13.05, 15.98, '写时先向 NameNode 申请目标位置，']]],
  ['S11', 1, [[.5, 16.06, 17.70, '再沿管线传副本，']]],
  ['S12', 1, [[1.3, 17.73, 18.95, '并跨机架分布。']]],
  ['S13', 1, [[.3, 19.36, 20.88, '读时先问位置，'], [3.2, 20.91, 22.88, '再优先读近的可用副本。']]],
  ['S14', 1, [[2, 23.09, 25.78, '节点心跳超时就标记不可用，']]],
  ['S15', 1, [[.2, 25.83, 27.82, '并由 NameNode 安排补副本。']]],
  ['S16', 1, [[.3, 28.18, 30.09, '目录服务也能做高可用。']]],
  ['S17', 1, [[.3, 30.28, 31.61, '仓库数据不动，'], [2.2, 31.82, 34.51, '按省汇总的任务去 YARN 申请资源。']]],
  ['S18', 1, [[.2, 34.80, 36.87, '资源管理器全局分资源，'], [2.9, 37.05, 39.81, '节点管理器管本机容器并报状态。']]],
  ['S19', 1, [[1.65, 39.93, 41.37, '先起应用主管，'], [3.7, 41.39, 42.66, '再申请任务容器。']]],
  ['S21', 1, [[2.9, 42.82, 44.56, '任务尽量挨着数据跑。']]],
  ['S22', 2, [[.7, .07, 3.15, '同一道题可用 MapReduce 或 Spark。']]],
  ['S23', 2, [[.5, 3.49, 5.23, 'Map 读各自输入分片，']]],
  ['S24', 2, [[1.45, 5.31, 7.41, '以省份为键、金额为值。']]],
  // The recording mentions Shuffle first; keep the storyboard's Combiner → Shuffle order.
  ['S25', 2, [[2.3, 10.43, 11.63, '局部求和可选。']]],
  ['S26', 2, [[.2, 7.52, 10.05, 'Shuffle 先分区，再传输排序。']]],
  ['S27', 2, [[.6, 11.85, 13.54, '每组数单加金额后，']]],
  ['S28', 2, [[.3, 13.56, 16.63, '把汇总结果写回 HDFS 另一目录，'], [3.65, 16.76, 18.10, '而不覆盖订单明细。']]],
  ['S29', 2, [[.5, 18.61, 20.76, 'Spark 则把计算排成依赖图，'], [3.35, 20.78, 23.07, '由 Driver 协调、Executor 执行。']]],
  ['S31', 2, [[.55, 23.24, 24.93, '中间结果可缓存，'], [3.0, 24.96, 26.74, '但 Shuffle 仍可能用磁盘。']]],
  ['S33', 2, [[3.3, 27.32, 29.04, 'Hive 作为 SQL 入口，']]],
  ['S34', 2, [[.3, 29.04, 32.01, '查 Metastore 里的列、分区和文件路径。'], [3.75, 32.13, 34.36, '订单文件还在 HDFS。']]],
  ['S35', 2, [[1.45, 34.50, 36.70, '按天分区后，查询只扫当天。']]],
  ['S36', 2, [[1.9, 36.74, 38.34, '查询服务做优化，'], [4.8, 38.35, 40.31, '再把执行计划交给计算引擎。']]],
  ['S37', 2, [[1, 40.72, 43.66, 'Hive 是入口，不是存储，也不负责分资源。']]],
  ['S39', 3, [[.5, .13, 1.69, '报表回答卖多少，']]],
  ['S40', 3, [[.85, 1.93, 7.14, '点查发货状态，则从明细单独加工一份进 HBase 服务表。']]],
  ['S41', 3, [[.5, 7.18, 8.93, '以订单号当行键，'], [3, 8.99, 12.77, '按范围切表分给不同服务器，并避免热点。']]],
  ['S42', 3, [[.9, 12.94, 16.02, '写入先记预写日志，再更新内存。'], [4.15, 16.08, 19.41, '后台刷成 HFile，通常落 HDFS。']]],
  ['S43', 3, [[.6, 19.45, 22.44, '先找管键的服务器，再按订单号读。'], [4.5, 22.55, 24.32, '结果回来是已发货。']]],
  ['S44', 3, [[.4, 24.98, 26.95, '但查得快不代表数据新。'], [3, 27.03, 30.52, '服务表每天才装一次，就可能秒回旧状态。']]],
  ['S45', 3, [[.4, 30.65, 32.44, 'Hive 适合扫表汇总，'], [2.8, 32.62, 34.70, 'HBase 适合按行键读写。']]],
  ['S46', 3, [[.7, 35.24, 36.66, '订单到齐先校验，'], [2.9, 36.69, 38.80, '报表和服务表各自更新，'], [5.15, 38.91, 40.58, '两边做完再发通知。']]],
  ['S47', 4, [[.6, .11, 4.13, 'Oozie 曾做工作流编排，但二零二五年已退役。']]],
  ['S48', 4, [[.5, 4.62, 6.46, '编排决定谁先启动，'], [3, 6.64, 9.13, 'YARN 决定启动后给多少资源。']]],
  ['S49', 4, [[1.25, 9.28, 12.72, 'ZooKeeper 只传协调状态，不传订单数据。']]],
  ['S50', 4, [[.5, 13.18, 16.10, '算挂了可重试，存储有副本，'], [3.6, 16.20, 20.05, '工作流能按规则告警，三层各解决一类问题。']]],
  ['S51', 4, [[.5, 20.68, 23.46, '同一天重跑，不能把销售额加两遍。'], [3.55, 23.52, 26.90, '比如覆盖当天结果，再核对单数和金额。']]],
  ['S52', 4, [[.5, 27.31, 29.16, '先验身份，再查权限。'], [3.2, 29.33, 33.01, '异常从资源指标、日志和告警里找线索。']]],
  ['S53', 4, [[1.35, 33.64, 37.51, '最终运营打开报表，对比各省订单数和销售额。']]],
  ['S54', 4, [[1.95, 37.77, 41.14, '接口从 HBase 服务表返回这笔订单已发货。']]],
  ['S55', 4, [[1.45, 41.21, 43.96, '结果还能给推荐和告警等下游用。']]],
  ['S56', 4, [[1.2, 44.73, 47.79, '第二天新分区进仓，再跑校验和发布。']]],
  ['S57', 4, [[.2, 47.85, 51.37, '拉远看，就是存储管文件，资源层管配额，'], [3.75, 51.47, 53.05, '计算框架跑任务，'], [5.45, 53.22, 55.48, '最后有分析和点查两个出口。']]],
  ['S58', 4, [[3.1, 55.55, 57.88, '各组件按分工和需要协作。']]],
  // The identical disclosure at the end of each take only plays once.
  ['S59', 4, [[5.9, 59.07, 61.01, '此内容由 AI 生成。']]],
];

const editTracks = new Map(editList.map(([id, take, edits]) => {
  const scene = scenes.find((scene) => scene.id === id);
  if (!scene) throw new Error(`Unknown narration scene: ${id}`);
  const clips = edits.map(([beat, inPoint, outPoint, caption]) => {
    const atFrame = Math.round((scene.start + beat) * FPS);
    const afterSpeech = (atFrame / FPS) + outPoint - inPoint + .25;
    // Use the next original caption for an unvoiced beat, not in the middle of a line.
    const nextOriginalCue = scene.cues.find(([at]) => scene.start + at >= afterSpeech);
    const untilFrame = Math.round((nextOriginalCue ? scene.start + nextOriginalCue[0] : scene.end) * FPS);
    return { id, take, atFrame, inPoint, outPoint, caption, untilFrame };
  });
  return [id, clips] as const;
}));

export const narrationClips = [...editTracks.values()].flat();

export function narrationFrameAt(seconds: number) {
  const original = frameAt(seconds);
  let caption = original.caption;
  for (const clip of editTracks.get(original.scene.id) ?? []) {
    if (original.frame < clip.atFrame) break;
    caption = original.frame < clip.untilFrame ? clip.caption : original.caption;
  }
  return { ...original, caption };
}
