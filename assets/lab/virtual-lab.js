/* Atomurus Virtual Lab — allowlisted educational simulation. Deny by default. */
(function (root) {
  'use strict';

  var STORAGE_KEY = 'atomurus-lab-v1';
  var SCHEMA_VERSION = 2;
  var MAX_SESSIONS = 24;
  var HISTORY_CAP = 80;
  var MAX_VESSELS = 80;
  var SAVE_MS = 400;
  var SNAP_PX = 14;
  var ZOOM_MIN = 0.25;
  var ZOOM_MAX = 3;

  var SOUND_KEY = 'atomurus-lab-sound';
  var SOUNDS = {
    place: { wave: 'triangle', from: 300, to: 186, dur: 0.11, gain: 0.11 },
    material: { wave: 'sine', from: 610, to: 790, dur: 0.13, gain: 0.09 },
    pour: { wave: 'noise', from: 900, to: 240, dur: 0.34, gain: 0.08 },
    drop: { wave: 'sine', from: 980, to: 610, dur: 0.07, gain: 0.10 },
    stir: { wave: 'noise', from: 380, to: 540, dur: 0.26, gain: 0.06 },
    heat: { wave: 'sawtooth', from: 170, to: 410, dur: 0.36, gain: 0.05 },
    select: { wave: 'sine', from: 470, to: 470, dur: 0.04, gain: 0.05 },
    undo: { wave: 'triangle', from: 430, to: 300, dur: 0.09, gain: 0.07 },
    deny: { wave: 'square', from: 196, to: 138, dur: 0.18, gain: 0.05 },
    step: { wave: 'sine', from: 660, to: 880, dur: 0.17, gain: 0.10 },
    complete: { wave: 'sine', from: 523, to: 1046, dur: 0.42, gain: 0.11 },
    reaction: { wave: 'noise', from: 1200, to: 300, dur: 0.42, gain: 0.09 },
    distill: { wave: 'sine', from: 340, to: 760, dur: 0.5, gain: 0.07 }
  };

  var audioCtx = null;
  var noiseBuffer = null;

  function soundEnabled() {
    try {
      return root.localStorage.getItem(SOUND_KEY) !== '0';
    } catch (e) {
      return true;
    }
  }

  function setSoundEnabled(on) {
    var next = on !== false;
    try { root.localStorage.setItem(SOUND_KEY, next ? '1' : '0'); } catch (e) {}
    return next;
  }

  function audioContext() {
    if (audioCtx) return audioCtx;
    var Ctor = typeof root.AudioContext === 'function'
      ? root.AudioContext
      : (typeof root.webkitAudioContext === 'function' ? root.webkitAudioContext : null);
    if (!Ctor) return null;
    try { audioCtx = new Ctor(); } catch (e) { audioCtx = null; }
    return audioCtx;
  }

  function whiteNoise(ctx) {
    if (noiseBuffer) return noiseBuffer;
    var frames = Math.floor(ctx.sampleRate * 0.5);
    var buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;
    noiseBuffer = buffer;
    return noiseBuffer;
  }

  /* Short synthesized cues. No audio files, no network, nothing plays while idle. */
  function playSound(name) {
    var spec = SOUNDS[name];
    if (!spec || !soundEnabled()) return false;
    var ctx = audioContext();
    if (!ctx) return false;
    try {
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      var t0 = ctx.currentTime;
      var t1 = t0 + spec.dur;
      var gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(spec.gain, t0 + Math.min(0.03, spec.dur / 3));
      gain.gain.exponentialRampToValueAtTime(0.0001, t1);
      gain.connect(ctx.destination);
      var source;
      if (spec.wave === 'noise') {
        source = ctx.createBufferSource();
        source.buffer = whiteNoise(ctx);
        var filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 1.1;
        filter.frequency.setValueAtTime(spec.from, t0);
        filter.frequency.exponentialRampToValueAtTime(Math.max(40, spec.to), t1);
        source.connect(filter);
        filter.connect(gain);
      } else {
        source = ctx.createOscillator();
        source.type = spec.wave;
        source.frequency.setValueAtTime(spec.from, t0);
        source.frequency.exponentialRampToValueAtTime(Math.max(40, spec.to), t1);
        source.connect(gain);
      }
      source.start(t0);
      source.stop(t1 + 0.02);
      source.onended = function () {
        try { source.disconnect(); gain.disconnect(); } catch (e) {}
      };
      return true;
    } catch (e) {
      return false;
    }
  }

  var SUBSTANCES = {
    water: { id: 'water', name: 'Water', formula: 'H₂O', category: 'solvent', color: '#7EB6D9', state: 'liquid', ph: 7, bp: 100, allowed: true },
    nacl: { id: 'nacl', name: 'Sodium chloride', formula: 'NaCl', category: 'salt', color: '#F4F1E4', state: 'solid', allowed: true },
    sucrose: { id: 'sucrose', name: 'Sucrose', formula: 'C₁₂H₂₂O₁₁', category: 'sugar', color: '#F7E7C6', state: 'solid', allowed: true },
    citric_acid: { id: 'citric_acid', name: 'Citric acid', formula: 'C₆H₈O₇', category: 'acid', color: '#F3E27A', state: 'solid', ph: 2.2, allowed: true },
    bicarbonate: { id: 'bicarbonate', name: 'Sodium bicarbonate', formula: 'NaHCO₃', category: 'base', color: '#EEEAE0', state: 'solid', ph: 8.3, allowed: true },
    indicator: { id: 'indicator', name: 'Virtual pH indicator', formula: 'In', category: 'indicator', color: '#D9A7C7', state: 'liquid', allowed: true },
    cusulfate: { id: 'cusulfate', name: 'Copper sulfate', formula: 'CuSO₄', category: 'salt', color: '#3F8CDA', state: 'solid', allowed: true },
    fe: { id: 'fe', name: 'Iron', formula: 'Fe', category: 'element', color: '#8A8680', state: 'solid', allowed: true },
    cu: { id: 'cu', name: 'Copper', formula: 'Cu', category: 'element', color: '#C47A4A', state: 'solid', allowed: true },
    zn: { id: 'zn', name: 'Zinc', formula: 'Zn', category: 'element', color: '#C5CBD1', state: 'solid', allowed: true },
    s: { id: 's', name: 'Sulfur', formula: 'S', category: 'element', color: '#E3C95A', state: 'solid', allowed: true },
    c: { id: 'c', name: 'Carbon', formula: 'C', category: 'element', color: '#3A3732', state: 'solid', allowed: true },
    limonene: { id: 'limonene', name: 'Limonene', formula: 'C₁₀H₁₆', category: 'fragrance', color: '#E8C15A', family: 'citrus', note: 'top', allowed: true },
    linalool: { id: 'linalool', name: 'Linalool', formula: 'C₁₀H₁₈O', category: 'fragrance', color: '#C9D48A', family: 'floral', note: 'heart', allowed: true },
    vanillin: { id: 'vanillin', name: 'Vanillin', formula: 'C₈H₈O₃', category: 'fragrance', color: '#E6C39A', family: 'gourmand', note: 'base', allowed: true },
    carbon: { id: 'carbon', name: 'Carbon (graphite)', formula: 'C', category: 'allotrope', color: '#3A3732', state: 'solid', allowed: true, inventory: false },
    zno: { id: 'zno', name: 'Zinc oxide', formula: 'ZnO', category: 'mineral', color: '#F4F1EA', state: 'solid', allowed: true },
    tio2: { id: 'tio2', name: 'Titanium dioxide', formula: 'TiO₂', category: 'mineral', color: '#E8EEF2', state: 'solid', allowed: true },
    oil: { id: 'oil', name: 'Virtual carrier oil', formula: 'oil', category: 'solvent', color: '#E6D5A2', state: 'liquid', bp: 300, allowed: true },
    ethanol: { id: 'ethanol', name: 'Ethanol', formula: 'C₂H₅OH', category: 'solvent', color: '#E8E2CE', state: 'liquid', bp: 78, allowed: true },
    frac_light: { id: 'frac_light', name: 'Virtual light fraction', formula: 'C₅–C₈', category: 'fraction', color: '#F2E3B0', state: 'liquid', bp: 65, allowed: true },
    frac_mid: { id: 'frac_mid', name: 'Virtual mid fraction', formula: 'C₉–C₁₆', category: 'fraction', color: '#DCC07C', state: 'liquid', bp: 175, allowed: true },
    frac_heavy: { id: 'frac_heavy', name: 'Virtual heavy fraction', formula: 'C₁₇+', category: 'fraction', color: '#A88B4E', state: 'liquid', bp: 330, allowed: true }
  };

  function eq(id, category, en, pt, o) {
    o = o || {};
    return {
      type: id,
      category: category,
      labelEn: en,
      labelPt: pt,
      names: { en: en, pt: pt },
      w: o.w || 124,
      h: o.h || 188,
      capacityMl: o.capacityMl || 0,
      holds: o.holds,
      heat: !!o.heat,
      capabilities: o.cap || [],
      ports: o.ports || [],
      renderType: o.render || id,
      precision: !!o.precision,
      nominalVolumeMl: o.nominal
    };
  }

  var EQUIPMENT = {
    beaker: eq('beaker', 'glassware', 'Beaker', 'Becker', {
      capacityMl: 250, cap: ['contain', 'mix', 'heat', 'pour', 'measure_volume'],
      ports: [{ id: 'mouth', type: 'fluid' }]
    }),
    flask: eq('flask', 'glassware', 'Flask', 'Erlenmeyer', {
      capacityMl: 250, cap: ['contain', 'mix', 'heat', 'pour', 'measure_volume'],
      ports: [{ id: 'mouth', type: 'fluid' }]
    }),
    cylinder: eq('cylinder', 'glassware', 'Cylinder', 'Proveta', {
      w: 72, capacityMl: 100, cap: ['contain', 'pour', 'measure_volume']
    }),
    'volumetric-flask': eq('volumetric-flask', 'glassware', 'Volumetric flask', 'Balão volumétrico', {
      capacityMl: 100, precision: true, cap: ['contain', 'mix', 'target_volume', 'pour'],
      ports: [{ id: 'neck', type: 'fluid' }]
    }),
    'round-flask': eq('round-flask', 'glassware', 'Round-bottom flask', 'Balão de fundo redondo', {
      capacityMl: 250, cap: ['contain', 'mix', 'heat', 'pour'],
      ports: [{ id: 'neck', type: 'fluid' }]
    }),
    'test-tube': eq('test-tube', 'glassware', 'Test tube', 'Tubo de ensaio', {
      w: 72, capacityMl: 20, cap: ['contain', 'mix', 'heat', 'pour']
    }),
    'test-tube-capped': eq('test-tube-capped', 'glassware', 'Capped tube', 'Tubo com tampa', {
      w: 72, capacityMl: 20, cap: ['contain', 'mix', 'pour']
    }),
    'watch-glass': eq('watch-glass', 'glassware', 'Watch glass', 'Vidro de relógio', {
      w: 110, h: 80, capacityMl: 8, cap: ['contain']
    }),
    'reagent-bottle': eq('reagent-bottle', 'glassware', 'Reagent bottle', 'Frasco de reagente', {
      capacityMl: 250, cap: ['contain', 'pour']
    }),
    'pipette-graduated': eq('pipette-graduated', 'transfer', 'Graduated pipette', 'Pipeta graduada', {
      w: 56, capacityMl: 10, cap: ['aspirate', 'dispense', 'measure_volume']
    }),
    'pipette-volumetric': eq('pipette-volumetric', 'transfer', 'Volumetric pipette', 'Pipeta volumétrica', {
      w: 56, capacityMl: 25, nominal: 25, precision: true,
      cap: ['aspirate', 'dispense', 'dispense_exact']
    }),
    pipettor: eq('pipettor', 'transfer', 'Pipette filler', 'Pipetador', {
      w: 72, h: 140, holds: false, cap: ['support']
    }),
    dropper: eq('dropper', 'transfer', 'Dropper', 'Conta-gotas', {
      w: 56, capacityMl: 3, cap: ['aspirate', 'dispense']
    }),
    burette: eq('burette', 'transfer', 'Burette', 'Bureta', {
      w: 56, capacityMl: 50, cap: ['contain', 'dispense_controlled', 'measure_volume'],
      ports: [{ id: 'outlet', type: 'fluid' }]
    }),
    funnel: eq('funnel', 'transfer', 'Funnel', 'Funil', {
      w: 96, h: 140, holds: false, cap: ['filter'],
      ports: [{ id: 'outlet', type: 'fluid' }]
    }),
    'separatory-funnel': eq('separatory-funnel', 'transfer', 'Separatory funnel', 'Funil de decantação', {
      capacityMl: 250, cap: ['contain', 'separate', 'pour'],
      ports: [{ id: 'outlet', type: 'fluid' }]
    }),
    mortar: eq('mortar', 'prep', 'Mortar', 'Almofariz', {
      w: 130, h: 120, capacityMl: 80, cap: ['contain', 'grind']
    }),
    pestle: eq('pestle', 'prep', 'Pestle', 'Pistilo', {
      w: 56, h: 120, holds: false, cap: ['grind']
    }),
    spatula: eq('spatula', 'prep', 'Spatula', 'Espátula', {
      w: 80, h: 90, holds: false, cap: ['transfer']
    }),
    'weighing-boat': eq('weighing-boat', 'prep', 'Weighing boat', 'Barquinha de pesagem', {
      w: 110, h: 80, capacityMl: 15, cap: ['contain', 'measure_mass']
    }),
    bunsen: eq('bunsen', 'heat', 'Bunsen burner', 'Bico de Bunsen', {
      w: 80, h: 150, holds: false, heat: true, cap: ['heat'],
      ports: [{ id: 'flame', type: 'heat' }]
    }),
    'hot-plate': eq('hot-plate', 'heat', 'Hot plate', 'Chapa aquecedora', {
      w: 140, h: 90, holds: false, heat: true, cap: ['heat']
    }),
    'heating-gauze': eq('heating-gauze', 'heat', 'Ceramic wire gauze', 'Tela de aquecimento', {
      w: 130, h: 90, holds: false, heat: true, cap: ['heat', 'support']
    }),
    'heating-mantle': eq('heating-mantle', 'heat', 'Heating mantle', 'Manta de aquecimento', {
      w: 130, h: 100, holds: false, heat: true, cap: ['heat']
    }),
    tripod: eq('tripod', 'heat', 'Tripod', 'Tripé', {
      w: 120, h: 110, holds: false, cap: ['support']
    }),
    'retort-stand': eq('retort-stand', 'support', 'Retort stand', 'Suporte universal', {
      w: 90, h: 200, holds: false, cap: ['support'],
      ports: [{ id: 'rod', type: 'support' }]
    }),
    ring: eq('ring', 'support', 'Ring', 'Anel', {
      w: 90, h: 70, holds: false, cap: ['support'],
      ports: [{ id: 'clamp', type: 'support' }]
    }),
    clamp: eq('clamp', 'support', 'Clamp', 'Garra', {
      w: 80, h: 70, holds: false, cap: ['support'],
      ports: [{ id: 'grip', type: 'support' }]
    }),
    rack: eq('rack', 'prep', 'Test-tube rack', 'Grade de tubos', {
      w: 168, h: 90, holds: false, cap: ['support']
    }),
    thermometer: eq('thermometer', 'measure', 'Thermometer', 'Termômetro', {
      w: 48, h: 160, holds: false, cap: ['measure_temperature']
    }),
    'ph-meter': eq('ph-meter', 'measure', 'pH meter', 'Medidor de pH', {
      w: 90, h: 140, holds: false, cap: ['measure_ph']
    }),
    balance: eq('balance', 'measure', 'Balance', 'Balança', {
      w: 150, h: 110, holds: false, cap: ['measure_mass']
    }),
    condenser: eq('condenser', 'condense', 'Liebig condenser', 'Condensador de Liebig', {
      w: 70, h: 180, holds: false, cap: ['condense'],
      ports: [
        { id: 'inlet', type: 'fluid' },
        { id: 'outlet', type: 'fluid' },
        { id: 'coolingIn', type: 'cooling' },
        { id: 'coolingOut', type: 'cooling' }
      ]
    }),
    'receiving-flask': eq('receiving-flask', 'condense', 'Receiving flask', 'Balão coletor', {
      capacityMl: 150, cap: ['contain', 'pour'],
      ports: [{ id: 'neck', type: 'fluid' }]
    }),
    piston: eq('piston', 'gas', 'Gas syringe', 'Seringa de gás', {
      w: 64, capacityMl: 50, cap: ['contain', 'aspirate', 'dispense']
    })
  };

  /* Scale drawings of each piece on one 100x160 stage.
     `glass` is the drawn body, `cavity` is the real inner volume the liquid is
     clipped to, and fillTop/fillBottom are the y range that volume spans. */
  function va(glass, o) {
    o = o || {};
    return {
      glass: glass,
      cavity: o.cavity || '',
      fillTop: o.top == null ? 40 : o.top,
      fillBottom: o.bottom == null ? 146 : o.bottom,
      marks: o.marks || null,
      shine: o.shine || '',
      shape: o.shape || 'straight',
      base: o.base || ''
    };
  }

  var VESSEL_ART = {
    beaker: va(
      '<path d="M23 29 H77" /><path d="M26 29 V141 Q26 147 32 147 H68 Q74 147 74 141 V29" />' +
      '<path d="M74 33 L82 29 L82 34 L74 38" />',
      {
        cavity: '<path d="M29 32 V141 Q29 144 33 144 H67 Q71 144 71 141 V32 Z" />',
        top: 34, bottom: 144,
        marks: { x1: 31, x2: 40, from: 52, to: 136, count: 5 },
        shine: '<path d="M33 42 V130" />'
      }
    ),
    flask: va(
      '<path d="M39 15 H61" /><path d="M42 15 V44 L21 133 Q19 147 28 147 H72 Q81 147 79 133 L58 44 V15" />',
      {
        cavity: '<path d="M45 18 V45 L25 134 Q24 144 30 144 H70 Q76 144 75 134 L55 45 V18 Z" />',
        top: 20, bottom: 144,
        marks: { x1: 30, x2: 38, from: 118, to: 138, count: 3 },
        shine: '<path d="M40 58 L32 122" />'
      }
    ),
    cylinder: va(
      '<path d="M39 18 H61" /><path d="M59 22 L66 18" />' +
      '<path d="M41 20 V132 M59 20 V132" />' +
      '<path d="M41 132 L31 145 Q30 150 35 150 H65 Q70 150 69 145 L59 132" />',
      {
        cavity: '<path d="M43.5 22 H56.5 V131 H43.5 Z" />',
        top: 24, bottom: 131,
        marks: { x1: 44.5, x2: 51, from: 32, to: 128, count: 10 },
        shine: '<path d="M46 30 V124" />'
      }
    ),
    'volumetric-flask': va(
      '<path d="M44 10 H56" /><path d="M46 10 V54 Q23 72 22 114 Q22 147 50 147 Q78 147 78 114 Q77 72 54 54 V10" />' +
      '<path d="M46 38 H54" />',
      {
        cavity: '<path d="M48.5 13 V56 Q26 73 25 114 Q25 144 50 144 Q75 144 75 114 Q74 73 51.5 56 V13 Z" />',
        shape: 'bulb', top: 14, bottom: 144,
        shine: '<path d="M36 78 Q30 106 33 128" />'
      }
    ),
    'round-flask': va(
      '<path d="M43 10 H57" /><path d="M45 10 V50 Q20 62 20 102 Q20 148 50 148 Q80 148 80 102 Q80 62 55 50 V10" />',
      {
        cavity: '<path d="M47.5 13 V52 Q23 63 23 102 Q23 145 50 145 Q77 145 77 102 Q77 63 52.5 52 V13 Z" />',
        shape: 'bulb', top: 14, bottom: 145,
        shine: '<path d="M33 82 Q28 108 34 128" />'
      }
    ),
    'test-tube': va(
      '<path d="M40 26 H60" /><path d="M42 28 V126 Q42 140 50 140 Q58 140 58 126 V28" />',
      {
        cavity: '<path d="M44.5 31 V126 Q44.5 137 50 137 Q55.5 137 55.5 126 V31 Z" />',
        top: 32, bottom: 137,
        shine: '<path d="M46 40 V120" />'
      }
    ),
    'test-tube-capped': va(
      '<path d="M39 16 H61 V27 H39 Z" /><path d="M42 27 V126 Q42 140 50 140 Q58 140 58 126 V27" />',
      {
        cavity: '<path d="M44.5 31 V126 Q44.5 137 50 137 Q55.5 137 55.5 126 V31 Z" />',
        top: 32, bottom: 137,
        shine: '<path d="M46 40 V120" />'
      }
    ),
    rack: va(
      '<path d="M12 60 H88 V70 H12 Z" /><path d="M12 126 H88 V138 H12 Z" />' +
      '<path d="M18 70 V126 M82 70 V126" />' +
      '<circle cx="26" cy="65" r="4.5" /><circle cx="42" cy="65" r="4.5" />' +
      '<circle cx="58" cy="65" r="4.5" /><circle cx="74" cy="65" r="4.5" />',
      { top: 120, bottom: 132 }
    ),
    'reagent-bottle': va(
      '<path d="M43 8 H57 V18 H43 Z" /><path d="M45 18 V30 Q28 38 28 58 V138 Q28 146 36 146 H64 Q72 146 72 138 V58 Q72 38 55 30 V18" />',
      {
        cavity: '<path d="M48 33 Q31 41 31 59 V138 Q31 143 37 143 H63 Q69 143 69 138 V59 Q69 41 52 33 Z" />',
        top: 34, bottom: 143,
        shine: '<path d="M38 62 V128" />'
      }
    ),
    'watch-glass': va(
      '<path d="M16 118 Q50 94 84 118 Q50 132 16 118 Z" />',
      {
        cavity: '<path d="M21 118 Q50 99 79 118 Q50 129 21 118 Z" />',
        top: 110, bottom: 127
      }
    ),
    burette: va(
      '<path d="M42 10 H58" /><path d="M44 12 V120 M56 12 V120" />' +
      '<path d="M40 120 H60 V131 H40 Z" /><path d="M60 125 H72" />' +
      '<path d="M47 131 L50 151 L53 131" />',
      {
        cavity: '<path d="M46.5 15 H53.5 V119 H46.5 Z" />',
        top: 16, bottom: 119,
        marks: { x1: 34, x2: 44, from: 24, to: 114, count: 10 }
      }
    ),
    'separatory-funnel': va(
      '<path d="M30 14 H70" /><path d="M32 16 V58 Q32 66 40 78 L47 121 H53 L60 78 Q68 66 68 58 V16" />' +
      '<path d="M43 121 H57 V132 H43 Z" /><path d="M57 126 H69" />' +
      '<path d="M47 132 L50 151 L53 132" />',
      {
        cavity: '<path d="M35 19 V58 Q35 66 43 79 L49 120 H51 L57 79 Q65 66 65 58 V19 Z" />',
        top: 20, bottom: 120,
        shine: '<path d="M39 30 V60" />'
      }
    ),
    funnel: va(
      '<path d="M20 38 H80 L54 92 V134 H46 V92 Z" />',
      {
        cavity: '<path d="M27 43 H73 L51 91 V130 H49 V91 Z" />',
        top: 44, bottom: 130
      }
    ),
    'pipette-graduated': va(
      '<path d="M44 10 H56" /><path d="M46 10 V118 Q46 130 50 148 Q54 130 54 118 V10" />',
      {
        cavity: '<path d="M47.5 13 V118 Q47.5 128 50 142 Q52.5 128 52.5 118 V13 Z" />',
        top: 14, bottom: 142,
        marks: { x1: 36, x2: 46, from: 24, to: 112, count: 8 }
      }
    ),
    'pipette-volumetric': va(
      '<path d="M44 10 H56" /><path d="M46 10 V50 Q37 58 37 74 Q37 90 46 98 V118 Q46 130 50 148 Q54 130 54 118 V98 Q63 90 63 74 Q63 58 54 50 V10" />' +
      '<path d="M46 34 H54" />',
      {
        cavity: '<path d="M47.5 13 V51 Q39.5 59 39.5 74 Q39.5 89 47.5 97 V118 Q47.5 128 50 142 Q52.5 128 52.5 118 V97 Q60.5 89 60.5 74 Q60.5 59 52.5 51 V13 Z" />',
        top: 14, bottom: 142
      }
    ),
    pipettor: va(
      '<path d="M35 20 Q35 10 50 10 Q65 10 65 20 V60 Q65 72 50 72 Q35 72 35 60 Z" />' +
      '<circle cx="70" cy="40" r="6" /><path d="M46 72 V100 H54 V72" />',
      { top: 90, bottom: 98 }
    ),
    dropper: va(
      '<path d="M42 12 Q42 3 50 3 Q58 3 58 12 V34 Q58 43 50 43 Q42 43 42 34 Z" />' +
      '<path d="M47 43 V126 Q47 138 50 150 Q53 138 53 126 V43" />',
      {
        cavity: '<path d="M48.3 45 V126 Q48.3 136 50 145 Q51.7 136 51.7 126 V45 Z" />',
        top: 46, bottom: 145
      }
    ),
    mortar: va(
      '<path d="M15 72 H85" /><path d="M20 74 Q20 126 50 131 Q80 126 80 74" />' +
      '<path d="M38 131 H62 V143 H38 Z" />',
      {
        cavity: '<path d="M26 78 Q26 120 50 125 Q74 120 74 78 Z" />',
        top: 79, bottom: 125
      }
    ),
    pestle: va(
      '<path d="M44 12 H56 V94 Q56 102 61 110 Q61 128 50 133 Q39 128 39 110 Q44 102 44 94 Z" />',
      { top: 120, bottom: 130 }
    ),
    spatula: va(
      '<path d="M48 10 V94" /><path d="M41 94 Q50 89 59 94 L57 126 Q50 133 43 126 Z" />',
      { top: 108, bottom: 126 }
    ),
    'weighing-boat': va(
      '<path d="M22 102 H78 L69 130 H31 Z" />',
      {
        cavity: '<path d="M27 107 H73 L66 126 H34 Z" />',
        top: 108, bottom: 126
      }
    ),
    piston: va(
      '<path d="M40 6 H60" /><path d="M50 6 V36" /><path d="M36 36 H64 V140 H36 Z" />' +
      '<path d="M46 140 V152 H54 V140" />',
      {
        cavity: '<path d="M39 39 H61 V137 H39 Z" />',
        top: 40, bottom: 137,
        marks: { x1: 29, x2: 36, from: 50, to: 130, count: 6 }
      }
    ),
    condenser: va(
      '<path d="M44 8 V152 M56 8 V152" />' +
      '<path d="M34 38 Q34 30 41 30 H59 Q66 30 66 38 V122 Q66 130 59 130 H41 Q34 130 34 122 Z" />' +
      '<path d="M34 50 L18 41 M66 110 L82 119" />',
      {
        cavity: '<path d="M46 12 H54 V148 H46 Z" />',
        top: 14, bottom: 148
      }
    ),
    'receiving-flask': va(
      '<path d="M43 10 H57" /><path d="M45 10 V50 Q20 62 20 102 Q20 148 50 148 Q80 148 80 102 Q80 62 55 50 V10" />',
      {
        cavity: '<path d="M47.5 13 V52 Q23 63 23 102 Q23 145 50 145 Q77 145 77 102 Q77 63 52.5 52 V13 Z" />',
        shape: 'bulb', top: 14, bottom: 145,
        shine: '<path d="M33 82 Q28 108 34 128" />'
      }
    ),
    bunsen: va(
      '<path d="M30 131 Q30 148 50 148 Q70 148 70 131 Z" />' +
      '<path d="M43 54 H57 V131 H43 Z" /><path d="M41 76 H59 M41 90 H59" />' +
      '<path d="M57 124 H74" />',
      { top: 120, bottom: 130 }
    ),
    'hot-plate': va(
      '<path d="M12 98 H88 V108 H12 Z" />' +
      '<path d="M14 108 H86 Q90 108 90 114 V132 Q90 139 83 139 H17 Q10 139 10 132 V114 Q10 108 14 108 Z" />' +
      '<circle cx="76" cy="124" r="5" /><path d="M20 124 H60" />',
      { top: 92, bottom: 100 }
    ),
    'heating-mantle': va(
      '<path d="M20 96 Q20 138 50 144 Q80 138 80 96 Z" /><path d="M80 110 H92" />',
      { top: 96, bottom: 140 }
    ),
    'heating-gauze': va(
      '<path d="M16 100 H84 V110 H16 Z" /><circle cx="50" cy="105" r="13" />' +
      '<path d="M28 100 V110 M40 100 V110 M60 100 V110 M72 100 V110" />',
      { top: 96, bottom: 106 }
    ),
    tripod: va(
      '<path d="M24 90 H76" /><path d="M29 90 L20 142 M71 90 L80 142 M50 90 V142" />',
      { top: 84, bottom: 92 }
    ),
    'retort-stand': va(
      '<path d="M14 138 H86 Q90 138 90 142 V148 H10 V142 Q10 138 14 138 Z" />' +
      '<path d="M46 14 H54 V138 H46 Z" />',
      { top: 120, bottom: 134 }
    ),
    ring: va(
      '<ellipse cx="46" cy="100" rx="26" ry="9" /><path d="M72 100 H90" />',
      { top: 94, bottom: 106 }
    ),
    clamp: va(
      '<path d="M14 100 H40" /><path d="M40 90 Q54 100 40 110" /><path d="M54 86 Q70 100 54 114" />' +
      '<path d="M70 100 H88" />',
      { top: 94, bottom: 106 }
    ),
    thermometer: va(
      '<path d="M45 12 H55 V116 H45 Z" /><circle cx="50" cy="128" r="11" />' +
      '<path d="M38 28 H45 M38 44 H45 M38 60 H45 M38 76 H45 M38 92 H45" />',
      { top: 30, bottom: 118 }
    ),
    'ph-meter': va(
      '<path d="M32 16 H68 V82 H32 Z" /><path d="M38 26 H62 V48 H38 Z" />' +
      '<circle cx="42" cy="64" r="4" /><circle cx="58" cy="64" r="4" />' +
      '<path d="M50 82 V138" /><path d="M46 138 Q50 150 54 138 Z" />',
      { top: 120, bottom: 140 }
    ),
    balance: va(
      '<path d="M12 116 H88 Q92 116 92 121 V136 Q92 141 87 141 H13 Q8 141 8 136 V121 Q8 116 12 116 Z" />' +
      '<path d="M24 98 H76 V106 H24 Z" /><path d="M48 106 H52 V116 H48 Z" />' +
      '<path d="M56 122 H84 V133 H56 Z" />',
      { top: 90, bottom: 100 }
    )
  };

  function r1(value) {
    return Math.round(Number(value) * 10) / 10;
  }

  function safeColor(value) {
    return /^#[0-9a-fA-F]{3,8}$/.test(String(value == null ? '' : value)) ? String(value) : '#7EB6D9';
  }

  function svgId(id) {
    return 'labv-' + String(id == null ? '' : id).replace(/[^a-zA-Z0-9_-]/g, '');
  }

  function marksSvg(art) {
    if (!art.marks) return '';
    var m = art.marks;
    var count = Math.max(2, Number(m.count) || 2);
    var step = (m.to - m.from) / (count - 1);
    var out = '';
    for (var i = 0; i < count; i += 1) {
      var y = Math.round((m.from + step * i) * 10) / 10;
      var end = i % 2 === 0 ? m.x2 : m.x1 + (m.x2 - m.x1) * 0.55;
      out += '<path d="M' + m.x1 + ' ' + y + ' H' + (Math.round(end * 10) / 10) + '" />';
    }
    return '<g class="lab-svg-marks">' + out + '</g>';
  }

  function bubblesSvg(art, geo, count) {
    var out = '';
    var span = Math.max(6, geo.height - 6);
    for (var i = 0; i < count; i += 1) {
      var cx = 36 + ((i * 37) % 29);
      var r = 1.4 + (i % 3) * 0.6;
      var delay = (i * 260) % 1400;
      out += '<circle class="lab-svg-bubble" cx="' + cx + '" cy="' + r1(geo.bottom - 3) + '" r="' + r +
        '" style="--lab-rise:' + Math.round(span) + 'px;--lab-delay:' + delay + 'ms" />';
    }
    return out;
  }

  /* One SVG per piece: the glass is drawn to scale and the liquid is clipped to
     the real inner cavity, so the surface follows the actual profile. */
  function vesselSvg(container, state) {
    state = state || {};
    var type = container.type || 'beaker';
    var art = vesselArt(type);
    var holds = canHold(container);
    var pct = holds ? visualFillPct(container) : 0;
    var geo = fillGeometry(type, pct);
    var color = safeColor(state.color || container.color || mixColor(container));
    var id = svgId(container.id);
    var filled = holds && (Number(container.volumeMl) || 0) > 0;
    var inside = '';

    if (holds && art.cavity) {
      var layers = '';
      if (filled) {
        layers += '<rect class="lab-liquid" data-fill="' + pct + '" x="-14" y="' + r1(geo.y) +
          '" width="128" height="' + r1(geo.height + 8) + '" fill="' + color + '" />';
        if (state.phases && state.phases.length === 2) {
          var topPhase = state.phases[0];
          var topRatio = Math.max(0.12, Math.min(0.88, Number(topPhase.ratio) || 0.4));
          var topSpec = SUBSTANCES[topPhase.id];
          layers += '<rect class="lab-svg-phase" x="-14" y="' + r1(geo.y) + '" width="128" height="' +
            r1(geo.height * topRatio) + '" fill="' + safeColor((topSpec && topSpec.color) || '#E6D5A2') + '" />' +
            '<path class="lab-svg-phase-line" d="M-14 ' + r1(geo.y + geo.height * topRatio) + ' H114" />';
        }
        layers += '<ellipse class="lab-svg-surface" cx="50" cy="' + r1(geo.y) + '" rx="54" ry="2.1" />';
      }
      if (state.sediment > 0) {
        var span = geo.bottom - geo.top;
        var sedH = Math.max(2, Math.min(span * 0.28, (Number(state.sediment) / 100) * span));
        layers += '<rect class="lab-svg-sediment" x="-14" y="' + r1(geo.bottom - sedH) + '" width="128" height="' + r1(sedH) + '" />' +
          '<ellipse class="lab-svg-sediment" cx="50" cy="' + r1(geo.bottom - sedH) + '" rx="30" ry="2.2" />';
      }
      if (filled && (state.fizz || state.warm)) {
        layers += bubblesSvg(art, geo, state.fizz ? 6 : 4);
      }
      if (layers) {
        inside = '<defs><clipPath id="' + id + '-cav">' + art.cavity + '</clipPath></defs>' +
          '<g class="lab-svg-fill" clip-path="url(#' + id + '-cav)">' + layers + '</g>';
      }
    }

    var flame = type === 'bunsen'
      ? '<g class="lab-svg-flame' + (state.lit ? ' is-lit' : ' is-off') + '" aria-hidden="true">' +
        (state.lit
          ? '<path d="M50 54 Q62 34 50 10 Q38 34 50 54 Z" /><path class="lab-svg-flame-core" d="M50 52 Q57 39 50 23 Q43 39 50 52 Z" />'
          : '<path d="M50 54 Q56 45 50 36 Q44 45 50 54 Z" />') +
        '</g>'
      : '';
    var vapor = state.warm && holds
      ? '<g class="lab-svg-vapor" aria-hidden="true">' +
        '<path d="M40 ' + (art.fillTop - 4) + ' q6 -9 0 -18" />' +
        '<path d="M50 ' + (art.fillTop - 8) + ' q7 -10 0 -20" />' +
        '<path d="M60 ' + (art.fillTop - 4) + ' q6 -9 0 -18" />' +
        '</g>'
      : '';

    return '<svg class="lab-vessel" viewBox="0 0 100 160" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">' +
      inside +
      flame +
      '<g class="lab-svg-glass">' + art.glass + '</g>' +
      (art.shine ? '<g class="lab-svg-shine">' + art.shine + '</g>' : '') +
      marksSvg(art) +
      vapor +
      '</svg>';
  }

  function vesselArt(type) {
    return VESSEL_ART[type] || VESSEL_ART.beaker;
  }

  /* A sphere holds most of its volume around the middle, so half a round flask
     is not half its height. Solve 3x^2 - 2x^3 = f for the spherical cap. */
  function bulbHeightFraction(f) {
    var lo = 0;
    var hi = 1;
    for (var i = 0; i < 26; i += 1) {
      var mid = (lo + hi) / 2;
      if (3 * mid * mid - 2 * mid * mid * mid < f) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /* Fill height maps onto the drawn cavity, never onto the whole sprite. */
  function fillGeometry(type, pct) {
    var art = vesselArt(type);
    var clamped = Math.max(0, Math.min(100, Number(pct) || 0));
    var f = clamped / 100;
    if (art.shape === 'bulb' && f > 0 && f < 1) f = bulbHeightFraction(f);
    var span = art.fillBottom - art.fillTop;
    var y = art.fillBottom - span * f;
    return { y: y, height: Math.max(0, art.fillBottom - y), top: art.fillTop, bottom: art.fillBottom };
  }

  var PROCESSES = {
    mix: { id: 'mix', allowed: true },
    pour: { id: 'pour', allowed: true },
    heat: { id: 'heat', allowed: true, maxC: 95 },
    cool: { id: 'cool', allowed: true },
    grind: { id: 'grind', allowed: true },
    aspirate: { id: 'aspirate', allowed: true },
    dispense: { id: 'dispense', allowed: true },
    separate: { id: 'separate', allowed: true },
    connect: { id: 'connect', allowed: true },
    measure: { id: 'measure', allowed: true },
    distill: { id: 'distill', allowed: true, maxC: 250 }
  };

  /* Reviewed reaction models. A reaction only fires when its reactants, state
     and conditions all match; nothing is inferred from free text. */
  var REACTIONS = {
    'acid-base': {
      id: 'acid-base',
      reactants: ['citric_acid', 'bicarbonate'],
      needsLiquid: true,
      equation: 'C₆H₈O₇ + 3 NaHCO₃ → Na₃C₆H₅O₇ + 3 H₂O + 3 CO₂',
      effect: 'gas',
      appearance: 'effervescent mixture',
      product: { id: 'fizz', en: 'Sodium citrate solution + CO₂', pt: 'Solução de citrato de sódio + CO₂' },
      en: 'Carbon dioxide is released, so the mixture fizzes.',
      pt: 'Há liberação de dióxido de carbono, por isso a mistura efervesce.'
    },
    'fe-cu': {
      id: 'fe-cu',
      reactants: ['fe', 'cusulfate'],
      needsLiquid: true,
      equation: 'Fe + CuSO₄ → FeSO₄ + Cu',
      effect: 'precipitate',
      color: '#8FA98A',
      appearance: 'pale green solution with copper',
      product: { id: 'feso4', en: 'Iron(II) sulfate solution + copper', pt: 'Solução de sulfato de ferro(II) + cobre' },
      en: 'Iron displaces copper: the blue solution fades and copper settles out.',
      pt: 'O ferro desloca o cobre: a solução azul desbota e o cobre se deposita.'
    },
    'zn-cu': {
      id: 'zn-cu',
      reactants: ['zn', 'cusulfate'],
      needsLiquid: true,
      equation: 'Zn + CuSO₄ → ZnSO₄ + Cu',
      effect: 'precipitate',
      color: '#C9CFCB',
      appearance: 'colourless solution with copper',
      product: { id: 'znso4', en: 'Zinc sulfate solution + copper', pt: 'Solução de sulfato de zinco + cobre' },
      en: 'Zinc displaces copper and the solution loses its blue colour.',
      pt: 'O zinco desloca o cobre e a solução perde a cor azul.'
    },
    'indicator-acid': {
      id: 'indicator-acid',
      reactants: ['indicator', 'citric_acid'],
      needsLiquid: true,
      equation: 'In + H⁺ → InH⁺',
      effect: 'color',
      color: '#D2606A',
      appearance: 'indicator, acid colour',
      en: 'The indicator turns towards its acid colour.',
      pt: 'O indicador vira para a cor ácida.'
    },
    'indicator-base': {
      id: 'indicator-base',
      reactants: ['indicator', 'bicarbonate'],
      needsLiquid: true,
      equation: 'InH⁺ + OH⁻ → In + H₂O',
      effect: 'color',
      color: '#6F86C4',
      appearance: 'indicator, basic colour',
      en: 'The indicator turns towards its basic colour.',
      pt: 'O indicador vira para a cor básica.'
    }
  };

  var REACTION_ORDER = ['acid-base', 'fe-cu', 'zn-cu', 'indicator-acid', 'indicator-base'];

  function reactionFor(container) {
    var has = {};
    (container.contents || []).forEach(function (row) {
      if ((Number(row.amount) || 0) > 0.05) has[row.id] = true;
    });
    var wet = (Number(container.volumeMl) || 0) > 0;
    for (var i = 0; i < REACTION_ORDER.length; i += 1) {
      var model = REACTIONS[REACTION_ORDER[i]];
      if (model.needsLiquid && !wet) continue;
      var matched = model.reactants.every(function (id) { return has[id]; });
      if (matched) return model;
    }
    return null;
  }

  var READY = [
    { id: 'saline_ready', labelEn: 'Saline (ready)', labelPt: 'Soro (pronto)', parts: [{ id: 'water', amount: 40 }, { id: 'nacl', amount: 8 }] },
    { id: 'cu_ready', labelEn: 'Copper sulfate solution', labelPt: 'Sulfato de cobre (pronto)', parts: [{ id: 'water', amount: 40 }, { id: 'cusulfate', amount: 8 }] },
    { id: 'sugar_ready', labelEn: 'Sugar solution', labelPt: 'Solução de açúcar', parts: [{ id: 'water', amount: 40 }, { id: 'sucrose', amount: 10 }] },
    { id: 'sunscreen_ready', labelEn: 'Mineral lotion (ready)', labelPt: 'Loção mineral (pronta)', parts: [{ id: 'water', amount: 20 }, { id: 'oil', amount: 15 }, { id: 'zno', amount: 8 }] },
    { id: 'crude_ready', labelEn: 'Virtual crude blend', labelPt: 'Blend bruto virtual', parts: [{ id: 'frac_light', amount: 25 }, { id: 'frac_mid', amount: 25 }, { id: 'frac_heavy', amount: 15 }] },
    { id: 'accord_ready', labelEn: 'Citrus accord (ready)', labelPt: 'Acorde cítrico (pronto)', parts: [{ id: 'limonene', amount: 8 }, { id: 'linalool', amount: 6 }, { id: 'vanillin', amount: 4 }] }
  ];

  var DENIED = {
    cocaine: 1, heroin: 1, methamphetamine: 1, meth: 1, fentanyl: 1, mdma: 1,
    tnt: 1, c4: 1, dynamite: 1, rdx: 1, anfo: 1, nitroglycerin: 1,
    ricin: 1, sarin: 1, vx: 1, cyanide: 1, chlorine_gas: 1, mustard_gas: 1,
    gunpowder: 1, black_powder: 1, thermite: 1, napalm: 1, ricinolo: 1,
    cocaina: 1, heroina: 1, metanfetamina: 1, explosivo: 1, bomba: 1, explosivos: 1,
    veneno: 1, poison: 1, bomba_caseira: 1
  };

  var ALIASES = {
    h2o: 'water', agua: 'water', água: 'water', salt: 'nacl', 'sodium chloride': 'nacl',
    sugar: 'sucrose', 'citric acid': 'citric_acid', baking_soda: 'bicarbonate',
    'sodium bicarbonate': 'bicarbonate', lemon: 'limonene', vanilla: 'vanillin',
    graphite: 'carbon', diamond: 'guided:diamond', perfume: 'guided:fragrance',
    fragrance: 'guided:fragrance', solution: 'guided:solution', ph: 'guided:ph',
    crystal: 'guided:crystal', 'acid base': 'guided:ph', iron: 'fe', ferro: 'fe',
    copper: 'cu', cobre: 'cu', zinc: 'zn', zinco: 'zn', sulfur: 's', enxofre: 's',
    'copper sulfate': 'cusulfate', 'sulfato de cobre': 'cusulfate', carbon: 'c',
    sunscreen: 'guided:sunscreen', 'protetor solar': 'guided:sunscreen', protetor: 'guided:sunscreen',
    'zinc oxide': 'zno', 'oxido de zinco': 'zno', 'óxido de zinco': 'zno',
    'titanium dioxide': 'tio2', oil: 'oil', oleo: 'oil', óleo: 'oil',
    ethanol: 'ethanol', etanol: 'ethanol', alcohol: 'ethanol', álcool: 'ethanol', alcool: 'ethanol',
    distillation: 'guided:distillation', destilacao: 'guided:distillation', 'destilação': 'guided:distillation',
    distill: 'guided:distillation', separation: 'guided:distillation',
    petroleum: 'guided:petroleum', petroleo: 'guided:petroleum', 'petróleo': 'guided:petroleum',
    refinery: 'guided:petroleum', refino: 'guided:petroleum', gasoline: 'guided:petroleum',
    gasolina: 'guided:petroleum', 'fractional distillation': 'guided:petroleum'
  };

  var CREATIONS = [
    {
      id: 'distillation',
      slug: 'separate-a-mixture-by-distillation',
      title: { en: 'Separate a Mixture by Distillation', pt: 'Separar uma mistura por destilação' },
      category: 'Separations',
      difficulty: { en: 'Intermediate', pt: 'Intermediário' },
      access: 'account',
      demo: true,
      educational: true,
      lede: {
        en: 'Build a still from the glassware, heat a virtual ethanol-water mixture and watch the lower-boiling component come across. This models the separation principle; it is not a procedure for producing a drinkable or fuel product.',
        pt: 'Monte a aparelhagem com a vidraria, aqueça uma mistura virtual de etanol e água e veja o componente de menor ponto de ebulição passar. Isto modela o princípio da separação; não é um procedimento para produzir bebida ou combustível.'
      },
      stages: ['assemble', 'heat', 'collect'],
      safetyClass: 'educational',
      version: 3,
      learningObjectives: {
        en: 'Boiling point, vapour, condensation and why an azeotrope caps simple distillation.',
        pt: 'Ponto de ebulição, vapor, condensação e por que um azeótropo limita a destilação simples.'
      },
      tutorial: [
        { id: 'flask', action: 'addEquipment', needEquipment: ['round-flask'], en: 'Place a round-bottom flask: it heats evenly.', pt: 'Coloque um balão de fundo redondo: ele aquece por igual.', why: { en: 'A round bottom spreads heat without hot spots.', pt: 'O fundo redondo espalha o calor sem pontos quentes.' } },
        { id: 'cond', action: 'addEquipment', needEquipment: ['condenser'], en: 'Add a Liebig condenser.', pt: 'Adicione um condensador de Liebig.', why: { en: 'Vapour has to cool back to liquid somewhere.', pt: 'O vapor precisa voltar a líquido em algum lugar.' } },
        { id: 'recv', action: 'addEquipment', needEquipment: ['receiving-flask'], en: 'Add a receiving flask for the distillate.', pt: 'Adicione um balão coletor para o destilado.' },
        { id: 'heater', action: 'addEquipment', needEquipment: ['heating-mantle'], en: 'Add a heating mantle under the flask.', pt: 'Adicione uma manta de aquecimento sob o balão.', why: { en: 'A mantle reaches distillation temperatures; a warm hand does not.', pt: 'A manta atinge temperaturas de destilação; a mão morna não.' } },
        { id: 'charge', action: 'addMaterial', need: { water: true, ethanol: true }, amounts: { water: 60, ethanol: 40 }, into: 'round-flask', en: 'Charge the flask with 60 mL of water and 40 mL of ethanol.', pt: 'Carregue o balão com 60 mL de água e 40 mL de etanol.', why: { en: 'Ethanol boils at 78 °C and water at 100 °C, so they can be separated.', pt: 'O etanol ferve a 78 °C e a água a 100 °C, por isso podem ser separados.' } },
        { id: 'rig', action: 'connect', needConnections: 2, en: 'Connect flask to condenser and condenser to receiver.', pt: 'Conecte o balão ao condensador e o condensador ao coletor.', why: { en: 'The train only works if the vapour has a sealed path.', pt: 'A aparelhagem só funciona se o vapor tiver um caminho fechado.' } },
        { id: 'heat', action: 'heat', heatTo: 80, needTemp: 76, en: 'Heat the flask to about 80 °C.', pt: 'Aqueça o balão até cerca de 80 °C.', why: { en: 'Just above the ethanol boiling point, so mostly ethanol vaporises.', pt: 'Logo acima do ponto de ebulição do etanol, então vaporiza sobretudo etanol.' } },
        { id: 'run', action: 'distill', needIn: { type: 'receiving-flask', id: 'ethanol' }, en: 'Distil, and read the purity in the notebook.', pt: 'Destile e leia a pureza no caderno.', why: { en: 'Ethanol and water form an azeotrope near 95%, so simple distillation cannot go further.', pt: 'Etanol e água formam um azeótropo perto de 95%, então a destilação simples não passa disso.' } }
      ]
    },
    {
      id: 'petroleum',
      slug: 'petroleum-fractions',
      title: { en: 'Petroleum Fractions (conceptual)', pt: 'Frações do petróleo (conceitual)' },
      category: 'Separations',
      difficulty: { en: 'Intermediate', pt: 'Intermediário' },
      access: 'account',
      demo: false,
      educational: true,
      lede: {
        en: 'A conceptual model of fractional distillation using virtual fractions. It shows why a refinery column separates crude oil by boiling range. It is not a procedure for refining fuel.',
        pt: 'Modelo conceitual da destilação fracionada com frações virtuais. Mostra por que uma coluna de refino separa o petróleo por faixa de ebulição. Não é um procedimento para refinar combustível.'
      },
      stages: ['charge', 'heat', 'fractions'],
      safetyClass: 'conceptual',
      version: 1,
      learningObjectives: {
        en: 'Crude oil is a mixture; a column separates it by boiling range, lightest at the top.',
        pt: 'O petróleo é uma mistura; a coluna separa por faixa de ebulição, com os mais leves no topo.'
      },
      /* Tower order, bottom to top: the heaviest fractions never reach the top
         trays, which is the whole point of the column. */
      fractions: [
        { id: 'residue', bpFrom: 400, en: 'Residue (paraffin wax, asphalt)', pt: 'Resíduos (parafina, asfalto)' },
        { id: 'lubricant', bpFrom: 350, en: 'Lubricating oil', pt: 'Óleo lubrificante' },
        { id: 'fuel-oil', bpFrom: 300, en: 'Fuel oil', pt: 'Óleo combustível' },
        { id: 'kerosene', bpFrom: 175, en: 'Kerosene', pt: 'Querosene' },
        { id: 'gasoline', bpFrom: 40, en: 'Gasoline', pt: 'Gasolina' },
        { id: 'gas', bpFrom: -160, en: 'Refinery gas', pt: 'Gás' }
      ],
      tutorial: [
        { id: 'rigup', action: 'addEquipment', needEquipment: ['round-flask', 'condenser', 'receiving-flask', 'heating-mantle'], en: 'Place the flask, condenser, receiver and mantle.', pt: 'Coloque o balão, o condensador, o coletor e a manta.' },
        { id: 'charge', action: 'addMaterial', need: { frac_light: true, frac_mid: true }, amounts: { frac_light: 30, frac_mid: 30 }, into: 'round-flask', en: 'Charge the flask with the virtual light and mid fractions.', pt: 'Carregue o balão com as frações virtuais leve e média.', why: { en: 'Crude oil is a mixture of hydrocarbons with different chain lengths.', pt: 'O petróleo é uma mistura de hidrocarbonetos com cadeias de tamanhos diferentes.' } },
        { id: 'rig', action: 'connect', needConnections: 2, en: 'Connect the train.', pt: 'Conecte a aparelhagem.' },
        { id: 'heat', action: 'heat', heatTo: 70, needTemp: 63, en: 'Heat to about 70 °C to take the lightest fraction first.', pt: 'Aqueça até cerca de 70 °C para tirar primeiro a fração mais leve.', why: { en: 'A refinery heats crude in a furnace and feeds it to the bottom of the tower. The lightest fractions rise highest before they condense.', pt: 'Uma refinaria aquece o petróleo numa fornalha e o injeta na base da torre. As frações mais leves sobem mais alto antes de condensar.' } },
        { id: 'run', action: 'distill', needIn: { type: 'receiving-flask', id: 'frac_light' }, en: 'Distil the light fraction over, then read the tower order.', pt: 'Destile a fração leve e leia a ordem da torre.', why: { en: 'Top to bottom a real tower gives refinery gas, gasoline, kerosene, fuel oil, lubricating oil and finally residue: paraffin wax and asphalt.', pt: 'Do topo para a base, uma torre real dá gás, gasolina, querosene, óleo combustível, óleo lubrificante e, no fundo, resíduos: parafina e asfalto.' } }
      ]
    },

    {
      id: 'solution',
      slug: 'prepare-a-solution',
      title: { en: 'Prepare a Solution', pt: 'Preparar uma solução' },
      category: 'Solutions',
      difficulty: { en: 'Introductory', pt: 'Introdutório' },
      access: 'account',
      demo: true,
      lede: {
        en: 'Dissolve a virtual solute and read concentration, volume and appearance.',
        pt: 'Dissolva um soluto virtual e leia concentração, volume e aparência.'
      },
      stages: ['choose', 'dissolve', 'measure'],
      safetyClass: 'educational',
      version: 2,
      learningObjectives: {
        en: 'Mass, volume and virtual concentration on the free board.',
        pt: 'Massa, volume e concentração virtual no board livre.'
      },
      tutorial: [
        { id: 'eq', action: 'addEquipment', needEquipment: ['beaker'], en: 'Place a beaker on the board.', pt: 'Coloque um becker no board.', why: { en: 'A beaker holds an approximate volume.', pt: 'O becker contém um volume aproximado.' } },
        { id: 'water', action: 'addMaterial', need: { water: true }, amounts: { water: 60 }, en: 'Add 60 mL of virtual water to the beaker.', pt: 'Adicione 60 mL de água virtual ao becker.', why: { en: 'The solvent goes in first so the solute has somewhere to dissolve.', pt: 'O solvente entra primeiro para o soluto ter onde dissolver.' } },
        { id: 'salt', action: 'addMaterial', need: { nacl: true }, amounts: { nacl: 10 }, en: 'Add 10 g of sodium chloride and stir.', pt: 'Adicione 10 g de cloreto de sódio e agite.', stir: true, why: { en: 'Stirring spreads the solute through the solvent.', pt: 'Agitar espalha o soluto pelo solvente.' } },
        { id: 'read', action: 'inspect', product: 'saline', en: 'Measure volume and read the named product.', pt: 'Meça o volume e leia o produto nomeado.' }
      ]
    },
    {
      id: 'fragrance',
      slug: 'create-a-fragrance-accord',
      title: { en: 'Create a Fragrance Accord', pt: 'Criar um acorde de fragrância' },
      category: 'Fragrance',
      difficulty: { en: 'Introductory', pt: 'Introdutório' },
      access: 'account',
      demo: true,
      lede: {
        en: 'Compose top, heart and base notes. This is a virtual olfactory family, not a manufacturing recipe.',
        pt: 'Componha notas de topo, coração e fundo. É uma família olfativa virtual, não uma receita de fabricação.'
      },
      stages: ['notes', 'balance', 'observe'],
      safetyClass: 'educational',
      version: 2,
      learningObjectives: {
        en: 'Top, heart and base notes. Not a skin-safe formula.',
        pt: 'Notas de topo, coração e fundo. Não é fórmula segura para pele.'
      },
      tutorial: [
        { id: 'top', action: 'addMaterial', need: { limonene: true }, amounts: { limonene: 8 }, needEquipment: ['beaker'], en: 'Add 8 mL of a top note (limonene) to a beaker.', pt: 'Adicione uma nota de topo (limoneno).', why: { en: 'Top notes evaporate first.', pt: 'Notas de topo evaporam primeiro.' } },
        { id: 'heart', action: 'addMaterial', need: { linalool: true }, amounts: { linalool: 6 }, en: 'Add 6 mL of a heart note (linalool).', pt: 'Adicione 6 mL de uma nota de coração (linalol).', why: { en: 'Heart notes carry the accord after the top fades.', pt: 'As notas de coração sustentam o acorde depois que o topo evapora.' } },
        { id: 'base', action: 'addMaterial', need: { vanillin: true }, amounts: { vanillin: 4 }, en: 'Add 4 mL of a base note (vanillin).', pt: 'Adicione 4 mL de uma nota de fundo (vanilina).', why: { en: 'Base notes are the least volatile and stay longest.', pt: 'As notas de fundo são as menos voláteis e permanecem mais tempo.' } },
        { id: 'read', action: 'inspect', product: 'accord', en: 'Read the virtual family. This is not a wearable perfume.', pt: 'Leia a família virtual. Isto não é um perfume para a pele.' }
      ]
    },
    {
      id: 'diamond',
      slug: 'explore-artificial-diamond',
      title: { en: 'Explore Artificial Diamond Formation', pt: 'Explorar a formação do diamante' },
      category: 'Materials',
      difficulty: { en: 'Intermediate', pt: 'Intermediário' },
      access: 'account',
      demo: false,
      educational: true,
      lede: {
        en: 'A conceptual simulation of carbon allotropes. Not a procedure for high-pressure equipment.',
        pt: 'Simulação conceitual de alótropos de carbono. Não é um procedimento de equipamento de alta pressão.'
      },
      stages: ['structure', 'conditions', 'result'],
      safetyClass: 'conceptual',
      version: 2,
      tutorial: [
        { id: 'carbon', action: 'addMaterial', needAny: ['c', 'carbon'], amounts: { c: 10 }, needEquipment: ['beaker'], en: 'Place 10 g of virtual carbon in a beaker.', pt: 'Coloque 10 g de carbono virtual em um becker.', why: { en: 'Graphite and diamond are both carbon in different lattices.', pt: 'Grafite e diamante são carbono em redes diferentes.' } },
        { id: 'inspect', action: 'inspect', en: 'Open Allotropes to compare graphite and diamond conceptually.', pt: 'Abra Alótropos para comparar grafite e diamante de forma conceitual.' }
      ]
    },
    {
      id: 'ph',
      slug: 'ph-challenge',
      title: { en: 'pH Challenge', pt: 'Desafio de pH' },
      category: 'Solutions',
      difficulty: { en: 'Introductory', pt: 'Introdutório' },
      access: 'account',
      demo: true,
      lede: {
        en: 'Mix approved acidic and basic materials and measure a virtual pH.',
        pt: 'Misture materiais ácidos e básicos aprovados e meça um pH virtual.'
      },
      stages: ['mix', 'measure', 'neutral'],
      safetyClass: 'educational',
      version: 2,
      tutorial: [
        { id: 'acid', action: 'addMaterial', need: { water: true, citric_acid: true }, amounts: { water: 50, citric_acid: 6 }, needEquipment: ['beaker'], en: 'Add water, then 6 g of citric acid.', pt: 'Adicione água e depois 6 g de ácido cítrico.', why: { en: 'The acid needs water before a virtual pH can be read.', pt: 'O ácido precisa de água antes de um pH virtual ser lido.' } },
        { id: 'base', action: 'addMaterial', need: { bicarbonate: true }, amounts: { bicarbonate: 6 }, en: 'Add 6 g of bicarbonate. The mixture may fizz.', pt: 'Adicione 6 g de bicarbonato. A mistura pode efervescer.', why: { en: 'A base neutralises the acid and moves the virtual pH.', pt: 'Uma base neutraliza o ácido e move o pH virtual.' } },
        { id: 'measure', action: 'measure', en: 'Measure virtual pH from the inspector.', pt: 'Meça o pH virtual no inspetor.' }
      ]
    },
    {
      id: 'crystal',
      slug: 'crystal-growth',
      title: { en: 'Crystal Growth Simulation', pt: 'Crescimento de cristal' },
      category: 'Crystals',
      difficulty: { en: 'Introductory', pt: 'Introdutório' },
      access: 'account',
      demo: false,
      lede: {
        en: 'Evaporate a virtual solution and observe crystal growth conceptually.',
        pt: 'Evapore uma solução virtual e observe o crescimento cristalino de forma conceitual.'
      },
      stages: ['dissolve', 'evaporate', 'observe'],
      safetyClass: 'educational',
      version: 2,
      tutorial: [
        { id: 'dissolve', action: 'addMaterial', need: { water: true, sucrose: true }, amounts: { water: 60, sucrose: 20 }, needEquipment: ['beaker'], en: 'Dissolve 20 g of sucrose in 60 mL of water.', pt: 'Dissolva 20 g de sacarose em 60 mL de água.', why: { en: 'Crystals only grow from a concentrated solution.', pt: 'Cristais só crescem a partir de uma solução concentrada.' } },
        { id: 'heat', action: 'heat', en: 'Warm the vessel with a Bunsen or heat control (virtual).', pt: 'Aqueça o vidro com Bunsen ou o controle de calor (virtual).' },
        { id: 'observe', action: 'inspect', product: 'sugar-sol', en: 'Observe the modeled solution. This is not a crystal-growing recipe.', pt: 'Observe a solução modelada. Não é uma receita de cristalização.' }
      ]
    },
    {
      id: 'sunscreen',
      slug: 'virtual-mineral-sunscreen',
      title: { en: 'Virtual mineral sunscreen', pt: 'Protetor solar virtual' },
      category: 'Cosmetics',
      difficulty: { en: 'Introductory', pt: 'Introdutório' },
      access: 'account',
      demo: true,
      educational: true,
      lede: {
        en: 'A conceptual mineral emulsion with zinc oxide. Not a manufacturing recipe and not an SPF claim.',
        pt: 'Emulsão mineral conceitual com óxido de zinco. Não é receita de fabricação nem alegação de FPS.'
      },
      stages: ['choose', 'disperse', 'emulsify', 'observe'],
      tutorial: [
        { id: 'base', action: 'addMaterial', need: { water: true, oil: true }, amounts: { water: 20, oil: 15 }, needEquipment: ['beaker'], en: 'Add 20 mL of water and 15 mL of virtual carrier oil to a beaker.', pt: 'Coloque 20 mL de água e 15 mL de óleo virtual em um becker.', why: { en: 'Aqueous and oil phases must meet before a mineral filter can disperse.', pt: 'As fases aquosa e oleosa precisam se encontrar antes de dispersar o filtro mineral.' } },
        { id: 'filter', action: 'addMaterial', needAny: ['zno', 'tio2'], amounts: { zno: 8, tio2: 8 }, en: 'Disperse 8 g of zinc oxide or titanium dioxide into the base.', pt: 'Dispersar óxido de zinco ou dióxido de titânio na base.', why: { en: 'These are modeled as mineral UV-filter roles, not a certified SPF.', pt: 'Isto modela o papel de filtro UV mineral, não um FPS certificado.' } },
        { id: 'stir', action: 'mix', stir: true, en: 'Stir to form a virtual emulsion.', pt: 'Agite para formar uma emulsão virtual.' },
        { id: 'observe', action: 'inspect', product: 'sunscreen', en: 'Read the inspector. This models a mineral UV filter, not a real SPF.', pt: 'Leia o inspetor. Isto modela um filtro UV mineral, não um FPS real.' }
      ]
    }
  ];

  function nowIso() { return new Date().toISOString(); }

  function uid() {
    return 'lab_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function norm(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function logDeny(kind, query) {
    try {
      if (typeof console !== 'undefined' && console.debug) {
        console.debug('[atomurus-lab] blocked', kind, String(query || '').slice(0, 80));
      }
    } catch (e) {}
  }

  function resolveQuery(raw) {
    var q = norm(raw);
    if (!q) return { ok: false, reason: 'empty' };
    if (DENIED[q] || DENIED[q.replace(/\s+/g, '_')]) {
      logDeny('denied', q);
      return { ok: false, reason: 'unavailable', educational: '/explore.html' };
    }
    if (ALIASES[q] && String(ALIASES[q]).indexOf('guided:') === 0) {
      return { ok: true, kind: 'creation', id: ALIASES[q].slice(7) };
    }
    var sid = ALIASES[q] || q;
    if (SUBSTANCES[sid] && SUBSTANCES[sid].allowed) return { ok: true, kind: 'substance', id: sid };
    var creation = CREATIONS.filter(function (row) {
      return row.id === q || row.slug === q || norm(row.title.en) === q || norm(row.title.pt) === q;
    })[0];
    if (creation) return { ok: true, kind: 'creation', id: creation.id };
    logDeny('unknown', q);
    return { ok: false, reason: 'unknown', explore: '/explore.html' };
  }

  function vesselLetter(index) {
    return String.fromCharCode(65 + (index % 26));
  }

  function defaultPos(index) {
    return {
      x: 56 + (index % 4) * 136,
      y: 48 + Math.floor(index / 4) * 210
    };
  }

  function specOf(type) {
    return EQUIPMENT[type] || EQUIPMENT.beaker;
  }

  function hasCap(containerOrType, cap) {
    var type = containerOrType && containerOrType.type ? containerOrType.type : containerOrType;
    var spec = EQUIPMENT[type] || {};
    return (spec.capabilities || []).indexOf(cap) !== -1;
  }

  function processAllowed(id) {
    return Boolean(PROCESSES[id] && PROCESSES[id].allowed);
  }

  function canHold(container) {
    if (!container) return false;
    var spec = EQUIPMENT[container.type] || {};
    if (spec.holds === false) return false;
    if ((spec.capabilities || []).length) {
      if (spec.capabilities.indexOf('contain') !== -1) return (Number(container.capacityMl) || spec.capacityMl || 0) > 0;
      if (spec.capabilities.indexOf('aspirate') !== -1) return (Number(container.capacityMl) || spec.capacityMl || 0) > 0;
      return false;
    }
    return (Number(container.capacityMl) || 0) > 0;
  }

  function canAddSubstance(container, spec) {
    if (!container || !spec || !spec.allowed) return false;
    var eqSpec = EQUIPMENT[container.type] || {};
    var caps = specOf(container.type).capabilities || [];
    if (eqSpec.holds === false && caps.indexOf('contain') === -1) return false;
    if (caps.indexOf('aspirate') !== -1 && caps.indexOf('contain') === -1) return false;
    if (spec.state === 'solid' && (caps.indexOf('contain') !== -1 || caps.indexOf('grind') !== -1)) return true;
    if (spec.state !== 'solid' && caps.indexOf('contain') !== -1) return true;
    return canHold(container) && caps.indexOf('aspirate') === -1;
  }

  function makeBoardObject(container, index) {
    var spec = specOf(container.type);
    var pos = defaultPos(index);
    return {
      id: container.id,
      kind: 'equipment',
      type: container.type,
      x: isFinite(Number(container.x)) ? Number(container.x) : pos.x,
      y: isFinite(Number(container.y)) ? Number(container.y) : pos.y,
      rotation: Number(container.rotation) || 0,
      zIndex: index + 1,
      locked: false,
      w: spec.w || 124,
      h: spec.h || 188,
      stateRef: container.id
    };
  }

  function ensureBoard(session) {
    if (!session.board) {
      session.board = {
        camera: {
          x: Number(session.panX) || 0,
          y: Number(session.panY) || 0,
          zoom: Number(session.zoom) || 1
        },
        objects: [],
        connections: []
      };
    }
    if (!session.board.camera) session.board.camera = { x: 0, y: 0, zoom: 1 };
    if (!isFinite(session.board.camera.zoom) || session.board.camera.zoom < ZOOM_MIN) session.board.camera.zoom = 1;
    if (session.board.camera.zoom > ZOOM_MAX) session.board.camera.zoom = ZOOM_MAX;
    if (!Array.isArray(session.board.objects)) session.board.objects = [];
    if (!Array.isArray(session.board.connections)) session.board.connections = [];
    var byId = {};
    session.board.objects.forEach(function (obj) { byId[obj.id] = obj; });
    (session.containers || []).forEach(function (row, i) {
      if (!byId[row.id]) {
        session.board.objects.push(makeBoardObject(row, i));
      } else {
        byId[row.id].type = row.type;
        byId[row.id].stateRef = row.id;
        if (!isFinite(Number(byId[row.id].x))) byId[row.id].x = Number(row.x) || defaultPos(i).x;
        if (!isFinite(Number(byId[row.id].y))) byId[row.id].y = Number(row.y) || defaultPos(i).y;
      }
    });
    session.schemaVersion = SCHEMA_VERSION;
    return session;
  }

  function findObject(session, id) {
    return ((session.board && session.board.objects) || []).filter(function (row) { return row.id === id; })[0];
  }

  function syncVisual(session, id) {
    var obj = findObject(session, id);
    var container = findContainer(session, id);
    if (obj && container) {
      container.x = obj.x;
      container.y = obj.y;
      container.rotation = obj.rotation || 0;
    }
  }

  function nextZ(session) {
    return ((session.board && session.board.objects) || []).reduce(function (max, row) {
      return Math.max(max, Number(row.zIndex) || 0);
    }, 0) + 1;
  }

  function makeVessel(type, index) {
    var spec = EQUIPMENT[type] || EQUIPMENT.beaker;
    var pos = defaultPos(index);
    return {
      id: spec.type + '-' + vesselLetter(index).toLowerCase(),
      type: spec.type,
      label: spec.labelEn + ' ' + vesselLetter(index),
      capacityMl: spec.capacityMl || 0,
      volumeMl: 0,
      temperatureC: 22,
      contents: [],
      appearance: 'empty',
      x: pos.x,
      y: pos.y,
      rotation: 0
    };
  }

  function emptySession(opts) {
    opts = opts || {};
    var session = {
      id: uid(),
      title: opts.title || 'Open Bench',
      mode: opts.mode || 'bench',
      creationId: opts.creationId || '',
      lang: opts.lang || 'en',
      schemaVersion: SCHEMA_VERSION,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      selectedId: 'beaker-a',
      containers: [
        makeVessel('beaker', 0),
        makeVessel('flask', 1),
        makeVessel('cylinder', 2)
      ],
      inventory: Object.keys(SUBSTANCES),
      measurements: [],
      observations: [],
      history: [],
      redo: [],
      stage: 0,
      result: '',
      board: { camera: { x: 0, y: 0, zoom: 1 }, objects: [], connections: [] }
    };
    return ensureBoard(session);
  }

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : { sessions: [] };
      if (!Array.isArray(data.sessions)) data.sessions = [];
      return data;
    } catch (e) {
      return { sessions: [] };
    }
  }

  function writeStore(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function listSessions() {
    return loadStore().sessions.slice().sort(function (a, b) {
      return String(b.updatedAt).localeCompare(String(a.updatedAt));
    });
  }

  function saveSession(session) {
    if (!session) return session;
    session.updatedAt = nowIso();
    var store = loadStore();
    var i = 0;
    var found = false;
    for (i = 0; i < store.sessions.length; i += 1) {
      if (store.sessions[i].id === session.id) {
        store.sessions[i] = session;
        found = true;
        break;
      }
    }
    if (!found) store.sessions.unshift(session);
    if (store.sessions.length > MAX_SESSIONS) store.sessions = store.sessions.slice(0, MAX_SESSIONS);
    writeStore(store);
    return session;
  }

  function snapshot(session) {
    try { return JSON.parse(JSON.stringify(session)); } catch (e) { return session; }
  }

  function pushHistory(session) {
    session.history = (session.history || []).concat([snapshot({
      containers: session.containers,
      measurements: session.measurements,
      stage: session.stage,
      selectedId: session.selectedId,
      board: session.board,
      stirred: session.stirred
    })]);
    if (session.history.length > HISTORY_CAP) session.history = session.history.slice(-HISTORY_CAP);
    session.redo = [];
  }

  function restoreSlice(session, slice) {
    if (!slice) return session;
    session.containers = slice.containers;
    session.measurements = slice.measurements;
    session.stage = slice.stage;
    session.selectedId = slice.selectedId || (session.containers[0] || {}).id;
    session.board = slice.board || session.board;
    session.stirred = slice.stirred;
    ensureBoard(session);
    return session;
  }

  function undoSession(session) {
    var prev = (session.history || []).pop();
    if (!prev) return { ok: false };
    session.redo = (session.redo || []).concat([snapshot({
      containers: session.containers,
      measurements: session.measurements,
      stage: session.stage,
      selectedId: session.selectedId,
      board: session.board,
      stirred: session.stirred
    })]);
    restoreSlice(session, prev);
    return { ok: true };
  }

  function redoSession(session) {
    var next = (session.redo || []).pop();
    if (!next) return { ok: false };
    session.history = (session.history || []).concat([snapshot({
      containers: session.containers,
      measurements: session.measurements,
      stage: session.stage,
      selectedId: session.selectedId,
      board: session.board,
      stirred: session.stirred
    })]);
    restoreSlice(session, next);
    return { ok: true };
  }

  function line(session, en, pt) {
    return (session && session.lang === 'pt' && pt) ? pt : en;
  }

  function observe(session, text) {
    session.observations = (session.observations || []).concat([{ at: nowIso(), text: text }]);
    if (session.observations.length > 80) session.observations = session.observations.slice(-80);
  }

  function findContainer(session, id) {
    return (session.containers || []).filter(function (row) { return row.id === id; })[0];
  }

  function containerMass(container) {
    return (container.contents || []).reduce(function (sum, row) {
      return sum + (Number(row.amount) || 0);
    }, 0);
  }

  function hexRgb(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (!n && n !== 0) return { r: 126, g: 182, b: 217 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function mixColor(container) {
    var contents = container.contents || [];
    if (!contents.length) return 'transparent';
    var hasIndicator = contents.some(function (row) { return row.id === 'indicator'; });
    if (hasIndicator && container.ph != null) {
      var ph = Number(container.ph);
      if (ph < 4) return '#E06B6B';
      if (ph < 6) return '#E6A15A';
      if (ph < 8) return '#7EBF7A';
      if (ph < 10) return '#5B8FD9';
      return '#8A6BBF';
    }
    var r = 0;
    var g = 0;
    var b = 0;
    var w = 0;
    contents.forEach(function (row) {
      var spec = SUBSTANCES[row.id];
      if (!spec) return;
      var amt = Number(row.amount) || 1;
      var rgb = hexRgb(spec.color);
      r += rgb.r * amt;
      g += rgb.g * amt;
      b += rgb.b * amt;
      w += amt;
    });
    if (!w) return 'transparent';
    return 'rgb(' + Math.round(r / w) + ',' + Math.round(g / w) + ',' + Math.round(b / w) + ')';
  }

  function mixContainer(container) {
    var contents = container.contents || [];
    var volume = Number(container.volumeMl) || 0;
    var acids = 0;
    var bases = 0;
    var salts = 0;
    var copper = 0;
    var notes = { top: 0, heart: 0, base: 0 };
    var elements = 0;
    var minerals = 0;
    var oilAmt = 0;
    var fizz = false;
    contents.forEach(function (row) {
      var spec = SUBSTANCES[row.id];
      if (!spec) return;
      var amt = Number(row.amount) || 0;
      if (spec.category === 'acid') acids += amt;
      if (spec.category === 'base') bases += amt;
      if (spec.category === 'salt') salts += amt;
      if (spec.category === 'mineral') minerals += amt;
      if (spec.id === 'oil') oilAmt += amt;
      if (spec.id === 'cusulfate') copper += amt;
      if (spec.category === 'element') elements += amt;
      if (spec.note) notes[spec.note] += amt;
    });
    fizz = acids > 0 && bases > 0 && volume > 0;
    var ph = 7;
    if (acids || bases) {
      var net = bases - acids;
      ph = Math.max(1, Math.min(13, 7 + net * 0.08));
    }
    var appearance = 'clear';
    if (!contents.length) appearance = 'empty';
    else if (minerals && (oilAmt || volume)) appearance = 'mineral emulsion';
    else if (oilAmt && volume) appearance = 'emulsion';
    else if (notes.top + notes.heart + notes.base > 0) appearance = 'fragrance accord';
    else if (copper && volume) appearance = 'blue solution';
    else if (fizz) appearance = 'effervescent mixture';
    else if (salts && volume) appearance = 'saline solution';
    else if (acids && bases) appearance = 'neutralized mixture';
    else if (acids) appearance = 'acidic solution';
    else if (bases) appearance = 'basic solution';
    else if (elements && !volume) appearance = 'dry sample';
    else if (elements && (Number(container.temperatureC) || 22) >= 40) appearance = 'warm suspension';
    else if (elements) appearance = 'suspension';
    container.ph = Math.round(ph * 10) / 10;
    container.appearance = appearance;
    container.color = mixColor(container);
    container.fizz = fizz;
    container.modeled = Boolean(contents.length);
    container.phases = [];
    if (oilAmt && volume && appearance.indexOf('emulsion') === -1) {
      var totalPhase = oilAmt + volume;
      container.phases = [
        { id: 'oil', ratio: oilAmt / totalPhase },
        { id: 'water', ratio: volume / totalPhase }
      ];
    } else if (oilAmt && volume) {
      container.phases = [
        { id: 'oil', ratio: oilAmt / (oilAmt + volume) },
        { id: 'water', ratio: volume / (oilAmt + volume) }
      ];
    }
    var reaction = reactionFor(container);
    container.reactionId = reaction ? reaction.id : '';
    container.reactionEq = reaction ? reaction.equation : '';
    container.reactionEffect = reaction ? reaction.effect : '';
    if (reaction && reaction.color) container.color = reaction.color;
    if (reaction && reaction.effect === 'gas') container.fizz = true;
    var product = identifyProduct(container);
    container.productId = product ? product.id : '';
    container.product = product ? product.en : '';
    container.productPt = product ? product.pt : '';
    if (reaction) {
      if (reaction.appearance) container.appearance = reaction.appearance;
      if (reaction.product) {
        container.productId = reaction.product.id;
        container.product = reaction.product.en;
        container.productPt = reaction.product.pt;
      }
    }
    return container;
  }

  /* A reaction is logged once, when it first appears in that vessel. */
  function noteReaction(session, container, beforeId) {
    var model = container.reactionId ? REACTIONS[container.reactionId] : null;
    if (!model || container.reactionId === beforeId) return null;
    observe(session, line(session, model.en + ' ' + model.equation, model.pt + ' ' + model.equation));
    return model;
  }

  function identifyProduct(container) {
    var has = {};
    (container.contents || []).forEach(function (row) {
      if ((Number(row.amount) || 0) > 0.05) has[row.id] = true;
    });
    var wet = (Number(container.volumeMl) || 0) > 0;
    var warm = (Number(container.temperatureC) || 22) >= 40;
    if ((has.zno || has.tio2) && has.oil && wet) {
      return { id: 'sunscreen', en: 'Virtual mineral sunscreen', pt: 'Protetor solar virtual' };
    }
    if (has.oil && wet) {
      return { id: 'emulsion', en: 'Virtual emulsion', pt: 'Emulsão virtual' };
    }
    if (has.citric_acid && has.bicarbonate && wet) {
      return { id: 'fizz', en: 'Effervescent mixture', pt: 'Mistura efervescente' };
    }
    if (has.indicator && wet) {
      return { id: 'indicator-mix', en: 'pH indicator mixture', pt: 'Mistura com indicador de pH' };
    }
    if (has.cusulfate && wet) {
      return { id: 'cu-sol', en: 'Copper sulfate solution', pt: 'Solução de sulfato de cobre' };
    }
    if (has.nacl && wet) {
      return { id: 'saline', en: 'Saline solution', pt: 'Solução salina' };
    }
    if (has.sucrose && wet) {
      return { id: 'sugar-sol', en: 'Sugar solution', pt: 'Solução de açúcar' };
    }
    if (has.limonene || has.linalool || has.vanillin) {
      return { id: 'accord', en: 'Fragrance accord', pt: 'Acorde de fragrância' };
    }
    if (has.cu && has.zn) {
      return { id: 'brass', en: 'Copper–zinc mix', pt: 'Mistura cobre–zinco' };
    }
    if (has.fe && has.s) {
      return { id: 'fes', en: 'Iron–sulfur mix', pt: 'Mistura ferro–enxofre' };
    }
    if (has.fe && wet) {
      return {
        id: warm ? 'iron-warm' : 'iron-water',
        en: warm ? 'Warm iron–water mix' : 'Iron in water',
        pt: warm ? 'Mistura quente de ferro e água' : 'Ferro em água'
      };
    }
    return null;
  }

  function noteProduct(session, container, beforeId) {
    if (container.productId && container.productId !== beforeId) {
      var name = line(session, container.product, container.productPt);
      observe(session, line(session, 'Created: ' + name + '.', 'Criou: ' + name + '.'));
    }
  }

  function visualFillPct(container) {
    var vol = Number(container.volumeMl) || 0;
    var cap = Math.max(1, Number(container.capacityMl) || 1);
    if (vol <= 0) return 0;
    return Math.round(Math.max(18, Math.min(96, 12 + (vol / cap) * 84)));
  }

  function emptyContainer(session, containerId) {
    var container = findContainer(session, containerId);
    if (!container) return { ok: false, reason: 'no-container' };
    if (!(container.contents || []).length && !(Number(container.volumeMl) || 0)) {
      return { ok: true, container: container };
    }
    pushHistory(session);
    container.contents = [];
    container.volumeMl = 0;
    mixContainer(container);
    observe(session, line(session, 'Emptied ' + (container.label || container.id) + '.', 'Esvaziou ' + (container.label || container.id) + '.'));
    return { ok: true, container: container };
  }

  function ensureWorkbench(session) {
    if (!session.containers) session.containers = [];
    var types = {};
    session.containers.forEach(function (row, i) {
      types[row.type || 'beaker'] = true;
      if (!isFinite(Number(row.x)) || !isFinite(Number(row.y))) {
        var pos = defaultPos(i);
        row.x = pos.x;
        row.y = pos.y;
      }
    });
    if (!session.containers.length) session.containers.push(makeVessel('beaker', 0));
    if (!types.flask && session.containers.length < MAX_VESSELS) session.containers.push(makeVessel('flask', 1));
    if (!types.cylinder && session.containers.length < MAX_VESSELS) session.containers.push(makeVessel('cylinder', 2));
    if (!session.selectedId) session.selectedId = session.containers[0].id;
    session.redo = session.redo || [];
    ensureBoard(session);
    return session;
  }

  function addToContainer(session, containerId, substanceId, amount, unit) {
    var resolved = resolveQuery(substanceId);
    if (!resolved.ok || resolved.kind !== 'substance') {
      return { ok: false, reason: resolved.reason || 'unavailable' };
    }
    var spec = SUBSTANCES[resolved.id];
    var container = findContainer(session, containerId);
    if (!container) return { ok: false, reason: 'no-container' };
    if (!canAddSubstance(container, spec)) {
      observe(session, line(session, 'That tool does not hold that material.', 'Essa ferramenta não aceita esse material.'));
      return { ok: false, reason: 'tool' };
    }
    var qty = Math.max(0.1, Number(amount) || 1);
    var nextVol = Number(container.volumeMl) || 0;
    if (spec.state === 'liquid') nextVol += qty;
    if (nextVol > container.capacityMl + 0.05) {
      observe(session, line(session, (container.label || container.id) + ' is full.', (container.label || container.id) + ' está cheio.'));
      return { ok: false, reason: 'full' };
    }
    pushHistory(session);
    var beforeProduct = container.productId || '';
    var beforeReaction = container.reactionId || '';
    var existing = (container.contents || []).filter(function (row) { return row.id === spec.id; })[0];
    if (existing) existing.amount += qty;
    else container.contents.push({ id: spec.id, amount: qty, unit: unit || (spec.state === 'liquid' ? 'mL' : 'g') });
    if (spec.state === 'liquid') container.volumeMl = Math.min(container.capacityMl, (Number(container.volumeMl) || 0) + qty);
    mixContainer(container);
    observe(session, line(
      session,
      'Added virtual ' + spec.name + ' (' + spec.formula + ') to ' + (container.label || container.id) + '.',
      'Adicionou ' + spec.name + ' (' + spec.formula + ') virtual em ' + (container.label || container.id) + '.'
    ));
    noteProduct(session, container, beforeProduct);
    var fired = noteReaction(session, container, beforeReaction);
    return { ok: true, container: container, reaction: fired };
  }

  function pour(session, fromId, toId, amount) {
    if (!processAllowed('pour')) return { ok: false, reason: 'unavailable' };
    if (fromId === toId) return { ok: false, reason: 'same' };
    var from = findContainer(session, fromId);
    var to = findContainer(session, toId);
    if (!from || !to) return { ok: false, reason: 'no-container' };
    if (!canHold(to)) return { ok: false, reason: 'tool' };
    mixContainer(from);
    var vol = Number(from.volumeMl) || 0;
    if (vol <= 0) return { ok: false, reason: 'empty' };
    var room = Math.max(0, (Number(to.capacityMl) || 0) - (Number(to.volumeMl) || 0));
    var qty = Math.min(vol, Number(amount) > 0 ? Number(amount) : vol, room);
    if (qty <= 0) {
      observe(session, line(session, (to.label || to.id) + ' is full.', (to.label || to.id) + ' está cheio.'));
      return { ok: false, reason: 'full' };
    }
    pushHistory(session);
    var beforeProduct = to.productId || '';
    var beforeReaction = to.reactionId || '';
    var ratio = qty / vol;
    to.contents = to.contents || [];
    (from.contents || []).forEach(function (row) {
      var move = (Number(row.amount) || 0) * ratio;
      row.amount -= move;
      var dest = to.contents.filter(function (item) { return item.id === row.id; })[0];
      if (dest) dest.amount += move;
      else to.contents.push({ id: row.id, amount: move, unit: row.unit });
    });
    from.contents = (from.contents || []).filter(function (row) { return Number(row.amount) > 0.05; });
    from.volumeMl = Math.max(0, Math.round((vol - qty) * 10) / 10);
    to.volumeMl = Math.round(((Number(to.volumeMl) || 0) + qty) * 10) / 10;
    mixContainer(from);
    mixContainer(to);
    observe(session, line(
      session,
      'Poured ' + qty + ' mL from ' + (from.label || from.id) + ' into ' + (to.label || to.id) + '.',
      'Transferiu ' + qty + ' mL de ' + (from.label || from.id) + ' para ' + (to.label || to.id) + '.'
    ));
    noteProduct(session, to, beforeProduct);
    var fired = noteReaction(session, to, beforeReaction);
    return { ok: true, amount: qty, reaction: fired };
  }

  function addVessel(session, type) {
    var spec = EQUIPMENT[type] || EQUIPMENT.beaker;
    if ((session.containers || []).length >= MAX_VESSELS) return { ok: false, reason: 'limit' };
    pushHistory(session);
    var vessel = makeVessel(spec.type, session.containers.length);
    vessel.id = spec.type + '-' + uid().slice(-5);
    session.containers.push(vessel);
    session.selectedId = vessel.id;
    ensureBoard(session);
    var obj = findObject(session, vessel.id);
    if (obj) obj.zIndex = nextZ(session);
    observe(session, line(session, 'Added ' + (vessel.label || spec.type) + ' to the bench.', 'Adicionou ' + (vessel.label || spec.type) + ' à bancada.'));
    return { ok: true, container: vessel };
  }

  function removeObject(session, id) {
    if ((session.containers || []).length <= 1) return { ok: false, reason: 'last' };
    var container = findContainer(session, id);
    if (!container) return { ok: false, reason: 'no-container' };
    pushHistory(session);
    session.containers = session.containers.filter(function (row) { return row.id !== id; });
    if (session.board) {
      session.board.objects = (session.board.objects || []).filter(function (row) { return row.id !== id; });
      session.board.connections = (session.board.connections || []).filter(function (row) {
        return row.fromId !== id && row.toId !== id;
      });
    }
    if (session.selectedId === id) session.selectedId = (session.containers[0] || {}).id;
    observe(session, line(session, 'Removed ' + (container.label || id) + '.', 'Removeu ' + (container.label || id) + '.'));
    return { ok: true };
  }

  function duplicateObject(session, id) {
    if ((session.containers || []).length >= MAX_VESSELS) return { ok: false, reason: 'limit' };
    var container = findContainer(session, id);
    var obj = findObject(session, id);
    if (!container) return { ok: false, reason: 'no-container' };
    var added = addVessel(session, container.type);
    if (!added.ok) return added;
    var copy = added.container;
    var dest = findObject(session, copy.id);
    if (obj && dest) {
      dest.x = Number(obj.x) + 28;
      dest.y = Number(obj.y) + 28;
      dest.rotation = obj.rotation || 0;
      dest.zIndex = nextZ(session);
      syncVisual(session, copy.id);
    }
    return { ok: true, container: copy };
  }

  function aspirate(session, pipetteId, fromId, amount) {
    if (!processAllowed('aspirate')) return { ok: false, reason: 'unavailable' };
    var pip = findContainer(session, pipetteId);
    var from = findContainer(session, fromId);
    if (!pip || !from) return { ok: false, reason: 'no-container' };
    if (!hasCap(pip, 'aspirate')) return { ok: false, reason: 'tool' };
    if (!canHold(from) || !hasCap(from, 'contain')) return { ok: false, reason: 'source' };
    var spec = specOf(pip.type);
    var qty = Number(amount);
    if (hasCap(pip, 'dispense_exact') || spec.precision) {
      qty = spec.nominalVolumeMl || pip.capacityMl;
    } else if (!(qty > 0)) {
      qty = Math.min(pip.capacityMl, Number(from.volumeMl) || 0);
    }
    qty = Math.min(qty, pip.capacityMl - (Number(pip.volumeMl) || 0), Number(from.volumeMl) || 0);
    if (qty <= 0) return { ok: false, reason: 'empty' };
    var result = pour(session, fromId, pipetteId, qty);
    if (result.ok) session.lastTransfer = { kind: 'aspirate', fromId: fromId, pipetteId: pipetteId, amount: qty };
    return result;
  }

  function dispense(session, pipetteId, toId) {
    if (!processAllowed('dispense')) return { ok: false, reason: 'unavailable' };
    var pip = findContainer(session, pipetteId);
    if (!pip || !hasCap(pip, 'aspirate') && !hasCap(pip, 'dispense') && !hasCap(pip, 'dispense_controlled')) {
      return { ok: false, reason: 'tool' };
    }
    var result = pour(session, pipetteId, toId, 0);
    if (result.ok) session.lastTransfer = { kind: 'dispense', pipetteId: pipetteId, toId: toId, amount: result.amount };
    return result;
  }

  function drop(session, fromId, toId) {
    if (!processAllowed('dispense')) return { ok: false, reason: 'unavailable' };
    var from = findContainer(session, fromId);
    if (!from || !hasCap(from, 'dispense_controlled')) return { ok: false, reason: 'tool' };
    var result = pour(session, fromId, toId, 1);
    if (result.ok) session.lastTransfer = { kind: 'drop', fromId: fromId, toId: toId, amount: result.amount };
    return result;
  }

  function grind(session, mortarId) {
    if (!processAllowed('grind')) return { ok: false, reason: 'unavailable' };
    var mortar = findContainer(session, mortarId);
    if (!mortar || !hasCap(mortar, 'grind')) return { ok: false, reason: 'tool' };
    var solids = (mortar.contents || []).filter(function (row) {
      var spec = SUBSTANCES[row.id];
      return spec && spec.state === 'solid' && (Number(row.amount) || 0) > 0.05;
    });
    if (!solids.length) return { ok: false, reason: 'no-solid' };
    pushHistory(session);
    mortar.ground = true;
    mortar.particleSize = 'ground';
    observe(session, line(session, 'Ground the sample in the mortar.', 'Triturou a amostra no almofariz.'));
    mixContainer(mortar);
    return { ok: true, container: mortar };
  }

  function drainBottom(session, funnelId, toId) {
    if (!processAllowed('separate')) return { ok: false, reason: 'unavailable' };
    var funnel = findContainer(session, funnelId);
    if (!funnel || !hasCap(funnel, 'separate')) return { ok: false, reason: 'tool' };
    mixContainer(funnel);
    var has = {};
    (funnel.contents || []).forEach(function (row) { if ((Number(row.amount) || 0) > 0.05) has[row.id] = true; });
    if (!(has.oil && has.water)) return { ok: false, reason: 'no-phases' };
    var waterAmt = (funnel.contents || []).filter(function (row) { return row.id === 'water'; })[0];
    var qty = waterAmt ? Number(waterAmt.amount) : 0;
    if (qty <= 0) return { ok: false, reason: 'empty' };
    return pour(session, funnelId, toId, qty);
  }

  function connectPorts(session, fromId, fromPort, toId, toPort) {
    if (!processAllowed('connect')) return { ok: false, reason: 'unavailable' };
    var a = findContainer(session, fromId);
    var b = findContainer(session, toId);
    if (!a || !b || fromId === toId) return { ok: false, reason: 'no-container' };
    var pa = (specOf(a.type).ports || []).filter(function (row) { return row.id === fromPort; })[0];
    var pb = (specOf(b.type).ports || []).filter(function (row) { return row.id === toPort; })[0];
    if (!pa) pa = (specOf(a.type).ports || [])[0];
    if (!pb) pb = (specOf(b.type).ports || [])[0];
    if (!pa || !pb || pa.type !== pb.type) return { ok: false, reason: 'incompatible' };
    ensureBoard(session);
    var exists = (session.board.connections || []).some(function (row) {
      return row.fromId === fromId && row.toId === toId && row.fromPort === pa.id && row.toPort === pb.id;
    });
    if (exists) return { ok: true, already: true };
    pushHistory(session);
    session.board.connections.push({
      id: 'link_' + uid().slice(-6),
      fromId: fromId,
      fromPort: pa.id,
      toId: toId,
      toPort: pb.id,
      kind: pa.type
    });
    observe(session, line(session, 'Connected ' + (a.label || fromId) + ' to ' + (b.label || toId) + '.', 'Conectou ' + (a.label || fromId) + ' a ' + (b.label || toId) + '.'));
    return { ok: true };
  }

  var HEAT_OFFSET = 34;

  function heaterIsCupped(session, heaterId) {
    return (session.containers || []).some(function (row) {
      if (row.id === heaterId || !hasCap(row, 'heat')) return false;
      var zone = heatZoneFor(session, row.id);
      return zone && zone.id === heaterId;
    });
  }

  function heatZoneFor(session, vesselId) {
    var vessel = findObject(session, vesselId);
    if (!vessel) return null;
    var heaters = (session.board.objects || []).filter(function (row) {
      return specOf(row.type).heat;
    });
    var hit = null;
    heaters.forEach(function (heater) {
      var dx = Math.abs(Number(vessel.x) - Number(heater.x));
      var dy = Number(heater.y) - Number(vessel.y);
      if (dx < 70 && dy > HEAT_OFFSET - 44 && dy < HEAT_OFFSET + 120) hit = heater;
    });
    return hit;
  }

  function setTemperature(session, containerId, next) {
    var container = findContainer(session, containerId);
    if (!container) return { ok: false, reason: 'no-container' };
    var temp = Math.max(5, Math.min(maxTemperatureFor(session, container), Number(next)));
    if (temp === container.temperatureC) return { ok: true, container: container };
    pushHistory(session);
    container.temperatureC = temp;
    var beforeProduct = container.productId || '';
    var beforeReaction = container.reactionId || '';
    observe(session, line(session, (container.label || container.id) + ' is now ' + temp + ' °C (virtual).', (container.label || container.id) + ' está a ' + temp + ' °C (virtual).'));
    mixContainer(container);
    noteProduct(session, container, beforeProduct);
    var fired = noteReaction(session, container, beforeReaction);
    return { ok: true, container: container, reaction: fired };
  }

  /* Heating is bounded by the equipment under the vessel, not by a flat cap. */
  function maxTemperatureFor(session, container) {
    if (!container) return 95;
    var heater = heatZoneFor(session, container.id);
    if (!heater) return 95;
    var spec = specOf(heater.type);
    if (!spec.heat) return 95;
    if (heater.type === 'heating-mantle' || heater.type === 'hot-plate') {
      return Math.min(PROCESSES.distill.maxC, 250);
    }
    return 150;
  }

  /* Walks the connections for flask -> condenser -> receiver. */
  function distillSetup(session, sourceId) {
    ensureBoard(session);
    var links = session.board.connections || [];
    var source = findContainer(session, sourceId);
    if (!source || !canHold(source) || !hasCap(source, 'heat')) return null;
    function neighbours(id, skipId) {
      return links.filter(function (row) { return row.fromId === id || row.toId === id; })
        .map(function (row) { return row.fromId === id ? row.toId : row.fromId; })
        .filter(function (next) { return next !== skipId; });
    }
    var mids = neighbours(sourceId, '');
    for (var i = 0; i < mids.length; i += 1) {
      var condenser = findContainer(session, mids[i]);
      if (!condenser || !hasCap(condenser, 'condense')) continue;
      var outs = neighbours(condenser.id, sourceId);
      for (var j = 0; j < outs.length; j += 1) {
        var receiver = findContainer(session, outs[j]);
        if (receiver && canHold(receiver) && hasCap(receiver, 'contain')) {
          return { source: source, condenser: condenser, receiver: receiver };
        }
      }
    }
    return null;
  }

  function firstOfType(session, type) {
    return (session.containers || []).filter(function (row) { return row.type === type; })[0] || null;
  }

  /* Places and connects a distillation train the user has already assembled
     piece by piece. It never adds equipment the user did not put on the board. */
  function assembleRig(session) {
    ensureBoard(session);
    var flask = firstOfType(session, 'round-flask');
    var condenser = firstOfType(session, 'condenser');
    var receiver = firstOfType(session, 'receiving-flask') || firstOfType(session, 'flask');
    if (!flask || !condenser || !receiver) return { ok: false, reason: 'missing' };
    var heater = firstOfType(session, 'heating-mantle') || firstOfType(session, 'hot-plate') || firstOfType(session, 'bunsen');
    pushHistory(session);
    var base = findObject(session, flask.id);
    if (!base) return { ok: false, reason: 'missing' };
    var x = Number(base.x) || 200;
    var y = Number(base.y) || 200;
    function place(id, nx, ny) {
      var obj = findObject(session, id);
      var row = findContainer(session, id);
      if (!obj) return;
      obj.x = Math.round(nx);
      obj.y = Math.round(ny);
      if (row) { row.x = obj.x; row.y = obj.y; }
    }
    place(condenser.id, x + 150, y - 10);
    place(receiver.id, x + 300, y + 60);
    if (heater) place(heater.id, x, y + HEAT_OFFSET);
    var a = connectPorts(session, flask.id, 'neck', condenser.id, 'inlet');
    var b = connectPorts(session, condenser.id, 'outlet', receiver.id, 'neck');
    observe(session, line(session, 'Assembled the distillation train.', 'Montou a aparelhagem de destilação.'));
    return { ok: Boolean(a.ok && b.ok), flask: flask, condenser: condenser, receiver: receiver, heater: heater };
  }

  function volatileParts(container) {
    return (container.contents || [])
      .filter(function (row) {
        var spec = SUBSTANCES[row.id];
        return spec && spec.bp && (Number(row.amount) || 0) > 0.05;
      })
      .sort(function (a, b) { return SUBSTANCES[a.id].bp - SUBSTANCES[b.id].bp; });
  }

  /* Simple distillation, driven by the rig the user actually assembled.
     Educational separation by boiling point: this models the principle, it is
     not a procedure for producing a drinkable or fuel product. */
  function distill(session, sourceId) {
    if (!processAllowed('distill')) return { ok: false, reason: 'unavailable' };
    var rig = distillSetup(session, sourceId);
    if (!rig) return { ok: false, reason: 'no-rig' };
    var parts = volatileParts(rig.source);
    if (parts.length < 2) return { ok: false, reason: 'single' };
    var light = parts[0];
    var lightSpec = SUBSTANCES[light.id];
    var heavySpec = SUBSTANCES[parts[1].id];
    if (lightSpec.bp === heavySpec.bp) return { ok: false, reason: 'same-bp' };
    var temp = Number(rig.source.temperatureC) || 22;
    var ceiling = maxTemperatureFor(session, rig.source);
    var needed = Math.min(lightSpec.bp, ceiling);
    if (temp < needed - 2) return { ok: false, reason: 'cold', needed: needed, ceiling: ceiling };

    var room = Math.max(0, (Number(rig.receiver.capacityMl) || 0) - (Number(rig.receiver.volumeMl) || 0));
    if (room <= 0) return { ok: false, reason: 'receiver-full' };
    var move = Math.min(Number(light.amount) || 0, room * 0.9);
    move = Math.round(move * 0.6 * 10) / 10;
    if (move <= 0.1) return { ok: false, reason: 'empty' };

    /* Ethanol and water form an azeotrope at about 95%, so simple distillation
       always carries some water across. That ceiling is the teaching point. */
    var carry = 0;
    var water = parts.filter(function (row) { return row.id === 'water'; })[0];
    if (light.id === 'ethanol' && water) {
      carry = Math.round(Math.min(Number(water.amount) || 0, move * (5 / 95)) * 10) / 10;
    }
    if (move + carry > room) {
      carry = Math.max(0, room - move);
    }

    pushHistory(session);
    var beforeProduct = rig.receiver.productId || '';
    var beforeReaction = rig.receiver.reactionId || '';
    light.amount = Math.round((Number(light.amount) - move) * 10) / 10;
    if (carry && water) water.amount = Math.round((Number(water.amount) - carry) * 10) / 10;
    rig.source.contents = (rig.source.contents || []).filter(function (row) { return (Number(row.amount) || 0) > 0.05; });
    rig.source.volumeMl = Math.round(Math.max(0, (Number(rig.source.volumeMl) || 0) - move - carry) * 10) / 10;

    function land(id, amount) {
      if (amount <= 0) return;
      var row = (rig.receiver.contents || []).filter(function (item) { return item.id === id; })[0];
      if (row) row.amount = Math.round((Number(row.amount) + amount) * 10) / 10;
      else rig.receiver.contents.push({ id: id, amount: amount, unit: 'mL' });
    }
    land(light.id, move);
    land('water', carry);
    rig.receiver.volumeMl = Math.round(((Number(rig.receiver.volumeMl) || 0) + move + carry) * 10) / 10;

    mixContainer(rig.source);
    mixContainer(rig.receiver);
    noteProduct(session, rig.receiver, beforeProduct);
    noteReaction(session, rig.receiver, beforeReaction);

    var purity = move + carry > 0 ? Math.round((move / (move + carry)) * 1000) / 10 : 100;
    observe(session, line(
      session,
      'Distilled ' + move + ' mL of ' + lightSpec.name + ' at ' + Math.round(needed) + ' °C into ' + (rig.receiver.label || rig.receiver.id) + ' (virtual, ' + purity + '%).',
      'Destilou ' + move + ' mL de ' + lightSpec.name + ' a ' + Math.round(needed) + ' °C para ' + (rig.receiver.label || rig.receiver.id) + ' (virtual, ' + purity + '%).'
    ));
    if (carry > 0) {
      observe(session, line(
        session,
        'Water came across with it: an ethanol-water azeotrope caps simple distillation near 95%.',
        'Veio água junto: o azeótropo etanol-água limita a destilação simples perto de 95%.'
      ));
    }
    return { ok: true, rig: rig, moved: move, carry: carry, purity: purity, bp: lightSpec.bp, substance: lightSpec };
  }

  function measure(session, containerId, kind) {
    var container = findContainer(session, containerId);
    if (!container) return { ok: false, reason: 'no-container' };
    mixContainer(container);
    var value = null;
    var unit = '';
    if (kind === 'volume') { value = container.volumeMl; unit = 'mL'; }
    else if (kind === 'mass') { value = Math.round(containerMass(container) * 10) / 10; unit = 'g'; }
    else if (kind === 'temperature') { value = container.temperatureC; unit = '°C'; }
    else if (kind === 'ph') { value = container.ph; unit = ''; }
    else return { ok: false, reason: 'unknown-measure' };
    var row = { at: nowIso(), kind: kind, value: value, unit: unit, containerId: containerId };
    session.measurements = (session.measurements || []).concat([row]);
    observe(session, 'Measured ' + kind + ': ' + value + (unit ? ' ' + unit : '') + '.');
    return { ok: true, row: row };
  }

  function addReady(session, kitId, containerId) {
    var kit = READY.filter(function (row) { return row.id === kitId; })[0];
    if (!kit) return { ok: false, reason: 'unknown' };
    var container = findContainer(session, containerId);
    if (!canHold(container)) return { ok: false, reason: 'no-container' };
    pushHistory(session);
    var beforeProduct = container.productId || '';
    var beforeReaction = container.reactionId || '';
    kit.parts.forEach(function (part) {
      var spec = SUBSTANCES[part.id];
      if (!spec || !spec.allowed) return;
      var qty = Math.max(0.1, Number(part.amount) || 1);
      var existing = (container.contents || []).filter(function (row) { return row.id === spec.id; })[0];
      if (existing) existing.amount += qty;
      else container.contents.push({ id: spec.id, amount: qty, unit: spec.state === 'liquid' ? 'mL' : 'g' });
      if (spec.state === 'liquid') {
        container.volumeMl = Math.min(container.capacityMl, (Number(container.volumeMl) || 0) + qty);
      }
    });
    mixContainer(container);
    observe(session, line(
      session,
      'Added ready mixture (' + (kit.labelEn || kit.id) + ') to ' + (container.label || container.id) + '.',
      'Adicionou mistura pronta (' + (kit.labelPt || kit.labelEn || kit.id) + ') em ' + (container.label || container.id) + '.'
    ));
    noteProduct(session, container, beforeProduct);
    var fired = noteReaction(session, container, beforeReaction);
    return { ok: true, container: container, reaction: fired };
  }

  function tutorialProgressFor(session, creation, container) {
    if (!container) {
      return { current: 0, done: creation.tutorial.map(function () { return false; }) };
    }
    mixContainer(container);
    var has = {};
    (container.contents || []).forEach(function (row) {
      if ((Number(row.amount) || 0) > 0.05) has[row.id] = true;
    });
    var done = [];
    var current = 0;
    var unlocked = true;
    creation.tutorial.forEach(function (step, i) {
      var ok = unlocked;
      if (ok && step.needEquipment) {
        var types = {};
        (session.containers || []).forEach(function (row) { types[row.type] = true; });
        step.needEquipment.forEach(function (id) { if (!types[id]) ok = false; });
      }
      if (ok && step.need) {
        Object.keys(step.need).forEach(function (id) { if (!has[id]) ok = false; });
      }
      if (ok && step.needAny) ok = step.needAny.some(function (id) { return has[id]; });
      if (ok && step.stir && !session.stirred) ok = false;
      if (ok && step.product && container.productId !== step.product) ok = false;
      if (ok && step.action === 'heat') {
        var warm = (session.containers || []).some(function (row) { return (Number(row.temperatureC) || 22) >= 40; });
        if (!warm) ok = false;
      }
      if (ok && step.action === 'measure') {
        if (!(session.measurements || []).length) ok = false;
      }
      if (ok && step.needConnections) {
        var wired = ((session.board && session.board.connections) || []).length;
        if (wired < step.needConnections) ok = false;
      }
      if (ok && step.needTemp) {
        var hot = (session.containers || []).some(function (row) {
          return (Number(row.temperatureC) || 22) >= step.needTemp;
        });
        if (!hot) ok = false;
      }
      if (ok && step.needIn) {
        var host = firstOfType(session, step.needIn.type);
        var landed = host && (host.contents || []).some(function (row) {
          return row.id === step.needIn.id && (Number(row.amount) || 0) > 0.05;
        });
        if (!landed) ok = false;
      }
      done[i] = ok;
      if (ok) current = i + 1;
      else unlocked = false;
    });
    return { current: current, done: done };
  }

  function tutorialState(session, creation) {
    if (!creation || !Array.isArray(creation.tutorial) || !creation.tutorial.length) return null;
    var containers = session.containers || [];
    var selected = findContainer(session, session.selectedId);
    var best = tutorialProgressFor(session, creation, selected || containers[0]);
    containers.forEach(function (container) {
      if (selected && container.id === selected.id) return;
      var next = tutorialProgressFor(session, creation, container);
      if (next.current > best.current) best = next;
    });
    return {
      current: best.current,
      steps: creation.tutorial,
      done: best.done,
      complete: best.current >= creation.tutorial.length
    };
  }

  function defaultAmountFor(id) {
    var spec = SUBSTANCES[id];
    if (!spec) return 25;
    if (spec.state === 'solid') return 10;
    if (spec.category === 'fragrance') return 6;
    return 25;
  }

  function materialPlan(step, id) {
    var spec = SUBSTANCES[id];
    if (!spec || spec.inventory === false) return null;
    var amounts = step.amounts || {};
    var amount = Number(amounts[id]) || defaultAmountFor(id);
    return {
      id: id,
      name: spec.name,
      formula: spec.formula,
      color: spec.color,
      amount: amount,
      unit: spec.state === 'solid' ? 'g' : 'mL'
    };
  }

  var ACTION_VERB = {
    addEquipment: { en: 'Place the glassware', pt: 'Coloque a vidraria' },
    addMaterial: { en: 'Add the material', pt: 'Adicione o material' },
    transfer: { en: 'Transfer', pt: 'Transfira' },
    mix: { en: 'Stir the vessel', pt: 'Agite o vidro' },
    heat: { en: 'Warm the vessel', pt: 'Aqueça o vidro' },
    measure: { en: 'Take a measurement', pt: 'Faça uma medição' },
    inspect: { en: 'Read the inspector', pt: 'Leia o inspetor' },
    grind: { en: 'Grind the solid', pt: 'Triture o sólido' },
    connect: { en: 'Connect the ports', pt: 'Conecte os portos' },
    distill: { en: 'Run the distillation', pt: 'Execute a destilação' }
  };

  /* What a guided step asks for, as data the panel can turn into real actions. */
  function stepPlan(creation, index) {
    if (!creation || !Array.isArray(creation.tutorial)) return null;
    var step = creation.tutorial[index];
    if (!step) return null;
    var equipment = (step.needEquipment || []).filter(function (id) { return !!EQUIPMENT[id]; })
      .map(function (id) {
        var spec = EQUIPMENT[id];
        return { type: id, labelEn: spec.labelEn, labelPt: spec.labelPt, category: spec.category };
      });
    var materials = Object.keys(step.need || {}).map(function (id) { return materialPlan(step, id); })
      .filter(Boolean);
    var options = (step.needAny || []).map(function (id) { return materialPlan(step, id); }).filter(Boolean);
    var verb = ACTION_VERB[step.action] || ACTION_VERB.inspect;
    if (step.into && EQUIPMENT[step.into]) {
      var host = EQUIPMENT[step.into];
      verb = { en: verb.en + ' in the ' + host.labelEn, pt: verb.pt + ' no ' + host.labelPt };
    }
    var names = equipment.map(function (row) { return row.labelEn; })
      .concat(materials.concat(options).map(function (row) { return row.name; }));
    var hints = [
      step.why
        ? { en: step.why.en || step.why.pt, pt: step.why.pt || step.why.en }
        : { en: verb.en + ' to move this step forward.', pt: verb.pt + ' para avançar neste passo.' },
      names.length
        ? { en: 'You need: ' + names.join(', ') + '.', pt: 'Você precisa de: ' + names.join(', ') + '.' }
        : { en: 'Use the board actions under the canvas.', pt: 'Use as ações do board abaixo do canvas.' },
      {
        en: equipment.length || materials.length || options.length
          ? 'Open the Tools dock and click the highlighted item in this step.'
          : 'Select a vessel, then use the action bar below the board.',
        pt: equipment.length || materials.length || options.length
          ? 'Abra o dock de ferramentas e clique no item destacado deste passo.'
          : 'Selecione um vidro e use a barra de ações abaixo do board.'
      }
    ];
    return {
      id: step.id,
      index: index,
      into: step.into || '',
      needsConnect: step.action === 'connect',
      needsDistill: step.action === 'distill',
      heatTo: Number(step.heatTo) || 0,
      action: step.action || 'inspect',
      verb: verb,
      text: { en: step.en, pt: step.pt },
      why: step.why || null,
      equipment: equipment,
      materials: materials,
      options: options,
      needsStir: !!step.stir || step.action === 'mix',
      needsHeat: step.action === 'heat',
      needsMeasure: step.action === 'measure',
      product: step.product || '',
      hints: hints
    };
  }

  function searchCatalog(raw) {
    var q = norm(raw);
    var resolved = resolveQuery(raw);
    if (resolved.reason === 'unavailable') {
      return { status: 'unavailable', items: [], message: 'This experiment isn\'t available in Atomurus Lab.' };
    }
    var items = [];
    CREATIONS.forEach(function (row) {
      var hay = [row.id, row.slug, row.title.en, row.title.pt, row.category].join(' ');
      if (!q || hay.toLowerCase().indexOf(q) !== -1 || (resolved.ok && resolved.kind === 'creation' && resolved.id === row.id)) {
        items.push({ type: 'creation', row: row });
      }
    });
    Object.keys(SUBSTANCES).forEach(function (id) {
      var spec = SUBSTANCES[id];
      var hay = [spec.id, spec.name, spec.formula, spec.category].join(' ');
      if (!q || hay.toLowerCase().indexOf(q) !== -1 || (resolved.ok && resolved.kind === 'substance' && resolved.id === id)) {
        items.push({ type: 'substance', row: spec });
      }
    });
    if (!items.length && q) return { status: 'unknown', items: [], message: 'This material is not available in the current Lab catalog.' };
    return { status: 'ok', items: items, resolved: resolved };
  }

  function labelOf(row, lang) {
    if (!row) return '';
    if (row.title) return (lang === 'pt' ? row.title.pt : row.title.en) || row.title.en;
    return row.name || row.id;
  }

  function mount(node, opts) {
    if (!node) return;
    if (node._labAbort && typeof node._labAbort.abort === 'function') {
      try { node._labAbort.abort(); } catch (e) {}
    }
    opts = opts || {};
    var lang = (document.documentElement.lang || '').toLowerCase().indexOf('pt') === 0 ? 'pt' : 'en';
    var user = opts.user || null;
    var section = opts.section || 'lab';
    var params;
    try { params = new URLSearchParams(location.search); } catch (e) { params = new URLSearchParams(); }
    var creationId = params.get('creation') || opts.creationId || '';
    var mode = params.get('mode') || opts.mode || (section === 'creations' ? 'guided' : (section === 'notebook' ? 'notebook' : 'bench'));
    var session = null;
    var sessions = listSessions();
    var last = sessions[0];
    if (params.get('session')) {
      session = sessions.filter(function (row) { return row.id === params.get('session'); })[0] || null;
    }
    if (!session && creationId) {
      var creation = CREATIONS.filter(function (row) { return row.id === creationId; })[0];
      session = emptySession({
        title: creation ? labelOf(creation, lang) : 'Guided creation',
        mode: 'guided',
        creationId: creationId,
        lang: lang
      });
    }
    if (!session && mode === 'bench') session = emptySession({ title: lang === 'pt' ? 'Bancada aberta' : 'Open Bench', mode: 'bench', lang: lang });
    if (!session) session = last || emptySession({ title: lang === 'pt' ? 'Bancada aberta' : 'Open Bench', lang: lang });
    session.lang = lang;
    ensureWorkbench(session);
    if (!session.selectedId) session.selectedId = (session.containers[0] || {}).id;
    var amount = 25;
    var pourFrom = '';
    var heatFrom = '';
    var panX = Number((session.board && session.board.camera && session.board.camera.x) || session.panX) || 0;
    var panY = Number((session.board && session.board.camera && session.board.camera.y) || session.panY) || 0;
    var zoom = Number((session.board && session.board.camera && session.board.camera.zoom) || session.zoom) || 1;
    if (zoom < ZOOM_MIN) zoom = ZOOM_MIN;
    if (zoom > ZOOM_MAX) zoom = ZOOM_MAX;
    var saveTimer = 0;
    var stirTimer = 0;
    var lastStatus = '';
    var dragging = null;
    var dragMoved = false;
    var ignoreClickUntil = 0;
    var panning = false;
    var panStart = null;
    var selectedIds = [];
    var connectFrom = '';
    var spaceDown = false;
    var pipetteFrom = '';
    var dropFrom = '';
    var fxTimer = 0;
    var heatTimer = 0;
    var dockOpen = '';
    var autoCam = true;
    var sideTab = session.creationId ? 'guide' : 'inspector';
    var hintLevel = 0;
    var lastStepKey = '';
    var motionObserver = null;

    function copy(en, pt) { return lang === 'pt' ? pt : en; }
    function esc(value) {
      return String(value == null ? '' : value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function selected() {
      return findContainer(session, session.selectedId) || session.containers[0];
    }
    /* Guided actions land in something that can actually hold a mixture. */
    function preferredVessel(type) {
      if (type) {
        var pinned = firstOfType(session, type);
        if (pinned && canHold(pinned)) return pinned;
      }
      var current = selected();
      if (current && canHold(current) && hasCap(current, 'contain')) return current;
      return (session.containers || []).filter(function (row) {
        return canHold(row) && hasCap(row, 'contain');
      })[0] || null;
    }
    function queueSave() {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        saveTimer = 0;
        saveSession(session);
      }, SAVE_MS);
    }
    function flushSave() {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = 0;
      }
      saveSession(session);
    }

    function statusHtml(results) {
      if (!results) return '';
      if (results.status === 'unavailable') {
        return '<div class="lab-msg" role="status">' + esc(copy('This experiment isn\'t available in Atomurus Lab.', 'Este experimento não está disponível no Atomurus Lab.')) +
          ' <a href="/explore.html">' + esc(copy('Explore the chemistry concept instead.', 'Explore o conceito de química no Explore.')) + '</a></div>';
      }
      if (results.status === 'unknown') {
        return '<div class="lab-msg" role="status">' + esc(copy('This material is not available in the current Lab catalog.', 'Este material não está no catálogo atual do Lab.')) +
          ' <a href="/explore.html">' + esc(copy('Search Explore instead.', 'Buscar no Explore.')) + '</a></div>';
      }
      return '';
    }

    var EQUIPMENT_GROUPS = {
      glassware: ['beaker', 'flask', 'cylinder', 'volumetric-flask', 'round-flask', 'test-tube', 'test-tube-capped', 'watch-glass', 'reagent-bottle'],
      transfer: ['pipette-graduated', 'pipette-volumetric', 'pipettor', 'dropper', 'burette', 'funnel', 'separatory-funnel'],
      heat: ['bunsen', 'hot-plate', 'heating-gauze', 'heating-mantle', 'tripod', 'retort-stand', 'ring', 'clamp', 'condenser', 'receiving-flask', 'piston'],
      measure: ['thermometer', 'ph-meter', 'balance', 'mortar', 'pestle', 'spatula', 'weighing-boat', 'rack']
    };

    function equipmentChips(ids, highlight) {
      return '<div class="lab-chips">' + ids.map(function (id) {
        var spec = EQUIPMENT[id];
        if (!spec) return '';
        var on = highlight && highlight[id] ? ' is-wanted' : '';
        return '<button type="button" class="lab-chip lab-chip-eq' + on + '" data-add-vessel="' + esc(id) + '">' +
          esc(lang === 'pt' ? spec.labelPt : spec.labelEn) + '</button>';
      }).join('') + '</div>';
    }

    function materialChips(highlight) {
      var groups = [
        { title: copy('Liquids', 'Líquidos'), ids: ['water', 'ethanol', 'oil'] },
        { title: copy('Salts & sugars', 'Sais e açúcares'), ids: ['nacl', 'sucrose', 'cusulfate'] },
        { title: copy('Acids & bases', 'Ácidos e bases'), ids: ['citric_acid', 'bicarbonate', 'indicator'] },
        { title: copy('Elements', 'Elementos'), ids: ['fe', 'cu', 'zn', 's', 'c'] },
        { title: copy('Minerals', 'Minerais'), ids: ['zno', 'tio2'] },
        { title: copy('Fragrance notes', 'Notas de fragrância'), ids: ['limonene', 'linalool', 'vanillin'] },
        { title: copy('Virtual fractions', 'Frações virtuais'), ids: ['frac_light', 'frac_mid', 'frac_heavy'] }
      ];
      return groups.map(function (group) {
        return '<div class="lab-chip-group"><span class="lab-chip-group-title">' + esc(group.title) + '</span><div class="lab-chips">' +
          group.ids.map(function (id) {
            var spec = SUBSTANCES[id];
            if (!spec || spec.inventory === false) return '';
            var on = highlight && highlight[id] ? ' is-wanted' : '';
            return '<button type="button" class="lab-chip' + on + '" data-add="' + esc(id) + '">' +
              '<i class="lab-chip-swatch" style="background:' + esc(spec.color) + '"></i>' +
              esc(spec.name) + '<span>' + esc(spec.formula) + '</span></button>';
          }).join('') + '</div></div>';
      }).join('');
    }

    function amountHtml() {
      return '<div class="lab-amount" role="group" aria-label="' + esc(copy('Amount', 'Quantidade')) + '">' +
        [5, 10, 25, 50, 100].map(function (value) {
          return '<button type="button" class="ws-btn ws-btn-sm' + (value === amount ? ' is-on' : '') + '" data-amount="' + value + '">' + value + '</button>';
        }).join('') +
        '<span class="ws-lede">' + esc(copy('mL or g, virtual', 'mL ou g, virtual')) + '</span></div>';
    }

    function readyHtml() {
      return READY.map(function (kit) {
        return '<button type="button" class="lab-chip" data-ready="' + esc(kit.id) + '">' + esc(lang === 'pt' ? kit.labelPt : kit.labelEn) + '</button>';
      }).join('');
    }

    /* Items the active guided step is asking for, so the dock can highlight them. */
    function wantedNow() {
      var creation = CREATIONS.filter(function (row) { return row.id === session.creationId; })[0];
      var empty = { materials: {}, equipment: {}, plan: null, state: null, creation: creation || null };
      if (!creation) return empty;
      var state = tutorialState(session, creation);
      if (!state) return empty;
      var plan = stepPlan(creation, Math.min(state.current, creation.tutorial.length - 1));
      if (!plan) return empty;
      var materials = {};
      var equipment = {};
      plan.materials.concat(plan.options).forEach(function (row) { materials[row.id] = row; });
      plan.equipment.forEach(function (row) { equipment[row.type] = row; });
      return { materials: materials, equipment: equipment, plan: plan, state: state, creation: creation };
    }

    function icon(name) {
      var paths = {
        create: '<circle cx="9.5" cy="9.5" r="6"/><path d="M14 14 L19 19"/>',
        glassware: '<path d="M5 4 L5 15 Q5 19 11 19 Q17 19 17 15 L17 4"/><path d="M3 4 H19"/><path d="M5.6 12 H16.4"/>',
        transfer: '<path d="M9 2 V8 Q6.5 10 6.5 13 Q6.5 16 9 17 V21"/><path d="M13 2 V8 Q15.5 10 15.5 13 Q15.5 16 13 17 V21"/>',
        heat: '<path d="M11 20.5 Q4.5 16.5 8 10.5 Q9 13.5 11 12.5 Q8.8 6.5 14 2.5 Q12.8 8.5 16.6 11.5 Q19 17.5 11 20.5 Z"/>',
        measure: '<path d="M8.5 3 h5 v11.2 a3.4 3.4 0 1 1 -5 0 Z"/><path d="M13.5 6.5 h3.5 M13.5 9.5 h2.5 M13.5 12.5 h3.5"/>',
        materials: '<path d="M11 2.5 Q17.5 11 17.5 15 A6.5 6.5 0 1 1 4.5 15 Q4.5 11 11 2.5 Z"/>',
        ready: '<path d="M3.5 7.5 L11 3.5 L18.5 7.5 L11 11.5 Z"/><path d="M3.5 14 L11 18 L18.5 14"/>',
        sound: '<path d="M4 8.5 h3.5 L12 4.5 v13 L7.5 13.5 H4 Z"/><path d="M15 8 q2.4 3 0 6"/><path d="M17.6 5.8 q4 5.2 0 10.4"/>',
        muted: '<path d="M4 8.5 h3.5 L12 4.5 v13 L7.5 13.5 H4 Z"/><path d="M15.5 8.5 L20 13 M20 8.5 L15.5 13"/>'
      };
      return '<svg class="lab-dock-icon" viewBox="0 0 22 22" aria-hidden="true">' + (paths[name] || paths.create) + '</svg>';
    }

    function dockGroups() {
      return [
        { key: 'create', icon: 'create', title: copy('Create', 'Criar') },
        { key: 'glassware', icon: 'glassware', title: copy('Glassware', 'Vidraria') },
        { key: 'transfer', icon: 'transfer', title: copy('Transfer', 'Transferência') },
        { key: 'heat', icon: 'heat', title: copy('Heat & assembly', 'Calor e montagem') },
        { key: 'measure', icon: 'measure', title: copy('Measure & prep', 'Medir e preparar') },
        { key: 'materials', icon: 'materials', title: copy('Materials', 'Materiais') },
        { key: 'ready', icon: 'ready', title: copy('Ready mixes', 'Misturas prontas') }
      ];
    }

    function dockTitle(key) {
      var found = dockGroups().filter(function (row) { return row.key === key; })[0];
      return found ? found.title : '';
    }

    function creationCardHtml(row, wanted) {
      var active = session.creationId === row.id;
      return '<article class="lab-create-card' + (active ? ' is-active' : '') + '">' +
        '<span class="ws-lab-badge">' + esc(row.category) + '</span>' +
        '<h3>' + esc(labelOf(row, lang)) + '</h3>' +
        '<p>' + esc(lang === 'pt' ? row.lede.pt : row.lede.en) + '</p>' +
        '<p class="lab-create-meta">' + esc(row.tutorial.length) + ' ' + esc(copy('steps', 'passos')) + ' · ' +
        esc(lang === 'pt' ? row.difficulty.pt : row.difficulty.en) + '</p>' +
        '<button type="button" class="ws-btn ws-btn-sm ' + (active ? '' : 'ws-btn-primary ') + '" data-start-creation="' + esc(row.id) + '">' +
        esc(active ? copy('Continue step-by-step', 'Continuar passo a passo') : copy('Start step-by-step', 'Iniciar passo a passo')) + '</button>' +
        '</article>';
    }

    function searchResultsHtml(results) {
      if (!results || results.status !== 'ok' || !results.items || !results.items.length) return '';
      var q = params.get('q') || '';
      if (!q) return '';
      var creations = results.items.filter(function (row) { return row.type === 'creation'; }).slice(0, 4);
      var substances = results.items.filter(function (row) { return row.type === 'substance'; }).slice(0, 8);
      var out = '<p class="lab-dock-note">' + esc(copy('Results for', 'Resultados para')) + ' “' + esc(q) + '”</p>';
      if (creations.length) {
        out += '<div class="lab-create-list">' + creations.map(function (row) { return creationCardHtml(row.row); }).join('') + '</div>';
      }
      if (substances.length) {
        out += '<span class="lab-chip-group-title">' + esc(copy('Materials found', 'Materiais encontrados')) + '</span><div class="lab-chips">' +
          substances.map(function (row) {
            return '<button type="button" class="lab-chip" data-add="' + esc(row.row.id) + '">' +
              '<i class="lab-chip-swatch" style="background:' + esc(row.row.color) + '"></i>' + esc(row.row.name) + '</button>';
          }).join('') + '</div>';
      }
      return out;
    }

    function dockBodyHtml(key, results) {
      var wanted = wantedNow();
      if (key === 'create') {
        return searchResultsHtml(results) +
          '<p class="lab-dock-note">' + esc(copy('Pick what you want to build. Each one walks you through the glassware and the materials, step by step.', 'Escolha o que quer construir. Cada um guia a vidraria e os materiais, passo a passo.')) + '</p>' +
          '<div class="lab-create-list">' + CREATIONS.map(function (row) { return creationCardHtml(row); }).join('') + '</div>';
      }
      if (key === 'materials') {
        return amountHtml() + materialChips(wanted.materials) +
          '<p class="lab-dock-note">' + esc(copy('Materials go into the selected vessel. Catalog stays allowlisted.', 'Os materiais vão para o vidro selecionado. O catálogo continua allowlist.')) + '</p>';
      }
      if (key === 'ready') {
        return '<div class="lab-chips">' + readyHtml() + '</div>' +
          '<p class="lab-dock-note">' + esc(copy('Reviewed mixtures, poured into the selected vessel.', 'Misturas revisadas, despejadas no vidro selecionado.')) + '</p>';
      }
      var ids = EQUIPMENT_GROUPS[key] || [];
      return equipmentChips(ids, wanted.equipment) +
        '<p class="lab-dock-note">' + esc(copy('Click to drop it on the board, then drag it anywhere.', 'Clique para soltar no board e depois arraste para onde quiser.')) + '</p>';
    }

    function dockHtml(results) {
      var wanted = wantedNow();
      return '<div class="lab-dock' + (dockOpen ? ' is-open' : '') + '" data-lab-dock>' +
        '<div class="lab-dock-rail" role="toolbar" aria-label="' + esc(copy('Lab tools', 'Ferramentas do Lab')) + '">' +
        dockGroups().map(function (group) {
          var on = dockOpen === group.key;
          var badge = group.key === 'create' && wanted.creation ? '<i class="lab-dock-dot" aria-hidden="true"></i>' : '';
          return '<button type="button" class="lab-dock-btn' + (on ? ' is-on' : '') + '" data-dock="' + esc(group.key) + '"' +
            ' aria-expanded="' + (on ? 'true' : 'false') + '" title="' + esc(group.title) + '">' +
            icon(group.icon) + badge + '<span class="lab-dock-name">' + esc(group.title) + '</span></button>';
        }).join('') +
        '</div>' +
        '<div class="lab-dock-panel"' + (dockOpen ? '' : ' hidden') + ' data-dock-panel>' +
        '<div class="lab-dock-head"><h2>' + esc(dockTitle(dockOpen) || copy('Tools', 'Ferramentas')) + '</h2>' +
        '<button type="button" class="lab-dock-close" data-dock-close aria-label="' + esc(copy('Close', 'Fechar')) + '">×</button></div>' +
        '<div class="lab-dock-body" data-dock-body>' + (dockOpen ? dockBodyHtml(dockOpen, results) : '') + '</div>' +
        '</div></div>';
    }

    function stepChips(plan) {
      var out = [];
      plan.equipment.forEach(function (row) {
        out.push('<button type="button" class="lab-do-chip" data-add-vessel="' + esc(row.type) + '">+ ' +
          esc(lang === 'pt' ? row.labelPt : row.labelEn) + '</button>');
      });
      var into = plan.into ? ' data-step-into="' + esc(plan.into) + '"' : '';
      plan.materials.forEach(function (row) {
        out.push('<button type="button" class="lab-do-chip" data-step-add="' + esc(row.id) + '" data-step-amount="' + esc(row.amount) + '"' + into + '>' +
          '<i class="lab-chip-swatch" style="background:' + esc(row.color) + '"></i>+ ' +
          esc(row.name) + ' ' + esc(row.amount) + ' ' + esc(row.unit) + '</button>');
      });
      if (plan.options.length) {
        out.push('<span class="lab-do-or">' + esc(copy('either', 'ou')) + '</span>');
        plan.options.forEach(function (row) {
          out.push('<button type="button" class="lab-do-chip" data-step-add="' + esc(row.id) + '" data-step-amount="' + esc(row.amount) + '"' + into + '>' +
            '<i class="lab-chip-swatch" style="background:' + esc(row.color) + '"></i>+ ' +
            esc(row.name) + ' ' + esc(row.amount) + ' ' + esc(row.unit) + '</button>');
        });
      }
      if (plan.needsStir) {
        out.push('<button type="button" class="lab-do-chip" data-lab-stir>' + esc(copy('Stir', 'Agitar')) + '</button>');
      }
      if (plan.needsConnect) {
        out.push('<button type="button" class="lab-do-chip" data-step-connect>' + esc(copy('Assemble the apparatus', 'Montar a aparelhagem')) + '</button>');
      }
      if (plan.heatTo) {
        out.push('<button type="button" class="lab-do-chip" data-step-heat="' + esc(plan.heatTo) + '">' +
          esc(copy('Heat to ' + plan.heatTo + ' °C', 'Aquecer até ' + plan.heatTo + ' °C')) + '</button>');
      } else if (plan.needsHeat) {
        out.push('<button type="button" class="lab-do-chip" data-heat="20">' + esc(copy('Warm +20 °C', 'Aquecer +20 °C')) + '</button>');
      }
      if (plan.needsDistill) {
        out.push('<button type="button" class="lab-do-chip" data-step-distill>' + esc(copy('Distil', 'Destilar')) + '</button>');
      }
      if (plan.needsMeasure) {
        out.push('<button type="button" class="lab-do-chip" data-measure="ph">' + esc(copy('Measure pH', 'Medir pH')) + '</button>');
        out.push('<button type="button" class="lab-do-chip" data-measure="volume">' + esc(copy('Measure volume', 'Medir volume')) + '</button>');
      }
      if (!out.length) {
        out.push('<button type="button" class="lab-do-chip" data-measure="volume">' + esc(copy('Read the vessel', 'Ler o vidro')) + '</button>');
      }
      return '<div class="lab-do-row">' + out.join('') + '</div>';
    }

    function hintsHtml(plan) {
      if (!hintLevel) {
        return '<button type="button" class="ws-btn ws-btn-sm" data-lab-hint>' + esc(copy('Show hint', 'Mostrar dica')) + '</button>';
      }
      var shown = plan.hints.slice(0, hintLevel).map(function (hint, i) {
        return '<li><strong>' + esc(copy('Hint', 'Dica')) + ' ' + (i + 1) + '.</strong> ' + esc(lang === 'pt' ? hint.pt : hint.en) + '</li>';
      }).join('');
      return '<ul class="lab-hints">' + shown + '</ul>' +
        (hintLevel < plan.hints.length
          ? '<button type="button" class="ws-btn ws-btn-sm" data-lab-hint>' + esc(copy('More help', 'Mais ajuda')) + '</button>'
          : '<button type="button" class="ws-btn ws-btn-sm" data-lab-hint="reset">' + esc(copy('Hide hints', 'Ocultar dicas')) + '</button>');
    }

    /* Tower order, drawn top-down the way a column is read. */
    function fractionsHtml(creation) {
      if (!creation || !creation.fractions || !creation.fractions.length) return '';
      var rows = creation.fractions.slice().reverse().map(function (row) {
        return '<li><span>' + esc(lang === 'pt' ? row.pt : row.en) + '</span></li>';
      }).join('');
      return '<details class="lab-tower"><summary>' + esc(copy('Tower order (top to bottom)', 'Ordem da torre (topo à base)')) + '</summary>' +
        '<ol class="lab-tower-list">' + rows + '</ol>' +
        '<p class="lab-dock-note">' + esc(copy(
          'Conceptual only. Atomurus does not simulate operating a refinery.',
          'Apenas conceitual. O Atomurus não simula a operação de uma refinaria.'
        )) + '</p></details>';
    }

    function tutorialHtml() {
      var wanted = wantedNow();
      var creation = wanted.creation;
      if (!creation || !wanted.state || !wanted.plan) {
        return '<div class="lab-guide lab-guide-empty" data-lab-guide>' +
          '<h2>' + esc(copy('Step-by-step', 'Passo a passo')) + '</h2>' +
          '<p class="ws-lede">' + esc(copy('Search what you want to create, then build it here one step at a time.', 'Pesquise o que você quer criar e construa aqui, um passo de cada vez.')) + '</p>' +
          '<button type="button" class="ws-btn ws-btn-sm ws-btn-primary" data-dock="create">' + esc(copy('Browse creations', 'Ver criações')) + '</button>' +
          '</div>';
      }
      var state = wanted.state;
      var total = creation.tutorial.length;
      var plan = wanted.plan;
      var pct = Math.max(4, Math.round((state.current / total) * 100));
      var stepList = state.steps.map(function (step, i) {
        var mark = state.done[i] ? ' is-done' : (i === state.current ? ' is-now' : '');
        return '<li class="lab-guide-step' + mark + '">' + esc(lang === 'pt' ? step.pt : step.en) + '</li>';
      }).join('');
      if (state.complete) {
        return '<section class="lab-guide is-complete" data-lab-guide>' +
          '<h2>' + esc(labelOf(creation, lang)) + '</h2>' +
          '<p class="lab-guide-progress">' + esc(copy('All steps done', 'Todos os passos concluídos')) + ' · ' + total + '/' + total + '</p>' +
          '<div class="lab-guide-bar"><i style="width:100%"></i></div>' +
          '<p class="lab-guide-done">' + esc(copy('Practice complete (virtual).', 'Prática concluída (virtual).')) + '</p>' +
          '<p class="ws-lede">' + esc(lang === 'pt' ? creation.lede.pt : creation.lede.en) + '</p>' +
          '<ol>' + stepList + '</ol>' +
          fractionsHtml(creation) +
          '<button type="button" class="ws-btn ws-btn-sm" data-stop-creation>' + esc(copy('Leave guide', 'Sair do guia')) + '</button>' +
          '</section>';
      }
      return '<section class="lab-guide" data-lab-guide>' +
        '<h2>' + esc(labelOf(creation, lang)) + '</h2>' +
        '<p class="lab-guide-progress">' + esc(copy('Step', 'Passo')) + ' ' + Math.min(state.current + 1, total) + ' ' + esc(copy('of', 'de')) + ' ' + total + '</p>' +
        '<div class="lab-guide-bar"><i style="width:' + pct + '%"></i></div>' +
        '<p class="lab-guide-now">' + esc(lang === 'pt' ? plan.text.pt : plan.text.en) + '</p>' +
        stepChips(plan) +
        (plan.why ? '<p class="lab-guide-why"><strong>' + esc(copy('Why?', 'Por quê?')) + '</strong> ' + esc(stepWhy(plan)) + '</p>' : '') +
        hintsHtml(plan) +
        '<details class="lab-guide-all"><summary>' + esc(copy('All steps', 'Todos os passos')) + '</summary><ol>' + stepList + '</ol></details>' +
        fractionsHtml(creation) +
        '<button type="button" class="ws-btn ws-btn-sm" data-stop-creation>' + esc(copy('Leave guide', 'Sair do guia')) + '</button>' +
        '</section>';
    }

    function stepWhy(step) {
      if (!step || !step.why) return '';
      return lang === 'pt' ? (step.why.pt || step.why.en) : (step.why.en || step.why.pt);
    }

    /* Tubing is anchored to the port it is attached to: necks and inlets sit at
       the top of a piece, outlets at the bottom. */
    function portAnchor(id, portId) {
      var obj = findObject(session, id);
      var row = findContainer(session, id);
      if (!obj || !row) return null;
      var art = specOf(row.type);
      var w = Math.max(124, Number(art.w) || 124);
      var h = Math.max(160, Number(art.h) || 180);
      var low = String(portId || '').indexOf('outlet') !== -1;
      return {
        x: Number(obj.x) + w / 2,
        y: Number(obj.y) + (low ? h * 0.82 : 14)
      };
    }

    function connectionsHtml() {
      var links = (session.board && session.board.connections) || [];
      if (!links.length) return '';
      return '<svg class="lab-links" width="2400" height="1600" viewBox="0 0 2400 1600" aria-hidden="true">' + links.map(function (link) {
        var a = portAnchor(link.fromId, link.fromPort);
        var b = portAnchor(link.toId, link.toPort);
        if (!a || !b) return '';
        var reach = Math.max(30, Math.abs(b.x - a.x) * 0.45);
        return '<path d="M' + a.x + ' ' + a.y +
          ' C ' + (a.x + reach) + ' ' + a.y + ', ' + (b.x - reach) + ' ' + b.y + ', ' + b.x + ' ' + b.y + '" />';
      }).join('') + '</svg>';
    }

    function vesselHtml(container) {
      mixContainer(container);
      ensureBoard(session);
      var obj = findObject(session, container.id);
      var sediment = 0;
      var solids = (container.contents || []).filter(function (row) {
        var spec = SUBSTANCES[row.id];
        return spec && spec.state === 'solid';
      });
      if (solids.length && canHold(container)) {
        sediment = Math.min(22, 6 + solids.reduce(function (sum, row) { return sum + (Number(row.amount) || 0); }, 0) * 0.35);
      }
      var color = container.color || mixColor(container);
      var active = container.id === session.selectedId || (selectedIds.indexOf(container.id) !== -1);
      var kind = container.type || 'beaker';
      var pourCls = pourFrom === container.id ? ' is-pour-source' : (pourFrom && canHold(container) ? ' is-pour-target' : '');
      var heatCls = heatFrom === container.id ? ' is-heat-source' : '';
      var snap = heatZoneFor(session, container.id);
      if (snap && hasCap(container, 'heat')) heatCls += ' is-heat-zone';
      var cupped = specOf(kind).heat && heaterIsCupped(session, container.id);
      var emulsion = String(container.appearance || '').indexOf('emulsion') !== -1 || container.productId === 'sunscreen';
      var warm = (Number(container.temperatureC) || 22) >= 40;
      var cls = 'lab-glass lab-piece lab-' + kind + (kind === 'beaker' ? ' lab-beaker' : '') + (active ? ' is-active' : '') + (container.fizz ? ' is-fizz' : '') + (emulsion ? ' is-emulsion' : '') + (warm ? ' is-warm' : '') + (cupped ? ' is-cupped' : '') + pourCls + heatCls;
      var product = lang === 'pt' ? (container.productPt || container.product) : container.product;
      var x = obj ? Number(obj.x) : Number(container.x);
      var y = obj ? Number(obj.y) : Number(container.y);
      var rot = obj ? Number(obj.rotation) || 0 : 0;
      var z = obj ? Number(obj.zIndex) || 1 : 1;
      if (!isFinite(x)) x = 80;
      if (!isFinite(y)) y = 80;
      var holds = canHold(container);
      var body = vesselSvg(container, {
        color: color,
        warm: warm,
        fizz: container.fizz,
        sediment: sediment,
        phases: container.phases,
        lit: kind === 'bunsen' && heatFrom === container.id
      });
      var spec = specOf(kind);
      var meta = holds
        ? (esc(container.volumeMl) + ' / ' + esc(container.capacityMl) + ' mL')
        : esc(lang === 'pt' ? spec.labelPt : spec.labelEn);
      var ports = ((spec.ports || []).length && (active || connectFrom))
        ? '<span class="lab-ports">' + (spec.ports || []).map(function (port) {
          return '<i class="lab-port" data-port="' + esc(port.id) + '" data-port-type="' + esc(port.type) + '"></i>';
        }).join('') + '</span>'
        : '';
      return '<button type="button" class="' + cls + '" data-vessel="' + esc(container.id) + '" draggable="false" aria-pressed="' + (active ? 'true' : 'false') + '" style="left:' + x + 'px;top:' + y + 'px;z-index:' + z + ';--lab-rot:' + rot + 'deg;transform:rotate(' + rot + 'deg)">' +
        body +
        ports +
        '<span class="lab-glass-name">' + esc(container.label || kind) + '</span>' +
        '<span class="lab-glass-meta">' + meta + '</span>' +
        (product ? '<span class="lab-glass-product">' + esc(product) + '</span>' : '') +
        '</button>';
    }

    function inspectorHtml() {
      var container = selected();
      if (!container) return '';
      mixContainer(container);
      var contents = (container.contents || []).map(function (row) {
        var spec = SUBSTANCES[row.id];
        return esc((spec && spec.name) || row.id) + ' ' + esc(Math.round((Number(row.amount) || 0) * 10) / 10) + (row.unit ? ' ' + row.unit : '');
      }).join(' · ') || copy('Empty', 'Vazio');
      var model = container.reactionId ? REACTIONS[container.reactionId] : null;
      var reactionBlock = model
        ? '<div class="lab-reaction" data-lab-reaction><span class="lab-reaction-tag">' + esc(copy('Reaction', 'Reação')) + '</span>' +
          '<code class="lab-reaction-eq">' + esc(model.equation) + '</code>' +
          '<p>' + esc(lang === 'pt' ? model.pt : model.en) + '</p></div>'
        : '';
      var rig = distillSetup(session, container.id);
      var rigBlock = rig
        ? '<div class="lab-rig"><span class="lab-reaction-tag">' + esc(copy('Apparatus ready', 'Aparelhagem pronta')) + '</span>' +
          '<p>' + esc(container.label || container.id) + ' → ' + esc(rig.condenser.label || rig.condenser.id) + ' → ' + esc(rig.receiver.label || rig.receiver.id) + '</p>' +
          '<button type="button" class="ws-btn ws-btn-sm ws-btn-primary" data-lab-distill>' + esc(copy('Distil', 'Destilar')) + '</button></div>'
        : '';
      return reactionBlock + rigBlock +
        '<div class="lab-kv"><span>' + esc(copy('Vessel', 'Vidro')) + '</span><strong>' + esc(container.label || container.id) + '</strong></div>' +
        '<div class="lab-kv"><span>' + esc(copy('Contents', 'Conteúdo')) + '</span><strong>' + contents + '</strong></div>' +
        '<div class="lab-kv"><span>' + esc(copy('Volume', 'Volume')) + '</span><strong>' + esc(container.volumeMl) + ' mL</strong></div>' +
        '<div class="lab-kv"><span>' + esc(copy('Mass', 'Massa')) + '</span><strong>' + esc(Math.round(containerMass(container) * 10) / 10) + ' g</strong></div>' +
        '<div class="lab-kv"><span>' + esc(copy('Temperature', 'Temperatura')) + '</span><strong>' + esc(container.temperatureC) + ' °C</strong></div>' +
        '<div class="lab-kv"><span>pH</span><strong>' + esc(container.ph == null ? '—' : container.ph) + '</strong></div>' +
        '<div class="lab-kv"><span>' + esc(copy('Appearance', 'Aparência')) + '</span><strong>' + esc(container.appearance) + '</strong></div>' +
        (container.product ? '<div class="lab-kv lab-kv-product"><span>' + esc(copy('Created', 'Criado')) + '</span><strong>' + esc(lang === 'pt' ? (container.productPt || container.product) : container.product) + '</strong></div>' : '') +
        (pourFrom ? '<p class="lab-pour-hint">' + esc(copy('Pouring: click another vessel to transfer.', 'Transferindo: clique em outro vidro para despejar.')) + '</p>' : '') +
        (pipetteFrom ? '<p class="lab-pour-hint">' + esc(copy('Pipette loaded. Click a vessel to dispense.', 'Pipeta carregada. Clique em um vidro para dispensar.')) + '</p>' : '') +
        (dropFrom ? '<p class="lab-pour-hint">' + esc(copy('Burette ready. Click a vessel for a 1 mL drop.', 'Bureta pronta. Clique em um vidro para uma gota de 1 mL.')) + '</p>' : '') +
        (connectFrom ? '<p class="lab-pour-hint">' + esc(copy('Connecting: click a compatible port or vessel.', 'Conectando: clique em um porto ou vidro compatível.')) + '</p>' : '') +
        '<p class="ws-lede">' + esc(copy('Virtual laboratory simulation. Values are educational, not experimental.', 'Simulação de laboratório virtual. Os valores são educacionais, não experimentais.')) + '</p>' +
        '<div class="lab-measures">' +
        (hasCap(container, 'aspirate') ? '<button type="button" class="ws-btn ws-btn-sm" data-lab-aspirate>' + esc(copy('Aspirate', 'Aspirar')) + '</button>' : '') +
        (hasCap(container, 'dispense') || hasCap(container, 'dispense_exact') ? '<button type="button" class="ws-btn ws-btn-sm" data-lab-dispense>' + esc(copy('Dispense', 'Dispensar')) + '</button>' : '') +
        (hasCap(container, 'dispense_controlled') ? '<button type="button" class="ws-btn ws-btn-sm" data-lab-drop>' + esc(copy('Drop 1 mL', 'Gota 1 mL')) + '</button>' : '') +
        (hasCap(container, 'grind') ? '<button type="button" class="ws-btn ws-btn-sm" data-lab-grind>' + esc(copy('Grind', 'Triturar')) + '</button>' : '') +
        (hasCap(container, 'separate') ? '<button type="button" class="ws-btn ws-btn-sm" data-lab-drain>' + esc(copy('Open valve', 'Abrir válvula')) + '</button>' : '') +
        ((specOf(container.type).ports || []).length ? '<button type="button" class="ws-btn ws-btn-sm' + (connectFrom === container.id ? ' is-on' : '') + '" data-lab-connect>' + esc(copy('Connect', 'Conectar')) + '</button>' : '') +
        '<button type="button" class="ws-btn ws-btn-sm" data-lab-duplicate>' + esc(copy('Duplicate', 'Duplicar')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-lab-delete>' + esc(copy('Delete', 'Remover')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-lab-rotate="-15">↺</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-lab-rotate="15">↻</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-measure="volume">' + esc(copy('Volume', 'Volume')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-measure="mass">' + esc(copy('Mass', 'Massa')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-measure="temperature">' + esc(copy('Temperature', 'Temperatura')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-measure="ph">pH</button>' +
        '</div>';
    }

    function notesHtml() {
      var notes = (session.observations || []).slice(-8).reverse().map(function (row) {
        return '<li><time>' + esc(String(row.at).slice(11, 16)) + '</time> ' + esc(row.text) + '</li>';
      }).join('') || '<li>' + esc(copy('No observations yet.', 'Ainda não há observações.')) + '</li>';
      return notes;
    }

    function reducedMotion() {
      return Boolean(document.documentElement.getAttribute('data-reduced-motion'));
    }

    /* One short class on the clipped fill group; nothing animates at rest. */
    function animateFill(target, cls, ms) {
      if (reducedMotion() || !target) return;
      var group = target.querySelector ? target.querySelector('.lab-svg-fill') : null;
      if (!group) return;
      group.classList.remove(cls);
      void group.getBoundingClientRect();
      group.classList.add(cls);
      setTimeout(function () {
        if (group.classList) group.classList.remove(cls);
      }, ms);
    }

    function pulseLiquid(id) {
      var piece = id
        ? node.querySelector('[data-vessel="' + id + '"]')
        : (node.querySelector('.lab-glass.is-active') || node.querySelector('.lab-glass.is-fizz'));
      animateFill(piece, 'is-rising', 440);
    }

    /* Only vessels that are actually bubbling or flaming get an observer. */
    function refreshMotion() {
      var stage = node.querySelector('[data-lab-stage]');
      if (!stage) return;
      var pieces = [];
      node.querySelectorAll('[data-vessel]').forEach(function (piece) {
        if (piece.querySelector('.lab-svg-bubble, .lab-svg-flame, .lab-svg-vapor')) pieces.push(piece);
      });
      if (motionObserver) motionObserver.disconnect();
      if (!pieces.length || typeof IntersectionObserver !== 'function') return;
      motionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle('is-offscreen', !entry.isIntersecting);
        });
      }, { root: stage, rootMargin: '40px' });
      pieces.forEach(function (piece) { motionObserver.observe(piece); });
    }

    /* A reaction is a moment, so it gets one short burst and then stops. */
    function playReactionFx(id, model) {
      if (!model) return;
      playSound('reaction');
      var piece = node.querySelector('[data-vessel="' + id + '"]');
      if (!piece || reducedMotion()) return;
      piece.classList.remove('is-reacting');
      void piece.getBoundingClientRect();
      piece.classList.add('is-reacting');
      setTimeout(function () {
        if (piece.classList) piece.classList.remove('is-reacting');
      }, 900);
    }

    function runDistill(fromGuide) {
      var runner = fromGuide ? (preferredVessel('round-flask') || selected()) : selected();
      if (!runner) return;
      session.selectedId = runner.id;
      var run = distill(session, runner.id);
      queueSave();
      updateLive();
      if (run.ok) {
        playDistillFx(run.rig, mixColor(run.rig.receiver));
        flashStatus('');
        return;
      }
      playSound('deny');
      var why = copy('This apparatus cannot distil yet.', 'Esta aparelhagem ainda não pode destilar.');
      if (run.reason === 'cold') {
        why = copy('Heat the flask to about ' + Math.round(run.needed) + ' °C first.', 'Aqueça o balão até cerca de ' + Math.round(run.needed) + ' °C primeiro.');
      } else if (run.reason === 'single') {
        why = copy('Distillation separates a mixture: charge the flask with two components that boil at different temperatures.', 'A destilação separa uma mistura: carregue o balão com dois componentes que fervem a temperaturas diferentes.');
      } else if (run.reason === 'receiver-full') {
        why = copy('The receiving flask is full.', 'O balão coletor está cheio.');
      } else if (run.reason === 'no-rig') {
        why = copy('Connect the flask to a condenser and the condenser to a receiving flask.', 'Conecte o balão ao condensador e o condensador ao balão coletor.');
      }
      flashStatus('<div class="lab-msg" role="status">' + esc(why) + '</div>');
    }

    function playDistillFx(rig, color) {
      playSound('distill');
      var source = node.querySelector('[data-vessel="' + rig.source.id + '"]');
      if (source && !reducedMotion()) {
        source.classList.add('is-boiling');
        setTimeout(function () {
          if (source.classList) source.classList.remove('is-boiling');
        }, 1200);
      }
      playTransferFx(rig.condenser.id, rig.receiver.id, color, 'drop');
    }

    function playTransferFx(fromId, toId, color, kind) {
      playSound(kind === 'drop' ? 'drop' : 'pour');
      pulseLiquid();
      if (document.documentElement.getAttribute('data-reduced-motion')) return;
      var world = node.querySelector('[data-lab-world]');
      var src = node.querySelector('[data-vessel="' + fromId + '"]');
      var dst = node.querySelector('[data-vessel="' + toId + '"]');
      if (!world || !src || !dst) return;
      src.classList.add('is-pouring');
      dst.classList.add('is-receiving');
      var x1 = (parseFloat(src.style.left) || 0) + 58;
      var y1 = (parseFloat(src.style.top) || 0) + 78;
      var x2 = (parseFloat(dst.style.left) || 0) + 58;
      var y2 = (parseFloat(dst.style.top) || 0) + 36;
      var dx = x2 - x1;
      var dy = y2 - y1;
      var len = Math.max(12, Math.sqrt(dx * dx + dy * dy));
      var ang = Math.atan2(dy, dx) * 180 / Math.PI;
      var el = document.createElement('span');
      el.className = 'lab-stream' + (kind === 'drop' ? ' is-drip' : '');
      el.setAttribute('aria-hidden', 'true');
      el.style.left = x1 + 'px';
      el.style.top = y1 + 'px';
      el.style.width = len + 'px';
      el.style.background = color || '#7EB6D9';
      el.style.transform = 'rotate(' + ang + 'deg)';
      world.appendChild(el);
      if (fxTimer) clearTimeout(fxTimer);
      fxTimer = setTimeout(function () {
        src.classList.remove('is-pouring');
        dst.classList.remove('is-receiving');
        if (el.parentNode) el.remove();
      }, kind === 'drop' ? 480 : 760);
    }

    function playHeatFx(id) {
      var el = node.querySelector('[data-vessel="' + id + '"]');
      if (!el) return;
      el.classList.add('is-heating');
      if (document.documentElement.getAttribute('data-reduced-motion')) {
        el.classList.remove('is-heating');
        return;
      }
      if (heatTimer) clearTimeout(heatTimer);
      heatTimer = setTimeout(function () {
        if (el.classList) el.classList.remove('is-heating');
      }, 720);
    }

    function flashStatus(html) {
      lastStatus = html || '';
      var status = node.querySelector('[data-lab-status]');
      if (status) status.innerHTML = lastStatus;
    }

    /* Insets keep the floating dock and inspector from covering the glassware. */
    function boardInsets(rect) {
      return {
        left: 16,
        right: 16,
        top: 16,
        bottom: rect.width > 780 ? 72 : 84
      };
    }

    function boardBounds() {
      var minX = Infinity;
      var minY = Infinity;
      var maxX = -Infinity;
      var maxY = -Infinity;
      (session.containers || []).forEach(function (row) {
        var obj = findObject(session, row.id);
        var spec = specOf(row.type);
        var x = Number(obj ? obj.x : row.x);
        var y = Number(obj ? obj.y : row.y);
        if (!isFinite(x) || !isFinite(y)) return;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + Math.max(132, Number(spec.w) || 124));
        maxY = Math.max(maxY, y + Math.max(196, Number(spec.h) || 188) + 52);
      });
      if (!isFinite(minX)) return null;
      return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
    }

    function fitView() {
      var stage = node.querySelector('[data-lab-stage]');
      var box = boardBounds();
      if (!stage || !box) return false;
      var rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height) return false;
      var pad = boardInsets(rect);
      var availW = Math.max(160, rect.width - pad.left - pad.right);
      var availH = Math.max(160, rect.height - pad.top - pad.bottom);
      var next = Math.min(1, availW / box.w, availH / box.h);
      zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
      panX = Math.round(pad.left + (availW - box.w * zoom) / 2 - box.x * zoom);
      panY = Math.round(pad.top + (availH - box.h * zoom) / 2 - box.y * zoom);
      applyWorld();
      return true;
    }

    function applyWorld() {
      ensureBoard(session);
      session.board.camera.x = panX;
      session.board.camera.y = panY;
      session.board.camera.zoom = zoom;
      session.panX = panX;
      session.panY = panY;
      session.zoom = zoom;
      var world = node.querySelector('[data-lab-world]');
      if (world) world.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')';
      var zoomLabel = node.querySelector('[data-lab-zoom-label]');
      if (zoomLabel) zoomLabel.textContent = Math.round(zoom * 100) + '%';
    }

    /* Guided progress is derived, so the cue fires only when the step really moves. */
    function announceStep() {
      var wanted = wantedNow();
      if (!wanted.creation || !wanted.state) {
        lastStepKey = '';
        return;
      }
      var key = wanted.creation.id + ':' + wanted.state.current;
      if (!lastStepKey) {
        lastStepKey = key;
        return;
      }
      if (key === lastStepKey) return;
      var moved = wanted.state.current > Number(String(lastStepKey).split(':')[1] || 0);
      lastStepKey = key;
      if (!moved) return;
      hintLevel = 0;
      playSound(wanted.state.complete ? 'complete' : 'step');
    }

    function updateLive() {
      var bench = node.querySelector('[data-lab-bench]');
      var inspector = node.querySelector('[data-lab-inspector]');
      var notes = node.querySelector('[data-lab-notes]');
      var guide = node.querySelector('[data-lab-guide-host]');
      var dockBody = node.querySelector('[data-dock-body]');
      var amounts = node.querySelectorAll('[data-amount]');
      announceStep();
      if (bench && !dragging) bench.innerHTML = connectionsHtml() + session.containers.map(vesselHtml).join('');
      if (inspector) inspector.innerHTML = inspectorHtml();
      if (notes) notes.innerHTML = notesHtml();
      if (guide) guide.innerHTML = tutorialHtml();
      if (dockBody && dockOpen) {
        var keepTop = dockBody.scrollTop;
        dockBody.innerHTML = dockBodyHtml(dockOpen);
        dockBody.scrollTop = keepTop;
      }
      amounts.forEach(function (btn) {
        btn.classList.toggle('is-on', Number(btn.getAttribute('data-amount')) === amount);
      });
      var pourBtn = node.querySelector('[data-lab-pour]');
      if (pourBtn) pourBtn.classList.toggle('is-on', Boolean(pourFrom));
      applyWorld();
      refreshMotion();
    }

    function syncDock(results) {
      var dock = node.querySelector('[data-lab-dock]');
      if (!dock) return;
      dock.classList.toggle('is-open', Boolean(dockOpen));
      dock.querySelectorAll('[data-dock]').forEach(function (btn) {
        var on = btn.getAttribute('data-dock') === dockOpen;
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      });
      var panel = dock.querySelector('[data-dock-panel]');
      var head = dock.querySelector('.lab-dock-head h2');
      var body = dock.querySelector('[data-dock-body]');
      var createBtn = dock.querySelector('[data-dock="create"]');
      if (createBtn) {
        var dot = createBtn.querySelector('.lab-dock-dot');
        var wantDot = Boolean(session.creationId);
        if (wantDot && !dot) createBtn.insertAdjacentHTML('afterbegin', '<i class="lab-dock-dot" aria-hidden="true"></i>');
        if (!wantDot && dot) dot.remove();
      }
      if (panel) panel.hidden = !dockOpen;
      if (head) head.textContent = dockTitle(dockOpen) || copy('Tools', 'Ferramentas');
      if (body) {
        var bodyTop = body.scrollTop;
        body.innerHTML = dockOpen ? dockBodyHtml(dockOpen, results) : '';
        if (dockOpen) body.scrollTop = bodyTop;
      }
      var shell = node.querySelector('.lab-stage-shell');
      if (shell) shell.classList.toggle('is-dock-open', Boolean(dockOpen));
      if (autoCam) fitView();
    }

    function syncSide() {
      node.querySelectorAll('[data-side]').forEach(function (btn) {
        var on = btn.getAttribute('data-side') === sideTab;
        btn.classList.toggle('is-on', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      var inspector = node.querySelector('[data-lab-inspector-pane]');
      var guide = node.querySelector('[data-lab-guide-host]');
      if (inspector) inspector.hidden = sideTab !== 'inspector';
      if (guide) guide.hidden = sideTab !== 'guide';
    }

    function syncSound() {
      var btn = node.querySelector('[data-lab-sound]');
      if (!btn) return;
      var on = soundEnabled();
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.classList.toggle('is-off', !on);
      btn.innerHTML = icon(on ? 'sound' : 'muted') +
        '<span class="lc-sr-only">' + esc(on ? copy('Mute lab sounds', 'Silenciar sons do Lab') : copy('Unmute lab sounds', 'Ativar sons do Lab')) + '</span>';
      btn.title = on ? copy('Sound on', 'Som ligado') : copy('Sound off', 'Som desligado');
    }

    function paint(results) {
      var searchValue = params.get('q') || '';
      results = results || (searchValue ? searchCatalog(searchValue) : { status: 'ok' });
      var creation = CREATIONS.filter(function (row) { return row.id === session.creationId; })[0];
      var guest = !user;
      var notice = guest
        ? '<p class="ws-lede">' + esc(copy('Create an account to save sessions. This demo stays on this device.', 'Crie uma conta para salvar sessões. Esta demonstração fica neste dispositivo.')) + '</p>'
        : '';
      var guided = CREATIONS.map(function (row) {
        return '<a class="ws-lab-card lab-creation-card" href="/app?section=lab&mode=guided&creation=' + esc(row.id) + '">' +
          '<span class="ws-lab-badge">' + esc(row.category) + '</span>' +
          '<h3 class="ws-lab-card-title">' + esc(labelOf(row, lang)) + '</h3>' +
          '<p class="ws-lab-card-copy">' + esc(lang === 'pt' ? row.lede.pt : row.lede.en) + '</p></a>';
      }).join('');
      var recent = listSessions().slice(0, 4).map(function (row) {
        return '<a class="ws-study-item" href="/app?section=lab&session=' + esc(row.id) + '"><div><h3 class="ws-item-title">' + esc(row.title) + '</h3>' +
          '<div class="ws-muted">' + esc(row.mode) + '</div></div></a>';
      }).join('');
      var diamondNote = session.creationId === 'diamond'
        ? '<div class="lab-msg">' + esc(copy(
          'This stage represents industrial carbon allotropes conceptually. It does not describe how to build or operate high-pressure equipment.',
          'Esta etapa representa alótropos de carbono de forma conceitual. Não descreve como construir ou operar equipamento de alta pressão.'
        )) + ' <a href="/viewer/allotropes.html">' + esc(copy('Open Allotropes viewer', 'Abrir o visualizador de alótropos')) + '</a></div>'
        : '';

      if (section === 'creations') {
        node.innerHTML = '<p class="ws-kicker">Atomurus Lab</p><h1 class="ws-title">' + esc(copy('Guided Creations', 'Criações guiadas')) + '</h1>' +
          '<p class="ws-lede">' + esc(copy('Search a curated catalog. The Lab never invents a chemical recipe from free text.', 'Pesquise um catálogo curado. O Lab nunca inventa uma receita química a partir de texto livre.')) + '</p>' +
          searchBar(searchValue) + statusHtml(results) +
          '<div class="ws-grid ws-public-grid">' + guided + '</div>';
        bind(node);
        return;
      }

      if (section === 'notebook') {
        node.innerHTML = '<p class="ws-kicker">Atomurus Lab</p><h1 class="ws-title">' + esc(copy('Lab Notebook', 'Caderno do Lab')) + '</h1>' +
          notice +
          (recent ? '<section class="ws-overview-block"><h2 class="ws-h2">' + esc(copy('Recent sessions', 'Sessões recentes')) + '</h2><div class="ws-grid">' + recent + '</div></section>' : '') +
          '<section class="ws-overview-block"><h2 class="ws-h2">' + esc(copy('Observations', 'Observações')) + '</h2><ol class="lab-notes" data-lab-notes>' + notesHtml() + '</ol></section>';
        return;
      }

      var root = node.querySelector('[data-lab-root]');
      if (root) {
        var status = node.querySelector('[data-lab-status]');
        if (status) status.innerHTML = statusHtml(results);
        updateLive();
        syncDock(results);
        syncSide();
        syncSound();
        return;
      }

      node.innerHTML =
        '<div class="lab-board" data-lab-root>' +
        '<div class="lab-board-bar">' +
        '<div class="lab-board-title"><p class="ws-kicker">Atomurus Lab</p>' +
        '<h1 class="ws-title">' + esc(session.title || copy('Creation board', 'Board de criação')) + '</h1></div>' +
        '<form class="lab-search" data-lab-search role="search">' +
        '<label class="lc-sr-only" for="lab-q">' + esc(copy('What would you like to create?', 'O que você quer criar?')) + '</label>' +
        '<input id="lab-q" name="q" type="search" value="' + esc(searchValue) + '" placeholder="' + esc(copy('What would you like to create?', 'O que você quer criar?')) + '" autocomplete="off">' +
        '<button type="submit" class="ws-btn ws-btn-secondary">' + esc(copy('Search', 'Pesquisar')) + '</button>' +
        '</form>' +
        '<div class="lab-toolbar">' +
        '<button type="button" class="ws-btn ws-btn-sm" data-lab-undo>' + esc(copy('Undo', 'Desfazer')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-lab-redo>' + esc(copy('Redo', 'Refazer')) + '</button>' +
        '<span class="lab-zoom" role="group" aria-label="' + esc(copy('Zoom', 'Zoom')) + '">' +
        '<button type="button" class="ws-btn ws-btn-sm" data-lab-zoom="out" aria-label="' + esc(copy('Zoom out', 'Reduzir')) + '">−</button>' +
        '<span class="lab-zoom-label" data-lab-zoom-label>' + Math.round(zoom * 100) + '%</span>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-lab-zoom="in" aria-label="' + esc(copy('Zoom in', 'Ampliar')) + '">+</button>' +
        '</span>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-lab-fit>' + esc(copy('Fit', 'Ajustar')) + '</button>' +
        '<button type="button" class="lab-icon-btn" data-lab-sound aria-pressed="true" title="' + esc(copy('Sound on', 'Som ligado')) + '">' + icon('sound') + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-lab-reset>' + esc(copy('Reset', 'Reiniciar')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm ws-btn-primary" data-lab-save>' + esc(copy('Save', 'Salvar')) + '</button>' +
        '</div></div>' +
        notice + diamondNote +
        '<div data-lab-status>' + statusHtml(results) + '</div>' +
        '<div class="lab-stage-shell' + (dockOpen ? ' is-dock-open' : '') + '">' +
        dockHtml(results) +
        '<div class="lab-stage-frame">' +
        '<div class="lab-board-stage" data-lab-stage tabindex="0">' +
        '<div class="lab-board-world" data-lab-world data-lab-bench>' + connectionsHtml() + session.containers.map(vesselHtml).join('') + '</div>' +
        '</div>' +
        '<div class="lab-actionbar" role="toolbar" aria-label="' + esc(copy('Board actions', 'Ações do board')) + '">' +
        '<button type="button" class="ws-btn ws-btn-sm" data-lab-pour>' + esc(copy('Pour', 'Transferir')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-lab-stir>' + esc(copy('Stir', 'Agitar')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-lab-empty>' + esc(copy('Empty', 'Esvaziar')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-heat="-10">' + esc(copy('Cool', 'Esfriar')) + '</button>' +
        '<button type="button" class="ws-btn ws-btn-sm" data-heat="10">' + esc(copy('Heat', 'Aquecer')) + '</button>' +
        '</div></div>' +
        '<aside class="lab-side" data-lab-side>' +
        '<div class="lab-side-tabs" role="tablist">' +
        '<button type="button" role="tab" class="lab-side-tab" data-side="inspector" aria-selected="false">' + esc(copy('Inspector', 'Inspetor')) + '</button>' +
        '<button type="button" role="tab" class="lab-side-tab" data-side="guide" aria-selected="false">' + esc(copy('Step-by-step', 'Passo a passo')) + '</button>' +
        '</div>' +
        '<div class="lab-side-body">' +
        '<div data-lab-inspector-pane hidden><div data-lab-inspector>' + inspectorHtml() + '</div></div>' +
        '<div data-lab-guide-host hidden>' + tutorialHtml() + '</div>' +
        '</div></aside>' +
        '</div>' +
        '<section class="ws-overview-block"><h2 class="ws-h2">' + esc(copy('Notebook', 'Caderno')) + '</h2><ol class="lab-notes" data-lab-notes>' + notesHtml() + '</ol></section>' +
        '</div>';
      bind(node);
      syncSide();
      syncSound();
      applyWorld();
    }

    function searchBar(value) {
      return '<form class="lab-search" data-lab-search><input id="lab-q" name="q" type="search" value="' + esc(value) + '" placeholder="' +
        esc(copy('What would you like to create?', 'O que você quer criar?')) + '" autocomplete="off">' +
        '<button type="submit" class="ws-btn ws-btn-secondary">' + esc(copy('Search catalog', 'Pesquisar catálogo')) + '</button></form>';
    }

    function bind(rootEl) {
      var opts = {};
      if (typeof AbortController === 'function') {
        if (node._labAbort && typeof node._labAbort.abort === 'function') {
          try { node._labAbort.abort(); } catch (e) {}
        }
        node._labAbort = new AbortController();
        opts.signal = node._labAbort.signal;
      } else if (rootEl.dataset.labBound === '1') {
        return;
      }
      rootEl.dataset.labBound = '1';
      rootEl.addEventListener('submit', function (event) {
        var form = event.target && event.target.closest && event.target.closest('[data-lab-search]');
        if (!form) return;
        event.preventDefault();
        var input = rootEl.querySelector('#lab-q');
        var q = input ? input.value : '';
        var found = searchCatalog(q);
        params.set('q', q);
        if (found.status === 'unavailable' || found.status === 'unknown') {
          dockOpen = '';
          paint(found);
          playSound('deny');
          return;
        }
        if (found.resolved && found.resolved.kind === 'creation') {
          session.creationId = found.resolved.id;
          session.mode = 'guided';
          hintLevel = 0;
          lastStepKey = '';
          sideTab = 'guide';
          dockOpen = 'create';
          observe(session, copy('Started a guided creation.', 'Iniciou uma criação guiada.'));
          flushSave();
          paint(found);
          playSound('step');
          return;
        }
        if (found.resolved && found.resolved.kind === 'substance') {
          pourFrom = '';
          var into = preferredVessel();
          var hit = into ? addToContainer(session, into.id, found.resolved.id, amount) : { ok: false };
          if (into) session.selectedId = into.id;
          queueSave();
          dockOpen = 'create';
          paint(found);
          if (hit.ok) {
            pulseLiquid();
            playSound('material');
          } else {
            playSound('deny');
          }
          return;
        }
        dockOpen = 'create';
        paint(found);
      }, opts);
      rootEl.addEventListener('click', function (event) {
        try {
          var t = event.target && event.target.closest
            ? event.target.closest('[data-add], [data-vessel], [data-measure], [data-amount], [data-lab-undo], [data-lab-redo], [data-lab-reset], [data-lab-save], [data-lab-pour], [data-lab-stir], [data-lab-empty], [data-heat], [data-add-vessel], [data-ready], [data-lab-zoom], [data-lab-fit], [data-lab-aspirate], [data-lab-dispense], [data-lab-drop], [data-lab-grind], [data-lab-drain], [data-lab-connect], [data-lab-duplicate], [data-lab-delete], [data-lab-rotate], [data-dock], [data-dock-close], [data-side], [data-lab-sound], [data-start-creation], [data-stop-creation], [data-step-add], [data-lab-hint], [data-step-connect], [data-step-heat], [data-step-distill], [data-lab-distill]')
            : null;
          if (!t) return;
          if (t.hasAttribute('data-lab-sound')) {
            var soundOn = setSoundEnabled(!soundEnabled());
            syncSound();
            if (soundOn) playSound('select');
            return;
          }
          if (t.hasAttribute('data-dock-close')) {
            dockOpen = '';
            syncDock();
            return;
          }
          if (t.getAttribute('data-dock')) {
            var key = t.getAttribute('data-dock');
            dockOpen = dockOpen === key ? '' : key;
            syncDock();
            if (dockOpen) playSound('select');
            return;
          }
          if (t.getAttribute('data-side')) {
            sideTab = t.getAttribute('data-side');
            syncSide();
            return;
          }
          if (t.getAttribute('data-start-creation')) {
            var startId = t.getAttribute('data-start-creation');
            if (!CREATIONS.some(function (row) { return row.id === startId; })) return;
            session.creationId = startId;
            session.mode = 'guided';
            hintLevel = 0;
            lastStepKey = '';
            sideTab = 'guide';
            dockOpen = '';
            observe(session, copy('Started a guided creation.', 'Iniciou uma criação guiada.'));
            flushSave();
            syncDock();
            syncSide();
            updateLive();
            playSound('step');
            return;
          }
          if (t.hasAttribute('data-stop-creation')) {
            session.creationId = '';
            session.mode = 'bench';
            hintLevel = 0;
            lastStepKey = '';
            flushSave();
            updateLive();
            return;
          }
          if (t.getAttribute('data-lab-hint')) {
            hintLevel = 0;
            updateLive();
            return;
          }
          if (t.hasAttribute('data-lab-hint')) {
            hintLevel = Math.min(3, hintLevel + 1);
            updateLive();
            return;
          }
          if (t.getAttribute('data-step-add')) {
            var stepId = t.getAttribute('data-step-add');
            var stepAmount = Number(t.getAttribute('data-step-amount')) || amount;
            var target = preferredVessel(t.getAttribute('data-step-into') || '');
            if (!target) {
              flashStatus('<div class="lab-msg" role="status">' + esc(copy('Add a beaker to the board first.', 'Adicione um becker ao board primeiro.')) + '</div>');
              playSound('deny');
              return;
            }
            var stepAdded = addToContainer(session, target.id, stepId, stepAmount);
            session.selectedId = target.id;
            queueSave();
            updateLive();
            if (stepAdded.ok) {
              flashStatus('');
              pulseLiquid();
              if (stepAdded.reaction) playReactionFx(target.id, stepAdded.reaction);
              else playSound('material');
            } else {
              flashStatus('<div class="lab-msg" role="status">' + esc(copy('That vessel cannot take this material right now.', 'Esse vidro não pode receber este material agora.')) + '</div>');
              playSound('deny');
            }
            return;
          }
          if (t.hasAttribute('data-step-connect')) {
            var rigged = assembleRig(session);
            queueSave();
            updateLive();
            if (autoCam) fitView();
            if (rigged.ok) {
              playSound('place');
              flashStatus('');
            } else {
              playSound('deny');
              flashStatus('<div class="lab-msg" role="status">' + esc(copy('Add the flask, condenser and receiving flask first.', 'Adicione o balão, o condensador e o balão coletor primeiro.')) + '</div>');
            }
            return;
          }
          if (t.getAttribute('data-step-heat')) {
            var wantC = Number(t.getAttribute('data-step-heat')) || 0;
            var heatTarget = preferredVessel('round-flask') || selected();
            if (!heatTarget) return;
            var warmed = setTemperature(session, heatTarget.id, wantC);
            session.selectedId = heatTarget.id;
            queueSave();
            updateLive();
            if (warmed.ok && (Number(heatTarget.temperatureC) || 0) >= wantC - 1) {
              playSound('heat');
              playHeatFx(heatTarget.id);
              flashStatus('');
            } else {
              playSound('deny');
              flashStatus('<div class="lab-msg" role="status">' + esc(copy(
                'This vessel only reaches ' + Math.round(maxTemperatureFor(session, heatTarget)) + ' °C. Put it on a mantle or hot plate.',
                'Este vidro só chega a ' + Math.round(maxTemperatureFor(session, heatTarget)) + ' °C. Coloque-o sobre uma manta ou chapa.'
              )) + '</div>');
            }
            return;
          }
          if (t.getAttribute('data-amount')) {
            amount = Number(t.getAttribute('data-amount')) || 25;
            updateLive();
            return;
          }
          if (t.getAttribute('data-vessel')) {
            if (Date.now() < ignoreClickUntil) return;
            var id = t.getAttribute('data-vessel');
            var clicked = findContainer(session, id);
            var spec = clicked ? EQUIPMENT[clicked.type] || {} : {};
            if (event.shiftKey) {
              if (selectedIds.indexOf(id) === -1) selectedIds.push(id);
              else selectedIds = selectedIds.filter(function (row) { return row !== id; });
              session.selectedId = id;
              updateLive();
              return;
            }
            if (connectFrom && connectFrom !== id) {
              var linked = connectPorts(session, connectFrom, '', id, '');
              connectFrom = '';
              session.selectedId = id;
              queueSave();
              updateLive();
              if (!linked.ok) flashStatus('<div class="lab-msg" role="status">' + esc(copy('Those ports are not compatible.', 'Esses portos não são compatíveis.')) + '</div>');
              return;
            }
            if (pipetteFrom && pipetteFrom !== id) {
              var sentColor = mixColor(findContainer(session, pipetteFrom) || {});
              var sent = dispense(session, pipetteFrom, id);
              var sentFrom = pipetteFrom;
              pipetteFrom = '';
              session.selectedId = id;
              queueSave();
              updateLive();
              if (sent.ok) playTransferFx(sentFrom, id, sentColor, 'dispense');
              else flashStatus('<div class="lab-msg" role="status">' + esc(copy('Could not dispense into that vessel.', 'Não foi possível dispensar nesse vidro.')) + '</div>');
              return;
            }
            if (dropFrom && dropFrom !== id) {
              var dripColor = mixColor(findContainer(session, dropFrom) || {});
              var dripped = drop(session, dropFrom, id);
              var dripId = dropFrom;
              dropFrom = '';
              session.selectedId = id;
              queueSave();
              updateLive();
              if (dripped.ok) playTransferFx(dripId, id, dripColor, 'drop');
              else flashStatus('<div class="lab-msg" role="status">' + esc(copy('Could not drip into that vessel.', 'Não foi possível pingar nesse vidro.')) + '</div>');
              return;
            }
            var current = selected();
            if (current && hasCap(current, 'dispense_controlled') && current.id !== id && canHold(clicked) && hasCap(clicked, 'contain')) {
              var buretteColor = mixColor(current);
              var drippedDirect = drop(session, current.id, id);
              queueSave();
              updateLive();
              if (drippedDirect.ok) playTransferFx(current.id, id, buretteColor, 'drop');
              else flashStatus('<div class="lab-msg" role="status">' + esc(copy('Fill the burette first.', 'Encha a bureta primeiro.')) + '</div>');
              return;
            }
            if (current && hasCap(current, 'aspirate') && current.id !== id && canHold(clicked) && hasCap(clicked, 'contain')) {
              var loaded = (Number(current.volumeMl) || 0) > 0;
              var pipColor = mixColor(loaded ? current : clicked);
              var piped = loaded ? dispense(session, current.id, id) : aspirate(session, current.id, id, amount);
              var pipFrom = loaded ? current.id : id;
              var pipTo = loaded ? id : current.id;
              session.selectedId = current.id;
              queueSave();
              updateLive();
              if (piped.ok) playTransferFx(pipFrom, pipTo, pipColor, 'dispense');
              else flashStatus('<div class="lab-msg" role="status">' + esc(copy('This tool can\'t be used with that material or vessel.', 'Essa ferramenta não pode ser usada com esse material ou vidro.')) + '</div>');
              return;
            }
            if (heatFrom && pourFrom === '' && id !== heatFrom && canHold(clicked) && hasCap(clicked, 'heat')) {
              setTemperature(session, id, (Number(clicked.temperatureC) || 22) + 15);
              heatFrom = '';
              session.selectedId = id;
              queueSave();
              updateLive();
              pulseLiquid();
              playHeatFx(id);
              return;
            }
            if (pourFrom && pourFrom !== id) {
              var pourColor = mixColor(findContainer(session, pourFrom) || {});
              var pouredFrom = pourFrom;
              var poured = pour(session, pourFrom, id, amount);
              pourFrom = '';
              session.selectedId = id;
              queueSave();
              updateLive();
              if (poured.ok) playTransferFx(pouredFrom, id, pourColor, 'pour');
              else if (poured.reason === 'empty') flashStatus('<div class="lab-msg" role="status">' + esc(copy('That vessel is empty.', 'Esse vidro está vazio.')) + '</div>');
              else if (poured.reason === 'full') flashStatus('<div class="lab-msg" role="status">' + esc(copy('That vessel is full.', 'Esse vidro está cheio.')) + '</div>');
              return;
            }
            session.selectedId = id;
            selectedIds = [id];
            pourFrom = '';
            heatFrom = spec.heat ? id : '';
            updateLive();
            playSound('select');
            return;
          }
          if (t.getAttribute('data-add')) {
            pourFrom = '';
            var added = addToContainer(session, selected().id, t.getAttribute('data-add'), amount);
            queueSave();
            updateLive();
            if (added.ok) {
              flashStatus('');
              pulseLiquid();
              if (added.reaction) playReactionFx(selected().id, added.reaction);
              else playSound('material');
            } else if (added.reason === 'full') {
              playSound('deny');
              flashStatus('<div class="lab-msg" role="status">' + esc(copy('That vessel is full. Empty it or pour into another glass.', 'Esse vidro está cheio. Esvazie ou transfira para outro.')) + '</div>');
            } else if (added.reason === 'tool') {
              flashStatus('<div class="lab-msg" role="status">' + esc(copy('That tool does not hold a mixture. Select a beaker or flask.', 'Essa ferramenta não retém mistura. Selecione um becker ou erlenmeyer.')) + '</div>');
              playSound('deny');
            } else {
              playSound('deny');
            }
            return;
          }
          if (t.getAttribute('data-measure')) {
            measure(session, selected().id, t.getAttribute('data-measure'));
            queueSave();
            updateLive();
            return;
          }
          if (t.getAttribute('data-heat')) {
            var delta = Number(t.getAttribute('data-heat')) || 0;
            var vessel = selected();
            setTemperature(session, vessel.id, (Number(vessel.temperatureC) || 22) + delta);
            queueSave();
            updateLive();
            pulseLiquid();
            playSound(delta > 0 ? 'heat' : 'select');
            if (delta > 0) playHeatFx(vessel.id);
            return;
          }
          if (t.getAttribute('data-add-vessel')) {
            var placed = addVessel(session, t.getAttribute('data-add-vessel'));
            queueSave();
            updateLive();
            playSound(placed && placed.ok === false ? 'deny' : 'place');
            return;
          }
          if (t.getAttribute('data-ready')) {
            var kit = addReady(session, t.getAttribute('data-ready'), selected().id);
            queueSave();
            updateLive();
            if (kit.ok) {
              flashStatus('');
              pulseLiquid();
              playSound('pour');
            } else {
              playSound('deny');
              flashStatus('<div class="lab-msg" role="status">' + esc(copy('Select a vessel that can hold a mixture first.', 'Selecione um vidro que possa reter a mistura.')) + '</div>');
            }
            return;
          }
          if (t.getAttribute('data-lab-zoom')) {
            autoCam = false;
            zoom = t.getAttribute('data-lab-zoom') === 'in' ? Math.min(ZOOM_MAX, zoom + 0.1) : Math.max(ZOOM_MIN, zoom - 0.1);
            applyWorld();
            queueSave();
            return;
          }
          if (t.hasAttribute('data-lab-fit')) {
            autoCam = true;
            if (!fitView()) {
              panX = 24;
              panY = 24;
              zoom = 1;
              applyWorld();
            }
            queueSave();
            return;
          }
          if (t.hasAttribute('data-lab-aspirate')) {
            pipetteFrom = '';
            flashStatus('<div class="lab-msg" role="status">' + esc(copy('Click a vessel that holds liquid to aspirate.', 'Clique em um vidro com líquido para aspirar.')) + '</div>');
            return;
          }
          if (t.hasAttribute('data-lab-dispense')) {
            var pip = selected();
            if (!pip || (Number(pip.volumeMl) || 0) <= 0) {
              flashStatus('<div class="lab-msg" role="status">' + esc(copy('Aspirate first.', 'Aspire primeiro.')) + '</div>');
              return;
            }
            pipetteFrom = pip.id;
            updateLive();
            return;
          }
          if (t.hasAttribute('data-lab-drop')) {
            var bur = selected();
            if (!bur || !hasCap(bur, 'dispense_controlled')) return;
            if ((Number(bur.volumeMl) || 0) <= 0) {
              flashStatus('<div class="lab-msg" role="status">' + esc(copy('Fill the burette first.', 'Encha a bureta primeiro.')) + '</div>');
              return;
            }
            dropFrom = bur.id;
            flashStatus('<div class="lab-msg" role="status">' + esc(copy('Click a vessel to drop 1 mL.', 'Clique em um vidro para pingar 1 mL.')) + '</div>');
            updateLive();
            return;
          }
          if (t.hasAttribute('data-lab-distill') || t.hasAttribute('data-step-distill')) {
            runDistill(t.hasAttribute('data-step-distill'));
            return;
          }
          if (t.hasAttribute('data-lab-grind')) {
            var ground = grind(session, selected().id);
            queueSave();
            updateLive();
            if (!ground.ok) flashStatus('<div class="lab-msg" role="status">' + esc(copy('Add an approved solid to the mortar first.', 'Adicione um sólido permitido ao almofariz.')) + '</div>');
            return;
          }
          if (t.hasAttribute('data-lab-drain')) {
            var drainTo = (session.containers || []).filter(function (row) { return row.id !== selected().id && canHold(row) && hasCap(row, 'contain'); })[0];
            if (!drainTo) {
              flashStatus('<div class="lab-msg" role="status">' + esc(copy('Add a receiving vessel first.', 'Adicione um vidro receptor primeiro.')) + '</div>');
              return;
            }
            var drainColor = mixColor(selected());
            var drainFrom = selected().id;
            var drained = drainBottom(session, selected().id, drainTo.id);
            queueSave();
            updateLive();
            if (!drained.ok) flashStatus('<div class="lab-msg" role="status">' + esc(copy('Only modeled two-phase mixtures can drain.', 'Só misturas bifásicas modeladas podem ser drenadas.')) + '</div>');
            else playTransferFx(drainFrom, drainTo.id, drainColor, 'pour');
            return;
          }
          if (t.hasAttribute('data-lab-connect')) {
            connectFrom = connectFrom ? '' : selected().id;
            updateLive();
            return;
          }
          if (t.hasAttribute('data-lab-duplicate')) {
            duplicateObject(session, selected().id);
            queueSave();
            updateLive();
            return;
          }
          if (t.hasAttribute('data-lab-delete')) {
            removeObject(session, selected().id);
            queueSave();
            updateLive();
            return;
          }
          if (t.getAttribute('data-lab-rotate')) {
            ensureBoard(session);
            var obj = findObject(session, selected().id);
            if (obj) {
              pushHistory(session);
              obj.rotation = (Number(obj.rotation) || 0) + Number(t.getAttribute('data-lab-rotate'));
              syncVisual(session, obj.id);
              queueSave();
              updateLive();
            }
            return;
          }
          if (t.hasAttribute('data-lab-pour')) {
            pourFrom = pourFrom ? '' : selected().id;
            updateLive();
            return;
          }
          if (t.hasAttribute('data-lab-stir')) {
            playSound('stir');
            var stirred = selected();
            mixContainer(stirred);
            session.stirred = true;
            observe(session, copy('Stirred the selected vessel.', 'Agitou o vidro selecionado.'));
            queueSave();
            updateLive();
            animateFill(node.querySelector('[data-vessel="' + stirred.id + '"]'), 'is-stirring', 540);
            return;
          }
          if (t.hasAttribute('data-lab-empty')) {
            emptyContainer(session, selected().id);
            pourFrom = '';
            queueSave();
            updateLive();
            flashStatus('');
            return;
          }
          if (t.hasAttribute('data-lab-undo')) {
            if (!undoSession(session).ok) return;
            playSound('undo');
            observe(session, copy('Undid the last change.', 'Desfez a última alteração.'));
            queueSave();
            updateLive();
            return;
          }
          if (t.hasAttribute('data-lab-redo')) {
            if (!redoSession(session).ok) return;
            playSound('undo');
            observe(session, copy('Redid the last change.', 'Refez a última alteração.'));
            queueSave();
            updateLive();
            return;
          }
          if (t.hasAttribute('data-lab-reset')) {
            var keep = { id: session.id, title: session.title, mode: session.mode, creationId: session.creationId, createdAt: session.createdAt, lang: lang };
            session = emptySession(keep);
            session.id = keep.id;
            session.createdAt = keep.createdAt;
            observe(session, copy('Bench reset.', 'Bancada reiniciada.'));
            pourFrom = '';
            heatFrom = '';
            panX = 0;
            panY = 0;
            zoom = 1;
            flushSave();
            updateLive();
            flashStatus('');
            return;
          }
          if (t.hasAttribute('data-lab-save')) {
            observe(session, copy('Session saved on this device.', 'Sessão salva neste dispositivo.'));
            flushSave();
            updateLive();
          }
        } catch (err) {
          try { if (typeof console !== 'undefined' && console.debug) console.debug('[atomurus-lab] click', err); } catch (e) {}
        }
      }, opts);

      var stage = rootEl.querySelector('[data-lab-stage]');
      if (stage) {
        stage.addEventListener('pointerdown', function (event) {
          if (event.button === 1 || spaceDown) {
            panning = true;
            panStart = { x: event.clientX, y: event.clientY, panX: panX, panY: panY };
            dragMoved = false;
            try { stage.setPointerCapture(event.pointerId); } catch (e0) {}
            event.preventDefault();
            return;
          }
          if (event.button != null && event.button !== 0) return;
          var piece = event.target.closest && event.target.closest('[data-vessel]');
          if (piece) {
            var id = piece.getAttribute('data-vessel');
            ensureBoard(session);
            var obj = findObject(session, id);
            var vessel = findContainer(session, id);
            if (!vessel) return;
            dragging = {
              id: id,
              startX: event.clientX,
              startY: event.clientY,
              origX: obj ? Number(obj.x) : Number(vessel.x) || 0,
              origY: obj ? Number(obj.y) : Number(vessel.y) || 0
            };
            dragMoved = false;
            try { piece.setPointerCapture(event.pointerId); } catch (e) {}
            return;
          }
          panning = true;
          panStart = { x: event.clientX, y: event.clientY, panX: panX, panY: panY };
          dragMoved = false;
          try { stage.setPointerCapture(event.pointerId); } catch (e2) {}
        }, opts);
        stage.addEventListener('pointermove', function (event) {
          if (dragging) {
            var dx = (event.clientX - dragging.startX) / zoom;
            var dy = (event.clientY - dragging.startY) / zoom;
            if (Math.abs(event.clientX - dragging.startX) > 4 || Math.abs(event.clientY - dragging.startY) > 4) {
              dragMoved = true;
            }
            var obj = findObject(session, dragging.id);
            var moving = findContainer(session, dragging.id);
            var nx = Math.round(dragging.origX + dx);
            var ny = Math.round(dragging.origY + dy);
            if (obj) { obj.x = nx; obj.y = ny; }
            if (moving) { moving.x = nx; moving.y = ny; }
            var el = node.querySelector('[data-lab-world] [data-vessel="' + dragging.id + '"]');
            if (el) {
              el.style.left = nx + 'px';
              el.style.top = ny + 'px';
            }
            return;
          }
          if (panning && panStart) {
            panX = panStart.panX + (event.clientX - panStart.x);
            panY = panStart.panY + (event.clientY - panStart.y);
            applyWorld();
          }
        }, opts);
        function slosh(id) {
          animateFill(node.querySelector('[data-vessel="' + id + '"]'), 'is-sloshing', 660);
        }
        function endPointer() {
          var movedId = dragging && dragMoved ? dragging.id : '';
          if (dragging && dragMoved) {
            ignoreClickUntil = Date.now() + 280;
            var obj = findObject(session, dragging.id);
            var vessel = findContainer(session, dragging.id);
            var heater = heatZoneFor(session, dragging.id);
            if (obj && heater && vessel && hasCap(vessel, 'heat')) {
              obj.x = Number(heater.x);
              obj.y = Number(heater.y) - HEAT_OFFSET;
              syncVisual(session, dragging.id);
            }
            queueSave();
          } else if (panning && panStart) {
            var moved = Math.abs(panX - panStart.panX) > 4 || Math.abs(panY - panStart.panY) > 4;
            if (moved) {
              autoCam = false;
              ignoreClickUntil = Date.now() + 280;
              queueSave();
            }
          }
          dragging = null;
          dragMoved = false;
          panning = false;
          panStart = null;
          if (movedId) {
            slosh(movedId);
            updateLive();
          }
        }
        stage.addEventListener('pointerup', endPointer, opts);
        stage.addEventListener('pointercancel', endPointer, opts);
        stage.addEventListener('wheel', function (event) {
          event.preventDefault();
          var rect = stage.getBoundingClientRect();
          var mx = event.clientX - rect.left;
          var my = event.clientY - rect.top;
          var wx = (mx - panX) / zoom;
          var wy = (my - panY) / zoom;
          autoCam = false;
          var next = zoom + (event.deltaY > 0 ? -0.08 : 0.08);
          zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
          panX = mx - wx * zoom;
          panY = my - wy * zoom;
          applyWorld();
          queueSave();
        }, Object.assign({ passive: false }, opts));
      }

      function keyTarget(event) {
        return event.target && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName);
      }
      rootEl.addEventListener('keydown', function (event) {
        if (keyTarget(event)) return;
        if (event.key === 'Escape' && dockOpen) {
          dockOpen = '';
          syncDock();
          return;
        }
        if (event.code === 'Space') { spaceDown = true; event.preventDefault(); return; }
        if ((event.metaKey || event.ctrlKey) && String(event.key).toLowerCase() === 'z') {
          event.preventDefault();
          if (event.shiftKey) redoSession(session);
          else undoSession(session);
          queueSave();
          updateLive();
          return;
        }
        if ((event.metaKey || event.ctrlKey) && String(event.key).toLowerCase() === 'd') {
          event.preventDefault();
          duplicateObject(session, selected().id);
          queueSave();
          updateLive();
          return;
        }
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault();
          removeObject(session, selected().id);
          queueSave();
          updateLive();
          return;
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          event.preventDefault();
          ensureBoard(session);
          var obj = findObject(session, selected().id);
          if (!obj) return;
          var step = event.shiftKey ? 24 : 8;
          if (event.key === 'ArrowLeft') obj.x -= step;
          if (event.key === 'ArrowRight') obj.x += step;
          if (event.key === 'ArrowUp') obj.y -= step;
          if (event.key === 'ArrowDown') obj.y += step;
          syncVisual(session, obj.id);
          queueSave();
          updateLive();
        }
      }, opts);
      rootEl.addEventListener('keyup', function (event) {
        if (event.code === 'Space') spaceDown = false;
      }, opts);
    }

    paint();
    autoCam = !panX && !panY && zoom === 1;
    if (autoCam) fitView();
    if (typeof ResizeObserver === 'function') {
      var stageEl = node.querySelector('[data-lab-stage]');
      if (stageEl) {
        var observer = new ResizeObserver(function () {
          if (autoCam) fitView();
        });
        observer.observe(stageEl);
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('pagehide', flushSave, { once: true });
    }
    return session;
  }

  root.AtomurusLab = {
    SUBSTANCES: SUBSTANCES,
    CREATIONS: CREATIONS,
    EQUIPMENT: EQUIPMENT,
    READY: READY,
    PROCESSES: PROCESSES,
    REACTIONS: REACTIONS,
    reactionFor: reactionFor,
    distill: distill,
    distillSetup: distillSetup,
    assembleRig: assembleRig,
    firstOfType: firstOfType,
    maxTemperatureFor: maxTemperatureFor,
    volatileParts: volatileParts,
    SCHEMA_VERSION: SCHEMA_VERSION,
    resolveQuery: resolveQuery,
    searchCatalog: searchCatalog,
    emptySession: emptySession,
    listSessions: listSessions,
    saveSession: saveSession,
    addToContainer: addToContainer,
    addVessel: addVessel,
    addReady: addReady,
    emptyContainer: emptyContainer,
    identifyProduct: identifyProduct,
    visualFillPct: visualFillPct,
    tutorialState: tutorialState,
    VESSEL_ART: VESSEL_ART,
    vesselArt: vesselArt,
    vesselSvg: vesselSvg,
    fillGeometry: fillGeometry,
    stepPlan: stepPlan,
    SOUNDS: SOUNDS,
    SOUND_KEY: SOUND_KEY,
    soundEnabled: soundEnabled,
    setSoundEnabled: setSoundEnabled,
    playSound: playSound,
    canHold: canHold,
    hasCap: hasCap,
    ensureBoard: ensureBoard,
    aspirate: aspirate,
    dispense: dispense,
    drop: drop,
    grind: grind,
    drainBottom: drainBottom,
    connectPorts: connectPorts,
    duplicateObject: duplicateObject,
    removeObject: removeObject,
    undoSession: undoSession,
    redoSession: redoSession,
    pour: pour,
    setTemperature: setTemperature,
    measure: measure,
    mount: mount
  };

  if (typeof module === 'object' && module.exports) module.exports = root.AtomurusLab;
})(typeof window !== 'undefined' ? window : globalThis);
