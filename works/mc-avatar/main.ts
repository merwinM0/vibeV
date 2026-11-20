import { drawAvatar } from '../../avatar/draw';
import { actions } from '../../avatar/motion';
import { prepareSkin } from '../../avatar/skin';
import type { Skin } from '../../avatar/skin';
import { drawFilm, duration, frameCount, fps, sampleFilm } from './film';

function element<T extends HTMLElement>(id: string, kind: { new(): T }): T {
  const node = document.getElementById(id);
  if (!(node instanceof kind)) throw new Error(`Missing UI element: ${id}`);
  return node;
}

function filmPlayer(skin: Skin) {
  const clip = element('clip', HTMLElement);
  const canvas = element('film', HTMLCanvasElement);
  const audio = element('narration', HTMLAudioElement);
  const status = element('clip-status', HTMLElement);
  const caption = element('film-caption', HTMLElement);
  const play = element('play', HTMLButtonElement);
  const seek = element('seek', HTMLInputElement);
  const expand = element('expand', HTMLButtonElement);
  const clock = element('clock', HTMLElement);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('当前浏览器无法绘制动画。');
  const ctx = context;
  let reachedEnd = false;
  let raf = 0;
  let last = -1;
  const playing = () => !audio.paused && !audio.ended && !audio.error;
  // Audio is the only clock: buffering and seeking cannot pull the visuals ahead.
  const current = () => reachedEnd || audio.ended ? frameCount : Math.min(frameCount, audio.currentTime * fps);
  function paint(value: number) {
    // Media time can round below an exact frame boundary on a seek.
    const pos = Math.min(frameCount, Math.floor(value + .001));
    if (last === pos) return;
    last = pos;
    const frame = sampleFilm(pos);
    if (caption.textContent !== frame.caption) caption.textContent = frame.caption;
    drawFilm(ctx, skin, pos);
    seek.value = String(pos);
    const code = `00:${String(Math.floor(pos / fps)).padStart(2, '0')}`;
    if (!clock.textContent?.startsWith(code)) {
      clock.textContent = `${code} / 00:30`;
      seek.setAttribute('aria-valuetext', code);
    }
  }
  function tick() {
    raf = 0;
    const position = current();
    if (position >= frameCount && playing()) audio.pause();
    const label = playing() ? '暂停' : position >= frameCount ? '重播' : '播放';
    if (play.textContent !== label) play.textContent = label;
    paint(position);
    if (playing()) raf = requestAnimationFrame(tick);
  }
  function render() {
    cancelAnimationFrame(raf);
    tick();
  }
  function audioFailed() {
    status.textContent = '配音无法播放，请刷新页面后重试。';
    render();
  }
  function toggle() {
    if (playing()) audio.pause();
    else {
      if (current() >= frameCount) jump(0);
      status.textContent = '';
      void audio.play().catch((error: unknown) => {
        if (!(error instanceof DOMException) || error.name !== 'AbortError') audioFailed();
      });
    }
    render();
  }
  function jump(position: number) {
    const frame = Math.max(0, Math.min(frameCount, position));
    reachedEnd = frame === frameCount;
    if (reachedEnd) audio.pause();
    const end = Number.isFinite(audio.duration) ? Math.min(audio.duration, duration) : duration;
    audio.currentTime = Math.min(end, frame / fps);
    render();
  }
  seek.setAttribute('aria-valuetext', '00:00');
  render();
  for (const event of ['play', 'pause', 'seeked', 'ended']) audio.addEventListener(event, render);
  audio.addEventListener('error', audioFailed);
  audio.src = audio.dataset.src ?? '';
  play.disabled = seek.disabled = false;
  expand.disabled = !document.fullscreenEnabled;
  play.addEventListener('click', toggle);
  seek.addEventListener('input', () => jump(seek.valueAsNumber));
  clip.addEventListener('keydown', (event) => {
    if (event.target !== clip || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === ' ' && !event.repeat) toggle();
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') jump(current() + (event.key === 'ArrowLeft' ? -1 : 1) * fps * 5);
    else return;
    event.preventDefault();
  });
  expand.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === clip) await document.exitFullscreen();
      else await clip.requestFullscreen();
    } catch { expand.title = '当前环境无法进入全屏'; }
  });
  document.addEventListener('fullscreenchange', () => { expand.textContent = document.fullscreenElement === clip ? '退出全屏' : '全屏'; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing()) audio.pause(); });
}

