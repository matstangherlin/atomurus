// ───────────────────────────────────────────────────────────────────
// Atomurus — English overlay for elements-data.js
// ───────────────────────────────────────────────────────────────────
// Loaded AFTER elements-data.js (and after i18n.js when both are present).
// Provides English translations for the content fields that periodic-table.js
// reads directly from each element record: desc, disc, apps, occurrence,
// funfact. The original Portuguese data in elements-data.js is left untouched.
//
// Translation strategy:
//   - desc / funfact: completed for all 118 elements in this file.
//   - apps / occurrence: incremental — keys present here override; missing
//     keys fall through to the original Portuguese arrays.
//   - disc: only the handful of non-name labels ("Antiguidade") need a map;
//     personal names (Davy, Marie Curie, Berzelius, ...) are left as-is.
//
// Resolution helpers (elDesc / elDisc / elApps / elOccurrence / elFunfact)
// pick the English value when the active I18N language is 'en', and fall
// back to the original record otherwise.
// ───────────────────────────────────────────────────────────────────

const _DESC_EN = {
  // ── Period 1 ──
  1:  "The most abundant element in the universe, essential for life and the fuel of the future.",
  2:  "An inert noble gas, the second-lightest element, used in balloons and cryogenics.",
  // ── Period 2 ──
  3:  "A soft, silvery-white alkali metal — the lightest metal and the least dense solid element.",
  4:  "A rigid, lightweight alkaline-earth metal used in aerospace alloys and X-ray windows.",
  5:  "A metalloid with unique properties, essential in borosilicate glass and semiconductors.",
  6:  "The basis of organic chemistry and all known life, existing as graphite, diamond and graphene.",
  7:  "Makes up 78% of Earth's atmosphere, fundamental for proteins and nucleic acids.",
  8:  "Essential for respiration and combustion, the third most abundant element in the universe.",
  9:  "The most electronegative and reactive element, used in toothpaste and Teflon.",
  10: "A noble gas famous for the red glow of neon lights, extracted from atmospheric air.",
  // ── Period 3 ──
  11: "Soft alkali metal that reacts violently with water, essential in table salt (NaCl).",
  12: "Light, strong metal used in aluminum alloys, central to chlorophyll in plants.",
  13: "The most abundant metal in Earth's crust, lightweight and corrosion-resistant.",
  14: "Metalloid that forms the basis of modern electronics, the second most abundant element in Earth's crust.",
  15: "Essential for DNA, RNA and ATP, found in bones and agricultural fertilizers.",
  16: "Yellow polyatomic nonmetal used to make sulfuric acid and vulcanized rubber.",
  17: "Halogen used in water purification and the manufacture of PVC and disinfectants.",
  18: "The third most abundant gas in the atmosphere, used in welding and incandescent lamps.",
  // ── Period 4 ──
  19: "Alkali metal essential for cellular and nerve function, abundant in bananas.",
  20: "Alkaline-earth metal fundamental for bones, teeth and cellular signalling.",
  21: "Rare transition metal used in aluminum alloys for sports equipment.",
  22: "Light, strong, biocompatible metal — essential in aerospace and medical implants.",
  23: "Transition metal with multiple oxidation states, used in high-strength steel alloys.",
  24: "Hard, lustrous metal that gives stainless steel its corrosion resistance.",
  25: "Metal essential to steelmaking and to enzymatic biological processes.",
  26: "The most-used metal in human history, the backbone of industrial civilization and a component of blood.",
  27: "Transition metal used in permanent magnets, superalloys and blue pigments.",
  28: "Corrosion-resistant metal used in coins, batteries and stainless steel.",
  29: "Highly conductive metal essential for electrical wiring, plumbing and alloys like bronze and brass.",
  30: "Metal essential for enzymes, steel galvanization and nutritional supplements.",
  31: "A metal that melts in the palm of your hand (29 °C), used in semiconductors and LEDs.",
  32: "A metalloid predicted by Mendeleev, used in optical fibers and transistors.",
  33: "Toxic metalloid historically used as poison, today found in III–V semiconductors.",
  34: "Chalcogen essential in small amounts, used in solar cells and photocopiers.",
  35: "One of only two elements liquid at room temperature, a deep-red halogen.",
  36: "Noble gas used in photographic flash lamps and excimer lasers.",
  // ── Period 5 ──
  37: "Highly reactive alkali metal, used in precision atomic clocks.",
  38: "Alkaline-earth metal that gives fireworks their bright red color.",
  39: "Transition metal used in high-strength alloys and TV phosphors.",
  40: "Heat-resistant metal used in nuclear reactors and dental ceramics.",
  41: "Superconducting metal discovered in Brazil, essential in pipeline steels and aerospace.",
  42: "High-melting-point metal used in steel alloys and as a cofactor in many enzymes.",
  43: "The first artificially produced element, used in nuclear medicine diagnostics.",
  44: "Platinum-group metal with high wear resistance, used in electrical contacts.",
  45: "Rare noble metal essential in automotive catalytic converters.",
  46: "Noble metal used in catalytic converters, jewelry and electronics.",
  47: "The best metallic conductor of electricity and heat, used in jewelry and photography.",
  48: "Toxic metal used in Ni-Cd batteries and yellow/red pigments.",
  49: "Soft metal used in touchscreens (ITO) and low-melting-point solders.",
  50: "Used since antiquity in bronze, still essential in electronic solders and tin cans.",
  51: "Metalloid used since antiquity, today in flame retardants and lead alloys.",
  52: "Rare metalloid used in cadmium-telluride solar cells and metal alloys.",
  53: "Halogen essential to the thyroid, used in disinfectants and X-ray contrast.",
  54: "Heavy noble gas used in satellite ion thrusters and flash lamps.",
  // ── Period 6 ──
  55: "The most electropositive alkali metal — the basis of the world's most precise atomic clocks.",
  56: "Dense alkaline-earth metal used in gastrointestinal X-ray contrast.",
  57: "The first lanthanide, used in high-quality optical lenses and petroleum catalysts.",
  72: "Transition metal used in nuclear reactor control rods and microprocessors.",
  73: "Biocompatible high-melting-point metal, essential in electronic capacitors.",
  74: "Metal with the highest melting point of any element, used in lamp filaments.",
  75: "One of the rarest metals, with a high melting point, used in jet turbines.",
  76: "The densest natural metal, in the platinum group, resistant to extreme wear.",
  77: "Second densest metal, extremely corrosion-resistant, used in high-temperature crucibles.",
  78: "Precious metal used in jewelry, automotive catalysts and medical electrodes.",
  79: "The most malleable and ductile metal — a symbol of value and wealth throughout human history.",
  80: "One of only two elements liquid at room temperature, toxic and used in thermometers.",
  81: "Soft, toxic metal historically used as rat poison, today in radiation detectors.",
  82: "Dense metal used since Rome for water pipes, today in lead-acid batteries.",
  83: "Low-toxicity heavy metal, a replacement for lead in ammunition and pigments.",
  84: "Radioactive element discovered by Marie Curie, named in honor of Poland.",
  85: "The heaviest and rarest halogen, highly radioactive, investigated for radiotherapy.",
  86: "Radioactive noble gas, the second-largest risk factor for lung cancer after smoking.",
  // ── Period 7 ──
  87: "Highly radioactive alkali metal — the most unstable and rare natural element on Earth.",
  88: "Radioactive alkaline-earth metal, discovered by the Curies, historically used in radiotherapy.",
  89: "The first actinide, highly radioactive, used in thermoelectric generators and research.",
  104: "Superheavy synthetic element, the lightest of the transactinides.",
  105: "Superheavy synthetic element named after the city of Dubna, Russia.",
  106: "Synthetic element named in honor of physicist Glenn T. Seaborg.",
  107: "Synthetic element named after the Danish physicist Niels Bohr.",
  108: "Synthetic element named after the German state of Hesse.",
  109: "Synthetic element named after the Austrian physicist Lise Meitner.",
  110: "Synthetic element named after the city of Darmstadt, Germany.",
  111: "Synthetic element named after the physicist Wilhelm Röntgen.",
  112: "Synthetic element named after the astronomer Nicolaus Copernicus.",
  113: "The first element discovered in Asia, named after Japan (Nihon).",
  114: "Superheavy synthetic element named after the Flerov Laboratory in Dubna.",
  115: "Synthetic element named after the Moscow region of Russia.",
  116: "Synthetic element named after the Lawrence Livermore National Laboratory.",
  117: "Synthetic element named after the U.S. state of Tennessee.",
  118: "The heaviest confirmed element, named after physicist Yuri Oganessian.",
  // ── Lanthanides ──
  58: "The most abundant lanthanide, used in automotive catalysts and special glasses.",
  59: "Lanthanide used in high-power permanent magnets and welding goggles.",
  60: "Essential component of the strongest permanent magnets (Nd-Fe-B) used in electric motors.",
  61: "The only lanthanide with no stable isotopes, used in cardiac pacemaker batteries.",
  62: "Lanthanide used in high-temperature permanent magnets and the nuclear industry.",
  63: "Lanthanide that produces red and blue luminescence in TV screens and euro banknotes.",
  64: "Paramagnetic lanthanide, used as a contrast agent in magnetic resonance imaging.",
  65: "Lanthanide used as a green phosphor in fluorescent lamps and high-definition screens.",
  66: "The lanthanide with the largest magnetic moment, essential in wind-turbine magnets.",
  67: "Lanthanide with exceptional magnetic properties, used in medical lasers.",
  68: "Lanthanide that amplifies signals in long-distance fiber-optic telecommunications.",
  69: "The rarest lanthanide, used in portable surgical lasers and portable X-ray sources.",
  70: "Lanthanide used in the most precise atomic clocks and in ytterbium-doped stainless steels.",
  71: "The densest and hardest lanthanide, used in positron-emission tomography detectors.",
  // ── Actinides ──
  90: "Radioactive actinide with potential as a nuclear fuel — more abundant than uranium.",
  91: "Highly radioactive and toxic actinide, precursor of uranium-233 in nuclear fuel cycles.",
  92: "Radioactive metal at the heart of nuclear energy — its U-235 isotope fissions in reactors and bombs.",
  93: "The first synthetic transuranic element, a byproduct of uranium nuclear reactors.",
  94: "Fissile actinide used in nuclear weapons and as fuel in Generation-IV reactors.",
  95: "Synthetic actinide found in household smoke detectors (Am-241).",
  96: "Actinide named in honor of Marie and Pierre Curie, used in space power sources.",
  97: "Synthetic actinide named after the city of Berkeley, California.",
  98: "Highly radioactive synthetic actinide used in oil-well neutron logging.",
  99: "Actinide named in honor of Albert Einstein, found in fallout from a nuclear test.",
  100: "Actinide named in honor of the physicist Enrico Fermi, produced in accelerators.",
  101: "Actinide named in honor of Dmitri Mendeleev, creator of the periodic table.",
  102: "Actinide named in honor of Alfred Nobel and the Nobel Institute of Physics.",
  103: "The last actinide and the last f-block element, named in honor of Ernest Lawrence."
};

