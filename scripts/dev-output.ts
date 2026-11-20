type Background = 'dark' | 'light' | 'unknown';
type Presentation = { panel: boolean; unicode: boolean; narrow: boolean; color: boolean; background: Background; columns?: number };
type Overview = { title: string; url: string; left: string[]; right: string[]; status: string[] };

const glyphs = [...'╭╮╰╯─│○'];
const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
const palette = {
  dark: { accent: '158;217;215', link: '159;197;240', border: '141;153;168' },
  light: { accent: '36;108;106', link: '40;95;154', border: '101;114;132' },
  unknown: { accent: '', link: '', border: '118;118;118' },
};

export function terminalPresentation(stream: { isTTY?: boolean; columns?: number }, env: Record<string, string | undefined>, platform: string): Presentation {
  const panel = !!stream.isTTY && env.TERM !== 'dumb';
  const locale = env.LC_ALL || env.LC_CTYPE || env.LANG || '';
  const narrow = !/^(?:zh|ja|ko)(?:[_.@-]|$)/i.test(locale);
  const native = ['linux', 'darwin', 'freebsd'].includes(platform);
  const bg = env.COLORFGBG?.split(';').at(-1);
  return {
    panel, narrow, columns: stream.columns,
    unicode: panel && native && /utf-?8/i.test(locale),
    color: panel && native && !env.NO_COLOR && /^(truecolor|24bit)$/i.test(env.COLORTERM ?? ''),
    background: bg === '0' || bg === '8' ? 'dark' : bg === '7' || bg === '15' ? 'light' : 'unknown',
  };
}

export function cleanTerminalLine(input: string): string {
  return input
    // OSC, DCS, SOS, PM and APC strings, including an unterminated string.
    .replace(/(?:\x1b\]|\x9d)[\s\S]*?(?:\x07|\x1b\\|\x9c|$)|(?:\x1b[P^_X]|[\x90\x98\x9e\x9f])[\s\S]*?(?:\x1b\\|\x9c|$)/g, '')
    .replace(/(?:\x1b\[|\x9b)[0-?]*[ -/]*[@-~]?|\x1b[ -/]*[0-~]?/g, '')
    .replace(/\r\n?|[\n\u2028\u2029]/g, ' ')
    .replace(/\t/g, '    ')
    .replace(/[\p{Cc}\p{Bidi_Control}]/gu, '')
    .trim();
}

export function renderDevOverview(content: Overview, format: Presentation): string {
  const title = cleanTerminalLine(content.title);
  const url = cleanTerminalLine(content.url);
  const left = content.left.map(cleanTerminalLine).filter(Boolean);
  const right = content.right.map(cleanTerminalLine).filter(Boolean);
  const status = content.status.map(cleanTerminalLine).filter(Boolean);
  const plain = [title && url ? `${title}：${url}` : title || url, ...left, ...right, ...status].filter(Boolean).join('\n');
  if (!format.panel) return plain;
  const columns = format.columns ?? 0;
  const known = Number.isFinite(columns) && columns > 0;
  if (known && columns < 6) return plain;
  const budget = known ? Math.min(88, Math.floor(columns)) : 80;
  const width = (text: string) => Bun.stringWidth(text, { ambiguousIsNarrow: format.narrow });
  const twoColumns = left.length > 0 && right.length > 0 && budget >= 56;
  const panelWidth = Math.min(budget, Math.max(twoColumns ? 72 : 40, width(title) + 5, width(url) + 4));
  const inner = panelWidth - 4;
  const unicode = format.unicode && glyphs.every((glyph) => width(glyph) === 1);
  const [tl, tr, bl, br, dash, side, marker] = unicode ? glyphs : ['+', '+', '+', '+', '-', '|', '-'];
  const colors = palette[format.background];
  const style = (text: string, role: keyof typeof colors) => format.color && colors[role] && text
    ? `\x1b[38;2;${colors[role]}m${text}\x1b[0m` : text;
  const border = (text: string) => style(text, 'border');
  const pad = (text: string, columns: number) => ' '.repeat(columns - width(text));
  const graphemes = (text: string) => Array.from(segmenter.segment(text), ({ segment }) => segment);
  let fits = true;
  function wrap(text: string, columns: number): string[] {
    const chunks = graphemes(text);
    const lines: string[] = [];
    while (chunks.length) {
      let end = 0;
      let columnsUsed = 0;
      let space = -1;
      while (end < chunks.length && columnsUsed + width(chunks[end]) <= columns) {
        if (chunks[end] === ' ') space = end;
        columnsUsed += width(chunks[end++]);
      }
      if (end === 0) { fits = false; return []; }
      if (end < chunks.length && space > 0) end = space;
      lines.push(chunks.splice(0, end).join('').trimEnd());
      while (chunks[0] === ' ') chunks.shift();
    }
    return lines.length ? lines : [''];
  }
  const body = (text: string, role?: 'link') => `${border(side)} ${role ? style(text, role) : text}${pad(text, inner)} ${border(side)}`;
  const titled = title && width(title) <= panelWidth - 5;
  const rows = [titled
    ? `${border(tl + dash)} ${style(title, 'accent')} ${border(dash.repeat(panelWidth - 5 - width(title)) + tr)}`
    : border(tl + dash.repeat(panelWidth - 2) + tr)];
  if (title && !titled) rows.push(...wrap(title, inner).map((line) => body(line)), body(''));
  if (url) rows.push(...wrap(url, inner).map((line) => body(line)));
  if (left.length || right.length) {
    if (url) rows.push(body(''));
    if (twoColumns) {
      const gap = '    ';
      const leftWidth = Math.floor((inner - gap.length) / 2);
      const rightWidth = inner - gap.length - leftWidth;
      for (let i = 0; i < Math.max(left.length, right.length); i++) {
        const a = wrap(left[i] ?? '', leftWidth);
        const b = wrap(right[i] ?? '', rightWidth);
        for (let j = 0; j < Math.max(a.length, b.length); j++) {
          const cell = a[j] ?? '';
          rows.push(body(cell + pad(cell, leftWidth) + gap + (b[j] ?? '')));
        }
      }
    } else {
      for (const field of [...left, ...right]) rows.push(...wrap(field, inner).map((line) => body(line)));
    }
  }
  rows.push(border(bl + dash.repeat(panelWidth - 2) + br));
  if (status.length) {
    rows.push('');
    for (const field of status) {
      const marked = width(graphemes(field)[0] ?? '') + 2 <= budget;
      rows.push(...wrap(field, budget - (marked ? 2 : 0)).map((line, i) =>
        `${marked ? i === 0 ? `${marker} ` : '  ' : ''}${line}`));
    }
  }
  return fits ? rows.join('\n') : plain;
}
