# 开发与协作

- `Hadoop生态圈_Vibe视频_完整分镜表.md` 是时间、镜头与技术关系的依据。用户未确认前不扩展章节或加入音频、导出流程。`vibe-make/` 是现有独立 Skill 仓库，不随网页代码提交。
- 根目录 `index.html` 和 `catalog/styles.css` 定义作品目录。每部作品放到 `works/<slug>/`，各自有 `index.html`、代码和素材。开发、构建自动发现这些页面；新作入口手动加入首页。站内链接和资源路径用相对路径，保证 `dist/` 可部署至域名根目录或子目录。`ui/site.css` 与 `ui/backdrop.svg` 为首页和播放页提供共享的深色配色、胶囊顶栏和几何底纹。作品卡只展示名称和 16:9 圆角封面，没上传时显示纯灰色占位。保持 `data-cover`、`data-cover-editor` 与作品目录名一致。
- `works/hadoop/` 中的 `index.html` 和 `src/styles.css` 定义播放器；`src/main.ts` 负责 DOM 和播放时钟，`src/chapter-reel.ts` 管理居中章节和滚动切换，不持有独立播放时钟；`src/timeline.ts` 汇总全片章节、镜头和字幕，`src/continuation.ts` 提供 03–09 章的字幕与起点；`src/visual/` 以 Canvas 按主题分组绘制 59 镜。当前只提供配音版。`src/narration.ts` 按 `p1` 至 `p4` 记录保留长度、实测字幕和对应的分镜参考；音频不按镜号拆句或重排。播放器用媒体时间显示对应字幕及重排后的镜头和章节。把 `p1.mp3` 至 `p4.mp3` 放在 `works/hadoop/dub/`，用带 libmp3lame 的 FFmpeg 运行 `bun run hadoop:dub` 生成 `dub/narration.mp3`，只裁掉前三段重复片尾。正常开发和构建无需原始录音或 FFmpeg。网站以 Bun 打包，不依赖客户端框架。
- `avatar/` 提供 64×64 Minecraft 皮肤贴图、关节姿态和 Canvas 绘制；`works/mc-avatar/` 是独立的动作测试片，网页与 `bun run avatar:render` 共用逐帧绘制和已剪接音轨。`narration.ts` 区分剪辑入/出点与实测开口/收声，按目标帧映射口播字幕和动作锚点。修改后用 `bun run avatar:dub` 从原录音 `dub/p1.mp3` 重新剪接。视频画内字幕统一白字细黑描边、不加底框。样片导出到 Git 忽略的 `exports/`，不影响 Hadoop。
- `covers/` 存浏览器封面逻辑和共享格式配置；`scripts/covers.ts` 与 `scripts/cover-routes.ts` 负责 SQLite 和本机接口。图片和格式一并保存在 `db/covers.sqlite`，不进 Git。开发和预览可编辑，构建只读并导出 `.json` 和图片快照；静态站不提供编辑接口，不拷贝数据库。
- 时间轴统一用 30fps 帧标尺。镜头由帧计算，不依赖前一帧、独立定时器或无种子的随机数。16:9 舞台以 1920×1080 为基准，控件在画面外。数据、元数据和依赖分别用实线、虚线和点线；颜色不作为唯一辨别手段。
- 修改镜头时核对分镜，验证开始、关键动作、结束及进度跳转；改时间轴时同步更新章节边界和字幕锚点。提交前执行 `bun run typecheck`、`bun test`、`bun run build`，并在浏览器预览。如果使用说明改变，同步维护中英文 README。
