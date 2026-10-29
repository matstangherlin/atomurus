# Moléculas novas no viewer — pendências (prompt 31)

**Situação:** as quatro moléculas (cafeína, aspirina, glicose, ibuprofeno) **não foram criadas**.
Não há arquivos de origem em `tools/data/raw/molecules/`, e o projeto não escreve coordenadas de
memória. O que existe é o caminho reprodutível para criá-las assim que o dono trouxer os arquivos.

## O que já está pronto

- `tools/build-molecule-from-sdf.mjs` — lê SDF/MOL **V2000** (sem dependências), centraliza a
  geometria 3D (Å), usa as **cores e raios já usados** em `COORDS` (o par mais frequente por
  elemento; elemento sem par conhecido interrompe a conversão), gera `bonds` (ordens 1/2/3;
  aromático «4» é recusado — exporte a forma de Kekulé) e `draw2d` (do registro 2D, se houver; senão
  projeção nos dois eixos principais do 3D). Sem `--add` só mostra o que mudaria; com `--add`
  acrescenta as chaves ao `COORDS` mantendo-o em **uma linha** e recusa reescrever chaves
  existentes.
- `tools/fixtures/molecules/water.{sdf,2d.sdf,json}` — água **escrita à mão** (O–H 0,9578 Å,
  H–O–H 104,48° por construção), usada só no teste.
- `tools/test-molecule-measure.mjs` — testa o conversor (inclusive recusas) e garante que nenhuma
  das quatro chaves aparece no viewer sem o respectivo SDF.

## Passos do dono, em ordem

1. **Baixar** de uma fonte pública (PubChem ou NIST CCCBDB — decisão do dono, com licença e
   atribuição conferidas) o registro **3D** e o **2D** de cada molécula, em SDF V2000:
   `tools/data/raw/molecules/caffeine.sdf` e `caffeine.2d.sdf`, idem `aspirin`, `glucose`,
   `ibuprofen`. O 2D precisa ter os mesmos átomos na mesma ordem do 3D (o conversor confere).
2. Criar `tools/data/raw/molecules/<chave>.json` com `name` e `desc` (em PT, como as demais
   entradas de `COORDS`), `source` (URL e data da consulta) e, no ibuprofeno, `chiral: true` se for o
   enantiômero.
3. `node tools/build-molecule-from-sdf.mjs` (confere) e depois `--add`.
4. Nomes e descrições PT/EN em `tools/i18n-dict-source.js` (`molecules.mol.<chave>.name/desc/short`)
   e `npm run build:i18n-assets`. Proposta (curta, factual, sem alegação médica):

   | Chave | PT | EN |
   |---|---|---|
   | `caffeine` | Cafeína — C₈H₁₀N₄O₂ · anéis fundidos planos | Caffeine — C₈H₁₀N₄O₂ · flat fused rings |
   | `aspirin` | Aspirina (ácido acetilsalicílico) — C₉H₈O₄ · éster e ácido carboxílico | Aspirin (acetylsalicylic acid) — C₉H₈O₄ · ester and carboxylic acid |
   | `glucose` | Glicose (β-D-glicopiranose) — C₆H₁₂O₆ · anel em cadeira | Glucose (β-D-glucopyranose) — C₆H₁₂O₆ · chair ring |
   | `ibuprofen` | Ibuprofeno — C₁₃H₁₈O₂ · um centro quiral | Ibuprofen — C₁₃H₁₈O₂ · one chiral centre |

5. Botões das moléculas em `viewer/molecules.html` (o PT é gerado pelo build), e a fonte no rodapé
   do viewer (texto, sem link novo).
6. Referências em `tools/data/molecule-geometry-reference.json` com `source` e `verified`, e
   `npm run test:molecules`: planaridade dos anéis aromáticos (cafeína, aspirina, ibuprofeno) e
   cadeira da glicose (C–C–C ≈ 109–112°, tolerância do prompt 19).

## Decisões do dono

- **Fonte e licença:** PubChem ou NIST CCCBDB — o dono confere os termos de uso e a atribuição
  pedida por cada um e escolhe; a fonte é citada no rodapé do viewer.
- **Glicose:** β-D-glicopiranose (cadeira; padrão proposto) ou cadeia aberta.
- **Ibuprofeno:** racemato (o fármaco) × (S)-ibuprofeno (o enantiômero ativo). Se for um enantiômero,
  `chiral: true` mostra o painel de quiralidade e o espelho.

## Achados

- **Sinal do diedro em `tools/molecule-geometry.mjs`** (prompt 19): a função `dihedral` devolve o
  sinal **oposto** ao da IUPAC (mesmo módulo). A medição do viewer usa o sinal IUPAC; o teste
  confere que os módulos coincidem. Hoje nenhuma referência do prompt 19 depende do sinal; se alguma
  vier a depender, alinhar a função (revisão).
- **Rótulos:** padrão «médios» (1,3× o tamanho anterior), com «pequenos»/«grandes» no botão «Aa»;
  a escolha não é salva entre visitas (salvar exigiria uma chave nova em
  `src/core/storage/storage-policy.js`).
- **Textos da medição** ficam no próprio runtime (PT/EN), carregado sob demanda, e não em
  `assets/i18n/molecules.json`, que é baixado com a página: assim a carga inicial não cresce.
