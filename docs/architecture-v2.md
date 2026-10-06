# naklicove.cz — architektonický návrh v2 (po doplnění zadání)

Datum: 2026-10-06 · Stav: ke schválení + doplnit vstupy §10
Lokace: Ke Kličovu 8, Praha 9 (mezi Prosekem a Vysočany)
Rozsah: rozcestník + cca 8 subwebů, vlastní provozovatel na subweb, databáze, objednávkový kalendr po hodinách, migrace upralesa.cz

---

## 1. Revize rozsahu

Oproti v1 přibývá: **dynamické funkce** (DB, rezervace zdrojů po hodinách, uploads, notifikace, synchronizace s Google Calendar), **8 webů** místo 4, **různý provozovatel na subweb** (= každý má vlastní OC a právní balíček), **migrace upralesa.cz** (ubytování, denní rezervace, sezónní ceník, provázání s Booking.com).

To mění jádro rozhodnutí: čistě statický hosting (CF Pages) přestává stačit. **Doporučení v2: jeden VPS + Cloudflare free před ním.** Detail §3.

## 2. Architektura v2 (hybrid)

```
VPS (hukot, nebo tvůj stávající — Q1)
├── nginx (8 server bloků, wildcard cert, CF proxy před)
├── Astro statické weby (build z GitHub Actions → rsync na VPS)
├── Node/TypeScript API (Fastify) — jeden backend pro všechny weby
│   ├── /api/poptavky        (3D upload STL, kalkul, uložení)
│   ├── /api/rezervace       (objednávkový engine: držení slotu → objednávka)
│   ├── /api/availability    (slit DB + Google Calendar free/busy)
│   └── /api/notify          (e-mail, Discord webhook, Telegram; WhatsApp později)
├── PostgreSQL — zdroje, sazby, objednávky, poptávky, textové záznamy souhlasů
├── /data/stl — uložené STL (signed odkazy, retence 90 dní, promazání cronem)
└── Plausible CE (self-hosted, free) — volitelně
```

**Rezervační engine = jedno jádro, dwa režimy:**
- **po hodinách** (voziky, zkušebny — každý kus zdroj = vlastní kalendář)
- **po dnech/nocích** (upralesa ubytování, později chaty)

Data model: `resource` (typ, slot délka, ceny) → `rate_rule` (sezóny/weekend) → `hold` (15min rezervace slotu, TTL) → `order` → `calendar_event`. **Google Calendar je zdroj obsazenosti** (údržba, privátní rezervace, obsazení z Booking.com přes iCal import): směr A — our order → GCAL event (API insert); směr B — free/busy dotaz na GCAL kalender + push webhooks (channel renew) → cache obsazenosti. Double-booking řeší hold v DB před potvrzením, ne spoléhání na GCAL (ten je asynchronní). Alternativa k vlastním kolům: **Cal.com** (Platform API, free 25 rezervací/měs, obousměrná GCAL sync, embed UI) — doporučuji začít vlastní lehké API, Cal.com zapojit kdyby se rozsah rezervací rozjel.

**Upload STL (worker → teď API na VPS):** limit 50 MB streamem, validace (magic bytes, trojúhelníkový limit), uložení `/data/stl/<hash>.stl`, uživatel dostane potvrzení +signed odkaz ke stažení vlastního souboru (24 h expirace), tobě notifikace s metadaty kalkulátoru (objem, hmotnost, odhad cena/čas) + odkaz. Přehled poptávek: jednoduchá admin stránka (login), stahování jedním klikem. Retence: promazání po 90 dnech (gdpr-účel „vyřízení poptávky").

**Notifikace nova poptávka/rezervace:** 1) e-mail (spolehlivý, oficiální záznam — SMTP od hostingu nebo Resend free 3k/den), 2) Discord webhook (okamžitě, grátis, už to máš), 3) Telegram bot (free push do mobilu), 4) WhatsApp Cloud API — officiálně vyžaduje Meta Business účet + ověření firmy a schválené šablony; doporučuji až po rozjezdu, Discord+Telegram+e-mail pokryjí „okamžitě do mobilu" zadarmo.

