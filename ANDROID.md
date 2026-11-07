# Atomurus no Android (Google Play)

App feito com **Capacitor 8**. O APK leva o site inteiro dentro dele (tabela
periódica, laboratório, isomeria, calculadoras, modelos 3D e matérias) e abre
mesmo sem internet.

| | |
|---|---|
| Pacote (ID do app) | `com.atomurus` — **não muda depois do 1º envio ao Play** |
| Nome no celular | Atomurus |
| Versão atual | `android/gradle.properties` → `atomurusVersionCode` / `atomurusVersionName` |
| Android | alvo API 36 (Android 16), mínimo API 24 (Android 7) |

## O que é diferente no app (por enquanto)

- **Sem login:** "Entrar", "Criar conta", menu da conta, "Salvar/Nota" e study
  sets ficam ocultos em todas as páginas; `/login`, `/signup`, `/account`
  voltam para o início.
- **Sem planos e sem compras:** "Planos", preços, "Pro", upgrade e as
  ferramentas que só existem no Pro ficam ocultos (o Google Play exige o
  faturamento do próprio Play para vender recursos digitais dentro do app).
- **Sem anúncios e sem analytics:** o AdSense não é permitido dentro de apps;
  as tags são removidas da cópia do APK e o banner de cookies não aparece.
- O site continua igual: nada disso é carregado no navegador.

Arquivos: `tools/android/android-app.js` e `android-app.css` (camada do app),
`tools/build-android-web.mjs` (gera `dist/android-web`), `capacitor.config.json`.

## Gerar o AAB e o APK no seu computador

Precisa de Node 22+, JDK 21 e o Android SDK (o Android Studio instala). Na
primeira vez, rode `npm ci`.

```bash
npm run android:release
```

Saída em `release/android/`:

- `atomurus-<versão>-v<código>.aab` → **este vai para o Google Play**
- `atomurus-<versão>-v<código>.apk` → instale direto no celular para testar

Para cada **novo** envio ao Play, suba o número da versão antes:

```bash
npm run android:release -- --bump
```

Outros comandos: `npm run android:open` (abre no Android Studio),
`npm run android:sync` (só atualiza as páginas no projeto Android),
`npm run android:icons` (refaz ícones e splash a partir do logo).

## Chave de upload (assinatura)

O Google Play exige que o AAB seja assinado com a sua **chave de upload**.

- Arquivo: `android/keystore/atomurus-upload.jks`
- Senhas e alias: `android/keystore.properties`
- Os dois ficam **fora do git** (`android/.gitignore`). Guarde uma cópia em
  lugar seguro (gerenciador de senhas / drive pessoal). Se perder, dá para
  pedir a troca da chave de upload no Play Console, mas demora.

Para gerar pelo GitHub (Actions → "Android (APK + AAB)" → Run workflow),
cadastre em Settings → Secrets → Actions:

| Secret | Valor |
|---|---|
| `ANDROID_UPLOAD_KEYSTORE_BASE64` | conteúdo do `.jks` em base64 (`base64 -w0 android/keystore/atomurus-upload.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | `storePassword` do `keystore.properties` |
| `ANDROID_KEY_ALIAS` | `atomurus-upload` |
| `ANDROID_KEY_PASSWORD` | `keyPassword` do `keystore.properties` |

Os arquivos ficam no artefato `atomurus-android` da execução.

## Primeiro envio: teste interno no Play Console

1. Play Console → seu app → **Testar e lançar → Teste interno → Criar nova versão**.
2. Em **Assinatura de apps do Google Play**, aceite (o Google guarda a chave do
   app; a sua chave vira a chave de upload).
3. Envie o arquivo **`.aab`**. O pacote `com.atomurus` fica fixo a partir daqui.
4. Nome da versão: aparece sozinho (ex.: `1 (1.0.0)`). Escreva as notas da versão.
5. Aba **Testadores**: crie uma lista de e-mails e copie o link de participação.
6. Salve → Revisar versão → **Iniciar lançamento para teste interno**.

O Play também pede, antes de liberar: política de privacidade
(`https://atomurus.com/privacy.html`), classificação de conteúdo, público-alvo,
segurança dos dados (o app não coleta dados nem tem anúncios) e a ficha da loja.
Ícone 512×512 e imagem de destaque 1024×500 prontos em `android/store/`.
