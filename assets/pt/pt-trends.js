/* ─────────────────────────────────────────────────────────────
 * Atomurus — Periodic Table · trends
 * Periodic trends: chart, insight engine, tooltip, selectors, navigator, PNG export.
 * Moved unchanged out of periodic-table.js (prompt 24). Classic script: it
 * shares the global scope with periodic-table.js and must load AFTER it.
 * Loaded by: periodic-table/trends(.pt).html
 * ─────────────────────────────────────────────────────────── */

// ─── TENDÊNCIAS LOGIC ──────────────────────────────────────────────────────
let trendChart = null;
let trendNavChart = null;     // bottom overview / minimap chart
let trendNavWired = false;    // pointer handlers attached only once
let trendNavRAF = null;       // shared rAF id for momentum / eased transitions
let trendAutoY = true;        // auto-scale the Y axis to the visible X slice
const TREND_X_MIN_RANGE = 2;
const TREND_STATE_KEY = 'atomurus-trends-state-v2';
let trendRestoreState = null;
let trendRestoreApplied = false;
let trendStatsRAF = null;


function trendMissingLabel() {
  return trendLang() === 'pt' ? 'Indisponivel' : 'Not available';
}

function readTrendStoredState() {
  try {
    const raw = sessionStorage.getItem(TREND_STATE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    if (!state || Date.now() - (state.ts || 0) > 24 * 60 * 60 * 1000) return null;
    return state;
  } catch (_) { return null; }
}

function applyTrendStoredControlsOnce() {
  if (trendRestoreApplied) return;
  trendRestoreApplied = true;
  trendRestoreState = readTrendStoredState();
  if (!trendRestoreState) return;
  const propEl = document.getElementById('trend-prop');
  const filterEl = document.getElementById('trend-group');
  if (propEl && trendRestoreState.prop && Array.from(propEl.options).some(o => o.value === trendRestoreState.prop)) {
    propEl.value = trendRestoreState.prop;
  }
  if (trendRestoreState.filter === 'fam-nonmetal') trendRestoreState.filter = 'fam-reactive-nonmetal';
  if (filterEl && trendRestoreState.filter && Array.from(filterEl.options).some(o => o.value === trendRestoreState.filter)) {
    filterEl.value = trendRestoreState.filter;
  }
}

function saveTrendState(reason) {
  if (!trendChart || !trendChart.scales || !trendChart.scales.x) return;
  try {
    const y = trendChart.scales.y || {};
    const x = trendChart.scales.x || {};
    sessionStorage.setItem(TREND_STATE_KEY, JSON.stringify({
      prop: document.getElementById('trend-prop')?.value || trendChart.$trendProp || 'en',
      filter: document.getElementById('trend-group')?.value || trendChart.$trendFilter || 'all',
      xMin: x.min,
      xMax: x.max,
      yMin: y.min,
      yMax: y.max,
      autoY: trendAutoY,
      reason: reason || 'update',
      ts: Date.now()
    }));
  } catch (_) {}
}

function restoreTrendViewportIfNeeded(prop, filter) {
  if (!trendChart || !trendRestoreState) return false;
  const state = trendRestoreState;
  trendRestoreState = null;
  if (state.prop !== prop || state.filter !== filter) return false;
  trendAutoY = state.autoY !== false;
  if (Number.isFinite(state.xMin) && Number.isFinite(state.xMax)) {
    setTrendXRange(state.xMin, state.xMax, { skipSave: true });
  } else {
    fitTrendXToData('none');
  }
  if (!trendAutoY && Number.isFinite(state.yMin) && Number.isFinite(state.yMax)) {
    trendChart.options.scales.y.min = state.yMin;
    trendChart.options.scales.y.max = state.yMax;
    trendChart.update('none');
  } else {
    applyAutoY();
  }
  updateAutoBtn();
  updateNavWindow();
  return true;
}

function trendElementUrl(el) {
  const latin = (typeof ELEMENT_LATIN !== 'undefined' && ELEMENT_LATIN[el.z]) || el.sym.toLowerCase();
  const inPtFolder = /\/periodic-table\/[^/]*(\.html)?$/i.test(location.pathname);
  const needsHtml = location.protocol === 'file:' || /\.html(\?|$)/i.test(location.pathname + location.search);
  return (inPtFolder ? '' : 'periodic-table/') + latin + (needsHtml ? '.html' : '');
}

function trackTrendElementClick(el, prop) {
  const payload = {
    action: 'trend_chart_element_click',
    element: elName(el),
    property: trendPropLabel(prop)
  };
  try {
    if (typeof gtag === 'function') {
      gtag('event', payload.action, {
        event_category: 'Periodic Trends',
        element: payload.element,
        property: payload.property
      });
    }
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: payload.action, ...payload });
    if (typeof window.plausible === 'function') window.plausible(payload.action, { props: { element: payload.element, property: payload.property } });
    window.dispatchEvent(new CustomEvent('atomurus:analytics', { detail: payload }));
  } catch (_) {}
}

function trendPointPixel(chart, index) {
  if (!chart || !chart.scales || !chart.scales.x) return null;
  const x = chart.scales.x.getPixelForValue(index);
  const real = chart.data.datasets[0]?.data?.[index];
  if (real != null && Number.isFinite(real) && chart.scales.y) {
    return { x, y: chart.scales.y.getPixelForValue(real), real: true };
  }
  const bridge = chart.$trendBridge && chart.$trendBridge[index];
  if (bridge != null && Number.isFinite(bridge) && chart.scales.y) {
    return { x, y: chart.scales.y.getPixelForValue(bridge), real: false };
  }
  const a = chart.chartArea;
  return a ? { x, y: (a.top + a.bottom) / 2, real: false } : null;
}

function trendHitFromEvent(chart, evt, maxDistance) {
  if (!chart || !chart.$trendElements || !chart.scales || !chart.scales.x) return null;
  const native = evt && evt.native ? evt.native : evt;
  const x = Number.isFinite(evt?.x) ? evt.x : native?.offsetX;
  const y = Number.isFinite(evt?.y) ? evt.y : native?.offsetY;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const a = chart.chartArea;
  if (!a || x < a.left || x > a.right || y < a.top || y > a.bottom) return null;
  const index = Math.round(chart.scales.x.getValueForPixel(x));
  if (index < 0 || index >= chart.$trendElements.length) return null;
  const point = trendPointPixel(chart, index);
  if (!point) return null;
  const dist = Math.hypot(point.x - x, point.y - y);
  const dense = chart.$trendElements.length > 40;
  const threshold = maxDistance || (dense ? 15 : 20);
  return dist <= threshold ? { index, el: chart.$trendElements[index], point } : null;
}

function navigateTrendElement(hit, nativeEvent) {
  if (!hit || !hit.el) return;
  saveTrendState('element-navigation');
  trackTrendElementClick(hit.el, trendChart?.$trendProp || document.getElementById('trend-prop')?.value || 'en');
  const url = trendElementUrl(hit.el);
  const openNew = nativeEvent && (nativeEvent.button === 1 || nativeEvent.ctrlKey || nativeEvent.metaKey);
  if (openNew) {
    const win = window.open(url, '_blank', 'noopener');
    if (win) win.opener = null;
  } else {
    window.location.href = url;
  }
}

function ensureTrendA11yStatus() {
  let node = document.getElementById('trend-a11y-status');
  if (!node) {
    node = document.createElement('span');
    node.id = 'trend-a11y-status';
    node.className = 'trend-sr-only';
    node.setAttribute('aria-live', 'polite');
    const wrap = document.querySelector('.trend-chart-wrap') || document.body;
    wrap.appendChild(node);
  }
  return node;
}

function updateTrendKeyboardFocus(index, announce) {
  if (!trendChart || !trendChart.$trendElements?.length) return;
  const n = trendChart.$trendElements.length;
  index = Math.max(0, Math.min(n - 1, Number.isFinite(index) ? index : 0));
  trendChart.$trendKeyboardIndex = index;
  const el = trendChart.$trendElements[index];
  const label = `${elName(el)} (${el.sym}), Z=${el.z}. ${trendLang() === 'pt' ? 'Pressione Enter para abrir.' : 'Press Enter to open.'}`;
  const canvas = document.getElementById('trend-chart');
  if (canvas) canvas.setAttribute('aria-label', label);
  if (announce) ensureTrendA11yStatus().textContent = label;
  trendChart.update('none');
}

window.addEventListener('pagehide', () => saveTrendState('pagehide'));

// Registers chartjs-plugin-zoom once. The CDN UMD build may or may not self-
// register depending on version, so we do it defensively. No-op (and the chart
// still renders, just without pan/zoom) if the plugin script didn't load.
function ensureZoomPlugin() {
  try {
    if (window.Chart && Chart.registry && !Chart.registry.plugins.get('zoom')) {
      const z = window.ChartZoom || window.chartjsPluginZoom;
      if (z) Chart.register(z);
    }
  } catch (e) {}
}

// Returns the chart to its full extent — wired to the reset button and a
// double-click on the canvas.
function resetTrendZoom() {
  if (trendChart) {
    trendAutoY = true;                                   // fit-to-data: full X + auto Y
    trendChart.options.scales.y.min = undefined;
    trendChart.options.scales.y.max = undefined;
    fitTrendXToData('none');
    applyAutoY();
    updateNavWindow();
    updateAutoBtn();
    updateTrendStatsFromChart();
    saveTrendState('reset');
  }
  const b = document.getElementById('trend-reset');
  if (b) b.hidden = true;
}

function trendFullXBounds(chart) {
  const c = chart || trendChart;
  const n = c && c.data && c.data.labels ? c.data.labels.length : 0;
  const max = Math.max(0, n - 1);
  return { min: 0, max, span: max };
}

function clampTrendXRange(min, max, chart) {
  const b = trendFullXBounds(chart);
  if (b.span <= 0) return { min: b.min, max: b.max };
  min = Number.isFinite(min) ? min : b.min;
  max = Number.isFinite(max) ? max : b.max;
  if (max < min) { const t = min; min = max; max = t; }

  const minSpan = Math.min(TREND_X_MIN_RANGE, b.span);
  let span = max - min;
  if (span < minSpan) {
    const center = (min + max) / 2;
    min = center - minSpan / 2;
    max = center + minSpan / 2;
    span = minSpan;
  }
  if (span > b.span) {
    min = b.min;
    max = b.max;
    span = b.span;
  }
  if (min < b.min) { max += b.min - min; min = b.min; }
  if (max > b.max) { min -= max - b.max; max = b.max; }
  min = Math.max(b.min, min);
  max = Math.min(b.max, max);
  return { min, max };
}

function setChartXRange(chart, min, max, mode) {
  if (!chart) return;
  const r = clampTrendXRange(min, max, chart);
  if (typeof chart.zoomScale === 'function') {
    chart.zoomScale('x', { min: r.min, max: r.max }, mode || 'none');
  } else {
    chart.options.scales.x.min = r.min;
    chart.options.scales.x.max = r.max;
    chart.update(mode || 'none');
  }
}

function fitTrendXToData(mode) {
  if (!trendChart) return;
  const b = trendFullXBounds(trendChart);
  setChartXRange(trendChart, b.min, b.max, mode || 'none');
}

function clampTrendViewport() {
  if (!trendChart || !trendChart.scales || !trendChart.scales.x) return;
  const sx = trendChart.scales.x;
  const r = clampTrendXRange(sx.min, sx.max, trendChart);
  if (Math.abs(r.min - sx.min) > 0.001 || Math.abs(r.max - sx.max) > 0.001) {
    setChartXRange(trendChart, r.min, r.max, 'none');
  }
}

// Display units per property — drives Y-axis titles, tooltips and CSV headers.
const TREND_UNITS = { en: '', radius: 'pm', melt: '°C', boil: '°C', mass: 'u', density: 'g/cm³', ionization: 'kJ/mol' };

