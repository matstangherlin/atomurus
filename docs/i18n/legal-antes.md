# Páginas legais — mistura de idiomas («antes» e «depois»)

Prompt 26, B04. Medido com `node tools/lint-lang-mix.mjs --report` (sem dependências): para cada
um dos 6 arquivos legais (`privacy`, `terms`, `contact` × `.html`/`.pt.html`) e para as 3 variantes
PT que o `npm run build` escreve a partir do EN (`build-i18n.js`, função `renderVariant`), o texto
visível é quebrado em blocos (parágrafo, item, título, célula, botão, rótulo, mais `title`, `meta
description`, `aria-label`, `alt`, `placeholder`), e cada bloco recebe uma pontuação PT × EN por
palavras funcionais e palavras comuns de interface. «Destoa» = a pontuação aponta o outro idioma.

**Por que olhar o «(build)»:** o deploy publica a saída do build, não o `.pt.html` do git. O build
regera as 21 páginas PT a partir do EN e, até este commit, só «assava» `data-i18n` de texto puro e
alguns atributos — os parágrafos com `data-i18n-html` (a maior parte do texto jurídico) ficavam com o
**texto EN da fonte** no HTML estático da página PT. Com JS, o `i18n.js` trocava depois; sem JS
(robôs de busca, prévias de link, leitores com JS bloqueado), a página PT saía metade em inglês.

## Antes (commit 57d1552)

Gerado por `node tools/lint-lang-mix.mjs --report`. Bloco = parágrafo, item, título, célula, botão, rótulo ou atributo de texto. «Destoa» = as palavras indicam o outro idioma; o limite do CI é **0 blocos destoantes com mais de 0 palavras**.

| Arquivo | Idioma | Blocos | Destoantes | Acima do limite |
|---|---|---:|---:|---:|
| `privacy.html` | en | 96 | 0 | 0 |
| `privacy.pt.html` | pt | 96 | 20 | 20 |
| `terms.html` | en | 87 | 0 | 0 |
| `terms.pt.html` | pt | 87 | 14 | 14 |
| `contact.html` | en | 89 | 0 | 0 |
| `contact.pt.html` | pt | 89 | 12 | 12 |
| `privacy.pt.html (build)` | pt | 96 | 23 | 23 |
| `terms.pt.html (build)` | pt | 87 | 14 | 14 |
| `contact.pt.html (build)` | pt | 89 | 12 | 12 |

## `privacy.pt.html`

| Linha | Onde | Palavras | PT/EN | Trecho |
|---:|---|---:|---|---|
| 117 | `<label>` | 2 | 0/1 | Search element |
| 143 | `<a aria-label>` | 1 | 0/1 | Account |
| 195 | `<div>` | 7 | 0/1 | scope DOC.PRIVACY section privacy rev v1.11 · 2026.05 data IUPAC 2024 · CODATA 2022 |
| 209 | `<h1>` | 2 | 0/2 | Privacy Policy |
| 216 | `<div>` | 2 | 0/1 | document privacy |
| 218 | `<div>` | 1 | 0/1 | updated 2026 · 05 |
| 221 | `<aside>` | 40 | 0/15 | Who we are Information we do not collect directly Information stored locally in your browser Analytics — Goog… |
| 240 | `<div>` | 3 | 0/1 | Effective date May 16, 2026 |
| 244 | `<blockquote>` | 39 | 0/12 | Atomurus keeps the public chemistry lab open without requiring an account, but now offers optional accounts f… |
| 247 | `<p>` | 27 | 0/18 | Atomurus ("we", "us", "our") operates the website at atomurus.com . This Privacy Policy explains what data is… |
| 250 | `<p>` | 11 | 0/3 | Even with optional accounts, Atomurus does not directly collect or store: |
| 258 | `<p>` | 27 | 0/11 | To remember your preferences across visits, Atomurus stores a few values in your browser's localStorage . The… |
| 260 | `<li>` | 8 | 0/3 | Theme — whether you prefer light or dark mode |
| 261 | `<li>` | 5 | 0/3 | Language — your selected interface language |
| 262 | `<li>` | 18 | 0/1 | Display preferences — element card size, font size, lanthanide/actinide visibility, atomic mass toggle, anima… |
| 264 | `<p>` | 12 | 0/6 | You can clear these at any time through your browser's site-data settings. |
| 267 | `<p>` | 34 | 0/11 | Atomurus uses Google Analytics 4 (measurement ID ) to understand aggregated, anonymous usage — for example, w… |
| 283 | `<p>` | 36 | 0/18 | You can review and control how Google uses data when you use our partners' sites or apps at policies.google.c… |
| 307 | `<p>` | 34 | 0/17 | For privacy-related questions, write to contato@atomurus.com or use the Contact form. Messages sent through t… |
| 378 | `<div>` | 5 | 0/2 | ready · doc / privacy → periodic-table · → about |

