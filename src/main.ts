import { PlaybackClock } from './clock';
import { chapters, duration, frameAt, timecode, type ChapterId } from './timeline';
import { Film } from './visual/film';

function element<T extends HTMLElement>(id: string, kind: { new(): T }): T {
  const node = document.getElementById(id);
  if (!(node instanceof kind)) throw new Error(`Missing UI element: ${id}`);
  return node;
}

const player = element('player', HTMLElement);
const canvas = element('stage', HTMLCanvasElement);
const captionNode = element('caption', HTMLParagraphElement);
const transcript = element('transcript', HTMLParagraphElement);
const sceneIndex = element('scene-index', HTMLElement);
const sceneTitle = element('scene-title', HTMLElement);
const seek = element('seek', HTMLInputElement);
const play = element('play', HTMLButtonElement);
const playLabel = element('play-label', HTMLElement);
const timeLabel = element('time', HTMLElement);
const durationLabel = element('duration', HTMLElement);
const fullscreen = element('expand', HTMLButtonElement);
const chapterList = element('chapters', HTMLOListElement);
const motion = matchMedia('(prefers-reduced-motion: reduce)');

function attach(ctx: CanvasRenderingContext2D) {
  const film = new Film(ctx);
  const clock = new PlaybackClock();
  let raf = 0;
  let lastFrame = -1;
  let lastTitle = '';
  let lastCaption = '';
  let lastChapter: ChapterId | undefined;
  const chapterButtons = new Map<ChapterId, HTMLButtonElement>();

  const span = (className: string, text: string) => {
    const node = document.createElement('span');
    node.className = className;
    node.textContent = text;
    return node;
  };

  for (const chapter of chapters) {
    const row = document.createElement('li');
    const button = document.createElement('button');
    const title = span('chapter-content', '');
    title.append(span('chapter-title', chapter.title), span('chapter-note', chapter.note));
    button.className = 'chapter';
    button.type = 'button';
    button.dataset.chapter = chapter.id;
    button.append(span('chapter-number', chapter.id), title, span('chapter-time', timecode(chapter.start)));
    button.addEventListener('click', () => jump(chapter.start));
    row.append(button);
    chapterList.append(row);
    chapterButtons.set(chapter.id, button);
  }

  function paint(seconds: number) {
    const { scene, frame, elapsed, caption } = frameAt(seconds);
    if (frame !== lastFrame) {
      film.draw(scene, elapsed, !motion.matches);
      lastFrame = frame;
    }
    if (caption !== lastCaption) {
      captionNode.textContent = transcript.textContent = caption;
      lastCaption = caption;
    }
    if (scene.id !== lastTitle) {
      sceneTitle.textContent = scene.title.replace('\n', '');
      sceneIndex.textContent = `当前镜头 / ${scene.id}`;
      player.dataset.scene = lastTitle = scene.id;
    }
    if (scene.chapter !== lastChapter) {
      chapterButtons.get(scene.chapter)?.setAttribute('aria-current', 'true');
      if (lastChapter) chapterButtons.get(lastChapter)?.removeAttribute('aria-current');
      lastChapter = scene.chapter;
    }
    const position = timecode(seconds);
    if (timeLabel.textContent !== position) {
      timeLabel.textContent = position;
      seek.setAttribute('aria-valuetext', `${position} / ${timecode(duration)}`);
    }
    seek.value = String(seconds);
    seek.style.setProperty('--played', `${seconds * 100 / duration}%`);
    const mode = clock.playing ? 'pause' : seconds === duration ? 'replay' : 'play';
    if (play.dataset.mode !== mode) {
      play.dataset.mode = mode;
      playLabel.textContent = mode === 'pause' ? '暂停' : mode === 'replay' ? '重播' : '播放';
    }
  }

  function tick(now: number) {
    raf = 0;
    const seconds = clock.current(now);
    if (seconds === duration) clock.pause(now);
    paint(seconds);
    if (clock.playing) raf = requestAnimationFrame(tick);
  }

  function render(now = performance.now()) {
    cancelAnimationFrame(raf);
    tick(now);
  }

  function jump(seconds: number) {
    const now = performance.now();
    clock.seek(seconds, now);
    render(now);
  }

  function toggle() {
    const now = performance.now();
    if (clock.playing) clock.pause(now);
    else clock.play(now);
    render(now);
  }

  play.addEventListener('click', toggle);
  seek.addEventListener('input', () => jump(seek.valueAsNumber));
  player.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target !== player) return;
    if (event.key === ' ' && !event.repeat) toggle();
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      jump(clock.current(performance.now()) + (event.key === 'ArrowLeft' ? -5 : 5));
    } else return;
    event.preventDefault();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden || !clock.playing) return;
    const now = performance.now();
    clock.pause(now);
    render(now);
  });
  fullscreen.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === player) await document.exitFullscreen();
      else await player.requestFullscreen();
    } catch {
      // Fullscreen can be denied by an embedding page or browser policy.
      fullscreen.title = '当前环境无法进入全屏';
    }
  });
  document.addEventListener('fullscreenchange', () => {
    const label = document.fullscreenElement === player ? '退出全屏' : '全屏';
    fullscreen.setAttribute('aria-label', label);
    fullscreen.title = label;
  });

  const refreshFrame = () => { lastFrame = -1; render(); };
  motion.addEventListener('change', refreshFrame);
  void document.fonts.ready.then(refreshFrame);
  seek.disabled = play.disabled = false;
  fullscreen.disabled = !document.fullscreenEnabled;
  seek.max = String(duration);
  seek.setAttribute('aria-valuetext', `00:00 / ${timecode(duration)}`);
  durationLabel.textContent = timecode(duration);
  render();
}

const ctx = canvas.getContext('2d', { alpha: false });
if (ctx) attach(ctx);
else captionNode.textContent = transcript.textContent = '当前浏览器无法绘制动画。请在支持 Canvas 的浏览器中打开样片。';
