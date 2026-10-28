/* ─────────────────────────────────────────────────────────────
 * Atomurus — Periodic Table · export
 * PDF of an element and PNG/PDF of the table.
 * Moved unchanged out of periodic-table.js (prompt 24). Classic script: it
 * shares the global scope with periodic-table.js and must load AFTER it.
 * Loaded by: on demand, by the export stubs in periodic-table.js (first click on a download button)
 * ─────────────────────────────────────────────────────────── */

// ════════════ PDF — ELEMENT ════════════
function downloadElementPDF() { downloadElement('pdf'); }

// Renders a self-contained element card to canvas (NOT a screenshot of the modal).
// Includes all properties, configuration, Bohr model and atomurus.com branding.
function renderElementCard(el) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const extra  = getExtra(el.z);
  const extra2 = getExtra2(el.z);
  const PAL = isDark ? {
    bg:'#111210', surface:'#1A1918', border:'#2E2C29', borderSoft:'#26241F',
    fg:'#F0EDE8', fg2:'#9A948C', fg3:'#6B665E', accent:'#34A872',
    callout:'rgba(52,168,114,.10)'
  } : {
    bg:'#FFFEFC', surface:'#F6F3ED', border:'#DDD8CE', borderSoft:'#E8E3DB',
    fg:'#1A1814', fg2:'#5A5550', fg3:'#9A948C', accent:'#1E6A50',
    callout:'rgba(30,106,80,.07)'
  };
  const CAT_BG = isDark
    ? { nonmetal:'#1A3A1A', noble:'#332E00', alkali:'#2E1010', alkaline:'#2E1E00',
        metalloid:'#1A1430', polyatomic:'#0C2030', posttrans:'#142010',
        transition:'#201E18', lanthanide:'#280C22', actinide:'#280C14' }
    : { nonmetal:'#D2EDD2', noble:'#FFF0C0', alkali:'#FFD4D4', alkaline:'#FFE4C0',
        metalloid:'#E4DEFF', polyatomic:'#D4ECFA', posttrans:'#E4EED8',
        transition:'#EAE5DC', lanthanide:'#F4DCED', actinide:'#F0DDE4' };
  const CAT_TX = isDark
    ? { nonmetal:'#7ECC7E', noble:'#D4AA30', alkali:'#E08080', alkaline:'#E0A860',
        metalloid:'#A898F0', polyatomic:'#70C0E8', posttrans:'#88C868',
        transition:'#B0A888', lanthanide:'#D088C0', actinide:'#D08098' }
    : { nonmetal:'#1E5C1E', noble:'#7A5500', alkali:'#8B1818', alkaline:'#7A4200',
        metalloid:'#3A2680', polyatomic:'#0E4E70', posttrans:'#2E520E',
        transition:'#3E3820', lanthanide:'#680056', actinide:'#6A1830' };

  const S = 2; // 2x scale for retina
  const W = 1200 * S;
  const PAD = 56 * S;
  const HDR_H = 320 * S;
  const COL_GAP = 32 * S;
  const RIGHT_W = 360 * S;
  const LEFT_W = W - PAD*2 - RIGHT_W - COL_GAP;

  // Pre-measure to determine total height
  const tmp = document.createElement('canvas');
  const m = tmp.getContext('2d');
  function wrap(text, font, maxW) {
    m.font = font;
    const words = String(text || '').split(/\s+/);
    const lines = []; let line = '';
    for (var i=0;i<words.length;i++){
      var t = line ? line + ' ' + words[i] : words[i];
      if (m.measureText(t).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }

  const _desc = (typeof elDesc === 'function' ? elDesc(el) : el.desc) || '';
  const descLines = wrap(_desc, 'normal ' + (14*S) + "px 'DM Sans', sans-serif", LEFT_W);
  const ff = (typeof elFunfact === 'function' ? elFunfact(el.z) : extra2.funfact) || '';
  const ffLines = ff ? wrap(ff, 'italic ' + (13*S) + "px 'DM Sans', sans-serif", LEFT_W - 24*S) : [];

  // Section heights
  const SEC_GAP = 22 * S;
  const LBL_H = 22 * S;
  let leftH = 0;
  leftH += SEC_GAP + LBL_H + descLines.length * 19*S; // description
  leftH += SEC_GAP + LBL_H + 18*S;                    // discovery
  leftH += SEC_GAP + LBL_H + 4 * (24*S);              // properties grid (4 rows)
  leftH += SEC_GAP + LBL_H + 32*S;                    // oxidation
  leftH += SEC_GAP + LBL_H + 24*S;                    // econfig
  leftH += SEC_GAP + LBL_H + 32*S;                    // shells
  leftH += SEC_GAP + LBL_H + 32*S;                    // occurrence
  leftH += SEC_GAP + LBL_H + 32*S;                    // apps
  if (ffLines.length) leftH += SEC_GAP + LBL_H + 16*S + ffLines.length * 18*S + 16*S; // funfact callout

  const rightH = RIGHT_W + 40*S; // Bohr + Z label
  const bodyH  = Math.max(leftH, rightH) + PAD;
  const FOOT_H = 56 * S;
  const H = HDR_H + bodyH + FOOT_H;

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, W, H);

  // Header strip — colored by category
  const catBg = CAT_BG[el.cat] || PAL.surface;
  const catTx = CAT_TX[el.cat] || PAL.accent;
  ctx.fillStyle = catBg;
  ctx.fillRect(0, 0, W, HDR_H);

  // Logo (small atom mark) top-left
  (function drawLogo(){
    const cx = PAD + 18*S, cy = PAD + 18*S, r = 14*S;
    ctx.strokeStyle = catTx; ctx.lineWidth = 1.2*S;
    for (let i=0;i<3;i++){
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(i * Math.PI/3);
      ctx.beginPath();
      ctx.ellipse(0,0,r,r*0.45,0,0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = catTx;
    ctx.beginPath(); ctx.arc(cx, cy, 3*S, 0, Math.PI*2); ctx.fill();
    ctx.font = '600 ' + (12*S) + "px 'DM Mono', monospace";
    ctx.fillStyle = catTx;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('ATOMURUS', cx + r + 12*S, cy);
  })();

  // Z (top-right of header)
  ctx.font = "500 " + (16*S) + "px 'DM Mono', monospace";
  ctx.fillStyle = catTx; ctx.globalAlpha = 0.55;
  ctx.textAlign = 'right'; ctx.textBaseline = 'top';
  ctx.fillText('Z ' + el.z, W - PAD, PAD);
  ctx.globalAlpha = 1;

  // Symbol — huge serif
  ctx.font = '400 ' + (180*S) + "px 'DM Serif Display', serif";
  ctx.fillStyle = catTx;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(el.sym, PAD, HDR_H - 70*S);

  // Element name
  ctx.font = '400 ' + (34*S) + "px 'DM Serif Display', serif";
  ctx.fillStyle = catTx;
  ctx.fillText(elName(el), PAD, HDR_H - 28*S);

  // Mass — top-right of header (below Z)
  ctx.textAlign = 'right';
  ctx.font = '500 ' + (10*S) + "px 'DM Mono', monospace";
  ctx.fillStyle = catTx; ctx.globalAlpha = 0.55;
  ctx.fillText(_T('ptable.canvasAtomicMass', 'ATOMIC MASS'), W - PAD, PAD + 30*S);
  ctx.globalAlpha = 1;
  ctx.font = '500 ' + (22*S) + "px 'DM Mono', monospace";
  ctx.fillText(el.mass + ' u', W - PAD, PAD + 50*S);

  // Category badge
  const catLbl = (typeof catName === 'function' ? catName(el) : (CAT_NAMES[el.cat] || el.cat));
  ctx.font = '600 ' + (11*S) + "px 'DM Mono', monospace";
  const cw = ctx.measureText(catLbl.toUpperCase()).width + 24*S;
  const ch = 22*S;
  const cx = W - PAD - cw, cy = HDR_H - 40*S;
  ctx.strokeStyle = catTx; ctx.lineWidth = 1.5*S;
  ctx.beginPath();
  roundRectPath(ctx, cx, cy, cw, ch, ch/2);
  ctx.stroke();
  ctx.fillStyle = catTx;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(catLbl.toUpperCase(), cx + cw/2, cy + ch/2 + 1);

  // ── BODY ──
  let y = HDR_H + PAD;
  const leftX = PAD;

  function sectionLabel(text) {
    ctx.font = '600 ' + (10*S) + "px 'DM Mono', monospace";
    ctx.fillStyle = PAL.fg3;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(text.toUpperCase(), leftX, y);
    // Underline
    ctx.strokeStyle = PAL.borderSoft; ctx.lineWidth = 1*S;
    ctx.beginPath();
    ctx.moveTo(leftX, y + 16*S);
    ctx.lineTo(leftX + LEFT_W, y + 16*S);
    ctx.stroke();
    y += LBL_H;
  }

  // 1. Description
  sectionLabel(_T('ptable.mDescription', 'Descrição'));
  ctx.font = 'normal ' + (14*S) + "px 'DM Sans', sans-serif";
  ctx.fillStyle = PAL.fg;
  descLines.forEach((line) => { ctx.fillText(line, leftX, y); y += 19*S; });
  y += SEC_GAP;

  // 2. Discovery
  sectionLabel(_T('ptable.mDiscovery', 'Descoberta'));
  ctx.font = '500 ' + (14*S) + "px 'DM Sans', sans-serif";
  ctx.fillStyle = PAL.fg;
  ctx.fillText((el.disc || '—') + '  ·  ' + (el.year || '—'), leftX, y);
  y += 18*S + SEC_GAP;

  // 3. Properties grid (2 columns x 4 rows)
  sectionLabel(_T('ptable.mProperties', 'Propriedades'));
  const props = [
    [_T('ptable.mEn',     'Eletronegatividade'), el.en],
    [_T('ptable.mState',  'Estado físico'),      stateName(el.state)],
    [_T('ptable.mPeriod', 'Período'),            el.period],
    [_T('ptable.mGroup',  'Grupo'),              formatElementGroup(el)],
    [_T('ptable.mMelt',   'Ponto de fusão'),     extra.melt],
    [_T('ptable.mBoil',   'Ponto de ebulição'),  extra.boil],
    [_T('ptable.mDensity','Densidade'),          extra2.density],
    [_T('ptable.mRadius', 'Raio atômico'),       extra2.radius],
  ];
  const colW = (LEFT_W - 16*S) / 2;
  for (let i=0;i<props.length;i++){
    const col = i % 2, row = Math.floor(i/2);
    const px = leftX + col * (colW + 16*S);
    const py = y + row * (24*S);
    ctx.font = 'normal ' + (11.5*S) + "px 'DM Sans', sans-serif";
    ctx.fillStyle = PAL.fg2;
    ctx.textAlign = 'left';
    ctx.fillText(props[i][0], px, py);
    ctx.font = '500 ' + (12*S) + "px 'DM Mono', monospace";
    ctx.fillStyle = PAL.fg;
    ctx.textAlign = 'right';
    ctx.fillText(String(props[i][1] == null ? '—' : props[i][1]), px + colW, py);
  }
  y += 4 * (24*S) + SEC_GAP;

  // Helper for chip rows
  function drawChips(items, bg, border, color) {
    let cx2 = leftX, cy2 = y;
    ctx.font = '500 ' + (11*S) + "px 'DM Mono', monospace";
    items.forEach(t => {
      const txt = String(t);
      const cw = ctx.measureText(txt).width + 18*S;
      const ch = 24*S;
      if (cx2 + cw > leftX + LEFT_W) { cx2 = leftX; cy2 += ch + 6*S; }
      ctx.fillStyle = bg;
      roundRect(ctx, cx2, cy2, cw, ch, 6*S);
      ctx.strokeStyle = border; ctx.lineWidth = 1*S;
      roundRectStroke(ctx, cx2, cy2, cw, ch, 6*S);
      ctx.fillStyle = color;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, cx2 + cw/2, cy2 + ch/2 + 1);
      cx2 += cw + 6*S;
    });
    y = cy2 + 32*S;
  }

  // 4. Oxidation states
  sectionLabel(_T('ptable.mOxidation', 'Estados de oxidação'));
  drawChips(
    (extra2.oxidation && extra2.oxidation.length) ? extra2.oxidation : ['—'],
    PAL.surface, PAL.borderSoft, PAL.fg
  );
  y += SEC_GAP - 10*S;

  // 5. Electron configuration
  sectionLabel(_T('ptable.mEconfig', 'Configuração eletrônica'));
  ctx.font = '500 ' + (14*S) + "px 'DM Mono', monospace";
  ctx.fillStyle = PAL.fg;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(extra.econfig || '—', leftX, y);
  y += 24*S + SEC_GAP;

  // 6. Shells
  sectionLabel(_T('ptable.mShells', 'Distribuição por camada'));
  const shellLabels = ['K','L','M','N','O','P','Q'];
  drawChips((extra.shells || []).map((n, i) => shellLabels[i] + ' ' + n), PAL.surface, PAL.borderSoft, PAL.fg);
  y += SEC_GAP - 10*S;

  // 7. Occurrence
  sectionLabel(_T('ptable.mOccurrence', 'Onde é encontrado'));
  var _occ = (typeof elOccurrence === 'function') ? elOccurrence(el.z) : extra2.occurrence;
  drawChips((_occ && _occ.length) ? _occ : ['—'],
    PAL.surface, PAL.borderSoft, PAL.fg2);
  y += SEC_GAP - 10*S;

  // 8. Apps
  sectionLabel(_T('ptable.mApps', 'Aplicações reais'));
  var _apps = (typeof elApps === 'function') ? elApps(el.z) : extra.apps;
  drawChips((_apps && _apps.length) ? _apps : ['—'],
    PAL.surface, PAL.borderSoft, PAL.fg2);
  y += SEC_GAP - 10*S;

  // 9. Fun fact callout
  if (ffLines.length) {
    sectionLabel(_T('ptable.mFunfact', 'Curiosidade'));
    const boxH = ffLines.length * 18*S + 24*S;
    ctx.fillStyle = PAL.callout;
    roundRect(ctx, leftX, y, LEFT_W, boxH, 8*S);
    // Accent stripe
    ctx.fillStyle = PAL.accent;
    ctx.fillRect(leftX, y, 3*S, boxH);
    ctx.font = 'italic ' + (13*S) + "px 'DM Sans', sans-serif";
    ctx.fillStyle = PAL.fg;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    let ty = y + 12*S;
    ffLines.forEach(line => { ctx.fillText(line, leftX + 14*S, ty); ty += 18*S; });
    y += boxH + SEC_GAP;
  }

  // ── RIGHT COLUMN: Bohr model ──
  const rx = W - PAD - RIGHT_W;
  const ry = HDR_H + PAD;
  ctx.font = '600 ' + (10*S) + "px 'DM Mono', monospace";
  ctx.fillStyle = PAL.fg3;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText(_T('ptable.canvasBohrModel', 'MODELO DE BOHR'), rx, ry);

  // Render Bohr to offscreen and composite
  const bSize = RIGHT_W;
  const bCanvas = document.createElement('canvas');
  bCanvas.width = bSize; bCanvas.height = bSize;
  const bCtx = bCanvas.getContext('2d');
  drawBohrInto(bCtx, bSize, bSize, el, extra, isDark);
  ctx.drawImage(bCanvas, rx, ry + 24*S);

  // ── FOOTER ──
  const fy = H - FOOT_H;
  ctx.fillStyle = PAL.surface;
  ctx.fillRect(0, fy, W, FOOT_H);
  ctx.strokeStyle = PAL.borderSoft; ctx.lineWidth = 1*S;
  ctx.beginPath(); ctx.moveTo(0, fy); ctx.lineTo(W, fy); ctx.stroke();

  ctx.font = '600 ' + (14*S) + "px 'DM Sans', sans-serif";
  ctx.fillStyle = PAL.accent;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('atomurus.com', PAD, fy + FOOT_H/2);

  ctx.font = '500 ' + (11*S) + "px 'DM Mono', monospace";
  ctx.fillStyle = PAL.fg3;
  ctx.textAlign = 'right';
  ctx.fillText('Z = ' + el.z + '  ·  ' + el.sym + '  ·  ' + elName(el), W - PAD, fy + FOOT_H/2);

  return canvas;
}

// Rounded rect helpers
function roundRectPath(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}
function roundRectStroke(ctx, x, y, w, h, r){ roundRectPath(ctx, x, y, w, h, r); ctx.stroke(); }

// Static Bohr renderer for export (paused canonical state, textbook style)
function drawBohrInto(ctx, W, H, el, extra, isDark){
  const cx = W/2, cy = H/2;
  const shells = extra.shells || [];
  const orbitColor   = isDark ? 'rgba(255,255,255,.16)' : 'rgba(26,24,20,.22)';
  const nucleusColor = isDark ? '#f87171' : '#dc2626';
  const electronColor= isDark ? '#bfdbfe' : '#1d4ed8';
  const labelColor   = isDark ? 'rgba(240,237,232,.55)' : 'rgba(26,24,20,.5)';
  const scale = Math.min(W, H) / 148;
  const nucleusR = Math.max(8, 6 * scale);
  const electronR= Math.max(3, 2.6 * scale);
  const minOrbitR= 8 * scale + nucleusR;
  const baseAngles = shells.map((n) => Array.from({length:n}, (_, j) => -Math.PI/2 + (2*Math.PI*j/n)));
  const radii = shells.map((_, i) => minOrbitR + (i+1) * (Math.min(cx,cy) - minOrbitR - 8*scale) / (shells.length + .5));

  ctx.clearRect(0,0,W,H);
  // Orbits
  shells.forEach((_, i) => {
    ctx.beginPath();
    ctx.arc(cx, cy, radii[i], 0, Math.PI*2);
    ctx.strokeStyle = orbitColor;
    ctx.lineWidth = 1.1 * scale;
    ctx.stroke();
  });
  // Nucleus
  ctx.beginPath(); ctx.arc(cx, cy, nucleusR, 0, Math.PI*2);
  ctx.fillStyle = nucleusColor; ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '600 ' + Math.max(10, Math.round(7 * scale)) + "px 'DM Mono', monospace";
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(el.z), cx, cy + 0.5);
  // Electrons + shell labels
  shells.forEach((n, i) => {
    for (let j=0;j<n;j++){
      const angle = baseAngles[i][j];
      const ex = cx + Math.cos(angle) * radii[i];
      const ey = cy + Math.sin(angle) * radii[i];
      ctx.beginPath(); ctx.arc(ex, ey, electronR, 0, Math.PI*2);
      ctx.fillStyle = electronColor; ctx.fill();
    }
    // Count label
    ctx.fillStyle = labelColor;
    ctx.font = '500 ' + Math.max(9, Math.round(8 * scale)) + "px 'DM Mono', monospace";
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const lx = cx + radii[i] + 3 * scale;
    if (lx + 10 * scale < W) ctx.fillText(String(n), lx, cy - 1);
  });
}

