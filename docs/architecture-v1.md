# naklicove.cz — architektonický návrh (v1, ke odsouhlasení)

Datum: 2026-10-06 · Stav: ČEKÁ NA SCHVÁLENÍ + vstupy · Autoři: Honzicz + Hermes

## 1. Cíl a rámec

Jedna doména `naklicove.cz` jako **rozcestník** (landing page s boxy) na subdomény:

| Subdoména | Obsah | Letos |
|---|---|---|
| `naklicove.cz` | Landing page = rozcestník, 3 boxy | ✅ stavíme naplno |
| `3dtisk.naklicove.cz` | Plnohodnotný portál: tisk, modelování, pomoce s nastavením tiskárny, formulář s STL + před kalkulací ceny a času | ✅ stavíme naplno |
| `voziky.naklicove.cz` | Pronájem vozíků za auto | jen „brzy otevřeno" + box na landing |
| `zkusebny.naklicove.cz` | Pronájem 5 zkušeben | jen „brzy otevřeno" + box na landing |

**Bez CMS.** veškerý content žije v `.md` souborech v Gitu; úprava textu = úprava souboru push → CI automaticky rebuildne a nasadí.

## 2. Technologie (odůvodněně)

- **Astro 5 + TypeScript** — statické výstupy, nula JS na stránkách kromě ostrovů (formulář, kalkulátor, cookie bar). Content Collections = typované `.md` (frontmatter validovaný přes Zod) — přesně „obsah přes .md bez CMS".
- **pnpm workspaces monorepo** — 4 malé weby + sdílený balíček, jeden repozitář, jedna CI.
- **Žádný framework-heavy SSG** (Next/Nuxt) — nic nepotřebujeme ze serverového renderu; jednodušší = méně údržby.
- Kalkulátor STL běží **celý v prohlížeči** (žádný backend pro výpočet): `three.js` STLLoader + signed-tetrahedra objem → hmotnost (g/cm³ podle materiálu) → cena a čas z parametrického ceníku.
- Formulář `POST` na **Cloudflare Worker** (doporučeno): uloží STL do R2, pošle notifikaci na e-mail. Alternativa: vlastní endpoint na VPS. Výpočet ceny NIKDY neposílá soubor na server — jen metadata.

## 3. Hosting a nasazování (návrh — jedno z voleb k odsouhlasení)

**Doporučení: Cloudflare Pages** (zdarma, wildcard DNS u domény stejně pravděpodobně na CF):
- 4 Pages projekty = 4 custom domains (`naklicove.cz`, `3dtisk.…`, `voziky.…`, `zkusebny.…`), certifikáty automaticky.
- DNS: potřebujeme mít `naklicove.cz` na Cloudflare (nebo přesunout — viz vstupy Q2).

**Fallback: vlastní VPS** — nginx, 4 `server` bloky, wildcard cert přes certbot/DNS-01; build stále z GitHub Actions (rsync/scp po pushi na `main`).

**GitHub = zdroj pravdy:**
- privatní repa `naklicove/naklicove-web` (secrets jen v GH Actions vars/secrets, nikdy ne v repaři).
- `.github/workflows/deploy.yml`: push na `main` → build všech webů → deploy na cíl; PR → náhled (Preview deploy na CF, ať jde text ověřit před sloučením).
- Workflow změn textace: úprava `.md` (editace na GitHubu / lokálně) → PR → náhled → merge → automaticky živě. Žádný CMS login nikdy.

## 4. Struktura projektu (monorepo)

