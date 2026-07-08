# Melhorias sugeridas — Atomurus

> Análise feita em 2026-06-10 sobre a pasta do projeto. Itens ordenados por prioridade.
> ⚠️ Nota: como o `netlify.toml` usa `publish = "."`, **este próprio arquivo .md será publicado no site** se você fizer deploy desta pasta — assim como os já existentes `MAILGUN-SETUP.md` e `RECAPTCHA-SETUP.md`. Veja o item 1.

---

## 🔴 1. CRÍTICO — Backups .zip contêm o `.env` com a chave do Mailgun

Os arquivos `netlify.zip`, `config.zip` e `2 june.zip` na raiz do projeto **contêm o arquivo `.env` com a chave privada da API do Mailgun** (verificado: os três têm uma entrada `.env` dentro).

Como o `netlify.toml` define `publish = "."`, **tudo que está na raiz é publicado**. Se esta pasta for deployada como está, qualquer pessoa poderá baixar `atomurus.com/netlify.zip` e extrair a chave.

**Situação atual:** verifiquei o site em produção — `atomurus.com/netlify.zip` e `/.env` retornam 404 hoje. Ou seja, o vazamento ainda não aconteceu, mas está "armado" para o próximo deploy desta pasta.

**Atualização:** confirmado com o dono do projeto que os zips são apagados antes de cada deploy — o risco é o processo manual (um deploy com pressa em que se esquece de apagar). O item 2 (git) elimina essa etapa manual de vez.

**Ações:**
1. Mover todos os `.zip` para fora da pasta do projeto (ou apagar — ver item 2, o git substitui esses backups).
2. Remover também: `i18n.js.bak-20260609-073801`, `.server-8877.out.log`, `.server-8877.err.log`, `.server-8877.out.zip`.
3. **Rotacionar a chave do Mailgun por precaução** (Mailgun → API Keys → regenerate, e atualizar no painel do Netlify). Se algum desses zips já foi enviado por e-mail/drive, a chave deve ser considerada exposta.

## 🔴 2. CRÍTICO — Projeto sem controle de versão (git)

A pasta não é um repositório git. Os backups estão sendo feitos manualmente via zip (daí os 30 MB de `.zip` na raiz), o que causou o problema do item 1 e não dá histórico, diff nem rollback.

**Ações:**
1. `git init` + commit inicial (o `.gitignore` já existe e já cobre `.env` — bom sinal).
2. Criar repositório **privado** no GitHub e conectar ao Netlify (deploy automático a cada push). Isso elimina a necessidade dos zips e dá rollback de deploys pelo painel do Netlify.
3. Tirar o projeto de `Downloads\30mayy (2)` e mover para uma pasta estável (ex.: `C:\projetos\atomurus`).

## 🟠 3. Separar o que é "site" do que é "ferramenta de build"

Com `publish = "."`, são publicados como arquivos públicos do site:

- ~15 scripts de migração one-off na raiz: `fix-element-i18n.js`, `fix-mobile-scroll.js`, `fix-adsense-head.js`, `migrate-element-seo.js`, `sync-en-meta.js`, `enrich-element-schema.js`, `add-share-script.js`, `add-content-script.js`, `patch.js`, etc.
- Documentação interna: `MAILGUN-SETUP.md`, `RECAPTCHA-SETUP.md` (e este arquivo).
- A pasta `scripts/` inteira (patches, traduções em JSON, ferramentas de debug).

Nada disso é dano direto (não há segredos neles), mas aumenta a superfície exposta, polui o deploy e torna a raiz difícil de navegar.

**Ações:**
1. Mover scripts one-off já executados para `tools/` (ou apagar — com git, ficam no histórico).
2. Manter na raiz apenas o que o site serve + `build-i18n.js` / `bump-version.js` (referenciados no build command).
3. Alternativa mais robusta a longo prazo: estrutura `site/` (publicado) + `tools/` (build), com `publish = "site"`.

## 🔴 4. Performance — a lentidão medida (análise do relatório Lighthouse de 09/06/2026)

