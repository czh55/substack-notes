#!/usr/bin/env node
/**
 * 由 content/{slug}.mjs 生成双轨产物并更新索引：
 *   docs/{slug}-精读笔记.html
 *   docs/{slug}-理性分析.svg
 *   docs/index.json（按 slug upsert，按 date 倒序）
 *
 * 用法：node scripts/build.mjs <slug> [--html-only|--svg-only]
 *       node scripts/build.mjs --all
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { buildSvg } from '../svg-auto-height.mjs';
import { renderReadingHtml } from './lib/render-reading-html.mjs';
import { SVG_BASE_CSS } from './lib/svg-style.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs');
const INDEX = path.join(DOCS, 'index.json');

async function buildOne(slug, { html = true, svg = true } = {}) {
  const file = path.join(ROOT, 'content', `${slug}.mjs`);
  if (!fs.existsSync(file)) throw new Error(`找不到 ${path.relative(ROOT, file)}`);
  const { meta, reading, analysis } = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
  if (meta.slug !== slug) throw new Error(`meta.slug (${meta.slug}) 与文件名不一致`);

  const outputs = { html: `${slug}-精读笔记.html`, svg: `${slug}-理性分析.svg` };
  let svgHeight = null;

  if (html) {
    fs.writeFileSync(path.join(DOCS, outputs.html), renderReadingHtml(meta, reading), 'utf8');
    console.log('HTML:', outputs.html);
  }
  if (svg) {
    const body = `<div class="root">${analysis.body}</div>`;
    const res = await buildSvg({ css: SVG_BASE_CSS + (analysis.css || ''), body, width: 1320 });
    fs.writeFileSync(path.join(DOCS, outputs.svg), res.svg, 'utf8');
    svgHeight = res.height;
    console.log('SVG :', outputs.svg, 'height', svgHeight);
  }

  const index = fs.existsSync(INDEX) ? JSON.parse(fs.readFileSync(INDEX, 'utf8')) : [];
  const prev = index.find((e) => e.slug === slug);
  const entry = {
    date: meta.date,
    title: meta.title,
    original_title: meta.originalTitle,
    summary: meta.summary,
    author: meta.author,
    publication: meta.publication,
    publication_name: meta.publicationName,
    url: meta.url,
    post_date: meta.postDate,
    wordcount: meta.wordcount,
    primary: meta.primary,
    tags: meta.tags,
    cover: meta.cover || null,
    outputs,
    svg_height: svgHeight ?? prev?.svg_height ?? null,
    slug,
  };
  const next = [entry, ...index.filter((e) => e.slug !== slug)].sort((a, b) =>
    a.date === b.date ? 0 : a.date < b.date ? 1 : -1,
  );
  fs.writeFileSync(INDEX, JSON.stringify(next, null, 2) + '\n', 'utf8');
  console.log('index.json:', next.length, '条');
}

const args = process.argv.slice(2);
const opts = { html: !args.includes('--svg-only'), svg: !args.includes('--html-only') };
const slugs = args.includes('--all')
  ? fs.readdirSync(path.join(ROOT, 'content')).filter((f) => f.endsWith('.mjs')).map((f) => f.replace(/\.mjs$/, ''))
  : args.filter((a) => !a.startsWith('--'));
if (!slugs.length) {
  console.error('用法：node scripts/build.mjs <slug> | --all');
  process.exit(1);
}
for (const s of slugs) await buildOne(s, opts);
