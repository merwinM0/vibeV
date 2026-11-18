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
  const grow = eased(t, .7, 2.8);
  const density = motion ? grow : Number(t >= 1.75);
  const surge = motion ? Math.sin(grow * Math.PI) : 0;
  p.glow(1350, 617, 362, '#22608065');
  for (let i = 0; i < 105; i++) {
    if (i > density * 104 || !density || (!motion && i % 3 !== 0)) continue;
    const q = phase((motion ? t * (1.3 + noise(i) * .6) : 0) + noise(i + 21) * 2.6, 2.6);
    const x = 1115 + q * 695;
    const spread = .25 + q * 1.35;
    const y = 543 + (noise(i + 84) - .49) * 332 * spread + Math.sin(q * 6.28) * 58;
    const a = (.16 + .68 * Math.sin(q * Math.PI)) * (.68 + surge * .32);
    p.alpha(a, () => {
      if (i % 4 === 0 || !motion) p.cube(x, y, 9 + noise(i + 91) * 21);
      else p.line([[x - 12 - q * (43 + surge * 85), y + 14 * q], [x, y]], '#6acde8', 2 + 2 * surge);
    });
  }

  const settle = eased(t, 0, .65);
  const x = 1040 + (motion ? 164 * (1 - settle) - 36 * surge : 0);
  const y = 445 + (motion ? 63 * (1 - settle) - 55 * surge : 0);
  p.poly([[x - 32, y + 286], [x + 362, y + 261], [x + 525, y + 320], [x + 77, y + 346]], '#091624', '#294658');
  p.line([[x + 16, y + 294], [x + 392, y + 278]], '#76dcfa95', 2);
  const c = p.ctx;
  c.save();
  c.transform(1, -.09, .12, 1, x, y);
  const zoom = motion ? mix(1.29, 1, settle) : 1;
  c.scale(zoom, zoom);
  for (let i = 5; i >= 1; i--) {
    if (!density) break;
    p.alpha(.54 * density, () => p.panel(i * 35 * density, -i * 18 * density, 384, 242, '#6da9c3', false));
  }
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

  const count = `${Math.floor(1 + 999999 * density).toLocaleString('en-US')}${density === 1 ? '+' : ''}`;
  p.text(count, 112, 478, motion ? 94 + 13 * surge : 94, cyan, 'left', 700, true);
  p.text('每天的订单量（示意）', 118, 537, 30, color.dim);
  const questions = p.progress(t, 2.9, 3.54);
  p.alpha(questions, () => p.move(113, 648, 0, 29 * (1 - questions), 1, () => {
    guide(p, 'A / 汇总分析', '各省卖了多少？', 113, 648, 356, color.hive);
    guide(p, 'B / 订单点查', '这笔订单到哪了？', 488, 648, 384, color.hbase);
  }));
};

export const intake: Painter = (p, t) => {
  const steps = ['采集', '清洗', '去重', '校验'];
  p.text('上游处理', 119, 382, 29, color.dim);
  p.line([[119, 406], [967, 406]], '#426983');
  steps.forEach((value, i) => {
    const x = 120 + i * 216;
    const q = p.progress(t, i * .33, .35 + i * .33);
    p.impact(x + 91, 600, t - .35 - i * .33, color.mr, 111);
    p.panel(x, 458, 185, 148, q > .5 ? color.mr : cyan, q > .5);
    p.text(`0${i + 1}`, x + 17, 495, 24, color.dim, 'left', 500, true);
    p.text(value, x + 19, 550, 44);
    p.alpha(.34 + q * .66, () => {
      p.line([[x + 20, 577], [x + 26, 583], [x + 40, 568]], color.mr, 3);
      p.text('已完成', x + 53, 587, 24, color.mr);
    });
    if (i < 3) p.route([[x + 186, 529], [x + 214, 529]], 'dependency', null, true);
  });

  const door = p.progress(t, 1.6, 2.6);
  p.glow(1468, 553, 430, '#24688669');
  p.poly([[1217, 420], [1360, 337], [1765, 337], [1633, 420]], '#19334b', '#3d6785');
  p.poly([[1633, 420], [1765, 337], [1765, 643], [1633, 743]], '#14253d', '#3d6785');
  p.rect(1217, 420, 416, 323, '#13283b', '#77cfea', 2);
  p.rect(1287, 481, 276, 208, '#091321', '#437088');
  p.rect(1290, 484, 133 - door * 121, 201, '#22455a', '#6ac6e5', 2);
  p.rect(1426 + door * 121, 484, 133 - door * 121, 201, '#1c3950', '#6ac6e5', 2);
  p.text('Hadoop 入口', 1425, 459, 27, cyan, 'center');
  const entry = [[987, 683], [1120, 683], [1292, 572], [1508, 572]] as const;
  p.route(entry, 'data', null, door > .5);
  p.transfer(entry, 'data', t, 2.36, 3.25, 45);
  p.impact(1508, 572, t - 3.25, cyan, 96);
  p.text('预处理后的订单文件', 1091, 786, 30, color.dim);
};