// ─── DYNAMIC SCIENTIFIC INSIGHT ENGINE ─────────────────────────────────────
// Curated, scientifically-vetted explanations per property — NEVER generated at
// runtime. Each property carries, in EN and PT:
//   def    — what the property is (the lead line)
//   trend  — the main periodic trend, in one sentence
//   why    — the scientific reason behind that trend
//   interp — a short educational takeaway (the extremes)
//   period — context line shown when a single period is filtered (← → trend)
//   group  — context line shown when a single group is filtered (↓ trend)
//   fblock — context line for the lanthanide / actinide series
// The highest/lowest *values* are computed live from the data (renderTrendStatsUI),
// so the qualitative text and the quantitative grid stay in sync with any filter.
const TREND_INSIGHTS = {
  en: {
    en: {
      def: 'Electronegativity measures how strongly a bonded atom attracts the shared electrons of a chemical bond (Pauling scale).',
      trend: 'Increases across a period (left → right) and decreases down a group.',
      why: 'Across a period the nuclear charge grows while electrons stay in the same shell, so the atom pulls bonding electrons more tightly. Down a group, added shells and shielding place the outer electrons farther from the nucleus, weakening that pull.',
      interp: 'Fluorine, at the top-right, is the most electronegative element; the heavy alkali metals at the bottom-left are the least.',
      period: 'Across this period, electronegativity rises toward the right.',
      group: 'Down this group, electronegativity falls as the atoms grow larger.',
      fblock: 'Across this inner-transition series, electronegativity stays low and nearly constant.'
    },
    pt: {
      def: 'A eletronegatividade mede o quanto um átomo ligado atrai os elétrons compartilhados de uma ligação química (escala de Pauling).',
      trend: 'Aumenta ao longo de um período (esquerda → direita) e diminui ao descer um grupo.',
      why: 'Ao longo de um período, a carga nuclear cresce enquanto os elétrons permanecem na mesma camada, então o átomo atrai os elétrons de ligação com mais força. Ao descer um grupo, camadas extras e a blindagem afastam os elétrons externos do núcleo, enfraquecendo essa atração.',
      interp: 'O flúor, no canto superior direito, é o elemento mais eletronegativo; os metais alcalinos pesados, no canto inferior esquerdo, são os menos.',
      period: 'Neste período, a eletronegatividade cresce para a direita.',
      group: 'Neste grupo, a eletronegatividade cai conforme os átomos ficam maiores.',
      fblock: 'Nesta série de transição interna, a eletronegatividade permanece baixa e quase constante.'
    }
  },
  radius: {
    en: {
      def: 'Atomic radius estimates the size of an atom — roughly the distance from the nucleus to its outermost electrons.',
      trend: 'Decreases across a period (left → right) and increases down a group.',
      why: 'Across a period the rising nuclear charge draws the same-shell electrons inward, so atoms shrink. Down a group each new period adds an electron shell, so atoms get larger.',
      interp: 'The largest atoms are the heavy alkali metals (bottom-left, such as caesium); the smallest sit toward the top-right.',
      period: 'Across this period, atoms shrink toward the right.',
      group: 'Down this group, atoms grow as electron shells are added.',
      fblock: 'Across this series the radius shrinks only slightly — the lanthanide/actinide contraction, caused by weak f-electron shielding.'
    },
    pt: {
      def: 'O raio atômico estima o tamanho do átomo — aproximadamente a distância do núcleo aos seus elétrons mais externos.',
      trend: 'Diminui ao longo de um período (esquerda → direita) e aumenta ao descer um grupo.',
      why: 'Ao longo de um período, o aumento da carga nuclear puxa os elétrons da mesma camada para dentro, então os átomos encolhem. Ao descer um grupo, cada novo período adiciona uma camada, então os átomos ficam maiores.',
      interp: 'Os maiores átomos são os metais alcalinos pesados (canto inferior esquerdo, como o césio); os menores ficam em direção ao canto superior direito.',
      period: 'Neste período, os átomos encolhem para a direita.',
      group: 'Neste grupo, os átomos crescem com a adição de camadas.',
      fblock: 'Nesta série o raio diminui só gradualmente — a contração lantanídica/actinídica, pela blindagem fraca dos elétrons f.'
    }
  },
  melt: {
    en: {
      def: 'Melting point is the temperature at which a solid becomes a liquid.',
      trend: 'No simple periodic trend — it peaks where atomic bonding is strongest.',
      why: 'Melting breaks the bonds holding atoms in the solid lattice. Strong metallic and covalent networks (carbon, tungsten) resist this up to very high temperatures, while molecular solids and the noble gases melt extremely low.',
      interp: 'Carbon and refractory metals like tungsten melt highest; helium and the noble gases melt near absolute zero.',
      period: 'Across this period it climbs toward the strongly-bonded centre, then drops toward the gases.',
      group: 'Down this group the trend depends on bonding type — alkali metals fall, while several nonmetal groups rise.',
      fblock: 'Across this metallic series the melting points stay high and fairly uniform.'
    },
    pt: {
      def: 'O ponto de fusão é a temperatura em que um sólido se torna líquido.',
      trend: 'Sem tendência periódica simples — é máximo onde a ligação atômica é mais forte.',
      why: 'A fusão quebra as ligações que prendem os átomos na rede do sólido. Redes metálicas e covalentes fortes (carbono, tungstênio) resistem até temperaturas altíssimas, enquanto sólidos moleculares e gases nobres fundem muito baixo.',
      interp: 'Carbono e metais refratários como o tungstênio fundem mais alto; o hélio e os gases nobres fundem perto do zero absoluto.',
      period: 'Neste período, sobe até o centro de ligação forte e depois cai em direção aos gases.',
      group: 'Neste grupo a tendência depende do tipo de ligação — metais alcalinos caem, enquanto vários grupos de não-metais sobem.',
      fblock: 'Nesta série metálica os pontos de fusão permanecem altos e bastante uniformes.'
    }
  },
  boil: {
    en: {
      def: 'Boiling point is the temperature at which a liquid becomes a gas.',
      trend: 'Like melting point, it has no simple periodic trend — it follows how strongly atoms are bound.',
      why: 'Boiling fully separates atoms or molecules, so it scales with bond strength: strongly-bonded metals boil hottest, while the noble gases — held by only weak forces — boil just above absolute zero.',
      interp: 'Refractory metals such as tungsten and rhenium boil highest; helium boils lowest of all elements.',
      period: 'Across this period it rises toward the strongly-bonded metals, then falls toward the gases.',
      group: 'Down this group the trend depends on bonding type and intermolecular forces.',
      fblock: 'Across this metallic series the boiling points stay very high.'
    },
    pt: {
      def: 'O ponto de ebulição é a temperatura em que um líquido se torna gás.',
      trend: 'Como o ponto de fusão, não tem tendência periódica simples — acompanha quão fortemente os átomos estão ligados.',
      why: 'A ebulição separa completamente átomos ou moléculas, então acompanha a força da ligação: metais de ligação forte fervem mais quente, enquanto os gases nobres — presos por forças fracas — fervem logo acima do zero absoluto.',
      interp: 'Metais refratários como tungstênio e rênio fervem mais alto; o hélio ferve mais baixo que todos os elementos.',
      period: 'Neste período, sobe em direção aos metais de ligação forte e depois cai em direção aos gases.',
      group: 'Neste grupo a tendência depende do tipo de ligação e das forças intermoleculares.',
      fblock: 'Nesta série metálica os pontos de ebulição permanecem altíssimos.'
    }
  },
  mass: {
    en: {
      def: 'Atomic mass is the average mass of an atom of the element, in unified atomic mass units (u).',
      trend: 'Increases steadily with atomic number — so it rises across a period and down a group.',
      why: 'Each step to the next element adds protons and, on average, neutrons to the nucleus. Since nucleons carry almost all the mass, atomic mass climbs almost monotonically with Z.',
      interp: 'Hydrogen is the lightest element; the synthetic superheavy elements at the end of the table are the heaviest.',
      period: 'Across this period, mass rises with each added proton.',
      group: 'Down this group, mass rises as the nuclei grow heavier.',
      fblock: 'Across this series, mass increases steadily with atomic number.'
    },
    pt: {
      def: 'A massa atômica é a massa média de um átomo do elemento, em unidades de massa atômica (u).',
      trend: 'Aumenta de forma contínua com o número atômico — então cresce ao longo de um período e ao descer um grupo.',
      why: 'Cada passo para o próximo elemento adiciona prótons e, em média, nêutrons ao núcleo. Como os núcleons carregam quase toda a massa, a massa atômica cresce de forma quase monotônica com Z.',
      interp: 'O hidrogênio é o elemento mais leve; os elementos superpesados sintéticos no fim da tabela são os mais pesados.',
      period: 'Neste período, a massa cresce a cada próton adicionado.',
      group: 'Neste grupo, a massa cresce conforme os núcleos ficam mais pesados.',
      fblock: 'Nesta série, a massa aumenta de forma contínua com o número atômico.'
    }
  },
  density: {
    en: {
      def: 'Density is how much mass is packed into a given volume (g/cm³ for solids and liquids; gases are far lower).',
      trend: 'No simple left-to-right trend — it peaks among the heavy transition metals.',
      why: 'Density depends on both atomic mass and how tightly atoms pack. The heavy d-block metals combine large masses with compact crystal packing, making them densest; gases, with atoms far apart, are least dense.',
      interp: 'Osmium and iridium are the densest elements; hydrogen and helium are the lightest.',
      period: 'Across this period, density peaks near the centre (transition metals) and falls toward the gases.',
      group: 'Down this group, density generally increases as the atoms get heavier.',
      fblock: 'Across this series, density rises gradually as mass increases.'
    },
    pt: {
      def: 'A densidade é quanta massa cabe em um dado volume (g/cm³ para sólidos e líquidos; gases são bem menores).',
      trend: 'Sem tendência simples de esquerda para a direita — é máxima entre os metais de transição pesados.',
      why: 'A densidade depende da massa atômica e de quão compactamente os átomos se empacotam. Os metais pesados do bloco d combinam grande massa com empacotamento cristalino compacto, sendo os mais densos; gases, com átomos distantes, são os menos densos.',
      interp: 'Ósmio e irídio são os elementos mais densos; hidrogênio e hélio são os mais leves.',
      period: 'Neste período, a densidade é máxima perto do centro (metais de transição) e cai em direção aos gases.',
      group: 'Neste grupo, a densidade geralmente aumenta conforme os átomos ficam mais pesados.',
      fblock: 'Nesta série, a densidade cresce gradualmente com o aumento da massa.'
    }
  },
  ionization: {
    en: {
      def: 'First ionization energy is the energy needed to remove the most loosely held electron from a neutral gaseous atom.',
      trend: 'Increases across a period (left → right) and decreases down a group.',
      why: 'Across a period the rising nuclear charge binds the outer electrons more tightly, so more energy is required. Down a group the outermost electron lies farther out and is better shielded, so it is removed more easily.',
      interp: 'Helium and the noble gases require the most energy; the heavy alkali metals lose an electron most easily.',
      period: 'Across this period, ionization energy rises toward the noble gas.',
      group: 'Down this group, ionization energy falls as the outer electron moves farther out.',
      fblock: 'Across this series, ionization energy changes only slowly.'
    },
    pt: {
      def: 'A primeira energia de ionização é a energia necessária para remover o elétron mais fracamente ligado de um átomo gasoso neutro.',
      trend: 'Aumenta ao longo de um período (esquerda → direita) e diminui ao descer um grupo.',
      why: 'Ao longo de um período, o aumento da carga nuclear prende os elétrons externos com mais força, exigindo mais energia. Ao descer um grupo, o elétron mais externo fica mais distante e mais blindado, sendo removido com mais facilidade.',
      interp: 'O hélio e os gases nobres exigem mais energia; os metais alcalinos pesados perdem um elétron com mais facilidade.',
      period: 'Neste período, a energia de ionização cresce em direção ao gás nobre.',
      group: 'Neste grupo, a energia de ionização cai conforme o elétron externo se afasta.',
      fblock: 'Nesta série, a energia de ionização muda muito pouco.'
    }
  }
};

// Resolves a single (element, property) pair to a finite number, or null when
// data is unavailable. null (never 0) is essential: 0 °C is a real temperature,
// and synthetic elements carrying "—" must read as "no data" — a gap in the
// line — instead of plunging the curve to 0 (which produced the false 0-plateau
// and spike artifacts for melt/boil on Z≥104). The line gaps (spanGaps:false)
// and the caption's highest/lowest scan both key off null.
function trendNum(el, prop) {
  if (!el) return null;
  let raw, n;
  switch (prop) {
    case 'en':         raw = el.en; break;
    case 'mass':       raw = (typeof el.mass === 'string' ? el.mass.replace(/[^0-9.]/g, '') : el.mass); break;
    case 'radius':     raw = (getExtra2(el.z) || {}).radius; break;
    case 'melt':       raw = (getExtra(el.z)  || {}).melt; break;
    case 'boil':       raw = (getExtra(el.z)  || {}).boil; break;
    case 'ionization': raw = (typeof getIonization === 'function') ? getIonization(el.z) : undefined; break;
    case 'density':
      // Density mixes units in the source data: gases (and a couple of
      // superheavy predictions like Cn/Fl) are stored in g/L, solids in g/cm³.
      // Normalize everything to g/cm³ so one element doesn't blow out the scale.
      raw = (getExtra2(el.z) || {}).density;
      n = parseFloat(raw);
      if (!Number.isFinite(n)) return null;
      if (/g\s*\/\s*l/i.test(String(raw))) n /= 1000;
      return n;
    default: return null;
  }
  n = parseFloat(raw);
  return Number.isFinite(n) ? n : null;
}

// Builds the "missing-data bridge": a parallel series, on the SAME Y axis as the
// real line, that turns gaps into a continuous dashed continuation instead of
// loose markers on a separate layer. For each index it returns:
//   • a real value, only where that point borders a gap (an anchor, so the dashed
//     line meets the solid line exactly);
//   • a linearly-interpolated value across an interior gap (held flat for a
//     leading/trailing gap that has just one neighbour) — purely visual, never
//     stored as data and never shown in a tooltip;
//   • null on the interior of a fully-measured run, so the dashed layer never
//     overdraws the solid line.
// `isMissing[i]` flags the genuinely-unknown elements (null / non-finite) — used
// to place the discreet markers and to label them "Not available". No zeros, no
// invented numbers: the real series stays untouched.
function buildTrendBridge(values) {
  const n = values.length;
  const isReal = v => v != null && Number.isFinite(v);
  const bridge = new Array(n).fill(null);
  const isMissing = values.map(v => !isReal(v));
  let hasReal = false;
  for (let i = 0; i < n; i++) { if (isReal(values[i])) { hasReal = true; break; } }
  if (!hasReal) return { bridge, isMissing, hasReal: false };
  for (let i = 0; i < n; i++) {
    if (isReal(values[i])) {
      const bordersGap = (i > 0 && !isReal(values[i - 1])) || (i < n - 1 && !isReal(values[i + 1]));
      bridge[i] = bordersGap ? values[i] : null;          // anchor only next to a gap
    } else {
      let l = i - 1; while (l >= 0 && !isReal(values[l])) l--;
      let r = i + 1; while (r < n && !isReal(values[r])) r++;
      const hasL = l >= 0, hasR = r < n;
      if (hasL && hasR)      bridge[i] = values[l] + (values[r] - values[l]) * (i - l) / (r - l);
      else if (hasL)         bridge[i] = values[l];        // trailing gap → hold flat
      else if (hasR)         bridge[i] = values[r];        // leading gap → hold flat
    }
  }
  return { bridge, isMissing, hasReal: true };
}