const _FUNFACT_EN = {
  // ── Period 1 ──
  1:  "It is the most abundant element in the universe — about 75% of all baryonic mass.",
  2:  "The lowest boiling point of any element: −269 °C. It only becomes solid under pressure.",
  // ── Period 2 ──
  3:  "It floats on water and reacts with it releasing H₂. It is the least dense solid metal.",
  4:  "So toxic that the scientists who first isolated it in the 19th century suffered severe poisoning.",
  5:  "Borosilicate glass (Pyrex) withstands extreme thermal shock thanks to boron.",
  6:  "The only element with more known compounds than all the other elements combined.",
  7:  "N₂ is so stable (triple bond N≡N) that even TNT, when it explodes, releases N₂ as an inert product.",
  8:  "The rust that corrodes iron on Mars gives the planet its red color — it is iron oxide (Fe₂O₃).",
  9:  "Fluorine is so reactive that it attacks glass and reacts with almost every element — even the noble gases Xe and Kr.",
  10: "Each neon atom emits a characteristic color in the spectrum — neon signs in other colors actually use different gases.",
  // ── Period 3 ──
  11: "It reacts with water producing a brilliant yellow flame — the very color that identifies sodium in the spectrum.",
  12: "Every chlorophyll molecule has exactly one magnesium atom at its center — without it, plants cannot photosynthesize.",
  13: "Aluminum was more valuable than gold in the 19th century. Napoleon III reserved it for honored guests.",
  14: "The second most abundant element in Earth's crust (28%) — but never found in pure form in nature.",
  15: "Every ATP molecule (the cell's energy currency) contains phosphorus. Without it, no known form of life is possible.",
  16: "Sulfuric acid (H₂SO₄) is the most heavily manufactured industrial chemical in the world — more than 200 Mt/year.",
  17: "It was the first large-scale chemical-warfare agent, used at the Battle of Ypres in 1915.",
  18: "The third most abundant gas in the atmosphere, but discovered only in 1894 — it had been hiding inside nitrogen.",
  // ── Period 4 ──
  19: "It is the second most electropositive metal in nature — it reacts with water even more vigorously than sodium.",
  20: "The average adult human body contains about 1 kg of calcium — 99% in bones and teeth, 1% in blood.",
  21: "So rare that annual world production fits into a single truck. Yet 0.5% in aluminum alloys can double their strength.",
  22: "Titanium has the highest strength-to-weight ratio of any metal. It is biocompatible — bone grows directly onto it.",
  23: "The only element that forms colored solutions in every oxidation state: lilac (+2), green (+3), blue (+4), yellow (+5).",
  24: "The name comes from the Greek 'chroma' (color) — all of its compounds are intensely colored.",
  25: "Potassium permanganate (KMnO₄) is so oxidizing that it instantly decolorizes solutions of organic matter.",
  26: "Earth's core is mainly iron — its motion generates the magnetic field that protects us from the solar wind.",
  27: "Vitamin B12 (cyanocobalamin) is the only biologically active compound containing cobalt — essential for neurons.",
  28: "The American 5-cent coin (the 'nickel') is actually 75% copper and 25% nickel — despite the name.",
  29: "Second only to silver as an electrical conductor — but 100× cheaper. It dominates the world's wiring.",
  30: "Zinc protects iron from rusting by being more reactive — it 'sacrifices' itself by oxidizing in iron's place.",
  31: "Melts at 30 °C — it literally melts in the palm of your hand. Yet it boils only at 2204 °C, one of the largest liquid ranges.",
  32: "Mendeleev predicted its existence in 1871 as 'eka-silicon'. When discovered in 1886, it confirmed the periodic table.",
  33: "Used for centuries as a poison and a cosmetic. Emperor Napoleon may have been poisoned by arsenic in his wallpaper.",
  34: "Minute doses are essential for health (antioxidant), but slightly larger doses are highly toxic.",
  35: "One of only two elements liquid at room temperature. Its vapor is so corrosive it attacks metals.",
  36: "Although 'noble', Kr can form compounds with fluorine (KrF₂) under extreme laboratory conditions.",
  // ── Period 5 ──
  37: "It is radioactive (Rb-87, half-life 48 billion years) — used to date ancient geological rocks.",
  38: "Its salts color flames an intense crimson red — essential in fireworks.",
  39: "Yttrium was discovered in Ytterby, Sweden — a village that gave its name to four elements: Y, Yb, Er, Tb.",
  40: "Zircon is the oldest mineral found on Earth — 4.4-billion-year-old crystals at Jack Hills, Australia.",
  41: "Brazil holds 98% of the world's niobium reserves. Essentially all world production passes through Brazil.",
  42: "MoS₂ is one of the best solid lubricants in existence — it works in the vacuum of space, where oils evaporate.",
  43: "The first artificial element in history. Tc-99m is the most-used radioisotope in nuclear medicine worldwide.",
  44: "Adding just 0.1% of ruthenium to titanium increases its corrosion resistance to acids by 100×.",
  45: "Rhodium is the most expensive precious metal in the world — at peak it can cost 10× more than gold.",
  46: "The only transition metal with no s-shell electrons — its [Kr]4d¹⁰ configuration is unique.",
  47: "Silver has the highest electrical and thermal conductivity of all metals — surpassing even copper and gold.",
  48: "Cadmium can accumulate in the kidneys for decades — the 'itai-itai' disease in Japan was caused by Cd contamination.",
  49: "Soft enough to be cut with a knife, and emits a 'tin cry' when bent — just like tin.",
  50: "'Tin plague': below 13 °C white tin transforms into a gray powder — it ruined the buttons on Napoleon's army coats.",
  51: "The ancient Egyptians used antimony sulfide (Sb₂S₃) as a black eyeliner — the original kohl.",
  52: "The largest deposits of gold natively associated with tellurium were found at Cripple Creek, Colorado.",
  53: "Iodine deficiency is the most common preventable cause of mental retardation — it affects 2 billion people worldwide.",
  54: "Xenon produces anesthesia by dissolving in the lipid membranes of neurons — but it is too expensive for routine use.",
  // ── Period 6 ──
  55: "The second largest of the alkali metals, it melts at 28.5 °C — it can be liquid on a warm summer day.",
  56: "BaSO₄ is opaque to X-rays and non-toxic — patients drink it to enhance the digestive tract on radiographs.",
  57: "Lanthanum oxide improves glass refraction, allowing thinner lenses in high-quality cameras.",
  72: "It was the last stable element to be discovered (1923). Hidden inside zirconium for decades — chemically nearly identical.",
  73: "Coltan (the Ta ore) is mined in the Congo and is essential for smartphone capacitors — it fuels armed conflicts.",
  74: "Highest melting point of any element: 3,422 °C. Tungsten filaments reach 2,500 °C in incandescent lamps.",
  75: "One of the rarest metals in Earth's crust — less than 1 ppb. Estimated world reserves are only ~2,500 t.",
  76: "The densest natural metal of all: 22.59 g/cm³ — nearly twice that of lead and three times that of iron.",
  77: "The iridium layer at the Cretaceous–Paleogene boundary (66 Ma) is the evidence of the asteroid that killed the dinosaurs.",
  78: "The international kilogram standard was made of a Pt-Ir alloy (90%/10%) and lived in Paris for 130 years.",
  79: "All the gold ever mined in history would fit into a single cube about 21 m on a side. It is also the most malleable of metals.",
  80: "The only metal liquid at room temperature. Medieval alchemists called it 'quicksilver'.",
  81: "The favorite poison in detective stories — tasteless, odorless and causes hair loss before being fatal.",
  82: "The Romans used lead in water pipes, cookware and even wine (lead acetate as sweetener) — possibly contributing to the fall of the Empire.",
  83: "Technically radioactive, but with a half-life of 2 × 10¹⁹ years — effectively stable for all practical purposes.",
  84: "Discovered by Marie Curie and named in honor of her homeland, Poland. The most unstable of the non-synthetic elements.",
  85: "The rarest naturally occurring element — at any moment, less than 1 gram of astatine exists in the entire Earth's crust.",
  86: "Second leading cause of lung cancer in the U.S., after smoking. It seeps into houses through cracks in the ground.",
  // ── Period 7 ──
  87: "The most unstable and rare natural element. At any given moment, less than 30 g of francium is estimated to exist on Earth.",
  88: "Marie and Pierre Curie isolated 1 g of radium by processing 10 tons of pitchblende — it took them four years of work.",
  89: "It produces so much radioactive heat that an actinium compound glows blue in the dark without any external light.",
  104: "Named in honor of Ernest Rutherford. The half-life of its most stable isotope (Rf-267) is about 1.3 hours.",
  105: "Named in honor of Glenn T. Seaborg — discoverer of ten transuranic elements and the only scientist honored on the table during his lifetime.",
  106: "Named in honor of Glenn T. Seaborg. Sg-269 has a half-life of about 14 minutes — the most stable of this element.",
  107: "Named in honor of Niels Bohr. Bh-270 has a half-life of about 61 seconds — one of the longest-lived of its group.",
  108: "Named after the German state of Hesse. Hs-269 has a half-life of about 16 seconds.",
  109: "Named in honor of Lise Meitner, who co-discovered nuclear fission. Mt-278 has a half-life of about 4 seconds.",
  110: "Named after the German city of Darmstadt, where it was synthesized at the GSI in 1994.",
  111: "Named after Wilhelm Röntgen, discoverer of X-rays. Rg-282 has a half-life of about 2 minutes.",
  112: "Named after Nicolaus Copernicus. It may be a 'super-volatile' metal — predicted to behave like a noble gas at room temperature.",
  113: "The first element discovered in Asia. Its name 'Nihonium' comes from 'Nihon', the Japanese name for Japan.",
  114: "Predicted to be the first element of the 'island of stability'. Fl-289 has a half-life of about 2.6 seconds.",
  115: "Named after the Moscow region (Oblast Moskovskaya) where it was synthesized.",
  116: "Named after the Lawrence Livermore National Laboratory. Lv-293 has a half-life of about 60 milliseconds.",
  117: "Named after Tennessee — home of Oak Ridge National Laboratory, which provided the target material for synthesis.",
  118: "The only element named after a living person at the time (Yuri Oganessian). The heaviest element on the periodic table.",
  // ── Lanthanides ──
  58: "The most abundant lanthanide — more common in the crust than lead. The classic 'flint' lighter (cerium + iron) uses Ce.",
  59: "The green of welder's goggles comes from praseodymium — it absorbs exactly the wavelengths of the welding arc.",
  60: "Nd-Fe-B magnets are the strongest in the world — electric-car motors and wind turbines depend on them.",
  61: "The only lanthanide without any stable isotope. Naturally present on Earth in amounts estimated at just ~570 g.",
  62: "SmCo magnets work at temperatures of up to 350 °C — ideal where Nd magnets would lose their magnetism.",
  63: "Euro banknotes use europium fluorescence — they glow red and blue under UV. It is the main anti-counterfeit pigment.",
  64: "Gd-DTPA is the most widely used MRI contrast agent — it makes soft tissues visible in detail to doctors.",
  65: "Terfenol-D (Tb-Dy-Fe) is the most powerful magnetostrictive material — it changes length when magnetized.",
  66: "Has the largest magnetic moment of any element — essential so that EV and wind-turbine magnets keep working at high temperatures.",
  67: "The Ho:YAG laser (2,100 nm) is absorbed by the water in tissue — ideal for endoscopic surgery of the kidney and prostate.",
  68: "Erbium-doped fiber amplifiers (EDFAs) are the heart of long-distance internet — without Er, no transcontinental fiber optics.",
  69: "The rarest and most expensive lanthanide after promethium. Tm-170 (made in a reactor) can be used as a portable X-ray source.",
  70: "Ytterbium clocks set the world record for precision in 2018 — they lose 1 second every 10 billion years.",
  71: "LSO (Lu₂SiO₅:Ce) is the standard scintillator in PET scanners — it detects positrons emitted by labelled glucose tracers.",
  // ── Actinides ──
  90: "Brazil holds 16% of world thorium reserves — enough to power the world for millennia in Th reactors.",
  91: "So rare and toxic that less than 125 kg has been produced since its discovery — no real commercial use.",
  92: "A single UO₂ pellet (finger-sized) contains as much energy as 800 kg of coal or 600 L of oil.",
  93: "Named after Neptune — the planet beyond Uranus, just as Np lies beyond U on the periodic table.",
  94: "A baseball-sized sphere of plutonium-239 (about 6 kg) can sustain a nuclear chain reaction.",
  95: "Am-241 in smoke detectors emits alpha particles that ionize the air — the alarm trips when smoke interrupts the ionization.",
  96: "Named in honor of Marie and Pierre Curie — the only scientists honored on the periodic table while one of them was still alive.",
  97: "First produced in Berkeley, California — named after the very city where it was created.",
  98: "Cf-252 spontaneously emits neutrons — 1 µg per hour. It is used to start nuclear reactors and to locate oil.",
  99: "Secretly discovered in the Ivy Mike nuclear test (1952) — by analyzing dust collected by aircraft.",
  100: "Named in honor of Enrico Fermi, who built the world's first nuclear reactor in 1942 in Chicago.",
  101: "Named in honor of Mendeleev — creator of the periodic table on which this very element appears as number 101.",
  102: "Curiously named after the Swedish Nobel Institute — even though the actual synthesis was done by the Dubna group.",
  103: "The last actinide and the last f-block element. Named after Ernest Lawrence, inventor of the cyclotron."
};

