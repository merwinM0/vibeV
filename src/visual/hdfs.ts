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
  const q = eased(t, 1.2, 4.8);
  const c = p.ctx;
  c.save();
  if (motion) c.translate(0, 16 * (1 - eased(t, 0, 8)));
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
    p.panel(x - 13, 583, 425, 231, '#5990ad', false);
    node(p, x, 596, 397, `DataNode ${'ABC'[i]}`, '保存文件数据块', { active: t >= 3.7 + .6 * i });
    for (let j = 0; j < 3; j++) {
      p.alpha(.3 + .7 * eased(t, 4 + i * .5 + j * .28, 5.3 + i * .5 + j * .28), () => p.cube(x + 77 + j * 112, 777, 21));
    }
  }
  p.legend([['control', '管理与状态交互']], 115, 862);
  c.restore();
};

export const split: Painter = (p, t) => {
  const q = eased(t, 1.5, 4.1);
  p.glow(532, 575, 382, '#235a794b');
  p.text('订单文件', 126, 356, 34, cyan);
  p.tag('按配置切块', 126, 741, subdued);
  p.alpha(1 - q * .94, () => p.cube(381, 537, 173, cyan));
  const hues = ['#9ee5fc', '#76dcfa', '#76bfff'];
  for (let i = 0; i < 3; i++) {
    const arrive = eased(t, 5.1 + i * .55, 8.5 + i * .55);
    const y = 340 + i * 176;
    const id = `B${i + 1}`;
    const path: Point[] = [[719, 487 + i * 70], [847, 487 + i * 70], [1088, y + 75], [1377, y + 75]];
    p.route(path, 'data', arrive > 0 && arrive < 1 ? arrive : null, t > 5 + i * .55);
    p.alpha(.35 + q * .65, () => p.cube(mix(338 + i * 42, 594, q), mix(516, 480 + i * 70, q), mix(38, 28, q), hues[i]));
    if (q > .45) p.text(id, 650, 496 + i * 70, 26, hues[i], 'left', 740, true);
    node(p, 1377, y, 435, `DataNode ${'BAC'[i]}`, '块的一个存储位置', { block: arrive === 1 ? id : undefined, active: arrive > .1 });
  }
  p.text('B1 / B2 / B3：只示意块的划分，不代表固定块数。', 128, 850, 27, subdued);
};

export const writePath: Painter = (p, t) => {
  const requested = t < 5;
  const reply = t >= 5 && t < 10;
  const write = t >= 10;
  const request: Point[] = [[467, 547], [596, 547], [596, 388], [744, 388]];
  const response: Point[] = [[744, 438], [644, 438], [644, 590], [467, 590]];
  const content: Point[] = [[467, 633], [581, 633], [581, 698], [1388, 698]];
  p.route(request, 'control', requested ? phase(t + .1, 2.8) : null, requested);
  p.route(response, 'control', reply ? phase(t - 5, 2.8) : null, reply);
  p.route(content, 'data', write ? phase(t - 10, 3.3) : null, write);
  terminal(p, 125, 519, 342, 'Client', '写入订单文件');
  meta(p, 744, 318, 474, '文件创建与块分配', '只交换元数据');
  node(p, 1388, 623, 415, 'DataNode A', '接收文件数据', { active: write, block: t > 12.8 ? b2 : undefined });
  p.tag('① 申请创建文件', 158, 390, requested ? gold : subdued);
  p.tag('② 返回目标 DataNode 列表', 771, 498, reply ? gold : subdued);
  p.tag('③ 直接写入数据块', 809, 720, write ? cyan : subdued);
  p.legend([['control', '元数据 / 控制'], ['data', '文件数据']]);
};

