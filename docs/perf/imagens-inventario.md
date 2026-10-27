# Inventário de imagens (D01)

Medido em 26/10/2026 no clone, com `git ls-files` e o tamanho real do arquivo (`bytes/1024`). Dimensões lidas do cabeçalho PNG/JPEG em Node, sem biblioteca nova. `du -k` arredonda para blocos e fica 1–4 KiB acima destes números.

## Discrepância com o relatório

O relatório citava **29 imagens / 14,9 MB**. O prompt, medido num clone anterior, esperava **6 PNGs ≈ 13 MB** em `assets/concepts`.

Neste clone:

- `assets/concepts`: **6 PNGs**, 13 394 020 bytes (**13 080,1 KiB**, 12,77 MiB). Confere com o prompt, não com «29 arquivos».
- Imagens rastreadas **fora de `docs/`**: **30 arquivos**, 14 889 171 bytes (**14 540,2 KiB**, **14,89 MB** decimais). Os 14,9 MB do relatório batem com este total, não só com `concepts`. A diferença de 29 × 30 é um SVG de 424 bytes (`hanzi-logic/icon.svg`) ou a contagem antiga ter deixado um arquivo de fora.
- Em `docs/` há mais **93** imagens de captura (cerca de 6,8 MiB). Já ficam fora do publish (`.netlifyignore` tem `docs/` e `*.md`; o scrub remove `docs`). Não entram na tabela.

Nada foi apagado. A ação de `concepts` é tirá-las do publish, no padrão de `propostas/`.

## Publicado hoje × depois

| | KiB | bytes |
|---|---:|---:|
| Publicado hoje (30 arquivos fora de `docs/`) | 14 540,2 | 14 889 171 |
| `assets/concepts` (sai do publish) | 13 080,1 | 13 394 020 |
| Publicado depois de tirar `concepts` | 1 460,1 | 1 495 151 |
| `og-bhopal-disaster.png` hoje | 675,7 | 691 901 |

A compressão do cartão OG de Bhopal entra no passo seguinte. As outras 13 `og-*.png` já estão entre 26 e 38 KiB. As três fotos JPG do artigo (113, 77 e 52 KiB) ficam como estão.

## Onde `assets/concepts` aparece

Só em `propostas/index.html` e `propostas/minimalistas-galeria.html`. `propostas/` já está em `.netlifyignore`, em `REMOVE_PATHS` do scrub, na regra 404 de `netlify.toml` e em `robots.txt`. `assets/concepts` ainda é servido.

## `<img>` públicos

Fora de `propostas/` e `docs/` há 10 tags `<img>`. Todas têm `width`, `height`, e as dos artigos também `loading="lazy"` e `decoding="async"`. As seis imagens de conceito, só nas propostas, não declaram dimensão; essas páginas não são publicadas.

`assets/og-cover.png` não tem referência no repositório. Permanece: o prompt não autoriza apagar imagem.

## Tabela

