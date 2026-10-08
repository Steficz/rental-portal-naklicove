# naklicove.cz — portální monorepo

Rozcestník **naklicove.cz** a jeho subweby. Bez CMS: veškerý text žije v `content/**.md`,
úprava obsahu = commit na `main` → Cloudflare Pages sám nasadí.
Jednotný design „styl C" (brutalismus, JetBrains Mono), subweby se liší jen akcentní barvou.

Lokace: **Ke Klíčovu 263/8, Praha 9** (odkaz v patičce každého webu směřuje na Google Maps).
Provozovatelé: `packages/shared/src/legal.js` + texty v `content/legal/<web>/`.
GDPR a Cookies jsou **jeden společný dokument** pro celý portál (`content/legal/spolecne/`),
Obchodní podmínky + povinné informace + odstoupení + reklamace jsou **vlastní per subweb**.
Landing v patičce nabízí jen ochranu údajů a cookies; OC patří na subweby.

## Weby (6)

| Subdoména | Adresář | CF Pages projekt | Stav |
|---|---|---|---|
| naklicove.cz | `sites/root` | `nk-landing` | live rozcestník, 5 dlaždic |
| 3dtisk.naklicove.cz | `sites/3dtisk` | `nk-3dtisk` | plný web + /cenik + /poptavka |
| voziky.naklicove.cz | `sites/voziky` | `nk-voziky` | brzy otevřeno |
| dodavky.naklicove.cz | `sites/dodavky` | `nk-dodavky` | brzy otevřeno, flotila inline |
| zkusebny.naklicove.cz | `sites/zkusebny` | `nk-zkusebny` | brzy otevřeno |
| hospoda.naklicove.cz | `sites/hospoda` | `nk-hospoda` | brzy otevřeno |

## Struktura

```
├── packages/shared/          # Layout, Card, CookieBar (opt-in §89 ZEK), tokens.css, legal.js
├── content/
│   ├── landing/              # uvod.md + sluzby/*.md (1 soubor = 1 dlaždice)
│   ├── 3dtisk/               # domov.md + cenik.md (strojová data kalkulátoru i ceníku)
│   └── legal/
│       ├── spolecne/         # cookies.md + ochrana-osobnich-udaju.md — JEDNO znění pro celý portál
│       └── <subweb>/         # obchodni-podminky, povinne-informace, odstoupeni, reklamace —
│                             #   vlastní text per subweb (každý má jiného provozovatele)
├── sites/<web>/              # Astro 5; přidat web = nakopírovat adresář + Pages projekt
├── tools/check-content.mjs   # CI validace frontmatteru a odkazů
├── docs/                     # architektura v1/v2, obsah-workflow
└── .github/workflows/ci.yml  # build+check na každém pushi (deploy dělá Cloudflare)
```

## Lokální vývoj

```bash
nvm use            # Node 22 (viz .nvmrc), packageManager: pnpm@9
pnpm install
pnpm dev                          # jen rozcestník
pnpm -r build                     # všech 6 webů do sites/*/dist
pnpm check                        # validace obsahu
```

## Úprava textů

Viz [docs/obsah-workflow.md](docs/obsah-workflow.md). Zkráceně: uprav `.md` v `content/`,
pošli PR (Cloudflare dá preview URL), po mergi na main se nasadí samo.
Ceny 3D tisku se mění **jen** v `content/3dtisk/cenik.md` (frontmatter), nikdy v kódu.

## Nová služba na rozcestníku

1. `.md` soubor do `content/landing/sluzby/` (frontmatter: title, description, href, accent, label)
2. id přidat do `order` a ikonu do `icons` v `sites/root/src/pages/index.astro`
3. volitelně nový `sites/<web>/` pro subweb + Pages projekt (build/deploy commands níže)
4. aktualizovat tento README (tabulka webů + struktura) — **pravidlo: každá změna struktury = update README**

## Deploy — Cloudflare Pages + GitHub Actions

Projekty `nk-landing`, `nk-3dtisk`, `nk-voziky`, `nk-dodavky`, `nk-zkusebny`, `nk-hospoda`
(účet honzic...) běží jako **Direct upload** a nasazuje je
`.github/workflows/deploy.yml` přes wrangler při každém pushi na main.

Podmínka v GitHub → Settings → Secrets and variables → Actions:
- `CF_API_TOKEN` (Cloudflare Pages: Edit)
- `CF_ACCOUNT_ID` (7ee21d5c… — viz dashboard URL)

Build lokálně: `pnpm --filter @nk/<adresář> build` → `sites/<adresář>/dist`.
Custom domény (naklicove.cz a subdomény) se claimsnou v Projects → Custom domains
až bude doména registrovaná a na DNS Cloudflare.

## Plánované (neděláno)

- Kalkulátor STL nabalený na /poptavka (úloha T3: `tasks/T3-stl-kalkulacka.md`)
- API pro poptávky/rezervace + Google Calendar sync (VPS fáze 2 — viz docs/architecture-v2.md)
- Právní texty od praxe (T5), doplň `legal.js` placeholdery
