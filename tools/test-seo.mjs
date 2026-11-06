// Every public page passes the SEO audit (tools/audit-seo.mjs): title and
// description length and language, canonical, hreflang, Open Graph, JSON-LD,
// one h1, image alt, sitemap and internal links.
import { audit } from './audit-seo.mjs';

const r = audit();
if (r.findings.length) {
  for (const x of r.findings.slice(0, 40)) console.error(`${x.level} ${x.rule} ${x.file}: ${x.msg}`);
  console.error(`seo: ${r.findings.length} finding(s) — run node tools/audit-seo.mjs`);
  process.exit(1);
}
console.log(`seo: ok (${r.pages} pages, ${r.indexable} indexable)`);
