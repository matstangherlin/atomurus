// Language mixing in the legal pages (prompt 26, B04). No dependencies.
//
//   node tools/lint-lang-mix.mjs              → check; exit 1 on a block in the other language
//   node tools/lint-lang-mix.mjs --report     → Markdown report on stdout (docs/i18n/legal-antes.md)
//   node tools/lint-lang-mix.mjs --json       → machine-readable result
//   --max-words N                             → a block of N words or fewer is tolerated (default below)
//
// Checks the 6 committed files AND the 3 .pt.html variants that `npm run build`
// writes from the EN sources (build-i18n.js renderVariant): the deploy publishes
// the latter, so a PT page that is right in git but rebuilt half in English
// still fails.
//
// Each block of visible text (a paragraph, list item, heading, cell, button,
// label…, plus title / meta description / aria-label / alt / placeholder /
// title attributes) gets a PT and an EN score from function words and common
// UI words. A block whose score points at the other language is reported.
// Text marked lang="…" (other language on purpose), translate="no", <code>,
// <kbd>, <pre>, scripts, styles, templates and SVG are skipped; e-mail
// addresses, URLs and dotted identifiers are dropped before counting.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const LEGAL_PAGES = ['privacy', 'terms', 'contact'];
// Limit set after the «antes» (docs/i18n/legal-antes.md): the smallest offenders
// were 1–2 words (the account chip's aria-label, the search label), and after
// the fix no block is left at all, so the CI tolerates none.
export const DEFAULT_MAX_WORDS = 0;

// Words that settle the language on their own. Shared spellings (a, as, do,
// no, me, use, data, site…) are left out on purpose.
const PT_WORDS = new Set(('de da das dos e o os um uma umas uns em na nas nos por pelo pela pelos pelas para com sem que '
  + 'não ou é são ser está estão será foi seja sejam ao aos à às se sua suas seu seus você vocês nós nosso nossa nossos nossas '
  + 'isso este esta esse essa estes estas esses essas aquele aquela quando também sobre pode podem mais como até já entre cada '
  + 'qualquer quais qual onde porque pois então ainda após depois antes conforme mesmo outro outra outros outras muito '
  + 'início explorar calculadoras tabela periódica entrar sair conta privacidade termos contato gerenciar tema idioma '
  + 'buscar pesquisar fechar compartilhar copiar enviar mensagem nome assunto obrigatório obrigatória preços política '
  + 'fale conosco atualizado atualizada última dados pessoais usuário usuários serviço serviços uso aceitar recusar '
  + 'publicidade medição necessários anúncios voltar resposta respostas dúvidas sugestões erro').split(/\s+/));
const EN_WORDS = new Set(('the and of to is are was were be been being you your yours we our ours us for with without that '
  + 'this these those not or it its may will would should must can could if from an any which who whom whose when what '
  + 'where why how have has had into about than only all such their they them there also by on in at after before '
  + 'home explore calculators periodic table sign account privacy terms contact manage theme language search close '
  + 'share copy send message name subject required pricing policy updated last personal user users service services '
  + 'accept reject advertising measurement necessary ads back reply replies questions suggestions error please get '
  + 'touch').split(/\s+/));

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const BLOCK = new Set(['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'section', 'article', 'aside', 'header', 'footer',
  'nav', 'main', 'ul', 'ol', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'form', 'fieldset',
  'legend', 'label', 'button', 'option', 'select', 'summary', 'details', 'figure', 'figcaption', 'blockquote', 'address', 'title',
  'textarea', 'body', 'head', 'html', 'small']);
const SKIP_TAGS = new Set(['code', 'kbd', 'samp', 'pre', 'var']);
const TEXT_ATTRS = ['title', 'aria-label', 'alt', 'placeholder'];
const META_TEXT = /^(description|og:title|og:description|twitter:title|twitter:description)$/;

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', laquo: '«', raquo: '»', copy: '©', middot: '·', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”' };
function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

