// ───────────────────────────────────────────────────────────────────
// Atomurus — Shared element data layer
// Used by periodic-table.html and any other page that needs element data.
// Single source of truth: do NOT duplicate this data elsewhere.
// ───────────────────────────────────────────────────────────────────
// ── ELEMENTS ────────────────────────────────────────────────────
const ELEMENTS = [
  {z:1, sym:"H", name:"Hidrogênio", mass:"1.008", cat:"nonmetal", col:1, row:1, en:2.2, state:"Gasoso", period:1, group:1, disc:"Cavendish", year:1766, desc:"O elemento mais abundante do universo, essencial para a vida e combustível do futuro."},
  {z:2, sym:"He", name:"Hélio", mass:"4.0026", cat:"noble", col:18, row:1, en:"—", state:"Gasoso", period:1, group:18, disc:"Lockyer / Janssen", year:1868, desc:"Gás nobre inerte, segundo elemento mais leve, usado em balões e criogenia."},
  {z:3, sym:"Li", name:"Lítio", mass:"6.94", cat:"alkali", col:1, row:2, en:0.98, state:"Sólido", period:2, group:1, disc:"Arfwedson", year:1817, desc:"Um metal alcalino macio e de cor branca prateada, o metal mais leve e o elemento sólido menos denso."},
  {z:4, sym:"Be", name:"Berílio", mass:"9.0122", cat:"alkaline", col:2, row:2, en:1.57, state:"Sólido", period:2, group:2, disc:"Vauquelin", year:1798, desc:"Metal alcalino-terroso rígido e leve, usado em ligas aeroespaciais e janelas de raio-X."},
  {z:5, sym:"B", name:"Boro", mass:"10.81", cat:"metalloid", col:13, row:2, en:2.04, state:"Sólido", period:2, group:13, disc:"Gay-Lussac", year:1808, desc:"Metaloide com propriedades únicas, essencial em vidros borossilicatos e semicondutores."},
  {z:6, sym:"C", name:"Carbono", mass:"12.011", cat:"polyatomic", col:14, row:2, en:2.55, state:"Sólido", period:2, group:14, disc:"Antiguidade", year:"Antiguidade", desc:"A base da química orgânica e de toda vida conhecida, existindo como grafite, diamante e grafeno."},
  {z:7, sym:"N", name:"Nitrogênio", mass:"14.007", cat:"nonmetal", col:15, row:2, en:3.04, state:"Gasoso", period:2, group:15, disc:"Rutherford", year:1772, desc:"Compõe 78% da atmosfera terrestre, fundamental para proteínas e ácidos nucleicos."},
  {z:8, sym:"O", name:"Oxigênio", mass:"15.999", cat:"nonmetal", col:16, row:2, en:3.44, state:"Gasoso", period:2, group:16, disc:"Priestley", year:1771, desc:"Essencial para a respiração e combustão, terceiro elemento mais abundante do universo."},
  {z:9, sym:"F", name:"Flúor", mass:"18.998", cat:"nonmetal", col:17, row:2, en:3.98, state:"Gasoso", period:2, group:17, disc:"Moissan", year:1886, desc:"O elemento mais eletronegativo e reativo, usado em pasta de dente e teflon."},
  {z:10, sym:"Ne", name:"Neônio", mass:"20.18", cat:"noble", col:18, row:2, en:"—", state:"Gasoso", period:2, group:18, disc:"Ramsay / Travers", year:1898, desc:"Gás nobre famoso pelas luzes vermelhas de néon, extraído do ar atmosférico."},
  {z:11, sym:"Na", name:"Sódio", mass:"22.99", cat:"alkali", col:1, row:3, en:0.93, state:"Sólido", period:3, group:1, disc:"Davy", year:1807, desc:"Metal alcalino macio que reage violentamente com água, essencial em sal de cozinha (NaCl)."},
  {z:12, sym:"Mg", name:"Magnésio", mass:"24.305", cat:"alkaline", col:2, row:3, en:1.31, state:"Sólido", period:3, group:2, disc:"Black", year:1755, desc:"Metal leve e resistente usado em ligas de alumínio, central na clorofila das plantas."},
  {z:13, sym:"Al", name:"Alumínio", mass:"26.982", cat:"posttrans", col:13, row:3, en:1.61, state:"Sólido", period:3, group:13, disc:"Oersted", year:1825, desc:"Metal mais abundante na crosta terrestre, leve e resistente à corrosão."},
  {z:14, sym:"Si", name:"Silício", mass:"28.086", cat:"metalloid", col:14, row:3, en:1.9, state:"Sólido", period:3, group:14, disc:"Berzelius", year:1824, desc:"Metaloide base da eletrônica moderna, segundo elemento mais abundante na crosta terrestre."},
  {z:15, sym:"P", name:"Fósforo", mass:"30.974", cat:"polyatomic", col:15, row:3, en:2.19, state:"Sólido", period:3, group:15, disc:"Brand", year:1669, desc:"Essencial para DNA, RNA e ATP, encontrado em ossos e fertilizantes agrícolas."},
  {z:16, sym:"S", name:"Enxofre", mass:"32.06", cat:"polyatomic", col:16, row:3, en:2.58, state:"Sólido", period:3, group:16, disc:"Antiguidade", year:"Antiguidade", desc:"Não-metal poliatômico amarelo, usado na fabricação de ácido sulfúrico e borracha vulcanizada."},
  {z:17, sym:"Cl", name:"Cloro", mass:"35.45", cat:"nonmetal", col:17, row:3, en:3.16, state:"Gasoso", period:3, group:17, disc:"Scheele", year:1774, desc:"Halogênio usado na purificação de água e fabricação de PVC e desinfetantes."},
  {z:18, sym:"Ar", name:"Argônio", mass:"39.948", cat:"noble", col:18, row:3, en:"—", state:"Gasoso", period:3, group:18, disc:"Ramsay / Rayleigh", year:1894, desc:"Terceiro gás mais abundante na atmosfera, usado em soldagem e lâmpadas incandescentes."},
  {z:19, sym:"K", name:"Potássio", mass:"39.098", cat:"alkali", col:1, row:4, en:0.82, state:"Sólido", period:4, group:1, disc:"Davy", year:1807, desc:"Metal alcalino essencial para a função celular e nervosa, abundante em bananas."},
  {z:20, sym:"Ca", name:"Cálcio", mass:"40.078", cat:"alkaline", col:2, row:4, en:1, state:"Sólido", period:4, group:2, disc:"Davy", year:1808, desc:"Metal alcalino-terroso fundamental para ossos, dentes e sinalização celular."},
  {z:21, sym:"Sc", name:"Escândio", mass:"44.956", cat:"transition", col:3, row:4, en:1.36, state:"Sólido", period:4, group:3, disc:"Nilson", year:1879, desc:"Metal de transição raro usado em ligas de alumínio para equipamentos esportivos."},
  {z:22, sym:"Ti", name:"Titânio", mass:"47.867", cat:"transition", col:4, row:4, en:1.54, state:"Sólido", period:4, group:4, disc:"Gregor", year:1791, desc:"Metal leve, resistente e biocompatível, essencial na aeronáutica e implantes médicos."},
  {z:23, sym:"V", name:"Vanádio", mass:"50.942", cat:"transition", col:5, row:4, en:1.63, state:"Sólido", period:4, group:5, disc:"Del Río", year:1801, desc:"Metal de transição com múltiplos estados de oxidação, usado em ligas de aço de alta resistência."},
  {z:24, sym:"Cr", name:"Cromo", mass:"51.996", cat:"transition", col:6, row:4, en:1.66, state:"Sólido", period:4, group:6, disc:"Vauquelin", year:1798, desc:"Metal duro e lustroso que confere resistência à corrosão no aço inoxidável."},
  {z:25, sym:"Mn", name:"Manganês", mass:"54.938", cat:"transition", col:7, row:4, en:1.55, state:"Sólido", period:4, group:7, disc:"Gahn", year:1774, desc:"Metal essencial na produção de aço e em processos enzimáticos biológicos."},
  {z:26, sym:"Fe", name:"Ferro", mass:"55.845", cat:"transition", col:8, row:4, en:1.83, state:"Sólido", period:4, group:8, disc:"Antiguidade", year:"Antiguidade", desc:"O metal mais usado pela humanidade, base da civilização industrial e presente no sangue."},
  {z:27, sym:"Co", name:"Cobalto", mass:"58.933", cat:"transition", col:9, row:4, en:1.88, state:"Sólido", period:4, group:9, disc:"Brandt", year:1735, desc:"Metal de transição usado em ímãs permanentes, superligas e pigmentos azuis."},
  {z:28, sym:"Ni", name:"Níquel", mass:"58.693", cat:"transition", col:10, row:4, en:1.91, state:"Sólido", period:4, group:10, disc:"Cronstedt", year:1751, desc:"Metal resistente à corrosão usado em moedas, baterias e aço inoxidável."},
  {z:29, sym:"Cu", name:"Cobre", mass:"63.546", cat:"transition", col:11, row:4, en:1.9, state:"Sólido", period:4, group:11, disc:"Antiguidade", year:"Antiguidade", desc:"Metal condutor essencial para fiação elétrica, plomagem e ligas como bronze e latão."},
  {z:30, sym:"Zn", name:"Zinco", mass:"65.38", cat:"transition", col:12, row:4, en:1.65, state:"Sólido", period:4, group:12, disc:"Antiguidade", year:1746, desc:"Metal essencial para enzimas, galvanização do aço e suplementos nutricionais."},
  {z:31, sym:"Ga", name:"Gálio", mass:"69.723", cat:"posttrans", col:13, row:4, en:1.81, state:"Sólido", period:4, group:13, disc:"Lecoq de Boisbaudran", year:1875, desc:"Metal que funde na palma da mão (29°C), usado em semicondutores e LEDs."},
  {z:32, sym:"Ge", name:"Germânio", mass:"72.63", cat:"metalloid", col:14, row:4, en:2.01, state:"Sólido", period:4, group:14, disc:"Winkler", year:1886, desc:"Metaloide previsto por Mendeleev, usado em fibras ópticas e transistores."},
  {z:33, sym:"As", name:"Arsênio", mass:"74.922", cat:"metalloid", col:15, row:4, en:2.18, state:"Sólido", period:4, group:15, disc:"Antiguidade", year:1250, desc:"Metaloide tóxico historicamente usado como veneno, hoje em semicondutores III-V."},
  {z:34, sym:"Se", name:"Selênio", mass:"78.971", cat:"polyatomic", col:16, row:4, en:2.55, state:"Sólido", period:4, group:16, disc:"Berzelius", year:1817, desc:"Calcogênio essencial em pequenas quantidades, usado em células solares e fotocopiadoras."},
  {z:35, sym:"Br", name:"Bromo", mass:"79.904", cat:"nonmetal", col:17, row:4, en:2.96, state:"Líquido", period:4, group:17, disc:"Balard", year:1825, desc:"Um dos dois elementos líquidos à temperatura ambiente, halogênio cor de vinho avermelhado."},
  {z:36, sym:"Kr", name:"Criptônio", mass:"83.798", cat:"noble", col:18, row:4, en:"—", state:"Gasoso", period:4, group:18, disc:"Ramsay / Travers", year:1898, desc:"Gás nobre usado em lâmpadas de flash fotográfico e lasers excímeros."},
  {z:37, sym:"Rb", name:"Rubídio", mass:"85.468", cat:"alkali", col:1, row:5, en:0.82, state:"Sólido", period:5, group:1, disc:"Bunsen / Kirchhoff", year:1861, desc:"Metal alcalino altamente reativo, usado em relógios atômicos de precisão."},
  {z:38, sym:"Sr", name:"Estrôncio", mass:"87.62", cat:"alkaline", col:2, row:5, en:0.95, state:"Sólido", period:5, group:2, disc:"Crawford", year:1790, desc:"Metal alcalino-terroso que confere cor vermelha brilhante em fogos de artifício."},
  {z:39, sym:"Y", name:"Ítrio", mass:"88.906", cat:"transition", col:3, row:5, en:1.22, state:"Sólido", period:5, group:3, disc:"Gadolin", year:1794, desc:"Metal de transição usado em ligas de alta resistência e fósforos de TVs."},
  {z:40, sym:"Zr", name:"Zircônio", mass:"91.224", cat:"transition", col:4, row:5, en:1.33, state:"Sólido", period:5, group:4, disc:"Klaproth", year:1789, desc:"Metal resistente ao calor usado em reatores nucleares e cerâmicas dentais."},
  {z:41, sym:"Nb", name:"Nióbio", mass:"92.906", cat:"transition", col:5, row:5, en:1.6, state:"Sólido", period:5, group:5, disc:"Hatchett", year:1801, desc:"Metal supercondutor descoberto no Brasil, essencial em aços para gasodutos e aviação."},
  {z:42, sym:"Mo", name:"Molibdênio", mass:"95.95", cat:"transition", col:6, row:5, en:2.16, state:"Sólido", period:5, group:6, disc:"Scheele", year:1778, desc:"Metal de alto ponto de fusão usado em ligas de aço e cofatores enzimáticos."},
  {z:43, sym:"Tc", name:"Tecnécio", mass:"97", cat:"transition", col:7, row:5, en:1.9, state:"Sólido", period:5, group:7, disc:"Perrier / Segrè", year:1937, desc:"Primeiro elemento produzido artificialmente, usado em diagnósticos de medicina nuclear."},
  {z:44, sym:"Ru", name:"Rutênio", mass:"101.07", cat:"transition", col:8, row:5, en:2.2, state:"Sólido", period:5, group:8, disc:"Klaus", year:1844, desc:"Metal do grupo da platina com alta resistência ao desgaste, usado em contatos elétricos."},
  {z:45, sym:"Rh", name:"Ródio", mass:"102.91", cat:"transition", col:9, row:5, en:2.28, state:"Sólido", period:5, group:9, disc:"Wollaston", year:1803, desc:"Metal nobre raro essencial em catalisadores de conversores catalíticos de automóveis."},
  {z:46, sym:"Pd", name:"Paládio", mass:"106.42", cat:"transition", col:10, row:5, en:2.2, state:"Sólido", period:5, group:10, disc:"Wollaston", year:1803, desc:"Metal nobre usado em conversores catalíticos, joias e componentes eletrônicos."},
  {z:47, sym:"Ag", name:"Prata", mass:"107.87", cat:"transition", col:11, row:5, en:1.93, state:"Sólido", period:5, group:11, disc:"Antiguidade", year:"Antiguidade", desc:"O melhor condutor metálico de eletricidade e calor, usado em joias e fotografia."},
  {z:48, sym:"Cd", name:"Cádmio", mass:"112.41", cat:"transition", col:12, row:5, en:1.69, state:"Sólido", period:5, group:12, disc:"Stromeyer", year:1817, desc:"Metal tóxico usado em baterias Ni-Cd e pigmentos amarelos e vermelhos."},
  {z:49, sym:"In", name:"Índio", mass:"114.82", cat:"posttrans", col:13, row:5, en:1.78, state:"Sólido", period:5, group:13, disc:"Reich / Richter", year:1863, desc:"Metal macio usado em telas sensíveis ao toque (ITO) e soldas de baixo ponto de fusão."},
  {z:50, sym:"Sn", name:"Estanho", mass:"118.71", cat:"posttrans", col:14, row:5, en:1.96, state:"Sólido", period:5, group:14, disc:"Antiguidade", year:"Antiguidade", desc:"Usado desde a Antiguidade em bronze, ainda essencial em soldas eletrônicas e latas."},
  {z:51, sym:"Sb", name:"Antimônio", mass:"121.76", cat:"metalloid", col:15, row:5, en:2.05, state:"Sólido", period:5, group:15, disc:"Antiguidade", year:"Antiguidade", desc:"Metaloide usado desde a Antiguidade, hoje em retardantes de chama e ligas de chumbo."},
  {z:52, sym:"Te", name:"Telúrio", mass:"127.6", cat:"metalloid", col:16, row:5, en:2.1, state:"Sólido", period:5, group:16, disc:"von Reichenstein", year:1782, desc:"Metaloide raro usado em células solares de telureto de cádmio e ligas metálicas."},
  {z:53, sym:"I", name:"Iodo", mass:"126.90", cat:"nonmetal", col:17, row:5, en:2.66, state:"Sólido", period:5, group:17, disc:"Courtois", year:1811, desc:"Halogênio essencial para a tireoide, usado em desinfetantes e contraste para raio-X."},
  {z:54, sym:"Xe", name:"Xenônio", mass:"131.29", cat:"noble", col:18, row:5, en:"—", state:"Gasoso", period:5, group:18, disc:"Ramsay / Travers", year:1898, desc:"Gás nobre pesado usado em propulsores iônicos de satélites e lâmpadas de flash."},
  {z:55, sym:"Cs", name:"Césio", mass:"132.91", cat:"alkali", col:1, row:6, en:0.79, state:"Sólido", period:6, group:1, disc:"Bunsen / Kirchhoff", year:1860, desc:"Metal alcalino mais eletropositivo, base dos relógios atômicos mais precisos do mundo."},
  {z:56, sym:"Ba", name:"Bário", mass:"137.33", cat:"alkaline", col:2, row:6, en:0.89, state:"Sólido", period:6, group:2, disc:"Scheele", year:1808, desc:"Metal alcalino-terroso denso, usado em diagnósticos de raio-X gastrointestinal."},
  {z:57, sym:"La", name:"Lantânio", mass:"138.91", cat:"lanthanide", col:3, row:6, en:1.1, state:"Sólido", period:6, group:3, disc:"Mosander", year:1839, desc:"Primeiro lantanídeo, usado em lentes ópticas de alta qualidade e catalisadores de petróleo."},
  {z:58, sym:"Ce", name:"Cério", mass:"140.12", cat:"lanthanide", col:4, row:9, en:1.12, state:"Sólido", period:6, group:4, disc:"Hisinger / Berzelius", year:1803, desc:"Lantanídeo mais abundante, usado em catalisadores automotivos e vidros especiais."},
  {z:59, sym:"Pr", name:"Praseodímio", mass:"140.91", cat:"lanthanide", col:5, row:9, en:1.13, state:"Sólido", period:6, group:5, disc:"von Welsbach", year:1885, desc:"Lantanídeo usado em ímãs permanentes de alta potência e óculos para soldadores."},
  {z:60, sym:"Nd", name:"Neodímio", mass:"144.24", cat:"lanthanide", col:6, row:9, en:1.14, state:"Sólido", period:6, group:6, disc:"von Welsbach", year:1885, desc:"Componente essencial dos mais fortes ímãs permanentes (Nd-Fe-B) usados em motores elétricos."},
  {z:61, sym:"Pm", name:"Promécio", mass:"145", cat:"lanthanide", col:7, row:9, en:1.13, state:"Sólido", period:6, group:7, disc:"Marinsky / Glendenin", year:1945, desc:"Único lantanídeo sem isótopos estáveis, usado em baterias de marca-passos cardíacos."},
  {z:62, sym:"Sm", name:"Samário", mass:"150.36", cat:"lanthanide", col:8, row:9, en:1.17, state:"Sólido", period:6, group:8, disc:"Lecoq de Boisbaudran", year:1879, desc:"Lantanídeo usado em ímãs permanentes de alta temperatura e na indústria nuclear."},
  {z:63, sym:"Eu", name:"Európio", mass:"151.96", cat:"lanthanide", col:9, row:9, en:"—", state:"Sólido", period:6, group:9, disc:"Demarçay", year:1901, desc:"Lantanídeo que produz luminescência vermelha e azul em telas de TV e notas de euro."},
  {z:64, sym:"Gd", name:"Gadolínio", mass:"157.25", cat:"lanthanide", col:10, row:9, en:1.2, state:"Sólido", period:6, group:10, disc:"de Marignac", year:1880, desc:"Lantanídeo paramagnético, usado como agente de contraste em ressonâncias magnéticas."},
  {z:65, sym:"Tb", name:"Térbio", mass:"158.93", cat:"lanthanide", col:11, row:9, en:"—", state:"Sólido", period:6, group:11, disc:"Mosander", year:1843, desc:"Lantanídeo verde em fósforos de lâmpadas fluorescentes e telas de alta definição."},
  {z:66, sym:"Dy", name:"Disprósio", mass:"162.5", cat:"lanthanide", col:12, row:9, en:1.22, state:"Sólido", period:6, group:12, disc:"Lecoq de Boisbaudran", year:1886, desc:"Lantanídeo com o maior momento magnético, essencial em ímãs de turbinas eólicas."},
  {z:67, sym:"Ho", name:"Hólmio", mass:"164.93", cat:"lanthanide", col:13, row:9, en:1.23, state:"Sólido", period:6, group:13, disc:"Cleve", year:1878, desc:"Lantanídeo com propriedades magnéticas excepcionais, usado em lasers médicos."},
  {z:68, sym:"Er", name:"Érbio", mass:"167.26", cat:"lanthanide", col:14, row:9, en:1.24, state:"Sólido", period:6, group:14, disc:"Mosander", year:1843, desc:"Lantanídeo que amplifica sinais em fibras ópticas de telecomunicações de longa distância."},
  {z:69, sym:"Tm", name:"Túlio", mass:"168.93", cat:"lanthanide", col:15, row:9, en:1.25, state:"Sólido", period:6, group:15, disc:"Cleve", year:1879, desc:"Lantanídeo mais raro, usado em lasers cirúrgicos e fontes portáteis de raio-X."},
  {z:70, sym:"Yb", name:"Itérbio", mass:"173.04", cat:"lanthanide", col:16, row:9, en:"—", state:"Sólido", period:6, group:16, disc:"de Marignac", year:1878, desc:"Lantanídeo usado nos relógios atômicos de maior precisão e em ligas de aço inoxidável."},
  {z:71, sym:"Lu", name:"Lutécio", mass:"174.9668", cat:"lanthanide", col:17, row:9, en:1.27, state:"Sólido", period:6, group:17, disc:"Urbain", year:1907, desc:"Lantanídeo mais denso e duro, usado em detectores de tomografia por emissão de pósitrons."},
  {z:72, sym:"Hf", name:"Háfnio", mass:"178.486", cat:"transition", col:4, row:6, en:1.3, state:"Sólido", period:6, group:4, disc:"Coster / Hevesy", year:1923, desc:"Metal de transição usado em barras de controle de reatores nucleares e microprocessadores."},
  {z:73, sym:"Ta", name:"Tântalo", mass:"180.95", cat:"transition", col:5, row:6, en:1.5, state:"Sólido", period:6, group:5, disc:"Ekeberg", year:1802, desc:"Metal biocompatível de alto ponto de fusão, essencial em capacitores eletrônicos."},
  {z:74, sym:"W", name:"Tungstênio", mass:"183.84", cat:"transition", col:6, row:6, en:2.36, state:"Sólido", period:6, group:6, disc:"d'Elhuyar", year:1783, desc:"Metal com o maior ponto de fusão de todos os elementos, usado em filamentos de lâmpadas."},
  {z:75, sym:"Re", name:"Rênio", mass:"186.21", cat:"transition", col:7, row:6, en:1.9, state:"Sólido", period:6, group:7, disc:"Noddack / Berg", year:1925, desc:"Um dos metais mais raros, com alto ponto de fusão, usado em turbinas de aviões a jato."},
  {z:76, sym:"Os", name:"Ósmio", mass:"190.23", cat:"transition", col:8, row:6, en:2.2, state:"Sólido", period:6, group:8, disc:"Tennant", year:1803, desc:"O metal natural mais denso, do grupo da platina, resistente a desgaste extremo."},
  {z:77, sym:"Ir", name:"Irídio", mass:"192.22", cat:"transition", col:9, row:6, en:2.2, state:"Sólido", period:6, group:9, disc:"Tennant", year:1803, desc:"Segundo metal mais denso, extremamente resistente à corrosão, usado em crucibles de alta temperatura."},
  {z:78, sym:"Pt", name:"Platina", mass:"195.08", cat:"transition", col:10, row:6, en:2.28, state:"Sólido", period:6, group:10, disc:"Ulloa", year:1748, desc:"Metal precioso usado em joias, catalisadores automotivos e eletrodos médicos."},
  {z:79, sym:"Au", name:"Ouro", mass:"196.97", cat:"transition", col:11, row:6, en:2.54, state:"Sólido", period:6, group:11, disc:"Antiguidade", year:"Antiguidade", desc:"O metal mais maleável e dúctil, símbolo de valor e riqueza ao longo da história humana."},
  {z:80, sym:"Hg", name:"Mercúrio", mass:"200.59", cat:"transition", col:12, row:6, en:2, state:"Líquido", period:6, group:12, disc:"Antiguidade", year:"Antiguidade", desc:"Um dos dois elementos líquidos à temperatura ambiente, tóxico e usado em termômetros."},
  {z:81, sym:"Tl", name:"Tálio", mass:"204.38", cat:"posttrans", col:13, row:6, en:1.62, state:"Sólido", period:6, group:13, disc:"Crookes", year:1861, desc:"Metal tóxico macio, historicamente usado como raticida, hoje em detectores de radiação."},
  {z:82, sym:"Pb", name:"Chumbo", mass:"207.2", cat:"posttrans", col:14, row:6, en:2.33, state:"Sólido", period:6, group:14, disc:"Antiguidade", year:"Antiguidade", desc:"Metal denso usado desde Roma em tubos d'água, hoje em baterias de chumbo-ácido."},
  {z:83, sym:"Bi", name:"Bismuto", mass:"208.98", cat:"posttrans", col:15, row:6, en:2.02, state:"Sólido", period:6, group:15, disc:"Antiguidade", year:1753, desc:"Metal pesado de baixa toxicidade, substituto do chumbo em munições e pigmentos."},
  {z:84, sym:"Po", name:"Polônio", mass:"209", cat:"metalloid", col:16, row:6, en:2, state:"Sólido", period:6, group:16, disc:"Marie Curie", year:1898, desc:"Elemento radioativo descoberto por Marie Curie, nomeado em honra à Polônia."},
  {z:85, sym:"At", name:"Ástato", mass:"210", cat:"nonmetal", col:17, row:6, en:2.2, state:"Sólido", period:6, group:17, disc:"Corson / MacKenzie", year:1940, desc:"Halogênio mais pesado e raro, altamente radioativo, investigado em radioterapia."},
  {z:86, sym:"Rn", name:"Radônio", mass:"222", cat:"noble", col:18, row:6, en:"—", state:"Gasoso", period:6, group:18, disc:"Dorn", year:1900, desc:"Gás nobre radioativo, segundo maior fator de risco para câncer de pulmão após o tabagismo."},
  {z:87, sym:"Fr", name:"Frâncio", mass:"223", cat:"alkali", col:1, row:7, en:0.79, state:"Sólido", period:7, group:1, disc:"Perey", year:1939, desc:"Metal alcalino altamente radioativo, o elemento natural mais instável e raro da Terra."},
  {z:88, sym:"Ra", name:"Rádio", mass:"226", cat:"alkaline", col:2, row:7, en:0.9, state:"Sólido", period:7, group:2, disc:"Marie / Pierre Curie", year:1898, desc:"Metal alcalino-terroso radioativo, descoberto pelos Curies, usado historicamente em radioterapia."},
  {z:89, sym:"Ac", name:"Actínio", mass:"227", cat:"actinide", col:3, row:7, en:1.1, state:"Sólido", period:7, group:3, disc:"Debierne", year:1899, desc:"Primeiro actinídeo, altamente radioativo, usado em geradores termoelétricos e pesquisa."},
  {z:90, sym:"Th", name:"Tório", mass:"232.04", cat:"actinide", col:4, row:10, en:1.3, state:"Sólido", period:7, group:4, disc:"Berzelius", year:1829, desc:"Actinídeo radioativo com potencial como combustível nuclear mais abundante que o urânio."},
  {z:91, sym:"Pa", name:"Protactínio", mass:"231.04", cat:"actinide", col:5, row:10, en:1.5, state:"Sólido", period:7, group:5, disc:"Hahn / Meitner", year:1913, desc:"Actinídeo altamente radioativo e tóxico, precursor do urânio-233 em ciclos de combustível nuclear."},
  {z:92, sym:"U", name:"Urânio", mass:"238.03", cat:"actinide", col:6, row:10, en:1.38, state:"Sólido", period:7, group:6, disc:"Klaproth", year:1789, desc:"Metal radioativo base da energia nuclear, cujo isótopo U-235 fissiona em reatores e bombas."},
  {z:93, sym:"Np", name:"Netúnio", mass:"237", cat:"actinide", col:7, row:10, en:1.36, state:"Sólido", period:7, group:7, disc:"McMillan / Abelson", year:1940, desc:"Primeiro elemento transurânico sintético, subproduto de reatores nucleares de urânio."},
  {z:94, sym:"Pu", name:"Plutônio", mass:"244", cat:"actinide", col:8, row:10, en:1.28, state:"Sólido", period:7, group:8, disc:"Seaborg et al.", year:1940, desc:"Actinídeo fissível usado em bombas nucleares e como combustível em reatores de geração IV."},
  {z:95, sym:"Am", name:"Amerício", mass:"243", cat:"actinide", col:9, row:10, en:1.3, state:"Sólido", period:7, group:9, disc:"Seaborg et al.", year:1944, desc:"Actinídeo sintético presente em detectores de fumaça domésticos (Am-241)."},
  {z:96, sym:"Cm", name:"Cúrio", mass:"247", cat:"actinide", col:10, row:10, en:1.3, state:"Sólido", period:7, group:10, disc:"Seaborg et al.", year:1944, desc:"Actinídeo nomeado em homenagem a Marie e Pierre Curie, usado em fontes de energia espacial."},
  {z:97, sym:"Bk", name:"Berquélio", mass:"247", cat:"actinide", col:11, row:10, en:1.3, state:"Sólido", period:7, group:11, disc:"Seaborg et al.", year:1949, desc:"Actinídeo sintético nomeado em homenagem à cidade de Berkeley, Califórnia."},
  {z:98, sym:"Cf", name:"Califórnio", mass:"251", cat:"actinide", col:12, row:10, en:1.3, state:"Sólido", period:7, group:12, disc:"Seaborg et al.", year:1950, desc:"Actinídeo sintético altamente radioativo, usado em medições de poços de petróleo."},
  {z:99, sym:"Es", name:"Einstênio", mass:"252", cat:"actinide", col:13, row:10, en:1.3, state:"Sólido", period:7, group:13, disc:"Ghiorso et al.", year:1952, desc:"Actinídeo nomeado em homenagem a Albert Einstein, encontrado após teste nuclear."},
  {z:100, sym:"Fm", name:"Férmio", mass:"257", cat:"actinide", col:14, row:10, en:1.3, state:"Sólido", period:7, group:14, disc:"Ghiorso et al.", year:1952, desc:"Actinídeo nomeado em homenagem ao físico Enrico Fermi, produzido em aceleradores."},
  {z:101, sym:"Md", name:"Mendelévio", mass:"258", cat:"actinide", col:15, row:10, en:1.3, state:"Sólido", period:7, group:15, disc:"Ghiorso et al.", year:1955, desc:"Actinídeo nomeado em homenagem a Dmitri Mendeleev, criador da tabela periódica."},
  {z:102, sym:"No", name:"Nobélio", mass:"259", cat:"actinide", col:16, row:10, en:1.3, state:"Sólido", period:7, group:16, disc:"Dubna / Nobel Inst.", year:1958, desc:"Actinídeo nomeado em homenagem a Alfred Nobel e ao Instituto Nobel de Física."},
  {z:103, sym:"Lr", name:"Laurêncio", mass:"266", cat:"actinide", col:17, row:10, en:1.3, state:"Sólido", period:7, group:17, disc:"Ghiorso et al.", year:1961, desc:"Último actinídeo e último elemento dos metais f, nomeado em homenagem a Ernest Lawrence."},
  {z:104, sym:"Rf", name:"Rutherfórdio", mass:"267", cat:"transition", col:4, row:7, en:"—", state:"Sólido", period:7, group:4, disc:"Dubna / Berkeley", year:1964, desc:"Elemento sintético superpesado, o mais leve dos elementos transactinídeos."},
  {z:105, sym:"Db", name:"Dúbnio", mass:"268", cat:"transition", col:5, row:7, en:"—", state:"Sólido", period:7, group:5, disc:"Dubna / Berkeley", year:1968, desc:"Elemento sintético superpesado nomeado em homenagem à cidade de Dubna, Rússia."},
  {z:106, sym:"Sg", name:"Seabórgio", mass:"269", cat:"transition", col:6, row:7, en:"—", state:"Sólido", period:7, group:6, disc:"Berkeley", year:1974, desc:"Elemento sintético nomeado em homenagem ao físico Glenn T. Seaborg."},
  {z:107, sym:"Bh", name:"Bóhrio", mass:"270", cat:"transition", col:7, row:7, en:"—", state:"Sólido", period:7, group:7, disc:"GSI", year:1981, desc:"Elemento sintético nomeado em homenagem ao físico dinamarquês Niels Bohr."},
  {z:108, sym:"Hs", name:"Hássio", mass:"271", cat:"transition", col:8, row:7, en:"—", state:"Sólido", period:7, group:8, disc:"GSI", year:1984, desc:"Elemento sintético nomeado em homenagem ao estado alemão de Hesse."},
  {z:109, sym:"Mt", name:"Meitnério", mass:"278", cat:"transition", col:9, row:7, en:"—", state:"Sólido", period:7, group:9, disc:"GSI", year:1982, desc:"Elemento sintético nomeado em homenagem à física austríaca Lise Meitner."},
  {z:110, sym:"Ds", name:"Darmstádtio", mass:"281", cat:"transition", col:10, row:7, en:"—", state:"Sólido", period:7, group:10, disc:"GSI", year:1994, desc:"Elemento sintético nomeado em homenagem à cidade de Darmstadt, Alemanha."},
  {z:111, sym:"Rg", name:"Roentgênio", mass:"282", cat:"transition", col:11, row:7, en:"—", state:"Sólido", period:7, group:11, disc:"GSI", year:1994, desc:"Elemento sintético nomeado em homenagem ao físico Wilhelm Röntgen."},
  {z:112, sym:"Cn", name:"Copernício", mass:"285", cat:"transition", col:12, row:7, en:"—", state:"Gasoso", period:7, group:12, disc:"GSI", year:1996, desc:"Elemento sintético nomeado em homenagem ao astrônomo Nicolau Copérnico."},
  {z:113, sym:"Nh", name:"Nihônio", mass:"286", cat:"posttrans", col:13, row:7, en:"—", state:"Sólido", period:7, group:13, disc:"RIKEN", year:2004, desc:"Primeiro elemento descoberto na Ásia, nomeado em homenagem ao Japão (Nihon)."},
  {z:114, sym:"Fl", name:"Fleróvio", mass:"289", cat:"posttrans", col:14, row:7, en:"—", state:"Gasoso", period:7, group:14, disc:"Dubna", year:1998, desc:"Elemento sintético superpesado nomeado em homenagem ao Laboratório Flerov de Dubna."},
  {z:115, sym:"Mc", name:"Moscóvio", mass:"290", cat:"posttrans", col:15, row:7, en:"—", state:"Sólido", period:7, group:15, disc:"Dubna / Livermore", year:2003, desc:"Elemento sintético nomeado em homenagem à região de Moscou, Rússia."},
  {z:116, sym:"Lv", name:"Livermório", mass:"293", cat:"posttrans", col:16, row:7, en:"—", state:"Sólido", period:7, group:16, disc:"Dubna / Livermore", year:2000, desc:"Elemento sintético nomeado em homenagem ao Laboratório Nacional Lawrence Livermore."},
  {z:117, sym:"Ts", name:"Tenesso", mass:"294", cat:"nonmetal", col:17, row:7, en:"—", state:"Sólido", period:7, group:17, disc:"Dubna / Livermore", year:2010, desc:"Elemento sintético nomeado em homenagem ao estado norte-americano do Tennessee."},
  {z:118, sym:"Og", name:"Oganessônio", mass:"294", cat:"noble", col:18, row:7, en:"—", state:"Sólido", period:7, group:18, disc:"Dubna / Livermore", year:2002, desc:"O elemento mais pesado confirmado, nomeado em homenagem ao físico Yuri Oganessian."},
];

