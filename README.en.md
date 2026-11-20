# vibeV · Collection

[中文](README.md) | English

Watch chapter-based animated explainers in your browser. The homepage lists the available works, each with its own player page.

Current work: **Hadoop Ecosystem**. Follow a batch of e-commerce orders through storage and parallel processing to a sales report and an order lookup. The default **3:11 narrated edition** syncs captions and shots to the recording. The silent full edition has **10 chapters and 59 shots in 7:15**. Both play in 16:9 landscape, with no video export.

## Quick start

Requires Bun 1.3.14 (verified). From the project root:

```sh
bun install --frozen-lockfile
bun run dev
```

Open the address printed in the terminal (default: `http://127.0.0.1:3000/`) and select Hadoop Ecosystem on the homepage to open `/works/hadoop/`. Select Play to hear the narration, or use the mute, seek, and full-screen controls. Use the links below the player to switch to the full edition (完整版图解). The current chapter stays centered; scroll, swipe, or click the chapter strip to switch chapters. While the player has focus, Space toggles playback and the arrow keys skip back/forward 5 seconds. The timeline uses native keyboard controls when focused. On narrow screens, the current caption is also shown below the player.

### Minecraft character sample

Open “一张皮肤，怎么让角色动起来？” (`/works/mc-avatar/`) from the homepage. The 30-second sample uses `avatar/mc_mon.png` to explain textures, joints, and walking. The controls below it let you preview poses, rotate the view, or try another 64×64 PNG skin locally.

To export the sample, install Chromium and FFmpeg with libx264, then run `bun run avatar:render`. If Chromium is not on `PATH`, use `env CHROMIUM_BIN=/path/to/chromium bun run avatar:render`. This writes a silent 1080p, 30 fps video to `exports/mc-avatar-30s.mp4`. See the [storyboard and reuse notes (Chinese)](docs/MC角色样片.md).

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

- [V1.2 storyboard (Chinese)](Hadoop生态圈_Vibe视频_完整分镜表.md) · [Full-edition Mandarin script (not the dubbed captions)](docs/配音稿.md) · [Roadmap](READMAP.md) · [Development guide](AGENTS.md)
