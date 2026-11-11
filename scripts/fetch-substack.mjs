#!/usr/bin/env node
/**
 * 抓取一篇 Substack 文章（公开 API），落地到 _work/{slug}/ 供编辑使用。
 *
 * 用法：
 *   node scripts/fetch-substack.mjs "<substack 文章链接>" [--slug=语义化-slug]
 *
 * 产出：
 *   _work/{slug}/post.json          Substack API 原始响应
 *   _work/{slug}/article.md         正文纯文本（保留标题/列表/引用结构）
 *   _work/{slug}/article.zh-hans.md 繁转简版本（仅供编辑参考，发布前仍需人工通读）
 *   docs/assets/{slug}/cover.*      封面图（有则下载）
 *
 * 网络：国内直连 substack.com 会超时。优先读取 HTTPS_PROXY / https_proxy，
 * 否则在 macOS 上自动读取系统代理（scutil --proxy）。
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function die(msg) {
  console.error(`[fetch-substack] ${msg}`);
  process.exit(1);
}

export function parseSubstackUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  // App 分享链接：substack.com/@user/note/p-197237903、substack.com/home/post/p-197237903
  const byId = u.pathname.match(/\/p-(\d+)(?:$|[/?#])/);
  if (byId) return { postId: byId[1] };
  const m = u.pathname.match(/^\/p\/([^/?#]+)/);
  if (!m) return null;
  return {
    host: u.hostname,
    postSlug: m[1],
    publication: u.hostname.endsWith('.substack.com') ? u.hostname.replace('.substack.com', '') : u.hostname,
    canonical: `https://${u.hostname}/p/${m[1]}`,
  };
}

function detectProxy() {
  const env = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.ALL_PROXY || process.env.all_proxy;
  if (env) return env;
  if (process.platform !== 'darwin') return null;
  try {
    const out = execFileSync('scutil', ['--proxy'], { encoding: 'utf8' });
    const enabled = /HTTPSEnable\s*:\s*1/.test(out);
    const host = out.match(/HTTPSProxy\s*:\s*(\S+)/)?.[1];
    const port = out.match(/HTTPSPort\s*:\s*(\d+)/)?.[1];
    if (enabled && host && port) return `http://${host}:${port}`;
  } catch {
    /* ignore */
  }
  return null;
}

