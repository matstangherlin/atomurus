/* ─────────────────────────────────────────────────────────────
 * Atomurus — Periodic Table · isotopes
 * Isotopes: list, atomic models, hero, insight, applications, decay filter, charts, tooltip.
 * Moved unchanged out of periodic-table.js (prompt 24). Classic script: it
 * shares the global scope with periodic-table.js and must load AFTER it.
 * Loaded by: periodic-table/isotopes(.pt).html
 * ─────────────────────────────────────────────────────────── */

// ─── ISOTOPOS LOGIC ───
let isoInited = false;
let currentIsoZ = 1;          // Tracks which element's isotopes are on screen,
                              // so the language-change re-render can restore it.
function renderIsoElementList() {
  const list = document.getElementById('iso-list');
  if (!list) return;
  const massLabel = _T('ptable.isoItemMass', 'Massa');
  list.innerHTML = ELEMENTS.map(e => `
    <div class="iso-item" data-z="${e.z}" onclick="showIsotopes(${e.z})">
      <div class="iso-item-name">${e.z}. ${elName(e)} (${e.sym})</div>
      <div class="iso-item-mass">${massLabel}: ${e.mass} u</div>
    </div>
  `).join('');
}
function initIsotopes() {
  if (isoInited) return;
  isoInited = true;
  renderIsoElementList();
  // Re-render the element list (name + mass label) whenever the language
  // toggles, so users see the translated names without reloading the page.
  if (window.I18N && typeof I18N.onChange === 'function') {
    I18N.onChange(() => {
      renderIsoElementList();
      // Re-show the currently-selected element so its row gets the active
      // highlight back and the detail pane refreshes with translated labels.
      showIsotopes(currentIsoZ || 1);
    });
  }
  showIsotopes(1); // Hydrogen by default
}

