import { expect, test } from 'bun:test';
import { cleanTerminalLine, renderDevOverview, terminalPresentation } from '../scripts/dev-output';

const content = {
  title: 'Vibe 图解', url: 'http://127.0.0.1:3000/',
  left: ['作品：1 部', '恢复 e\u0301 👩🏽‍💻'], right: ['模式：开发（热更新）'],
  status: ['服务：运行中', 'SQLite：已就绪 (db/covers.sqlite)'],
};
const env = { TERM: 'xterm-256color', LANG: 'en_US.UTF-8', COLORTERM: 'truecolor', COLORFGBG: '15;0' };
const tty = (columns?: number, extra = {}) => terminalPresentation({ isTTY: true, columns }, { ...env, ...extra }, 'linux');

function frame(output: string) { return Bun.stripANSI(output).split('\n\n')[0].split('\n'); }

test('True Color is opt-in by terminal capability; NO_COLOR does not change the frame', () => {
  const color = renderDevOverview(content, tty(80));
  const plain = renderDevOverview(content, tty(80, { NO_COLOR: '1' }));
  expect(color).toContain('\x1b[38;2;158;217;215mVibe 图解\x1b[0m');
  expect(Bun.stripANSI(color)).toBe(plain);
  expect(plain).not.toContain('\x1b');
  expect(plain).toContain('╭─ Vibe 图解 ');
  expect(plain).toContain('\n\n○ 服务：运行中');
  expect(renderDevOverview(content, tty(80, { COLORTERM: undefined }))).toBe(plain);
  const redirected = renderDevOverview(content, terminalPresentation({ columns: 100 }, env, 'linux'));
  expect(redirected).toStartWith('Vibe 图解：http://127.0.0.1:3000/\n');
  expect(redirected).not.toMatch(/[╭○\x1b]/);
  expect(renderDevOverview(content, tty(80, { TERM: 'dumb' }))).toBe(redirected);
});

test('frame widths, wrapping and two-column boundary honor the destination columns', () => {
  for (const [columns, expected] of [[undefined, 72], [NaN, 72], [0, 72], [6, 6], [20, 20], [55, 40], [56, 56], [57, 57], [72, 72], [80, 72], [88, 72]] as const) {
    const rows = frame(renderDevOverview(content, tty(columns)));
    expect(rows.every((row) => Bun.stringWidth(row) === expected)).toBe(true);
  }
  expect(renderDevOverview(content, tty(5))).not.toContain('╭');
  const stacked = frame(renderDevOverview(content, tty(55)));
  expect(stacked.findIndex((row) => row.includes('恢复'))).toBeLessThan(stacked.findIndex((row) => row.includes('模式')));
  const paired = frame(renderDevOverview(content, tty(56)));
  expect(paired.find((row) => row.includes('作品'))).toContain('模式');
});

test('a Chinese UTF-8 tmux terminal keeps the rounded solid frame without color', () => {
  const output = renderDevOverview(content, tty(56, { LANG: 'zh_CN.UTF-8', TERM: 'tmux-256color', NO_COLOR: '1' }));
  const rows = frame(output);
  expect(rows[0]).toMatch(/^╭─ Vibe 图解 ─+╮$/);
  expect(rows.slice(1, -1).every((row) => row.startsWith('│ ') && row.endsWith(' │'))).toBe(true);
  expect(rows.at(-1)).toMatch(/^╰─+╯$/);
  expect(rows.every((row) => Bun.stringWidth(row) === 56)).toBe(true);
  expect(output).toContain('○ 服务：运行中');
  expect(output).not.toContain('\x1b');
});

test('ASCII fallback depends on glyph support or measured width, not language', () => {
  const format = tty(56, { LANG: 'zh_CN.UTF-8', NO_COLOR: '1' });
  const ascii = renderDevOverview(content, { ...format, ambiguousIsNarrow: false });
  expect(ascii).toStartWith('+- Vibe 图解 ');
  expect(ascii).toContain('- 服务：运行中');
  expect(frame(ascii).every((row) => Bun.stringWidth(row, { ambiguousIsNarrow: false }) === 56)).toBe(true);
  expect(renderDevOverview(content, tty(56, { LANG: 'C', NO_COLOR: '1' }))).toStartWith('+- Vibe 图解 ');
});

test('columns preserve graphemes, URL bytes and a title that cannot fit the border', () => {
  const url = `${content.url}${'x'.repeat(85)}👩🏽‍💻`;
  const title = '界'.repeat(24) + 'e\u0301';
  const rows = frame(renderDevOverview({ ...content, title, url }, tty(20)));
  expect(rows[0]).toMatch(/^╭─+╮$/);
  const allBody = rows.slice(1, -1).map((row) => row.slice(1, -1).trim()).join('');
  expect(allBody).toContain(title + url);
  expect(rows.some((row) => row.includes('👩🏽‍💻'))).toBe(true);
  expect(frame(renderDevOverview({ ...content, title: 'A'.repeat(35) }, tty(40)))[0]).toBe(`╭─ ${'A'.repeat(35)} ╮`);
  expect(frame(renderDevOverview({ ...content, title: '' }, tty(40)))[0]).toBe(`╭${'─'.repeat(38)}╮`);
});

test('single-line fields drop complete and incomplete escape sequences and normalize whitespace', () => {
  expect(cleanTerminalLine('A\x1b[31m中\x1b[0m\tB\r\nC\rD\u2028E\u202e\x07')).toBe('A中    B C D E');
  expect(cleanTerminalLine('A\x1b]8;; https://example.org\x1b\\B\x1b]unterminated')).toBe('AB');
  expect(cleanTerminalLine('A\x9b31')).toBe('A');
  expect(cleanTerminalLine('A\x1b[31;')).toBe('A');
  expect(cleanTerminalLine('A\x1b')).toBe('A');
});
