# Plano de Execução — Segurança + Login (Atomurus)

> Atualização em 2026-06-25: a implementação de login foi migrada para **Netlify Identity** com cadastro por email/senha. As instruções antigas deste plano que mencionam Supabase ficaram como histórico e foram substituídas pelo guia `NETLIFY-IDENTITY-SETUP.md`.

> Companheiro "mão na massa" do **Cronograma de Estudo** e do **Roteiro de Segurança** (`MELHORIAS.md`).
> Enquanto o Cronograma diz o que **estudar**, este plano diz o que **executar** — em prompts prontos para colar numa IA.

---

## Como usar este plano

- **Um bloco por vez.** Cada bloco tem um **prompt extenso e autossuficiente** dentro de um bloco ```` ```text ````. Copie esse texto e cole na IA (ex.: Claude Code rodando na pasta do projeto).
- Quando terminar um bloco, volte aqui e siga para o próximo. É só dizer **"continuar"**.
- **Cada prompt assume que a IA NÃO lembra da conversa anterior.** Por isso cada um repete o contexto necessário. Pode colar "do zero" a qualquer momento.
- **"Você faz antes (manual)"** = passos que só você pode fazer (mexer em painel do Netlify/Supabase/Mailgun). A IA não tem acesso a esses painéis.
- **Critério de aceite** = como saber que o bloco terminou de verdade.

---

## Estado atual (já feito nesta etapa) ✅

Antes de começar, saiba o que **já existe** para a IA não refazer:

- **Login email+senha já implementado** com **Supabase Auth via Netlify Functions**, sessão em **cookies HttpOnly/Secure/SameSite=Lax** (prefixo `__Host-` em produção), cadastro **invite-only** (sem signup público).
- **Functions:** `netlify/functions/auth-login.js`, `auth-me.js`, `auth-refresh.js`, `auth-logout.js`, `auth-recover.js`, `private-dashboard.js` + biblioteca `netlify/lib/auth-utils.js`.
- **Páginas:** `login.html` (`/login`), `app.html` (`/app`) e `404.html` — reconstruídas no **shell padrão do site** (`lc-doc`, igual ao `contact.html`: `lc-topnav` com toggle de idioma/tema, `data-strip`, `lc-doc-hero`, `lc-doc-body`, `lc-form`, `lc-footer`, `lc-statusbar`). Scripts cliente: `auth-login.js`, `auth-app.js`.
- **`netlify.toml`:** redirects `/api/auth/*` e `/api/private/dashboard`; headers globais (CSP, HSTS `max-age=31536000`, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy); `Cache-Control: no-store` em `/login`, `/app`, `/api/*`; bloqueios de `/.env*`, `/.git/*`, `/netlify/*`, `/scripts/*`, `/.claude/*`, `*.log`.
- **`.netlifyignore`** já exclui `.env`, `*.log`, `*.md`, `*.bak*`, `sitemap.zip` do deploy.

**O que falta** (é o que este plano executa): rotacionar a chave do Mailgun, ligar o Supabase nas variáveis do Netlify, criar usuários, endurecer e testar o login, blindar o site gratuito e preparar a área paga.

---

## Visão geral da ordem

| Bloco | O que faz | Mapeia para |
|---|---|---|
| **0** | Crítico imediato: rotacionar Mailgun + higiene de deploy | Cronograma Bloco 0 · `MELHORIAS.md` itens 1 e 3 · Fase 0 |
| **1** | Ligar o login já construído (Supabase + 1º usuário + smoke test) | Cronograma Bloco 5 (auth) · Fase 2 |
| **2** | Endurecer o login (rate limit, logs, cookies, CSP/CORS) | Cronograma Blocos 2–3 (Web Security/OWASP) |
| **3** | Testar o fluxo completo do login + scanner | Cronograma Bloco 3 · Fase 2 |
| **4** | Blindar o site gratuito (HSTS, tirar `unsafe-inline`, scanner) | Cronograma Bloco 4 · `MELHORIAS.md` item 8 · Fase 1 |
| **5** | Preparar área paga (free/paid/admin, LGPD, dependências) | Cronograma Bloco 5 · Fase 2 |

> Ordem recomendada: **0 → 1 → 2 → 3 → 4 → 5.** O login (1–3) vem antes da Fase 1 (4) porque é a sua prioridade declarada; mas se preferir blindar o site gratuito primeiro, pode rodar o **4** logo depois do **0**.

---

## Bloco 0 — Crítico imediato (faça já, em paralelo)

**Objetivo:** eliminar o risco de vazar a chave do Mailgun e garantir que nada sensível vá para o deploy.

**Você faz antes (manual):**
1. **Rotacionar a chave do Mailgun:** Mailgun → *API Keys* → *regenerate*. Copie a nova chave.
2. No **painel do Netlify** → *Site settings → Environment variables*: atualize `MAILGUN_API_KEY` com a nova chave. Confirme que `MAILGUN_DOMAIN`, `CONTACT_TO`, `CONTACT_FROM` continuam corretos.
3. (Se já tiver) confirme que `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão lá — se não, deixa para o Bloco 1.

**Prompt para a IA:**

```text
Contexto: Atomurus é um site estático publicado no Netlify com publish="." (a raiz inteira é publicada). Funções serverless ficam em netlify/functions. Segredos ficam SÓ em variáveis de ambiente do Netlify, nunca no repositório.

Tarefa: auditoria de higiene de deploy (NÃO mexa em segredos, NÃO faça deploy). Quero garantir que nenhum arquivo sensível ou interno seja publicado.

1. Liste todos os arquivos na raiz e subpastas que SERIAM publicados com publish="." e que NÃO deveriam ser públicos: .env e variações, qualquer *.bak, *.zip, *.log, documentação interna (*.md como MELHORIAS.md, MAILGUN-SETUP.md, RECAPTCHA-SETUP.md, PLANO-*.md), a pasta netlify/, a pasta scripts/, e scripts one-off de migração na raiz (ex.: fix-*.js, migrate-*.js, add-*.js, sync-*.js, enrich-*.js, patch.js).
2. Para cada um, verifique se já está coberto por .netlifyignore OU por um redirect de bloqueio no netlify.toml. Faça uma tabela: arquivo | coberto por | ok?.
3. Onde houver lacuna, proponha a correção mínima (uma linha no .netlifyignore ou um [[redirects]] de bloqueio para /404.html com status=404 force=true no netlify.toml). Aplique apenas correções de bloqueio (são seguras e reversíveis) e explique cada uma.
4. Confirme por leitura que o .env NÃO está versionado nem publicável (deve estar no .gitignore e no .netlifyignore) e que NENHUM arquivo .html/.js público contém chaves/segredos (faça um grep por padrões como "SERVICE_ROLE", "api_key", "secret", "Bearer ", "SUPABASE_SERVICE", "MAILGUN_API").
5. No final, me dê um checklist do que verificar manualmente em produção depois do próximo deploy: que https://atomurus.com/.env, /MELHORIAS.md, /netlify/functions/auth-login.js e /scripts/static-server.ps1 retornem 404.

Não altere nenhuma lógica de aplicação. Só bloqueios de exposição.
```

**Critério de aceite:**
- Chave do Mailgun rotacionada e atualizada no Netlify.
- Nenhum arquivo interno/sensível publicável sem bloqueio.
- Grep não encontra segredo nenhum em arquivo público.
- Checklist de URLs 404 pronto para validar pós-deploy.

---

## Bloco 1 — Ligar o login (ele já está construído)

**Objetivo:** o sistema de login já existe no código; este bloco o coloca **funcionando de verdade** ligando o Supabase e criando o primeiro usuário.

**Você faz antes (manual):**
1. Crie um projeto no **Supabase** (se ainda não tiver). Em *Project Settings → API*, copie a **Project URL** e a **anon/public key**.
2. No **Netlify** → *Environment variables*, crie:
   - `SUPABASE_URL` = a Project URL
   - `SUPABASE_ANON_KEY` = a anon key
   - (opcional) `AUTH_ALLOWED_ORIGINS` = `https://atomurus.com,https://www.atomurus.com`
   - (opcional) `AUTH_PASSWORD_REDIRECT` = `https://atomurus.com/login`
3. No **Supabase** → *Authentication → Providers → Email*: habilite Email, e **desabilite "Enable email signups"** (queremos invite-only). Em *Authentication → Users*, clique **Add user** e crie seu primeiro usuário (email + senha) — marque "Auto confirm".
4. (Para o "esqueci a senha") Em *Authentication → Email Templates*, confira o template de *Reset Password*; se quiser SMTP próprio, configure em *Project Settings → Auth → SMTP*.

**Prompt para a IA:**

```text
Contexto: Atomurus (site estático no Netlify). O login email+senha JÁ está implementado com Supabase Auth via Netlify Functions: netlify/functions/auth-login.js, auth-me.js, auth-refresh.js, auth-logout.js, auth-recover.js, private-dashboard.js e netlify/lib/auth-utils.js. Front-end: login.html (/login), app.html (/app), auth-login.js, auth-app.js. Os redirects /api/auth/* e /api/private/dashboard estão no netlify.toml. As variáveis SUPABASE_URL e SUPABASE_ANON_KEY já foram configuradas no painel do Netlify (não estão no repositório, e está correto assim).

Tarefa: revisar a configuração e me dar um roteiro de smoke test, SEM expor segredos.

1. Leia auth-utils.js e confirme: como ele lê SUPABASE_URL/SUPABASE_ANON_KEY; o que acontece se faltarem (deve retornar 500 "Supabase auth is not configured"); e que a service role key NUNCA é usada no cliente nem exigida por essas funções.
2. Confirme que os endpoints batem com o front-end: auth-login.js chama POST /api/auth/login e POST /api/auth/recover; auth-app.js chama GET /api/auth/me, POST /api/auth/refresh, POST /api/auth/logout, GET /api/private/dashboard. Aponte qualquer divergência de rota entre HTML/JS e netlify.toml.
3. Verifique o fluxo de cookies em auth-utils.js: nomes __Host-atm_access/__Host-atm_refresh em produção e atm_access/atm_refresh em localhost; atributos HttpOnly, Secure (só em prod), SameSite=Lax, Path=/. Confirme que o prefixo __Host- é válido (Secure + Path=/ + sem Domain).
4. Me explique como rodar localmente com a Netlify CLI (netlify dev) e quais variáveis preciso ter num .env LOCAL só para teste (SUPABASE_URL, SUPABASE_ANON_KEY) — lembrando que esse .env local não pode ir para o git nem para o deploy.
5. Me dê um roteiro de smoke test manual: (a) abrir /login, logar com o usuário criado no Supabase → deve redirecionar para /app e mostrar email/plan/role; (b) recarregar /app → continua logado; (c) Logout → volta para /login; (d) abrir /app sem sessão → redireciona para /login.

Não altere lógica de auth neste bloco a menos que encontre um bug que impeça o login de funcionar — nesse caso, descreva o bug, proponha o fix mínimo e só então aplique.
```

**Critério de aceite:**
- `netlify dev` (ou o deploy) loga com o usuário do Supabase e abre `/app` com os dados reais.
- Logout limpa a sessão; `/app` sem sessão manda para `/login`.
- Nenhuma rota divergente entre HTML/JS e `netlify.toml`.

---

## Bloco 2 — Endurecer o login

**Objetivo:** aplicar as defesas de Web Security/OWASP que você estuda nos Blocos 2–3 do Cronograma, direto no código do login.

**Prompt para a IA:**

```text
Contexto: Atomurus (Netlify). Login email+senha com Supabase Auth via Netlify Functions (netlify/functions/auth-*.js, private-dashboard.js, lib/auth-utils.js). Sessão em cookies HttpOnly/Secure/SameSite. Quero endurecer a segurança do login. Para CADA item, primeiro me explique o risco (em 1-2 frases) e a defesa, depois aplique a mudança mínima e segura.

1. Rate limiting / brute force: revise o rate limit por IP e por email em auth-login.js. Documente a limitação conhecida (Map em memória é por instância serverless, melhor-esforço). Proponha — sem implementar ainda — um caminho para rate limit compartilhado (ex.: Upstash Redis) para quando houver área paga.
2. Mensagens genéricas: confirme que login inválido sempre retorna a MESMA mensagem e status, sem revelar se o email existe (anti enumeração de usuários). Confira o mesmo em auth-recover.js (deve responder 200 genérico mesmo para email inexistente).
3. Logs sem dados sensíveis: garanta que nenhum console.* registra senha, access_token, refresh_token nem cookies. Email/IP em log de tentativa rejeitada é aceitável; tokens e senhas, nunca.
4. Cache de respostas autenticadas: confirme Cache-Control: no-store nas respostas das funções de auth e nos headers de /api/* e /login e /app no netlify.toml.
5. Cookies: revise atributos (HttpOnly, Secure em prod, SameSite=Lax, Path=/, prefixo __Host-) e os Max-Age (access curto ~ token, refresh longo). Confirme que logout/refresh-falho limpam TODOS os nomes de cookie (prod e local).
6. CORS e Origin: revise assertAllowedOrigin/corsHeaders em auth-utils.js. Em produção só devem passar atomurus.com/www e localhost; nada de "*". Methods/Headers mínimos.
7. CSP: confirme que as páginas /login e /app só precisam de connect-src 'self' (o browser fala só com as functions, nunca direto com o Supabase). Aponte qualquer origem desnecessária herdada da CSP global.
8. (Opcional, recomende mas só implemente se eu confirmar) reCAPTCHA v3 no login: o site já tem recaptcha.js e uma function recaptcha-verify.js para o formulário de contato. Descreva como adicionaria verificação de token no auth-login.js (sem bloquear o login se o token falhar de leve), reaproveitando o que já existe.

Ao final, liste em bullets cada defesa aplicada e o porquê. Não quebre o fluxo de login que já funciona.
```

**Critério de aceite:**
- Cada defesa explicada + aplicada (ou recomendada, no caso do reCAPTCHA).
- Login continua funcionando (rode o smoke test do Bloco 1 de novo).
- Nenhum token/senha em logs; mensagens genéricas confirmadas.

---

## Bloco 3 — Testar o fluxo completo + scanner

**Objetivo:** validar o login inteiro de forma sistemática (Bloco 3 do Cronograma) antes de confiar nele.

**Você faz antes (manual):** ter um deploy (ou `netlify dev`) com o Supabase ligado e um usuário válido.

**Prompt para a IA:**

```text
Contexto: Atomurus (Netlify) com login email+senha (Supabase Auth via Netlify Functions). Quero testar o fluxo completo e a postura de segurança. Conduza os testes que dá para automatizar/inspecionar via código e me dê um checklist manual claro para o resto.

Matriz de teste (descreva o resultado ESPERADO de cada um e, onde possível, verifique por leitura de código/respostas):
1. Login correto → cria sessão, redireciona /app, /app mostra dados do usuário.
2. Login inválido (senha errada e email inexistente) → mesma mensagem genérica, status 401, sem vazar existência do email.
3. Logout → cookies limpos, redireciona /login, /app deixa de abrir.
4. Acesso direto a /app sem sessão → redireciona /login (não renderiza conteúdo privado).
5. Acesso direto a GET /api/private/dashboard sem cookie → 401, corpo sem dados privados.
6. Token de acesso expirado mas refresh válido → /api/auth/refresh renova e /app continua.
7. Cookies: confirme HttpOnly, Secure (prod), SameSite=Lax, prefixo __Host- (prod) via inspeção das respostas Set-Cookie das funções.
8. Sem segredos no cliente: grep em todos os .html e .js públicos por SUPABASE_SERVICE, SERVICE_ROLE, api_key, secret, Bearer, e por tokens/JWT hardcoded → deve dar zero.
9. Nada sensível em localStorage: confirme que o front-end só usa localStorage para tema/idioma, nunca para token de sessão.

Depois:
10. Rode (ou me dê o comando exato e interprete a saída): npm audit. Liste vulnerabilidades de dependências e o que atualizar.
11. Me dê o passo a passo para rodar um scanner externo no deploy: Mozilla Observatory (https://observatory.mozilla.org) e, se eu quiser ir além, OWASP ZAP (baseline scan). Liste os achados típicos que ESPERAMOS estar verdes por causa da nossa CSP/HSTS/cookies, e o que fazer se algum vier vermelho.

Entregue um relatório final: tabela teste | esperado | resultado | ação.
```

**Critério de aceite:**
- Todos os itens 1–9 passam.
- `npm audit` sem vulnerabilidades altas/críticas (ou plano para resolvê-las).
- Mozilla Observatory com nota boa (A/B) no deploy.

---

## Bloco 4 — Blindar o site gratuito (Fase 1)

**Objetivo:** executar a Fase 1 do Roteiro de Segurança (`MELHORIAS.md` item 8 e cia.) — o site público endurecido, independente do login.

**Prompt para a IA:**

```text
Contexto: Atomurus, site estático no Netlify com publish=".". Já existe netlify.toml com CSP, HSTS (max-age=31536000), X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy; e o formulário de contato usa Netlify Function (contact-send.js) com reCAPTCHA. Quero blindar o site público. Para cada item, explique e aplique a mudança mínima.

1. HSTS: avalie adicionar includeSubDomains ao Strict-Transport-Security. Antes de aplicar, confirme comigo que TODOS os subdomínios usados (se houver) servem HTTPS, porque includeSubDomains é difícil de reverter. Se sim, aplique. NÃO adicione preload ainda.
2. Higiene de deploy: confirme (e complete) que .netlifyignore + os redirects de bloqueio do netlify.toml mantêm fora do deploy: .env, *.log, *.bak*, *.md internos, *.zip, netlify/, scripts/, e scripts one-off da raiz. (Pode haver sobreposição com o Bloco 0 — torne idempotente.)
3. Rate limit do formulário de contato: revise contact-send.js. Se ainda não tiver, adicione rate limit por IP (melhor-esforço em memória) e honeypot/checagem do reCAPTCHA. Mensagens genéricas em erro.
4. CSP — remover 'unsafe-inline' do script-src: hoje a CSP global usa 'unsafe-inline' por causa dos scripts inline de bootstrap (tema/idioma) e do gtag. Plano em duas partes: (a) liste TODOS os scripts inline do site e seus conteúdos; (b) proponha trocar 'unsafe-inline' por hashes 'sha256-...' calculados desses inlines, e descreva como manter isso (idealmente o bump-version.js recalculando os hashes quando o inline muda). Implemente só se os scripts de bootstrap estiverem estáveis; senão, me explique o risco de manutenção e deixe pronto mas não ative.
5. Scanner: me dê o passo a passo do Mozilla Observatory + o que cada header contribui para a nota, e o que fazer se a nota cair por causa da mudança da CSP.

No final: tabela do antes/depois de cada header e um resumo do que ainda fica pendente (ex.: CSP por hash, se eu adiar).
```

**Critério de aceite:**
- HSTS revisado (com ou sem `includeSubDomains`, decisão consciente).
- Formulário de contato com rate limit + anti-spam.
- Plano de CSP-sem-`unsafe-inline` pronto (aplicado ou documentado).
- Nota do Observatory mantida ou melhorada.

---

## Bloco 5 — Preparar a área paga (futuro)

**Objetivo:** deixar a estrutura pronta para uma área paga **sem implementar pagamento ainda** (Bloco 5 do Cronograma). Pagamento (Stripe) fica para depois.

**Prompt para a IA:**

```text
Contexto: Atomurus (Netlify) com login email+senha (Supabase Auth via Netlify Functions). private-dashboard.js já retorna role (member/admin) e plan (free/paid/admin) decididos pelo SERVIDOR a partir do app_metadata do usuário no Supabase; o cliente nunca decide permissão. Quero preparar — sem implementar Stripe — a base para uma área paga.

1. Autorização: revise como role/plan são derivados em auth-utils.js (accessForUser/publicUser) e usados em private-dashboard.js. Confirme que: o cliente NÃO consegue se auto-promover; um endpoint privado checa plan no servidor antes de liberar conteúdo "paid"; e que adicionar um novo recurso pago é só uma checagem server-side.
2. Mostre, com um exemplo de código pequeno, como eu marcaria um usuário como "paid" no Supabase (app_metadata.atomurus_plan = "paid" via painel ou Admin API com a service role key — que fica SÓ no servidor, nunca no cliente).
3. Esqueleto de webhook de pagamento (sem Stripe real): descreva uma function netlify/functions/billing-webhook.js que, no futuro, validaria a assinatura do webhook (HMAC), e só então atualizaria o plan do usuário via Supabase Admin API. Deixe comentado/stub, sem credenciais. Explique por que validar a assinatura do webhook é essencial (anti-spoofing) — conceito de PCI DSS/validação de webhook.
4. LGPD (você coleta email e, no futuro, dados de pagamento, no Brasil): liste o mínimo prático — base legal, política de privacidade cobrindo auth/pagamento, retenção, e o direito de exclusão de conta. Aponte o que já existe (privacy.html) e o que falta.
5. Segurança de dependências: configure/ं recomende npm audit no fluxo e um Dependabot (ou renovate) se houver repositório GitHub. Liste pacotes desatualizados.

Entregue: um resumo do que está PRONTO para a área paga, o que é stub, e a lista ordenada do que implementar quando eu for ligar o Stripe. NÃO adicione dependências de pagamento agora.
```

**Critério de aceite:**
- Autorização server-side confirmada (cliente não decide).
- Caminho documentado para marcar usuário como `paid`.
- Esqueleto de webhook + checklist LGPD + estado das dependências.
- Zero código de Stripe adicionado.

---

## Depois dos blocos — manutenção contínua

- A cada nova página/feature: rode o **Bloco 0** (higiene) e confira o `npm audit`.
- Antes de ligar pagamento: **Bloco 5** vira a base; aí sim entra o Stripe num plano próprio.
- Mantenha `MELHORIAS.md` (Roteiro de Segurança) como a fonte de verdade das pendências do site; este arquivo é só a **sequência de execução**.

---

*Parte da trilogia: **Roteiro de Segurança** (`MELHORIAS.md`, ações no site) · **Cronograma de Estudo** (o que aprender) · **este Plano de Execução** (prompts na ordem de fazer).*
