# Jak měnit texty (bez CMS)

Veškerý obsah žije v markdownu, nasazuje se samo:

1. Uprav soubor v `content/` (textace, ceník, FAQ) — na GitHubu klikni na tužku, nebo lokálně.
2. Vytvoř PR (Cloudflare dá preview URL) nebo push přímo na main.
3. CI zkontroluje markdown (`tools/check-content.mjs`) a build všech webů.
4. Po mergi na main Cloudflare Pages each subweb nasadí.

Kde je co:
- `content/landing/` — rozcestník (úvod + dlaždice služeb, 1 soubor = 1 dlaždice)
- `content/3dtisk/` — texty subwebu a `cenik.md` (strojová data pro kalkulátor i ceník — měníš čísla jen tady, nikdy ne v kódu)
- `content/legal/spolecne/` — **cookies + ochrana osobních údajů**: jedno znění,
  nasazuje se na všechny weby (změníš-li tady, změní se to všude najednou)
- `content/legal/<subweb>/` — **obchodní podmínky, povinné informace, odstoupení,
  reklamace** vlastní text pro každý subweb (3dtisk, voziky, zkusebny, dodavky, hospoda)
- Placeholdery provozovatelů `[IČO]` apod. se doplňují v `packages/shared/src/legal.js`
  (klíče odpovídají adresářům content/legal/) a v textech `.md`.

Adresa: **Ke Klíčovu 263/8, Praha 9** — patička každého webu obsahuje pin s odkazem na Google Maps
(jedno místo v `Layout.astro`).

Design: styl C (brutalismus), tokeny v `packages/shared/src/styles/tokens.css`,
akcent subwebu se předává přes `accent` prop Layoutu; `terms` prop zapne odkaz
na Obchodní podmínky v patičce (subweby ano, landing ne).