// ── ElNames ─────────────────────────────────────────────────────
// Element names: EN and ES (index = Z-1)
const _elNamesEN = ['Hydrogen','Helium','Lithium','Beryllium','Boron','Carbon','Nitrogen','Oxygen','Fluorine','Neon','Sodium','Magnesium','Aluminium','Silicon','Phosphorus','Sulfur','Chlorine','Argon','Potassium','Calcium','Scandium','Titanium','Vanadium','Chromium','Manganese','Iron','Cobalt','Nickel','Copper','Zinc','Gallium','Germanium','Arsenic','Selenium','Bromine','Krypton','Rubidium','Strontium','Yttrium','Zirconium','Niobium','Molybdenum','Technetium','Ruthenium','Rhodium','Palladium','Silver','Cadmium','Indium','Tin','Antimony','Tellurium','Iodine','Xenon','Cesium','Barium','Lanthanum','Cerium','Praseodymium','Neodymium','Promethium','Samarium','Europium','Gadolinium','Terbium','Dysprosium','Holmium','Erbium','Thulium','Ytterbium','Lutetium','Hafnium','Tantalum','Tungsten','Rhenium','Osmium','Iridium','Platinum','Gold','Mercury','Thallium','Lead','Bismuth','Polonium','Astatine','Radon','Francium','Radium','Actinium','Thorium','Protactinium','Uranium','Neptunium','Plutonium','Americium','Curium','Berkelium','Californium','Einsteinium','Fermium','Mendelevium','Nobelium','Lawrencium','Rutherfordium','Dubnium','Seaborgium','Bohrium','Hassium','Meitnerium','Darmstadtium','Roentgenium','Copernicium','Nihonium','Flerovium','Moscovium','Livermorium','Tennessine','Oganesson'];
const _elNamesES = ['Hidrógeno','Helio','Litio','Berilio','Boro','Carbono','Nitrógeno','Oxígeno','Flúor','Neón','Sodio','Magnesio','Aluminio','Silicio','Fósforo','Azufre','Cloro','Argón','Potasio','Calcio','Escandio','Titanio','Vanadio','Cromo','Manganeso','Hierro','Cobalto','Níquel','Cobre','Zinc','Galio','Germanio','Arsénico','Selenio','Bromo','Criptón','Rubidio','Estroncio','Itrio','Circonio','Niobio','Molibdeno','Tecnecio','Rutenio','Rodio','Paladio','Plata','Cadmio','Indio','Estaño','Antimonio','Telurio','Yodo','Xenón','Cesio','Bario','Lantano','Cerio','Praseodimio','Neodimio','Prometio','Samario','Europio','Gadolinio','Terbio','Disprosio','Holmio','Erbio','Tulio','Iterbio','Lutecio','Hafnio','Tantalio','Tungsteno','Renio','Osmio','Iridio','Platino','Oro','Mercurio','Talio','Plomo','Bismuto','Polonio','Astato','Radón','Francio','Radio','Actinio','Torio','Protactinio','Uranio','Neptunio','Plutonio','Americio','Curio','Berkelio','Californio','Einstenio','Fermio','Mendelevio','Nobelio','Lawrencio','Rutherfordio','Dubnio','Seaborgio','Bohrio','Hasio','Meitnerio','Darmstadtio','Roentgenio','Copernicio','Nihonio','Flerovio','Moscovio','Livermorio','Teneso','Oganesón'];
function elName(el) {
  // Resolve the current language from the global I18N module if available,
  // otherwise fall back to localStorage. Default is 'en' to match i18n.js.
  var lang = (window.I18N && window.I18N.lang) || localStorage.getItem('atomurus-lang') || 'en';
  if (lang === 'en') return _elNamesEN[el.z - 1] || el.name;
  if (lang === 'es') return _elNamesES[el.z - 1] || el.name;
  return el.name;
}