// S03 and S04 use the same map. Coordinates and roles stay fixed across both cuts.
const map = {
  mr: { x: 477, w: 250, title: 'MapReduce', label: '可选计算', hue: color.mr },
  spark: { x: 751, w: 212, title: 'Spark', label: '可选计算', hue: color.spark },
  hive: { x: 987, w: 207, title: 'Hive', label: 'SQL 分析', hue: color.hive },
  hbase: { x: 1218, w: 223, title: 'HBase', label: 'RowKey 点查', hue: color.hbase },
};

export function factoryMap(p: Ink, t: number, common: boolean, full = false, timeScale = 1) {
  t *= timeScale;
  const layer = (delay: number, draw: () => void) => {
    const q = common ? 1 : p.progress(t, delay, delay + .75);
    p.alpha(common ? .61 : q, () => p.move(960, 575, 0, 94 * (1 - q), .95 + .05 * q, draw));
  };
  const links = t >= 3.4;
  const exits = p.progress(t, 4.4, 5.5);
  p.text('治理与编排', 120, 357, 27, color.dim);
  p.text('业务出口', 1512, 357, 27, color.dim);
  p.text('计算 / 分析 / 服务', 474, 313, 28, color.dim);
  layer(0, () => {
    p.panel(477, 607, 964, 77, color.hdfs);
    p.text('HDFS', 506, 655, 34, color.hdfs, 'left', 750, true);
    p.text('保存明细文件与计算结果', 675, 655, 29);
  });
  layer(.74, () => {
    p.panel(477, 484, 511, 81, color.yarn);
    p.text('YARN', 506, 534, 34, color.yarn, 'left', 750, true);
    p.text('为应用分配计算资源', 650, 534, 28);
  });
  layer(1.72, () => {
    Object.values(map).forEach((m) => {
      p.panel(m.x, 335, m.w, 113, m.hue);
      p.text(m.title, m.x + 16, 382, 33, m.hue, 'left', 720, true);
      p.text(m.label, m.x + 16, 420, 26);
    });
    p.route([[587, 484], [587, 448]], 'control', null, links && !common);
    p.route([[831, 484], [831, 448]], 'control', null, links && !common);
    const linked = links && !common;
    const flow = linked && p.motion && t <= 5.1 ? eased(t, 3.4, 5.1) : null;
    p.route([[753, 684], [753, 707], [417, 707], [417, 325], [650, 325], [650, 335]], 'data', flow, linked, false);
    p.route([[650, 325], [865, 325], [865, 335]], 'data', null, linked, false);
    p.text('计算框架读写 HDFS', 478, 736, 26, linked ? cyan : color.dim);
    p.route([[1441, 643], [1469, 643], [1469, 456], [1333, 456], [1333, 448]], 'data', null, !common);
    p.text('加工后装载', 1185, 580, 26, color.dim);
    p.route([[1153, 607], [1153, 448]], 'dependency', null, !common);
    p.text('经执行引擎读写', 963, 591, 25, color.dim);
  });
  layer(2.06, () => {
    p.panel(120, 384, 231, 118, color.workflow, false);
    p.text('工作流', 143, 431, 29, color.workflow);
    p.text('安排作业依赖', 143, 470, 25);
    p.panel(120, 525, 231, 105, color.zk, false);
    p.text('ZooKeeper', 143, 570, 28, color.zk, 'left', 700, true);
    p.text('协调（非数据通道）', 142, 606, 21);
    p.route([[351, 431], [477, 431]], 'control', null, !common);
    const zY = full ? 825 : 779;
    p.route([[351, 578], [394, 578], [394, zY], [1512, zY], [1512, 475], [1382, 475], [1382, 448]], 'control', null, full && links);
    const a = [[1100, 335], [1100, 325], [1490, 325], [1490, 406], [1551, 406]] as const;
    const b = [[1441, 398], [1481, 398], [1481, 517], [1551, 517]] as const;
    p.route(a, 'data', null, links && !common);
    p.route(b, 'data', null, links && !common);
    if (!common) {
      p.transfer(a, 'data', t, 3.9, 5.1, 15);
      p.transfer(b, 'data', t, 4.2, 5.4, 15);
    }
    const lit = !common && exits > .5;
    p.panel(1551, 381, 273, 66, color.hive, lit);
    p.text('A / 省份报表', 1574, 423, 28, color.hive);
    p.panel(1551, 482, 273, 66, color.hbase, lit);
    p.text('B / 订单查询 API', 1574, 524, 27, color.hbase);
    if (!common) {
      p.impact(1588, 421, t - 5.1, color.hive, 99);
      p.impact(1588, 522, t - 5.4, color.hbase, 99);
    }
  });
  if (common || full) {
    const baseTime = full ? t - 2.2 : t;
    const rise = p.progress(baseTime, 0, 1.4);
    const from = 741 + (p.motion ? (full ? 49 : 104) * (1 - rise) : 0);
    p.alpha(.24 + .76 * rise, () => {
      p.glow(930, from + 45, 320, '#4b8cad44');
      p.panel(477, from, 964, 81, color.dep);
      p.text('Hadoop Common', 506, from + 51, 35, color.ink, 'left', 700, true);
      p.text('共享库  /  工具  /  基础接口', 869, from + 51, 30, color.dep);
    });
    p.impact(960, from + 72, baseTime - 1.4, color.dep, 380);
    p.route([[660, from], [660, 684]], 'dependency', null, baseTime >= 1.4);
    p.route([[557, from], [443, from], [443, 526], [477, 526]], 'dependency', null, baseTime >= 1.9);
    p.route([[512, from], [421, from], [421, 397], [477, 397]], 'dependency', null, baseTime >= 2.6);
  }
  p.legend([['data', '数据读写'], ['control', '资源 / 控制'], ['dependency', '依赖 / 间接关系']], 114, full ? 874 : 856);
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
  const a = p.progress(t, 2.3, 2.7) * (1 - p.progress(t, 4.16, 4.55));
  const b = p.progress(t, 4.15, 4.55);
  columns.forEach((col, i) => {
    const x = widths[i];
    if ([2, 3].includes(i)) p.alpha(a, () => p.rect(x + 2, 362, widths[i + 1] - x - 4, 304, '#f8cf8528', '#f8cf85d0', 4));
    p.text(col, x + 22, 406, 33, cyan, 'left', 650, true);
    if (i) p.line([[x, 363], [x, 668]], '#76dcfa25');
  });
  orders.forEach((item, r) => {
    const y = 427 + r * 80;
    const slide = p.progress(t, .1 + r * .4, .75 + r * .4);
    const values = [item.id, item.user, item.province, item.amount, item.status, `${orderDate} ${item.time}`];
    p.alpha(slide, () => p.move(960, y + 40, 0, 40 * (1 - slide), 1, () => {
      p.line([[123, y], [1797, y]], '#76dcfa36');
      values.forEach((v, i) => {
        const x = widths[i];
        const focus = r === 0 && [0, 4].includes(i);
        if (focus) p.alpha(b, () => p.rect(x + 2, y + 2, widths[i + 1] - x - 4, 76, '#ff9e8836', '#ff9e88d0', 4));
        p.text(v, x + 22, y + 52, 32, focus && b > .5 ? color.hbase : i === 4 ? color.mr : color.ink, 'left', 600, ![2, 4].includes(i));
      });
    }));
  });
  p.alpha(.28 + .72 * Math.max(a, b), () => guide(p, 'A / 批量汇总', '按省统计订单数和销售额', 120, 720, 713, color.hive));
  p.alpha(.28 + .72 * b, () => guide(p, 'B / 单条查询', 'O-1001：已发货', 858, 720, 689, color.hbase));
};

