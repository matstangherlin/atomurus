/* ─────────────────────────────────────────────────────────────
 * Atomurus — Element Applications dataset (for the Compare module)
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE
 *   Curated real-world uses per element, split into four sectors so the
 *   Compare page can show them side-by-side. Rendered by
 *   renderCompareApplications() (periodic-table.js).
 *
 * NO RUNTIME AI
 *   Hand-written, human-reviewed, bilingual (EN/PT). Derived from the vetted
 *   `applications` paragraphs in elements-content.js + standard chemistry.
 *   Elements without an entry simply show nothing ("when available").
 *
 * SCHEMA  (indexed by atomic number Z)
 *   Z: { industrial: [ {en,pt} ], technological: [...], biological: [...], laboratory: [...] }
 *   Only categories that genuinely apply are included (no empty buckets, no
 *   invented uses — e.g. Al/Ce/Pb/U omit "biological").
 *
 * Coverage is a curated subset (common comparison elements). Extend by adding
 * a Z entry; the comparison appears whenever at least one selected element has
 * data, and each category row shows only where data exists.
 * ─────────────────────────────────────────────────────────── */
(function (root) {
  'use strict';

  const APPS = {

    // H — Hydrogen
    1: {
      industrial: [
        { en: 'Ammonia synthesis (Haber–Bosch) for fertilizers', pt: 'Síntese de amônia (Haber-Bosch) para fertilizantes' },
        { en: 'Petroleum refining (hydrocracking)', pt: 'Refino de petróleo (hidrocraqueamento)' },
        { en: 'Hydrogenation of oils', pt: 'Hidrogenação de óleos' }
      ],
      technological: [
        { en: 'Hydrogen fuel cells', pt: 'Células a combustível de hidrogênio' },
        { en: 'Liquid-hydrogen rocket fuel', pt: 'Combustível de foguetes (H₂ líquido)' }
      ],
      biological: [
        { en: 'Component of water and every organic molecule', pt: 'Componente da água e de toda molécula orgânica' }
      ],
      laboratory: [
        { en: 'Reducing agent', pt: 'Agente redutor' },
        { en: 'Carrier gas in chromatography', pt: 'Gás de arraste em cromatografia' }
      ]
    },

    // He — Helium
    2: {
      industrial: [
        { en: 'Leak detection', pt: 'Detecção de vazamentos' },
        { en: 'Inert shielding gas for welding', pt: 'Gás inerte de proteção para soldagem' }
      ],
      technological: [
        { en: 'Cooling superconducting magnets (MRI)', pt: 'Resfriamento de ímãs supercondutores (RM)' },
        { en: 'Pressurizing rocket propellant', pt: 'Pressurização de propelente de foguetes' }
      ],
      biological: [
        { en: 'Deep-diving breathing mixes (Trimix)', pt: 'Misturas respiratórias para mergulho (Trimix)' }
      ],
      laboratory: [
        { en: 'Ultra-low-temperature cryogenics', pt: 'Criogenia de temperaturas ultrabaixas' }
      ]
    },

    // Li — Lithium
    3: {
      industrial: [
        { en: 'Heat-resistant ceramics & glass', pt: 'Cerâmicas e vidros resistentes ao calor' },
        { en: 'Lubricating greases', pt: 'Graxas lubrificantes' }
      ],
      technological: [
        { en: 'Lithium-ion batteries', pt: 'Baterias de íon-lítio' },
        { en: 'Aluminium–lithium aerospace alloys', pt: 'Ligas alumínio-lítio (aeroespacial)' }
      ],
      biological: [
        { en: 'Mood-stabilizer medication (bipolar disorder)', pt: 'Medicamento estabilizador de humor (transtorno bipolar)' }
      ],
      laboratory: [
        { en: 'Strong-base reagents (n-BuLi)', pt: 'Reagentes de base forte (n-BuLi)' }
      ]
    },

    // C — Carbon
    6: {
      industrial: [
        { en: 'Steelmaking (coke)', pt: 'Siderurgia (coque)' },
        { en: 'Plastics & polymers', pt: 'Plásticos e polímeros' },
        { en: 'Tyres (carbon black)', pt: 'Pneus (negro de fumo)' }
      ],
      technological: [
        { en: 'Carbon fiber & graphene', pt: 'Fibra de carbono e grafeno' },
        { en: 'Battery electrodes (graphite)', pt: 'Eletrodos de bateria (grafite)' }
      ],
      biological: [
        { en: 'Structural backbone of all life', pt: 'Esqueleto estrutural de toda a vida' }
      ],
      laboratory: [
        { en: 'Activated carbon (filtration)', pt: 'Carvão ativado (filtração)' },
        { en: 'Radiocarbon dating', pt: 'Datação por radiocarbono' }
      ]
    },

    // N — Nitrogen
    7: {
      industrial: [
        { en: 'Ammonia & fertilizers', pt: 'Amônia e fertilizantes' },
        { en: 'Nitric acid & explosives', pt: 'Ácido nítrico e explosivos' }
      ],
      technological: [
        { en: 'Inert atmosphere for electronics manufacturing', pt: 'Atmosfera inerte na fabricação de eletrônicos' }
      ],
      biological: [
        { en: 'Amino acids, proteins and DNA', pt: 'Aminoácidos, proteínas e DNA' }
      ],
      laboratory: [
        { en: 'Liquid nitrogen (cryogenics)', pt: 'Nitrogênio líquido (criogenia)' },
        { en: 'Inert blanket gas', pt: 'Gás de cobertura inerte' }
      ]
    },

    // O — Oxygen
    8: {
      industrial: [
        { en: 'Steelmaking & metal cutting', pt: 'Siderurgia e corte de metais' },
        { en: 'Chemical oxidation processes', pt: 'Processos de oxidação química' }
      ],
      technological: [
        { en: 'Rocket oxidizer (LOX)', pt: 'Oxidante de foguetes (LOX)' }
      ],
      biological: [
        { en: 'Cellular respiration', pt: 'Respiração celular' },
        { en: 'Medical oxygen therapy', pt: 'Oxigenoterapia médica' }
      ],
      laboratory: [
        { en: 'Oxidizing agent', pt: 'Agente oxidante' },
        { en: 'Combustion analysis', pt: 'Análise por combustão' }
      ]
    },

    // Na — Sodium
    11: {
      industrial: [
        { en: 'Chlor-alkali process (NaOH, Cl₂)', pt: 'Processo cloro-álcalis (NaOH, Cl₂)' },
        { en: 'Glass and soap', pt: 'Vidro e sabão' },
        { en: 'Road de-icing (NaCl)', pt: 'Degelo de estradas (NaCl)' }
      ],
      technological: [
        { en: 'Sodium-vapor street lamps', pt: 'Lâmpadas de vapor de sódio' },
        { en: 'Coolant in some fast reactors', pt: 'Refrigerante em alguns reatores rápidos' }
      ],
      biological: [
        { en: 'Nerve impulses & fluid balance', pt: 'Impulsos nervosos e equilíbrio de fluidos' }
      ],
      laboratory: [
        { en: 'Drying / reducing reagent', pt: 'Reagente secante / redutor' }
      ]
    },

    // Al — Aluminium  (not biologically essential → no "biological")
    13: {
      industrial: [
        { en: 'Aircraft, cans & construction', pt: 'Aeronaves, latas e construção' },
        { en: 'Power transmission lines', pt: 'Linhas de transmissão de energia' }
      ],
      technological: [
        { en: 'Heat sinks & electronics casings', pt: 'Dissipadores e carcaças eletrônicas' },
        { en: 'Reflective coatings', pt: 'Revestimentos refletivos' }
      ],
      laboratory: [
        { en: 'Thermite & reducing agent', pt: 'Termite e agente redutor' },
        { en: 'Catalyst support (alumina)', pt: 'Suporte de catalisador (alumina)' }
      ]
    },

    // Si — Silicon
    14: {
      industrial: [
        { en: 'Glass and concrete', pt: 'Vidro e concreto' },
        { en: 'Silicone polymers', pt: 'Polímeros de silicone' }
      ],
      technological: [
        { en: 'Semiconductor chips', pt: 'Chips semicondutores' },
        { en: 'Solar photovoltaic cells', pt: 'Células solares fotovoltaicas' }
      ],
      biological: [
        { en: 'Structural role in plants & diatoms', pt: 'Papel estrutural em plantas e diatomáceas' }
      ],
      laboratory: [
        { en: 'Silica gel (chromatography, desiccant)', pt: 'Sílica-gel (cromatografia, dessecante)' }
      ]
    },

    // S — Sulfur
    16: {
      industrial: [
        { en: 'Sulfuric acid (top industrial chemical)', pt: 'Ácido sulfúrico (principal insumo industrial)' },
        { en: 'Rubber vulcanization', pt: 'Vulcanização da borracha' },
        { en: 'Fertilizers', pt: 'Fertilizantes' }
      ],
      technological: [
        { en: 'Lithium–sulfur batteries (emerging)', pt: 'Baterias de lítio-enxofre (emergente)' }
      ],
      biological: [
        { en: 'Amino acids (cysteine, methionine)', pt: 'Aminoácidos (cisteína, metionina)' }
      ],
      laboratory: [
        { en: 'Reagent in synthesis', pt: 'Reagente em síntese' }
      ]
    },

    // Cl — Chlorine
    17: {
      industrial: [
        { en: 'Water disinfection', pt: 'Desinfecção de água' },
        { en: 'PVC plastics', pt: 'Plásticos PVC' },
        { en: 'Bleach and solvents', pt: 'Alvejantes e solventes' }
      ],
      biological: [
        { en: 'Stomach acid (HCl); electrolyte balance', pt: 'Ácido estomacal (HCl); equilíbrio eletrolítico' }
      ],
      laboratory: [
        { en: 'Oxidizing / chlorinating reagent', pt: 'Reagente oxidante / clorante' }
      ]
    },

    // Ca — Calcium
    20: {
      industrial: [
        { en: 'Cement, lime and plaster', pt: 'Cimento, cal e gesso' },
        { en: 'Steel deoxidizer', pt: 'Desoxidante de aço' }
      ],
      biological: [
        { en: 'Bones & teeth; muscle/nerve signaling', pt: 'Ossos e dentes; sinalização muscular/nervosa' }
      ],
      laboratory: [
        { en: 'Drying agent (CaCl₂)', pt: 'Agente secante (CaCl₂)' },
        { en: 'Reducing agent', pt: 'Agente redutor' }
      ]
    },

    // Fe — Iron
    26: {
      industrial: [
        { en: 'Steel and construction', pt: 'Aço e construção' },
        { en: 'Cast iron', pt: 'Ferro fundido' },
        { en: 'Ammonia catalyst (Haber)', pt: 'Catalisador da amônia (Haber)' }
      ],
      technological: [
        { en: 'Magnets & transformer cores', pt: 'Ímãs e núcleos de transformadores' }
      ],
      biological: [
        { en: 'Hemoglobin (oxygen transport)', pt: 'Hemoglobina (transporte de oxigênio)' }
      ],
      laboratory: [
        { en: 'Redox titrations (Fe²⁺/Fe³⁺)', pt: 'Titulações redox (Fe²⁺/Fe³⁺)' }
      ]
    },

    // Cu — Copper
    29: {
      industrial: [
        { en: 'Electrical wiring & plumbing', pt: 'Fiação elétrica e encanamentos' },
        { en: 'Alloys (brass, bronze)', pt: 'Ligas (latão, bronze)' }
      ],
      technological: [
        { en: 'PCB traces & electric motors', pt: 'Trilhas de PCB e motores elétricos' },
        { en: 'Heat exchangers', pt: 'Trocadores de calor' }
      ],
      biological: [
        { en: 'Essential enzyme cofactor; antimicrobial surfaces', pt: 'Cofator enzimático essencial; superfícies antimicrobianas' }
      ],
      laboratory: [
        { en: 'Electrodes & catalysts', pt: 'Eletrodos e catalisadores' }
      ]
    },

    // Se — Selenium
    34: {
      industrial: [
        { en: 'Red / decolorized glass', pt: 'Vidro vermelho / descolorido' },
        { en: 'Photocopier drums (xerography)', pt: 'Cilindros de fotocopiadoras (xerografia)' },
        { en: 'Rubber vulcanization', pt: 'Vulcanização de borracha' }
      ],
      technological: [
        { en: 'Photocells & photoconductors', pt: 'Fotocélulas e fotocondutores' },
        { en: 'Semiconductor rectifiers', pt: 'Retificadores semicondutores' }
      ],
      biological: [
        { en: 'Essential trace element (antioxidant enzymes)', pt: 'Oligoelemento essencial (enzimas antioxidantes)' },
        { en: 'Dietary supplement', pt: 'Suplemento alimentar' }
      ],
      laboratory: [
        { en: 'Catalyst / reagent in organic synthesis', pt: 'Catalisador / reagente em síntese orgânica' }
      ]
    },

    // Ag — Silver
    47: {
      industrial: [
        { en: 'Mirrors & brazing alloys', pt: 'Espelhos e ligas de brasagem' },
        { en: 'Photographic film (historic)', pt: 'Filme fotográfico (histórico)' }
      ],
      technological: [
        { en: 'Best conductor — contacts & PCBs', pt: 'Melhor condutor — contatos e PCBs' },
        { en: 'Solar-cell contacts', pt: 'Contatos de células solares' }
      ],
      biological: [
        { en: 'Antimicrobial wound dressings', pt: 'Curativos antimicrobianos' }
      ],
      laboratory: [
        { en: 'AgNO₃ reagent; reference electrodes', pt: 'Reagente AgNO₃; eletrodos de referência' }
      ]
    },

    // I — Iodine
    53: {
      industrial: [
        { en: 'Disinfectants & antiseptics', pt: 'Desinfetantes e antissépticos' },
        { en: 'Dyes & catalysts', pt: 'Corantes e catalisadores' }
      ],
      technological: [
        { en: 'LCD polarizing films', pt: 'Filmes polarizadores de LCD' }
      ],
      biological: [
        { en: 'Thyroid hormones; iodized salt', pt: 'Hormônios da tireoide; sal iodado' },
        { en: 'Medical imaging & therapy (¹²³I/¹³¹I)', pt: 'Imagem e terapia médica (¹²³I/¹³¹I)' }
      ],
      laboratory: [
        { en: 'Iodometric titrations', pt: 'Titulações iodométricas' }
      ]
    },

    // Ce — Cerium  (not biologically essential → no "biological")
    58: {
      industrial: [
        { en: 'Catalytic converters (CeO₂)', pt: 'Conversores catalíticos (CeO₂)' },
        { en: 'Glass-polishing powder', pt: 'Pó de polimento de vidro' },
        { en: 'Petroleum cracking catalyst', pt: 'Catalisador de craqueamento de petróleo' }
      ],
      technological: [
        { en: 'Phosphors for displays / LEDs', pt: 'Fósforos para telas / LEDs' },
        { en: 'UV-absorbing glass', pt: 'Vidro que absorve UV' }
      ],
      laboratory: [
        { en: 'Oxidizer (ceric ammonium nitrate)', pt: 'Oxidante (nitrato cérico amoniacal)' },
        { en: 'Redox titrations (cerimetry)', pt: 'Titulações redox (cerimetria)' }
      ]
    },

    // Au — Gold
    79: {
      industrial: [
        { en: 'Jewelry & gilding', pt: 'Joalheria e douração' },
        { en: 'Corrosion-proof coatings', pt: 'Revestimentos anticorrosão' }
      ],
      technological: [
        { en: 'Connector plating in electronics', pt: 'Banho de conectores eletrônicos' },
        { en: 'Bonding wires in microchips', pt: 'Fios de conexão em microchips' }
      ],
      biological: [
        { en: 'Some anti-arthritis medicines', pt: 'Alguns medicamentos antiartrite' }
      ],
      laboratory: [
        { en: 'Inert electrodes; nanoparticle catalysts', pt: 'Eletrodos inertes; catalisadores de nanopartículas' }
      ]
    },

    // Pb — Lead  (toxic → no "biological")
    82: {
      industrial: [
        { en: 'Lead-acid batteries', pt: 'Baterias chumbo-ácido' },
        { en: 'Radiation shielding', pt: 'Blindagem contra radiação' },
        { en: 'Solders & weights', pt: 'Soldas e contrapesos' }
      ],
      laboratory: [
        { en: 'Shielding for radioactive sources', pt: 'Blindagem de fontes radioativas' }
      ]
    },

    // U — Uranium  (radiotoxic → no "biological")
    92: {
      industrial: [
        { en: 'Nuclear reactor fuel', pt: 'Combustível de reatores nucleares' },
        { en: 'Depleted-uranium shielding & ballast', pt: 'Blindagem e lastro de urânio empobrecido' }
      ],
      laboratory: [
        { en: 'Uranium–lead geological dating', pt: 'Datação geológica urânio-chumbo' }
      ]
    }

  };

  root.ELEMENT_APPLICATIONS = APPS;

})(typeof window !== 'undefined' ? window : this);
