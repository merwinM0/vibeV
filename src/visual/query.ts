import { color, type Painter } from './ink';
import { orderDate, orderPath, orders } from '../orders';
import { bars, box, code, ctl, data, dim, folio, gauge, hbase, hive, ink, kv, lanes, reveal, route, sign, sqlLines, table } from './production';

const order = orders[0];
export const response = ['{', `  "order_id": "${order.id}",`, `  "status": "${order.status}"`, '}'];

const askSQL: Painter = (p, t) => {
  const focus = t < 1.35 ? 0 : t < 3.1 ? 3 : 4;
  code(p, 147, 339, 870, 'SQL / 省份销售分析', sqlLines, focus);
  reveal(p, t, 1.1, () => box(p, {x: 1133, y: 381, w: 628, title: '筛日期', note: `分区 ${orderDate}`, hue: hive}));
  reveal(p, t, 2.9, () => box(p, {x: 1133, y: 552, w: 628, title: '按省聚合', note: 'COUNT(*) / SUM(amount)', hue: hive}));
  sign(p, 'SQL 描述结果，不用手写分布式任务', 1133, 727, dim);
};
const metadata: Painter = (p, t) => {
  lanes(p, 141, 338, 669, 449, 'Hive Metastore / 目录', hive);
  ['表：dwd_orders', '列：province、amount 等', '分区：dt', '位置：HDFS 路径'].forEach((line, i) => {
    reveal(p, t, .15 + i * .36, () => kv(p, 193, 434 + i * 75, line, hive, 535));
  });
  route(p, t, 2.4, 4.52, [[810, 693], [979, 693], [979, 524], [1121, 524]], 'control');
  lanes(p, 1121, 338, 650, 449, 'HDFS / 实际文件');
  folio(p, 1186, 467, 'Parquet', '业务订单数据保留在这里');
  p.text(orderPath, 1153, 671, 22, dim, 'left', 650, true);
  p.legend([['control', '位置是元数据']]);
};
const pruning: Painter = (p, t) => {
  const cut = t >= 2.5;
  const x = [149, 756, 1363];
  box(p, {x: 589, y: 334, w: 742, title: `WHERE dt = '${orderDate}'`, note: '分区过滤条件', hue: hive});
  x.forEach((left, i) => {
    const cx = left + 206;
    const path = [[835 + i * 125, 448], [835 + i * 125, 528], [cx, 528], [cx, 609]] as const;
    route(p, i === 1 ? t : 0, 2.62, 4.55, path, 'data');
    const label = `dt=2026-11-${15 + i}`;
    p.alpha(cut && i !== 1 ? .43 : 1, () => box(p, {x: left, y: 609, w: 412, title: label, note: cut ? i === 1 ? '只读这一个分区' : '跳过' : '候选分区', hue: i === 1 ? hive : data}, !cut || i === 1));
  });
  if (cut) {
    p.rect(750, 603, 425, 126, '#ffdc8f10', '#ffdc8fa1', 9);
    const inset = p.motion ? 46 * (1 - p.progress(t, 2.5, 3.18)) : 0;
    for (const [side, height] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const x = 962 + side * (223 + inset), y = 666 + height * (74 + inset * .45);
      p.line([[x - side * 27, y], [x, y], [x, y - height * 21]], hive, 5);
    }
    p.impact(963, 665, t - 3.18, hive, 222);
  }
  sign(p, cut ? '目标分区已锁定' : '候选：三个日期分区', 754, 785, hive);
};
const plan: Painter = (p, t) => {
  const b = {x: 669, y: 497, w: 516, title: 'HiveServer2 / Hive', note: t < 4.8 ? '解析 SQL，结合表元数据' : '已生成优化后的执行计划', hue: hive};
  route(p, t, .48, 1.97, [[521, 550], [669, 550]], 'control');
  route(p, t, 2.12, 3.32, [[861, 498], [861, 416]], 'control');
  route(p, t, 3.46, 4.68, [[1005, 416], [1005, 498]], 'control');
  route(p, t, 5.15, 6.7, [[1185, 550], [1339, 550]], 'control');
  box(p, {x: 135, y: 497, w: 386, title: 'SQL 客户端', note: '提交查询', hue: hive});
  box(p, {x: 705, y: 307, w: 462, title: 'Metastore', note: '表结构、分区与位置', hue: hive}, t >= 2);
  box(p, b);
  box(p, {x: 1339, y: 497, w: 432, title: '配置的执行引擎', note: t >= 6.7 ? '接收执行计划' : '等待计划', hue: color.mr}, t >= 6.7);
  sign(p, 'SQL → 元数据解析 / 优化 → 执行计划', 626, 751, hive);
};
const engines: Painter = (p, t) => {
  const y = [312, 480, 660];
  const items = [
    {x: 424, y: y[0], w: 1068, title: 'Hive', note: 'SQL 分析入口', hue: hive},
    {x: 424, y: y[1], w: 1068, title: '计算执行引擎', note: 'Tez / MapReduce 等（取决于版本与配置）', hue: color.mr},
    {x: 424, y: y[2], w: 1068, title: 'HDFS', note: '底层文件与结果存储', hue: data},
  ];
  route(p, t, 1.4, 2.5, [[730, 426], [730, 480]], 'control');
  route(p, t, 2.75, 4.14, [[729, 660], [729, 594]], 'data');
  route(p, t, 3.65, 4.9, [[1160, 594], [1160, 660]], 'data');
  items.forEach((item, i) => reveal(p, t, .15 + i * .62, () => box(p, item)));
  p.text('YARN', 1660, 519, 31, ctl, 'center', 700, true);
  p.text('按部署提供资源', 1660, 553, 24, ctl, 'center');
  route(p, t, 1.8, 2.7, [[1586, 565], [1492, 565]], 'control');
  sign(p, 'Spark 支持见历史版本与特定环境', 977, 806, dim);
};
const result: Painter = (p, t) => {
  table(p, 137, 421, 703, t - .32);
  route(p, t, 2.6, 4.28, [[840, 564], [1060, 564]], 'data', 34);
  reveal(p, t, 2.62, () => bars(p, 1060, 338, 720, 481, t - 3.12));
  sign(p, '返回结果，或写入新的汇总表', 140, 757, hive);
};
const newQuestion: Painter = (p, t) => {
  const shift = p.progress(t, .32, 1.85);
  p.move(507, 559, 365 * (1 - shift), 0, 1, () => bars(p, 151, 350, 717, 463, 4));
  reveal(p, t, 1.65, () => {
    lanes(p, 1054, 350, 718, 463, '问题 B / 查询单笔订单', hbase);
    kv(p, 1114, 472, t < 2.7 ? '输入 order_id' : order.id, hbase, 595);
    p.text('想查的是订单状态，不是省份汇总。', 1114, 653, 30, ink);
    p.impact(1412, 511, t - 2.7, hbase, 259);
  });
};
const separate: Painter = (p, t) => {
  const src = {x: 144, y: 499, w: 352, title: 'HDFS 明细', note: '同一批预处理订单', hue: data};
  const top = {x: 1316, y: 326, w: 451, title: 'Hive / 报表', note: '分析分支 · 引擎读文件', hue: hive};
  const prep = {x: 710, y: 645, w: 425, title: '加工 / 装载', note: '按服务读写需求组织', hue: hbase};
  const bottom = {x: 1316, y: 645, w: 451, title: 'HBase 服务表', note: '点查分支（可选）', hue: hbase};
  route(p, t, .45, 2.02, [[496, 534], [600, 534], [600, 375], [1316, 375]], 'data');
  route(p, t, 2.25, 3.92, [[496, 576], [600, 576], [600, 701], [710, 701]], 'data');
  route(p, t, 3.95, 5.48, [[1135, 701], [1316, 701]], 'data');
  box(p, src); box(p, top, t >= 2); box(p, prep, t >= 3.5); box(p, bottom, t >= 5.2);
  sign(p, '不是 Hive 查询结果的必经下游', 992, 802, dim);
};
const regions: Painter = (p, t) => {
  const split = p.progress(t, .35, 2.7);
  const active = t >= 4.15;
  p.text('订单号作 RowKey（示意）', 143, 352, 31, dim);
  p.line([[152, 483], [152 + 1600 * split, 483]], hbase, 3);
  ['< O-1000', '[O-1000, O-2000)', '≥ O-2000'].forEach((label, i) => {
    const x = 151 + i * 548;
    if (split > .23 + .23 * i) {
      p.rect(x, 406, 491, 80, active && i === 1 ? '#ff9e884e' : '#291f30', hbase, 5);
      p.text(label, x + 23, 456, 32, hbase, 'left', 650, true);
    }
    route(p, t, 2.45 + i * .24, 3.67 + i * .24, [[x + 246, 486], [x + 246, 646]], 'control');
    box(p, {x, y: 646, w: 491, title: `RegionServer ${'ABC'[i]}`, note: `管理示例 Region ${i + 1}`, hue: hbase}, active && i === 1);
  });
  reveal(p, t, 3.88, () => kv(p, 829, 542, `${order.id} → Region 2`, hbase, 317));
};
const hbaseWrite: Painter = (p, t) => {
  const server = {x: 138, y: 470, w: 347, title: 'RegionServer', note: '接收写请求', hue: hbase};
  const wal = {x: 674, y: 338, w: 424, title: 'WAL', note: '日志：用于恢复', hue: hbase};
  const mem = {x: 674, y: 626, w: 424, title: 'MemStore', note: '内存中的更新', hue: hbase};
  const disk = {x: 1325, y: 626, w: 436, title: 'HFile / HDFS', note: '持久化文件', hue: data};
  route(p, t, .5, 2.35, [[485, 525], [552, 525], [552, 397], [674, 397]], 'data');
  route(p, t, 1.3, 3.05, [[485, 552], [552, 552], [552, 684], [674, 684]], 'data');
  route(p, t, 4.2, 6.5, [[1098, 684], [1325, 684]], 'data', 42);
  [server, wal, mem, disk].forEach((b, i) => box(p, b, t >= [0, 2.1, 2.8, 6.3][i]));
  sign(p, '后台 Flush', 1127, 604, hbase);
  sign(p, 'WAL 不经过 Flush 变成 HFile', 671, 785, dim);
};
const hbaseRead: Painter = (p, t) => {
  const x = 1334;
  const selected = t >= 1.42;
  const req = [[539, 511], [717, 511], [950, 545], [1334, 545]] as const;
  const res = [[1334, 596], [930, 596], [724, 628], [539, 628]] as const;
  box(p, {x: 143, y: 477, w: 396, title: 'HBase Client', note: `GET ${order.id}`, hue: hbase});
  route(p, t, .6, 2.82, req, 'control');
  route(p, t, 3.1, 5.38, res, 'data', 42);
  [349, 515, 681].forEach((y, i) => {
    p.alpha(selected && i !== 1 ? .42 : 1, () => box(p, {x, y, w: 428, title: `RegionServer ${'ABC'[i]}`, note: i === 1 ? '目标 Region 2' : '其他键范围', hue: hbase}, selected && i === 1));
  });
  if (selected) p.rect(1328, 508, 440, 128, '#ff9e8815', '#ff9e8896', 8);
  reveal(p, t, 5, () => kv(p, 154, 718, `${order.id} / ${order.status}`, hbase, 404));
  p.legend([['control', '定位与请求'], ['data', '订单状态返回']]);
};
const freshness: Painter = (p, t) => {
  const compared = t >= 2.8;
  [146, 1007].forEach((x, i) => {
    const hue = i ? color.mr : hbase;
    lanes(p, x, 340, 766, 452, i ? '持续同步（示例）' : '每日一次装载（示例）', hue);
    const q = p.progress(t, .35 + .1 * i, 1.24 + .1 * i);
    gauge(p, x + 56, 482, 622, '请求都能很快返回', q * .9, data);
    reveal(p, t, 2.32 + i * .25, () => {
      kv(p, x + 56, 561, i ? '较新的快照' : '昨天的快照', hue, 367);
      p.text(compared ? i ? '持续同步降低更新延迟' : '等下一次装载才更新' : '读取服务表', x + 55, 705, 34, hue);
    });
  });
};
const differences: Painter = (p, t) => {
  bars(p, 144, 313, 713, 410, t - .4);
  reveal(p, t, 1.42, () => {
    lanes(p, 1039, 313, 735, 410, 'HBase / 按键点查', hbase);
    kv(p, 1121, 445, `GET ${order.id}`, hbase, 548);
    kv(p, 1121, 546, order.status, hbase, 548);
  });
  reveal(p, t, 2.65, () => box(p, {x: 147, y: 753, w: 1627, title: 'HDFS / 底层分布式文件存储', hue: data}, true, 82));
  sign(p, 'Hive / SQL 分析', 170, 665, hive);
};

export const query = {
  S33: askSQL, S34: metadata, S35: pruning, S36: plan, S37: engines, S38: result,
  S39: newQuestion, S40: separate, S41: regions, S42: hbaseWrite, S43: hbaseRead, S44: freshness, S45: differences,
};
