# 开发与协作

- `Hadoop生态圈_Vibe视频_完整分镜表.md` 是时间、镜头与技术关系的依据。用户未确认前不扩展章节或加入音频、导出流程。`vibe-make/` 是现有独立 Skill 仓库，不随网页代码提交。
- 根目录 `index.html` 和 `catalog/styles.css` 定义作品目录。每部作品放到 `works/<slug>/`，各自有 `index.html`、代码和素材。开发、构建自动发现这些页面；新作入口手动加入首页。站内链接和资源路径用相对路径，保证 `dist/` 可部署至域名根目录或子目录。
- `works/hadoop/` 中的 `index.html` 和 `src/styles.css` 定义播放器；`src/main.ts` 负责 DOM 和播放时钟；`src/timeline.ts` 汇总全片章节、镜头和字幕，`src/continuation.ts` 提供 03–09 章的字幕与起点；`src/visual/` 以 Canvas 按主题分组绘制 59 镜。网站以 Bun 打包，不依赖客户端框架或后端服务。
- 时间轴统一用 30fps 帧标尺。镜头由帧计算，不依赖前一帧、独立定时器或无种子的随机数。16:9 舞台以 1920×1080 为基准，控件在画面外。数据、元数据和依赖分别用实线、虚线和点线；颜色不作为唯一辨别手段。
- 修改镜头时核对分镜，验证开始、关键动作、结束及进度跳转；改时间轴时同步更新章节边界和字幕锚点。提交前执行 `bun run typecheck`、`bun test`、`bun run build`，并在浏览器预览。如果使用说明改变，同步维护中英文 README。
