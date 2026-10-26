# Desempenho — linha de base Lighthouse (D03)

Medição repetível do Lighthouse em perfil **mobile**, nas cinco páginas do relatório de auditoria. O prompt 01 grava o «antes». O prompt 18 grava o «depois» e só então há base para falar de ganho.

Este diretório **não é publicado** (`.netlifyignore` e `tools/scrub-publish-tree.js`).

## Como rodar

Na raiz do repositório, com as dependências instaladas (`npm ci`) e o Chromium do Playwright presente:

```bash
npx playwright install chromium
npm run perf:lighthouse -- --label before
```

Atalhos:

| Comando | Efeito |
| --- | --- |
| `npm run perf:lighthouse -- --help` | Lista as opções |
| `--label before` ou `--label after` | Nome do resumo (`docs/perf/lighthouse-<label>.md`) |
| `--pages /,/login` | Mede só um subconjunto |
| `--runs 3` | Execuções por página (padrão 3; a tabela usa a mediana) |
| `--root <checkout>` | Serve outro checkout. A medição «antes» usa uma cópia limpa da `main` (`git worktree add ../atomurus-baseline main`) para não misturar com a árvore de trabalho |
| `--port 4310` | Porta do servidor estático local (padrão 4310) |

O script sobe `tools/e2e-serve.mjs` só em `127.0.0.1` e chama `npx --yes lighthouse@12`. O Lighthouse **não** entra no `package.json`. `CHROME_PATH` aponta para o Chromium do Playwright, com `--headless=new --no-sandbox`.

Saídas:

- `docs/perf/lighthouse-<label>.json` e `.md` — resumo pequeno, versionado. Cada número da tabela é a **mediana** das execuções.
- `docs/perf/raw/<label>/*.json` — relatório completo de cada execução. `docs/perf/raw/` está no `.gitignore` (não commitar o bruto).

Não há teste de Lighthouse no CI. Uma corrida depende da máquina (CPU, carga, versão do Chrome) e demora vários minutos; um teste de CI falharia por ruído, não por regressão de produto. A comparação válida é antes × depois **na mesma máquina**, com o mesmo comando.

## O que é medido

Páginas: `/`, `/periodic-table`, `/calculators`, `/pricing`, `/login`.

Perfil: o padrão mobile do Lighthouse 12 (emulação Moto G Power e throttling **simulado** de 4G lento), categorias performance, accessibility, best-practices e seo. O `.md` de cada medição copia o form factor, a tela e o user-agent que o Lighthouse de fato usou.

Por página, na mediana: Performance, Acessibilidade, Best Practices, SEO, LCP, TBT, CLS, FCP, Speed Index, peso total (KiB), número de requisições e bytes de JavaScript não usado. O `.md` também registra a variação min–máx de Performance e de LCP entre as execuções, para separar ganho real de ruído.

## Por que os terceiros ficam bloqueados

Anúncios, analytics, reCAPTCHA e fontes externas mudam de uma hora para outra, geram impressão ou hit em conta real e tornam a comparação antes × depois impossível. A lista de bloqueio é lida de `ads-gate.js`, `lazy-ads.js`, `recaptcha.js` e da CSP em `netlify.toml` (mais os sufixos conhecidos desses mesmos fornecedores) e passada ao Lighthouse em `--blocked-url-patterns`. Nenhuma dessas requisições deve ser concluída: o resumo traz «Requisições de terceiros concluídas: 0». Chrome também sobe com rede de fundo desligada, para não falar com os serviços de atualização do navegador.

O bloqueio é só na medição. Este procedimento não liga, não desliga e não altera anúncios do site.

## Números de laboratório

O valor absoluto **não** é o do site em produção. O servidor é local, a rede externa está bloqueada, o throttling é simulado e a CPU é a da máquina que rodou o comando. Use os arquivos `lighthouse-before` e `lighthouse-after` só para comparar duas medições feitas do mesmo jeito.

A meta numérica **não** é definida aqui. Cada `lighthouse-*.md` termina com a seção «Meta (a definir pelo dono)» vazia. Quem define a meta é o dono, depois de ver o antes e o depois (relatório, seção 14.1; de novo no prompt 18).

## Referência de produção (contexto, não meta)

Auditoria ao vivo em 26/10/2026, Lighthouse 12.8.2, mobile. Não é a linha de base deste repositório e não é alvo.

| Página | Perf mobile | Perf desktop | A11y | Best Pr. | SEO | LCP mobile | TBT mobile | CLS mobile |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 44 | 99 | 100 | 57 | 100 | 6,8 s | 840 ms | 0 |
| `/periodic-table` | 37 | 100 | 92 | 54 | 100 | 7,3 s | 1.240 ms | 0 |
| `/calculators` | 51 | 100 | 92 | 57 | 100 | 12,5 s | 120 ms | 0,122 |
| `/pricing` | 52 | 100 | 100 | 57 | 100 | 7,2 s | 450 ms | 0 |
| `/login` | 66 | 99 | 98 | 57 | 66 | 6,3 s | 160 ms | 0 |

Peso aproximado no relatório ao vivo: 625 KiB (home), 806 KiB (tabela), 1.483 KiB (calculadoras), 595 KiB (pricing), 548 KiB (login).
