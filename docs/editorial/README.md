# Revisão editorial

O que já aparecia nos artigos do Explore, antes deste ajuste: a linha **Atomurus · Editorial** (em PT, **Atomurus · Redação**), a data de atualização, o tempo de leitura e, no JSON-LD, `author`, `datePublished` e `dateModified`. Isso não foi duplicado.

O que este fluxo acrescenta é configurável em `tools/editorial-config.json` (arquivo fora do site publicado):

- `articles`: nível (`beginner`, `intermediate`, `advanced`) e três objetivos de aprendizagem, em inglês e português. Os valores atuais são sugestão para o professor.
- `reviewerName`: `null` até o dono informar um nome. Com `null`, nenhuma página ganha “Revisão:” nem `reviewedBy`.
- `reviewedAt`: reservado para a data que o dono quiser registrar. O script não inventa data.

Depois de preencher o nome:

```bash
node tools/apply-editorial-blocks.mjs
```

Rodar de novo não duplica o bloco. Para tirar o revisor, volte `reviewerName` para `null` e rode o script outra vez.

O inventário do que mudou, com a coluna de revisão de professor, está em `docs/editorial/inventario-13.md`.
