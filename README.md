# Nakličové portál

Monorepo pro statické weby portálu naklicove.cz.

## Lokální vývoj

1. Nainstaluj závislosti:
   ```bash
   pnpm install
   ```

2. Spusť vývojový server:
   ```bash
   pnpm dev
   ```

3. Build všech stránek:
   ```bash
   pnpm build
   ```

## Úprava obsahu

Obsah je v adresáři `content/` ve formátu Markdown. Pro úpravu textů:

1. Uprav příslušný `.md` soubor
2. Commitni změny do Gitu
3. Pushni na hlavní branch pro automatické nasazení

## Struktura adresářů

```
sites/
├── root/          # hlavní portál naklicove.cz
├── 3dtisk/        # subweb 3dtisk.naklicove.cz
├── voziky/        # subweb voziky.naklicove.cz
└── zkusebny/      # subweb zkusebny.naklicove.cz

packages/
└── shared/        # sdílené komponenty a styly

content/
├── landing/       # hlavní rozcestník
│   ├── uvod.md
│   └── sluzby/
│       ├── 3dtisk.md
│       ├── voziky.md
│       └── zkusebny.md
├── 3dtisk/        # detailní stránky pro 3D tisk
│   ├── domov.md
│   └── cenik.md
└── legal/         # právní dokumenty
    └── provozovatel-a/
        ├── povinne-informace.md
        ├── obchodni-podminky.md
        ├── ochrana-osobnich-udaju.md
        ├── cookies.md
        ├── odstoupeni.md
        └── reklamace.md
```

## Vývoj komponent

Sdílené komponenty jsou v `packages/shared/src/components/`. Používají
CSS custom properties pro stylování.

## Kontrola obsahu

Spuštění automatické kontroly:
```bash
pnpm check
```