## `terms.pt.html`

| Linha | Onde | Palavras | PT/EN | Trecho |
|---:|---|---:|---|---|
| 117 | `<label>` | 2 | 0/1 | Search element |
| 143 | `<a aria-label>` | 1 | 0/1 | Account |
| 195 | `<div>` | 7 | 0/1 | scope DOC.TERMS section terms rev v1.11 · 2026.05 data IUPAC 2024 · CODATA 2022 |
| 209 | `<h1>` | 3 | 0/2 | Terms of Use |
| 216 | `<div>` | 2 | 0/1 | document terms |
| 218 | `<div>` | 1 | 0/1 | updated 2026 · 05 |
| 221 | `<aside>` | 30 | 0/9 | Acceptance Educational purpose Public access and optional accounts Accuracy of information Limitation of liab… |
| 240 | `<div>` | 3 | 0/1 | Effective date May 16, 2026 |
| 245 | `<p>` | 24 | 0/14 | By accessing or using atomurus.com (the "Site"), you agree to these Terms of Use. If you do not agree, please… |
| 248 | `<p>` | 46 | 0/19 | Atomurus is provided as a free educational tool for studying chemistry. The content — including the periodic … |
| 256 | `<li>` | 18 | 0/9 | The Site is provided "as is" , without any warranty of completeness, accuracy or fitness for any specific pur… |
| 281 | `<p>` | 43 | 0/23 | Atomurus is supported by advertising served by Google AdSense. We do not endorse, control or guarantee any ad… |
| 293 | `<p>` | 12 | 0/9 | For questions about these Terms, write to contato@atomurus.com or use the Contact form. |
| 364 | `<div>` | 5 | 0/2 | ready · doc / terms → periodic-table · → about |

## `contact.pt.html`

| Linha | Onde | Palavras | PT/EN | Trecho |
|---:|---|---:|---|---|
| 120 | `<label>` | 2 | 0/1 | Search element |
| 146 | `<a aria-label>` | 1 | 0/1 | Account |
| 212 | `<h1>` | 3 | 0/1 | Talk to Atomurus. |
| 221 | `<div>` | 2 | 0/1 | reply 2–3 days |
| 237 | `<p>` | 16 | 0/6 | Prefer email? Write to the address below — it lands in the same inbox as the form. |
| 243 | `<h2>` | 2 | 0/1 | § 02 Message form |
| 284 | `<div>` | 21 | 0/14 | By submitting, you agree to our Privacy Policy and Terms of Use . We do not share your email with third parti… |
| 286 | `<div>` | 10 | 0/6 | Could not send. Please try again or write directly to contato@atomurus.com . |
| 289 | `<h2>` | 3 | 0/3 | § 03 What to send |
| 310 | `<p>` | 17 | 0/3 | Follow Atomurus on social media for release notes, new elements, behind-the-scenes lab work and short scienti… |
| 334 | `<h2>` | 1 | 0/1 | § 05 Privacy |
| 335 | `<p>` | 32 | 0/17 | Your name, email and message are transmitted through Mailgun (our email provider) and delivered to our inbox.… |

## `privacy.pt.html (build)`