// Category and state translation helpers. They delegate to I18N when present
// (so the toggle re-renders correctly); when I18N is absent (e.g. on a static
// preview), they fall back to the legacy Portuguese CAT_NAMES below.
function catName(el) {
  if (!el || !el.cat) return '';
  if (window.I18N) {
    var key = 'ptable.cat' + el.cat.charAt(0).toUpperCase() + el.cat.slice(1);
    return window.I18N.t(key) || CAT_NAMES[el.cat] || el.cat;
  }
  return CAT_NAMES[el.cat] || el.cat;
}

// el.state stores the raw Portuguese value ('Sólido', 'Líquido', 'Gasoso').
// Map it to a translation key and resolve via I18N.
function stateName(stateValue) {
  if (!stateValue) return '';
  var map = {
    'Sólido':  'ptable.stateSolid',
    'Líquido': 'ptable.stateLiquid',
    'Gasoso':  'ptable.stateGas'
  };
  var key = map[stateValue];
  if (key && window.I18N) return window.I18N.t(key) || stateValue;
  return stateValue;
}

// Single-letter abbreviation of physical state (s/l/g) — used in the
// element card. Same letters in PT and EN. Returns '' for unknown states.
function stateAbbr(stateValue) {
  if (!stateValue) return '';
  var map = { 'Sólido': 's', 'Líquido': 'l', 'Gasoso': 'g' };
  return map[stateValue] || '';
}

// ── CAT_NAMES ───────────────────────────────────────────────────
const CAT_NAMES = {
  nonmetal:   "Não-metal Diatômico",
  noble:      "Gás Nobre",
  alkali:     "Metal Alcalino",
  alkaline:   "Metal Alcalino-Terroso",
  metalloid:  "Metaloide",
  polyatomic: "Não-metal Poliatômico",
  posttrans:  "Metal Pós-Transição",
  transition: "Metal de Transição",
  lanthanide: "Lantanídeo",
  actinide:   "Actinídeo"
};

