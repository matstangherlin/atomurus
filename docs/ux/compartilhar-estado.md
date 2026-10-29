# Compartilhar com estado (prompt 26, B01)

## Feito

- **Massa molar** (`calculators(.pt).html`): depois de um cálculo do usuário, `history.replaceState` grava `?formula=<fórmula>` (sem nova entrada no histórico, preservando os outros parâmetros). Ao abrir uma URL com `?formula=`, o valor é validado (`^[A-Za-z0-9()\[\]·.•+\-*/ ]{1,100}$`), entra no campo com `value` (sem `innerHTML`, sem `eval`) e a massa já aparece calculada. A fórmula padrão (H2SO4) calculada ao carregar **não** escreve na URL; «Limpar» remove o parâmetro. O `buildUrl` do `share-button.js` não mudou: ele já preserva os parâmetros que não são `utm_*`, então os links de WhatsApp/Telegram/e-mail/copiar levam `formula=` + `utm_*` (coberto em `e2e/share-and-print.spec.js`).
- **Menu de compartilhar** (`share-button.js`, todas as páginas): continua abrindo no hover e no foco; agora tem `aria-expanded`, Enter/Espaço/↓ entram no menu, ↑/↓ percorrem os itens e **Esc fecha e devolve o foco ao botão**.

## Candidatas (não implementadas)

| Calculadora | Estado que faria sentido na URL | Observação |
|---|---|---|
| Conversor de unidades | categoria, valor, de, para | 4 campos; nomes de unidade estáveis (`uc-cat`, `uc-from`, `uc-to`) |
| Gás ideal | variável resolvida + P, V, n, T e unidades | 8 campos; vale um único `?ig=P,101325,Pa,…` ou parâmetros separados |
| Diluição | variável resolvida + C₁, V₁, C₂, V₂ | 5 campos |
| pH | tipo (forte, fraco, tampão), espécie, concentrações, K | mais estados por tipo; a espécie já tem id estável |
| Termodinâmica | ΔH, ΔS, T, substância, massa, ΔT | atrás do Pro (não faz sentido compartilhar com quem não tem acesso) |
| Científica | expressão | o mesmo padrão da massa molar (`?expr=`), com o mesmo cuidado de validação |
