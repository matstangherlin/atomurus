# CSP — plano por etapas (prompt 21, M05)

Números de `node tools/audit-csp.mjs` (`csp-inventario.md`/`.json`) e de `CSP_WRITE_REPORT=1 npx playwright test e2e/csp.spec.js` (`csp-violacoes.md`). A política vive em `tools/audit-csp.mjs` (`SOURCES`, `buildPolicy`, `reportOnlyPolicy`); o `netlify.toml` carrega o resultado e `tools/test-audit-csp.mjs` falha se os dois divergirem.

## Etapas

| Etapa | `script-src` | Como é servida | Estado |
|---|---|---|---|
| 0 | `'self' 'unsafe-inline'` + hosts antigos | `Content-Security-Policy` | substituída |
| 1 | `'self' 'unsafe-inline'` + hosts corrigidos | `Content-Security-Policy` | **aplicada neste branch** |
| 2 | `'self' 'report-sample'` + 55 hashes `sha256-…` + hosts; `script-src-attr 'none' 'report-sample'` | `Content-Security-Policy-Report-Only` (4.091 bytes, não bloqueia) | **publicada neste branch** |
| 3 | = etapa 2, com 0 violações | `Content-Security-Policy` | **decisão do dono** |

### O que a etapa 1 corrigiu (com prova)

O mesmo `e2e/csp.spec.js`, rodado com a política da etapa 0 (`main`), falha em `/contact` com consentimento aceito em exatamente estes bloqueios:

| Diretiva | Bloqueado na etapa 0 | Etapa 1 |
|---|---|---|
| `connect-src` | `https://region1.google-analytics.com/g/collect` | liberado por `https://*.google-analytics.com` |
| `connect-src` | `https://region1.analytics.google.com/g/collect` | `https://*.analytics.google.com` |
| `connect-src` | `https://www.googletagmanager.com/td` | `https://*.googletagmanager.com` |
| `connect-src` | `https://www.google.com/recaptcha/api2/clr` | `https://www.google.com/recaptcha/` |
| `frame-src` | `https://recaptcha.google.com` | `https://recaptcha.google.com/recaptcha/` |

É a constatação da auditoria («a medição do GA está sendo bloqueada»; `recaptcha/api2/clr`). A lista vem das páginas oficiais do Google — Tag Platform, [«Usar o Gerenciador de tags com uma Política de Segurança de Conteúdo»](https://developers.google.com/tag-platform/security/guides/csp?hl=pt-br), e o [FAQ do reCAPTCHA](https://docs.cloud.google.com/recaptcha/docs/faq) — conferidas pela busca; as páginas em si não estavam acessíveis da sessão de trabalho, então vale uma releitura antes da etapa 3.

Saíram da política: `fonts.googleapis.com`/`fonts.gstatic.com` e `www.youtube.com` (nenhuma página publicada carrega) e `www.google-analytics.com` em `script-src` (o GA4 não serve script de lá). As origens de anúncio (AdSense, AdCash) ficaram iguais: o `ads-gate.js` ainda as usa depois do consentimento de anúncios, e ligar ou desligar anúncios é decisão do dono.

## O que impede a etapa 3, em ordem de ganho

| # | Item | Arquivos | Hoje na etapa 2 | Risco | Patch idempotente resolve? |
|---|---|---|---|---|---|
| 1 | Scripts inline repetidos: `lc-loading` (324 páginas), autotag de anúncio (320), bootstrap de tema (304 + 20 numa variante), `toggleTheme()` (254) | ≈ 324 HTML | permitidos por hash | baixo: são idênticos em todas as páginas | **Sim.** Trocar cada bloco por `<script src="/assets/boot/…js">` libera ≈ 200 bytes de hash por script no cabeçalho, e o cabeçalho deixa de depender do conteúdo exato. Cuidado: o bootstrap de tema e o `lc-loading` precisam rodar **antes** da primeira pintura, então o arquivo externo fica no `<head>`, sem `defer` (ou fica o hash). |
| 2 | `<link … onload="this.media='all';…">` (CSS assíncrono) | 324 HTML (308 + 16 variantes) | violação `script-src-attr` em 5 das 7 páginas testadas | médio: errar deixa a página sem estilo | **Sim.** Mesmo efeito sem manipulador: um script externo único que percorre `link[data-async-css]` e troca `media`, ou carregar o CSS de forma síncrona onde ele é pequeno. `tools/patch-perf-async-css.js` gera o padrão hoje e precisa mudar junto. |
| 3 | Manipuladores `on*=` | 1.490 em 327 páginas: `onclick` 1.096 (325), `onload` 324, `onchange` 48 (14), `oninput` 14 (10), `onkeyup` 4, `onfocus` 2, `onkeydown` 2 | violação `script-src-attr` quando disparam | médio: cada manipulador é um comportamento | **Em grande parte.** 199 corpos distintos; os três maiores cobrem 757 ocorrências: `toggleTheme()` (323), o `onload` do CSS (308, item 2) e `toggleMobileSidebar()` (126). Delegação por `data-action="toggle-theme"` num script externo resolve esses por patch; os ≈ 190 restantes (tabela periódica, calculadoras, isomeria) são código de página e pedem migração arquivo a arquivo. |
| 4 | Scripts inline únicos ou de poucas páginas | 116 distintos, 209 usos, ≈ 199 KB, fora do orçamento de 4 KiB do cabeçalho (23 aparecem numa página só; 93 em 2–9) | violação `script-src-elem` | médio a alto: é a lógica das páginas (calculadoras, viewers) | **Não.** Externalizar como arquivo `.js` por página (ou por família de páginas, como as 118 de elemento e as de isomeria). Sem isso a etapa 3 bloquearia essas páginas. |

Ordem sugerida: 1 → 2 → 3 (os três maiores) → 4 página a página, rodando `e2e/csp.spec.js` e lendo `csp-violacoes.md` a cada passo. Cada item cabe num prompt próprio, com `--dry-run` como padrão no script de patch.

### Por que hashes e não nonces

O site é estático: a Netlify serve arquivos prontos, e um nonce exigiria uma edge function reescrevendo cada HTML a cada requisição. Hash funciona sem servidor, mas cada script inline custa ≈ 54 bytes no cabeçalho e muda quando o texto muda — por isso a etapa 3 depende de externalizar, não de acumular hashes.

## Decisões do dono

| Decisão | Opções | Padrão neste branch |
|---|---|---|
| Aplicar a etapa 3 | (a) depois de zerar as violações do Report-Only; (b) por partes, com `script-src-elem`/`script-src-attr` separados; (c) não aplicar | não aplicada |
| Endpoint de relatórios | (a) nenhum (só console do navegador); (b) função Netlify própria com `report-to`; (c) serviço externo | nenhum |
| Anúncios | (a) continuam após consentimento → origens ficam; (b) desligados de vez → remover AdSense/AdCash da política e estreitar `www.google.com`/`www.gstatic.com` para `/recaptcha/` | (a), como hoje |

## Passos manuais do dono

1. Publicar este branch e, por alguns dias, olhar o console do navegador em produção (mensagens «[Report Only]») nas páginas mais visitadas.
2. Se ligar um endpoint de relatórios, acrescentar `report-to` só no `Content-Security-Policy-Report-Only` primeiro.
3. Se desligar anúncios de vez, ajustar `SOURCES.ads` em `tools/audit-csp.mjs`, regenerar com `node tools/audit-csp.mjs --emit-policy` e `--emit-report-only` e colar no `netlify.toml` (o teste acusa se esquecer).
4. Decidir a etapa 3 e a janela de publicação.