| Linha | Onde | Palavras | PT/EN | Trecho |
|---:|---|---:|---|---|
| 117 | `<label>` | 2 | 0/1 | Search element |
| 143 | `<a aria-label>` | 1 | 0/1 | Account |
| 195 | `<div>` | 7 | 0/1 | scope DOC.PRIVACY section privacy rev v1.11 · 2026.05 data IUPAC 2024 · CODATA 2022 |
| 209 | `<h1>` | 2 | 0/2 | Privacy Policy |
| 216 | `<div>` | 2 | 0/1 | document privacy |
| 218 | `<div>` | 1 | 0/1 | updated 2026 · 05 |
| 221 | `<aside>` | 40 | 0/15 | Who we are Information we do not collect directly Information stored locally in your browser Analytics — Goog… |
| 240 | `<div>` | 3 | 0/1 | Effective date May 16, 2026 |
| 244 | `<blockquote>` | 39 | 0/12 | Atomurus keeps the public chemistry lab open without requiring an account, but now offers optional accounts f… |
| 247 | `<p>` | 27 | 0/18 | Atomurus ("we", "us", "our") operates the website at atomurus.com . This Privacy Policy explains what data is… |
| 250 | `<p>` | 11 | 0/3 | Even with optional accounts, Atomurus does not directly collect or store: |
| 258 | `<p>` | 27 | 0/11 | To remember your preferences across visits, Atomurus stores a few values in your browser's localStorage . The… |
| 260 | `<li>` | 8 | 0/3 | Theme — whether you prefer light or dark mode |
| 261 | `<li>` | 5 | 0/3 | Language — your selected interface language |
| 262 | `<li>` | 18 | 0/1 | Display preferences — element card size, font size, lanthanide/actinide visibility, atomic mass toggle, anima… |
| 264 | `<p>` | 12 | 0/6 | You can clear these at any time through your browser's site-data settings. |
| 267 | `<p>` | 34 | 0/11 | Atomurus uses Google Analytics 4 (measurement ID ) to understand aggregated, anonymous usage — for example, w… |
| 274 | `<p>` | 37 | 0/17 | We do not link this data to any individual identity. Google Analytics loads only after you allow measurement.… |
| 277 | `<p>` | 24 | 0/12 | When you allow advertising, Atomurus may load advertisements from Google AdSense and AdCash . Those providers… |
| 283 | `<p>` | 36 | 0/18 | You can review and control how Google uses data when you use our partners' sites or apps at policies.google.c… |
| 286 | `<p>` | 59 | 0/28 | Pages that contain a form load Google reCAPTCHA v3 to protect the site from automated abuse. reCAPTCHA runs i… |
| 307 | `<p>` | 34 | 0/17 | For privacy-related questions, write to contato@atomurus.com or use the Contact form. Messages sent through t… |
| 378 | `<div>` | 5 | 0/2 | ready · doc / privacy → periodic-table · → about |

## `terms.pt.html (build)`

| Linha | Onde | Palavras | PT/EN | Trecho |
|---:|---|---:|---|---|
| 117 | `<label>` | 2 | 0/1 | Search element |
| 143 | `<a aria-label>` | 1 | 0/1 | Account |
| 195 | `<div>` | 7 | 0/1 | scope DOC.TERMS section terms rev v1.11 · 2026.05 data IUPAC 2024 · CODATA 2022 |
| 209 | `<h1>` | 3 | 0/2 | Terms of Use |
| 216 | `<div>` | 2 | 0/1 | document terms |
| 218 | `<div>` | 1 | 0/1 | updated 2026 · 05 |
| 221 | `<aside>` | 30 | 0/9 | Acceptance Educational purpose Public access and optional accounts Accuracy of information Limitation of liab… |
| 240 | `<div>` | 3 | 0/1 | Effective date May 16, 2026 |
| 245 | `<p>` | 24 | 0/14 | By accessing or using atomurus.com (the "Site"), you agree to these Terms of Use. If you do not agree, please… |
| 248 | `<p>` | 46 | 0/19 | Atomurus is provided as a free educational tool for studying chemistry. The content — including the periodic … |
| 256 | `<li>` | 18 | 0/9 | The Site is provided "as is" , without any warranty of completeness, accuracy or fitness for any specific pur… |
| 281 | `<p>` | 43 | 0/23 | Atomurus is supported by advertising served by Google AdSense. We do not endorse, control or guarantee any ad… |
| 293 | `<p>` | 12 | 0/9 | For questions about these Terms, write to contato@atomurus.com or use the Contact form. |
| 364 | `<div>` | 5 | 0/2 | ready · doc / terms → periodic-table · → about |

