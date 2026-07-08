const fs = require('fs');
const path = require('path');

const files = [
  'viewer/molecules.html',
  'viewer/molecules.pt.html'
];

const newFunc = `  function draw2DMolecule(time){
    if (viewMode !== '2d') return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = viewer2d.width / dpr, H = viewer2d.height / dpr;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    ctx2d.clearRect(0, 0, W, H);
    ctx2d.fillStyle = isDark ? '#111111' : '#ffffff';
    ctx2d.fillRect(0, 0, W, H);

    const mol = molData[currentMolecule];
    if (!mol || !mol.atoms.length) return;

    let atomsToDraw = [];
    let bondsToDraw = [];
    let maxExt = 0;

    function getColorForLabel(lbl) {
      if(!lbl) return 0xaaaaaa;
      const l = lbl.toUpperCase();
      if(l.startsWith('CL')) return 0x44dd44;
      if(l.startsWith('BR')) return 0xa62929;
      if(l.startsWith('FE')) return 0xcc6633;
      if(l.startsWith('NA')) return 0xaaaaff;
      if(l.startsWith('C')) return 0x666666;
      if(l.startsWith('O')) return 0xee3333;
      if(l.startsWith('N')) return 0x3399ff;
      if(l.startsWith('S')) return 0xffcc33;
      if(l.startsWith('P')) return 0xff8833;
      if(l.startsWith('F')) return 0xb3ff3a;
      if(l.startsWith('H')) return 0xdddddd;
      return 0xaaaaaa;
    }

    if (mol.draw2d && mol.draw2d.atoms && mol.draw2d.bonds) {
      mol.draw2d.atoms.forEach(a => { maxExt = Math.max(maxExt, Math.abs(a.x), Math.abs(a.y)); });
      maxExt = Math.max(1, maxExt + 1);
      const z = Math.min(W, H) / (2 * maxExt) * 0.85 * zoom2d;
      const cx = W / 2 + pan2d.x;
      const cy = H / 2 + pan2d.y;
      const ang = anim2dEnabled ? (time || 0) * 0.18 : 0;
      const cosA = Math.cos(ang), sinA = Math.sin(ang);
      const project = (p) => ({ x: cx + (p.x * cosA - p.y * sinA) * z, y: cy + (p.x * sinA + p.y * cosA) * z });

      atomsToDraw = mol.draw2d.atoms.map(a => {
        const p = project(a);
        return { p, r: z * 0.45, color: getColorForLabel(a.label), label: a.label || '' };
      });
      bondsToDraw = mol.draw2d.bonds.map(b => {
        return { p1: atomsToDraw[b.a].p, p2: atomsToDraw[b.b].p, order: b.order || 1, c1: atomsToDraw[b.a].color, c2: atomsToDraw[b.b].color };
      });
    } else {
      mol.atoms.forEach(a => {
        const [x,y] = a.pos;
        maxExt = Math.max(maxExt, Math.abs(x), Math.abs(y));
      });
      maxExt = Math.max(0.5, maxExt + 0.6);
      const baseScale = Math.min(W, H) / (2 * maxExt) * 0.78;
      const z = baseScale * zoom2d;
      const cx = W / 2 + pan2d.x;
      const cy = H / 2 + pan2d.y;
      const ang = anim2dEnabled ? (time || 0) * 0.25 : 0;
      const cosA = Math.cos(ang), sinA = Math.sin(ang);
      const project = (pos) => ({ x: cx + (pos[0] * cosA - pos[1] * sinA) * z, y: cy + (pos[0] * sinA + pos[1] * cosA) * z });

      atomsToDraw = mol.atoms.map(a => {
        const label = COLOR_TO_ELEMENT[a.color] || '';
        return { p: project(a.pos), r: a.r * z * 2.3, color: a.color, label };
      });
      bondsToDraw = mol.bonds.map(([i, j]) => {
        return { p1: atomsToDraw[i].p, p2: atomsToDraw[j].p, order: 1, c1: atomsToDraw[i].color, c2: atomsToDraw[j].color };
      });
    }

    ctx2d.lineCap = 'round';
    bondsToDraw.forEach(b => {
      const dx = b.p2.x - b.p1.x, dy = b.p2.y - b.p1.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      
      const grad = ctx2d.createLinearGradient(b.p1.x, b.p1.y, b.p2.x, b.p2.y);
      grad.addColorStop(0, hexCSS(b.c1));
      grad.addColorStop(1, hexCSS(b.c2));
      
      ctx2d.strokeStyle = grad;
      
      if (b.order === 2) {
        const ox = nx * len * 0.08;
        const oy = ny * len * 0.08;
        ctx2d.lineWidth = len * 0.06;
        ctx2d.beginPath(); ctx2d.moveTo(b.p1.x + ox, b.p1.y + oy); ctx2d.lineTo(b.p2.x + ox, b.p2.y + oy); ctx2d.stroke();
        ctx2d.beginPath(); ctx2d.moveTo(b.p1.x - ox, b.p1.y - oy); ctx2d.lineTo(b.p2.x - ox, b.p2.y - oy); ctx2d.stroke();
      } else {
        ctx2d.lineWidth = len * 0.12;
        ctx2d.beginPath(); ctx2d.moveTo(b.p1.x, b.p1.y); ctx2d.lineTo(b.p2.x, b.p2.y); ctx2d.stroke();
      }
    });

    atomsToDraw.forEach(a => {
      const css = hexCSS(a.color);
      const grad = ctx2d.createRadialGradient(a.p.x - a.r*0.35, a.p.y - a.r*0.35, a.r*0.05, a.p.x, a.p.y, a.r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.2, css);
      grad.addColorStop(0.8, shade(css, -0.3));
      grad.addColorStop(1, shade(css, -0.6));

      ctx2d.beginPath();
      ctx2d.arc(a.p.x, a.p.y, a.r, 0, Math.PI * 2);
      ctx2d.fillStyle = grad; 
      ctx2d.fill();

      ctx2d.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx2d.lineWidth = 1;
      ctx2d.stroke();

      if (a.label && labelsVisible) {
        ctx2d.fillStyle = labelColor(a.color);
        const fontSize = Math.max(12, a.r * 0.9);
        ctx2d.font = 'bold ' + fontSize + 'px Arial, "DM Sans", sans-serif';
        ctx2d.textAlign = 'center';
        ctx2d.textBaseline = 'middle';
        
        let txt = a.label;
        let drawX = a.p.x - ctx2d.measureText(txt.replace(/[0-9]/g, '')).width/2 - (txt.match(/[0-9]/g) || []).length * a.r * 0.25;
        for (let i=0; i<txt.length; i++) {
          const char = txt[i];
          if (/[0-9]/.test(char)) {
            ctx2d.font = 'bold ' + (fontSize * 0.7) + 'px Arial, "DM Sans", sans-serif';
            ctx2d.fillText(char, drawX + ctx2d.measureText(char).width/2, a.p.y + fontSize*0.25);
            drawX += ctx2d.measureText(char).width;
          } else {
            ctx2d.font = 'bold ' + fontSize + 'px Arial, "DM Sans", sans-serif';
            ctx2d.fillText(char, drawX + ctx2d.measureText(char).width/2, a.p.y + 1);
            drawX += ctx2d.measureText(char).width;
          }
        }
      }
    });

    ctx2d.fillStyle = isDark ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)';
    ctx2d.font = '500 11px "DM Mono", monospace';
    ctx2d.textAlign = 'left'; ctx2d.textBaseline = 'bottom';
    ctx2d.fillText('VIEW 2D · ' + (mol.name || '').toUpperCase(), 14, H - 12);
  }`;

files.forEach(file => {
  const fp = path.join(__dirname, file);
  if (!fs.existsSync(fp)) return;
  let content = fs.readFileSync(fp, 'utf8');
  
  const regex = /  function draw2DMolecule\([\s\S]*?function shade/g;
  content = content.replace(regex, newFunc + '\n\n  function shade');
  
  fs.writeFileSync(fp, content, 'utf8');
  console.log('Patched ' + file);
});
