# Inventário 13 — revisão de professor

Tudo abaixo precisa de revisão de um professor de química antes de ir à produção. Níveis e objetivos são sugestão. Nenhum nome de revisor foi inventado.

| Arquivo | Texto anterior | Texto novo | Revisão de professor |
|---|---|---|---|
| `tools/i18n-dict-source.js` `molecules.desc` EN/PT e `viewer/molecules*.html` | “Real molecular geometry” / “Geometria molecular real” | Modelos didáticos / teaching models; ângulos idealizados, não medidos (TRPECV / VSEPR) | sim |
| `molecules.teachingNote` | ausente | Nota curta junto ao título do visualizador | sim |
| `atomicModels.atomLegendElectron` e `.atomLegendOrbit` | “in orbit” / “em órbita” como se fosse o elétron real | Camada do modelo de Bohr; elétrons reais em orbitais | sim |
| `rutherford_e`, `bohr_e`, `modelMeta.rutherfordDesc` | órbita como descrição solta | Trajetória ou camada nomeada como modelo histórico | sim |
| Páginas `viewer/atomic-models/*/rutherford` e `bohr` | “órbita” dentro da explicação do modelo histórico | Mantido de propósito: descreve Rutherford/Bohr, não o elétron real | sim |
| 9 artigos × EN/PT | sem chip de nível | Iniciante, intermediário ou avançado, mais “Você vai aprender” com 3 itens tirados dos próprios títulos | sim |
| Artigos Explore | já tinham Atomurus · Editorial/Redação, data, tempo de leitura e `author`/`dateModified` no JSON-LD | Não duplicado. Revisor só aparece se `reviewerName` deixar de ser `null` | sim |
| `explore/what-is-chemical-bonding*.html` | categoria “Atomic Structure” / “Estrutura Atômica” | “Chemical Bonding” / “Ligações Químicas”. O artigo do átomo e a trilha “Atomic Structure” não mudaram | sim |
| `scripts/isomerism-chem-enhancements.json` e `isomerism/constitutional/function.html` | as três respostas corretas eram “a”; feedback só “Correto/Quase” | Q1 função em b, Q2 cadeia em c, Q3 geométrica em a; explicação por alternativa; ordem embaralhada na página | sim |
| He, `tools/element-content-source.js` e `elements-data.js` | “completamente inerte” / “gás nobre inerte” | “o menos reativo de todos: não forma compostos estáveis em condições comuns” | sim |
| Ne | “inerte” / “inerte em quase todas as condições” | “praticamente sem reatividade química (não se conhece composto estável do neônio)” | sim |
| Ar | “quimicamente inerte” / “quase totalmente inerte” | “muito pouco reativo; usado como atmosfera protetora”. A frase que já citava HArF foi mantida | sim |
| Kr | “quimicamente inerte” | “pouco reativo; forma KrF₂, instável, em condições especiais” | sim |
| Xe | já diz que forma compostos e cita o dogma antigo | Não alterado | sim |
| Soldagem e “gás inerte” de nitrogênio, platina e outros | termo técnico de aplicação | Não alterado, fora de He/Ne/Ar/Kr como propriedade | sim |

Não há gerador das páginas `periodic-table/*.html`. Só a descrição curta do hélio nessas duas páginas foi alinhada à frase nova. O texto longo dos quatro gases está na fonte e em `assets/element-content/002.js`, `010.js`, `018.js` e `036.js`.