> **STATUS (2026-06-10): correções aplicadas.** ✅ CSP `frame-src` corrigida · ✅ redirect de idioma 302→200 · ✅ fontes self-hosted em `/assets/fonts/` com preload (substituindo o truque `media="print"` em 304 arquivos HTML) · ✅ `aria-label` no link-ícone da nav. Verificado localmente: zero requisições a fonts.googleapis/gstatic, console limpo, layout intacto em mobile e desktop. Pendentes: pre-warm pós-deploy, CSS crítico inline, divisão dos bundles.

Relatório analisado: Lighthouse 9.6.8 rodado pelo plugin do Netlify sobre a **home** do deploy preview (`6a27f350…--216y56y.netlify.app`), emulação **mobile** (Moto G4) com throttling simulado.

**Scores:** Performance **65** · Acessibilidade 98 · Best Practices 83 · SEO 100 · PWA 80

| Métrica | Valor | Score | Status |
|---|---|---|---|
| TTFB (resposta do servidor) | **750 ms** | 0 | 🔴 reprovado |
| First Contentful Paint | **3,5 s** | 0.35 | 🔴 |
| Largest Contentful Paint | **4,4 s** | 0.39 | 🔴 (elemento: o `<h1>` do hero — texto, não imagem) |
| Cumulative Layout Shift | **0,28** | 0.43 | 🔴 reprovado (limite "bom" = 0,1; "ruim" > 0,25) |
| Total Blocking Time | 110 ms | 0.97 | ✅ |
| Speed Index | 4,1 s | 0.80 | 🟡 |

**Leitura geral:** o problema NÃO é JavaScript pesado em execução (TBT está ótimo). O delay percebido vem de **três causas encadeadas antes do primeiro paint**: servidor demora a responder → CSS bloqueia a renderização → as fontes chegam atrasadas e fazem a página "pular". Detalhe por causa:

### Causa 1 — TTFB alto (cache de borda frio + redirect 302 de idioma)

Medição feita em produção (`atomurus.com`, 2026-06-10):

```
1ª requisição: 1.731 ms  (Cache-Status: "Netlify Edge"; fwd=miss)
2ª requisição:    70 ms  (hit)
3ª requisição:    69 ms  (hit)
```

O primeiro acesso por região/nó de borda após cada deploy paga ~1,7 s só de TTFB — e **cada deploy invalida o cache**, então quem visita logo depois sente o site "lento". Agrava para o público principal (Brasil): o visitante PT de primeira viagem faz `/` → **302** → `/?lang=pt-BR` — um round-trip extra E uma variante de cache separada, dobrando a chance de pegar miss.

**Ações:**
1. ✅ **FEITO (2026-06-10)** — redirect 302 trocado por rewrite 200 condicionado a `Language` no `netlify.toml`: elimina o round-trip extra para todo visitante brasileiro. (O corpo de `index.pt.html` é idêntico ao de `index.html` — só o head muda — então a preferência explícita de idioma do usuário continua sendo respeitada client-side.)
2. Pendente: pré-aquecer o cache pós-deploy — um passo no build (ou GitHub Action) que faz `curl` nas ~10 páginas principais (com e sem `?lang=pt-BR`) logo após o deploy.

### Causa 2 — CSS bloqueante + troca de fonte (explica FCP 3,5 s, LCP 4,4 s e CLS 0,28)

- `atomurus-lab-console.css` (170 KB bruto / ~30 KB comprimido) é o **único recurso render-blocking**: 488 ms segurando o primeiro paint de todas as páginas.
- As fontes carregam via truque `media="print" onload` — ou seja, **garantidamente depois** do primeiro paint. O título do hero (`.lc-hero-title`, 40–80 px, Inter Tight + Instrument Serif itálico) renderiza na fonte fallback e depois troca → o `header.lc-hero` sozinho contribui **0,22 dos 0,28** de CLS.
- Contribuição menor (0,03): o `#ds-time` da data-strip troca "— ms ago" pelo horário real via JS, mudando a largura.

