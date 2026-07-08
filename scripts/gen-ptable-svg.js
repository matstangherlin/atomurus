// Generates a compact periodic-table SVG (block-coloured) for the Explore articles.
// Output: scripts/_ptable.svg  (paste into the article figure).
const fs = require('fs');

// element symbol by [group, period] for the main block
const main = {
  1:  {1:'H', 18:'He'},
  2:  {1:'Li',2:'Be',13:'B',14:'C',15:'N',16:'O',17:'F',18:'Ne'},
  3:  {1:'Na',2:'Mg',13:'Al',14:'Si',15:'P',16:'S',17:'Cl',18:'Ar'},
  4:  {1:'K',2:'Ca',3:'Sc',4:'Ti',5:'V',6:'Cr',7:'Mn',8:'Fe',9:'Co',10:'Ni',11:'Cu',12:'Zn',13:'Ga',14:'Ge',15:'As',16:'Se',17:'Br',18:'Kr'},
  5:  {1:'Rb',2:'Sr',3:'Y',4:'Zr',5:'Nb',6:'Mo',7:'Tc',8:'Ru',9:'Rh',10:'Pd',11:'Ag',12:'Cd',13:'In',14:'Sn',15:'Sb',16:'Te',17:'I',18:'Xe'},
  6:  {1:'Cs',2:'Ba',3:'La',4:'Hf',5:'Ta',6:'W',7:'Re',8:'Os',9:'Ir',10:'Pt',11:'Au',12:'Hg',13:'Tl',14:'Pb',15:'Bi',16:'Po',17:'At',18:'Rn'},
  7:  {1:'Fr',2:'Ra',3:'Ac',4:'Rf',5:'Db',6:'Sg',7:'Bh',8:'Hs',9:'Mt',10:'Ds',11:'Rg',12:'Cn',13:'Nh',14:'Fl',15:'Mc',16:'Lv',17:'Ts',18:'Og'},
};
// f-block (two rows). La/Ac shown in main grid as the series marker.
const fblock = [
  ['Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu'],
  ['Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No','Lr'],
];

const COL = { s:'#D9596B', p:'#3E8FBF', d:'#D79A37', f:'#5BA36B' };
function block(g, p){
  if (g>=3 && g<=12) return 'd';
  if (g>=13 && g<=18) return (g===18 ? 'p' : 'p'); // p-block incl noble
  // groups 1-2
  if (g===1 && p===1) return 'p'; // H neutral-ish; keep s? use s
  return 's';
}

const CELL = 17, PITCH = 18.4;
const OX = 2, OY = 2;
let rects = '';

function cell(g, p, sym, blk){
  const x = OX + (g-1)*PITCH;
  const y = OY + (p-1)*PITCH;
  const fill = COL[blk];
  rects += `<g><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${CELL}" height="${CELL}" rx="2.2" fill="${fill}" fill-opacity=".88"/>`+
           `<text x="${(x+CELL/2).toFixed(1)}" y="${(y+CELL/2+2.6).toFixed(1)}" text-anchor="middle" font-size="6.4" font-family="'JetBrains Mono',monospace" fill="#fff" font-weight="600">${sym}</text></g>\n`;
}

// main grid
for (let p=1; p<=7; p++){
  for (let g=1; g<=18; g++){
    const sym = main[p] && main[p][g];
    if (!sym) continue;
    cell(g, p, sym, block(g,p));
  }
}

// f-block rows, placed below with a gap, offset under group 3
const fY0 = 7; // start period-row index for placement (period 8 & 9 visual)
const fGapRow1 = 8.6, fGapRow2 = 9.7;
fblock.forEach((row, ri) => {
  const py = (ri===0 ? fGapRow1 : fGapRow2);
  row.forEach((sym, ci) => {
    const g = 4 + ci; // start under group 4
    const x = OX + (g-1)*PITCH;
    const y = OY + (py-1)*PITCH;
    rects += `<g><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${CELL}" height="${CELL}" rx="2.2" fill="${COL.f}" fill-opacity=".88"/>`+
             `<text x="${(x+CELL/2).toFixed(1)}" y="${(y+CELL/2+2.6).toFixed(1)}" text-anchor="middle" font-size="6.4" font-family="'JetBrains Mono',monospace" fill="#fff" font-weight="600">${sym}</text></g>\n`;
  });
});

const W = OX*2 + 18*PITCH;
const H = OY*2 + 9.7*PITCH;
const svg = `<svg viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" width="100%" preserveAspectRatio="xMidYMid meet" role="img" xmlns="http://www.w3.org/2000/svg">\n${rects}</svg>`;
fs.writeFileSync(__dirname + '/_ptable.svg', svg);
console.log('wrote _ptable.svg', W.toFixed(0)+'x'+H.toFixed(0), svg.length+' bytes');
