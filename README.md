# Hadoop 生态圈 · Vibe 网页全片

[English](README.en.md) | 中文

面向初学者的 Hadoop 动态讲解。跟随一批预处理后的电商订单，理解数据如何组织、落盘并由 HDFS 管理。V1.2 包含 **00–09 章、59 镜、7 分 15 秒**。00–02 保持原节奏；03–09 从 02:00 接续，通过 Shuffle 汇流、分区裁剪、RowKey 点查和架构重组讲清因果。16:9 横屏，在浏览器播放，不含音频，不导出视频。

## 快速开始

需要 Bun 1.3.14（已验证）。在项目根目录执行：

```sh
bun install --frozen-lockfile
bun run dev
```

打开终端显示的地址（默认 `http://localhost:3000/`）。点击「播放」开始；可拖动进度、跳转章节或全屏。播放区获得焦点时，空格播放/暂停，左右方向键后退/快进 5 秒。进度条获得焦点时使用原生键盘操作。窄屏下，播放器下方也会显示当前字幕。

```sh
bun run typecheck
bun test
bun run build
bun run preview
```

`build` 输出到 `dist/`；`preview` 用于本地检查静态构建。

- [分镜 V1.2](Hadoop生态圈_Vibe视频_完整分镜表.md) · [中文配音稿（仅文稿）](docs/配音稿.md) · [路线图](READMAP.md) · [工程约定](AGENTS.md)