export const pipeline: Painter = (p, t) => {
  const xs = [120, 552, 982, 1413];
  const t0 = 1.3, segment = 2.3;
  const travel = (t - t0) / segment;
  for (let i = 0; i < 3; i++) {
    const fraction = travel - i;
    const active = fraction >= 0;
    p.route([[xs[i] + 304, 547], [xs[i + 1], 547]], 'data', active ?
      (fraction < 1 ? fraction : phase(t - t0 - i * segment, 3.8)) : null, active);
  }
  p.text('一条写入管线', 121, 426, 29, subdued);
  p.tag('replication = 3（本片示例）', 121, 327, gold);
  terminal(p, xs[0], 473, 304, 'Client', '发送块 B2');
  for (let i = 1; i < 4; i++) {
    const stored = travel >= i;
    node(p, xs[i], 473, 304, `DN-${'ABC'[i - 1]}`, stored ? '已写入副本' : travel >= i - 1 ? '接收中' : '等待接收',
      { active: travel >= i - 1, block: stored ? b2 : undefined });
    p.alpha(.25 + .75 * eased(t, t0 + segment * i, t0 + segment * i + .75), () => p.cube(xs[i] + 152, 711, 43, cyan, b2));
  }
  p.legend([['data', 'B2 的数据']]);
};

export const acrossRacks: Painter = (p, t, motion) => {
  const pull = motion ? 17 * (1 - eased(t, 0, 5.1)) : 0;
  const c = p.ctx;
  c.save();
  c.translate(0, pull);
  rack(p, 124, 348, 601, 431, 'Rack A / 机架 A');
  rack(p, 866, 348, 929, 431, 'Rack B / 机架 B');
  p.route([[532, 634], [639, 634], [639, 711], [913, 711], [913, 634], [1010, 634]], 'data',
    t > 1.3 && t < 8 ? phase(t - 1.3, 3) : null, true, true);
  p.route([[1308, 548], [1433, 548]], 'data', t > 4.4 && t < 8 ? phase(t - 4.4, 2.8) : null);
  node(p, 219, 493, 313, 'DN-A', 'B2 的副本', { block: b2 });
  node(p, 1010, 493, 298, 'DN-B', 'B2 的副本', { block: b2 });
  node(p, 1433, 493, 297, 'DN-C', 'B2 的副本', { block: b2 });
  p.text('跨机架放置（示意）', 784, 752, 26, cyan, 'center');
  p.legend([['data', '写入同一块的副本']]);
  c.restore();
};

export const readPath: Painter = (p, t) => {
  const locate = t < 7, request = t < 3.5;
  const metaOut: Point[] = [[449, 531], [555, 531], [555, 377], [723, 377]];
  const metaBack: Point[] = [[723, 428], [604, 428], [604, 572], [449, 572]];
  const read: Point[] = [[1316, 599], [993, 599], [892, 634], [449, 634]];
  p.route(metaOut, 'control', request ? phase(t, 2.7) : null, request);
  p.route(metaBack, 'control', locate && !request ? phase(t - 3.5, 2.7) : null, locate && !request);
  p.route(read, 'data', !locate ? phase(t - 7, 3.8) : null, !locate);
  terminal(p, 118, 491, 331, 'Task', '读取数据块 B2');
  meta(p, 723, 302, 474, '查询 B2 的位置', '元数据返回副本列表');
  node(p, 1316, 519, 493, 'DataNode A', '较近的可用副本', { active: !locate, block: b2 });
  p.panel(1316, 697, 493, 75, '#647e96', false);
  p.text('其他可用副本：DN-B / DN-C', 1338, 747, 27, subdued);
  p.tag('① 定位块', 170, 372, locate ? gold : subdued);
  p.tag('② 从 DataNode 返回 B2', 677, 681, !locate ? cyan : subdued);
  p.legend([['control', '位置查询'], ['data', '读取方向']]);
};

export const outage: Painter = (p, t) => {
  const lost = t >= 5, timedOut = t >= 8.4, retry = t >= 10;
  const y = 623;
  const nn: Point = [960, 451];
  const nodeX = [520, 951, 1381];
  const nWidth = 323;
  nodeX.forEach((x, i) => {
    const active = i !== 0 || !lost;
    const pts: Point[] = [[x + nWidth / 2, y], [x + nWidth / 2, 538], [nn[0], 538], nn];
    p.route(pts, 'control', active ? phase(t + i * .7, 2.6) : null, active);
  });
  meta(p, 733, 301, 454, '接收心跳与块报告', timedOut ? '超时：DN-A 不可用' : '节点状态检测');
  terminal(p, 115, y, 316, 'Client', retry ? '改读存活副本' : '读取 B2');
  p.route([[520, y + 76], [431, y + 76]], 'data', !lost ? phase(t, 2.1) : null, !lost);
  if (retry) p.route([[951, y + 121], [928, y + 121], [928, 809], [432, 809], [424, 772]], 'data', phase(t - 10, 3.1), true);
  node(p, nodeX[0], y, nWidth, 'DN-A', timedOut ? '不可用' : lost ? '心跳中断' : '正常', { offline: lost, block: lost ? undefined : b2 });
  node(p, nodeX[1], y, nWidth, 'DN-B', retry ? '提供 B2 副本' : '存活副本', { block: b2, active: !lost || retry });
  node(p, nodeX[2], y, nWidth, 'DN-C', '存活副本', { block: b2 });
  p.tag('心跳 / 块报告', 1303, 388, gold);
  if (retry) p.text('读路径改为 DN-B', 598, 797, 24, cyan);
  p.legend([['control', '心跳与块报告'], ['data', '块读取']], 115, 867);
};

