import { chapters, timecode, type ChapterId } from './timeline';
import { chapterHues } from './visual/ink';

export function chapterReel(list: HTMLOListElement, jump: (seconds: number) => void) {
  let current = -1;
  let scrolling = false;
  let settleTimer = 0;
  let lastWheel = -Infinity;
  let wheelTotal = 0;
  let wheelHandled = false;

  const label = (className: string, text: string) => {
    const node = document.createElement('span');
    node.className = className;
    node.textContent = text;
    return node;
  };
  const buttons = chapters.map((chapter, i) => {
    const row = document.createElement('li');
    const button = document.createElement('button');
    button.className = 'chapter';
    button.type = 'button';
    button.dataset.chapter = chapter.id;
    button.style.setProperty('--chapter-hue', chapterHues[i]);
    button.append(label('chapter-number', chapter.id), label('chapter-title', chapter.title), label('chapter-time', timecode(chapter.start)));
    button.addEventListener('click', () => {
      jump(chapter.start);
      center();
    });
    row.append(button);
    list.append(row);
    return button;
  });

  function offset(button: HTMLButtonElement) {
    const item = button.getBoundingClientRect();
    const viewport = list.getBoundingClientRect();
    return item.left + item.width / 2 - (viewport.left + list.clientWidth / 2);
  }

  function stopReadingScroll() {
    scrolling = false;
    window.clearTimeout(settleTimer);
  }

  function center() {
    stopReadingScroll();
    if (current >= 0) list.scrollLeft += offset(buttons[current]);
  }

  function select(index: number) {
    if (index === current) center();
    else jump(chapters[index].start);
  }

  list.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse') scrolling = true;
  });
  list.addEventListener('scroll', () => {
    if (!scrolling) return;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      if (!scrolling) return;
      const nearest = buttons.reduce((best, button, i) => Math.abs(offset(button)) < Math.abs(offset(buttons[best])) ? i : best, 0);
      select(nearest);
    }, 160);
  }, { passive: true });

  list.addEventListener('wheel', (event) => {
    if (event.ctrlKey) return; // Leave pinch zoom alone.
    if (event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
      scrolling = true;
      return;
    }
    const direction = Math.sign(event.deltaY);
    const next = current + direction;
    if (next < 0 || next >= buttons.length || current < 0) return;
    event.preventDefault();
    if (event.timeStamp - lastWheel > 170 || Math.sign(wheelTotal) !== direction) {
      wheelTotal = 0;
      wheelHandled = false;
    }
    lastWheel = event.timeStamp;
    wheelTotal += event.deltaY * (event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 18 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? 100 : 1);
    if (!wheelHandled && Math.abs(wheelTotal) >= 18) {
      wheelHandled = true;
      if (list.contains(document.activeElement)) buttons[next].focus({ preventScroll: true });
      select(next);
    }
  }, { passive: false });

  list.addEventListener('keydown', (event) => {
    stopReadingScroll();
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const focused = buttons.indexOf(event.target as HTMLButtonElement);
    if (focused < 0) return;
    const next = event.key === 'ArrowLeft' ? focused - 1 : event.key === 'ArrowRight' ? focused + 1 :
      event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : focused;
    if (next === focused || next < 0 || next >= buttons.length) return;
    event.preventDefault();
    buttons[next].focus({ preventScroll: true });
    select(next);
  });
  new ResizeObserver(center).observe(list);

  return {
    show(chapter: ChapterId) {
      const i = chapters.findIndex(({ id }) => id === chapter);
      if (i < 0 || i === current) return;
      buttons[current]?.removeAttribute('aria-current');
      current = i;
      buttons[current].setAttribute('aria-current', 'true');
      center();
    },
  };
}