**Ações:**
1. ✅ **FEITO (2026-06-10), melhor que o planejado** — fontes agora são **self-hosted** em `/assets/fonts/` (subsets latin/latin-ext baixados do Google Fonts; Inter Tight, JetBrains Mono e DM Sans vieram como fontes variáveis — 1 arquivo cobre todos os pesos). Em todos os 304 HTML: preconnects para Google removidos, truque `media="print"` removido, e adicionados preloads dos woff2 críticos (Inter Tight + JetBrains Mono + Instrument Serif itálico; nos artigos do Explore também o Instrument Serif normal do título; nas páginas DM, DM Serif Display + DM Sans). Bônus: zero conexões third-party no caminho crítico (era DNS+TLS para 2 domínios) e cache imutável de 1 ano via regra `/assets/*` existente.
2. Pendente (só se o CLS residual incomodar): fallback metric-matched (`size-adjust`/`ascent-override`).
3. Pendente: inline do CSS crítico do above-the-fold (hero + nav) no `<head>` — ataca os 488 ms do CSS bloqueante.
4. ~~Reservar largura do `#ds-time`~~ — investigado e descartado: a data-strip é um scroll container (`overflow-x:auto`) no mobile e tem um spacer flex no desktop, então a troca do texto não causa CLS de página; o shift dela vinha da troca de fonte da nav acima (resolvido pelo preload).

### Causa 3 — AdSense (peso, long tasks e erro de CSP)

- 157 KB de JS **não usado** baixado da pagead2.googlesyndication.com; long tasks de 149 ms e 99 ms; 130 ms de bloqueio de main thread.
- O `adsbygoogle.js` é carregado eager no `<head>` (linha 7 do `index.html`) apesar de existir um `lazy-ads.js`.
- **A CSP está bloqueando um frame do próprio AdSense**: `ep2.adtrafficquality.google` está em `script-src`/`connect-src` mas **falta em `frame-src`** → erros no console em toda página → é isso que derruba Best Practices para 83.

**Ações:**
1. ✅ **FEITO (2026-06-10)** — `https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google` adicionados ao `frame-src` da CSP no `netlify.toml`. Limpa os erros de console e recupera o score de Best Practices.
2. ~~Carregar o `adsbygoogle.js` via lazy-ads~~ — **descartado de propósito**: o comentário no topo do `lazy-ads.js` documenta que o AdSense precisa ficar eager no `<head>` (detecção de snippet + varredura do Auto Ads); o lazy-ads cobre só o Analytics. O custo dos 157 KB é o preço de rodar AdSense — decisão de produto, não bug.

### Outros apontamentos do relatório

- **`content-width` reprovado (PWA):** investigado em 360 px — **falso positivo**. Não há scroll horizontal real (`scrollLeft` não passa de 0); a diferença de exatamente 16 px bate com a barra de rolagem clássica do Chrome headless antigo (v107) que o plugin do Netlify usa. Nada a corrigir.
- ✅ **`link-name` (acessibilidade) — FEITO (2026-06-10):** era o `a.lc-topnav-cta` (no mobile o CSS esconde o texto e sobra só o ícone). Adicionado `aria-label="Open lab"` + `data-i18n-attr="aria-label:common.openLab"` (traduz para "Abrir lab" em PT) nos 10 arquivos que têm essa nav.
- `service-worker` reprovado — já coberto no item 9.

### Bundles grandes (afeta as OUTRAS páginas, não a home)

O relatório é da home (482 KB total — leve). Mas as páginas de elementos carregam `elements-content.js` (**533 KB** — conteúdo dos 118 elementos para mostrar 1) e todas as páginas carregam `i18n.js` (**206 KB**). As mesmas causas 1 e 2 acima + esses bundles tornam as páginas internas ainda mais lentas que a home medida.

**Ações:**
1. Dividir `elements-content.js` por elemento (`elements-content/<slug>.js`) ou pré-renderizar o conteúdo no HTML de cada elemento via `build-i18n.js`.
2. Dividir `i18n.js` por página/namespace (`i18n/common.js` + `i18n/<página>.js`).
3. Auditar `atomurus-lab-console.css` com o coverage do DevTools e dividir o que for específico de página.
4. Comprimir `assets/og-bhopal-disaster.png` (676 KB vs ~35 KB das outras og-images; só scrapers baixam, mas não custa).

