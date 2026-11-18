import { along, color, type Painter, type Point } from './ink';
import { orderPath, orders } from '../orders';
import { box, chain, ctl, data, dim, folio, gauge, hive, ink, kv, lanes, mr, reveal, route, sign, slide, spark, summary, table } from './production';

const rm = { x: 684, y: 321, w: 552, title: 'ResourceManager / RM', note: '集群级资源分配', hue: ctl };
const nm = [150, 733, 1316].map((x, i) => ({ x, y: 628, w: 454, title: `NodeManager ${'ABC'[i]}`, note: '管理本机容器', hue: ctl }));
const resultsPath = '/warehouse/dws/province_sales/';

const job: Painter = (p, t) => {
  lanes(p, 125, 333, 634, 452, 'HDFS / 数据仓库');
  folio(p, 175, 475, '订单明细', '文件仍留在 HDFS');
  p.text(orderPath, 161, 733, 22, dim, 'left', 650, true);
  lanes(p, 1160, 333, 630, 452, 'YARN / 资源大厅', ctl);
  gauge(p, 1241, 660, 475, '可用资源（示意）', .58);
  route(p, t, .8, 2.55, [[730, 583], [1158, 583]], 'control');
  slide(p, t, .65, 3.1, [355, 598], [1215, 474], (x, y) => box(p, {x, y, w: 342, title: '汇总任务', note: '按省统计订单与销售额', hue: ctl }));
  sign(p, '提交任务描述，不搬订单', 786, 672, ctl);
};
const managers: Painter = (p, t) => {
  nm.forEach((node, i) => {
    const cx = node.x + node.w / 2;
    route(p, t, .85 + i * .23, 2.15 + i * .23, [[cx, 628], [cx, 501], [770 + i * 190, 501], [770 + i * 190, 435]], 'control');
    if (t >= 3) route(p, t, 3.05 + i * .24, 4.18 + i * .24, [[814 + i * 144, 435], [814 + i * 144, 547], [cx + 34, 547], [cx + 34, 628]], 'control');
    reveal(p, t, i * .31, () => box(p, node));
  });
  box(p, rm);
  sign(p, t < 3 ? '↑ 状态汇报 / 心跳' : '↓ 分配计算资源', 1335, 380, ctl);
  p.legend([['control', '控制与资源分配']]);
};
const launch: Painter = (p, t) => {
  const client = {x: 128, y: 340, w: 342, title: 'Client', note: '提交 Application', hue: ctl};
  const manager = {x: 688, y: 340, w: 524, title: 'ResourceManager', note: '分配容器资源', hue: ctl};
  const initial = {x: 455, y: 648, w: 416, title: '首个 Container', note: t < 3.4 ? '等待启动 AM' : 'NM 启动 ApplicationMaster', hue: ctl};
  const task = {x: 1310, y: 648, w: 450, title: '任务 Container', note: t < 7.1 ? '等待分配' : 'NM 启动任务', hue: ctl};
  route(p, t, .25, 1.65, [[470, 395], [688, 395]], 'control');
  route(p, t, 1.65, 3.35, [[776, 454], [776, 547], [620, 547], [620, 648]], 'control');
  route(p, t, 3.7, 5.25, [[788, 648], [788, 571], [971, 571], [971, 454]], 'control');
  route(p, t, 5.35, 7.14, [[1132, 454], [1132, 554], [1499, 554], [1499, 648]], 'control');
  [client, manager, initial, task].forEach((b, i) => box(p, b, t >= [0, 1.2, 3.35, 7.1][i]));
  sign(p, '① 申请启动', 151, 494, ctl);
  sign(p, '② NM 启动 AM', 446, 773, ctl);
  sign(p, '③ AM 申请资源', 910, 602, ctl);
  sign(p, '④ NM 启动任务', 1377, 773, ctl);
};
const container: Painter = (p, t) => {
  const q = p.progress(t, .65, 2.6);
  lanes(p, 140, 337, 811, 473, 'Container / 资源与运行环境', ctl);
  gauge(p, 238, 483, 607, 'CPU 额度', q * .71);
  gauge(p, 238, 579, 607, '内存额度', q * .55);
  reveal(p, t, 2.9, () => kv(p, 238, 666, 'Worker 在资源舱中运行', ctl, 438));
  reveal(p, t, 3.05, () => {
    lanes(p, 1112, 337, 670, 473, 'HDFS Block / 文件数据');
    p.cube(1425, 552, 112, data, 'B2');
    p.text('存储块 ≠ 运行资源', 1437, 768, 30, dim, 'center');
  }, 1450, 565);
};
const locality: Painter = (p, t) => {
  lanes(p, 143, 342, 931, 475, '机架 A / 有 B2 副本');
  lanes(p, 1228, 342, 548, 475, '机架 B / 远端候选', ctl);
  const far = [[623, 557], [721, 557], [721, 718], [1449, 718], [1449, 610]] as const;
  const near = [[623, 508], [794, 508]] as const;
  route(p, t < 3.2 ? t : 0, .47, 2.82, far, 'data');
  route(p, t, 3.25, 4.85, near, 'data');
  folio(p, 205, 467, 'B2 / 已存储', '数据保留在原节点');
  box(p, {x: 794, y: 445, w: 250, title: '就近任务', note: '资源充足', hue: ctl}, t >= 3.25);
  box(p, {x: 1300, y: 496, w: 365, title: '远端任务候选', note: '需要跨机架', hue: ctl}, t < 3.2);
  sign(p, t >= 3.25 ? '选短路：少跨一次网络' : '候选：跨机架读块', 779, 752, data);
};
const choose: Painter = (p, t) => {
  box(p, {x: 672, y: 336, w: 576, title: 'YARN 资源大厅', note: '分配计算资源，不搬运订单', hue: ctl});
  const nodes = [{x: 208, y: 651, w: 567, title: 'MapReduce', note: '经典批处理计算', hue: mr},
    {x: 1145, y: 651, w: 567, title: 'Spark', note: '通用计算引擎', hue: spark}];
  nodes.forEach((b, i) => {
    const x = b.x + b.w / 2;
    route(p, t, .6 + i * .42, 2.45 + i * .42, [[826 + i * 268, 450], [826 + i * 268, 524], [x, 524], [x, 651]], 'control');
    reveal(p, t, 1.4 + i * .36, () => box(p, b, true, 150), x, 690);
  });
  sign(p, '或 / 按需求选择', 835, 701, dim);
};
const splitInputs: Painter = (p, t) => {
  folio(p, 145, 478, '订单文件', '数据仍在分布式存储');
  const boxes = [365, 519, 673].map((y, i) => ({x: 1340, y, w: 440, title: `Map Task ${i + 1}`, note: `读取 Input Split ${i + 1}`, hue: mr}));
  boxes.forEach((b, i) => {
    const points = [[540, 542], [668, 542], [815, b.y + 56], [1340, b.y + 56]] as const;
    route(p, t, .64 + i * .28, 2.5 + i * .35, points, 'data', 32);
    reveal(p, t, 1.06 + i * .32, () => kv(p, 889, b.y + 2, `Split ${i + 1}`, mr, 165));
    box(p, b, t >= 2.5 + i * .35);
  });
  sign(p, '处理分片 ≠ 存储块', 145, 749, dim);
};
const mapPairs: Painter = (p, t) => {
  p.text('订单明细', 149, 368, 36, dim);
  p.text('Map / 拆出省份与金额', 738, 368, 36, mr);
  p.text('输出键值对', 1384, 368, 36, dim);
  orders.forEach((r, i) => {
    const y = 424 + 132 * i;
    const hue = r.province === '江苏' ? mr : hive;
    box(p, {x: 138, y, w: 489, title: r.id, note: `${r.province} · ¥${r.amount}`, hue});
    route(p, t, .45 + .45 * i, 3.2 + i * .51, [[627, y + 60], [1345, y + 60]], 'data');
    reveal(p, t, 1.02 + .48 * i, () => kv(p, 765, y + 29, 'province / amount', hue, 320));
    reveal(p, t, 3 + i * .46, () => kv(p, 1384, y + 29, `(${r.province}, ${Number(r.amount)})`, hue, 350));
  });
};
const combiner: Painter = (p, t) => {
  lanes(p, 145, 328, 1620, 286, '同一 Map 任务的局部示例 / 可选', mr);
  const merge = (i: number) => slide(p, t, .9 + i * .13, 2.85 + i * .1, [274 + i * 310, 459], [946, 459], (x, y) => {
    if (t < 2.99) kv(p, x, y, `(江苏, ${i ? 50 : 100})`, mr, 276);
  });
  merge(0); merge(1);
  reveal(p, t, 2.87, () => kv(p, 945, 459, '(江苏, 150)', mr, 300));
  p.impact(1082, 506, t - 3, mr, 158);
  sign(p, '适合可局部合并的运算', 1270, 468, mr);
  route(p, t, 3, 4.8, [[435, 747], [1415, 747]], 'data');
  box(p, {x: 155, y: 695, w: 280, title: 'Map 输出', hue: dim});
  box(p, {x: 1415, y: 695, w: 340, title: '直接进入 Shuffle', hue: dim});
  sign(p, '另一条路线：不启用 Combiner', 659, 677, dim);
};
const shuffle: Painter = (p, t) => {
  p.text('Map 输出 / 不启用 Combiner 的示例', 140, 368, 31, dim);
  p.text(t < 1.3 ? '按键分区' : t < 5.34 ? '跨工作台交换' : '同键已汇流', 788, 368, 36, data);
  p.text('Reduce 侧 / 排序和分组', 1302, 368, 31, dim);
  const paths: readonly (readonly Point[])[] = [
    [[400, 477], [686, 477], [970, 518], [1299, 518]],
    [[400, 601], [734, 601], [970, 725], [1299, 725]],
    [[400, 725], [721, 725], [1005, 547], [1299, 547]],
  ];
  orders.forEach((r, i) => {
    const hue = r.province === '江苏' ? mr : hive;
    const path = paths[i];
    const at = 1.3 + i * .47;
    p.line(path, `${hue}${t >= at ? 'a9' : '32'}`, t >= at ? 5 : 2);
    p.route(path, 'data', null, false);
    const end = at + 3.1;
    const startPoint = path[0], endPoint = path[path.length - 1];
    kv(p, 141, startPoint[1] - 29, `${r.province} / ${Number(r.amount)}`, hue, 260);
    if (t >= at && t < end) {
      const q = p.progress(t, at, end);
      const [x, y] = along(path, q);
      if (p.motion) {
        const tail = along(path, Math.max(0, q - .16));
        p.line([tail, [x, y]], `${hue}40`, 24);
        p.line([tail, [x, y]], `${hue}dc`, 5);
      }
      kv(p, x - 55, y - 27, String(Number(r.amount)), hue, 110);
    }
    p.impact(endPoint[0], endPoint[1], t - end, hue, 104);
  });
  const js = t < 4.4 ? '等待传输' : t < 5.34 ? '[100]' : '[100, 50]';
  const gd = t < 4.87 ? '等待传输' : '[80]';
  box(p, {x: 1300, y: 460, w: 460, title: '江苏分组', note: js, hue: mr}, t >= 4.4);
  box(p, {x: 1300, y: 667, w: 460, title: '广东分组', note: gd, hue: hive}, t >= 4.87);
  p.legend([['data', '数据传输']]);
};
const reduce: Painter = (p, t) => {
  summary.forEach((r, i) => {
    const y = 385 + i * 200;
    const vals = orders.filter((o) => o.province === r.province).map((o) => Number(o.amount));
    box(p, {x: 140, y, w: 430, title: r.province, note: `[${vals.join(', ')}]`, hue: r.hue});
    route(p, t, .45 + i * .55, 2.55 + i * .8, [[570, y + 58], [1029, y + 58]], 'data', 36);
    const q = p.progress(t, 1.2 + i * .55, 3.15 + i * .75);
    p.text(String(Math.round(r.total * q)), 936, y + 129, 64, r.hue, 'right', 740, true);
  });
  table(p, 1040, 361, 721, t - 3.25, 'Reduce 输出 / COUNT + SUM');
  sign(p, '每个组独立求和与计数', 1040, 674, mr);
};
const writeResult: Painter = (p, t) => {
  box(p, {x: 141, y: 477, w: 430, title: '计算结果', note: '按省汇总', hue: mr});
  lanes(p, 1121, 336, 645, 455, 'HDFS / 同一仓库');
  p.text('明细区（保留）', 1165, 460, 33, dim);
  p.text('/warehouse/dwd/orders/', 1165, 511, 27, dim, 'left', 650, true);
  p.line([[1147, 552], [1732, 552]], '#76dcfa52');
  route(p, t, .64, 3.6, [[571, 535], [825, 535], [958, 646], [1121, 646]], 'data', 47);
  reveal(p, t, 3.2, () => {
    p.text('汇总结果区', 1165, 632, 37, data);
    p.text(resultsPath, 1165, 702, 26, ink, 'left', 650, true);
  });
};
const dag: Painter = (p, t) => {
  const stages = [
    {x: 170, y: 468, w: 288, title: '读 HDFS', note: '加载订单', hue: data},
    {x: 550, y: 468, w: 295, title: 'Filter', note: '过滤日期', hue: spark},
    {x: 1007, y: 468, w: 292, title: 'Group', note: '按省分组', hue: spark},
    {x: 1420, y: 468, w: 322, title: 'Aggregate', note: '计数 / 求和', hue: spark},
  ];
  route(p, t, .25, 1.28, [[458, 525], [550, 525]], 'data', 21);
  route(p, t, 1.3, 2.64, [[845, 525], [1007, 525]], 'dependency');
  route(p, t, 2.45, 3.67, [[1299, 525], [1420, 525]], 'dependency');
  stages.forEach((stage, i) => box(p, stage, t >= [0, 1.1, 2.1, 3.3][i]));
  box(p, {x: 716, y: 315, w: 450, title: 'Driver / 组织执行', hue: spark}, true, 75);
  if (t >= 2.2) {
    p.line([[924, 425], [924, 700]], `${spark}a5`, 2, [5, 10]);
    p.text('Stage 1 / 读取与过滤', 192, 638, 28, spark);
    p.text('Stage 2 / 分组与聚合', 1016, 638, 28, spark);
    sign(p, 'Shuffle 边界', 832, 657, spark);
  }
  if (t >= 3.15) {
    for (let i = 0; i < 2; i++) {
      const x = 484 + i * 868;
      const assigned = t >= 5.48 + i * .33;
      route(p, t, 3.35 + i * .33, 5.48 + i * .33, [[935 + i * 56, 390], [935 + i * 56, 415 + i * 13], [x, 415 + i * 13], [x, 721]], 'control');
      box(p, {x: x - 185, y: 721, w: 520, title: `Executor ${i + 1}`, note: assigned ? 'Task 执行中' : 'Task 等待分配', hue: spark}, assigned);
      if (assigned) for (let j = 0; j < 3; j++) {
        const lit = p.progress(t, 5.48 + i * .33 + j * .24, 5.89 + i * .33 + j * .24);
        p.rect(x + 97 + j * 50, 785, 33, 23, `${spark}${lit > .5 ? 'a0' : '1f'}`, `${spark}81`, 3);
      }
    }
  }
};
const sparkYarn: Painter = (p, t) => {
  const anchors = [219, 760, 1301];
  box(p, {x: 663, y: 347, w: 596, title: 'YARN / 集群资源管理', note: '为 Spark 应用分配运行资源', hue: ctl});
  lanes(p, 148, 584, 1624, 224, 'Spark / 应用执行层', spark);
  ['Driver', 'Executor A', 'Executor B'].forEach((title, i) => {
    const x = anchors[i];
    route(p, t, .6 + i * .34, 2.75 + i * .34, [[811 + i * 148, 461], [811 + i * 148, 522], [x + 190, 522], [x + 190, 657]], 'control');
    reveal(p, t, 2.55 + i * .36, () => box(p, {x, y: 657, w: 402, title, note: i ? '执行 Task' : '协调 Stage / Task', hue: spark}));
  });
  sign(p, '也可部署在其他集群管理环境', 1175, 828, dim);
};
const cache: Painter = (p, t) => {
  const reuse = t >= 3;
  const end = {x: 1313, y: 551, w: 453, title: reuse ? '下一次计算' : '第一次计算', note: reuse ? '复用中间结果' : '可按需缓存结果', hue: spark};
  route(p, reuse ? 0 : t, .4, 2.6, [[449, 601], [622, 601], [622, 722], [1164, 722], [1164, 601], [1313, 601]], 'data', 37);
  route(p, t, 3.05, 4.73, [[1105, 484], [1201, 484], [1201, 572], [1313, 572]], 'data', 37);
  box(p, {x: 145, y: 551, w: 304, title: 'HDFS', note: '来源数据', hue: data});
  reveal(p, t, 2.04, () => box(p, {x: 693, y: 429, w: 412, title: 'Cache', note: '可选的中间结果', hue: spark}));
  box(p, end, t >= 2.55);
  sign(p, 'Shuffle 仍可能用磁盘', 677, 773, dim);
};
const alternatives: Painter = (p, t) => {
  const input = {x: 146, y: 474, w: 355, title: 'HDFS / 明细', note: '同一个输入', hue: data};
  const output = {x: 1418, y: 474, w: 350, title: 'HDFS / 结果', note: '不同作业可写回', hue: data};
  [mr, spark].forEach((hue, i) => {
    const y = 350 + 277 * i;
    route(p, t, .35 + .35 * i, 2.1 + .35 * i, [[501, 518 + 25 * i], [573, 518 + 25 * i], [573, y + 57], [708, y + 57]], 'data');
    route(p, t, 2.24 + i * .37, 4.0 + i * .37, [[1209, y + 57], [1322, y + 57], [1322, 518 + 25 * i], [1418, 518 + 25 * i]], 'data');
    box(p, {x: 708, y, w: 501, title: i ? 'Spark' : 'MapReduce', note: i ? '通用计算引擎' : '经典批处理模型', hue}, t >= 1 + .35 * i);
  });
  box(p, input); box(p, output, t >= 4);
  sign(p, '可选路线，不是先后步骤', 754, 522, dim);
};

export const compute = {
  S17: job, S18: managers, S19: launch, S20: container, S21: locality, S22: choose,
  S23: splitInputs, S24: mapPairs, S25: combiner, S26: shuffle, S27: reduce, S28: writeResult,
  S29: dag, S30: sparkYarn, S31: cache, S32: alternatives,
};
