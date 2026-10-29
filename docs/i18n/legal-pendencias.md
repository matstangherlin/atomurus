# Páginas legais — pendências para revisão jurídica

Prompt 26, B04. O B04 alinhou **só idioma e paridade** de `privacy`, `terms` e `contact`
(`.html`/`.pt.html`); nenhuma cláusula mudou de sentido. Tudo o que pede decisão de conteúdo
jurídico ficou como está e vai listado aqui, para o dono/advogado. Medições: [`legal-antes.md`](legal-antes.md).

## 1. Texto que passou a aparecer no HTML estático da versão PT

Estes textos **já existiam** no dicionário (`tools/i18n-dict-source.js`) e já eram mostrados por
JavaScript a quem abre a página em PT; agora também saem no HTML estático (robôs, prévias de link,
navegação sem JS). Nenhum foi reescrito. Vale uma leitura antes do deploy porque o estático
anterior mostrava, nesses pontos, o parágrafo em inglês:

- `privacy`: `calloutHtml`, `p_1Html`, `p_2Html`, `p_3Html`, `li_3_1Html`–`li_3_3Html`, `p_3bHtml`,
  `p_4Html`, `p_4bHtml`, `p_5Html`, `p_5bHtml`, `p_6Html`, `p_13Html`.
- `terms`: `p_1Html`, `p_2Html`, `li_4_1Html`, `p_9Html`, `p_13Html`.
- `contact`: `noteHtml` («Ao enviar, você concorda com nossa Política de Privacidade e Termos de
  Uso…»), `errHtml`.

`privacy.p_6Html` (reCAPTCHA): o `.pt.html` antigo omitia «(como dados do dispositivo e do
aplicativo)»; o valor do dicionário, que agora vale também no estático, traz o trecho — e fica igual
ao EN.

## 2. Tradução nova (escrita neste commit)

| Chave | EN (fonte, já publicada) | PT (novo) |
|---|---|---|
| `contact.privacyHtml` | Your name, email and message are transmitted through **Mailgun** (our email provider) and delivered to our inbox. We never share contact details with third parties. For complete details, see our Privacy Policy. | Seu nome, e-mail e mensagem são transmitidos pelo **Mailgun** (nosso provedor de e-mail) e entregues na nossa caixa de entrada. Nunca compartilhamos dados de contato com terceiros. Para todos os detalhes, veja nossa Política de Privacidade. |
| `contact.emailLeadHtml` | Prefer email? Write to the address below — it lands in the same inbox as the form. | Prefere e-mail? Escreva para o endereço abaixo — ele chega na mesma caixa de entrada do formulário. |
| `contact.socialLead` | Follow Atomurus on social media for release notes, new elements, behind-the-scenes lab work and short scientific posts. | Siga o Atomurus nas redes sociais para notas de versão, novos elementos, bastidores do laboratório e posts científicos curtos. |

O resto do que é novo é rótulo de navegação: títulos (`titleHtml`), «Data de vigência», sumário
lateral (repete os títulos das seções, conferido por teste), faixa de dados e barra de status.

O sumário de `privacy` dizia «Advertising — Google AdSense» enquanto a seção 5 se chama
«Advertising — Google AdSense and AdCash»; o sumário agora repete o título da seção nos dois idiomas.

## 3. Diferenças de sentido EN × PT (não alteradas)

| Chave | EN | PT | Observação |
|---|---|---|---|
| `privacy.li_2_3` | Sensitive personal **profile** data beyond what is required for account access | **Dados pessoais sensíveis** além do necessário para acesso à conta | «Dados pessoais sensíveis» é categoria definida na LGPD (art. 5º, II); o EN fala em dados de perfil. Escolher um sentido e alinhar as duas versões. |
| `privacy.li_2_2` | Payment details inside **the site database** | Detalhes de pagamento dentro do **banco principal** do site | «principal» não está no EN. |
| `privacy.p_13Html` | …are delivered **to our inbox** by Mailgun… | …são entregues pelo Mailgun… | PT omite «à nossa caixa de entrada». |
| `privacy.metaDesc` | …Plain language, short on jargon. | …Linguagem clara. | Só descrição de busca; sem efeito jurídico. |

## 4. Pontos de conteúdo jurídico (fora do escopo de idioma)

Observados ao ler as duas versões lado a lado; **nada foi mudado**:

1. **Publicidade:** `privacy` cita Google AdSense **e AdCash**; `terms.p_9Html` e `terms.p_8`
   (serviços de terceiros) citam só Google. Alinhar os dois documentos.
2. **Serviços de terceiros em `terms.p_8`:** não citam Mailgun (formulário de contato), o provedor de
   autenticação de contas nem o processador de pagamento, que aparecem em outros pontos do site.
3. **Crianças (`privacy.p_8`):** usa «menores de 13 anos»; LGPD art. 14 e ECA definem criança como
   até 12 anos incompletos e exigem consentimento específico de um dos pais/responsável.
4. **LGPD — itens que a política não traz:** identificação do controlador (art. 9º, III), contato do
   encarregado (art. 41), bases legais de cada tratamento, prazos de retenção e transferência
   internacional (Google, Mailgun).
5. **Lei aplicável (`terms.p_12`):** «leis da jurisdição em que o operador está estabelecido» é
   genérico; para usuários no Brasil o CDC se aplica e limita a cláusula de foro e a de
   responsabilidade (`terms.p_5`).
6. **Datas:** «16 de Maio de 2026» (PT) usa maiúscula no mês, que em português se escreve em
   minúscula; mantido como já estava (rodapé e data de vigência iguais).

## 5. Fora das páginas legais

- O rótulo oculto da busca («Search element») e o `aria-label` da conta («Account») estão em EN no
  HTML estático das outras páginas PT; corrigido aqui só nas 3 legais e no modelo
  `templates/chrome/search.html` (as páginas existentes não são re-injetadas). O `aria-label`
  «Laboratory» do menu lateral foi corrigido no modelo `public-sidebar.html`, que o build reaplica a
  todas as páginas.
- A faixa de dados e a barra de status de outras páginas seguem sem chave em vários lugares.