async function downloadElement(fmt) {
  if (!currentElement) return;
  const el = currentElement;
  const canvas = renderElementCard(el);
  const fname = 'atomurus-' + el.sym.toLowerCase();
  if (fmt === 'pdf') {
    await ensureJsPdf();
    const { jsPDF } = window.jspdf;
    const w = canvas.width, h = canvas.height;
    const pdf = new jsPDF({ orientation: w > h ? 'landscape' : 'portrait', unit:'px', format:[w,h] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
    pdf.setProperties({ title:'Atomurus — ' + (elName(el) || el.sym), author:'Atomurus · atomurus.com' });
    pdf.save(fname + '.pdf');
  } else {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = fname + '.png';
    a.click();
  }
}

// ════════════ PNG — FULL TABLE (Canvas renderer) ════════════
function downloadTablePDF() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  // ── Palette ──────────────────────────────────────────────
  const PAL = isDark ? {
    bg:      '#111210', surface: '#1A1918', border: '#2E2C29',
    fg:      '#F0EDE8', fg2:     '#9A948C', accent: '#34A872',
    catBg: { nonmetal:'#1A3A1A', noble:'#332E00', alkali:'#2E1010', alkaline:'#2E1E00',
             metalloid:'#1A1430', polyatomic:'#0C2030', posttrans:'#142010',
             transition:'#201E18', lanthanide:'#280C22', actinide:'#280C14' },
    catTx: { nonmetal:'#7ECC7E', noble:'#D4AA30', alkali:'#E08080', alkaline:'#E0A860',
             metalloid:'#A898F0', polyatomic:'#70C0E8', posttrans:'#88C868',
             transition:'#B0A888', lanthanide:'#D088C0', actinide:'#D08098' },
  } : {
    bg:      '#FFFFFF', surface: '#F4F1EC', border: '#DDD8CE',
    fg:      '#1A1814', fg2:     '#6B6560', accent: '#1E6A50',
    catBg: { nonmetal:'#D2EDD2', noble:'#FFF0C0', alkali:'#FFD4D4', alkaline:'#FFE4C0',
             metalloid:'#E4DEFF', polyatomic:'#D4ECFA', posttrans:'#E4EED8',
             transition:'#EAE5DC', lanthanide:'#F4DCED', actinide:'#F0DDE4' },
    catTx: { nonmetal:'#1E5C1E', noble:'#7A5500', alkali:'#8B1818', alkaline:'#7A4200',
             metalloid:'#3A2680', polyatomic:'#0E4E70', posttrans:'#2E520E',
             transition:'#3E3820', lanthanide:'#680056', actinide:'#6A1830' },
  };

  // ── Layout constants ─────────────────────────────────────
  const S   = 2;          // scale (2x = retina quality)
  const CS  = 52 * S;     // cell size px
  const GAP = 3 * S;      // gap between cells
  const R   = 5 * S;      // corner radius
  const PAD = 24 * S;     // outer padding

  const COLS = 18, MAIN_ROWS = 7, F_COLS = 15, F_ROWS = 2;

  // Header area
  const HDR_H   = 52 * S;
  // Main table height
  const MAIN_H  = MAIN_ROWS * CS + (MAIN_ROWS - 1) * GAP;
  // Gap between main table and f-block
  const SEP_H   = 38 * S;
  // f-block rows
  const F_H     = F_ROWS * CS + (F_ROWS - 1) * GAP;
  // Legend row
  const LEG_ROW = 5;
  const LEG_H   = Math.ceil(Object.keys(CAT_NAMES).length / LEG_ROW) * (14 * S) + 8 * S;
  // Footer
  const FOOT_H  = 22 * S;

  const TOTAL_W = PAD * 2 + COLS * CS + (COLS - 1) * GAP;
  const TOTAL_H = PAD + HDR_H + MAIN_H + SEP_H + F_H + 14 * S + LEG_H + FOOT_H + PAD;

  const canvas = document.createElement('canvas');
  canvas.width  = TOTAL_W;
  canvas.height = TOTAL_H;
  const ctx = canvas.getContext('2d');

  // ── Helpers ───────────────────────────────────────────────
  function hexToRgba(hex, a = 1) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawCell(x, y, w, h, el) {
    const bg  = PAL.catBg[el.cat] || PAL.surface;
    const txt = PAL.catTx[el.cat] || PAL.fg;

    // Background
    ctx.fillStyle = bg;
    roundRect(x, y, w, h, R);
    ctx.fill();

    // Border (subtle)
    ctx.strokeStyle = hexToRgba(txt, 0.28);
    ctx.lineWidth = 1 * S;
    roundRect(x, y, w, h, R);
    ctx.stroke();

    // Atomic number
    ctx.fillStyle = hexToRgba(txt, 0.65);
    ctx.font = `${9 * S}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(String(el.z), x + 4 * S, y + 11 * S);

    // Symbol
    ctx.fillStyle = txt;
    ctx.font = `bold ${19 * S}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillText(el.sym, x + w / 2, y + h * 0.62);

    // Name (truncated)
    const nm = elName(el).length > 9 ? elName(el).substring(0, 8) + '…' : elName(el);
    ctx.fillStyle = hexToRgba(txt, 0.75);
    ctx.font = `${7.5 * S}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(nm, x + w / 2, y + h - 6 * S);
  }

  function drawPlaceholder(x, y, w, h, label) {
    ctx.fillStyle = PAL.surface;
    roundRect(x, y, w, h, R);
    ctx.fill();
    ctx.strokeStyle = PAL.border;
    ctx.lineWidth = 1 * S;
    ctx.setLineDash([3 * S, 3 * S]);
    roundRect(x, y, w, h, R);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = PAL.fg2;
    ctx.font = `${8 * S}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h / 2 + 3 * S);
  }

  function colX(col) { return PAD + (col - 1) * (CS + GAP); }
  function rowY(row, baseY) { return baseY + (row - 1) * (CS + GAP); }

  // ── Build element lookup ──────────────────────────────────
  const grid = {};
  ELEMENTS.forEach(e => { grid[`${e.row}-${e.col}`] = e; });

  // ── Background ───────────────────────────────────────────
  ctx.fillStyle = PAL.bg;
  ctx.fillRect(0, 0, TOTAL_W, TOTAL_H);

  let curY = PAD;

  // ── Header ───────────────────────────────────────────────
  // Logo
  ctx.font = `bold ${22 * S}px Georgia, serif`;
  ctx.fillStyle = PAL.accent;
  ctx.textAlign = 'left';
  ctx.fillText('Atomurus', PAD, curY + 24 * S);

  ctx.font = `${10 * S}px Arial, sans-serif`;
  ctx.fillStyle = PAL.fg2;
  ctx.fillText(_T('ptable.canvasHeader', 'Periodic Table · 118 Elementos IUPAC') + ' · ' + new Date().getFullYear(), PAD, curY + 42 * S);

  // Divider line
  ctx.strokeStyle = PAL.border;
  ctx.lineWidth = 1 * S;
  ctx.beginPath();
  ctx.moveTo(PAD, curY + HDR_H);
  ctx.lineTo(TOTAL_W - PAD, curY + HDR_H);
  ctx.stroke();

  curY += HDR_H + 14 * S;

  // ── Main table (rows 1-7) ────────────────────────────────
  const mainBaseY = curY;

  for (let row = 1; row <= 7; row++) {
    for (let col = 1; col <= 18; col++) {
      const x = colX(col);
      const y = rowY(row, mainBaseY);

      // f-block placeholders at col 3 rows 6 & 7
      if (col === 3 && row === 6) { drawPlaceholder(x, y, CS, CS, '57–71'); continue; }
      if (col === 3 && row === 7) { drawPlaceholder(x, y, CS, CS, '89–103'); continue; }

      const el = grid[`${row}-${col}`];
      if (el) drawCell(x, y, CS, CS, el);
    }
  }

  curY += MAIN_H;

  // f-block Y positions
  const fBlockBaseY = curY + SEP_H;
  const actBaseY    = fBlockBaseY + CS + GAP;

  // ── Connector bracket: purple L-shape ────────────────────
  const bracketColor  = hexToRgba('#9B5CF6', 0.85);
  const bracketColor2 = hexToRgba('#C4B5FD', 0.70);

  const ph6Left = colX(3);
  const ph6Bot  = rowY(6, mainBaseY) + CS;
  const ph7Left = colX(3);
  const ph7Bot  = rowY(7, mainBaseY) + CS;

  const laLeft  = colX(3);
  const laY     = fBlockBaseY + CS / 2;
  const acLeft  = colX(3);
  const acY     = actBaseY   + CS / 2;

  const col2Right = colX(2) + CS;
  const spineX    = col2Right + (ph6Left - col2Right) / 2;

  ctx.strokeStyle = bracketColor;
  ctx.lineWidth   = 1.8 * S;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.setLineDash([]);

  // Main vertical spine: from ph6 bottom down to acY
  ctx.beginPath();
  ctx.moveTo(spineX, ph6Bot);
  ctx.lineTo(spineX, acY);
  ctx.stroke();

  // Horizontal: ph6 bottom-left → spine
  ctx.beginPath();
  ctx.moveTo(ph6Left, ph6Bot);
  ctx.lineTo(spineX,  ph6Bot);
  ctx.stroke();

  // Horizontal: ph7 bottom-left → spine
  ctx.beginPath();
  ctx.moveTo(ph7Left, ph7Bot);
  ctx.lineTo(spineX,  ph7Bot);
  ctx.stroke();

  // Horizontal arm → La
  ctx.beginPath();
  ctx.moveTo(spineX, laY);
  ctx.lineTo(laLeft, laY);
  ctx.stroke();
  // Arrowhead at La
  ctx.fillStyle = bracketColor;
  ctx.beginPath();
  ctx.moveTo(laLeft, laY);
  ctx.lineTo(laLeft - 6*S, laY - 3.5*S);
  ctx.lineTo(laLeft - 6*S, laY + 3.5*S);
  ctx.closePath(); ctx.fill();

  // Horizontal arm → Ac
  ctx.beginPath();
  ctx.moveTo(spineX, acY);
  ctx.lineTo(acLeft, acY);
  ctx.stroke();
  // Arrowhead at Ac
  ctx.beginPath();
  ctx.moveTo(acLeft, acY);
  ctx.lineTo(acLeft - 6*S, acY - 3.5*S);
  ctx.lineTo(acLeft - 6*S, acY + 3.5*S);
  ctx.closePath(); ctx.fill();

  // Labels just right of the spine, above each arm
  ctx.font = `italic ${8 * S}px Arial, sans-serif`;
  ctx.fillStyle = bracketColor2;
  ctx.textAlign = 'left';
  ctx.fillText(_T('ptable.fblockLanthanides', 'Lantanídeos (57–71)'), spineX + 4 * S, laY - 4 * S);
  ctx.fillText(_T('ptable.fblockActinides',   'Actinídeos (89–103)'), spineX + 4 * S, acY - 4 * S);

  // ── f-block cells (La–Lu row 9, Ac–Lr row 10) ───────────
  // La at col:3 → fc=0, Ce at col:4 → fc=1 … Lu at col:17 → fc=14
  const fEls = ELEMENTS.filter(e => e.row === 9 || e.row === 10);

  fEls.forEach(e => {
    const fc = e.col - 3;                       // col3→0, col4→1, …col17→14
    const fr = e.row - 8;                       // row9→1, row10→2
    const x  = colX(3) + fc * (CS + GAP);
    const y  = fBlockBaseY + (fr - 1) * (CS + GAP);
    drawCell(x, y, CS, CS, e);
  });

  curY = fBlockBaseY + F_H;

  // ── Legend ───────────────────────────────────────────────
  curY += 18 * S;
  const legEntries = Object.entries(CAT_NAMES);
  const DOT = 11 * S;
  const LEG_ITEM_W = 168 * S;
  ctx.font = `${9 * S}px Arial, sans-serif`;

  legEntries.forEach(([cat, label], i) => {
    const lx = PAD + (i % LEG_ROW) * LEG_ITEM_W;
    const ly = curY + Math.floor(i / LEG_ROW) * (14 * S);
    const bg_ = PAL.catBg[cat] || PAL.surface;
    const tx_ = PAL.catTx[cat] || PAL.fg;

    ctx.fillStyle = bg_;
    roundRect(lx, ly, DOT, DOT, 2 * S);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(tx_, 0.5);
    ctx.lineWidth = 1 * S;
    roundRect(lx, ly, DOT, DOT, 2 * S);
    ctx.stroke();

    ctx.fillStyle = PAL.fg2;
    ctx.textAlign = 'left';
    ctx.fillText(label, lx + DOT + 5 * S, ly + DOT - 1 * S);
  });

  curY += LEG_H;

  // ── Footer ───────────────────────────────────────────────
  ctx.strokeStyle = PAL.border;
  ctx.lineWidth = 1 * S;
  ctx.beginPath();
  ctx.moveTo(PAD, curY);
  ctx.lineTo(TOTAL_W - PAD, curY);
  ctx.stroke();

  curY += 8 * S;
  ctx.font = `${9 * S}px Arial, sans-serif`;
  ctx.fillStyle = PAL.fg2;
  ctx.textAlign = 'left';
  ctx.fillText(_T('ptable.canvasBrand', 'Atomurus — Plataforma de Química Interativa'), PAD, curY + 12 * S);
  ctx.textAlign = 'right';
  ctx.fillText(`Gerado em ${new Date().toLocaleDateString('pt-BR')} · atomurus.com`, TOTAL_W - PAD, curY + 12 * S);

  // ── Download ──────────────────────────────────────────────
  try {
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `atomurus-tabela-periodica-${isDark ? 'dark' : 'light'}-${new Date().toISOString().slice(0,10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }, 'image/png');
  } catch(e) {
    // Fallback: open in new tab
    window.open(canvas.toDataURL('image/png'), '_blank');
  }
}