// Per-element apps/occurrence overrides. When a Z is absent here, the helper
// falls back to the Portuguese arrays in EXTRA[z].apps / EXTRA2[z].occurrence.

const _APPS_EN = {
  // ── Period 1 ──
  1:  ["H₂ fuel","Water (H₂O)","Acids","Ammonia","Petroleum"],
  2:  ["Balloons","Cryogenic MRI","Diving","Lasers"],
  // ── Period 2 ──
  3:  ["Li-ion batteries","Psychiatric medications","Aerospace alloys"],
  4:  ["Aerospace alloys","X-ray windows","Gyroscopes"],
  5:  ["Borosilicate glass","Semiconductors","Detergents","Flame retardants"],
  6:  ["Graphite","Diamond","Steel","Plastics","Fuels"],
  7:  ["Fertilizers","Proteins","Explosives","Cryogenics"],
  8:  ["Respiration","Combustion","Steel","Medicine","Aviation"],
  9:  ["Toothpaste","Teflon","Refrigerants","Plastics"],
  10: ["Neon lights","Lasers","Particle detectors"],
  // ── Period 3 ──
  11: ["Table salt","Caustic soda","Sodium-vapor lamps"],
  12: ["Lightweight alloys","Nutritional supplements","Chlorophyll","Fireworks"],
  13: ["Packaging","Aviation","Construction","Electrical conductors"],
  14: ["Computer chips","Solar panels","Glass","Silicones"],
  15: ["Fertilizers","DNA/RNA","Matches","Detergents","ATP"],
  16: ["Sulfuric acid","Vulcanized rubber","Fungicides","Gunpowder"],
  17: ["Drinking water","PVC","Disinfectants","Bleached paper"],
  18: ["Arc welding","Fluorescent lamps","Lasers","Electronics"],
  // ── Period 4 ──
  19: ["Fertilizers (KCl)","Muscle and nerve function","Black gunpowder"],
  20: ["Bones and teeth","Cement","Milk","Antacid medications"],
  21: ["Al-Sc bicycle alloys","Mercury-scandium lamps","Iodide lasers"],
  22: ["Orthopedic implants","Aircraft frames","Jewelry","White TiO₂ pigment"],
  23: ["Tool steel","Chemical catalysts","Vanadium batteries","Aerospace alloys"],
  24: ["Stainless steel","Chrome plating","Pigments","Leather tanning"],
  25: ["Steel production","Lithium-ion batteries","Pigments","Antiknock agent"],
  26: ["Steel","Construction","Hemoglobin in blood","Permanent magnets"],
  27: ["Turbine superalloys","Cobalt batteries","Blue pigment","Vitamin B12"],
  28: ["Stainless steel","Coins","Ni-MH batteries","Catalysts","Coatings"],
  29: ["Electrical wiring","Bronze","Brass","Coins","Plumbing pipes"],
  30: ["Steel galvanization","Batteries","Nutritional supplements","Brass"],
  31: ["LEDs and laser diodes","GaAs solar cells","Gallium thermometers"],
  32: ["Optical fibers","Ge transistors","Infrared detectors","Catalysts"],
  33: ["GaAs semiconductors","Wood preservatives (CCA)","Pesticides (hist.)"],
  34: ["CdTe solar cells","Photocopiers","Animal supplement","Optical glass"],
  35: ["Flame retardants","Photography (AgBr)","Sedative medications","Pesticides"],
  36: ["Photographic flash lamps","Excimer lasers","Theatrical lighting"],
  // ── Period 5 ──
  37: ["Precision atomic clocks","Ruby lasers","Quantum physics research"],
  38: ["Fireworks (red)","Permanent magnets (SrO)","Ceramic pigments"],
  39: ["TV phosphors (YAG)","Garnet lasers","Welding electrodes","Superalloys"],
  40: ["Nuclear fuel rod cladding","Dental ceramics","Surgical knives"],
  41: ["Specialty pipeline steels","Superconductors","Ceramic capacitors","Aeronautics"],
  42: ["Tool steels","Lubricant (MoS₂)","Nitrogenase enzymes","Catalysts"],
  43: ["Nuclear imaging diagnostics (⁹⁹mTc)","Steel corrosion","Scientific research"],
  44: ["Electrical contacts","Ru catalysts","Fountain pen nibs","Superalloys"],
  45: ["Catalytic converters","Mirror coatings","Pt-Rh thermocouples","Electronics"],
  46: ["Catalytic converters","Jewelry (white gold)","Electronics","Fuel cells"],
  47: ["Jewelry","Photography (AgBr)","Precision electronics","Mirrors","Antibacterial"],
  48: ["Ni-Cd batteries","Yellow pigments","CdTe solar cells","Coatings"],
  49: ["ITO touchscreens","Low-melting solders","Bearing coatings"],
  50: ["Electronic solders","Food cans (tin plating)","Bronze","Optical glass"],
  51: ["Flame retardants","Lead battery alloys","InSb semiconductors"],
  52: ["CdTe solar cells","Magnetic storage disks","Specialty steel alloys"],
  53: ["Thyroid hormone","Disinfectant (povidone-iodine)","Radiological contrast"],
  54: ["Satellite ion thrusters","Flash lamps","Experimental anesthesia"],
  // ── Period 6 ──
  55: ["Atomic clocks (SI standard)","Ion thrusters","Oil drilling"],
  56: ["X-ray contrast (BaSO₄)","Optical glass","Flame retardants","Green fireworks"],
  57: ["Camera optical lenses","Refinery catalysts","Arc electrodes"],
  72: ["Nuclear control rods","Magnetron filaments","Microprocessors (gate)"],
  73: ["Electronic capacitors","Surgical implants","Corrosion-resistant chemical equipment"],
  74: ["Lamp filaments","TIG welding electrodes","Radiation shielding","Rockets"],
  75: ["Jet turbine blades","Hydrogenation catalysts","High-T thermocouples"],
  76: ["Fountain pen nibs","Electrical contacts","Platinum hardening alloys"],
  77: ["High-temperature crucibles","Catalysts","Ignition compounds","Standard gauges"],
  78: ["Catalytic converters","Jewelry","Pacemaker electrodes","Weight standards"],
  79: ["Jewelry","Precision electronics","Financial reserves","Nuclear medicine"],
  80: ["Thermometers (historical)","Barometers","Fluorescent lamps (amalgam)"],
  81: ["Radiation detectors","High-index optical glass","Superconductor research"],
  82: ["Lead-acid batteries","Radiation shielding","Projectiles","Paints (hist.)"],
  83: ["Medications (Pepto-Bismol)","Iridescent pigments","Catalysts","Ammunition"],
  84: ["Static electricity elimination","Scientific research","Neutron sources"],
  85: ["Experimental radiotherapy","Nuclear research","Thyroid diagnostics"],
  86: ["Residential radon detector","Radiotherapy research","Geological mapping"],
  // ── Period 7 ──
  87: ["Nuclear physics research","Study of alkali metal properties"],
  88: ["Historical radiotherapy","Luminescence (hist.)","Nuclear research"],
  89: ["Thermoelectric generators (research)","Neutron sources","Research"],
  90: ["Nuclear fuel (Th reactor)","Old lamp filaments","TIG electrodes"],
  91: ["Nuclear chemistry research","Th-U fuel cycle"],
  92: ["Nuclear fuel","Scientific research","Radiation shielding"],
  93: ["Nuclear reactor byproduct","Nuclear physics research"],
  94: ["Nuclear fuel","Weapons research (historical)","Space power sources (RTG)"],
  95: ["Smoke detectors (Am-241)","Soil moisture gauges","Research"],
  96: ["Space power sources (RTG)","Actinide research"],
  97: ["Scientific research","Production of heavier elements in accelerators"],
  98: ["Neutron detectors for oil exploration","Cancer treatment (BNCT)"],
  99: ["Pure scientific research","Synthesis of superheavy elements"],
  100: ["Scientific research","Synthesis in particle accelerators"],
  101: ["Pure scientific research","Synthesis in accelerators"],
  102: ["Scientific research","Synthesis in particle accelerators"],
  103: ["Scientific research","Last actinide — threshold of the transactinides"],
  // Transactinides (104-118) — no EXTRA entry; getExtra() falls back to a
  // generic ["Pesquisa científica","Aplicações especializadas"]. Override here.
  104: ["Scientific research","Specialized applications"],
  105: ["Scientific research","Specialized applications"],
  106: ["Scientific research","Specialized applications"],
  107: ["Scientific research","Specialized applications"],
  108: ["Scientific research","Specialized applications"],
  109: ["Scientific research","Specialized applications"],
  110: ["Scientific research","Specialized applications"],
  111: ["Scientific research","Specialized applications"],
  112: ["Scientific research","Specialized applications"],
  113: ["Scientific research","Specialized applications"],
  114: ["Scientific research","Specialized applications"],
  115: ["Scientific research","Specialized applications"],
  116: ["Scientific research","Specialized applications"],
  117: ["Scientific research","Specialized applications"],
  118: ["Scientific research","Specialized applications"],
  // ── Lanthanides ──
  58: ["Automotive catalysts (Ce₂O₃)","Self-cleaning glass","Polishing abrasives"],
  59: ["Nd-Pr magnets","Welding goggles","Yellow-green pigments","High-power alloys"],
  60: ["Nd-Fe-B permanent magnets","EV electric motors","Infrared-protective glass"],
  61: ["Pacemaker batteries (Pm-147)","Paint thickness gauges","Tracer research"],
  62: ["SmCo high-temperature magnets","Doped Nd:YAG lasers","Nuclear reactors"],
  63: ["Red/blue TV phosphors","Euro banknotes (fluorescence)","Eu lasers"],
  64: ["MRI contrast (Gd-DTPA)","Green phosphors","Nuclear reactor shielding"],
  65: ["Green TV/monitor phosphors","Magnetostriction (Terfenol-D)","Solid-state lasers"],
  66: ["Wind turbine magnets (Dy-Nd-Fe-B)","High-power lasers","Nuclear reactors"],
  67: ["Medical lasers (Ho:YAG)","High-power magnetic poles","Spectroscopy"],
  68: ["Fiber optic amplifiers (Er-EDFA)","Er:YAG lasers","Pink glass pigments"],
  69: ["Portable surgical lasers","Portable X-ray sources","Phosphorescent plates"],
  70: ["Yb atomic clocks (most precise)","Fiber optic amplifiers","Yb stainless steel"],
  71: ["PET detectors (Lu₂SiO₅)","Petrochemical catalysts","Dosimeters"]
};

