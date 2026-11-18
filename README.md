# Hadoop 生态圈 · Vibe 网页样片

[English](README.en.md) | 中文

面向初学者的 Hadoop 动态讲解。跟随一批预处理后的电商订单，理解数据如何组织、落盘并由 HDFS 管理。本轮范围为原分镜的 **00–02 章（S01–S16，00:00–03:44）**；16:9 横屏，在浏览器播放，不含旁白、配乐或音效，不提供视频导出。

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

- [原始分镜](Hadoop生态圈_Vibe视频_完整分镜表.md) · [路线图](READMAP.md) · [工程约定](AGENTS.md)
