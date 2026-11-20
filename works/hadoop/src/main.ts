import { PlaybackClock } from './clock';
import { chapterReel } from './chapter-reel';
import { narrationFrameAt } from './narration';
import { chapters, duration, frameAt, timecode } from './timeline';
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
const seek = element('seek', HTMLInputElement);
const seekTrack = element('seek-track', HTMLElement);
const play = element('play', HTMLButtonElement);
const playLabel = element('play-label', HTMLElement);
const timeLabel = element('time', HTMLElement);
const durationLabel = element('duration', HTMLElement);
const fullscreen = element('expand', HTMLButtonElement);
const chapterList = element('chapters', HTMLOListElement);
const motion = matchMedia('(prefers-reduced-motion: reduce)');

function attach(ctx: CanvasRenderingContext2D) {
  const audio = element('narration', HTMLAudioElement);
  const mute = element('mute', HTMLButtonElement);
  const audioStatus = element('audio-status', HTMLParagraphElement);
  const fullVersion = new URLSearchParams(location.search).get('version') === 'full';
  if (fullVersion) {
    element('dubbed-edition', HTMLAnchorElement).removeAttribute('aria-current');
    element('full-edition', HTMLAnchorElement).setAttribute('aria-current', 'page');
    element('silent', HTMLElement).hidden = false;
  } else {
    const src = audio.getAttribute('data-src');
    if (src) audio.src = src;
    mute.hidden = false;
  }

  const film = new Film(ctx);
  const clock = new PlaybackClock();
  const totalLabel = timecode(duration);
  const timelineFrameAt = fullVersion ? frameAt : narrationFrameAt;
  let raf = 0;
  let lastFrame = -1;
  let lastCaption = '';
  let reachedEnd = false;
  const reel = chapterReel(chapterList, chapters, jump);

  // The edited track has the original storyboard's length and time coordinates.
  // Read the media clock so buffering/seeking cannot pull sound and picture apart.
  function current(now: number) {
    if (fullVersion) return clock.current(now);
    return audio.ended || reachedEnd ? duration : Math.min(duration, audio.currentTime);
  }

  function playing() {
    return fullVersion ? clock.playing : !audio.paused && !audio.ended && !audio.error;
  }

  function paint(seconds: number) {
    const { scene, frame, elapsed, caption } = timelineFrameAt(seconds);
    if (frame !== lastFrame) {
      film.draw(scene, elapsed, !motion.matches);
      lastFrame = frame;
    }
    if (caption !== lastCaption) {
      captionNode.textContent = transcript.textContent = caption;
      lastCaption = caption;
    }
    if (player.dataset.scene !== scene.id) player.dataset.scene = scene.id;
    reel.show(scene.chapter);
    const position = timecode(seconds);
    if (timeLabel.textContent !== position) {
      timeLabel.textContent = position;
      seek.setAttribute('aria-valuetext', `${position} / ${totalLabel}`);
    }
    seek.value = String(seconds);
    seekTrack.style.setProperty('--ratio', String(seconds / duration));
    const mode = playing() ? 'pause' : seconds === duration ? 'replay' : 'play';
    if (play.dataset.mode !== mode) {
      play.dataset.mode = mode;
      playLabel.textContent = mode === 'pause' ? '暂停' : mode === 'replay' ? '重播' : '播放';
    }
  }

  function tick(now: number) {
    raf = 0;
    const seconds = current(now);
    if (fullVersion && seconds === duration) clock.pause(now);
    paint(seconds);
    if (playing()) raf = requestAnimationFrame(tick);
  }

  function render(now = performance.now()) {
    cancelAnimationFrame(raf);
    tick(now);
  }

  function jump(seconds: number) {
    const now = performance.now();
    if (fullVersion) clock.seek(seconds, now);
    else {
      const target = Math.max(0, Math.min(duration, seconds));
      reachedEnd = target === duration;
      if (reachedEnd) audio.pause();
      audio.currentTime = reachedEnd && Number.isFinite(audio.duration) ? audio.duration : target;
    }
    render(now);
  }

  function audioFailed() {
    audioStatus.textContent = '配音无法播放，请刷新重试，或切换到无声版。';
    audioStatus.hidden = false;
    render();
  }

  function toggle() {
    const now = performance.now();
    if (fullVersion) {
      if (clock.playing) clock.pause(now);
      else clock.play(now);
    } else if (playing()) audio.pause();
    else {
      if (current(now) === duration) jump(0);
      audioStatus.hidden = true;
      void audio.play().catch((error: unknown) => {
        if (!(error instanceof DOMException) || error.name !== 'AbortError') audioFailed();
      });
    }
    render(now);
  }

  if (!fullVersion) {
    for (const event of ['play', 'pause', 'seeked', 'ended']) audio.addEventListener(event, () => render());
    audio.addEventListener('error', audioFailed);
    mute.addEventListener('click', () => {
      audio.muted = !audio.muted;
      mute.setAttribute('aria-pressed', String(audio.muted));
    });
  }
  play.addEventListener('click', toggle);
  seek.addEventListener('input', () => jump(seek.valueAsNumber));
  player.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target !== player) return;
    if (event.key === ' ' && !event.repeat) toggle();
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      jump(current(performance.now()) + (event.key === 'ArrowLeft' ? -5 : 5));
    } else return;
    event.preventDefault();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && playing()) toggle();
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
  seek.setAttribute('aria-valuetext', `00:00 / ${totalLabel}`);
  durationLabel.textContent = totalLabel;
  render();
}

const ctx = canvas.getContext('2d', { alpha: false });
if (ctx) attach(ctx);
else captionNode.textContent = transcript.textContent = '当前浏览器无法绘制动画。请在支持 Canvas 的浏览器中打开。';
