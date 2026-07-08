/* ─────────────────────────────────────────────────────────────
 * Atomurus — Isotope Insight System (curated explanations)
 * ─────────────────────────────────────────────────────────────
 *
 * PURPOSE
 *   Turns the raw isotope table into understandable science. For each
 *   covered element we provide a short, hand-written ("curated") explanation
 *   at high-school / introductory-university level, in EN and PT-BR.
 *
 * IMPORTANT — NO RUNTIME AI
 *   Every sentence here is written and reviewed by a human. The app never
 *   generates explanatory prose at runtime. Elements not covered here fall
 *   back to a deterministic, fact-only summary built from the dataset
 *   (counts, composition, abundance) — see buildFallbackInsight() in
 *   periodic-table.js. That fallback states facts only; it never invents
 *   uses or history.
 *
 * SCHEMA  (per element Z)
 *   { en: BLOCK, pt: BLOCK }
 *   BLOCK = {
 *     lead:  string   — one-sentence overview ("Hydrogen has three… isotopes.")
 *     items: [ { a, m?, name?, text } ]
 *       a    — mass number (matched against ISOTOPES[z] to derive the
 *              stable / radioactive / rare badges; single source of truth)
 *       m    — true for a metastable isomer (e.g. Tc-99m)
 *       name — optional common name (Protium, Deuterium…)
 *       text — composition + significance, ~2 short sentences
 *   }
 *
 * Composition is stated in words inside `text`; neutron count = A − Z.
 * Coverage is intentionally a curated subset (the isotopes a student meets):
 * the full table above still lists every isotope in the dataset.
 *
 * ─────────────────────────────────────────────────────────── */
