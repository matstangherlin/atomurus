# Terceiros — depois

Auditoria local. Cada fase espera 8 s e rola a página. Pedidos a hosts que não são `127.0.0.1` são abortados; o relatório guarda só o hostname. `/api/ads-config` responde `adsEnabled: true` nas três fases, para o consentimento ser o que segura anúncio e medição.

Fase A: sem escolha. Fase B: Recusar. Fase C: Aceitar.

| Página | Fase | Anúncio/medição | Outros hosts | Three antes da rolagem | Hammer | Chart.js | reCAPTCHA |
|---|---|---|---|---|---|---|---|
| `/` | A | — | — | não | não | não | não |
| `/` | B | — | — | não | não | não | não |
| `/` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | — | não | não | não | não |
| `/index.pt.html` | A | — | — | não | não | não | não |
| `/index.pt.html` | B | — | — | não | não | não | não |
| `/index.pt.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | — | não | não | não | não |
| `/periodic-table.html` | A | — | — | não | não | não | não |
| `/periodic-table.html` | B | — | — | não | não | não | não |
| `/periodic-table.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | — | não | não | não | não |
| `/periodic-table.pt.html` | A | — | — | não | não | não | não |
| `/periodic-table.pt.html` | B | — | — | não | não | não | não |
| `/periodic-table.pt.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | — | não | não | não | não |
| `/periodic-table/actinium.html` | A | — | — | não | não | não | não |
| `/periodic-table/actinium.html` | B | — | — | não | não | não | não |
| `/periodic-table/actinium.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | — | não | não | não | não |
| `/periodic-table/trends.html` | A | — | cdn.jsdelivr.net | não | não | sim | não |
| `/periodic-table/trends.html` | B | — | cdn.jsdelivr.net | não | não | sim | não |
| `/periodic-table/trends.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | cdn.jsdelivr.net | não | não | sim | não |
| `/periodic-table/trends.pt.html` | A | — | cdn.jsdelivr.net | não | não | sim | não |
| `/periodic-table/trends.pt.html` | B | — | cdn.jsdelivr.net | não | não | sim | não |
| `/periodic-table/trends.pt.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | cdn.jsdelivr.net | não | não | sim | não |
| `/calculators.html` | A | — | www.google.com | não | não | não | sim |
| `/calculators.html` | B | — | www.google.com | não | não | não | sim |
| `/calculators.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | www.google.com | não | não | não | sim |
| `/calculators.pt.html` | A | — | www.google.com | não | não | não | sim |
| `/calculators.pt.html` | B | — | www.google.com | não | não | não | sim |
| `/calculators.pt.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | www.google.com | não | não | não | sim |
| `/explore.html` | A | — | www.google.com | não | não | não | sim |
| `/explore.html` | B | — | www.google.com | não | não | não | sim |
| `/explore.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | www.google.com | não | não | não | sim |
| `/explore.pt.html` | A | — | www.google.com | não | não | não | sim |
| `/explore.pt.html` | B | — | www.google.com | não | não | não | sim |
| `/explore.pt.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | www.google.com | não | não | não | sim |
| `/explore/what-is-an-atom.html` | A | — | — | não | não | não | não |
| `/explore/what-is-an-atom.html` | B | — | — | não | não | não | não |
| `/explore/what-is-an-atom.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | — | não | não | não | não |
| `/explore/what-is-an-atom.pt.html` | A | — | — | não | não | não | não |
| `/explore/what-is-an-atom.pt.html` | B | — | — | não | não | não | não |
| `/explore/what-is-an-atom.pt.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | — | não | não | não | não |
| `/viewer/molecules.html` | A | — | cdnjs.cloudflare.com | sim | não | não | não |
| `/viewer/molecules.html` | B | — | cdnjs.cloudflare.com | sim | não | não | não |
| `/viewer/molecules.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | cdnjs.cloudflare.com | sim | não | não | não |
| `/viewer/molecules.pt.html` | A | — | cdnjs.cloudflare.com | sim | não | não | não |
| `/viewer/molecules.pt.html` | B | — | cdnjs.cloudflare.com | sim | não | não | não |
| `/viewer/molecules.pt.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | cdnjs.cloudflare.com | sim | não | não | não |
| `/viewer/atomic-models.html` | A | — | cdnjs.cloudflare.com, www.google.com | sim | não | não | sim |
| `/viewer/atomic-models.html` | B | — | cdnjs.cloudflare.com, www.google.com | sim | não | não | sim |
| `/viewer/atomic-models.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | cdnjs.cloudflare.com, www.google.com | sim | não | não | sim |
| `/viewer/atomic-models.pt.html` | A | — | cdnjs.cloudflare.com, www.google.com | sim | não | não | sim |
| `/viewer/atomic-models.pt.html` | B | — | cdnjs.cloudflare.com, www.google.com | sim | não | não | sim |
| `/viewer/atomic-models.pt.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | cdnjs.cloudflare.com, www.google.com | sim | não | não | sim |
| `/viewer/isomerism/constitutional/function.html` | A | — | — | não | não | não | não |
| `/viewer/isomerism/constitutional/function.html` | B | — | — | não | não | não | não |
| `/viewer/isomerism/constitutional/function.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | — | não | não | não | não |
| `/viewer/isomerism/constitutional/function.pt.html` | A | — | — | não | não | não | não |
| `/viewer/isomerism/constitutional/function.pt.html` | B | — | — | não | não | não | não |
| `/viewer/isomerism/constitutional/function.pt.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | — | não | não | não | não |
| `/pricing` | A | — | — | não | não | não | não |
| `/pricing` | B | — | — | não | não | não | não |
| `/pricing` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | — | não | não | não | não |
| `/pricing.pt.html` | A | — | — | não | não | não | não |
| `/pricing.pt.html` | B | — | — | não | não | não | não |
| `/pricing.pt.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | — | não | não | não | não |
| `/login` | A | — | — | não | não | não | não |
| `/login` | B | — | — | não | não | não | não |
| `/login` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | — | não | não | não | não |
| `/contact.html` | A | — | www.google.com | não | não | não | sim |
| `/contact.html` | B | — | www.google.com | não | não | não | sim |
| `/contact.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | www.google.com | não | não | não | sim |
| `/contact.pt.html` | A | — | www.google.com | não | não | não | sim |
| `/contact.pt.html` | B | — | www.google.com | não | não | não | sim |
| `/contact.pt.html` | C | acscdn.com, pagead2.googlesyndication.com, www.googletagmanager.com | www.google.com | não | não | não | sim |

