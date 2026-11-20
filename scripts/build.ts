import { mkdtemp, rename, rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { mediaFiles, pageEntries, root } from './pages';
import { exportCovers, workSlugs } from './covers';

const entries = await pageEntries();
const outputDir = await mkdtemp(join(root, '.dist-'));
try {
  const result = await Bun.build({
    root,
    entrypoints: entries.map((entry) => join(root, entry)),
    outdir: outputDir,
    target: 'browser',
    minify: true,
    env: 'disable',
  });
  for (const path of mediaFiles) await Bun.write(join(outputDir, path), Bun.file(join(root, path)));
  await exportCovers(outputDir, workSlugs(entries));
  const dist = join(root, 'dist');
  await rm(dist, { recursive: true, force: true });
  await rename(outputDir, dist);
  console.log(`已构建 ${entries.length} 个页面：`);
  for (const output of result.outputs) console.log(`  dist/${relative(outputDir, output.path)}`);
  for (const path of mediaFiles) console.log(`  dist/${path}`);
} finally {
  await rm(outputDir, { recursive: true, force: true });
}