```
naklicove-web/
├── package.json                  # pnpm workspace root
├── pnpm-workspace.yaml
├── README.md                     # jak si to lokálně spustit a měnit texty
├── docs/
│   ├── ARCHITECTURE.md           # tohlete
│   ├── ORCHESTRATION.md          # role agentu, vstupy/vystupy, kritéria dokončení
│   └── CONTENT-WORKFLOW.md       # návod na úpravu textací (.md → PR → deploy)
├── packages/
│   └── shared/                   # sdílený UI a logika
│       ├── src/
│       │   ├── components/       # Layout, Header, Footer, Card, CookieBar, ConsentModal
│       │   ├── styles/           # design tokens (barvy, typografie) — jeden zdroj
│       │   ├── legal.js          # konstanty provozovatele (jedno místo, všude se promítne)
│       │   └── stl/              # kalkulátor: parser, volumetric, pricing
│       └── package.json
├── content/                      # VEŠKERÝ text = .md, žádné JSONy
│   ├── landing/
│   │   ├── uvod.md               # titulek + perex rozcestníku
│   │   └── sluzby/               # 1 box = 1 soubor
│   │       ├── pronajem-voziky.md
│   │       ├── zkusebny.md
│   │       └── 3dtisk.md
│   ├── 3dtisk/
│   │   ├── domov.md              # hero + přehled služeb
│   │   ├── sluzby/
│   │   │   ├── tisk-na-zakazky.md
│   │   │   ├── 3d-modelovani.md
│   │   │   └── nastaveni-tiskarny.md
│   │   ├── cenik.md              # frontmatter = strojově čitelný ceník (viz §6)
│   │   ├── faq.md
│   │   └── jak-to-probiha.md
│   ├── coming-soon/              # textace pro voziky + zkušebny
│   │   ├── voziky.md
│   │   └── zkusebny.md
│   └── legal/                    # sdílené pro všechny weby (viz §7)
│       ├── povinne-informace.md  # koho jsem — §435 OZ + kontakt
│       ├── obchodni-podminky.md
│       ├── ochrana-osobnich-udaju.md   # GDPR čl. 13/14
│       ├── cookies.md
│       ├── odstoupeni-od-smlouvy.md    # + vzorový formulář, výjimka §1837c)
│       └── reklamace.md                # + ADR/ČOI
├── sites/
│   ├── root/                     # landing — Astro
│   │   ├── astro.config.m.js     # sbírá content/landing + content/legal
│   │   └── src/pages/…
│   ├── 3dtisk/                   # plný web — Astro
│   │   └── src/pages/            # … + /poptej (formulář) jako island
│   ├── voziky/                   # jedna stránka „brzy otevřeno"
│   └── zkusebny/                 # jedna stránka „brzy otevřeno"
├── tools/
│   └── check-content.mjs         # validace frontmatteru, mrtvých odkazů — běží v CI
└── .github/workflows/
    ├── ci.yml                    # lint + build + check-content (na každém PR)
    └── deploy.yml                # main → Pages/VPS
```

## 5. Cookie bar + souhlasy (česká legislativa)

Režim od 1. 1. 2022 je **opt-in** (`§89 odst. 3 zákona č. 127/2005 Sb., ZEK`; metodika UOOU):
- Skladujeme **prokazatelně**: verze zásad + timestamp souhlasu (localStorage, případně volitelný záznam).
- Bar: 3 tlačítka — **Přijmout vše / Pouze nezbytné / Nastavení**; odmítnutí stejně snadné jako souhlas; „Nastavení" s přepínači kategorií (nezbytné = vždy, analýtika = vypnuto defaultně).
- **Doporučení: na startu žádné analytiky ani externí skripty** → web je technicky clean, cookie bar slouží jako pojistka + rozšíření později. Menší právní zátěž, nicméně bar + stránka /cookies zůstávají (uživatel to chce, a je to správně do budoucna).
- Netech. cookies/analytics se naloží až po souhlasu (konsent-gated dynamic import).

## 6. Kalkulátor pro 3D tisk (jádro portálu)

