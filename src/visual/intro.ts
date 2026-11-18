import { orderDate, orderPath, orders } from '../orders';
import { color, eased, mix, noise, phase, type Ink, type Painter } from './ink';

const cyan = color.data;
const amber = color.ctl;

function guide(p: Ink, a: string, b: string, x: number, y: number, w: number, hue = cyan) {
  p.panel(x, y, w, 110, hue);
  p.text(a, x + 24, y + 38, 25, hue);
  p.text(b, x + 24, y + 82, 35);
}

export const opening: Painter = (p, t, motion) => {
  const grow = eased(t, 1, 8);
  p.glow(1320, 654, 368, '#174c6b5e');
  for (let i = 0; i < 92; i++) {
    if (i > 8 + grow * 85) continue;
    const q = phase(t * (1.2 + noise(i) * .4) + noise(i + 21) * 10, 10);
    const x = 1035 + q * 766;
    const spread = .3 + q * 1.25;
    const y = 525 + (noise(i + 84) - .49) * 440 * spread + Math.sin(q * 6.28) * 65;
    const a = .2 + .75 * Math.sin(q * Math.PI);
    p.alpha(a, () => {
      if (i % 5 === 0) p.cube(x, y, 8 + noise(i + 91) * 13);
      else p.line([[x - 10 - q * 33, y], [x, y]], i % 12 === 0 ? '#f8cf85' : '#6acde8', 2);
    });
  }

  const x = 1020 + (motion ? 30 * eased(t, 0, 5) : 0);
  const y = 424 + (motion ? -12 * Math.sin(t * 1.35) : 0);
  p.poly([[x - 32, y + 286], [x + 362, y + 261], [x + 525, y + 320], [x + 77, y + 346]], '#091624', '#294658');
  p.line([[x + 16, y + 294], [x + 392, y + 278]], '#76dcfa95', 2);
  const c = p.ctx;
  c.save();
  c.transform(1, -.09, .12, 1, x, y);
  p.panel(13, 12, 384, 242, '#6da9c3', false);
  p.panel(0, 0, 384, 242);
  p.rect(21, 27, 46, 46, '#76dcfa26', '#76dcfa47', 5);
  p.cube(44, 48, 12);
  p.text('电商订单', 87, 61, 29);
  p.text(orders[0].id, 22, 129, 51, color.ink, 'left', 740, true);
  p.line([[22, 151], [362, 151]], '#76dcfa46');
  p.text(`${orders[0].province} · ${orders[0].status}`, 24, 198, 25, color.dim);
  p.text(`¥${orders[0].amount}`, 359, 198, 28, cyan, 'right', 700, true);
  c.restore();

  const count = t < 1 ? '1' : `${Math.floor(1 + (999999 * grow)).toLocaleString('en-US')}${grow === 1 ? '+' : ''}`;
  p.text(count, 112, 478, 94, cyan, 'left', 700, true);
  p.text('每天的订单量（示意）', 118, 537, 30, color.dim);
  p.alpha(.32 + .68 * eased(t, 4.3, 6.3), () => {
    guide(p, 'A / 汇总分析', '各省卖了多少？', 113, 648, 356, color.hive);
    guide(p, 'B / 订单点查', '这笔订单到哪了？', 488, 648, 384, color.hbase);
  });
};

