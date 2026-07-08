/* ─────────────────────────────────────────────────────────────
 * Atomurus — Isotope Applications dataset (curated real-world uses)
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE
 *   Shows WHY isotopes matter: the real, scientifically accurate uses of
 *   specific isotopes, grouped by sector. Rendered by
 *   renderIsotopeApplications() below the Isotope Insight panel.
 *
 * NO RUNTIME AI
 *   Every entry is hand-written and human-reviewed. The app never generates
 *   application text at runtime. Elements / isotopes without a curated entry
 *   simply show nothing (the whole section hides) — we never invent a use.
 *   Only genuine, documented uses are listed (no misuse / poisons).
 *
 * SCHEMA  (indexed by atomic number Z)
 *   Z: [ { a, m?, apps: [ { cat, en, pt } ] } ]
 *     a    — mass number (notation built as A over Z + symbol; alias, if any,
 *            is pulled from the ISOTOPES dataset so it stays in sync)
 *     m    — true for a metastable isomer (Tc-99m)
 *     apps — list of uses, each tagged with ONE sector category:
 *       cat ∈ 'industrial' | 'medical' | 'scientific' | 'energy' | 'nuclear'
 *       en / pt — short label in each language
 *
 * CATEGORY GUIDE
 *   industrial — manufacturing, gauges, sterilisation, radiography, devices
 *   medical    — diagnosis, imaging, therapy
 *   scientific — research: tracing, dating, spectroscopy, metrology
 *   energy     — power generation: fission fuel, fusion, RTGs, fuel cells
 *   nuclear    — reactor cores, moderation/control, breeding, weapons
 *
 * ─────────────────────────────────────────────────────────── */