function filterIsoList() {
  const q = document.getElementById('iso-search').value.toLowerCase();
  document.querySelectorAll('.iso-item').forEach(item => {
    if (item.textContent.toLowerCase().includes(q)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });
}

function showIsotopes(z) {
  initIsoTooltips();           // wire the shared isotope tooltip once (idempotent)
  currentIsoZ = z;             // Remember selection for the i18n re-render hook
  document.querySelectorAll('.iso-item').forEach(i => i.classList.remove('active'));
  const activeItem = document.querySelector(`.iso-item[data-z="${z}"]`);
  if (activeItem) activeItem.classList.add('active');

  const el = ELEMENTS.find(e => e.z === z);
  document.getElementById('iso-details-pane').style.display = 'block';
  document.getElementById('iso-z').textContent = el.z;
  document.getElementById('iso-sym').textContent = el.sym;
  document.getElementById('iso-name').textContent = elName(el);

  // Update the Explore link target to the current element's page.
  // The isotopes view always lives inside /periodic-table/, so we link to a
  // sibling latin-named page (e.g. /periodic-table/hydrogenium).
  const exploreLink = document.getElementById('iso-explore-link');
  if (exploreLink) {
    const latin = (typeof ELEMENT_LATIN !== 'undefined' && ELEMENT_LATIN[el.z]) || el.sym.toLowerCase();
    exploreLink.href = latin;
  }

  bohrPaused['bohr-iso'] = true;
  drawBohr(el, 'bohr-iso');

  // i18n labels used when raw values aren't representable as numbers
  const T_traces = _T('ptable.isoTraces',      'Traços');
  const T_stable = _T('ptable.isoStable',      'Estável');
  const T_none   = _T('ptable.isoNone',        'Nenhum');
  const T_pending = _T('ptable.isoPending',    'Dataset em construção — Z não coberto ainda');

  // Pull from curated dataset (see isotopes-data.js).
  // Missing entry → graceful empty state, NO fake fallback (was the audit finding).
  const isosRaw = (typeof ISOTOPES !== 'undefined' && ISOTOPES[z]) || null;
  const tbody = document.getElementById('iso-tbody');

  if (!isosRaw || isosRaw.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="4" style="padding:18px 10px;color:var(--text-3);text-align:center;font-size:12.5px">${T_pending}</td></tr>
    `;
    // Clear abundance chart + model row + decay filter + half-life chart
    const row = document.getElementById('iso-model-row');
    if (row) row.innerHTML = '';
    const filterHost = document.getElementById('iso-decay-filter');
    if (filterHost) filterHost.innerHTML = '';
    drawAbundanceChart(z);
    drawHalfLifeChart(z);
    renderIsotopeInsight(z);   // clears the panel when Z has no dataset entry
    renderIsotopeApplications(z);
    renderIsoHero(z, el, null);   // atomic data only; isotope summary hidden
    return;
  }

  // Pick the default highlighted isotope: most abundant naturally-occurring,
  // falling back to the longest-lived radioisotope if nothing is primordial.
  const primary = isosRaw.find(i => i.ab != null && i.ab > 0.5)
              || isosRaw.find(i => i.ab != null)
              || isosRaw.slice().sort((a, b) => (b.hl || 0) - (a.hl || 0))[0]
              || isosRaw[0];
  // Scientific hero summary (atomic data + isotope counts + most-abundant +
  // relevant chips). Built from the dataset, so it re-runs on element switch.
  renderIsoHero(z, el, isosRaw);
  drawAbundanceChart(z);
  renderIsoModelRow(z, isosRaw, primary);
  // Decay-mode filter chips + half-life log chart (depend on the dataset
  // for this element, so they re-render here).
  renderDecayFilter(isosRaw);

  // Contextual "Isotope Insight" panel — curated narrative when available,
  // deterministic fact-only summary otherwise (see renderIsotopeInsight).
  renderIsotopeInsight(z);
  // Real-world "Applications" section — curated; hidden when no data exists.
  renderIsotopeApplications(z);

  tbody.innerHTML = isosRaw.map(iso => {
    // Display name: "Sym-A" (optionally "Sym-Am" for metastable isomers like Tc-99m)
    //   with optional alias parenthetical ("H-2 (Deutério)")
    const aliasKey = iso.alias && _T('ptable.isoAlias_' + iso.alias.toLowerCase(), iso.alias);
    const baseName = `${el.sym}-${iso.a}${iso.m ? 'm' : ''}`;
    const displayName = aliasKey ? `${baseName} (${aliasKey})` : baseName;

    // Abundance: number → "x.xxx%", null → "traces" label
    let abText, abBarPct;
    if (iso.ab == null) {
      abText = T_traces;
      abBarPct = 0;          // bar invisible for synthetic / cosmogenic-only
    } else {
      abText = (typeof formatAbundance === 'function')
        ? (formatAbundance(iso.ab) || T_traces)
        : (iso.ab * 100).toFixed(3) + '%';
      abBarPct = Math.max(0, Math.min(100, iso.ab * 100));
    }

    // Half-life: hl seconds → formatted; null → stable label
    const halfText = iso.hl == null
      ? (iso.hlf || T_stable)
      : (typeof formatHalfLife === 'function' ? formatHalfLife(iso.hl, T_stable) : iso.hlf);

    // Decay modes: array → joined; empty → "none"
    const decText = (iso.dec && iso.dec.length) ? iso.dec.join(' / ') : T_none;

    const isActive = (iso.a === primary.a && !!iso.m === !!primary.m);
    return `
    <tr class="iso-row${isActive ? ' active' : ''}" data-z="${z}" data-a="${iso.a}" data-m="${iso.m ? '1' : '0'}" tabindex="0" role="button" aria-label="${displayName}"
        style="border-bottom:1px solid var(--border-soft);cursor:pointer;transition:background .12s">
      <td style="padding:12px 10px;font-family:'DM Mono',monospace;color:var(--accent);font-weight:600">${displayName}</td>
      <td style="padding:12px 10px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="flex:1;height:6px;background:var(--border-soft);border-radius:3px;overflow:hidden">
            <div style="width:${abBarPct}%;height:100%;background:var(--accent);border-radius:3px"></div>
          </div>
          <span style="font-size:12px;width:60px;text-align:right">${abText}</span>
        </div>
      </td>
      <td style="padding:12px 10px;font-family:'DM Mono',monospace;font-size:12px">${halfText}</td>
      <td style="padding:12px 10px;font-family:'DM Mono',monospace;font-size:12px">${decText}</td>
    </tr>
  `}).join('');

  // Wire click + keyboard activation on isotope rows so users can swap the
  // nucleus visualization between isotopes of the same element.
  Array.from(tbody.querySelectorAll('tr.iso-row')).forEach(tr => {
    const handler = () => {
      const a = Number(tr.dataset.a);
      const zRow = Number(tr.dataset.z);
      const m = tr.dataset.m === '1';
      tbody.querySelectorAll('tr.iso-row.active').forEach(r => r.classList.remove('active'));
      tr.classList.add('active');
      // Sync atom-card highlight too (the model row mirrors the table)
      const modelRow = document.getElementById('iso-model-row');
      if (modelRow) {
        modelRow.querySelectorAll('.atom-card.active').forEach(c => c.classList.remove('active'));
        const matchingCard = modelRow.querySelector(`.atom-card[data-a="${a}"][data-m="${m ? '1' : '0'}"]`);
        if (matchingCard) matchingCard.classList.add('active');
      }
    };
    tr.addEventListener('click', handler);
    tr.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  });

  // Re-apply the current filter after every isotope surface exists: main rows,
  // atom cards, and the half-life chart.
  applyDecayFilter();
}

// ─── ATOMIC MODEL ROW (per-isotope textbook cards) ───────────────────────────
// Generates one mini card per isotope (canvas + isotope notation + alias).
// Cards are clickable / keyboard-activatable, mirroring the table-row swap
// behaviour so users can pick any isotope from either UI element.
function renderIsoModelRow(z, isos, primary) {
  const row = document.getElementById('iso-model-row');
  if (!row || !isos) return;
  const el = ELEMENTS.find(e => e.z === z);
  if (!el) { row.innerHTML = ''; return; }

  row.innerHTML = isos.map((iso, idx) => {
    const aliasKey = iso.alias && _T('ptable.isoAlias_' + iso.alias.toLowerCase(), iso.alias);
    const isActive = (iso.a === primary.a && !!iso.m === !!primary.m);
    // Build chemistry-style notation: superscript A, subscript Z, then symbol.
    // Metastable isomers get an "m" appended to A (e.g., ⁹⁹ᵐTc).
    const aText = `${iso.a}${iso.m ? 'm' : ''}`;
    return `
      <div class="atom-card${isActive ? ' active' : ''}" data-z="${z}" data-a="${iso.a}" data-m="${iso.m ? '1' : '0'}" data-idx="${idx}"
           tabindex="0" role="button" aria-label="${el.sym}-${aText}${aliasKey ? ' (' + aliasKey + ')' : ''}">
        <canvas width="128" height="128"></canvas>
        <div class="atom-card-notation"><sup>${aText}</sup><sub>${z}</sub>${el.sym}</div>
        <div class="atom-card-alias">${aliasKey || ''}</div>
      </div>
    `;
  }).join('');

  // Render each canvas + wire interaction
  Array.from(row.querySelectorAll('.atom-card')).forEach(card => {
    const a = Number(card.dataset.a);
    const m = card.dataset.m === '1';
    // The canvas inherits no ID, so target it by reference; drawAtomicModel
    // looks up by ID — give each card a unique transient ID.
    const canvas = card.querySelector('canvas');
    const id = `iso-model-${z}-${a}-${m ? 'm' : 'g'}`;
    canvas.id = id;
    drawAtomicModel(z, a, id);

    const handler = () => {
      // Sync visual highlight across cards + table rows
      row.querySelectorAll('.atom-card.active').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const tbody = document.getElementById('iso-tbody');
      if (tbody) {
        tbody.querySelectorAll('tr.iso-row.active').forEach(r => r.classList.remove('active'));
        const matchingRow = tbody.querySelector(`tr.iso-row[data-a="${a}"][data-m="${m ? '1' : '0'}"]`);
        if (matchingRow) matchingRow.classList.add('active');
      }
    };
    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  });
}

// ─── SCIENTIFIC HERO SUMMARY ─────────────────────────────────────────────────
// Renders the per-element hero: core atomic data (number, mass) plus an isotope
// profile (known / stable / radioactive counts, the most-abundant isotope, and
// a compact "most relevant" chip list). Every value comes straight from
// ELEMENTS / ISOTOPES — nothing is invented. Any metric whose data is missing
// is omitted (e.g. synthetic-only elements show no "most abundant"). Labels go
// through _T so EN/PT switch live with the rest of the page.
function isoStatCard(num, label, cls) {
  return `
    <div class="iso-stat ${cls}">
      <div class="iso-stat-num">${num}</div>
      <div class="iso-stat-lbl">${label}</div>
    </div>`;
}

function renderIsoHero(z, el, isos) {
  if (!el) return;

  // Core atomic data — always available from ELEMENTS; an item hides if missing.
  const atomicHost = document.getElementById('iso-hero-atomic');
  if (atomicHost) {
    const items = [];
    if (el.z != null) {
      items.push(`<span class="iso-atomic"><span class="iso-atomic-lbl">${_T('ptable.heroAtomicNumber', 'Atomic number')}</span><span class="iso-atomic-val">${el.z}</span></span>`);
    }
    if (el.mass != null && el.mass !== '') {
      items.push(`<span class="iso-atomic"><span class="iso-atomic-lbl">${_T('ptable.heroAtomicMass', 'Atomic mass')}</span><span class="iso-atomic-val">${el.mass} u</span></span>`);
    }
    atomicHost.innerHTML = items.join('<span class="iso-atomic-sep">·</span>');
  }

  const statsHost    = document.getElementById('iso-hero-stats');
  const relevantHost = document.getElementById('iso-hero-relevant');

  // No dataset for this element → identity + atomic data only.
  if (!isos || !isos.length) {
    if (statsHost)    { statsHost.innerHTML = ''; statsHost.style.display = 'none'; }
    if (relevantHost) relevantHost.innerHTML = '';
    return;
  }

  const stable  = isos.filter(i => i.hl == null);
  const radio   = isos.filter(i => i.hl != null);
  const natural = isos.filter(i => i.ab != null && i.ab > 0);
  const mostAb  = natural.slice().sort((a, b) => b.ab - a.ab)[0] || null;

  // Stat cards: known / stable / radioactive counts (+ most-abundant when it exists).
  if (statsHost) {
    statsHost.style.display = '';
    let html =
      isoStatCard(isos.length,   _T('ptable.heroKnown',       'Known'),       '') +
      isoStatCard(stable.length, _T('ptable.heroStable',      'Stable'),      'iso-stat--stable') +
      isoStatCard(radio.length,  _T('ptable.heroRadioactive', 'Radioactive'), 'iso-stat--radio');

    if (mostAb) {
      const aliasKey = mostAb.alias && _T('ptable.isoAlias_' + mostAb.alias.toLowerCase(), mostAb.alias);
      const name = aliasKey || `${el.sym}-${mostAb.a}`;
      const pct = (typeof formatAbundance === 'function' ? formatAbundance(mostAb.ab) : null) || (mostAb.ab * 100).toFixed(3) + '%';
      html += `
        <div class="iso-stat iso-stat--abundant" data-iso-tip="${el.z}-${mostAb.a}-${mostAb.m ? '1' : '0'}" tabindex="0">
          <div class="iso-stat-lbl">${_T('ptable.heroMostAbundant', 'Most abundant')}</div>
          <div class="iso-stat-abundant-val">${name}<span class="iso-stat-abundant-pct">${pct}</span></div>
        </div>`;
    }
    statsHost.innerHTML = html;
  }

  // Most-relevant chips: naturally-occurring (by abundance) + notable radioisotopes.
  if (relevantHost) {
    const picks = [];
    const seen = new Set();
    const key = i => i.a + (i.m ? 'm' : '');
    const add = i => { if (i && !seen.has(key(i))) { seen.add(key(i)); picks.push(i); } };
    natural.slice().sort((a, b) => b.ab - a.ab).forEach(add);
    radio.filter(i => i.alias).forEach(add);
    radio.slice().sort((a, b) => (b.hl || 0) - (a.hl || 0)).forEach(i => { if (picks.length < 4) add(i); });

    const shown = picks.slice(0, 4);
    if (!shown.length) {
      relevantHost.innerHTML = '';
    } else {
      const chips = shown.map(i => {
        const aliasKey = i.alias && _T('ptable.isoAlias_' + i.alias.toLowerCase(), i.alias);
        const notation = `${el.sym}-${i.a}${i.m ? 'm' : ''}`;
        const label = aliasKey ? `${notation} ${aliasKey}` : notation;
        return `<span class="iso-hero-chip" data-iso-tip="${el.z}-${i.a}-${i.m ? '1' : '0'}" tabindex="0">${label}</span>`;
      }).join('');
      const moreN = isos.length - shown.length;
      const more = moreN > 0 ? `<span class="iso-hero-chip iso-hero-chip--more">+${moreN}</span>` : '';
      relevantHost.innerHTML =
        `<span class="iso-hero-relevant-lbl">${_T('ptable.heroMostRelevant', 'Most relevant')}</span>` +
        `<span class="iso-hero-chips">${chips}${more}</span>`;
    }
  }
}

// ─── ISOTOPE INSIGHT PANEL ───────────────────────────────────────────────────
// Turns the raw isotope table into understandable science. Two content sources,
// in priority order:
//   1. CURATED — hand-written, human-reviewed bilingual explanations from
//      isotope-insights-data.js (window.ISOTOPE_INSIGHTS). Preferred.
//   2. FALLBACK — a deterministic, FACT-ONLY summary built from the dataset
//      (composition = Z protons + (A−Z) neutrons, abundance, half-life, decay).
//      Never invents uses or history; only states numbers already in ISOTOPES.
// No explanatory prose is ever generated at runtime by AI.
//
// Stable / radioactive / rare badges are derived from the real dataset entry
// (single source of truth) so the panel can never contradict the table.

function isoInsightLang() {
  return (window.I18N && I18N.lang === 'pt') ? 'pt' : 'en';
}

// Match a curated/fallback item to its dataset row and classify it.
function isoInsightStatus(z, item) {
  const ds = (typeof ISOTOPES !== 'undefined' && ISOTOPES[z]) || [];
  const match = ds.find(i => i.a === item.a && (!!i.m === !!item.m));
  if (!match) return { primary: null, rare: false };
  const radioactive = match.hl != null;
  // "rare" = naturally occurring but scarce (<1% abundance). Purely synthetic
  // isotopes (ab == null) are already conveyed by the radioactive badge.
  const rare = (match.ab != null && match.ab > 0 && match.ab < 0.01);
  return { primary: radioactive ? 'radioactive' : 'stable', rare };
}

// "11 protons and 12 neutrons." — grammar-safe (singular/plural) in both langs.
function isoCompositionPhrase(p, n, lang) {
  if (lang === 'pt') {
    const pp = p === 1 ? '1 próton'  : p + ' prótons';
    const nn = n === 1 ? '1 nêutron' : n + ' nêutrons';
    return pp + ' e ' + nn + '.';
  }
  const pp = p === 1 ? '1 proton'  : p + ' protons';
  const nn = n === 1 ? '1 neutron' : n + ' neutrons';
  return pp + ' and ' + nn + '.';
}

// One fact-only sentence for an isotope in the fallback path.
function isoFallbackItemText(z, iso, lang, mostAb) {
  const comp = isoCompositionPhrase(z, iso.a - z, lang);
  const pct = (iso.ab != null)
    ? ((typeof formatAbundance === 'function' ? formatAbundance(iso.ab) : null) || (iso.ab * 100).toFixed(3) + '%')
    : null;
  let sig;
  if (iso.hl != null) {
    const hl = (typeof formatHalfLife === 'function') ? formatHalfLife(iso.hl) : (iso.hlf || '');
    const modes = (iso.dec && iso.dec.length) ? iso.dec.join(' / ') : (lang === 'pt' ? 'decaimento' : 'decay');
    sig = (lang === 'pt')
      ? 'Radioativo — meia-vida de ' + hl + ', decaindo por ' + modes + '.'
      : 'Radioactive — half-life ' + hl + ', decaying by ' + modes + '.';
  } else if (iso === mostAb && iso.ab != null && iso.ab >= 0.9999) {
    sig = (lang === 'pt') ? 'Praticamente a única forma natural (cerca de 100%).'
                          : 'Essentially the only natural form (about 100%).';
  } else if (iso === mostAb && pct) {
    sig = (lang === 'pt') ? 'Forma mais comum — cerca de ' + pct + ' de abundância natural.'
                          : 'Most common form — about ' + pct + ' natural abundance.';
  } else if (pct && iso.ab < 0.01) {
    sig = (lang === 'pt') ? 'Estável, porém raro — apenas ' + pct + '.'
                          : 'Stable but rare — only ' + pct + '.';
  } else if (pct) {
    sig = (lang === 'pt') ? 'Isótopo estável, ' + pct + ' de abundância natural.'
                          : 'Stable isotope, ' + pct + ' natural abundance.';
  } else {
    sig = (lang === 'pt') ? 'Isótopo estável.' : 'Stable isotope.';
  }
  return comp + ' ' + sig;
}

// Build a {lead, items} block from dataset facts when no curated entry exists.
function buildFallbackInsight(z) {
  const el = ELEMENTS.find(e => e.z === z);
  const ds = (typeof ISOTOPES !== 'undefined' && ISOTOPES[z]) || [];
  if (!el || !ds.length) return null;
  const lang = isoInsightLang();
  const nStable = ds.filter(i => i.hl == null).length;

  const lead = (lang === 'pt')
    ? (nStable === 0
        ? 'Este elemento não possui isótopos estáveis — todos os listados são radioativos. Destaques:'
        : 'Destaques dos isótopos conhecidos deste elemento:')
    : (nStable === 0
        ? 'This element has no stable isotopes — all listed here are radioactive. Highlights:'
        : 'Highlights of this element’s known isotopes:');

  const natural = ds.filter(i => i.ab != null && i.ab > 0);
  const stable  = ds.filter(i => i.hl == null);
  const radio   = ds.filter(i => i.hl != null);

  const picks = [];
  const seen = new Set();
  const key = i => i.a + (i.m ? 'm' : '');
  const add = i => { if (i && !seen.has(key(i))) { seen.add(key(i)); picks.push(i); } };

  const mostAb = natural.slice().sort((a, b) => b.ab - a.ab)[0] || stable[0];
  add(mostAb);                                            // most abundant
  add(natural.filter(i => i.hl == null && i.ab < 0.01)    // a genuinely rare stable one
            .sort((a, b) => a.ab - b.ab)[0]);
  radio.filter(i => i.alias).forEach(add);                // named radioisotopes first
  radio.slice().sort((a, b) => (b.hl || 0) - (a.hl || 0)) // then longest-lived
       .forEach(i => { if (picks.length < 4) add(i); });

  const chosen = picks.slice(0, 4)
    .sort((a, b) => (a.a - b.a) || ((a.m ? 1 : 0) - (b.m ? 1 : 0)));

  return {
    lead,
    items: chosen.map(i => ({ a: i.a, m: !!i.m, text: isoFallbackItemText(z, i, lang, mostAb) }))
  };
}

function renderIsotopeInsight(z) {
  const host = document.getElementById('iso-insight');
  if (!host) return;
  const el = ELEMENTS.find(e => e.z === z);
  const lang = isoInsightLang();

  // Prefer curated content (current language, falling back to EN), then the
  // deterministic dataset summary.
  let data = null;
  const block = (typeof ISOTOPE_INSIGHTS !== 'undefined' && ISOTOPE_INSIGHTS[z]) || null;
  if (block) data = block[lang] || block.en;
  if (!data) data = buildFallbackInsight(z);

  if (!el || !data || !data.items || !data.items.length) {
    host.innerHTML = '';
    host.style.display = 'none';
    return;
  }
  host.style.display = '';

  const title   = _T('ptable.isoInsightTitle', 'Understanding these isotopes');
  const level   = _T('ptable.isoInsightLevel', 'High-school · intro chemistry');
  const L_stable = _T('ptable.isoBadgeStable',      'Stable');
  const L_radio  = _T('ptable.isoBadgeRadioactive', 'Radioactive');
  const L_rare   = _T('ptable.isoBadgeRare',        'Rare');

  const itemsHtml = data.items.map(item => {
    const st = isoInsightStatus(z, item);
    const badges = [];
    if (st.primary === 'stable')      badges.push(`<span class="iso-badge iso-badge--stable">${L_stable}</span>`);
    if (st.primary === 'radioactive') badges.push(`<span class="iso-badge iso-badge--radioactive">${L_radio}</span>`);
    if (st.rare)                      badges.push(`<span class="iso-badge iso-badge--rare">${L_rare}</span>`);
    const aText = `${item.a}${item.m ? 'm' : ''}`;
    const nameHtml = item.name ? `<span class="iso-insight-name">${item.name}</span>` : '';
    const tipAttrs = st.primary ? ` data-iso-tip="${z}-${item.a}-${item.m ? '1' : '0'}" tabindex="0"` : '';
    return `
      <li class="iso-insight-item"${tipAttrs}>
        <div class="iso-insight-item-head">
          <span class="iso-insight-notation"><sup>${aText}</sup><sub>${z}</sub>${el.sym}</span>
          ${nameHtml}
          <span class="iso-badges">${badges.join('')}</span>
        </div>
        <p class="iso-insight-text">${item.text}</p>
      </li>`;
  }).join('');

  host.innerHTML = `
    <div class="iso-insight-head">
      <h3 class="iso-insight-title">${title}</h3>
      <span class="iso-insight-level">${level}</span>
    </div>
    <p class="iso-insight-lead">${data.lead}</p>
    <ul class="iso-insight-items">${itemsHtml}</ul>
  `;
}

// ─── ISOTOPE APPLICATIONS PANEL ──────────────────────────────────────────────
// Real-world uses of specific isotopes, grouped into sector categories with
// colour-coded visual tags. Content is fully curated (isotope-applications-
// data.js, window.ISOTOPE_APPLICATIONS); never generated at runtime. The whole
// section is hidden for any element without a curated entry (display only when
// information exists).
const ISO_APP_CATS = ['industrial', 'medical', 'scientific', 'energy', 'nuclear'];

function isoAppCatLabel(cat) {
  switch (cat) {
    case 'industrial': return _T('ptable.appCatIndustrial', 'Industrial');
    case 'medical':    return _T('ptable.appCatMedical',    'Medicine');
    case 'scientific': return _T('ptable.appCatScientific', 'Research');
    case 'energy':     return _T('ptable.appCatEnergy',     'Energy');
    case 'nuclear':    return _T('ptable.appCatNuclear',    'Nuclear');
    default:           return cat;
  }
}

function renderIsotopeApplications(z) {
  const host = document.getElementById('iso-applications');
  if (!host) return;
  const el = ELEMENTS.find(e => e.z === z);
  const data = (typeof ISOTOPE_APPLICATIONS !== 'undefined' && ISOTOPE_APPLICATIONS[z]) || null;

  if (!el || !data || !data.length) {        // no curated uses → hide entirely
    host.innerHTML = '';
    host.style.display = 'none';
    return;
  }
  const lang = isoInsightLang();
  const ds = (typeof ISOTOPES !== 'undefined' && ISOTOPES[z]) || [];

  const blocks = data.map(entry => {
    const apps = (entry.apps || []).filter(ap => ap && (ap[lang] || ap.en));
    if (!apps.length) return '';
    // Alias (Protium…) pulled from the dataset so it matches the table.
    const dsRow = ds.find(i => i.a === entry.a && (!!i.m === !!entry.m));
    const aliasKey = dsRow && dsRow.alias && _T('ptable.isoAlias_' + dsRow.alias.toLowerCase(), dsRow.alias);
    const aText = `${entry.a}${entry.m ? 'm' : ''}`;
    const nameHtml = aliasKey ? `<span class="iso-insight-name">${aliasKey}</span>` : '';
    const tipAttrs = dsRow ? ` data-iso-tip="${z}-${entry.a}-${entry.m ? '1' : '0'}" tabindex="0"` : '';

    const items = apps.map(ap => {
      const cat = ISO_APP_CATS.indexOf(ap.cat) >= 0 ? ap.cat : 'scientific';
      const label = ap[lang] || ap.en;
      return `<li class="iso-apps-item">
                <span class="app-tag app-tag--${cat}">${isoAppCatLabel(cat)}</span>
                <span class="iso-apps-label">${label}</span>
              </li>`;
    }).join('');

    return `
      <li class="iso-apps-iso"${tipAttrs}>
        <div class="iso-apps-iso-head">
          <span class="iso-insight-notation"><sup>${aText}</sup><sub>${z}</sub>${el.sym}</span>
          ${nameHtml}
        </div>
        <ul class="iso-apps-items">${items}</ul>
      </li>`;
  }).filter(Boolean).join('');

  if (!blocks) {
    host.innerHTML = '';
    host.style.display = 'none';
    return;
  }
  host.style.display = '';
  const title = _T('ptable.isoAppsTitle', 'Applications');
  host.innerHTML = `
    <div class="iso-apps-head"><h3 class="iso-apps-title">${title}</h3></div>
    <ul class="iso-apps-list">${blocks}</ul>
  `;
}

// ─── DECAY-MODE COLOR PALETTE ────────────────────────────────────────────────
// Shared by the half-life chart bars and (visually-consistent) decay filter
// chips. Light-mode tones first; dark-mode variants follow when applicable.
const DECAY_COLOR_MAP = {
  'α':       { light: '#ec4899', dark: '#f472b6' },
  'β-':      { light: '#f97316', dark: '#fb923c' },
  'β+':      { light: '#3b82f6', dark: '#60a5fa' },
  'EC':      { light: '#8b5cf6', dark: '#a78bfa' },
  'IT':      { light: '#06b6d4', dark: '#22d3ee' },
  'γ':       { light: '#facc15', dark: '#fde047' },
  'SF':      { light: '#dc2626', dark: '#f87171' },
  '2β-':     { light: '#a16207', dark: '#d97706' },
  '2EC':     { light: '#5b21b6', dark: '#7c3aed' }
};
function decayColor(mode, isDark) {
  const c = DECAY_COLOR_MAP[mode];
  if (!c) return isDark ? '#9ca3af' : '#6b7280'; // unknown mode → gray
  return isDark ? c.dark : c.light;
}

// ─── DECAY-MODE FILTER CHIPS + STATE ─────────────────────────────────────────
// Single source of truth for which decay modes are visible. 'all' shows
// everything; 'stable' shows only stable isotopes; any other string is a
// specific decay mode (e.g. 'α', 'β-').
let currentDecayFilter = 'all';

function renderDecayFilter(isos) {
  const host = document.getElementById('iso-decay-filter');
  if (!host) return;

  // Count isotopes per decay mode + "stable" + "all"
  const counts = { all: isos.length, stable: 0 };
  isos.forEach(iso => {
    if (iso.hl == null) {
      counts.stable += 1;
    } else if (iso.dec && iso.dec.length) {
      iso.dec.forEach(m => { counts[m] = (counts[m] || 0) + 1; });
    }
  });

  // If the previously-selected filter no longer applies (e.g. user switched
  // elements), reset to 'all'.
  if (currentDecayFilter !== 'all' && !counts[currentDecayFilter]) {
    currentDecayFilter = 'all';
  }

  // Build chip list: All → Stable (if any) → each decay mode (sorted by count desc)
  const decayModes = Object.keys(counts).filter(k => k !== 'all' && k !== 'stable');
  decayModes.sort((a, b) => counts[b] - counts[a]);
  const chips = [
    { id: 'all',    label: _T('ptable.isoFilterAll',    'all')    },
    ...(counts.stable ? [{ id: 'stable', label: _T('ptable.isoFilterStable', 'stable') }] : []),
    ...decayModes.map(m => ({ id: m, label: m }))
  ];

  host.innerHTML = chips.map(c => `
    <button type="button" class="iso-decay-chip${c.id === currentDecayFilter ? ' active' : ''}" data-mode="${c.id}">
      <span>${c.label}</span>
      <span class="iso-decay-chip-count">${counts[c.id] || 0}</span>
    </button>
  `).join('');

  host.querySelectorAll('.iso-decay-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      currentDecayFilter = chip.dataset.mode;
      host.querySelectorAll('.iso-decay-chip.active').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      applyDecayFilter();
    });
  });
}

// Whether an isotope passes the active decay-mode filter chip. 'all' → every
// isotope; 'stable' → only stable ones (no half-life); any other value is a
// decay mode the isotope must list. Shared by the table rows and atom cards.
function isotopeMatchesDecayFilter(iso) {
  if (!iso) return false;
  if (currentDecayFilter === 'all') return true;
  if (currentDecayFilter === 'stable') return iso.hl == null;
  return !!(iso.dec && iso.dec.indexOf(currentDecayFilter) !== -1);
}

// Applies currentDecayFilter to table rows, atom cards, and the half-life
// chart. Abundance chart stays unfiltered (it inherently filters out radio-
// active isotopes already, since ab=null on most of them).
function applyDecayFilter() {
  // Filter table rows
  document.querySelectorAll('#iso-tbody tr.iso-row').forEach(tr => {
    const a = Number(tr.dataset.a);
    const m = tr.dataset.m === '1';
    const z = Number(tr.dataset.z);
    const iso = (ISOTOPES[z] || []).find(i => i.a === a && !!i.m === m);
    tr.classList.toggle('filtered-out', !(iso && isotopeMatchesDecayFilter(iso)));
  });
  // Filter atom-cards
  document.querySelectorAll('#iso-model-row .atom-card').forEach(card => {
    const a = Number(card.dataset.a);
    const m = card.dataset.m === '1';
    const z = Number(card.dataset.z);
    const iso = (ISOTOPES[z] || []).find(i => i.a === a && !!i.m === m);
    card.classList.toggle('filtered-out', !(iso && isotopeMatchesDecayFilter(iso)));
  });
  // Redraw half-life chart with filtered subset
  if (typeof currentIsoZ === 'number') drawHalfLifeChart(currentIsoZ);
}

// ─── HALF-LIFE LOG CHART (Chart.js) ──────────────────────────────────────────
// Bar chart on a logarithmic Y axis spanning microseconds → gigayears. Stable
// isotopes are omitted (no half-life to plot). Bar color encodes primary decay
// mode so the chart and the filter chips visually align.
let isoHalfLifeChart = null;
async function drawHalfLifeChart(z) {
  const canvas = document.getElementById('iso-halflife-chart');
  const emptyMsg = document.getElementById('iso-halflife-empty');
  if (!canvas) return;
  await ensureChartJs();
  if (typeof Chart === 'undefined') return;

  const isos = (typeof ISOTOPES !== 'undefined' && ISOTOPES[z]) || [];
  // Only radioactive isotopes; honour current decay-mode filter (except
  // 'stable' which would yield nothing on a half-life chart).
  const filterMatch = (iso) => {
    if (currentDecayFilter === 'all') return true;
    if (currentDecayFilter === 'stable') return false;
    return iso.dec && iso.dec.indexOf(currentDecayFilter) !== -1;
  };
  const radio = isos.filter(i => i.hl != null && i.hl > 0 && filterMatch(i));

  if (isoHalfLifeChart) { isoHalfLifeChart.destroy(); isoHalfLifeChart = null; }

  if (radio.length === 0) {
    canvas.style.display = 'none';
    if (emptyMsg) emptyMsg.hidden = false;
    return;
  }
  canvas.style.display = 'block';
  if (emptyMsg) emptyMsg.hidden = true;

  const sorted = radio.slice().sort((p, q) => p.a - q.a);
  const el = ELEMENTS.find(e => e.z === z);
  const sym = el ? el.sym : 'X';

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor   = isDark ? '#2E2C29' : '#e6e0d6';
  const textColor   = isDark ? '#928C84' : '#5A5550';
  const tooltipBg   = isDark ? 'rgba(20,20,18,.95)' : 'rgba(255,254,252,.97)';
  const tooltipText = isDark ? '#F2EFE9' : '#12100E';

  const labels = sorted.map(i => `${sym}-${i.a}${i.m ? 'm' : ''}`);
  const values = sorted.map(i => i.hl);
  const colors = sorted.map(i => decayColor((i.dec && i.dec[0]) || '', isDark));

  isoHalfLifeChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: _T('ptable.isoHalfLifeYAxis', 'Half-life (s, log)'),
        data: values,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 3,
        maxBarThickness: 42
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false, external: ctx => isoChartTooltipExternal(ctx, sorted, el) }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: 'DM Mono, monospace', size: 10.5 } }
        },
        y: {
          type: 'logarithmic',
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: 'DM Mono, monospace', size: 10 },
            callback: function (v) {
              // Render log ticks as compact powers of ten with a unit hint
              // when one is unambiguous (microseconds → gigayears).
              if (v <= 0) return '';
              const log = Math.log10(v);
              if (Math.abs(log - Math.round(log)) > 0.01) return '';
              return formatHalfLife(v, '');
            }
          }
        }
      }
    }
  });
}

// ─── ABUNDANCE BAR CHART (Chart.js) ──────────────────────────────────────────
// Renders abundances of all naturally-occurring (ab != null) isotopes of an
// element as a bar chart. Synthetic-only elements (Tc, Pm, transuranics) show
// the empty-state message instead.
let isoAbundanceChart = null;
async function drawAbundanceChart(z) {
  const canvas = document.getElementById('iso-abundance-chart');
  const emptyMsg = document.getElementById('iso-abundance-empty');
  if (!canvas) return;
  await ensureChartJs();
  if (typeof Chart === 'undefined') return;

  const isos = (typeof ISOTOPES !== 'undefined' && ISOTOPES[z]) || [];
  const natural = isos.filter(i => i.ab != null && i.ab > 0);

  if (isoAbundanceChart) { isoAbundanceChart.destroy(); isoAbundanceChart = null; }

  if (natural.length === 0) {
    canvas.style.display = 'none';
    if (emptyMsg) emptyMsg.hidden = false;
    return;
  }
  canvas.style.display = 'block';
  if (emptyMsg) emptyMsg.hidden = true;

  // Sort by mass number for a left-to-right chronological reading
  const sorted = natural.slice().sort((p, q) => p.a - q.a);
  const el = ELEMENTS.find(e => e.z === z);
  const sym = el ? el.sym : 'X';

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const stableColor    = isDark ? '#34A872' : '#1E6A50';
  const radioColor     = isDark ? '#F59E0B' : '#D97706';
  const gridColor      = isDark ? '#2E2C29' : '#e6e0d6';
  const textColor      = isDark ? '#928C84' : '#5A5550';
  const tooltipBg      = isDark ? 'rgba(20,20,18,.95)' : 'rgba(255,254,252,.97)';
  const tooltipText    = isDark ? '#F2EFE9' : '#12100E';

  const labels = sorted.map(i => `${sym}-${i.a}${i.m ? 'm' : ''}`);
  const values = sorted.map(i => +(i.ab * 100).toFixed(5));
  const colors = sorted.map(i => i.hl == null ? stableColor : radioColor);

  isoAbundanceChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: _T('ptable.isoAbundanceTooltip', 'Abundance'),
        data: values,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 3,
        maxBarThickness: 42
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      // Chart.js animation occasionally never completes in some embed contexts
      // (the animation rAF can be starved when the page is also driving Bohr's
      // rAF loop). Disable animation; the chart paints synchronously on init.
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false, external: ctx => isoChartTooltipExternal(ctx, sorted, el) }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: 'DM Mono, monospace', size: 10.5 } }
        },
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: 'DM Mono, monospace', size: 10 },
            callback: v => v + '%'
          }
        }
      }
    }
  });
}


// ─── ISOTOPE TOOLTIP — shared premium scientific card ─────────────────────────
// One reused floating node powers every isotope surface: table rows, model
// cards, the abundance + half-life charts, and any future element carrying the
// data hooks (.iso-row / .atom-card with data-z/a/m, or a generic
// [data-iso-tip="z-a-m"]). Content is built on demand from ELEMENTS + ISOTOPES
// only — every field is real or omitted, nothing invented. Desktop hover,
// keyboard focus and mobile tap; a fade with no flicker (single node, rebuilt
// only when the isotope changes, pointer-events:none so it never steals input).
function isoTipText(en, pt) { return trendLang() === 'pt' ? pt : en; }

function isoTipFind(z, a, m) {
  const list = (typeof ISOTOPES !== 'undefined' && ISOTOPES[z]) || null;
  return list ? (list.find(i => i.a === a && !!i.m === !!m) || null) : null;
}

// Resolve { el, iso, key } from a DOM trigger.
function isoTipResolve(node) {
  if (!node || !node.dataset) return null;
  let z, a, m;
  if (node.dataset.z != null && node.dataset.a != null) {
    z = +node.dataset.z; a = +node.dataset.a; m = node.dataset.m === '1';
  } else if (node.dataset.isoTip) {
    const p = String(node.dataset.isoTip).split('-');
    z = +p[0]; a = +p[1]; m = p[2] === '1' || p[2] === 'm';
  } else return null;
  const el = ELEMENTS.find(e => e.z === z), iso = isoTipFind(z, a, m);
  return (el && iso) ? { el, iso, key: z + '-' + a + '-' + (m ? 'm' : 'g') } : null;
}

const ISO_DECAY_PRETTY = { 'β-': 'β−', 'β+': 'β+', 'β−': 'β−', '2β-': '2β−' };
function isoTipDecay(dec, noneLabel) {
  if (!Array.isArray(dec)) return null;
  if (!dec.length) return noneLabel;
  return dec.map(d => ISO_DECAY_PRETTY[d] || d).join(' · ');
}

function isoTipHas(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function isoTipAbundance(iso) {
  if (!isoTipHas(iso, 'ab')) return null;
  if (iso.ab == null) return isoTipText('Trace', 'Traços');
  const f = (typeof formatAbundance === 'function') ? formatAbundance(iso.ab) : (iso.ab * 100).toFixed(3) + '%';
  return (!f || f === 'trace') ? isoTipText('Trace', 'Traços') : f;
}

function isoTipHalfLife(iso, stableLabel) {
  if (!isoTipHas(iso, 'hl') && !isoTipHas(iso, 'hlf')) return null;
  if (iso.hl == null) return iso.hlf && iso.hlf !== 'stable' ? iso.hlf : stableLabel;
  return (typeof formatHalfLife === 'function') ? formatHalfLife(iso.hl, iso.hlf || '') : (iso.hlf || null);
}

function isoTipCompositionRows(el, iso, labels) {
  const rows = [];
  const z = Number(el.z), a = Number(iso.a);
  if (Number.isFinite(z)) rows.push([labels.protons, z]);
  if (Number.isFinite(a) && Number.isFinite(z) && a >= z) rows.push([labels.neutrons, a - z]);
  if (Number.isFinite(z)) rows.push([labels.electrons, z]);
  return rows;
}

// Builds the card markup for one isotope. Only fields backed by the dataset or
// derived directly from Z/A render; missing source keys stay hidden.
function buildIsotopeCard(el, iso) {
  const esc = trendEscapeHtml;
  const aTxt = iso.a + (iso.m ? 'm' : '');
  const alias = iso.alias ? _T('ptable.isoAlias_' + iso.alias.toLowerCase(), iso.alias) : '';
  const stable = (iso.hl == null);

  const L = {
    comp: isoTipText('Composition', 'Composição'),
    protons: isoTipText('Protons', 'Prótons'),
    neutrons: isoTipText('Neutrons', 'Nêutrons'),
    electrons: isoTipText('Electrons', 'Elétrons'),
    ab: isoTipText('Natural Abundance', 'Abundância Natural'), hl: isoTipText('Half-Life', 'Meia-Vida'),
    dec: isoTipText('Decay', 'Decaimento'), stab: isoTipText('Stability', 'Estabilidade'),
    none: isoTipText('None', 'Nenhum'),
    stable: isoTipText('Stable', 'Estável'),
    radioactive: isoTipText('Radioactive', 'Radioativo')
  };
  const row = (k, v) => `<div class="iso-tip-row"><span class="iso-tip-k">${esc(k)}</span><span class="iso-tip-v">${esc(v)}</span></div>`;
  const compRows = isoTipCompositionRows(el, iso, L).map(([k, v]) => row(k, v)).join('');
  const abVal = isoTipAbundance(iso);
  const halfVal = isoTipHalfLife(iso, L.stable);
  const decVal = isoTipDecay(iso.dec, L.none);
  const stabVal = stable ? L.stable : L.radioactive;

  let dataRows = '';
  if (abVal) dataRows += row(L.ab, abVal);
  if (halfVal) dataRows += row(L.hl, halfVal);
  if (decVal) dataRows += row(L.dec, decVal);
  dataRows += `<div class="iso-tip-row"><span class="iso-tip-k">${esc(L.stab)}</span>` +
              `<span class="iso-tip-badge ${stable ? 'is-stable' : 'is-radio'}">${esc(stabVal)}</span></div>`;

  return `<div class="iso-tip-title-row">` +
           `<div><div class="iso-tip-title">${esc(elName(el))}-${esc(aTxt)}</div>` +
           (alias ? `<div class="iso-tip-alias">${esc(alias)}</div>` : '') +
           `</div><div class="iso-tip-notation">${esc(el.sym)}-${esc(aTxt)}</div>` +
         `</div>` +
         (compRows ? `<div class="iso-tip-sep"></div><div class="iso-tip-section"><div class="iso-tip-comp-k">${esc(L.comp)}</div><div class="iso-tip-rows iso-tip-comp-rows">${compRows}</div></div>` : '') +
         (dataRows ? `<div class="iso-tip-sep"></div><div class="iso-tip-rows">${dataRows}</div>` : '');
}

let isoTipNode = null, isoTipKey = null, isoTipWired = false;
function isoTipGetNode() {
  if (isoTipNode && document.body.contains(isoTipNode)) return isoTipNode;
  isoTipNode = document.createElement('div');
  isoTipNode.id = 'iso-tip';
  isoTipNode.setAttribute('role', 'tooltip');
  isoTipNode.setAttribute('aria-hidden', 'true');
  document.body.appendChild(isoTipNode);
  return isoTipNode;
}
// Fixed-positioned (so no scroll-container clipping); placed below the anchor,
// flipping above when there's no room, centred and clamped to the viewport.
function positionIsoTip(rect) {
  const tip = isoTipGetNode();
  const vw = window.innerWidth, vh = window.innerHeight, m = 8, gap = 8;
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  let top = rect.bottom + gap;
  if (top + th > vh - m) { const above = rect.top - gap - th; top = above >= m ? above : Math.max(m, vh - th - m); }
  let left = rect.left + rect.width / 2 - tw / 2;
  left = Math.max(m, Math.min(left, vw - tw - m));
  tip.style.left = Math.round(left) + 'px';
  tip.style.top  = Math.round(top) + 'px';
}
function showIsoTipFor(node) {
  const r = isoTipResolve(node);
  if (!r) return;
  const tip = isoTipGetNode();
  if (isoTipKey !== r.key) { tip.innerHTML = buildIsotopeCard(r.el, r.iso); isoTipKey = r.key; }
  if (node.setAttribute) node.setAttribute('aria-describedby', 'iso-tip');
  positionIsoTip(node.getBoundingClientRect());
  tip.setAttribute('aria-hidden', 'false');
  tip.classList.add('visible');
}
function showIsoTipAtRect(el, iso, rect) {
  if (!el || !iso) return;
  const tip = isoTipGetNode();
  const key = el.z + '-' + iso.a + '-' + (iso.m ? 'm' : 'g');
  if (isoTipKey !== key) { tip.innerHTML = buildIsotopeCard(el, iso); isoTipKey = key; }
  positionIsoTip(rect);
  tip.setAttribute('aria-hidden', 'false');
  tip.classList.add('visible');
}
function hideIsoTip() {
  if (!isoTipNode) return;
  isoTipNode.classList.remove('visible');
  isoTipNode.setAttribute('aria-hidden', 'true');
}

// Chart.js external tooltip → the shared card (used by the abundance + half-life
// charts). isos is the per-chart sorted isotope array; dataIndex maps into it.
function isoChartTooltipExternal(context, isos, el) {
  const tooltip = context.tooltip;
  if (!tooltip || tooltip.opacity === 0 || !tooltip.dataPoints || !tooltip.dataPoints.length) { hideIsoTip(); return; }
  const iso = isos[tooltip.dataPoints[0].dataIndex];
  if (!iso || !el) { hideIsoTip(); return; }
  const r = context.chart.canvas.getBoundingClientRect();
  const x = r.left + tooltip.caretX, y = r.top + tooltip.caretY;
  showIsoTipAtRect(el, iso, { left: x, right: x, top: y - 8, bottom: y + 8, width: 0, height: 16 });
}

// Wire the delegated hover / focus / tap handlers once. Document-level
// delegation = O(1) listeners regardless of how many isotopes are on screen.
function initIsoTooltips() {
  if (isoTipWired) return;
  isoTipWired = true;
  const TRIG = '.iso-row[data-a], .atom-card[data-a], [data-iso-tip]';
  const closestTrig = n => (n && n.closest) ? n.closest(TRIG) : null;

  document.addEventListener('pointerover', e => {
    if (e.pointerType === 'touch') return;          // touch handled on tap
    const t = closestTrig(e.target);
    if (t) showIsoTipFor(t);
  });
  document.addEventListener('pointerout', e => {
    if (e.pointerType === 'touch') return;
    const t = closestTrig(e.target);
    if (!t) return;
    const rel = e.relatedTarget;
    if (rel && (closestTrig(rel) || (isoTipNode && isoTipNode.contains(rel)))) return;  // moving to another trigger → let pointerover swap (no flicker)
    hideIsoTip();
  });
  document.addEventListener('focusin', e => { const t = closestTrig(e.target); if (t) showIsoTipFor(t); });
  document.addEventListener('focusout', e => { if (closestTrig(e.target)) hideIsoTip(); });
  document.addEventListener('click', e => {
    const t = closestTrig(e.target);
    if (t) showIsoTipFor(t);                          // tap shows; the element's own click still selects
    else if (isoTipNode && isoTipNode.classList.contains('visible')) hideIsoTip();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hideIsoTip(); });
  window.addEventListener('scroll', hideIsoTip, true);
  window.addEventListener('resize', hideIsoTip);
}