// Resolves the i18n-translated display name of a property (uses option text).
function trendPropLabel(prop) {
  const opt = Array.from(document.getElementById('trend-prop').options).find(o => o.value === prop);
  return opt ? opt.text : prop;
}


// ─── TRENDS TOOLTIP — compact scientific info card ─────────────────────────
// Per-property formatting for the rich hover card. Each property resolves to a
// display value with its natural, auto-adapted unit (pm · °C + K · u · g/cm³ or
// g/L · kJ/mol + eV · Pauling). Returns { available:false } when the element has
// no value for that property, so the card can omit it (rule: show only what
// exists) — the only fabrication-free way to keep the layout honest.
function fmtTrendNum(v, dec) {
  if (v == null || !Number.isFinite(v)) return '';
  return String(+v.toFixed(dec == null ? 2 : dec));   // round, then drop trailing zeros
}

function formatTrendProp(el, prop) {
  const label = trendPropLabel(prop);
  if (!el) return { label, available: false };
  // Density keeps its SOURCE unit (gases g/L, solids g/cm³) — far more readable
  // than the g/cm³-normalised value the chart plots (e.g. H → 0.0000899).
  if (prop === 'density') {
    const raw = (getExtra2(el.z) || {}).density;
    if (raw == null || !/\d/.test(String(raw))) return { label, available: false };
    const m = String(raw).match(/^\s*([\d.]+)\s*(.*)$/);
    return { label, available: true, value: m ? m[1] : String(raw).trim(), unit: m ? m[2].trim() : '' };
  }
  // Atomic mass: source string preserves precision and [bracketed] mass numbers.
  if (prop === 'mass') {
    if (el.mass == null || el.mass === '—') return { label, available: false };
    return { label, available: true, value: String(el.mass).trim(), unit: 'u' };
  }
  const n = trendNum(el, prop);
  if (n == null) return { label, available: false };
  if (prop === 'en')         return { label, available: true, value: fmtTrendNum(n, 2), desc: 'Pauling' };
  if (prop === 'radius')     return { label, available: true, value: fmtTrendNum(n, 0), unit: 'pm' };
  if (prop === 'melt' || prop === 'boil')
                             return { label, available: true, value: fmtTrendNum(n, 1), unit: '°C', alt: Math.round(n + 273.15) + ' K' };
  if (prop === 'ionization') return { label, available: true, value: fmtTrendNum(n, 0), unit: 'kJ/mol', alt: (n / 96.485).toFixed(2) + ' eV' };
  return { label, available: true, value: fmtTrendNum(n, 2), unit: TREND_UNITS[prop] || '' };
}

// Builds the card markup for one element. The plotted property is emphasised at
// the top; every other available trend property follows as a compact context
// row. Identity meta (Z · period · group · category) sits under the name.
function buildTrendCard(el, prop) {
  if (!el) return '';
  const lang = trendLang();
  const T = lang === 'pt'
    ? { z: 'Número atômico', period: 'Período', group: 'Grupo' }
    : { z: 'Atomic number', period: 'Period', group: 'Group' };
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  let meta = `<span>${T.z}</span><b>${el.z}</b>`;
  if (Number.isFinite(+el.period)) meta += `<span>${T.period}</span><b>${esc(el.period)}</b>`;
  // f-block group is null (the drawing column is `col`, not an IUPAC group).
  // Omit it here; the category already says lanthanide or actinide.
  const isFBlock = el.cat === 'lanthanide' || el.cat === 'actinide';
  if (!isFBlock && el.group != null && el.group !== '' && Number.isFinite(+el.group)) meta += `<span>${T.group}</span><b>${esc(el.group)}</b>`;
  const cat = trendChemicalFamilyLabel(el);
  const p = formatTrendProp(el, prop);
  let primary;
  if (p.available) {
    const tail = p.unit ? `<span class="tt-unit">${esc(p.unit)}</span>`
               : p.desc ? `<span class="tt-unit">${esc(p.desc)}</span>` : '';
    const alt  = p.alt ? `<span class="tt-alt">· ${esc(p.alt)}</span>` : '';
    primary = `<div class="tt-primary"><div class="tt-plbl">${esc(p.label)}</div>` +
              `<div class="tt-pval">${esc(p.value)}${tail}${alt}</div></div>`;
  } else {
    primary = `<div class="tt-primary is-missing"><div class="tt-plbl">${esc(p.label)}</div>` +
              `<div class="tt-pval">${esc(trendMissingLabel())}</div></div>`;
  }
  // Up to 4 context rows, by priority — keeps the card compact (the plotted
  // property is already emphasised above). Most-fundamental periodic properties
  // first; bulk physical ones (density/melt/boil) fill remaining slots.
  let rows = '', shown = 0;
  ['en', 'radius', 'mass', 'ionization', 'density', 'melt', 'boil'].some(k => {
    if (k === prop) return false;
    const f = formatTrendProp(el, k);
    if (!f.available) return false;
    const u = f.unit ? ' ' + esc(f.unit) : (f.desc ? ' ' + esc(f.desc) : '');
    rows += `<div class="tt-row"><span class="tt-rlbl">${esc(f.label)}</span>` +
            `<span class="tt-rval">${esc(f.value)}${u}</span></div>`;
    return ++shown >= 4;
  });
  return `<div class="tt-head"><span class="tt-name">${esc(elName(el))}</span>` +
           `<span class="tt-sym">${esc(el.sym)}</span></div>` +
         (cat ? `<span class="tt-cat">${esc(cat)}</span>` : '') +
         `<div class="tt-meta">${meta}</div>` +
         `<div class="tt-sep"></div>` +
         primary +
         (rows ? `<div class="tt-rows">${rows}</div>` : '');
}

// Filters ELEMENTS by group selector value: 'all', 'gN', 'lanthanides',
// 'actinides'. Period filtering is applied as a separate AND-step in
// trendFilterAll so users can combine group × period freely.
function trendFilterGroup(group) {
  if (!group || group === 'all') return ELEMENTS.slice();
  if (group === 'lanthanides')   return ELEMENTS.filter(e => e.z >= 57 && e.z <= 71);
  if (group === 'actinides')     return ELEMENTS.filter(e => e.z >= 89 && e.z <= 103);
  if (group.startsWith('g'))     { const g = +group.slice(1); return ELEMENTS.filter(e => +e.group === g); }
  return ELEMENTS.slice();
}

// Applies the unified filter dropdown value. Selector value is one of:
//   'all'                          → every element (Z 1–118)
//   'pN'                           → period N (1–7)
//   'gN'                           → group N (1–18)
//   'fam-<cat>'                    → chemical family (by element category)
//   'lanthanides' / 'actinides'    → f-block sub-series
// Handling everything from a single string keeps the UI clean: one dropdown,
// one source of truth. New filters slot in here (and in TREND_SCOPE) with no
// other change required.
function trendFilterElements(filterValue) {
  if (!filterValue || filterValue === 'all') return ELEMENTS.slice();
  if (filterValue === 'lanthanides')         return ELEMENTS.filter(e => e.z >= 57 && e.z <= 71);
  if (filterValue === 'actinides')           return ELEMENTS.filter(e => e.z >= 89 && e.z <= 103);
  if (filterValue.indexOf('fam-') === 0)     return trendFilterFamily(filterValue.slice(4));
  if (filterValue.startsWith('p'))           { const p = +filterValue.slice(1); return ELEMENTS.filter(e => +e.period === p); }
  if (filterValue.startsWith('g'))           { const g = +filterValue.slice(1); return ELEMENTS.filter(e => +e.group === g && trendGroupKeepsFBlock(g, e)); }
  return ELEMENTS.slice();
}

// f-block elements keep group: null, so a numeric group filter does not include
// them. This guard still drops an f-block element if one is ever given a group
// above 3. Group 3 stays Sc and Y until the owner chooses Lu/Lr or La/Ac.
// The f-block stays fully reachable via the dedicated Lanthanides/Actinides filters.
function trendGroupKeepsFBlock(g, e) {
  return g <= 3 || (e.cat !== 'lanthanide' && e.cat !== 'actinide');
}

function trendFilterFamilyModern(fam) {
  const def = trendFamilyDef(fam);
  const key = def ? def.key : fam;
  return ELEMENTS.filter(e => trendChemicalFamilyKey(e) === key);
}

// Chemical-family filters go through trendChemicalFamilyKey() so every element
// has one accepted family even when the raw dataset category is broader.
function trendFilterFamily(fam) {
  return trendFilterFamilyModern(fam);
}

// ─── TRENDS SCOPE SELECTOR (custom accessible listbox) ─────────────────────
// Single source of truth for the scope dropdown's structure + bilingual labels.
// To add a future filter: drop an item into the right section here and handle
// its value in trendFilterElements — the UI, the native <select> mirror, the
// caption label and the export all pick it up automatically.
const TREND_SCOPE = [
  { header: { en: 'All elements', pt: 'Todos os elementos' }, items: [
    { v: 'all', en: 'All Elements (Z 1–118)', pt: 'Todos os Elementos (Z 1–118)' }
  ]},
  { header: { en: 'Periods', pt: 'Períodos' }, items: [
    { v: 'p1', en: 'Period 1', pt: 'Período 1' }, { v: 'p2', en: 'Period 2', pt: 'Período 2' },
    { v: 'p3', en: 'Period 3', pt: 'Período 3' }, { v: 'p4', en: 'Period 4', pt: 'Período 4' },
    { v: 'p5', en: 'Period 5', pt: 'Período 5' }, { v: 'p6', en: 'Period 6', pt: 'Período 6' },
    { v: 'p7', en: 'Period 7', pt: 'Período 7' }
  ]},
  { header: { en: 'Main groups', pt: 'Grupos principais' }, items: [
    { v: 'g1',  en: 'Group 1 (Alkali Metals)',         pt: 'Grupo 1 (Metais Alcalinos)' },
    { v: 'g2',  en: 'Group 2 (Alkaline Earth Metals)', pt: 'Grupo 2 (Metais Alcalino-Terrosos)' },
    { v: 'g13', en: 'Group 13 (Boron Family)',         pt: 'Grupo 13 (Família do Boro)' },
    { v: 'g14', en: 'Group 14 (Carbon Family)',        pt: 'Grupo 14 (Família do Carbono)' },
    { v: 'g15', en: 'Group 15 (Pnictogens)',           pt: 'Grupo 15 (Pnictogênios)' },
    { v: 'g16', en: 'Group 16 (Chalcogens)',           pt: 'Grupo 16 (Calcogênios)' },
    { v: 'g17', en: 'Group 17 (Halogens)',             pt: 'Grupo 17 (Halogênios)' },
    { v: 'g18', en: 'Group 18 (Noble Gases)',          pt: 'Grupo 18 (Gases Nobres)' }
  ]},
  { header: { en: 'Transition metals', pt: 'Metais de transição' }, items: [
    { v: 'g3',  en: 'Group 3',  pt: 'Grupo 3' },  { v: 'g4',  en: 'Group 4',  pt: 'Grupo 4' },
    { v: 'g5',  en: 'Group 5',  pt: 'Grupo 5' },  { v: 'g6',  en: 'Group 6',  pt: 'Grupo 6' },
    { v: 'g7',  en: 'Group 7',  pt: 'Grupo 7' },  { v: 'g8',  en: 'Group 8',  pt: 'Grupo 8' },
    { v: 'g9',  en: 'Group 9',  pt: 'Grupo 9' },  { v: 'g10', en: 'Group 10', pt: 'Grupo 10' },
    { v: 'g11', en: 'Group 11', pt: 'Grupo 11' }, { v: 'g12', en: 'Group 12', pt: 'Grupo 12' }
  ]},
  { header: { en: 'Chemical families', pt: 'Famílias químicas' },
    items: TREND_FAMILY_DEFS.map(f => ({ v: f.value, en: f.en, pt: f.pt })) },
  { header: { en: 'f-block', pt: 'Bloco f' }, items: [
    { v: 'lanthanides', en: 'Lanthanides', pt: 'Lantanídeos' },
    { v: 'actinides',   en: 'Actinides',   pt: 'Actinídeos' }
  ]}
];

// Property selector sections (drives #trend-prop) — same shape as TREND_SCOPE.
// Labels mirror the i18n property names so axis titles / tooltips / insight stay
// identical. Add a future property by dropping it into the right section here.
const TREND_PROP_GROUPS = [
  { header: { en: 'Atomic properties', pt: 'Propriedades atômicas' }, items: [
    { v: 'radius',  en: 'Atomic Radius', pt: 'Raio Atômico' },
    { v: 'mass',    en: 'Atomic Mass',   pt: 'Massa Atômica' },
    { v: 'density', en: 'Density',       pt: 'Densidade' }
  ]},
  { header: { en: 'Electronic properties', pt: 'Propriedades eletrônicas' }, items: [
    { v: 'en',         en: 'Electronegativity', pt: 'Eletronegatividade' },
    { v: 'ionization', en: 'Ionization Energy',  pt: 'Energia de Ionização' }
  ]},
  { header: { en: 'Thermal properties', pt: 'Propriedades térmicas' }, items: [
    { v: 'melt', en: 'Melting Point', pt: 'Ponto de Fusão' },
    { v: 'boil', en: 'Boiling Point', pt: 'Ponto de Ebulição' }
  ]}
];

