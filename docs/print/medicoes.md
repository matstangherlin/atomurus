# Impressão — medições (prompt 26, B02)

`assets/print.css` (≈ 3,8 KB, `media="print"`, não bloqueia a renderização) entra no `<head>` de todas as páginas públicas pelo `tools/inject-ui-chrome.js` (`templates/chrome/print-css.html`, mesma passada idempotente do skip link). **Por que o injetor e não um script de patch à parte:** é o caminho que o build já usa para o chrome das páginas públicas, então páginas novas recebem a folha sem passo extra; o `/app` fica de fora (tem o próprio layout).

Medido com Chromium (Playwright), `emulateMedia('print')` + `page.pdf({ preferCSSPageSize: true, printBackground: true })`, janela de 1280 px. «Sem print.css» = a mesma página com a folha bloqueada.

| Página | Sem print.css | Com print.css |
|---|---|---|
| `/periodic-table.html` | 1 pág., portrait, chrome visível: .topbar #ws-sidebar .share-host | 1 pág., landscape, chrome visível: — |
| `/periodic-table.pt.html` | 1 pág., portrait, chrome visível: .topbar #ws-sidebar .share-host | 1 pág., landscape, chrome visível: — |
| `/periodic-table/ferrum.html` | 1 pág., portrait, chrome visível: .topbar #ws-sidebar .share-host | 2 pág., portrait, chrome visível: — |
| `/periodic-table/ferrum.en.html` | 1 pág., portrait, chrome visível: .topbar #ws-sidebar .share-host | 2 pág., portrait, chrome visível: — |
| `/explore/what-is-an-atom.html` | 1 pág., portrait, chrome visível: .topbar #ws-sidebar .share-host | 10 pág., portrait, chrome visível: — |
| `/explore/what-is-an-atom.pt.html` | 1 pág., portrait, chrome visível: .topbar #ws-sidebar .share-host | 10 pág., portrait, chrome visível: — |
| `/calculators.html` | 1 pág., portrait, chrome visível: .topbar #ws-sidebar .share-host | 3 pág., portrait, chrome visível: — |
| `/calculators.pt.html` | 1 pág., portrait, chrome visível: .topbar #ws-sidebar .share-host | 3 pág., portrait, chrome visível: — |
| `/periodic-table/isotopes.html` | 1 pág., portrait, chrome visível: .topbar #ws-sidebar .share-host | 3 pág., portrait, chrome visível: — |
| `/periodic-table/heatmap.html` | 1 pág., portrait, chrome visível: .topbar #ws-sidebar .share-host | 1 pág., landscape, chrome visível: — |

Leitura:

- **Sem a folha**, toda página sai em **1 folha** porque o shell público é um layout de aplicativo (`height: 100dvh`, rolagem interna): o resto do conteúdo é **cortado** (o artigo tem 10 folhas de texto). E a barra do topo, a barra lateral e o botão de compartilhar saem no papel.
- **Com a folha**: sem barra, menu, botões de compartilhar/conta/tema, consentimento, anúncios, «salvar no workspace» e convite; o shell flui (`height: auto`, `overflow: visible`); a tabela periódica e o mapa de calor saem em **1 folha A4 paisagem** com as cores das categorias (`print-color-adjust: exact`); artigos mostram o endereço dos links externos; a calculadora imprime só o instrumento aberto.
- Mojibake: nenhum caractere quebrado nos PDFs gerados (os textos vêm das mesmas fontes da tela; a folha declara `@charset "UTF-8"`).

PDFs não são versionados (decisão do prompt: só a folha de estilo). Para conferir: `npx playwright test e2e/share-and-print.spec.js -g print`.

Passo manual do dono: depois do deploy, imprimir a tabela periódica e um artigo pelo navegador (Chrome e Safari).
