# Recuperação de senha e confirmação de e-mail

O código funciona com a confirmação de e-mail ligada ou desligada no painel do Supabase. Quem decide isso é o dono. Este repositório não altera o projeto Supabase.

## Fluxo

```text
Pedir recuperação (/forgot-password)
  -> POST /api/auth/recover
  -> Supabase /recover
  -> e-mail com link token_hash
  -> /reset-password?token_hash=…&type=recovery
  -> painel de nova senha
  -> POST /api/auth/reset
  -> entra no workspace

Link antigo no hash da raiz (#access_token&type=recovery)
  -> index.html redireciona para /reset-password preservando o hash
  -> POST /api/auth/establish
  -> painel de nova senha

Link expirado (#error_code=otp_expired)
  -> /login com aviso e botão "Pedir novo link"
  -> o botão abre o pedido de recuperação

Login com e-mail não confirmado (401 email_not_confirmed)
  -> mensagem própria + "Reenviar e-mail de confirmação"
  -> POST /api/auth/resend-confirmation
  -> mesma resposta para e-mail existente e inexistente
```

Se a confirmação estiver desligada, o login não devolve `email_not_confirmed` e o botão de reenvio não aparece.

## Formatos aceitos

| URL | Resultado |
| --- | --- |
| `/reset-password?token_hash=…&type=recovery` | Painel de nova senha |
| `/reset-password#access_token=…&refresh_token=…&type=recovery` | Painel de nova senha, depois de estabelecer a sessão |
| `/#access_token=…&refresh_token=…&type=recovery` | Redireciona para `/reset-password` com o hash |
| `/index.pt.html#access_token=…&type=recovery` | O mesmo, com `?lang=pt-BR` |
| `/#error_code=otp_expired` | `/login` com aviso de link expirado |
| `/?token_hash=…` | Continua indo para `/login` com a query |
| `#confirmation_token` ou `#recovery_token` | Continua indo para `/login` com o hash |

O hash é lido na página de destino e removido da barra de endereço. Não vai para `console`, `localStorage` nem para domínio de terceiro.

## Onde cada parte vive

| Peça | Arquivo |
| --- | --- |
| Redirecionamento da home | `index.html`, `index.pt.html` |
| Classificador testável | `netlify/lib/auth-recovery-link.mjs` |
| Painel de senha, link expirado, reenvio | `auth-login.js`, `login.html` |
| Pedido de recuperação | `netlify/functions/auth-recover.mjs` |
| Reenvio de confirmação | `netlify/functions/auth-resend-confirmation.mjs` |
| Cliente | `auth-client.js` |
| Limite | os mesmos limitadores de recuperação em `netlify/lib/auth-rate-limit.mjs` |
| Modelos de e-mail | `docs/auth-email-templates/` |

Rotas `/reset-password` e `/login/reset` no `netlify.toml` não foram alteradas.

## O que o dono configura

Os passos estão em `docs/auth-email-templates/README.md`. Nada disso é feito pelo código: Site URL, modelos, SMTP e a decisão de exigir ou não a confirmação de e-mail.