// ─── TRENDS CUSTOM SELECT — shared Atomurus dropdown component ──────────────
// ONE accessible listbox component. Both the scope and property selectors are
// instances of it (same markup, CSS, keyboard model), so they read as one
// component family. Each instance progressively enhances a hidden native
// <select> (the source of truth for .value/.options/onchange). State lives on
// the instance, so multiple dropdowns coexist cleanly.
const TREND_SELECTS = {
  prop:  { name: 'prop',  selectId: 'trend-prop',  sections: TREND_PROP_GROUPS,
           aria: { en: 'Property to plot', pt: 'Propriedade para plotar' },
           built: false, lang: null, open: false, active: -1, typeahead: { str: '', t: 0 } },
  scope: { name: 'scope', selectId: 'trend-group', sections: TREND_SCOPE,
           aria: { en: 'Filter elements', pt: 'Filtrar elementos' },
           searchable: true, search: '',
           built: false, lang: null, open: false, active: -1, typeahead: { str: '', t: 0 } }
};

function trendSelOpts(inst, visibleOnly) {
  if (!inst.list) return [];
  const opts = Array.from(inst.list.querySelectorAll('.trend-select-opt'));
  if (!visibleOnly) return opts;
  return opts.filter(o => !o.hidden && !(o.closest('.trend-select-section') || {}).hidden);
}

// (Re)builds the hidden <select> mirror + the custom listbox from the instance's
// section config in the current language, preserving the selected value.
// Idempotent and cheap — called at the top of every renderTrendChart.
function buildTrendSelect(inst) {
  const sel = document.getElementById(inst.selectId);
  if (!sel) return;
  const lang = trendLang();
  const needStructure = !inst.built || inst.lang !== lang;
  if (needStructure) {
    const prev = sel.value;
    sel.innerHTML = '';
    inst.sections.forEach(group => {
      const og = document.createElement('optgroup');
      og.label = trendSelStr(group.header, lang);
      group.items.forEach(it => {
        const o = document.createElement('option');
        o.value = it.v;
        o.textContent = trendSelStr(it, lang);
        og.appendChild(o);
      });
      sel.appendChild(og);
    });
    if (prev) sel.value = prev;
    if (!sel.value && sel.options.length) sel.value = sel.options[0].value;   // previous value gone → safe default
  }
  ensureTrendSelectUI(inst, sel, lang, needStructure);
  inst.built = true;
  inst.lang  = lang;
  syncTrendSelectButton(inst);
}

// Creates the combobox + listbox once; rebuilds the list markup when the
// structure (language) changes. Events are wired a single time.
function ensureTrendSelectUI(inst, sel, lang, rebuildList) {
  if (!inst.wrap) {
    const popId = 'ts-' + inst.name + '-pop';
    const listId = 'ts-' + inst.name + '-list';
    const wrap = document.createElement('div');
    wrap.className = 'trend-select' + (inst.searchable ? ' has-search' : '');
    const searchHtml = inst.searchable
      ? '<div class="trend-select-search-row">' +
          '<input class="trend-select-search" type="search" autocomplete="off" spellcheck="false">' +
        '</div>'
      : '';
    wrap.innerHTML =
      '<div class="trend-select-combo hm-select" role="combobox" tabindex="0" ' +
        'aria-haspopup="listbox" aria-expanded="false" aria-controls="' + listId + '">' +
        '<span class="trend-select-value"></span>' +
        '<svg class="trend-select-caret" viewBox="0 0 10 6" width="11" height="7" aria-hidden="true">' +
          '<path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '</div>' +
      '<div class="trend-select-pop" id="' + popId + '" hidden>' +
        searchHtml +
        '<div class="trend-select-options" id="' + listId + '" role="listbox" tabindex="-1"></div>' +
        '<div class="trend-select-empty" role="status" hidden></div>' +
      '</div>';
    sel.style.display = 'none';
    sel.setAttribute('aria-hidden', 'true');
    sel.tabIndex = -1;
    sel.parentNode.insertBefore(wrap, sel.nextSibling);
    inst.wrap    = wrap;
    inst.combo   = wrap.querySelector('.trend-select-combo');
    inst.pop     = wrap.querySelector('.trend-select-pop');
    inst.list    = wrap.querySelector('.trend-select-options');
    inst.searchEl = wrap.querySelector('.trend-select-search');
    inst.emptyEl = wrap.querySelector('.trend-select-empty');
    inst.valueEl = wrap.querySelector('.trend-select-value');
    wireTrendSelect(inst);
    rebuildList = true;
  }
  // aria-label tracks the (translatable) select title
  const lbl = sel.getAttribute('title') || trendSelStr(inst.aria, lang);
  inst.combo.setAttribute('aria-label', lbl);
  inst.list.setAttribute('aria-label', lbl);
  renderTrendSelectSearchState(inst);

  if (rebuildList) {
    const esc = trendEscapeHtml;
    let html = '';
    inst.sections.forEach((group, gi) => {
      if (gi > 0) html += '<div class="trend-select-sep" role="presentation"></div>';
      const gid = 'ts-' + inst.name + '-g' + gi;
      html += '<div class="trend-select-section" role="group" aria-labelledby="' + gid + '">';
      html += '<div class="trend-select-head" id="' + gid + '" aria-hidden="true">' + esc(trendSelStr(group.header, lang)) + '</div>';
      group.items.forEach(it => {
        html += '<div class="trend-select-opt" role="option" id="ts-' + inst.name + '-' + esc(it.v) + '" data-value="' + esc(it.v) + '" aria-selected="false">' +
                  esc(trendSelStr(it, lang)) + '</div>';
      });
      html += '</div>';
    });
    inst.list.innerHTML = html;
    renderTrendSelectSearchState(inst);
  }
}

function trendSearchLabels() {
  return trendLang() === 'pt'
    ? { placeholder: 'Buscar filtro...', none: 'Nenhum filtro encontrado' }
    : { placeholder: 'Search scope...', none: 'No matching filters' };
}

