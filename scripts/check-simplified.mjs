#!/usr/bin/env node
/**
 * 检查已发布产物中是否残留繁体字（原标题字段除外）。
 * 用法：node scripts/check-simplified.mjs [slug ...]   不带参数则检查 index.json 全部条目
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as OpenCC from 'opencc-js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs');
const toCn = OpenCC.Converter({ from: 'tw', to: 'cn' });
// 两岸用词差异（非繁简字差异），出现在简体正文中属正常
const ALLOW = new Set(['着', '里', '台', '群', '略', '够', '缐']);

const index = JSON.parse(fs.readFileSync(path.join(DOCS, 'index.json'), 'utf8'));
const wanted = process.argv.slice(2);
const entries = wanted.length ? index.filter((e) => wanted.includes(e.slug)) : index;

let bad = 0;
for (const e of entries) {
  for (const file of Object.values(e.outputs)) {
    let text = fs
      .readFileSync(path.join(DOCS, file), 'utf8')
      .replace(/<style[\s\S]*?<\/style>/g, '')
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<[^>]+>/g, ' ');
    if (e.original_title) text = text.split(e.original_title).join(' ');
    const conv = toCn(text);
    const hits = new Map();
    for (let i = 0; i < text.length; i++) {
      if (text[i] !== conv[i] && !ALLOW.has(conv[i])) {
        const ctx = text.slice(Math.max(0, i - 8), i + 8).replace(/\s+/g, ' ');
        hits.set(text[i], ctx);
      }
    }
    if (hits.size) {
      bad += hits.size;
      console.log(`✗ ${file}`);
      for (const [ch, ctx] of hits) console.log(`   ${ch} → ${toCn(ch)}   …${ctx}…`);
    } else {
      console.log(`✓ ${file}`);
    }
  }
  if (e.summary && toCn(e.summary) !== e.summary) {
    bad++;
    console.log(`✗ index.json summary: ${e.slug}`);
  }
}
process.exit(bad ? 1 : 0);
