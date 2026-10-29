# Proteção contra senhas vazadas (prompt 29, M12-c)

## O que é

O Supabase Auth pode recusar, no cadastro e na troca de senha, uma senha que já apareceu em
vazamentos públicos. A checagem usa a base do serviço Have I Been Pwned por *k-anonimato*: só os
primeiros caracteres do hash SHA-1 da senha saem do Supabase; a senha nunca é enviada inteira e
o Atomurus não participa da consulta.

Quando a proteção recusa uma senha, o provedor responde `422` com
`error_code: "weak_password"` e `weak_password.reasons` contendo `"pwned"`.

## Como o dono liga (passo manual)

1. No painel do Supabase, abra o projeto do Atomurus.
2. Vá em **Authentication** → configurações de **senha** (a seção onde ficam o tamanho mínimo e os
   caracteres exigidos).
3. Ative **Leaked password protection** (proteção contra senhas vazadas) e salve.
4. Teste num projeto ou branch de desenvolvimento antes: tente cadastrar uma conta de teste com
   uma senha sabidamente vazada (por exemplo, uma senha de lista pública de senhas comuns que
   cumpra a política de 9 caracteres com símbolo) e confira a mensagem abaixo.

**Plano:** a opção pode exigir um plano pago do Supabase (o relatório de auditoria cita o
Supabase Pro). Confirme no painel antes de contar com ela.

## O que o código faz (e o que não faz)

- O código **não depende** da proteção estar ligada. Desligada, nada muda: as senhas seguem a
  política local (`passwordPolicyError` em `netlify/lib/netlify-identity-utils.mjs`: ≥ 9
  caracteres e um símbolo).
- Ligada, `auth-signup.mjs` e `auth-reset.mjs` reconhecem o erro
  (`isLeakedPasswordError`: `code === 'weak_password'` e `reasons` inclui `'pwned'`) e respondem
  `400 { ok:false, code:'password_pwned', error:'This password has appeared in known data leaks. Choose another.' }`.
- A tela de entrar/cadastrar (`auth-login.js`) mostra `common.auth.passwordPwned`:
  - PT: «Essa senha apareceu em vazamentos conhecidos. Escolha outra.»
  - EN: «This password has appeared in known data leaks. Choose another.»
- A resposta e o log **nunca** contêm a senha. O log registra só `errorType: 'password_pwned'`.
- Outros motivos de `weak_password` (tamanho, tipos de caractere) mantêm a mensagem do provedor.

Teste: `tools/test-auth-flows.mjs` (bloco «Prompt 29, block C»), com o Supabase simulado.