export const recover: Painter = (p, t) => {
  const copied = t >= 7;
  const q = eased(t, 3, 7);
  const data: Point[] = [[861, 696], [913, 696], [913, 790], [1588, 790], [1588, 729]];
  p.route([[952, 447], [952, 504], [700, 504], [700, 581]], 'control', t < 3 ? phase(t, 2.8) : null);
  p.route(data, 'data', q > 0 && q < 1 ? q : null, t >= 3);
  meta(p, 723, 299, 460, copied ? '恢复目标副本数' : '检测到副本数低于目标', copied ? '重新复制完成' : '指派重新复制任务');
  p.tag(copied ? 'B2：3 / 3 可用副本' : 'B2：2 / 3 可用副本', 1304, 327, copied ? cyan : gold);
  p.rect(1310, 400, 436, 11, '#1b324a');
  p.rect(1310, 400, 436 * (2 + q) / 3, 11, copied ? cyan : gold);
  node(p, 112, 581, 320, 'DN-A', '仍不可用', { offline: true });
  node(p, 541, 581, 320, 'DN-B', '复制源节点', { block: b2 });
  node(p, 966, 581, 320, 'DN-C', '保留原有副本', { block: b2 });
  node(p, 1428, 581, 320, 'DN-D', copied ? '新副本就绪' : t < 3 ? '等待指派' : '接收副本', { active: copied, block: copied ? b2 : undefined });
  p.text('从存活 DataNode 复制 B2，不从 NameNode 读取文件。', 111, 854, 27, subdued);
};

export const highAvailability: Painter = (p, t) => {
  const lost = t >= 7, switched = t >= 9.4;
  const left = 123, right = 1418;
  p.tag('可选 HA 部署 / 这里示意共享编辑日志', 123, 305, gold);
  p.route([[507, 493], [736, 493]], 'control', !lost ? phase(t, 3.3) : null, !lost);
  p.route([[1176, 493], [1418, 493]], 'control', !lost ? phase(t - .8, 3.3) : null, !lost);
  if (switched) p.route([[1418, 564], [1176, 564]], 'control', phase(t - 9.4, 2.8), true);
  node(p, left, 436, 384, lost ? 'Unavailable' : 'Active', lost ? '原 Active 失联' : '处理元数据请求', { hue: gold, offline: lost });
  node(p, right, 436, 385, switched ? 'Active' : 'Standby', switched ? '接任元数据服务' : '同步编辑日志', { hue: gold, active: switched });
  p.text('NameNode A', left + 22, 631, 26, subdued, 'left', 650, true);
  p.text('NameNode B', right + 22, 631, 26, subdued, 'left', 650, true);
  p.panel(736, 410, 440, 222, gold, false);
  p.text('JournalNodes', 956, 460, 37, gold, 'center', 740, true);
  p.text('共享编辑日志（元数据）', 956, 606, 27, subdued, 'center');
  for (let i = 0; i < 3; i++) {
    const x = 821 + i * 116;
    p.panel(x, 489, 40, 70, gold, Math.floor(t * 2) % 3 === i);
    p.line([[x + 9, 511], [x + 30, 511]], gold, 2);
    p.line([[x + 9, 526], [x + 26, 526]], '#b9ae83', 2);
  }
  p.panel(123, 725, 1680, 91, cyan, false);
  p.text('DataNodes', 149, 784, 32, cyan, 'left', 740, true);
  p.text('文件的数据块仍留在存储层。切换的是目录服务。', 437, 784, 30, color.ink);
  p.legend([['control', '元数据日志']], 115, 862);
};
