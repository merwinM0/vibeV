import { color, eased, mix, phase, type Ink, type Painter, type Point } from './ink';

const cyan = color.hdfs;
const gold = color.ctl;
const subdued = color.dim;
const b2 = 'B2';

type NodeOptions = { block?: string; active?: boolean; offline?: boolean; hue?: string; detail?: string };
function node(p: Ink, x: number, y: number, w: number, title: string, role: string, opts: NodeOptions = {}) {
  const hue = opts.offline ? color.off : (opts.hue ?? cyan);
  const active = opts.active ?? true;
  p.panel(x, y, w, 148, hue, active && !opts.offline);
  p.text(title, x + 23, y + 53, 33, active ? color.ink : subdued, 'left', 740, true);
  p.text(role, x + 23, y + 92, 27, opts.offline ? color.off : subdued);
  p.line([[x + 23, y + 112], [x + w - 23, y + 112]], '#688ca260', 1.5);
  if (opts.block) {
    p.rect(x + 23, y + 119, 70, 21, '#285066', `${hue}85`, 1);
    p.text(opts.block, x + 58, y + 137, 20, '#dbf9ff', 'center', 750, true);
  } else if (opts.detail) {
    p.text(opts.detail, x + 23, y + 136, 21, hue);
  } else {
    for (let i = 0; i < 4; i++) p.line([[x + 23 + i * 23, y + 131], [x + 37 + i * 23, y + 131]], '#63859c66', 2);
  }
  p.dot(x + w - 23, y + 24, 5, opts.offline ? color.off : active ? hue : '#748698');
}

function meta(p: Ink, x: number, y: number, w: number, data: string, notice: string) {
  node(p, x, y, w, 'NameNode', data, { hue: gold, detail: notice });
}

function terminal(p: Ink, x: number, y: number, w: number, who: string, task: string) {
  node(p, x, y, w, who, task, { hue: '#a9cfe9' });
}

function rack(p: Ink, x: number, y: number, w: number, h: number, label: string) {
  p.panel(x, y, w, h, '#6ea3bf', false);
  p.line([[x + 20, y + 51], [x + w - 21, y + 51]], '#6ea3bf51');
  p.text(label, x + 22, y + 37, 27, subdued);
}

export const warehouse: Painter = (p, t, motion) => {
  const q = p.progress(t, .22, 1.18);
  const c = p.ctx;
  c.save();
  if (motion) {
    c.translate(960, 575 - 69 * (1 - q));
    c.scale(1 + .10 * (1 - q), 1 + .10 * (1 - q));
    c.translate(-960, -575);
  }
  p.glow(970, 604, 571, '#25597756');
  p.poly([[127, 820], [1793, 820], [1560, 621], [362, 621]], '#102336', '#345773');
  for (let i = 0; i < 5; i++) {
    p.line([[134 + i * 405, 820], [363 + i * 297, 621]], '#41708d44');
  }
  meta(p, 729, 301, 462, '文件目录 · 块的位置', '元数据服务');
  p.tag('元数据层', 215, 342, gold);
  p.tag('数据存储层', 215, 525, cyan);
  for (let i = 0; i < 3; i++) {
    const x = 225 + i * 539;
    const cx = x + 198;
    p.route([[960, 450], [960, 501], [cx, 501], [cx, 596]], 'control', null, q > .5, false);
    const rise = p.progress(t, 1.3 + .33 * i, 2.24 + .33 * i);
    p.alpha(.16 + .84 * rise, () => p.move(cx, 596, 0, 82 * (1 - rise), 1, () => {
      p.panel(x - 13, 583, 425, 231, '#5990ad', false);
      node(p, x, 596, 397, `DataNode ${'ABC'[i]}`, '保存文件数据块', { active: rise > .65 });
    }));
    for (let j = 0; j < 3; j++) {
      const land = 2.55 + i * .38 + j * .20;
      const block = p.progress(t, land - .47, land);
      const bx = x + 77 + j * 112;
      p.alpha(block, () => p.cube(bx, 777 - (motion ? 56 * (1 - block) : 0), 25));
      p.impact(bx, 791, t - land, cyan, 57);
    }
  }
  p.legend([['control', '管理与状态交互']], 115, 862);
  c.restore();
};

