import { FPS, frameAt, scenes, type SceneId } from './timeline';

type Take = 1 | 2 | 3 | 4;
type Edit = readonly [beat: number, inPoint: number, outPoint: number, speechIn: number, speechOut: number, caption: string];
type Shot = readonly [scene: SceneId, take: Take, edits: readonly Edit[]];
type Cue = { startFrame: number; endFrame: number; caption: string };

// Keep the original shot timing. Source seconds list the cut in/out first,
// followed by actual speech onset/release, checked against the recordings.
const editList: readonly Shot[] = [
  ['S02', 1, [[1.6, .14, 1.63, .20, 1.55, '同一批订单进来，']]],
  ['S06', 1, [[.8, 1.86, 6.14, 1.95, 6.04, '存储层先把文件按天放进 HDFS 目录。']]],
  ['S08', 1, [
    [.2, 6.18, 8.74, 6.32, 8.65, 'NameNode 管目录和块位置，'],
    [3.3, 9.05, 10.71, 9.15, 10.62, 'DataNode 存数据块。'],
  ]],
  ['S09', 1, [[.3, 10.78, 12.88, 10.86, 12.79, '大文件按配置切块。']]],
  ['S10', 1, [[.4, 12.96, 15.98, 13.02, 15.90, '写时先向 NameNode 申请目标位置，']]],
  ['S11', 1, [[.5, 16.06, 17.70, 16.26, 17.62, '再沿管线传副本，']]],
  ['S12', 1, [[1.3, 17.73, 18.95, 17.82, 18.86, '并跨机架分布。']]],
  ['S13', 1, [
    [.3, 19.36, 20.88, 19.48, 20.82, '读时先问位置，'],
    [3.2, 20.91, 22.88, 21.00, 22.79, '再优先读近的可用副本。'],
  ]],
  ['S14', 1, [[2, 23.09, 25.78, 23.15, 25.73, '节点心跳超时就标记不可用，']]],
  ['S15', 1, [[.2, 25.83, 27.82, 25.94, 27.73, '并由 NameNode 安排补副本。']]],
  ['S16', 1, [[.3, 28.18, 30.09, 28.28, 30.00, '目录服务也能做高可用。']]],
  ['S17', 1, [
    [.3, 30.28, 31.61, 30.36, 31.52, '仓库数据不动，'],
    [2.2, 31.82, 34.51, 31.91, 34.42, '按省汇总的任务去 YARN 申请资源。'],
  ]],
  ['S18', 1, [
    [.2, 34.80, 36.87, 34.89, 36.77, '资源管理器全局分资源，'],
    [2.9, 37.05, 39.81, 37.15, 39.75, '节点管理器管本机容器并报状态。'],
  ]],
  ['S19', 1, [
    [1.65, 39.93, 41.37, 39.99, 41.32, '先起应用主管，'],
    [3.7, 41.39, 42.66, 41.48, 42.57, '再申请任务容器。'],
  ]],
  ['S21', 1, [[2.9, 42.82, 44.56, 42.92, 44.47, '任务尽量挨着数据跑。']]],
  ['S22', 2, [[.7, .07, 3.15, .14, 3.03, '同一道题可用 MapReduce 或 Spark。']]],
  ['S23', 2, [[.5, 3.49, 5.23, 3.60, 5.14, 'Map 读各自输入分片，']]],
  ['S24', 2, [[1.45, 5.31, 7.41, 5.42, 7.31, '以省份为键、金额为值。']]],
  // The recording mentions Shuffle first; keep the storyboard's Combiner → Shuffle order.
  ['S25', 2, [[2.3, 10.43, 11.63, 10.53, 11.51, '局部求和可选。']]],
  ['S26', 2, [[.2, 7.52, 10.05, 7.59, 9.95, 'Shuffle 先分区，再传输排序。']]],
  ['S27', 2, [[.6, 11.85, 13.54, 11.97, 13.44, '每组数单加金额后，']]],
  ['S28', 2, [
    [.3, 13.56, 16.63, 13.67, 16.53, '把汇总结果写回 HDFS 另一目录，'],
    [3.65, 16.76, 18.10, 16.87, 17.99, '而不覆盖订单明细。'],
  ]],
  ['S29', 2, [
    [.5, 18.61, 20.76, 18.73, 20.73, 'Spark 则把计算排成依赖图，'],
    [3.35, 20.78, 23.07, 20.87, 22.99, '由 Driver 协调、Executor 执行。'],
  ]],
  ['S31', 2, [
    [.55, 23.24, 24.93, 23.28, 24.82, '中间结果可缓存，'],
    [3, 24.96, 26.74, 25.07, 26.64, '但 Shuffle 仍可能用磁盘。'],
  ]],
  ['S33', 2, [[3.3, 27.32, 29.04, 27.42, 28.96, 'Hive 作为 SQL 入口，']]],
  ['S34', 2, [
    [.3, 29.04, 32.01, 29.20, 31.89, '查 Metastore 里的列、分区和文件路径。'],
    [3.75, 32.13, 34.36, 32.19, 34.25, '订单文件还在 HDFS。'],
  ]],
  ['S35', 2, [[1.45, 34.50, 36.70, 34.62, 36.62, '按天分区后，查询只扫当天。']]],
  ['S36', 2, [
    [1.9, 36.74, 38.34, 36.86, 38.27, '查询服务做优化，'],
    [4.8, 38.35, 40.31, 38.44, 40.21, '再把执行计划交给计算引擎。'],
  ]],
  ['S37', 2, [[1, 40.72, 43.66, 40.83, 43.55, 'Hive 是入口，不是存储，也不负责分资源。']]],
  ['S39', 3, [[.5, .13, 1.69, .21, 1.59, '报表回答卖多少，']]],
  ['S40', 3, [[.85, 1.93, 7.14, 2.00, 7.04, '点查发货状态，则从明细单独加工一份进 HBase 服务表。']]],
  ['S41', 3, [
    [.5, 7.18, 8.93, 7.27, 8.83, '以订单号当行键，'],
    [3, 8.99, 12.77, 9.07, 12.67, '按范围切表分给不同服务器，并避免热点。'],
  ]],
  ['S42', 3, [
    [.9, 12.94, 16.02, 13.01, 15.92, '写入先记预写日志，再更新内存。'],
    [4.15, 16.08, 19.41, 16.18, 19.31, '后台刷成 HFile，通常落 HDFS。'],
  ]],
  ['S43', 3, [
    [.6, 19.45, 22.44, 19.53, 22.34, '先找管键的服务器，再按订单号读。'],
    [4.5, 22.55, 24.32, 22.65, 24.22, '结果回来是已发货。'],
  ]],
  ['S44', 3, [
    [.4, 24.98, 26.95, 25.09, 26.88, '但查得快不代表数据新。'],
    [3, 27.03, 30.52, 27.12, 30.42, '服务表每天才装一次，就可能秒回旧状态。'],
  ]],
  ['S45', 3, [
    [.4, 30.65, 32.44, 30.74, 32.34, 'Hive 适合扫表汇总，'],
    [2.8, 32.62, 34.70, 32.73, 34.60, 'HBase 适合按行键读写。'],
  ]],
  ['S46', 3, [
    [.7, 35.24, 36.66, 35.34, 36.57, '订单到齐先校验，'],
    [2.9, 36.69, 38.80, 36.78, 38.71, '报表和服务表各自更新，'],
    [5.15, 38.91, 40.58, 39.02, 40.47, '两边做完再发通知。'],
  ]],
  ['S47', 4, [[.6, .11, 4.13, .19, 4.03, 'Oozie 曾做工作流编排，但二零二五年已退役。']]],
  ['S48', 4, [
    [.5, 4.62, 6.46, 4.74, 6.36, '编排决定谁先启动，'],
    [3, 6.64, 9.13, 6.76, 9.03, 'YARN 决定启动后给多少资源。'],
  ]],
  ['S49', 4, [[1.25, 9.28, 12.72, 9.39, 12.62, 'ZooKeeper 只传协调状态，不传订单数据。']]],
  ['S50', 4, [
    [.5, 13.18, 16.10, 13.30, 15.98, '算挂了可重试，存储有副本，'],
    [3.6, 16.20, 20.05, 16.32, 19.94, '工作流能按规则告警，三层各解决一类问题。'],
  ]],
  ['S51', 4, [
    [.5, 20.68, 23.46, 20.80, 23.35, '同一天重跑，不能把销售额加两遍。'],
    [3.55, 23.52, 26.90, 23.60, 26.81, '比如覆盖当天结果，再核对单数和金额。'],
  ]],
  ['S52', 4, [
    [.5, 27.31, 29.16, 27.43, 29.06, '先验身份，再查权限。'],
    [3.2, 29.33, 33.01, 29.40, 32.91, '异常从资源指标、日志和告警里找线索。'],
  ]],
  ['S53', 4, [[1.35, 33.64, 37.51, 33.76, 37.41, '最终运营打开报表，对比各省订单数和销售额。']]],
  ['S54', 4, [[1.95, 37.77, 41.14, 37.88, 41.05, '接口从 HBase 服务表返回这笔订单已发货。']]],
  ['S55', 4, [[1.45, 41.21, 43.96, 41.31, 43.85, '结果还能给推荐和告警等下游用。']]],
  ['S56', 4, [[1.2, 44.73, 47.79, 44.85, 47.69, '第二天新分区进仓，再跑校验和发布。']]],
  ['S57', 4, [
    [.2, 47.85, 51.37, 47.92, 51.29, '拉远看，就是存储管文件，资源层管配额，'],
    [3.75, 51.47, 53.05, 51.54, 52.97, '计算框架跑任务，'],
    [5.45, 53.12, 55.48, 53.17, 55.37, '最后有分析和点查两个出口。'],
  ]],
  ['S58', 4, [[3.1, 55.55, 57.88, 55.64, 57.78, '各组件按分工和需要协作。']]],
  // The identical disclosure at the end of each take only plays once.
  ['S59', 4, [[5.9, 59.07, 61.01, 59.10, 60.94, '此内容由 AI 生成。']]],
];

