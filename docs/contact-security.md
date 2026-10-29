# Contato — CORS, reCAPTCHA e limite de envio

O formulário em `/api/contact-send` continua enviando pelo mesmo provedor. As variáveis abaixo só mudam o comportamento quando alguém as define no painel. O padrão é compatível com o que já estava no ar: reCAPTCHA opcional e limite em memória.

Nada disto grava IP ou e-mail em claro. A chave do limite é um hash.

## Origem

| Variável | Efeito |
|---|---|
| `CONTACT_ALLOWED_ORIGINS` | Lista separada por vírgula. Se existir, só essas origens recebem `Access-Control-Allow-Origin`. |
| `ALLOWED_ORIGIN` | Alias de uma origem só, usado quando a lista acima está vazia. |

Sem as duas, a função aceita `https://atomurus.com` e `https://www.atomurus.com`. Fora de `NODE_ENV=production`, também aceita `localhost` e `127.0.0.1` (qualquer porta). Um `POST` com `Origin` fora da lista responde `403` e não envia o cabeçalho de permissão. Um pedido sem `Origin` (curl, servidor) segue. A resposta sempre traz `Vary: Origin`.

Previews com outro domínio precisam da lista explícita.

## reCAPTCHA

| `CONTACT_RECAPTCHA_MODE` | Comportamento |
|---|---|
| ausente ou `optional` | Sem segredo, o envio segue e a função registra um aviso. Se o Google não responder, o envio também segue. |
| `required` | Sem segredo, token ausente ou inválido, ou Google fora do ar: o envio para. A mensagem pública é genérica. |

Ordem para ligar o modo estrito:

1. Confirmar que o segredo do reCAPTCHA já está configurado no painel.
2. Enviar o formulário de verdade e ver o sucesso.
3. Só então definir `CONTACT_RECAPTCHA_MODE=required`.

## Limite

| Variável | Padrão |
|---|---|
| `CONTACT_RATE_LIMIT_IP` | 5 por janela |
| `CONTACT_RATE_LIMIT_EMAIL` | 3 por janela |
| `CONTACT_RATE_LIMIT_WINDOW_SEC` | 3600 |

O IP vem de `x-nf-client-connection-ip` ou do primeiro valor de `x-forwarded-for`. O campo escondido do formulário também conta. Acima do limite a resposta é `429` com `Retry-After`.

O store padrão é a memória da instância. Duas instâncias não compartilham a contagem. Para um store compartilhado, o dono escolhe um Redis com API HTTP e define:

- `RATE_LIMIT_STORE=rest`
- `RATE_LIMIT_REST_URL`
- `RATE_LIMIT_REST_TOKEN`

A função manda `INCR` e `EXPIRE` num único POST, com timeout de cerca de 800 ms. Se o store não responder, o envio segue e fica um aviso no log. O modo `required` do reCAPTCHA não abre mão quando o Google falha.

## Destinatário

`CONTACT_TO` continua opcional. Sem ela, vale o destinatário que já estava no código e a função emite um aviso. Trocar isso para falhar quando a variável falta é decisão do dono.
