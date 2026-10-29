# Conta e LGPD: exportar e excluir dados (prompt 29, M12-a/b)

Direitos atendidos: portabilidade e acesso (LGPD art. 18, II e V) e eliminação (art. 18, VI),
para quem tem conta. O texto da política de privacidade e os prazos de retenção **dependem de
revisão jurídica** (decisão do dono); este documento descreve só o que o código faz.

## Onde fica

- Página: `/account?tab=data` («Meus dados» / «My data»), em `assets/account-center.js`.
- Exportar: `GET /api/account/export` → `netlify/functions/account-export.mjs`.
- Excluir: `POST /api/account/delete` → `netlify/functions/account-delete.mjs`.
- Testes: `tools/test-account-export.mjs`, `tools/test-account-delete.mjs` (em `npm run test:auth`)
  e `e2e/account-data.spec.js` (`npm run test:account-data`). Tudo com mocks.

## Exportar meus dados

Sessão obrigatória (401 sem ela), mesma origem (403), até **3 exportações por hora** por usuário
(429). As tabelas são lidas com o **JWT do próprio usuário** (RLS), paginadas de 500 em 500, e
cada linha é conferida de novo pelo `user_id`. Resposta `application/json` com
`Content-Disposition: attachment; filename="atomurus-dados-AAAA-MM-DD.json"` e
`Cache-Control: no-store`. Acima de **5 MB** → 413 com orientação para escrever a
contato@atomurus.com.

| Seção do JSON | O que tem | Origem |
|---|---|---|
| `schemaVersion`, `exportedAt`, `site` | versão do formato (1), data/hora UTC | — |
| `notes` (`pt`, `en`) | o que **não** está incluído | — |
| `account` | ID da conta, e-mail, nome de usuário, nome, e-mail confirmado (sim/não), datas de criação e do último acesso | Supabase Auth |
| `profile` | a linha de `profiles` | `profiles` |
| `study` | `study_items`, `study_sets`, `study_set_items`, `study_cards`, `study_progress`, `study_review_events` | tabelas homônimas |
| `lab` | `pro_lab_sessions` (inclui sessões do solver) | `pro_lab_sessions` |
| `billing` | só o estado: plano e sua origem, situação da assinatura, fim do trial, periodicidade e moeda, cancelamento agendado, fim do período | `app_metadata` |

**Não incluídos:** dados de cartão e pagamentos (ficam na Stripe; o portal de cobrança mostra as
faturas), IDs internos da Stripe, tokens e hashes, registros (logs) do servidor, e o que fica só
neste dispositivo (quadro do Lab em `localStorage`, preferências). O próprio arquivo diz isso em
`notes`.

## Excluir minha conta

Atrito deliberado, nesta ordem: sessão (401) → mesma origem (403) → corpo ≤ 4 KB (400/413) →
frase digitada **`EXCLUIR`** (PT) ou **`DELETE`** (EN) (400 `confirm_phrase`) → senha atual (400
`password_required`) → assinatura → reautenticação com a senha (401 `reauth_failed`; provedor fora
do ar → 503, nada é apagado) → exclusão do usuário no Supabase Auth.

- **Assinatura (decisão do dono, padrão conservador).** `ACCOUNT_DELETE_MODE =
  'require-no-active-subscription'`: com assinatura que vai renovar (`active`, `trialing`,
  `past_due` sem cancelamento agendado) → 409 `subscription_active`, e a página manda cancelar em
  «Plano e cobrança». Assinatura já marcada para terminar no fim do período não bloqueia. Os modos
  `'cancel-then-delete'` e `'immediate'` respondem 501 até o dono decidir (`TODO(owner)`).
- **Limite:** 3 tentativas de reautenticação por dia por usuário (429). Erros de frase ou de corpo
  não gastam tentativa.
- **Cascata como contrato.** O handler apaga só o usuário de auth
  (`supabaseAdminDeleteUser`). `profiles.id` referencia `auth.users(id) ON DELETE CASCADE`, e toda
  tabela com `user_id` referencia `profiles(id) ON DELETE CASCADE`; `tools/test-account-delete.mjs`
  lê as migrações e falha se uma tabela nova fugir disso. Nada é apagado tabela por tabela.
- **Idempotente:** usuário que já não existe → 200.
- **Depois:** cookies de sessão apagados, aviso de saída para as outras abas, e a página remove do
  dispositivo as chaves de `src/core/storage/storage-policy.js` que não são preferência (quadro do
  Lab, fila de comparação, caches, memória de abas). Tema, idioma e consentimento ficam: descrevem
  o dispositivo, não a pessoa. Redireciona para `/?notice=account-deleted`, que mostra «Sua conta
  foi excluída…».
- **Auditoria sem PII:** o log guarda um hash do ID (`userHash`), nunca e-mail, IP ou token.

## O que continua existindo depois da exclusão

- Registros da Stripe (clientes, faturas), sob as regras da Stripe e fiscais — fora do Atomurus.
- Logs do servidor (Netlify) e backups do banco (Supabase) pelo prazo de retenção de cada serviço.
  **Prazo a definir e a publicar na política de privacidade (revisão jurídica).**
- O registro de eventos da Stripe já processados (`processed_stripe_events`, migração 011,
  opcional) guarda só o ID do evento e a data — nenhum dado pessoal.
