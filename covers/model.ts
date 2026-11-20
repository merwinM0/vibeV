export const formatTypes = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' } as const;
export type CoverFormat = keyof typeof formatTypes;
export const coverLimit = 5 * 1024 * 1024;
export const slugPattern = /^[a-z0-9-]+$/;

export function isCoverFormat(value: unknown): value is CoverFormat {
  return typeof value === 'string' && Object.hasOwn(formatTypes, value);
}

export function imagePath(slug: string, format: CoverFormat): string {
  return `covers/${slug}.${format}`;
}

export async function readCoverIndex(base: string) {
  const response = await fetch(`${base}covers/index.json`);
  if (!response.ok) throw new Error('Cannot read cover index');
  const data: unknown = await response.json();
  if (typeof data !== 'object' || data === null || !('images' in data) ||
      typeof data.images !== 'object' || data.images === null) throw new Error('Invalid cover index');
  const images = new Map<string, CoverFormat>();
  for (const [slug, format] of Object.entries(data.images)) {
    if (slugPattern.test(slug) && isCoverFormat(format)) images.set(slug, format);
  }
  return { editable: 'editable' in data && data.editable === true, images };
}
