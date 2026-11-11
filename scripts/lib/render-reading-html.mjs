/**
 * 「精读笔记」HTML 渲染器：按原文章节顺序复述，配原图、短引文与参考来源。
 * 内容由 content/{slug}.mjs 的 `reading` 字段提供，见 docs/WORKFLOW.md「Step 4」。
 */

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CSS = `
*{box-sizing:border-box}html{scroll-behavior:smooth}
:root{--ink:#1d2733;--ink-2:#46505c;--ink-3:#7a8490;--paper:#f3f5f7;--sheet:#ffffff;--line:#dfe4ea;
--accent:#ff6719;--accent-soft:#fff1e8;--teal:#0f766e;--teal-soft:#e6f4f1;
--serif:"Noto Serif SC","Songti SC","STSong",serif;--sans:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif}
body{margin:0;font-family:var(--sans);line-height:1.85;color:var(--ink);
background:var(--paper) radial-gradient(circle at 1px 1px,rgba(29,39,51,.07) 1px,transparent 0) 0 0/22px 22px}
a{color:var(--teal)}
.wrap{width:min(860px,100%);margin:0 auto;padding:40px 28px 96px}
.crumbs{display:flex;justify-content:space-between;gap:12px;font-size:14px;margin-bottom:28px}
.crumbs a{text-decoration:none;color:var(--ink-2)}.crumbs a:hover{color:var(--accent)}
header .pub{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);font-weight:700}
header h1{font-family:var(--serif);font-size:38px;line-height:1.3;margin:10px 0 10px;font-weight:900}
header .orig{color:var(--ink-3);font-size:15px;margin:0 0 18px}
.meta{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:14px;color:var(--ink-2);padding:14px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.meta b{color:var(--ink);font-weight:600}
.tags{margin:16px 0 0;display:flex;gap:8px;flex-wrap:wrap}
.tags span{font-size:12px;padding:3px 10px;border-radius:6px;background:var(--teal-soft);color:var(--teal);font-weight:600}
.cover{margin:28px -28px 8px;overflow:hidden}
.cover img{display:block;width:100%;height:auto;animation:settle 1.2s cubic-bezier(.2,.7,.2,1) both}
@keyframes settle{from{transform:scale(1.04);opacity:0}to{transform:none;opacity:1}}
.lede{font-family:var(--serif);font-size:19px;line-height:1.9;margin:28px 0 8px;color:var(--ink)}
.toc{margin:32px 0;padding:18px 0;border-top:2px solid var(--ink)}
.toc h2{font-size:13px;letter-spacing:.14em;color:var(--ink-3);margin:0 0 10px;font-weight:700}
.toc ol{list-style:none;margin:0;padding:0;counter-reset:t}
.toc li{display:grid;grid-template-columns:44px 1fr;gap:8px;padding:10px 0;border-bottom:1px dashed var(--line)}
.toc li .no{font-family:var(--serif);color:var(--accent);font-weight:700}
.toc li a{color:var(--ink);text-decoration:none;font-weight:600}.toc li a:hover{color:var(--accent)}
.toc li p{grid-column:2;margin:2px 0 0;font-size:14px;color:var(--ink-2);line-height:1.7}
.takeaway{background:var(--sheet);border-left:4px solid var(--accent);padding:16px 20px;margin:20px 0 0;border-radius:0 10px 10px 0}
.takeaway strong{display:block;color:var(--accent);font-size:14px;margin-bottom:4px}
.takeaway p{margin:0}
section.chap{margin:64px 0 0;opacity:0;transform:translateY(18px);transition:opacity .7s ease,transform .7s ease}
section.chap.in{opacity:1;transform:none}
.chap .no{font-family:var(--serif);font-size:14px;color:var(--accent);font-weight:700;letter-spacing:.08em}
.chap h2{font-family:var(--serif);font-size:27px;line-height:1.4;margin:6px 0 4px}
.chap .orig-h{font-size:13px;color:var(--ink-3);margin:0 0 18px}
.chap p{margin:0 0 14px;color:var(--ink-2);font-size:17px}
.chap ul,.chap ol{color:var(--ink-2);font-size:17px;padding-left:1.4em;margin:0 0 14px}
.chap li{margin:4px 0}
blockquote{margin:22px 0;padding:4px 0 4px 20px;border-left:3px solid var(--teal);font-family:var(--serif);font-size:18px;color:var(--ink);line-height:1.8}
blockquote small{display:block;font-family:var(--sans);font-size:12px;color:var(--ink-3);margin-top:6px}
.note{background:var(--teal-soft);color:#134e4a;font-size:15px;padding:12px 16px;border-radius:10px;margin:18px 0}
.note b{color:var(--teal)}
figure{margin:28px 0;background:var(--sheet);border:1px solid var(--line);border-radius:12px;overflow:hidden}
figure img{display:block;max-width:100%;height:auto;margin:0 auto}
figcaption{padding:12px 16px;font-size:14px;color:var(--ink-2);border-top:1px solid var(--line)}
.refs,.comments{margin-top:72px}
.refs h2,.comments h2{font-family:var(--serif);font-size:22px;margin:0 0 12px}
.refs ol{padding-left:1.4em;color:var(--ink-2);font-size:14px}
.comment{padding:14px 0;border-bottom:1px solid var(--line)}
.comment .who{font-size:13px;color:var(--ink-3)}
.comment p{margin:4px 0 0;color:var(--ink-2);font-size:15px}
.next{margin-top:64px;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:22px 24px;border-radius:12px;
background:linear-gradient(120deg,#1d2733,#2c3a48);color:#fff;text-decoration:none;transition:transform .25s ease}
.next:hover{transform:translateY(-3px)}
.next span{font-size:14px;opacity:.75}.next strong{font-family:var(--serif);font-size:20px}
.next em{font-style:normal;font-size:26px;color:var(--accent)}
footer{margin-top:40px;font-size:13px;color:var(--ink-3);line-height:1.7}
@media(max-width:640px){.wrap{padding:24px 18px 72px}header h1{font-size:28px}.cover{margin:24px -18px 8px}
.lede{font-size:17px}.chap h2{font-size:23px}.chap p,.chap ul,.chap ol{font-size:16px}}
@media(prefers-reduced-motion:reduce){section.chap{opacity:1;transform:none;transition:none}.cover img{animation:none}}
`;