export const intake: Painter = (p, t) => {
  const steps = ['采集', '清洗', '去重', '校验'];
  p.text('上游处理', 119, 382, 29, color.dim);
  p.line([[119, 406], [967, 406]], '#426983');
  steps.forEach((value, i) => {
    const x = 120 + i * 216;
    const q = eased(t, .4 + i * 1.1, 1.2 + i * 1.1);
    p.panel(x, 458, 185, 148, q > .5 ? color.mr : cyan, q > .5);
    p.text(`0${i + 1}`, x + 17, 495, 24, color.dim, 'left', 500, true);
    p.text(value, x + 19, 550, 44);
    p.alpha(.34 + q * .66, () => {
      p.line([[x + 20, 577], [x + 26, 583], [x + 40, 568]], color.mr, 3);
      p.text('已完成', x + 53, 587, 24, color.mr);
    });
    if (i < 3) p.route([[x + 186, 529], [x + 214, 529]], 'dependency', null, true);
  });

  const door = eased(t, 4.3, 8.6);
  p.glow(1468, 553, 430, '#24688669');
  p.poly([[1217, 420], [1360, 337], [1765, 337], [1633, 420]], '#19334b', '#3d6785');
  p.poly([[1633, 420], [1765, 337], [1765, 643], [1633, 743]], '#14253d', '#3d6785');
  p.rect(1217, 420, 416, 323, '#13283b', '#77cfea', 2);
  p.rect(1287, 481, 276, 208, '#091321', '#437088');
  p.rect(1290, 484, 133 - door * 121, 201, '#22455a', '#6ac6e5', 2);
  p.rect(1426 + door * 121, 484, 133 - door * 121, 201, '#1c3950', '#6ac6e5', 2);
  p.text('Hadoop 入口', 1425, 459, 27, cyan, 'center');
  p.route([[986, 683], [1120, 683], [1292, 572], [1508, 572]], 'data', door > .5 ? phase(t - 7, 3.8) : null, door > .5);
  p.text('预处理后的订单文件', 1091, 786, 30, color.dim);
};

// S03 and S04 use the same map. Coordinates and roles stay fixed across both cuts.
const map = {
  mr: { x: 477, w: 250, title: 'MapReduce', label: '可选计算', hue: color.mr },
  spark: { x: 751, w: 212, title: 'Spark', label: '可选计算', hue: color.spark },
  hive: { x: 987, w: 207, title: 'Hive', label: 'SQL 分析', hue: color.hive },
  hbase: { x: 1218, w: 223, title: 'HBase', label: 'RowKey 点查', hue: color.hbase },
};

