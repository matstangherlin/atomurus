# reCAPTCHA v3 — Setup rápido (Atomurus)

> **Status do código**: ✅ tudo escrito e pronto. Para ficar funcional ponta-a-ponta, só faltam 3 passos seus no Netlify.

## ✅ Checklist de 3 passos para ficar 100% funcional

### Passo 1 — (se ainda não fez) regerar o par de chaves
A chave secreta que apareceu no chat anterior está comprometida. Vá em <https://www.google.com/recaptcha/admin> e clique no ícone de engrenagem do site `atomurus` → **Regenerate secret key** (e idealmente regenere a site key também).

Pegue:
- **Site key** (pública, vai no HTML) → copie para `recaptcha.js` linha 30, substituindo a atual.
- **Secret key** (privada, NUNCA no HTML) → vai só no painel do Netlify, próximo passo.

### Passo 2 — adicionar a env var no Netlify
Abra o painel do Netlify → seu site → **Site settings** → **Environment variables** → **Add a variable**:

| Key                    | Value                                                                          | Scope            |
|------------------------|--------------------------------------------------------------------------------|------------------|
| `RECAPTCHA_SECRET_KEY` | (cole a **secret key** regerada — não a site key)                              | Runtime          |
| `ALLOWED_ORIGIN`       | `https://atomurus.com` *(opcional, mas recomendado pra travar CORS)*           | Runtime          |

### Passo 3 — fazer deploy
Push para o repo conectado, **ou** Netlify dashboard → **Deploys** → **Trigger deploy → Clear cache and deploy site**, **ou** drag-and-drop do .zip da pasta.

## ✅ Como testar (depois do deploy)

Abra qualquer página → **F12** → aba **Console** → cole:

```js
atomurusTestRecaptcha()
```

Saída esperada (verde): `[atomurus] ✓ PASS · score=0.9 · action=diagnostic`

## Como usar em forms futuros

```js
const result = await atomurusVerifyRecaptcha('contact_submit');
if (!result.pass) {
  alert('Spam check failed. Try again.');
  return;
}
// result.pass === true → siga com o envio do form
```

## Arquivos relevantes

- `recaptcha.js` — cliente (carrega reCAPTCHA, expõe helpers)
- `netlify/functions/recaptcha-verify.js` — função serverless que valida tokens
- `netlify.toml` — config do Netlify