// ── ELEMENT_LATIN ───────────────────────────────────────────────
const ELEMENT_LATIN = {
  1:'hydrogenium',2:'helium',3:'lithium',4:'beryllium',5:'borium',6:'carboneum',7:'nitrogenium',8:'oxygenium',9:'fluorum',10:'neon',
  11:'natrium',12:'magnesium',13:'aluminium',14:'silicium',15:'phosphorus',16:'sulfur',17:'chlorum',18:'argon',19:'kalium',20:'calcium',
  21:'scandium',22:'titanium',23:'vanadium',24:'chromium',25:'manganum',26:'ferrum',27:'cobaltum',28:'niccolum',29:'cuprum',30:'zincum',
  31:'gallium',32:'germanium',33:'arsenicum',34:'selenium',35:'bromium',36:'krypton',37:'rubidium',38:'strontium',39:'yttrium',40:'zirconium',
  41:'niobium',42:'molybdaenum',43:'technetium',44:'ruthenium',45:'rhodium',46:'palladium',47:'argentum',48:'cadmium',49:'indium',50:'stannum',
  51:'stibium',52:'tellurium',53:'iodum',54:'xenon',55:'caesium',56:'barium',57:'lanthanum',58:'cerium',59:'praseodymium',60:'neodymium',
  61:'promethium',62:'samarium',63:'europium',64:'gadolinium',65:'terbium',66:'dysprosium',67:'holmium',68:'erbium',69:'thulium',70:'ytterbium',
  71:'lutetium',72:'hafnium',73:'tantalum',74:'wolframium',75:'rhenium',76:'osmium',77:'iridium',78:'platinum',79:'aurum',80:'hydrargyrum',
  81:'thallium',82:'plumbum',83:'bismuthum',84:'polonium',85:'astatium',86:'radon',87:'francium',88:'radium',89:'actinium',90:'thorium',
  91:'protactinium',92:'uranium',93:'neptunium',94:'plutonium',95:'americium',96:'curium',97:'berkelium',98:'californium',99:'einsteinium',100:'fermium',
  101:'mendelevium',102:'nobelium',103:'lawrencium',104:'rutherfordium',105:'dubnium',106:'seaborgium',107:'bohrium',108:'hassium',109:'meitnerium',110:'darmstadtium',
  111:'roentgenium',112:'copernicium',113:'nihonium',114:'flerovium',115:'moscovium',116:'livermorium',117:'tennessium',118:'oganesson'
};