Vstup: `.stl` (limit ~50 MB), materiál (PLA/PETG…), výška vrstvy, výplň %.
Výpočet (v prohlížeči, deterministický, žádný server):
1. parse → mesh → **signed volume** (tetrahedra; kontrola manifoldnosti, u nemanifoldní síti hláška „upřesni odhad")
2. rozměry z bounding boxu → vyhodnotí, na jaké tiskárně se vejde
3. hmotnost ≈ objem × (perimetry + výplň × nastavený %) × hustota materiálu
4. čas ≈ objem / throughput profilu tiskárny + fixní overhead (ohřev, startPos)
5. cena = fix + g × sazba + volitelné příplatky (modelování, nastavení tiskárny on-site)

**Ceník = parametry, ne kód:** `content/3dtisk/cenik.md` s YAML frontmatter blokem
(`materials: [{id: pla, g_cm3: 1.245, price_per_g: …}]`, `profiles: […]`, `fix: …`).
Kalkulátor i výpisy cen na webu čtou tentýž soubor — Honzicz mění cenu úpravou .md, nikdy ne JS.
Přesnost = **orientační kalkul** (v textu formuláře explicitně: „předběžný odhad, finální cenu potvrdíme"), čímž se vyhýbáme závazné cenové nabídce ze špatného odhadu.

Formulář `POST` na Worker: jméno, kontakt, popis, STL → uložit do R2 + e-mail Honziczovi s odkazem na přílohu a metadaty z kalkulátoru. Pod formulářem GDPR informační blok: účel, právní základ (plnění smlouvy / oprávněný zájem dle situace), doba uchování, odkaz na /ochrana-osobnich-udaju, potvrzení souhlasu se zpracováním poptávky.

## 7. Legal balíček (ČR) — co vygenerujeme jako textace

| Stránka | Plní |
|---|---|
| /povinne-informace | identificace provozovatele (název, sídlo, IČO, kontakt) — §435 OZ, §1811 OZ informace před uzavřením smlouvy |
| /obchodni-podminky | pravidla poptávky → zakázky, platební/dodací podmínky 3D tisku, vlastnictví STL (uživatel odpovídá za licencnost podkladů!) |
| /odstoupeni-od-smlouvy | 14 dní §1829+; **výjimka §1837c) — zboží na přání (zakázkový 3D tisk) bez práva odstoupit**; vzorový formulář |
| /reklamace | záruka/odstoupení vad, ADR — subjekt mimosoudního řešení (ČOI), §20d z. 634/2014 |
| /ochrana-osobnich-udaju | čl. 13 GDPR: správce, účely, základy, příjemci (hosting CF, e-mail), doby, práva subjektu |
| /cookies | kategorie, opt-in vysvětlení dle ZEK §89/3, správa souhlasu |
| cookie bar | viz §5 |

⚠️ Textace = **kvalitní šablona s vyznačenými placeholdery** (`[IČO]`, `[ADRESA]`…), ne právní poradenství — finální znění si má schválit provozovatel (u zkušeben a vozíků později i živnostenský kontext).

## 8. Orchestrace výroby (více agentů, nízký tarif)

Až odsouhlásíš architekturu + doplníš vstupy, sestavím `docs/ORCHESTRATION.md` a spustím paralelní agenty (delegate_task) v okně nízkého tarifu 22:00–08:00 SGT = **16:00–02:00 CZ**; ideálně one-shot cron na 16:10 CZ:

| # | Agent | Vstup | Výstup / kritérium dokončení |
|---|---|---|---|
| A | Scaffold | tento dokument | monorepo funkční: `pnpm build` projde, 4 weby, shared UI |
| B | Landing | A + content/landing | rozcestník hotový, 3 boxy, responzivní |
| C | 3dtisk web | A + content/3dtisk | všechny stránky + formulář island |
| D | Kalkulátor | spec §6 | unit testy na objem/cenu, reálné STL vzorky |
| E | Legal + cookies | §5,§7 + Q vstupy | 6 legal stránek + cookie bar funkční (konsent gate) |
| F | CI/CD | A | ci.yml + deploy.yml, dry-run build |
| G | Content | Q vstupy | všechny .md naplněné českým textem, tón: věcný, lokální řemeslník |

Pak **integrační kolo já**: lokální build, projdu visually, fixuji, push na GitHub (potřebuji access — Q3). Předání: checklist „co si zkontrolovat" + `docs/CONTENT-WORKFLOW.md`.

## 9. Vstupy, které od tebe potřebuji (odpověz čísly)

- **Q1 Provozovatel:** jméno / firma, IČO (máš OSVČ nebo chystáš firma?), adresa pro web, telefon, e-mail pro poptávky (např. info@naklicove.cz?).
- **Q2 DNS/hosting:** kde dnes `naklicove.cz` má DNS? Souhlasíš s Cloudflare Pages (zdarma), nebo chceš VPS / jiný hosting? Existuje už somehow email na doméně?
- **Q3 GitHub:** založím repař — chceš pod svým účtem (pošli pozvánku / řekni user), nebo připravit offline a push až bude access? Je OK soukromé repa?
- **Q4 Ceník 3D tisku:** materiály (PLA/PETG?), cena za gram nebo za kus/objem, příplatky (modelování hodinovka?, nastavení tiskárny fix?), orientanční throughput tiskáren, které máš (typy) → pro časový odhad.
- **Q5 Kde fysicky** tiskneš / budeš (město) — pro texty a „osobní předání" vs. zásilkovnu?
- **Q6 Analytika:** potvrď „žádná" (doporučeno), nebo chceš soukromí-šetrnou (Plausible)?
- **Q7 Značka:** existuje logo/barvy? Nebo navrhuji jednoduchou (doporuč: jednostránková stylistika, tmavý akcent, bez loga zatím — placeholder `NK`)?
- **Q8 Boxy rozcestníku:** u vozíků a zkušeben má box odkazovat kam? ( coming-soon subdoména / mailto / jen text?)
- **Q9 Formulář STL:** limit velikosti 50 MB OK? Vytahat soubor na Worker = souhlas se zpracováním — textaci připravím, jen potvrz.

## 10. Rozhodnutí, která prosím potvrdit (slušná výchozí, ale ať je to tvůj web)

1. Stack: **Astro + pnpm monorepo, 4 samostatné statické weby** (§2, §4)
2. Hosting: **Cloudflare Pages + GH Actions** (§3) — nebo VPS
3. **Žádná analytika na startu**, cookie bar opt-in připravený (§5)
4. Kalkulátor **v prohlížeči**, ceník parametrický v `.md`, výstup = „orientační odhad" (§6)
5. `voziky`/`zkusebny` subdomény existují hned jako „brzy otevřeno" (§1)
6. Legal = šablony s placeholder y + tvé schválení (§7)

---
*Přijatelné odpovědi i ve stylu „1–5 OK, Q1: …" — pak rovnou sestavím ORCHESTRATION.md a plán spouštěče v nízkém tarifu.*
