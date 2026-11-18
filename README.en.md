# Hadoop Ecosystem · Vibe Web Preview

[中文](README.md) | English

An animated introduction to Hadoop. Follow a batch of preprocessed e-commerce orders to see how data is organized, stored, and managed in HDFS. The V1.1 preview covers **chapters 00–02 (S01–S16, 00:00–02:00)**. The revised pacing uses visible changes in shape and routing to show the order surge, file splitting, reads and writes, and recovery. It plays in the browser in 16:9 landscape, with no audio or video export.

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

- [V1.1 storyboard (Chinese)](Hadoop生态圈_Vibe视频_完整分镜表.md) · [Roadmap](READMAP.md) · [Development guide](AGENTS.md)