const _OCCURRENCE_EN = {
  // ── Period 1 ──
  1:  ["Atmosphere","Water (H₂O)","Organic compounds"],
  2:  ["Sun","Atmosphere (trace)","Natural gas"],
  // ── Period 2 ──
  3:  ["Spodumene","Lepidolite","Seawater"],
  4:  ["Beryl (Be₃Al₂Si₆O₁₈)","Chrysoberyl","Granitic rock"],
  5:  ["Borax (Na₂B₄O₇)","Kernite","Seawater (trace)"],
  6:  ["Living organisms","Coal","Petroleum","Atmospheric CO₂"],
  7:  ["Atmosphere (78%)","Proteins","DNA","Fertilizers"],
  8:  ["Atmosphere (21%)","Water","Silicates","Oxides"],
  9:  ["Fluorite (CaF₂)","Cryolite","Fluorapatite","Seawater"],
  10: ["Atmosphere (0.0018%)","Volcanic gas","Liquid air"],
  // ── Period 3 ──
  11: ["Halite (NaCl)","Seawater","Sodium silicates"],
  12: ["Dolomite","Magnesite","Chlorophyll"],
  13: ["Bauxite (Al₂O₃)","Feldspar","Clay soil"],
  14: ["Sand (SiO₂)","Feldspar","Quartz","Clay"],
  15: ["Phosphorite (Ca₃(PO₄)₂)","Apatite","DNA and bones"],
  16: ["Pyrite (FeS₂)","Gypsum (CaSO₄)","Petroleum"],
  17: ["Halite (NaCl)","Seawater","Sylvite (KCl)"],
  18: ["Atmosphere (0.93%)","Liquid air","Natural gas"],
  // ── Period 4 ──
  19: ["Sylvite (KCl)","Carnallite","Seawater"],
  20: ["Limestone (CaCO₃)","Gypsum (CaSO₄)","Feldspar"],
  21: ["Thortveitite","Uranium (trace)","Basaltic latites"],
  22: ["Ilmenite (FeTiO₃)","Rutile (TiO₂)","Sphene"],
  23: ["Vanadinite","Carnotite","Crude oil"],
  24: ["Chromite (FeCr₂O₄)","Crocoite (PbCrO₄)"],
  25: ["Pyrolusite (MnO₂)","Rhodochrosite","Ocean nodules"],
  26: ["Earth's core","Hematite (Fe₂O₃)","Magnetite"],
  27: ["Cobaltite","Erythrite","Nickel ore"],
  28: ["Pentlandite","Garnierite","Earth's core"],
  29: ["Chalcopyrite","Malachite","Native copper"],
  30: ["Sphalerite (ZnS)","Smithsonite","Hemimorphite"],
  31: ["Sphalerite (trace)","Bauxite (trace)","Soil"],
  32: ["Germanite","Coal (trace)","Sphalerite (trace)"],
  33: ["Arsenopyrite","Realgar","Orpiment"],
  34: ["Clausthalite","Berzelianite","Coal (trace)"],
  35: ["Bromite (AgBr)","Seawater","Halite (trace)"],
  36: ["Atmosphere (1 ppm)","Liquid air"],
  // ── Period 5 ──
  37: ["Lepidolite","Seawater (trace)","K ores"],
  38: ["Celestine (SrSO₄)","Strontianite (SrCO₃)"],
  39: ["Xenotime","Monazite","Gadolinite"],
  40: ["Zircon (ZrSiO₄)","Baddeleyite","Ilmenite (trace)"],
  41: ["Columbite-tantalite","Pyrochlore"],
  42: ["Molybdenite (MoS₂)","Wulfenite","Powellite"],
  43: ["Artificial (nuclear reactors)","Uranium (trace)"],
  44: ["Laurite","Pentlandite (trace)","Platinum ores"],
  45: ["Sperrylite","Cu-Ni ore (trace)"],
  46: ["Sperrylite (trace)","Niobium (trace)","Cu-Ni ores"],
  47: ["Native silver","Argentite (Ag₂S)","Seawater (trace)"],
  48: ["Greenockite (CdS)","Sphalerite (trace)","Coal"],
  49: ["Sphalerite (trace)","Boehmite (trace)"],
  50: ["Cassiterite (SnO₂)","Stannite"],
  51: ["Stibnite (Sb₂S₃)","Valentinite"],
  52: ["Calaverite (AuTe₂)","Lead telluride","Sulfur (trace)"],
  53: ["Iodargyrite (AgI)","Seawater","Marine algae"],
  54: ["Atmosphere (87 ppb)","Natural gas (trace)"],
  // ── Period 6 ──
  55: ["Pollucite (Cs,Na)₂Al₂Si₄O₁₂","Seawater (trace)"],
  56: ["Baryte (BaSO₄)","Witherite (BaCO₃)"],
  57: ["Monazite","Bastnäsite","Apatite (trace)"],
  72: ["Zircon (ZrSiO₄, trace)","Baddeleyite"],
  73: ["Columbite-tantalite (coltan)"],
  74: ["Wolframite","Scheelite (CaWO₄)"],
  75: ["Gadolinite (trace)","Molybdenite (trace)"],
  76: ["Osmiridium","Platinum ore (trace)"],
  77: ["Iridarsenite","Platinum ore (trace)"],
  78: ["Native platinum","Sperrylite (PtAs₂)","Cooperite"],
  79: ["Native gold","Calaverite (AuTe₂)","Seawater (trace)"],
  80: ["Cinnabar (HgS)","Metacinnabar","Volcanic deposits"],
  81: ["Crookesite","Hutchinsonite","Pyrites (trace)"],
  82: ["Galena (PbS)","Anglesite","Cerussite"],
  83: ["Bismuthinite (Bi₂S₃)","Native bismuth","Silver (trace)"],
  84: ["Decay of Rn and Ra","Uranium (trace)"],
  85: ["Decay of Ra and Ac","Uranium (trace)"],
  86: ["Radium decay","Soil and rocks","Indoor air"],
  // ── Period 7 ──
  87: ["Ac-227 decay","Uranium (single-atom trace)"],
  88: ["Pitchblende","Carnotite","Uranium decay"],
  89: ["Pitchblende (trace)","Uranium decay"],
  90: ["Monazite (3-9%)","Thortveitite","Monazitic beach sands"],
  91: ["Pitchblende (trace)","Carnotite"],
  92: ["Native uranium","Pitchblende (UO₂)","Carnotite"],
  93: ["Nuclear reactors (byproduct)","Uranium (trace)"],
  94: ["Nuclear reactors","Nuclear explosions (historical trace)"],
  95: ["Nuclear reactors (artificial synthesis)"],
  96: ["Synthesis in reactors / accelerators"],
  97: ["Synthesis in particle accelerators"],
  98: ["Synthesis in nuclear reactors"],
  99: ["Nuclear explosion (discovery)","Synthesis in reactors"],
  100: ["Synthesis in particle accelerators"],
  101: ["Synthesis in particle accelerators"],
  102: ["Synthesis in particle accelerators"],
  103: ["Synthesis in particle accelerators"],
  // Transactinides
  104: ["Synthesis in accelerators (JINR/GSI)"],
  105: ["Synthesis in particle accelerators"],
  106: ["Synthesis in accelerators (LBNL/JINR)"],
  107: ["Synthesis at GSI, Darmstadt (Germany)"],
  108: ["Synthesis at GSI, Darmstadt (Germany)"],
  109: ["Synthesis at GSI, Darmstadt (Germany)"],
  110: ["Synthesis at GSI, Darmstadt (Germany)"],
  111: ["Synthesis at GSI, Darmstadt (Germany)"],
  112: ["Synthesis at GSI, Darmstadt (Germany)"],
  113: ["Synthesis at RIKEN, Japan"],
  114: ["Synthesis at JINR, Dubna (Russia)"],
  115: ["Synthesis at JINR / LLNL"],
  116: ["Synthesis at JINR, Dubna (Russia)"],
  117: ["Synthesis at JINR / ORNL (2010)"],
  118: ["Synthesis at JINR, Dubna (Russia, 2002)"],
  // ── Lanthanides ──
  58: ["Monazite","Bastnäsite","Cerite"],
  59: ["Monazite","Bastnäsite"],
  60: ["Monazite","Bastnäsite"],
  61: ["Artificial — uranium and neutron decay"],
  62: ["Monazite","Bastnäsite","Xenotime"],
  63: ["Monazite","Bastnäsite"],
  64: ["Monazite","Gadolinite","Bastnäsite"],
  65: ["Xenotime","Gadolinite","Monazite"],
  66: ["Xenotime","Monazite"],
  67: ["Monazite","Gadolinite (trace)"],
  68: ["Xenotime","Euxenite","Gadolinite"],
  69: ["Xenotime (trace)","Gadolinite (trace)"],
  70: ["Xenotime","Euxenite","Gadolinite"],
  71: ["Xenotime","Monazite (trace)"]
};