function trendNormalizeSearch(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function trendSearchTokens(s) {
  return trendNormalizeSearch(s).split(/[^a-z0-9]+/).filter(Boolean);
}

function trendSearchMatches(text, query) {
  const qTokens = trendSearchTokens(query);
  if (!qTokens.length) return true;
  const tokens = trendSearchTokens(text);
  for (let i = 0; i <= tokens.length - qTokens.length; i++) {
    let ok = true;
    for (let j = 0; j < qTokens.length; j++) {
      if (!tokens[i + j] || !tokens[i + j].startsWith(qTokens[j])) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

function filterTrendSelectOptions(inst, query) {
  if (!inst || !inst.list) return 0;
  let visibleCount = 0;
  Array.from(inst.list.querySelectorAll('.trend-select-section')).forEach(section => {
    let sectionMatches = 0;
    Array.from(section.querySelectorAll('.trend-select-opt')).forEach(opt => {
      const hay = (opt.textContent || '') + ' ' + (opt.dataset.value || '');
      const match = trendSearchMatches(hay, query);
      opt.hidden = !match;
      opt.classList.remove('active');
      if (match) { sectionMatches++; visibleCount++; }
    });
    section.hidden = sectionMatches === 0;
  });
  let seenSection = false, pendingSep = null;
  Array.from(inst.list.children).forEach(node => {
    if (node.classList && node.classList.contains('trend-select-sep')) {
      node.hidden = true;
      pendingSep = node;
      return;
    }
    if (node.classList && node.classList.contains('trend-select-section') && !node.hidden) {
      if (seenSection && pendingSep) pendingSep.hidden = false;
      seenSection = true;
    }
  });
  return visibleCount;
}

function renderTrendSelectSearchState(inst) {
  if (!inst || !inst.searchable || !inst.searchEl || !inst.list) return;
  const labels = trendSearchLabels();
  inst.searchEl.placeholder = labels.placeholder;
  if (inst.searchEl.value !== inst.search) inst.searchEl.value = inst.search || '';
  if (inst.emptyEl) inst.emptyEl.textContent = labels.none;
  const visibleCount = filterTrendSelectOptions(inst, inst.search);
  if (inst.emptyEl) inst.emptyEl.hidden = visibleCount !== 0;
  const opts = trendSelOpts(inst, true);
  if (!opts.length) {
    inst.active = -1;
    inst.activeValue = null;
    inst.combo.removeAttribute('aria-activedescendant');
    return;
  }
  const activeIdx = inst.activeValue ? opts.findIndex(o => o.dataset.value === inst.activeValue) : -1;
  if (activeIdx >= 0) {
    setTrendSelectActive(inst, activeIdx, false);
    return;
  }
  const sel = document.getElementById(inst.selectId);
  const selected = sel ? opts.findIndex(o => o.dataset.value === sel.value) : -1;
  setTrendSelectActive(inst, selected >= 0 ? selected : 0, false);
}

// Mirrors the <select> state onto the custom UI: button label + aria-selected.
function syncTrendSelectButton(inst) {
  const sel = document.getElementById(inst.selectId);
  if (!sel || !inst.valueEl) return;
  const opt = sel.options[sel.selectedIndex];
  inst.valueEl.textContent = opt ? opt.text : '';
  trendSelOpts(inst).forEach(o => o.setAttribute('aria-selected', o.dataset.value === sel.value ? 'true' : 'false'));
}

function openTrendSelect(inst) {
  if (!inst.combo || !inst.pop || inst.open) return;
  inst.open = true;
  inst.pop.hidden = false;
  inst.combo.setAttribute('aria-expanded', 'true');
  inst.wrap.classList.add('open');
  renderTrendSelectSearchState(inst);
  const opts = trendSelOpts(inst, true);
  const sel  = document.getElementById(inst.selectId);
  const cur  = opts.findIndex(o => o.dataset.value === sel.value);
  setTrendSelectActive(inst, cur < 0 ? 0 : cur, true);
  if (inst.searchEl) setTimeout(() => inst.searchEl.focus(), 0);
  if (!inst._outside) inst._outside = e => { if (inst.wrap && !inst.wrap.contains(e.target)) closeTrendSelect(inst, false); };
  setTimeout(() => document.addEventListener('pointerdown', inst._outside, true), 0);
}

function closeTrendSelect(inst, focusCombo) {
  if (!inst.open) return;
  inst.open = false;
  inst.pop.hidden = true;
  inst.combo.setAttribute('aria-expanded', 'false');
  inst.combo.removeAttribute('aria-activedescendant');
  inst.wrap.classList.remove('open');
  inst.active = -1;
  inst.activeValue = null;
  trendSelOpts(inst).forEach(o => o.classList.remove('active'));
  if (inst._outside) document.removeEventListener('pointerdown', inst._outside, true);
  if (focusCombo) inst.combo.focus();
}

function setTrendSelectActive(inst, idx, scroll) {
  const opts = trendSelOpts(inst, true);
  if (!opts.length) {
    inst.active = -1;
    inst.activeValue = null;
    inst.combo.removeAttribute('aria-activedescendant');
    return;
  }
  idx = Math.max(0, Math.min(idx, opts.length - 1));
  inst.active = idx;
  inst.activeValue = opts[idx].dataset.value;
  trendSelOpts(inst).forEach(o => o.classList.toggle('active', o === opts[idx]));
  inst.combo.setAttribute('aria-activedescendant', opts[idx].id);
  if (scroll) opts[idx].scrollIntoView({ block: 'nearest' });
}

// Commits an option: drives the hidden <select> and fires its change event, so
// the existing behaviour (onchange="renderTrendChart()") runs unchanged.
function chooseTrendSelect(inst, idx) {
  const opts = trendSelOpts(inst, true);
  const o = opts[idx];
  const sel = document.getElementById(inst.selectId);
  if (!o || !sel) return;
  const changed = sel.value !== o.dataset.value;
  sel.value = o.dataset.value;
  syncTrendSelectButton(inst);
  if (inst.searchable) {
    inst.search = '';
    if (inst.searchEl) inst.searchEl.value = '';
    renderTrendSelectSearchState(inst);
  }
  closeTrendSelect(inst, true);
  if (changed) sel.dispatchEvent(new Event('change', { bubbles: true }));
}

function trendSelectType(inst, ch) {
  if (inst.searchable && inst.searchEl) {
    if (!inst.open) openTrendSelect(inst);
    inst.search += ch;
    renderTrendSelectSearchState(inst);
    inst.searchEl.focus();
    return;
  }
  const now = Date.now();
  if (now - inst.typeahead.t > 700) inst.typeahead.str = '';
  inst.typeahead.t = now;
  inst.typeahead.str += ch.toLowerCase();
  const opts = trendSelOpts(inst, true);
  let m = opts.findIndex(o => o.textContent.trim().toLowerCase().startsWith(inst.typeahead.str));
  if (m < 0 && inst.typeahead.str.length > 1) {            // restart match on the latest key
    inst.typeahead.str = ch.toLowerCase();
    m = opts.findIndex(o => o.textContent.trim().toLowerCase().startsWith(inst.typeahead.str));
  }
  if (m >= 0) setTrendSelectActive(inst, m, true);
}

function wireTrendSelect(inst) {
  const combo = inst.combo, list = inst.list;
  if (inst.searchEl) {
    inst.searchEl.addEventListener('input', e => {
      inst.search = e.target.value;
      renderTrendSelectSearchState(inst);
    });
    inst.searchEl.addEventListener('keydown', e => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setTrendSelectActive(inst, inst.active < 0 ? 0 : inst.active + 1, true);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setTrendSelectActive(inst, inst.active < 0 ? trendSelOpts(inst, true).length - 1 : inst.active - 1, true);
          break;
        case 'Enter':
          if (inst.active >= 0) { e.preventDefault(); chooseTrendSelect(inst, inst.active); }
          break;
        case 'Escape':
          e.preventDefault();
          if (inst.searchEl.value) {
            inst.search = '';
            inst.searchEl.value = '';
            renderTrendSelectSearchState(inst);
          } else {
            closeTrendSelect(inst, true);
          }
          break;
        case 'Tab':
          closeTrendSelect(inst, false);
          break;
      }
    });
    inst.searchEl.addEventListener('click', e => e.stopPropagation());
  }
  combo.addEventListener('click', () => { inst.open ? closeTrendSelect(inst, true) : openTrendSelect(inst); });
  combo.addEventListener('keydown', e => {
    const k = e.key;
    if (!inst.open) {
      if (k === 'ArrowDown' || k === 'ArrowUp' || k === 'Enter' || k === ' ' || k === 'Spacebar') { e.preventDefault(); openTrendSelect(inst); }
      else if (k.length === 1 && /\S/.test(k)) { openTrendSelect(inst); trendSelectType(inst, k); }
      return;
    }
    switch (k) {
      case 'ArrowDown': e.preventDefault(); setTrendSelectActive(inst, inst.active + 1, true); break;
      case 'ArrowUp':   e.preventDefault(); setTrendSelectActive(inst, inst.active - 1, true); break;
      case 'Home':      e.preventDefault(); setTrendSelectActive(inst, 0, true); break;
      case 'End':       e.preventDefault(); setTrendSelectActive(inst, trendSelOpts(inst, true).length - 1, true); break;
      case 'Enter':
      case ' ':
      case 'Spacebar':  e.preventDefault(); chooseTrendSelect(inst, inst.active); break;
      case 'Escape':
        e.preventDefault();
        if (inst.searchable && inst.search) {
          inst.search = '';
          if (inst.searchEl) inst.searchEl.value = '';
          renderTrendSelectSearchState(inst);
        } else {
          closeTrendSelect(inst, true);
        }
        break;
      case 'Tab':       closeTrendSelect(inst, false); break;
      default:          if (k.length === 1 && /\S/.test(k)) { e.preventDefault(); trendSelectType(inst, k); }
    }
  });
  list.addEventListener('click', e => {
    const opt = e.target.closest('.trend-select-opt');
    if (opt) chooseTrendSelect(inst, trendSelOpts(inst, true).indexOf(opt));
  });
  list.addEventListener('pointermove', e => {
    const opt = e.target.closest('.trend-select-opt');
    if (!opt) return;
    const i = trendSelOpts(inst, true).indexOf(opt);
    if (i >= 0 && i !== inst.active) setTrendSelectActive(inst, i, false);
  });
  inst.wrap.addEventListener('focusout', e => {
    if (!inst.wrap.contains(e.relatedTarget)) closeTrendSelect(inst, false);
  });
}

// Build / sync both trend dropdowns (property + scope). Called from renderTrendChart.
function buildTrendSelects() { buildTrendSelect(TREND_SELECTS.prop); buildTrendSelect(TREND_SELECTS.scope); }
function syncTrendSelectButtons() { syncTrendSelectButton(TREND_SELECTS.prop); syncTrendSelectButton(TREND_SELECTS.scope); }

async function renderTrendChart() {
  await ensureChartZoom();
  if (!window.Chart) { setTimeout(renderTrendChart, 200); return; }
  buildTrendSelects();               // (re)build BOTH dropdowns' <select> mirrors + custom listboxes (language-aware)
  applyTrendStoredControlsOnce();    // restore persisted prop/filter — options now all exist
  syncTrendSelectButtons();          // reflect the resolved values on the custom combos
  const prop   = document.getElementById('trend-prop').value;
  const filter = document.getElementById('trend-group').value;
  const ctx = document.getElementById('trend-chart').getContext('2d');

  const dataEls = trendFilterElements(filter);
  if (trendChart) { trendChart.destroy(); trendChart = null; }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const color     = isDark ? '#34A872' : '#1E6A50';
  const gridColor = isDark ? '#2E2C29' : '#e6e0d6';
  const textColor = isDark ? '#F0EDE8' : '#1A1814';

  // ── LINE chart: X = element (Z order), Y = prop ─────────────────────────────
  const labels = dataEls.map(e => e.sym);
  // null (not 0) for missing data — prevents the false 0-plateau / spike-to-0
  // that plotting 0 would cause. The dashed "bridge" dataset (below) turns those
  // gaps into a continuous dashed continuation on the SAME axis, so the trend
  // reads as one line and missing points sit on the path — not on a layer below.
  const values = dataEls.map(e => trendNum(e, prop));
  const { bridge, isMissing, hasReal } = buildTrendBridge(values);
  const missingCount = isMissing.reduce((n, m) => n + (m ? 1 : 0), 0);
  // Tooltip metadata (Z + full name) — used for richer hover info.
  const meta   = dataEls.map(e => ({ z: e.z, name: elName(e) }));
  const unit   = TREND_UNITS[prop] || '';
  const big    = dataEls.length > 40;
  const xLimitMax = Math.max(0, labels.length - 1);
  const zoomXLimits = { min: 0, max: xLimitMax };
  if (xLimitMax > 0) zoomXLimits.minRange = Math.min(TREND_X_MIN_RANGE, xLimitMax);
  const missingColor = isDark ? 'rgba(240,237,232,0.64)' : 'rgba(26,24,20,0.48)';
  const missingFill  = isDark ? '#161513' : '#FFFEFC';
  const bridgeColor  = color + (isDark ? 'B0' : 'A0');   // dashed bridge: the accent green, slightly muted
  trendAutoY = true;                          // each (re)render starts in auto-fit Y mode

  const datasets = [{
    label: trendPropLabel(prop),
    data: values,
    borderColor: color,
    // Vertical gradient fill (accent → transparent) for a cleaner look than a
    // flat block. Resolved lazily off chartArea so it survives layout/resizes.
    backgroundColor: c => {
      const { ctx: cx, chartArea } = c.chart;
      if (!chartArea) return color + '22';
      const g = cx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      g.addColorStop(0, color + '40');
      g.addColorStop(1, color + '00');
      return g;
    },
    borderWidth: 2,
    pointBackgroundColor: color,
    pointBorderColor: color,
    // A visible dot on every element that has data (gaps stay empty). Dots
    // shrink slightly on the dense full-table view so 118 markers don't crowd
    // the line — keeps the clean "connected points" look across every filter.
    pointRadius: c => { const v = c.dataset.data[c.dataIndex]; return (v == null || !Number.isFinite(v)) ? 0 : (big ? 2.4 : 3.5); },
    pointHoverRadius: 6,
    pointHoverBackgroundColor: color,
    pointHoverBorderColor: isDark ? '#0E0D0C' : '#FFFFFF',
    pointHoverBorderWidth: 2,
    clip: false,
    fill: true,
    tension: 0.35,
    spanGaps: false
  }];
  // Missing-data bridge: a dashed green continuation of the same curve, on the
  // main Y axis, drawn only across gaps (anchored to the bordering real points).
  // Discreet hollow markers mark each unknown element, sitting on the dashed
  // path itself — so "there is an element here, value unknown" reads cleanly
  // without loose diamonds or a separate baseline layer.
  if (missingCount && hasReal) {
    datasets.push({
      label: trendMissingLabel(),
      data: bridge,
      borderColor: bridgeColor,
      backgroundColor: 'transparent',
      borderWidth: 1.6,
      borderDash: [5, 5],
      fill: false,
      tension: 0.35,
      spanGaps: false,
      pointRadius: c => (isMissing[c.dataIndex] ? (big ? 1.8 : 2.6) : 0),
      pointHoverRadius: c => (isMissing[c.dataIndex] ? 5 : 0),
      pointStyle: 'circle',
      pointBackgroundColor: missingFill,
      pointBorderColor: missingColor,
      pointBorderWidth: 1.4,
      pointHoverBackgroundColor: missingFill,
      pointHoverBorderColor: missingColor,
      clip: false,
      isMissingBridge: true,
      _isMissing: isMissing
    });
  }

  // Pan/zoom turns the static chart into a navigable space (TradingView-style).
  // Registered defensively; the chart still works if the plugin script is absent.
  ensureZoomPlugin();
  const lang = trendLang();
  const crossColor = isDark ? 'rgba(240,237,232,0.28)' : 'rgba(26,24,20,0.24)';

  // Crosshair: dashed guide lines through the hovered point — the cue that makes
  // the chart feel like an explorable space rather than a flat picture.
  const crosshairPlugin = {
    id: 'trendCrosshair',
    afterDatasetsDraw(chart) {
      const act = (chart.tooltip && chart.tooltip.getActiveElements) ? chart.tooltip.getActiveElements() : [];
      if (!act.length) return;
      const idx = act[0].index;
      const realData = chart.data.datasets[0].data;
      const real = realData[idx] != null && Number.isFinite(realData[idx]);
      // Anchor the crosshair to a positioned element: the real point if the value
      // is known, otherwise the dashed-bridge point at the missing element.
      let el = null;
      const m0 = chart.getDatasetMeta(0);
      if (real && m0 && m0.data[idx]) el = m0.data[idx];
      else {
        const bi = chart.data.datasets.findIndex(d => d.isMissingBridge);
        if (bi >= 0) { const mb = chart.getDatasetMeta(bi); if (mb && mb.data[idx]) el = mb.data[idx]; }
      }
      if (!el) return;
      const a = chart.chartArea, cx = chart.ctx;
      cx.save();
      cx.lineWidth = 1; cx.setLineDash([4, 4]); cx.strokeStyle = crossColor;
      cx.beginPath();
      cx.moveTo(el.x, a.top); cx.lineTo(el.x, a.bottom);     // vertical: always (marks the element)
      if (real) { cx.moveTo(a.left, el.y); cx.lineTo(a.right, el.y); }  // horizontal: only when the value is known
      cx.stroke();
      cx.restore();
    }
  };

  // Progressive detail: when zoomed in close, print each visible element's value
  // above its point — analytical precision that surfaces only as you approach.
  const progressiveLabels = {
    id: 'trendProgressiveLabels',
    afterDatasetsDraw(chart) {
      const sx = chart.scales.x;
      if (sx.max - sx.min > 22) return;          // only on close zoom
      const m = chart.getDatasetMeta(0), data = chart.data.datasets[0].data;
      const bridgeIndex = chart.data.datasets.findIndex(ds => ds.isMissingBridge);
      const bridgeMeta  = bridgeIndex >= 0 ? chart.getDatasetMeta(bridgeIndex) : null;
      if (!m || !m.data) return;
      const cx = chart.ctx;
      cx.save();
      cx.font = '600 9px "DM Mono", monospace';
      cx.fillStyle = textColor; cx.textAlign = 'center'; cx.textBaseline = 'bottom';
      const lo = Math.max(0, Math.floor(sx.min)), hi = Math.min(data.length - 1, Math.ceil(sx.max));
      for (let i = lo; i <= hi; i++) {
        const v = data[i], pt = m.data[i];
        if (v != null && Number.isFinite(v) && pt) {
          cx.fillStyle = textColor;
          cx.fillText(String(Math.round(v * 100) / 100), pt.x, pt.y - 9);
        } else if (bridgeMeta && bridgeMeta.data[i]) {       // unknown → label sits on the dashed path
          const mp = bridgeMeta.data[i];
          cx.fillStyle = missingColor;
          cx.fillText(lang === 'pt' ? 'N/D' : 'N/A', mp.x, mp.y - 7);
        }
      }
      cx.restore();
    }
  };

  // When a whole selection has no measured data (e.g. Electronegativity for the
  // noble gases — undefined for that group), there is nothing to plot and nothing
  // to interpolate. Rather than a blank canvas, state it plainly so the chart is
  // never just "empty". (We never fabricate values to fill it.)
  const emptyStatePlugin = {
    id: 'trendEmptyState',
    afterDraw(chart) {
      if (hasReal) return;
      const a = chart.chartArea, cx = chart.ctx;
      if (!a) return;
      cx.save();
      cx.fillStyle = missingColor;
      cx.font = '500 13px "DM Sans", system-ui, sans-serif';
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      const msg = lang === 'pt' ? 'Sem dados disponíveis para esta seleção' : 'No data available for this selection';
      cx.fillText(msg, (a.left + a.right) / 2, (a.top + a.bottom) / 2);
      cx.restore();
    }
  };

  // Subtle brand watermark sitting in the chart background (above the grid, below
  // the data line so it never competes with the curve). Scales with the plot and
  // flows into the exported PNG automatically — the attribution mark for any
  // embed/share of this chart. Kept very low-alpha so it reads as a quiet hint.
  const watermarkPlugin = {
    id: 'trendWatermark',
    beforeDatasetsDraw(chart) {
      const a = chart.chartArea, cx = chart.ctx;
      if (!a) return;
      const w = a.right - a.left, h = a.bottom - a.top;
      cx.save();
      cx.globalAlpha = isDark ? 0.08 : 0.06;
      cx.fillStyle = textColor;
      cx.font = `600 ${Math.max(15, Math.min(46, w * 0.062))}px "DM Mono", ui-monospace, monospace`;
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      cx.fillText('atomurus.com', a.left + w / 2, a.top + h / 2);
      cx.restore();
    }
  };

  const interactivePointPlugin = {
    id: 'trendInteractivePoint',
    afterDatasetsDraw(chart) {
      const isHover = Number.isFinite(chart.$trendHoverIndex);
      const index = isHover ? chart.$trendHoverIndex : chart.$trendKeyboardIndex;
      if (!Number.isFinite(index)) return;
      const p = trendPointPixel(chart, index);
      if (!p) return;
      const age = isHover && Number.isFinite(chart.$trendHoverSince)
        ? Math.min(1, (performance.now() - chart.$trendHoverSince) / 140)
        : 1;
      const ease = 1 - Math.pow(1 - age, 2);
      const glowRadius = (p.real ? 5.5 : 4.5) + (p.real ? 2.5 : 1.5) * ease;
      const cx = chart.ctx;
      cx.save();
      cx.shadowColor = color;
      cx.shadowBlur = (p.real ? 8 : 6) + (p.real ? 6 : 4) * ease;
      cx.fillStyle = p.real ? color + '40' : missingColor;
      cx.beginPath();
      cx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
      cx.fill();
      if (Number.isFinite(chart.$trendKeyboardIndex) && chart.$trendKeyboardIndex === index) {
        cx.shadowBlur = 0;
        cx.lineWidth = 2;
        cx.setLineDash([3, 3]);
        cx.strokeStyle = isDark ? '#F0EDE8' : '#1A1814';
        cx.beginPath();
        cx.arc(p.x, p.y, p.real ? 10 : 8, 0, Math.PI * 2);
        cx.stroke();
      }
      cx.restore();
      if (isHover && age < 1) requestAnimationFrame(() => { if (chart.$trendHoverIndex === index) chart.draw(); });
    }
  };

  // Reveal the reset affordance once the view has been moved off its full extent.
  const showReset = () => { const b = document.getElementById('trend-reset'); if (b) b.hidden = false; };

  // Custom external tooltip → the compact scientific card. Replaces the canvas
  // tooltip (enabled:false). It reuses ONE DOM node and rebuilds its content only
  // when the hovered element or property changes (so there's no per-frame work
  // and no flicker); the caret is followed via left/top, while the fade+scale is
  // a pure CSS transition. One card per hover ⇒ cost is independent of dataset
  // size, even at 118 points.
  const tooltipExternal = (context) => {
    const { chart, tooltip } = context;
    const wrap = chart.canvas.parentNode;
    if (!wrap) return;
    let tip = document.getElementById('trend-tooltip');
    if (!tip) { tip = document.createElement('div'); tip.id = 'trend-tooltip'; wrap.appendChild(tip); }
    if (!tooltip || tooltip.opacity === 0 || !tooltip.dataPoints || !tooltip.dataPoints.length) {
      tip.classList.remove('is-visible');                 // fade out, keep the node (no flicker on re-entry)
      return;
    }
    const idx = tooltip.dataPoints[0].dataIndex;
    if (tip._idx !== idx || tip._prop !== prop) {          // rebuild only on change
      tip._idx = idx; tip._prop = prop;
      tip.innerHTML = buildTrendCard(dataEls[idx], prop);
    }
    const cw = wrap.clientWidth, ch = wrap.clientHeight;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = tooltip.caretX + 16;
    if (x + tw > cw - 6) x = tooltip.caretX - tw - 16;     // flip left near the right edge
    let y = tooltip.caretY - th / 2;
    x = Math.max(6, Math.min(x, cw - tw - 6));             // clamp inside the wrap (overflow:hidden)
    y = Math.max(6, Math.min(y, ch - th - 6));
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
    tip.classList.add('is-visible');
  };

  trendChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    plugins: [watermarkPlugin, interactivePointPlugin, crosshairPlugin, progressiveLabels, emptyStatePlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false, // sync paint — keeps pan/zoom instant (no tween lag)
      interaction: { mode: 'index', intersect: false },
      transitions: { active: { animation: { duration: 140, easing: 'easeOutQuad' } } },
      onHover: (evt) => {
        const canvas = document.getElementById('trend-chart');
        const hit = trendHitFromEvent(trendChart, evt);
        if (canvas) canvas.style.cursor = hit ? 'pointer' : 'crosshair';
        const next = hit ? hit.index : null;
        if (trendChart && trendChart.$trendHoverIndex !== next) {
          trendChart.$trendHoverIndex = next;
          trendChart.$trendHoverSince = Number.isFinite(next) ? performance.now() : 0;
          trendChart.update('none');
        }
      },
      onClick: (evt) => {
        const canvas = document.getElementById('trend-chart');
        if (canvas && canvas._trendSuppressClick) return;
        const hit = trendHitFromEvent(trendChart, evt, 22);
        if (hit) navigateTrendElement(hit, evt.native || evt);
      },
      layout: { padding: { left: 0, right: 0, top: 4, bottom: 0 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,                 // canvas tooltip off — the external card renders instead
          external: tooltipExternal,
          // One dataPoint per index drives the card. Keep the bridge from adding a
          // phantom point at real anchors, so a missing element resolves cleanly.
          filter: item => {
            if (item.dataset && item.dataset.isMissingBridge) {
              const im = item.dataset._isMissing;
              return !!(im && im[item.dataIndex]);
            }
            return item.parsed.y != null;
          }
        },
        zoom: {
          // X is what you navigate; Y auto-fits to the visible slice (afterDataLimits
          // below). The Y-axis gutter is reserved for manual Y scaling, so onPanStart
          // rejects pans that begin there. Stays anchored to the data via limits.
          pan:  { enabled: true, mode: 'x', threshold: 5,
                  onPanStart: c => !(c && c.point && trendChart && c.point.x < trendChart.chartArea.left),
                  onPan: () => { clampTrendViewport(); applyAutoY(); updateNavWindow(); scheduleTrendStatsUpdate(); },
                  onPanComplete: () => { clampTrendViewport(); showReset(); applyAutoY(); updateNavWindow(); updateTrendStatsFromChart(); saveTrendState('pan'); } },
          zoom: { wheel: { enabled: true, speed: 0.1 }, pinch: { enabled: true }, mode: 'x',
                  onZoom: () => { clampTrendViewport(); applyAutoY(); updateNavWindow(); scheduleTrendStatsUpdate(); },
                  onZoomComplete: () => { clampTrendViewport(); showReset(); applyAutoY(); updateNavWindow(); updateTrendStatsFromChart(); saveTrendState('zoom'); } },
          limits: { x: zoomXLimits }
        }
      },
      scales: {
        x: {
          min: 0,
          max: xLimitMax,
          bounds: 'data',
          offset: false,             // edge-clamped: first/last visible points hug the frame
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { size: big ? 9 : 11 },
            maxRotation: big ? 90 : 0,
            autoSkip: true,           // adaptive: more element labels surface as you zoom in
            autoSkipPadding: 8
          }
        },
        y: {
          // Y range is driven by applyAutoY() (auto-fit to the visible X slice, +8%
          // padding) or by manual Y-axis dragging — see those handlers. Declarative
          // config stays minimal so those imperatively-set min/max win cleanly.
          title: { display: true, text: unit ? `${trendPropLabel(prop)} (${unit})` : trendPropLabel(prop), color: textColor, font: { size: 11 } },
          grid: { color: gridColor },
          ticks: { color: textColor }
        }
      }
    }
  });
  trendChart.$trendElements = dataEls;
  trendChart.$trendProp = prop;
  trendChart.$trendFilter = filter;
  trendChart.$trendBridge = bridge;
  trendChart.$trendIsMissing = isMissing;
  fitTrendXToData('none');

  // Double-click anywhere on the plot resets the view (familiar zoom gesture).
  ctx.canvas.ondblclick = () => resetTrendZoom();

  // Nav hint + reset button start fresh on every (re)render.
  const hintEl = document.getElementById('trend-nav-hint');
  if (hintEl) hintEl.textContent = lang === 'pt'
    ? 'scroll: zoom · arraste: mover · 2 cliques: resetar'
    : 'scroll: zoom · drag: pan · double-click: reset';
  const resetEl = document.getElementById('trend-reset');
  if (resetEl) { resetEl.hidden = true; resetEl.title = lang === 'pt' ? 'Restaurar / ajustar aos dados' : 'Reset / fit to data'; }
  const autoEl = document.getElementById('trend-auto');
  if (autoEl) autoEl.title = lang === 'pt' ? 'Escala Y automática (clique p/ alternar)' : 'Auto Y-scale (click to toggle)';

  // Bottom navigator (overview minimap) + physical navigation. The minimap
  // mirrors the full series; its window mirrors the main viewport and drives it
  // back — a two-way "camera" with momentum and eased jumps.
  renderTrendNavigator(labels, values, color, isDark);
  wireTrendNavigator();
  wireMainPanMomentum();
  wireManualYScale();
  wireTrendPointNavigation();
  if (!restoreTrendViewportIfNeeded(prop, filter)) applyAutoY();  // initial vertical fit to the full range
  updateAutoBtn();
  requestAnimationFrame(updateNavWindow);   // after layout settles

  // Drop any lingering tooltip + cache so the next hover rebuilds with the new
  // property / language / theme rather than showing a stale card.
  const _tip = document.getElementById('trend-tooltip');
  if (_tip) { _tip._idx = -1; _tip._prop = null; _tip.classList.remove('is-visible'); }

  updateTrendCaption(prop, dataEls);
}