## Links estáticos (preconnect, dns-prefetch, preload)

- `index.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: atomurus-lab-console.css
- `index.pt.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: atomurus-lab-console.css
- `periodic-table.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: atomurus-lab-console.css
- `periodic-table.pt.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: atomurus-lab-console.css
- `periodic-table/actinium.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: ../atomurus-lab-console.css
- `periodic-table/trends.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: ../atomurus-lab-console.css
- `periodic-table/trends.pt.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: ../atomurus-lab-console.css
- `calculators.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: atomurus-lab-console.css
- `calculators.pt.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: atomurus-lab-console.css
- `explore.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: atomurus-lab-console.css
- `explore.pt.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: atomurus-lab-console.css
- `explore/what-is-an-atom.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-normal-latin.woff2
  - preload: ../atomurus-lab-console.css
- `explore/what-is-an-atom.pt.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-normal-latin.woff2
  - preload: ../atomurus-lab-console.css
- `viewer/molecules.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: ../atomurus-lab-console.css
- `viewer/molecules.pt.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: ../atomurus-lab-console.css
- `viewer/atomic-models.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: ../atomurus-lab-console.css
- `viewer/atomic-models.pt.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: ../atomurus-lab-console.css
- `viewer/isomerism/constitutional/function.html`
  - preload: ../../../i18n.js
- `viewer/isomerism/constitutional/function.pt.html`
  - preload: ../../../i18n.js
- `pricing.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: atomurus-lab-console.css
- `pricing.pt.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: atomurus-lab-console.css
- `login.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
- `contact.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: atomurus-lab-console.css
- `contact.pt.html`
  - preload: /assets/fonts/inter-tight-normal-latin.woff2
  - preload: /assets/fonts/instrument-serif-400-italic-latin.woff2
  - preload: atomurus-lab-console.css

## `<script src="https://…">` síncrono em HTML publicado

reCAPTCHA (`google.com/recaptcha/api.js`) fica de fora desta lista de propósito.

Nenhum.

Fases A/B com host de anúncio ou medição: 0.

## Leitura

- Fases A e B seguem sem host de anúncio ou medição. A fase C, depois de Aceitar, passa a ver `pagead2.googlesyndication.com`, `acscdn.com` e `www.googletagmanager.com`.
- Hammer.js saiu. O `cdn.jsdelivr.net` que resta nas tendências é o Chart.js do gráfico da página.
- Não há mais `<script src="https://…">` síncrono no HTML publicado.
- A isomeria não pede Three.js antes da rolagem. Moléculas (canvas a ~92 px da dobra, dentro da margem de 240 px) e modelos atômicos (canvas já na tela) ainda pedem, porque o visualizador já está perto.
- reCAPTCHA continua só em páginas com `<form>`.
- O Lighthouse do prompt 01 (`docs/perf/lighthouse-before.md`) bloqueia terceiros de propósito. Esta mudança não altera essa medição; a comparação numérica fica no prompt 18.
