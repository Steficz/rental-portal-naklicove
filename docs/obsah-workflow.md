# Jak měnit texty (bez CMS)

Veškerý obsah žije v markdownu, nasazuje se samo:

1. Uprav soubor v `content/` (textace, ceník, FAQ) — na GitHubu klikni na tužku, nebo lokálně.
2. Vytvoř PR (nebo pushni přímo na main, pokud nemáš nastavenou ochranu).
3. CI zkontroluje markdown (`tools/check-content.mjs`) a build všech webů.
4. Po mergi na main workflow `deploy.yml` nasadí dotčené weby na Cloudflare Pages.

Kde je co:
- `content/landing/` — rozcestník (úvod + dlaždice služeb)
- `content/3dtisk/` — texty subwebu a `cenik.md` (strojová data pro kalkulátor i ceník na stránce — měníš čísla jen tady, nikoli v kódu)
- `content/legal/provozovatel-a/` — právní texty (přejmenuj adresář podle provozovatele). Placeholdery `[IČO]` apod. vyplň v `packages/shared/src/legal.js`.
- `sites/<web>/src/pages/` — struktura stránek (měnit opatrně, ovlivňuje layout)

Design: styl C (brutalismus), tokeny v `packages/shared/src/styles/tokens.css`,
akcentní barva subwebu se dělá přes `accent` prop Layoutu — nová služba = nový
soubor v `content/landing/sluzby/` a dlaždice se objeví sama.
