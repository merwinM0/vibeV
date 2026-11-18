# Hadoop Ecosystem · Vibe Web Film

[中文](README.md) | English

An animated introduction to Hadoop. Follow a batch of preprocessed e-commerce orders to see how data is organized, stored, and managed in HDFS. V1.2 covers **chapters 00–09: 59 shots in 7:15**. Chapters 00–02 keep their pacing; chapters 03–09 continue at 02:00, showing how keys converge in Shuffle, how Hive prunes partitions, how HBase looks up a RowKey, and how the architecture fits together. It plays in the browser in 16:9 landscape, with no audio or video export.

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

- [V1.2 storyboard (Chinese)](Hadoop生态圈_Vibe视频_完整分镜表.md) · [Mandarin narration script (text only)](docs/配音稿.md) · [Roadmap](READMAP.md) · [Development guide](AGENTS.md)
