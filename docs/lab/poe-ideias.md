# POE no Lab — ideias fora de escopo (prompt 27)

Nada disto está implementado. São propostas para o dono decidir.

## Salvar previsões na conta (Study Cloud)

Hoje a previsão fica **só na sessão do Lab** (o mesmo registro local que a bancada já usa) e some
quando o guia recomeça. Uma versão na conta poderia:

- gravar, por guia, `{ poeId, picked, actual, correct, at }` junto do histórico de estudo que a
  conta já tem, para o aluno rever «onde pensei errado» em outro aparelho;
- dar ao professor (plano escolar, prompt 34) um agregado por turma: quantos alunos previram cada
  alternativa antes de observar — útil para escolher o que discutir em aula.

Pontos a decidir antes: base legal e consentimento (dado de desempenho de estudante, possivelmente
menor de idade — ver `docs/i18n/legal-pendencias.md`), tempo de retenção, se o professor vê nomes
ou só o agregado, e se a previsão vira «nota» (o desenho atual é deliberadamente **sem nota**).

## Outros guias candidatos

| Guia | Pergunta possível | O que o motor mostra |
|---|---|---|
| `sugar` | Ao filtrar o caldo, onde fica o açúcar? | A fibra fica no funil; o caldo (com o açúcar dissolvido) passa. |
| `petroleum` | Qual fração chega primeiro ao coletor a 70 °C? | Só a leve (18 mL); a média fica no balão. |
| `distillation` (2ª pergunta) | Depois de destilar, ainda há etanol no balão? | Sim: 16 mL de etanol ficam com 57,9 mL de água. |

## Outras ideias

- Uma pergunta de «explique com suas palavras» (texto livre, só local) antes de mostrar a
  explicação — custa pouco e é a parte «E» do POE na forma mais forte.
- Mostrar no resumo final o gráfico da cabeça da destilação ao lado da previsão.