const REVEAL_JS = `
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -10% 0px'});
document.querySelectorAll('section.chap').forEach(s=>io.observe(s));
`;

function renderBlock(b) {
  if (typeof b === 'string') return `<p>${b}</p>`;
  switch (b.type) {
    case 'quote':
      return `<blockquote>${esc(b.text)}${b.note ? `<small>${esc(b.note)}</small>` : ''}</blockquote>`;
    case 'list':
      return `<${b.ordered ? 'ol' : 'ul'}>${b.items.map((i) => `<li>${i}</li>`).join('')}</${b.ordered ? 'ol' : 'ul'}>`;
    case 'note':
      return `<div class="note"><b>${esc(b.label || '批注')}：</b>${b.html}</div>`;
    case 'figure':
      return `<figure><img src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy"><figcaption>${b.caption}</figcaption></figure>`;
    default:
      return '';
  }
}

export function renderReadingHtml(meta, reading) {
  const svgFile = `${meta.slug}-理性分析.svg`;
  const toc = reading.sections
    .map(
      (s, i) =>
        `<li><span class="no">§${i + 1}</span><a href="#${s.id}">${esc(s.title)}</a><p>${esc(s.gist)}</p></li>`,
    )
    .join('');
  const chapters = reading.sections
    .map(
      (s, i) => `<section class="chap" id="${s.id}">
<div class="no">§${i + 1}</div>
<h2>${esc(s.title)}</h2>
${s.originalHeading ? `<p class="orig-h">原文小标题：${esc(s.originalHeading)}</p>` : ''}
${s.figure ? renderBlock({ type: 'figure', ...s.figure }) : ''}
${s.blocks.map(renderBlock).join('\n')}
</section>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="description" content="${esc(meta.summary)}">
<title>${esc(meta.title)}｜精读笔记</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@600;900&display=swap">
<style>${CSS}</style>
</head>
<body>
<main class="wrap">
<nav class="crumbs"><a href="index.html">← Substack 札记</a><a href="${esc(svgFile)}">理性分析长图 →</a></nav>
<header>
<div class="pub">${esc(meta.publicationName)} · Substack</div>
<h1>${esc(meta.title)}</h1>
<p class="orig">原标题：${esc(meta.originalTitle)}</p>
<div class="meta"><span>作者 <b>${esc(meta.author)}</b></span><span>发布 <b>${esc(meta.postDate)}</b></span><span>原文 <b>${esc(String(meta.wordcount))} 字</b></span><span>收录 <b>${esc(meta.date)}</b></span><a href="${esc(meta.url)}" target="_blank" rel="noopener">阅读原文 ↗</a></div>
<div class="tags">${meta.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
</header>
${meta.cover ? `<div class="cover"><img src="${esc(meta.cover)}" alt="${esc(reading.coverAlt || meta.title)}"></div>` : ''}
<p class="lede">${reading.lede}</p>
<div class="takeaway"><strong>一句话带走</strong><p>${reading.takeaway}</p></div>
<nav class="toc"><h2>文章结构</h2><ol>${toc}</ol></nav>
<article>
${chapters}
</article>
${reading.references?.length ? `<section class="refs"><h2>原文注释与来源</h2><ol>${reading.references.map((r) => `<li>${r}</li>`).join('')}</ol></section>` : ''}
${reading.comments?.length ? `<section class="comments"><h2>评论区摘录</h2>${reading.comments.map((c) => `<div class="comment"><div class="who">${esc(c.author)} · ${esc(c.date)}</div><p>${c.text}</p></div>`).join('')}</section>` : ''}
<a class="next" href="${esc(svgFile)}"><div><span>换一种读法</span><br><strong>理性分析：关系图、对比表、避坑与行动清单</strong></div><em>→</em></a>
<footer>本页为个人学习笔记：按原文结构用简体中文复述，引文为短句摘录并已由繁体转为简体，版权归原作者所有。完整内容请阅读 <a href="${esc(meta.url)}" target="_blank" rel="noopener">原文</a>。</footer>
</main>
<script>${REVEAL_JS}</script>
</body>
</html>
`;
}
