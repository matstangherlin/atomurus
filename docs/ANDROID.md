# Atomurus Android (APK / AAB)

O app Android é o mesmo frontend do app (`dist/app`, gerado por `npm run build:app`)
empacotado com **Capacitor 8**. Os arquivos do app vão dentro do APK; só a API é
remota (`https://atomurus.com/api`). Pacote: **`atomurus.com`** (não pode mudar depois
do primeiro envio à Play).

## O que acontece automaticamente

| Quando | Workflow | Resultado |
| --- | --- | --- |
| Todo PR e todo push na `main` | `.github/workflows/android-build.yml` | **APK + AAB debug** como artifact do run (7 dias em PR, 30 na main) |
| Manual (Actions → *Android release (manual)* → Run workflow), só da `main` | `.github/workflows/android-release.yml` | **APK + AAB assinados** com a upload key; se houver credencial da Play, envia o AAB para a trilha escolhida |

### Baixar o APK de um PR

1. No PR, aba **Checks** → **Android build** → *Summary*.
2. Em **Artifacts**, baixe `atomurus-<versão>-<versionCode>-<sha>-debug`.
3. Descompacte e instale o `.apk` no celular (permitir "instalar apps desconhecidos").

O APK debug é para testar; não vai para a Play.

## Versão

- `versionName` (o que aparece na loja): `android/version.properties` → aumente a cada lançamento público.
- `versionCode`: calculado no CI como o número de commits (`git rev-list --count HEAD`), sempre crescente. O valor do arquivo é só o mínimo.

## Preparar o lançamento na Google Play (uma vez)

### 1. Criar a upload key

```bash
keytool -genkeypair -v -keystore atomurus-upload.jks -alias atomurus-upload -keyalg RSA -keysize 2048 -validity 10000
```

Guarde o `.jks` e as senhas fora do repositório (gerenciador de senhas). Nunca faça commit.

### 2. Secrets no GitHub

*Settings → Secrets and variables → Actions → New repository secret*:

| Secret | Valor |
| --- | --- |
| `ATOMURUS_ANDROID_KEYSTORE_BASE64` | saída de `base64 -w0 atomurus-upload.jks` (no Windows: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("atomurus-upload.jks"))`) |
| `ATOMURUS_ANDROID_KEYSTORE_PASSWORD` | senha do keystore |
| `ATOMURUS_ANDROID_KEY_ALIAS` | `atomurus-upload` |
| `ATOMURUS_ANDROID_KEY_PASSWORD` | senha da chave |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | *(opcional)* JSON da service account com acesso ao app no Play Console |

Sem os quatro primeiros, o release para com `BLOCKED_SIGNING_SECRETS` (nunca assina com a chave de debug).
Sem o último, o AAB assinado fica como artifact e você envia à mão no Play Console.

### 3. Play Console

1. Crie o app com o pacote `atomurus.com` e ative o **Play App Signing**.
2. **O primeiro AAB precisa ser enviado manualmente** (a API da Play só aceita envios depois que o app existe com um build): rode o workflow de release, baixe o `.aab` do artifact e envie em *Teste interno*.
3. Para envio automático: *Google Cloud* → crie uma service account → no Play Console, *Usuários e permissões* → convide o e-mail dela com permissão de lançamento → salve o JSON no secret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`.

### 4. Publicar uma versão

Actions → **Android release (manual)** → *Run workflow* (branch `main`):

- `track`: `internal` (padrão), `alpha`, `beta` ou `production` (exige digitar `PUBLICAR-PRODUCAO`).
- `release_status`: `draft` (você conclui no Play Console) ou `completed`.
- `release_notes`: novidades em pt-BR.

## Build local

Requer Node 22, JDK 21 e Android SDK (Android Studio).

```bash
npm ci
npm run android:debug     # APK + AAB debug em release-artifacts/
npm run android:open      # abre no Android Studio
npm run android:release   # assinado: variáveis ATOMURUS_ANDROID_* ou android/keystore.properties
```

Ícones e splash saem de `assets/icons` e `assets/brand`: depois de mudar a marca, rode `npm run android:icons`.

## Peças nativas

- `capacitor.config.json` — sem `server.url` (o app nunca é uma WebView do site); `CapacitorHttp` ligado (API sem CORS).
- `android/app/src/main/java/atomurus/com/AtomurusSecureStoragePlugin.java` — tokens de login cifrados com AES-GCM e chave no Android Keystore. Sem ele o app recusa iniciar (`src/app/bootstrap/app-main.js`).
- `android/app/atomurus-signing.gradle` — assinatura de release só com a upload key.

## Pendência conhecida

Login dentro do app usa `POST /api/auth/token` (contrato em `src/core/auth/native-auth-adapter.js`),
que ainda não existe nas Netlify Functions. Navegação, tabela periódica, moléculas, explorar
e laboratório funcionam; entrar na conta pelo app depende dessa função.