export const split: Painter = (p, t) => {
  const q = p.progress(t, 1.5, 2.84);
  p.glow(469, 571, 345, '#235a794b');
  p.text(t < 1.5 ? '订单文件' : '三块独立数据', 126, 356, 34, cyan);
  p.tag('按配置切块', 126, 741, subdued);
  p.alpha(1 - q * .92, () => p.cube(415, 541, 177, cyan));
  if (p.motion) for (let i = 0; i < 2; i++) {
    const sweep = eased(t, .25 + i * .34, 1.23 + i * .26);
    if (sweep <= 0 || q >= 1) continue;
    const x = 355 + 105 * i;
    p.alpha((1 - q) * .89, () => {
      p.line([[x - 73, 536], [x + 55, 480]], '#aaf4ff80', 7);
      p.line([[x - 73, 536], [x + 55, 480], [x + 55, 480 + 138 * sweep]], '#dbfbff', 2.5);
    });
  }
  const hues = ['#9ee5fc', '#76dcfa', '#76bfff'];
  for (let i = 0; i < 3; i++) {
    const launch = 2.9 + i * .25, land = 4.7 + i * .3;
    const y = 340 + i * 176;
    const id = `B${i + 1}`;
    const path: Point[] = [[651, 436 + i * 107], [845, 436 + i * 107], [1050, y + 76], [1370, y + 76]];
    p.route(path, 'data', null, t >= launch);
    if (t < launch) p.alpha(q, () => {
      p.cube(mix(360 + i * 42, 651, q), mix(534, 436 + i * 107, q), 43, hues[i]);
    });
    if (q > .7) p.text(id, 556, 444 + i * 107, 29, hues[i], 'left', 740, true);
    p.transfer(path, 'data', t, launch, land, 43);
    node(p, 1377, y, 435, `DataNode ${'BAC'[i]}`, '块的一个存储位置', { block: t >= land ? id : undefined, active: t >= land });
    p.impact(1420, y + 78, t - land, cyan, 120);
  }
  p.text('B1 / B2 / B3：只示意块的划分，不代表固定块数。', 128, 850, 27, subdued);
};

export const writePath: Painter = (p, t) => {
  const requested = t < 2.4;
  const reply = t >= 2.4 && t < 4.6;
  const write = t >= 4.6;
  const request: Point[] = [[467, 547], [596, 547], [596, 388], [744, 388]];
  const response: Point[] = [[744, 438], [644, 438], [644, 590], [467, 590]];
  const content: Point[] = [[467, 633], [581, 633], [581, 698], [1388, 698]];
  p.route(request, 'control', null, requested);
  p.route(response, 'control', null, reply);
  p.route(content, 'data', null, write);
  p.transfer(request, 'control', t, .4, 2.24);
  p.transfer(response, 'control', t, 2.4, 4.45);
  p.transfer(content, 'data', t, 4.6, 7, 44);
  p.impact(759, 389, t - 2.24, gold, 89);
  p.impact(1385, 698, t - 7, cyan, 117);
  terminal(p, 125, 519, 342, 'Client', '写入订单文件');
  meta(p, 744, 318, 474, '文件创建与块分配', '只交换元数据');
  node(p, 1388, 623, 415, 'DataNode A', '接收文件数据', { active: write, block: t >= 7 ? b2 : undefined });
  p.tag('① 申请创建文件', 158, 390, requested ? gold : subdued);
  p.tag('② 返回目标 DataNode 列表', 771, 498, reply ? gold : subdued);
  p.tag('③ 直接写入数据块', 809, 761, write ? cyan : subdued);
  p.legend([['control', '元数据 / 控制'], ['data', '文件数据']]);
};

export const pipeline: Painter = (p, t) => {
  const xs = [120, 552, 982, 1413];
  const t0 = .5, segment = 1.6;
  const travel = (t - t0) / segment;
  for (let i = 0; i < 3; i++) {
    const fraction = travel - i;
    const path = [[xs[i] + 304, 547], [xs[i + 1], 547]] as const;
    p.route(path, 'data', null, fraction >= 0);
    p.transfer(path, 'data', t, t0 + i * segment, t0 + (i + 1) * segment, 29);
  }
  p.text('一条写入管线', 121, 426, 29, subdued);
  p.tag('replication = 3（本片示例）', 121, 327, gold);
  terminal(p, xs[0], 473, 304, 'Client', '发送块 B2');
  for (let i = 1; i < 4; i++) {
    const stored = travel >= i;
    node(p, xs[i], 473, 304, `DN-${'ABC'[i - 1]}`, stored ? '已写入副本' : travel >= i - 1 ? '接收中' : '等待接收',
      { active: travel >= i - 1, block: stored ? b2 : undefined });
    const at = t0 + segment * i;
    const land = p.progress(t, at, at + .37);
    p.alpha(land, () => p.cube(xs[i] + 152, 704 + (p.motion ? -64 * (1 - land) : 0), 49, cyan, b2));
    p.impact(xs[i] + 152, 742, t - at, cyan, 144);
  }
  p.legend([['data', 'B2 的数据']]);
};

