# Consentimento

Nenhum script de medição ou de anúncio é pedido antes de uma escolha. Aceitar não recarrega a página: o evento `atomurus:consent` avisa os carregadores.

## Chaves

| Chave | Valor |
| --- | --- |
| `atomurus-cookie-consent` | `accepted` (medição e anúncios) ou `rejected` (nenhum dos dois). Continua válida para os testes antigos. |
| `atomurus-cookie-consent-v2` | JSON `{ v: 2, analytics, ads, ts }`. Quando existe, é a fonte da escolha, inclusive se só uma categoria estiver ligada. |

As duas estão em `src/core/storage/storage-policy.js`.

## API

`window.atomurusConsent`

- `get()` → `{ decided, analytics, ads, ts }`
- `set({ analytics, ads })` grava, atualiza a chave antiga e emite o evento
- `open()` abre o painel de novo
- `onChange(fn)`

`window.ATOMURUS_CONSENT_CONFIG`

- `enforce` (padrão `true`): com `false`, os carregadores não esperam a escolha
- `adcashDisabledPathPrefixes` (padrão `[]`): prefixos de caminho em que a AdCash não carrega
- `adcashDisabledForMinors` (padrão `false`): se `true`, a AdCash não carrega. Não há detecção de idade.

## Quem escuta

- `lazy-ads.js` inicia a medição só com `analytics`. O Consent Mode v2 começa negado e passa a `granted` na escolha. Retirar a medição apaga cookies `_ga` e `_ga_*` e para novos envios. O arquivo do script que já entrou na página não sai da memória.
- `ads-gate.js` pede AdSense e AdCash só com `ads` e com `/api/ads-config` dizendo `adsEnabled: true`. `ADS_FAIL_OPEN` é `false`: falha ou resposta sem `ok` deixa anúncios desligados. Anúncios já desenhados somem no próximo carregamento.
- `cookie-consent.js` mostra Aceitar, Recusar e Configurar. O botão `[data-consent-manage]` reabre o painel.

## Novo script de terceiro

Só depois da escolha. Exemplo para medição:

```js
if (window.atomurusConsent.get().analytics) startVendor();
window.addEventListener('atomurus:consent', function () {
  if (window.atomurusConsent.get().analytics) startVendor();
});
```

## Cookies

| Cookie | Categoria | Quando |
| --- | --- | --- |
| escolha em localStorage | Necessários | sempre |
| `_ga`, `_ga_*` | Medição | depois de permitir medição |
| `IDE` | Publicidade | depois de permitir anúncios |
| `_GRECAPTCHA` | Formulários | página com formulário, independente do banner |

O reCAPTCHA continua nas páginas com formulário. A base legal dessa carga e o tratamento de menores estão em `docs/consent-notes.md`, fora do HTML publicado.