// ─── TRENDS NAVIGATOR (overview minimap + range selector) ──────────────────

// Maps a client X (screen px) to a fractional data index on the minimap.
function trendNavIndexFromClientX(clientX) {
  if (!trendNavChart) return 0;
  const ov = document.getElementById('trend-nav-overlay');
  return trendNavChart.scales.x.getValueForPixel(clientX - ov.getBoundingClientRect().left);
}

// The single choke-point for "move the camera": set the main chart's visible X
// range (instant) and reflect it in the reset button + navigator window.
function setTrendXRange(min, max) {
  if (!trendChart) return;
  const range = clampTrendXRange(min, max, trendChart);
  const full = trendFullXBounds(trendChart);
  setChartXRange(trendChart, range.min, range.max, 'none');
  const rb = document.getElementById('trend-reset');
  if (rb) rb.hidden = (range.min <= full.min + 0.01 && range.max >= full.max - 0.01);
  applyAutoY();
  updateNavWindow();
  scheduleTrendStatsUpdate();
}

// Auto-fit the Y axis to the values inside the *current* visible X range, with
// 8% padding (so points/labels aren't clipped). The single source of truth for
// "the curve should breathe to fill the height". No-op while auto is OFF.
function applyAutoY() {
  if (!trendChart || !trendAutoY) return;
  // arr is the REAL series only (datasets[0]); the dashed bridge never influences
  // the scale. Only finite numbers count — null/undefined/NaN are skipped, so
  // missing data can never collapse or break the Y range.
  const sx = trendChart.scales.x, arr = trendChart.data.datasets[0].data;
  const lo = Math.max(0, Math.floor(sx.min)), hi = Math.min(arr.length - 1, Math.ceil(sx.max));
  const scan = (from, to) => {
    let mn = Infinity, mx = -Infinity;
    for (let i = from; i <= to; i++) {
      const v = arr[i];
      if (v == null || !Number.isFinite(v)) continue;
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    return mn === Infinity ? null : { mn, mx };
  };
  const bounds = scan(lo, hi) || scan(0, arr.length - 1);
  if (!bounds) return;                                   // nothing finite to fit — leave Y untouched
  let { mn, mx } = bounds;
  let pad = (mx - mn) * 0.08; if (!pad) pad = Math.abs(mx) * 0.08 || 1;
  if (!Number.isFinite(pad)) pad = 1;
  trendChart.options.scales.y.min = mn - pad;
  trendChart.options.scales.y.max = mx + pad;
  trendChart.update('none');
}

// Positions the navigator window + side masks to mirror the main viewport.
function updateNavWindow() {
  if (!trendChart || !trendNavChart) return;
  const win = document.getElementById('trend-nav-window');
  const ml = document.getElementById('trend-nav-mask-l');
  const mr = document.getElementById('trend-nav-mask-r');
  const ov = document.getElementById('trend-nav-overlay');
  if (!win || !ov) return;
  const W = ov.clientWidth;
  const nx = trendNavChart.scales.x, sx = trendChart.scales.x;
  let l = Math.max(0, Math.min(W, nx.getPixelForValue(sx.min)));
  let r = Math.max(0, Math.min(W, nx.getPixelForValue(sx.max)));
  if (r - l < 6) r = Math.min(W, l + 6);
  win.style.left = l + 'px';
  win.style.width = (r - l) + 'px';
  if (ml) ml.style.width = l + 'px';
  if (mr) { mr.style.left = r + 'px'; mr.style.width = Math.max(0, W - r) + 'px'; }
}

function cancelTrendMomentum() { if (trendNavRAF) cancelAnimationFrame(trendNavRAF); trendNavRAF = null; }

// easeOutCubic glide of the main X range toward a target (minimap taps).
function easeTrendXRange(tMin, tMax, dur) {
  cancelTrendMomentum();
  const sx = trendChart.scales.x, fMin = sx.min, fMax = sx.max, t0 = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  (function step(now) {
    const t = Math.min(1, (now - t0) / (dur || 220)), e = ease(t);
    setTrendXRange(fMin + (tMin - fMin) * e, fMax + (tMax - fMax) * e);
    if (t < 1) trendNavRAF = requestAnimationFrame(step);
  })(performance.now());
}

// Inertia after flinging the navigator window: keep gliding with decay.
function startNavMomentum(samples) {
  if (!samples || samples.length < 2) return;
  const a = samples[0], b = samples[samples.length - 1], dt = (b.t - a.t) || 16;
  let v = (b.c - a.c) / dt * 16;                 // index per ~frame
  if (Math.abs(v) < 0.05) return;
  const N = trendChart.data.labels.length;
  (function step() {
    const sx = trendChart.scales.x, w = sx.max - sx.min;
    let min = sx.min + v, max = sx.max + v;
    if (min < 0) { min = 0; max = w; v = 0; }
    if (max > N - 1) { max = N - 1; min = N - 1 - w; v = 0; }
    setTrendXRange(min, max);
    v *= 0.9;
    if (Math.abs(v) > 0.03) trendNavRAF = requestAnimationFrame(step);
  })();
}

// (Re)builds the minimap chart mirroring the full series, sans axes/tooltips.
function renderTrendNavigator(labels, values, color, isDark) {
  const cv = document.getElementById('trend-nav-chart');
  if (!cv || !window.Chart) return;
  if (trendNavChart) { trendNavChart.destroy(); trendNavChart = null; }
  const xLimitMax = Math.max(0, labels.length - 1);
  const { bridge, hasReal } = buildTrendBridge(values);
  const missingCount = values.reduce((n, v) => n + ((v == null || !Number.isFinite(v)) ? 1 : 0), 0);
  const navDatasets = [{
    data: values, borderColor: color, borderWidth: 1, pointRadius: 0,
    backgroundColor: c => {
      const { ctx: cx, chartArea } = c.chart;
      if (!chartArea) return color + '14';
      const g = cx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      g.addColorStop(0, color + '33'); g.addColorStop(1, color + '00');
      return g;
    },
    fill: true, tension: 0.35, spanGaps: false
  }];
  if (missingCount && hasReal) {                  // mirror the dashed bridge so the overview stays continuous too
    navDatasets.push({
      data: bridge,
      borderColor: color + (isDark ? '88' : '77'),
      borderWidth: 1, borderDash: [4, 4],
      pointRadius: 0, fill: false, tension: 0.35, spanGaps: false
    });
  }
  trendNavChart = new Chart(cv.getContext('2d'), {
    type: 'line',
    data: { labels, datasets: navDatasets },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      events: [],                                 // minimap itself is non-interactive
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false, offset: false, min: 0, max: xLimitMax, bounds: 'data' },
        y: { display: false, grace: '6%' }
      },
      layout: { padding: 0 }
    }
  });
}