export const directories: Painter = (p, t) => {
  p.panel(117, 310, 835, 456, cyan, false);
  p.text('HDFS / 订单明细目录', 147, 367, 32, cyan);
  const dirs = ['/warehouse', 'dwd', 'orders', ...['15', '16', '17'].map((d) => `dt=2026-11-${d}/`)];
  dirs.forEach((name, i) => {
    const y = 423 + i * 55;
    const x = 162 + Math.min(i, 3) * 51;
    const lit = i === 4;
    const open = p.progress(t, i * .24, i * .24 + .72);
    p.alpha(.15 + .85 * open, () => p.move(x, y, -53 * (1 - open), 0, 1, () => {
      const lock = p.progress(t, 2, 2.6);
      if (lit) p.alpha(lock, () => p.rect(x - 13, y - 31, 586, 45, '#21495b', '#76dcfaa5', 2));
      p.line([[x - 34, y - 37], [x - 34, y - 9], [x - 10, y - 9]], '#77a5bf85');
      p.text(name, x, y, 28, lit && lock > .5 ? cyan : color.dim, 'left', 650, true);
    }));
  });
  p.text(orderPath, 117, 829, 28, color.dim, 'left', 500, true);
  p.glow(1440, 540, 415, '#215c7e59');
  p.poly([[1028, 624], [1491, 514], [1818, 637], [1342, 762]], '#102539', '#3f6880');
  for (let i = 0; i < 3; i++) {
    const start = 2.6 + i * .65, end = start + 1.5;
    const x = 1254 + 196 * i, y = 545 + i * 15;
    const path = [[957, 638], [1058, 638], [1203, y], [x, y]] as const;
    if (i === 2) p.route(path, 'data', null, t >= 2.6);
    p.transfer(path, 'data', t, start, end, 61);
    if (t >= end) {
      p.cube(x, y, 66, cyan);
      p.text(`part-00${i}`, x, 705 + i * 7, 25, color.dim, 'center', 600, true);
    }
    p.impact(x, y + 45, t - end, cyan, 90);
  }
  p.tag('Parquet 文件（示例）', 1222, 361, cyan);
};