function factoryMap(p: Ink, t: number, common: boolean) {
  const lit = (delay: number) => common ? .61 : .45 + .55 * eased(t, delay, delay + 1.25);
  p.text('治理与编排', 120, 357, 27, color.dim);
  p.text('业务出口', 1512, 357, 27, color.dim);
  p.text('计算 / 分析 / 服务', 474, 313, 28, color.dim);
  p.alpha(lit(0), () => {
    p.panel(477, 607, 964, 77, color.hdfs);
    p.text('HDFS', 506, 655, 34, color.hdfs, 'left', 750, true);
    p.text('保存明细文件与计算结果', 675, 655, 29);
  });
  p.alpha(lit(1.7), () => {
    p.panel(477, 484, 511, 81, color.yarn);
    p.text('YARN', 506, 534, 34, color.yarn, 'left', 750, true);
    p.text('为应用分配计算资源', 650, 534, 28);
  });
  p.alpha(lit(2.8), () => {
    Object.values(map).forEach((m) => {
      p.panel(m.x, 335, m.w, 113, m.hue);
      p.text(m.title, m.x + 16, 382, 33, m.hue, 'left', 720, true);
      p.text(m.label, m.x + 16, 420, 26);
    });
    p.route([[587, 484], [587, 448]], 'control', null, !common);
    p.route([[831, 484], [831, 448]], 'control', null, !common);
    if (!common) {
      const linked = t >= 4.1;
      const flow = linked ? phase(t - 4.1, 4.7) : null;
      p.route([[753, 684], [753, 707], [417, 707], [417, 325], [650, 325], [650, 335]], 'data', flow, linked, false);
      p.route([[650, 325], [865, 325], [865, 335]], 'data', null, linked, false);
      p.text('计算框架读写 HDFS', 478, 746, 26, linked ? cyan : color.dim);
    }
    p.route([[1441, 643], [1469, 643], [1469, 456], [1333, 456], [1333, 448]], 'data', null, !common);
    p.text('加工后装载', 1185, 580, 26, color.dim);
    p.route([[1153, 607], [1153, 448]], 'dependency', null, !common);
    p.text('经执行引擎读写', 963, 591, 25, color.dim);
  });
  p.alpha(lit(5), () => {
    p.panel(120, 384, 231, 118, color.workflow, false);
    p.text('工作流', 143, 431, 29, color.workflow);
    p.text('安排作业依赖', 143, 470, 25);
    p.panel(120, 525, 231, 105, color.zk, false);
    p.text('ZooKeeper', 143, 570, 28, color.zk, 'left', 700, true);
    p.text('协调（非数据通道）', 142, 606, 21);
    p.route([[351, 431], [477, 431]], 'control', null, !common);
    p.route([[351, 578], [394, 578], [394, 779], [1512, 779], [1512, 475], [1382, 475], [1382, 448]], 'control', null, false);
    p.panel(1551, 381, 273, 66, color.hive, false);
    p.text('A / 省份报表', 1574, 423, 28, color.hive);
    p.panel(1551, 482, 273, 66, color.hbase, false);
    p.text('B / 订单查询 API', 1574, 524, 27, color.hbase);
    p.route([[1100, 335], [1100, 325], [1490, 325], [1490, 406], [1551, 406]], 'data', null, !common);
    p.route([[1441, 398], [1481, 398], [1481, 517], [1551, 517]], 'data', null, !common);
  });
  if (common) {
    const slide = 38 * (1 - eased(t, 0, 2.6));
    const from = 741 + slide;
    p.glow(930, from + 45, 410, '#4b8cad44');
    p.panel(477, from, 964, 81, color.dep);
    p.text('Hadoop Common', 506, from + 51, 35, color.ink, 'left', 700, true);
    p.text('共享库  /  工具  /  基础接口', 869, from + 51, 30, color.dep);
    const q = t > 3 ? phase(t, 4.5) : null;
    p.route([[660, from], [660, 684]], 'dependency', q);
    p.route([[557, from], [443, from], [443, 526], [477, 526]], 'dependency', q);
    p.route([[512, from], [421, from], [421, 397], [477, 397]], 'dependency', q);
  }
  p.legend([['data', '数据读写'], ['control', '资源 / 控制'], ['dependency', '依赖 / 间接关系']]);
}
export const ecosystem: Painter = (p, t) => factoryMap(p, t, false);
export const common: Painter = (p, t) => factoryMap(p, t, true);

export const ordersTable: Painter = (p, t) => {
  const widths = [120, 346, 550, 777, 1003, 1301, 1798];
  const columns = ['order_id', 'user_id', 'province', 'amount', 'order_status', 'ts'];
  p.text('样例 / 电商订单明细', 121, 329, 29, cyan);
  p.text(orderDate, 1800, 329, 27, color.dim, 'right', 600, true);
  p.panel(120, 360, 1680, 308, cyan, false);
  p.rect(122, 362, 1676, 65, '#1e344c');
  columns.forEach((col, i) => {
    const x = widths[i];
    const q = eased(t, .12 + i * .67, .88 + i * .67);
    const fade = 1 - eased(t, 5, 6.7);
    p.alpha(q * fade * .58, () => p.rect(x + 1, 362, widths[i + 1] - x - 2, 304, '#327497'));
    p.text(col, x + 22, 406, 33, cyan, 'left', 650, true);
    if (i) p.line([[x, 363], [x, 668]], '#76dcfa25');
  });
  orders.forEach((item, r) => {
    const y = 427 + r * 80;
    p.line([[123, y], [1797, y]], '#76dcfa36');
    const values = [item.id, item.user, item.province, item.amount, item.status, `${orderDate} ${item.time}`];
    values.forEach((v, i) => p.text(v, widths[i] + 22, y + 52, 32, i === 4 ? color.mr : color.ink, 'left', 600, ![2, 4].includes(i)));
  });
  p.alpha(.25 + .75 * eased(t, 5.5, 7.9), () => {
    guide(p, 'A / 批量汇总', '按省统计订单数和销售额', 120, 720, 713, color.hive);
    guide(p, 'B / 单条查询', 'O-1001：已发货', 858, 720, 689, color.hbase);
  });
};

