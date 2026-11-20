import { Database } from 'bun:sqlite';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { formatTypes, imagePath, isCoverFormat, slugPattern } from '../covers/model';
import type { CoverFormat } from '../covers/model';
import { root } from './pages';

export const databaseLabel = 'db/covers.sqlite';
export const databasePath = join(root, databaseLabel);
type Cover = { format: CoverFormat; bytes: Uint8Array<ArrayBuffer> };
type CoverEntry = Pick<Cover, 'format'> & { slug: string };

export function workSlugs(entries: string[]) {
  return new Set(entries.flatMap((entry) => {
    const match = /^works\/([^/]+)\/index\.html$/.exec(entry);
    return match && slugPattern.test(match[1]) ? [match[1]] : [];
  }));
}

export function coverStore(path: string) {
  // Short synchronous connections leave no handles behind when Bun hot-reloads the server.
  function query<T>(operation: (db: Database) => T, readonly = false) {
    const db = new Database(path, readonly ? { readonly: true } : { create: true });
    try { return operation(db); } finally { db.close(); }
  }
  return {
    async initialize() {
      await mkdir(dirname(path), { recursive: true });
      query((db) => db.run(`CREATE TABLE IF NOT EXISTS covers (
        slug TEXT PRIMARY KEY NOT NULL,
        format TEXT NOT NULL CHECK (format IN ('png', 'jpg', 'webp')),
        bytes BLOB NOT NULL
      ) STRICT`));
    },
    index(slugs: Set<string>) {
      return query((db) => Object.fromEntries(db.query<CoverEntry, []>('SELECT slug, format FROM covers ORDER BY slug')
        .all().filter(({ slug, format }) => slugs.has(slug) && isCoverFormat(format))
        .map(({ slug, format }) => [slug, format])), true);
    },
    get(slug: string) {
      return query((db) => db.query<Cover, [string]>('SELECT format, bytes FROM covers WHERE slug = ?').get(slug), true);
    },
    put(slug: string, cover: Cover) {
      query((db) => db.run(`INSERT INTO covers (slug, format, bytes) VALUES (?, ?, ?)
        ON CONFLICT (slug) DO UPDATE SET format = excluded.format, bytes = excluded.bytes`,
      [slug, cover.format, cover.bytes]));
    },
    remove(slug: string) {
      query((db) => db.run('DELETE FROM covers WHERE slug = ?', [slug]));
    },
  };
}

export async function exportCovers(outputDir: string, slugs: Set<string>, path = databasePath) {
  const store = coverStore(path);
  const images = await Bun.file(path).exists() ? store.index(slugs) : {};
  for (const [slug, format] of Object.entries(images)) {
    const cover = store.get(slug);
    if (cover?.format === format) await Bun.write(join(outputDir, imagePath(slug, format)), cover.bytes);
    else delete images[slug];
  }
  await Bun.write(join(outputDir, 'covers/index.json'), JSON.stringify({ editable: false, images }));
}

export function identifyCover(bytes: Uint8Array, mime: string | null): CoverFormat | undefined {
  const startsWith = (signature: number[], offset = 0) => signature.every((byte, i) => bytes[i + offset] === byte);
  if (mime === formatTypes.png && startsWith([137, 80, 78, 71, 13, 10, 26, 10])) return 'png';
  if (mime === formatTypes.jpg && startsWith([255, 216, 255])) return 'jpg';
  if (mime === formatTypes.webp && startsWith([82, 73, 70, 70]) && startsWith([87, 69, 66, 80], 8)) return 'webp';
}
