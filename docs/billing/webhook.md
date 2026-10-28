# Webhook da Stripe — idempotência, dedupe e ordem dos eventos (prompt 29, B05)

Função: `netlify/functions/billing-webhook.mjs` (`POST /api/billing/webhook`). Teste:
`tools/test-billing-webhook.mjs` (em `npm run test:billing`), com Stripe e Supabase simulados.

## O que a função faz

1. **Assinatura.** `constructWebhookEvent` verifica a assinatura com o segredo do webhook (sem
   mudança). Assinatura ausente ou inválida → `400 { ok:false, error:'Webhook handling failed' }`.
2. **Dedupe.** `claim(event.id)` antes de processar. Se o evento já foi processado (ou está sendo
   processado agora), responde `200 { ok:true, duplicate:true }` sem refazer nada.
3. **Processamento.** Atualiza o `app_metadata` do usuário (`billingAppMetadataPatch`).
4. **Registro.** Sucesso → `commit(event.id)`. Falha → `release(event.id)` e
   `500 { ok:false, error:'Webhook handling failed' }`; a Stripe reenvia e o reenvio processa.

O corpo de erro é sempre o mesmo texto genérico; a mensagem interna (do Supabase, da Stripe) vai
só para o log da função.

## Duas camadas de proteção

| Camada | O que garante | Limite |
|---|---|---|
| **Idempotência** (principal) | `billingAppMetadataPatch` escreve as mesmas chaves com os mesmos valores: reprocessar o mesmo evento chega ao mesmo estado | — |
| **Dedupe** (extra) | não repete efeitos nem chamadas à Stripe para um `event.id` já visto | ver abaixo |

### Onde o dedupe guarda os ids

- **Memória (padrão).** Por instância da função, TTL de 1 hora, até 2 000 ids. Pega reenvios
  rápidos na mesma instância; uma instância nova não lembra nada. Melhor esforço.
- **Supabase (opcional).** Tabela `processed_stripe_events` da migração
  `supabase/migrations/011_processed_stripe_events.sql` (RLS ligado, nenhuma policy: só o
  service role). Usada **somente** com `STRIPE_EVENT_DEDUPE=supabase`. O claim é um insert que
  ignora duplicatas; a falha apaga a linha. **Passos do dono:** aplicar a 011 (primeiro num projeto
  de desenvolvimento), depois definir a variável no painel da Netlify.

Se o armazenamento do dedupe falhar, a função **segue** (registra no log): sem dedupe ela continua
idempotente.

## Eventos fora de ordem

O dedupe **não** resolve um reenvio antigo que chega depois de um evento mais novo (a Stripe não
garante ordem). Para limitar o efeito:

- `checkout.session.completed`, `invoice.paid`, `invoice.payment_succeeded` e
  `invoice.payment_failed` **buscam o estado atual da assinatura** na Stripe
  (`subscriptions.retrieve`) em vez de confiar no objeto do evento.
- `customer.subscription.created/updated/deleted` ainda usam o objeto do próprio evento. Um
  `updated` antigo entregue tarde pode escrever um status antigo até o próximo evento corrigir.
  Opções para o dono (não implementadas): buscar a assinatura também nesses eventos (uma chamada a
  mais por evento) ou guardar `event.created` no metadata e ignorar eventos mais antigos.

## Como testar no painel da Stripe (modo de teste, passo do dono)

Reenviar o mesmo evento de teste pelo painel: a segunda resposta deve ser
`200 { "ok": true, "duplicate": true }` enquanto a mesma instância estiver ativa (ou sempre, com a
migração 011 e `STRIPE_EVENT_DEDUPE=supabase`).
