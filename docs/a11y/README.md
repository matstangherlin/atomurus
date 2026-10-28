# Acessibilidade — como medir

Três ferramentas, nenhuma dependência nova no `package.json`.

| Ferramenta | O que mede | Roda na CI |
|---|---|---|
| `node tools/a11y-static.mjs` | Nos HTML publicáveis (mesmas pastas excluídas do `validate-site.js`): campos sem nome, botões cujo `aria-label` não contém o texto visível, skip link no início do `<body>`, `role="dialog"` sem nome. `--report <arquivo.md>` grava o detalhe; `--strict` sai com 1 se algo falhar. | sim (`npm run test:a11y`) |
| `node tools/check-contrast.mjs` | Razão de contraste WCAG dos pares de tokens de texto × fundo nos temas claro e escuro. | sim |
| `node tools/check-font-sizes.mjs` | Declarações `font-size` abaixo de 12 px nos CSS da tabela periódica. | sim |
| `node tools/a11y-axe.mjs` | axe-core no Chromium do Playwright, 1280 px e 390 px, em `/`, `/calculators` e `/periodic-table` (EN e PT). | **não** — só roda se o `axe-core` estiver instalado; sem ele imprime «axe indisponível — pulado» e sai com 0. |

## Rodar o axe localmente (sem mexer no repositório)

O `axe-core` **não** é dependência do projeto (decisão do dono). Para rodar uma vez:

```bash
mkdir -p /tmp/atomurus-axe && cd /tmp/atomurus-axe && npm init -y && npm install axe-core@4.10.2
```

```bash
cd ~/caminho/para/atomurus && node tools/a11y-axe.mjs --axe /tmp/atomurus-axe --open-modal
```

- `--open-modal` também audita a tabela periódica com o modal de um elemento aberto.
- `--pages /,/calculators.html` escolhe as páginas; `--json saida.json` grava o resultado; `--strict` sai com 1 se sobrar algo nas regras do M09.
- O script sobe o mesmo servidor local do e2e (`tools/e2e-serve.mjs`, porta 4179) e usa o Chromium do Playwright; se o navegador do Playwright não estiver instalado, passe `--chromium /caminho/do/chrome`.
- A regra `label-content-name-mismatch` é experimental no axe; o script a liga.

Se o dono decidir colocar o axe na CI, o caminho mais curto é `npm i -D axe-core` (ou `@axe-core/playwright`) e trocar o passo opcional por `node tools/a11y-axe.mjs --strict` no `site-quality.yml`.

## Relatórios

- `a11y-antes.md` — medição antes das correções do prompt 23.
- `a11y-depois.md` — mesma medição depois, com o que fica para o prompt 35.
- `contraste.md` — tokens alterados, antes → depois (hex e razão), nos dois temas.

## Testar com leitor de tela (passo manual)

As medições acima são de DOM e axe. Antes de considerar concluído, teste `/calculators` e `/periodic-table` com NVDA (Windows) ou VoiceOver (macOS/iOS): Tab até o botão de idioma, abrir o modal de um elemento com Enter, navegar dentro dele e fechar com Esc.