## 🟠 5. SEO — seção de isomeria com a "cabeça" inconsistente

**Investigado a fundo em 2026-06-11.** A duplicação `isomerism/` vs `viewer/isomerism/` é menos grave do que parecia: **todas** as cópias declaram canonical para `/viewer/isomerism/...`, então o Google consolida sozinho. Mas a investigação revelou problemas reais:

1. **Os `.pt.html` das 7 subpáginas de isomeria são stubs quebrados** — 5 meta tags órfãs ANTES do `<!DOCTYPE>` + um `location.replace()` para a versão EN. Nunca são servidos (não há regra no netlify.toml — sorte, porque criaria loop de redirect). O PT dessas páginas funciona só client-side via `?lang=pt-BR`.
2. **Os 4 arquivos do hub** (`isomerism.html`, `isomerism.pt.html`, `viewer/isomerism.html`, `viewer/isomerism.pt.html`) canonicalizam TODOS para `/viewer/isomerism?lang=pt-BR`, e os "EN" têm título em português. A seção é uma migração pela metade.
3. **Todas as subpáginas têm o mesmo título genérico** "Isomerism | Atomurus" — desperdício de SEO (deveriam ser "Isomeria de Cadeia", "Isomeria Óptica" etc.).

**Ações ainda pendentes:**
1. Apagar os stubs `.pt.html` das subpáginas e gerar variantes PT reais (ou aceitar o PT client-side e remover os stubs).
2. Normalizar os canonicals do hub (decidir: EN-default como o resto do site, ou PT-canonical de vez — hoje está incoerente).
3. Títulos/descriptions únicos por subpágina.
4. ✅ **FEITO (2026-06-11):** sitemap lista só os caminhos canônicos (`/viewer/isomerism/...`); regra PT do hub adicionada ao `netlify.toml`.

## 🟡 6. Página 404 personalizada

Não existe `404.html`. O Netlify usa essa convenção automaticamente — basta criar o arquivo na raiz. Hoje o visitante que erra uma URL cai na página genérica do Netlify, sem navegação de volta e sem o idioma dele.

**Ação:** criar `404.html` bilíngue com o header/nav do site e links para a tabela periódica e o /explore.

## 🟡 7. Automatizar o que hoje é manual no build

Cada página nova exige hoje edições manuais coordenadas em 3 lugares — fácil de esquecer um:

1. **Redirects PT no `netlify.toml`** — há ~30 blocos `[[redirects]]` repetitivos, um por página. O `build-i18n.js` já sabe quais `.pt.html` existem; ele pode gerar um arquivo `_redirects` automaticamente no build.
2. ✅ **PARCIAL (2026-06-11):** `sitemap.xml` agora é gerado por script (`scripts/gen-sitemap.ps1` — rode após adicionar páginas). Reescrito com **301 entradas** (antes 143): cada página em ambos os idiomas (EN-default: URL limpa + `?lang=pt-BR`; elementos PT-default: URL limpa + `?lang=en`), todas com os 3 hreflang alternates, `lastmod` real do arquivo e só caminhos canônicos. Falta portar para Node e pendurar no build do Netlify para ficar 100% automático.
3. Com isso, adicionar um artigo no `/explore` vira: criar os 2 HTML e pronto.

**Bônus:** adicionar npm scripts no `package.json` para padronizar os comandos:

```json
"scripts": {
  "dev": "netlify dev",
  "build": "node bump-version.js && node build-i18n.js",
  "serve": "powershell -File scripts/static-server.ps1"
}
```

## 🟡 8. Segurança — quick wins nos headers

O `netlify.toml` já tem um bom conjunto (CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy). Faltam dois refinamentos:

1. **HSTS ausente** — adicionar ao bloco global:
   ```toml
   Strict-Transport-Security = "max-age=31536000; includeSubDomains"
   ```
