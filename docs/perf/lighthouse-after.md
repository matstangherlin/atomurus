# Lighthouse mobile — linha de base (`after`)

Medição de laboratório local, com terceiros bloqueados. Estes números não são dados de campo e não são comparáveis em valor absoluto com o site ao vivo. Servem para comparar antes × depois na mesma máquina.

| Campo | Valor |
| --- | --- |
| Início | 26/10/2026 22:54:54 (America/Sao_Paulo) |
| Fim | 26/10/2026 22:57:57 (America/Sao_Paulo) |
| Lighthouse | 12.8.2 |
| Node | v22.23.4 |
| Commit medido | `c55c35956c10` |
| CPU | Intel(R) Xeon(R) Processor × 4 |
| Form factor | mobile |
| Throttling | simulate |
| Emulação de tela | 412×823 @1.75x, mobile=true |
| User-Agent emulado | Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36 |
| Execuções por página | 3 (valores da tabela = mediana) |
| Checkout servido | `/workspace` |
| Requisições de terceiros concluídas | 0 |

## Resultados

| Página | Performance | A11y | Best Practices | SEO | LCP (ms) | TBT (ms) | CLS | FCP (ms) | Speed Index (ms) | Peso (KiB) | Requisições | JS não usado (KiB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 65 | 100 | 82 | 100 | 6.156 | 24 | 0,057 | 4.880 | 4.880 | 968 | 58 | 31 |
| `/periodic-table` | 59 | 92 | 79 | 100 | 10.002 | 44 | 0,005 | 6.532 | 6.532 | 1.598 | 62 | 284 |
| `/calculators` | 58 | 92 | 82 | 100 | 7.063 | 25 | 0,126 | 5.409 | 5.409 | 1.176 | 62 | 49 |
| `/pricing` | 66 | 100 | 82 | 100 | 6.305 | 12 | 0,007 | 4.730 | 4.730 | 869 | 47 | 0 |
| `/login` | 69 | 98 | 79 | 66 | 5.403 | 1 | 0,029 | 4.353 | 4.353 | 679 | 46 | 0 |

## Variação (min–máx) entre as execuções

Performance é a nota 0–100 de cada execução. LCP é o valor de cada execução, em milissegundos.

| Página | Performance (min–máx) | LCP (min–máx, ms) |
| --- | ---: | ---: |
| `/` | 64–65 | 6.156–6.605 |
| `/periodic-table` | 59–60 | 7.803–10.003 |
| `/calculators` | 57–58 | 7.054–7.355 |
| `/pricing` | 66–67 | 5.856–6.311 |
| `/login` | 69–70 | 5.253–5.403 |

## Terceiros

Requisições de terceiros concluídas (status 2xx/3xx e bytes transferidos): **0**.

Hosts de terceiros vistos no relatório e não concluídos (bloqueados ou sem resposta): `www.google.com`.

## Meta (a definir pelo dono)