// ── EXTRA ───────────────────────────────────────────────────────
// ════════════ EXTRA ELEMENT DATA (COMPLETO — todos os 118 elementos) ════════════
const EXTRA = {
  1: { econfig:"1s¹", shells:[1], melt:"-259.16°C", boil:"-252.879°C", apps:["Combustível de foguetes","células de combustível","refino de petróleo"] },
  2: { econfig:"1s²", shells:[2], melt:"-272.2°C", boil:"-268.928°C", apps:["Balões","dirigíveis","cromatografia","ressonância magnética (resfriamento de supercondutores)"] },
  3: { econfig:"[He] 2s¹", shells:[2,1], melt:"180.5°C", boil:"1342°C", apps:["Baterias de íon-lítio","tratamento de transtorno bipolar","ligas metálicas"] },
  4: { econfig:"[He] 2s²", shells:[2,2], melt:"1287°C", boil:"2469°C", apps:["Ligas leves de alta resistência","janelas de raios-X","componentes nucleares"] },
  5: { econfig:"[He] 2s² 2p¹", shells:[2,3], melt:"2076°C", boil:"3927°C", apps:["Vidro borossilicato (Pyrex)","detergentes","fertilizantes","semicondutores"] },
  6: { econfig:"[He] 2s² 2p²", shells:[2,4], melt:"3550°C", boil:"3825°C", apps:["Combustíveis","plásticos","fibra de carbono","grafite","diamante","eletrônicos"] },
  7: { econfig:"[He] 2s² 2p³", shells:[2,5], melt:"-210°C", boil:"-195.795°C", apps:["Fertilizantes","explosivos","refrigeração criogênica","indústria alimentícia"] },
  8: { econfig:"[He] 2s² 2p⁴", shells:[2,6], melt:"-218.79°C", boil:"-182.962°C", apps:["Respiração","combustão","produção de aço","medicina","foguetes"] },
  9: { econfig:"[He] 2s² 2p⁵", shells:[2,7], melt:"-219.67°C", boil:"-188.11°C", apps:["Pasta de dente","refrigerantes (Freon)","teflon","tratamento de água"] },
  10: { econfig:"[He] 2s² 2p⁶", shells:[2,8], melt:"-248.59°C", boil:"-246.046°C", apps:["Letreiros luminosos","lasers","refrigeração criogênica"] },
  11: { econfig:"[Ne] 3s¹", shells:[2,8,1], melt:"97.794°C", boil:"882.94°C", apps:["Sal de cozinha","soda cáustica","lâmpadas de vapor de sódio","papel"] },
  12: { econfig:"[Ne] 3s²", shells:[2,8,2], melt:"650°C", boil:"1090°C", apps:["Ligas leves (aviação","automóveis)","pirotecnia","suplementos alimentares"] },
  13: { econfig:"[Ne] 3s² 3p¹", shells:[2,8,3], melt:"660.32°C", boil:"2519°C", apps:["Embalagens","aviação","construção civil","eletricidade","panelas"] },
  14: { econfig:"[Ne] 3s² 3p²", shells:[2,8,4], melt:"1414°C", boil:"3265°C", apps:["Semicondutores","chips","painéis solares","vidro","silicone"] },
  15: { econfig:"[Ne] 3s² 3p³", shells:[2,8,5], melt:"44.15°C", boil:"280.5°C", apps:["Fertilizantes","detergentes","explosivos","fósforos"] },
  16: { econfig:"[Ne] 3s² 3p⁴", shells:[2,8,6], melt:"115.21°C", boil:"444.6°C", apps:["Ácido sulfúrico","fertilizantes","borracha vulcanizada","fungicidas"] },
  17: { econfig:"[Ne] 3s² 3p⁵", shells:[2,8,7], melt:"-101.5°C", boil:"-34.04°C", apps:["Desinfetante de água","PVC","solventes","branqueadores"] },
  18: { econfig:"[Ne] 3s² 3p⁶", shells:[2,8,8], melt:"-189.34°C", boil:"-185.848°C", apps:["Soldagem","lâmpadas incandescentes","atmosfera inerte em laboratórios"] },
  19: { econfig:"[Ar] 4s¹", shells:[2,8,8,1], melt:"63.5°C", boil:"759°C", apps:["Fertilizantes","pólvora","sal de cozinha alternativo","medicina"] },
  20: { econfig:"[Ar] 4s²", shells:[2,8,8,2], melt:"842°C", boil:"1484°C", apps:["Cimento","cal","suplementos alimentares","metalurgia"] },
  21: { econfig:"[Ar] 3d¹ 4s²", shells:[2,8,9,2], melt:"1541°C", boil:"2836°C", apps:["Ligas de alumínio-escândio para aeronaves e equipamentos esportivos","lâmpadas de iodeto"] },
  22: { econfig:"[Ar] 3d² 4s²", shells:[2,8,10,2], melt:"1668°C", boil:"3287°C", apps:["Implantes médicos","aviação","naves espaciais","pigmento branco (TiO₂)"] },
  23: { econfig:"[Ar] 3d³ 4s²", shells:[2,8,11,2], melt:"1910°C", boil:"3407°C", apps:["Aço-vanádio para ferramentas","baterias de fluxo redox","catalisadores"] },
  24: { econfig:"[Ar] 3d⁵ 4s¹", shells:[2,8,13,1], melt:"1907°C", boil:"2671°C", apps:["Aço inoxidável","cromagem decorativa","pigmentos","curtimento de couro"] },
  25: { econfig:"[Ar] 3d⁵ 4s²", shells:[2,8,13,2], melt:"1246°C", boil:"2061°C", apps:["Produção de aço","baterias alcalinas","pigmentos","fertilizantes"] },
  26: { econfig:"[Ar] 3d⁶ 4s²", shells:[2,8,14,2], melt:"1538°C", boil:"2861°C", apps:["Aço","construção civil","veículos","eletrodomésticos","hemoglobina"] },
  27: { econfig:"[Ar] 3d⁷ 4s²", shells:[2,8,15,2], melt:"1495°C", boil:"2927°C", apps:["Baterias de lítio-cobalto","superligas","pigmento azul","radioterapia"] },
  28: { econfig:"[Ar] 3d⁸ 4s²", shells:[2,8,16,2], melt:"1455°C", boil:"2913°C", apps:["Aço inoxidável","baterias Ni-MH","moedas","revestimentos"] },
  29: { econfig:"[Ar] 3d¹⁰ 4s¹", shells:[2,8,18,1], melt:"1084.62°C", boil:"2562°C", apps:["Fios elétricos","encanamentos","moedas","ligas (latão","bronze)","eletrônica"] },
  30: { econfig:"[Ar] 3d¹⁰ 4s²", shells:[2,8,18,2], melt:"419.53°C", boil:"907°C", apps:["Galvanização do aço","ligas (latão)","pilhas","suplementos alimentares"] },
  31: { econfig:"[Ar] 3d¹⁰ 4s² 4p¹", shells:[2,8,18,3], melt:"29.7646°C", boil:"2204°C", apps:["LEDs","semicondutores (GaAs","GaN)","painéis solares","termômetros"] },
  32: { econfig:"[Ar] 3d¹⁰ 4s² 4p²", shells:[2,8,18,4], melt:"938.25°C", boil:"2833°C", apps:["Fibra óptica","transistores","painéis solares","visão noturna"] },
  33: { econfig:"[Ar] 3d¹⁰ 4s² 4p³", shells:[2,8,18,5], melt:"817°C", boil:"614°C", apps:["Semicondutores (GaAs)","pesticidas","madeira tratada","medicina"] },
  34: { econfig:"[Ar] 3d¹⁰ 4s² 4p⁴", shells:[2,8,18,6], melt:"220.5°C", boil:"685°C", apps:["Células fotovoltaicas","pigmentos de vidro","suplementos nutricionais","fotocópias"] },
  35: { econfig:"[Ar] 3d¹⁰ 4s² 4p⁵", shells:[2,8,18,7], melt:"-7.2°C", boil:"59°C", apps:["Retardantes de chama","pesticidas","desinfetantes","fotografia analógica"] },
  36: { econfig:"[Ar] 3d¹⁰ 4s² 4p⁶", shells:[2,8,18,8], melt:"-157.38°C", boil:"-153.415°C", apps:["Lâmpadas de flash","lasers","iluminação de alta intensidade"] },
  37: { econfig:"[Kr] 5s¹", shells:[2,8,18,8,1], melt:"39.3°C", boil:"688°C", apps:["Relógios atômicos","células fotoelétricas","pesquisa em física quântica"] },
  38: { econfig:"[Kr] 5s²", shells:[2,8,18,8,2], melt:"777°C", boil:"1382°C", apps:["Fogos de artifício (cor vermelha)","tubos de raios catódicos","implantes ósseos"] },
  39: { econfig:"[Kr] 4d¹ 5s²", shells:[2,8,18,9,2], melt:"1526°C", boil:"3336°C", apps:["LEDs brancos","supercondutores (YBa₂Cu₃O₇)","lasers de YAG","fósforos"] },
  40: { econfig:"[Kr] 4d² 5s²", shells:[2,8,18,10,2], melt:"1855°C", boil:"4409°C", apps:["Reatores nucleares","cerâmicas","jóias artificiais","revestimentos médicos"] },
  41: { econfig:"[Kr] 4d⁴ 5s¹", shells:[2,8,18,12,1], melt:"2477°C", boil:"4744°C", apps:["Aços microligados","supercondutores","aceleradores de partículas"] },
  42: { econfig:"[Kr] 4d⁵ 5s¹", shells:[2,8,18,13,1], melt:"2623°C", boil:"4639°C", apps:["Aços de alta resistência","lubrificantes sólidos","catalisadores industriais"] },
  43: { econfig:"[Kr] 4d⁵ 5s²", shells:[2,8,18,13,2], melt:"2157°C", boil:"4265°C", apps:["Medicina nuclear (diagnóstico por imagem)","pesquisa"] },
  44: { econfig:"[Kr] 4d⁷ 5s¹", shells:[2,8,18,15,1], melt:"2334°C", boil:"4150°C", apps:["Catalisadores","eletronômica (discos rígidos)","eletrodos resistentes"] },
  45: { econfig:"[Kr] 4d⁸ 5s¹", shells:[2,8,18,16,1], melt:"1964°C", boil:"3695°C", apps:["Catalisadores de automóveis (conversores catalíticos)","joalheria","espelhos"] },
  46: { econfig:"[Kr] 4d¹⁰", shells:[2,8,18,18], melt:"1554.9°C", boil:"2963°C", apps:["Catalisadores automotivos","joalheria","eletrônicos","células de combustível"] },
  47: { econfig:"[Kr] 4d¹⁰ 5s¹", shells:[2,8,18,18,1], melt:"961.78°C", boil:"2162°C", apps:["Joalheria","eletrônica","fotografia","antibacteriano","moedas"] },
  48: { econfig:"[Kr] 4d¹⁰ 5s²", shells:[2,8,18,18,2], melt:"321.07°C", boil:"767°C", apps:["Baterias Ni-Cd","pigmentos","revestimentos anticorrosão","reatores nucleares"] },
  49: { econfig:"[Kr] 4d¹⁰ 5s² 5p¹", shells:[2,8,18,18,3], melt:"156.6°C", boil:"2072°C", apps:["Telas sensíveis ao toque (ITO)","LEDs","soldas de baixo ponto de fusão"] },
  50: { econfig:"[Kr] 4d¹⁰ 5s² 5p²", shells:[2,8,18,18,4], melt:"231.93°C", boil:"2602°C", apps:["Embalagens (lata)","soldas eletrônicas","bronze","ligas de baixo ponto de fusão"] },
  51: { econfig:"[Kr] 4d¹⁰ 5s² 5p³", shells:[2,8,18,18,5], melt:"630.63°C", boil:"1587°C", apps:["Retardantes de chama","ligas de baterias de chumbo-ácido","semicondutores"] },
  52: { econfig:"[Kr] 4d¹⁰ 5s² 5p⁴", shells:[2,8,18,18,6], melt:"449.51°C", boil:"988°C", apps:["Células solares de CdTe","discos Blu-ray","ligas metálicas"] },
  53: { econfig:"[Kr] 4d¹⁰ 5s² 5p⁵", shells:[2,8,18,18,7], melt:"113.7°C", boil:"184.4°C", apps:["Antisséptico","tireoide (hormônios)","contraste em radiologia","fotografia"] },
  54: { econfig:"[Kr] 4d¹⁰ 5s² 5p⁶", shells:[2,8,18,18,8], melt:"-111.75°C", boil:"-108.099°C", apps:["Lâmpadas de xenônio","lasers","propulsores iônicos espaciais","anestesia"] },
  55: { econfig:"[Xe] 6s¹", shells:[2,8,18,18,8,1], melt:"28.5°C", boil:"671°C", apps:["Relógios atômicos","perfuração de petróleo","catalisadores"] },
  56: { econfig:"[Xe] 6s²", shells:[2,8,18,18,8,2], melt:"727°C", boil:"1845°C", apps:["Contraste em radiologia (sulfato de bário)","refino de aço","pirotecnia (verde)"] },
  57: { econfig:"[Xe] 5d¹ 6s²", shells:[2,8,18,18,9,2], melt:"920°C", boil:"3464°C", apps:["Óptica (lentes de câmera)","catalisadores de refinaria","baterias de níquel-hidreto metálico"] },
  58: { econfig:"[Xe] 4f¹ 5d¹ 6s²", shells:[2,8,18,19,9,2], melt:"795°C", boil:"3443°C", apps:["Catalisadores automotivos","isqueiros (pedra de faísca)","polimento de vidro óptico"] },
  59: { econfig:"[Xe] 4f³ 6s²", shells:[2,8,18,21,8,2], melt:"931°C", boil:"3520°C", apps:["Ímãs permanentes","lasers","óculos de soldagem (lentes protetoras)","ligas"] },
  60: { econfig:"[Xe] 4f⁴ 6s²", shells:[2,8,18,22,8,2], melt:"1024°C", boil:"3074°C", apps:["Ímãs Nd-Fe-B (mais fortes do mundo)","microfones","fones de ouvido","motores elétricos"] },
  61: { econfig:"[Xe] 4f⁵ 6s²", shells:[2,8,18,23,8,2], melt:"1042°C", boil:"3000°C", apps:["Fontes de raios beta","marcapasso nuclear (histórico)","sondas espaciais"] },
  62: { econfig:"[Xe] 4f⁶ 6s²", shells:[2,8,18,24,8,2], melt:"1072°C", boil:"1794°C", apps:["Ímãs Sm-Co (resistentes a altas temperaturas)","lasers","medicina nuclear"] },
  63: { econfig:"[Xe] 4f⁷ 6s²", shells:[2,8,18,25,8,2], melt:"826°C", boil:"1529°C", apps:["Telas de TV e monitores (fósforo vermelho e azul)","papel-moeda (fluorescência anti-falsificação)"] },
  64: { econfig:"[Xe] 4f⁷ 5d¹ 6s²", shells:[2,8,18,25,9,2], melt:"1312°C", boil:"3273°C", apps:["Contraste de ressonância magnética (MRI)","reatores nucleares","ímãs de alta performance"] },
  65: { econfig:"[Xe] 4f⁹ 6s²", shells:[2,8,18,27,8,2], melt:"1356°C", boil:"3230°C", apps:["Fósforos verdes em telas","sonar (magnetostrição)","lasers"] },
  66: { econfig:"[Xe] 4f¹⁰ 6s²", shells:[2,8,18,28,8,2], melt:"1407°C", boil:"2562°C", apps:["Ímãs de neodímio (aditivo estabilizador de temperatura)","lasers","dosimetria"] },
  67: { econfig:"[Xe] 4f¹¹ 6s²", shells:[2,8,18,29,8,2], melt:"1461°C", boil:"2720°C", apps:["Lasers médicos (Ho:YAG)","ímãs supercondutores","guias de onda óptica"] },
  68: { econfig:"[Xe] 4f¹² 6s²", shells:[2,8,18,30,8,2], melt:"1529°C", boil:"2868°C", apps:["Fibra óptica (amplificadores EDFA)","lasers de Er:YAG","pigmentos de vidro rosas"] },
  69: { econfig:"[Xe] 4f¹³ 6s²", shells:[2,8,18,31,8,2], melt:"1545°C", boil:"1950°C", apps:["Lasers portáteis de raios-X (diagnóstico)","lasers cirúrgicos","pesquisa"] },
  70: { econfig:"[Xe] 4f¹⁴ 6s²", shells:[2,8,18,32,8,2], melt:"824°C", boil:"1196°C", apps:["Lasers de fibra (Yb)","relógios atômicos ópticos","ligas metálicas"] },
  71: { econfig:"[Xe] 4f¹⁴ 5d¹ 6s²", shells:[2,8,18,32,9,2], melt:"1652°C", boil:"3402°C", apps:["Detectores de PET scan","catalisadores","dopagem de materiais"] },
  72: { econfig:"[Xe] 4f¹⁴ 5d² 6s²", shells:[2,8,18,32,10,2], melt:"2233°C", boil:"4603°C", apps:["Barras de controle de reatores nucleares","chips de microprocessador","ligas de alta temperatura"] },
  73: { econfig:"[Xe] 4f¹⁴ 5d³ 6s²", shells:[2,8,18,32,11,2], melt:"3017°C", boil:"5458°C", apps:["Capacitores eletrônicos (celulares)","implantes cirúrgicos","ligas de alta temperatura"] },
  74: { econfig:"[Xe] 4f¹⁴ 5d⁴ 6s²", shells:[2,8,18,32,12,2], melt:"3422°C", boil:"5555°C", apps:["Filamento de lâmpadas incandescentes","ferramentas de corte","blindagem","eletrodos"] },
  75: { econfig:"[Xe] 4f¹⁴ 5d⁵ 6s²", shells:[2,8,18,32,13,2], melt:"3186°C", boil:"5596°C", apps:["Superligas para turbinas de jato","catalisadores de reforma de nafta","filamentos"] },
  76: { econfig:"[Xe] 4f¹⁴ 5d⁶ 6s²", shells:[2,8,18,32,14,2], melt:"3033°C", boil:"5012°C", apps:["Pontas de caneta tinteiro","agulhas de vitrola","ligas duras"] },
  77: { econfig:"[Xe] 4f¹⁴ 5d⁷ 6s²", shells:[2,8,18,32,15,2], melt:"2446°C", boil:"4428°C", apps:["Pontas de eletrodo","padrão internacional do metro/kg (liga platina-irídio)","velas de ignição"] },
  78: { econfig:"[Xe] 4f¹⁴ 5d⁹ 6s¹", shells:[2,8,18,32,17,1], melt:"1768.2°C", boil:"3825°C", apps:["Joalheria","catalisadores automotivos","células de combustível","eletrônicos médicos"] },
  79: { econfig:"[Xe] 4f¹⁴ 5d¹⁰ 6s¹", shells:[2,8,18,32,18,1], melt:"1064.18°C", boil:"2856°C", apps:["Joalheria","eletrônica (conectores)","odontologia","padrão monetário"] },
  80: { econfig:"[Xe] 4f¹⁴ 5d¹⁰ 6s²", shells:[2,8,18,32,18,2], melt:"-38.83°C", boil:"356.73°C", apps:["Termômetros (em desuso)","amalgamas dentárias","lâmpadas fluorescentes","instrumentos de pressão"] },
  81: { econfig:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹", shells:[2,8,18,32,18,3], melt:"304°C", boil:"1473°C", apps:["Detectores de infravermelho","vidro óptico especial","eletrônicos"] },
  82: { econfig:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²", shells:[2,8,18,32,18,4], melt:"327.46°C", boil:"1749°C", apps:["Baterias de chumbo-ácido","blindagem de radiação","munição","tubulações (históricas)"] },
  83: { econfig:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³", shells:[2,8,18,32,18,5], melt:"271.4°C", boil:"1564°C", apps:["Bismol (antiácido)","pigmentos cosméticos","fusíveis","catalisadores"] },
  84: { econfig:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴", shells:[2,8,18,32,18,6], melt:"254°C", boil:"962°C", apps:["Eliminador de estática (indústria)","fonte de calor em naves espaciais (RTG)"] },
  85: { econfig:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵", shells:[2,8,18,32,18,7], melt:"302°C", boil:"337°C", apps:["Medicina nuclear (radioterapia alvo","At-211)"] },
  86: { econfig:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶", shells:[2,8,18,32,18,8], melt:"-71°C", boil:"-61.7°C", apps:["Detecção sísmica","pesquisa","traçador geoquímico"] },
  87: { econfig:"[Rn] 7s¹", shells:[2,8,18,32,18,8,1], melt:"27°C", boil:"677°C", apps:["Pesquisa física básica"] },
  88: { econfig:"[Rn] 7s²", shells:[2,8,18,32,18,8,2], melt:"700°C", boil:"1737°C", apps:["Medicina nuclear histórica","pesquisa"] },
  89: { econfig:"[Rn] 6d¹ 7s²", shells:[2,8,18,32,18,9,2], melt:"1050°C", boil:"3200°C", apps:["Fonte de nêutrons","pesquisa de medicina nuclear (Ac-225 para câncer)"] },
  90: { econfig:"[Rn] 6d² 7s²", shells:[2,8,18,32,18,10,2], melt:"1750°C", boil:"4788°C", apps:["Combustível de reatores nucleares de tório","mantos de lampiões","ligas"] },
  91: { econfig:"[Rn] 5f² 6d¹ 7s²", shells:[2,8,18,32,20,9,2], melt:"1572°C", boil:"4000°C", apps:["Pesquisa científica"] },
  92: { econfig:"[Rn] 5f³ 6d¹ 7s²", shells:[2,8,18,32,21,9,2], melt:"1135°C", boil:"4131°C", apps:["Combustível nuclear","armas nucleares","blindagem (urânio depletado)"] },
  93: { econfig:"[Rn] 5f⁴ 6d¹ 7s²", shells:[2,8,18,32,22,9,2], melt:"644°C", boil:"4000°C", apps:["Detectores de nêutrons","pesquisa"] },
  94: { econfig:"[Rn] 5f⁶ 7s²", shells:[2,8,18,32,24,8,2], melt:"639.4°C", boil:"3228°C", apps:["Armas nucleares","combustível de geradores RTG para naves espaciais"] },
  95: { econfig:"[Rn] 5f⁷ 7s²", shells:[2,8,18,32,25,8,2], melt:"1176°C", boil:"2607°C", apps:["Detectores de fumaça (Am-241)","fontes de radiação gama"] },
  96: { econfig:"[Rn] 5f⁷ 6d¹ 7s²", shells:[2,8,18,32,25,9,2], melt:"1340°C", boil:"3110°C", apps:["Fonte de energia para sondas espaciais","espectrômetros de raios-X"] },
  97: { econfig:"[Rn] 5f⁹ 7s²", shells:[2,8,18,32,27,8,2], melt:"986°C", boil:"2627°C", apps:["Pesquisa científica","produção de elementos mais pesados"] },
  98: { econfig:"[Rn] 5f¹⁰ 7s²", shells:[2,8,18,32,28,8,2], melt:"900°C", boil:"1470°C", apps:["Iniciador de reatores nucleares","tratamento de câncer (braquiterapia)","detecção de metais"] },
  99: { econfig:"[Rn] 5f¹¹ 7s²", shells:[2,8,18,32,29,8,2], melt:"860°C", boil:"996°C", apps:["Pesquisa científica"] },
  100: { econfig:"[Rn] 5f¹² 7s²", shells:[2,8,18,32,30,8,2], melt:"1527°C", boil:"—", apps:["Pesquisa científica"] },
  101: { econfig:"[Rn] 5f¹³ 7s²", shells:[2,8,18,32,31,8,2], melt:"827°C", boil:"—", apps:["Pesquisa científica"] },
  102: { econfig:"[Rn] 5f¹⁴ 7s²", shells:[2,8,18,32,32,8,2], melt:"827°C", boil:"—", apps:["Pesquisa científica"] },
  103: { econfig:"[Rn] 5f¹⁴ 7s² 7p¹", shells:[2,8,18,32,32,8,3], melt:"1627°C", boil:"—", apps:["Pesquisa científica"] },
  104: { econfig:"[Rn] 5f¹⁴ 6d² 7s²", shells:[2,8,18,32,32,10,2], melt:"2100°C", boil:"5500°C", apps:["Pesquisa científica"] },
  105: { econfig:"[Rn] 5f¹⁴ 6d³ 7s²", shells:[2,8,18,32,32,11,2], melt:"—", boil:"—", apps:["Pesquisa científica"] },
  106: { econfig:"[Rn] 5f¹⁴ 6d⁴ 7s²", shells:[2,8,18,32,32,12,2], melt:"—", boil:"—", apps:["Pesquisa científica"] },
  107: { econfig:"[Rn] 5f¹⁴ 6d⁵ 7s²", shells:[2,8,18,32,32,13,2], melt:"—", boil:"—", apps:["Pesquisa científica"] },
  108: { econfig:"[Rn] 5f¹⁴ 6d⁶ 7s²", shells:[2,8,18,32,32,14,2], melt:"—", boil:"—", apps:["Pesquisa científica"] },
  109: { econfig:"[Rn] 5f¹⁴ 6d⁷ 7s²", shells:[2,8,18,32,32,15,2], melt:"—", boil:"—", apps:["Pesquisa científica"] },
  110: { econfig:"[Rn] 5f¹⁴ 6d⁸ 7s²", shells:[2,8,18,32,32,17,1], melt:"—", boil:"—", apps:["Pesquisa científica"] },
  111: { econfig:"[Rn] 5f¹⁴ 6d⁹ 7s²", shells:[2,8,18,32,32,18,1], melt:"—", boil:"—", apps:["Pesquisa científica"] },
  112: { econfig:"[Rn] 5f¹⁴ 6d¹⁰ 7s²", shells:[2,8,18,32,32,18,2], melt:"—", boil:"357°C", apps:["Pesquisa científica"] },
  113: { econfig:"[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹", shells:[2,8,18,32,32,18,3], melt:"—", boil:"—", apps:["Pesquisa científica"] },
  114: { econfig:"[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²", shells:[2,8,18,32,32,18,4], melt:"—", boil:"—", apps:["Pesquisa científica"] },
  115: { econfig:"[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³", shells:[2,8,18,32,32,18,5], melt:"—", boil:"—", apps:["Pesquisa científica"] },
  116: { econfig:"[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴", shells:[2,8,18,32,32,18,6], melt:"—", boil:"—", apps:["Pesquisa científica"] },
  117: { econfig:"[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵", shells:[2,8,18,32,32,18,7], melt:"—", boil:"—", apps:["Pesquisa científica"] },
  118: { econfig:"[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶", shells:[2,8,18,32,32,18,8], melt:"—", boil:"—", apps:["Pesquisa científica"] },
};

// ── getExtra ────────────────────────────────────────────────────
function getExtra(z) {
  if (EXTRA[z]) return EXTRA[z];
  const el = ELEMENTS.find(e => e.z === z);
  const shells = [];
  let remaining = z;
  const maxPerShell = [2,8,18,32,32,18,8];
  for (let i=0; i<maxPerShell.length && remaining>0; i++) {
    const fill = Math.min(remaining, maxPerShell[i]);
    shells.push(fill);
    remaining -= fill;
  }
  return { econfig:"\u2014", shells, melt:"\u2014", boil:"\u2014", apps:["Pesquisa cient\u00edfica","Aplica\u00e7\u00f5es especializadas"] };
}

// ── EXTRA2 ──────────────────────────────────────────────────────
// Extended data: density, atomicRadius, oxidation (common ones marked true), occurrence, funfact, valenceEl
const EXTRA2 = {
  1: { density:"0.0899 g/L", radius:"53 pm", oxidation:[{v:"+1",c:true},{v:"-1",c:false}], valence:1, occurrence:["Estrelas","água (H₂O)","compostos orgânicos"], funfact:"É o elemento mais abundante do universo, compondo cerca de 75% de toda a matéria bariônica." },
  2: { density:"0.1785 g/L", radius:"31 pm", oxidation:[{v:"0",c:true}], valence:2, occurrence:["Sol","atmosfera de planetas gigantes gasosos","depósitos naturais de gás"], funfact:"É o único elemento que não pode ser solidificado a pressão normal — permanece líquido mesmo no zero absoluto." },
  3: { density:"0.534 g/cm³", radius:"167 pm", oxidation:[{v:"+1",c:true}], valence:1, occurrence:["Minerais (espodumênio","lepidolita)","salmouras"], funfact:"É o metal sólido mais leve do mundo — tão leve que flutua na água." },
  4: { density:"1.85 g/cm³", radius:"112 pm", oxidation:[{v:"+2",c:true}], valence:2, occurrence:["Minerais (berilo","esmeralda)"], funfact:"Esmeraldas e águas-marinhas são variedades do mineral berilo, composto de berílio." },
  5: { density:"2.34 g/cm³", radius:"87 pm", oxidation:[{v:"+3",c:true}], valence:3, occurrence:["Minerais (bórax","kernita)","depósitos evaporíticos"], funfact:"O boro é um dos poucos elementos encontrados naturalmente em forma quase pura como mineral — o bórax." },
  6: { density:"2.267 g/cm³", radius:"77 pm", oxidation:[{v:"+4",c:true},{v:"+2",c:false},{v:"-4",c:false}], valence:4, occurrence:["Carvão","petróleo","gás natural","seres vivos","atmosfera (CO₂)"], funfact:"O carbono é a base de toda a vida conhecida e pode formar mais compostos do que qualquer outro elemento." },
  7: { density:"1.251 g/L", radius:"75 pm", oxidation:[{v:"+5",c:true},{v:"+4",c:false},{v:"+3",c:false},{v:"+2",c:false},{v:"+1",c:false},{v:"-1",c:false},{v:"-2",c:false},{v:"-3",c:false}], valence:5, occurrence:["Atmosfera (78%)","compostos biológicos (proteínas","DNA)"], funfact:"O nitrogênio líquido ferve a -196 °C e é usado para congelar rapidamente alimentos e materiais biológicos." },
  8: { density:"1.429 g/L", radius:"73 pm", oxidation:[{v:"+2",c:true},{v:"-1",c:false},{v:"-2",c:false}], valence:6, occurrence:["Atmosfera (21%)","água","óxidos","organismos vivos"], funfact:"O ozônio (O₃) é um alótropo do oxigênio que forma a camada protetora contra radiação UV na estratosfera." },
  9: { density:"1.696 g/L", radius:"71 pm", oxidation:[{v:"-1",c:true}], valence:7, occurrence:["Minerais (fluorita","criolita)","fluorapatita em dentes e ossos"], funfact:"O flúor é o elemento mais eletronegativo de todos — nenhum outro elemento pode oxidá-lo." },
  10: { density:"0.9002 g/L", radius:"38 pm", oxidation:[{v:"0",c:true}], valence:8, occurrence:["Atmosfera (traços)","extração do ar"], funfact:"A cor laranja-vermelha dos letreiros de 'néon' vem exatamente do gás neônio; outras cores usam outros gases." },
  11: { density:"0.971 g/cm³", radius:"190 pm", oxidation:[{v:"+1",c:true}], valence:1, occurrence:["Sal-comum (NaCl)","feldspatos","água do mar"], funfact:"O sódio reage violentamente com a água, liberando hidrogênio e calor suficientes para inflamar o gás." },
  12: { density:"1.738 g/cm³", radius:"160 pm", oxidation:[{v:"+2",c:true}], valence:2, occurrence:["Minerais (magnesita","dolomita)","água do mar","clorofila"], funfact:"O magnésio é o centro da molécula de clorofila, sendo essencial para a fotossíntese nas plantas." },
  13: { density:"2.698 g/cm³", radius:"143 pm", oxidation:[{v:"+3",c:true}], valence:3, occurrence:["Bauxita","feldspatos","crosta terrestre (terceiro mais abundante)"], funfact:"O alumínio foi mais valioso que o ouro no século XIX — Napoleão III reservava talheres de alumínio para seus convidados mais ilustres." },
  14: { density:"2.329 g/cm³", radius:"117 pm", oxidation:[{v:"+4",c:true},{v:"-4",c:false}], valence:4, occurrence:["Sílica (SiO₂)","silicatos","areia","rochas"], funfact:"O Vale do Silício recebe esse nome em homenagem ao elemento que está na base dos chips de computador." },
  15: { density:"1.82 g/cm³", radius:"115 pm", oxidation:[{v:"+5",c:true},{v:"+3",c:false},{v:"-3",c:false}], valence:5, occurrence:["Fosfato em rochas","ossos","DNA e ATP"], funfact:"O fósforo foi descoberto em 1669 a partir da destilação da urina humana — o primeiro elemento descoberto por processo químico documentado." },
  16: { density:"2.067 g/cm³", radius:"103 pm", oxidation:[{v:"+6",c:true},{v:"+4",c:false},{v:"+2",c:false},{v:"-2",c:false}], valence:6, occurrence:["Enxofre nativo","pirita","gipso","depósitos vulcânicos"], funfact:"O cheiro característico de ovos podres é causado pelo sulfeto de hidrogênio (H₂S), composto de enxofre." },
  17: { density:"3.214 g/L", radius:"99 pm", oxidation:[{v:"+7",c:true},{v:"+5",c:false},{v:"+3",c:false},{v:"+1",c:false},{v:"-1",c:false}], valence:7, occurrence:["Sal-comum (NaCl)","água do mar","cloretos minerais"], funfact:"O cloro foi usado como arma química na Primeira Guerra Mundial, sendo um dos primeiros agentes de guerra química." },
  18: { density:"1.784 g/L", radius:"71 pm", oxidation:[{v:"0",c:true}], valence:8, occurrence:["Atmosfera (0","93%)","extração do ar"], funfact:"O argônio compõe cerca de 1% da atmosfera da Terra — muito mais do que qualquer outro gás nobre." },
  19: { density:"0.89 g/cm³", radius:"227 pm", oxidation:[{v:"+1",c:true}], valence:1, occurrence:["Feldspatos","silvita (KCl)","água do mar","organismos vivos"], funfact:"O potássio é essencial para o funcionamento dos nervos — os impulsos nervosos dependem do fluxo de íons de potássio." },
  20: { density:"1.55 g/cm³", radius:"197 pm", oxidation:[{v:"+2",c:true}], valence:2, occurrence:["Calcário (CaCO₃)","gipso","feldspatos","ossos e dentes"], funfact:"Os ossos e dentes humanos são compostos principalmente de hidroxiapatita, um mineral de fosfato de cálcio." },
  21: { density:"2.989 g/cm³", radius:"162 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Minerais raros (tórtveíta","wiikita)","subproduto de mineração"], funfact:"O escândio foi previsto por Mendeleev antes de sua descoberta — ele o chamou de 'eka-boro'." },
  22: { density:"4.507 g/cm³", radius:"147 pm", oxidation:[{v:"+4",c:true},{v:"+3",c:false},{v:"+2",c:false}], valence:2, occurrence:["Ilmenita","rutilo","esfênio"], funfact:"O titânio é biocompatível — o corpo humano não o rejeita, tornando-o ideal para implantes dentários e ortopédicos." },
  23: { density:"6.11 g/cm³", radius:"134 pm", oxidation:[{v:"+5",c:true},{v:"+4",c:false},{v:"+3",c:false},{v:"+2",c:false}], valence:2, occurrence:["Vanadinita","patronita","magnetita"], funfact:"O vanádio foi descoberto duas vezes: em 1801 e em 1830 — e recebeu o nome da deusa nórdica Vanadis (Freya)." },
  24: { density:"7.19 g/cm³", radius:"128 pm", oxidation:[{v:"+6",c:true},{v:"+3",c:false},{v:"+2",c:false}], valence:1, occurrence:["Cromita (FeCr₂O₄)"], funfact:"O nome 'cromo' vem do grego chroma (cor) — seus compostos apresentam cores brilhantes como o vermelho do rubi e o verde do esmeralda." },
  25: { density:"7.21 g/cm³", radius:"127 pm", oxidation:[{v:"+7",c:true},{v:"+4",c:false},{v:"+3",c:false},{v:"+2",c:false},{v:"+1",c:false},{v:"-1",c:false}], valence:2, occurrence:["Pirolusita (MnO₂)","rodocrosita","depósitos oceânicos"], funfact:"Nódulos de manganês cobrem grande parte do fundo oceânico profundo e representam uma reserva mineral imensa." },
  26: { density:"7.874 g/cm³", radius:"126 pm", oxidation:[{v:"+3",c:true},{v:"+2",c:false}], valence:2, occurrence:["Hematita","magnetita","núcleo da Terra"], funfact:"O núcleo da Terra é composto principalmente de ferro e níquel, e seu movimento gera o campo magnético terrestre." },
  27: { density:"8.9 g/cm³", radius:"125 pm", oxidation:[{v:"+3",c:true},{v:"+2",c:false}], valence:2, occurrence:["Cobaltita","eritrita","subproduto de mineração de níquel e cobre"], funfact:"O azul cobalto é um dos pigmentos mais duráveis já criados — usado por artistas renascentistas e ainda hoje." },
  28: { density:"8.908 g/cm³", radius:"124 pm", oxidation:[{v:"+3",c:true},{v:"+2",c:false}], valence:2, occurrence:["Pentlandita","garnierita","núcleo da Terra"], funfact:"O termo 'níquel' vem do alemão Kupfernickel ('demônio do cobre') porque parecia cobre mas não o era." },
  29: { density:"8.96 g/cm³", radius:"128 pm", oxidation:[{v:"+2",c:true},{v:"+1",c:false}], valence:1, occurrence:["Calcopirita","malaquita","cobre nativo"], funfact:"O cobre é o único metal naturalmente de cor avermelhada (exceto o ouro). É antibacteriano por natureza." },
  30: { density:"7.134 g/cm³", radius:"122 pm", oxidation:[{v:"+2",c:true}], valence:2, occurrence:["Esfalerita","smithsonita"], funfact:"O zinco é essencial para o sistema imunológico — mais de 300 enzimas no corpo humano dependem de zinco." },
  31: { density:"5.907 g/cm³", radius:"122 pm", oxidation:[{v:"+3",c:true}], valence:3, occurrence:["Bauxita","esfalerita (traços)"], funfact:"O gálio derrete na palma da mão — seu ponto de fusão é de apenas 29,8 °C, ligeiramente acima da temperatura ambiente." },
  32: { density:"5.323 g/cm³", radius:"120 pm", oxidation:[{v:"+4",c:true},{v:"+2",c:false}], valence:4, occurrence:["Subproduto de mineração de zinco","carvão"], funfact:"O germânio foi o primeiro elemento previsto por Mendeleev — chamado 'eka-silício' — antes de ser descoberto." },
  33: { density:"5.727 g/cm³", radius:"119 pm", oxidation:[{v:"+5",c:true},{v:"+3",c:false},{v:"-3",c:false}], valence:5, occurrence:["Arsenopirita","ouropigmento"], funfact:"O arsênio sublima (passa direto de sólido a gás) a 614 °C sem passar pelo estado líquido." },
  34: { density:"4.809 g/cm³", radius:"120 pm", oxidation:[{v:"+6",c:true},{v:"+4",c:false},{v:"-2",c:false}], valence:6, occurrence:["Subproduto de refinaria de cobre","pirita"], funfact:"O selênio muda sua condutividade elétrica conforme a intensidade da luz — propriedade explorada em células solares e fotocopiadoras." },
  35: { density:"3.122 g/cm³", radius:"114 pm", oxidation:[{v:"+5",c:true},{v:"+3",c:false},{v:"+1",c:false},{v:"-1",c:false}], valence:7, occurrence:["Água do mar","salmouras","minerais de bromo"], funfact:"O bromo é um dos apenas dois elementos que são líquidos na temperatura ambiente (o outro é o mercúrio)." },
  36: { density:"3.749 g/L", radius:"88 pm", oxidation:[{v:"0",c:true}], valence:8, occurrence:["Atmosfera (traços)","extração do ar"], funfact:"O criptônio foi usado como padrão internacional de comprimento — entre 1960 e 1983, o metro foi definido por emissões de luz do isótopo Kr-86." },
  37: { density:"1.532 g/cm³", radius:"248 pm", oxidation:[{v:"+1",c:true}], valence:1, occurrence:["Minerais de lítio e potássio","lepidolita"], funfact:"O rubídio foi descoberto com o espectroscópio — seu nome vem da cor rubra (vermelho profundo) de suas linhas espectrais." },
  38: { density:"2.64 g/cm³", radius:"215 pm", oxidation:[{v:"+2",c:true}], valence:2, occurrence:["Celestita","estroncianita"], funfact:"O estrôncio-90, isótopo radioativo produzido em explosões nucleares, substitui o cálcio nos ossos e causa risco de câncer." },
  39: { density:"4.469 g/cm³", radius:"180 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Monazita","bastnäsita","xenotima"], funfact:"A cidade de Ytterby, na Suécia, deu nome a quatro elementos: ítrio, térbio, érbio e itérbio." },
  40: { density:"6.506 g/cm³", radius:"160 pm", oxidation:[{v:"+4",c:true}], valence:2, occurrence:["Zircão","badeleíta"], funfact:"O zircão é o mineral mais antigo já encontrado na Terra — cristais de zircão australianos têm 4,4 bilhões de anos." },
  41: { density:"8.57 g/cm³", radius:"146 pm", oxidation:[{v:"+5",c:true},{v:"+3",c:false},{v:"+2",c:false}], valence:1, occurrence:["Columbita-tantalita","pirocloro"], funfact:"O Brasil possui as maiores reservas mundiais de nióbio — responsável por mais de 90% da produção global." },
  42: { density:"10.28 g/cm³", radius:"139 pm", oxidation:[{v:"+6",c:true},{v:"+5",c:false},{v:"+4",c:false},{v:"+3",c:false},{v:"+2",c:false}], valence:1, occurrence:["Molibdenita (MoS₂)"], funfact:"O molibdênio tem o terceiro maior ponto de fusão entre todos os elementos — é um dos metais mais refratários." },
  43: { density:"11.5 g/cm³", radius:"136 pm", oxidation:[{v:"+7",c:true},{v:"+6",c:false},{v:"+5",c:false},{v:"+4",c:false},{v:"+3",c:false},{v:"+2",c:false},{v:"+1",c:false},{v:"-1",c:false}], valence:2, occurrence:["Produção artificial em reatores nucleares","traços em minério de urânio"], funfact:"O tecnécio foi o primeiro elemento artificial — criado em laboratório antes de ser encontrado na natureza." },
  44: { density:"12.37 g/cm³", radius:"134 pm", oxidation:[{v:"+8",c:true},{v:"+6",c:false},{v:"+4",c:false},{v:"+3",c:false},{v:"+2",c:false},{v:"+1",c:false},{v:"-2",c:false}], valence:1, occurrence:["Minérios de platina"], funfact:"O rutênio foi nomeado em homenagem à Rússia (Ruthenia, em latim) por seu descobridor russo." },
  45: { density:"12.41 g/cm³", radius:"134 pm", oxidation:[{v:"+3",c:true},{v:"+2",c:false},{v:"+1",c:false}], valence:1, occurrence:["Minérios de platina","subproduto de níquel e cobre"], funfact:"O ródio é um dos metais mais raros e caros do mundo — por vezes mais caro que o ouro." },
  46: { density:"12.023 g/cm³", radius:"137 pm", oxidation:[{v:"+4",c:true},{v:"+2",c:false}], valence:0, occurrence:["Minérios de platina","minérios de níquel-cobre"], funfact:"O paládio pode absorver até 900 vezes seu próprio volume em hidrogênio — uma propriedade única entre os metais." },
  47: { density:"10.49 g/cm³", radius:"144 pm", oxidation:[{v:"+1",c:true}], valence:1, occurrence:["Argentita","prata nativa","subproduto de minérios de cobre e chumbo"], funfact:"A prata possui a maior condutividade elétrica e térmica de todos os metais." },
  48: { density:"8.65 g/cm³", radius:"151 pm", oxidation:[{v:"+2",c:true}], valence:2, occurrence:["Esfalerita (subproduto de zinco)"], funfact:"O cádmio é altamente tóxico e bioacumulativo — foi o causador da doença 'Itai-itai' no Japão na década de 1950." },
  49: { density:"7.31 g/cm³", radius:"167 pm", oxidation:[{v:"+3",c:true}], valence:3, occurrence:["Esfalerita (subproduto de zinco)"], funfact:"O óxido de índio-estanho (ITO) é o material transparente e condutor que reveste a tela do seu smartphone." },
  50: { density:"7.287 g/cm³", radius:"140 pm", oxidation:[{v:"+4",c:true},{v:"+2",c:false}], valence:4, occurrence:["Cassiterita (SnO₂)"], funfact:"A 'doença do estanho' fez Napoleão perder sua campanha na Rússia — os botões de estanho dos uniformes se desintegraram no frio." },
  51: { density:"6.697 g/cm³", radius:"140 pm", oxidation:[{v:"+5",c:true},{v:"+3",c:false},{v:"-3",c:false}], valence:5, occurrence:["Estibina (Sb₂S₃)"], funfact:"O antimônio era usado como cosmético no Egito antigo — kohl (delineador dos olhos) continha sulfeto de antimônio." },
  52: { density:"6.24 g/cm³", radius:"136 pm", oxidation:[{v:"+6",c:true},{v:"+4",c:false},{v:"-2",c:false}], valence:6, occurrence:["Subproduto de refinaria de cobre","calaverita"], funfact:"O telúrio é um dos elementos mais raros da crosta terrestre — menos comum que o ouro." },
  53: { density:"4.933 g/cm³", radius:"133 pm", oxidation:[{v:"+7",c:true},{v:"+5",c:false},{v:"+3",c:false},{v:"+1",c:false},{v:"-1",c:false}], valence:7, occurrence:["Água do mar","algas marinhas","nitratos do Chile"], funfact:"A tireoide humana acumula iodo para produzir hormônios tireoidianos — o único órgão que depende de um único elemento mineral." },
  54: { density:"5.887 g/L", radius:"108 pm", oxidation:[{v:"0",c:true}], valence:8, occurrence:["Atmosfera (traços)","extração do ar"], funfact:"O xenônio foi o primeiro gás nobre a ter compostos formados em laboratório, quebrando o 'mito' da inércia absoluta dos nobres." },
  55: { density:"1.93 g/cm³", radius:"265 pm", oxidation:[{v:"+1",c:true}], valence:1, occurrence:["Pollucita","lepidolita"], funfact:"O césio define o segundo — um segundo é definido por 9.192.631.770 oscilações da radiação do átomo de césio-133." },
  56: { density:"3.51 g/cm³", radius:"222 pm", oxidation:[{v:"+2",c:true}], valence:2, occurrence:["Barita (BaSO₄)","witherita"], funfact:"O sulfato de bário é insolúvel e atóxico — por isso é usado como 'leite de bário' em exames de raio-X do trato digestivo." },
  57: { density:"6.145 g/cm³", radius:"187 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Monazita","bastnäsita"], funfact:"O lantânio é o elemento que dá nome ao grupo dos lantanídeos — os 15 elementos de La (57) a Lu (71)." },
  58: { density:"6.77 g/cm³", radius:"182 pm", oxidation:[{v:"+4",c:true},{v:"+3",c:false}], valence:2, occurrence:["Monazita","bastnäsita"], funfact:"O cério é o lantanídeo mais abundante e o 25° elemento mais comum na crosta terrestre — mais comum que o chumbo." },
  59: { density:"6.773 g/cm³", radius:"183 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Monazita","bastnäsita"], funfact:"O nome 'praseodímio' vem do grego e significa 'gêmeo verde' — pois foi separado do neodímio, com o qual era confundido." },
  60: { density:"7.007 g/cm³", radius:"182 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Monazita","bastnäsita"], funfact:"Os ímãs de neodímio-ferro-boro são os ímãs permanentes mais fortes conhecidos — essenciais em EVs e turbinas eólicas." },
  61: { density:"7.26 g/cm³", radius:"181 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Subproduto de reatores nucleares","traços em minério de urânio"], funfact:"O promécio é o único lantanídeo sem isótopos estáveis — é radioativo e não existe em quantidade significativa na natureza." },
  62: { density:"7.52 g/cm³", radius:"180 pm", oxidation:[{v:"+3",c:true},{v:"+2",c:false}], valence:2, occurrence:["Monazita","bastnäsita","samarskita"], funfact:"Os ímãs de samário-cobalto são os mais resistentes à desmagnetização por calor — usados em motores de jatos." },
  63: { density:"5.244 g/cm³", radius:"180 pm", oxidation:[{v:"+3",c:true},{v:"+2",c:false}], valence:2, occurrence:["Monazita","bastnäsita","bastnasite"], funfact:"O európio é usado na segurança de notas de euro — emite fluorescência vermelha sob luz UV, dificultando falsificações." },
  64: { density:"7.9 g/cm³", radius:"180 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Monazita","bastnäsita","gadolinita"], funfact:"O gadolínio tem a maior seção de captura de nêutrons de todos os elementos estáveis — usado para controlar reatores." },
  65: { density:"8.229 g/cm³", radius:"177 pm", oxidation:[{v:"+4",c:true},{v:"+3",c:false}], valence:2, occurrence:["Monazita","xenotima","gadolinita"], funfact:"O térbio foi descoberto na mina de Ytterby, Suécia — cidade cujo nome também gerou ítrio, érbio e itérbio." },
  66: { density:"8.55 g/cm³", radius:"178 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Monazita","xenotima","bastnäsita"], funfact:"O nome 'disprósio' vem do grego dysprositos, que significa 'difícil de obter' — era extremamente difícil de isolar." },
  67: { density:"8.795 g/cm³", radius:"176 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Monazita","gadolinita"], funfact:"O hólmio tem o maior momento magnético de todos os elementos naturais — seus ímãs são extraordinariamente potentes." },
  68: { density:"9.066 g/cm³", radius:"176 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Xenotima","gadolinita","euxenita"], funfact:"Amplificadores de fibra óptica dopados com érbio (EDFA) tornaram possível a internet de longa distância." },
  69: { density:"9.321 g/cm³", radius:"176 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Monazita","gadolinita","xenotima"], funfact:"O túlio é o lantanídeo mais raro de ocorrência natural — ainda assim é mais abundante que a prata." },
  70: { density:"6.965 g/cm³", radius:"176 pm", oxidation:[{v:"+3",c:true},{v:"+2",c:false}], valence:2, occurrence:["Monazita","xenotima","euxenita"], funfact:"Relógios atômicos de itérbio são os mais precisos já construídos — errariam apenas 1 segundo em 10 bilhões de anos." },
  71: { density:"9.84 g/cm³", radius:"174 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Monazita","bastnäsita","xenotima"], funfact:"O lutécio é o lantanídeo mais denso e com maior ponto de fusão entre todos os elementos do grupo." },
  72: { density:"13.31 g/cm³", radius:"159 pm", oxidation:[{v:"+4",c:true}], valence:2, occurrence:["Zircão (como impureza do zircônio)"], funfact:"O háfnio foi o penúltimo elemento não radioativo descoberto — encontrado dentro de cristais de zircão por espectrografia." },
  73: { density:"16.69 g/cm³", radius:"146 pm", oxidation:[{v:"+5",c:true}], valence:2, occurrence:["Columbita-tantalita (coltan)"], funfact:"O coltan, minério rico em tântalo, é extraído em condições controversas no Congo — é essencial para smartphones." },
  74: { density:"19.25 g/cm³", radius:"139 pm", oxidation:[{v:"+6",c:true},{v:"+5",c:false},{v:"+4",c:false},{v:"+3",c:false},{v:"+2",c:false}], valence:2, occurrence:["Wolframita","scheelita"], funfact:"O tungstênio tem o maior ponto de fusão de todos os metais — 3422 °C — e o segundo maior de todos os elementos." },
  75: { density:"21.02 g/cm³", radius:"137 pm", oxidation:[{v:"+7",c:true},{v:"+6",c:false},{v:"+5",c:false},{v:"+4",c:false},{v:"+3",c:false},{v:"+2",c:false},{v:"-1",c:false}], valence:2, occurrence:["Molibdenita (subproduto)"], funfact:"O rênio foi o último elemento não radioativo estável descoberto — identificado em 1925, fechando os últimos espaços da tabela." },
  76: { density:"22.59 g/cm³", radius:"135 pm", oxidation:[{v:"+8",c:true},{v:"+6",c:false},{v:"+4",c:false},{v:"+3",c:false},{v:"+2",c:false},{v:"-2",c:false}], valence:2, occurrence:["Minérios de platina","osmiridio"], funfact:"O ósmio é o elemento natural mais denso — 22,59 g/cm³, mais denso que o chumbo ou o urânio." },
  77: { density:"22.56 g/cm³", radius:"136 pm", oxidation:[{v:"+4",c:true},{v:"+3",c:false},{v:"+2",c:false},{v:"+1",c:false}], valence:2, occurrence:["Minérios de platina","ferroníquel","osmiridio"], funfact:"Uma camada de irídio no registro geológico marca o impacto do asteroide que extinguiu os dinossauros há 66 milhões de anos." },
  78: { density:"21.45 g/cm³", radius:"139 pm", oxidation:[{v:"+4",c:true},{v:"+2",c:false}], valence:1, occurrence:["Platina nativa","sperrylita","cooperita"], funfact:"A cisplatina, um composto de platina, é um dos medicamentos antineoplásicos mais usados no tratamento de câncer." },
  79: { density:"19.3 g/cm³", radius:"144 pm", oxidation:[{v:"+3",c:true},{v:"+1",c:false}], valence:1, occurrence:["Ouro nativo","teluretos de ouro","veios hidrotermais"], funfact:"Todo o ouro já extraído pela humanidade caberia em um cubo de apenas 21 metros de lado." },
  80: { density:"13.534 g/cm³", radius:"151 pm", oxidation:[{v:"+2",c:true},{v:"+1",c:false}], valence:2, occurrence:["Cinábrio (HgS)"], funfact:"O mercúrio é o único metal líquido na temperatura ambiente (junto com o gálio, que funde a ~30°C)." },
  81: { density:"11.85 g/cm³", radius:"170 pm", oxidation:[{v:"+3",c:true},{v:"+1",c:false}], valence:3, occurrence:["Crookesite","lorandita","subproduto de zinc e cobre"], funfact:"O tálio já foi usado como raticida e veneno para assassinato — é extremamente tóxico e inodoro." },
  82: { density:"11.34 g/cm³", radius:"175 pm", oxidation:[{v:"+4",c:true},{v:"+2",c:false}], valence:4, occurrence:["Galena (PbS)","cerussita"], funfact:"O chumbo é o produto final estável de cadeias de decaimento radioativo do urânio, tório e atátio." },
  83: { density:"9.78 g/cm³", radius:"156 pm", oxidation:[{v:"+5",c:true},{v:"+3",c:false}], valence:5, occurrence:["Bismutinita","bismuto nativo","subproduto de chumbo e cobre"], funfact:"O bismuto tem os cristais de óxido mais coloridos e geométricos de todos os metais — formam espirais iridescentes." },
  84: { density:"9.196 g/cm³", radius:"167 pm", oxidation:[{v:"+4",c:true},{v:"+2",c:false},{v:"-2",c:false}], valence:6, occurrence:["Decaimento do radônio","traços em minério de urânio"], funfact:"O polônio foi descoberto por Marie Curie e recebeu o nome de sua pátria, a Polônia, então ocupada." },
  85: { density:"7.0 g/cm³", radius:"147 pm", oxidation:[{v:"+7",c:true},{v:"+5",c:false},{v:"+3",c:false},{v:"+1",c:false},{v:"-1",c:false}], valence:7, occurrence:["Decaimento do urânio e tório","produção artificial"], funfact:"O ástato é o elemento natural mais raro da crosta terrestre — há menos de 30 gramas em toda a Terra em qualquer momento." },
  86: { density:"9.73 g/L", radius:"145 pm", oxidation:[{v:"0",c:true}], valence:8, occurrence:["Decaimento do rádio e urânio em rochas e solo"], funfact:"O radônio é a segunda causa de câncer de pulmão nos EUA — acumula-se naturalmente em porões mal ventilados." },
  87: { density:"1.87 g/cm³", radius:"348 pm", oxidation:[{v:"+1",c:true}], valence:1, occurrence:["Decaimento do actínio","traços em minério de urânio"], funfact:"O frâncio é o segundo elemento mais eletropositivo e o segundo mais reativo entre os metais alcalinos." },
  88: { density:"5.5 g/cm³", radius:"215 pm", oxidation:[{v:"+2",c:true}], valence:2, occurrence:["Minerais de urânio (pechblenda)","decaimento do urânio"], funfact:"Marie Curie morreu de anemia aplásica causada pela exposição prolongada ao rádio e polônio que descobriu." },
  89: { density:"10.07 g/cm³", radius:"195 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Minerais de urânio (traços)","decaimento"], funfact:"O actínio é cerca de 150 vezes mais radioativo que o rádio — brilha de azul no escuro pela ionização do ar." },
  90: { density:"11.72 g/cm³", radius:"179 pm", oxidation:[{v:"+4",c:true}], valence:2, occurrence:["Monazita","torianos"], funfact:"O tório é mais abundante que o urânio na crosta terrestre e pode ser usado como combustível nuclear mais seguro." },
  91: { density:"15.37 g/cm³", radius:"163 pm", oxidation:[{v:"+5",c:true},{v:"+4",c:false}], valence:2, occurrence:["Minerais de urânio (traços)"], funfact:"O protactínio é um dos elementos mais raros e mais perigosos — tóxico e fortemente radioativo." },
  92: { density:"19.05 g/cm³", radius:"156 pm", oxidation:[{v:"+6",c:true},{v:"+5",c:false},{v:"+4",c:false},{v:"+3",c:false}], valence:2, occurrence:["Pechblenda","uraninita","carnotita"], funfact:"Um quilograma de urânio-235 pode liberar a mesma energia que queimar aproximadamente 3.000 toneladas de carvão." },
  93: { density:"20.45 g/cm³", radius:"155 pm", oxidation:[{v:"+7",c:true},{v:"+6",c:false},{v:"+5",c:false},{v:"+4",c:false},{v:"+3",c:false}], valence:2, occurrence:["Produção em reatores nucleares","traços em minerais de urânio"], funfact:"O netúnio foi o primeiro elemento transuraniano sintetizado — produzido em Berkeley em 1940." },
  94: { density:"19.84 g/cm³", radius:"159 pm", oxidation:[{v:"+7",c:true},{v:"+6",c:false},{v:"+5",c:false},{v:"+4",c:false},{v:"+3",c:false}], valence:2, occurrence:["Produção em reatores nucleares","traços em minério de urânio"], funfact:"O plutônio-238 aquece-se espontaneamente pela própria radioatividade — blocos dele ficam quentes ao toque." },
  95: { density:"13.78 g/cm³", radius:"173 pm", oxidation:[{v:"+6",c:true},{v:"+5",c:false},{v:"+4",c:false},{v:"+3",c:false}], valence:2, occurrence:["Produção em reatores nucleares"], funfact:"O amerício presente em detectores de fumaça residenciais emite partículas alfa que ionizam o ar e detectam fumaça." },
  96: { density:"13.51 g/cm³", radius:"174 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Produção em reatores nucleares"], funfact:"O cúrio foi nomeado em homenagem a Marie e Pierre Curie — pesquisadores pioneiros no estudo da radioatividade." },
  97: { density:"14.78 g/cm³", radius:"170 pm", oxidation:[{v:"+4",c:true},{v:"+3",c:false}], valence:2, occurrence:["Produção em aceleradores de partículas"], funfact:"O berquélio foi nomeado em homenagem a Berkeley, Califórnia, onde o Lawrence Radiation Lab o produziu." },
  98: { density:"15.1 g/cm³", radius:"186 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Produção em aceleradores de partículas e reatores"], funfact:"O califórnio-252 emite nêutrons espontaneamente e é um dos materiais mais caros do mundo — cerca de US$27 milhões por grama." },
  99: { density:"8.84 g/cm³", radius:"186 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Resíduos de explosões termonucleares","produção em reatores"], funfact:"O einstênio foi descoberto nos resíduos da primeira bomba de hidrogênio testada (Ivy Mike, 1952)." },
  100: { density:"9.71 g/cm³", radius:"167 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Resíduos de explosões termonucleares","produção em reatores"], funfact:"O férmio foi descoberto junto com o einstênio em 1952 nos resíduos da bomba de hidrogênio Ivy Mike." },
  101: { density:"10.3 g/cm³", radius:"173 pm", oxidation:[{v:"+3",c:true},{v:"+2",c:false}], valence:2, occurrence:["Produção em aceleradores de partículas"], funfact:"O mendelévio foi produzido pela primeira vez com apenas 17 átomos — e sua existência foi confirmada por análise individual de cada átomo." },
  102: { density:"9.9 g/cm³", radius:"176 pm", oxidation:[{v:"+3",c:true},{v:"+2",c:false}], valence:2, occurrence:["Produção em aceleradores de partículas"], funfact:"O nobélio foi nomeado em homenagem a Alfred Nobel, o inventor da dinamite e fundador do Prêmio Nobel." },
  103: { density:"14.4 g/cm³", radius:"161 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Produção em aceleradores de partículas"], funfact:"O laurêncio foi nomeado em homenagem a Ernest Lawrence, inventor do cíclotron." },
  104: { density:"23.2 g/cm³", radius:"157 pm", oxidation:[{v:"+4",c:true}], valence:2, occurrence:["Produção em aceleradores de partículas"], funfact:"O rutherfórdio foi o primeiro elemento transactinídeo — e sua descoberta foi disputada entre EUA e URSS durante a Guerra Fria." },
  105: { density:"29.3 g/cm³", radius:"149 pm", oxidation:[{v:"+5",c:true}], valence:2, occurrence:["Produção em aceleradores de partículas"], funfact:"O nome 'dúbnio' vem de Dubna, Rússia, cidade onde fica o laboratório JINR que reivindicou sua descoberta." },
  106: { density:"35.0 g/cm³", radius:"143 pm", oxidation:[{v:"+6",c:true}], valence:2, occurrence:["Produção em aceleradores de partículas"], funfact:"O seabórgio é o único elemento nomeado em homenagem a uma pessoa viva no momento da nomeação — Glenn T. Seaborg." },
  107: { density:"37.1 g/cm³", radius:"141 pm", oxidation:[{v:"+7",c:true}], valence:2, occurrence:["Produção em aceleradores de partículas"], funfact:"O bóhrio foi nomeado em homenagem a Niels Bohr, físico dinamarquês que propôs o modelo atômico de Bohr." },
  108: { density:"40.7 g/cm³", radius:"134 pm", oxidation:[{v:"+8",c:true}], valence:2, occurrence:["Produção em aceleradores de partículas"], funfact:"O hássio recebe seu nome do estado alemão de Hesse (Hassia em latim), onde fica o laboratório GSI." },
  109: { density:"37.4 g/cm³", radius:"129 pm", oxidation:[{v:"+6",c:true}], valence:2, occurrence:["Produção em aceleradores de partículas"], funfact:"O meitnério foi nomeado em homenagem a Lise Meitner, física que explicou a fissão nuclear mas nunca ganhou o Nobel." },
  110: { density:"34.8 g/cm³", radius:"128 pm", oxidation:[{v:"+6",c:true}], valence:1, occurrence:["Produção em aceleradores de partículas"], funfact:"O darmstádtio foi nomeado em homenagem à cidade de Darmstadt, Alemanha, onde fica o laboratório GSI." },
  111: { density:"28.7 g/cm³", radius:"121 pm", oxidation:[{v:"+3",c:true},{v:"+1",c:false}], valence:1, occurrence:["Produção em aceleradores de partículas"], funfact:"O roentgênio foi nomeado em homenagem a Wilhelm Röntgen, descobridor dos raios X em 1895." },
  112: { density:"23700.0 g/L", radius:"122 pm", oxidation:[{v:"+4",c:true},{v:"+2",c:false}], valence:2, occurrence:["Produção em aceleradores de partículas"], funfact:"O copernício pode ser gasoso à temperatura ambiente — previsões indicam que é mais volátil que o mercúrio." },
  113: { density:"16.0 g/cm³", radius:"136 pm", oxidation:[{v:"+3",c:true}], valence:2, occurrence:["Produção em aceleradores de partículas"], funfact:"O nihônio foi o primeiro elemento descoberto na Ásia — o nome vem de 'Nihon', palavra japonesa para Japão." },
  114: { density:"14000.0 g/L", radius:"143 pm", oxidation:[{v:"+4",c:true},{v:"+2",c:false}], valence:4, occurrence:["Produção em aceleradores de partículas"], funfact:"O fleróvio pode comportar-se como gás nobre devido a efeitos relativísticos — apesar de estar no grupo 14." },
  115: { density:"13.5 g/cm³", radius:"162 pm", oxidation:[{v:"+3",c:true}], valence:5, occurrence:["Produção em aceleradores de partículas"], funfact:"O moscóvio foi nomeado em homenagem à região de Moscou (Oblast de Moscou), na Rússia." },
  116: { density:"12.9 g/cm³", radius:"175 pm", oxidation:[{v:"+4",c:true},{v:"+2",c:false}], valence:6, occurrence:["Produção em aceleradores de partículas"], funfact:"O livermório foi nomeado em homenagem ao Lawrence Livermore National Laboratory, na Califórnia." },
  117: { density:"7.17 g/cm³", radius:"165 pm", oxidation:[{v:"+3",c:true},{v:"+1",c:false},{v:"-1",c:false}], valence:7, occurrence:["Produção em aceleradores de partículas"], funfact:"O tenesso foi nomeado em homenagem ao estado do Tennessee, EUA, lar de laboratórios que participaram de sua criação." },
  118: { density:"5.0 g/cm³", radius:"152 pm", oxidation:[{v:"0",c:true}], valence:8, occurrence:["Produção em aceleradores de partículas"], funfact:"O oganessônio é o único elemento nomeado em homenagem a uma pessoa viva atualmente — Yuri Oganessian." },
};

