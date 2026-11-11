# substack-notes

日常 Substack 阅读积累：文章链接 → 抓取原文 → **HTML 精读笔记 + SVG 理性分析** → GitHub Pages。

结构沿用 `video-notes` 的双轨思路：

- **HTML 精读笔记**：按原文章节顺序用简体中文复述，保留原图、短引文、注释来源和评论区摘录
- **SVG 理性分析**：用关系图、概念卡、方法表、选型 / 对比表、避坑清单和行动清单重组观点，标出适用边界

## 结构

```
substack-notes/
├── svg-auto-height.mjs          # SVG 自动测高（Chrome 无头）与 XML 修复
├── content/<slug>.mjs           # 每篇文章的编辑内容（meta + reading + analysis）
├── scripts/
│   ├── fetch-substack.mjs       # 抓取原文 → _work/<slug>/，下载封面与内嵌图
│   ├── build.mjs                # 生成 HTML + SVG，更新 docs/index.json
│   ├── check-simplified.mjs     # 检查繁体残留
│   └── lib/                     # HTML 渲染器、SVG 基础样式
├── docs/
│   ├── WORKFLOW.md              # 执行规范（权威）
│   ├── index.html               # GitHub Pages 首页
│   ├── index.json               # 文章索引
│   ├── assets/<slug>/           # 封面与原文配图
│   ├── *-精读笔记.html
│   └── *-理性分析.svg
└── _work/                       # 抓取的原文（不提交）
```

## 新增一篇

```bash
npm install                                                    # 首次
node scripts/fetch-substack.mjs "<substack 链接>" --slug=topic-slug
# 通读 _work/topic-slug/article.md，编写 content/topic-slug.mjs
node scripts/build.mjs topic-slug
node scripts/check-simplified.mjs topic-slug
npm run serve                                                  # http://127.0.0.1:8765
```

## 已收录

| 收录 | 文章 | 来源 |
|------|------|------|
| 2026-11-11 | [信息过载时，怎么快速学会一个新领域](docs/learn-new-field-amid-info-overload-精读笔记.html) | Use Your Brain CHN · Priscilla Hsu |

## 依赖

- Node.js 22+（测高用到内置 WebSocket；本机 v26）
- `curl`，国内网络需要代理（自动读取系统代理）
- Google Chrome（SVG 测高；没有时回退到估算）
- macOS `sips`（压缩图片，可选）

详见 `docs/WORKFLOW.md`。
