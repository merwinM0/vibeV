import { makeDiagram } from './diagram';
import { makeHost } from './host';
import { lensAt, stageHeight, stageWidth } from './stage';
import { beats, chapters, fps, frameAt, frameCount, timecode } from './timeline';

function byId(id: string) { return document.getElementById(id)!; }
function control<T extends HTMLElement>(id: string, kind: { new(): T }) {
  const node = byId(id);
  if (!(node instanceof kind)) throw new Error(`Missing control: ${id}`);
  return node;
}

const player = byId('player');
const stage = player.querySelector<HTMLElement>('.stage')!;
const world = byId('world');
const seek = control('seek', HTMLInputElement);
const play = control('play', HTMLButtonElement);
const prev = control('prev', HTMLButtonElement);
const next = control('next', HTMLButtonElement);
const expand = control('expand', HTMLButtonElement);
const clock = byId('clock');
const playLabel = byId('play-label');
const icon = play.querySelector('path')!;
const sceneNumber = byId('scene-number');
const reading = byId('reading-text');
const filmTitle = byId('film-title');
const filmDeck = byId('film-deck');
const filmCaption = byId('film-caption');
const filmNumber = byId('film-number');
const filmChapter = byId('film-chapter');
const copyCount = byId('copy-count');
const readingCount = byId('reading-count');
const status = byId('status');
const diagram = makeDiagram(document.querySelector<SVGSVGElement>('#diagram')!);
let renderHost: Awaited<ReturnType<typeof makeHost>> | undefined;
const motion = matchMedia('(prefers-reduced-motion: reduce)');

let pos = 0;
let running = false;
let origin = 0;
let raf = 0;
let lastFrame = -1;
let lastChapter = -1;
let lastBeat = -1;
const end = timecode(frameCount);

const buttons = chapters.map(chapter => {
  const li = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'chapter';
  button.innerHTML = `<span class="chapter-index mono">${chapter.cue}</span><span><strong>${chapter.title}</strong><small>${chapter.description}</small></span><time class="mono">${timecode(chapter.start * fps)}</time>`;
  li.append(button);
  byId('chapter-list').append(li);
  button.addEventListener('click', () => jump(chapter.start * fps));
  return button;
});

function paint(force = false) {
  const state = frameAt(pos);
  if (state.frame === lastFrame && !force) return;
  lastFrame = state.frame;
  if (state.index !== lastBeat) {
    lastBeat = state.index;
    filmTitle.textContent = state.beat.title;
    filmDeck.textContent = state.beat.deck;
    filmCaption.textContent = reading.textContent = state.beat.caption;
    const { route } = state.beat;
    stage.dataset.cue = route === 'heartbeat' || route === 'readB' ? 'fault'
      : ['write', 'readA', 'repair', 'none'].includes(route) ? 'bytes' : 'control';
    sceneNumber.textContent = `镜头 ${String(state.index + 1).padStart(2, '0')} / ${beats.length}`;
    prev.disabled = state.index === 0;
    next.disabled = state.index === beats.length - 1;
  }
  if (state.chapter !== lastChapter) {
    lastChapter = state.chapter;
    buttons.forEach((button, i) => {
      if (i === state.chapter) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    filmNumber.textContent = chapters[state.chapter].cue;
    filmChapter.textContent = chapters[state.chapter].title;
  }
  const reduced = motion.matches;
  const lens = lensAt(state, reduced);
  world.style.setProperty('--focus-point', `${lens.x / stageWidth * 100}% ${lens.y / stageHeight * 100}%`);
  world.style.setProperty('--zoom', lens.zoom.toFixed(4));
  world.style.setProperty('--shift-x', `${(lens.shiftX / stageWidth * 100).toFixed(3)}%`);
  diagram(state, reduced);
  renderHost?.(state, reduced);
  const count = `${state.copies} / 3`;
  if (copyCount.textContent !== count) {
    copyCount.textContent = count;
    readingCount.textContent = `B2 可用副本 ${count}`;
  }
  seek.value = String(state.frame);
  const code = timecode(state.frame);
  if (clock.textContent !== `${code} / ${end}`) {
    clock.textContent = `${code} / ${end}`;
    seek.setAttribute('aria-valuetext', code);
  }
}

function updatePlay() {
  playLabel.textContent = running ? '暂停' : pos >= frameCount ? '重播' : '播放';
  icon.setAttribute('d', running ? 'M5 4h3v12H5zm7 0h3v12h-3z' : 'M6 3.5v13l11-6.5z');
}
function jump(frame: number) {
  pos = Math.min(frameCount, Math.max(0, frame));
  if (pos >= frameCount) running = false;
  origin = performance.now() - pos * 1000 / fps;
  if (!running) cancelAnimationFrame(raf);
  updatePlay();
  paint();
}
function tick(now: number) {
  if (!running) return;
  pos = Math.min(frameCount, Math.max(0, (now - origin) * fps / 1000));
  paint();
  if (pos >= frameCount) { running = false; updatePlay(); }
  else raf = requestAnimationFrame(tick);
}
function pause() {
  running = false;
  cancelAnimationFrame(raf);
  updatePlay();
}
function toggle() {
  if (running) { pause(); return; }
  if (pos >= frameCount) jump(0);
  origin = performance.now() - pos * 1000 / fps;
  running = true;
  updatePlay();
  raf = requestAnimationFrame(tick);
}
function jumpBeat(offset: number) {
  const beat = beats[frameAt(pos).index + offset];
  if (beat) jump(beat.start * fps);
}

seek.max = String(frameCount);
seek.setAttribute('aria-valuetext', timecode(0));
seek.disabled = play.disabled = false;
expand.disabled = !document.fullscreenEnabled;
play.addEventListener('click', toggle);
seek.addEventListener('input', () => jump(seek.valueAsNumber));
prev.addEventListener('click', () => jumpBeat(-1));
next.addEventListener('click', () => jumpBeat(1));
player.addEventListener('keydown', event => {
  if (event.target !== player || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key === ' ') { if (!event.repeat) toggle(); }
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    jump(frameAt(pos).frame + (event.key === 'ArrowLeft' ? -5 : 5) * fps);
  } else return;
  event.preventDefault();
});
expand.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement === player) await document.exitFullscreen();
    else await player.requestFullscreen();
  } catch { status.textContent = '当前环境不支持全屏，仍可在页面中播放。'; }
});
document.addEventListener('fullscreenchange', () => {
  const label = document.fullscreenElement === player ? '退出全屏' : '全屏';
  expand.title = label;
  expand.setAttribute('aria-label', label);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
motion.addEventListener('change', () => paint(true));
paint(true);
void makeHost(control('host-canvas', HTMLCanvasElement), control('host-skin', HTMLImageElement)).then(render => {
  renderHost = render;
  paint(true);
}).catch(() => { status.textContent = '角色皮肤加载失败，仍可观看 HDFS 图解。'; });
