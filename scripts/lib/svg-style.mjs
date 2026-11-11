/**
 * 「理性分析」SVG 的基础样式。content/{slug}.mjs 可通过 `analysis.css` 追加样式。
 * foreignObject 内由浏览器渲染；宽度固定 1320，高度由 svg-auto-height.mjs 实测。
 */
export const SVG_BASE_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
.root{font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;color:#1d2733;padding:52px 64px 40px;
background:#f3f5f7 radial-gradient(circle at 1px 1px,rgba(29,39,51,.06) 1px,transparent 0) 0 0/22px 22px}
.pub{font-size:14px;letter-spacing:.14em;color:#ff6719;font-weight:800}
h1{font-family:"Noto Serif SC","Songti SC",serif;font-size:42px;line-height:1.3;font-weight:900;margin:8px 0 6px;color:#1d2733}
.orig{font-size:15px;color:#7a8490;margin-bottom:14px}
.tags{margin:6px 0 18px}
.tag{display:inline-block;padding:4px 12px;border-radius:6px;font-size:13px;font-weight:700;margin:0 8px 6px 0}
.t-orange{background:#fff1e8;color:#c2410c}.t-teal{background:#e6f4f1;color:#0f766e}.t-slate{background:#e7ebf0;color:#334155}
.t-blue{background:#e0ecfb;color:#1d4ed8}.t-red{background:#fde8e8;color:#b91c1c}
.oneline{font-size:19px;line-height:1.75;background:#fff;border-left:5px solid #ff6719;padding:20px 26px;border-radius:0 14px 14px 0;margin-bottom:26px}
.oneline b{color:#c2410c}
h2{font-family:"Noto Serif SC","Songti SC",serif;font-size:27px;font-weight:900;color:#1d2733;margin:40px 0 16px;padding-left:14px;border-left:5px solid #0f766e}
h3{font-size:20px;font-weight:800;color:#1d2733;margin-bottom:10px}
p{font-size:16px;line-height:1.8;color:#46505c;margin-bottom:8px}
li{font-size:15.5px;line-height:1.8;color:#46505c;margin-bottom:4px}
ul,ol{padding-left:22px;margin:6px 0}
.map{background:#fff;border-radius:18px;padding:30px 32px;box-shadow:0 4px 24px rgba(29,39,51,.06);margin-bottom:22px}
.flow{display:flex;align-items:stretch;justify-content:space-between;gap:10px}
.node{flex:1;background:#f6f8fa;border:2px solid #cfd8e3;border-radius:14px;padding:16px 14px;text-align:center}
.node b{display:block;font-size:17px;color:#1d2733;margin-bottom:6px}
.node span{font-size:13.5px;color:#5b6672;line-height:1.6;display:block}
.node.o{background:#fff6f0;border-color:#ffb68a}.node.o b{color:#c2410c}
.node.g{background:#eef8f6;border-color:#8fd1c4}.node.g b{color:#0f766e}
.arrow{align-self:center;font-size:24px;color:#9aa5b1;font-weight:700}
.cap{font-size:14px;color:#7a8490;text-align:center;margin-top:14px}
.correct{background:#fff;border:2px dashed #ffb68a;border-radius:14px;padding:20px 24px;margin-bottom:12px}
.correct h3{color:#c2410c}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.card{background:#fff;border-radius:16px;padding:26px 28px;box-shadow:0 4px 22px rgba(29,39,51,.06);border-top:5px solid #0f766e;margin-bottom:18px}
.card.o{border-top-color:#ff6719}.card.s{border-top-color:#64748b}.card.r{border-top-color:#dc2626}.card.b{border-top-color:#2563eb}
.lbl{display:inline-block;font-size:12px;font-weight:800;letter-spacing:.06em;color:#7a8490;margin:10px 0 2px}
.quote{background:#f6f8fa;border-left:4px solid #cbd5e1;padding:10px 14px;border-radius:0 10px 10px 0;font-size:14.5px;color:#5b6672;margin:10px 0}
.do{background:#eef8f6;border-left:4px solid #0f766e;padding:10px 14px;border-radius:0 10px 10px 0;font-size:15px;color:#134e4a;margin:10px 0}
.warn{background:#fdf0f0;border-left:4px solid #dc2626;padding:10px 14px;border-radius:0 10px 10px 0;font-size:15px;color:#991b1b;margin:10px 0}
.edge{background:#fff8eb;border-left:4px solid #f59e0b;padding:10px 14px;border-radius:0 10px 10px 0;font-size:15px;color:#92400e;margin:10px 0}
.rel{font-size:14px;color:#1d4ed8;background:#eef4fd;padding:8px 12px;border-radius:8px;margin-top:8px}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 22px rgba(29,39,51,.06);margin-bottom:18px}
th{background:#1d2733;color:#fff;font-size:15px;text-align:left;padding:13px 16px;font-weight:700}
td{font-size:15px;line-height:1.7;color:#46505c;padding:13px 16px;border-bottom:1px solid #e5e9ee;vertical-align:top}
td b{color:#1d2733}
tr:nth-child(even) td{background:#fafbfc}
.lv{display:grid;grid-template-columns:56px 1fr 1.1fr;gap:0;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 22px rgba(29,39,51,.06);margin-bottom:18px}
.lv div{padding:12px 16px;border-bottom:1px solid #e5e9ee;font-size:15px;line-height:1.65;color:#46505c}
.lv .n{font-family:"Noto Serif SC",serif;font-weight:900;color:#ff6719;font-size:20px;text-align:center}
.lv .h{background:#1d2733;color:#fff;font-weight:700}
.sev{display:inline-block;font-size:12px;font-weight:800;padding:2px 8px;border-radius:5px;margin-left:8px;vertical-align:middle}
.sev.hi{background:#fde8e8;color:#b91c1c}.sev.md{background:#fff1e8;color:#c2410c}.sev.lo{background:#e7ebf0;color:#475569}
.end{background:linear-gradient(125deg,#1d2733,#2d3d4d);border-radius:20px;padding:34px 38px;margin-top:40px;color:#fff}
.end h2{color:#fff;border-left-color:#ff6719;margin-top:0}
.end h3{color:#ffb68a;margin:20px 0 8px}
.end p,.end li{color:rgba(255,255,255,.88)}
.foot{text-align:center;font-size:13px;color:#7a8490;margin-top:26px}
`;