**Google služby integrace (co žádáš):** Google Calendar (rezervace — výše), Google Search Console (SEO, free, **žádné cookies**, žádný souhlas), Google Business Profile „Ke Kličovu 8" (Mapy, recenze, lokální vyhledávání — pro pronájem a dílnu klíčové), Google Maps embed na kontaktech (Consent-gated click-to-load nebo static snapshot bez osobních údajů). GA4 volitelně za souhlasem — viz §6 analytika.

## 3. Hosting: Hukot vs Cloudflare Pages

Pozn.: Hukot je **hukot.net** (CZ firma), ne .cz.

| | **Hukot VPS + CF free proxy** (doporuceno) | Cloudflare Pages + Workers + R2 + D1 | Hukot shared webhosting |
|---|---|---|---|
| Cena | VPS-L04G 5,60 € (~140 Kč)/m; L08G 9 € (~223 Kč)/m, neomezený provoz, NVMe, root | 0 Kč do limitů; Workers Paid ~5 €/m pro DB/queues nad free; e-mail přes third party | WH-03 ~22 Kč/m, ale PHP-only — náš Node/Postgres stack tam neběží |
| 8 webů + DB + uploads + rezervace | vše na jednom stroji, 40–80 GB disku pro STL | rozstřílené po službách, D1 limity, Worker pro GCAL sync trvale běžící | ne |
| Datové umístění | **Česko** (jurisdikce, smlouva jako zpracovatel v češtině, rychlost) | EU region existuje, ale globální CDN | CZ |
| Údržba | own security (firewalld, fail2ban, certbot, zálohy cron → Object Storage); zvládneme skrze tebe/agenta CI | almost zero | zero, k dispozici |
| Návaznost na Hermes | pokud už VPS existuje (dotaz Q1), stavíme rovnou na něm | nový ekosystém | — |

**Verdikt:** pro rozsah „8 webů + DB + rezervace + uploads" jde **VPS** (Hukot L04G/L08G, nebo stávající server) a před něj **Cloudflare free** (DNS, proxy/CDN, ochrana, TLS). Build a deploy zůstávají z GitHub Actions (push main → build → rsync na VPS). Zmínka: Hukot má i GPU VPS — relevantní později, kdybys dělal rendery/slicing farmu.

## 4. Design: 3 varianty (konzistence = jeden layout, barevné schéma per web)

Jak se konzistence drží: **shared layout + design tokens.** Jedna vrstva komponent a layoutů v `packages/shared`, každý web jen importuje `theme.css` s ~8 proměnnými (`--bg, --ink, --accent, --surface, --hair, --font-display, --font-body, --radius`). Změna identity subwebu = jeden soubor, struktura neměnná. Barevné schéma ostrovů napříč variantami (popsáno níže): landing neutrální, 3dtisk terakota (struna filamentu), voziky bezpečnostní žlutá, zkušebny jevištní fialová, ubytování lesní zelená.

Aktuální trendy (2026, zdroje: Bubble, Line25, StudioMeyer, Fireart): bento mřížka jako default pro přehledy, **typografie = interface** (obrovské displayové titulky místo hero fotek), anti-grid brutalismus jako protipól „AI leštěnosti" (1px obvodové linky, monospace, nulový radius, offset stíny), film grain / CSS textury místo těžkého WebGL, „barely-there UI" (vlasy + bílá místo boxů), a strojová čitelnost (sémantické HTML pro AI agenty/crawle) — to vše se hodí na lokální řemeslný provoz: působí to nedílně, ne jako template.