// Discoverer label translations: most "disc" values are personal names that
// don't need translating. Only a couple of generic labels do.
const _DISC_EN = {
  'Antiguidade': 'Antiquity'
};

// ── Resolution helpers ─────────────────────────────────────────────
// These read window.I18N to pick the active language. If I18N is absent or
// the language is not 'en', they return the original Portuguese value, so
// pages that don't load this overlay continue to work unchanged.

function _isEn() {
  return !!(window.I18N && window.I18N.lang === 'en');
}

function elDesc(el) {
  if (!el) return '';
  if (_isEn() && _DESC_EN[el.z]) return _DESC_EN[el.z];
  return el.desc || '';
}

function elDisc(el) {
  if (!el) return '';
  if (_isEn() && _DISC_EN[el.disc]) return _DISC_EN[el.disc];
  return el.disc || '';
}

function elFunfact(z) {
  if (_isEn() && _FUNFACT_EN[z]) return _FUNFACT_EN[z];
  var ex2 = (typeof getExtra2 === 'function') ? getExtra2(z) : null;
  return ex2 ? (ex2.funfact || '') : '';
}

function elApps(z) {
  if (_isEn() && _APPS_EN[z]) return _APPS_EN[z];
  var ex = (typeof getExtra === 'function') ? getExtra(z) : null;
  return ex ? (ex.apps || []) : [];
}

function elOccurrence(z) {
  if (_isEn() && _OCCURRENCE_EN[z]) return _OCCURRENCE_EN[z];
  var ex2 = (typeof getExtra2 === 'function') ? getExtra2(z) : null;
  return ex2 ? (ex2.occurrence || []) : [];
}
