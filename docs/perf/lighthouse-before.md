# Lighthouse mobile — linha de base (`before`)

Medição de laboratório local, com terceiros bloqueados. Estes números não são dados de campo e não são comparáveis em valor absoluto com o site ao vivo. Servem para comparar antes × depois na mesma máquina.

| Campo | Valor |
| --- | --- |
| Início | 26/10/2026 12:20:11 (America/Sao_Paulo) |
| Fim | 26/10/2026 12:23:15 (America/Sao_Paulo) |
| Lighthouse | 12.8.2 |
| Node | v22.23.4 |
| Commit medido | `805adc8c9378` |
| CPU | Intel(R) Xeon(R) Processor × 4 |
| Form factor | mobile |
| Throttling | simulate |
| Emulação de tela | 412×823 @1.75x, mobile=true |
| User-Agent emulado | Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36 |
| Execuções por página | 3 (valores da tabela = mediana) |
| Checkout servido | `/tmp/atomurus-baseline` |
| Requisições de terceiros concluídas | 0 |

## Resultados

| Página | Performance | A11y | Best Practices | SEO | LCP (ms) | TBT (ms) | CLS | FCP (ms) | Speed Index (ms) | Peso (KiB) | Requisições | JS não usado (KiB) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 66 | 100 | 82 | 100 | 6.309 | 0 | 0,017 | 4.580 | 4.580 | 950 | 59 | 31 |
| `/periodic-table` | 60 | 92 | 79 | 100 | 10.126 | 25 | 0,000 | 6.304 | 6.304 | 1.572 | 63 | 280 |
| `/calculators` | 58 | 92 | 82 | 100 | 7.354 | 9 | 0,122 | 5.553 | 5.553 | 1.126 | 61 | 48 |
| `/pricing` | 66 | 100 | 82 | 100 | 6.456 | 0 | 0,007 | 4.509 | 4.509 | 851 | 48 | 0 |
| `/login` | 68 | 98 | 79 | 66 | 5.703 | 0 | 0,017 | 4.278 | 4.278 | 657 | 47 | 0 |

## Variação (min–máx) entre as execuções

Performance é a nota 0–100 de cada execução. LCP é o valor de cada execução, em milissegundos.

| Página | Performance (min–máx) | LCP (min–máx, ms) |
| --- | ---: | ---: |
| `/` | 66–66 | 6.305–6.605 |
| `/periodic-table` | 60–60 | 9.975–10.131 |
| `/calculators` | 58–59 | 7.055–7.354 |
| `/pricing` | 65–66 | 6.455–6.464 |
| `/login` | 68–69 | 5.553–5.705 |

## Terceiros

Requisições de terceiros concluídas (status 2xx/3xx e bytes transferidos): **0**.

Hosts de terceiros vistos no relatório e não concluídos (bloqueados ou sem resposta): `acscdn.com`, `pagead2.googlesyndication.com`, `www.google.com`.

## Meta (a definir pelo dono)

