# E-mail profissional — contato@atomurus.com (Google Workspace)

> O domínio `atomurus.com` foi comprado no **Netlify**, e o DNS fica lá.
> O Netlify **não** oferece caixa de e-mail: quem recebe e envia é o **Google Workspace**.
> Todos os registros abaixo são criados manualmente no painel do Netlify:
> **app.netlify.com → Domains → atomurus.com → DNS settings → Add new record**.

No assistente do Google, quando ele perguntar o host do domínio, escolha **"Outro"**
(Netlify não aparece na lista).

---

## Registros DNS (resumo)

| # | Tipo | Name | Value | Prioridade | Para quê |
|---|------|------|-------|:----------:|----------|
| 1 | TXT | `@` | `google-site-verification=…` (copie do Google) | — | Provar que o domínio é seu |
| 2 | MX  | `@` | `smtp.google.com` | 1 | Receber e-mail no Gmail |
| 3 | TXT | `@` | `v=spf1 include:_spf.google.com include:mailgun.org ~all` | — | SPF (anti-spam) |
| 4 | TXT | `google._domainkey` | `v=DKIM1; k=rsa; p=…` (gerado no Admin) | — | DKIM (assinatura) |
| 5 | TXT | `_dmarc` | já existe — não criar outro | — | DMARC (relatórios) |

Regras:

- **Só um SPF por domínio.** Se já existir um TXT começando com `v=spf1`, edite esse em vez
  de criar outro. O valor acima junta Google (caixa) + Mailgun (formulário do site).
- **Não apague os registros do Mailgun** (`email` CNAME, `k1._domainkey`, `include:mailgun.org`):
  o formulário de contato do site envia por ele. Eles não conflitam com o Google.
- **Não apague o `google-site-verification=YEw729…`** que já existe (é de outro serviço do
  Google, ex.: Search Console). O do Workspace é um TXT **adicional**.
- **Só MX do Google.** Se existirem MX antigos (ImprovMX, Zoho, etc.), apague-os.
- Se o Google mostrar a lista antiga de 5 MX (`aspmx.l.google.com` …), pode usar ela no lugar
  do `smtp.google.com` — use **uma** das duas, não ambas.

---

## Passo 1 — Verificar o domínio

1. No Google, copie o valor `google-site-verification=…` (botão 📋).
2. Netlify → **Add new record** → Type `TXT`, Name `@`, Value = o código copiado → **Save**.
3. Volte ao Google → marque a caixa → **Confirmar**. Se falhar, espere 5–10 min e tente de novo.

## Passo 2 — Ativar o Gmail (MX)

Netlify → **Add new record** → Type `MX`, Name `@`, Value `smtp.google.com`, Priority `1` → **Save**.
Depois clique em **Ativar Gmail** no Google.

## Passo 3 — SPF

Netlify → **Add new record** → Type `TXT`, Name `@`,
Value `v=spf1 include:_spf.google.com include:mailgun.org ~all` → **Save**.

## Passo 4 — DKIM

1. **admin.google.com → Apps → Google Workspace → Gmail → Autenticar e-mails**.
2. **Gerar novo registro** (chave 2048 bits, seletor `google`).
3. Netlify → **Add new record** → Type `TXT`, Name `google._domainkey`, Value = o texto gerado.
4. Espere alguns minutos e clique em **Iniciar autenticação** no Admin.

## Passo 5 — DMARC

O domínio **já tem** um `_dmarc` (criado na configuração do Mailgun). Só pode existir **um**
registro DMARC: não crie outro. O existente já serve para o Google também.

## Passo 6 — Endereço `contato@`

Se o usuário do Workspace não for `contato@atomurus.com`, adicione `contato` como **alias**
(grátis) em **admin.google.com → Diretório → Usuários → seu usuário → Endereços de e-mail alternativos**.

---

## Passo 7 — Ligar o formulário do site

Só depois que `contato@atomurus.com` estiver recebendo (mande um e-mail de teste):

- Netlify → site → **Site configuration → Environment variables**:
  `CONTACT_TO = contato@atomurus.com`
- Redeploy. O formulário (`netlify/functions/contact-send.js`, via Mailgun) passa a entregar
  na caixa do Workspace. Ver `MAILGUN-SETUP.md`.

## Como testar

- Envie de outro e-mail (ex.: Hotmail) para `contato@atomurus.com` → deve chegar no Gmail.
- Responda de lá → deve sair como `contato@atomurus.com`.
- Envie o formulário em `https://atomurus.com/contact` → deve chegar na mesma caixa.
- Para checar autenticação: no Gmail, abra uma mensagem enviada → **⋮ → Mostrar original** →
  SPF, DKIM e DMARC devem aparecer como `PASS`.