export const acrossRacks: Painter = (p, t) => {
  const open = eased(t, 0, 1.3);
  const lost = t >= 3.5;
  const bridge = [[532, 634], [639, 634], [639, 711], [913, 711], [913, 634], [1010, 634]] as const;
  const local = [[1308, 548], [1433, 548]] as const;
  p.move(419, 590, 100 * (1 - open), 0, 1, () => {
    rack(p, 124, 348, 601, 431, 'Rack A / 机架 A');
    node(p, 219, 493, 313, 'DN-A', lost ? '模拟机架不可用' : 'B2 的副本', { block: lost ? undefined : b2, offline: lost });
    if (lost) p.tag('机架故障示例', 219, 690, color.off);
  });
  p.move(1330, 590, -100 * (1 - open), 0, 1, () => {
    rack(p, 866, 348, 929, 431, 'Rack B / 机架 B');
    p.route(local, 'data', null, t >= 2.6 && !lost);
    p.transfer(local, 'data', t, 2.7, 3.2);
    node(p, 1010, 493, 298, 'DN-B', lost ? '仍有 B2 副本' : 'B2 的副本', { block: b2 });
    node(p, 1433, 493, 297, 'DN-C', lost ? '仍有 B2 副本' : 'B2 的副本', { block: b2 });
  });
  p.route(bridge, 'data', null, t >= 1.3 && !lost);
  p.transfer(bridge, 'data', t, 1.3, 2.7, 34);
  p.impact(1031, 645, t - 2.7, cyan, 87);
  p.text('跨机架放置（示意）', 784, 752, 26, cyan, 'center');
  p.legend([['data', '写入同一块的副本']]);
};

export const readPath: Painter = (p, t) => {
  const locate = t < 4.1, request = t < 1.63;
  const selected = t >= 3.2;
  const metaOut: Point[] = [[449, 531], [555, 531], [555, 377], [723, 377]];
  const metaBack: Point[] = [[723, 428], [604, 428], [604, 572], [449, 572]];
  const read: Point[] = [[1316, 599], [993, 599], [892, 634], [449, 634]];
  p.route(metaOut, 'control', null, request);
  p.route(metaBack, 'control', null, locate && !request);
  p.route(read, 'data', null, !locate);
  p.transfer(metaOut, 'control', t, .3, 1.63);
  p.transfer(metaBack, 'control', t, 1.63, 3.1);
  p.transfer(read, 'data', t, 4.1, 6.4, 43);
  p.impact(466, 636, t - 6.4, cyan, 100);
  terminal(p, 118, 491, 331, 'Task', '读取数据块 B2');
  meta(p, 723, 302, 474, '查询 B2 的位置', '元数据返回副本列表');
  if (selected) p.rect(1309, 512, 506, 162, '#76dcfa24', '#76dcfabe', 12);
  p.impact(1562, 635, t - 3.2, cyan, 210);
  node(p, 1316, 519, 493, 'DataNode A', selected ? '已选：较近的可用副本' : '候选副本', { active: selected, block: b2 });
  p.panel(1316, 697, 493, 75, '#647e96', false);
  p.text('其他可用副本：DN-B / DN-C', 1338, 747, 27, subdued);
  p.tag('① 定位块', 170, 372, locate ? gold : subdued);
  p.tag('② 从 DataNode 返回 B2', 677, 681, !locate ? cyan : subdued);
  p.legend([['control', '位置查询'], ['data', '读取方向']]);
};

export const outage: Painter = (p, t) => {
  const lost = t >= 2, timedOut = t >= 3.8, retry = t >= 5.3;
  const y = 623;
  const nn: Point = [960, 451];
  const nodeX = [520, 951, 1381];
  const nWidth = 323;
  nodeX.forEach((x, i) => {
    const active = i !== 0 || !lost;
    const pts: Point[] = [[x + nWidth / 2, y], [x + nWidth / 2, 538], [nn[0], 538], nn];
    p.route(pts, 'control', active && p.motion ? phase(t + i * .55, 1.75) : null, active);
  });
  meta(p, 733, 301, 454, '接收心跳与块报告', timedOut ? '超时：DN-A 不可用' : '节点状态检测');
  terminal(p, 115, y, 316, 'Client', retry ? '改读存活副本' : '读取 B2');
  const original = [[520, y + 76], [431, y + 76]] as const;
  const alternate = [[951, y + 121], [928, y + 121], [928, 809], [454, 809], [425, 772]] as const;
  p.route(original, 'data', null, !lost);
  p.transfer(original, 'data', t, .14, 1.85, 22);
  if (retry) {
    p.route(alternate, 'data');
    p.transfer(alternate, 'data', t, 5.3, 7.5, 35);
    p.impact(424, 767, t - 7.5, cyan, 124);
  }
  if (lost) {
    p.glow(685, y + 53, 208, '#842c5660');
    p.line([[463, y + 63], [489, y + 89]], color.off, 4);
    p.line([[489, y + 63], [463, y + 89]], color.off, 4);
    p.impact(684, y + 87, t - 2, color.off, 173);
  }
  node(p, nodeX[0], y, nWidth, 'DN-A', timedOut ? '不可用' : lost ? '心跳中断' : '正常', { offline: lost, block: lost ? undefined : b2 });
  node(p, nodeX[1], y, nWidth, 'DN-B', retry ? '提供 B2 副本' : '存活副本', { block: b2, active: !lost || retry });
  node(p, nodeX[2], y, nWidth, 'DN-C', '存活副本', { block: b2 });
  p.tag('心跳 / 块报告', 1303, 388, gold);
  if (retry) p.text('读路径改为 DN-B', 598, 797, 24, cyan);
  p.legend([['control', '心跳与块报告'], ['data', '块读取']], 115, 867);
};

