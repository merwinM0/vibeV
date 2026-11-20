import { chapters, FPS, scenes, type SceneId } from './timeline';

type Line = readonly [at: number, caption: string, visualTime?: number];
type Take = { length: number; shots: readonly (readonly [SceneId, readonly Line[]])[] };

// Cue times are local to the original p1–p4 recordings, matched to speech and pauses.
// narration.mp3 concatenates them in order, trimming each to its `length` below.
// An optional third value aligns a specific beat in the original animation to that line.
const takes: readonly Take[] = [
  { length: 44.95, shots: [ // p1
    ['S02', [[0, '同一批订单进来，']]],
    ['S06', [[1.95, '存储层先把文件按天放进 HDFS 目录。']]],
    ['S08', [[6.44, 'NameNode 管目录和块位置，'], [9.15, 'DataNode 存数据块。', 3.8]]],
    ['S09', [[10.89, '大文件按配置切块。']]],
    ['S10', [[13.05, '写时先向 NameNode 申请目标位置，']]],
    ['S11', [[16.10, '再沿管线传副本，']]],
    ['S12', [[17.82, '并跨机架分布。']]],
    ['S13', [[19.48, '读时先问位置，'], [21.00, '再优先读近的可用副本。', 3.2]]],
    ['S14', [[23.18, '节点心跳超时就标记不可用，']]],
    ['S15', [[25.73, '并由 NameNode 安排补副本。']]],
    ['S16', [[28.29, '目录服务也能做高可用。']]],
    ['S17', [[30.38, '仓库数据不动，'], [31.92, '按省汇总的任务去 YARN 申请资源。', 2.5]]],
    ['S18', [[34.89, '资源管理器全局分资源，'], [37.15, '节点管理器管本机容器并报状态。']]],
    ['S19', [[40.02, '先起应用主管，'], [41.30, '再申请任务容器。', 3.7]]],
    ['S21', [[42.93, '任务尽量挨着数据跑。']]],
  ] },
  { length: 44.05, shots: [ // p2
    ['S32', [[0, '同一道题可用 MapReduce 或 Spark。']]],
    ['S23', [[3.60, 'Map 读各自输入分片，']]],
    ['S24', [[5.42, '以省份为键、金额为值。']]],
    ['S26', [[7.62, 'Shuffle 先分区，再传输排序。']]],
    ['S25', [[10.54, '局部求和可选。']]],
    ['S27', [[11.97, '每组数单加金额后，']]],
    ['S28', [[13.67, '把汇总结果写回 HDFS 另一目录，'], [16.88, '而不覆盖订单明细。']]],
    ['S29', [[18.73, 'Spark 则把计算排成依赖图，'], [20.70, '由 Driver 协调、Executor 执行。', 3.3]]],
    ['S31', [[23.35, '中间结果可缓存，'], [25.08, '但 Shuffle 仍可能用磁盘。', 3]]],
    ['S33', [[27.43, 'Hive 作为 SQL 入口，']]],
    ['S34', [[28.99, '查 Metastore 里的列、分区和文件路径。'], [32.23, '订单文件还在 HDFS。']]],
    ['S35', [[34.63, '按天分区后，查询只扫当天。']]],
    ['S36', [[36.87, '查询服务做优化，'], [38.26, '再把执行计划交给计算引擎。', 4.8]]],
    ['S37', [[40.84, 'Hive 是入口，不是存储，也不负责分资源。']]],
  ] },
  { length: 41, shots: [ // p3
    ['S39', [[0, '报表回答卖多少，']]],
    ['S40', [[2.03, '点查发货状态，则从明细单独加工一份进 HBase 服务表。']]],
    ['S41', [[7.29, '以订单号当行键，'], [9.10, '按范围切表分给不同服务器，并避免热点。', 2.8]]],
    ['S42', [[13.04, '写入先记预写日志，再更新内存。'], [16.19, '后台刷成 HFile，通常落 HDFS。', 4.15]]],
    ['S43', [[19.57, '先找管键的服务器，再按订单号读。'], [22.67, '结果回来是已发货。', 4.4]]],
    ['S44', [[25.10, '但查得快不代表数据新。'], [27.14, '服务表每天才装一次，就可能秒回旧状态。', 2.8]]],
    ['S45', [[30.77, 'Hive 适合扫表汇总，'], [32.73, 'HBase 适合按行键读写。']]],
    ['S46', [[35.35, '订单到齐先校验，'], [36.80, '报表和服务表各自更新，', 2.85], [39.03, '两边做完再发通知。', 5.2]]],
  ] },
  { length: 61.16, shots: [ // p4; keep the shared AI disclosure once, at the end
    ['S47', [[0, 'Oozie 曾做工作流编排，但二零二五年已退役。']]],
    ['S48', [[4.74, '编排决定谁先启动，'], [6.77, 'YARN 决定启动后给多少资源。', 2.7]]],
    ['S49', [[9.43, 'ZooKeeper 只传协调状态，不传订单数据。']]],
    ['S50', [[13.31, '算挂了可重试，存储有副本，'], [16.33, '工作流能按规则告警，三层各解决一类问题。']]],
    ['S51', [[20.80, '同一天重跑，不能把销售额加两遍。'], [23.62, '比如覆盖当天结果，再核对单数和金额。', 3.2]]],
    ['S52', [[27.43, '先验身份，再查权限。'], [29.42, '异常从资源指标、日志和告警里找线索。', 3]]],
    ['S53', [[33.76, '最终运营打开报表，对比各省订单数和销售额。']]],
    ['S54', [[37.88, '接口从 HBase 服务表返回这笔订单已发货。']]],
    ['S55', [[41.33, '结果还能给推荐和告警等下游用。']]],
    ['S56', [[44.86, '第二天新分区进仓，再跑校验和发布。']]],
    ['S57', [[47.95, '拉远看，就是存储管文件，资源层管配额，'], [51.58, '计算框架跑任务，', 4.35]]],
    ['S59', [[53.34, '最后有分析和点查两个出口。'], [55.67, '各组件按分工和需要协作。', 5.4], [59.20, '此内容由 AI 生成。', 7.8]]],
  ] },
];