function attrsOf(raw) {
  const out = {};
  for (const m of raw.matchAll(/([^\s=/"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return out;
}

export function words(text) {
  const clean = text
    .replace(/\bhttps?:\/\/\S+/gi, ' ')
    .replace(/\S+@\S+\.\S+/g, ' ')
    .replace(/\b[\w-]+(\.[\w-]+)+\b/g, ' '); // domains, file names, ids such as doc.privacy, v1.11
  return clean.toLowerCase().match(/\p{L}+(?:[-'’]\p{L}+)*/gu) || [];
}

export function guessLang(text) {
  const list = words(text);
  let pt = 0;
  let en = 0;
  for (const w of list) {
    if (PT_WORDS.has(w)) pt += 1;
    if (EN_WORDS.has(w)) en += 1;
  }
  const lang = pt > en ? 'pt' : en > pt ? 'en' : null;
  return { lang, pt, en, words: list.length };
}

function lineAt(html, index) {
  let n = 1;
  for (let i = html.indexOf('\n'); i !== -1 && i < index; i = html.indexOf('\n', i + 1)) n += 1;
  return n;
}

// Blank out what never shows as text, keeping offsets (and so line numbers).
function mask(html) {
  const blank = (m) => m.replace(/[^\n]/g, ' ');
  return html
    .replace(/<!--[\s\S]*?-->|<![^>]*>/g, blank)
    .replace(/<(script|style|template|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, blank);
}

export function extractBlocks(html, pageLang) {
  const src = mask(html);
  const blocks = [];
  const stack = []; // { tag, skip }
  let buf = '';
  let bufAt = -1;
  let bufTag = 'body';
  const skipping = () => stack.length > 0 && stack[stack.length - 1].skip;
  const innerBlock = () => {
    for (let i = stack.length - 1; i >= 0; i -= 1) if (BLOCK.has(stack[i].tag)) return stack[i].tag;
    return 'body';
  };
  const flush = () => {
    const text = decode(buf).replace(/\s+/g, ' ').trim();
    if (text) blocks.push({ where: '<' + bufTag + '>', text, line: lineAt(html, bufAt) });
    buf = '';
    bufAt = -1;
  };
  const re = /<(\/?)([a-zA-Z][\w:-]*)\b([^>]*)>|([^<]+)/g;
  let m;
  while ((m = re.exec(src))) {
    if (m[4] != null) {
      if (skipping() || !m[4].trim()) continue;
      if (bufAt === -1) { bufAt = m.index; bufTag = innerBlock(); }
      buf += m[4];
      continue;
    }
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    if (closing) {
      if (BLOCK.has(tag)) flush();
      else if (bufAt !== -1) buf += ' ';
      const at = stack.map((s) => s.tag).lastIndexOf(tag);
      if (at !== -1) stack.length = at;
      continue;
    }
    const attrs = attrsOf(m[3]);
    const parentSkip = skipping();
    const lang = attrs.lang ? attrs.lang.slice(0, 2).toLowerCase() : null;
    const skip = parentSkip || SKIP_TAGS.has(tag) || attrs.translate === 'no' || (lang != null && tag !== 'html' && lang !== pageLang);
    if (BLOCK.has(tag)) flush();
    else if (bufAt !== -1) buf += ' ';
    if (!skip) {
      for (const a of TEXT_ATTRS) {
        if (attrs[a] && attrs[a].trim()) blocks.push({ where: `<${tag} ${a}>`, text: attrs[a].trim(), line: lineAt(html, m.index) });
      }
      if (tag === 'meta' && attrs.content && META_TEXT.test(attrs.name || attrs.property || '')) {
        blocks.push({ where: `<meta ${attrs.name || attrs.property}>`, text: attrs.content, line: lineAt(html, m.index) });
      }
      if (tag === 'input' && /^(submit|button|reset)$/i.test(attrs.type || '') && attrs.value) {
        blocks.push({ where: '<input value>', text: attrs.value, line: lineAt(html, m.index) });
      }
    }
    if (!VOID.has(tag) && !m[3].trim().endsWith('/')) stack.push({ tag, skip });
  }
  flush();
  return blocks;
}

export function pageLangOf(html) {
  const m = /<html\b[^>]*\slang="([^"]+)"/i.exec(html);
  return m ? m[1].slice(0, 2).toLowerCase() : 'en';
}

export function lintHtml(html, { maxWords = DEFAULT_MAX_WORDS } = {}) {
  const lang = pageLangOf(html);
  const blocks = extractBlocks(html, lang).map((b) => ({ ...b, ...guessLang(b.text) }));
  const foreign = blocks.filter((b) => b.lang && b.lang !== lang);
  return { lang, blocks: blocks.length, foreign, offenders: foreign.filter((b) => b.words > maxWords) };
}

// The 6 committed files, then the PT variants the build would write.
export function targets() {
  const require = createRequire(import.meta.url);
  const build = require(path.join(ROOT, 'build-i18n.js'));
  const dict = build.loadDict();
  const out = [];
  for (const page of LEGAL_PAGES) {
    for (const file of [`${page}.html`, `${page}.pt.html`]) out.push({ name: file, html: fs.readFileSync(path.join(ROOT, file), 'utf8') });
  }
  for (const page of LEGAL_PAGES) {
    const html = build.renderVariant(fs.readFileSync(path.join(ROOT, `${page}.html`), 'utf8'), 'pt', dict, `${page}.html`);
    if (html == null) throw new Error(`build-i18n renders no PT variant for ${page}.html`);
    out.push({ name: `${page}.pt.html (build)`, html });
  }
  return out;
}

const excerpt = (s, n = 110) => (s.length > n ? s.slice(0, n - 1) + '…' : s).replace(/\|/g, '\\|');

export function report(results, { maxWords, title = 'Mistura de idiomas — páginas legais' } = {}) {
  const lines = [`# ${title}`, '', `Gerado por \`node tools/lint-lang-mix.mjs --report\`. Bloco = parágrafo, item, título, célula, botão, rótulo ou atributo de texto. «Destoa» = as palavras indicam o outro idioma; o limite do CI é **0 blocos destoantes com mais de ${maxWords} palavras**.`, ''];
  lines.push('| Arquivo | Idioma | Blocos | Destoantes | Acima do limite |', '|---|---|---:|---:|---:|');
  for (const r of results) lines.push(`| \`${r.name}\` | ${r.lang} | ${r.blocks} | ${r.foreign.length} | ${r.offenders.length} |`);
  for (const r of results) {
    if (!r.foreign.length) continue;
    lines.push('', `## \`${r.name}\``, '', '| Linha | Onde | Palavras | PT/EN | Trecho |', '|---:|---|---:|---|---|');
    for (const b of r.foreign) lines.push(`| ${b.line} | \`${b.where}\` | ${b.words} | ${b.pt}/${b.en} | ${excerpt(b.text)} |`);
  }
  return lines.join('\n') + '\n';
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = process.argv.slice(2);
  const at = args.indexOf('--max-words');
  const maxWords = at !== -1 ? Number(args[at + 1]) : DEFAULT_MAX_WORDS;
  const results = targets().map((t) => ({ name: t.name, ...lintHtml(t.html, { maxWords }) }));
  if (args.includes('--json')) console.log(JSON.stringify({ maxWords, results }, null, 2));
  else if (args.includes('--report')) process.stdout.write(report(results, { maxWords }));
  const bad = results.filter((r) => r.offenders.length);
  if (!args.includes('--json') && !args.includes('--report')) {
    for (const r of bad) for (const b of r.offenders) console.error(`${r.name}:${b.line} ${b.where} [${r.lang} page, looks ${b.lang}: ${b.pt} PT / ${b.en} EN words] ${excerpt(b.text, 90)}`);
    console.log(bad.length ? `lint-lang-mix: ${bad.reduce((n, r) => n + r.offenders.length, 0)} block(s) in the wrong language (more than ${maxWords} words)` : `lint-lang-mix: ok (${results.length} pages, ${results.reduce((n, r) => n + r.blocks, 0)} blocks)`);
  }
  if (bad.length && !args.includes('--report')) process.exitCode = 1;
}
