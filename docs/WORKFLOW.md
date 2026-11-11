# Substack 文章 → HTML + SVG 双轨工作流

收到一篇 Substack 链接后，按本文档逐步执行。**一篇文章必须同时产出两种互补内容，不得只生成其中一种。**

| 产物 | 视角 | 目标 |
|------|------|------|
| HTML 精读笔记 `{slug}-精读笔记.html` | 顺着原文、纪实 | 按原文章节顺序用简体中文复述，保留原图、短引文、注释来源和评论区摘录，让读者像读原文一样读懂脉络 |
| SVG 理性分析 `{slug}-理性分析.svg` | 客观、结构化、跨章节重组 | 提炼论点、概念关系、方法、对比、选型、避坑、适用边界和行动清单 |

HTML 不是 SVG 的加长版，SVG 也不是 HTML 的缩略图。两者共享同一份原文证据，承担不同的阅读任务。

```
Task Progress:
- [ ] 0. 校验链接 + 去重（docs/index.json 中 url 已存在则结束）
- [ ] 1. 抓取原文：node scripts/fetch-substack.mjs "<url>" --slug=<slug>
- [ ] 2. 通读 _work/<slug>/article.md 全文（不得只看标题和开头）
- [ ] 3. 判断文章类型，选 SVG 卡片模板组合
- [ ] 4. 编写 content/<slug>.mjs（meta + reading + analysis）
- [ ] 5. 构建：node scripts/build.mjs <slug>
- [ ] 6. 自检：node scripts/check-simplified.mjs <slug> + 浏览器打开两种产物
- [ ] 7. 提交（用户要求时）；推送失败属于网络问题，跳过即可
```

---

## 不可妥协的发布标准

### 简体中文

- 所有面向读者的编辑内容必须使用**简体中文**：标题、导语、章节标题、要点、图注、`index.json` 摘要、SVG 文案。
- 唯一例外是 `originalTitle`（原标题），用于溯源，保留原文写法。
- 繁体原文的引文一律转为简体后再引用；英文原文引文须紧跟简体中文释义。
- `scripts/fetch-substack.mjs` 会生成 `article.zh-hans.md`（OpenCC 台湾→大陆转换），只供参考：机器转换不处理用词差异（如“影片→视频”“资讯→信息”“搜寻→搜索”），发布前必须人工改写。
- 构建后运行 `node scripts/check-simplified.mjs <slug>`，有残留繁体字时退出码为 1。

### 版权与引用

- **不全文转载**。精读笔记是复述加短引文：每节引文 1–2 句，全篇引文不超过原文的一成。
- 页脚固定声明来源与版权，正文头部和结尾各给一个原文链接。
- 付费文章（API 返回 `audience` 不是 `everyone` 或没有正文）只记录标题和链接，不做摘要。

### 内容完整性

- 编辑前必须读完 `article.md` 全文。
- 禁止关键词拼贴、`...` 截断的摘要、“本文围绕相关话题展开”之类的模板句。
- 原文数据（数字、列表、步骤）照原文写，不编造；**超出原文的推断必须标注**（SVG 里用 `<span class="sev lo">笔者推导</span>`，HTML 里用 `{type:'note'}` 批注）。
- 原文有事实性瑕疵（如流行图表误引研究）时，在 HTML 批注或 SVG 认知纠偏中客观指出，不改写作者观点。

---

## Step 0：校验与去重

- 只接受带 `/p/<post-slug>` 路径的链接，支持 `*.substack.com` 和自定义域名的 Substack。
- 去掉 `?r=`、`utm_*` 等分享参数，用 canonical URL（`https://{host}/p/{post-slug}`）去重。
- `{slug}`：根据**文章主题**起英文语义化 slug（小写、`-` 连接、3–6 个词），不要直接用 Substack 的 post slug（常是 `youtube` 这类无意义词）。

## Step 1：抓取

```bash
node scripts/fetch-substack.mjs "https://xxx.substack.com/p/yyy?r=..." --slug=topic-slug
```

- 走 Substack 公开 API `/api/v1/posts/{post-slug}`，一次请求拿到标题、副标题、作者、日期、字数、封面和 `body_html`。
- 国内直连 substack.com 会超时：脚本先读 `HTTPS_PROXY`，否则在 macOS 上自动读取系统代理（`scutil --proxy`）。
- 产出：`_work/{slug}/post.json`、`article.md`、`article.zh-hans.md`，封面 `docs/assets/{slug}/cover.jpg`（自动压缩到 1600px 宽的 JPEG），正文内嵌图 `fig-01.png`…
- `_work/` 已加入 `.gitignore`，不提交。
- 评论区不在 API 正文里；需要摘录评论时，用 WebFetch 读原文页面末尾。