function curl(url, { output, proxy } = {}) {
  const args = ['-sSL', '-m', '40', '-A', 'Mozilla/5.0 (Macintosh) substack-notes/1.0'];
  if (proxy) args.push('-x', proxy);
  if (output) args.push('-o', output);
  args.push(url);
  return execFileSync('curl', args, { encoding: output ? undefined : 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

/** macOS 下用 sips 压缩：宽度上限 1600；封面转 JPEG（原图常为数 MB 的 PNG） */
function optimizeImage(file, { toJpeg = false } = {}) {
  if (process.platform !== 'darwin') return file;
  try {
    const w = Number(execFileSync('sips', ['-g', 'pixelWidth', file], { encoding: 'utf8' }).match(/pixelWidth:\s*(\d+)/)?.[1]);
    if (w > 1600) execFileSync('sips', ['-Z', '1600', file], { stdio: 'ignore' });
    if (toJpeg && !/\.jpe?g$/i.test(file)) {
      const out = file.replace(/\.\w+$/, '.jpg');
      execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '80', file, '--out', out], { stdio: 'ignore' });
      fs.rmSync(file);
      return out;
    }
  } catch {
    /* 保留原图 */
  }
  return file;
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };
function decode(s) {
  return s
    .replace(/&#x([\da-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z#\d]+);/gi, (m, k) => ENTITIES[k] ?? m);
}

/** Substack body_html → 带结构的纯文本 */
export function htmlToText(html) {
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<figure[\s\S]*?<\/figure>/gi, '\n[图片]\n')
    .replace(/<div class="subscription-widget[\s\S]*?<\/div>\s*<\/div>/gi, '')
    .replace(/<h([1-6])[^>]*>/gi, (_, n) => `\n\n${'#'.repeat(Number(n))} `)
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<blockquote[^>]*>/gi, '\n> ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|ul|ol|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  s = decode(s);
  return s
    .split('\n')
    .map((l) => l.trim())
    .filter((l, i, arr) => l || (arr[i - 1] && arr[i - 1].trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function toSimplified(text) {
  try {
    const OpenCC = await import('opencc-js');
    const conv = OpenCC.Converter({ from: 'tw', to: 'cn' });
    return conv(text);
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const url = args.find((a) => !a.startsWith('--'));
  if (!url) die('缺少文章链接。用法：node scripts/fetch-substack.mjs "<url>" [--slug=xxx]');
  let info = parseSubstackUrl(url);
  if (!info) die(`不是 Substack 文章链接（需要 /p/<slug> 或 /p-<id> 路径）：${url}`);

  const proxy = detectProxy();
  const api = info.postId
    ? `https://substack.com/api/v1/posts/by-id/${info.postId}`
    : `https://${info.host}/api/v1/posts/${info.postSlug}`;
  console.error(`[fetch-substack] GET ${api}${proxy ? `  (proxy ${proxy})` : ''}`);

  let post;
  try {
    post = JSON.parse(curl(api, { proxy }));
  } catch (err) {
    die(`抓取失败：${err.message.split('\n')[0]}。国内网络请确认代理可用。`);
  }
  if (info.postId) {
    post = post?.post;
    if (!post?.canonical_url) die(`按 ID ${info.postId} 未找到文章。`);
    info = parseSubstackUrl(post.canonical_url);
  }
  const slug = args.find((a) => a.startsWith('--slug='))?.split('=')[1] || info.postSlug;
  if (!post?.body_html) die('API 未返回 body_html（可能是付费文章或链接失效）。');

  const workDir = path.join(ROOT, '_work', slug);
  fs.mkdirSync(workDir, { recursive: true });
  fs.writeFileSync(path.join(workDir, 'post.json'), JSON.stringify(post, null, 2));

  const header = [
    `# ${post.title}`,
    post.subtitle ? `> ${post.subtitle}` : '',
    `作者：${(post.publishedBylines || []).map((b) => b.name).join(', ')}`,
    `发布：${post.post_date?.slice(0, 10)}  字数：${post.wordcount}  链接：${info.canonical}`,
    '',
  ].join('\n');
  const text = `${header}\n${htmlToText(post.body_html)}\n`;
  fs.writeFileSync(path.join(workDir, 'article.md'), text);
  const simplified = await toSimplified(text);
  if (simplified) fs.writeFileSync(path.join(workDir, 'article.zh-hans.md'), simplified);

  const assetDir = path.join(ROOT, 'docs', 'assets', slug);
  const download = (src, base, { toJpeg = false } = {}) => {
    const ext = (src.match(/\.(png|jpe?g|webp|gif)(?:$|\?)/i)?.[1] || 'jpg').toLowerCase();
    fs.mkdirSync(assetDir, { recursive: true });
    let file = path.join(assetDir, `${base}.${ext}`);
    try {
      curl(src, { output: file, proxy });
    } catch {
      return null;
    }
    file = optimizeImage(file, { toJpeg });
    return path.relative(path.join(ROOT, 'docs'), file);
  };

  const cover = post.cover_image ? download(post.cover_image, 'cover', { toJpeg: true }) : null;

  // 正文内嵌图：取 Substack 原图（s3 原始地址），按出现顺序命名 fig-01、fig-02…
  const figures = [];
  const figRe = /<figure[\s\S]*?<\/figure>/gi;
  for (const block of post.body_html.match(figRe) || []) {
    const href = block.match(/href="([^"]+)"/)?.[1] || block.match(/<img[^>]+src="([^"]+)"/)?.[1];
    if (!href) continue;
    const s3 = decodeURIComponent(href).match(/https:\/\/substack-post-media\.s3\.amazonaws\.com\/[^\s"]+/)?.[0];
    const caption = decode(block.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/)?.[1]?.replace(/<[^>]+>/g, '') || '');
    const local = download(s3 || decode(href), `fig-${String(figures.length + 1).padStart(2, '0')}`);
    if (local) figures.push({ src: local, caption });
  }

  console.log(
    JSON.stringify(
      {
        slug,
        url: info.canonical,
        publication: info.publication,
        title: post.title,
        subtitle: post.subtitle,
        author: (post.publishedBylines || []).map((b) => b.name).join(', '),
        post_date: post.post_date?.slice(0, 10),
        wordcount: post.wordcount,
        audience: post.audience,
        cover,
        figures,
        work_dir: path.relative(ROOT, workDir),
      },
      null,
      2,
    ),
  );
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) main();
