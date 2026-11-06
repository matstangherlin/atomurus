# Lighthouse mobile — antes × depois

Comparação de laboratório. Terceiros bloqueados nas duas medições. Mesma máquina (Intel Xeon × 4), mesmo Node v22.23.4, mesmo Lighthouse 12.8.2, perfil mobile simulado (412×823, Moto G Power), mediana de 3 execuções.

| | Antes | Depois |
|---|---|---|
| Commit | `805adc8c9378` | `c55c35956c10` |
| Quando (America/Sao_Paulo) | 26/10/2026 12:20–12:23 | 26/10/2026 22:54–22:57 |
| Script | `tools/lighthouse-baseline.mjs` | o mesmo arquivo (último commit do script: `42ded3ba`) |
| Checkout | `/tmp/atomurus-baseline` | `/workspace` |

O script não mudou desde o «antes». As opções são as mesmas. A `main` medida **não** inclui os prompts 15, 16 e 17 (PRs #55, #56 e #57 ainda abertas). Entram o consentimento (04), o cabeçalho mobile (14) e o restante que já está na `main` entre os dois commits.

**Ruído:** um delta está fora do ruído quando os intervalos min–máx das 3 execuções não se cruzam. Delta dentro do cruzamento não é melhoria nem piora.

## `/`

| Métrica | Antes | Depois | Delta | % | min–máx antes | min–máx depois | Ruído |
|---|---:|---:|---:|---:|---|---|---|
| Performance | 66 | 65 | −1 | −1,5% | 66–66 | 64–65 | fora |
| A11y | 100 | 100 | 0 | 0% | 100–100 | 100–100 | dentro |
| Best Practices | 82 | 82 | 0 | 0% | 82–82 | 82–82 | dentro |
| SEO | 100 | 100 | 0 | 0% | 100–100 | 100–100 | dentro |
| LCP (ms) | 6.309 | 6.156 | −153 | −2,4% | 6.305–6.605 | 6.156–6.605 | dentro |
| TBT (ms) | 0 | 24 | +24 | — | 0–0 | 12–39 | fora |
| CLS | 0,017 | 0,057 | +0,040 | +235% | 0,017–0,017 | 0,017–0,057 | fora |
| FCP (ms) | 4.580 | 4.880 | +300 | +6,6% | 4.579–4.582 | 4.805–5.029 | fora |
| Speed Index (ms) | 4.580 | 4.880 | +300 | +6,6% | 4.579–4.582 | 4.805–5.029 | fora |
| Peso (KiB) | 950 | 968 | +18 | +1,9% | 950–950 | 968–968 | fora |
| Requisições | 59 | 58 | −1 | −1,7% | 59–59 | 58–58 | fora |
| JS não usado (KiB) | 31 | 31 | 0 | 0% | 31–31 | 31–31 | dentro |

Melhorou fora do ruído: uma requisição a menos. Não mudou, ou ficou dentro do ruído: A11y, Best Practices, SEO, LCP, JS não usado. Piorou fora do ruído: Performance (−1), TBT, CLS, FCP, Speed Index e peso.

Hosts de anúncio que o «antes» ainda via bloqueados (`acscdn.com`, `pagead2.googlesyndication.com`) não aparecem no «depois». Requisições de terceiros concluídas: 0 nos dois. Causa provável da lista de hosts: prompt 04 tirou o carregamento eager de anúncio do HTML. O peso e o TBT não vêm disso — os terceiros já eram bloqueados e transferiam 0 byte. Causa do peso, do TBT, do CLS e do FCP: sem causa identificada. O prompt 15 (imagens) não está neste commit.

## `/periodic-table`

| Métrica | Antes | Depois | Delta | % | min–máx antes | min–máx depois | Ruído |
|---|---:|---:|---:|---:|---|---|---|
| Performance | 60 | 59 | −1 | −1,7% | 60–60 | 59–60 | dentro |
| A11y | 92 | 92 | 0 | 0% | 92–92 | 92–92 | dentro |
| Best Practices | 79 | 79 | 0 | 0% | 79–79 | 79–79 | dentro |
| SEO | 100 | 100 | 0 | 0% | 100–100 | 100–100 | dentro |
| LCP (ms) | 10.126 | 10.002 | −124 | −1,2% | 9.975–10.131 | 7.803–10.003 | dentro |
| TBT (ms) | 25 | 44 | +19 | +76% | 18–28 | 42–61 | fora |
| CLS | 0,000 | 0,005 | +0,005 | — | 0,000–0,000 | 0,000–0,005 | dentro |
| FCP (ms) | 6.304 | 6.532 | +228 | +3,6% | 6.228–6.306 | 6.378–6.683 | fora |
| Speed Index (ms) | 6.304 | 6.532 | +228 | +3,6% | 6.228–6.306 | 6.378–6.683 | fora |
| Peso (KiB) | 1.572 | 1.598 | +26 | +1,7% | 1.572–1.572 | 1.598–1.598 | fora |
| Requisições | 63 | 62 | −1 | −1,6% | 63–63 | 62–62 | fora |
| JS não usado (KiB) | 280 | 284 | +4 | +1,4% | 280–280 | 284–284 | fora |

Uma execução de LCP caiu para 7.803 ms; a mediana continua perto de 10 s e o intervalo cruza o «antes». Não é ganho.

Melhorou fora do ruído: uma requisição a menos. Dentro do ruído: Performance, A11y, Best Practices, SEO, LCP, CLS. Piorou fora do ruído: TBT, FCP, Speed Index, peso e JS não usado. Hosts de anúncio bloqueados sumiram da lista, como na home (prompt 04). O JS não usado continua na casa de 280 KiB: o `periodic-table.js` ainda é um bloco só. Causa do TBT e do FCP: sem causa identificada.

## `/calculators`

| Métrica | Antes | Depois | Delta | % | min–máx antes | min–máx depois | Ruído |
|---|---:|---:|---:|---:|---|---|---|
| Performance | 58 | 58 | 0 | 0% | 58–59 | 57–58 | dentro |
| A11y | 92 | 92 | 0 | 0% | 92–92 | 92–92 | dentro |
| Best Practices | 82 | 82 | 0 | 0% | 82–82 | 82–82 | dentro |
| SEO | 100 | 100 | 0 | 0% | 100–100 | 100–100 | dentro |
| LCP (ms) | 7.354 | 7.063 | −291 | −4,0% | 7.055–7.354 | 7.054–7.355 | dentro |
| TBT (ms) | 9 | 25 | +16 | +178% | 9–24 | 19–41 | dentro |
| CLS | 0,122 | 0,126 | +0,004 | +3,3% | 0,122–0,122 | 0,126–0,126 | fora |
| FCP (ms) | 5.553 | 5.409 | −144 | −2,6% | 5.179–5.554 | 5.403–5.854 | dentro |
| Speed Index (ms) | 5.553 | 5.409 | −144 | −2,6% | 5.179–5.554 | 5.403–5.854 | dentro |
| Peso (KiB) | 1.126 | 1.176 | +50 | +4,4% | 1.126–1.126 | 1.176–1.176 | fora |
| Requisições | 61 | 62 | +1 | +1,6% | 61–61 | 62–62 | fora |
| JS não usado (KiB) | 48 | 49 | +1 | +2,1% | 48–48 | 49–49 | fora |

Notas estáveis. O CLS continua acima de 0,1 e subiu 0,004, com intervalos que não se cruzam. Peso +50 KiB. `acscdn` e `pagead2` saíram da lista; `www.google.com` continua porque a página pede o reCAPTCHA e o script bloqueia esse host. Causa do CLS e do peso: sem causa identificada.

## `/pricing`

| Métrica | Antes | Depois | Delta | % | min–máx antes | min–máx depois | Ruído |
|---|---:|---:|---:|---:|---|---|---|
| Performance | 66 | 66 | 0 | 0% | 65–66 | 66–67 | dentro |
| A11y | 100 | 100 | 0 | 0% | 100–100 | 100–100 | dentro |
| Best Practices | 82 | 82 | 0 | 0% | 82–82 | 82–82 | dentro |
| SEO | 100 | 100 | 0 | 0% | 100–100 | 100–100 | dentro |
| LCP (ms) | 6.456 | 6.305 | −151 | −2,3% | 6.455–6.464 | 5.856–6.311 | fora |
| TBT (ms) | 0 | 12 | +12 | — | 0–26 | 10–15 | dentro |
| CLS | 0,007 | 0,007 | 0 | 0% | 0,002–0,007 | 0,007–0,007 | fora |
| FCP (ms) | 4.509 | 4.730 | +221 | +4,9% | 4.430–4.879 | 4.729–4.732 | dentro |
| Speed Index (ms) | 4.509 | 4.730 | +221 | +4,9% | 4.430–4.879 | 4.729–4.732 | dentro |
| Peso (KiB) | 851 | 869 | +18 | +2,1% | 851–851 | 869–869 | fora |
| Requisições | 48 | 47 | −1 | −2,1% | 48–48 | 47–47 | fora |
| JS não usado (KiB) | 0 | 0 | 0 | 0% | 0–0 | 0–0 | dentro |

LCP melhorou 151 ms, fora do ruído. Sem causa identificada. A mediana do CLS arredonda para 0,007 nos dois lados; no bruto o «antes» vai até 0,0066 e o «depois» fica em 0,0070, então os intervalos não se cruzam. Performance estável. Hosts de anúncio bloqueados sumiram (prompt 04).

## `/login`

| Métrica | Antes | Depois | Delta | % | min–máx antes | min–máx depois | Ruído |
|---|---:|---:|---:|---:|---|---|---|
| Performance | 68 | 69 | +1 | +1,5% | 68–69 | 69–70 | dentro |
| A11y | 98 | 98 | 0 | 0% | 98–98 | 98–98 | dentro |
| Best Practices | 79 | 79 | 0 | 0% | 79–79 | 79–79 | dentro |
| SEO | 66 | 66 | 0 | 0% | 66–66 | 66–66 | dentro |
| LCP (ms) | 5.703 | 5.403 | −300 | −5,3% | 5.553–5.705 | 5.253–5.403 | fora |
| TBT (ms) | 0 | 1 | +1 | — | 0–15 | 0–6 | dentro |
| CLS | 0,017 | 0,029 | +0,012 | +71% | 0,017–0,026 | 0,029–0,029 | fora |
| FCP (ms) | 4.278 | 4.353 | +75 | +1,8% | 4.278–4.278 | 4.203–4.428 | dentro |
| Speed Index (ms) | 4.278 | 4.353 | +75 | +1,8% | 4.278–4.278 | 4.203–4.428 | dentro |
| Peso (KiB) | 657 | 679 | +22 | +3,3% | 657–657 | 679–679 | fora |
| Requisições | 47 | 46 | −1 | −2,1% | 47–47 | 46–46 | fora |
| JS não usado (KiB) | 0 | 0 | 0 | 0% | 0–0 | 0–0 | dentro |

LCP melhorou 300 ms, fora do ruído. Sem causa identificada. CLS piorou e continua abaixo de 0,1. SEO permanece 66 nas duas medições. Performance +1 fica dentro do cruzamento dos intervalos.

## O que esta medição não prova

Os dois relatórios bloqueiam anúncio, analytics, reCAPTCHA, CDN e Google Fonts. Por isso o prompt 04 aparece na lista de hosts tentados, não no peso nem no TBT. Os prompts 15 (imagens), 16 (3D sob demanda) e 17 (publish) não estão no commit `c55c35956c10`. Um «depois» com essas três PRs pode mudar peso e requisições; este arquivo não inclui esse efeito.