export const smallFiles: Painter = (p, t) => {
  p.panel(113, 344, 738, 384, amber, false);
  p.panel(1070, 344, 737, 384, cyan, false);
  p.text('写成海量小文件', 148, 402, 34, amber);
  p.text('同一分区内合并', 1107, 402, 34, cyan);
  const q = p.progress(t, 1.8, 3.8);
  for (let i = 0; i < 60; i++) {
    const x = 161 + (i % 12) * 55 + noise(i) * 10;
    const y = 433 + Math.floor(i / 12) * 53 + noise(i + 12) * 9;
    const t1 = p.progress(t, i * .0105, .53 + i * .0105);
    const move = p.progress(t, 1.8 + noise(i + 6) * .51, 3.2 + noise(i + 19) * .6);
    p.alpha(move * .29, () => p.file(x, y, 27, amber));
    p.alpha(t1 * (1 - move), () => {
      const px = mix(x - (p.motion ? 88 : 0) * (1 - t1), 1190 + (i % 3) * 211, move);
      const py = mix(y, 531 - Math.sin(move * Math.PI) * 133, move);
      if (p.motion && move > 0 && move < 1) p.line([[px - 75, py + 13], [px, py + 13]], '#f8cf856e', 3);
      p.file(px, py, 27, amber);
    });
  }
  p.route([[870, 535], [1048, 535]], 'data', p.motion && q > 0 && q < 1 ? q : null, t >= 1.8);
  for (let i = 0; i < 3; i++) {
    const land = 3.1 + .29 * i;
    const reveal = p.progress(t, land - .24, land + .18);
    const fx = 1160 + i * 211;
    p.alpha(.16 + reveal * .84, () => p.move(fx + 60, 526, 0, 0, .65 + .35 * reveal, () => {
      p.file(fx, 464, 117, cyan);
      p.text(`part-00${i}`, fx + 59, 661, 26, cyan, 'center', 600, true);
    }));
    p.impact(fx + 59, 590, t - land, cyan, 114);
  }
  p.tag('开销：元数据与任务调度', 113, 772, amber);
  p.tag('记录不变，文件数量减少', 1070, 772, cyan);
};
