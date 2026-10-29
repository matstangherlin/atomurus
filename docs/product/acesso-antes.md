# Acesso aos recursos — linha de base (prompt 34)

Gerado por `node tools/dump-feature-access.mjs` a partir de `netlify/lib/feature-catalog.mjs`;
`--check` falha se este arquivo ficar desatualizado. Estado **antes** de qualquer decisão do dono
sobre o escopo gratuito (`docs/product/escopo-gratuito-e-plano-escolar.md`); o teste
`tools/test-feature-access-snapshot.mjs` congela o mesmo estado (acesso efetivo por perfil).

Recursos: 46 — `public` 11 · `account` 9 · `pro` 26.

- **Servidor:** funções em `netlify/functions/` que chamam `requireFeature(request, …)` (403
  `feature_locked`) ou leem `access.features`. É o que de fato protege dados e cálculos.
- **Portão do navegador:** `assets/lab-tool-gate.js` cobre a aba ou a página com o aviso «Conta» /
  «PRO» (só apresentação), a partir de `LAB_TABS` e `PAGE_TOOLS` do catálogo.
- **Outros scripts do navegador:** leem `user.features` da sessão (`/api/auth/me`) para mostrar ou
  esconder a interface.

| Recurso | Categoria | Acesso hoje | Servidor | Portão do navegador | Outros scripts do navegador |
|---|---|---|---|---|---|
| `labWorkspace` | workspace | `public` | — | — | — |
| `scientificCalculator` | calculator | `public` | — | aba «scientific» da calculadora | — |
| `unitConverter` | calculator | `public` | — | aba «unit» da calculadora | — |
| `idealGasCalculator` | calculator | `public` | — | aba «ideal» da calculadora | — |
| `phCalculator` | calculator | `public` | — | aba «ph» da calculadora | — |
| `interactiveViewers` | visualize | `public` | — | — | — |
| `atomicModelViewer` | visualize | `public` | — | página «atomicModels» | — |
| `moleculeViewer` | visualize | `public` | — | página «moleculeViewer» | — |
| `allotropeViewer` | visualize | `public` | — | página «allotropes» | — |
| `isomerismViewer` | visualize | `public` | — | página «isomerism» | `viewer/isomerism/isomerism-3d.js` |
| `publicElementCompare` | visualize | `public` | — | página «elementCompare» | — |
| `studyCloud` | study | `account` | private-dashboard (features)<br>study-calculator-history (requireFeature)<br>study-item (requireFeature)<br>study-items (requireFeature)<br>study-overview (requireFeature)<br>study-progress (requireFeature) | — | — |
| `studyProgress` | study | `account` | private-dashboard (features) | — | — |
| `favorites` | study | `account` | private-dashboard (features) | — | — |
| `calculatorHistory` | study | `account` | private-dashboard (features) | — | — |
| `studyNotes` | study | `account` | — | — | — |
| `studyTags` | study | `account` | — | — | — |
| `studySets` | study | `account` | private-dashboard (features)<br>study-set (requireFeature)<br>study-set-item (requireFeature)<br>study-sets (requireFeature) | — | — |
| `flashcards` | study | `account` | study-card (requireFeature) | — | — |
| `premiumLessons` | study | `pro` | — | — | — |
| `smartReview` | study | `pro` | private-dashboard (features)<br>study-review (requireFeature)<br>study-review-overview (requireFeature) | — | `src/core/entitlement/entitlement.js` |
| `spacedRepetition` | study | `pro` | — | — | — |
| `studyInsights` | study | `pro` | private-dashboard (features)<br>study-insights (requireFeature) | — | — |
| `focusReview` | study | `pro` | — | — | — |
| `advancedStudyStats` | study | `pro` | — | — | — |
| `exportPdf` | study | `pro` | — | — | — |
| `automatedPractice` | study | `pro` | study-cards-generate (requireFeature) | — | — |
| `virtualLab` | lab | `account` | — | — | — |
| `virtualLabAdvanced` | lab | `pro` | — | — | — |
| `adsFree` | platform | `pro` | private-dashboard (features) | — | — |
| `proLab` | solve | `pro` | private-dashboard (features) | — | `pro-lab.js` |
| `advancedCalculations` | solve | `pro` | pro-lab-calculate (requireFeature) | — | — |
| `chemistrySolver` | solve | `pro` | — | — | — |
| `reactionWorkbench` | solve | `pro` | private-dashboard (features) | — | `pro-lab.js` |
| `reactionBalancer` | solve | `pro` | pro-lab-reaction-balance (requireFeature) | — | — |
| `stoichiometrySolver` | solve | `pro` | pro-lab-reaction-solve (requireFeature) | — | — |
| `limitingReagentSolver` | solve | `pro` | — | — | — |
| `yieldSolver` | solve | `pro` | — | — | — |
| `formulaSolver` | solve | `pro` | pro-lab-formula-solve (requireFeature) | — | `pro-lab.js` |
| `solutionBuilder` | solve | `pro` | pro-lab-solutions-solve (requireFeature) | — | `pro-lab.js` |
| `publicStoichiometry` | solve | `pro` | — | aba «stoich» da calculadora | — |
| `publicThermodynamics` | solve | `pro` | pro-lab-thermodynamics-solve (requireFeature) | aba «thermo» da calculadora | — |
| `advancedElementCompare` | analyze | `pro` | pro-lab-elements-compare (requireFeature) | — | — |
| `advancedMoleculeCompare` | analyze | `pro` | pro-lab-molecules-compare (requireFeature) | — | — |
| `advancedAtomicCompare` | analyze | `pro` | pro-lab-atomic-compare (requireFeature) | — | — |
| `savedLabSessions` | analyze | `pro` | pro-lab-session (requireFeature)<br>pro-lab-sessions (requireFeature) | — | — |

## Abas da calculadora e páginas

| Aba / página | Acesso | Recurso |
|---|---|---|
| aba `molar` | `public` | — |
| aba `dilute` | `public` | — |
| aba `scientific` | `public` | `scientificCalculator` |
| aba `unit` | `public` | `unitConverter` |
| aba `ideal` | `public` | `idealGasCalculator` |
| aba `ph` | `public` | `phCalculator` |
| aba `stoich` | `pro` | `publicStoichiometry` |
| aba `thermo` | `pro` | `publicThermodynamics` |
| página `elementCompare` | `public` | `publicElementCompare` |
| página `moleculeViewer` | `public` | `moleculeViewer` |
| página `atomicModels` | `public` | `atomicModelViewer` |
| página `allotropes` | `public` | `allotropeViewer` |
| página `isomerism` | `public` | `isomerismViewer` |

Regras fixas fora do catálogo: `adsFree` acompanha o Pro (`featuresForAccess`) e `adminConsole` só
existe para administradores. Os anúncios continuam desligados (prompt 04).