// Wires the navigator overlay once: drag window = pan, drag handles = resize,
// tap a dimmed mask = eased jump. Pointer capture + window-level listeners keep
// the drag alive even if the cursor leaves the strip.
function wireTrendNavigator() {
  if (trendNavWired) return;
  const ov = document.getElementById('trend-nav-overlay');
  if (!ov) return;
  trendNavWired = true;
  let mode = null, startX = 0, startMin = 0, startMax = 0, samples = [];

  const move = e => {
    if (!mode || !trendChart) return;
    const N = trendChart.data.labels.length;
    const d = trendNavIndexFromClientX(e.clientX) - trendNavIndexFromClientX(startX);
    if (mode === 'pan') {
      const w = startMax - startMin; let min = startMin + d, max = startMax + d;
      if (min < 0) { min = 0; max = w; } if (max > N - 1) { max = N - 1; min = N - 1 - w; }
      setTrendXRange(min, max);
      samples.push({ t: performance.now(), c: (min + max) / 2 }); if (samples.length > 6) samples.shift();
    } else if (mode === 'l') {
      setTrendXRange(Math.min(startMin + d, startMax - 2), startMax);
    } else if (mode === 'r') {
      setTrendXRange(startMin, Math.max(startMax + d, startMin + 2));
    }
  };
  const up = e => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    try { ov.releasePointerCapture(e.pointerId); } catch (_) {}
    if (mode === 'pan') startNavMomentum(samples);
    saveTrendState('navigator');
    mode = null;
  };
  ov.addEventListener('pointerdown', e => {
    if (!trendChart) return;
    cancelTrendMomentum();
    startX = e.clientX; startMin = trendChart.scales.x.min; startMax = trendChart.scales.x.max; samples = [];
    const t = e.target;
    if (t.classList.contains('trend-nav-handle')) {
      mode = t.dataset.edge === 'l' ? 'l' : 'r';
    } else if (t.closest('#trend-nav-window')) {
      mode = 'pan';
    } else {
      // tap on the dimmed area → glide the viewport to be centred there
      const N = trendChart.data.labels.length, w = startMax - startMin;
      let c = trendNavIndexFromClientX(e.clientX), min = c - w / 2, max = c + w / 2;
      if (min < 0) { min = 0; max = w; } if (max > N - 1) { max = N - 1; min = N - 1 - w; }
      easeTrendXRange(min, max, 240);
      return;
    }
    e.preventDefault();
    try { ov.setPointerCapture(e.pointerId); } catch (_) {}
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}

// Adds inertia to the MAIN plot's drag-pan: we passively track pointer velocity
// (the zoom plugin owns the live drag) and, on release, keep panning with decay.
function wireMainPanMomentum() {
  const cv = document.getElementById('trend-chart');
  if (!cv || cv._momWired) return;
  cv._momWired = true;
  let down = false, last = null, vx = 0, startX = 0, moved = false;
  cv.addEventListener('pointerdown', e => {
    cancelTrendMomentum();
    // Y-axis gutter is reserved for manual Y scaling — no X momentum there.
    if (trendChart && e.offsetX < trendChart.chartArea.left) { down = false; return; }
    down = true; last = e.clientX; startX = e.clientX; vx = 0; moved = false;
  });
  cv.addEventListener('pointermove', e => {
    if (!down || last == null) return;
    if (Math.abs(e.clientX - startX) > 6) moved = true;
    vx = e.clientX - last; last = e.clientX;
  });
  const end = () => {
    if (!down) return; down = false;
    if (moved) {
      cv._trendSuppressClick = true;
      setTimeout(() => { cv._trendSuppressClick = false; }, 80);
    }
    if (!trendChart || typeof trendChart.pan !== 'function' || Math.abs(vx) < 3) return;
    (function step() {            // X-only inertia (Y auto-scales to match)
      if (Math.abs(vx) < 0.4) { applyAutoY(); updateNavWindow(); saveTrendState('momentum'); return; }
      try { trendChart.pan({ x: vx }, undefined, 'none'); } catch (_) {}
      clampTrendViewport();
      applyAutoY(); updateNavWindow();
      vx *= 0.9;
      trendNavRAF = requestAnimationFrame(step);
    })();
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
}

function wireTrendPointNavigation() {
  const cv = document.getElementById('trend-chart');
  if (!cv || cv._trendNavWired) return;
  cv._trendNavWired = true;
  cv.tabIndex = 0;
  cv.setAttribute('role', 'application');
  cv.setAttribute('aria-describedby', 'trend-a11y-status');
  cv.setAttribute('aria-label', trendLang() === 'pt'
    ? 'Grafico de tendencias periodicas. Use as setas para escolher um elemento e Enter para abrir.'
    : 'Periodic trends chart. Use arrow keys to choose an element and Enter to open it.');
  ensureTrendA11yStatus();

  cv.addEventListener('auxclick', e => {
    if (e.button !== 1 || !trendChart) return;
    const rect = cv.getBoundingClientRect();
    const hit = trendHitFromEvent(trendChart, { x: e.clientX - rect.left, y: e.clientY - rect.top, native: e }, 24);
    if (!hit) return;
    e.preventDefault();
    navigateTrendElement(hit, e);
  });

  cv.addEventListener('mouseleave', () => {
    if (!trendChart) return;
    trendChart.$trendHoverIndex = null;
    cv.style.cursor = 'crosshair';
    trendChart.update('none');
  });

  cv.addEventListener('focus', () => {
    if (!trendChart || !trendChart.$trendElements?.length) return;
    const sx = trendChart.scales.x;
    const start = Math.max(0, Math.min(trendChart.$trendElements.length - 1, Math.round(sx.min || 0)));
    updateTrendKeyboardFocus(Number.isFinite(trendChart.$trendKeyboardIndex) ? trendChart.$trendKeyboardIndex : start, true);
  });

  cv.addEventListener('blur', () => {
    if (!trendChart) return;
    trendChart.$trendKeyboardIndex = null;
    trendChart.update('none');
  });

  cv.addEventListener('keydown', e => {
    if (!trendChart || !trendChart.$trendElements?.length) return;
    const n = trendChart.$trendElements.length;
    let i = Number.isFinite(trendChart.$trendKeyboardIndex)
      ? trendChart.$trendKeyboardIndex
      : Math.max(0, Math.min(n - 1, Math.round(trendChart.scales.x.min || 0)));
    let next = i;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i + 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else if (e.key === 'Enter') {
      e.preventDefault();
      navigateTrendElement({ index: i, el: trendChart.$trendElements[i] }, e);
      return;
    } else {
      return;
    }
    e.preventDefault();
    next = Math.max(0, Math.min(n - 1, next));
    updateTrendKeyboardFocus(next, true);
    const sx = trendChart.scales.x;
    if (next < sx.min || next > sx.max) {
      const width = sx.max - sx.min;
      setTrendXRange(next - width / 2, next + width / 2);
    }
  });
}

// Reflects the auto-scale state on the "AUTO" button.
function updateAutoBtn() {
  const b = document.getElementById('trend-auto');
  if (b) b.classList.toggle('is-on', trendAutoY);
}

// Toggles vertical auto-scale. ON → Y fits the visible X range (afterDataLimits
// drives). OFF → freeze Y at its current extent so values stay comparable while
// you pan X. Manual Y-axis dragging also flips this OFF.
function toggleTrendAutoY(force) {
  if (!trendChart) return;
  trendAutoY = (force != null) ? !!force : !trendAutoY;
  if (trendAutoY) {
    applyAutoY();                                                               // refit Y to the visible slice
  } else {
    const y = trendChart.options.scales.y;                                      // freeze the current view
    y.min = trendChart.scales.y.min; y.max = trendChart.scales.y.max;
    trendChart.update('none');
  }
  updateAutoBtn();
  saveTrendState('auto-y');
}

// Manual Y scaling, TradingView-style: drag in the Y-axis gutter to expand /
// compress the vertical scale about its centre. Doing so switches auto OFF
// (re-enable with the AUTO button or a reset).
function wireManualYScale() {
  const cv = document.getElementById('trend-chart');
  if (!cv || cv._yWired) return;
  cv._yWired = true;
  let dragging = false, startY = 0, cMin = 0, cMax = 0;
  cv.addEventListener('pointerdown', e => {
    if (!trendChart || e.offsetX >= trendChart.chartArea.left) return;   // only the Y gutter
    dragging = true; startY = e.clientY;
    cMin = trendChart.scales.y.min; cMax = trendChart.scales.y.max;
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  });
  cv.addEventListener('pointermove', e => {
    if (!dragging) return;
    const center = (cMin + cMax) / 2, half = (cMax - cMin) / 2;
    const nh = Math.max(half * Math.exp((e.clientY - startY) / 160), 1e-9);   // drag down → zoom Y out
    trendAutoY = false;
    trendChart.options.scales.y.min = center - nh;
    trendChart.options.scales.y.max = center + nh;
    trendChart.update('none');
    updateAutoBtn();
  });
  const end = e => {
    if (dragging) {
      dragging = false;
      saveTrendState('manual-y');
      try { cv.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
}

function trendStatsUnit(prop) {
  if (prop === 'en') return 'Pauling';
  return TREND_UNITS[prop] || '';
}

function trendStatDecimals(prop, value) {
  if (prop === 'radius' || prop === 'ionization') return 0;
  if (prop === 'melt' || prop === 'boil') return 1;
  if (prop === 'en') return 2;
  if (prop === 'mass') return 3;
  if (prop === 'density') {
    const a = Math.abs(value || 0);
    if (a < 0.01) return 5;
    if (a < 1) return 4;
    return 3;
  }
  return 2;
}

function formatTrendStatValue(value, prop) {
  if (value == null || !Number.isFinite(value)) return '—';
  const unit = trendStatsUnit(prop);
  const s = fmtTrendNum(value, trendStatDecimals(prop, value));
  return unit ? `${s} ${unit}` : s;
}

function calculateTrendStats(dataEls, prop, chart) {
  const n = dataEls ? dataEls.length : 0;
  if (!n) return { prop, unit: trendStatsUnit(prop), count: 0, totalVisible: 0 };
  let lo = 0, hi = n - 1;
  if (chart && chart.scales && chart.scales.x) {
    const sx = chart.scales.x;
    lo = Math.max(0, Math.ceil((sx.min == null ? 0 : sx.min) - 1e-6));
    hi = Math.min(n - 1, Math.floor((sx.max == null ? n - 1 : sx.max) + 1e-6));
  }
  const points = [];
  for (let i = lo; i <= hi; i++) {
    const e = dataEls[i];
    const v = trendNum(e, prop);
    if (v != null && Number.isFinite(v)) points.push({ e, v, index: i });
  }
  if (!points.length) return { prop, unit: trendStatsUnit(prop), count: 0, totalVisible: Math.max(0, hi - lo + 1), lo, hi };
  points.sort((a, b) => a.v - b.v);
  const values = points.map(p => p.v);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mid = Math.floor(values.length / 2);
  const median = values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
  const lowest = points[0];
  const highest = points[points.length - 1];
  return {
    prop,
    unit: trendStatsUnit(prop),
    count: points.length,
    totalVisible: Math.max(0, hi - lo + 1),
    highest,
    lowest,
    average: sum / points.length,
    median,
    range: highest.v - lowest.v,
    lo,
    hi
  };
}

function renderTrendStatsUI(stats) {
  const statsEl = document.getElementById('trend-caption-stats');
  if (!statsEl) return;
  statsEl.setAttribute('aria-live', 'polite');
  const lang = trendLang();
  const L = lang === 'pt'
    ? { summary: 'Resumo estatístico', analyzed: 'Elementos analisados', highest: 'Maior', lowest: 'Menor', average: 'Média', median: 'Mediana', range: 'Amplitude', noData: 'Sem valores medidos no intervalo visível' }
    : { summary: 'Statistical summary', analyzed: 'Elements analyzed', highest: 'Highest', lowest: 'Lowest', average: 'Average', median: 'Median', range: 'Range', noData: 'No measured values in the visible range' };
  const sig = stats && stats.count
    ? [lang, stats.prop, stats.lo, stats.hi, stats.count, stats.highest.index, stats.lowest.index, stats.average, stats.median, stats.range].join('|')
    : [lang, stats && stats.prop, 0, stats && stats.lo, stats && stats.hi].join('|');
  if (statsEl._trendStatsSig === sig) return;
  statsEl._trendStatsSig = sig;
  if (!stats || !stats.count) {
    statsEl.innerHTML =
      `<div class="trend-stats-grid trend-stats-empty" role="status" aria-label="${trendEscapeHtml(L.summary)}">` +
        `<div class="trend-stat-card trend-stat-count">` +
          `<span class="trend-stat-k">${trendEscapeHtml(L.analyzed)}</span>` +
          `<strong class="trend-stat-main">0</strong>` +
        `</div>` +
        `<div class="trend-stat-card trend-stat-message">${trendEscapeHtml(L.noData)}</div>` +
      `</div>`;
    return;
  }
  const card = (label, main, sub, cls) =>
    `<div class="trend-stat-card ${cls || ''}">` +
      `<span class="trend-stat-k">${trendEscapeHtml(label)}</span>` +
      `<strong class="trend-stat-main">${trendEscapeHtml(main)}</strong>` +
      (sub ? `<span class="trend-stat-sub">${trendEscapeHtml(sub)}</span>` : '') +
    `</div>`;
  statsEl.innerHTML =
    `<div class="trend-stats-grid" role="group" aria-label="${trendEscapeHtml(L.summary)}">` +
      card(L.analyzed, stats.count, '', 'trend-stat-count') +
      card(L.highest, elName(stats.highest.e), formatTrendStatValue(stats.highest.v, stats.prop), 'trend-stat-hi') +
      card(L.lowest, elName(stats.lowest.e), formatTrendStatValue(stats.lowest.v, stats.prop), 'trend-stat-lo') +
      card(L.average, formatTrendStatValue(stats.average, stats.prop), '', 'trend-stat-avg') +
      card(L.median, formatTrendStatValue(stats.median, stats.prop), '', 'trend-stat-median') +
      card(L.range, formatTrendStatValue(stats.range, stats.prop), '', 'trend-stat-range') +
    `</div>`;
}

function updateTrendStatsFromChart() {
  if (!trendChart || !trendChart.$trendElements) return;
  renderTrendStatsUI(calculateTrendStats(trendChart.$trendElements, trendChart.$trendProp || 'en', trendChart));
}

function scheduleTrendStatsUpdate() {
  if (typeof requestAnimationFrame !== 'function') { updateTrendStatsFromChart(); return; }
  if (trendStatsRAF) return;
  trendStatsRAF = requestAnimationFrame(() => {
    trendStatsRAF = null;
    updateTrendStatsFromChart();
  });
}

// Scientific insight panel under the chart: a curated, structured explainer for
// the selected property (definition · periodic trend · scientific reason ·
// educational takeaway) that adapts a context line to the active filter, plus
// the live quantitative summary (highest/lowest/average/…). Bilingual (EN/PT);
// all prose is curated (see TREND_INSIGHTS), never generated at runtime.
function updateTrendCaption(prop, dataEls) {
  const descEl = document.getElementById('trend-caption-desc');
  const captionEl = document.getElementById('trend-caption');
  if (!descEl || !captionEl) return;

  const lang = trendLang();
  const info = (TREND_INSIGHTS[prop] || {})[lang] || (TREND_INSIGHTS[prop] || {}).en || {};
  const esc = (typeof trendEscapeHtml === 'function')
    ? trendEscapeHtml
    : (s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])));

  // (1) Definition — the lead line (keeps the accent-bordered "quote" style).
  descEl.textContent = info.def || '';

  // (2) Structured insight block — created once, kept between the lead and the
  //     stats grid so it works on both trends.html and trends.pt.html.
  let insightEl = document.getElementById('trend-insight');
  if (!insightEl) {
    insightEl = document.createElement('div');
    insightEl.id = 'trend-insight';
    captionEl.insertBefore(insightEl, document.getElementById('trend-caption-stats') || null);
  }
  const L = lang === 'pt'
    ? { trend: 'Tendência periódica', why: 'Por que acontece' }
    : { trend: 'Periodic trend', why: 'Why it happens' };

  // Filter-aware context: which sub-trend is the current selection actually
  // showing? Period → left/right; group → down a column; f-block → the series.
  const fEl = document.getElementById('trend-group');
  const fVal = fEl ? fEl.value : 'all';
  const fLabel = fEl ? ((Array.from(fEl.options).find(o => o.value === fVal) || {}).text || '') : '';
  let ctxNote = '';
  if (fVal === 'lanthanides' || fVal === 'actinides') ctxNote = info.fblock || '';
  else if (fVal.indexOf('fam-') === 0) {
    // Column-like families follow the down-a-group trend; block-like families
    // (transition/post-transition/metalloid/reactive nonmetal) span the table
    // with no single clean trend, so they get no context line.
    const fam = fVal.slice(4);
    if (fam === 'alkali' || fam === 'alkaline' || fam === 'halogen' || fam === 'noble') ctxNote = info.group || '';
  }
  else if (fVal && fVal.charAt(0) === 'p' && fVal !== 'all') ctxNote = info.period || '';
  else if (fVal && fVal.charAt(0) === 'g') ctxNote = info.group || '';   // 'all' → no context line

  let html = '';
  if (info.trend || info.why) {
    html += '<div class="trend-insight-grid">';
    if (info.trend) html += `<div class="trend-insight-block"><span class="trend-insight-k">${esc(L.trend)}</span><p class="trend-insight-t">${esc(info.trend)}</p></div>`;
    if (info.why)   html += `<div class="trend-insight-block"><span class="trend-insight-k">${esc(L.why)}</span><p class="trend-insight-t">${esc(info.why)}</p></div>`;
    html += '</div>';
  }
  if (ctxNote) {
    html += `<div class="trend-insight-context"><span class="trend-insight-chip">${esc(fLabel)}</span><span class="trend-insight-ctext">${esc(ctxNote)}</span></div>`;
  }
  if (info.interp) html += `<p class="trend-insight-interp">${esc(info.interp)}</p>`;
  insightEl.innerHTML = html;

  // (3) Live quantitative companion (highest / lowest / average / median / range).
  renderTrendStatsUI(calculateTrendStats(dataEls, prop, trendChart));
}

// ─── TRENDS EXPORT — BRANDED PNG ───────────────────────────────────────────
// Composites the chart onto a larger canvas with header (title + subtitle)
// and footer (atomurus.com watermark + metadata). This makes the downloaded
// image shareable — not just a "screenshot of the website" but a self-
// contained visualization carrying its own context.
function exportTrendPNG() {
  if (!trendChart) return;
  const chartCanvas = document.getElementById('trend-chart');
  const sourceUrl   = chartCanvas.toDataURL('image/png');

  const prop   = document.getElementById('trend-prop').value;
  const filter = document.getElementById('trend-group').value;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  // The unified filter dropdown carries both periods and groups — its <option>
  // text is the human-readable label we want in the subtitle.
  const filterLabel = (Array.from(document.getElementById('trend-group').options).find(o => o.value === filter) || {}).text || filter;
  const subtitle    = trendPropLabel(prop);
  const filterLine  = filterLabel;

  const W = 1280, H = 800;
  const PAD = 48;
  const HEADER_H = 110;
  const FOOTER_H = 60;
  const CHART_TOP = PAD + HEADER_H;
  const CHART_W = W - 2 * PAD;
  const CHART_H = H - CHART_TOP - FOOTER_H - PAD;

  const bg     = isDark ? '#0E0D0C' : '#F0EDE6';
  const card   = isDark ? '#161513' : '#FFFEFC';
  const border = isDark ? '#2A2824' : '#DDD8CE';
  const text1  = isDark ? '#F2EFE9' : '#12100E';
  const text2  = isDark ? '#928C84' : '#5A5550';
  const text3  = isDark ? '#52504A' : '#9A948C';
  const accent = isDark ? '#34A872' : '#1E6A50';

  const out = document.createElement('canvas');
  out.width  = W; out.height = H;
  const c = out.getContext('2d');

  // Background gradient
  const grd = c.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, bg);
  grd.addColorStop(1, card);
  c.fillStyle = grd;
  c.fillRect(0, 0, W, H);

  // Header: logo mark + brand name (atomurus.com lives ONLY in the footer to
  // avoid the previous overlap bug where measureText() ran before fonts loaded).
  c.fillStyle = accent;
  c.beginPath(); c.arc(PAD + 18, PAD + 22, 16, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff';
  c.beginPath(); c.arc(PAD + 18, PAD + 22, 4, 0, Math.PI * 2); c.fill();
  // Three Bohr-like ellipses inside the mark
  c.strokeStyle = '#fff'; c.lineWidth = 1.5;
  for (let k = 0; k < 3; k++) {
    c.save();
    c.translate(PAD + 18, PAD + 22);
    c.rotate(k * Math.PI / 3);
    c.beginPath(); c.ellipse(0, 0, 14, 6, 0, 0, Math.PI * 2); c.stroke();
    c.restore();
  }

  c.fillStyle = text1;
  c.font = '600 22px "DM Serif Display", serif';
  c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText('Atomurus', PAD + 44, PAD + 22);

  // Chart title (translated)
  c.fillStyle = text1;
  c.font = '700 32px "DM Serif Display", serif';
  c.fillText(_T('ptable.trChartTitle', 'Periodic Trends'), PAD, PAD + 68);

  // Subtitle: properties + filter (group + period)
  c.fillStyle = text2;
  c.font = '500 14px "DM Sans", sans-serif';
  c.fillText(`${subtitle}  ·  ${filterLine}`, PAD, PAD + 96);

  // Card background behind chart
  c.fillStyle = card;
  c.strokeStyle = border;
  c.lineWidth = 1;
  const r = 14;
  const cx = PAD - 8, cy = CHART_TOP - 8, cw = CHART_W + 16, ch = CHART_H + 16;
  c.beginPath();
  c.moveTo(cx + r, cy);
  c.lineTo(cx + cw - r, cy);
  c.quadraticCurveTo(cx + cw, cy, cx + cw, cy + r);
  c.lineTo(cx + cw, cy + ch - r);
  c.quadraticCurveTo(cx + cw, cy + ch, cx + cw - r, cy + ch);
  c.lineTo(cx + r, cy + ch);
  c.quadraticCurveTo(cx, cy + ch, cx, cy + ch - r);
  c.lineTo(cx, cy + r);
  c.quadraticCurveTo(cx, cy, cx + r, cy);
  c.closePath();
  c.fill(); c.stroke();

  // Footer: brand + element count + date
  const dateStr = new Date().toISOString().slice(0, 10);
  c.fillStyle = text3;
  c.font = '500 11px "DM Mono", monospace';
  c.textAlign = 'left';
  c.fillText(_T('ptable.trChartFooter', 'Generated by Atomurus · atomurus.com'), PAD, H - PAD + 4);
  c.textAlign = 'right';
  const elCount = (trendChart && trendChart.data && (trendChart.data.labels || trendChart.data.datasets[0].data)).length || 0;
  c.fillText(`n=${elCount}  ·  ${dateStr}`, W - PAD, H - PAD + 4);

  // Draw the chart canvas into the card area. Use an Image so we can scale up
  // from the source bitmap (toDataURL preserves the chart layout exactly).
  const img = new Image();
  img.onload = () => {
    c.drawImage(img, PAD, CHART_TOP, CHART_W, CHART_H);
    const link = document.createElement('a');
    link.href = out.toDataURL('image/png');
    link.download = `atomurus-trends-${prop}-${filter}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  img.onerror = () => {
    // Fallback: download just the chart canvas if compositing fails
    const link = document.createElement('a');
    link.href = sourceUrl;
    link.download = `atomurus-trends-${prop}-${filter}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  img.src = sourceUrl;
}

// Exports the rendered dataset as CSV (Z, Symbol, Name, value).
function exportTrendCSV() {
  const prop   = document.getElementById('trend-prop').value;
  const filter = document.getElementById('trend-group').value;
  const dataEls = trendFilterElements(filter);
  const csvEscape = s => (s == null ? '' : (/[",\n]/.test(String(s)) ? '"' + String(s).replace(/"/g, '""') + '"' : String(s)));

  // null → empty cell, so missing data reads as blank rather than a fake 0.
  const cell = v => (v == null ? '' : v);
  const header = ['Z', 'Symbol', 'Name', trendPropLabel(prop)];
  const rows = dataEls.map(e => [e.z, e.sym, elName(e), cell(trendNum(e, prop))]);
  const csv = [header, ...rows].map(r => r.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `atomurus-trends-${prop}-${filter}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

