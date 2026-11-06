# Metas de Lighthouse mobile — proposta, não decisão

Isto **não está imposto**. O dono escolhe os números e se um orçamento entra no CI. A base é a mediana do «depois» em `c55c35956c10` (26/10/2026, America/Sao_Paulo, laboratório com terceiros bloqueados). Não é meta de produção.

Sugestão única para o próximo ciclo: cerca de **+10 pontos de Performance** em cada página, **LCP cerca de 20% menor** que a mediana atual, e **TBT na metade** quando a mediana atual passa de 10 ms. CLS da calculadora é o único que já está acima de 0,1; a proposta é trazê-lo para baixo de 0,1.

| Página | Performance agora | Proposta | LCP agora (ms) | LCP proposto | TBT agora (ms) | TBT proposto | O que chegaria lá |
|---|---:|---:|---:|---:|---:|---:|---|
| `/` | 65 | 75 | 6.156 | 4.900 | 24 | 12 | CSS crítico e menos trabalho no primeiro carregamento. O prompt 14 mexe no cabeçalho; não há trace que ligue o CLS 0,057 a esse CSS. |
| `/periodic-table` | 59 | 69 | 10.002 | 8.000 | 44 | 22 | Dividir `periodic-table.js` (prompt 24). Há 284 KiB de JS não usado nesta medição. |
| `/calculators` | 58 | 68 | 7.063 | 5.650 | 25 | 12 | CLS 0,126 é o furo. Reservar altura do que desloca a página e revisar o CSS crítico. |
| `/pricing` | 66 | 76 | 6.305 | 5.000 | 12 | 12 | A página já tem 0 KiB de JS não usado. O ganho teria de vir de HTML/CSS e do LCP, não de um bundle. |
| `/login` | 69 | 79 | 5.403 | 4.300 | 1 | 1 | TBT já é desprezível. SEO está em 66 nas duas medições; isso é outro eixo, não esta meta de performance. |

Nenhuma destas metas vira teste de CI neste prompt.
