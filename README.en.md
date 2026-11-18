# Hadoop Ecosystem · Vibe Web Preview

[中文](README.md) | English

An animated introduction to Hadoop. Follow a batch of preprocessed e-commerce orders to see how data is organized, stored, and managed in HDFS. This preview covers **chapters 00–02 of the storyboard (S01–S16, 00:00–03:44)**. It plays in the browser in 16:9 landscape, with no narration, music, sound effects, or video export.

## Quick start

Requires Bun 1.3.14 (verified). From the project root:

```sh
bun install --frozen-lockfile
bun run dev
```

Open the address printed in the terminal (default: `http://localhost:3000/`). Press Play to start. Use the timeline to seek, select a chapter, or switch to full screen. While the player has focus, Space toggles playback and the arrow keys skip back/forward 5 seconds. The timeline uses native keyboard controls when focused. On narrow screens, the current caption is also shown below the player.

```sh
bun run typecheck
bun test
bun run build
bun run preview
```

`build` writes to `dist/`; `preview` serves the static build for local checks.

- [Original storyboard (Chinese)](Hadoop生态圈_Vibe视频_完整分镜表.md) · [Roadmap](READMAP.md) · [Development guide](AGENTS.md)
