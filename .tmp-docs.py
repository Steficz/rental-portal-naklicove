import io

def sub(path, old, new):
    r = io.open(path, encoding="utf-8").read()
    assert old in r, (path, old[:40])
    io.open(path, "w", encoding="utf-8").write(r.replace(old, new))
    print("ok", path)

sub("README.md",
"""│   └── legal/<web>/          # právní dokumenty per subweb (6 souborů);
│                             #   landing (root) má jen ochrana-osobnich-udaju + cookies""",
"""│   └── legal/
│       ├── spolecne/         # cookies.md + ochrana-osobnich-udaju.md — JEDNO znění pro celý portál
│       └── <subweb>/         # obchodni-podminky, povinne-informace, odstoupeni, reklamace —
│                             #   vlastní text per subweb (každý má jiného provozovatele)""")

sub("README.md",
"""Každý subweb má vlastní právní balíček (včetně Obchodních podmínek) — landing page
v patičce nabízí jen Ochranu osobních údajů a Cookies, OC patří na subweby.""",
"""GDPR a Cookies jsou **jeden společný dokument** pro celý portál (`content/legal/spolecne/`),
Obchodní podmínky + povinné informace + odstoupení + reklamace jsou **vlastní per subweb**.
Landing v patičce nabízí jen ochranu údajů a cookies; OC patří na subweby.""")

sub("docs/obsah-workflow.md",
"""- `content/legal/<web>/` — právní dokumenty **per subweb**:
  - `3dtisk/ voziky/ zkusebny/ dodavky/ hospoda/` — kompletní balíček:
    povinne-informace, obchodni-podminky, ochrana-osobnich-udaju, cookies, odstoupeni, reklamace
  - `root/` (landing) — jen ochrana-osobnich-udaju + cookies (OC nepatri na subweby)""",
"""- `content/legal/spolecne/` — **cookies + ochrana osobních údajů**: jedno znění,
  nasazuje se na všechny weby (změníš-li tady, změní se to všude najednou)
- `content/legal/<subweb>/` — **obchodní podmínky, povinné informace, odstoupení,
  reklamace** vlastní text pro každý subweb (3dtisk, voziky, zkusebny, dodavky, hospoda)""")