const readingTailFrames = 3;
const silentGapFrames = 6;
const minExplanationFrames = 1.5 * FPS;
const tracks = new Map(editList.map(([id, take, edits]) => {
  const scene = scenes.find((scene) => scene.id === id);
  if (!scene) throw new Error(`Unknown narration scene: ${id}`);
  const clips = edits.map(([beat, inPoint, outPoint, speechIn, speechOut, caption]) => {
    const atFrame = Math.round((scene.start + beat) * FPS);
    const startFrame = atFrame + Math.round((speechIn - inPoint) * FPS);
    const endFrame = atFrame + Math.ceil((speechOut - inPoint) * FPS) + readingTailFrames;
    return { id, take, atFrame, inPoint, outPoint, speechIn, speechOut, startFrame, endFrame, caption };
  });
  clips.forEach((clip, i) => {
    clip.endFrame = Math.min(clip.endFrame, clips[i + 1]?.startFrame ?? scene.end * FPS);
  });

  // Explanatory subtitles may open at their original beat only when it offers
  // a reading window, not as a fallback between syllables or after a spoken line.
  const explanations: Cue[] = [];
  scene.cues.forEach(([at, caption], i, cues) => {
    const startFrame = Math.round((scene.start + at) * FPS);
    if (clips.some((clip) => clip.startFrame <= startFrame && startFrame < clip.endFrame + silentGapFrames)) return;
    const next = clips.find((clip) => clip.startFrame > startFrame);
    const originalEnd = cues[i + 1] ? Math.round((scene.start + cues[i + 1][0]) * FPS) : scene.end * FPS;
    const endFrame = Math.min(originalEnd, next ? next.startFrame - silentGapFrames : originalEnd);
    if (endFrame - startFrame >= minExplanationFrames) explanations.push({ startFrame, endFrame, caption });
  });
  return [id, { clips, explanations }] as const;
}));

export const narrationClips = [...tracks.values()].flatMap(({ clips }) => clips);

export function narrationFrameAt(seconds: number) {
  const original = frameAt(seconds);
  const track = tracks.get(original.scene.id);
  if (!track) return original;
  const active = ({ startFrame, endFrame }: Cue) => startFrame <= original.frame && original.frame < endFrame;
  const cue = track.clips.find(active) ?? track.explanations.find(active);
  return { ...original, caption: cue?.caption ?? '' };
}
