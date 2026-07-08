# Mailgun — Setup do formulário de contato (Atomurus)

> Substitui o antigo **Formspree**. O formulário em `/contact` agora envia um JSON
> para a Netlify Function `netlify/functions/contact-send.js`, que dispara o e-mail
> pelo **Mailgun** usando uma chave privada guardada **só** nas variáveis de ambiente
> do Netlify. **A chave NUNCA aparece no HTML/JS do site.**

> **Status do código**: ✅ tudo pronto. Faltam só os passos abaixo no Mailgun e no Netlify.

---

## ⚠️ Passo 0 — REGERAR a API key (obrigatório)

A chave que você colou no chat (`b1d14b6c…f761dc47`) está **comprometida** — qualquer um
que a tenha visto pode mandar e-mail pela sua conta. Antes de mais nada:

1. Entre no [painel do Mailgun](https://app.mailgun.com/) → **Settings → API Keys**.
2. Clique em **Regenerate / Rotate** na chave privada (ou crie uma nova).
3. Use **a nova chave** no Passo 2. A antiga deixa de valer.

> Regra de ouro: a chave privada do Mailgun vive **só** no painel do Netlify (env var).
> Nunca em `.js`, `.html`, nem comitada no repositório.

---

## Passo 1 — Liberar o destinatário (domínio sandbox)

O domínio **sandbox** (`sandbox1c5ecf…mailgun.org`) só consegue enviar para endereços
**autorizados**. Como o formulário sempre manda para a **sua** caixa, basta autorizar 1 endereço:

1. Painel do Mailgun → **Send → Sending → Domains** → clique no domínio sandbox.
2. Em **Authorized Recipients**, adicione `contato@atomurus.com`
   (e/ou `matheus.stangherlin@hotmail.com`).
3. Confirme o link que o Mailgun envia para esse e-mail.

> 💡 **Para produção de verdade**, troque o sandbox por um **domínio próprio verificado**
> (ex.: `mg.atomurus.com`): Mailgun → **Add new domain** → adicione os registros DNS
> (TXT/SPF, DKIM, MX) que ele mostrar. Aí você envia para qualquer endereço, sem
> lista de autorizados, e o e-mail cai menos em spam. Quando fizer isso, é só mudar
> `MAILGUN_DOMAIN` (Passo 2).

---

## Passo 2 — Variáveis de ambiente no Netlify

Painel do Netlify → seu site → **Site settings → Environment variables → Add a variable**:

| Key                | Value                                                              | Obrigatória? |
|--------------------|-------------------------------------------------------------------|:------------:|
| `MAILGUN_API_KEY`  | a **nova** chave privada (Passo 0)                                | ✅ **única obrigatória** |
| `MAILGUN_DOMAIN`   | `sandbox1c5ecf136cb544ddad02f99a7b2c89e7.mailgun.org`             | ⬜ (já é padrão no código) |
| `CONTACT_TO`       | `matheus.stangherlin@hotmail.com`                                | ⬜ (já é padrão no código) |
| `MAILGUN_BASE_URL` | `https://api.mailgun.net` (US, padrão) — use `…api.eu.mailgun.net` se sua conta for EU | ⬜ |
| `CONTACT_FROM`     | `Atomurus <postmaster@sandbox1c5ecf…mailgun.org>`                | ⬜ |
| `ALLOWED_ORIGIN`   | `https://atomurus.com` (trava o CORS no seu domínio)             | ⬜ |
| `RECAPTCHA_SECRET_KEY` | já usada pelo reCAPTCHA; se estiver setada, o anti-spam é validado também no envio | ⬜ |

> Sua conta é **US** ou **EU**? Veja o "Base URL" no painel do Mailgun. O seu mostrava
> `https://api.mailgun.net` → **US**, então pode deixar `MAILGUN_BASE_URL` em branco.

---

## Passo 3 — Deploy

Push para o repo conectado, **ou** Netlify → **Deploys → Trigger deploy → Clear cache and deploy site**,
**ou** arraste o `.zip` da pasta. (O build roda `node build-i18n.js`, que regenera os `*.pt.html`.)

---

## ✅ Como testar (depois do deploy)

1. Abra `https://atomurus.com/contact`, preencha e envie. Deve aparecer
   **"✓ Mensagem enviada"** e o e-mail cair em `contato@atomurus.com`.
   O **Responder** vai direto para o e-mail de quem preencheu (via `Reply-To`).
2. Se der erro, abra **F12 → Network**, clique na chamada `contact-send` e veja a resposta,
   e/ou no Netlify: **Functions → contact-send → Logs**. Erros comuns:
   - **401** → `MAILGUN_API_KEY` errada/antiga (regere e reponha — Passo 0).
   - **403 / "not authorized"** → destinatário não liberado no sandbox (Passo 1).
   - **"Server not configured"** → falta `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` ou `CONTACT_TO`.

## Teste rápido via terminal (opcional)

```bash
curl -X POST https://atomurus.com/api/contact-send \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"voce@exemplo.com","topic":"feedback","message":"Mensagem de teste do formulario."}'
# espera: {"ok":true}
```

---

## Arquivos relevantes

- `netlify/functions/contact-send.js` — função serverless que valida e envia via Mailgun
- `contact.html` — formulário + JS (posta JSON em `/api/contact-send`)
- `netlify.toml` — redirect `/api/contact-send` + documentação das env vars
- `recaptcha.js` / `netlify/functions/recaptcha-verify.js` — anti-spam (reaproveitado)