## Step 2–3：通读并选模板

| 文章类型 | 识别特征 | 优先模板 | 侧重 |
|---------|---------|---------|------|
| 方法论 / 学习类 | 步骤、框架、清单 | 方法卡 + 心法卡 + 避坑 + 选型 | 落地动作 |
| 观点 / 趋势 | “我认为”、趋势判断 | 概念拆解 + 对比 + 认知纠偏 | 认知转变 |
| 技术教程 | 代码、命令、配置 | 方法卡 + 避坑 + 选型 | 上手路径 |
| 访谈 / 个人经历 | 时间线、故事 | 时间线 + 心法 + 边界 | 可迁移经验 |
| 综述 / 盘点 | 列表、分类 | 选型表 + 对比表 + 概念拆解 | 全景对比 |

## Step 4：编写 `content/{slug}.mjs`

一个文件导出三部分，样例见 `content/learn-new-field-amid-info-overload.mjs`。

```js
export const meta = {
  slug, date /* 收录日 */, title /* 简体意译标题 */, originalTitle,
  author, publication /* 子域名 */, publicationName, url /* canonical */,
  postDate, wordcount, primary, tags: [], cover, summary /* 120–200 字，简体 */,
};

export const reading = {
  coverAlt, lede, takeaway,
  sections: [{ id, title, originalHeading /* 转简体 */, gist, figure?, blocks: [
    '段落 HTML 字符串',
    { type: 'quote', text, note? },
    { type: 'list', ordered?, items: [] },
    { type: 'note', label?, html },       // 批注 / 纠偏
    { type: 'figure', src, alt, caption },
  ]}],
  references: [], comments: [{ author, date, text }],
};

export const analysis = { body: `...SVG 内 HTML...`, css: '' /* 可选追加样式 */ };
```

### HTML 精读笔记要求

- 章节与原文小标题一一对应，章节标题用自己的话概括，`originalHeading` 记录原小标题（转简体）。
- 每节 `gist` 一句话，进入页首“文章结构”导航。
- 原文图片全部保留，配准确的 `alt` 和中文图注。
- 原文注释 / 参考来源完整列出（转简体）。

### SVG 理性分析要求（来自 `czh-svg-web-article`）

文首必须有：标题 + 标签、以“本文解决的核心问题是……”开头的一句话概括、概念关系图（`.map` + `.flow` + `.node`）、认知纠偏。

正文从以下模板中按文章类型组合（样式类已在 `scripts/lib/svg-style.mjs` 中定义）：

| 模板 | 用途 | 类名 |
|------|------|------|
| A 概念拆解卡 | 机制、关键理解、边界、关联 | `.card` + `.lbl` / `.edge` / `.rel` |
| B 方法 / 步骤表 | 步骤、产出、常见失误 | `table` |
| C 避坑卡 | 现象、原因、原文、解法、严重度 | `.card.r` + `.sev.hi/md/lo` + `.do` |
| D 选型表 | 场景、推荐、理由、不推荐、原因 | `table` |
| E 对比表 | 维度 × 概念 | `table` |
| F 心法 / 分层清单 | 原则、怎么查、适用边界 | `.lv` |

结尾固定三段：总结（3–5 条）、行动清单（3–5 件可以马上做的事）、关键认知转变。

## Step 5：构建

```bash
node scripts/build.mjs <slug>          # HTML + SVG + index.json
node scripts/build.mjs <slug> --svg-only
node scripts/build.mjs --all           # 全部重建
```

- SVG 宽 1320，高度由 `svg-auto-height.mjs` 用本机 Chrome 无头实测，再加 50% 缓冲。
- `index.json` 按 slug 更新已有条目，并按收录日期倒序排列。

## Step 6：自检

- [ ] `node scripts/check-simplified.mjs <slug>` 通过
- [ ] `xmllint --noout docs/<slug>-理性分析.svg` 通过
- [ ] `npm run serve` 后打开首页、精读笔记、SVG，确认图片、导航、长图底部都完整
- [ ] SVG 至少有一处落地建议、一处避坑、一张对比或选型表、概念边界说明
- [ ] 所有超出原文的内容都标注了“笔者推导”

## 发布

GitHub Pages 由 `.github/workflows/deploy-pages.yml` 从 `docs/` 部署（push 到 `main` 时触发）。本机连 GitHub 不稳定，push 失败时跳过，稍后手动推送。