// ── getExtra2 ───────────────────────────────────────────────────
function getExtra2(z) {
  if (EXTRA2[z]) return EXTRA2[z];
  // Derive valence from group/position as fallback
  const el = ELEMENTS.find(e => e.z === z);
  const g = el ? el.group : 0;
  const valence = (g <= 2) ? g : (g >= 13 && g <= 18) ? g - 10 : '—';
  return {
    density: "—", radius: "—",
    oxidation: [],
    valence: valence,
    occurrence: ["Minerais terrestres", "Compostos especializados"],
    funfact: null
  };
}

// ── First ionization energy (kJ/mol) ────────────────────────────
// Experimental / spectroscopic values for Z 1–103. Z 104–118 are intentionally
// omitted: their first ionization energies are theoretical predictions with
// large uncertainty, so the Trends chart renders them as a gap (getIonization
// returns undefined) rather than implying measured data.
const IONIZATION = {
  1:1312.0, 2:2372.3, 3:520.2, 4:899.5, 5:800.6, 6:1086.5, 7:1402.3, 8:1313.9,
  9:1681.0, 10:2080.7, 11:495.8, 12:737.7, 13:577.5, 14:786.5, 15:1011.8,
  16:999.6, 17:1251.2, 18:1520.6, 19:418.8, 20:589.8, 21:633.1, 22:658.8,
  23:650.9, 24:652.9, 25:717.3, 26:762.5, 27:760.4, 28:737.1, 29:745.5,
  30:906.4, 31:578.8, 32:762.0, 33:947.0, 34:941.0, 35:1139.9, 36:1350.8,
  37:403.0, 38:549.5, 39:600.0, 40:640.1, 41:652.1, 42:684.3, 43:702.0,
  44:710.2, 45:719.7, 46:804.4, 47:731.0, 48:867.8, 49:558.3, 50:708.6,
  51:834.0, 52:869.3, 53:1008.4, 54:1170.4, 55:375.7, 56:502.9, 57:538.1,
  58:534.4, 59:527.0, 60:533.1, 61:540.0, 62:544.5, 63:547.1, 64:593.4,
  65:565.8, 66:573.0, 67:581.0, 68:589.3, 69:596.7, 70:603.4, 71:523.5,
  72:658.5, 73:761.0, 74:770.0, 75:760.0, 76:840.0, 77:880.0, 78:870.0,
  79:890.1, 80:1007.1, 81:589.4, 82:715.6, 83:703.0, 84:812.1, 85:899.0,
  86:1037.0, 87:393.0, 88:509.3, 89:499.0, 90:587.0, 91:568.0, 92:597.6,
  93:604.5, 94:584.7, 95:578.0, 96:581.0, 97:601.0, 98:608.0, 99:619.0,
  100:627.0, 101:635.0, 102:642.0, 103:478.6
};

// Returns the first ionization energy (kJ/mol) or undefined when unavailable.
function getIonization(z) { return IONIZATION[z]; }