(function (root) {
  'use strict';

  const INSIGHTS = {

    // ───── H — Hydrogen (Z=1) ─────
    1: {
      en: {
        lead: 'Hydrogen is the lightest element and the only one whose isotopes have their own names. Three are well known.',
        items: [
          { a: 1, name: 'Protium',   text: 'One proton and no neutrons — the simplest atom that exists. It accounts for about 99.98% of all natural hydrogen.' },
          { a: 2, name: 'Deuterium', text: 'One proton and one neutron. It forms "heavy water" (D₂O) and is widely used in nuclear reactors and in NMR spectroscopy.' },
          { a: 3, name: 'Tritium',   text: 'One proton and two neutrons, and it is radioactive (β⁻, about 12 years). Used in fusion research and as a self-powered luminous marker.' }
        ]
      },
      pt: {
        lead: 'O hidrogênio é o elemento mais leve e o único cujos isótopos têm nomes próprios. Três são bem conhecidos.',
        items: [
          { a: 1, name: 'Prótio',    text: 'Um próton e nenhum nêutron — o átomo mais simples que existe. Representa cerca de 99,98% de todo o hidrogênio natural.' },
          { a: 2, name: 'Deutério',  text: 'Um próton e um nêutron. Forma a "água pesada" (D₂O) e é muito usado em reatores nucleares e em espectroscopia de RMN.' },
          { a: 3, name: 'Trítio',    text: 'Um próton e dois nêutrons, e é radioativo (β⁻, cerca de 12 anos). Usado em pesquisa de fusão e como marcador luminoso autoalimentado.' }
        ]
      }
    },

    // ───── He — Helium (Z=2) ─────
    2: {
      en: {
        lead: 'Helium has two stable isotopes, but they could hardly differ more in how common they are.',
        items: [
          { a: 3, text: 'Two protons and one neutron. Extremely rare on Earth; prized for ultra-low-temperature cryogenics and studied as a possible fusion fuel.' },
          { a: 4, text: 'Two protons and two neutrons — an exceptionally stable "doubly magic" nucleus, identical to an alpha particle. It is virtually all the helium we use.' }
        ]
      },
      pt: {
        lead: 'O hélio tem dois isótopos estáveis, mas eles dificilmente poderiam ser mais diferentes em abundância.',
        items: [
          { a: 3, text: 'Dois prótons e um nêutron. Raríssimo na Terra; valorizado em criogenia de temperaturas ultrabaixas e estudado como possível combustível de fusão.' },
          { a: 4, text: 'Dois prótons e dois nêutrons — um núcleo "duplamente mágico" excepcionalmente estável, idêntico a uma partícula alfa. É praticamente todo o hélio que usamos.' }
        ]
      }
    },

    // ───── Li — Lithium (Z=3) ─────
    3: {
      en: {
        lead: 'Lithium has two stable isotopes, both important to nuclear technology.',
        items: [
          { a: 6, text: 'Three protons and three neutrons. Used to breed tritium for fusion and in some specialised batteries.' },
          { a: 7, text: 'Three protons and four neutrons — the dominant form, about 92% of natural lithium, used to control coolant chemistry in pressurised-water reactors.' }
        ]
      },
      pt: {
        lead: 'O lítio tem dois isótopos estáveis, ambos importantes para a tecnologia nuclear.',
        items: [
          { a: 6, text: 'Três prótons e três nêutrons. Usado para gerar trítio em fusão e em algumas baterias especiais.' },
          { a: 7, text: 'Três prótons e quatro nêutrons — a forma dominante, cerca de 92% do lítio natural, usada para controlar a química da água em reatores PWR.' }
        ]
      }
    },

    // ───── B — Boron (Z=5) ─────
    5: {
      en: {
        lead: 'Boron has two stable isotopes; one of them is a remarkable neutron absorber.',
        items: [
          { a: 10, text: 'Five protons and five neutrons. A strong neutron absorber, used in reactor control rods and in boron neutron-capture cancer therapy.' },
          { a: 11, text: 'Five protons and six neutrons — about 80% of natural boron and the basis of borosilicate glass chemistry.' }
        ]
      },
      pt: {
        lead: 'O boro tem dois isótopos estáveis; um deles é um notável absorvedor de nêutrons.',
        items: [
          { a: 10, text: 'Cinco prótons e cinco nêutrons. Forte absorvedor de nêutrons, usado em barras de controle de reatores e na terapia de captura de nêutrons (BNCT).' },
          { a: 11, text: 'Cinco prótons e seis nêutrons — cerca de 80% do boro natural e base da química do vidro borossilicato.' }
        ]
      }
    },

    // ───── C — Carbon (Z=6) ─────
    6: {
      en: {
        lead: 'Carbon has two stable isotopes plus a famous radioactive one used for dating.',
        items: [
          { a: 12, text: 'Six protons and six neutrons. It defines the atomic mass unit and makes up about 99% of all carbon.' },
          { a: 13, text: 'Six protons and seven neutrons. This minor stable form is the backbone of ¹³C-NMR, used to map organic molecules.' },
          { a: 14, text: 'Six protons and eight neutrons, and radioactive. Continuously formed in the atmosphere, its steady decay is the basis of radiocarbon dating.' }
        ]
      },
      pt: {
        lead: 'O carbono tem dois isótopos estáveis e um famoso radioativo usado em datação.',
        items: [
          { a: 12, text: 'Seis prótons e seis nêutrons. Define a unidade de massa atômica e representa cerca de 99% de todo o carbono.' },
          { a: 13, text: 'Seis prótons e sete nêutrons. Essa forma estável minoritária é a base da RMN de ¹³C, usada para mapear moléculas orgânicas.' },
          { a: 14, text: 'Seis prótons e oito nêutrons, e radioativo. Formado continuamente na atmosfera, seu decaimento constante é a base da datação por radiocarbono.' }
        ]
      }
    },

    // ───── N — Nitrogen (Z=7) ─────
    7: {
      en: {
        lead: 'Nitrogen has two stable isotopes, overwhelmingly dominated by one.',
        items: [
          { a: 14, text: 'Seven protons and seven neutrons — about 99.6% of all nitrogen and the gas that dominates our atmosphere.' },
          { a: 15, text: 'Seven protons and eight neutrons. This rare stable form is used as a non-radioactive tracer in biology and agronomy.' }
        ]
      },
      pt: {
        lead: 'O nitrogênio tem dois isótopos estáveis, com enorme predomínio de um deles.',
        items: [
          { a: 14, text: 'Sete prótons e sete nêutrons — cerca de 99,6% de todo o nitrogênio e o gás que domina nossa atmosfera.' },
          { a: 15, text: 'Sete prótons e oito nêutrons. Essa forma estável rara é usada como traçador não radioativo em biologia e agronomia.' }
        ]
      }
    },

    // ───── O — Oxygen (Z=8) ─────
    8: {
      en: {
        lead: 'Oxygen has three stable isotopes, whose ratios record Earth’s climate history.',
        items: [
          { a: 16, text: 'Eight protons and eight neutrons — a doubly magic, very stable nucleus and about 99.8% of all oxygen.' },
          { a: 17, text: 'Eight protons and nine neutrons. The only stable oxygen isotope with nuclear spin, which makes it useful in NMR.' },
          { a: 18, text: 'Eight protons and ten neutrons. Its ratio to oxygen-16 in ice and shells is a key paleoclimate thermometer.' }
        ]
      },
      pt: {
        lead: 'O oxigênio tem três isótopos estáveis, cujas proporções registram a história climática da Terra.',
        items: [
          { a: 16, text: 'Oito prótons e oito nêutrons — núcleo duplamente mágico, muito estável, e cerca de 99,8% de todo o oxigênio.' },
          { a: 17, text: 'Oito prótons e nove nêutrons. Único isótopo estável do oxigênio com spin nuclear, o que o torna útil em RMN.' },
          { a: 18, text: 'Oito prótons e dez nêutrons. Sua razão com o oxigênio-16 em gelo e conchas é um termômetro-chave do paleoclima.' }
        ]
      }
    },

    // ───── F — Fluorine (Z=9) ─────
    9: {
      en: {
        lead: 'Fluorine is monoisotopic — it has a single stable isotope.',
        items: [
          { a: 19, text: 'Nine protons and ten neutrons — the only stable isotope, so in nature every fluorine atom is identical. Its sharp NMR signal makes ¹⁹F a valuable probe in chemistry.' }
        ]
      },
      pt: {
        lead: 'O flúor é monoisotópico — tem um único isótopo estável.',
        items: [
          { a: 19, text: 'Nove prótons e dez nêutrons — o único isótopo estável, então na natureza todo átomo de flúor é idêntico. Seu sinal nítido de RMN faz do ¹⁹F uma sonda valiosa em química.' }
        ]
      }
    },

    // ───── Na — Sodium (Z=11) ─────
    11: {
      en: {
        lead: 'Sodium has just one stable isotope, plus a useful radioactive tracer.',
        items: [
          { a: 22, text: 'Eleven protons and eleven neutrons, and radioactive. A laboratory positron (β⁺) source used to calibrate PET detectors.' },
          { a: 23, text: 'Eleven protons and twelve neutrons — the only stable isotope, so all natural sodium is sodium-23.' }
        ]
      },
      pt: {
        lead: 'O sódio tem apenas um isótopo estável, além de um traçador radioativo útil.',
        items: [
          { a: 22, text: 'Onze prótons e onze nêutrons, e radioativo. Fonte de pósitrons (β⁺) de laboratório usada para calibrar detectores de PET.' },
          { a: 23, text: 'Onze prótons e doze nêutrons — o único isótopo estável, então todo o sódio natural é sódio-23.' }
        ]
      }
    },

    // ───── Al — Aluminium (Z=13) ─────
    13: {
      en: {
        lead: 'Aluminium has one stable isotope and one long-lived cosmic-ray isotope.',
        items: [
          { a: 26, text: 'Thirteen protons and thirteen neutrons, and radioactive. Produced by cosmic rays, it is used to date meteorites and rock surfaces.' },
          { a: 27, text: 'Thirteen protons and fourteen neutrons — the only stable isotope, so all everyday aluminium is aluminium-27.' }
        ]
      },
      pt: {
        lead: 'O alumínio tem um isótopo estável e um isótopo de vida longa gerado por raios cósmicos.',
        items: [
          { a: 26, text: 'Treze prótons e treze nêutrons, e radioativo. Produzido por raios cósmicos, é usado para datar meteoritos e superfícies de rochas.' },
          { a: 27, text: 'Treze prótons e quatorze nêutrons — o único isótopo estável, então todo o alumínio do dia a dia é alumínio-27.' }
        ]
      }
    },

    // ───── P — Phosphorus (Z=15) ─────
    15: {
      en: {
        lead: 'Phosphorus has a single stable isotope and a well-known radioactive one.',
        items: [
          { a: 31, text: 'Fifteen protons and sixteen neutrons — the only stable isotope and the form found in DNA, bone and ATP.' },
          { a: 32, text: 'Fifteen protons and seventeen neutrons, and radioactive. Its strong beta emission made it a classic molecular-biology label for DNA.' }
        ]
      },
      pt: {
        lead: 'O fósforo tem um único isótopo estável e um radioativo bem conhecido.',
        items: [
          { a: 31, text: 'Quinze prótons e dezesseis nêutrons — o único isótopo estável e a forma presente no DNA, nos ossos e no ATP.' },
          { a: 32, text: 'Quinze prótons e dezessete nêutrons, e radioativo. Sua forte emissão beta o tornou um marcador clássico de DNA na biologia molecular.' }
        ]
      }
    },

    // ───── S — Sulfur (Z=16) ─────
    16: {
      en: {
        lead: 'Sulfur has four stable isotopes (plus a useful radioactive one) spanning a huge range of abundance.',
        items: [
          { a: 32, text: 'Sixteen protons and sixteen neutrons — about 95% of all sulfur.' },
          { a: 35, text: 'Sixteen protons and nineteen neutrons, and radioactive. Used to radiolabel proteins and amino acids in biochemistry.' },
          { a: 36, text: 'Sixteen protons and twenty neutrons. An extremely rare stable isotope, only about 0.01% of natural sulfur.' }
        ]
      },
      pt: {
        lead: 'O enxofre tem quatro isótopos estáveis (e um radioativo útil), abrangendo uma enorme faixa de abundância.',
        items: [
          { a: 32, text: 'Dezesseis prótons e dezesseis nêutrons — cerca de 95% de todo o enxofre.' },
          { a: 35, text: 'Dezesseis prótons e dezenove nêutrons, e radioativo. Usado para marcar proteínas e aminoácidos em bioquímica.' },
          { a: 36, text: 'Dezesseis prótons e vinte nêutrons. Isótopo estável extremamente raro, apenas cerca de 0,01% do enxofre natural.' }
        ]
      }
    },

    // ───── Cl — Chlorine (Z=17) ─────
    17: {
      en: {
        lead: 'Chlorine has two stable isotopes whose roughly 3:1 mix sets its half-integer atomic mass.',
        items: [
          { a: 35, text: 'Seventeen protons and eighteen neutrons — about 76% of natural chlorine.' },
          { a: 36, text: 'Seventeen protons and nineteen neutrons, and radioactive. A cosmic-ray product used to date old groundwater and ice.' },
          { a: 37, text: 'Seventeen protons and twenty neutrons — about 24%. The 3:1 mix of chlorine-35 and chlorine-37 is why chlorine’s atomic mass is near 35.5.' }
        ]
      },
      pt: {
        lead: 'O cloro tem dois isótopos estáveis cuja mistura de cerca de 3:1 define sua massa atômica quebrada.',
        items: [
          { a: 35, text: 'Dezessete prótons e dezoito nêutrons — cerca de 76% do cloro natural.' },
          { a: 36, text: 'Dezessete prótons e dezenove nêutrons, e radioativo. Produto de raios cósmicos usado para datar águas subterrâneas e gelo antigos.' },
          { a: 37, text: 'Dezessete prótons e vinte nêutrons — cerca de 24%. A mistura 3:1 de cloro-35 e cloro-37 é o motivo de a massa atômica do cloro ser próxima de 35,5.' }
        ]
      }
    },

    // ───── K — Potassium (Z=19) ─────
    19: {
      en: {
        lead: 'Potassium has two stable isotopes and one primordial radioactive isotope present in every living thing.',
        items: [
          { a: 39, text: 'Nineteen protons and twenty neutrons — about 93% of all potassium.' },
          { a: 40, text: 'Nineteen protons and twenty-one neutrons, radioactive yet primordial. A trace of it sits in every banana and in your body; its decay underlies potassium–argon dating.' },
          { a: 41, text: 'Nineteen protons and twenty-two neutrons — about 7% of natural potassium.' }
        ]
      },
      pt: {
        lead: 'O potássio tem dois isótopos estáveis e um isótopo radioativo primordial presente em todos os seres vivos.',
        items: [
          { a: 39, text: 'Dezenove prótons e vinte nêutrons — cerca de 93% de todo o potássio.' },
          { a: 40, text: 'Dezenove prótons e vinte e um nêutrons, radioativo mas primordial. Um traço dele existe em cada banana e no seu corpo; seu decaimento é a base da datação potássio-argônio.' },
          { a: 41, text: 'Dezenove prótons e vinte e dois nêutrons — cerca de 7% do potássio natural.' }
        ]
      }
    },

    // ───── Ca — Calcium (Z=20) ─────
    20: {
      en: {
        lead: 'Calcium has several stable isotopes, including a nearly-stable one used to forge superheavy elements.',
        items: [
          { a: 40, text: 'Twenty protons and twenty neutrons — a doubly magic nucleus and about 97% of all calcium.' },
          { a: 44, text: 'Twenty protons and twenty-four neutrons. The second-most-common calcium isotope, used as a tracer of bone metabolism.' },
          { a: 48, text: 'Twenty protons and twenty-eight neutrons. Almost perfectly stable — it decays only by extraordinarily slow double-beta — and beams of it were used to create superheavy elements.' }
        ]
      },
      pt: {
        lead: 'O cálcio tem vários isótopos estáveis, incluindo um quase estável usado para criar elementos superpesados.',
        items: [
          { a: 40, text: 'Vinte prótons e vinte nêutrons — núcleo duplamente mágico e cerca de 97% de todo o cálcio.' },
          { a: 44, text: 'Vinte prótons e vinte e quatro nêutrons. Segundo isótopo mais comum do cálcio, usado como traçador do metabolismo ósseo.' },
          { a: 48, text: 'Vinte prótons e vinte e oito nêutrons. Quase perfeitamente estável — só decai por duplo-beta extremamente lento — e feixes dele foram usados para criar elementos superpesados.' }
        ]
      }
    },

    // ───── Fe — Iron (Z=26) ─────
    26: {
      en: {
        lead: 'Iron has four stable isotopes, dominated by one of the most tightly bound nuclei in nature.',
        items: [
          { a: 54, text: 'Twenty-six protons and twenty-eight neutrons — a minor stable isotope, about 6%.' },
          { a: 56, text: 'Twenty-six protons and thirty neutrons — about 92% of all iron and the endpoint of fusion in stars, because its nucleus is so tightly bound.' },
          { a: 57, text: 'Twenty-six protons and thirty-one neutrons. Its nuclear properties make it the key isotope for Mössbauer spectroscopy.' }
        ]
      },
      pt: {
        lead: 'O ferro tem quatro isótopos estáveis, dominados por um dos núcleos mais fortemente ligados da natureza.',
        items: [
          { a: 54, text: 'Vinte e seis prótons e vinte e oito nêutrons — isótopo estável minoritário, cerca de 6%.' },
          { a: 56, text: 'Vinte e seis prótons e trinta nêutrons — cerca de 92% de todo o ferro e o ponto final da fusão nas estrelas, por seu núcleo ser tão fortemente ligado.' },
          { a: 57, text: 'Vinte e seis prótons e trinta e um nêutrons. Suas propriedades nucleares o tornam o isótopo-chave da espectroscopia Mössbauer.' }
        ]
      }
    },

    // ───── Co — Cobalt (Z=27) ─────
    27: {
      en: {
        lead: 'Cobalt has one stable isotope and one of the most useful radioactive isotopes in medicine and industry.',
        items: [
          { a: 59, text: 'Twenty-seven protons and thirty-two neutrons — the only stable isotope, so all natural cobalt is cobalt-59.' },
          { a: 60, text: 'Twenty-seven protons and thirty-three neutrons, and radioactive. Its intense gamma rays are used to treat cancer, sterilise equipment and irradiate food.' }
        ]
      },
      pt: {
        lead: 'O cobalto tem um isótopo estável e um dos radioisótopos mais úteis da medicina e da indústria.',
        items: [
          { a: 59, text: 'Vinte e sete prótons e trinta e dois nêutrons — o único isótopo estável, então todo o cobalto natural é cobalto-59.' },
          { a: 60, text: 'Vinte e sete prótons e trinta e três nêutrons, e radioativo. Seus raios gama intensos são usados para tratar câncer, esterilizar equipamentos e irradiar alimentos.' }
        ]
      }
    },

    // ───── Sr — Strontium (Z=38) ─────
    38: {
      en: {
        lead: 'Strontium has several stable isotopes and a notorious radioactive fallout product.',
        items: [
          { a: 87, text: 'Thirty-eight protons and forty-nine neutrons. Partly produced by rubidium decay, so its abundance varies by rock and is used to trace the origin of foods and fossils.' },
          { a: 88, text: 'Thirty-eight protons and fifty neutrons — about 83% of natural strontium.' },
          { a: 90, text: 'Thirty-eight protons and fifty-two neutrons, and radioactive. A hazardous fallout product that mimics calcium and lodges in bone; also used as a compact power source.' }
        ]
      },
      pt: {
        lead: 'O estrôncio tem vários isótopos estáveis e um famoso produto radioativo de precipitação.',
        items: [
          { a: 87, text: 'Trinta e oito prótons e quarenta e nove nêutrons. Parte é produzida pelo decaimento do rubídio, então sua abundância varia conforme a rocha e é usada para rastrear a origem de alimentos e fósseis.' },
          { a: 88, text: 'Trinta e oito prótons e cinquenta nêutrons — cerca de 83% do estrôncio natural.' },
          { a: 90, text: 'Trinta e oito prótons e cinquenta e dois nêutrons, e radioativo. Produto perigoso de precipitação radioativa que imita o cálcio e se aloja nos ossos; também usado como fonte compacta de energia.' }
        ]
      }
    },

    // ───── Tc — Technetium (Z=43) ─────
    43: {
      en: {
        lead: 'Technetium was the first element made artificially and has no stable isotopes — every atom is radioactive.',
        items: [
          { a: 99, text: 'Forty-three protons and fifty-six neutrons, and radioactive. A long-lived product of uranium fission, found in nuclear waste.' },
          { a: 99, m: true, text: 'The same nucleus in an excited "metastable" state (the "m"). Its clean 6-hour gamma emission makes it the most widely used isotope in medical imaging.' }
        ]
      },
      pt: {
        lead: 'O tecnécio foi o primeiro elemento produzido artificialmente e não possui isótopos estáveis — todo átomo é radioativo.',
        items: [
          { a: 99, text: 'Quarenta e três prótons e cinquenta e seis nêutrons, e radioativo. Produto de vida longa da fissão do urânio, presente no lixo nuclear.' },
          { a: 99, m: true, text: 'O mesmo núcleo em um estado excitado "metaestável" (o "m"). Sua emissão gama limpa de 6 horas o torna o isótopo mais usado em exames de imagem médica.' }
        ]
      }
    },

    // ───── I — Iodine (Z=53) ─────
    53: {
      en: {
        lead: 'Iodine has a single stable isotope, surrounded by medically important radioactive ones.',
        items: [
          { a: 123, text: 'Fifty-three protons and seventy neutrons, and radioactive. A pure gamma emitter used for diagnostic thyroid scans.' },
          { a: 127, text: 'Fifty-three protons and seventy-four neutrons — the only stable isotope, the iodine your thyroid needs.' },
          { a: 131, text: 'Fifty-three protons and seventy-eight neutrons, and radioactive. Used to treat thyroid disease and cancer, but also a hazardous early fallout product.' }
        ]
      },
      pt: {
        lead: 'O iodo tem um único isótopo estável, cercado por radioisótopos importantes na medicina.',
        items: [
          { a: 123, text: 'Cinquenta e três prótons e setenta nêutrons, e radioativo. Emissor gama puro usado em exames diagnósticos da tireoide.' },
          { a: 127, text: 'Cinquenta e três prótons e setenta e quatro nêutrons — o único isótopo estável, o iodo de que sua tireoide precisa.' },
          { a: 131, text: 'Cinquenta e três prótons e setenta e oito nêutrons, e radioativo. Usado para tratar doenças e câncer de tireoide, mas também é um produto perigoso de precipitação radioativa.' }
        ]
      }
    },

    // ───── Cs — Caesium (Z=55) ─────
    55: {
      en: {
        lead: 'Caesium has one stable isotope and a radioactive one famous from nuclear accidents.',
        items: [
          { a: 133, text: 'Fifty-five protons and seventy-eight neutrons — the only stable isotope. Its precise atomic vibration defines the SI second (the caesium atomic clock).' },
          { a: 137, text: 'Fifty-five protons and eighty-two neutrons, and radioactive. A major fallout marker from Chernobyl and Fukushima, and the source in the 1987 Goiânia accident in Brazil.' }
        ]
      },
      pt: {
        lead: 'O césio tem um isótopo estável e um radioativo famoso por acidentes nucleares.',
        items: [
          { a: 133, text: 'Cinquenta e cinco prótons e setenta e oito nêutrons — o único isótopo estável. Sua vibração atômica precisa define o segundo do SI (o relógio atômico de césio).' },
          { a: 137, text: 'Cinquenta e cinco prótons e oitenta e dois nêutrons, e radioativo. Importante marcador de precipitação de Chernobyl e Fukushima, e a fonte do acidente de Goiânia (1987), no Brasil.' }
        ]
      }
    },

    // ───── Pb — Lead (Z=82) ─────
    82: {
      en: {
        lead: 'Lead is the heaviest element with truly stable isotopes, and three of them are where natural radioactive decay chains end.',
        items: [
          { a: 204, text: 'Eighty-two protons and one hundred twenty-two neutrons. The only lead isotope not produced by radioactive decay, used as the "primordial" reference in dating.' },
          { a: 206, text: 'Eighty-two protons and one hundred twenty-four neutrons. The endpoint of the uranium-238 decay chain, so its amount in rocks enables uranium–lead dating.' },
          { a: 207, text: 'Eighty-two protons and one hundred twenty-five neutrons — the endpoint of the uranium-235 decay chain.' },
          { a: 208, text: 'Eighty-two protons and one hundred twenty-six neutrons — a doubly magic, exceptionally stable nucleus and the final product of the thorium decay chain.' }
        ]
      },
      pt: {
        lead: 'O chumbo é o elemento mais pesado com isótopos realmente estáveis, e três deles são onde terminam as cadeias de decaimento radioativo naturais.',
        items: [
          { a: 204, text: 'Oitenta e dois prótons e cento e vinte e dois nêutrons. Único isótopo de chumbo não produzido por decaimento radioativo, usado como referência "primordial" nas datações.' },
          { a: 206, text: 'Oitenta e dois prótons e cento e vinte e quatro nêutrons. Fim da cadeia de decaimento do urânio-238, então sua quantidade nas rochas permite a datação urânio-chumbo.' },
          { a: 207, text: 'Oitenta e dois prótons e cento e vinte e cinco nêutrons — fim da cadeia de decaimento do urânio-235.' },
          { a: 208, text: 'Oitenta e dois prótons e cento e vinte e seis nêutrons — núcleo duplamente mágico, excepcionalmente estável, e produto final da cadeia de decaimento do tório.' }
        ]
      }
    },

    // ───── Po — Polonium (Z=84) ─────
    84: {
      en: {
        lead: 'Polonium, discovered by Marie Curie and named after Poland, has no stable isotopes.',
        items: [
          { a: 209, text: 'Eighty-four protons and one hundred twenty-five neutrons, and radioactive. The longest-lived polonium isotope, used as a reference alpha source.' },
          { a: 210, text: 'Eighty-four protons and one hundred twenty-six neutrons, and radioactive. An intense alpha emitter — a tiny amount releases great heat — infamous as the poison that killed Alexander Litvinenko in 2006.' }
        ]
      },
      pt: {
        lead: 'O polônio, descoberto por Marie Curie e batizado em homenagem à Polônia, não tem isótopos estáveis.',
        items: [
          { a: 209, text: 'Oitenta e quatro prótons e cento e vinte e cinco nêutrons, e radioativo. Isótopo de vida mais longa do polônio, usado como fonte alfa de referência.' },
          { a: 210, text: 'Oitenta e quatro prótons e cento e vinte e seis nêutrons, e radioativo. Emissor alfa intenso — uma quantidade ínfima libera muito calor — tristemente famoso como o veneno que matou Alexander Litvinenko em 2006.' }
        ]
      }
    },

    // ───── Rn — Radon (Z=86) ─────
    86: {
      en: {
        lead: 'Radon is a radioactive noble gas produced by the decay of uranium and thorium in rocks and soil.',
        items: [
          { a: 220, text: 'Eighty-six protons and one hundred thirty-four neutrons, and radioactive. Also called thoron, it comes from the thorium chain and decays within about a minute.' },
          { a: 222, text: 'Eighty-six protons and one hundred thirty-six neutrons, and radioactive. It seeps from the ground into basements, where it is a leading cause of lung cancer after smoking.' }
        ]
      },
      pt: {
        lead: 'O radônio é um gás nobre radioativo produzido pelo decaimento do urânio e do tório em rochas e solo.',
        items: [
          { a: 220, text: 'Oitenta e seis prótons e cento e trinta e quatro nêutrons, e radioativo. Também chamado torônio, vem da cadeia do tório e decai em cerca de um minuto.' },
          { a: 222, text: 'Oitenta e seis prótons e cento e trinta e seis nêutrons, e radioativo. Infiltra-se do solo para porões, onde é uma das principais causas de câncer de pulmão depois do cigarro.' }
        ]
      }
    },

    // ───── Ra — Radium (Z=88) ─────
    88: {
      en: {
        lead: 'Radium was isolated by Marie and Pierre Curie; its intense radioactivity once made it a (dangerous) ingredient of luminous paint.',
        items: [
          { a: 226, text: 'Eighty-eight protons and one hundred thirty-eight neutrons, and radioactive. The most common isotope, part of the uranium-238 chain; once used in glow-in-the-dark dials.' },
          { a: 228, text: 'Eighty-eight protons and one hundred forty neutrons, and radioactive. A product of the thorium chain, monitored as a contaminant in drinking water.' }
        ]
      },
      pt: {
        lead: 'O rádio foi isolado por Marie e Pierre Curie; sua radioatividade intensa já fez dele um (perigoso) ingrediente de tinta luminosa.',
        items: [
          { a: 226, text: 'Oitenta e oito prótons e cento e trinta e oito nêutrons, e radioativo. Isótopo mais comum, parte da cadeia do urânio-238; já foi usado em mostradores que brilham no escuro.' },
          { a: 228, text: 'Oitenta e oito prótons e cento e quarenta nêutrons, e radioativo. Produto da cadeia do tório, monitorado como contaminante na água potável.' }
        ]
      }
    },

    // ───── U — Uranium (Z=92) ─────
    92: {
      en: {
        lead: 'Uranium is the heaviest element found in significant amounts in nature, and its isotopes power both reactors and bombs.',
        items: [
          { a: 234, text: 'Ninety-two protons and one hundred forty-two neutrons, and radioactive. A rare decay product of uranium-238, present only in traces.' },
          { a: 235, text: 'Ninety-two protons and one hundred forty-three neutrons, and radioactive. The only natural isotope that sustains a chain reaction, so reactor and weapon fuel must be "enriched" in it.' },
          { a: 238, text: 'Ninety-two protons and one hundred forty-six neutrons, and radioactive — over 99% of natural uranium. Not directly fissile, but it can breed into plutonium-239 and dates the oldest rocks.' }
        ]
      },
      pt: {
        lead: 'O urânio é o elemento mais pesado encontrado em quantidades significativas na natureza, e seus isótopos alimentam tanto reatores quanto bombas.',
        items: [
          { a: 234, text: 'Noventa e dois prótons e cento e quarenta e dois nêutrons, e radioativo. Produto raro do decaimento do urânio-238, presente apenas em traços.' },
          { a: 235, text: 'Noventa e dois prótons e cento e quarenta e três nêutrons, e radioativo. Único isótopo natural que sustenta uma reação em cadeia, por isso o combustível de reatores e armas precisa ser "enriquecido" nele.' },
          { a: 238, text: 'Noventa e dois prótons e cento e quarenta e seis nêutrons, e radioativo — mais de 99% do urânio natural. Não é diretamente físsil, mas pode se transformar em plutônio-239 e data as rochas mais antigas.' }
        ]
      }
    },

    // ───── Pu — Plutonium (Z=94) ─────
    94: {
      en: {
        lead: 'Plutonium is a mostly synthetic element; trace amounts form in uranium ores, but useful quantities are bred in reactors.',
        items: [
          { a: 238, text: 'Ninety-four protons and one hundred forty-four neutrons, and radioactive. Its steady heat powers radioisotope generators on spacecraft such as Voyager and the Curiosity rover.' },
          { a: 239, text: 'Ninety-four protons and one hundred forty-five neutrons, and radioactive. Fissile like uranium-235, it is a primary fuel for reactors and nuclear weapons.' }
        ]
      },
      pt: {
        lead: 'O plutônio é um elemento majoritariamente sintético; traços se formam em minérios de urânio, mas quantidades úteis são geradas em reatores.',
        items: [
          { a: 238, text: 'Noventa e quatro prótons e cento e quarenta e quatro nêutrons, e radioativo. Seu calor constante alimenta geradores de radioisótopos em naves como a Voyager e o jipe Curiosity.' },
          { a: 239, text: 'Noventa e quatro prótons e cento e quarenta e cinco nêutrons, e radioativo. Físsil como o urânio-235, é combustível primário de reatores e armas nucleares.' }
        ]
      }
    }

  };

  root.ISOTOPE_INSIGHTS = INSIGHTS;

})(typeof window !== 'undefined' ? window : this);