function motionLab(defaultSkin: Skin) {
  const lab = element('lab', HTMLElement);
  const canvas = element('rig', HTMLCanvasElement);
  const file = element('local-skin', HTMLInputElement);
  const model = element('model', HTMLSelectElement);
  const action = element('action', HTMLSelectElement);
  const angle = element('angle', HTMLInputElement);
  const pose = element('pose', HTMLInputElement);
  const poseTime = element('pose-time', HTMLElement);
  const button = element('play-pose', HTMLButtonElement);
  const status = element('skin-status', HTMLElement);
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return;
  const ctx = context;
  let skin = defaultSkin;
  let rerender = 0;
  let running = false;
  let origin = 0;
  let revision = 0;

  const readModel = () => model.value === 'slim' || model.value === 'classic' ? model.value : skin.model;
  const report = (prefix: string) => { status.textContent = `${prefix} · ${readModel() === 'slim' ? '细手臂' : '标准手臂'}`; };
  function paint(time: number) {
    ctx.fillStyle = '#ebf5f7';
    ctx.fillRect(0, 0, 800, 600);
    ctx.strokeStyle = '#c4dadd';
    ctx.beginPath(); ctx.moveTo(90, 516); ctx.lineTo(710, 516); ctx.stroke();
    ctx.fillStyle = '#dcebed';
    ctx.beginPath(); ctx.ellipse(400, 516, 167, 15, 0, 0, 2 * Math.PI); ctx.fill();
    const name = actions.find(value => action.value === value) ?? 'idle';
    drawAvatar(ctx, { ...skin, model: readModel() }, { x: 400, y: 514, scale: 12.8, yaw: angle.valueAsNumber * Math.PI / 180, action: name, time });
    poseTime.textContent = `${time.toFixed(2)} 秒`;
  }
  function stop() {
    running = false;
    cancelAnimationFrame(rerender);
    button.textContent = '播放动作';
  }
  function update(now: number) {
    const time = (Math.max(0, now - origin) / 1000) % 4;
    pose.value = time.toFixed(2);
    paint(time);
    if (running) rerender = requestAnimationFrame(update);
  }
  button.addEventListener('click', () => {
    if (running) { stop(); return; }
    origin = performance.now() - pose.valueAsNumber * 1000;
    running = true;
    button.textContent = '暂停动作';
    rerender = requestAnimationFrame(update);
  });
  action.addEventListener('change', () => { stop(); pose.value = '0'; paint(0); });
  angle.addEventListener('input', () => paint(pose.valueAsNumber));
  pose.addEventListener('input', () => { stop(); paint(pose.valueAsNumber); });
  model.addEventListener('change', () => { paint(pose.valueAsNumber); report('当前贴图'); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  file.addEventListener('change', async () => {
    const selected = file.files?.[0];
    const ticket = ++revision;
    if (!selected) return;
    if (selected.type !== 'image/png' || selected.size > 1024 * 1024) {
      status.textContent = '请选择 1 MB 以内的 64×64 PNG 皮肤。';
      return;
    }
    const url = URL.createObjectURL(selected);
    try {
      const image = new Image();
      image.src = url;
      const next = await prepareSkin(image);
      if (ticket !== revision) return;
      skin = next;
      file.value = '';
      paint(pose.valueAsNumber);
      report('已加载本地皮肤');
    } catch (error) {
      if (ticket === revision) status.textContent = error instanceof RangeError ? error.message : '无法读取 PNG 皮肤。';
    } finally { URL.revokeObjectURL(url); }
  });
  report('已加载样片皮肤');
  lab.hidden = false;
  paint(0);
}

const status = element('clip-status', HTMLElement);
void Promise.all([prepareSkin(element('sample-skin', HTMLImageElement)), document.fonts.ready]).then(([skin]) => {
  status.textContent = '';
  filmPlayer(skin);
  motionLab(skin);
}).catch(() => { status.textContent = '无法加载角色预览，请刷新页面重试。'; });