export const recover: Painter = (p, t) => {
  const copied = t >= 5.7;
  const q = p.progress(t, 2.5, 5.7);
  const control = [[952, 447], [952, 504], [700, 504], [700, 581]] as const;
  const data = [[861, 696], [913, 696], [913, 790], [1588, 790], [1588, 729]] as const;
  p.route(control, 'control');
  p.route(data, 'data', null, t >= 2.5);
  p.transfer(control, 'control', t, .2, 2.5);
  p.transfer(data, 'data', t, 2.5, 5.7, 43);
  p.impact(1588, 723, t - 5.7, cyan, 159);
  meta(p, 723, 299, 460, copied ? '恢复目标副本数' : '检测到副本数低于目标', copied ? '重新复制完成' : '指派重新复制任务');
  p.tag(copied ? 'B2：3 / 3 可用副本' : 'B2：2 / 3 可用副本', 1304, 327, copied ? cyan : gold);
  p.rect(1310, 400, 436, 11, '#1b324a');
  p.rect(1310, 400, 436 * (2 + q) / 3, 11, copied ? cyan : gold);
  node(p, 112, 581, 320, 'DN-A', '仍不可用', { offline: true });
  node(p, 541, 581, 320, 'DN-B', '复制源节点', { block: b2 });
  node(p, 966, 581, 320, 'DN-C', '保留原有副本', { block: b2 });
  node(p, 1428, 581, 320, 'DN-D', copied ? '新副本就绪' : t < 2.5 ? '等待指派' : '接收副本', { active: copied, block: copied ? b2 : undefined });
  p.text('从存活 DataNode 复制 B2，不从 NameNode 读取文件。', 111, 854, 27, subdued);
};

export const highAvailability: Painter = (p, t) => {
  const lost = t >= 3.3, switched = t >= 5.1;
  const left = 123, right = 1418;
  p.tag('可选 HA 部署 / 这里示意共享编辑日志', 123, 305, gold);
  const write = [[507, 493], [736, 493]] as const;
  const sync = [[1176, 493], [1418, 493]] as const;
  const handover = [[1418, 564], [1176, 564]] as const;
  p.route(write, 'control', null, !lost);
  p.route(sync, 'control', null, !lost);
  p.transfer(write, 'control', t, .3, 1.57);
  p.transfer(sync, 'control', t, 1.6, 3.1);
  if (lost && !switched) p.tag('等待满足切换条件', 1257, 657, gold);
  if (switched) {
    p.route(handover, 'control');
    p.transfer(handover, 'control', t, 5.1, 6.5);
    p.impact(1514, 505, t - 5.1, gold, 182);
  }
  node(p, left, 436, 384, lost ? 'Unavailable' : 'Active', lost ? '原 Active 失联' : '处理元数据请求', { hue: gold, offline: lost });
  node(p, right, 436, 385, switched ? 'Active' : 'Standby', switched ? '接任元数据服务' : '同步编辑日志', { hue: gold, active: switched });
  p.text('NameNode A', left + 22, 631, 26, subdued, 'left', 650, true);
  p.text('NameNode B', right + 22, 631, 26, subdued, 'left', 650, true);
  p.panel(736, 410, 440, 222, gold, false);
  p.text('JournalNodes', 956, 460, 37, gold, 'center', 740, true);
  p.text('共享编辑日志（元数据）', 956, 606, 27, subdued, 'center');
  for (let i = 0; i < 3; i++) {
    const x = 821 + i * 116;
    p.panel(x, 489, 40, 70, gold, (t < 1.6 ? 0 : t < 3.3 ? 1 : 2) === i);
    p.line([[x + 9, 511], [x + 30, 511]], gold, 2);
    p.line([[x + 9, 526], [x + 26, 526]], '#b9ae83', 2);
  }
  p.panel(123, 725, 1680, 91, cyan, false);
  p.text('DataNodes', 149, 784, 32, cyan, 'left', 740, true);
  p.text('文件的数据块仍留在存储层。切换的是目录服务。', 437, 784, 30, color.ink);
  p.legend([['control', '元数据日志']], 115, 862);
};
