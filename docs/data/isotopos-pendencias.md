# Isótopos — pendências para dados citáveis (prompt 25, modo B)

Este ambiente não tem acesso à NUBASE2020/AME2020 (IAEA/AMDC) nem à tabela do CIAAW (`www-nds.iaea.org`, `www.ciaaw.org`, `www.nndc.bnl.gov` recusados pela rede). Por isso o prompt rodou no **modo B**: só mudanças estruturais e seguras, **nenhum número novo apresentado como vindo da fonte**.

## O que mudou em `isotopes-data.js`

- **Cabeçalho**: saiu «values populated from training-data memory … NOT to be cited»; entrou «dados curados; revisão contra NUBASE2020/AME2020 (meias-vidas, decaimentos, massas) e CIAAW/IUPAC (abundâncias) pendente».
- **`stab`** em todas as 372 entradas (calculado quando não vem escrito): `stable` (sem decaimento e sem meia-vida), `obs-stable` (decaimento esperado ou visto, mas t½ > 10¹⁸ anos — `OBS_STABLE_MIN_YEARS` — ou só limite inferior), `radioactive`. `hl == null` continua significando «sem decaimento observado» para código antigo.
- **`hlKind`**: `measured` onde há meia-vida; `lower-limit` no Ta-180m.
- **`ISOTOPE_SOURCES`** (`reviewed: false`, `retrievedOn: null`), **`averageAtomicMass(Z)`** / **`averageAtomicMassTerms(Z)`** (com números de massa, `AVERAGE_MASS_METHOD = 'mass-number'`), **`isotopeStability(iso)`**, **`DEFAULT_SHOW_OBS_STABLE_AS_STABLE = false`**.

### Estabilidade: quem deixou de ser «estável»

| Nuclídeo | Antes | Depois | Por quê |
|---|---|---|---|
| Z=20 A=48 (Ca-48) | `stable` (hl null, dec `2β-`) | `obs-stable` | tem modo de decaimento e não tem meia-vida no dataset |
| Z=36 A=78 (Kr-78) | `stable` | `obs-stable`, `verified: false` | auditoria: captura eletrônica dupla observada; **meia-vida a conferir** |
| Z=63 A=151 (Eu-151) | `stable` | `obs-stable`, `verified: false` | auditoria: decaimento α observado; **meia-vida a conferir** |
| Z=73 A=180m (Ta-180m) | `stable (isomer)` | `obs-stable`, `hlKind: 'lower-limit'`, `verified: false` | isômero nunca visto decair; **limite inferior a conferir** |
| Ge-76, Se-82, Zr-96, Mo-100, Cd-116, Te-128, Te-130, Xe-124, Xe-136, Nd-150, W-180, Bi-209 | contados como radioativos | `obs-stable` | já tinham meia-vida > 10¹⁸ anos no dataset (valores não alterados) |

### Entradas novas, sem conferência na fonte

| Nuclídeo | Valores gravados | Estado |
|---|---|---|
| Z=6 A=11 (C-11) | `hl` ≈ 20 min, `dec: ['β+']`, `ab: null`, `prim: false` | `verified: false` — conferir t½ e ramos na NUBASE2020 |
| Z=82 A=210 (Pb-210) | `hl` ≈ 22 anos, `dec: ['β-', 'α']`, `ab: null`, `prim: false` | `verified: false` — conferir t½ e a fração do ramo α na NUBASE2020 |

A interface mostra «(a conferir)» ao lado desses valores. `tools/test-isotopes-data.mjs` falha se aparecer um `verified: false` que não esteja nesta lista.

### Não mudou

Nenhuma abundância, nenhuma meia-vida existente, nenhum isótopo removido. `elements-data.js` e `netlify/lib/canonical-elements.mjs` intactos. O artigo `explore/what-are-isotopes(.pt).html` já mostrava a conta do cloro com massas isotópicas (34,969 e 36,966 → 35,45, com a observação de que 35 e 37 dão 35,48) — nada a corrigir.

## Massa atômica média

`averageAtomicMass(Z)` = Σ(abundância × massa)/Σ(abundância). Sem as massas isotópicas da AME2020 no dataset, usa os **números de massa** e a interface rotula «aproximação com números de massa inteiros» (Cl: 0,7576 × 35 + 0,2424 × 37 = 35,48; a massa da tabela é 35,45). Não é comparada com a tabela até o modo A acrescentar `mass` (u) por isótopo.

## O que o dono precisa fornecer para o modo A

1. Baixar dos sites oficiais e colocar em `tools/data/raw/` (fora do publish; **não versionar** por padrão — decisão de licença/tamanho do dono):
   - `nubase_4.mas20.txt` (NUBASE2020: meias-vidas, modos de decaimento, isômeros) — IAEA AMDC;
   - `mass_1.mas20.txt` (AME2020: massas atômicas) — IAEA AMDC;
   - a tabela de composições isotópicas do CIAAW/IUPAC (abundâncias), salva como texto/CSV.
2. Pedir para rodar o modo A: `tools/build-isotopes-data.mjs` (a criar) lê esses arquivos, regenera `isotopes-data.js` mantendo o subconjunto atual + C-11 + Pb-210, acrescenta `mass` e `src`, tira os `verified: false`, preenche `ISOTOPE_SOURCES.retrievedOn` e escreve `docs/data/isotopos-diferencas.md` com cada valor que mudou (Z, A, campo, antes → depois, fonte), parando para revisão se uma abundância mudar mais de 1 ponto percentual.
3. Revisão de docente: o rótulo «observacionalmente estável» (ou manter «estável» com nota, via `DEFAULT_SHOW_OBS_STABLE_AS_STABLE`) e os textos.

`tools/audit-architecture.mjs` continua classificando `isotopes-data.js` como gerado; enquanto o gerador não existe, ele é curado à mão.