2. **CSP com `'unsafe-inline'` em `script-src`** — os scripts inline de bootstrap (tema/idioma) podem ser autorizados por hash (`'sha256-…'`) em vez de liberar todo inline. Médio esforço: o `bump-version.js` precisaria recalcular os hashes quando o script inline mudar. Vale fazer quando os bootstraps estabilizarem.

## 🟡 9. PWA incompleto

O `manifest.json` declara `display: standalone`, mas:

- **Não há service worker** — sem ele o app não funciona offline e o Chrome não considera o site "instalável" de verdade. Um SW simples de cache-first para CSS/JS/assets (que já são imutáveis com `?v=`) seria suficiente. Alternativa válida: remover `display: standalone` e tratar o manifest só como metadados.
- **O mesmo PNG (`atomurus-logo.png`) é declarado como 192×192, 512×512 e maskable** — um único arquivo não tem três tamanhos. Gerar ícones reais (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png` com a margem de segurança de 20% para maskable).
- `"lang": "en"` fixo no manifest, num site PT-first — menor, mas vale alinhar.

## 🟢 10. Criar um README.md (documentação da arquitetura)

Não há README. A arquitetura i18n do projeto é sofisticada e **invertida entre seções** (páginas principais: EN default + `.pt.html`; páginas de elementos: PT default + `.en.html`) — isso está documentado só em comentários espalhados no `netlify.toml` e nos scripts. Quem pegar o projeto (ou você daqui a 6 meses) vai precisar de:

- Mapa das convenções de arquivo por idioma e por seção.
- Como funciona o pipeline `bump-version.js` → `build-i18n.js`.
- Passo a passo para adicionar: um artigo no `/explore`, uma página nova, um idioma novo.
- Variáveis de ambiente necessárias (já documentadas no topo do `netlify.toml` — consolidar).

## 🟢 11. Qualidade — validação automática

Não há nenhum check automatizado. Para um site com 280+ HTMLs gerados/patcheados por scripts, dois checks baratos pegariam muita regressão:

1. **Link checker** no build ou em CI (ex.: `lychee` ou `linkinator`) — links internos quebrados entre 280 páginas são quase inevitáveis sem isso.
2. **Validação de paridade i18n** — script que confere que todo `.html` tem seu par `.pt.html`/`.en.html` e que ambos têm `<title>`, `og:*` e `hreflang` coerentes. O `build-i18n.js` é o lugar natural para falhar o build se a paridade quebrar.

---

## Resumo priorizado

| # | Item | Esforço | Impacto |
|---|------|---------|---------|
| 1 | Remover zips com `.env` + rotacionar chave Mailgun | minutos | crítico (segurança) |
| 2 | `git init` + GitHub privado + deploy via git | 1h | crítico (segurança/processo) |
| 3 | Limpar raiz / separar build de site | 1–2h | alto (higiene do deploy) |
| 4a | ✅ FEITO — CSP `frame-src` p/ adtrafficquality | — | alto (limpa console + Best Practices) |
| 4b | ✅ FEITO — fontes self-hosted + preload (sem `media="print"`) | — | alto (CLS 0,28 → esperado <0,1) |
| 4c | ✅ FEITO — redirect de idioma 302 → rewrite 200 (pre-warm pendente) | — | alto (TTFB p/ visitantes BR) |
| 4d | CSS crítico inline / dividir CSS global | meio dia | alto (FCP/LCP) |
| 4e | ~~AdSense lazy~~ — descartado (eager no head é intencional p/ Auto Ads) | — | — |
| 4f | Dividir `elements-content.js` e `i18n.js` | 1–2 dias | alto (páginas internas) |
| 5 | Consolidar `isomerism/` duplicado com 301 | 1h | alto (SEO) |
| 6 | `404.html` personalizada | 1h | médio |
| 7 | Gerar `_redirects` + `sitemap.xml` no build | meio dia | médio (manutenção) |
| 8 | HSTS + CSP por hash | 1h / meio dia | médio (segurança) |
| 9 | Service worker + ícones PWA corretos | meio dia | médio |
| 10 | README.md de arquitetura | 1–2h | médio (longo prazo) |
| 11 | Link checker + paridade i18n no build | meio dia | médio (qualidade) |
