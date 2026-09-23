#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit("usage: patch_hltb_reading_theme.py <source-index.html> <target-index.html>")

src = Path(sys.argv[1])
dst = Path(sys.argv[2])
html = src.read_text(encoding="utf-8")

CSS_MARK = "/* HLTB_READING_THEME_V1 */"

css = r'''
/* HLTB_READING_THEME_V1 */
:root{
  --bg:#eee7da;
  --bg-alt:#e8dfd0;
  --bg-elv:#faf6ed;
  --bg-mute:#f0e8dc;
  --divider:#d8ccbb;
  --t1:#3d372f;
  --t2:rgba(61,55,47,.80);
  --t3:rgba(61,55,47,.58);
  --brand-1:#6e5a43;
  --brand-2:#574633;
  --brand-soft:rgba(138,112,80,.11);
  --green-1:#4f735f;
  --green-soft:rgba(79,115,95,.11);
  --yellow-1:#8a6847;
  --yellow-soft:rgba(160,116,62,.11);
  --red-1:#9b5551;
  --red-soft:rgba(155,85,81,.10);
  --gray-1:#756f66;
  --gray-soft:rgba(117,111,102,.11);
  --mark:rgba(210,177,92,.28);
  --paper:#faf6ed;
  --paper-deep:#f4eee3;
  --paper-edge:#ddd0bd;
  --reading-font:"Songti SC","STSong","SimSun","Noto Serif CJK SC","Noto Serif SC",serif;
}

[data-theme=dark]{
  --bg:#1f1d19;
  --bg-alt:#191713;
  --bg-elv:#292620;
  --bg-mute:#312d26;
  --divider:#3e3930;
  --t1:#e9e0d2;
  --t2:rgba(233,224,210,.74);
  --t3:rgba(233,224,210,.48);
  --brand-1:#c7a97d;
  --brand-2:#ddc198;
  --brand-soft:rgba(199,169,125,.13);
  --green-1:#8fb39a;
  --green-soft:rgba(143,179,154,.12);
  --yellow-1:#d0a56d;
  --yellow-soft:rgba(208,165,109,.12);
  --red-1:#d89188;
  --red-soft:rgba(216,145,136,.11);
  --gray-1:#b8b0a4;
  --gray-soft:rgba(184,176,164,.10);
  --mark:rgba(199,159,75,.25);
  --paper:#27241f;
  --paper-deep:#24211c;
  --paper-edge:#3c372f;
}

body{
  background:
    radial-gradient(circle at 18% 4%,rgba(255,255,255,.22),transparent 24%),
    radial-gradient(circle at 84% 12%,rgba(121,96,65,.07),transparent 22%),
    repeating-linear-gradient(0deg,rgba(95,76,52,.018) 0 1px,transparent 1px 4px),
    var(--bg);
}

[data-theme=dark] body{
  background:
    radial-gradient(circle at 18% 4%,rgba(255,255,255,.025),transparent 24%),
    radial-gradient(circle at 84% 12%,rgba(199,169,125,.025),transparent 22%),
    repeating-linear-gradient(0deg,rgba(255,255,255,.008) 0 1px,transparent 1px 4px),
    var(--bg);
}

.bar{
  background:color-mix(in srgb,var(--paper) 94%,transparent);
  border-bottom-color:var(--paper-edge);
  box-shadow:0 1px 0 rgba(90,70,45,.035);
  -webkit-backdrop-filter:blur(14px) saturate(105%);
  backdrop-filter:blur(14px) saturate(105%);
}

.toc{
  background:color-mix(in srgb,var(--paper-deep) 96%,transparent);
  border-right-color:var(--paper-edge);
}

main{
  background:
    linear-gradient(rgba(255,255,255,.12),rgba(255,255,255,0) 120px),
    var(--paper);
  border-left:1px solid var(--paper-edge);
  border-right:1px solid var(--paper-edge);
  box-shadow:
    0 18px 55px rgba(79,58,35,.08),
    inset 0 1px 0 rgba(255,255,255,.36);
}

[data-theme=dark] main{
  background:
    linear-gradient(rgba(255,255,255,.018),rgba(255,255,255,0) 120px),
    var(--paper);
  box-shadow:
    0 18px 55px rgba(0,0,0,.16),
    inset 0 1px 0 rgba(255,255,255,.025);
}

.sec-h{
  border-bottom:1px solid var(--paper-edge);
}
.sec-h h2{
  color:var(--t1);
  letter-spacing:.01em;
}

.intro,
.plain,
.fields,
.src .sbody{
  font-family:var(--reading-font);
}

.intro{
  font-size:15px;
  line-height:1.95;
  color:var(--t2);
  border-left:2px solid rgba(110,90,67,.28);
  padding-left:14px;
}

.card{
  background:rgba(255,252,245,.62);
  border:1px solid rgba(173,153,126,.30);
  border-radius:9px;
  box-shadow:
    0 1px 0 rgba(255,255,255,.55),
    0 6px 18px rgba(80,61,40,.035);
}

[data-theme=dark] .card{
  background:rgba(45,42,35,.68);
  border-color:rgba(199,169,125,.12);
  box-shadow:
    0 1px 0 rgba(255,255,255,.018),
    0 5px 16px rgba(0,0,0,.08);
}

.chead h3{
  font-size:17px;
  line-height:1.62;
  color:var(--t1);
}

.num{
  background:rgba(130,105,76,.08);
  color:var(--t3);
  border:1px solid rgba(130,105,76,.08);
}

.plain{
  background:rgba(180,151,111,.085);
  border-left:3px solid rgba(110,90,67,.55);
  color:var(--t1);
  font-size:16px;
  line-height:1.95;
  letter-spacing:.015em;
  padding:12px 15px;
}

[data-theme=dark] .plain{
  background:rgba(199,169,125,.075);
  border-left-color:rgba(199,169,125,.52);
}

.f{
  font-family:var(--reading-font);
  font-size:14.5px;
  line-height:1.9;
}
.f b{
  font-family:var(--font);
  letter-spacing:.02em;
}
.src .sbody{
  font-size:13px;
  line-height:1.9;
}

.search input,
.btn,
.jump{
  background:rgba(255,252,245,.62);
  border-color:rgba(145,124,96,.22);
}

[data-theme=dark] .search input,
[data-theme=dark] .btn,
[data-theme=dark] .jump{
  background:rgba(45,42,35,.72);
  border-color:rgba(199,169,125,.14);
}

mark{
  background:rgba(219,185,91,.30);
  box-shadow:inset 0 -.05em 0 rgba(178,135,44,.12);
}

.toc a.active,
.toc .grp.has-active>.gt{
  background:rgba(129,105,75,.10);
  color:var(--brand-1);
}

footer{
  border-top-color:var(--paper-edge);
}

@media (max-width:1080px){
  main{
    border-left:0;
    border-right:0;
    box-shadow:none;
  }
}

@media (max-width:820px){
  body{
    background:var(--paper);
  }
  main{
    background:var(--paper);
    box-shadow:none;
  }
  .card{
    border-radius:8px;
    box-shadow:none;
  }
  .chead h3{
    font-size:16px;
    line-height:1.66;
  }
  .plain{
    font-size:16px;
    line-height:1.92;
  }
  .intro{
    font-size:14.5px;
    line-height:1.9;
  }
  .f{
    font-size:14px;
    line-height:1.88;
  }
}

@media (prefers-contrast:more){
  :root{
    --t1:#2f2a24;
    --t2:rgba(47,42,36,.86);
    --divider:#cbbda9;
  }
  [data-theme=dark]{
    --t1:#f3eadc;
    --t2:rgba(243,234,220,.82);
    --divider:#514a3f;
  }
}
'''

if CSS_MARK not in html:
    if "</style>" not in html:
        raise SystemExit("cannot patch reading theme: </style> not found")
    html = html.replace("</style>", css + "\n</style>", 1)

dst.parent.mkdir(parents=True, exist_ok=True)
dst.write_text(html, encoding="utf-8")