## `contact.pt.html (build)`

| Linha | Onde | Palavras | PT/EN | Trecho |
|---:|---|---:|---|---|
| 120 | `<label>` | 2 | 0/1 | Search element |
| 146 | `<a aria-label>` | 1 | 0/1 | Account |
| 212 | `<h1>` | 3 | 0/1 | Talk to Atomurus. |
| 221 | `<div>` | 2 | 0/1 | reply 2–3 days |
| 237 | `<p>` | 16 | 0/6 | Prefer email? Write to the address below — it lands in the same inbox as the form. |
| 243 | `<h2>` | 2 | 0/1 | § 02 Message form |
| 284 | `<div>` | 21 | 0/14 | By submitting, you agree to our Privacy Policy and Terms of Use . We do not share your email with third parti… |
| 286 | `<div>` | 10 | 0/6 | Could not send. Please try again or write directly to contato@atomurus.com . |
| 289 | `<h2>` | 3 | 0/3 | § 03 What to send |
| 310 | `<p>` | 17 | 0/3 | Follow Atomurus on social media for release notes, new elements, behind-the-scenes lab work and short scienti… |
| 334 | `<h2>` | 1 | 0/1 | § 05 Privacy |
| 335 | `<p>` | 32 | 0/17 | Your name, email and message are transmitted through Mailgun (our email provider) and delivered to our inbox.… |

## Causas

| Causa | Exemplos | Correção |
|---|---|---|
| `build-i18n.js` não assava `data-i18n-html` | `privacy.p_1Html`, `p_3Html`, `calloutHtml`, `terms.p_1Html`, `contact.noteHtml`… | `bakeDataI18nHtml` (balanceia a tag; recusa conteúdo com marcação de bloco ou outras chaves) |
| Chave usada no HTML e ausente do dicionário (nem EN nem PT) | `privacy.titleHtml`, `privacy.effectiveDate`, `terms.titleHtml`, `contact.h2Form`, `contact.socialLead`, `contact.privacyHtml`… (13) | chaves criadas em EN e PT |
| Texto fixo sem `data-i18n` | sumário lateral (13 + 13 links), «document / updated / contents», «Effective date», faixa de dados, barra de status, rótulo «Search element», `aria-label` «Account» e «Laboratory» | `data-i18n` / `data-i18n-attr` com chaves novas ou já existentes (`common.stReady`, `common.searchAria`, `pricing.ctaAccount`, `common.nav.laboratory`) |
| Valor do dicionário divergente do HTML | `contact.emailLeadHtml` repetia o e-mail que a página já mostra logo abaixo | valor EN/PT alinhado ao HTML atual |

## Depois

`node tools/lint-lang-mix.mjs` → `lint-lang-mix: ok (9 pages, 807 blocks)`: **0 blocos destoantes**
em todos os 9 alvos, inclusive com `--max-words 0`. O limite do CI (prompt: «0 blocos destoantes
acima de N palavras, a definir após o antes») ficou **N = 0**: os menores destoantes do «antes» tinham
1–2 palavras (o `aria-label` «Account», o rótulo «Search element»), e depois da correção não sobra
nenhum. O e2e `e2e/share-and-print.spec.js` roda o mesmo lint sobre o DOM **depois** do `i18n.js`
(PT e EN das 3 páginas).

Fora das 3 páginas legais, o novo `bakeDataI18nHtml` também passa a valer no build das outras 18
páginas PT: 57 elementos `data-i18n-html` no total, todos conferidos no Chromium (sem JS) contra o
valor do dicionário, sem perda de elementos.

O que não foi mexido (texto jurídico, decisões de conteúdo) está em
[`legal-pendencias.md`](legal-pendencias.md).
