# Modelos de e-mail (PT-BR)

Quatro modelos para colar no painel do Supabase. Não há token, senha nem chave neste diretório. Os links usam as variáveis do próprio Supabase (`{{ .TokenHash }}`, `{{ .SiteURL }}`, `{{ .Email }}`).

Contato no rodapé: contato@atomurus.com (o mesmo endereço de `contact.html`).

| Arquivo | Modelo no Supabase | Assunto |
| --- | --- | --- |
| `confirm-signup.html` | Confirm signup | Confirme seu e-mail na Atomurus |
| `recovery.html` | Reset password | Redefinir a senha da Atomurus |
| `magic-link.html` | Magic link / Invite | Seu link de acesso à Atomurus |
| `email-change.html` | Change email address | Confirme o novo e-mail na Atomurus |

Cada HTML tem um `.txt` ao lado, com o mesmo texto sem marcação.

O código já aceita `type=signup`, `type=recovery`, `type=invite`, `type=magiclink` e `type=email_change`.

## Roteiro manual (painel do Supabase)

O código não executa estes passos.

1. **Authentication → URL Configuration.** Site URL = a URL pública do site. Em Redirect URLs, incluir `/reset-password`, `/login` e a raiz, em produção. `localhost` só se você quiser testar na sua máquina.
2. **Authentication → Emails → Templates.** Colar o HTML de cada arquivo acima. O link de recuperação precisa usar `token_hash`, como em `recovery.html`.
3. **Authentication → SMTP Settings.** SMTP do próprio domínio (Mailgun, Resend ou outro — a escolha é sua), com SPF, DKIM e DMARC no DNS. O SMTP padrão do Supabase é limitado e não leva a marca.
4. **Confirmar e-mail no cadastro.** Ligar reduz conta falsa e e-mail errado, e exige SMTP mais o botão de reenvio que o site já mostra quando o login devolve `email_not_confirmed`. Desligar tira essa fricção. O código funciona nos dois modos; a decisão é sua.
5. Testar com um e-mail seu: pedir recuperação, abrir o e-mail em português, clicar, definir a senha e entrar.
