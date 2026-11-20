import { coverLimit, formatTypes, readCoverIndex, slugPattern } from './model';

async function mountEditor() {
  const element = document.querySelector('[data-cover-editor]');
  if (!(element instanceof HTMLFormElement)) return;
  const form = element;
  const slug = form.dataset.coverEditor;
  const file = form.querySelector('input[type=file]');
  const save = form.querySelector('button[type=submit]');
  const remove = form.querySelector('button[type=button]');
  const status = form.querySelector('[role=status]');
  if (!slug || !slugPattern.test(slug) || !(file instanceof HTMLInputElement) ||
      !(save instanceof HTMLButtonElement) || !(remove instanceof HTMLButtonElement) || !status) return;

  const base = '../../';
  const { images, editable } = await readCoverIndex(base);
  if (!editable) return;
  let hasCover = images.has(slug);
  let busy = false;
  const endpoint = `${base}api/covers/${slug}`;
  const syncControls = () => {
    file.disabled = busy;
    save.disabled = busy;
    remove.hidden = !hasCover;
    remove.disabled = busy;
  };
  const message = (text: string, error = false) => {
    status.textContent = text;
    status.classList.toggle('cover-error', error);
  };
  const ready = () => message(hasCover ? '已设置封面' : '未设置封面，首页显示灰色占位。');
  syncControls();
  ready();
  form.hidden = false;
  file.addEventListener('change', ready);

  async function changeCover(method: 'PUT' | 'DELETE', image?: File) {
    if (busy) return;
    busy = true;
    syncControls();
    message(image ? '正在上传…' : '正在移除…');
    try {
      if (image) {
        const bitmap = await createImageBitmap(image).catch(() => null);
        if (!bitmap) {
          message('无法读取这张图片，请重新导出后再试。', true);
          return;
        }
        bitmap.close();
      }
      const response = await fetch(endpoint, { method, body: image, headers: image ? { 'Content-Type': image.type } : {} });
      if (response.status === 413) message('图片不能超过 5 MB，请压缩后再试。', true);
      else if (response.status === 415) message('请选择有效的 PNG、JPEG 或 WebP 图片。', true);
      else if (!response.ok) message('封面未更新，请稍后再试。', true);
      else {
        hasCover = method === 'PUT';
        if (hasCover) form.reset();
        message(hasCover ? '封面已保存，返回目录即可查看。' : '已移除封面，首页恢复灰色占位。');
      }
    } catch {
      message('连接服务失败，请检查本地服务是否运行后重试。', true);
    } finally {
      busy = false;
      syncControls();
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const image = file.files?.[0];
    if (!image) return;
    if (!Object.values<string>(formatTypes).includes(image.type)) {
      message('请选择 PNG、JPEG 或 WebP 图片。', true);
    } else if (image.size > coverLimit) {
      message('图片不能超过 5 MB，请压缩后再试。', true);
    } else {
      void changeCover('PUT', image);
    }
  });
  remove.addEventListener('click', () => void changeCover('DELETE'));
}

void mountEditor().catch(() => { /* Static sites and offline playback do not expose editing. */ });