### Varianta A — „Dílna" (editorial neo-minimal)
Světlý papírový základ (#FAF7F2), oversized serifový titulek (Fraunces nebo Instrument Serif), tělo Source Sans/Inter, vlasové linky 1px, minimum boxů, struktura z bílého místa. Rozcestník = klidná typografická mapa s šipkami, boxy služeb jen s tenkým olemováním; kalkulátor a formulář v klidné dvousloupcové kolonce. Dojem: řemeslník s řádou, důvěra pro „mami co potřebuje díl" i kapelu. Nejsnazší udržitelnost a nejčistší tisk. Logo: serifový wordmark „Klíč" + malá ikona.

### Varianta B — „Bento dílna" (modulový systém, doporučená pro rozcestník)
Tmavý grafitový základ (#141619) nebo světlá obměna, dlaždice bento mřížky různých velikostí = each služba jeden panel s vlastní barvou akcentu, tvrdý 1px border, offset stín, Space Grotesk display + Geist Mono popisky (rozměry, ceny, parametry tisku — mono = technická důvěryhodnost). Rozcestník je samotný bento: 3–5 dlaždic podle velikosti významu. Subweby: struktura identicalní, jen výměna `--accent`. Dojem: precizní, strojně, „vidíš že tomu rozumíš". Nejlepší pro prezentaci služeb s parametry (3D). Logo: NK monogram v dlaždici + geometrická ikona.

### Varianta C — „Ke Kličovu" (raw brutalism, maximální odlišení)
Syrová bílá/černá, monospace všude (JetBrains Mono), silné 4px black borders, barevné srážky (akcent + clash), rozbité gridy, rotované popisky, razítka, viditelná struktura. Rozcestník = „dispečerská tabule" line list s odkazy. Dojem: nezapomenutelný, lidský, protidigital („AI tohle nedělá"), skvělý pro zkušebny a punkovou kapelu. Riziko: na konzervativní zákazníky (rodiny, firmy) působí tvrdě; ubytování by chtělo změkčit. Nedoporučuji jako default pro všechny weby, jako experiment ano. Logo: razítkový / stencil monogram.

Společné prvky všech variant: identická navigace + patička (odkaz na rozcestník „naklicove.cz" jako DOM), cookie bar stylově sladěný, loga subdomen dílčí viz §4.5, responzivita mobile-first, prefetch odkazů, 0 zbytečného JS.

### 4.5 Loga pro subdomény (návrh systému)
Jeden rodinný systém: vždy monogram/wordmark + piktogram. Piktogramy: **landing** = klíč (zub v písmenu K), **3dtisk** = tryska/vrstvy, **voziky** = přívěs se dvěma koly, **zkusebny** = notová hlava/fader, **upralesa** = strom/chaloupka (současná značka se zachová, jen zasadí do systému).each varianta designu dictuje styl loga (serif wordmark / monogram v dlaždici / razítko). Doporučení: generovat jako **čisté SVG monogramy v kódu** (deterministické, škálující, bez raster AI artefaktů); rastrové AI studie jen jako explorace.

## 5. Texty: humanizovaný proces (jak se to dělá)

Vstupy content agentury G do produkce budou projité přes **humanizer** dovednost (Wikipedia „signs of AI writing", 34 vzorů). Pipeline per text:

1. **Brief** — co stránka musí říct + konkrétní fakta z tvých vstupů (ceny, rozměry tiskáren, parkoviště, otevírací doby). Konkrétnost je 80 % lidského dozvuku.
2. **Draft** v češtině, cílový tón: *věcný lokální řemeslník, tykání na Praze 9, žádný marketingový balast*.
3. **Humanizer pass** — sken proti vzorům (em-dashy, trojice, „nejen… ale", pasivní bezpodmětové fráze, reklamní adjektiva, emoji, tučné nadpisky v seznamu, filler fráze) → přepis.
4. **Sebeaudit** — „co na tomhle prozrazuje, že to psalo AI?" → krátké body → ještě jedna revize.
5. **Voice calibration:** od tebe vzorek tvého vlastního psaní (2–3 e-maily nebo zprávy zákazníkům — Q7). Agent pak drží tvůj rytmus, ne obecně lidský.
6. **Review:** texty na GitHub PR jako diff, ty schválíš.

Pravidla do promptu agenta: krátké věty s dlouhými střídaj, používej „je/má" místo „slouží/představuje", konkrétní čísla, dovol si osobní „děláme u nás na Kličově", žádné „in the heart of Praha 9".

## 6. Analytika: doporučení

**Plausible (self-hosted CE na stejném VPS = 0 Kč; placený cloud od ~$9/m):**
- **Žádné cookies, žádné osobní údaje** → pod LE ZEK §89/3 opt-in a pod GDPR bez banneru; nejdeme cestou neplatitelných „consent mode" modelů.
- Data vždy v EU (Hukot: rovnou v CZ), žádný přenos do USA — v EU padla pro Google Analytics rozhodnutí ÚOOU/DPAs v AT, FR, IT, DK, NO…
- **Čísla bez děr**: soubor srovnání ukazuje, že GA4 s consent bannerem změří až o polovinu méně (odmítnutí + adblockery); Plausible blokuje minimum.
- Open source, vlastní data, retention 3+ roky (GA free 14 měsíců), jeden skript ~1 kB.
- Nevýhody: nemá hloubku GA4 (cohorty, e-commerce reporty, propojení s Ads) a nemá Search Console integraci zdarma v jednom dashboardu.

**Doporučená kombinace:** Plausible jako čísla + Google Search Console jako SEO data + Google Business Profile pro lokálu. GA4 zapneme za opt-in souhlas, jen až budeš dělat Google Ads. Cookie bar zůstává (opt-in readiness, důvěra, pozdější externí skripty), při „none non-essential cookies" je dnes primárně technický (uložení souhlasu).

## 7. Portfolio služeb: Fusion 360 + 3D tisk (analyza)

Co můžeš nabízet (seřazeno podle odhadu poptávky v CZ, lokálně + online):

| # | Služba | Proč / vstup |
|---|---|---|
| 1 | **Tisk na zakázku z STL** | jádro; upload + kalkul okamžitě |
| 2 | **Náhradní díl „na míru"** — dovoz, fotka/původní díl → vyměřit → model ve Fusionu → funkční díl | nejvděčnější lokální poptávka ( Praha 9 byty, auta, pračky, vysavače,rolety, okna); „už se nevyrábí" |
| 3 | **Oprava/příprava modelu na tisk** (repair mesh, dělení, supports, orientation) | 15–30 min práce, fix cena |
| 4 | **Parametrické varianty** — gravírování jmen, velikostní řady, yielded dárky, upomínkové předměty | škálovatelné, sériové |
| 5 | **Prototypy a vývoj dílu** (přesné mechanismy, kryty, sestavy, zámky, držáky) | firemní zákazníci, hodinovka |
| 6 | **Technická dokumentace** — výkresy, kusovník, BOM, podklady i pro CNC/laser | Fusion drawing module; navazuje na firemní zakázky |
| 7 | **Reverzní inženýrství** (změření dílu → STEP model) | spojováno s #2, prodává se samostatně |
| 8 | **Vizualizace / render produktu** | pro e-shopy a sociální sítě místních firem |
| 9 | **Konzultace DFM** („půjde to vytisknout?") — 30 min free, pak hodinovka | levní vstup do zakázky |
| 10 | **Sériová výroba** (desítky–stovky kusů, cena/kus klesá) | opakování #2/#5, SLA + fakturace |
| 11 | **Nastavení tiskárny zákazníka** (už v zadání) + on-site servis, „tiskárna na klíč" | lokálně doprava do 20 km |
| 12 | **Most na další subweby:** držáky/příslušenství na autopřívěsy a karavany (voziky!), rekvizity/cosplay (zkušebny/scéna) | cross-sell v rámci portálu |

Balíčky (názvy pro web): **Starter** (tisk z tvého STL, kalkul online) · **Náhradní díl od A do Z** (#2+#7+#1 pevná paušální cena s úplnou komunikací) · **Od nápadu k dílu** (konzultace + model + tisk balík) · **Série** (100+ kusů, gramová sazba dolů, fakturace) · **Tiskárna na klíč** (#11 fix) · **Firemní partner** (hodinovka CAD + priority tisk + výkresy).

**Cenová hladina vs konkurence (měřeno 2026-10):**
- FDM materiál: studio3dtisk.cz PLA **3 Kč/g**, PETG 3,8, ASA 4, PC 6,7, nylon 8,2, TPU 6,5; **poplatek 50 Kč za přípravu** do 100 g; série od 100 ks: PLA 1,8 / PETG 2,6 Kč/g. db3d.cz: materiál 0,25–2 Kč/g + **strojní čas 50–150 Kč/h** (průměr), jednoduchý model od 300 Kč, složitý 1000+. Prokop Zelený (Praha 10): tisk od 60 Kč/h, materiál od 3 Kč/g, **modelování od 300 Kč/h**. Sýkora: minimum zakázky **650 Kč vč. DPH**, série až 1 Kč/g bez DPH. VTC3D (Praha 4): minimum 150 Kč, osobní odběr zdarma. Bazoš individua: 30–50 Kč/h modelování, 40–199 Kč jednorázově (šedá zóna bez faktury).
- Zkušebny Praha: hodinové sdílené **190–390 Kč/h** (Zkušebny Praha 2024 ceník), měsíční sdílení od 1 600 Kč; nesdílené/druhy prostor do 8 000 Kč/měs.
- Vozíky: řídítka a přívěsy **400–500 Kč/den** (moto, valník), autopřepravníky **700–1 200 Kč/den**, DKNV půjčovna 424–1 148 Kč/den dle typu, kauce 5–10 000 Kč standard.

**Pozice doporučení:** střed nad levnými bazos individuy („faktura, osobní předání do 2 km, 24 h kalkul") a pod velkými studii. Startovací pásma pro ceník do kalkulátoru (placeholder na kalibraci):
- PLA/PETG **2,90 / 3,50 Kč/g**, ASA 4,0, TPU 6,0; strojní čas započten v gramu (pro kalkulačku transparentně: fix 49 Kč + g×sazba; u tisku >300 g fix odpadá)
- minimum poptávky **150 Kč** (trh: 150–650)
- modelování **490 Kč/h**, minimum 1 h; v balíčku s tiskem **390 Kč/h**
- „Náhradní díl od A do Z" od **890 Kč** paušál (malý díl do 30 g + 1 h modelování)
- nastavení tiskárny: on-site **1 990 Kč** / remote **990 Kč**
- DPH: provozovatel na 3D nezbytně musí řešit plátce/neplátce (Q3) — ceník na webu vždy vč. DPH nebo explicitně „+ DPH".

## 8. Multi-web struktura (škálování na 8+)

```
naklicove-web/
├── packages/shared/          # layout, komponenty, tokens, theme.css × N, cookie bar, UI reservation calendar
├── packages/booking-core/    # typy + logika dostupnosti (sdílená API i weby)
├── api/                      # Fastify: poptávky, rezervace, availability, notify, admin
├── content/
│   ├── landing/
│   ├── <site>/…              # 1 adresář per web (8+)
│   └── legal/<operator>/     # texty grouped podle provozovatele (ne podle serveru)
├── sites/
│   └── <site>/               # Astro; přidat web = 3 soubory (config, theme, content mount)
├── infra/
│   ├── nginx/*.conf.template
│   ├── deploy.sh (rsync)     # GH Actions main → VPS; záloha DB každou noc → Object Storage
│   └── systemd/*.service
└── .github/workflows/        # ci.yml (build all + check-content + api tests), deploy.yml
```

Každý subweb: vlastní **provozovatel** v patičce a v legal balíčku (content/legal/<operator>/), vlastní **OC, GDPR, cookies, reklamace** — sdílí jen strukturu a formulářové texty, ne znění. Úprava libovolného textu = .md PR (viz v1 §3, workflow neměnný). Migrace upralesa.cz: obsah → .md, sezónní ceník → cenik.md, ubytování jako daily resource do reservation enginu; **Booking.com/other OTA synchronizace přes iCal feed** (obousměrně: import obsazenosti, export our bookings). Ponechat Booking.com odkazy.

## 9. Orchestrace (revize plánů)

Po schválení: `docs/ORCHESTRATION.md` + spustit agenty v nízkém tarifu (16:00–02:00 CZ). Role:
- **A Scaffold** monorepo (astro workspaces, api skeleton, docker-free deploy skripty)
- **B Landing** rozcestník (bento nebo zvolená varianta, 5+ boxů)
- **C 3dtisk** weby + **D Kalkulátor** (browser-first, cenik.md parametry)
- **E Reservation UI** kalendář dostupnosti (per-hour grid, hold flow) + **F GCAL sync** (API, webhooks, iCal pro Booking)
- **G Uploads/notifikace** (STL endpoint, signed links, e-mail/Discord/Telegram)
- **H Legal per operátor** + cookie bar opt-in
- **I Content** české texty přes humanizer pipeline (§5)
- **J CI/CD + infra** (nginx, certbot, backup, GH Actions)
- **K Logo/design tokens** varianty A/B/C jako 3 HTML mocky k vybrání *před* plnou výrobou
Integrační kolo + lokální QA: já. Rozdělení dává smysl jen po výběru design varianty (K jede první, pak parallel).

## 10. Nové vstupy potřebné od tebe

- **Q1** „Toto železo" = máš na mysli existující VPS (kde běží Hermes/stack na TrueNAS?), nebo kupujeme nový (Hukot L04G)? Pokud existující: IP/speca, jestli na něm už něco běží.
- **Q2** Zbylé weby ze „cca 8": který jsou? (známé: landing, 3dtisk, voziky, zkusebny, upralesa — zbývá ~3–4)
- **Q3** Provozovatelé: každý subweb jiná osoba/firma, neborůzná IČO u různých oblastí? Plátce DPH?, banka/invoicing pro 3D zakázky?
- **Q4** Zkušebny: 5 kusů — názvy/vybavení/kapacita/cena/hod. Rozsah otevírací doby (24/7 klíč vs domluva)? Vozíky: typy/ks/kauce?
- **Q5** Současný upralesa hosting/platforma (WordPress? booking engine?) — pro přenositelnost a iCal.
- **Q6** Design: vybrat A/B/C (nebo „postav mocky a uvidím" — doporučuji K agent nejdřív, pak rozhodnutí levněji).
- **Q7** Vzorek tvého psaní (2–3 zprávy zákazníkovi) pro voice calibration humanizace.
- **Q8** WhatsApp: souhlasíš s odložením na fázi 2 (Meta Business ověření)? Discord webhook + Telegram + e-mail teď.
- **Q9** Potvrdit: Google Business Profile (Mapy) pro Kličovu 8 založíme? Vyžaduje ověření adresy (pohlednice/film).

## 11. Rozhodnutí k potvrzení (delta oproti v1)

1. VPS (Hukot/stávající) + CF proxy místo čistých Pages — kvůli DB/rezervacím/uploadům
2. Reservation engine vlastní (Fastify+Postgres), GCAL jako zdroj obsazenosti, Cal.com jako fallback
3. Analytika: Plausible self-hosted + Search Console + GBP; GA4 až za bannerem s Ads
4. 3 varianty designu, konzistence tokens, K agent udělá mocky před výrobou
5. Legal balíček per provozovatel (8×), ne společný
6. Notifikace: e-mail + Discord + Telegram; WhatsApp fáze 2
7. Ceník pásma §7 jako výchozí, do cenik.md