| Arquivo | KiB | Dimensão | Publicado | Referências | Ação |
|---|---:|---|---|---|---|
| `assets/concepts/futures/editorial-bismuth.png` | 2665.8 | 1536×1024 | sim hoje; não depois | `propostas/index.html` | fora do publish; fica no Git |
| `assets/concepts/futures/instrument-console.png` | 2490.1 | 1536×1024 | sim hoje; não depois | `propostas/index.html` | fora do publish; fica no Git |
| `assets/concepts/atomurus-caderno-materia.png` | 2159.9 | 1586×992 | sim hoje; não depois | `propostas/minimalistas-galeria.html` | fora do publish; fica no Git |
| `assets/concepts/atomurus-observatorio-silencioso.png` | 2020.0 | 1586×992 | sim hoje; não depois | `propostas/minimalistas-galeria.html` | fora do publish; fica no Git |
| `assets/concepts/atomurus-instrumento-humano.png` | 1896.6 | 1586×992 | sim hoje; não depois | `propostas/minimalistas-galeria.html` | fora do publish; fica no Git |
| `assets/concepts/futures/future-orbital.png` | 1847.8 | 1672×941 | sim hoje; não depois | `propostas/index.html` | fora do publish; fica no Git |
| `assets/og-bhopal-disaster.png` | 675.7 | 1200×630 | sim | `explore/bhopal-disaster.html`, `explore/bhopal-disaster.pt.html` (+1) | comprimir para ≤ 200 KiB, mesmo nome |
| `assets/bhopal-union-carbide-factory.jpg` | 113.4 | 900×551 | sim | `explore/bhopal-disaster.html`, `explore/bhopal-disaster.pt.html` | já pequena; não mexer |
| `assets/bhopal-memorial-statue.jpg` | 77.4 | 620×864 | sim | `explore/bhopal-disaster.html`, `explore/bhopal-disaster.pt.html` | já pequena; não mexer |
| `assets/mother-teresa-india-1988.jpg` | 52.0 | 560×779 | sim | `explore/bhopal-disaster.html`, `explore/bhopal-disaster.pt.html` | já pequena; não mexer |
| `assets/og-periodic-table.png` | 37.9 | 1200×630 | sim | `explore/what-is-the-periodic-table.pt.html`, `explore/what-is-the-periodic-table.html` | já abaixo de 40 KiB; não mexer |
| `assets/og-atomic-models.png` | 37.7 | 1200×630 | sim | `viewer/atomic-models.html`, `viewer/atomic-models.pt.html` (+12) | já abaixo de 40 KiB; não mexer |
| `assets/og-home.png` | 36.3 | 1200×630 | sim | `index.pt.html`, `index.html` (+2) | já abaixo de 40 KiB; não mexer |
| `assets/og-periodic-table-app.png` | 36.2 | 1200×630 | sim | `periodic-table.pt.html`, `periodic-table.html` (+10) | já abaixo de 40 KiB; não mexer |
| `assets/og-molecules.png` | 34.6 | 1200×630 | sim | `viewer/molecules.html`, `viewer/molecules.pt.html` (+4) | já abaixo de 40 KiB; não mexer |
| `assets/og-allotropes.png` | 32.5 | 1200×630 | sim | `viewer/allotropes.html`, `viewer/allotropes.pt.html` (+2) | já abaixo de 40 KiB; não mexer |
| `assets/og-elements.png` | 32.4 | 1200×630 | sim | `periodic-table/erbium.en.html`, `periodic-table/carboneum.en.html` (+236) | já abaixo de 40 KiB; não mexer |
| `assets/og-cover.png` | 32.2 | 1200×630 | sim | nenhuma | já abaixo de 40 KiB; não mexer |
| `assets/og-isomerism-viewer.png` | 32.1 | 1200×630 | sim | `isomerism/spatial/optical.html`, `isomerism/spatial/optical.pt.html` (+32) | já abaixo de 40 KiB; não mexer |
| `assets/og-site.png` | 30.5 | 1200×630 | sim | `contact.html`, `pricing.html` (+12) | já abaixo de 40 KiB; não mexer |
| `assets/og-calculators.png` | 28.8 | 1200×630 | sim | `calculators.html`, `calculators.pt.html` (+2) | já abaixo de 40 KiB; não mexer |
| `assets/periodic-table-mini.svg` | 28.0 | — | sim | `explore/what-is-the-periodic-table.pt.html`, `explore/what-is-the-periodic-table.html` | manter |
| `assets/og-explore.png` | 27.7 | 1200×630 | sim | `explore.pt.html`, `explore/what-is-chemical-bonding.pt.html` (+13) | já abaixo de 40 KiB; não mexer |
| `assets/periodic-table-metals.svg` | 26.1 | — | sim | `explore/what-is-the-periodic-table.pt.html`, `explore/what-is-the-periodic-table.html` | manter |
| `assets/og-isomerism.png` | 25.7 | 1200×630 | sim | `explore/what-is-isomerism.html`, `explore/what-is-isomerism.pt.html` | já abaixo de 40 KiB; não mexer |
| `assets/icons/icon-512.png` | 17.1 | 512×512 | sim | `tools/build-app-bundle.mjs`, `manifest.json` (+1) | manter |
| `assets/atomurus-logo.png` | 17.0 | 512×512 | sim | `dev/viz-prototype.html`, `dev/ui.html` (+339) | manter |
| `assets/icons/icon-maskable-512.png` | 15.8 | 512×512 | sim | `manifest.json`, `tools/build-app-bundle.mjs` (+1) | manter |
| `assets/icons/icon-192.png` | 12.6 | 192×192 | sim | `tools/build-app-bundle.mjs`, `MELHORIAS.md` (+1) | manter |
| `hanzi-logic/icon.svg` | 0.4 | — | sim | `hanzi-logic/manifest.webmanifest`, `hanzi-logic/index.html` | manter |
