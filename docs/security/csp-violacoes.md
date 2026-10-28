# Violações da CSP Report-Only (etapa 2)

Gerado por `CSP_WRITE_REPORT=1 npx playwright test e2e/csp.spec.js`: 7 páginas × consentimento recusado e aceito, terceiros respondidos localmente. A política **aplicada** teve 0 violações nesses mesmos carregamentos (o teste falha se houver alguma).

Só aparece o que **executou** durante o carregamento: manipuladores `onclick`/`onchange` não disparados não entram aqui (veja as contagens em `csp-inventario.md`).

## Por diretiva

| Diretiva | Ocorrências |
|---|---|
| `script-src-attr` | 10 |
| `script-src-elem` | 10 |

## Detalhe

| Diretiva | Bloqueado | Amostra | Páginas | Cenários | Ocorrências |
|---|---|---|---|---|---|
| `script-src-attr` | inline | `this.media='all';document.documentElemen` | /, /periodic-table, /calculators, /pricing, /contact | accepted, refused | 10 |
| `script-src-elem` | inline | `(function(){try{var t=localStorage.getIt` | /login | accepted, refused | 2 |
| `script-src-elem` | inline | `(function(){var h=location.hash\|\|'',q=lo` | / | accepted, refused | 2 |
| `script-src-elem` | inline | `// ── theme function toggleTheme() { c` | / | accepted, refused | 2 |
| `script-src-elem` | inline | `// ═════════════════════════════════════` | /calculators | accepted, refused | 2 |
| `script-src-elem` | inline | `function toggleTheme(){var h=document.do` | /login | accepted, refused | 2 |
