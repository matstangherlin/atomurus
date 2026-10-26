# Auditoria da aba Plano e cobrança

Leitura de `accountPlanState` (`workspace-logic.js`), `planBlock` / `openBillingPortal` (`assets/account-center.js`) e `billing-portal.mjs` antes da alteração de UI. O portal Stripe só existe para quem já tem cliente e assinatura (`canManageBilling`). O trial automático não cria cliente Stripe, então não há portal para ele.

| Estado | O que a tela mostrava | O que faltava | O que a tela mostra agora |
|---|---|---|---|
| `auto_trial` | “N dias restantes” e “Ver planos” | Explicar que nada será cobrado e que a conta volta ao plano gratuito | Data de `trialEndsAt` (quando o navegador a recebe), a frase de não cobrança e “Ver planos”. Sem botão de portal. |
| `billing_trial` com `canManage` | “Ativo” e “Gerenciar assinatura” | Data de término e o verbo cancelar | “Gerenciar ou cancelar assinatura” e “Renova em …” quando há `currentPeriodEnd` |
| `paid` com `canManage` | Igual ao trial de cobrança | A mesma data e o cancelamento explícito | O mesmo botão e a data de `currentPeriodEnd` |
| `payment_issue` com `canManage` | “Problema de pagamento” e “Gerenciar cobrança” | Data e cancelamento explícito | Aviso de pagamento, data quando existe, e “Gerenciar ou cancelar assinatura” |
| `cancel_scheduled` | “Sua assinatura não será renovada.” sem data | A data de acesso Pro e um botão de reativar | “Acesso Pro até …” quando há `currentPeriodEnd`, e “Reativar ou gerenciar” |
| `free` | Plano gratuito e “Assinar o Pro” | Nada neste fluxo | Igual |
| Erro `billing_customer_missing` | A mesma frase de qualquer outro erro | Distinguir “sem assinatura” de falha de rede | “Esta conta ainda não tem assinatura para gerenciar.” |
| Erro de rede ou 500 do portal | A frase de “sem assinatura” | Mensagem de tentar de novo e botão reabilitado | “Não foi possível abrir o portal agora. Tente novamente.” O botão volta ao rótulo. |

## Campos já expostos ao navegador

`publicUser` em `netlify/lib/plan-access.mjs` já envia `trialEndsAt`, `currentPeriodEnd` e `cancelAtPeriodEnd`. Nenhum endpoint novo foi criado. Se a data não vier no objeto `user`, a frase correspondente sai sem a data.

## Pendências que só o dono resolve

1. Nome público da conta Stripe (“Noba” no checkout) para “Atomurus”.
2. Decidir se o Pix entra como forma de pagamento da conta brasileira.
3. No Customer Portal da Stripe, habilitar cancelar assinatura e ver faturas, com a política de cancelamento e reembolso que o dono definir. Este repositório não escreve esse texto jurídico.
4. Depois do deploy, testar no modo de teste da Stripe. Não usar cartão real em produção.

## O que não foi alterado

`netlify/functions/billing-portal.mjs`, checkout, webhook, preços e a lógica de entitlement.