export const directories: Painter = (p, t) => {
  p.panel(117, 310, 835, 456, cyan, false);
  p.text('HDFS / 订单明细目录', 147, 367, 32, cyan);
  const dirs = ['/warehouse', 'dwd', 'orders', ...['15', '16', '17'].map((d) => `dt=2026-11-${d}/`)];
  dirs.forEach((name, i) => {
    const y = 423 + i * 55;
    const x = 162 + Math.min(i, 3) * 51;
    const lit = i === 4;
    p.alpha(.27 + .73 * eased(t, i * .6, i * .6 + 1.1), () => {
      if (lit) p.rect(x - 13, y - 31, 586, 45, '#21495b', '#76dcfa64', 2);
      p.line([[x - 34, y - 37], [x - 34, y - 9], [x - 10, y - 9]], '#77a5bf85');
      p.text(name, x, y, 28, lit ? cyan : color.dim, 'left', 650, true);
    });
  });
  p.text(orderPath, 117, 829, 28, color.dim, 'left', 500, true);
  p.glow(1440, 540, 415, '#215c7e59');
  p.poly([[1028, 624], [1491, 514], [1818, 637], [1342, 762]], '#102539', '#3f6880');
  p.route([[957, 638], [1058, 638], [1203, 557], [1709, 557]], 'data', t >= 5 ? phase(t - 5, 3.4) : null, t >= 5);
  for (let i = 0; i < 3; i++) {
    const q = eased(t, 4.4 + i * 1.2, 7 + i * 1.2);
    const x = mix(1056, 1254 + 196 * i, q);
    if (q > 0) p.alpha(.35 + q * .65, () => {
      p.cube(x, 529 + i * 14, 66, cyan);
      p.text(`part-00${i}`, x, 705 + i * 7, 25, color.dim, 'center', 600, true);
    });
  }
  p.tag('Parquet 文件（示例）', 1222, 361, cyan);
};

export const smallFiles: Painter = (p, t) => {
  p.panel(113, 344, 738, 384, amber, false);
  p.panel(1070, 344, 737, 384, cyan, false);
  p.text('写成海量小文件', 148, 402, 34, amber);
  p.text('同一分区内合并', 1107, 402, 34, cyan);
  const q = eased(t, 4.2, 9.1);
  for (let i = 0; i < 42; i++) {
    const x = 161 + (i % 9) * 72 + noise(i) * 10;
    const y = 433 + Math.floor(i / 9) * 53 + noise(i + 12) * 9;
    const t1 = eased(t, i * .047, 1.1 + i * .047);
    const move = eased(t, 4.6 + noise(i + 6) * 1.75, 8 + noise(i + 19) * 1.5);
    p.alpha(move * .23, () => p.file(x, y, 27, amber));
    p.alpha(t1 * (1 - move), () => p.file(mix(x - 25 * (1 - t1), 1178 + (i % 3) * 208, move),
      mix(y, 502 - Math.sin(move * Math.PI) * 110, move), 27, amber));
  }
  p.route([[870, 535], [1048, 535]], 'data', q > 0 && q < 1 ? q : null, t >= 4);
  for (let i = 0; i < 3; i++) {
    const reveal = eased(t, 5.5 + .65 * i, 7.5 + .65 * i);
    p.alpha(.25 + reveal * .75, () => {
      p.file(1160 + i * 211, 464 + 23 * (1 - reveal), 117, cyan);
      p.text(`part-00${i}`, 1219 + i * 211, 661, 26, cyan, 'center', 600, true);
    });
  }
  p.tag('开销：元数据与任务调度', 113, 772, amber);
  p.tag('记录不变，文件数量减少', 1070, 772, cyan);
};
