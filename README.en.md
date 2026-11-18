# Vibe Illustrated · Collection

[中文](README.md) | English

Watch animated explainers on technical topics in your browser. The homepage lists the available works, each with its own page.

Current work: **Hadoop Ecosystem**. Follow a batch of e-commerce orders through storage and parallel processing to a sales report and an order lookup. V1.2 covers **10 chapters and 59 shots in 7:15**. It plays in 16:9 landscape, with no audio or video export.

## Quick start

Requires Bun 1.3.14 (verified). From the project root:

```sh
bun install --frozen-lockfile
bun run dev
```

Open the address printed in the terminal (default: `http://127.0.0.1:3000/`) and select Hadoop Ecosystem on the homepage to open `/works/hadoop/`. Use the timeline to seek, select a chapter, or switch to full screen. While the player has focus, Space toggles playback and the arrow keys skip back/forward 5 seconds. The timeline uses native keyboard controls when focused. On narrow screens, the current caption is also shown below the player.

```sh
bun run typecheck
bun test
bun run build
bun run preview
```

## Add a work and deploy

1. Create `works/<slug>/index.html`, using lowercase letters, digits, or hyphens in the slug. Keep the work's code and assets in its own directory and reference them with relative paths.
2. Add `./works/<slug>/` to the list in the root `index.html`. Use `../../` in the work page to link back to the homepage. Restart the dev server to pick up the new entry.
3. `bun run build` builds the homepage and all work pages. Publish all of `dist/` to a static host that serves directory `index.html` files, either at the domain root or in a subdirectory. Keep the output directory structure intact. Bun is not required on the host. Use `bun run preview` to check the build locally.

- [V1.2 storyboard (Chinese)](Hadoop生态圈_Vibe视频_完整分镜表.md) · [Mandarin narration script (text only)](docs/配音稿.md) · [Roadmap](READMAP.md) · [Development guide](AGENTS.md)
