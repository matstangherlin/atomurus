# Viewer de moléculas — desempenho (prompt 31)

Medido em 2026-10-29 com Playwright (Chromium headless, renderização por software, 1280×720),
servidor local (`tools/e2e-serve.mjs`). `build` = `canvas.dataset.buildMs`, gravado por
`rebuildScene()` com `performance.now()`; `total` = `setMolecule()` inteiro (busca local + cena);
`fps` = quadros por segundo em 2 s com a molécula girando.

| Molécula | Átomos | build (ms) | total (ms) | fps |
|---|---:|---:|---:|---:|
| water | 3 | 1,3 | 2,4 | 60 |
| benzene | 12 | 1,7 | 8,8 | 59 |
| glyceraldehyde | 12 | 0,9 | 8,3 | 59 |
| cyclohexane | 18 | 0,9 | 30,9 | 57 |
| sintética (24 átomos) | 24 | 1,1 | 28,6 | 58 |
| sintética (33 átomos) | 33 | 1,7 | 33,4 | 49 |

As moléculas sintéticas (servidas só no teste, por rota do Playwright) têm o tamanho das quatro
novas (cafeína 24, aspirina 21, glicose 24, ibuprofeno 33 átomos). Renderização por software é o
pior caso; em GPU o quadro não é o gargalo. Os rótulos agora reutilizam um material por símbolo
(antes, uma textura nova por átomo a cada reconstrução).

## Bytes

| Arquivo | Antes | Depois | gzip antes → depois |
|---|---:|---:|---:|
| `viewer/molecules.html` (carga inicial) | 56 520 | 56 520 | 13 006 → 13 006 |
| `viewer/molecules.pt.html` (carga inicial) | 56 725 | 56 725 | 13 320 → 13 320 |
| `viewer/runtime/molecule-viewer.js` (sob demanda) | 39 306 | 56 343 | 11 240 → 16 379 |

A página não mudou; a medição vem no runtime, que só é baixado quando a vista 3D se aproxima da
tela (prompt 16). Medir as quatro moléculas reais depois do `--add` e atualizar esta tabela.
