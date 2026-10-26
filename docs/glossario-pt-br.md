# Glossário PT-BR da interface

Termos adotados na interface em português. Vale para o dicionário (`tools/i18n-dict-source.js`), o HTML estático e as strings exibidas ao usuário. Identificadores de código, classes, ids, chaves de i18n e nomes de arquivo não mudam.

| Termo EN | Termo PT adotado | Quando usar |
|---|---|---|
| beaker, becker | béquer | Vidraria. Plural: béqueres. |
| board (laboratório) | bancada | Superfície onde o aluno monta a vidraria. |
| board (painel) | painel | Quadro ou painel de controle, quando não for a bancada. |
| atomic weight | massa atômica | Não usar "peso atômico" na interface. |
| queued, na fila | em breve | Recurso ainda não disponível. |
| reaction ratios, razões de reação | proporções da reação | Descrição da calculadora de estequiometria. |
| preset (botão de exemplo) | exemplo | Botão que carrega um caso pronto. Plural visível: Exemplos. |
| preset (configuração) | predefinição | Configuração salva, não o botão de exemplo. |
| compact chemical computation suite | conjunto de calculadoras de química | Substitui "suíte compacta de computação química". |

## Números exibidos

Os resultados das calculadoras seguem o idioma ativo, não o arquivo. Em PT a vírgula é o separador decimal (`98,07`, `0,0821`). O ponto de milhar só aparece a partir de 10.000 e fora da notação científica (`12.345`). Valores com módulo ≥ 100.000 ou menor que 0,001 continuam na regra de algarismos significativos de `fmt` e, em PT, saem como `1,013×10⁵`. Os campos `<input type="number">` não mudam.

## Workspace

"Workspace" permanece como está. É decisão do dono: manter o anglicismo ou passar a "Área de estudo" / "Espaço de trabalho".