let offset = 0;
const shotStarts = takes.flatMap(({ length, shots }) => {
  const track = shots.map(([id, lines]) => {
    const scene = scenes.find((scene) => scene.id === id)!;
    const cues = lines.map(([at, caption, visualTime]) => ({ frame: Math.round((offset + at) * FPS), caption, visualTime }));
    return { scene, cues, start: cues[0].frame };
  });
  offset += length;
  return track;
});

export const narrationDuration = offset;
const frameCount = Math.ceil(narrationDuration * FPS);
export const narrationShots = shotStarts.map((shot, i) => ({ ...shot, end: shotStarts[i + 1]?.start ?? frameCount }));
export const narrationChapters = chapters.map((chapter) => {
  const start = narrationShots.find(({ scene }) => scene.chapter === chapter.id)!.start / FPS;
  return { id: chapter.id, title: chapter.title, start };
});

export function narrationFrameAt(seconds: number) {
  const time = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const frame = Math.min(frameCount - 1, Math.floor(time * FPS + 1e-8));
  const { scene, cues, start, end } = narrationShots.find((shot) => frame < shot.end)!;
  let caption = cues[0].caption;
  let from = { frame: start, time: 0 };
  let to = { frame: end - 1, time: scene.end - scene.start - 1 / FPS };
  for (const cue of cues) {
    if (frame >= cue.frame) {
      caption = cue.caption;
      if (cue.visualTime !== undefined) from = { frame: cue.frame, time: cue.visualTime };
    } else if (cue.visualTime !== undefined) {
      to = { frame: cue.frame, time: cue.visualTime };
      break;
    }
  }
  const elapsed = from.time + (to.time - from.time) * (frame - from.frame) / Math.max(1, to.frame - from.frame);
  return { frame, scene, elapsed, caption };
}
