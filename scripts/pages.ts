import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
// Serve these files directly so the development server supports audio byte-range seeks.
export const mediaFiles = ['works/hadoop/dub/narration.mp3'] as const;

export async function pageEntries(): Promise<string[]> {
  const works = await Array.fromAsync(new Bun.Glob('works/*/index.html').scan({ cwd: root }));
  return ['index.html', ...works.sort()];
}

export function redirectTo(pathname: string): Response {
  return new Response(null, { status: 308, headers: { Location: pathname } });
}
