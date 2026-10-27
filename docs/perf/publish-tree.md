# Publish enxuto (M03)

Inventário feito na `main` `c55c3595`. O prompt 15 ainda não está mergeado: `assets/concepts/` entra nesta lista para a guarda não se perder. Nada é apagado do Git. O scrub só roda no publish da Netlify e, nos testes, num diretório temporário.

`publish="."`. O que não está em `REMOVE_PATHS`, no scrub de `.md` ou numa regra 404 continua no ar.

## Referências

`rg` de `src/`, `dev/` e `e2e/` em HTML/JS/CSS publicados só acha comentários em `assets/ui/app-shell.css`, `toast.css` e `overlays.css`. Nenhuma página carrega esses diretórios.

`templates/chrome/*.html` é lido na hora do build por `tools/inject-public-shell.js` e copiado para o HTML. O diretório em si não é pedido pelo navegador. `hanzi-logic/` é um app à parte (`index.html`, `app.js`). Os dois ficam.

Funções leem `elements-data.js` e `assets/i18n/molecules.json` (`netlify.toml` → `[functions].included_files`). Esses arquivos não entram no scrub.

## Decisão

| Caminho | Decisão | Motivo |
|---|---|---|
| `dev/`, `e2e/`, `src/` | fora do publish | teste e protótipo |
| `playwright.config.js`, `build-i18n.js`, `bump-version.js`, `bump-version.ps1` | fora do publish | ferramenta de build |
| `add-content-script.js`, `add-share-script.js`, `enrich-element-schema.js`, `fix-adsense-head.js`, `fix-element-i18n.js`, `fix-mobile-scroll.js`, `migrate-element-seo.js`, `patch.js`, `sync-en-meta.js` | fora do publish | manutenção na raiz; o 404 por prefixo já existia |
| `assets/concepts/` | fora do publish | prompt 15 ainda não mergeado; imagens de proposta |
| `elements-data.js`, `assets/i18n/molecules.json`, `netlify/**` | manter | runtime das funções |
| `manifest.json`, `robots.txt`, `sitemap.xml`, `ads.txt`, HTML/JS/CSS públicos | manter | site |
| `hanzi-logic/**` (exceto `PROJECT.md`, que já sai), `templates/` | não tocar | decisão do dono |
| `docs/`, `propostas/`, `supabase/`, `*.md`, `package.json` | já saíam | scrub anterior |

## Build no worktree

`/atomurus-build` não pôde ser criado (permissão). O mesmo comando rodou em `/tmp/atomurus-build`, a partir do commit `19fa70af`, e terminou com sucesso: `npm ci`, `npm run build` (343 arquivos tocados pelo bump de versão), `npm run validate` (`Site validation passed`) e o scrub (33 caminhos, inclusive `dev`, `e2e`, `src`, os scripts de manutenção e `assets/concepts`).

Depois do scrub ainda estavam no disco `elements-data.js`, `assets/i18n/molecules.json` e `netlify/functions/`. `dev/`, `playwright.config.js` e `assets/concepts/` não. O worktree foi removido. O checkout de trabalho não foi scrubbed.
