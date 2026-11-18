import { color, type Painter } from './ink';
import { orderDate, orders } from '../orders';
import { factoryMap } from './intro';
import { response } from './query';
import { bars, box, chain, code, ctl, data, dim, folio, gauge, hbase, hive, ink, kv, lanes, mr, off, reveal, route, sign, slide, spark, summary, table } from './production';

const order = orders[0];
const workflow = color.workflow;
const zk = color.zk;

const dailyDag: Painter = (p, t) => {
  const tasks = [
    {x: 140, y: 497, w: 246, title: '到数', note: '明细到齐', hue: workflow},
    {x: 488, y: 497, w: 272, title: '校验', note: '通过才继续', hue: workflow},
    {x: 964, y: 340, w: 378, title: '聚合并发布报表', note: '分析分支', hue: hive},
    {x: 964, y: 657, w: 378, title: '更新服务表', note: '点查分支', hue: hbase},
    {x: 1515, y: 497, w: 260, title: '通知', note: '依赖已完成', hue: workflow},
  ];
  route(p, t, .45, 1.62, [[386, 554], [488, 554]], 'control');
  for (let i = 0; i < 2; i++) {
    const y = tasks[2 + i].y + 57;
    route(p, t, 1.7 + i * .35, 3.2 + i * .35, [[760, 554], [855, 554], [855, y], [964, y]], 'control');
    route(p, t, 3.55 + i * .32, 5.15 + i * .32, [[1342, y], [1430, y], [1430, 554], [1515, 554]], 'control');
  }
  tasks.forEach((b, i) => box(p, b, t >= [.25, 1.62, 3.2, 3.55, 5.47][i]));
  p.legend([['control', '依赖满足后触发']]);
};
const history: Painter = (p, t) => {
  const retired = t >= 2.45;
  p.line([[155, 698], [1755, 698]], '#7c9cb591', 3);
  const q = p.progress(t, 1.35, 3.05);
  slide(p, t, 1.35, 3.05, [518, 418], [164, 418], (x, y) => {
    p.alpha(1 - .32 * q, () => box(p, {x, y, w: 487, title: 'Apache Oozie', note: '经典 Hadoop 工作流与定时任务', hue: workflow}, !retired, 159));
  });
  reveal(p, t, 2.3, () => {
    p.text('2025', 884, 523, 81, ctl, 'center', 750, true);
    p.text('项目退役', 884, 580, 37, ctl, 'center');
    p.line([[884, 607], [884, 696]], ctl, 3);
    p.dot(884, 698, 7, ctl);
  });
  reveal(p, t, 3, () => box(p, {x: 1170, y: 418, w: 583, title: 'Airflow 等其他方案', note: '新项目按场景选择，不强制搭配', hue: mr}, true, 159));
};
const twoTracks: Painter = (p, t) => {
  lanes(p, 140, 313, 1635, 220, '工作流：决定作业顺序', workflow);
  lanes(p, 140, 586, 1635, 235, 'YARN：决定应用的计算资源', ctl);
  const stages = ['到数', '校验', '启动应用'].map((title, i) => ({x: 244 + 519 * i, y: 388, w: 393, title, hue: workflow}));
  chain(p, t, stages, 'dependency', .95);
  if (t >= 2.5) route(p, t, 2.7, 4.27, [[1468, 502], [1468, 655]], 'control');
  reveal(p, t, 2.65, () => {
    gauge(p, 312, 699, 510, 'CPU 配额', .77 * p.progress(t, 3.2, 4.7));
    gauge(p, 1065, 699, 500, '内存配额', .61 * p.progress(t, 3.4, 4.94));
  });
};
const coordination: Painter = (p, t) => {
  const nodes = [
    {x: 168, y: 608, w: 429, title: '订单加工', note: '业务数据直接装载', hue: data},
    {x: 1309, y: 608, w: 451, title: 'HBase', note: '依赖部分协调状态', hue: hbase},
  ];
  route(p, t, .55, 2.55, [[1185, 405], [1508, 405], [1508, 608]], 'control');
  route(p, t, 2.65, 4.9, [[597, 665], [1309, 665]], 'data', 44);
  box(p, {x: 670, y: 349, w: 515, title: 'ZooKeeper / 协调哨站', note: '保存协调所需的状态', hue: zk});
  nodes.forEach((b) => box(p, b));
  p.legend([['control', '协调状态'], ['data', '业务数据']]);
};
const retry: Painter = (p, t) => {
  const fail = t >= 1.48;
  const retrying = t >= 3.12;
  lanes(p, 153, 329, 1608, 140, '存储层 / HDFS 副本保留');
  for (let i = 0; i < 3; i++) p.cube(1190 + i * 172, 396, 26);
  lanes(p, 153, 504, 1608, 181, '计算层 / Map Task', mr);
  const a = {x: 483, y: 572, w: 332, title: fail ? '任务失败 / 节点 A' : '正在执行 / 节点 A', hue: fail ? off : mr};
  const b = {x: 1270, y: 572, w: 368, title: retrying ? '重试 / 节点 B' : '候选 / 节点 B', hue: mr};
  route(p, t, 3.08, 5.1, [[815, 618], [1270, 618]], 'control');
  box(p, a, !fail, 84); box(p, b, retrying, 84);
  p.impact(634, 616, t - 1.48, off, 155);
  reveal(p, t, 2.3, () => box(p, {x: 151, y: 720, w: 1608, title: '工作流层 / 按规则重试或告警，策略依实现而异', hue: workflow}, true, 94));
};
const idempotency: Painter = (p, t) => {
  const removed = t >= 4.86;
  lanes(p, 147, 335, 743, 459, `重跑同一分区 / ${orderDate}`, hive);
  kv(p, 214, 445, '已存在的一份结果', hive, 508);
  reveal(p, t, .74, () => kv(p, 258, 537, '重跑产物 / 不要追加累计', off, 538));
  route(p, t, 3, 4.88, [[890, 572], [1127, 572]], 'data', 42);
  lanes(p, 1127, 335, 641, 459, '示例：覆盖分区再校验', mr);
  reveal(p, t, 3.1, () => kv(p, 1190, 443, '覆盖写入目标分区', mr, 511));
  reveal(p, t, 4.75, () => {
    p.text('一份结果', 1193, 618, 49, mr);
    p.text('校验订单数和总金额', 1193, 690, 31, ink);
  });
  if (removed) p.line([[258, 566], [795, 566]], off, 4);
  sign(p, '也可按业务采用去重或幂等写入', 158, 824, dim);
};
const security: Painter = (p, t) => {
  const acts = [
    {x: 145, y: 344, w: 408, title: '客户端', note: '请求访问 HDFS', hue: ctl},
    {x: 744, y: 344, w: 427, title: '验明身份', note: 'Kerberos（示例）', hue: ctl},
    {x: 1362, y: 344, w: 399, title: '检查授权', note: 'HDFS 文件权限', hue: ctl},
  ];
  chain(p, t, acts, 'control', 1.4);
  lanes(p, 145, 515, 1616, 307, '可观测性 / 资源指标、作业日志与告警', data);
  const samples = [[220, 753], [425, 713], [610, 744], [750, 705], [945, 729], [1110, 617], [1255, 702], [1515, 720]] as const;
  const q = p.progress(t, 2.55, 5.12);
  const points = samples.slice(0, Math.max(1, Math.round(samples.length * q)));
  if (points.length > 1) p.line(points, data, 4);
  if (t >= 4.6) {
    p.dot(1110, 617, 10, off);
    p.text('告警 / 回看日志', 1149, 625, 28, off);
  }
};
const bi: Painter = (p, t) => {
  // Deliberately schematic province positions; the values come from the same sample rows.
  table(p, 141, 346, 662, 3, '按省汇总 / 订单样例');
  route(p, t, .38, 2.55, [[803, 470], [1063, 470]], 'data', 37);
  reveal(p, t, 1.2, () => bars(p, 1063, 314, 690, 481, t - 1.75));
  reveal(p, t, 3.4, () => {
    const positions = [[326, 715], [509, 765]] as const;
    p.poly([[160, 697], [268, 646], [476, 637], [635, 700], [572, 775], [479, 831], [289, 799]], '#152c3c', '#6e99aa62');
    positions.forEach(([x, y], i) => {
      const hue = i ? hive : mr;
      if (t >= 3.75 + i * .45) {
        p.line([[x, y - 19], [x, y + 19]], hue, 3);
        p.line([[x - 19, y], [x + 19, y]], hue, 3);
        p.dot(x, y, 6, hue);
        p.text(i ? '广东' : '江苏', x + 30, y + 8, 27, hue);
      }
    });
    p.text('省份示意（非地图比例）', 673, 764, 28, dim);
  });
};
const api: Painter = (p, t) => {
  const services = [
    {x: 141, y: 333, w: 420, title: '客户端', note: `GET /orders/${order.id}`, hue: hbase},
    {x: 741, y: 333, w: 420, title: '业务查询 API', note: '按订单号查状态', hue: hbase},
    {x: 1340, y: 333, w: 423, title: 'HBase 服务表', note: `GET rowkey=${order.id}`, hue: hbase},
  ];
  chain(p, t, services, 'control', 1.19);
  route(p, t, 3.0, 4.95, [[1511, 447], [1511, 543], [422, 543], [422, 581]], 'data', 34);
  reveal(p, t, 4.1, () => code(p, 142, 576, 905, '查询响应（架构示例）', response, 2, hbase));
};
const outputs: Painter = (p, t) => {
  box(p, {x: 140, y: 487, w: 395, title: '计算或加工结果', note: '同一数据的不同用法', hue: data});
  ['数据集市 / 报表', '推荐特征', '风险告警', '定期数据导出'].forEach((title, i) => {
    const y = 318 + i * 127;
    const at = .55 + i * .37;
    const points = [[535, 524 + i * 15], [703, 524 + i * 15], [1134, y + 45], [1305, y + 45]] as const;
    route(p, t, at, at + 1.85, points, 'data', 27);
    reveal(p, t, at + 1.6, () => box(p, {x: 1305, y, w: 459, title, hue: i === 0 ? hive : i === 1 ? spark : i === 2 ? ctl : data}, true, 86));
  });
};
const tomorrow: Painter = (p, t) => {
  const changed = t >= 1.65;
  lanes(p, 146, 322, 1624, 220, 'HDFS / 按天接入新分区');
  p.text(changed ? '2026-11-17' : orderDate, 197, 476, 65, data, 'left', 760, true);
  route(p, t, 1.65, 3.05, [[664, 455], [1143, 455]], 'data', 32);
  reveal(p, t, 2.65, () => folio(p, 1168, 404, '新分区就绪', '触发下一轮，更新两类输出'));
  chain(p, t - 2.4, ['等待新数据', '校验与加工', '发布报表与服务'].map((title, i) => ({x: 148 + i * 594, y: 652, w: 424, title, hue: workflow})), 'dependency', .8);
};
const overview: Painter = (p, t) => factoryMap(p, t, false, true);
const correction: Painter = (p, t) => {
  if (t >= 3.05) {
    factoryMap(p, t - 3.05, false, true, 1.55);
    return;
  }
  const names = ['HDFS', 'YARN', 'MapReduce', 'Spark', 'Hive', 'HBase'];
  const hues = [data, ctl, mr, spark, hive, hbase];
  const destinations = [[477, 607], [477, 484], [477, 335], [751, 335], [987, 335], [1218, 335]] as const;
  const broken = t >= .95;
  sign(p, broken ? '× 错误：组件不是固定串行路径' : '错误示意 / 不是真实数据流', 140, 326, off);
  names.forEach((title, i) => {
    const x = 136 + i * 277;
    if (!broken && i < names.length - 1) {
      p.line([[x + 221, 558], [x + 268, 558]], off, 2, [8, 7]);
      p.poly([[x + 270, 558], [x + 258, 552], [x + 258, 564]], off);
    }
    slide(p, t, 1.55, 3.04, [x, 512], destinations[i], (left, y) => box(p, {x: left, y, w: 221, title, hue: hues[i]}, broken, 90));
  });
  if (broken && t < 1.96) p.line([[129, 584], [1758, 527]], off, 5);
};
const closing: Painter = (p, t) => {
  const a = [[580, 531], [763, 531], [763, 423], [1078, 423]] as const;
  const b = [[580, 577], [815, 577], [815, 686], [1078, 686]] as const;
  p.glow(972, 554, 333, '#1e647150');
  box(p, {x: 141, y: 493, w: 439, title: '一批已清洗订单', note: '同一个业务起点', hue: data});
  route(p, t, .47, 2.46, a, 'data', 42);
  route(p, t, 1.32, 3.68, b, 'data', 42);
  reveal(p, t, 2.1, () => {
    lanes(p, 1078, 326, 684, 222, '看省份销售 / BI 报表', hive);
    summary.forEach((row, i) => {
      const y = 424 + i * 63;
      const q = p.progress(t, 2.26 + i * .27, 3.65 + i * .27);
      p.text(`${row.province} / ${row.count} 单`, 1105, y + 11, 30, ink);
      p.rect(1356, y - 15, 248, 16, '#2b3443', undefined, 2);
      if (q > 0) p.rect(1356, y - 15, 248 * q * row.total / 150, 16, row.hue, undefined, 2);
      p.text(`${Math.round(row.total * q)} 元`, 1738, y + 8, 30, row.hue, 'right', 700);
    });
  });
  reveal(p, t, 3.32, () => {
    lanes(p, 1078, 618, 684, 156, '查一笔订单 / API', hbase);
    kv(p, 1110, 697, order.id, hbase, 260);
    kv(p, 1450, 697, order.status, hbase, 266);
  });
  reveal(p, t, 4.12, () => p.text('存得下，算得动，查得到，用得上。', 143, 834, 44, ink));
};

export const operations = {
  S46: dailyDag, S47: history, S48: twoTracks, S49: coordination, S50: retry, S51: idempotency, S52: security,
  S53: bi, S54: api, S55: outputs, S56: tomorrow, S57: overview, S58: correction, S59: closing,
};