(function (root) {
  'use strict';

  const APPS = {

    // ───── H — Hydrogen ─────
    1: [
      { a: 1, apps: [
        { cat: 'industrial', en: 'Water and hydrocarbons',            pt: 'Água e hidrocarbonetos' },
        { cat: 'industrial', en: 'Feedstock for organic chemistry',   pt: 'Insumo da química orgânica' },
        { cat: 'energy',     en: 'Hydrogen fuel and fuel cells',       pt: 'Combustível de hidrogênio e células a combustível' }
      ]},
      { a: 2, apps: [
        { cat: 'nuclear',    en: 'Heavy-water reactor moderator',      pt: 'Moderador de reatores a água pesada' },
        { cat: 'scientific', en: 'NMR spectroscopy solvent',           pt: 'Solvente para espectroscopia de RMN' },
        { cat: 'scientific', en: 'Isotopic labelling and deuterated drugs', pt: 'Marcação isotópica e fármacos deuterados' }
      ]},
      { a: 3, apps: [
        { cat: 'energy',     en: 'Fusion fuel research',               pt: 'Pesquisa de combustível de fusão' },
        { cat: 'industrial', en: 'Self-powered illumination (signs, watches)', pt: 'Iluminação autoalimentada (placas, relógios)' },
        { cat: 'scientific', en: 'Hydrological and biological tracer', pt: 'Traçador hidrológico e biológico' }
      ]}
    ],

    // ───── He — Helium ─────
    2: [
      { a: 3, apps: [
        { cat: 'scientific', en: 'Ultra-low-temperature cryogenics',  pt: 'Criogenia de temperaturas ultrabaixas' },
        { cat: 'scientific', en: 'Neutron detectors',                 pt: 'Detectores de nêutrons' },
        { cat: 'energy',     en: 'Candidate fusion fuel',             pt: 'Possível combustível de fusão' }
      ]},
      { a: 4, apps: [
        { cat: 'industrial', en: 'Liquid-helium cooling (MRI magnets)', pt: 'Resfriamento com hélio líquido (ímãs de RM)' },
        { cat: 'industrial', en: 'Leak detection',                    pt: 'Detecção de vazamentos' },
        { cat: 'industrial', en: 'Inert shielding gas for welding',   pt: 'Gás inerte de proteção para soldagem' }
      ]}
    ],

    // ───── Li — Lithium ─────
    3: [
      { a: 6, apps: [
        { cat: 'energy',     en: 'Tritium breeding for fusion',       pt: 'Geração de trítio para fusão' },
        { cat: 'scientific', en: 'Neutron detection and shielding',   pt: 'Detecção e blindagem de nêutrons' }
      ]},
      { a: 7, apps: [
        { cat: 'nuclear',    en: 'Reactor coolant pH control',        pt: 'Controle de pH da água de reatores' }
      ]}
    ],

    // ───── B — Boron ─────
    5: [
      { a: 10, apps: [
        { cat: 'nuclear',    en: 'Reactor control rods',              pt: 'Barras de controle de reatores' },
        { cat: 'medical',    en: 'Boron neutron-capture therapy (BNCT)', pt: 'Terapia por captura de nêutrons (BNCT)' },
        { cat: 'industrial', en: 'Neutron shielding',                 pt: 'Blindagem de nêutrons' }
      ]}
    ],

    // ───── C — Carbon ─────
    6: [
      { a: 13, apps: [
        { cat: 'scientific', en: '¹³C-NMR of organic molecules',      pt: 'RMN de ¹³C de moléculas orgânicas' },
        { cat: 'medical',    en: '¹³C-urea breath test (H. pylori)',  pt: 'Teste respiratório de ¹³C-ureia (H. pylori)' }
      ]},
      { a: 14, apps: [
        { cat: 'scientific', en: 'Radiocarbon dating',                pt: 'Datação por radiocarbono' },
        { cat: 'scientific', en: 'Biochemical tracer',                pt: 'Traçador bioquímico' }
      ]}
    ],

    // ───── N — Nitrogen ─────
    7: [
      { a: 15, apps: [
        { cat: 'scientific', en: 'Non-radioactive tracer (agriculture, biology)', pt: 'Traçador não radioativo (agricultura, biologia)' },
        { cat: 'scientific', en: 'Protein NMR labelling',             pt: 'Marcação de proteínas para RMN' }
      ]}
    ],

    // ───── O — Oxygen ─────
    8: [
      { a: 18, apps: [
        { cat: 'medical',    en: 'Source for ¹⁸F PET-tracer production', pt: 'Fonte para produção do traçador ¹⁸F (PET)' },
        { cat: 'scientific', en: 'Palaeoclimate and water tracing',   pt: 'Estudos de paleoclima e rastreamento de água' }
      ]}
    ],

    // ───── Na — Sodium ─────
    11: [
      { a: 22, apps: [
        { cat: 'scientific', en: 'Positron (PET) calibration source', pt: 'Fonte de calibração de pósitrons (PET)' },
        { cat: 'scientific', en: 'Laboratory gamma source',           pt: 'Fonte gama de laboratório' }
      ]}
    ],

    // ───── P — Phosphorus ─────
    15: [
      { a: 32, apps: [
        { cat: 'scientific', en: 'DNA/RNA radiolabelling',            pt: 'Radiomarcação de DNA/RNA' },
        { cat: 'medical',    en: 'Treatment of blood disorders',      pt: 'Tratamento de distúrbios sanguíneos' }
      ]}
    ],

    // ───── S — Sulfur ─────
    16: [
      { a: 35, apps: [
        { cat: 'scientific', en: 'Protein and nucleic-acid labelling', pt: 'Marcação de proteínas e ácidos nucleicos' }
      ]}
    ],

    // ───── Ca — Calcium ─────
    20: [
      { a: 44, apps: [
        { cat: 'medical',    en: 'Bone-metabolism tracer',            pt: 'Traçador do metabolismo ósseo' }
      ]},
      { a: 48, apps: [
        { cat: 'scientific', en: 'Beams for superheavy-element synthesis', pt: 'Feixes para síntese de elementos superpesados' }
      ]}
    ],

    // ───── Fe — Iron ─────
    26: [
      { a: 57, apps: [
        { cat: 'scientific', en: 'Mössbauer spectroscopy',            pt: 'Espectroscopia Mössbauer' }
      ]}
    ],

    // ───── Co — Cobalt ─────
    27: [
      { a: 60, apps: [
        { cat: 'medical',    en: 'Cancer radiotherapy (gamma knife)', pt: 'Radioterapia do câncer (gamma knife)' },
        { cat: 'industrial', en: 'Sterilisation of medical equipment', pt: 'Esterilização de equipamentos médicos' },
        { cat: 'industrial', en: 'Food irradiation',                  pt: 'Irradiação de alimentos' },
        { cat: 'industrial', en: 'Industrial radiography',            pt: 'Radiografia industrial' }
      ]}
    ],

    // ───── Sr — Strontium ─────
    38: [
      { a: 90, apps: [
        { cat: 'energy',     en: 'Radioisotope thermoelectric generators (RTGs)', pt: 'Geradores termoelétricos de radioisótopos (RTGs)' },
        { cat: 'medical',    en: 'Radiotherapy (eye and bone)',       pt: 'Radioterapia (olhos e ossos)' },
        { cat: 'industrial', en: 'Thickness gauges',                  pt: 'Medidores de espessura' }
      ]}
    ],

    // ───── Tc — Technetium ─────
    43: [
      { a: 99, m: true, apps: [
        { cat: 'medical',    en: 'SPECT medical imaging (most-used isotope)', pt: 'Imagem médica por SPECT (isótopo mais usado)' },
        { cat: 'medical',    en: 'Bone, heart and organ scans',       pt: 'Cintilografia de ossos, coração e órgãos' }
      ]}
    ],

    // ───── I — Iodine ─────
    53: [
      { a: 123, apps: [
        { cat: 'medical',    en: 'Thyroid imaging (SPECT)',           pt: 'Cintilografia da tireoide (SPECT)' }
      ]},
      { a: 131, apps: [
        { cat: 'medical',    en: 'Thyroid cancer therapy',            pt: 'Terapia do câncer de tireoide' },
        { cat: 'medical',    en: 'Thyroid-function imaging',          pt: 'Imagem da função tireoidiana' }
      ]}
    ],

    // ───── Cs — Caesium ─────
    55: [
      { a: 133, apps: [
        { cat: 'scientific', en: 'Atomic clocks (defines the second)', pt: 'Relógios atômicos (define o segundo)' }
      ]},
      { a: 137, apps: [
        { cat: 'industrial', en: 'Industrial density and level gauges', pt: 'Medidores industriais de densidade e nível' },
        { cat: 'medical',    en: 'Radiotherapy and blood irradiation', pt: 'Radioterapia e irradiação de sangue' }
      ]}
    ],

    // ───── U — Uranium ─────
    92: [
      { a: 235, apps: [
        { cat: 'energy',     en: 'Nuclear reactor fuel',              pt: 'Combustível de reatores nucleares' },
        { cat: 'nuclear',    en: 'Nuclear weapons',                   pt: 'Armas nucleares' }
      ]},
      { a: 238, apps: [
        { cat: 'nuclear',    en: 'Breeding plutonium-239',            pt: 'Geração de plutônio-239' },
        { cat: 'industrial', en: 'Depleted-uranium shielding and ballast', pt: 'Blindagem e lastro de urânio empobrecido' }
      ]}
    ],

    // ───── Pu — Plutonium ─────
    94: [
      { a: 238, apps: [
        { cat: 'energy',     en: 'RTG power for spacecraft',          pt: 'Energia (RTG) para sondas espaciais' }
      ]},
      { a: 239, apps: [
        { cat: 'energy',     en: 'Nuclear reactor fuel',              pt: 'Combustível de reatores nucleares' },
        { cat: 'nuclear',    en: 'Nuclear weapons',                   pt: 'Armas nucleares' }
      ]}
    ],

    // ───── Am — Americium ─────
    95: [
      { a: 241, apps: [
        { cat: 'industrial', en: 'Ionisation smoke detectors',        pt: 'Detectores de fumaça por ionização' },
        { cat: 'industrial', en: 'Density and thickness gauges',      pt: 'Medidores de densidade e espessura' }
      ]}
    ]

  };

  root.ISOTOPE_APPLICATIONS = APPS;

})(typeof window !== 'undefined' ? window : this);
