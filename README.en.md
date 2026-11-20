# vibeV · Collection

[中文](README.md) | English

Watch chapter-based animated explainers in your browser. The homepage lists the available works, each with its own player page.

Current work: **Hadoop Ecosystem**. Follow a batch of e-commerce orders through storage and parallel processing to a sales report and an order lookup. V1.2 covers **10 chapters and 59 shots in 7:15**. It plays in 16:9 landscape, with no audio or video export.

## Quick start

Requires Bun 1.3.14 (verified). From the project root:

```sh
bun install --frozen-lockfile
bun run dev
```

Open the address printed in the terminal (default: `http://127.0.0.1:3000/`) and select Hadoop Ecosystem on the homepage to open `/works/hadoop/`. Use the timeline to seek or switch to full screen. The current chapter stays centered; scroll, swipe, or click the chapter strip to switch chapters. While the player has focus, Space toggles playback and the arrow keys skip back/forward 5 seconds. The timeline uses native keyboard controls when focused. On narrow screens, the current caption is also shown below the player.

### Set a homepage cover

The homepage fits five columns on wide screens and fewer on narrow ones. Covers are center-cropped to 16:9; a blank gray tile appears if no cover has been uploaded. In the cover section below the player, choose an image and select Upload Cover. Upload another image to replace it, or select Remove Cover to restore the gray tile. PNG, JPEG, and WebP images up to 5 MB are supported. Covers persist across restarts in `db/covers.sqlite`, which is created automatically.

```sh
bun run typecheck
bun test
bun run build
bun run preview
```

## Add a work and deploy

1. Create `works/<slug>/index.html`, using lowercase letters, digits, or hyphens in the slug. Keep the work's code and assets in its own directory and reference them with relative paths.
2. Add `./works/<slug>/` to the root `index.html` and set `data-cover` on the tile to the same slug. To enable uploads, reuse the cover form, stylesheet, and script from `works/hadoop/index.html` and set `data-cover-editor` to the new slug. Link the work page's `vibeV` wordmark back to the homepage with `../../`. Restart the dev server to pick up the new entry.
3. `bun run build` builds the homepage, work pages, and a snapshot of the current covers. Publish all of `dist/` to a static host that serves directory `index.html` files, either at the domain root or in a subdirectory. The static site is read-only; rebuild and redeploy after changing a cover. `bun run preview` serves the built pages but reads covers from the live local database. The dev and preview servers listen on loopback only; do not expose the upload API publicly.

- [V1.2 storyboard (Chinese)](Hadoop生态圈_Vibe视频_完整分镜表.md) · [Mandarin narration script (text only)](docs/配音稿.md) · [Roadmap](READMAP.md) · [Development guide](AGENTS.md)
