// ───────────────────────────────────────────────────────────────────
// Atomurus — rich content per element (PT + EN)
// ───────────────────────────────────────────────────────────────────
// Loaded by /periodic-table/<latin>.html via a <script> tag, AFTER
// elements-data.js + elements-data-en.js + i18n.js. element-page.js
// reads from this file and injects content sections into the page.
//
// Structure: each element keyed by atomic number (Z). Five sections:
//   overview      — what it is, why it matters (2-4 sentences)
//   history       — discovery / naming (1 paragraph)
//   properties    — physical / chemical (1 paragraph)
//   applications  — real-world uses (1 paragraph)
//   curiosity     — memorable fact (1-2 sentences)
//
// Filling status: 118/118 ✓ (complete).
// When an element has no entry here, element-page.js falls back to
// showing only the short `desc` field from elements-data.js (no stub).
// ───────────────────────────────────────────────────────────────────

const _ELEMENT_CONTENT_PT = {
  1: {
    overview:
      'Hidrogênio é o elemento químico mais simples e abundante do universo, representando cerca de 75% de toda a matéria observável. No núcleo de uma estrela, hidrogênio se funde em hélio liberando a energia que faz o Sol brilhar. Na Terra, raramente aparece sozinho — está combinado em água, hidrocarbonetos, ácidos e em praticamente toda molécula biológica que sustenta a vida.',
    history:
      'Foi reconhecido como substância distinta pelo químico inglês Henry Cavendish em 1766, que o chamou de "ar inflamável" após perceber que a reação de metais com ácidos produzia um gás que ardia formando água. O nome atual veio de Antoine Lavoisier em 1783, derivado do grego "hydro" (água) e "genes" (gerador) — literalmente "gerador de água". Esse foi o ponto em que a química moderna começou a abandonar a teoria do flogisto.',
    properties:
      'À temperatura ambiente é um gás incolor, inodoro e altamente inflamável, mais leve que qualquer outro elemento. O hidrogênio puro forma moléculas diatômicas (H₂) ligadas covalentemente. Tem três isótopos naturais: prótio (¹H, 99,98%), deutério (²H, com um nêutron) e trítio (³H, radioativo). Sob pressões extremas, como no interior de Júpiter, o hidrogênio se comporta como um metal líquido — uma fase ainda objeto de pesquisa intensa.',
    applications:
      'O maior uso industrial é a produção de amônia pelo processo Haber-Bosch, que sustenta a agricultura mundial via fertilizantes. Também é fundamental no refino de petróleo, na hidrogenação de óleos vegetais (margarina) e na produção de metanol. Cada vez mais aparece como combustível: foguetes da NASA usam hidrogênio líquido com oxigênio, e carros movidos a célula de combustível emitem apenas água como subproduto.',
    curiosity:
      'A bomba de hidrogênio não usa fissão como a atômica — usa fusão, replicando o processo que ocorre no Sol. A primeira detonou em 1952 com força equivalente a 10 milhões de toneladas de TNT, cerca de 700 vezes mais que a de Hiroshima. Esse mesmo princípio de fusão é o que pesquisadores tentam controlar em reatores como o ITER para gerar energia limpa.',
  },
  2: {
    overview:
      'Hélio é o segundo elemento mais leve do universo e o gás nobre mais conhecido — completamente inerte, incolor, inodoro e não-tóxico. Apesar de ser o segundo mais abundante no cosmos (cerca de 24% da massa), na Terra é um recurso finito: ele escapa da atmosfera por ser tão leve. Quase todo hélio comercial vem do gás natural, onde se acumula como subproduto do decaimento radioativo do urânio e tório nas rochas há bilhões de anos.',
    history:
      'Detectado pela primeira vez em 1868, não na Terra mas no espectro do Sol — durante um eclipse solar total na Índia, os astrônomos Pierre Janssen e Norman Lockyer notaram uma linha amarela desconhecida que não correspondia a nenhum elemento conhecido. Lockyer batizou-o de "helium", do grego "helios" (Sol). Só em 1895 William Ramsay isolou hélio terrestre a partir do mineral cleveíta, confirmando que o elemento solar também existia aqui.',
    properties:
      'Tem o ponto de ebulição mais baixo de todos os elementos (-269 °C) e é o único que não solidifica sob pressão normal — só vira sólido sob forte pressão. Abaixo de 2,17 K (-271 °C) torna-se superfluido: escorre sem atrito, escala paredes e atravessa fendas microscópicas. Como gás nobre, não forma compostos químicos estáveis em condições normais.',
    applications:
      'A aplicação mais valiosa é resfriar magnetos supercondutores em equipamentos de ressonância magnética (MRI), aceleradores de partículas e qubits quânticos — sem hélio líquido, essas tecnologias param. Também é usado em balões meteorológicos e dirigíveis (substituiu o hidrogênio inflamável), em mergulho profundo misturado com oxigênio (Trimix), e como gás detector de vazamentos em sistemas pressurizados.',
    curiosity:
      'Inalar hélio deixa a voz aguda porque o som viaja quase três vezes mais rápido nele do que no ar — não muda o tom das cordas vocais, mas altera os harmônicos. Mais sério: o mundo está enfrentando uma "crise do hélio" porque, uma vez liberado na atmosfera, ele se perde no espaço — não conseguimos produzir hélio em quantidade industrial, só extraí-lo de poços de gás natural.',
  },
  3: {
    overview:
      'Lítio é o metal mais leve e o elemento sólido menos denso da tabela periódica — flutua em óleo. Macio o suficiente para cortar com faca, é a base da revolução energética moderna: cada bateria de smartphone, notebook e carro elétrico depende dele. Apesar de raro no manto terrestre, está concentrado em salinas no Chile, Bolívia e Argentina (o "triângulo do lítio"), gerando uma corrida global por suprimento.',
    history:
      'Descoberto em 1817 pelo sueco Johan August Arfwedson durante a análise do mineral petalita. O nome vem do grego "lithos" (pedra), por ter sido o primeiro metal alcalino encontrado em rocha sólida em vez de cinzas vegetais ou sal marinho. Por mais de 150 anos foi uma curiosidade científica — sua revolução comercial só veio nos anos 1990 com as primeiras baterias de íon-lítio da Sony.',
    properties:
      'Metal prateado-branco macio (pode ser cortado com faca), tão leve que flutua em querosene. Funde a 180 °C. Reage com água (mais devagar que sódio, mais rápido que cálcio) liberando hidrogênio. Em chamas emite cor carmesim viva, usada em fogos de artifício vermelhos. Mais reativo que o magnésio mas menos que o sódio. Armazenado sob óleo mineral ou vácuo.',
    applications:
      'Baterias de íon-lítio dominam eletrônicos portáteis, veículos elétricos e armazenamento de energia em redes elétricas. Carbonato de lítio (Li₂CO₃) é medicamento essencial para transtorno bipolar — descoberto em 1949. Ligas com alumínio são usadas em aeronaves (mais leves). Estearato de lítio é a graxa lubrificante mais comum em equipamentos industriais. Em vidros e cerâmicas, melhora resistência a choques térmicos.',
    curiosity:
      'A demanda global de lítio multiplicou-se por 10 entre 2010 e 2024, impulsionada por carros elétricos. O Salar de Uyuni, na Bolívia, contém cerca de metade do lítio do mundo dissolvido em sua salmoura, mas extraí-lo significa evaporar milhares de litros de água em uma região onde a água é escassa — um dos maiores dilemas da transição energética: tecnologia limpa que pesa em comunidades locais.',
  },
  4: {
    overview:
      'Berílio é um metal alcalino-terroso cinza-claro, raro mas notável por uma combinação singular de propriedades: leve, rígido, transparente a raios-X e com ponto de fusão alto. Está em esmeraldas, água-marinha e crisoberilo — gemas onde traços de cromo ou ferro dão as cores. Industrialmente vai parar em aeroespacial e nuclear, mas é altamente tóxico se inalado, exigindo proteções rigorosas.',
    history:
      'Identificado pelo químico francês Louis-Nicolas Vauquelin em 1798, ao analisar berilo e esmeralda — duas pedras conhecidas há milênios, mas nunca antes ligadas a um elemento novo. Vauquelin notou um óxido distinto que ele chamou de "glucinium" (do grego "glykys", doce, por seus sais terem sabor doce — embora extremamente tóxicos). O nome "berílio" foi adotado oficialmente em 1949 pela IUPAC, derivado do mineral berilo.',
    properties:
      'Metal cinza-aço, rígido, leve (cerca de 1,8 g/cm³, dois terços da densidade do alumínio) e com módulo de elasticidade altíssimo — quase 50% maior que o aço. Funde a 1.287 °C. É transparente a raios-X mais que qualquer outro metal, usado em janelas de tubos de raio-X. Forma uma camada protetora de óxido (BeO) que resiste à corrosão. Sua poeira é altamente tóxica e cancerígena — causa beriliose, doença pulmonar crônica grave.',
    applications:
      'Componentes estruturais em telescópios espaciais (o espelho do James Webb tem 18 segmentos de berílio cobertos por uma fina camada de ouro), satélites e mísseis pela combinação rara de leveza e rigidez. Janelas de berílio em tubos de raio-X médicos e cristalógrafos. Em reatores nucleares como refletor e moderador de nêutrons. Ligas com cobre (BeCu) são molas e ferramentas não-faiscantes, usadas em refinarias e plataformas de petróleo. Esmeraldas e águas-marinhas são compostos naturais de berílio.',
    curiosity:
      'O Telescópio Espacial James Webb, lançado em 2021, tem seu espelho primário feito de 18 segmentos hexagonais de berílio puríssimo — escolhido por ser leve (para suportar o lançamento) e dimensionalmente estável a temperaturas extremas (o espelho opera a -223 °C). Cada segmento foi polido com precisão de nanômetros e coberto com uma camada de ouro de cerca de 100 átomos de espessura. O conjunto pesa 705 kg, ridiculamente leve para um espelho de 6,5 metros.',
  },
  5: {
    overview:
      'Boro é o metaloide mais leve e o único elemento não-metal exceto o carbono que forma compostos covalentes complexos — comportamento que o torna único na química. Aparece em vidro Pirex, cerâmicas resistentes a calor, ácido bórico (antisséptico) e fertilizantes. Ironicamente, embora seja essencial para plantas em traços, ainda não está claro se é essencial para humanos.',
    history:
      'Isolado de forma quase pura em 1808 por dois grupos independentes: Joseph Louis Gay-Lussac e Louis Jacques Thénard na França, e Humphry Davy na Inglaterra. O nome vem de "bórax" (tetraborato de sódio), mineral conhecido na antiguidade e usado pelos romanos em vidraçaria e ourivesaria. Boro puro só foi obtido em 1909, por Ezekiel Weintraub.',
    properties:
      'Sólido cristalino preto-acinzentado com brilho metálico, muito duro (perde apenas para o diamante entre elementos puros). Funde a 2.076 °C. É um metaloide: conduz eletricidade pobremente à temperatura ambiente, mas a condutividade aumenta com a temperatura — comportamento de semicondutor. Forma ligações covalentes inusuais, criando estruturas em formato de gaiolas (boranos) que desafiam as regras clássicas de valência.',
    applications:
      'Vidros borossilicato (Pirex) resistem a choques térmicos extremos — usados em laboratório, panelas e espelhos de telescópios. Carbeto de boro (B₄C) está entre os materiais mais duros conhecidos, usado em coletes balísticos e blindagem de tanques. Ácido bórico (H₃BO₃) é antisséptico ocular suave, e o bórax aparece em detergentes e fluxos para soldagem. Em agricultura, boro corrige deficiências em solos.',
    curiosity:
      'Em reatores nucleares, hastes de controle de boro absorvem nêutrons e "desligam" a reação em cadeia. Isso é tão eficaz que durante o desastre de Chernobyl em 1986, helicópteros despejaram milhares de toneladas de boro misturado com areia sobre o reator danificado para tentar conter a fissão descontrolada. O boro é, literalmente, a substância que freia a era nuclear.',
  },
  6: {
    overview:
      'Carbono é a base da química orgânica e de toda vida conhecida — é o quarto elemento mais abundante no universo por massa, e o 15º na crosta terrestre. Sua química especial vem da capacidade única de formar quatro ligações covalentes e cadeias longas com outros átomos de carbono, criando milhões de compostos diferentes. Sem carbono não existiriam proteínas, DNA, açúcares, plásticos, combustíveis fósseis nem grafeno.',
    history:
      'Conhecido desde a Antiguidade nas formas de carvão e fuligem, foi reconhecido como elemento químico distinto por Antoine Lavoisier em 1789, que demonstrou que o diamante e o grafite eram a mesma substância. As formas alotrópicas se sucederam ao longo dos séculos: grafite (1779), diamante (já conhecido), fulerenos C₆₀ por Kroto, Curl e Smalley em 1985 (Nobel 1996), e o grafeno isolado por Geim e Novoselov em 2004 (Nobel 2010).',
    properties:
      'Existe em formas alotrópicas radicalmente diferentes: diamante (a substância natural mais dura), grafite (macio, condutor elétrico), grafeno (folha plana de um átomo de espessura), nanotubos (cilindros de grafeno), fulerenos (gaiolas esféricas) e carbono amorfo. Sua tetravalência permite cadeias lineares, ramificadas e anéis. O carbono-14, isótopo radioativo formado pela ação dos raios cósmicos na atmosfera, é a base da datação arqueológica.',
    applications:
      'O aço carbono (ferro com 0,1% a 2% de carbono) é o material industrial mais usado da história — sua dureza depende exatamente do quanto de carbono está presente. Grafite forma o "chumbo" do lápis e os eletrodos de baterias de íons-lítio. Diamante industrial corta praticamente qualquer material. Carbono ativado purifica água e ar. Fibra de carbono é central em aeronaves modernas, raquetes de tênis e foguetes da SpaceX.',
    curiosity:
      'Diamante e grafite são quimicamente idênticos — só carbono — mas têm propriedades totalmente diferentes pela forma como os átomos se arranjam. O grafeno, uma única camada de grafite, é 200 vezes mais forte que o aço por unidade de peso, conduz eletricidade melhor que o cobre e é praticamente transparente. Em 2004, foi isolado pela primeira vez usando fita adesiva comum.',
  },
  7: {
    overview:
      'Nitrogênio compõe cerca de 78% da atmosfera terrestre na forma de gás N₂, mas a forma diatômica é tão estável que poucos seres vivos conseguem usá-lo diretamente. É essencial para a vida — está em proteínas, DNA, RNA e clorofila — mas só chega aos seres vivos através de bactérias fixadoras de nitrogênio, descargas elétricas atmosféricas ou fertilizantes industriais. Essa "barreira de acesso" molda a ecologia de praticamente todos os ecossistemas.',
    history:
      'Foi isolado em 1772 por Daniel Rutherford, que o chamou de "ar nocivo" porque não sustentava combustão nem respiração. Antoine Lavoisier o renomeou "azote" (do grego "sem vida"), nome ainda usado em francês. O nome atual veio de Jean-Antoine Chaptal em 1790, derivado de "nitro" (salitre, ou nitrato de potássio), o mineral onde o nitrogênio foi originalmente identificado.',
    properties:
      'À temperatura ambiente é um gás diatômico (N₂) extremamente estável devido à tripla ligação covalente entre os átomos — uma das ligações químicas mais fortes da natureza. Liquefaz a -196 °C. Apesar da inércia do N₂, o nitrogênio forma muitos compostos importantes: amônia (NH₃), ácido nítrico (HNO₃), nitratos, óxidos de nitrogênio e os aminoácidos que formam proteínas.',
    applications:
      'A síntese de amônia pelo processo Haber-Bosch foi uma das invenções mais transformadoras do século XX — converte N₂ atmosférico em fertilizantes que alimentam metade da humanidade. Nitrogênio líquido é o criógeno mais barato e versátil: usado em ressonância magnética, conservação de células-tronco e congelamento rápido de alimentos. Também aparece em explosivos (TNT, dinamite, pólvora) e como gás inerte para preservar componentes eletrônicos.',
    curiosity:
      'Cada raio atmosférico tem energia suficiente para quebrar a tripla ligação do N₂ e formar óxidos de nitrogênio que viram nitratos solúveis na chuva — fertilizando a Terra. Sem essa "fixação por descarga" e a fixação biológica feita por bactérias em raízes de leguminosas, não haveria proteínas suficientes no planeta para sustentar a vida complexa.',
  },
  8: {
    overview:
      'Oxigênio é o terceiro elemento mais abundante do universo e o mais abundante na crosta terrestre, presente em água, óxidos minerais e na atmosfera. É essencial para a respiração aeróbica — o processo que produz a maior parte da energia em animais, plantas e fungos. Sua alta reatividade explica tanto o fogo quanto a ferrugem: ambos são oxigênio se combinando com outros elementos e liberando energia.',
    history:
      'Independentemente descoberto por Carl Wilhelm Scheele em 1772 (publicação em 1777) e Joseph Priestley em 1774, que o isolou aquecendo óxido de mercúrio. Antoine Lavoisier deu o nome em 1777, derivado do grego "oxys" (ácido) + "genes" (gerador), por achar erroneamente que todos os ácidos precisavam de oxigênio — hipótese refutada quando se descobriu que HCl contém apenas hidrogênio e cloro.',
    properties:
      'À temperatura ambiente é um gás diatômico (O₂) incolor e inodoro; em forma líquida tem cor azul-pálida. É o segundo elemento mais eletronegativo (perde apenas para o flúor), o que explica sua avidez por elétrons em reações químicas. Existe também na forma alotrópica de ozônio (O₃), instável e altamente reativo, que filtra a radiação ultravioleta solar na estratosfera.',
    applications:
      'A indústria siderúrgica é a maior consumidora de oxigênio puro — sopra-se O₂ no ferro fundido para queimar o excesso de carbono e produzir aço. Usado em medicina hospitalar para pacientes com dificuldade respiratória, em tratamento de água e esgoto (acelera a degradação biológica), e como oxidante em foguetes (combinado com hidrogênio ou querosene). Soldagem oxi-acetilênica atinge temperaturas de 3.500 °C.',
    curiosity:
      'O oxigênio atmosférico não existia no início da Terra — foi produzido por cianobactérias fotossintetizantes há cerca de 2,4 bilhões de anos no chamado "Grande Evento de Oxidação". Para os organismos anaeróbicos da época, o oxigênio era um veneno mortal, causando uma das maiores extinções da história. A vida complexa só evoluiu porque alguns organismos aprenderam a usar essa toxina como combustível.',
  },
  9: {
    overview:
      'Flúor é o elemento mais eletronegativo e reativo da tabela periódica — tão agressivo que ataca quase todos os materiais conhecidos, incluindo vidro, asbesto e até alguns metais nobres. Apesar dessa hostilidade extrema, formas estáveis de flúor estão por toda parte na vida moderna: pasta de dente, geladeiras, panelas antiaderentes e medicamentos. É um halogênio fundamental tanto para a química industrial quanto para a saúde humana.',
    history:
      'A existência do flúor foi suspeitada por séculos, mas sua reatividade ferocíssima resistiu a todas as tentativas de isolamento — muitos químicos foram envenenados ou morreram tentando. Henri Moissan finalmente conseguiu isolá-lo em 1886, em Paris, usando eletrólise a -50 °C — uma façanha que lhe rendeu o Prêmio Nobel de Química em 1906. O nome vem do mineral "fluorita" (CaF₂), usado como fundente em metalurgia.',
    properties:
      'Gás amarelo-pálido em condições normais, com odor pungente. É o elemento mais eletronegativo da tabela periódica (3,98 na escala de Pauling), o que explica sua reatividade explosiva. Reage com praticamente tudo — incluindo gases nobres, água e materiais orgânicos, frequentemente com explosão ou ignição espontânea. Forma o ânion fluoreto (F⁻), muito estável em compostos iônicos.',
    applications:
      'O composto mais conhecido é o fluoreto de sódio (NaF) usado em creme dental e fluoretação da água potável para prevenir cáries. O politetrafluoretileno (PTFE), conhecido como Teflon, reveste panelas antiaderentes e isola fios elétricos. Hidrofluorocarbonos substituíram os CFCs em geladeiras e ar-condicionado. Hexafluoreto de urânio é central no enriquecimento de combustível nuclear. Fluoreto de hidrogênio (HF) ataca vidro, sendo usado para gravação artística.',
    curiosity:
      'O flúor é tão reativo que os primeiros químicos que tentaram isolá-lo no século XIX morreram ou ficaram permanentemente debilitados pelos vapores — Humphry Davy, Joseph Louis Gay-Lussac e os irmãos Knox foram todos envenenados. O grupo ficou conhecido como "mártires do flúor". Moissan teve sucesso usando equipamentos resfriados e fluorita sintética como eletrodo, escapando dos destinos trágicos dos antecessores.',
  },
  10: {
    overview:
      'Neônio é um gás nobre, inerte, incolor e inodoro — o quinto mais abundante no universo, mas raríssimo na atmosfera terrestre (cerca de 18 partes por milhão). Famoso pela cor laranja-avermelhada vibrante que emite quando excitado eletricamente em tubos de vidro: as "luzes de neon" que definiram a estética urbana do século XX, das marquises da Times Square aos letreiros art déco.',
    history:
      'Descoberto em 1898 por William Ramsay e Morris Travers em Londres, junto com criptônio e xenônio, durante o resfriamento e destilação fracionada do ar líquido. O nome vem do grego "neos" (novo) — o filho de Ramsay sugeriu o nome quando viu o brilho do gás. Em 1910 o engenheiro francês Georges Claude criou o primeiro letreiro de neon comercial, dando início à era das luminárias urbanas elétricas.',
    properties:
      'Gás nobre monoatômico (Ne), inerte em quase todas as condições — não forma compostos químicos estáveis em laboratório. Liquefaz a -246 °C. Quando submetido a alta voltagem em tubos de vidro, emite intensa luz laranja-avermelhada (a 632,8 nm é a linha característica). Tem a faixa de fase líquida mais estreita de todos os elementos — só 2,6 °C entre fusão e ebulição.',
    applications:
      'A aplicação mais reconhecível são os letreiros de neon — embora muitas "luzes de neon" modernas na verdade contenham argônio, hélio ou outros gases para produzir cores diferentes (azul, verde, amarelo). Indicadores de alta-tensão usam tubos de neon de pequena potência. Neônio líquido é criogênico usado em laboratórios. Lasers de hélio-neônio (famosos pelo feixe vermelho) foram padrão em leitores de código de barras de supermercados.',
    curiosity:
      'As luzes de Las Vegas, da Times Square e dos cinemas dos anos 1930-50 deviam sua estética distintiva ao neônio. Mas a era dourada acabou — LEDs modernos são mais eficientes, duradouros e baratos. Organizações como o Neon Museum em Las Vegas resgatam letreiros antigos como peças históricas. Curiosamente, o neônio puro só produz a cor laranja-avermelhada; todas as outras "cores de neon" usam gases diferentes ou tubos com revestimento fluorescente.',
  },
  11: {
    overview:
      'Sódio é um metal alcalino macio e prateado, tão reativo que nunca aparece puro na natureza — só em compostos como o sal de cozinha (NaCl), bicarbonato (NaHCO₃) e soda cáustica (NaOH). É o sexto elemento mais abundante na crosta terrestre e essencial para a vida: os íons Na⁺ regulam o equilíbrio de fluidos, a contração muscular e a transmissão de impulsos nervosos em praticamente todos os animais.',
    history:
      'Isolado por Humphry Davy em 1807 através da eletrólise da soda cáustica fundida (NaOH) — no mesmo ano em que isolou o potássio pelo método análogo. O nome "sódio" vem do latim "sodanum" (um antigo remédio para dor de cabeça à base de carbonato de sódio). O símbolo Na vem de "natrium", a palavra latina para natrão, o mineral de carbonato de sódio usado pelos egípcios na mumificação.',
    properties:
      'É tão macio que pode ser cortado com uma faca, e fresco recém-cortado revela um brilho metálico que oxida em segundos no ar. Reage violentamente com a água, liberando hidrogênio que pode inflamar — por isso é armazenado em querosene ou óleo mineral. Funde a apenas 98 °C. Em chamas emite a cor amarela característica que dá a tonalidade às lâmpadas de vapor de sódio.',
    applications:
      'O cloreto de sódio (sal de cozinha) é o composto mais conhecido — usado em conservação, tempero e dieta humana. O hidróxido de sódio (soda cáustica) é fundamental na fabricação de sabão, papel, alumínio e produtos químicos. Sódio líquido é usado como fluido de transferência de calor em reatores nucleares de quarta geração. Lâmpadas de vapor de sódio iluminam a maioria das ruas e rodovias do mundo.',
    curiosity:
      'A cor amarela alaranjada característica das lâmpadas de rua (e de fogos de artifício) vem de uma única transição eletrônica no átomo de sódio, em 589 nm — tão estreita e definida que astrônomos a usam como referência para calibrar telescópios. Essa mesma linha foi observada por Joseph von Fraunhofer no espectro solar em 1814, antes mesmo de se entender que era sódio.',
  },
  12: {
    overview:
      'Magnésio é um metal alcalino-terroso leve e prateado, o oitavo elemento mais abundante na crosta terrestre. Sua densidade é apenas dois terços da do alumínio, o que o torna o metal estrutural mais leve disponível. Biologicamente é essencial: é o átomo central da clorofila — a molécula que dá cor verde às plantas e sustenta praticamente toda a fotossíntese do planeta.',
    history:
      'O químico escocês Joseph Black o reconheceu como elemento distinto em 1755, mas foi Humphry Davy quem o isolou em 1808, eletrolisando uma mistura de óxido de magnésio e mercúrio. O nome vem da região de Magnésia, na Grécia antiga, onde o mineral magnesita (carbonato de magnésio) era abundante. Por séculos foi confundido com o cálcio antes de ser identificado como um elemento próprio.',
    properties:
      'Leve, prateado e tão reativo que arde com uma chama branca brilhante e ofuscante quando aquecido. Por peso, é mais forte que o aço — uma característica que o torna valioso onde cada grama conta. Forma uma fina camada de óxido na superfície que protege contra corrosão adicional, embora em pó ou tira fina queime facilmente em presença de oxigênio.',
    applications:
      'Ligas de magnésio aparecem em fuselagens de aeronaves, rodas de carros de corrida, laptops e câmeras — qualquer lugar onde reduzir peso justifica o custo. Foi o ingrediente clássico dos flashes fotográficos antes do nascimento do flash eletrônico. Em química orgânica, os reagentes de Grignard (compostos organomagnésicos) permitem formar ligações carbono-carbono e são pedra angular da síntese moderna.',
    curiosity:
      'A fotossíntese existe porque o magnésio fica exatamente no centro da molécula de clorofila, ligado a quatro anéis de nitrogênio. É esse arranjo que captura fótons solares e dispara a reação que transforma CO₂ em açúcares — e oxigênio como subproduto. Sem magnésio não haveria plantas verdes, e portanto nem atmosfera respirável.',
  },
  13: {
    overview:
      'Alumínio é o metal mais abundante na crosta terrestre, formando cerca de 8% de sua massa. Apesar disso, foi um dos últimos metais comuns a ser dominado pela humanidade — era considerado mais precioso que ouro até o final do século XIX, quando descobriram como extraí-lo barato por eletrólise. Hoje é o segundo metal mais usado no mundo, atrás apenas do ferro.',
    history:
      'Isolado pela primeira vez por Hans Christian Ørsted em 1825 em forma impura. Por décadas continuou raríssimo: Napoleão III tinha talheres de alumínio reservados para seus convidados mais ilustres — pratos de ouro para os outros. Em 1886, Charles Martin Hall e Paul Héroult, trabalhando independentemente, descobriram o processo eletrolítico que reduziu o preço do alumínio em cerca de 200 vezes em uma década.',
    properties:
      'Branco-prateado, leve (apenas um terço da densidade do aço), maleável, dúctil e não-magnético. Forma instantaneamente uma camada microscópica de óxido (Al₂O₃) que protege o metal interno da corrosão. Excelente condutor elétrico e térmico, embora menos que o cobre por seção transversal. Reciclável indefinidamente sem perder qualidade.',
    applications:
      'Latas de bebida, esquadrias, papel-alumínio para cozinha, fuselagens de aeronaves, automóveis modernos, fios de transmissão elétrica de longa distância (substitui o cobre por ser mais barato e leve), eletrônicos e embalagens. Quase tudo que voa hoje em dia é majoritariamente alumínio. Ligas de alumínio com cobre, magnésio e zinco são tão resistentes quanto aço, mas três vezes mais leves.',
    curiosity:
      'O topo do Monumento a Washington, instalado em 1884, é uma peça piramidal de alumínio pesando cerca de 2,8 kg. Na época custou mais que prata. Apenas dois anos depois, o processo Hall-Héroult tornou o alumínio um material de consumo, e o ouro deixou de ser o único metal "nobre" exibido em monumentos importantes.',
  },
  14: {
    overview:
      'Silício é o segundo elemento mais abundante na crosta terrestre depois do oxigênio, formando cerca de 28% de sua massa. É um metaloide cinza-azulado com brilho metálico — quimicamente similar ao carbono mas com propriedades elétricas únicas que o tornaram a base da era digital. De areia comum surgiu o microchip, os painéis solares e o vidro. Sem silício, não haveria Vale do Silício.',
    history:
      'Isolado pela primeira vez por Jöns Jacob Berzelius em 1824 a partir do tetrafluoreto de silício. O nome vem do latim "silex" (pedra de sílex, ou pederneira) — a pedra dura usada para fazer fogo desde a pré-história. A revolução do silício começou em 1947 nos laboratórios Bell com o primeiro transistor, e explodiu nos anos 1960 com a invenção do circuito integrado por Robert Noyce e Jack Kilby.',
    properties:
      'Sólido cristalino de cor cinza azulada com brilho metálico. É um semicondutor — não conduz tão bem quanto metais, mas conduz melhor que isolantes — e a condutividade pode ser ajustada com precisão através de "dopagem" com pequenas quantidades de fósforo ou boro. Funde a 1.414 °C. Forma compostos importantes: dióxido de silício (SiO₂, areia/quartzo), carbeto de silício (cerâmica resistente) e silicatos (a base da maioria das rochas).',
    applications:
      'Microchips de silício são o cérebro de praticamente todo dispositivo eletrônico — processadores, memórias, sensores de câmera. Painéis solares fotovoltaicos usam silício cristalino para converter luz em eletricidade. Vidro é dióxido de silício fundido. Silicones (polímeros de silício) aparecem em cosméticos, implantes médicos, vedações e óleos lubrificantes. Aço com silício é usado em transformadores elétricos.',
    curiosity:
      'A "lei de Moore" — que previu a duplicação do número de transistores em chips a cada dois anos — sustentou a revolução digital por mais de 50 anos. Em 1971, o primeiro processador Intel tinha 2.300 transistores. Em 2024, um único chip Apple M3 Max tem cerca de 92 bilhões de transistores. Cada transistor é uma estrutura minúscula em uma pastilha de silício, gravada por luz ultravioleta extrema.',
  },
  15: {
    overview:
      'Fósforo é um não-metal essencial à vida — está em todo átomo de DNA, RNA, ATP e nos fosfolipídios das membranas celulares. Sem fósforo, nenhuma célula viva pode armazenar energia ou transmitir informação genética. Aparece em várias formas alotrópicas dramaticamente diferentes: branco (inflamável e tóxico), vermelho (estável, em fósforos de palito) e negro (semelhante ao grafite, raro).',
    history:
      'Descoberto em 1669 pelo alquimista alemão Hennig Brand, que destilou enormes quantidades de urina em busca da pedra filosofal. Em vez disso, obteve um resíduo branco-amarelado que brilhava no escuro — o fósforo branco. O nome vem do grego "phosphoros" (portador de luz). Por décadas foi a substância mais cara do mundo. Em 1845, o alemão Anton Schrötter descobriu o fósforo vermelho, mais estável.',
    properties:
      'Tem três alotropos principais. Branco: ceroso, translúcido, inflamável ao ar (acende a 30 °C), brilha no escuro (fosforescência) e é extremamente tóxico. Vermelho: amorfo, estável, não-tóxico, usado em fósforos de segurança. Negro: forma mais estável termodinamicamente, semicondutor com estrutura semelhante ao grafite. O fósforo branco oxida espontaneamente, daí precisa ser armazenado submerso em água.',
    applications:
      'Fertilizantes (na forma de fosfatos minerais) são o maior uso — junto com nitrogênio e potássio, sustentam toda a agricultura moderna. Fósforos de palito modernos usam o fósforo vermelho na lixa lateral (não na cabeça do palito). Em metalurgia, melhora a qualidade do aço. Detergentes contêm trifosfato de sódio (embora cada vez menos, por causar eutrofização de águas). Ácido fosfórico (H₃PO₄) é o que dá o sabor ácido típico de refrigerantes de cola.',
    curiosity:
      'O alquimista Hennig Brand acreditava que urina dourada continha o segredo para fazer ouro. Ele destilou cerca de 5.500 litros de urina em 1669 antes de obter um resíduo brilhante — não ouro, mas a primeira amostra de fósforo branco da história. Por décadas, alquimistas mantiveram o método em segredo, vendendo o "milagre luminoso" por preços astronômicos a nobres curiosos pela Europa.',
  },
  16: {
    overview:
      'Enxofre é um não-metal amarelo brilhante, conhecido desde a Antiguidade — aparece em depósitos vulcânicos puros, com seu cheiro inconfundível de "ovos podres" (na verdade, sulfeto de hidrogênio H₂S, não enxofre puro). É essencial para a vida (proteínas, aminoácidos como cisteína e metionina, vitamina B1) e é o 16º elemento mais abundante na crosta terrestre, concentrado em zonas vulcânicas e jazidas de petróleo.',
    history:
      'Conhecido desde a pré-história — depósitos vulcânicos amarelos foram queimados por egípcios, gregos e romanos como remédio, branqueador e arma. A palavra "sulfur" vem do latim, mas a etimologia anterior não é certa (pode ser do sânscrito "sulvere", fogo). Era central na alquimia junto com mercúrio. Foi reconhecido como elemento químico por Antoine Lavoisier em 1777, refutando a teoria do flogisto.',
    properties:
      'Sólido amarelo-vivo à temperatura ambiente. Mau condutor elétrico e térmico. Funde a 115 °C (em sua forma α). Tem múltiplas formas alotrópicas — a mais comum é o anel S₈, oito átomos em coroa. Queima com chama azul produzindo dióxido de enxofre (SO₂) de cheiro acre. Forma sulfetos com a maioria dos metais e o ácido mais usado industrialmente: o sulfúrico (H₂SO₄). Insolúvel em água, dissolve em CS₂.',
    applications:
      'Ácido sulfúrico é o produto químico mais produzido do mundo — base para fertilizantes (especialmente superfosfato), refino de petróleo, baterias de chumbo-ácido, processamento de minérios e fabricação de praticamente qualquer química industrial. Vulcanização da borracha (descoberta por Charles Goodyear em 1839) usa enxofre para criar ligações entre cadeias poliméricas. Em medicina, as sulfas foram os primeiros antibióticos modernos.',
    curiosity:
      'O cheiro de "ovo podre" não vem do enxofre puro — vem do sulfeto de hidrogênio (H₂S), o gás liberado quando proteínas com enxofre se decompõem. O nariz humano detecta H₂S em concentrações tão baixas quanto 0,5 partes por bilhão, tornando-o um dos cheiros mais potentes que percebemos. Acima de 100 ppm, no entanto, o H₂S anestesia o olfato — alta concentração não cheira a nada, o que o torna mortalmente traiçoeiro em fossas e estábulos.',
  },
  17: {
    overview:
      'Cloro é um gás amarelo-esverdeado, altamente reativo e tóxico — um dos halogênios. Apesar de mortal em altas concentrações, é fundamental para a vida moderna: o sal de cozinha (NaCl) contém cloro, e a desinfecção da água potável com cloro evitou milhões de mortes por doenças transmitidas pela água. Também é essencial na produção de PVC, papel, têxteis e medicamentos.',
    history:
      'Isolado por Carl Wilhelm Scheele em 1774, que não percebeu que era um elemento — pensou que continha oxigênio. Humphry Davy demonstrou em 1810 que era um elemento puro e o batizou pelo grego "chloros" (verde-amarelado). Sua infame estreia bélica foi em 1915, em Ypres, na Primeira Guerra Mundial — o primeiro uso em larga escala de armas químicas modernas, matando milhares de soldados aliados.',
    properties:
      'Gás diatômico (Cl₂) amarelo-esverdeado com odor pungente e sufocante. Extremamente reativo: o segundo halogênio mais eletronegativo (perde só para o flúor). Liquefaz a -34 °C sob pressão. Reage com quase todos os elementos formando cloretos. Em água forma ácido hipocloroso (HClO), o agente desinfetante que mata patógenos em piscinas e estações de tratamento.',
    applications:
      'A desinfecção de água potável com cloro é considerada uma das maiores invenções de saúde pública — eliminou cólera, tifoide e disenteria em cidades. PVC (cloreto de polivinila) é o terceiro plástico mais produzido do mundo, usado em encanamentos, fios e janelas. Cloro é central em produção de papel, têxteis, plásticos e em síntese farmacêutica. Hipoclorito de sódio é o ingrediente ativo da água sanitária.',
    curiosity:
      'O cheiro forte de uma piscina ou de um banheiro recém-limpo não é exatamente cloro puro — é cloramina, formada quando o cloro reage com amônia (suor, urina, restos orgânicos). Quanto mais forte o cheiro, mais contaminada está a água. Uma piscina "cheirando bem a cloro" é, paradoxalmente, uma piscina pouco limpa: o cloro fresco em água limpa tem cheiro quase imperceptível.',
  },
  18: {
    overview:
      'Argônio é o terceiro gás mais abundante na atmosfera terrestre (cerca de 0,93%), maior do que todos os outros gases nobres combinados. Incolor, inodoro e quimicamente inerte — é o gás nobre mais comum no nosso entorno. Apesar de invisível, é usado industrialmente em quantidades enormes em soldagem, lâmpadas e janelas isolantes. Seu nome vem do grego "argos" (preguiçoso), refletindo sua resistência a reagir com outros elementos.',
    history:
      'Descoberto em 1894 por Lord Rayleigh e William Ramsay no Reino Unido, quando perceberam que o nitrogênio extraído do ar era ligeiramente mais denso que o nitrogênio puro produzido em laboratório. Após remover oxigênio, dióxido de carbono e umidade do ar, eles isolaram um gás residual que não reagia com nada — o argônio. Esse trabalho rendeu o Nobel a Ramsay em 1904, e abriu o caminho para descobertas de neônio, criptônio e xenônio.',
    properties:
      'Gás nobre monoatômico (Ar), incolor, inodoro e insípido. Liquefaz a -186 °C. É quase totalmente inerte — apesar de o argônio fluorohidreto (HArF) ter sido sintetizado em 2000, é estável só abaixo de -265 °C. Tem três isótopos estáveis. Cerca de 99% do argônio atmosférico é Ar-40, formado pelo decaimento radioativo de K-40 nas rochas ao longo de bilhões de anos. Apresenta cor lilás-rosada quando excitado eletricamente.',
    applications:
      'A maior aplicação é como atmosfera inerte: protege metais fundidos durante soldagem (TIG, MIG) contra oxidação, especialmente em aço inox, alumínio e titânio. Preenche lâmpadas incandescentes e fluorescentes (junto com mercúrio) para evitar oxidação do filamento. Janelas de vidro duplo selam argônio entre os painéis para isolamento térmico — uma das tecnologias mais eficientes em construção sustentável. Atmosfera protetora em museus, preservando documentos antigos.',
    curiosity:
      'A Constituição dos Estados Unidos, a Declaração de Independência e a Carta de Direitos são armazenadas em vitrines pressurizadas com argônio nos Arquivos Nacionais em Washington — uma decisão tomada em 2003. O gás impede que o oxigênio degrade o pergaminho ao longo dos séculos. Curiosamente, o argônio gasoso usado para preservar os documentos fundadores é o mesmo gás que os fundadores respiravam — apenas concentrado.',
  },
  19: {
    overview:
      'Potássio é um metal alcalino macio e prateado, tão reativo quanto o sódio — explodindo em contato com água. Apesar disso, é absolutamente essencial para a vida: cada célula do seu corpo depende de íons K⁺ para regular pressão osmótica, contração muscular e transmissão nervosa. Em escala industrial, sua maior aplicação é como fertilizante — alimenta literalmente as plantações do mundo.',
    history:
      'Isolado por Humphry Davy em 1807 — no mesmo ano em que ele isolou o sódio, por eletrólise da soda cáustica e da potassa cáustica. O nome "potássio" vem de "potassa" (cinzas de plantas queimadas em pote, do inglês "pot ash"), o método antigo de obtenção da substância. O símbolo K vem do latim "kalium", derivado do árabe "al-qali" (cinzas vegetais), que também deu origem à palavra "álcali".',
    properties:
      'Metal prateado tão macio que pode ser cortado com faca. Funde a apenas 63 °C. Reage violentamente com água, frequentemente com chama lilás característica e explosão. Armazenado sob óleo mineral para evitar oxidação. Em chamas emite cor violeta-rosada que distingue potássio de sódio no teste de chama. Tem um isótopo radioativo natural (K-40) com meia-vida de 1,25 bilhão de anos.',
    applications:
      'Cloreto de potássio (KCl) é o ingrediente fertilizante mais usado do mundo — junto com nitrogênio e fósforo, sustenta a agricultura moderna. Hidróxido de potássio (KOH) é base de sabão líquido (sabão "verde") e baterias alcalinas. Permanganato de potássio (KMnO₄) é desinfetante e oxidante em laboratórios. Nitrato de potássio é componente da pólvora negra e de fogos de artifício (chama lilás).',
    curiosity:
      'Cada um de nós contém naturalmente cerca de 140 gramas de potássio, dos quais aproximadamente 0,012% é K-40 radioativo. Isso significa que seu corpo emite cerca de 4.000 desintegrações radioativas por segundo só do potássio interno. É a maior fonte natural de radioatividade do corpo humano, mas é tão baixa que não causa dano. Bananas são famosas por terem potássio, mas mesmo elas não são radioativas o suficiente para serem preocupantes.',
  },
  20: {
    overview:
      'Cálcio é o quinto elemento mais abundante na crosta terrestre e o metal mais abundante no corpo humano — formando ossos, dentes, conchas e cascas de ovo. É um metal alcalino-terroso macio e prateado, mas raramente aparece puro: quase sempre em compostos como calcário, mármore, gesso e cal. Sem cálcio, não há esqueleto, contração muscular nem coagulação sanguínea.',
    history:
      'Compostos de cálcio são usados há milênios — pirâmides egípcias e construções romanas eram unidas com argamassa de cal (CaO). Humphry Davy o isolou pela primeira vez em 1808, usando eletrólise. O nome vem do latim "calx" (cal viva), a substância obtida pela queima de calcário. O ciclo do calcário (rochas → cal → argamassa → carbonato endurecido) é uma das mais antigas reações químicas controladas pela humanidade.',
    properties:
      'Metal prateado macio que oxida rapidamente formando uma camada cinza-amarelada. Funde a 842 °C. Reage com água — embora mais devagar que sódio ou potássio — liberando hidrogênio. Em chamas emite cor laranja-avermelhada. Seu carbonato (CaCO₃) é insolúvel em água pura, mas se dissolve em água com CO₂ — processo que esculpe cavernas e estalactites ao longo de milênios.',
    applications:
      'Carbonato de cálcio (calcário, mármore) é o ingrediente principal do cimento Portland, base da construção civil moderna. Hidróxido de cálcio (cal hidratada) neutraliza ácidos em solos agrícolas e tratamentos de água. Sulfato de cálcio é o gesso (drywall, moldes ortopédicos). No corpo, fosfato de cálcio dá rigidez aos ossos e dentes. Suplementos de cálcio são prescritos para prevenir osteoporose.',
    curiosity:
      'Os ossos do seu corpo se renovam constantemente — cerca de 10% do esqueleto é substituído por ano. Isso significa que o cálcio nos seus ossos hoje não é o mesmo que estava ali há sete anos. O processo envolve dois tipos de células: osteoclastos quebram osso antigo e osteoblastos formam osso novo. Após os 35 anos, a degradação começa a superar a formação — é por isso que osteoporose é mais comum na velhice.',
  },
  21: {
    overview:
      'Escândio é um metal de transição prateado, raro mas não excessivamente — o 35º elemento mais abundante na crosta. Apesar disso, sua mineração é tão dispersa e técnica que historicamente foi mais raro e caro que ouro. Combina leveza, alta resistência mecânica e excelente comportamento em altas temperaturas, sendo cobiçado em ligas aeroespaciais. A China detém quase todo o suprimento estratégico mundial atual.',
    history:
      'Previsto por Mendeleev em 1869 como "ekaborium" — um elemento hipotético abaixo do boro na tabela periódica. Foi descoberto em 1879 pelo químico sueco Lars Fredrik Nilson em Uppsala, no mineral euxenita. O nome vem de "Scandinavia" (Escandinávia), terra de Nilson. Foi outra previsão acertada de Mendeleev: massa atômica, densidade e estado de oxidação preditos teoricamente bateram com os experimentais.',
    properties:
      'Metal cinza-prateado leve (densidade 2,99 g/cm³, quase a do alumínio), maleável, com ponto de fusão alto (1.541 °C). Oxida-se em ar úmido formando uma camada amarelo-rosada. Reage com água lentamente. Quimicamente parecido com ítrio e os lantanídeos, embora classificado como metal de transição. Tem apenas um isótopo estável (Sc-45) e produz cores intensas em compostos por absorção UV.',
    applications:
      'Ligas alumínio-escândio (Al-Sc) são até 50% mais resistentes que ligas convencionais e mantêm propriedades em altas temperaturas — usadas em estruturas de aeronaves militares russas (MIG-29, Su-27) e cada vez mais em civis. Lâmpadas de iodeto metálico com escândio produzem luz semelhante à solar usada em estádios e tomografia. Entre raras-terras, é usado em catalisadores para refino de petróleo e cerâmicas avançadas.',
    curiosity:
      'Por décadas, a produção mundial total de escândio era tão pequena que cabia em uma única caminhonete. Em 2014, estima-se que apenas 15-25 toneladas foram produzidas globalmente — comparado a milhões de toneladas de ferro ou alumínio. A escassez não é geológica (existem reservas suficientes) mas econômica: minerar escândio em quantidade requer descobertas como subproduto de outras extrações, e tudo isso por trás de geopolítica chinesa de raras-terras.',
  },
  22: {
    overview:
      'Titânio é um metal cinza prateado, leve como alumínio mas tão forte quanto aço — combinação rara que o torna indispensável em aeroespacial, próteses médicas e equipamentos esportivos de alta performance. É o nono elemento mais abundante na crosta terrestre, mas extrair o metal puro do minério é caro, mantendo-o em uma faixa de preço intermediária entre commodities e metais preciosos.',
    history:
      'Identificado independentemente em 1791 na Inglaterra por William Gregor e em 1795 na Alemanha por Martin Heinrich Klaproth, que o batizou pelos Titãs da mitologia grega — os gigantes filhos de Urano e Gaia. Mas o titânio metálico puro só foi obtido em 1910 por Matthew A. Hunter, e a produção em larga escala começou apenas em 1940 com o processo Kroll, ainda usado hoje.',
    properties:
      'Metal prateado de baixa densidade (4,5 g/cm³ — cerca de 60% mais leve que o aço) mas com resistência mecânica comparável ao aço inoxidável. Funde a 1.668 °C. Forma uma camada protetora de óxido (TiO₂) que o torna excepcionalmente resistente à corrosão — até em água do mar, ácidos e fluidos corporais. É biocompatível: o corpo humano não o rejeita.',
    applications:
      'Componentes estruturais em aeronaves, foguetes e submarinos — onde resistência por unidade de peso importa muito. Implantes médicos (próteses de quadril, parafusos ortopédicos, implantes dentários) por sua biocompatibilidade. Dióxido de titânio (TiO₂) é o pigmento branco mais usado do mundo — em tintas, cosméticos, plásticos e pasta de dente. Quadros de bicicleta, raquetes e tacos de golfe de alta gama usam ligas de titânio.',
    curiosity:
      'O SR-71 Blackbird, o avião tripulado mais rápido já construído (mais de Mach 3), era feito em 85% de titânio. O paradoxo: os EUA precisavam de titânio puro mas as melhores reservas estavam na União Soviética. Durante a Guerra Fria, a CIA criou empresas-fantasma em outros países para comprar o titânio soviético — efetivamente usando o metal do inimigo para construir aviões espiões que sobrevoavam o próprio inimigo.',
  },
  23: {
    overview:
      'Vanádio é um metal de transição cinza-prateado, duro e resistente à corrosão. Sua adição em pequenas quantidades (0,15-0,25%) ao aço produz um material muito mais resistente e tenaz — base de ferramentas, molas e componentes mecânicos exigentes. Recentemente ganhou destaque em baterias de fluxo de vanádio (VRFB), candidatas a armazenamento de energia em larga escala para redes elétricas.',
    history:
      'Descoberto duas vezes: em 1801 pelo mineralogista mexicano Andrés Manuel del Río em minerais do México (que o chamou de "eritrônio"), e redescoberto em 1830 pelo químico sueco Nils Gabriel Sefström. Sefström lhe deu o nome atual em homenagem à deusa nórdica Vanadis (Freyja) — pela beleza colorida de seus sais (variam de verde, azul, amarelo e violeta segundo o estado de oxidação). Henry Roscoe isolou o metal puro em 1867.',
    properties:
      'Metal cinza-prateado, duro, dúctil e bastante resistente à corrosão por ácidos e álcalis. Funde a 1.910 °C. Tem cinco estados de oxidação (de 0 a +5), cada um com cor distinta em solução aquosa — verde (V³⁺), azul (V⁴⁺), amarelo (V⁵⁺). Esse comportamento multivalente é o que possibilita as baterias de fluxo. Forma carbeto de vanádio (VC), um dos materiais mais duros conhecidos.',
    applications:
      'Cerca de 85% da produção vai para aços especiais — aços-vanádio em ferramentas (chaves, brocas, lâminas), molas de carro, eixos e tubulações de alta pressão. Baterias de fluxo de vanádio (VRFB) armazenam energia de fontes renováveis em grandes instalações, com vida útil superior a 20 anos. Catalisadores para produção de ácido sulfúrico (processo de contato). Em quantidades traço, pode ser nutriente para alguns organismos marinhos.',
    curiosity:
      'O vanádio é tão essencial para alguns invertebrados marinhos que algumas ascídias (tunicados, "limões-do-mar") concentram vanádio do oceano em níveis 10 milhões de vezes maiores que a água ao redor. Cientistas suspeitam que esse acúmulo seja parte de defesa química ou metabolismo respiratório alternativo, mas o motivo exato continua um mistério biológico após décadas de pesquisa.',
  },
  24: {
    overview:
      'Cromo é um metal de transição prateado-azulado conhecido pela cor brilhante e altíssima resistência à corrosão. Sua aplicação mais conhecida é como camada protetora em aço inoxidável, peças automotivas e revestimentos decorativos. Apesar do brilho atraente, alguns compostos de cromo estão entre os agentes cancerígenos mais documentados — uma dualidade que define sua história industrial.',
    history:
      'Descoberto em 1797 pelo químico francês Louis-Nicolas Vauquelin a partir do mineral crocoíta, um cromato de chumbo. O nome vem do grego "chroma" (cor), porque seus compostos exibem cores intensas e variadas — verde, amarelo, laranja, vermelho-sangue. Vauquelin notou que as esmeraldas e rubis devem suas cores a traços de cromo. Foi industrialmente usado a partir do século XIX em pigmentos e couro curtido.',
    properties:
      'Metal cinza-prateado com tom azulado, extremamente duro (o mais duro entre os metais comuns), com ponto de fusão de 1.907 °C. Forma uma camada finíssima de óxido (Cr₂O₃) que protege o metal interno da corrosão — o segredo do aço inoxidável. Tem múltiplos estados de oxidação (+2, +3, +6), cada um com propriedades químicas distintas. O Cr(VI) (cromo hexavalente) é altamente tóxico e cancerígeno.',
    applications:
      'A aplicação dominante é o aço inoxidável (geralmente 10-30% de cromo), usado em utensílios de cozinha, eletrodomésticos, instrumentos cirúrgicos, arquitetura e indústria química. Cromagem decorativa de peças automotivas e banheiros. Pigmentos: amarelo cromo (PbCrO₄), verde óxido de cromo, vermelho-laranja molibdato de cromo. Curtimento de couro com cromo. Em ligas, aumenta dureza e resistência a abrasão.',
    curiosity:
      'O caso real que inspirou o filme "Erin Brockovich" (2000) envolveu contaminação de água por cromo hexavalente em Hinkley, Califórnia, causada pela companhia Pacific Gas & Electric. Centenas de moradores desenvolveram câncer e outras doenças. O processo resultou em uma das maiores indenizações de processo coletivo da história americana — US$ 333 milhões em 1996. O caso transformou Cr(VI) em ícone de poluição industrial.',
  },
  25: {
    overview:
      'Manganês é um metal de transição cinza-rosado, duro mas frágil, essencial em ligas de aço e baterias modernas. Cerca de 90% da produção mundial de manganês vai para a siderurgia — sem ele, não há aço estrutural moderno. Também é nutriente essencial em traços para todos os seres vivos, atuando em enzimas que protegem células de danos oxidativos.',
    history:
      'Reconhecido como elemento em 1774 pelo sueco Carl Wilhelm Scheele, e isolado no mesmo ano por Johan Gottlieb Gahn aquecendo dióxido de manganês com carvão. O nome vem do mineral "magnesia nigra" (magnésia negra), o pirolusita (MnO₂), conhecido na Antiguidade e usado para clarear vidro — não confundir com magnésio, que veio do mesmo nome mineralógico, mas é elemento distinto.',
    properties:
      'Metal cinza-prateado com tom rosado, duro mas tão frágil que pode ser quebrado com martelo. Funde a 1.246 °C. Forma cinco estados de oxidação principais (+2, +3, +4, +6, +7), cada um com cor característica em solução — daí o permanganato de potássio (KMnO₄) ser violeta intenso. Reage com água quente e oxida rapidamente em ar úmido.',
    applications:
      'Em siderurgia é adicionado ao aço para aumentar dureza, resistência ao desgaste e tenacidade — sem ele, o aço seria muito frágil para construção. Aço Hadfield (com 12-14% Mn) é usado em britadores, ferrovias e cofres por sua dureza excepcional sob impacto. Pilhas alcalinas usam dióxido de manganês (MnO₂) como catodo. Permanganato de potássio é desinfetante e oxidante em laboratórios. Baterias de íon-lítio modernas (catodo NMC) contêm manganês.',
    curiosity:
      'No fundo dos oceanos existem "nódulos de manganês" — bolas escuras do tamanho de batatas, formadas lentamente ao longo de milhões de anos por processos químicos e biológicos. Contêm manganês, ferro, cobre, níquel e cobalto. Estima-se que existam trilhões de toneladas no leito oceânico, mas a mineração comercial é controversa: pode devastar ecossistemas únicos das profundezas que ainda mal entendemos.',
  },
  26: {
    overview:
      'Ferro é o metal mais comum da Terra — forma a maior parte do núcleo planetário e cerca de 5% da crosta. É o pilar da civilização industrial: das colunas de prédios às lâminas de bisturi, das pontes pênseis aos satélites em órbita. Biologicamente, é o átomo no centro da hemoglobina, transportando oxigênio pelo sangue de quase todos os animais com sistema circulatório.',
    history:
      'Ferramentas de ferro foram usadas há cerca de 5.000 anos a partir de meteoritos caídos. Os hititas dominaram a fundição do minério de ferro por volta de 1500 a.C., dando início à Idade do Ferro — sucedendo a Idade do Bronze. O processo Bessemer, inventado em 1855, permitiu a produção em massa de aço barato e desencadeou a Segunda Revolução Industrial, com ferrovias, navios a vapor e arranha-céus.',
    properties:
      'Cinza-prateado, fortemente magnético (junto com cobalto e níquel), maleável e dúctil. Oxida facilmente em ar úmido, formando ferrugem (óxido de ferro hidratado) que não protege contra corrosão adicional. Tem quatro formas alotrópicas que mudam de estrutura cristalina conforme a temperatura. Ponto de fusão de 1.538 °C. É o núcleo mais estável conhecido — o auge da curva de energia de ligação nuclear.',
    applications:
      'O aço (ferro com 0,1% a 2% de carbono) responde por cerca de 95% de toda a produção mundial de metal. Ferro fundido em motores, blocos de cilindro e tubos. Aço inoxidável (com cromo) para utensílios de cozinha, instrumentos cirúrgicos e arquitetura. Hemoglobina e mioglobina dependem do ferro para transportar oxigênio. Ímãs permanentes feitos de ligas ferromagnéticas.',
    curiosity:
      'O ferro é o elemento mais pesado que estrelas comuns conseguem produzir por fusão em seus núcleos — fundir átomos de ferro consome energia em vez de liberar, então as estrelas param ali e colapsam em supernova. Todo átomo de ferro mais pesado no universo, incluindo o do seu sangue, foi forjado em explosões estelares cataclísmicas ou colisões de estrelas de nêutrons.',
  },
  27: {
    overview:
      'Cobalto é um metal de transição cinza-azulado, ferromagnético como o ferro e o níquel. Conhecido por séculos pelo pigmento azul intenso usado em vidros e cerâmicas — o "azul cobalto" — hoje é mais estratégico como componente de baterias de íon-lítio para carros elétricos. A maior parte da produção mundial vem da República Democrática do Congo, em condições de mineração frequentemente problemáticas.',
    history:
      'Mineiros alemães medievais conheciam um mineral azul que envenenava trabalhadores sem produzir metal — culpavam um espírito malicioso chamado "Kobold" (gnomo das montanhas). Em 1735 Georg Brandt provou que o "kobold" era um elemento novo, batizando-o de cobalto. Os egípcios, persas e chineses usavam compostos de cobalto há milênios em vidros e azulejos azuis, sem saber a química por trás.',
    properties:
      'Metal cinza com tom azulado, duro, ferromagnético até 1.121 °C (acima dessa temperatura perde o magnetismo). Ponto de fusão de 1.495 °C. Forma compostos coloridos intensos — sais de Co(II) são rosa em solução aquosa, azuis quando anidros (princípio do "vidro de cobalto" e dos testes de umidade). É radioativamente importante: cobalto-60, isótopo sintético, é usado em radioterapia e esterilização industrial.',
    applications:
      'Catodos de baterias de íon-lítio (especialmente em celulares e carros elétricos) são o maior uso atual — cerca de 50% da demanda. Pigmentos: azul cobalto em vidros, cerâmicas e tintas a óleo. Superligas com cobalto suportam turbinas de aviões em alta temperatura. Catalisadores para hidrocarbonetos e fabricação de plásticos. Cobalto-60 em equipamentos de radioterapia (substituído gradualmente por aceleradores lineares).',
    curiosity:
      'O "azul" das porcelanas chinesas Ming, dos vidros venezianos renascentistas e dos azulejos persas medievais é tudo cobalto. Quando a Europa começou a produzir essa porcelana no século XVIII, o cobalto se tornou matéria-prima estratégica. Hoje o desafio é diferente: cerca de 70% do cobalto mundial vem do Congo, onde mineração artesanal envolve trabalho infantil e condições perigosas — fato que tem pressionado fabricantes de carros elétricos a buscarem alternativas.',
  },
  28: {
    overview:
      'Níquel é um metal de transição prateado, ferromagnético e resistente à corrosão. Faz parte do núcleo terrestre junto com ferro (cerca de 5%), mas em sua aplicação industrial mais conhecida está em aços inoxidáveis e moedas. Em conjunto com cromo, dá ao aço inox sua resistência a manchas. Também é central em baterias de alta densidade energética para veículos elétricos.',
    history:
      'Mineiros alemães do século XVII encontravam um minério avermelhado que parecia conter cobre, mas não rendia metal útil — atribuíam isso a um demônio chamado "Nickel" (espírito travesso). Em 1751, o químico sueco Axel Fredrik Cronstedt provou que era um elemento novo, mantendo o nome herdado da superstição mineira. Tornou-se essencial em escala industrial no final do século XIX, quando a metalurgia de níquel evoluiu.',
    properties:
      'Metal prateado-branco com tom levemente amarelado, duro, dúctil e maleável. Ferromagnético até 358 °C. Ponto de fusão de 1.455 °C. Resistente à corrosão por ar, água e ácidos — daí seu uso em moedas. Forma compostos majoritariamente nos estados +2 e +3. Causa comum de alergia de pele em humanos: cerca de 10% das mulheres e 1% dos homens são alérgicos ao níquel (joias, fivelas de cinto, botões metálicos).',
    applications:
      'Cerca de 70% do níquel é usado em aços inoxidáveis (especialmente o "304" — 18% Cr, 8% Ni). Moedas em vários países contêm níquel (níquel puro ou cuproníquel). Baterias de íon-lítio NMC (níquel-manganês-cobalto) são padrão em carros elétricos. Superligas de níquel resistem a temperaturas extremas em turbinas de jatos e foguetes. Eletrodeposição: revestimento de outros metais com níquel para proteção contra corrosão.',
    curiosity:
      'A região de Sudbury, no Canadá, é uma das maiores fontes de níquel do mundo — e a razão é um meteorito. Há cerca de 1,85 bilhão de anos, um asteroide de aproximadamente 10 km bateu na atual Ontário, criando uma cratera de 200 km de diâmetro. O impacto trouxe ou concentrou níquel, cobre e platinoides em quantidades enormes. Hoje, a "Sudbury Basin" produz cerca de 20% do níquel global — meteorito virou fortuna mineira.',
  },
  29: {
    overview:
      'Cobre é um metal vermelho-alaranjado que foi o primeiro a ser trabalhado por humanos — há cerca de 10.000 anos. Combina condutividade elétrica excepcional (segunda apenas atrás da prata), trabalhabilidade fácil e propriedades antimicrobianas naturais. Sua liga com estanho forma o bronze, dando nome a uma era inteira da civilização humana. É um nutriente essencial para a vida.',
    history:
      'Trabalhado desde 9.000 a.C., bem antes do ferro e até do bronze propriamente dito. A Idade do Bronze (cerca de 3.300 a.C.) começou quando aprendemos a alear cobre com estanho — uma combinação muito mais dura que qualquer metal anterior. Chipre era uma fonte principal — o latim "cuprum" deriva de "Cyprium aes" (metal de Chipre). Usado em moedas desde a Roma antiga.',
    properties:
      'Vermelho-laranja quando recém-cortado, escurece em segundos quando exposto ao ar e eventualmente desenvolve uma pátina verde (carbonato básico de cobre) após anos. É o segundo melhor condutor elétrico depois da prata e o melhor condutor térmico entre metais comuns. Maleável, dúctil e naturalmente antimicrobiano — bactérias e vírus morrem em superfícies de cobre em minutos.',
    applications:
      'Cerca de 60% do cobre extraído é usado em fios e cabos elétricos. Encanamento residencial, motores, geradores e transformadores. Ligas: bronze (cobre + estanho), latão (cobre + zinco), cuproníquel (moedas). Telhados de cobre em arquitetura tradicional. Superfícies antimicrobianas em hospitais (corrimãos, maçanetas). Fundamental nas energias renováveis — uma turbina eólica usa cerca de 5 toneladas de cobre.',
    curiosity:
      'A Estátua da Liberdade é coberta por cerca de 80 toneladas de cobre. Originalmente brilhava em tom marrom-cobre brilhante, mas em três décadas tornou-se verde devido à pátina natural. Essa pátina verde, longe de ser corrosão prejudicial, na verdade protege o metal abaixo de mais danos — é por isso que telhados de cobre duram séculos.',
  },
  30: {
    overview:
      'Zinco é um metal de transição azul-acinzentado, conhecido principalmente como metal de proteção em galvanização — recobre o aço de telhados, carros e estruturas para impedir ferrugem. Biologicamente é o segundo metal mais abundante no corpo humano (depois do ferro), essencial em mais de 300 enzimas. É também o ingrediente principal do latão, liga conhecida desde a Antiguidade.',
    history:
      'Compostos de zinco como o latão (zinco + cobre) foram usados desde 1400 a.C., mas o metal puro só foi isolado no século XVI na Índia e na China (já em escala industrial), e na Europa por Andreas Marggraf em 1746. O nome alemão "zink" (provavelmente de "zinke", pino — referência à forma dos cristais durante a fundição) se popularizou. Foi essencial para a Revolução Industrial pela galvanização do aço.',
    properties:
      'Metal azul-prateado relativamente macio, frágil em temperatura ambiente mas maleável entre 100-150 °C. Funde a 420 °C (baixo para um metal). Reage lentamente com água e ar úmido, formando uma camada de carbonato básico que protege o metal interno. Em chamas queima com chama verde-azulada. Tem 5 isótopos estáveis. Excelente formador de ligas — bronze, latão e outros são compostos de zinco com outros metais.',
    applications:
      'Galvanização (recobrir aço com zinco) é o maior uso — protege contra corrosão chapas de aço, parafusos, telhados ondulados e armações de carros. Latão (cobre + zinco) está em torneiras, instrumentos musicais, fechaduras e munição. Compostos de zinco aparecem em pastas e suplementos (óxido de zinco para queimaduras solares, gluconato de zinco em remédios para resfriado). Pilhas de carbono-zinco e zinco-ar.',
    curiosity:
      'Quando você toma um remédio para resfriado contendo zinco, ele tem um efeito real cientificamente comprovado — mas só nas primeiras 24 horas dos sintomas. Íons de zinco ligam-se a proteínas que os rinovírus usam para entrar nas células, impedindo a replicação viral. Estudos mostram redução de cerca de um dia na duração de resfriados. Não funciona para gripe (vírus diferentes), apesar da confusão popular entre as duas doenças.',
  },
  31: {
    overview:
      'Gálio é um metal pós-transição prateado, famoso por uma propriedade curiosa: funde a 30 °C — literalmente derrete na palma da mão. Apesar de pouco conhecido fora da química, está em todo LED azul, painel solar de alta eficiência e nos chips de smartphones modernos (especialmente em radiofrequência). Substituiu o mercúrio em termômetros e o gálio puro é tão pouco tóxico que pode até ser manuseado diretamente com cuidado.',
    history:
      'Previsto por Mendeleev em 1871 como "eka-alumínio" — outra das suas previsões espetacularmente precisas. Descoberto experimentalmente em 1875 pelo químico francês Paul-Émile Lecoq de Boisbaudran via análise espectroscópica de minerais de zinco. O nome vem do latim "Gallia" (França), terra natal de Boisbaudran. Mendeleev tinha previsto massa atômica de 68 — Lecoq mediu 69,72, dentro da margem de erro.',
    properties:
      'Metal prateado-azulado, macio, que derrete a apenas 29,76 °C. Densidade 5,91 g/cm³. Tem a faixa de fase líquida mais ampla entre os elementos comuns: funde acima da temperatura ambiente mas ferve só a 2.204 °C. Como bismuto e silício, expande ao solidificar (como a água). Forma compostos importantes com nitrogênio (GaN) e arsênio (GaAs), semicondutores de alta velocidade.',
    applications:
      'Nitreto de gálio (GaN) é a base de LEDs azuis e brancos — descoberta que rendeu o Nobel em 2014 a Akasaki, Amano e Nakamura, revolucionando iluminação eficiente. Arsenieto de gálio (GaAs) é semicondutor de alta velocidade em radares, celulares 5G, painéis solares espaciais. Termômetros médicos de gálio-índio-estanho ("galinstan") substituíram os de mercúrio. Em metalurgia, traços de gálio diminuem ponto de fusão de outras ligas — daí cuidado com gálio perto de alumínio (corrói a estrutura).',
    curiosity:
      'Pegadinha clássica de química: dá-se uma colher de gálio puro para alguém mexer um chá quente — a colher derrete na xícara. A pessoa fica chocada achando que quebrou ou contaminou. Como o gálio funde a 30 °C, basta o calor da bebida (ou da mão segurando) para liquefazer. Pequenas quantidades não são tóxicas se ingeridas, mas o efeito visual de uma colher derretendo é inesquecível. Vídeos do truque viralizaram em redes sociais.',
  },
  32: {
    overview:
      'Germânio é um metaloide cinza-prateado brilhante, com propriedades químicas similares ao silício mas com características eletrônicas únicas. Foi um dos primeiros semicondutores usados industrialmente — os transistores originais da Bell Labs em 1947 eram de germânio, não silício. Hoje é central em fibra óptica, óptica infravermelha e células solares de alta eficiência, mas é raro e caro comparado ao silício.',
    history:
      'Previsto teoricamente por Mendeleev em 1871 (que o chamou de "ekassilício" antes da descoberta), e descoberto experimentalmente em 1886 pelo químico alemão Clemens Winkler no mineral argirodita. Winkler o batizou em homenagem à Alemanha (Germania, em latim). A previsão de Mendeleev acertou propriedades como massa atômica, densidade e estados de oxidação com precisão notável — uma das maiores vitórias da tabela periódica.',
    properties:
      'Metaloide cinza-prateado, frágil, com brilho metálico. É um semicondutor — conduz eletricidade melhor que isolantes mas pior que metais. Funde a 938 °C. Tem alta refração em luz infravermelha, propriedade rara entre elementos comuns. Forma compostos químicos similares aos do silício e estanho (família 14). Tem cinco isótopos estáveis e ocorre em traços em minérios de zinco, prata e cobre.',
    applications:
      'Em fibra óptica, óxido de germânio (GeO₂) é dopante essencial no núcleo das fibras para aumentar a refração e canalizar a luz. Lentes e janelas de infravermelho em câmeras térmicas e sensores militares — o germânio é transparente nessa faixa do espectro. Células solares espaciais (eficiência > 30%) usam camadas de germânio. Catalisadores em produção de plástico PET (garrafas). Diodos detectores de radiação em laboratórios.',
    curiosity:
      'Os primeiros transistores comerciais, dos anos 1950, eram todos de germânio — incluindo os rádios portáteis "transistorizados" que revolucionaram a música e o jornalismo. Mas o germânio tem um problema: começa a conduzir corrente mesmo sem sinal acima de 75 °C, gerando ruído. Quando descobriram como purificar silício (mais barato e tolerante a calor) nos anos 1960, o germânio foi quase abandonado em eletrônica básica — mas voltou em aplicações onde alta velocidade compensa o custo.',
  },
  33: {
    overview:
      'Arsênio é um metaloide cinza-acizado lustroso, conhecido há séculos como veneno letal e cumulativo — chamado de "rei dos venenos e veneno dos reis" durante a Idade Média e Renascimento. Ironicamente, em quantidades minúsculas é essencial para alguns organismos. Industrialmente, aparece em semicondutores especiais, preservativos de madeira (cada vez mais banidos) e ligas metálicas.',
    history:
      'Compostos de arsênio são conhecidos há mais de 4.000 anos — egípcios e gregos usavam realgar (sulfeto de arsênio) como pigmento e veneno. O alquimista Alberto Magno isolou o elemento por volta de 1250. O nome vem do persa "zarnikh" (ouro amarelo, pelo orpimento) via grego "arsenikon". Os Bórgia, família renascentista italiana, ganharam fama (e poder) com envenenamentos por arsênio. Sherlock Holmes e Agatha Christie popularizaram a imagem na ficção.',
    properties:
      'Metaloide com duas formas alotrópicas principais: cinza (metálica, mais estável) e amarela (instável, similar ao fósforo branco). Sublima a 615 °C em vez de fundir. É frágil e quebradiço quando puro. Forma compostos perigosos com hidrogênio (arsina, gás letal), oxigênio (anidrido arsenioso, veneno tradicional) e enxofre. Quimicamente parecido com fósforo e antimônio, no grupo 15.',
    applications:
      'Arsenieto de gálio (GaAs) é um semicondutor de altíssima velocidade usado em radares, células solares espaciais e LEDs vermelhos. Tradicionalmente foi preservativo de madeira (CCA — cobre, cromo, arsênio) para postes e decks externos, agora banido em uso doméstico nos EUA, UE e Brasil. Pesticidas e herbicidas históricos (proibidos). Salvarsan, primeiro tratamento eficaz contra sífilis (Paul Ehrlich, 1909), era organoarsênico. Pequenas adições endurecem ligas de chumbo em munição.',
    curiosity:
      'Em 2008, Bangladesh enfrentou o maior caso de envenenamento populacional da história — cerca de 70 milhões de pessoas expostas a água de poços contaminados naturalmente com arsênio. As ONGs internacionais haviam ajudado a cavar milhões de poços nos anos 1970-80 para escapar da água contaminada de superfície, sem testar o arsênio do subsolo. Décadas depois, milhões de bengaleses sofrem com câncer, lesões de pele e outros sintomas crônicos. É chamado "o maior envenenamento de massa não-intencional da história".',
  },
  34: {
    overview:
      'Selênio é um não-metal entre vermelho-escuro e preto-metálico, conhecido por uma combinação rara: é fotocondutor (muda condutividade com a luz) e essencial à vida em traços (antioxidante crítico). Tornou-se famoso pela tecnologia de xerografia que deu origem às fotocopiadoras Xerox, e hoje aparece em painéis solares, vidros vermelhos e suplementos nutricionais.',
    history:
      'Descoberto em 1817 pelo químico sueco Jöns Jacob Berzelius em resíduos de fabricação de ácido sulfúrico. Confundiu-se inicialmente com telúrio (do latim "tellus", terra), e Berzelius decidiu chamá-lo pelo grego "selene" (Lua) — como contraponto poético ao telúrio terreno. O efeito fotocondutor do selênio foi descoberto em 1873, e em 1938 Chester Carlson o usou para inventar a xerografia, base de todas as fotocopiadoras modernas.',
    properties:
      'Não-metal com várias formas alotrópicas — a mais comum é o cinza-metálico (semicondutor). Funde a 221 °C. Sua condutividade elétrica aumenta dramaticamente quando exposto à luz (fotocondutividade), uma das primeiras evidências da relação entre luz e elétrons. Em traços é nutriente essencial: enzimas antioxidantes (glutationa peroxidase) dependem dele. Em excesso é tóxico, com sintomas similares aos do arsênico.',
    applications:
      'Painéis solares CdSe/CdTe (cádmio-selênio) competem com silício em eficiência. Pigmentos vermelhos e amarelos em vidros e cerâmicas (rubi de cádmio). Suplementos nutricionais para deficiência (especialmente em regiões com solos pobres em selênio, como a China central). Catalisadores em síntese química. Em fotografia química, selênio toner converte tons sépia em prata metálica para arquivamento de longo prazo. Tambores fotossensíveis em fotocopiadoras antigas (hoje substituídos por compostos orgânicos).',
    curiosity:
      'A primeira fotocopiadora comercial, Xerox 914 (lançada em 1959), usava um tambor de selênio amorfo para reter a imagem. Quando exposto à luz refletida do documento, áreas claras do tambor perdiam carga elétrica, mantendo carga apenas onde havia escrita — esta carga atraía tinta em pó (toner) que era transferida ao papel. Foi tão revolucionária que a Xerox virou verbo: "xerocar". O selênio reinou nos tambores de toner por décadas até ser substituído por polímeros mais baratos.',
  },
  35: {
    overview:
      'Bromo é o único elemento não-metal líquido em condições normais — junto com o mercúrio (metal), forma o curioso clube dos dois únicos elementos líquidos à temperatura ambiente. É um líquido marrom-avermelhado denso, com vapor laranja-amarelado tóxico e cheiro pungente. Como halogênio, é extremamente reativo e usado em retardantes de chama, agroquímicos e medicamentos.',
    history:
      'Descoberto em 1826 pelo químico francês Antoine-Jérôme Balard a partir de algas marinhas — ele percebeu que um líquido vermelho se formava ao tratar resíduos da extração de sal com cloro. O nome vem do grego "bromos" (fedor), em referência ao odor desagradável e penetrante do gás. Foi um dos primeiros elementos a ser identificado por seu espectro óptico. Balard tinha apenas 23 anos quando fez a descoberta.',
    properties:
      'Líquido marrom-avermelhado denso (3,1 vezes a densidade da água), com vapor tóxico amarelo-alaranjado já em temperatura ambiente. Funde a -7 °C e ferve a 59 °C. É o terceiro halogênio mais reativo (depois do flúor e cloro). Forma o ânion brometo (Br⁻) em compostos iônicos. Levemente solúvel em água, mas dissolve bem em solventes orgânicos. Em sólido, forma cristais escuros quebradiços.',
    applications:
      'Retardantes de chama brominados (em plásticos eletrônicos, espumas de móveis, têxteis) — embora muitos estejam sendo proibidos por bioacumulação. Sais de brometo eram sedativos comuns no século XIX e início do XX. Agroquímicos: pesticidas e fumigantes (brometo de metila, agora restrito). Em fotografia química, brometo de prata é o agente sensível à luz nas emulsões. Aditivos em piscinas como alternativa ao cloro.',
    curiosity:
      'Os antigos romanos extraíam um pigmento púrpura raríssimo — o "púrpura de Tiro" — de pequenos caracóis marinhos da espécie Murex. Eram precisos cerca de 12.000 caracóis para produzir 1,4 g de tinta, e o segredo do composto químico (um derivado bromado) só foi decifrado em 1909 pelo alemão Paul Friedländer. A cor era tão cara que apenas imperadores podiam usá-la — daí a expressão "nascido em púrpura" para nobreza romana.',
  },
  36: {
    overview:
      'Criptônio é um gás nobre, incolor, inodoro e quimicamente inerte — o quarto mais abundante na atmosfera terrestre entre os nobres, mas ainda raríssimo (cerca de 1 ppm). Embora seu nome remeta ao "kryptonite" da ficção de Superman, o criptônio real é totalmente benigno — apenas um gás que emite brilho azul-violeta intenso em descargas elétricas. Aplicações se concentram em iluminação e medição de tempo de alta precisão.',
    history:
      'Descoberto em 1898 por William Ramsay e Morris Travers em Londres, durante destilação fracionada do ar líquido — no mesmo ano em que descobriram neônio e xenônio. O nome vem do grego "kryptos" (oculto), porque a substância estava "escondida" entre outros gases nobres e só foi revelada por análise espectral cuidadosa. A "kryptonite" do Superman foi nomeada em 1943 inspirada na palavra, mas é fictícia — não tem relação com o elemento real.',
    properties:
      'Gás nobre monoatômico (Kr), incolor e inerte em condições normais, embora forme alguns compostos sob condições extremas (KrF₂ é estável a baixa temperatura). Liquefaz a -153 °C. Tem seis isótopos estáveis. Quando excitado eletricamente, emite uma luz azul-violeta brilhante com várias linhas espectrais bem definidas. A linha laranja-vermelha do Kr-86 foi usada de 1960 a 1983 para definir o metro como padrão internacional.',
    applications:
      'Lâmpadas fluorescentes e flashes de fotografia profissional usam criptônio para aumentar luminosidade e durabilidade. Lasers de criptônio produzem luz visível em comprimentos de onda específicos para aplicações médicas e científicas. Janelas isolantes de alta performance (preenchidas com criptônio em vez de argônio) reduzem perda de calor em até 27%. Detectores de vazamentos radioativos usam Kr-85.',
    curiosity:
      'De 1960 a 1983, o metro padrão internacional foi definido oficialmente como 1.650.763,73 comprimentos de onda da linha laranja-avermelha do isótopo Kr-86 no vácuo. Foi a primeira definição não-baseada em um artefato físico — antes, o metro era a distância entre duas marcas em uma barra de platina-irídio em Paris. O criptônio foi então substituído pela velocidade da luz como referência atual, mas durante essas décadas o gás foi literalmente a régua do mundo.',
  },
  37: {
    overview:
      'Rubídio é um metal alcalino prateado-suave, segundo elemento da família dos metais alcalinos pesados — funde a apenas 39 °C, derretendo na mão fechada. É extremamente reativo, mas suas aplicações modernas se concentram em relógios atômicos secundários (mais baratos que os de césio), pesquisa em física quântica e células fotoelétricas. Tem um isótopo naturalmente radioativo (Rb-87) usado em datação geológica.',
    history:
      'Descoberto em 1861 por Robert Bunsen e Gustav Kirchhoff via análise espectroscópica de lepidolita (mineral de lítio), um ano após terem descoberto césio com a mesma técnica. O nome vem do latim "rubidus" (vermelho-escuro) — pelas duas linhas espectrais vermelhas características que o identificaram. Foi um dos primeiros sucessos da espectroscopia como ferramenta para descobrir elementos, técnica que revolucionou a química do século XIX.',
    properties:
      'Metal alcalino prateado-pálido com leve tom dourado, tão macio que pode ser amassado com os dedos. Funde a 39,3 °C (derrete na mão fechada). Reage violentamente com água e oxigênio — armazenado sob óleo mineral ou vácuo. Em chamas emite cor vermelho-violeta intensa. Tem dois isótopos naturais: Rb-85 (estável, 72%) e Rb-87 (radioativo, 28%, meia-vida de 49 bilhões de anos — três vezes a idade do universo).',
    applications:
      'Relógios atômicos de rubídio são alternativa mais barata aos de césio em GPS, sincronia de redes celulares e timing científico — menos precisos que césio mas suficientes para muitas aplicações. Em vidros especiais e cerâmicas para reduzir condutividade térmica. Células fotoelétricas em sensores de luz. Em condensados de Bose-Einstein (Nobel 2001) que estudam fenômenos quânticos a temperaturas próximas do zero absoluto. Datação Rb-Sr é padrão para rochas com mais de 100 milhões de anos.',
    curiosity:
      'A datação Rb-Sr (rubídio-estrôncio) é uma das técnicas mais precisas para datar rochas antigas — incluindo amostras lunares trazidas pelas missões Apollo e rochas marcianas em meteoritos. O Rb-87 decai em Sr-87 com meia-vida tão longa que ainda é detectável em rochas formadas pouco depois do Big Bang. Foi essa técnica que confirmou que a Terra tem 4,54 bilhões de anos — um número derivado diretamente da química do rubídio.',
  },
  38: {
    overview:
      'Estrôncio é um metal alcalino-terroso prateado-amarelado, conhecido principalmente pela cor vermelha brilhante característica que dá aos fogos de artifício. Sua aplicação mais famosa é nessa indústria, mas também tem uso em pastas de dente para dentes sensíveis (cloreto de estrôncio), em ímãs e em datação geológica em pares com rubídio. Em forma radioativa (Sr-90) é um dos contaminantes mais perigosos de fallout nuclear.',
    history:
      'Descoberto em 1790 por Adair Crawford e William Cruickshank em amostras do mineral estroncianita coletadas em Strontian, pequeno vilarejo na Escócia (que dá nome ao elemento). Humphry Davy isolou o metal em 1808 por eletrólise, junto com bário e cálcio na mesma série de experimentos. Strontian é o único vilarejo do mundo que dá nome a um elemento químico — fato que turistas locais usam orgulhosamente em placas e camisetas.',
    properties:
      'Metal prateado-amarelado macio, mais reativo que cálcio mas menos que bário. Funde a 777 °C. Densidade 2,64 g/cm³. Em chamas emite cor vermelho-carmesim intensa — a cor "vermelho de bombeiro" dos fogos de artifício. Quimicamente similar ao cálcio (substitui-o em ossos quando absorvido). Tem quatro isótopos estáveis naturais e vários radioativos. O Sr-90, subproduto de fissão nuclear, tem meia-vida de 28,9 anos e é particularmente perigoso por se acumular em ossos.',
    applications:
      'Em pirotécnica, sais de estrôncio (especialmente nitrato e carbonato) produzem a cor vermelha intensa — quase impossível de obter com outros elementos. Em pasta de dente para dentes sensíveis (cloreto de estrôncio), atuando bloqueando túbulos dentinários. Em ímãs ferrita-estrôncio em alto-falantes e motores. Vidro cristal com estrôncio (substituiu o chumbo) em telas de TV antigas. Sr-90 como fonte de calor em geradores termoelétricos remotos (faróis árticos).',
    curiosity:
      'Após explosões nucleares aéreas dos anos 1945-1963, o Sr-90 do fallout se espalhou globalmente e foi incorporado em ossos de crianças nascidas naquela época — preservado no esmalte dental de dentes de leite. Esse fato deu origem ao "Estudo dos Dentes de Leite", projeto de saúde pública dos anos 1960 que coletou 320.000 dentes nos EUA. Os resultados pressionaram o presidente Kennedy a assinar o Tratado de Proibição Parcial de Testes Nucleares em 1963 — um caso raro em que ciência dental mudou geopolítica nuclear.',
  },
  39: {
    overview:
      'Ítrio é um metal de transição prateado-cinzento, classificado entre as "raras-terras" embora seja relativamente abundante. Seu papel mais famoso foi no LED vermelho dos primeiros LEDs coloridos (anos 1960) e nos fósforos vermelhos das antigas TVs CRT. Hoje continua estratégico em laseres YAG (cirurgia, soldagem), supercondutores de alta temperatura e em ligas refratárias.',
    history:
      'Descoberto em 1794 pelo químico finlandês Johan Gadolin no mineral iterbita, coletado perto da pequena vila de Ytterby na Suécia — uma das mais férteis localidades em termos químicos da história. Da mesma pequena pedreira saíram quatro elementos com nomes derivados do vilarejo: ítrio (Y), itérbio (Yb), térbio (Tb) e érbio (Er). Foi o primeiro elemento "raro-terra" identificado, e marcou o início da longa exploração dos lantanídeos.',
    properties:
      'Metal prateado-cinzento com brilho metálico, dúctil e leve para um metal de transição (densidade 4,47 g/cm³). Funde a 1.526 °C. Razoavelmente estável em ar à temperatura ambiente, forma uma camada protetora de óxido. Quimicamente similar aos lantanídeos. Tem apenas um isótopo natural estável (Y-89). Forma compostos importantes com oxigênio (Y₂O₃) e com granadas (YAG, YIG) usadas em laseres e dispositivos magnéticos.',
    applications:
      'Granada de ítrio-alumínio (Y₃Al₅O₁₂, "YAG"), dopada com neodímio ou outros elementos, é o cristal mais usado em laseres industriais e cirúrgicos (Nd:YAG). Em fósforos: o vermelho nas antigas TVs CRT vinha de óxido de ítrio dopado com európio. Supercondutores de alta temperatura YBCO (ítrio-bário-cobre) operam a 92 K, acima do nitrogênio líquido. Em ligas com alumínio e magnésio aumentam resistência mecânica. Filtros em microondas (YIG, granada de ítrio-ferro).',
    curiosity:
      'A pequena pedreira de Ytterby (cerca de 19 km de Estocolmo) é considerada o lugar mais "fértil quimicamente" do mundo: dela saíram 7 elementos descobertos entre 1794 e 1907 — ítrio, érbio, térbio, itérbio, hólmio, túlio e gadolínio. Nenhum outro lugar do planeta deu seu nome a tantos elementos. Hoje a pedreira está esgotada, mas existe placa comemorativa, e químicos do mundo todo fazem peregrinação ao local — uma espécie de "Meca química" dos lantanídeos.',
  },
  40: {
    overview:
      'Zircônio é um metal de transição prateado-cinza, conhecido pelo público pelas gemas de "zircônia cúbica" (que imitam diamantes) mas estrategicamente vital em reatores nucleares — tubos de zircônio puro contêm o combustível de urânio porque absorvem nêutrons muito pouco. Também aparece em implantes médicos e equipamentos químicos por sua resistência excepcional à corrosão.',
    history:
      'Compostos de zircônio (especialmente zirconita, ZrSiO₄) eram conhecidos como gemas há milênios. O elemento foi identificado em 1789 por Martin Heinrich Klaproth ao analisar zircônios provenientes do Sri Lanka. O nome vem do persa "zargun" (cor dourada), descrevendo a cor de algumas zirconitas. O metal puro só foi isolado em 1824 por Jöns Jacob Berzelius. A pureza necessária para uso nuclear (separação do háfnio) só foi alcançada na década de 1940.',
    properties:
      'Metal cinza-prateado com brilho metálico, dúctil. Funde a 1.855 °C. Extraordinariamente resistente à corrosão por água, ácidos e álcalis — forma uma camada finíssima e estável de óxido (ZrO₂). Tem baixíssima absorção de nêutrons térmicos, propriedade crítica para reatores. Quimicamente similar ao háfnio (formam soluções sólidas em todas as proporções), mas em comportamento nuclear são opostos: zircônio "deixa passar" nêutrons, háfnio os absorve.',
    applications:
      'Tubos e revestimentos do combustível em reatores nucleares — o uso mais crítico, com ligas zircaloy (Zr + Sn + Fe + Cr) que combinam resistência mecânica, à corrosão e baixa absorção de nêutrons. Zircônia (ZrO₂) é cerâmica resistente a impacto usada em facas, próteses dentárias e implantes ortopédicos. Zircônia cúbica é a imitação mais convincente de diamante em joalheria. Catalisadores em refinarias. Lentes ópticas de alta refração. Flash de fotografia (zircônio em pó queima brilhantemente).',
    curiosity:
      'O desastre de Fukushima em 2011 expôs um lado perigoso do zircônio: quando superaquecido em contato com vapor d\'água acima de 1.200 °C, ele reage produzindo hidrogênio (Zr + 2H₂O → ZrO₂ + 2H₂). Foi justamente essa reação que produziu o hidrogênio que explodiu nos prédios dos reatores 1, 3 e 4 da usina japonesa após o tsunami. O metal escolhido por décadas pela "segurança nuclear" se transformou em vetor de catástrofe quando os sistemas de resfriamento falharam.',
  },
  41: {
    overview:
      'Nióbio é um metal de transição cinza brilhante, raro globalmente mas com importância estratégica imensa — o Brasil detém cerca de 90% das reservas mundiais. É essencial em aços especiais de alta resistência (gasodutos, automóveis, arranha-céus), supercondutores de baixa temperatura, e ligas de motores a jato. Sua história industrial é cheia de geopolítica: poucos países o produzem em escala, dando ao Brasil influência única no mercado global.',
    history:
      'Descoberto em 1801 pelo químico inglês Charles Hatchett a partir de mineral coletado em Connecticut — ele o chamou inicialmente de "colúmbio" (em homenagem aos EUA, então conhecido como Colúmbia). Confundido por décadas com tântalo (família 5, propriedades muito similares) até Heinrich Rose provar em 1844 que eram elementos distintos. Rose renomeou-o "nióbio" — em homenagem a Níobe, filha de Tântalo na mitologia grega — mas EUA continuaram usando "colúmbio" até 1949, quando a IUPAC padronizou o nome.',
    properties:
      'Metal cinza-prateado brilhante, dúctil, com alto ponto de fusão (2.477 °C). Densidade 8,57 g/cm³. Resistente à corrosão por uma camada protetora de óxido. Quimicamente similar ao tântalo. Tem dois isótopos naturais, sendo um deles raro (Nb-93 estável é dominante). Torna-se supercondutor a temperaturas muito baixas (9,3 K), com a maior temperatura crítica entre supercondutores puros (de tipo I).',
    applications:
      'Aços HSLA (High-Strength Low-Alloy) — pequenas adições de nióbio (0,01-0,1%) produzem aços muito mais resistentes para gasodutos, plataformas marítimas, construção civil e automóveis. Cerca de 90% da produção mundial vai para isso. Ligas com titânio (Nb-Ti) em supercondutores para ressonância magnética (MRI), aceleradores de partículas (LHC, no CERN) e fusão nuclear (ITER). Componentes em motores a jato e turbinas. Joalheria por ser hipoalergênico.',
    curiosity:
      'O Brasil produz cerca de 90% do nióbio do mundo, principalmente em Minas Gerais. A CBMM (Companhia Brasileira de Metalurgia e Mineração) controla a maior parte dessa produção, dando ao Brasil influência geopolítica única — sem nióbio brasileiro, projetos como o LHC do CERN, sistemas MRI hospitalares e gasodutos modernos teriam dificuldades severas. Apesar disso, o Brasil exporta principalmente como liga ferro-nióbio bruto (commodity barata) em vez de produtos refinados de alto valor — um debate econômico nacional recorrente.',
  },
  42: {
    overview:
      'Molibdênio é um metal de transição cinza-prateado, com o sexto maior ponto de fusão entre todos os elementos (2.623 °C). Sua principal função industrial é fortalecer aços — aços com pouco molibdênio resistem a temperaturas e pressões extremas, sendo essenciais em refinarias de petróleo, oleodutos, motores a jato e reatores nucleares. Biologicamente, é cofator de enzimas essenciais à vida.',
    history:
      'Por séculos, a molibdenita (MoS₂) era confundida com grafite e chumbo (em grego "molybdos" significa chumbo). Em 1778, o químico sueco Carl Wilhelm Scheele provou que era um mineral distinto, e Peter Jacob Hjelm isolou o metal em 1781 reduzindo o trióxido de molibdênio. O nome — herdado da confusão histórica — foi mantido. Durante a Primeira Guerra Mundial, o tanque britânico Mark V usou armadura de aço-molibdênio que resistiu a projéteis que furavam o aço comum.',
    properties:
      'Metal cinza-prateado, duro, com ponto de fusão de 2.623 °C — só ficou atrás de tântalo, tungstênio, rênio, ósmio e carbono. Densidade 10,28 g/cm³. Resistente à corrosão por ácidos e álcalis em condições normais. Tem múltiplos estados de oxidação (+2 a +6). Forma compostos com cores intensas ("azul-molibdênio" em vários produtos). Como muitos metais refratários, evapora muito devagar mesmo perto do seu ponto de fusão.',
    applications:
      'Cerca de 75% da produção vai para aços especiais e ligas — aços-molibdênio resistem a temperatura, pressão e corrosão. Aços inoxidáveis 316 (com Mo) são usados em equipamentos farmacêuticos e marinhos. Filamentos em fornos elétricos de alta temperatura. Lubrificantes sólidos de dissulfeto de molibdênio (MoS₂) em motores e máquinas. Catalisadores em refinarias (dessulfuração de petróleo). Cofator em enzimas como a nitrogenase (fixação de nitrogênio em raízes de leguminosas).',
    curiosity:
      'Em 2017, pesquisadores descobriram que o molibdênio na crosta terrestre primitiva pode ter sido um fator-chave para o surgimento da vida complexa. A enzima nitrogenase, que fixa nitrogênio atmosférico em formas biologicamente úteis, depende absolutamente do molibdênio. Sem molibdênio dissolvido nos oceanos antigos (cerca de 2 bilhões de anos atrás), bactérias não teriam conseguido fixar nitrogênio em escala suficiente para sustentar células complexas — quase não haveria vida no planeta como a conhecemos.',
  },
  43: {
    overview:
      'Tecnécio é o primeiro elemento criado artificialmente em laboratório (1937) e o único elemento sem isótopos estáveis com número atômico abaixo de 83. Não existe naturalmente na Terra — todos os átomos formados no Big Bang ou em supernovas já decaíram. Seu nome vem do grego "tekhnetos" (artificial). Apesar dessa raridade, o Tc-99m é hoje o radioisótopo mais usado em medicina nuclear no mundo, presente em cerca de 30 milhões de exames por ano.',
    history:
      'Foi o elemento que "preencheu" o famoso buraco número 43 na tabela periódica de Mendeleev, predito desde 1869 mas resistente a todas as buscas em minérios. Sucessivos "descobrimentos" foram falsos alarmes ao longo do século XIX e início do XX. Só em 1937, Carlo Perrier e Emilio Segrè o sintetizaram em Palermo, Itália, bombardeando molibdênio com deutérios em um cíclotron — Ernest Lawrence enviou a amostra de Berkeley pelo correio. Foi o primeiro elemento sintético confirmado da história.',
    properties:
      'Metal de transição cinza-prateado, sólido em temperatura ambiente, com ponto de fusão de 2.157 °C. Todos os 22 isótopos conhecidos são radioativos. O mais estável (Tc-98) tem meia-vida de 4,2 milhões de anos — longa em escala humana mas curta em escala geológica, daí a ausência terrestre. Quimicamente similar ao manganês (acima) e rênio (abaixo) na tabela. Forma compostos como o íon pertecnetato (TcO₄⁻), surpreendentemente solúvel e mobilizável.',
    applications:
      'O Tc-99m (metaestável, meia-vida de 6 horas) é o radioisótopo mais usado em medicina diagnóstica — cintilografias ósseas, cardíacas, renais e tireoidianas. Aproximadamente 30 milhões de procedimentos por ano dependem dele globalmente. Produzido em geradores que extraem Tc-99m a partir do decaimento de Mo-99 (subproduto de reatores nucleares). Em quantidades minúsculas, é traçador para estudos de corrosão em aços de tubulações industriais. Cientificamente, marcador de fissão antiga em estrelas.',
    curiosity:
      'Em 1952, o astrônomo Paul Merrill detectou linhas espectrais de tecnécio em estrelas vermelhas gigantes — algo impossível se o tecnécio fosse só uma curiosidade da Terra. A descoberta foi revolucionária: como o Tc-98 tem meia-vida de só milhões de anos, sua presença nessas estrelas provava que elementos pesados são produzidos no INTERIOR das estrelas e expelidos no espaço, não apenas formados no Big Bang. O tecnécio foi a evidência irrefutável da nucleossíntese estelar.',
  },
  44: {
    overview:
      'Rutênio é um metal duro, branco-prateado, integrante do grupo da platina (PGM, platinum group metals). É raríssimo na crosta terrestre — um dos elementos mais escassos — mas tecnologicamente estratégico em discos rígidos de computador, catalisadores químicos e contatos elétricos. Quase tudo isso depende dele em quantidades minúsculas mas insubstituíveis.',
    history:
      'Descoberto em 1844 pelo químico russo-báltico Karl Karlovich Klaus em Kazan, na Rússia, ao analisar minérios de platina dos Urais. O nome vem de "Ruthenia", o nome latino para a Rus (antiga Rússia). Klaus dedicou anos isolando-o em meio aos outros platinoides — a química dos seis elementos da família é tão similar que separá-los foi um dos maiores desafios analíticos do século XIX.',
    properties:
      'Metal branco-prateado com brilho metálico forte, duro e frágil. Funde a 2.334 °C. Densidade 12,45 g/cm³. Forma uma camada protetora de óxido que resiste a corrosão em condições normais — porém o tetraóxido de rutênio (RuO₄) é volátil, tóxico e perigoso. Quimicamente similar a ósmio e ferro. Tem sete isótopos estáveis naturais. É catalisador potente em muitas reações, mesmo em quantidades de partes por milhão.',
    applications:
      'Catalisadores em produção de amônia (alternativa ao ferro do processo Haber), em síntese de hidrocarbonetos (Fischer-Tropsch) e em células a combustível. Coberturas de gravação em discos rígidos magnéticos modernos — densidade de dados depende de filmes ultrafinos de rutênio. Eletrodos resistentes em microeletrônica. Ligas de platina (95% Pt + 5% Ru) em joalheria e contatos elétricos. Em pesquisa, complexos de rutênio são pigmentos sensíveis à luz para células solares experimentais.',
    curiosity:
      'A presença de rutênio na atmosfera europeia em outubro de 2017 alarmou cientistas — concentrações até 1000 vezes acima do normal foram detectadas em dezenas de países. Investigações rastrearam a fonte até uma planta nuclear na Rússia (Mayak), provavelmente um acidente em produção de cério-144 para satélites. Apesar do volume incomum, os níveis eram baixos demais para causar dano à saúde pública. Foi o maior "vazamento de rutênio radioativo" sem origem oficialmente reconhecida.',
  },
  45: {
    overview:
      'Ródio é o metal mais caro do mundo — frequentemente mais valioso que ouro ou platina, com preços que já passaram de US$ 30.000 por onça em momentos de escassez. É um metal nobre prateado-branco brilhante, conhecido por sua resistência absoluta à corrosão e propriedades catalíticas. Sua aplicação dominante é em conversores catalíticos automotivos, onde reduz óxidos de nitrogênio (NOx) tóxicos a nitrogênio inofensivo.',
    history:
      'Descoberto em 1803 pelo químico inglês William Hyde Wollaston a partir de minérios de platina sul-americanos — no mesmo ano em que ele descobriu paládio. O nome vem do grego "rhodon" (rosa), pelas cores rosadas características de seus compostos em solução. Wollaston era brilhante isolando platinoides individualmente, e suas técnicas continuaram sendo as bases industriais por mais de um século.',
    properties:
      'Metal branco-prateado com brilho intenso (refletividade superior à da prata em alguns comprimentos de onda). Funde a 1.964 °C. Densidade 12,4 g/cm³. Não reage com a maioria dos ácidos, incluindo água régia em condições normais (situação rara — geralmente apenas o ouro resiste). Forma compostos em estados de oxidação variados. Excelente catalisador, especialmente para reações que envolvem ligações C-H e óxidos de nitrogênio.',
    applications:
      'Conversores catalíticos automotivos consomem cerca de 80% da produção mundial de ródio — pequenas quantidades reduzem emissões de NOx em motores a combustão, especialmente os movidos a gasolina. Revestimentos refletivos em joalheria (banho de ródio em prata e ouro branco para brilho duradouro) e em espelhos científicos. Eletrodos resistentes em equipamentos químicos. Catalisador em produção de ácido nítrico e ácido acético. Joalheria pura em peças de luxo extremo.',
    curiosity:
      'Em março de 2021, o preço do ródio atingiu um pico histórico de US$ 29.800 por onça — cerca de 17 vezes o preço do ouro na mesma época. A causa: regulamentações ambientais mais rígidas (especialmente Euro 6d e China 6) exigiam mais ródio por carro para reduzir emissões. Quando combinada com greves de mineração na África do Sul (90% da produção mundial) e a recuperação automotiva pós-pandemia, criou-se uma das maiores escassezes de metal precioso da história moderna. Joalherias suspenderam temporariamente serviços de banho de ródio.',
  },
  46: {
    overview:
      'Paládio é um metal nobre prateado-branco do grupo da platina, conhecido por uma propriedade singular: absorve hidrogênio como uma esponja, até 900 vezes seu próprio volume. Isso o torna fundamental em catalisadores, células a combustível e tecnologias de armazenamento de hidrogênio. Também é insubstituível em conversores catalíticos automotivos e cada vez mais valioso à medida que a indústria automotiva busca emissões zero.',
    history:
      'Descoberto em 1803 por William Hyde Wollaston a partir de platina bruta sul-americana — no mesmo ano em que ele descobriu o ródio. O nome vem do asteroide Pallas, descoberto em 1802 pelo astrônomo Heinrich Olbers — uma homenagem ainda recente quando Wollaston batizou o elemento. Pallas, por sua vez, vem da deusa grega Atena (Palas Atena). É um dos poucos elementos cujo nome homenageia um corpo celeste descoberto na época.',
    properties:
      'Metal prateado-branco brilhante, dúctil e maleável (mais que platina). Funde a 1.555 °C. Densidade 12,02 g/cm³. Tem propriedade extraordinária: à temperatura ambiente, absorve hidrogênio gasoso em quantidade equivalente a 900 vezes seu volume — armazenando o gás em sua estrutura cristalina. Resistente à corrosão por ácidos comuns. Forma ligas com ouro, prata e platina amplamente usadas em joalheria.',
    applications:
      'Conversores catalíticos automotivos (junto com platina e ródio) consomem cerca de metade da produção mundial — paládio é especialmente eficaz em motores a gasolina. Em eletrônica: contatos elétricos confiáveis em conectores premium, capacitores cerâmicos e camadas de soldagem. Joalheria: liga "ouro branco" e jóias hipoalergênicas. Catalisadores químicos em produção farmacêutica (reações Suzuki-Miyaura, Heck, Negishi — todas premiadas com Nobel em 2010). Em odontologia, próteses dentárias.',
    curiosity:
      'Em 1989, Stanley Pons e Martin Fleischmann anunciaram ter conseguido "fusão fria" — energia nuclear à temperatura ambiente — em eletrodos de paládio absorvendo deutério. A descoberta prometia revolução energética e foi capa de jornais mundialmente. Mas experimentos independentes não reproduziram o resultado, e em meses a "fusão fria" foi rejeitada pela comunidade científica como erro experimental. Embora desacreditada, a história continua viva — pequenos laboratórios ainda investigam o fenômeno, agora chamado "LENR" (Low Energy Nuclear Reactions).',
  },
  47: {
    overview:
      'Prata é o metal com a maior condutividade elétrica e térmica de todos os elementos — só perde para o ouro em maleabilidade entre os metais nobres. Brilhante e branca quando recém-polida, escurece com o tempo formando sulfetos ao reagir com compostos de enxofre no ar. Usada por humanos há milênios em moedas, joalheria e talheres, hoje é insubstituível em eletrônicos de precisão e painéis solares.',
    history:
      'Conhecida desde a Antiguidade — minas de prata em Laurion alimentaram o império ateniense, e a prata espanhola das Américas (especialmente Potosí, na Bolívia) sustentou o comércio global por séculos. O símbolo Ag vem do latim "argentum", que também batizou a Argentina pela busca espanhola por prata na região do Rio da Prata. A palavra "prata" em várias línguas românicas vem desse mesmo "argentum".',
    properties:
      'Branco-prateado com o brilho metálico mais alto entre todos os elementos. É o melhor condutor elétrico e térmico conhecido — só não é mais usado em fiação porque o cobre é centenas de vezes mais barato. Extremamente maleável e dúctil (uma grama pode ser estirada em um fio de 1,8 km). Reage com sulfetos atmosféricos formando sulfeto de prata escuro — o que dá o "escurecimento" típico da prata antiga.',
    applications:
      'Joalheria, talheres e moedas tradicionais. Em eletrônica é usada em contatos de alta confiabilidade, soldas e pastas condutivas. Painéis solares fotovoltaicos dependem de pasta de prata para coletar a corrente das células. Em medicina, compostos de prata são antibacterianos potentes — usados em bandagens para queimaduras, filtros de água e revestimentos médicos. Espelhos finos são feitos com uma camada de prata aplicada sobre vidro.',
    curiosity:
      'Os antigos sabiam que comida e bebida estragavam mais devagar em recipientes de prata — sem entender por quê. Hoje sabemos: íons de prata destroem a membrana celular de bactérias e vírus. Na guerra civil norte-americana, soldados punham moedas de prata em barris de água para mantê-la potável. Esse efeito é a razão pela qual filtros de água modernos costumam ter prata coloidal incorporada.',
  },
  48: {
    overview:
      'Cádmio é um metal de transição prateado-azulado, conhecido por uma dualidade: aplicações industriais úteis (baterias, pigmentos) e toxicidade significativa que justifica banimentos crescentes. Compartilha química com o zinco mas é muito mais perigoso — concentra-se em rins e ossos, podendo causar doença renal crônica e câncer. A maioria dos países do mundo já restringiu seu uso em produtos de consumo.',
    history:
      'Descoberto em 1817 por Friedrich Stromeyer em Göttingen, Alemanha, ao analisar amostras de óxido de zinco que apresentavam comportamento estranho. O nome vem do latim "cadmia" — antigo termo para minério de zinco — derivado por sua vez de "Kadmos", figura da mitologia grega que descobriu reservas de zinco perto de Tebas. Foi um dos primeiros metais cuja toxicidade industrial foi sistematicamente documentada no século XX.',
    properties:
      'Metal prateado-azulado, macio (pode ser cortado com faca), maleável e dúctil. Funde a 321 °C. Densidade 8,65 g/cm³. Resistente à corrosão em ar seco mas oxida em ar úmido. Quimicamente similar ao zinco, mas com toxicidade muito maior. Em chamas emite cor laranja-avermelhada. Concentra-se em organismos vivos por bioacumulação — quanto mais alto na cadeia alimentar, mais cádmio acumulado.',
    applications:
      'Baterias Ni-Cd (níquel-cádmio) foram padrão por décadas em ferramentas elétricas, brinquedos e câmeras antes de serem substituídas por íon-lítio. Pigmentos amarelos, laranjas e vermelhos brilhantes (amarelo-cádmio em pinturas de Van Gogh e Monet). Coberturas anticorrosivas em aço (banido em muitos países). Em painéis solares CdTe (telureto de cádmio), que competem com silício em eficiência. Em ligas de baixo ponto de fusão para soldas especiais.',
    curiosity:
      'O envenenamento por cádmio mais famoso da história é a "doença Itai-Itai" no Japão, identificada nos anos 1950. Vítimas — principalmente mulheres pós-menopausa — sofriam dores ósseas tão fortes que gritavam "itai, itai!" (dói, dói!). A causa: mineração de zinco/cádmio no rio Jinzū contaminou arroz cultivado nas várzeas por décadas, e o cádmio se acumulou nos ossos e rins dos consumidores. O caso virou marco da legislação ambiental japonesa e mundial sobre poluição industrial.',
  },
  49: {
    overview:
      'Índio é um metal pós-transição cinza-prateado, macio o bastante para ser cortado com a unha. Apesar de raro, sua aplicação moderna mais reconhecida está em todas as telas de smartphone, tablet e TV: óxido de índio-estanho (ITO) é o revestimento transparente e condutor que faz telas sensíveis ao toque funcionarem. Sem índio, a era dos touchscreens não existiria como a conhecemos.',
    history:
      'Descoberto em 1863 por Ferdinand Reich e Hieronymous Theodor Richter em Freiberg, Alemanha, usando espectroscopia em minerais de zinco. O nome vem da linha espectral azul-índigo característica que identificaram. Por décadas foi curiosidade laboratorial, e só após a Segunda Guerra começou aplicações industriais. A explosão de demanda veio em 1970-2000 com telas LCD e depois touchscreens.',
    properties:
      'Metal prateado branco, muito macio (pode ser riscado com a unha), maleável, com ponto de fusão de apenas 156 °C. Densidade 7,31 g/cm³. Forma uma camada protetora de óxido que resiste à oxidação a temperatura ambiente. Emite "grito" quando dobrado (igual estanho). É raro mas amplamente distribuído — quase todo o índio comercial é subproduto da extração de zinco. Tem dois isótopos naturais, sendo o In-115 fracamente radioativo.',
    applications:
      'Óxido de índio-estanho (ITO) é a aplicação dominante — revestimento transparente e condutor em telas LCD, OLED, touchscreens, painéis solares e janelas eletrocrômicas. Solda em microeletrônica (índio puro funde a 156 °C, ideal para juntas sensíveis). Ligas para vedação a baixa temperatura. Espelhos refletores em telescópios (alternativa à prata). Em produção semicondutora (arsenieto e nitreto de índio).',
    curiosity:
      'A produção global anual de índio é tão pequena (~900 toneladas em 2024) que se prevê escassez crítica até 2050 — e literalmente cada smartphone do mundo depende dele. O setor da reciclagem de telas tornou-se estratégico, com algumas empresas extraindo índio de painéis LCD descartados. Cientistas estão buscando alternativas (grafeno, nanofios de prata) mas até agora nenhuma atinge a combinação de transparência, condutividade e durabilidade do ITO.',
  },
  50: {
    overview:
      'Estanho é um metal pós-transição prateado, macio e dúctil, usado pela humanidade há mais de 5.000 anos. Sua aliança com o cobre formou o bronze, dando nome a uma era inteira da civilização. Hoje é mais conhecido como cobertura protetora em latas de conserva ("folha-de-flandres"), em soldas para eletrônica e em ligas de peltre para utensílios decorativos.',
    history:
      'Conhecido desde o início da Idade do Bronze (cerca de 3.300 a.C.), quando se descobriu que adicionar estanho ao cobre criava um metal muito mais duro. Os fenícios faziam comércio de estanho da Cornualha (Inglaterra) e do antigo Brittany (França). O nome "estanho" vem do latim "stannum", e o símbolo Sn deriva dessa palavra. Foi um dos sete metais conhecidos pela alquimia clássica, junto com ouro, prata, cobre, mercúrio, ferro e chumbo.',
    properties:
      'Metal branco-prateado, macio, dúctil e maleável — pode ser martelado em folhas finíssimas. Funde a apenas 232 °C, baixo para um metal. Tem duas formas alotrópicas: estanho-α ("estanho cinza", em pó, abaixo de 13 °C) e estanho-β ("estanho branco", metálico, acima de 13 °C). Resiste à corrosão por ar e água, daí sua aplicação em latas. Quando dobrado, emite um som característico chamado "grito do estanho" — devido à reorganização cristalina.',
    applications:
      'Cobertura protetora em latas de conserva — uma fina camada de estanho sobre aço impede a corrosão pelos alimentos ácidos (a famosa "folha-de-flandres"). Solda para eletrônica (originalmente liga estanho-chumbo, agora estanho puro ou com prata por motivos de saúde). Bronze (estanho + cobre), peltre (estanho + antimônio + cobre) para utensílios decorativos. Chapas de vidro plano flutuam sobre banho de estanho líquido durante a fabricação industrial.',
    curiosity:
      'A "peste do estanho" é um fenômeno em que objetos de estanho metálico se transformam em pó cinzento quando submetidos a frio intenso por muito tempo. Acima de 13 °C o estanho é estável (forma β), mas abaixo dessa temperatura ele tende a se converter na forma α, frágil. Durante o cerco de Stalingrado em 1942, os botões de estanho dos uniformes dos soldados alemães desintegraram no frio extremo — um problema logístico real que contribuiu para a vulnerabilidade das tropas.',
  },
  51: {
    overview:
      'Antimônio é um metaloide cinza-prateado brilhante, conhecido desde a Antiguidade — usado em delineadores egípcios (kohl) e em medicamentos medievais frequentemente fatais. Hoje, sua aplicação dominante é como retardante de chama em plásticos, têxteis e produtos eletrônicos: cerca de metade da produção mundial entra em fórmulas para impedir incêndios. É frágil, tóxico em compostos solúveis e quimicamente semelhante ao arsênio.',
    history:
      'Conhecido há mais de 5.000 anos em compostos — o sulfeto de antimônio (estibinita) era usado como pigmento e maquiagem dos olhos no Egito antigo. O nome "antimônio" vem do grego/latim "antimonium" (origem disputada), e o símbolo Sb deriva de "stibium". O alquimista alemão Basílio Valentino o descreveu metalicamente no século XV. Foi um dos sete metais conhecidos pela alquimia medieval, ao lado de ouro, prata, mercúrio, cobre, ferro e chumbo.',
    properties:
      'Metaloide cinza-prateado lustroso, frágil — pode ser cortado mas se quebra ao ser deformado. Funde a 631 °C. Tem propriedade rara entre metais: expande ao solidificar (como bismuto e água). Quimicamente parecido com arsênio e bismuto (família 15). Forma sulfetos e óxidos coloridos, e compostos com hidrogênio (estibina, gás tóxico). Tem dois isótopos estáveis (Sb-121 e Sb-123).',
    applications:
      'Trióxido de antimônio (Sb₂O₃) é retardante de chama em plásticos (PVC, polipropileno), tapetes, cortinas, espumas de móveis e roupas infantis — cerca de 60% da produção mundial. Ligas com chumbo aumentam dureza em baterias de carro, soldas e munição. Catalisadores em fabricação de PET (garrafas plásticas). Semicondutores de antimônio em sensores infravermelhos. Historicamente usado em maquiagem (kohl egípcio) e medicamentos eméticos.',
    curiosity:
      'Durante séculos, na Idade Média e Renascimento, médicos usavam pílulas de antimônio para induzir vômito como tratamento — uma prática chamada "purga heróica". Como o antimônio é tóxico, as pílulas geralmente sobreviviam ao trato digestivo intactas e podiam ser recuperadas, lavadas e reutilizadas indefinidamente. Famílias passavam essas "pílulas perpétuas" como herança entre gerações. Mozart e talvez Beethoven podem ter sofrido envenenamento crônico por antimônio dos remédios da época.',
  },
  52: {
    overview:
      'Telúrio é um metaloide prateado-branco, raro na crosta terrestre mas com aplicações cada vez mais estratégicas: painéis solares de alta eficiência (CdTe) representam cerca de 5% do mercado fotovoltaico mundial. É um elemento "tímido" — quimicamente parecido com enxofre e selênio mas muito menos conhecido. Quando absorvido pelo corpo, dá um odor de alho característico que pode persistir por semanas.',
    history:
      'Descoberto em 1782 por Franz Joseph Müller von Reichenstein nos Alpes (na atual Romênia), em minérios de ouro estranhos que ele não conseguia identificar. O nome veio em 1798 do químico alemão Martin Heinrich Klaproth, derivado do latim "tellus" (Terra) — um nome telúrico complementar ao selênio (Lua) que Berzelius nomeou décadas depois. É um dos elementos mais raros na crosta terrestre, mais raro até que platina ou ouro.',
    properties:
      'Metaloide prateado-branco com brilho metálico, frágil. Funde a 450 °C. É um semicondutor que se comporta como metal em algumas direções cristalinas. Quimicamente parecido com enxofre e selênio (família 16). Forma sulfeto de telúrio (TeS₂) e óxidos. Quando absorvido pelo corpo em pequenas doses, é metabolizado em dimetiltelureto, que dá um odor persistente de alho — sintoma marcante de exposição.',
    applications:
      'Painéis solares CdTe (telureto de cádmio) competem com silício em eficiência e custo — fabricados em grande escala pela First Solar. Ligas de telúrio com cobre e aço melhoram usinabilidade (mais fácil de cortar). Vulcanização de borracha (alternativa ao enxofre em fórmulas específicas). Semicondutores especiais em sensores infravermelhos e visão noturna. Liga com bismuto em geradores termoelétricos (resfriadores Peltier).',
    curiosity:
      'Trabalhadores que manuseiam telúrio frequentemente sofrem do "hálito de alho do telúrio" — um odor persistente que escapa pela respiração, pele e suor, e que pode durar semanas mesmo após exposição mínima. O culpado é o dimetiltelureto, composto que o corpo produz como tentativa de eliminar o metal. Em altas concentrações o odor é tão forte que socialmente isola o trabalhador. Historicamente, alguns reclamavam que esposas se recusavam a dormir no mesmo quarto.',
  },
  53: {
    overview:
      'Iodo é um halogênio sólido em condições normais — cristais lustrosos cinza-escuros que sublimam diretamente em vapor violeta quando aquecidos. É essencial para a vida humana: a glândula tireoide o usa para produzir hormônios que regulam o metabolismo. Sua deficiência causa bócio e atraso no desenvolvimento, um dos motivos pelo qual o sal de cozinha é iodado em quase todos os países.',
    history:
      'Descoberto em 1811 pelo químico francês Bernard Courtois, que percebeu vapor violeta ao tratar cinzas de algas marinhas com ácido sulfúrico. O nome vem do grego "iodes" (violeta), referindo-se à cor do vapor. Joseph Louis Gay-Lussac confirmou que era um elemento novo em 1813. O bócio (aumento da tireoide) era endêmico em regiões montanhosas pobres em iodo até 1924, quando a Suíça introduziu o sal iodado — reduzindo casos em mais de 90% em uma geração.',
    properties:
      'Sólido cristalino cinza-violeta escuro à temperatura ambiente, com brilho metálico. Funde a 114 °C, mas sublima parcialmente já em temperatura ambiente, formando vapor violeta tóxico. É o halogênio menos reativo (depois do astato). Forma o ânion iodeto (I⁻) em compostos iônicos. Tem cerca de 37 isótopos, mas só o I-127 é estável. O I-131 é radioativo, usado em medicina nuclear para diagnóstico e tratamento de doenças da tireoide.',
    applications:
      'Sal iodado (NaCl + KI ou KIO₃) — política de saúde pública que praticamente eliminou bócio no mundo desenvolvido. Antisséptico tópico ("povidona-iodo" em consultórios e bandagens). Diagnóstico médico: contrastes iodados em raios-X e tomografias. I-131 radioativo em radioterapia para câncer de tireoide. Em química orgânica, reagentes iodados são fundamentais em síntese de medicamentos e corantes. Lâmpadas halógenas de iodo (mais brilhantes que incandescentes comuns).',
    curiosity:
      'Após acidentes nucleares como Chernobyl (1986) e Fukushima (2011), as autoridades distribuem comprimidos de iodeto de potássio (KI) à população próxima. A lógica é simples: ao saturar a tireoide com iodo não-radioativo, ela rejeita o iodo radioativo liberado por reatores danificados, prevenindo câncer de tireoide. É a única medida eficaz contra a contaminação radioativa por iodo — e tem prazo: precisa ser tomada nas primeiras horas após a exposição.',
  },
  54: {
    overview:
      'Xenônio é um gás nobre denso e raríssimo na atmosfera (apenas 0,087 ppm), mas com propriedades únicas que justificam aplicações premium — desde faróis de carros de luxo até propulsores iônicos de sondas espaciais. Foi o primeiro gás nobre que se conseguiu fazer reagir com outros elementos (em 1962), derrubando o dogma de que "gases nobres são inertes". Apesar do nome (do grego "estrangeiro"), está presente em todos os ambientes onde haja ar.',
    history:
      'Descoberto em 1898 por William Ramsay e Morris Travers, junto com criptônio e neônio, na destilação fracionada do ar líquido. O nome vem do grego "xenos" (estrangeiro), pela sua raridade — Ramsay considerou-o "o gás estrangeiro" entre os componentes do ar. Em 1962, Neil Bartlett conseguiu pela primeira vez fazer um gás nobre reagir, produzindo XePtF₆ — uma descoberta que reescreveu livros didáticos e abriu o campo da química dos gases nobres.',
    properties:
      'Gás monoatômico (Xe), incolor e inodoro, com densidade 4,5 vezes maior que o ar. Liquefaz a -108 °C. Forma compostos com flúor e oxigênio sob condições extremas (XeF₂, XeF₄, XeO₃). Tem nove isótopos estáveis. Quando excitado eletricamente, emite luz branco-azulada brilhante com espectro contínuo amplo — daí seu uso em lâmpadas que imitam luz solar. Sua densidade é tal que mergulhar a cabeça em xenônio puro causaria asfixia rápida.',
    applications:
      'Faróis de descarga de alta intensidade (HID, "xenon") em automóveis de luxo usam arcos elétricos em xenônio para produzir luz brilhante semelhante à luz solar. Lâmpadas de flash em câmeras profissionais e estroboscópios. Anestésico geral em medicina (caro, mas com perfil de segurança excelente). Combustível em propulsores iônicos de sondas espaciais (Dawn, BepiColombo) — ionizado e acelerado eletromagneticamente produz empuxo muito eficiente. Tomografia por emissão de pósitrons usa Xe-129.',
    curiosity:
      'A sonda Dawn da NASA, lançada em 2007, percorreu mais de 5,6 bilhões de quilômetros visitando os asteroides Vesta e Ceres — usando apenas 425 kg de xenônio como propulsor iônico. Para efeito de comparação, um foguete químico precisaria de toneladas de combustível para o mesmo trajeto. Os motores iônicos aceleram átomos ionizados de xenônio a 145.000 km/h, gerando empuxo minúsculo mas constante por meses — o "tempo é distância" do espaço.',
  },
  55: {
    overview:
      'Césio é um metal alcalino dourado prateado, o mais reativo entre os metais comuns — funde quase à temperatura corporal (28 °C) e explode em contato com a água com chama violeta. Sua principal aplicação não é industrial mas científica: é o "metrônomo" que define o segundo no Sistema Internacional. Cada relógio atômico do mundo é calibrado pela frequência de uma transição quântica no átomo de césio.',
    history:
      'Descoberto em 1860 por Robert Bunsen e Gustav Kirchhoff em águas minerais alemãs, usando a então nova técnica de espectroscopia que os mesmos haviam inventado. As linhas espectrais azul-celeste lhes deram o nome — do latim "caesius" (azul-celeste). Foi o primeiro elemento descoberto por análise espectroscópica, antes mesmo de ser isolado fisicamente. Bunsen e Kirchhoff descobriram também o rubídio no ano seguinte usando a mesma técnica.',
    properties:
      'Metal dourado-prateado macio (pode ser cortado com faca), tão reativo que oxida em microssegundos no ar e explode violentamente em água. Funde a apenas 28 °C — derrete na palma da mão. Densidade 1,93 g/cm³. Em chamas emite cor azul-violeta intensa. Armazenado em ampolas seladas a vácuo. Tem o maior raio atômico entre todos os elementos estáveis. Cs-137, isótopo radioativo subproduto de fissão nuclear, é dos mais perigosos contaminantes em acidentes nucleares.',
    applications:
      'Padrão internacional do segundo: 1 segundo = 9.192.631.770 ciclos da radiação emitida por uma transição específica no átomo de Cs-133. Todo GPS, internet, transação bancária e sincronia industrial moderna depende dessa medição. Catalisadores em produção química. Em prospecção de petróleo, formiato de césio (CsHCOO) é fluido de perfuração denso e não-corrosivo. Em fotocélulas e detectores infravermelhos (CsI). Cs-137 em radioterapia (gradualmente substituído por aceleradores).',
    curiosity:
      'Em 1987, na cidade de Goiânia, Brasil, ocorreu um dos piores acidentes radioativos da história civil: ferros-velhos abriram uma cápsula abandonada de cloreto de césio-137 usada em radioterapia, espalhando pó azul brilhante por bairros inteiros. Crianças brincaram com o "brilho", adultos passaram o pó pelo corpo achando ser mágico. O resultado: 4 mortes diretas, mais de 250 pessoas contaminadas, e bairros inteiros tiveram que ser demolidos. Foi um dos primeiros casos a entrar na escala INES da AIEA.',
  },
  56: {
    overview:
      'Bário é um metal alcalino-terroso prateado, denso e altamente reativo. Em sua forma de sulfato (BaSO₄) é o famoso "líquido de contraste" usado em exames de raio-X do trato digestivo — a substância densa e insolúvel que aparece em branco brilhante nas radiografias. Em outros compostos é tóxico, mas o sulfato é tão insolúvel que passa pelo corpo intacto. Em fogos de artifício produz a cor verde característica.',
    history:
      'Compostos de bário (especialmente sulfato e carbonato) eram conhecidos desde a Antiguidade. Em 1602, um sapateiro italiano notou que pedras de Bolonha brilhavam no escuro depois de aquecidas — eram cristais de sulfato de bário com impurezas (a "pedra fosforescente de Bolonha"). Carl Wilhelm Scheele identificou o óxido de bário em 1774, e Humphry Davy isolou o metal em 1808 por eletrólise. O nome vem do grego "barys" (pesado), pela alta densidade dos minerais.',
    properties:
      'Metal prateado-branco macio, mas tão reativo que oxida rapidamente em ar e reage violentamente com água. Funde a 727 °C. Densidade 3,51 g/cm³ — alta entre alcalino-terrosos. Em chamas emite cor verde-amarelada característica. Compostos solúveis (cloreto, nitrato) são extremamente tóxicos — interferem com condução nervosa e cardíaca. Sulfato de bário (BaSO₄) é praticamente insolúvel — daí seu uso medicinal seguro.',
    applications:
      'Sulfato de bário em medicina: é o "líquido de contraste" branco engolido antes de exames de raio-X do estômago e intestino. Em fogos de artifício, sais de bário produzem a cor verde característica. Em poços de petróleo, lama de perfuração de barita (BaSO₄ natural) controla pressão e estabiliza o furo. Pigmentos brancos (litopônio). Catalisadores químicos. Em material fotossensível para tubos de raio-X.',
    curiosity:
      'A famosa "pedra de Bolonha" do século XVII foi uma das primeiras substâncias fosforescentes descobertas — brilhava no escuro após exposição à luz. Por décadas alquimistas tentaram desvendar a magia, sem sucesso. Hoje sabemos: era sulfato de bário (BaSO₄) com traços de cobre, e a fosforescência vinha das impurezas, não do bário. Mesmo assim, foi crucial cientificamente: a pedra de Bolonha inspirou os primeiros estudos sistemáticos de emissão de luz em sólidos, séculos antes da física quântica.',
  },
  57: {
    overview:
      'Lantânio é o primeiro elemento da série dos lantanídeos — as "terras raras" do bloco f. Apesar do nome, não é particularmente raro: é mais abundante na crosta que chumbo ou mercúrio. Tem propriedades químicas tão similares aos outros lantanídeos que historicamente eles eram considerados "irmãos gêmeos" inseparáveis. Hoje é usado em baterias híbridas, fluido catalítico de refinarias e em lentes ópticas premium.',
    history:
      'Descoberto em 1839 pelo sueco Carl Gustaf Mosander ao tratar nitrato de cério com ácido nítrico diluído. Mosander notou que parte do material reagia diferente — havia um elemento "escondido" no cério. O nome vem do grego "lanthanein" (estar oculto), referindo-se exatamente a essa descoberta. Mosander foi pioneiro em separar lantanídeos individualmente, isolando também o térbio e o érbio na mesma fase de pesquisa.',
    properties:
      'Metal prateado-branco macio, maleável e dúctil. Funde a 920 °C. Densidade 6,15 g/cm³. Oxida rapidamente em ar úmido formando uma camada amarelo-esverdeada. Reage com água quente liberando hidrogênio. É o primeiro elemento de "bloco f" — sua química define o comportamento padrão dos lantanídeos. Quase impossível de separar dos outros lantanídeos sem cromatografia moderna, devido à química quase idêntica.',
    applications:
      'Eletrodos negativos em baterias de hidreto metálico de níquel (NiMH) — as baterias dos carros híbridos Toyota Prius e antigos celulares. Catalisadores fluidos (FCC) em refinarias de petróleo: cerca de 30% do uso mundial vai para "craquear" frações pesadas de petróleo em gasolina. Vidros de alta refração para lentes ópticas premium (binóculos, câmeras). Pedra de isqueiro (mischmetal — liga de lantânio, cério e outros).',
    curiosity:
      'Um quilo de pó de lantânio puro em contato com água libera energia suficiente para causar incêndio espontâneo. Por isso, lantânio metálico é guardado submerso em óleo mineral ou em ampolas de vidro vácuo. Mas esse mesmo "perigo" foi a base de uma aplicação útil: pedras de isqueiro feitas de mischmetal (liga de cério-lantânio-ferro) faíscam quando atritadas, produzindo a chama que acende cigarros e fogões a gás há mais de um século.',
  },
  58: {
    overview:
      'Cério é o mais abundante de todos os lantanídeos — mais comum na crosta que cobre. Foi o primeiro lantanídeo descoberto e é o único que forma compostos estáveis em estado de oxidação +4, propriedade que o torna catalisador único. Aparece em conversores catalíticos automotivos, polimento de vidros ópticos, pedras de isqueiro e fluidos catalíticos de refinarias.',
    history:
      'Descoberto em 1803 simultaneamente por dois grupos independentes: Jöns Jacob Berzelius e Wilhelm Hisinger na Suécia, e Martin Heinrich Klaproth na Alemanha. O nome veio em homenagem ao asteroide Ceres (descoberto em 1801 por Giuseppe Piazzi) — astronomia influenciando química, padrão da época. Foi um dos primeiros lantanídeos isolados, mas só em 1875 o americano William Hillebrand obteve cério metálico puro por eletrólise.',
    properties:
      'Metal prateado-branco, dúctil e relativamente macio. Funde a 798 °C. Densidade 6,77 g/cm³. Oxida muito rapidamente em ar, podendo até queimar espontaneamente quando arranhado. Tem propriedade única entre lantanídeos: forma o íon Ce⁴⁺ estável (não apenas o típico Ce³⁺), o que o torna oxidante poderoso em química analítica. Pirofórico — descargas de partículas de cério podem inflamar.',
    applications:
      'Conversores catalíticos automotivos contêm óxido de cério (CeO₂), que armazena e libera oxigênio para otimizar a combustão e reduzir emissões. Polimento de vidros ópticos: óxido de cério ("rouge de joalheiro") é o agente padrão para polimento fino de lentes e telas. Pedra de isqueiro de mischmetal (50% cério + 25% lantânio + outros). Fluido catalítico de craqueamento em refinarias de petróleo. Vidros UV-bloqueio (LCD, óculos).',
    curiosity:
      'Quando uma pedra de isqueiro raspa no metal, o que produz a faísca não é fricção comum: são partículas microscópicas de cério que se incendeiam espontaneamente ao serem expostas ao ar — uma reação de pirofóforo. O cério metálico é tão reativo que partículas de pó podem inflamar apenas pelo contato com oxigênio à temperatura ambiente. É essa química peculiar — descoberta há mais de um século — que faz isqueiros funcionarem até hoje.',
  },
  59: {
    overview:
      'Praseodímio é um lantanídeo prateado, macio e maleável, cujos sais formam soluções de um verde-amarelado característico — daí seu nome, "gêmeo verde" em grego. Embora pouco conhecido fora da indústria, está presente em ímãs de alto desempenho, lentes de vidro especial para soldadores e em ligas que vão de motores de aeronaves a pedras de isqueiro.',
    history:
      'Por décadas, químicos acreditaram ter isolado um único elemento chamado "didímio" do minério cerita. Em 1885, o austríaco Carl Auer von Welsbach mostrou que o didímio era na verdade uma mistura de dois elementos novos — separou-os por cristalização fracionada exaustiva e batizou-os de praseodímio ("gêmeo verde") e neodímio ("novo gêmeo"). Foi uma das separações mais difíceis da química do século XIX e demonstrou a similaridade quase brutal entre lantanídeos vizinhos.',
    properties:
      'Metal prateado-amarelado, macio o suficiente para ser cortado com faca, com densidade 6,77 g/cm³ e ponto de fusão de 931 °C. Em ar, forma uma camada verde de óxido que descasca, expondo metal fresco — por isso é guardado em óleo mineral. Seus íons Pr³⁺ em solução têm cor verde-clara distintiva. É paramagnético em todas as temperaturas acima de 1 K.',
    applications:
      'Liga com magnésio cria componentes leves e resistentes para motores aeronáuticos. Vidro de didímio (mistura Pr+Nd) é usado em óculos de soldadores e sopradores de vidro porque absorve seletivamente a luz amarela do sódio sem escurecer a visão. Pequenas adições de praseodímio nos ímãs Nd-Fe-B (de carros elétricos e turbinas eólicas) aumentam coercividade. Pigmentos cerâmicos amarelo-canário (PrZrSiO₄) coloram louças e azulejos.',
    curiosity:
      'Sopradores de vidro têm um problema clássico: a chama de sódio do maçarico emite um amarelo tão intenso que ofusca a vista e mascara o ponto exato em que o vidro derretido começa a colapsar. Lentes de didímio resolvem isso de maneira elegante — o praseodímio absorve aquela faixa específica do espectro e nada mais, deixando o vidro visível em sua cor real. É um filtro de banda tão preciso que ainda não foi superado por nenhum vidro sintético sem terras raras.',
  },
  60: {
    overview:
      'Neodímio é um metal lantanídeo prateado-branco, integrante das chamadas "terras raras". Sua aplicação mais famosa são os ímãs permanentes mais fortes conhecidos pela humanidade — ímãs neodímio (NdFeB) ficam tão poderosos que pequenos discos podem segurar várias vezes seu próprio peso. Estão em motores elétricos, headphones, alto-falantes, MRI hospitalares e turbinas eólicas. A China domina mais de 85% da produção mundial.',
    history:
      'Descoberto em 1885 pelo químico austríaco Carl Auer von Welsbach ao separar o "didímio" — uma mistura que era considerada um elemento desde 1841. Auer mostrou que didímio era na verdade uma combinação de dois elementos distintos, que ele batizou: praseodímio (do grego "prasios didymos", gêmeo verde) e neodímio (do grego "neos didymos", novo gêmeo). A descoberta abriu caminho para a separação sistemática dos lantanídeos, considerados "elementos gêmeos" pela química quase idêntica.',
    properties:
      'Metal lantanídeo prateado-amarelado, oxida em ar formando uma camada amarelo-verde de óxido. Funde a 1.024 °C. Densidade 7,01 g/cm³. Tem propriedades magnéticas extraordinárias quando ligado a ferro e boro (Nd₂Fe₁₄B) — a base dos ímãs neodímio. Forma compostos coloridos: óxido (Nd₂O₃) é cinza-azulado; sais variam de rosa a violeta. Tem sete isótopos estáveis. Em chamas emite cor rosa-amarelada.',
    applications:
      'Ímãs neodímio (Nd₂Fe₁₄B) são a aplicação dominante — os mais fortes do mundo, com força até 1,4 tesla, usados em motores de carros elétricos, turbinas eólicas, alto-falantes de fones de ouvido, discos rígidos, MRI hospitalares e geradores. Lasers Nd:YAG (cristal dopado com neodímio) em cirurgia ocular, marcação industrial e armas militares. Pigmentos rosa-violeta em vidros e cerâmicas. Filtros de luz em soldagem (vidro de neodímio bloqueia infravermelho).',
    curiosity:
      'Em 2010, a China cortou exportações de terras raras (incluindo neodímio) para o Japão durante uma disputa diplomática sobre as Ilhas Senkaku/Diaoyu. O impacto foi imediato: preços do neodímio quadruplicaram em meses, e indústrias automotivas e de turbinas eólicas mundiais entraram em pânico. Esse episódio acelerou a busca por minas alternativas em Austrália, EUA, Brasil e África, mas até hoje a China processa cerca de 90% dos lantanídeos refinados — um quase-monopólio que dita o ritmo da transição energética global.',
  },
  61: {
    overview:
      'Promécio é o único lantanídeo radioativo e o único elemento da tabela periódica entre o hidrogênio e o urânio que é essencialmente sintético — não há jazidas exploráveis na crosta terrestre. Foi batizado em homenagem a Prometeu, o titã grego que roubou o fogo dos deuses, refletindo o drama de um elemento "ausente" que só foi confirmado depois de décadas de busca em vão.',
    history:
      'Vários químicos no início do século XX anunciaram ter descoberto o elemento 61, mas nenhuma reivindicação resistiu à revisão. Só em 1945, no Laboratório Nacional de Oak Ridge (parte do Projeto Manhattan), Jacob Marinsky, Lawrence Glendenin e Charles Coryell isolaram-no de produtos de fissão de urânio em um reator. Anunciaram o feito apenas em 1947, após a Segunda Guerra. O nome veio da esposa de Coryell, Grace, em referência ao perigo de "brincar com o fogo nuclear".',
    properties:
      'Metal prateado-branco, denso (7,26 g/cm³), funde a 1.042 °C. Todos os 38 isótopos conhecidos são radioativos — o mais estável, Pm-145, tem meia-vida de 17,7 anos. O Pm-147 (meia-vida 2,62 anos) é o mais usado em laboratório. Em quantidade pura, brilha levemente em azul-esverdeado devido à sua própria radiação ionizando o ar — o glow não vem de fósforo, vem do próprio metal.',
    applications:
      'Pm-147 alimenta baterias atômicas miniaturizadas usadas em marca-passos antigos, satélites e instrumentos espaciais — converte radiação beta em eletricidade por meio de fósforos e células fotovoltaicas. Foi usado em tintas luminescentes para mostradores de relógios e instrumentos militares (substituindo o rádio, mais perigoso). Fonte de raios beta calibrada em medidores de espessura para indústrias de papel e plástico. Praticamente sem outros usos por causa do custo e da radioatividade.',
    curiosity:
      'A quantidade total de promécio que existe naturalmente na crosta terrestre, a qualquer momento, é estimada em menos de 600 gramas — formado por fissão espontânea ultrarrara em depósitos de urânio. Tudo o que se usa industrialmente é produzido artificialmente em reatores nucleares. É o elemento mais raro da tabela periódica abaixo do urânio: se você pudesse coletar todo o promécio da Terra, caberia em uma única caneca de café.',
  },
  62: {
    overview:
      'Samário é um metal lantanídeo prateado-amarelado, conhecido principalmente por seus ímãs permanentes samário-cobalto (SmCo) — segundos em força apenas aos ímãs de neodímio, mas com vantagem decisiva: mantêm magnetismo até 350 °C, contra apenas 80 °C do neodímio. Por isso são usados em motores de aviões militares, satélites e equipamentos médicos onde altas temperaturas matam outros ímãs.',
    history:
      'Descoberto em 1879 pelo químico francês Paul Émile Lecoq de Boisbaudran (o mesmo do gálio) no mineral samarsquita — daí o nome. Samarsquita foi nomeada em homenagem ao engenheiro russo Vasili Samarsky-Bykhovets, que coletou amostras no Cazaquistão em 1847. Samário foi assim o primeiro elemento da história nomeado indiretamente em homenagem a uma pessoa viva (embora pelo nome do mineral, não diretamente).',
    properties:
      'Metal lantanídeo prateado-amarelado moderadamente macio, oxida em ar formando uma camada amarela protetora. Funde a 1.072 °C. Densidade 7,52 g/cm³. Tem 7 isótopos naturais — três deles são alfa-radioativos com meia-vida tão longa (Sm-147 = 106 bilhões de anos) que são tratados como estáveis para propósitos práticos. Forma compostos coloridos rosa-pálidos. Em chamas emite cor amarelo-claro.',
    applications:
      'Ímãs samário-cobalto (SmCo₅ e Sm₂Co₁₇) são padrão em aplicações de alta temperatura: motores de aviões militares, satélites, equipamentos médicos em ambientes hostis. Catalisador em reações químicas industriais. Em reatores nucleares como veneno de nêutrons em hastes de controle. Em lasers especiais. Lentes ópticas de alta refração com vidro dopado de samário absorvem infravermelho.',
    curiosity:
      'A datação samário-neodímio (Sm-Nd) é uma das técnicas mais precisas para datar rochas com mais de 1 bilhão de anos. O Sm-147 decai em Nd-143 com meia-vida tão longa que a relação Nd/Sm em rochas pode revelar a idade exata da formação. Cientistas usaram essa técnica em rochas lunares trazidas pela Apollo, determinando que a Lua tem 4,42 bilhões de anos — mais nova que a Terra por cerca de 100 milhões de anos, consistente com a teoria do impacto gigante.',
  },
  63: {
    overview:
      'Európio é um metal lantanídeo prateado-pálido, conhecido principalmente como o "elemento da cor vermelha" em telas — fósforos de európio produzem o vermelho brilhante em telas LCD/CRT, TVs OLED e lâmpadas fluorescentes brancas. Também é o marcador anti-falsificação invisível em notas de euro: brilhe luz ultravioleta numa nota e verá padrões verde-amarelados de fluorescência por európio.',
    history:
      'Sua existência foi suspeitada por décadas mas resistiu ao isolamento — confundido com samário e gadolínio nas amostras misturadas. Foi finalmente identificado em 1896 pelo francês Eugène-Anatole Demarçay, que provou ser elemento distinto via espectroscopia. O nome homenageia a Europa, em parte como contraponto ao samário (homenagem russa) e ao gadolínio (homenagem ao finlandês Gadolin). Foi isolado puro em 1901.',
    properties:
      'Metal lantanídeo prateado-pálido, o mais reativo de todos os lantanídeos — oxida e reage com água quase tão rapidamente quanto o cálcio. Funde a 822 °C. Densidade 5,24 g/cm³ — a menor entre lantanídeos. Tem dois isótopos naturais (Eu-151 e Eu-153). É o único lantanídeo cujos compostos no estado +2 são estáveis em água (uma anomalia interessante). Tem alta seção de captura de nêutrons.',
    applications:
      'Fósforos de cor: óxido de európio dopado em ítrio (Y₂O₃:Eu) produz o vermelho brilhante em TVs CRT antigas. Atualmente, európio em fluoreto de bário-magnésio dá o vermelho em LEDs brancos e lâmpadas fluorescentes. Anti-falsificação: as notas de euro contêm marcadores fluorescentes de európio que brilham sob UV em padrões específicos. Em reatores nucleares como veneno de nêutrons. Em lasers raros de comprimento de onda específico.',
    curiosity:
      'As notas de euro foram cuidadosamente projetadas com európio justamente porque o elemento tem fluorescência muito específica e difícil de imitar. Cada nota tem padrões impressos com tinta de európio que brilham verde-amarelado sob luz UV. Bancos centrais europeus podem detectar falsificações analisando o espectro de fluorescência: até falsificações com pigmentos similares têm assinaturas espectrais diferentes do európio puro. É um dos sistemas de segurança mais sutis e eficazes de qualquer moeda do mundo.',
  },
  64: {
    overview:
      'Gadolínio é o lantanídeo com a maior capacidade conhecida de capturar nêutrons — qualquer nêutron térmico que passe perto é absorvido com voracidade quase mágica. Essa propriedade o torna útil em barras de controle de reatores nucleares e em agentes de contraste para ressonância magnética, onde literalmente realça tumores no corpo humano. É também o elemento ferromagnético mais "estranho" da tabela: torna-se magnético apenas em temperaturas baixas, perto do congelamento.',
    history:
      'Isolado em 1880 pelo suíço Jean Charles Galissard de Marignac a partir do mineral samarskita, mas separado de forma pura só em 1886 por Paul Émile Lecoq de Boisbaudran. Foi batizado em homenagem ao químico finlandês Johan Gadolin, que em 1794 identificou o primeiro mineral de terras raras (gadolinita) em uma mina perto de Ytterby, na Suécia — o ponto de partida de toda a química dos lantanídeos.',
    properties:
      'Metal prateado-branco, maleável e dúctil, densidade 7,9 g/cm³, funde a 1.313 °C. É ferromagnético abaixo de 19 °C (ponto de Curie) — perde o magnetismo num dia quente. Tem a maior seção de choque para captura de nêutrons térmicos de qualquer elemento estável (cerca de 49.000 barns para Gd-157, contra 600 do boro). Apresenta o efeito magnetocalórico mais forte conhecido perto da temperatura ambiente: aquece quando magnetizado, esfria quando desmagnetizado.',
    applications:
      'Agentes de contraste para ressonância magnética (gadolínio quelatado com EDTA ou DTPA) realçam vasos sanguíneos, tumores e inflamações — usados em milhões de exames por ano. Barras de controle e venenos queimáveis em reatores nucleares regulam a reação em cadeia. Pesquisa em refrigeradores magnetocalóricos sem gás — refrigeração mais eficiente e silenciosa, ainda em fase pré-comercial. Fósforos verdes em telas e em granadas de iluminação de raios-X intensificam o brilho.',
    curiosity:
      'O gadolínio injetado em pacientes para ressonância magnética é fortemente tóxico em forma livre — Gd³⁺ tem raio iônico próximo ao do cálcio e bloqueia canais celulares. A engenharia é envolvê-lo em quelantes orgânicos que o tornam inerte e excretável pelos rins em horas. Em pacientes com função renal severamente reduzida, esses agentes podem se acumular e causar uma doença rara chamada fibrose sistêmica nefrogênica — descoberta apenas em 2006, e que mudou os protocolos hospitalares no mundo todo.',
  },
  65: {
    overview:
      'Térbio é um lantanídeo prateado discreto, mas indispensável: ele faz a cor verde das telas que vemos todo dia e o magnetismo das ligas que se deformam quando expostas a um campo magnético — base de sonares submarinos modernos e atuadores de precisão. É também um dos quatro elementos batizados em homenagem à pequena vila sueca de Ytterby, junto com ítrio, érbio e itérbio.',
    history:
      'Descoberto em 1843 pelo químico sueco Carl Gustaf Mosander durante a análise da "yttria" extraída de minerais de Ytterby. Mosander mostrou que o que se acreditava ser um único óxido eram, na verdade, três frações com propriedades diferentes — terras amarela, rosa e branca. O nome veio diretamente da vila de Ytterby (junto com ítrio, érbio e itérbio), provavelmente o maior tributo onomástico que um lugar já recebeu da tabela periódica.',
    properties:
      'Metal prateado-cinza, dúctil e moderadamente reativo — oxida lentamente em ar. Densidade 8,23 g/cm³, funde a 1.356 °C. Compostos de Tb³⁺ emitem luz verde brilhante quando excitados por UV ou raios-X — base de fósforos de tela. A liga Terfenol-D (Tb-Dy-Fe) tem a maior magnetostricção à temperatura ambiente de qualquer material conhecido: muda de comprimento em até 0,2% quando submetida a um campo magnético.',
    applications:
      'Fósforos verdes em lâmpadas fluorescentes compactas e telas de LED indispensáveis para produzir cor verde pura. Terfenol-D em sonares navais, alto-falantes submarinos e atuadores micrométricos para indústria de precisão. Pequenas dosagens em ímãs Nd-Fe-B aumentam a resistência térmica — crucial para motores de carros elétricos. Detectores de raios-X médicos e células combustíveis de óxido sólido.',
    curiosity:
      'A vila de Ytterby, na ilha de Resarö (perto de Estocolmo), tem hoje cerca de 800 habitantes e um pequeno museu — mas é o lugar mais "produtivo" do mundo em termos de descobertas de elementos químicos. Quatro elementos levam diretamente o nome dela (Y, Tb, Er, Yb), e a mina próxima rendeu ainda outros quatro descobertos lá (Ho, Tm, Sc, Gd). Nenhum outro ponto geográfico do planeta nomeia tantos pontos da tabela periódica.',
  },
  66: {
    overview:
      'Disprósio é um lantanídeo prateado cujo nome em grego significa "difícil de obter" — apropriado, já que sua separação dos vizinhos químicos é particularmente trabalhosa. Hoje, é um dos elementos mais geopoliticamente sensíveis do mundo: sem ele, ímãs de neodímio em motores de carros elétricos e turbinas eólicas perdem força em alta temperatura. China controla mais de 95% da produção, tornando o disprósio um ponto crítico da transição energética.',
    history:
      'Descoberto em 1886 pelo francês Paul Émile Lecoq de Boisbaudran após mais de 30 cristalizações fracionadas sucessivas — uma quantidade extraordinária mesmo para a química da época. Frustrado pela dificuldade, batizou-o do grego "dysprositos" (difícil de obter). Só foi isolado em forma metálica pura em 1950, com técnicas modernas de troca iônica. Até então, todas as aplicações usaram óxidos ou misturas.',
    properties:
      'Metal prateado-branco macio, denso (8,55 g/cm³), funde a 1.407 °C. Tem um dos maiores momentos magnéticos atômicos conhecidos. Mantém propriedades magnéticas mesmo a temperaturas moderadamente altas — exatamente onde o neodímio falha. Forma camada de óxido escura ao ar. Reage lentamente com água fria, rapidamente com água quente. Possui sete isótopos naturais estáveis.',
    applications:
      'Aditivo essencial em ímãs Nd-Fe-B de alto desempenho — entre 1% e 6% de disprósio mantém o ímã magnetizado a 200 °C, condição típica dentro de motores elétricos. Cada veículo elétrico carrega cerca de 100 g de disprósio; cada turbina eólica offshore, vários quilos. Barras de controle em reatores nucleares (alta absorção de nêutrons). Dosímetros termoluminescentes. Lasers infravermelhos com fluoreto de disprósio.',
    curiosity:
      'Sem disprósio, todo o plano global de transição para carros elétricos enfrenta um gargalo físico inegociável. Os EUA, União Europeia e Japão classificam-no como "elemento crítico" — material estratégico em listas equivalentes às de petróleo durante a Guerra Fria. Em 2010, durante uma crise diplomática China–Japão, o preço do disprósio multiplicou-se por 20 em meses. É talvez o único elemento sobre o qual ministros de defesa e CEOs de montadoras conversam regularmente.',
  },
  67: {
    overview:
      'Hólmio tem a propriedade magnética mais extrema da tabela periódica: nenhum outro elemento estável apresenta momento magnético atômico tão alto. Apesar disso, é usado principalmente longe de ímãs — sua aplicação mais visível é o laser cirúrgico Ho:YAG, que pulveriza pedras nos rins sem cortar o paciente. Foi batizado em homenagem à cidade de Estocolmo (Holmia em latim).',
    history:
      'Identificado em 1878 simultaneamente por Marc Delafontaine e Jacques-Louis Soret em Genebra (que o chamaram "elemento X"), e independentemente em 1879 pelo sueco Per Teodor Cleve, em Uppsala. Cleve, que pôde isolar mais material, recebeu o crédito da nomenclatura e o batizou de "hólmio" como referência velada a Estocolmo, sua cidade natal. Hólmio puro só foi obtido em 1911 — décadas depois da descoberta.',
    properties:
      'Metal prateado-branco, macio e maleável, densidade 8,79 g/cm³, funde a 1.461 °C. Tem o maior momento magnético atômico de qualquer elemento ocorrente naturalmente — base de eletroímãs de pesquisa que geram os campos mais intensos do mundo. Em compostos sólidos, exibe ordens magnéticas complexas, como hélices magnéticas que mudam de direção com a temperatura. Soluções de Ho³⁺ têm cor amarela-rosada.',
    applications:
      'Pólos magnéticos em eletroímãs de pesquisa (campos acima de 4 T) para experimentos de física de altíssima energia. Lasers Ho:YAG (granada de ítrio-alumínio dopada com hólmio) em urologia — vaporizam cálculos renais e tratam hiperplasia prostática sem cirurgia aberta. Lasers similares em odontologia e dermatologia. Barras de controle em reatores nucleares. Padrão de calibração para espectrofotômetros UV-visível.',
    curiosity:
      'O laser Ho:YAG revolucionou a urologia nos anos 1990: emite em 2.100 nm, comprimento de onda absorvido fortemente pela água. Como cálculos renais são embebidos em água nos tecidos circundantes, a energia é depositada justamente na pedra, fragmentando-a em pó sem queimar o tecido adjacente. Antes desse laser, pacientes com cálculos grandes precisavam de cirurgia. Hoje o tratamento é ambulatorial, com flexível introduzido pela uretra.',
  },
  68: {
    overview:
      'Érbio é o elemento que faz a internet funcionar entre continentes. Sem ele, sinais ópticos em fibras submarinas se perderiam após algumas centenas de quilômetros. Amplificadores de fibra óptica dopados com érbio (EDFAs) regeneram pulsos de luz a cada poucas dezenas de quilômetros nas profundezas do oceano — o backbone invisível do tráfego intercontinental de dados.',
    history:
      'Descoberto em 1842 por Carl Gustaf Mosander, no mesmo trabalho que separou também o térbio. O nome vem novamente de Ytterby — a vila sueca que rendeu quatro elementos. Curiosamente, na nomenclatura original, érbio e térbio foram trocados de nome em algum momento do século XIX por confusão entre laboratórios — os nomes atuais foram fixados arbitrariamente depois que ninguém conseguia mais reconstruir qual elemento Mosander tinha originalmente chamado de qual.',
    properties:
      'Metal prateado-branco, dúctil e relativamente estável ao ar, densidade 9,07 g/cm³, funde a 1.529 °C. Íons Er³⁺ em solução têm cor rosa-clara distintiva. A propriedade mais comercialmente importante: Er³⁺ tem uma transição eletrônica em 1.530 nm — exatamente a janela de menor atenuação de fibras ópticas de sílica. Quando bombeado por luz de 980 nm, emite coerentemente nessa faixa de telecomunicações.',
    applications:
      'Amplificadores ópticos dopados com érbio (EDFAs) em redes de fibras submarinas e terrestres — não há alternativa econômica para amplificação óptica em 1.550 nm. Pigmento rosa em vidros e porcelanas (sem cádmio, ambientalmente preferido). Lasers Er:YAG em odontologia (cortam esmalte sem aquecimento) e cirurgia dermatológica (rejuvenescimento por ablação). Filtros ópticos em óculos de proteção para soldadores.',
    curiosity:
      'A cada poucos quilômetros nas profundezas dos oceanos, dentro do cabo submarino, há uma seção contendo poucos metros de fibra dopada com átomos de érbio. Quando o sinal chega enfraquecido, lasers de bombeio ali instalados excitam o érbio, que devolve a energia ao sinal — amplificando-o coerentemente sem precisar converter para eletricidade e de volta. Esse truque, inventado em 1986, é o motivo de o tráfego intercontinental da internet ser viável e barato.',
  },
  69: {
    overview:
      'Túlio é o segundo lantanídeo mais raro (depois do promécio) e um dos elementos mais caros da tabela periódica — frequentemente vale mais que ouro por grama. Apesar disso, encontrou nichos valiosos: aparelhos portáteis de raios-X para inspeção em campo (sem precisar de eletricidade), lasers cirúrgicos e cristais oscilantes de alta precisão. Seu nome vem de Thule, terra mítica do extremo norte na geografia clássica.',
    history:
      'Descoberto em 1879 pelo sueco Per Teodor Cleve, que separou-o dos óxidos de érbio. Cleve batizou-o em referência a Thule, lugar lendário citado por geógrafos gregos e romanos como o "fim do mundo" no Atlântico Norte — provavelmente a Islândia ou a Noruega. Foi uma maneira poética de marcar o caráter remoto e elusivo do elemento. Túlio puro só foi obtido em 1911, três décadas depois.',
    properties:
      'Metal prateado-cinzento, macio, maleável e bastante reativo — oxida em ar e reage lentamente com água fria, densidade 9,32 g/cm³. Funde a 1.545 °C. Possui apenas um isótopo estável (Tm-169), o que o torna invulgar entre lantanídeos. O Tm-170 (artificial, meia-vida 128 dias) emite raios gama de média energia ao decair — exatamente a faixa útil para radiografias industriais.',
    applications:
      'Tm-170 em fontes portáteis de raios X para radiografia industrial em locais remotos sem eletricidade (inspeção de soldas em oleodutos, peças aeroespaciais). Lasers de túlio (Tm:YAG, fibras dopadas) emitem em 2.000 nm para cirurgia urológica e ablação de tecidos moles. Pesquisa em qubits para computação quântica usando íons aprisionados de túlio. Pequenas adições em supercondutores cerâmicos de alta temperatura.',
    curiosity:
      'Antes da era dos detectores eletrônicos portáteis, técnicos que precisavam radiografar soldas em oleodutos no Ártico ou em refinarias remotas levavam pastilhas de túlio-170 em recipientes blindados. Pendurada perto da peça, a pastilha emite raios gama por meses, expondo filme radiográfico colocado do outro lado. Sem precisar de eletricidade, gerador ou tubo de raios-X — apenas física nuclear lenta, suficiente para inspecionar quilômetros de tubulação onde nada mais funcionaria.',
  },
  70: {
    overview:
      'Itérbio é um lantanídeo pesado e relativamente macio, mais conhecido por dois usos extremos: relógios atômicos óticos mais precisos do mundo e lasers de fibra industriais usados em cortes a laser de aço. Em ambos os casos, suas transições eletrônicas têm uma estabilidade quase ridícula — variam tão pouco que servem como referência fundamental de tempo e frequência.',
    history:
      'Identificado em 1878 pelo suíço Jean Charles Galissard de Marignac, que separou um novo óxido daquele que se acreditava ser apenas érbio. Foi mais um elemento batizado em referência a Ytterby, a vila sueca. Em 1907, descobriu-se que o "itérbio" de Marignac era, na verdade, uma mistura — Georges Urbain separou-o em itérbio (Yb) e lutécio (Lu). Itérbio puro só foi obtido em 1953.',
    properties:
      'Metal prateado-brilhante, macio e maleável, com a densidade mais baixa entre lantanídeos pesados (6,90 g/cm³). Funde a 824 °C, ponto excepcionalmente baixo entre lantanídeos. Apresenta três fases alotrópicas com diferentes estruturas cristalinas. A resistência elétrica do itérbio sob pressão tem mudanças bruscas exploradas em sensores de pressão. Íons Yb³⁺ em sólidos têm transições eletrônicas extremamente estreitas e estáveis.',
    applications:
      'Relógios atômicos óticos baseados em redes de itérbio aprisionado — definem o segundo com precisão de 10⁻¹⁸, mais de mil vezes melhor que relógios de césio. Lasers de fibra dopada com Yb em corte e solda industrial (centenas de quilowatts contínuos). Sensores de pressão e medidores de tensão para geofísica e engenharia estrutural. Dopante em aço inoxidável para resistência mecânica. Pesquisa em computação quântica com qubits atômicos.',
    curiosity:
      'Em 2020, físicos do NIST e do JILA demonstraram um relógio óptico de itérbio tão preciso que, se tivesse começado a contar no Big Bang, hoje estaria errado em menos de meio segundo. Esse nível de precisão já não serve só para experiências: começa a permitir medições gravitacionais — pelo princípio da relatividade geral, relógios em altitudes ligeiramente diferentes ticam em ritmos diferentes. Itérbio, na prática, transformou tempo em régua de altitude.',
  },
  71: {
    overview:
      'Lutécio é o último e mais pesado dos lantanídeos — o de obtenção mais difícil, o mais caro de produzir e o que historicamente fechou a série. Apesar disso, ganhou um papel importantíssimo na medicina nuclear: o Lu-177 é usado em terapia radioligante, ligando-se seletivamente a células tumorais e destruindo-as por radiação beta com mínimo dano colateral. É um dos avanços oncológicos mais notáveis dos últimos 20 anos.',
    history:
      'Descoberto independentemente em 1907 por três cientistas: o francês Georges Urbain, o austríaco Carl Auer von Welsbach e o americano Charles James — todos separando lutécio do que antes era chamado apenas de "itérbio". Urbain ficou com a primazia oficial e batizou-o em homenagem a Lutécia, nome latino para Paris. Por décadas houve disputa amarga de prioridade — typical da era em que terras raras eram a fronteira mais difícil da química.',
    properties:
      'Metal prateado-branco, denso (9,84 g/cm³, o mais denso dos lantanídeos) e relativamente duro. Funde a 1.652 °C — o maior ponto de fusão da série. Possui dois isótopos naturais: Lu-175 (97,4%, estável) e Lu-176 (radioativo, meia-vida 3,8 × 10¹⁰ anos). É o lantanídeo menos abundante na crosta terrestre e o mais caro de purificar, exigindo dezenas de etapas de troca iônica.',
    applications:
      'Lu-177 em radioterapia direcionada — ligado a anticorpos ou peptídeos que se aderem a receptores de células cancerígenas (Pluvicto para câncer de próstata metastático, Lutathera para tumores neuroendócrinos). Cristais de oxiortossilicato de lutécio (LSO) em detectores de PET-CT, com tempo de resposta superior aos cintiladores antigos. Catalisadores em refino de petróleo. Datação geológica por decaimento Lu–Hf, complementar ao sistema U–Pb.',
    curiosity:
      'Pluvicto, aprovado pelo FDA em 2022, é um tratamento revolucionário para câncer de próstata metastático resistente a hormônios. A molécula combina lutécio-177 a um peptídeo que se liga seletivamente a uma proteína expressa por células cancerígenas (PSMA). Injetado na corrente sanguínea, o composto se acumula nos tumores e os destrói por dentro, com radiação beta de alcance curto. Em ensaios clínicos, prolongou significativamente a sobrevida — terapia radioligante é considerada o próximo grande capítulo da oncologia.',
  },
  72: {
    overview:
      'Háfnio é um metal de transição prateado, raro, com uma química quase idêntica ao zircônio — tão similar que demorou 134 anos após a descoberta do zircônio para que o háfnio fosse identificado como elemento distinto. Hoje é estratégico em duas indústrias muito diferentes: reatores nucleares (absorve nêutrons) e chips de computador (porta isolante em transistores Intel).',
    history:
      'Previsto por Mendeleev, mas só descoberto em 1923 por Dirk Coster e George de Hevesy em Copenhagen, Dinamarca, usando análise espectral de raios-X em minerais de zircônio. O nome "hafnium" vem de "Hafnia", o nome latino de Copenhagen. Sua identificação foi um dos primeiros sucessos práticos da mecânica quântica: o número atômico 72 foi previsto pelo modelo atômico de Bohr antes da descoberta experimental.',
    properties:
      'Metal cinza-prateado, brilhante, dúctil, com propriedades quase idênticas ao zircônio — formam soluções sólidas em todas as proporções. Funde a 2.233 °C (muito alto). Resistente à corrosão por água e ácidos. Excelente absorvedor de nêutrons térmicos — o que limita seu uso em ligas com zircônio em reatores (o zircônio é desejável, o háfnio precisa ser separado). Forma óxido HfO₂ extremamente estável, dielétrico de alto-k.',
    applications:
      'Hastes de controle em reatores nucleares (especialmente submarinos), onde absorvem nêutrons para regular a fissão. Em chips de computador modernos (a partir de 2007, processadores Intel), o óxido de háfnio (HfO₂) substituiu o dióxido de silício como isolante de porta em transistores — permitindo continuação da Lei de Moore quando o SiO₂ chegou ao seu limite físico. Eletrodos em iluminação a plasma e em catodos de tubos de descarga. Ligas em motores de foguetes.',
    curiosity:
      'Quando a Intel anunciou em 2007 que substituiria o dióxido de silício por óxido de háfnio nos transistores do processador Penryn, foi descrita como "a maior mudança em transistores de silício em 40 anos". O motivo: à medida que os transistores encolhiam, a camada de SiO₂ ficava tão fina (~1 nm) que os elétrons "vazavam" por tunelamento quântico, desperdiçando energia. O HfO₂, com sua estrutura mais densa, bloqueia esse vazamento — permitindo gerações inteiras de chips mais eficientes.',
  },
  73: {
    overview:
      'Tântalo é um metal cinza-azulado denso, extremamente resistente à corrosão e com um dos pontos de fusão mais altos da tabela periódica. Discreto no cotidiano, está dentro de praticamente todo smartphone, câmera digital e aparelho auditivo do planeta — em capacitores compactos que armazenam carga elétrica com densidade incomparável. Sua extração concentra-se no minério coltan, da República Democrática do Congo, ligando-o a debates sobre "minerais de conflito".',
    history:
      'Descoberto em 1802 pelo sueco Anders Gustaf Ekeberg ao analisar minerais escandinavos. Por décadas foi confundido com o nióbio (descoberto no ano anterior) por causa da similaridade química quase perfeita — só em 1866 o suíço Jean Charles Galissard de Marignac separou os dois definitivamente. O nome veio do mito grego de Tântalo, rei condenado a permanecer eternamente em meio a água e frutas sem nunca conseguir tocá-las — referência irônica ao fato de o óxido do elemento ser tão inerte que nenhum ácido conseguia "saciá-lo" e dissolvê-lo.',
    properties:
      'Metal cinza-azulado, denso (16,65 g/cm³) e maleável. Funde a 3.017 °C — quinto maior ponto de fusão entre todos os elementos. Forma uma camada superficial de Ta₂O₅ extraordinariamente estável, que o torna virtualmente inatacável por ácidos à temperatura ambiente (resiste à água régia, que dissolve ouro). É biocompatível: tecidos vivos não reagem com ele, e por isso é usado em implantes médicos.',
    applications:
      'Capacitores eletrolíticos de tântalo em smartphones, notebooks, câmeras, aparelhos auditivos e marca-passos — densidade de capacitância imbatível em volume reduzido. Implantes ortopédicos e dentários: parafusos, placas, próteses de quadril. Equipamentos de processo químico (reatores, trocadores de calor) onde aço inoxidável corroeria. Ligas para palhetas de turbinas de avião e mísseis. Eletrodos para soldagem em condições extremas.',
    curiosity:
      'A maior parte do tântalo mundial vem do mineral coltan (columbita-tantalita), extraído principalmente na região leste da República Democrática do Congo — uma área historicamente assolada por conflitos armados financiados em parte pela exportação do minério. Em 2010, a lei Dodd-Frank dos EUA passou a exigir que empresas certificassem que seu tântalo não vinha de minas controladas por milícias. Hoje, fabricantes como Apple e Intel publicam relatórios anuais rastreando a origem de cada grama — um dos primeiros casos em que rastreabilidade de cadeia de suprimentos virou exigência regulatória global.',
  },
  74: {
    overview:
      'Tungstênio é um metal de transição cinza-aço com o ponto de fusão mais alto de todos os elementos puros (3.422 °C) — quase 1.000 °C acima do ferro. Sua dureza, densidade (19,3 g/cm³, como ouro) e refratariedade o tornam essencial em filamentos de lâmpada, eletrodos, projéteis e em metalurgia de alta performance. O símbolo W vem do alemão "Wolfram", nome ainda usado em vários idiomas.',
    history:
      'Identificado em 1781 pelo químico sueco Carl Wilhelm Scheele a partir do mineral scheelita, e isolado em 1783 pelos irmãos espanhóis Juan José e Fausto Elhuyar a partir da wolframita. O nome "tungstênio" vem do sueco "tung sten" (pedra pesada), pela alta densidade do mineral. "Wolfram", o nome original alemão, vem de "Wolfsrahm" (espuma de lobo) — porque o mineral atrapalhava a fundição do estanho como um lobo devora ovelhas.',
    properties:
      'Metal cinza-aço com o mais alto ponto de fusão de todos os elementos puros (3.422 °C) e o segundo mais alto entre todos os materiais (perde só para o carbono). Densidade 19,3 g/cm³ — equivalente ao ouro. Extremamente duro e resistente a corrosão, expansão térmica baixíssima. Quase inerte quimicamente em condições normais. Forma carbeto de tungstênio (WC), um dos materiais mais duros conhecidos.',
    applications:
      'Filamentos de lâmpadas incandescentes foram a aplicação clássica — único metal capaz de operar a mais de 2.500 °C sem evaporar rapidamente. Filamentos de raio-X e cátodos em tubos de elétrons. Carbeto de tungstênio em ferramentas de corte e perfuração industrial — brocas de tungstênio cortam aço como manteiga. Projéteis antitanque (urânio empobrecido sendo gradualmente substituído por tungstênio). Eletrodos de soldagem TIG. Contrapeso em fórmulas de tacos de golfe e dardos.',
    curiosity:
      'Durante a Segunda Guerra Mundial, o tungstênio se tornou recurso estratégico crítico — usado em projéteis e blindagens. Portugal e Espanha, oficialmente neutros, controlavam reservas significativas e venderam tungstênio para os dois lados. Em Portugal, a "febre do tungstênio" gerou uma economia paralela em vilarejos mineradores no norte do país, com fortunas feitas e perdidas em meses. Foi um dos poucos casos em que uma economia agrícola atrasada teve breve protagonismo econômico mundial.',
  },
  75: {
    overview:
      'Rênio é um dos elementos mais raros da crosta terrestre — mais escasso que o ouro, a platina ou qualquer terra rara. Foi o último elemento estável a ser descoberto na Terra, em 1925. Hoje, seu papel mais crítico está dentro das pás de turbina dos motores a jato modernos: ligas com rênio resistem a temperaturas que destruiriam qualquer outro material, permitindo motores mais eficientes e voos mais econômicos.',
    history:
      'Identificado em 1925 por Walter Noddack, Ida Tacke e Otto Berg na Alemanha, depois de processarem toneladas de minério de molibdênio para extrair miligramas do elemento. Foi batizado em homenagem ao rio Reno (Rhenus em latim), perto do laboratório onde os Noddack trabalhavam. Sua identificação fechou a última lacuna entre os elementos estáveis da tabela — tudo o que veio depois (até urânio) era radioativo ou já conhecido.',
    properties:
      'Metal prateado-branco, denso (21,02 g/cm³), com o terceiro maior ponto de fusão da tabela (3.186 °C, atrás apenas de tungstênio e carbono) e o maior ponto de ebulição de qualquer elemento (5.596 °C). Resistente à corrosão e à fadiga térmica, mantém propriedades mecânicas em temperaturas onde quase todos os outros metais perdem força. Tem um isótopo natural levemente radioativo (Re-187, meia-vida 4,1 × 10¹⁰ anos), usado em datação geológica.',
    applications:
      'Pás de turbina de motores a jato modernos contêm 3 a 6% de rênio em superligas baseadas em níquel — sem ele, motores como o GE90 ou o Trent XWB não atingiriam suas temperaturas operacionais. Catalisadores Pt-Re em refinarias produzem gasolina de alta octanagem por reforma catalítica. Filamentos em espectrômetros de massa e termopares para temperaturas extremas (até 2.200 °C). Eletrodos em flashes fotográficos.',
    curiosity:
      'A demanda por rênio é tão concentrada em motores a jato que, quando a Boeing e a Airbus aumentam produção, o preço do rênio reage em semanas. Cerca de 80% do rênio mundial vai para a indústria aeroespacial — uma das dependências mais críticas e silenciosas da aviação moderna. Como subproduto do molibdênio (que por sua vez é subproduto do cobre), sua oferta não pode ser facilmente ampliada: extraí-lo significa extrair três cadeias minerais em série. Países como Chile, EUA e Polônia dominam a produção.',
  },
  76: {
    overview:
      'Ósmio é o elemento mais denso conhecido — um cubo de 10 cm pesaria 22,6 kg, mais que dois galões de água. É um metal cinza-azulado da família da platina, extremamente duro e quebradiço, com cheiro característico nos seus compostos (literalmente "cheiroso", em grego). Pouco usado puro por ser frágil, ganha relevância em ligas para pontas de canetas-tinteiro, contatos elétricos de longa duração e como fixador histológico em microscopia eletrônica.',
    history:
      'Descoberto em 1803 pelo químico inglês Smithson Tennant ao analisar o resíduo escuro que sobrava quando platina bruta era dissolvida em água régia. No mesmo trabalho, Tennant também isolou o irídio. O nome veio do grego "osme" (odor), em referência ao cheiro acre e pungente do tetróxido de ósmio (OsO₄) — composto altamente volátil e tóxico que se forma quando o metal é exposto ao ar.',
    properties:
      'Metal cinza-azulado com tom levemente metálico, densidade 22,59 g/cm³ (o mais denso de todos os elementos). Funde a 3.033 °C. Extremamente duro, mas quebradiço — não pode ser trabalhado por forjamento. OsO₄ é altamente tóxico, volátil à temperatura ambiente, e ataca tecidos oculares e respiratórios — manuseio exige capela química e proteção rigorosa. Resiste à maioria dos ácidos em forma metálica massiva.',
    applications:
      'Ligas Os-Ir em pontas de canetas-tinteiro de luxo, pivôs de instrumentos de precisão e agulhas de toca-discos antigos — duráveis por décadas de uso intenso. Tetróxido de ósmio (OsO₄) como fixador de tecidos em microscopia eletrônica (cora gorduras e preserva ultraestruturas celulares). Catalisador na síntese de produtos farmacêuticos (hidroxilação assimétrica de Sharpless — Prêmio Nobel de 2001). Contatos elétricos em equipamentos que precisam de longuíssima vida útil.',
    curiosity:
      'A produção mundial anual de ósmio raramente passa de 1 tonelada — produzido apenas como subproduto do refino de platina e níquel. É tão raro e específico que pesquisadores precisam encomendar gramas individuais a fornecedores especializados. Curiosamente, apesar de ser o elemento mais denso, ósmio metálico não é radioativo nem particularmente tóxico — o perigo é todo do seu tetróxido, que pode se formar lentamente em peças expostas ao ar e contaminar laboratórios silenciosamente ao longo de meses.',
  },
  77: {
    overview:
      'Irídio é o segundo elemento mais denso (logo atrás do ósmio) e o metal mais resistente à corrosão do planeta — não é atacado por nenhum ácido isoladamente, nem mesmo pela água régia que dissolve ouro. Por isso é usado em ambientes extremos: pontas de velas de ignição de alto desempenho, cadinhos para crescer cristais de safira, e como padrão de medida do metro original. Sua marca mais famosa, porém, é geológica: uma camada de irídio enterrada em todo o planeta marca o impacto do asteroide que extinguiu os dinossauros.',
    history:
      'Descoberto em 1803 pelo inglês Smithson Tennant junto com o ósmio, ao analisar resíduos de refino de platina. O nome vem do grego "iris" (arco-íris), em referência às cores variadas de seus sais — vermelho, amarelo, azul, marrom, conforme o estado de oxidação. Em 1889, foi escolhido para integrar a liga platina-irídio (90/10) do protótipo internacional do metro e do quilograma — padrões físicos guardados em Sèvres, na França.',
    properties:
      'Metal prateado-branco com leve tom amarelado, densidade 22,56 g/cm³ (apenas levemente menor que ósmio). Funde a 2.466 °C. É o metal mais resistente à corrosão conhecido — só é atacado por sais oxidantes fundidos a altíssimas temperaturas. Extremamente duro e frágil, difícil de trabalhar. Tem dois isótopos naturais (Ir-191 e Ir-193). É raro: cerca de 0,001 partes por milhão na crosta — semelhante à concentração de platina.',
    applications:
      'Eletrodos de velas de ignição em motores de alta performance (Formula 1, motocicletas esportivas) e em motores de avião — duram muito mais que platina ou tungstênio. Cadinhos de irídio para crescer cristais únicos de safira e granadas para lasers em altíssimas temperaturas. Liga platina-irídio em pontas de canetas e nos padrões internacionais de medida originais. Implantes médicos e contatos elétricos em ambientes corrosivos. Catalisadores para hidrogenação assimétrica industrial.',
    curiosity:
      'Em 1980, o físico Luis Alvarez e seu filho geólogo Walter publicaram um estudo bombástico: uma camada fina de argila datada de 66 milhões de anos atrás, encontrada em locais diversos do planeta, continha concentrações de irídio até 30 vezes maiores que o normal terrestre. Como irídio é raro na crosta mas relativamente comum em asteroides, eles propuseram que essa camada — hoje chamada limite K-Pg — era o registro de um impacto cataclísmico que extinguiu os dinossauros. A teoria foi controversa por uma década, até a confirmação em 1990 da cratera de Chicxulub, no México. Irídio resolveu o maior mistério paleontológico do século.',
  },
  78: {
    overview:
      'Platina é um metal nobre cinza-prateado, denso e brilhante — um dos elementos mais raros e valiosos da crosta terrestre. Conhecida pela altíssima resistência à corrosão, ponto de fusão elevado e propriedades catalíticas únicas, é usada em joalheria de luxo, conversores catalíticos automotivos, eletrodos médicos e laboratórios químicos. Seu nome vem do espanhol "platina" (pequena prata), originalmente um termo desdenhoso.',
    history:
      'Conhecida pelos povos pré-colombianos sul-americanos (especialmente equatorianos), que faziam joias de platina antes da chegada dos espanhóis. Os conquistadores espanhóis no século XVI consideraram a platina um "estorvo" — confundia com prata mas era impossível fundir. Antonio de Ulloa descreveu-a cientificamente em 1748, e William Hyde Wollaston desenvolveu o método para purificá-la em 1803. Tornou-se valiosa quando se descobriu seu uso catalítico no século XIX.',
    properties:
      'Metal prateado-branco, denso (21,4 g/cm³, mais que o ouro) e dúctil. Funde a 1.768 °C — alto entre metais. Extremamente resistente à corrosão: não reage com a maioria dos ácidos (só dissolve em água régia, como o ouro). É um dos catalisadores mais poderosos conhecidos: acelera reações químicas sem ser consumido. Tem 6 isótopos estáveis e ocorre frequentemente associada a outros platinoides (paládio, ródio, irídio, ósmio, rutênio).',
    applications:
      'Conversores catalíticos automotivos — cerca de 40% da demanda mundial. Platina, paládio e ródio convertem gases tóxicos do escapamento (CO, NOx, hidrocarbonetos) em CO₂, N₂ e água. Joalheria de alto luxo (especialmente alianças). Eletrodos médicos em marca-passos e implantes (biocompatível). Catalisadores em refinarias de petróleo e produção de ácido nítrico. Reservas financeiras junto com ouro e prata. Termômetros de precisão (resistência platina).',
    curiosity:
      'Os antigos padrões do quilograma e do metro mantidos em Paris (1889-1960) eram feitos de uma liga 90% platina + 10% irídio — escolhidos por sua imutabilidade química absoluta. Foram aposentados quando o quilograma foi redefinido em 2019 com base na constante de Planck. Antes disso, todo laboratório do mundo calibrava suas medições contra o "Protótipo Internacional do Quilograma", um único objeto físico de platina-irídio guardado sob três jarras de vidro num cofre perto de Paris.',
  },
  79: {
    overview:
      'Ouro é um metal denso, brilhante e amarelo, valorizado por humanos há mais de oito mil anos pela combinação rara de ser quase indestrutível, fácil de moldar e impressionantemente bonito. É raro na crosta terrestre — apenas cerca de 4 partes por bilhão — mas concentrado em depósitos que justificaram impérios, guerras e migrações em massa. Não enferruja, não escurece, não reage com quase nada.',
    history:
      'Trabalhado desde pelo menos 6.000 a.C. Os faraós egípcios eram sepultados com toneladas de ouro. Conquistas espanholas no Novo Mundo foram impulsionadas pela busca pelo metal nas civilizações asteca e inca. As corridas do ouro na Califórnia (1849) e no Yukon (1896) deslocaram milhões de pessoas. O símbolo Au vem do latim "aurum" (aurora brilhante), uma referência ao seu brilho amarelado quente.',
    properties:
      'O metal mais maleável conhecido — um grama pode ser estendido em uma folha de quase 1 m². Não reage com a maioria dos ácidos (apenas a água régia, mistura de ácido nítrico e clorídrico, o dissolve). Densidade 19,3 vezes maior que a água — uma bolinha do tamanho de uma laranja pesa mais de 7 kg. Excelente condutor elétrico, usado em eletrônicos de alta confiabilidade.',
    applications:
      'Joalheria e reservas financeiras (cerca de metade da demanda mundial). Eletrônica: contatos de conectores, processadores e satélites (resiste à radiação espacial). Odontologia: coroas, próteses e restaurações. Medicina: nanopartículas de ouro estão sendo testadas em tratamentos contra câncer e entrega de medicamentos. Vidros amarelos e vermelhos para arquitetura usam ouro coloidal.',
    curiosity:
      'Todo o ouro já minerado na história da humanidade caberia em um cubo de cerca de 22 metros de lado. A maior parte desse ouro chegou à Terra durante colisões de estrelas de nêutrons há mais de 4 bilhões de anos — eventos cataclísmicos que forjam elementos pesados e os espalham pelo universo. O ouro do seu anel pode ter sido criado em uma colisão estelar mais violenta que qualquer supernova.',
  },
  80: {
    overview:
      'Mercúrio é o único metal líquido à temperatura ambiente — uma propriedade tão singular que fascinou alquimistas e cientistas durante séculos. Pesado, prateado e altamente tóxico, foi usado por milênios em medicamentos, processos industriais e instrumentos científicos até descobrirmos os danos neurológicos catastróficos que causa. Hoje é progressivamente proibido em quase todos os usos.',
    history:
      'Conhecido desde a Antiguidade — tumbas egípcias de 1500 a.C. contêm mercúrio. Era central na alquimia: a busca pela "pedra filosofal" envolvia transmutações usando mercúrio e enxofre. O imperador chinês Qin Shi Huang teria morrido em 210 a.C. tomando elixires de mercúrio para imortalidade. O símbolo Hg vem do latim "hydrargyrum" (prata líquida), e o nome mercúrio veio do deus romano da velocidade — por sua fluidez.',
    properties:
      'Líquido prateado denso (13,5 vezes mais denso que a água — uma pessoa flutuaria sobre ele). Funde a -39 °C e ferve a 357 °C. Forma "amálgamas" — soluções metálicas com quase todos os outros metais (exceto ferro), dissolvendo-os como se fossem açúcar em água. Os vapores são extremamente tóxicos: a inalação causa danos cerebrais cumulativos. Compostos orgânicos como o metilmercúrio se acumulam em peixes.',
    applications:
      'Por séculos, termômetros, barômetros e manômetros usavam mercúrio pela expansão térmica linear. Lâmpadas fluorescentes contêm uma quantidade pequena para emitir luz ultravioleta que excita o revestimento de fósforo. A amalgamação ainda é usada em mineração artesanal de ouro (com graves consequências ambientais). Foi usado em chapéus de feltro no século XIX — daí a expressão "louco como um chapeleiro".',
    curiosity:
      'A expressão "louco como um chapeleiro" do livro Alice no País das Maravilhas tem origem real: chapeleiros do século XIX usavam nitrato de mercúrio para curtir o feltro de chapéus de pele. Anos de exposição aos vapores causavam tremores, irritabilidade, problemas de fala e demência — síndrome conhecida como "chapeleirismo". O personagem do Chapeleiro Maluco é uma representação caricata desses casos.',
  },
  81: {
    overview:
      'Tálio é um metal pós-transição cinza-prateado, macio o suficiente para ser cortado com faca — e um dos venenos mais sinistros da química. Insípido, inodoro e solúvel em água, seus compostos foram historicamente usados como raticida e inseticida, antes de se descobrir que matavam tanto humanos quanto pragas. Romances de Agatha Christie e crimes reais o tornaram famoso como "veneno do envenenador", justamente pela dificuldade de detecção retrospectiva.',
    history:
      'Descoberto em 1861 pelo inglês William Crookes ao examinar resíduos de uma fábrica de ácido sulfúrico com um espectroscópio — notou uma linha verde-esmeralda intensa que não correspondia a nenhum elemento conhecido. Batizou-o do grego "thallos" (broto verde), em referência à cor da linha espectral. Foi um dos primeiros elementos descobertos pelo então recente método espectroscópico, que revolucionou a química analítica do século XIX.',
    properties:
      'Metal cinza-prateado, macio (pode ser cortado com faca, mais mole que chumbo), densidade 11,85 g/cm³, funde a 304 °C. Em ar úmido oxida rapidamente, formando uma camada cinza-azulada. Tem dois estados de oxidação importantes: Tl⁺ (mais estável, comportamento semelhante a potássio em sistemas biológicos — daí a toxicidade) e Tl³⁺. Compostos de tálio são absorvidos pela pele e por via oral, com dose letal de cerca de 1 grama em adultos.',
    applications:
      'Tl-201 em medicina nuclear para cintilografia de perfusão miocárdica — detecta áreas do coração com fluxo sanguíneo reduzido em pacientes cardíacos. Cristais de iodeto de sódio dopados com tálio em detectores de cintilação para raios gama (usados em câmeras gama hospitalares e em detecção de materiais nucleares). Vidros ópticos de alto índice de refração com Tl₂O. Historicamente, em raticidas e inseticidas — banidos na maioria dos países desde os anos 1970 por causa de envenenamentos acidentais e criminais.',
    curiosity:
      'Em 1961, Agatha Christie publicou "O Cavalo Amarelo" descrevendo em detalhes os sintomas do envenenamento por tálio — perda de cabelo, dores nas pernas, falência neurológica progressiva. Quase duas décadas depois, um médico em Londres reconheceu esses mesmos sintomas em uma criança e salvou sua vida por ter lido o romance. Mais sombrio: Saddam Hussein supostamente usou tálio para envenenar dissidentes nos anos 1980, e em 2006 a russa Anna Politkovskaya foi tratada para suspeita de envenenamento por tálio antes de ser assassinada. A literatura, no caso desse elemento, virou diagnóstico clínico.',
  },
  82: {
    overview:
      'Chumbo é um metal pesado, macio e azul-acinzentado que foi um dos primeiros metais trabalhados pela humanidade. Encanamentos romanos, balas de armas, soldas, baterias de carros, tinta e cosméticos — sua versatilidade impulsionou civilizações inteiras antes de descobrirmos que é um veneno cumulativo que afeta o sistema nervoso, especialmente em crianças.',
    history:
      'Usado há mais de 8.000 anos. Os romanos o produziam em larga escala — encanamentos, telhados, recipientes para vinho. A palavra "encanamento" em inglês ("plumbing") vem de "plumbum", o nome latino do chumbo. A queda de Roma já foi atribuída em parte ao envenenamento crônico por chumbo da elite. Sua toxicidade só foi reconhecida cientificamente no século XX, levando à proibição em gasolina (1970-2000) e tintas residenciais.',
    properties:
      'Denso (11,3 vezes mais que a água), macio o suficiente para ser cortado com faca, com baixo ponto de fusão (327 °C). Resistente à corrosão por ácidos comuns — daí seu uso em encanamentos e baterias de chumbo-ácido. Bloqueia radiação ionizante eficientemente, sendo o material padrão em aventais de raio-X e revestimentos de reatores nucleares. Quimicamente versátil: pode formar compostos com chumbo nos estados de oxidação +2 e +4.',
    applications:
      'Baterias de chumbo-ácido em automóveis ainda são o maior uso global — cerca de 80% da produção. Munições, contrapesos para barcos e mergulho, e revestimento de cabos submarinos. Em medicina nuclear e radiologia, blindagem contra radiação. Cristal de chumbo (vidro com óxido de chumbo) tem brilho excepcional pela alta refração. Ligas com estanho formam soldas — mas soldas com chumbo foram proibidas em eletrônicos de consumo.',
    curiosity:
      'O chumbo é tão eficaz em bloquear radiação que detetives forenses analisam ossos antigos pela quantidade de chumbo absorvido em vida. A elite romana tinha níveis tão altos no esqueleto que isso tem sido proposto como causa parcial de demência e infertilidade entre patrícios. Inversamente, em ossos de pessoas comuns os níveis eram muito menores — uma das primeiras evidências de "desigualdade tóxica" da história.',
  },
  83: {
    overview:
      'Bismuto é um metal pós-transição cinza-prateado com tons rosados, conhecido pela toxicidade muito baixa apesar de estar próximo ao chumbo na tabela periódica. Forma cristais em escada com cores iridescentes vibrantes — uma das estruturas cristalinas mais bonitas entre os metais. É usado em medicamentos gástricos (Pepto-Bismol), cosméticos, soldas e como substituto seguro do chumbo em vários produtos.',
    history:
      'Compostos de bismuto foram usados desde a Antiguidade (em maquiagens egípcias), mas só foi reconhecido como elemento distinto no século XV — antes era confundido com chumbo ou estanho. O metalúrgico alemão Georgius Agricola descreveu-o em 1546. O nome provavelmente vem do alemão "wismut" (massa branca). Curiosamente, por séculos foi considerado o elemento estável mais pesado, até que medições precisas em 2003 mostraram que o Bi-209 decai com meia-vida de 10¹⁹ anos — bilhões de bilhões de vezes a idade do universo.',
    properties:
      'Metal cinza-prateado com tom rosado, frágil e cristalino. Funde a 271 °C (baixo para metal). Densidade 9,78 g/cm³. Tem propriedade rara entre metais: expande ao solidificar (como a água). É o elemento mais diamagnético conhecido (repele campos magnéticos). Quando oxidado em cristais formados controladamente, exibe cores iridescentes do arco-íris pelo "filme fino" de óxido na superfície.',
    applications:
      'Subsalicilato de bismuto (Pepto-Bismol) trata distúrbios gástricos como diarreia e indigestão — combina antibactericida com revestimento gástrico. Cosméticos: oxicloreto de bismuto (perolizante em sombras, batons e esmaltes). Soldas e ligas de baixo ponto de fusão (substituindo chumbo). Em produção de cristais decorativos para colecionadores (Bi-cristals). Carregadores de calor em reatores nucleares experimentais. Em catalisadores químicos.',
    curiosity:
      'Durante décadas, livros didáticos diziam que o bismuto-209 era o elemento estável mais pesado — o último isótopo natural não-radioativo. Em 2003, cientistas franceses descobriram que ele na verdade decai, com meia-vida de 1,9 × 10¹⁹ anos — cerca de 1 bilhão de bilhão de vezes a idade do universo. Tecnicamente é radioativo, mas se você esperar 100 universos consecutivos morrerem, apenas uma fração mínima dos átomos terá decaído. É a "estabilidade que não é estável".',
  },
  84: {
    overview:
      'Polônio é um metal radioativo raro e altamente tóxico, descoberto por Marie e Pierre Curie em 1898 — o primeiro elemento batizado por motivações políticas, em homenagem à Polônia natal de Marie, então sob domínio russo. Não tem aplicações industriais significativas, mas ficou infame em 2006 quando o ex-espião russo Alexander Litvinenko foi assassinado em Londres por envenenamento com Po-210 — um dos atentados mais elaborados da história da espionagem.',
    history:
      'Descoberto em 1898 por Marie e Pierre Curie ao analisar pechblenda (minério de urânio), foi o primeiro elemento que isolaram e o primeiro de muitos a serem identificados por radioatividade. Marie escolheu o nome "polônio" para chamar atenção internacional para sua terra natal subjugada — a Polônia tinha sido dividida entre Império Russo, Alemanha e Áustria. Foi uma declaração política sutil em uma época em que a Polônia não existia como nação independente.',
    properties:
      'Metal prateado-cinzento brilhante, raro (uma das substâncias naturais mais escassas — 100 microgramas por tonelada de minério de urânio). Funde a 254 °C. Todos os 33 isótopos conhecidos são radioativos — o mais "estável" é Po-209 com meia-vida de 124 anos. O Po-210 é o mais notório: emissor alfa forte, com meia-vida de 138 dias. Extremamente tóxico: uma quantidade do tamanho de grão de sal pode ser letal se inalado ou ingerido.',
    applications:
      'Praticamente nenhuma aplicação industrial — raro, caro e perigoso demais. Po-210 foi usado em ionizadores de ar antiestáticos industriais (para dissipar cargas em fábricas têxteis e de papel), agora substituído por alternativas mais seguras. Como fonte de calor em sondas espaciais soviéticas (Lunokhod). Pesquisa nuclear básica. Em iniciadores de fissão de armas nucleares antigas (substituído por outras tecnologias).',
    curiosity:
      'Em novembro de 2006, Alexander Litvinenko — ex-agente do KGB que se tornou crítico de Putin — foi envenenado em Londres com chá contaminado com Po-210. A escolha do veneno foi cirúrgica: praticamente indetectável em exames toxicológicos padrão, sem antídoto conhecido, e fácil de transportar discretamente em quantidades letais. Litvinenko morreu três semanas depois em hospital, mas teve tempo de identificar o responsável. Trilhas radioativas pelo Reino Unido permitiram à polícia rastrear o assassino até a Rússia — Andrei Lugovoy, ainda hoje protegido pelo Kremlin.',
  },
  85: {
    overview:
      'Astato é o elemento natural mais raro da crosta terrestre — estima-se que, somando todos os átomos espalhados pelo planeta, exista menos de 25 gramas a qualquer momento. É um halogênio radioativo cujos isótopos têm meias-vidas tão curtas que ninguém jamais viu uma amostra visível: todo conhecimento sobre suas propriedades vem de quantidades de algumas centenas de átomos, manipuladas por minutos antes de decaírem.',
    history:
      'Sintetizado em 1940 por Dale Corson, Kenneth MacKenzie e Emilio Segrè na Universidade da Califórnia em Berkeley, bombardeando bismuto-209 com partículas alfa em um cíclotron. Foi batizado do grego "astatos" (instável) — apropriado, já que todos os 39 isótopos conhecidos são radioativos. Anos depois, traços naturais foram detectados como produtos intermediários do decaimento de urânio e tório, mas em quantidades desprezíveis.',
    properties:
      'Halogênio mais pesado, com comportamento intermediário entre iodo e características metálicas. O isótopo mais longevo, At-210, tem meia-vida de apenas 8,1 horas; o At-211, usado em pesquisa médica, dura 7,2 horas. Por nunca ter sido obtido em quantidade macroscópica, propriedades como cor, ponto de fusão e estrutura cristalina são extrapoladas — provavelmente é um sólido escuro semi-metálico que sublimaria rapidamente à temperatura ambiente.',
    applications:
      'Astato-211 está sendo estudado intensivamente como agente terapêutico em radioterapia direcionada por alfa — emite partículas alfa de altíssima energia e curto alcance, capazes de destruir células tumorais individuais sem danificar tecidos vizinhos. Ligado a anticorpos monoclonais ou peptídeos, vai diretamente a tumores como leucemia, glioma e câncer ovariano. Ensaios clínicos começaram nos anos 2010 com resultados promissores. Fora dessa aplicação, praticamente não há uso industrial.',
    curiosity:
      'Se você conseguisse coletar todo o astato existente naturalmente na crosta terrestre em um único frasco, teria menos do que cabe na ponta de um alfinete — e ele evaporaria por radioatividade antes que pudesse fechar a tampa. Toda a química conhecida do elemento foi reconstruída a partir de experimentos com algumas centenas a alguns milhares de átomos, detectados individualmente em câmaras de contagem após segundos de manipulação. É talvez o caso extremo de um elemento "conhecido mas inacessível": existe, mas a humanidade nunca pôde segurá-lo nas mãos.',
  },
  86: {
    overview:
      'Radônio é o gás nobre mais pesado de todos — incolor, inodoro e radioativo. Forma-se naturalmente pela decomposição do rádio em rochas e solo, e se acumula em porões e ambientes fechados. É a segunda maior causa de câncer de pulmão depois do cigarro, ironicamente porque é tão difícil de detectar: gases nobres "invisíveis" são piores que fumaça visível.',
    history:
      'Descoberto em 1900 pelo químico alemão Friedrich Ernst Dorn como um produto gasoso radioativo do rádio — não muito tempo depois de Marie e Pierre Curie terem isolado o rádio. Inicialmente foi chamado de "emanação do rádio". O nome atual veio em 1923 da palavra "rádio" + sufixo "-on" comum a gases nobres. Sua importância em saúde pública só foi reconhecida na década de 1980, quando engenheiros mediram níveis alarmantes em casas americanas.',
    properties:
      'Gás monoatômico (Rn) à temperatura ambiente, incolor e inodoro, com densidade 9,7 vezes maior que o ar. Liquefaz a -62 °C. Todos os seus 35 isótopos conhecidos são radioativos — o mais comum, Rn-222, tem meia-vida de 3,8 dias. Pertence ao grupo dos gases nobres mas forma alguns fluoretos sob condições extremas. Emite radiação alfa, particularmente perigosa quando inalada porque deposita energia diretamente nos pulmões.',
    applications:
      'Praticamente nenhuma aplicação industrial — é raro, caro e perigoso demais. Em alguns países era usado em fontes radioativas para radioterapia, hoje substituído por aceleradores e isótopos mais seguros. Estudos geológicos usam medições de radônio para detectar falhas tectônicas e prever erupções vulcânicas — picos de radônio no solo precedem alguns terremotos. Detecção de radônio é um pequeno mercado de equipamentos para inspeções imobiliárias.',
    curiosity:
      'Em 1985, Stanley Watras, engenheiro nuclear, acionou os detectores de radioatividade na usina nuclear onde trabalhava — porém ele estava CHEGANDO ao trabalho, não saindo. Ele estava contaminado por radônio da sua própria casa na Pensilvânia, onde os níveis eram 700 vezes acima do limite recomendado. Após esse caso, a EPA passou a recomendar testes de radônio em todas as casas dos EUA. Estima-se que radônio cause 21.000 mortes por câncer de pulmão por ano só nos EUA.',
  },
  87: {
    overview:
      'Frâncio é o último elemento descoberto na natureza (não sintetizado) e o segundo mais raro da crosta terrestre, perdendo apenas para o astato. Estima-se que existam menos de 30 gramas de frâncio espalhados por todo o planeta a qualquer momento — formados continuamente pelo decaimento de actínio em minérios de urânio. É o metal alcalino mais pesado, e por extrapolação, o mais reativo: explodiria violentamente em contato com água, se alguém conseguisse juntar quantidade suficiente.',
    history:
      'Descoberto em 1939 pela química francesa Marguerite Perey, então assistente de Marie Curie no Instituto do Rádio em Paris. Perey identificou-o ao perceber uma forma de decaimento radioativo do actínio-227 que produzia um isótopo com propriedades químicas de metal alcalino. Batizou-o em homenagem à França, sua pátria. Foi a última descoberta de um elemento ocorrente naturalmente na Terra — todos os elementos sintetizados depois vieram de aceleradores ou reatores.',
    properties:
      'Metal alcalino mais pesado, com propriedades extrapoladas a partir de pouquíssimos átomos jamais reunidos em laboratório (não mais de 300.000 simultaneamente). O isótopo mais estável, Fr-223, tem meia-vida de apenas 22 minutos. Provavelmente seria líquido em torno de 27 °C, com brilho metálico, mas oxidaria instantaneamente em ar. Tem o maior raio atômico entre os alcalinos (a nuvem eletrônica mais difusa) e o menor potencial de ionização — daí ser teoricamente o mais reativo.',
    applications:
      'Nenhuma aplicação prática: produzir e armazenar frâncio em quantidade útil é fisicamente impossível com a tecnologia atual — ele decai mais rápido do que é fabricado. Sua única "utilidade" é em pesquisa fundamental de física atômica: medições espectroscópicas de átomos isolados ajudam a testar previsões da eletrodinâmica quântica e procurar violações de simetria fundamentais. Universidades como Stony Brook mantêm armadilhas magneto-ópticas que aprisionam algumas centenas de átomos de cada vez.',
    curiosity:
      'Marguerite Perey começou como técnica de laboratório de Marie Curie, sem diploma universitário formal — situação típica para mulheres na ciência da década de 1920. Sua descoberta do frâncio a tornou, em 1962, a primeira mulher eleita para a Académie des Sciences francesa em quase 300 anos de existência da instituição. Morreu de câncer ósseo em 1975, quase certamente causado pela exposição prolongada à radiação que ela mesma estudava — um destino que ela compartilha com sua mentora.',
  },
  88: {
    overview:
      'Rádio é um metal alcalino-terroso prateado, intensamente radioativo, que emite um brilho azul-esverdeado fantasmagórico no escuro — a radioluminescência que fascinou cientistas e charlatães do início do século XX. Foi por décadas tratado como substância milagrosa, vendido em tônicos, cremes, pasta de dente e relógios "que brilham para sempre", até que a relação entre rádio e câncer se tornou tragicamente clara. Hoje, é um símbolo dos perigos da euforia tecnológica sem base científica.',
    history:
      'Isolado em 1898 por Marie e Pierre Curie a partir de toneladas de pechblenda processadas manualmente em um galpão sem aquecimento em Paris. O nome vem do latim "radius" (raio), por sua intensa radiação. Marie demoraria mais quatro anos para purificar um decigrama de cloreto de rádio puro, trabalho que lhe rendeu o Prêmio Nobel de Química em 1911 (seu segundo Nobel, depois do de Física de 1903). A radioatividade do rádio é cerca de um milhão de vezes maior que a do urânio.',
    properties:
      'Metal prateado-branco, brilhante quando recém-cortado, mas escurece rapidamente ao ar formando nitreto. Densidade 5,5 g/cm³, funde a 700 °C. Todos os 33 isótopos conhecidos são radioativos — o Ra-226, mais comum, tem meia-vida de 1.600 anos. Emite radiação alfa, beta e gama. Em forma pura no escuro, emite uma luminescência azul-esverdeada visível a olho nu — não por fluorescência externa, mas pela própria radiação excitando o ar ao redor.',
    applications:
      'Praticamente todas as antigas aplicações foram descontinuadas. Era usado em tintas luminescentes para mostradores de relógios, instrumentos militares, mira de armas — substituído por trítio ou fósforos não-radioativos. Em medicina, fontes de rádio (braquiterapia) tratavam tumores — substituídas por iridium-192 e outros isótopos mais seguros. Resta apenas uso residual em pesquisa nuclear e como fonte de nêutrons em laboratórios (Ra-Be).',
    curiosity:
      'Nos anos 1920, fábricas como a U.S. Radium Corporation contratavam mulheres jovens para pintar mostradores de relógios com tinta de rádio. Para fazer pontas finas, as operárias "afilavam" os pincéis na boca — engolindo microgramas de rádio a cada dia. Quando começaram a morrer de câncer ósseo, anemia e necrose da mandíbula, a empresa negou responsabilidade. O caso "Radium Girls" foi marco histórico do direito trabalhista: cinco mulheres processaram a empresa em 1927 e venceram, estabelecendo precedentes que mudaram a regulação industrial nos EUA. Os corpos das vítimas, mesmo décadas após enterradas, ainda emitem radiação detectável.',
  },
  89: {
    overview:
      'Actínio é um metal radioativo prateado que dá nome a toda uma série de elementos da tabela periódica — os actinídeos, do Z 89 ao 103. Emite um brilho azul-celeste no escuro devido à sua intensa radiação alfa, e é cerca de 150 vezes mais radioativo que o rádio. Quase desconhecido fora da pesquisa nuclear, ganhou prominência recente em medicina: o Ac-225 é considerado um dos isótopos mais promissores para terapia direcionada por radiação alfa contra cânceres metastáticos.',
    history:
      'Descoberto em 1899 pelo químico francês André-Louis Debierne, colaborador dos Curie, em resíduos do processamento de pechblenda. Em 1902, o alemão Friedrich Oskar Giesel também isolou-o de forma independente. O nome vem do grego "aktinos" (raio), em referência à radiação emitida. Apesar da descoberta antiga, suas aplicações práticas só começaram a se desenvolver no final do século XX, quando técnicas de produção em aceleradores tornaram o Ac-225 acessível para pesquisa médica.',
    properties:
      'Metal prateado-branco, macio, denso (10,07 g/cm³), funde a 1.050 °C. Todos os 36 isótopos conhecidos são radioativos. O Ac-227 é o mais estável, com meia-vida de 21,77 anos; o Ac-225, usado em medicina, decai em 9,9 dias. A intensa radiação alfa do actínio puro excita o ar ao seu redor, gerando o brilho azul-celeste característico — fenômeno parecido com o do rádio mas ainda mais vívido. É extremamente raro: traços em minério de urânio (uns 0,2 microgramas por tonelada).',
    applications:
      'Terapia alfa direcionada com Ac-225 é a aplicação mais promissora: ligado a anticorpos ou peptídeos, leva partículas alfa de altíssima energia (curto alcance, cerca de 50 micrômetros) diretamente a células tumorais, destruindo-as sem afetar tecidos vizinhos. Ensaios clínicos em leucemia, próstata metastático e glioma têm mostrado resultados notáveis. Pequenas quantidades de Ac-227 servem como fonte de nêutrons em laboratórios de pesquisa (Ac-Be). Praticamente nenhum uso industrial.',
    curiosity:
      'A produção mundial de Ac-225 é uma das mais limitadas da medicina: cerca de 1,7 grama por ano em 2024, vinda principalmente do decaimento de tório-229 estocado nos EUA e Rússia desde a Guerra Fria. A demanda médica supera em muito a oferta — um ensaio clínico para câncer de próstata pode consumir miligramas, e cada paciente recebe quantidades em microgramas. Esforços para produzir Ac-225 em aceleradores comerciais estão crescendo, mas o gargalo é tão sério que oncologistas chamam o isótopo de "o ouro da medicina nuclear".',
  },
  90: {
    overview:
      'Tório é um metal radioativo prateado, mais abundante na crosta terrestre que o urânio (cerca de 3 a 4 vezes mais). Embora ainda não usado comercialmente como combustível nuclear, é considerado uma das alternativas mais promissoras para a próxima geração de reatores — mais seguro, mais difícil de transformar em armas, com menos resíduos de longa duração. Índia, China e EUA têm programas ativos de pesquisa em reatores de tório, e a Índia em particular tem reservas estratégicas que poderiam alimentar sua matriz elétrica por séculos.',
    history:
      'Descoberto em 1828 pelo químico sueco Jöns Jakob Berzelius em uma rocha enviada por um amigo da Noruega. Batizou-o em homenagem a Thor, o deus nórdico do trovão. Por décadas foi visto apenas como curiosidade científica, até que em 1885 Carl Auer von Welsbach inventou as camisas de gás luminescentes ("camisas Welsbach") impregnadas com dióxido de tório — que iluminavam ruas e casas do mundo todo até a chegada da lâmpada elétrica. A radioatividade do tório só foi reconhecida em 1898, por Marie Curie e Gerhard Schmidt independentemente.',
    properties:
      'Metal prateado-branco, macio, dúctil, densidade 11,72 g/cm³, funde a 1.750 °C. Tem isótopo natural praticamente único (Th-232, 100%), com meia-vida de 14 bilhões de anos — aproximadamente a idade do universo. Decai por uma cadeia de 10 etapas até virar Pb-208 estável. Em forma pura emite radiação alfa fraca; pode ser manuseado com luvas, mas pó de tório é inflamável e perigoso por inalação. Forma camada protetora de óxido em ar.',
    applications:
      'Combustível nuclear em reatores experimentais de sal fundido (LFTR) e em reatores de água pesada indianos — mais seguro, mais abundante, com resíduos de meia-vida mais curta que o ciclo de urânio. Liga magnésio-tório em componentes aeroespaciais leves e resistentes ao calor (largamente substituída por preocupações com radioatividade). Dióxido de tório (ThO₂) em camisas de iluminação a gás (uso doméstico extinto, ainda em alguns lampiões de camping). Catalisador em refino de petróleo. Eletrodos de soldagem TIG (sendo substituídos por alternativas com lantânio ou ítrio).',
    curiosity:
      'A Índia tem cerca de 25% das reservas mundiais de tório, concentradas em areias monazíticas das praias do estado de Kerala. Em 1954, o físico Homi Bhabha desenhou uma estratégia nuclear de três etapas para o país, culminando em reatores baseados em tório que aproveitariam essa abundância. Sete décadas depois, a Índia opera o único protótipo de reator comercial movido parcialmente a tório do mundo, o KAPS, e planeja escalonar tecnologias de tório até 2050 — visão de longo prazo rara na política energética global.',
  },
  91: {
    overview:
      'Protactínio é um dos elementos naturais mais raros e mais difíceis de estudar — produzido apenas em quantidades minúsculas como produto intermediário do decaimento de urânio em minérios. É radioativo, extremamente tóxico e caríssimo: extrair miligramas exige processar toneladas de minério. Apesar disso, foi crucial historicamente para datação radiométrica de sedimentos marinhos e para entender a estrutura da série dos actinídeos.',
    history:
      'A existência foi prevista por Mendeleev em sua tabela periódica de 1869, na lacuna entre tório e urânio. Isolado primeiro como Pa-234 em 1913 por Kasimir Fajans e Oswald Helmuth Göhring, que o chamaram "brevium" (curto, pela meia-vida de minutos). Em 1917-1918, Otto Hahn e Lise Meitner na Alemanha (e independentemente Frederick Soddy e John Cranston na Escócia) isolaram o isótopo mais longevo Pa-231, e propuseram o nome "protoactinium" (precursor do actínio), simplificado depois para protactínio. Em 1934, Aristid von Grosse produziu finalmente a primeira amostra de protactínio metálico puro — cerca de 2 miligramas.',
    properties:
      'Metal prateado-branco com brilho metálico, denso (15,37 g/cm³), funde a 1.568 °C. Todos os 29 isótopos conhecidos são radioativos. O Pa-231, mais estável, tem meia-vida de 32.760 anos; é alfa-emissor. Em forma pura é tão denso quanto chumbo e tem dureza comparável à do urânio. Em estado de oxidação +5 (mais comum) comporta-se quimicamente como o tântalo e o nióbio, vizinhos da família.',
    applications:
      'Nenhuma aplicação industrial significativa por causa da raridade extrema, custo (estimado em torno de US$ 280.000 por grama nas operações da década de 1960) e toxicidade radiológica severa. Em geofísica, a razão Pa-231/Th-230 em sedimentos marinhos foi usada para datar amostras de até 175.000 anos atrás, ajudando a reconstruir paleoclima e correntes oceânicas. Pesquisa básica em química dos actinídeos e em modelos nucleares.',
    curiosity:
      'Em 1961, o Reino Unido extraiu 125 gramas de protactínio-231 de 60 toneladas de resíduos da Atomic Energy Authority — esforço que custou 500.000 libras esterlinas (cerca de US$ 14 milhões em valores atuais). Foi a maior quantidade do elemento jamais reunida em um só lugar, e por décadas serviu como reserva mundial para todos os experimentos que precisavam de protactínio. A operação é frequentemente citada como exemplo do custo desproporcional de pesquisa em elementos rarissimos: muito investimento financeiro e radiológico para alguns experimentos básicos.',
  },
  92: {
    overview:
      'Urânio é o elemento natural mais pesado da Terra, prateado e fracamente radioativo. É a base da energia nuclear, das armas atômicas e da datação geológica. Apesar de associado a tragédias do século XX (Hiroshima, Chernobyl, Fukushima), também é a fonte de energia mais densa que humanos conseguem usar — um grama de urânio enriquecido contém a energia de uma tonelada de carvão.',
    history:
      'Descoberto em 1789 pelo químico alemão Martin Heinrich Klaproth, que o batizou em homenagem ao planeta Urano, descoberto oito anos antes. A radioatividade do urânio foi descoberta por acidente em 1896 por Henri Becquerel, abrindo o caminho para a física nuclear. A primeira reação em cadeia controlada aconteceu em Chicago em 1942 (Projeto Manhattan), levando às bombas de Hiroshima e Nagasaki e à era nuclear.',
    properties:
      'Metal denso (19,1 vezes a densidade da água, próximo do ouro), prateado quando recém-cortado, oxida rapidamente em ar. Tem três isótopos naturais: U-238 (99,27%, decaimento muito lento), U-235 (0,72%, fissionável em reatores) e U-234 (traços). Apenas o U-235 sustenta reações em cadeia, e enriquecê-lo é o maior obstáculo técnico para programas nucleares. Decai por uma cadeia de 14 etapas até virar chumbo estável.',
    applications:
      'Combustível em reatores nucleares produz cerca de 10% da eletricidade mundial — França, Coreia do Sul e Suécia dependem fortemente dele. Armas nucleares usam U-235 ou plutônio (derivado de U-238 em reatores). Urânio empobrecido (sem o U-235) é usado em projéteis perfurantes e contrapesos por sua altíssima densidade. A datação urânio-chumbo é o método mais preciso para datar rochas com bilhões de anos.',
    curiosity:
      'A "ilha de estabilidade" é uma região hipotética da tabela periódica com elementos superpesados (perto de Z=114) que seriam estáveis o suficiente para existir por anos. Até hoje só conseguimos criar átomos que duram milissegundos. Toda essa pesquisa começou com o urânio — o último elemento natural antes do reino dos elementos sintéticos que nasceram em aceleradores de partículas.',
  },
  93: {
    overview:
      'Netúnio é o primeiro elemento transurânico — sintetizado em 1940, marca o início da química dos elementos que não existem naturalmente em quantidades apreciáveis na Terra. Recebeu o nome de Netuno por seguir o urânio na tabela, da mesma forma que o planeta Netuno segue Urano no sistema solar. Tem importância prática limitada, mas é o precursor essencial para produzir plutônio em reatores nucleares.',
    history:
      'Sintetizado em 1940 por Edwin McMillan e Philip Abelson no Laboratório Nacional Lawrence Berkeley, ao bombardear urânio com nêutrons lentos. Foi a primeira confirmação inequívoca de que era possível criar elementos além do urânio. McMillan dividiu o Prêmio Nobel de Química de 1951 com Glenn Seaborg pela descoberta e pelo trabalho subsequente em transurânicos. Pequenas quantidades naturais foram detectadas depois em minérios de urânio, formadas por captura de nêutrons espontânea.',
    properties:
      'Metal prateado-prateado de aparência típica de actinídeo, denso (20,45 g/cm³, mais denso que urânio), funde a 644 °C. Todos os 20 isótopos conhecidos são radioativos — o Np-237 é o mais estável, com meia-vida de 2,14 milhões de anos. Tem cinco estados de oxidação possíveis (+3 a +7), o que o torna quimicamente versátil. Em reatores, o Np-237 absorve nêutrons e vira Pu-238, isótopo crítico para geradores termoelétricos espaciais.',
    applications:
      'Principal aplicação industrial: produção de Pu-238 para baterias nucleares (RTGs) usadas em sondas espaciais profundas. Em detectores de nêutrons especializados. Em pequenas quantidades, traçador de processos radioquímicos. Quase todo o netúnio do mundo é gerado como subproduto da produção de plutônio para armas e combustível nuclear — toneladas acumuladas em estoques de resíduos nucleares de longo prazo.',
    curiosity:
      'O Np-237 tem meia-vida de 2,14 milhões de anos — relativamente curta em termos geológicos, mas longa demais para ser tratada como resíduo descartável. Por gerar mais de 60 toneladas globalmente acumuladas em resíduos nucleares, é um dos principais "problemas" dos depósitos definitivos de lixo atômico como o Yucca Mountain. Algumas propostas sugerem "transmutar" o netúnio em reatores rápidos, convertendo-o em isótopos de meia-vida muito mais curta — encolhendo o problema de milhões para algumas centenas de anos.',
  },
  94: {
    overview:
      'Plutônio é o transurânico mais famoso da história — combustível das primeiras armas nucleares (a bomba "Fat Man" lançada sobre Nagasaki em 1945 era de plutônio) e fonte de energia de praticamente toda sonda espacial que sai do sistema solar interno. Tem química e metalurgia entre as mais bizarras conhecidas: seis fases alotrópicas em apenas 600 °C, expandindo e contraindo de modo imprevisível. É radioativo, tóxico, regulado militarmente — e ao mesmo tempo, sem ele a humanidade não teria saído de Júpiter.',
    history:
      'Sintetizado em 1940 por Glenn Seaborg, Arthur Wahl, Joseph Kennedy e Edwin McMillan em Berkeley, ao bombardear urânio com dêuterons em um cíclotron. A descoberta foi mantida em segredo militar até o fim da Segunda Guerra Mundial. Recebeu o nome do planeta Plutão, dando sequência à série Urano-Netuno-Plutão. Foi produzido em massa pela primeira vez no Hanford Site, Washington, durante o Projeto Manhattan, em reatores especialmente construídos para esse fim.',
    properties:
      'Metal prateado-cinza, denso (19,8 g/cm³ em sua fase principal), funde a 640 °C. Tem seis fases alotrópicas entre temperatura ambiente e o ponto de fusão — cada uma com densidade e estrutura cristalina diferentes — comportamento sem paralelo entre os metais. Pu-239 (meia-vida 24.100 anos) é fissionável e sustenta reações em cadeia com massa crítica de cerca de 10 kg. Pu-238 (meia-vida 88 anos) gera calor por decaimento alfa, suficiente para alimentar geradores termoelétricos.',
    applications:
      'Pu-239 em ogivas nucleares e como combustível em reatores rápidos e MOX (mistura óxido de Pu e U). Pu-238 em geradores termoelétricos de radioisótopo (RTGs) — alimenta sondas como Voyager 1 e 2, Cassini, New Horizons e os rovers Curiosity e Perseverance em Marte. Sem o calor decaído do Pu-238, essas missões não teriam energia para operar em regiões além de Júpiter, onde painéis solares são inviáveis.',
    curiosity:
      'A produção de Pu-238 nos EUA foi interrompida em 1988 após o fechamento do reator Savannah River, e por décadas a NASA dependeu de estoque herdado da Guerra Fria. Em 2013, o Departamento de Energia retomou produção em Oak Ridge — apenas 1,5 kg por ano, em rota lenta de recuperação. Cada rover marciano consome cerca de 4,8 kg, e a quantidade total disponível mundialmente determina literalmente quantas missões interplanetárias podem ser feitas por década. Plutônio é, talvez surpreendentemente, um gargalo da exploração espacial moderna.',
  },
  95: {
    overview:
      'Amerício é o transurânico mais comum no cotidiano — provavelmente há microgramas dele a poucos metros de você agora, dentro do detector de fumaça do teto. Sua radiação alfa ioniza o ar, e quando partículas de fumaça interrompem o fluxo de íons, o alarme dispara. É um dos raros casos em que um elemento sintetizado em laboratório virou commodity industrial barata, com bilhões de unidades produzidas anualmente para uma aplicação que salva vidas.',
    history:
      'Sintetizado em 1944 por Glenn Seaborg, Ralph James, Leon Morgan e Albert Ghiorso na Universidade de Chicago, como parte do Projeto Manhattan. O nome veio das Américas — Seaborg seguia uma lógica geográfica, batizando o vizinho európio (Z 63) como referência. Curiosamente, Seaborg "revelou" a descoberta em um programa de rádio infantil chamado "Quiz Kids" em 1945, dias antes da publicação científica formal — quando uma criança perguntou se havia elementos novos descobertos durante a guerra, ele simplesmente respondeu que sim.',
    properties:
      'Metal prateado-branco, denso (12 g/cm³), funde a 1.176 °C. Mais maleável que o urânio e o netúnio. Todos os isótopos são radioativos: o Am-241 (mais usado) tem meia-vida de 432,2 anos e emite alfa de média energia, ideal para ionização controlada. O Am-243 dura 7.370 anos e é importante em pesquisa nuclear. Em ar oxida lentamente, formando camada de óxido.',
    applications:
      'Detectores de fumaça residenciais por ionização: cerca de 0,2 microgramas de Am-241 por unidade — bilhões de detectores no mundo todo. Fontes para perfilagem geofísica em poços de petróleo e gás (medem densidade e umidade de rochas). Em medidores de espessura industriais (papel, plástico, metal). Pesquisa em transmutação de resíduos nucleares. Considerado como combustível alternativo para baterias de espaçonaves profundas, como substituto parcial do escasso Pu-238.',
    curiosity:
      'Em 2010, o adolescente sueco Hannes Vagn-Bonde de 31 anos tentou construir um reator nuclear caseiro em sua cozinha em Ängelholm, extraindo amerício de detectores de fumaça e rádio de relógios antigos. Quando a vizinhança notou material radioativo, a Polícia chamou a Autoridade Nuclear Sueca. Felizmente, ele não chegou nem perto da massa crítica, mas tornou-se um dos casos mais famosos de "experimentação nuclear amadora" — ressaltando, de modo perigoso, o quão acessível o amerício se tornou, e os limites éticos de DIY científico.',
  },
  96: {
    overview:
      'Cúrio é um actinídeo prateado que emite tanta radiação alfa que brilha de forma autônoma em vermelho-púrpura no escuro — fenômeno parecido com o do rádio, mas ainda mais intenso. Recebeu o nome em homenagem a Marie e Pierre Curie, e tem um papel discreto mas crucial na exploração de Marte: os rovers da NASA usam fontes de Cm-244 em espectrômetros para identificar a composição química das rochas marcianas, a milhões de quilômetros de qualquer laboratório terrestre.',
    history:
      'Descoberto em 1944 por Glenn Seaborg, Ralph James e Albert Ghiorso em Berkeley, simultaneamente ao amerício, durante o Projeto Manhattan. Foi o terceiro transurânico identificado. O nome homenageia o casal Curie, pioneiros da radioatividade — uma das poucas vezes em que duas pessoas (homem e mulher) deram nome a um elemento. A descoberta ficou em segredo militar até 1945, e foi anunciada publicamente em 11 de novembro daquele ano por Seaborg em um programa de rádio infantil.',
    properties:
      'Metal prateado-branco, denso (13,52 g/cm³), funde a 1.345 °C. Magnético e bastante reativo — oxida em ar formando óxido amarelo. Todos os 19 isótopos conhecidos são radioativos. O Cm-244 (meia-vida 18,1 anos) é mais usado em aplicações; o Cm-247 (15,6 milhões de anos) é o mais estável. Pu-244 pode acumular calor suficiente para se fundir parcialmente sem fonte externa. Em forma pura emite radiação alfa tão intensa que o material se aquece a centenas de graus.',
    applications:
      'Cm-244 em espectrômetros APXS (Alpha Particle X-ray Spectrometer) embarcados nos rovers marcianos Sojourner, Spirit, Opportunity, Curiosity e Perseverance — bombardeia rochas com partículas alfa e mede raios-X de retorno para identificar elementos. Fontes de calor compactas para missões espaciais de longa duração. Pequenas quantidades em produção de outros transurânicos pesados em reatores. Pesquisa fundamental em química e física dos actinídeos.',
    curiosity:
      'O espectrômetro APXS, do tamanho de uma lata de refrigerante, contém apenas alguns gramas de Cm-244 — mas é a "ferramenta de laboratório" que permitiu identificar minerais como hematita, jarosita e argilas em Marte, ajudando a confirmar que a superfície marciana já teve água líquida em abundância. Cada análise leva poucas horas, e o rover encosta o instrumento contra a rocha como um geólogo encostando uma lupa. Sem cúrio, grande parte do que sabemos sobre a geoquímica de Marte teria ficado fora de alcance.',
  },
  97: {
    overview:
      'Berquélio é um actinídeo sintético raríssimo, produzido em quantidades de miligramas por ano em todo o mundo. Seu papel mais importante na ciência é servir como "matéria-prima" para criar elementos ainda mais pesados: foi a partir de alvos de berquélio bombardeados com cálcio que se sintetizou o tennessínio (Z 117) em 2010. Foi batizado em homenagem à cidade californiana de Berkeley, sede do laboratório onde tantos transurânicos foram descobertos.',
    history:
      'Sintetizado em 1949 por Stanley Thompson, Albert Ghiorso e Glenn Seaborg em Berkeley, bombardeando amerício-241 com partículas alfa em um cíclotron. Foi o quinto transurânico descoberto. Ghiorso e Seaborg estabeleceram a tradição de batizar elementos em homenagem aos laboratórios onde eram criados — daí berquélio (Berkeley), californio (Califórnia) e mais tarde dúbnio (Dubna, Rússia) seguiram o padrão.',
    properties:
      'Metal prateado-prateado (suposto, baseado em propriedades químicas), denso (cerca de 14,78 g/cm³), funde provavelmente em torno de 986 °C. Todos os 11 isótopos conhecidos são radioativos. O Bk-247 é o mais estável (meia-vida 1.380 anos), enquanto o Bk-249 (meia-vida 330 dias) é o mais usado em pesquisa por sua disponibilidade. Comportamento químico típico de actinídeo: estados +3 e +4 estáveis.',
    applications:
      'Praticamente nenhuma aplicação prática fora da pesquisa: produção tão limitada e custo tão alto que só faz sentido como alvo para síntese de elementos mais pesados. O Bk-249 foi crucial na descoberta do tennessínio (Z 117) em 2010, em colaboração entre Oak Ridge (EUA) e Dubna (Rússia): 22 mg de berquélio foram enviados aos russos para serem bombardeados com íons de cálcio-48. O envio internacional de material radioativo restrito por décadas envolveu logística diplomática complexa.',
    curiosity:
      'A produção anual mundial de berquélio é de aproximadamente 1 grama, vinda exclusivamente do reator HFIR em Oak Ridge, Tennessee, EUA. Para criar os 22 miligramas usados na descoberta do tennessínio, foram necessários cerca de dois anos de operação contínua do reator. Esse pequeno lote viajou de avião comercial dos EUA para a Rússia em meados dos anos 2000, embalado em containers blindados — talvez a viagem mais cara já feita por um pouco mais de meia colher de chá de qualquer substância na história da química.',
  },
  98: {
    overview:
      'Califórnio é um actinídeo sintético notável por uma propriedade rara: seu isótopo Cf-252 emite nêutrons espontaneamente em quantidade impressionante — cerca de 170 milhões por microgramas por minuto. Isso o torna uma fonte portátil de nêutrons sem precisar de reator, usada em prospecção mineral, análise de cargas em portos, calibração de detectores e radioterapia de tumores resistentes. É também uma das substâncias mais caras do planeta: cerca de US$ 27 milhões por grama.',
    history:
      'Sintetizado em 1950 por Stanley Thompson, Kenneth Street, Albert Ghiorso e Glenn Seaborg em Berkeley, bombardeando cúrio com partículas alfa. Foi o sexto transurânico identificado. Como o berquélio, recebeu nome geográfico — Califórnia — homenageando o estado e a universidade que sediavam o laboratório. A produção comercial começou em Oak Ridge na década de 1960, em quantidades de microgramas a alguns miligramas por ano.',
    properties:
      'Metal prateado-cinza presumido, denso (15,1 g/cm³), funde a 900 °C. Todos os 20 isótopos conhecidos são radioativos. O Cf-251 é o mais estável (meia-vida 898 anos), mas o Cf-252 (meia-vida 2,645 anos) é o que tem aplicações práticas — emite cerca de 3 nêutrons por fissão espontânea. Um grama de Cf-252 emite tantos nêutrons quanto vários reatores de pesquisa, em formato de pó portátil.',
    applications:
      'Fonte de nêutrons em escaneamento de cargas em portos para detectar materiais nucleares ilícitos. Perfilagem geofísica em poços de petróleo para medir teor de hidrogênio e oxigênio nas rochas. Radioterapia de braquiterapia interna para tumores cerebrais e cervicais resistentes a fontes convencionais. Calibração de detectores de nêutrons em laboratórios. Iniciador de partida em reatores nucleares para gerar a primeira "explosão" de nêutrons que sustenta a reação em cadeia.',
    curiosity:
      'A produção mundial de Cf-252 é de cerca de 250 miligramas por ano — quase tudo no reator HFIR em Oak Ridge, e em pequena quantidade em Dimitrovgrad, Rússia. Por causa do preço astronômico (US$ 27 milhões/grama) e da utilidade industrial, fontes de Cf-252 são rastreadas individualmente pela Agência Internacional de Energia Atômica. Cada cápsula contém alguns microgramas e é catalogada da fábrica ao usuário e à devolução para reciclagem — sistema mais rígido que o de qualquer outra substância industrial no mundo.',
  },
  99: {
    overview:
      'Einstênio é um actinídeo sintético descoberto em circunstâncias dramáticas: foi encontrado nos detritos da primeira detonação de bomba de hidrogênio, "Ivy Mike", no Atol de Enewetak em 1952. O teste de termofusão produziu condições tão extremas que átomos de urânio capturaram dezenas de nêutrons em frações de segundo, criando elementos transurânicos pesados inéditos. Foi batizado em homenagem a Albert Einstein, falecido apenas um mês antes do anúncio público da descoberta em 1955.',
    history:
      'Identificado em 1952 por Albert Ghiorso e colaboradores no Lawrence Livermore Laboratory, ao analisar corais e poeira coletados dos detritos da explosão de Ivy Mike — primeiro teste termonuclear da história. A descoberta foi mantida em segredo militar durante três anos. Apenas em 1955 o trabalho foi publicado, com o nome em homenagem a Einstein. Curiosamente, métodos posteriores em reatores conseguiram reproduzir a síntese do einstênio em quantidades um pouco maiores, mas sempre na faixa de nanogramas a microgramas.',
    properties:
      'Metal prateado-prateado presumido (algumas propriedades extrapoladas), denso (8,84 g/cm³), funde a 860 °C. Todos os 19 isótopos conhecidos são radioativos. O Es-252 é o mais estável (meia-vida 471,7 dias) — incomum entre os actinídeos pesados, onde meia-vidas mais longas costumam ser raras. Emite radiação alfa intensa: amostras macroscópicas seriam autoaquecidas a centenas de graus e brilhariam por radioluminescência.',
    applications:
      'Praticamente nenhuma aplicação prática — a quantidade total já produzida na história é de poucos miligramas, e a meia-vida curta limita usos. Em 2021, cientistas do Berkeley Lab realizaram a primeira caracterização química detalhada do einstênio (estudos espectroscópicos com 233 nanogramas de Es-254) — quase 70 anos após a descoberta. O trabalho ajudou a entender as ligações químicas em actinídeos pesados, com implicações para tratamento de resíduos nucleares.',
    curiosity:
      'A história da descoberta do einstênio só pôde ser publicada após o fim do sigilo do programa termonuclear americano. Curiosamente, Albert Einstein — pacifista convicto e crítico da corrida nuclear — foi homenageado com um elemento descoberto no que foi, à época, a explosão mais devastadora já provocada por humanos. Einstein morreu em abril de 1955, antes do anúncio oficial, e provavelmente nunca soube que um elemento da tabela periódica tinha sido batizado em sua honra a partir dos restos de uma bomba H.',
  },
  100: {
    overview:
      'Férmio é o último elemento que pode ser produzido em quantidades macroscópicas (mesmo que ainda em nanogramas) por bombardeio de nêutrons em reatores nucleares — todos os elementos mais pesados precisam ser sintetizados átomo por átomo em aceleradores de partículas. Esse limite físico marca um ponto de transição na química dos elementos: o fim da era em que humanos podiam "fazer" matéria nova em quantidade pesável. Foi descoberto, junto com o einstênio, nos detritos da primeira bomba H em 1952.',
    history:
      'Identificado em 1952 por Albert Ghiorso e colaboradores em amostras de detritos da explosão de Ivy Mike no Atol de Enewetak, simultaneamente à descoberta do einstênio. A descoberta ficou em segredo militar até 1955. O nome homenageia Enrico Fermi, físico ítalo-americano que construiu o primeiro reator nuclear (Chicago Pile-1, 1942) e teve papel central no Projeto Manhattan. Fermi morreu em novembro de 1954, antes da publicação científica formal do elemento.',
    properties:
      'Metal prateado presumido (nunca observado em quantidade visível), com propriedades estimadas a partir de poucos átomos. Todos os 20 isótopos conhecidos são radioativos. O Fm-257 é o mais estável (meia-vida 100,5 dias). É o último actinídeo que pode ser produzido por captura sucessiva de nêutrons; daí em diante, a probabilidade de produzir núcleos mais pesados por essa via cai a praticamente zero, criando uma "barreira do férmio".',
    applications:
      'Nenhuma aplicação prática: produção limitada a poucos picogramas em reatores nucleares dedicados, e meia-vida curta demais para qualquer uso industrial. Toda sua existência é justificada por pesquisa básica em estrutura nuclear e química dos actinídeos pesados. Em reatores de alto fluxo de nêutrons como o HFIR, érmio aparece como produto residual da produção de californio e einstênio.',
    curiosity:
      'A "barreira do férmio" é um obstáculo físico interessante: a partir do férmio, capturas sucessivas de nêutrons em reatores não geram elementos mais pesados — em vez disso, levam a isótopos que sofrem fissão espontânea muito rápido, fragmentando-se de volta a elementos mais leves. Por isso, para criar mendelévio (Z 101) em diante, físicos precisam usar fusão direta de núcleos pesados em aceleradores de partículas — um processo que produz átomos individuais, não miligramas. O férmio é, em sentido literal, o último elemento "fabricável" da tabela.',
  },
  101: {
    overview:
      'Mendelévio é um transurânico sintético, batizado em homenagem a Dmitri Mendeleev, autor da tabela periódica moderna. Foi o primeiro elemento da história produzido literalmente um átomo de cada vez — uma técnica revolucionária na década de 1950 que abriu caminho para a era dos elementos superpesados. Não tem aplicação prática, mas sua descoberta foi um marco metodológico, demonstrando que a química podia ser feita em escala atômica individual.',
    history:
      'Sintetizado em 1955 por Albert Ghiorso, Bernard Harvey, Greg Choppin, Stanley Thompson e Glenn Seaborg em Berkeley, ao bombardear um alvo de einstênio-253 (apenas 1 bilhão de átomos disponíveis) com partículas alfa em um cíclotron. Foram identificados apenas 17 átomos em três experimentos. A escolha do nome, em plena Guerra Fria, foi politicamente carregada: homenagear um cientista soviético em um elemento americano. O comitê internacional aprovou — Mendeleev era símbolo universal da química.',
    properties:
      'Não há quantidade macroscópica observável — todas as propriedades são extrapoladas de medições com poucos átomos isolados. Estima-se densidade em torno de 10,3 g/cm³, ponto de fusão de 827 °C. Todos os 17 isótopos conhecidos são radioativos. O Md-258 é o mais estável (meia-vida 51,5 dias). Curiosamente, o Md exibe estado de oxidação +2 estável em solução — incomum entre actinídeos, que geralmente preferem +3.',
    applications:
      'Nenhuma aplicação prática: produção total na história inteira somando todos os experimentos é de talvez algumas centenas de milhares de átomos — quantidade que não pesa nem em balanças de nanograma. Toda existência do mendelévio é em pesquisa fundamental sobre estrutura eletrônica de actinídeos pesados e métodos de detecção atômica individual.',
    curiosity:
      'A técnica "um átomo de cada vez" desenvolvida por Ghiorso e Seaborg para identificar mendelévio se tornou o padrão para todos os elementos superpesados subsequentes. Em vez de tentar acumular massa visível, os pesquisadores configuram câmaras de detecção que reconhecem o decaimento radioativo único de cada átomo individual milissegundos depois de produzido. Cada "descoberta" de um novo elemento desde 1955 baseou-se em algumas dezenas de átomos no máximo — uma das poucas áreas da ciência em que se pode publicar com base em uma amostra estatística menor que vinte.',
  },
  102: {
    overview:
      'Nobélio é um transurânico sintético com história de descoberta polêmica: três grupos diferentes — sueco, americano e soviético — reivindicaram tê-lo sintetizado pela primeira vez no final da década de 1950. Após anos de disputas internacionais, o crédito final foi atribuído ao grupo soviético em Dubna, mas o nome proposto pelos suecos — em homenagem a Alfred Nobel — foi mantido. Tem propriedade química incomum: prefere o estado de oxidação +2, ao contrário do +3 padrão dos actinídeos.',
    history:
      'Em 1957, pesquisadores do Instituto Nobel de Física em Estocolmo anunciaram tê-lo sintetizado, mas o resultado não foi reproduzível. Em 1958, o grupo de Berkeley confirmou a síntese de um isótopo diferente. Em 1966, o Instituto de Dubna (URSS) finalmente produziu o isótopo cuja existência ficou definitivamente estabelecida. A IUPAC, em decisão polêmica de 1997, atribuiu a descoberta a Dubna mas manteve o nome "nobelium" cunhado pelos suecos — caso raro em que o descobridor não dá o nome.',
    properties:
      'Não observado em quantidade macroscópica — propriedades extrapoladas. Estima-se densidade próxima a 9,9 g/cm³, ponto de fusão em torno de 827 °C. Todos os 18 isótopos conhecidos são radioativos. O No-259 é o mais estável (meia-vida 58 minutos). Caracteristicamente, em soluções aquosas existe predominantemente como No²⁺ — comportamento que o aproxima quimicamente do bário e do rádio, em vez dos actinídeos vizinhos.',
    applications:
      'Nenhuma aplicação prática conhecida. Produção limitada a alguns átomos por experimento em aceleradores especializados. Uso restrito a pesquisa fundamental em química de actinídeos pesados, métodos de produção de elementos superpesados, e estudos de simetria nuclear.',
    curiosity:
      'A controvérsia da descoberta de nobélio (e de outros transurânicos como rutherfórdio, dúbnio, seabórgio) durou décadas e ficou conhecida como "Transfermium Wars" — disputa Guerra Fria entre laboratórios americanos (Berkeley, Livermore), soviéticos (Dubna) e alemães (GSI Darmstadt) sobre quem tinha direito de batizar elementos. A IUPAC só conseguiu resolver definitivamente todos os nomes em 1997, depois de comitês internacionais e múltiplas votações. Foi a maior disputa de nomenclatura científica do século XX.',
  },
  103: {
    overview:
      'Laurêncio é o último elemento da série dos actinídeos e o último da tabela periódica antes do início da série dos transactinídeos (superpesados). Recebeu o nome em homenagem a Ernest Lawrence, físico americano inventor do cíclotron — a máquina que tornou possível a síntese de praticamente todos os transurânicos. Marca, simbolicamente, o fim da era dos actinídeos e o começo da exploração de elementos com configurações eletrônicas inéditas.',
    history:
      'Sintetizado em 1961 por Albert Ghiorso e colaboradores em Berkeley, bombardeando um alvo de californio com íons de boro em um cíclotron pesado. Os pesquisadores propuseram o nome "lawrencium" em homenagem a Ernest Lawrence, fundador do laboratório de Berkeley e morto cinco anos antes. O grupo de Dubna, em 1965, contestou a precedência e propôs o nome "rutherfordium". A IUPAC decidiu em 1997: laurêncio para Z 103, rutherfórdio para Z 104 — solomônica solução para a Transfermium War.',
    properties:
      'Não observado em quantidade macroscópica. Estima-se densidade em torno de 15,6 g/cm³, ponto de fusão de 1.627 °C. Todos os 13 isótopos conhecidos são radioativos. O Lr-266 é o mais estável (meia-vida cerca de 11 horas). É o elemento que fecha a configuração eletrônica 5f¹⁴ típica dos actinídeos — daí o consenso de que pertence à série, apesar de algumas propriedades químicas o aproximarem mais do grupo 3 (escândio, ítrio, lutécio).',
    applications:
      'Nenhuma aplicação prática. Produção limitada a alguns átomos por experimento. Toda a relevância de laurêncio é teórica e fundamental: serve para refinar modelos de estrutura eletrônica em elementos pesados, onde efeitos relativísticos (os elétrons internos se movem a frações da velocidade da luz) começam a distorcer o comportamento previsto pela tabela periódica clássica.',
    curiosity:
      'Em 2015, físicos japoneses do RIKEN mediram pela primeira vez a energia de ionização do laurêncio — um experimento de altíssima dificuldade técnica feito com poucas dezenas de átomos. O resultado foi surpreendente: o valor (4,96 eV) era o menor de toda a série dos actinídeos, sugerindo que o elétron mais externo do laurêncio é menos ligado ao núcleo do que se esperava. Esse dado experimental reacendeu o debate sobre se laurêncio "realmente" pertence aos actinídeos ou se deveria ser realocado como primeiro membro de uma nova categoria — um dos poucos casos em que medições atômicas individuais influenciam a estrutura da tabela periódica.',
  },
  104: {
    overview:
      'Rutherfórdio é o primeiro elemento transactinídeo — abre a "era dos superpesados", região da tabela periódica onde os átomos são tão massivos que efeitos relativísticos começam a dominar a química. Foi também o estopim da "Transfermium War" entre EUA e URSS: dois grupos reivindicaram a descoberta, com nomes diferentes, em meio à Guerra Fria. O nome atual homenageia Ernest Rutherford, físico neozelandês cuja experiência da folha de ouro revelou a existência do núcleo atômico.',
    history:
      'Sintetizado pela primeira vez em 1964 no Instituto Unificado de Pesquisa Nuclear em Dubna (URSS) pelo grupo de Georgy Flerov, bombardeando plutônio com íons de neônio. Em 1969, o grupo de Albert Ghiorso em Berkeley reivindicou a descoberta independente. Os russos propuseram "kurchatovium" (em homenagem a Igor Kurchatov, pai do programa nuclear soviético); os americanos propuseram "rutherfordium". A disputa foi arbitrada apenas em 1997 pela IUPAC, que adotou o nome americano e o símbolo Rf.',
    properties:
      'Não há quantidade observável macroscopicamente. Estima-se densidade em torno de 23,2 g/cm³, ponto de fusão de 2.100 °C. Todos os 16 isótopos conhecidos são radioativos. O Rf-267 é o mais estável (meia-vida cerca de 1,3 hora). Experimentos químicos com pouquíssimos átomos confirmam comportamento semelhante ao do háfnio (elemento do grupo 4, logo acima na tabela): forma cloretos voláteis e estados +4 estáveis.',
    applications:
      'Nenhuma aplicação prática. Produzido apenas em quantidades de átomos individuais para pesquisa em química de transactinídeos e estudo de efeitos relativísticos em elementos pesados. Cada experimento exige semanas de operação contínua de aceleradores de íons pesados para gerar algumas dezenas de átomos.',
    curiosity:
      'O experimento mais famoso de Rutherford — em 1909, bombardear uma folha fina de ouro com partículas alfa — revelou que átomos têm núcleo denso cercado por espaço vazio. Cem anos depois, físicos usam exatamente a mesma técnica (com aceleradores muito mais poderosos) para sintetizar elementos que homenageiam o próprio Rutherford. O rutherfórdio é um exemplo perfeito da circularidade da ciência: criado por bombardeio nuclear, batizado em homenagem a quem inventou esse tipo de experimento.',
  },
  105: {
    overview:
      'Dúbnio é um superpesado sintético que carrega o nome do laboratório russo onde foi descoberto: o Instituto Unificado de Pesquisa Nuclear em Dubna, perto de Moscou. Junto com o rutherfórdio, foi pivô da disputa Guerra Fria sobre quem batizaria os elementos transférmicos. O acordo final da IUPAC, em 1997, equilibrou egos científicos: rutherfórdio para os americanos, dúbnio para os russos, seabórgio para o cientista vivo mais influente da síntese de transurânicos.',
    history:
      'Sintetizado pela primeira vez em 1968 em Dubna por Georgy Flerov, bombardeando amerício-243 com íons de neônio. Em 1970, o grupo de Berkeley confirmou a síntese de um isótopo diferente, e reivindicou o nome "hahnium" em homenagem a Otto Hahn (descobridor da fissão). Após décadas de disputa, a IUPAC adotou "dúbnio" em 1997 — reconhecimento ao laboratório soviético que sozinho descobriu seis dos transactinídeos da primeira década.',
    properties:
      'Sem observação macroscópica. Densidade estimada em 29,3 g/cm³ (um dos elementos mais densos teoricamente), ponto de fusão em torno de 1.477 °C. Todos os 15 isótopos conhecidos são radioativos. O Db-268 é o mais estável (meia-vida cerca de 28 horas). Experimentos químicos sugerem comportamento similar ao tântalo (grupo 5): forma haletos voláteis, estado +5 dominante.',
    applications:
      'Nenhuma aplicação prática. Pesquisa exclusiva em química de transactinídeos. O Instituto de Dubna mantém produção regular do elemento para experimentos comparativos com nióbio e tântalo, testando se as tendências periódicas se mantêm em massas tão grandes.',
    curiosity:
      'O laboratório de Dubna, fundado em 1956 sob direção soviética, foi por décadas o principal rival de Berkeley na corrida pelos transurânicos. Sob liderança de Georgy Flerov e depois Yuri Oganessian, o instituto descobriu ou co-descobriu nada menos que 9 dos 15 elementos superpesados (Z 104–118). Em 2017, Oganessian se tornou apenas a segunda pessoa viva a ter um elemento (Z 118) batizado em sua honra — depois apenas de Seaborg. A "Dubna soviética" foi, sem competição, o laboratório mais produtivo da história em descoberta de elementos novos.',
  },
  106: {
    overview:
      'Seabórgio é um elemento sintético cujo nome carrega controvérsia histórica: ao ser proposto em 1994 em homenagem a Glenn Seaborg — químico americano que dirigiu a descoberta de 9 transurânicos —, marcou a primeira vez que um elemento receberia o nome de uma pessoa viva. A IUPAC inicialmente resistiu, mas após anos de debate aprovou o nome em 1997, três anos antes da morte de Seaborg. Tornou-se símbolo do reconhecimento em vida de um dos mais importantes químicos do século XX.',
    history:
      'Sintetizado em 1974 simultaneamente por grupos de Berkeley/Livermore (EUA) e Dubna (URSS). Os americanos bombardearam califórnio-249 com íons de oxigênio-18, e os russos usaram chumbo-208 com cromo-54. Após confirmação cruzada, a IUPAC reconheceu a descoberta como conjunta. A escolha do nome em homenagem a um cientista vivo foi sem precedentes — o próprio Seaborg participou de uma cerimônia onde "atualizaram" a tabela periódica em sua presença, dizendo que era "a coisa mais legal que já aconteceu comigo, melhor que ganhar o Nobel".',
    properties:
      'Sem observação macroscópica. Densidade estimada em 35,0 g/cm³ (provavelmente o elemento mais denso da tabela), ponto de fusão estimado em 1.927 °C. Todos os 12 isótopos conhecidos são radioativos. O Sg-269 é o mais estável (meia-vida cerca de 14 minutos). Experimentos químicos com poucos átomos confirmam comportamento semelhante ao tungstênio (grupo 6): forma oxicloretos voláteis com estado de oxidação +6.',
    applications:
      'Nenhuma aplicação prática. Pesquisa em química de elementos superpesados e estudo de efeitos relativísticos no comportamento periódico. Os experimentos químicos com seabórgio foram um marco metodológico: demonstraram que era possível fazer "química" com elementos cuja meia-vida é de poucos minutos e quantidade total é de alguns átomos.',
    curiosity:
      'Glenn Seaborg foi um dos cientistas mais condecorados do século XX: Prêmio Nobel de Química em 1951, dirigiu a Comissão de Energia Atômica dos EUA sob 10 presidentes, e supervisionou a descoberta de plutônio, amerício, cúrio, berquélio, califórnio, einstênio, férmio, mendelévio e nobélio. Quando o seabórgio recebeu seu nome em 1997, Seaborg brincou: "agora posso dizer que tem cinco elementos da tabela periódica em meu endereço residencial — vivo na Berkeley (Bk), Califórnia (Cf), na América (Am), perto do oceano (Pacífico, com európio Eu por engano), e meu nome é Seaborg (Sg)". Morreu dois anos depois, em 1999.',
  },
  107: {
    overview:
      'Bóhrio é um superpesado sintético batizado em homenagem ao físico dinamarquês Niels Bohr — pai do modelo atômico moderno, criador da teoria quântica primitiva, e líder espiritual da geração que construiu a física do século XX. Foi sintetizado em 1981 no laboratório alemão GSI Darmstadt, marcando o início de uma sequência de descobertas alemãs que dariam ao instituto seis elementos na tabela periódica.',
    history:
      'Sintetizado em 1981 por Peter Armbruster e Gottfried Münzenberg no Centro de Pesquisa de Íons Pesados GSI em Darmstadt, Alemanha, bombardeando bismuto-209 com íons de cromo-54. O nome proposto foi "nielsbohrium", depois simplificado para "bohrium" pela IUPAC em 1997. Apenas seis átomos foram observados no experimento original — quantidade típica para a era dos superpesados sintetizados por "fusão fria".',
    properties:
      'Sem observação macroscópica. Densidade estimada em 37,1 g/cm³, ponto de fusão provavelmente acima de 2.500 °C. Todos os 12 isótopos conhecidos são radioativos. O Bh-270 é o mais estável (meia-vida cerca de 1 minuto, exceptional para um superpesado). Experimentos químicos em 2000 mostraram que bóhrio se comporta como o rênio (grupo 7), formando oxicloretos voláteis — confirmando que a tabela periódica clássica ainda prediz tendências em elementos sintetizados com tantos prótons.',
    applications:
      'Nenhuma aplicação prática. Pesquisa fundamental em química e estabilidade nuclear de elementos superpesados. O grupo do GSI continuou produzindo bóhrio em experimentos posteriores para testar propriedades e procurar isótopos com meia-vida mais longa.',
    curiosity:
      'Niels Bohr foi figura central não apenas da física, mas da história moral do século XX: fugiu da Dinamarca ocupada pelos nazistas em 1943, ajudou cientistas judeus, trabalhou no Projeto Manhattan, e depois da guerra usou seu prestígio para defender abertura e controle internacional de armas nucleares. O elemento bóhrio é o único superpesado batizado em homenagem a um cientista cuja obra abrange tanto a física pura quanto a ética da ciência — uma escolha de nome com peso simbólico maior do que se imagina à primeira vista.',
  },
  108: {
    overview:
      'Hássio é um superpesado sintético batizado a partir do nome em latim do estado alemão de Hessen (Hassia) — onde se localiza o instituto GSI Darmstadt que o sintetizou em 1984. É um dos transactinídeos mais bem estudados quimicamente: experimentos confirmaram que se comporta como o ósmio, seu vizinho do grupo 8, validando previsões da tabela periódica em massas extremas.',
    history:
      'Sintetizado em 1984 por Peter Armbruster, Gottfried Münzenberg e colaboradores no GSI Darmstadt, bombardeando chumbo-208 com íons de ferro-58. Apenas três átomos foram detectados no experimento original. A escolha do nome — Hessen, estado onde fica Darmstadt — gerou debate na IUPAC, mas foi aprovada em 1997. O símbolo Hs é uma abreviação para "Hassia", forma latina do nome germânico.',
    properties:
      'Sem observação macroscópica. Densidade estimada em 41,0 g/cm³ (talvez o elemento mais denso da tabela, superando até o seabórgio nas previsões mais recentes). Ponto de fusão estimado acima de 100 °C. Todos os 15 isótopos conhecidos são radioativos. O Hs-269 é o mais estável (meia-vida cerca de 10 segundos). Experimentos em 2001-2002 confirmaram quimicamente que forma um tetróxido HsO₄ volátil — análogo direto do OsO₄ usado em microscopia.',
    applications:
      'Nenhuma aplicação prática. Pesquisa fundamental: o experimento que confirmou HsO₄ foi um dos marcos metodológicos da química de superpesados — demonstrou que era possível observar reações químicas específicas com apenas seis átomos do elemento durante poucos segundos cada.',
    curiosity:
      'O experimento de 2001-2002 que confirmou a química de hássio é tecnicamente uma proeza fascinante: pesquisadores no GSI sintetizavam átomos de hássio um a um, deixavam reagir com oxigênio para formar HsO₄ (tetróxido volátil), e usavam essa volatilidade para "depositar" os átomos em uma série de detectores resfriados em temperaturas progressivamente menores — exatamente como o ósmio se comporta. Cada átomo detectado representava uma confirmação independente de que a química periódica funciona até Z=108. A precisão atingida foi notável: alguns átomos, cada um pesando 4,5 × 10⁻²² gramas, geraram dados publicáveis em revistas científicas de alto impacto.',
  },
  109: {
    overview:
      'Meitnério é um superpesado sintético batizado em homenagem à física austríaca Lise Meitner — uma das principais responsáveis pela descoberta da fissão nuclear em 1938, mas que foi excluída do Prêmio Nobel de Química de 1944, recebido apenas por seu colaborador Otto Hahn. O nome do elemento é um reconhecimento póstumo: tentativa tardia da comunidade científica de corrigir uma das mais conhecidas injustiças da história dos prêmios Nobel.',
    history:
      'Sintetizado em 1982 por Peter Armbruster, Gottfried Münzenberg e colaboradores no GSI Darmstadt, ao bombardear bismuto-209 com íons de ferro-58. Apenas um único átomo foi observado no experimento original — exemplo extremo de "descoberta com amostra de tamanho um". O nome "meitnerium" foi proposto pelos próprios descobridores e ratificado pela IUPAC em 1997, junto com bóhrio, hássio e outros.',
    properties:
      'Sem observação macroscópica. Densidade estimada em 37,4 g/cm³, ponto de fusão acima de 1.700 °C. Todos os 8 isótopos conhecidos são radioativos. O Mt-278 é o mais estável (meia-vida cerca de 7 segundos). Por analogia com o irídio (grupo 9, vizinho periódico), espera-se comportamento químico de metal nobre. Nenhum experimento químico definitivo foi feito ainda.',
    applications:
      'Nenhuma aplicação prática. Pesquisa fundamental sobre estabilidade nuclear de elementos superpesados.',
    curiosity:
      'Lise Meitner foi uma das primeiras mulheres a obter doutorado em física na Áustria (1906) e a primeira professora plena de física na Alemanha (1926). Em 1938, calculou junto com Otto Frisch que o núcleo de urânio bombardeado por nêutrons se fragmentava — interpretação que ela batizou de "fissão". Quando o Nobel foi concedido em 1944 apenas a Otto Hahn (seu colega de laboratório que tinha conduzido o experimento), o erro chocou a comunidade científica e nunca foi corrigido. Meitner morreu em 1968 sem o prêmio. O elemento meitnerium, batizado em 1997, é uma homenagem incômoda, lembrança permanente de que o Nobel também erra.',
  },
  110: {
    overview:
      'Darmstádio é um superpesado sintético cujo nome homenageia a cidade alemã de Darmstadt, sede do instituto GSI onde foi descoberto em 1994. É um dos seis elementos da tabela periódica batizados em homenagem à cidade ou laboratório de descoberta — junto com berquélio, califórnio, dúbnio, livermório e hássio (esse último indiretamente). Junto com o roentgênio e o copernício, abriu a sequência alemã de elementos descobertos via "fusão fria".',
    history:
      'Sintetizado em novembro de 1994 por Sigurd Hofmann e colaboradores no GSI Darmstadt, ao bombardear chumbo-208 com íons de níquel-62. Apenas três átomos foram observados no experimento original. O nome "darmstadtium" foi escolhido pelos descobridores e ratificado pela IUPAC em 2003. Outros nomes propostos durante o processo incluíam "wixhausium" (Wixhausen, distrito de Darmstadt) e "policium" (em homenagem a 110, número de emergência policial na Alemanha).',
    properties:
      'Sem observação macroscópica. Densidade estimada em 34,8 g/cm³, ponto de fusão acima de 1.500 °C. Todos os 11 isótopos conhecidos são radioativos. O Ds-281 é o mais estável (meia-vida cerca de 13 segundos). Por analogia com a platina (grupo 10), espera-se comportamento químico de metal nobre — mas experimentos com darmstádio ainda não foram conclusivos por causa da meia-vida curta.',
    applications:
      'Nenhuma aplicação prática. Pesquisa fundamental.',
    curiosity:
      'Os pesquisadores do GSI brincaram durante anos com o nome alternativo "policium" — referência ao 110 alemão, equivalente ao 190 brasileiro ou 911 americano. A piada virou seriedade quando colegas internacionais sugeriram oficialmente o nome em uma reunião, mas a IUPAC vetou alegando que nomes de elementos não deveriam estar ligados a serviços públicos de emergência. Em compensação, o nome "darmstadtium" virou orgulho local: a cidade de Darmstadt tem uma escultura comemorativa em sua praça principal, e visitantes do GSI são convidados a ver o pequeno detector subterrâneo onde o elemento foi observado pela primeira vez.',
  },
  111: {
    overview:
      'Roentgênio é um superpesado sintético batizado em homenagem ao físico alemão Wilhelm Conrad Röntgen, descobridor dos raios-X em 1895. A homenagem é particularmente apropriada: foi a descoberta dos raios-X que abriu o caminho para a física nuclear e atômica, sem a qual seria impossível sintetizar elementos como o próprio roentgênio. É um dos casos mais simbolicamente felizes de nomenclatura na história da tabela periódica.',
    history:
      'Sintetizado em dezembro de 1994 por Sigurd Hofmann e colaboradores no GSI Darmstadt, ao bombardear bismuto-209 com íons de níquel-64. Apenas três átomos foram observados. O nome "roentgenium" foi escolhido pelos descobridores em homenagem aos 110 anos da descoberta dos raios-X por Röntgen (estaria sendo aprovado em 2005 — coincidência matemática perfeita). A IUPAC ratificou o nome em 2004.',
    properties:
      'Sem observação macroscópica. Densidade estimada em 28,7 g/cm³, ponto de fusão estimado em 2.700 °C. Todos os 9 isótopos conhecidos são radioativos. O Rg-282 é o mais estável (meia-vida cerca de 2 minutos — relativamente longa para um superpesado, devido a efeitos de fechamento de camada nuclear). Por analogia com o ouro (grupo 11), espera-se comportamento de metal nobre. Cálculos relativísticos sugerem que roentgênio poderia ser ainda menos reativo que o ouro.',
    applications:
      'Nenhuma aplicação prática. Pesquisa em estabilidade nuclear de elementos superpesados e busca pela "ilha de estabilidade".',
    curiosity:
      'Quando Wilhelm Röntgen descobriu os raios-X em 1895, transformou a medicina em poucos meses — em 1896, cirurgiões já usavam radiografia para localizar fraturas e balas em corpos vivos. Röntgen recusou patentear sua descoberta, dizendo que pertencia a toda a humanidade, e ganhou o primeiro Prêmio Nobel de Física em 1901. Doou todo o dinheiro do prêmio à universidade onde trabalhava. Mais de um século depois, físicos alemães sintetizam elementos superpesados usando descendentes diretos das técnicas que Röntgen abriu — uma cadeia de favor científico que culmina no elemento de número 111.',
  },
  112: {
    overview:
      'Copernício é um superpesado sintético batizado em homenagem a Nicolau Copérnico, astrônomo polonês que revolucionou a visão de mundo no século XVI ao propor o modelo heliocêntrico — Terra orbitando o Sol, e não o contrário. O nome foi proposto em 2009, ano dos 500 anos da publicação de "Sobre as revoluções dos corpos celestes". É talvez o único elemento batizado em homenagem a uma figura tão antiga e tão fundadora da ciência moderna.',
    history:
      'Sintetizado em 1996 por Sigurd Hofmann e colaboradores no GSI Darmstadt, ao bombardear chumbo-208 com íons de zinco-70. Apenas dois átomos foram observados inicialmente. A IUPAC ratificou o nome "copernicium" em 2010, com cerimônia oficial no GSI. O símbolo Cn foi escolhido porque "Co" e "Cp" já estavam em uso. A homenagem a Copérnico foi proposta como reconhecimento de seu papel em desencadear a revolução científica que levou, séculos depois, à física moderna.',
    properties:
      'Sem observação macroscópica. Densidade estimada em 23,7 g/cm³, ponto de fusão talvez próximo de zero ou negativo — cálculos sugerem que copernício pode ser líquido ou gasoso à temperatura ambiente, o que seria revolucionário entre metais. Todos os 7 isótopos conhecidos são radioativos. O Cn-285 é o mais estável (meia-vida cerca de 30 segundos). Experimentos químicos em 2007 sugeriram comportamento semelhante ao do mercúrio (grupo 12), com possível volatilidade ainda maior.',
    applications:
      'Nenhuma aplicação prática. Pesquisa em química de transactinídeos e efeitos relativísticos extremos — copernício é um dos casos onde os efeitos relativísticos quânticos podem ser mais visíveis, alterando profundamente o comportamento esperado para um metal de transição.',
    curiosity:
      'Cálculos relativísticos mais avançados sugerem que copernício pode ser o primeiro metal pós-actinídeo a ser gasoso ou líquido em condições padrão — uma anomalia gritante na tabela periódica. Isso aconteceria porque os elétrons internos do átomo se movem a uma fração significativa da velocidade da luz e ficam "contraídos" relativisticamente, blindando os elétrons de valência e reduzindo a coesão metálica. Se confirmado experimentalmente (o que ainda não foi feito porque os átomos decaem rápido demais), copernício seria visualmente parecido com o argônio — um gás inerte impossível, em vez do metal de transição esperado.',
  },
  113: {
    overview:
      'Nihônio é o primeiro elemento descoberto em um laboratório asiático — sintetizado pela equipe japonesa do RIKEN, perto de Tóquio. Seu nome vem de "Nihon", uma das formas japonesas de chamar o país (a outra é "Nippon"). É um marco histórico: depois de décadas de descobertas dominadas por EUA, Rússia e Alemanha, a Ásia entrou para o clube exclusivo de países que batizam elementos da tabela periódica.',
    history:
      'Sintetizado a partir de 2003 pela equipe de Kosuke Morita no RIKEN, ao bombardear bismuto-209 com íons de zinco-70. Apenas três átomos foram observados em nove anos de experimentos contínuos — taxa de descoberta de aproximadamente um átomo a cada três anos. Em paralelo, um grupo russo-americano (Dubna + Livermore) também produziu nihônio em 2003 como produto de decaimento do moscóvio (Z 115). Após disputa de precedência, a IUPAC concedeu o crédito de descoberta ao RIKEN em 2015. A escolha do nome "nihonium" homenageia o Japão, dando à Ásia seu primeiro elemento na tabela.',
    properties:
      'Sem observação macroscópica. Densidade estimada em 16 g/cm³, ponto de fusão talvez em torno de 430 °C. Todos os 6 isótopos conhecidos são radioativos. O Nh-286 é o mais estável (meia-vida cerca de 10 segundos). Por analogia com o tálio (grupo 13), espera-se comportamento de metal pós-transição — mas previsões relativísticas sugerem que nihônio poderia ser surpreendentemente menos reativo que o tálio, devido a contração da camada eletrônica externa.',
    applications:
      'Nenhuma aplicação prática.',
    curiosity:
      'A descoberta do nihônio foi celebrada no Japão como evento de orgulho nacional. Quando a IUPAC anunciou o nome em 2016, o primeiro-ministro Shinzo Abe parabenizou a equipe pessoalmente, e a televisão japonesa transmitiu o anúncio em horário nobre. O líder da pesquisa, Kosuke Morita, dedicou a descoberta às vítimas do tsunami de 2011, que devastou a região de Fukushima — não muito longe do RIKEN. A presença do Japão na tabela periódica passou a ser ensinada nas escolas como exemplo de perseverança científica: 553 dias de aceleradores trabalhando 24 horas seguidas apenas para confirmar a existência de três átomos.',
  },
  114: {
    overview:
      'Fleróvio é um superpesado sintético inicialmente considerado o "centro" da hipotética "ilha de estabilidade" — região da tabela periódica onde elementos superpesados poderiam ter meia-vidas significativamente mais longas (até anos ou décadas) graças a configurações nucleares particularmente estáveis. Os isótopos sintetizados até hoje ficaram aquém das expectativas, mas a busca pela ilha continua sendo um dos maiores objetivos da física nuclear.',
    history:
      'Sintetizado em 1998 por Yuri Oganessian e colaboradores no Instituto Unificado de Pesquisa Nuclear em Dubna, em parceria com o Laboratório Nacional Lawrence Livermore. O bombardeio de plutônio-244 com íons de cálcio-48 produziu apenas um único átomo do isótopo Fl-289. O nome "flerovium" homenageia Georgy Flerov, físico soviético fundador do laboratório de Dubna, descobridor da fissão espontânea e líder de várias campanhas de síntese de transurânicos. Foi ratificado pela IUPAC em 2012.',
    properties:
      'Sem observação macroscópica. Densidade estimada em 14 g/cm³, ponto de fusão talvez em torno de -73 °C — o que sugere que fleróvio possa ser líquido ou gasoso à temperatura ambiente, comportamento mais próximo de um gás nobre que do metal previsto pelo grupo 14. Todos os 6 isótopos conhecidos são radioativos. O Fl-289 é o mais estável (meia-vida cerca de 2,6 segundos). Cálculos recentes mostram efeitos relativísticos tão intensos que fleróvio poderia, em teoria, ter caráter mais nobre que o chumbo (grupo 14, vizinho periódico).',
    applications:
      'Nenhuma aplicação prática. Pesquisa em estabilidade nuclear de superpesados e busca pela ilha de estabilidade.',
    curiosity:
      'A "ilha de estabilidade" foi prevista nos anos 1960 por Glenn Seaborg e colaboradores, com base em modelos nucleares que sugeriam números mágicos de prótons (Z = 114, 120 ou 126) com fechamento de camada particularmente estável. A esperança era que esses elementos pudessem ter meia-vidas de milhões de anos, suficientes para serem encontrados em pequenas quantidades na natureza. Após décadas de busca em meteoritos e amostras geológicas, nenhum vestígio foi encontrado. Os experimentos no fleróvio mostraram meia-vidas de segundos — bem longe da ilha. Mas se isótopos mais ricos em nêutrons forem sintetizados (com 184 ou mais nêutrons), a ilha ainda pode ser real. A caça continua.',
  },
  115: {
    overview:
      'Moscóvio é um superpesado sintético batizado em homenagem à região de Moscou (Oblast de Moscou), onde fica o Instituto Unificado de Pesquisa Nuclear em Dubna. Sintetizado em 2003, foi um dos primeiros elementos descobertos em parceria entre Dubna e o Laboratório Nacional Lawrence Livermore — colaboração que marcou o fim da Transfermium War e o início de uma era cooperativa na física de superpesados.',
    history:
      'Sintetizado em 2003 por Yuri Oganessian e colaboradores em Dubna, em parceria com o grupo de Ken Moody em Livermore, bombardeando amerício-243 com íons de cálcio-48. Apenas quatro átomos foram observados no experimento original. A IUPAC ratificou o nome "moscovium" em 2016, junto com o tennessínio (Z 117) e o oganessônio (Z 118) — última leva oficial de nomes da tabela periódica até hoje.',
    properties:
      'Sem observação macroscópica. Densidade estimada em 13,5 g/cm³, ponto de fusão talvez em torno de 400 °C. Todos os 5 isótopos conhecidos são radioativos. O Mc-290 é o mais estável (meia-vida cerca de 16 milissegundos). Por analogia com o bismuto (grupo 15), espera-se comportamento de metal pós-transição, mas cálculos relativísticos sugerem propriedades mais próximas das de um metalóide.',
    applications:
      'Nenhuma aplicação prática.',
    curiosity:
      'Em 2013, um ex-cientista militar canadense chamado Bob Lazar afirmou em entrevista de TV que o "elemento 115" era o combustível dos discos voadores supostamente recuperados em Roswell, Novo México. A história virou meme da cultura pop conspiratória — e a IUPAC decidiu não evitar a coincidência de nome ao ratificar "moscovium" como Z 115 em 2016. Hoje, vídeos pseudocientíficos sobre "Element 115 antigravity engines" coexistem na internet com publicações científicas sérias sobre as propriedades nucleares de Mc-290. Foi talvez o único elemento da tabela cuja descoberta científica precedeu — e contradisse, sem querer — uma teoria da conspiração popular pré-existente.',
  },
  116: {
    overview:
      'Livermório é um superpesado sintético batizado em homenagem ao Laboratório Nacional Lawrence Livermore, na Califórnia — instituição de pesquisa nuclear fundada em 1952 que, junto com o Instituto de Dubna na Rússia, lidera as descobertas de elementos superpesados desde os anos 1990. É o segundo elemento da tabela com nome ligado a Livermore, após o californio (Z 98) — embora este último homenageie o estado, não o laboratório.',
    history:
      'Sintetizado em 2000 por Yuri Oganessian em Dubna, em colaboração com Ken Moody no Lawrence Livermore National Laboratory, ao bombardear cúrio-248 com íons de cálcio-48. Apenas um único átomo foi observado no experimento original — confirmado posteriormente por outros experimentos. A IUPAC ratificou o nome "livermorium" em 2012, em reconhecimento à colaboração USA-Rússia que produziu quatro novos elementos (114, 115, 116 e 118) na primeira década do século XXI.',
    properties:
      'Sem observação macroscópica. Densidade estimada em 12,9 g/cm³, ponto de fusão talvez em torno de 380 °C. Todos os 4 isótopos conhecidos são radioativos. O Lv-293 é o mais estável (meia-vida cerca de 57 milissegundos). Por analogia com o polônio (grupo 16), espera-se comportamento de metalóide, mas previsões teóricas sugerem que livermório possa ser ainda mais metálico — comportamento alterado por efeitos relativísticos pesados.',
    applications:
      'Nenhuma aplicação prática.',
    curiosity:
      'O Lawrence Livermore National Laboratory tem uma trajetória controversa: fundado em 1952 como segundo laboratório nuclear dos EUA (depois de Los Alamos), inicialmente focado em design de armas termonucleares, e gradualmente transformado em centro de pesquisa em física aplicada, biologia e energia. Sua participação nas descobertas de transurânicos é parte de uma transição cultural: cientistas que antes desenhavam bombas hoje colaboram com colegas russos para descobrir elementos. O livermório é, em sentido simbólico, parte do legado pacífico de instituições nascidas da Guerra Fria.',
  },
  117: {
    overview:
      'Tennessínio é o segundo elemento mais pesado já sintetizado e o último halogênio sintetizado da tabela periódica (até o momento). Recebeu o nome em homenagem ao estado americano do Tennessee, onde fica o Laboratório Nacional de Oak Ridge — fornecedor do raríssimo isótopo de berquélio que foi essencial para a síntese. É também um exemplo de cooperação internacional avançada: a descoberta envolveu cientistas dos EUA, Rússia, e usou 22 mg de Bk-249 transportados em containers blindados via avião comercial.',
    history:
      'Sintetizado em 2010 por uma colaboração entre Dubna, Oak Ridge, Universidade Vanderbilt e Livermore, ao bombardear um alvo de berquélio-249 (produzido em Oak Ridge durante dois anos no reator HFIR) com íons de cálcio-48 (em Dubna). Seis átomos foram observados no experimento. A IUPAC ratificou o nome "tennessine" em 2016 — a terminação "-ine" segue a tradição dos halogênios (fluorine, chlorine, bromine, iodine, astatine). É o único elemento entre os superpesados a receber sufixo de halogênio.',
    properties:
      'Sem observação macroscópica. Densidade estimada em 7,2 g/cm³, ponto de fusão talvez em torno de 600 °C. Todos os 2 isótopos conhecidos são radioativos. O Ts-294 tem meia-vida de cerca de 80 milissegundos. Por analogia com o astato (grupo 17), espera-se comportamento intermediário entre halogênio e metalóide. Cálculos relativísticos sugerem que tennessínio talvez não exiba propriedades clássicas de halogênio: poderia ser metal ou metalóide sólido em vez de gás diatômico, devido à contração relativística dos elétrons externos.',
    applications:
      'Nenhuma aplicação prática.',
    curiosity:
      'A síntese do tennessínio é um dos exemplos mais notáveis de cooperação científica internacional em meio a tensões geopolíticas. Em 2009, no auge das sanções entre EUA e Rússia, Oak Ridge produziu 22 mg de Bk-249 — quantidade que custou US$ 3,5 milhões e exigiu dois anos de operação contínua do reator HFIR. O material foi enviado para Dubna em embalagens nucleares certificadas, atravessando o Atlântico em voo comercial. Os russos bombardearam o alvo de berquélio por 150 dias, observando seis átomos do novo elemento. Cada átomo do tennessínio detectado custou, somando tudo, cerca de US$ 600 mil — entre as descobertas científicas mais caras já feitas por unidade de massa observada.',
  },
  118: {
    overview:
      'Oganessônio é o elemento mais pesado já sintetizado e o último a ser oficialmente reconhecido pela IUPAC (em 2016). Marca o atual limite humano de criação de matéria, e foi batizado em homenagem ao físico armênio-russo Yuri Oganessian — líder dos experimentos em Dubna, responsável por mais descobertas de elementos superpesados que qualquer outro cientista vivo. É apenas o segundo elemento da história a receber o nome de uma pessoa viva, depois do seabórgio.',
    history:
      'Sintetizado em 2002 por Yuri Oganessian em Dubna, em colaboração com Livermore, ao bombardear califórnio-249 com íons de cálcio-48. Apenas um átomo foi observado no experimento inicial; mais alguns foram confirmados em 2005 e 2006. A descoberta foi confirmada pela IUPAC em 2015, e o nome "oganesson" foi ratificado em 2016 — junto com nihônio, moscóvio e tennessínio, completando a sétima e última fileira da tabela periódica. Oganessian, então com 83 anos, participou da cerimônia oficial de batismo.',
    properties:
      'Sem observação macroscópica. Densidade estimada em 4,9-5,1 g/cm³ (extremamente baixa para um elemento pesado), ponto de fusão talvez próximo de 50 °C. Apenas 5 átomos do isótopo Og-294 jamais foram detectados. Meia-vida de cerca de 700 microssegundos. Pertence formalmente ao grupo 18 (gases nobres), mas cálculos relativísticos sugerem que oganessônio pode ser, na verdade, um sólido semicondutor à temperatura ambiente — não um gás. Efeitos relativísticos extremos invertem as expectativas baseadas na tabela periódica clássica.',
    applications:
      'Nenhuma aplicação prática. Toda relevância é em pesquisa fundamental sobre os limites da tabela periódica e a possibilidade de elementos ainda mais pesados (Z=119, 120 e além).',
    curiosity:
      'Yuri Oganessian é uma figura singular: nascido em 1933 em Rostov-no-Don, sob a União Soviética, formou-se em física nuclear em Moscou, ingressou no Instituto de Dubna em 1956 e nunca saiu — passou 70 anos na mesma instituição. Sob sua liderança, Dubna sintetizou seis elementos (Z 113, 114, 115, 116, 117, 118), número sem paralelo na história da tabela periódica. Em 2016, com 83 anos, viu seu nome eternizado no elemento mais pesado já criado pelos humanos. Como Glenn Seaborg antes dele, é um dos raríssimos cientistas a presenciar o próprio nome se transformar em parte permanente da química. Em 2024, aos 91 anos, ainda trabalha ativamente em Dubna, planejando experimentos para sintetizar o elemento 119 e ultrapassar a sétima fileira da tabela.',
  },
};

const _ELEMENT_CONTENT_EN = {
  1: {
    overview:
      'Hydrogen is the simplest and most abundant chemical element in the universe, accounting for about 75% of all observable matter. Inside stars, hydrogen fuses into helium and releases the energy that makes the Sun shine. On Earth it rarely appears alone — it is locked into water, hydrocarbons, acids and virtually every biological molecule that sustains life.',
    history:
      'English chemist Henry Cavendish first identified it as a distinct substance in 1766, calling it "inflammable air" after observing that metals reacting with acids released a gas that burned to form water. The modern name was coined by Antoine Lavoisier in 1783 from the Greek "hydro" (water) and "genes" (former) — literally "water former." This marked the moment when modern chemistry began to leave the phlogiston theory behind.',
    properties:
      'At room temperature it is a colorless, odorless, highly flammable gas — lighter than any other element. Pure hydrogen forms diatomic molecules (H₂) held by a covalent bond. It has three natural isotopes: protium (¹H, 99.98%), deuterium (²H, with one neutron) and tritium (³H, radioactive). Under extreme pressure, such as deep inside Jupiter, hydrogen behaves like a liquid metal — a phase still under active research.',
    applications:
      'The largest industrial use is ammonia synthesis via the Haber-Bosch process, which sustains world agriculture through fertilizers. It is also key in oil refining, hydrogenation of vegetable oils (margarine) and methanol production. Hydrogen is increasingly used as fuel: NASA rockets burn liquid hydrogen with oxygen, and fuel-cell cars emit only water as a byproduct.',
    curiosity:
      'The hydrogen bomb doesn\'t use fission like the atomic bomb — it uses fusion, replicating the process that powers the Sun. The first one detonated in 1952 with the force of 10 million tons of TNT, about 700 times more than Hiroshima. The same fusion principle is what researchers try to control in reactors like ITER to produce clean energy.',
  },
  2: {
    overview:
      'Helium is the second lightest element in the universe and the most familiar noble gas — completely inert, colorless, odorless and non-toxic. Despite being the second most abundant in the cosmos (about 24% of mass), on Earth it is a finite resource: it is so light it escapes the atmosphere. Almost all commercial helium comes from natural gas, where it accumulates as a byproduct of radioactive decay of uranium and thorium in rocks over billions of years.',
    history:
      'First detected in 1868 not on Earth but in the Sun\'s spectrum — during a total solar eclipse in India, astronomers Pierre Janssen and Norman Lockyer noticed an unknown yellow line that matched no known element. Lockyer named it "helium" from the Greek "helios" (Sun). Only in 1895 did William Ramsay isolate terrestrial helium from the mineral cleveite, confirming that the solar element also existed here.',
    properties:
      'It has the lowest boiling point of any element (-269 °C) and is the only one that does not solidify under normal pressure — it only becomes solid under strong pressure. Below 2.17 K (-271 °C) it becomes a superfluid: it flows without friction, climbs walls and slips through microscopic cracks. As a noble gas, it does not form stable chemical compounds under normal conditions.',
    applications:
      'Its most valuable use is cooling superconducting magnets in MRI machines, particle accelerators and quantum qubits — without liquid helium these technologies stop. It is also used in weather balloons and airships (it replaced flammable hydrogen), in deep diving mixed with oxygen (Trimix), and as a leak-detection gas in pressurized systems.',
    curiosity:
      'Inhaling helium makes the voice sound squeaky because sound travels nearly three times faster in it than in air — it does not change the pitch of the vocal cords but alters the harmonics. More seriously: the world faces a "helium crisis" because once released into the atmosphere it is lost to space — we cannot produce helium industrially, only extract it from natural gas wells.',
  },
  3: {
    overview:
      'Lithium is the lightest metal and the least dense solid element on the periodic table — it floats on oil. Soft enough to cut with a knife, it is the basis of the modern energy revolution: every smartphone, laptop and electric-car battery depends on it. Although rare in Earth\'s mantle, it is concentrated in salt flats in Chile, Bolivia and Argentina (the "lithium triangle"), driving a global supply race.',
    history:
      'Discovered in 1817 by Swedish chemist Johan August Arfwedson while analyzing the mineral petalite. The name comes from the Greek "lithos" (stone), because it was the first alkali metal found in solid rock rather than plant ashes or sea salt. For more than 150 years it was a scientific curiosity — its commercial revolution only came in the 1990s with the first Sony lithium-ion batteries.',
    properties:
      'Soft silvery-white metal (it can be cut with a knife), so light it floats on kerosene. Melts at 180 °C. Reacts with water (slower than sodium, faster than calcium) releasing hydrogen. In flames it emits a vivid crimson color, used in red fireworks. More reactive than magnesium but less than sodium. Stored under mineral oil or vacuum.',
    applications:
      'Lithium-ion batteries dominate portable electronics, electric vehicles and grid energy storage. Lithium carbonate (Li₂CO₃) is an essential medicine for bipolar disorder — discovered in 1949. Aluminum-lithium alloys are used in aircraft (lighter). Lithium stearate is the most common industrial lubricating grease. In glass and ceramics, it improves resistance to thermal shock.',
    curiosity:
      'Global lithium demand has multiplied tenfold between 2010 and 2024, driven by electric cars. The Salar de Uyuni in Bolivia holds about half the world\'s lithium dissolved in its brine, but extracting it means evaporating thousands of liters of water in a region where water is scarce — one of the biggest dilemmas of the energy transition: clean technology that weighs on local communities.',
  },
  4: {
    overview:
      'Beryllium is a light-gray alkaline-earth metal, rare but notable for a singular combination of properties: light, rigid, transparent to X-rays and with a high melting point. It is found in emeralds, aquamarine and chrysoberyl — gemstones where traces of chromium or iron provide the colors. Industrially it ends up in aerospace and nuclear applications, but it is highly toxic if inhaled, requiring strict protective measures.',
    history:
      'Identified by French chemist Louis-Nicolas Vauquelin in 1798, while analyzing beryl and emerald — two stones known for millennia, but never before linked to a new element. Vauquelin noticed a distinct oxide that he called "glucinium" (from the Greek "glykys", sweet, because its salts taste sweet — though extremely toxic). The name "beryllium" was officially adopted in 1949 by IUPAC, derived from the mineral beryl.',
    properties:
      'Steel-gray metal, rigid, light (about 1.8 g/cm³, two-thirds the density of aluminum) and with extremely high elastic modulus — nearly 50% greater than steel. Melts at 1,287 °C. It is more transparent to X-rays than any other metal, used in X-ray tube windows. Forms a protective oxide layer (BeO) that resists corrosion. Its dust is highly toxic and carcinogenic — causes berylliosis, a serious chronic lung disease.',
    applications:
      'Structural components in space telescopes (the James Webb mirror has 18 beryllium segments coated with a thin layer of gold), satellites and missiles due to its rare combination of lightness and rigidity. Beryllium windows in medical X-ray tubes and crystallography. In nuclear reactors as a neutron reflector and moderator. Copper-beryllium alloys (BeCu) are non-sparking springs and tools, used in oil refineries and platforms. Emeralds and aquamarines are natural beryllium compounds.',
    curiosity:
      'The James Webb Space Telescope, launched in 2021, has its primary mirror made of 18 hexagonal segments of ultra-pure beryllium — chosen for its lightness (to survive the launch) and dimensional stability at extreme temperatures (the mirror operates at -223 °C). Each segment was polished with nanometer precision and coated with a gold layer about 100 atoms thick. The set weighs 705 kg, ridiculously light for a 6.5-meter mirror.',
  },
  5: {
    overview:
      'Boron is the lightest metalloid and the only non-metal besides carbon that forms complex covalent compounds — behavior that makes it unique in chemistry. It appears in Pyrex glass, heat-resistant ceramics, boric acid (antiseptic) and fertilizers. Ironically, although it is essential in trace amounts for plants, it is still unclear whether it is essential for humans.',
    history:
      'Isolated in nearly pure form in 1808 by two independent groups: Joseph Louis Gay-Lussac and Louis Jacques Thénard in France, and Humphry Davy in England. The name comes from "borax" (sodium tetraborate), a mineral known in antiquity and used by Romans in glassmaking and goldsmithing. Pure boron was only obtained in 1909, by Ezekiel Weintraub.',
    properties:
      'A black-gray crystalline solid with metallic luster, very hard (second only to diamond among pure elements). Melts at 2,076 °C. It is a metalloid: poor electrical conductor at room temperature, but conductivity increases with temperature — semiconductor behavior. It forms unusual covalent bonds, creating cage-like structures (boranes) that defy classical valence rules.',
    applications:
      'Borosilicate glass (Pyrex) resists extreme thermal shock — used in laboratory glassware, cookware and telescope mirrors. Boron carbide (B₄C) is among the hardest known materials, used in body armor and tank shielding. Boric acid (H₃BO₃) is a mild eye antiseptic, and borax appears in detergents and welding fluxes. In agriculture, boron corrects deficiencies in soils.',
    curiosity:
      'In nuclear reactors, boron control rods absorb neutrons and "shut down" the chain reaction. This is so effective that during the Chernobyl disaster in 1986, helicopters dumped thousands of tons of boron mixed with sand onto the damaged reactor to try to contain the runaway fission. Boron is, literally, the substance that brakes the nuclear age.',
  },
  6: {
    overview:
      'Carbon is the foundation of organic chemistry and all known life — the fourth most abundant element in the universe by mass, and 15th in Earth\'s crust. Its special chemistry comes from a unique ability to form four covalent bonds and long chains with other carbon atoms, creating millions of different compounds. Without carbon there would be no proteins, DNA, sugars, plastics, fossil fuels or graphene.',
    history:
      'Known since antiquity as charcoal and soot, it was recognized as a distinct chemical element by Antoine Lavoisier in 1789, who showed that diamond and graphite were the same substance. The allotropes followed over centuries: graphite (1779), diamond (already known), C₆₀ fullerenes by Kroto, Curl and Smalley in 1985 (Nobel 1996), and graphene isolated by Geim and Novoselov in 2004 (Nobel 2010).',
    properties:
      'It exists in radically different allotropic forms: diamond (the hardest natural substance), graphite (soft, electrically conductive), graphene (a flat one-atom-thick sheet), nanotubes (rolled-up graphene), fullerenes (spherical cages) and amorphous carbon. Its tetravalence allows linear chains, branched chains and rings. Carbon-14, the radioactive isotope formed by cosmic rays in the atmosphere, is the basis of archaeological dating.',
    applications:
      'Carbon steel (iron with 0.1%-2% carbon) is the most-used industrial material in history — its hardness depends exactly on how much carbon is in it. Graphite makes pencil "lead" and lithium-ion battery electrodes. Industrial diamond cuts almost any material. Activated carbon purifies water and air. Carbon fiber is central to modern aircraft, tennis rackets and SpaceX rockets.',
    curiosity:
      'Diamond and graphite are chemically identical — pure carbon — yet have completely different properties because of how the atoms are arranged. Graphene, a single layer of graphite, is 200 times stronger than steel by weight, conducts electricity better than copper, and is nearly transparent. In 2004 it was first isolated using ordinary scotch tape.',
  },
  7: {
    overview:
      'Nitrogen makes up about 78% of Earth\'s atmosphere as N₂ gas, but the diatomic form is so stable that few living organisms can use it directly. It is essential for life — present in proteins, DNA, RNA and chlorophyll — but only reaches living beings through nitrogen-fixing bacteria, atmospheric lightning, or industrial fertilizers. This "access barrier" shapes the ecology of nearly every ecosystem.',
    history:
      'Isolated in 1772 by Daniel Rutherford, who called it "noxious air" because it supported neither combustion nor respiration. Antoine Lavoisier renamed it "azote" (Greek for "lifeless"), a name still used in French. The modern name was coined by Jean-Antoine Chaptal in 1790, derived from "nitre" (saltpeter, or potassium nitrate), the mineral where nitrogen was first identified.',
    properties:
      'At room temperature it is a diatomic gas (N₂) made extremely stable by the triple covalent bond between atoms — one of the strongest chemical bonds in nature. It liquefies at -196 °C. Despite the inertness of N₂, nitrogen forms many important compounds: ammonia (NH₃), nitric acid (HNO₃), nitrates, nitrogen oxides, and the amino acids that build proteins.',
    applications:
      'Ammonia synthesis via the Haber-Bosch process was one of the most transformative inventions of the 20th century — converting atmospheric N₂ into fertilizers that feed half of humanity. Liquid nitrogen is the cheapest and most versatile cryogen: used in MRI, stem-cell preservation, and quick-freezing food. It also appears in explosives (TNT, dynamite, gunpowder) and as inert gas to preserve electronic components.',
    curiosity:
      'Every atmospheric lightning strike carries enough energy to break the N₂ triple bond and form nitrogen oxides that turn into rainwater-soluble nitrates — fertilizing the Earth. Without this "discharge fixation" and the biological fixation done by bacteria in legume roots, there would not be enough protein on the planet to support complex life.',
  },
  8: {
    overview:
      'Oxygen is the third most abundant element in the universe and the most abundant in Earth\'s crust, present in water, mineral oxides and the atmosphere. It is essential for aerobic respiration — the process that produces most of the energy in animals, plants and fungi. Its high reactivity explains both fire and rust: both are oxygen combining with other elements while releasing energy.',
    history:
      'Independently discovered by Carl Wilhelm Scheele in 1772 (published 1777) and Joseph Priestley in 1774, who isolated it by heating mercury oxide. Antoine Lavoisier named it in 1777 from Greek "oxys" (acid) + "genes" (former), mistakenly believing all acids required oxygen — a hypothesis refuted when HCl was shown to contain only hydrogen and chlorine.',
    properties:
      'At room temperature it is a colorless, odorless diatomic gas (O₂); in liquid form it has a pale blue color. It is the second most electronegative element (only fluorine beats it), which explains its electron-grabbing avidity in chemical reactions. It also exists as the allotrope ozone (O₃), unstable and highly reactive, which filters solar ultraviolet radiation in the stratosphere.',
    applications:
      'The steel industry is the largest consumer of pure oxygen — O₂ is blown into molten iron to burn off excess carbon and produce steel. Used in hospital medicine for patients with breathing difficulty, in water and sewage treatment (it accelerates biological degradation), and as an oxidizer in rockets (paired with hydrogen or kerosene). Oxy-acetylene welding reaches temperatures of 3,500 °C.',
    curiosity:
      'Atmospheric oxygen did not exist on early Earth — it was produced by photosynthesizing cyanobacteria about 2.4 billion years ago in the so-called "Great Oxygenation Event." To anaerobic organisms of the time, oxygen was a deadly poison, causing one of the largest extinctions in history. Complex life only evolved because some organisms learned to use this toxin as fuel.',
  },
  9: {
    overview:
      'Fluorine is the most electronegative and reactive element in the periodic table — so aggressive it attacks almost every known material, including glass, asbestos and even some noble metals. Despite this extreme hostility, stable forms of fluorine are everywhere in modern life: toothpaste, refrigerators, non-stick pans and medicines. It is a halogen fundamental to both industrial chemistry and human health.',
    history:
      'The existence of fluorine was suspected for centuries, but its ferocious reactivity defied every isolation attempt — many chemists were poisoned or died trying. Henri Moissan finally isolated it in 1886 in Paris using electrolysis at -50 °C — an achievement that earned him the 1906 Nobel Prize in Chemistry. The name comes from the mineral "fluorite" (CaF₂), used as a flux in metallurgy.',
    properties:
      'A pale yellow gas under normal conditions, with a pungent odor. It is the most electronegative element in the periodic table (3.98 on the Pauling scale), explaining its explosive reactivity. It reacts with virtually everything — including noble gases, water and organic materials, often with explosion or spontaneous ignition. Forms the fluoride anion (F⁻), very stable in ionic compounds.',
    applications:
      'The best-known compound is sodium fluoride (NaF) used in toothpaste and drinking-water fluoridation to prevent cavities. Polytetrafluoroethylene (PTFE), known as Teflon, coats non-stick pans and insulates wires. Hydrofluorocarbons replaced CFCs in refrigerators and air conditioning. Uranium hexafluoride is central to nuclear fuel enrichment. Hydrogen fluoride (HF) etches glass and is used for artistic engraving.',
    curiosity:
      'Fluorine is so reactive that the first chemists who tried to isolate it in the 19th century died or were permanently disabled by the vapors — Humphry Davy, Joseph Louis Gay-Lussac and the Knox brothers were all poisoned. The group became known as the "fluorine martyrs". Moissan succeeded by using cooled equipment and synthetic fluorite as an electrode, escaping the tragic fates of his predecessors.',
  },
  10: {
    overview:
      'Neon is a noble, inert, colorless and odorless gas — the fifth most abundant in the universe, yet extremely rare in Earth\'s atmosphere (about 18 parts per million). Famous for the vivid orange-red color it emits when electrically excited in glass tubes: the "neon lights" that defined 20th-century urban aesthetics, from Times Square marquees to Art Deco signs.',
    history:
      'Discovered in 1898 by William Ramsay and Morris Travers in London, alongside krypton and xenon, during fractional distillation of liquid air. The name comes from the Greek "neos" (new) — Ramsay\'s son suggested the name when he saw the gas\'s glow. In 1910 French engineer Georges Claude created the first commercial neon sign, launching the era of electric urban illumination.',
    properties:
      'Monoatomic noble gas (Ne), inert in almost all conditions — does not form stable chemical compounds in the laboratory. Liquefies at -246 °C. When subjected to high voltage in glass tubes, it emits intense orange-red light (at 632.8 nm is the characteristic line). It has the narrowest liquid-phase range of any element — only 2.6 °C between melting and boiling.',
    applications:
      'The most recognizable application is neon signage — although many modern "neon lights" actually contain argon, helium or other gases to produce different colors (blue, green, yellow). High-voltage indicators use small neon tubes. Liquid neon is a cryogenic fluid used in laboratories. Helium-neon lasers (famous for the red beam) were standard in supermarket barcode scanners.',
    curiosity:
      'The lights of Las Vegas, Times Square and 1930s-50s movie theaters owed their distinctive aesthetic to neon. But the golden era is over — modern LEDs are more efficient, durable and cheaper. Organizations like the Neon Museum in Las Vegas rescue old signs as historical pieces. Curiously, pure neon only produces the orange-red color; all other "neon colors" use different gases or tubes with fluorescent coatings.',
  },
  11: {
    overview:
      'Sodium is a soft, silvery alkali metal, so reactive that it never appears pure in nature — only in compounds such as table salt (NaCl), baking soda (NaHCO₃) and caustic soda (NaOH). It is the sixth most abundant element in Earth\'s crust and essential for life: Na⁺ ions regulate fluid balance, muscle contraction and nerve impulse transmission in virtually every animal.',
    history:
      'Isolated by Humphry Davy in 1807 through electrolysis of molten caustic soda (NaOH) — the same year he isolated potassium by the analogous method. The name "sodium" comes from the Latin "sodanum" (an old headache remedy made from sodium carbonate). The symbol Na comes from "natrium", the Latin word for natron, the sodium carbonate mineral used by the Egyptians for mummification.',
    properties:
      'Soft enough to be cut with a knife, and freshly cut sodium reveals a metallic shine that oxidizes in seconds in the air. It reacts violently with water, releasing hydrogen that can ignite — so it is stored in kerosene or mineral oil. It melts at just 98 °C. In flames it emits the characteristic yellow color that gives sodium-vapor lamps their hue.',
    applications:
      'Sodium chloride (table salt) is the most familiar compound — used in food preservation, seasoning and human diet. Sodium hydroxide (caustic soda) is fundamental in the manufacture of soap, paper, aluminum and chemicals. Liquid sodium is used as a heat-transfer fluid in fourth-generation nuclear reactors. Sodium-vapor lamps light most of the world\'s streets and highways.',
    curiosity:
      'The characteristic yellow-orange color of street lamps (and fireworks) comes from a single electronic transition in the sodium atom, at 589 nm — so narrow and well-defined that astronomers use it as a reference to calibrate telescopes. The same line was observed by Joseph von Fraunhofer in the solar spectrum in 1814, before sodium was even understood to be the source.',
  },
  12: {
    overview:
      'Magnesium is a light, silvery alkaline-earth metal, the eighth most abundant element in Earth\'s crust. Its density is only two-thirds that of aluminum, making it the lightest structural metal available. Biologically it is essential: it is the central atom of chlorophyll — the molecule that gives plants their green color and powers virtually all of Earth\'s photosynthesis.',
    history:
      'Scottish chemist Joseph Black recognized it as a distinct element in 1755, but it was Humphry Davy who isolated it in 1808 by electrolyzing a mixture of magnesium oxide and mercury. The name comes from the Magnesia region of ancient Greece, where the mineral magnesite (magnesium carbonate) was abundant. For centuries it was confused with calcium before being identified as its own element.',
    properties:
      'Light, silvery and so reactive that it burns with a brilliant, blinding white flame when heated. By weight it is stronger than steel — a property that makes it valuable wherever every gram counts. It forms a thin oxide layer on its surface that protects against further corrosion, although in powder or thin-strip form it easily ignites in the presence of oxygen.',
    applications:
      'Magnesium alloys appear in aircraft fuselages, racing-car wheels, laptops and cameras — anywhere reducing weight justifies the cost. It was the classic ingredient of photography flashes before electronic flash was invented. In organic chemistry, Grignard reagents (organomagnesium compounds) allow the formation of carbon-carbon bonds and are a cornerstone of modern synthesis.',
    curiosity:
      'Photosynthesis exists because magnesium sits exactly at the center of the chlorophyll molecule, bonded to four nitrogen rings. It is this arrangement that captures solar photons and triggers the reaction that turns CO₂ into sugars — with oxygen as a byproduct. Without magnesium there would be no green plants, and so no breathable atmosphere.',
  },
  13: {
    overview:
      'Aluminum is the most abundant metal in Earth\'s crust, making up about 8% of its mass. Despite that, it was one of the last common metals humanity learned to master — it was considered more precious than gold until the late 19th century, when cheap electrolytic extraction was discovered. Today it is the second-most-used metal in the world, behind only iron.',
    history:
      'First isolated in impure form by Hans Christian Ørsted in 1825. For decades it remained extremely rare: Napoleon III had aluminum cutlery reserved for his most distinguished guests — and gold plates for everyone else. In 1886 Charles Martin Hall and Paul Héroult, working independently, discovered the electrolytic process that cut aluminum\'s price by about 200x within a decade.',
    properties:
      'Silvery white, light (only one-third the density of steel), malleable, ductile and non-magnetic. It instantly forms a microscopic oxide layer (Al₂O₃) that protects the inner metal from corrosion. An excellent electrical and thermal conductor, although less so than copper per cross-section. Endlessly recyclable without losing quality.',
    applications:
      'Beverage cans, window frames, kitchen foil, aircraft fuselages, modern automobiles, long-distance electrical transmission lines (replacing copper because it is cheaper and lighter), electronics and packaging. Almost anything that flies today is mostly aluminum. Aluminum alloys with copper, magnesium and zinc are as strong as steel but three times lighter.',
    curiosity:
      'The top of the Washington Monument, installed in 1884, is a pyramidal aluminum cap weighing about 2.8 kg. At the time it cost more than silver. Just two years later, the Hall-Héroult process turned aluminum into a commodity material, and gold lost its position as the only "noble" metal displayed on important monuments.',
  },
  14: {
    overview:
      'Silicon is the second most abundant element in Earth\'s crust after oxygen, making up about 28% of its mass. It is a blue-gray metalloid with a metallic luster — chemically similar to carbon but with unique electrical properties that made it the foundation of the digital age. From common sand came the microchip, solar panels and glass. Without silicon, there would be no Silicon Valley.',
    history:
      'First isolated by Jöns Jacob Berzelius in 1824 from silicon tetrafluoride. The name comes from the Latin "silex" (flintstone) — the hard stone used to make fire since prehistory. The silicon revolution began in 1947 at Bell Labs with the first transistor, and exploded in the 1960s with the invention of the integrated circuit by Robert Noyce and Jack Kilby.',
    properties:
      'A crystalline solid of blue-gray color with metallic luster. It is a semiconductor — not as good a conductor as metals, but better than insulators — and the conductivity can be precisely tuned by "doping" with tiny amounts of phosphorus or boron. Melts at 1,414 °C. It forms important compounds: silicon dioxide (SiO₂, sand/quartz), silicon carbide (a tough ceramic) and silicates (the basis of most rocks).',
    applications:
      'Silicon microchips are the brains of virtually every electronic device — processors, memory, camera sensors. Photovoltaic solar panels use crystalline silicon to convert light into electricity. Glass is melted silicon dioxide. Silicones (silicon polymers) appear in cosmetics, medical implants, seals and lubricating oils. Silicon steel is used in electrical transformers.',
    curiosity:
      '"Moore\'s Law" — which predicted the doubling of transistors on chips every two years — sustained the digital revolution for more than 50 years. In 1971 the first Intel processor had 2,300 transistors. In 2024 a single Apple M3 Max chip has about 92 billion transistors. Each transistor is a tiny structure on a silicon wafer, etched by extreme ultraviolet light.',
  },
  15: {
    overview:
      'Phosphorus is a non-metal essential to life — it is in every atom of DNA, RNA, ATP and the phospholipids of cell membranes. Without phosphorus, no living cell can store energy or transmit genetic information. It appears in several dramatically different allotropic forms: white (flammable and toxic), red (stable, in match sticks) and black (similar to graphite, rare).',
    history:
      'Discovered in 1669 by German alchemist Hennig Brand, who distilled enormous quantities of urine in search of the philosopher\'s stone. Instead he obtained a yellowish-white residue that glowed in the dark — white phosphorus. The name comes from the Greek "phosphoros" (light bearer). For decades it was the most expensive substance in the world. In 1845, German chemist Anton Schrötter discovered red phosphorus, more stable.',
    properties:
      'It has three main allotropes. White: waxy, translucent, ignites in air (at 30 °C), glows in the dark (phosphorescence) and is extremely toxic. Red: amorphous, stable, non-toxic, used in safety matches. Black: the most thermodynamically stable form, a semiconductor with a graphite-like structure. White phosphorus oxidizes spontaneously, which is why it must be stored submerged in water.',
    applications:
      'Fertilizers (in the form of mineral phosphates) are the largest use — alongside nitrogen and potassium, they sustain all of modern agriculture. Modern safety matches use red phosphorus on the striking surface (not on the match head). In metallurgy, it improves steel quality. Detergents contain sodium tripolyphosphate (less and less, because it causes water eutrophication). Phosphoric acid (H₃PO₄) is what gives cola sodas their typical tangy flavor.',
    curiosity:
      'The alchemist Hennig Brand believed golden urine contained the secret to making gold. He distilled about 5,500 liters of urine in 1669 before obtaining a glowing residue — not gold, but the first sample of white phosphorus in history. For decades, alchemists kept the method secret, selling the "luminous miracle" at astronomical prices to curious nobles across Europe.',
  },
  16: {
    overview:
      'Sulfur is a bright yellow non-metal known since antiquity — it appears in pure volcanic deposits, with its unmistakable "rotten eggs" smell (actually hydrogen sulfide H₂S, not pure sulfur). It is essential for life (proteins, amino acids like cysteine and methionine, vitamin B1) and is the 16th most abundant element in Earth\'s crust, concentrated in volcanic zones and petroleum deposits.',
    history:
      'Known since prehistory — yellow volcanic deposits were burned by Egyptians, Greeks and Romans as medicine, bleach and weapon. The word "sulfur" comes from Latin, but the earlier etymology is uncertain (possibly from Sanskrit "sulvere", fire). It was central to alchemy alongside mercury. It was recognized as a chemical element by Antoine Lavoisier in 1777, refuting the phlogiston theory.',
    properties:
      'A bright yellow solid at room temperature. Poor electrical and thermal conductor. Melts at 115 °C (in its α form). It has multiple allotropic forms — the most common is the S₈ ring, eight atoms in a crown. Burns with a blue flame producing acrid-smelling sulfur dioxide (SO₂). Forms sulfides with most metals and the most industrially used acid: sulfuric acid (H₂SO₄). Insoluble in water but dissolves in CS₂.',
    applications:
      'Sulfuric acid is the most-produced industrial chemical in the world — the basis of fertilizers (especially superphosphate), oil refining, lead-acid batteries, ore processing and the manufacture of virtually any industrial chemical. Rubber vulcanization (discovered by Charles Goodyear in 1839) uses sulfur to create bonds between polymer chains. In medicine, sulfa drugs were the first modern antibiotics.',
    curiosity:
      'The "rotten egg" smell does not come from pure sulfur — it comes from hydrogen sulfide (H₂S), the gas released when sulfur-containing proteins decompose. The human nose detects H₂S at concentrations as low as 0.5 parts per billion, making it one of the most potent smells we perceive. Above 100 ppm, however, H₂S anesthetizes the sense of smell — high concentrations smell like nothing, making it deadly treacherous in sewers and barns.',
  },
  17: {
    overview:
      'Chlorine is a yellow-green, highly reactive and toxic gas — one of the halogens. Although deadly in high concentrations, it is fundamental to modern life: table salt (NaCl) contains chlorine, and chlorination of drinking water has prevented millions of deaths from waterborne diseases. It is also essential in the production of PVC, paper, textiles and medicines.',
    history:
      'Isolated by Carl Wilhelm Scheele in 1774, who did not realize it was an element — he thought it contained oxygen. Humphry Davy demonstrated in 1810 that it was a pure element and named it from the Greek "chloros" (yellow-green). Its infamous military debut was in 1915 at Ypres, in World War I — the first large-scale use of modern chemical weapons, killing thousands of Allied soldiers.',
    properties:
      'Yellow-green diatomic gas (Cl₂) with a pungent and suffocating odor. Extremely reactive: the second most electronegative halogen (only fluorine beats it). Liquefies at -34 °C under pressure. Reacts with almost every element, forming chlorides. In water it forms hypochlorous acid (HClO), the disinfecting agent that kills pathogens in swimming pools and water treatment plants.',
    applications:
      'Chlorination of drinking water is considered one of the greatest public health inventions — it eliminated cholera, typhoid and dysentery in cities. PVC (polyvinyl chloride) is the third most produced plastic in the world, used in plumbing, wires and windows. Chlorine is central to paper, textile and plastic production and in pharmaceutical synthesis. Sodium hypochlorite is the active ingredient in household bleach.',
    curiosity:
      'The strong smell of a swimming pool or freshly cleaned bathroom is not exactly pure chlorine — it is chloramine, formed when chlorine reacts with ammonia (sweat, urine, organic residues). The stronger the smell, the more contaminated the water. A pool "smelling strongly of chlorine" is paradoxically a poorly cleaned pool: fresh chlorine in clean water has an almost imperceptible odor.',
  },
  18: {
    overview:
      'Argon is the third most abundant gas in Earth\'s atmosphere (about 0.93%), more than all other noble gases combined. Colorless, odorless and chemically inert — it is the most common noble gas in our surroundings. Although invisible, it is used industrially in enormous quantities in welding, lamps and insulating windows. Its name comes from the Greek "argos" (lazy), reflecting its resistance to reacting with other elements.',
    history:
      'Discovered in 1894 by Lord Rayleigh and William Ramsay in the United Kingdom, when they noticed that nitrogen extracted from air was slightly denser than nitrogen produced in the laboratory. After removing oxygen, carbon dioxide and moisture from air, they isolated a residual gas that did not react with anything — argon. This work earned Ramsay the Nobel Prize in 1904 and opened the path to discovering neon, krypton and xenon.',
    properties:
      'Monoatomic noble gas (Ar), colorless, odorless and tasteless. Liquefies at -186 °C. It is almost completely inert — although argon fluorohydride (HArF) was synthesized in 2000, it is stable only below -265 °C. Has three stable isotopes. About 99% of atmospheric argon is Ar-40, formed by the radioactive decay of K-40 in rocks over billions of years. Shows a lilac-pink color when electrically excited.',
    applications:
      'The largest use is as an inert atmosphere: it protects molten metals during welding (TIG, MIG) from oxidation, especially in stainless steel, aluminum and titanium. Fills incandescent and fluorescent lamps (alongside mercury) to prevent filament oxidation. Double-glazed windows seal argon between the panes for thermal insulation — one of the most efficient technologies in sustainable construction. Protective atmosphere in museums, preserving ancient documents.',
    curiosity:
      'The U.S. Constitution, the Declaration of Independence and the Bill of Rights are stored in argon-pressurized display cases at the National Archives in Washington — a decision made in 2003. The gas prevents oxygen from degrading the parchment over centuries. Curiously, the argon gas used to preserve the founding documents is the same gas the founders breathed — just concentrated.',
  },
  19: {
    overview:
      'Potassium is a soft, silvery alkali metal as reactive as sodium — exploding on contact with water. Despite that, it is absolutely essential for life: every cell in your body depends on K⁺ ions to regulate osmotic pressure, muscle contraction and nerve transmission. On the industrial scale, its largest use is as fertilizer — literally feeding the world\'s crops.',
    history:
      'Isolated by Humphry Davy in 1807 — the same year he isolated sodium, by electrolysis of caustic soda and caustic potash. The name "potassium" comes from "potash" (ashes of plants burned in a pot), the old method of obtaining the substance. The symbol K comes from the Latin "kalium", derived from the Arabic "al-qali" (plant ashes), which also gave rise to the word "alkali".',
    properties:
      'A silvery metal so soft it can be cut with a knife. Melts at just 63 °C. Reacts violently with water, often with a characteristic lilac flame and explosion. Stored under mineral oil to prevent oxidation. In flames it emits a violet-pink color that distinguishes potassium from sodium in the flame test. It has a natural radioactive isotope (K-40) with a half-life of 1.25 billion years.',
    applications:
      'Potassium chloride (KCl) is the most-used fertilizer ingredient in the world — together with nitrogen and phosphorus, it sustains modern agriculture. Potassium hydroxide (KOH) is the base of liquid "soft" soap and alkaline batteries. Potassium permanganate (KMnO₄) is a disinfectant and oxidizer in laboratories. Potassium nitrate is a component of black powder and fireworks (lilac flame).',
    curiosity:
      'Each of us naturally contains about 140 grams of potassium, of which roughly 0.012% is radioactive K-40. That means your body emits about 4,000 radioactive disintegrations per second from internal potassium alone. It is the largest natural source of radioactivity in the human body, but the levels are so low that there is no harm. Bananas are famously potassium-rich, but even bananas are not radioactive enough to worry about.',
  },
  20: {
    overview:
      'Calcium is the fifth most abundant element in Earth\'s crust and the most abundant metal in the human body — forming bones, teeth, shells and eggshells. It is a soft, silvery alkaline-earth metal, but rarely appears pure: almost always in compounds like limestone, marble, gypsum and lime. Without calcium, there is no skeleton, muscle contraction or blood clotting.',
    history:
      'Calcium compounds have been used for millennia — Egyptian pyramids and Roman buildings were bonded with lime mortar (CaO). Humphry Davy first isolated it in 1808 using electrolysis. The name comes from the Latin "calx" (quicklime), the substance obtained by burning limestone. The lime cycle (rocks → lime → mortar → hardened carbonate) is one of the oldest chemical reactions humanity has controlled.',
    properties:
      'A soft silvery metal that oxidizes rapidly, forming a yellow-gray layer. Melts at 842 °C. Reacts with water — though more slowly than sodium or potassium — releasing hydrogen. In flames it emits an orange-red color. Its carbonate (CaCO₃) is insoluble in pure water but dissolves in CO₂-rich water — a process that carves caves and stalactites over millennia.',
    applications:
      'Calcium carbonate (limestone, marble) is the main ingredient of Portland cement, the basis of modern civil construction. Calcium hydroxide (slaked lime) neutralizes acids in agricultural soils and water treatments. Calcium sulfate is plaster (drywall, orthopedic casts). In the body, calcium phosphate gives rigidity to bones and teeth. Calcium supplements are prescribed to prevent osteoporosis.',
    curiosity:
      'The bones in your body are constantly renewed — about 10% of the skeleton is replaced each year. That means the calcium in your bones today is not the same calcium that was there seven years ago. The process involves two types of cells: osteoclasts break down old bone and osteoblasts form new bone. After age 35, breakdown begins to exceed formation — which is why osteoporosis is more common in old age.',
  },
  21: {
    overview:
      'Scandium is a silvery transition metal, rare but not excessively so — the 35th most abundant element in the crust. Despite that, its mining is so dispersed and technical that historically it has been rarer and more expensive than gold. It combines lightness, high mechanical strength, and excellent high-temperature behavior, making it coveted in aerospace alloys. China holds almost all the strategic supply today.',
    history:
      'Predicted by Mendeleev in 1869 as "eka-boron" — a hypothetical element below boron in the periodic table. It was discovered in 1879 by Swedish chemist Lars Fredrik Nilson in Uppsala, in the mineral euxenite. The name comes from "Scandinavia", Nilson\'s homeland. It was another of Mendeleev\'s accurate predictions: atomic mass, density and oxidation state predicted theoretically matched the experimental values.',
    properties:
      'A light silvery-gray metal (density 2.99 g/cm³, almost that of aluminum), malleable, with a high melting point (1,541 °C). It oxidizes in moist air, forming a yellow-pink layer. Reacts with water slowly. Chemically similar to yttrium and the lanthanides, although classified as a transition metal. Has only one stable isotope (Sc-45) and produces intense colors in compounds through UV absorption.',
    applications:
      'Aluminum-scandium alloys (Al-Sc) are up to 50% stronger than conventional alloys and retain their properties at high temperatures — used in the structures of Russian military aircraft (MIG-29, Su-27) and increasingly in civilian planes. Metal-halide lamps with scandium produce sunlight-like light used in stadiums and tomography. Among rare earths, it is used in catalysts for oil refining and in advanced ceramics.',
    curiosity:
      'For decades, the total worldwide production of scandium was so small it could fit in a single pickup truck. In 2014, an estimated 15-25 tons were produced globally — compared to millions of tons of iron or aluminum. The scarcity is not geological (sufficient reserves exist) but economic: mining scandium in quantity requires finding it as a byproduct of other extractions, all behind Chinese rare-earth geopolitics.',
  },
  22: {
    overview:
      'Titanium is a silvery-gray metal, as light as aluminum but as strong as steel — a rare combination that makes it indispensable in aerospace, medical prosthetics and high-performance sports equipment. It is the ninth most abundant element in Earth\'s crust, but extracting the pure metal from ore is expensive, keeping it in a price tier between commodities and precious metals.',
    history:
      'Identified independently in 1791 in England by William Gregor and in 1795 in Germany by Martin Heinrich Klaproth, who named it after the Titans of Greek mythology — the giants who were children of Uranus and Gaia. But pure metallic titanium was only obtained in 1910 by Matthew A. Hunter, and large-scale production began only in 1940 with the Kroll process, still used today.',
    properties:
      'A silvery low-density metal (4.5 g/cm³ — about 60% lighter than steel) with mechanical strength comparable to stainless steel. Melts at 1,668 °C. It forms a protective oxide layer (TiO₂) that makes it exceptionally resistant to corrosion — even in seawater, acids and body fluids. It is biocompatible: the human body does not reject it.',
    applications:
      'Structural components in aircraft, rockets and submarines — anywhere strength-to-weight ratio is critical. Medical implants (hip prostheses, orthopedic screws, dental implants) thanks to biocompatibility. Titanium dioxide (TiO₂) is the most-used white pigment in the world — in paints, cosmetics, plastics and toothpaste. Bicycle frames, rackets and high-end golf clubs use titanium alloys.',
    curiosity:
      'The SR-71 Blackbird, the fastest crewed aircraft ever built (over Mach 3), was 85% titanium. The paradox: the U.S. needed pure titanium but the best reserves were in the Soviet Union. During the Cold War, the CIA set up shell companies in other countries to buy Soviet titanium — effectively using the enemy\'s metal to build spy planes that flew over that very enemy.',
  },
  23: {
    overview:
      'Vanadium is a hard, silvery-gray, corrosion-resistant transition metal. Adding small amounts (0.15-0.25%) to steel produces a much stronger, tougher material — the basis of tools, springs and demanding mechanical components. More recently it has gained prominence in vanadium redox flow batteries (VRFB), candidates for large-scale energy storage in electrical grids.',
    history:
      'Discovered twice: in 1801 by Mexican mineralogist Andrés Manuel del Río in Mexican minerals (he called it "erythronium"), and rediscovered in 1830 by Swedish chemist Nils Gabriel Sefström. Sefström gave it the current name after the Norse goddess Vanadis (Freyja) — for the colorful beauty of its salts (they vary from green, blue, yellow and violet according to oxidation state). Henry Roscoe isolated the pure metal in 1867.',
    properties:
      'Silvery-gray metal, hard, ductile and quite resistant to corrosion by acids and alkalis. Melts at 1,910 °C. Has five oxidation states (from 0 to +5), each with a distinct color in aqueous solution — green (V³⁺), blue (V⁴⁺), yellow (V⁵⁺). This multivalent behavior is what enables flow batteries. Forms vanadium carbide (VC), one of the hardest known materials.',
    applications:
      'About 85% of production goes to specialty steels — vanadium steels in tools (wrenches, drills, blades), car springs, axles and high-pressure pipelines. Vanadium redox flow batteries (VRFB) store renewable energy in large installations, with operating lives over 20 years. Catalysts for sulfuric acid production (contact process). In trace amounts it may be a nutrient for some marine organisms.',
    curiosity:
      'Vanadium is so essential to some marine invertebrates that certain ascidians (sea squirts, "sea lemons") concentrate vanadium from the ocean to levels 10 million times higher than the surrounding water. Scientists suspect this accumulation is part of chemical defense or alternative respiratory metabolism, but the exact reason remains a biological mystery after decades of research.',
  },
  24: {
    overview:
      'Chromium is a silvery-blue transition metal known for its brilliant color and extremely high corrosion resistance. Its most familiar application is as a protective layer in stainless steel, automotive parts and decorative coatings. Despite its appealing shine, some chromium compounds are among the most documented carcinogens — a duality that defines its industrial history.',
    history:
      'Discovered in 1797 by French chemist Louis-Nicolas Vauquelin from the mineral crocoite, a lead chromate. The name comes from the Greek "chroma" (color), because its compounds display intense and varied colors — green, yellow, orange, blood-red. Vauquelin noted that emeralds and rubies owe their colors to traces of chromium. It was used industrially from the 19th century in pigments and leather tanning.',
    properties:
      'Silvery-gray metal with a bluish tone, extremely hard (the hardest of all common metals), with a melting point of 1,907 °C. It forms a very thin oxide layer (Cr₂O₃) that protects the inner metal from corrosion — the secret behind stainless steel. It has multiple oxidation states (+2, +3, +6), each with distinct chemical properties. Cr(VI) (hexavalent chromium) is highly toxic and carcinogenic.',
    applications:
      'The dominant use is stainless steel (typically 10-30% chromium), found in kitchenware, appliances, surgical instruments, architecture and chemical industry. Decorative chrome plating on automotive parts and bathrooms. Pigments: chrome yellow (PbCrO₄), chromium oxide green, chrome-molybdate red-orange. Leather tanning with chromium. In alloys, it boosts hardness and abrasion resistance.',
    curiosity:
      'The real-life case that inspired the film "Erin Brockovich" (2000) involved water contamination by hexavalent chromium in Hinkley, California, caused by Pacific Gas & Electric. Hundreds of residents developed cancer and other illnesses. The lawsuit resulted in one of the largest class-action settlements in American history — US$ 333 million in 1996. The case turned Cr(VI) into an icon of industrial pollution.',
  },
  25: {
    overview:
      'Manganese is a pinkish-gray transition metal, hard but brittle, essential in steel alloys and modern batteries. About 90% of world manganese production goes to steelmaking — without it, there is no modern structural steel. It is also an essential trace nutrient for all living things, acting in enzymes that protect cells from oxidative damage.',
    history:
      'Recognized as an element in 1774 by Swede Carl Wilhelm Scheele, and isolated the same year by Johan Gottlieb Gahn by heating manganese dioxide with charcoal. The name comes from the mineral "magnesia nigra" (black magnesia), pyrolusite (MnO₂), known in antiquity and used to clarify glass — not to be confused with magnesium, which came from the same mineral name but is a distinct element.',
    properties:
      'Silvery-gray metal with a pinkish hue, hard yet so brittle it can shatter with a hammer blow. Melts at 1,246 °C. Forms five main oxidation states (+2, +3, +4, +6, +7), each with a characteristic solution color — which is why potassium permanganate (KMnO₄) is an intense violet. Reacts with hot water and oxidizes rapidly in moist air.',
    applications:
      'In steelmaking it is added to steel to increase hardness, wear resistance and toughness — without it, steel would be too brittle for construction. Hadfield steel (with 12-14% Mn) is used in crushers, railways and safes for its exceptional impact hardness. Alkaline batteries use manganese dioxide (MnO₂) as the cathode. Potassium permanganate is a disinfectant and oxidizer in laboratories. Modern lithium-ion batteries (NMC cathode) contain manganese.',
    curiosity:
      'On the ocean floor there are "manganese nodules" — dark balls the size of potatoes, formed slowly over millions of years through chemical and biological processes. They contain manganese, iron, copper, nickel and cobalt. Trillions of tons are estimated to exist on the seabed, but commercial mining is controversial: it could devastate unique deep-sea ecosystems we still barely understand.',
  },
  26: {
    overview:
      'Iron is the most common metal on Earth — it forms most of the planet\'s core and about 5% of its crust. It is the foundation of industrial civilization: from building columns to scalpel blades, from suspension bridges to orbiting satellites. Biologically, it is the atom at the center of hemoglobin, carrying oxygen through the blood of nearly every animal with a circulatory system.',
    history:
      'Iron tools were used about 5,000 years ago from fallen meteorites. The Hittites mastered iron-ore smelting around 1500 BCE, beginning the Iron Age that succeeded the Bronze Age. The Bessemer process, invented in 1855, enabled mass production of cheap steel and triggered the Second Industrial Revolution — railroads, steamships and skyscrapers.',
    properties:
      'Silvery gray, strongly magnetic (alongside cobalt and nickel), malleable and ductile. It oxidizes easily in moist air, forming rust (hydrated iron oxide) that does not protect against further corrosion. It has four allotropic forms that change crystal structure with temperature. Melting point: 1,538 °C. It is the most stable known nucleus — the peak of the nuclear binding-energy curve.',
    applications:
      'Steel (iron with 0.1%-2% carbon) accounts for about 95% of all global metal production. Cast iron for engines, cylinder blocks and pipes. Stainless steel (with chromium) for kitchenware, surgical instruments and architecture. Hemoglobin and myoglobin depend on iron to carry oxygen. Permanent magnets made from ferromagnetic alloys.',
    curiosity:
      'Iron is the heaviest element ordinary stars can produce by fusion in their cores — fusing iron consumes energy instead of releasing it, so stars stall there and collapse into supernova. Every iron atom heavier in the universe, including the one in your blood, was forged in cataclysmic stellar explosions or neutron-star collisions.',
  },
  27: {
    overview:
      'Cobalt is a bluish-gray transition metal, ferromagnetic like iron and nickel. Known for centuries by the intense blue pigment used in glass and ceramics — "cobalt blue" — today it is more strategic as a component of lithium-ion batteries for electric cars. Most world production comes from the Democratic Republic of the Congo, often under problematic mining conditions.',
    history:
      'Medieval German miners knew a blue mineral that poisoned workers without producing metal — they blamed a malicious spirit called "Kobold" (mountain gnome). In 1735 Georg Brandt proved the "kobold" was a new element, naming it cobalt. Egyptians, Persians and Chinese had used cobalt compounds for millennia in blue glass and tiles, without knowing the chemistry behind them.',
    properties:
      'Gray metal with a bluish tone, hard, ferromagnetic up to 1,121 °C (above that temperature it loses magnetism). Melting point: 1,495 °C. Forms intensely colored compounds — Co(II) salts are pink in aqueous solution, blue when anhydrous (the principle behind "cobalt glass" and humidity tests). It is radioactively important: cobalt-60, a synthetic isotope, is used in radiotherapy and industrial sterilization.',
    applications:
      'Lithium-ion battery cathodes (especially in phones and electric cars) are the largest current use — about 50% of demand. Pigments: cobalt blue in glass, ceramics and oil paints. Cobalt superalloys withstand jet-engine turbines at high temperature. Catalysts for hydrocarbons and plastics manufacturing. Cobalt-60 in radiotherapy equipment (gradually replaced by linear accelerators).',
    curiosity:
      'The "blue" of Ming Chinese porcelain, Renaissance Venetian glass and medieval Persian tiles is all cobalt. When Europe began producing this porcelain in the 18th century, cobalt became a strategic raw material. Today the challenge is different: about 70% of world cobalt comes from the Congo, where artisanal mining involves child labor and dangerous conditions — a fact that has pressured electric-car manufacturers to seek alternatives.',
  },
  28: {
    overview:
      'Nickel is a silvery transition metal, ferromagnetic and corrosion-resistant. It is part of Earth\'s core alongside iron (about 5%), but its most familiar industrial use is in stainless steels and coins. Together with chromium, it gives stainless steel its stain resistance. It is also central in high-energy-density batteries for electric vehicles.',
    history:
      '17th-century German miners found a reddish ore that seemed to contain copper but yielded no useful metal — they blamed a mischievous demon called "Nickel" (prankster spirit). In 1751, Swedish chemist Axel Fredrik Cronstedt proved it was a new element, keeping the name inherited from mining superstition. It became industrially essential in the late 19th century when nickel metallurgy advanced.',
    properties:
      'Silvery-white metal with a faintly yellowish hue, hard, ductile and malleable. Ferromagnetic up to 358 °C. Melting point: 1,455 °C. Resistant to corrosion by air, water and acids — hence its use in coins. Forms compounds mostly in the +2 and +3 states. A common cause of skin allergy in humans: about 10% of women and 1% of men are allergic to nickel (jewelry, belt buckles, metal buttons).',
    applications:
      'About 70% of nickel is used in stainless steels (especially "304" — 18% Cr, 8% Ni). Coins in several countries contain nickel (pure nickel or cupronickel). Lithium-ion NMC batteries (nickel-manganese-cobalt) are standard in electric cars. Nickel superalloys withstand extreme temperatures in jet turbines and rockets. Electroplating: coating other metals with nickel for corrosion protection.',
    curiosity:
      'The Sudbury region in Canada is one of the world\'s largest nickel sources — and the reason is a meteorite. About 1.85 billion years ago, an asteroid roughly 10 km wide hit what is now Ontario, creating a 200 km diameter crater. The impact brought or concentrated nickel, copper and platinum-group metals in enormous quantities. Today the "Sudbury Basin" produces about 20% of global nickel — meteorite turned into mining fortune.',
  },
  29: {
    overview:
      'Copper is a reddish-orange metal that was the first to be worked by humans — about 10,000 years ago. It combines exceptional electrical conductivity (second only to silver), easy workability, and natural antimicrobial properties. Its alloy with tin forms bronze, lending its name to an entire era of human civilization. It is an essential nutrient for life.',
    history:
      'Worked since 9,000 BCE, well before iron and even before proper bronze. The Bronze Age (around 3,300 BCE) began when humans learned to alloy copper with tin — a combination much harder than any previous metal. Cyprus was a major source — the Latin "cuprum" derives from "Cyprium aes" (metal of Cyprus). Used in coinage since ancient Rome.',
    properties:
      'Red-orange when freshly cut, it darkens within seconds when exposed to air, eventually developing a green patina (basic copper carbonate) over years. It is the second-best electrical conductor after silver and the best thermal conductor among common metals. Malleable, ductile and naturally antimicrobial — bacteria and viruses die on copper surfaces within minutes.',
    applications:
      'About 60% of all extracted copper is used in electrical wires and cables. Residential plumbing, motors, generators and transformers. Alloys: bronze (copper + tin), brass (copper + zinc), cupronickel (coins). Copper roofing in traditional architecture. Antimicrobial surfaces in hospitals (railings, doorknobs). Fundamental in renewable energy — a single wind turbine uses about 5 tons of copper.',
    curiosity:
      'The Statue of Liberty is covered in about 80 tons of copper. Originally it gleamed in a bright copper-brown tone, but within three decades it turned green from natural patina. That green patina, far from being harmful corrosion, actually protects the metal underneath from further damage — that is why copper roofs last centuries.',
  },
  30: {
    overview:
      'Zinc is a blue-gray transition metal, best known as the protective metal in galvanization — coating steel on roofs, cars and structures to prevent rust. Biologically it is the second most abundant metal in the human body (after iron), essential in more than 300 enzymes. It is also the main ingredient in brass, an alloy known since antiquity.',
    history:
      'Zinc compounds like brass (zinc + copper) have been used since 1400 BCE, but the pure metal was only isolated in the 16th century in India and China (already on an industrial scale), and in Europe by Andreas Marggraf in 1746. The German name "zink" (probably from "zinke", prong — a reference to crystal shapes during smelting) caught on. It was essential to the Industrial Revolution through steel galvanization.',
    properties:
      'Blue-silvery metal, relatively soft, brittle at room temperature but malleable between 100-150 °C. Melts at 420 °C (low for a metal). Reacts slowly with water and moist air, forming a layer of basic carbonate that protects the inner metal. In flames it burns with a blue-green flame. Has 5 stable isotopes. Excellent alloy former — bronze, brass and others are compounds of zinc with other metals.',
    applications:
      'Galvanization (coating steel with zinc) is the largest use — protecting steel sheets, screws, corrugated roofs and car frames from corrosion. Brass (copper + zinc) is in faucets, musical instruments, locks and ammunition. Zinc compounds appear in pastes and supplements (zinc oxide for sunburns, zinc gluconate in cold remedies). Carbon-zinc and zinc-air batteries.',
    curiosity:
      'When you take a cold medicine containing zinc, it has a real scientifically proven effect — but only in the first 24 hours of symptoms. Zinc ions bind to proteins that rhinoviruses use to enter cells, blocking viral replication. Studies show about a one-day reduction in cold duration. It does not work for flu (different viruses), despite popular confusion between the two illnesses.',
  },
  31: {
    overview:
      'Gallium is a silvery post-transition metal, famous for a curious property: it melts at 30 °C — it literally melts in the palm of your hand. Although little known outside chemistry, it is in every blue LED, high-efficiency solar panel, and the radio-frequency chips of modern smartphones. It replaced mercury in thermometers and pure gallium is so non-toxic it can even be handled directly with care.',
    history:
      'Predicted by Mendeleev in 1871 as "eka-aluminum" — another of his spectacularly accurate predictions. Discovered experimentally in 1875 by French chemist Paul-Émile Lecoq de Boisbaudran through spectroscopic analysis of zinc minerals. The name comes from Latin "Gallia" (France), Lecoq\'s homeland. Mendeleev had predicted an atomic mass of 68 — Lecoq measured 69.72, within the margin of error.',
    properties:
      'A bluish-silvery, soft metal that melts at just 29.76 °C. Density 5.91 g/cm³. It has the widest liquid-phase range among common elements: melts above room temperature but boils only at 2,204 °C. Like bismuth and silicon, it expands on solidifying (like water). It forms important compounds with nitrogen (GaN) and arsenic (GaAs), high-speed semiconductors.',
    applications:
      'Gallium nitride (GaN) is the basis of blue and white LEDs — the discovery that earned the 2014 Nobel Prize to Akasaki, Amano and Nakamura, revolutionizing efficient lighting. Gallium arsenide (GaAs) is a high-speed semiconductor in radars, 5G phones, space solar panels. Gallium-indium-tin medical thermometers ("galinstan") replaced mercury ones. In metallurgy, traces of gallium lower the melting point of other alloys — hence care needed with gallium near aluminum (it corrodes the structure).',
    curiosity:
      'Classic chemistry prank: give someone a pure gallium spoon to stir hot tea — the spoon melts into the cup. The person freaks out, thinking they broke or contaminated it. Since gallium melts at 30 °C, the heat of the drink (or the hand holding it) is enough to liquefy it. Small quantities are non-toxic if ingested, but the visual of a spoon melting is unforgettable. Videos of the trick have gone viral on social media.',
  },
  32: {
    overview:
      'Germanium is a bright silvery-gray metalloid with chemical properties similar to silicon but with unique electronic characteristics. It was one of the first semiconductors used industrially — the original transistors at Bell Labs in 1947 were made of germanium, not silicon. Today it is central to fiber optics, infrared optics and high-efficiency solar cells, but it is rare and expensive compared to silicon.',
    history:
      'Theoretically predicted by Mendeleev in 1871 (he called it "eka-silicon" before its discovery), and experimentally discovered in 1886 by German chemist Clemens Winkler in the mineral argyrodite. Winkler named it after Germany (Germania, in Latin). Mendeleev\'s prediction got atomic mass, density and oxidation states right with remarkable accuracy — one of the greatest validations of the periodic table.',
    properties:
      'Silvery-gray metalloid, brittle, with metallic luster. It is a semiconductor — conducts electricity better than insulators but worse than metals. Melts at 938 °C. It has high refraction in infrared light, a rare property among common elements. Forms chemical compounds similar to those of silicon and tin (group 14). Has five stable isotopes and occurs in traces in zinc, silver and copper ores.',
    applications:
      'In fiber optics, germanium oxide (GeO₂) is the essential dopant in the fiber core to increase refraction and channel light. Infrared lenses and windows in thermal cameras and military sensors — germanium is transparent in that part of the spectrum. Space solar cells (efficiency > 30%) use germanium layers. Catalysts in PET plastic production (bottles). Detector diodes for radiation in laboratories.',
    curiosity:
      'The first commercial transistors, from the 1950s, were all germanium — including the "transistorized" portable radios that revolutionized music and journalism. But germanium has a problem: it starts conducting current even without signal above 75 °C, generating noise. When silicon (cheaper and more heat-tolerant) was figured out in the 1960s, germanium was nearly abandoned in basic electronics — but it returned in applications where high speed justifies the cost.',
  },
  33: {
    overview:
      'Arsenic is a lustrous gray metalloid, known for centuries as a lethal and cumulative poison — called "the king of poisons and the poison of kings" during the Middle Ages and Renaissance. Ironically, in tiny amounts it is essential for some organisms. Industrially, it appears in special semiconductors, wood preservatives (increasingly banned) and metal alloys.',
    history:
      'Arsenic compounds have been known for over 4,000 years — Egyptians and Greeks used realgar (arsenic sulfide) as a pigment and poison. Alchemist Albertus Magnus isolated the element around 1250. The name comes from Persian "zarnikh" (yellow gold, after orpiment) via Greek "arsenikon". The Borgias, an Italian Renaissance family, gained fame (and power) through arsenic poisonings. Sherlock Holmes and Agatha Christie popularized the image in fiction.',
    properties:
      'A metalloid with two main allotropic forms: gray (metallic, more stable) and yellow (unstable, similar to white phosphorus). Sublimates at 615 °C instead of melting. Brittle when pure. Forms dangerous compounds with hydrogen (arsine, a lethal gas), oxygen (arsenious anhydride, the traditional poison) and sulfur. Chemically similar to phosphorus and antimony, in group 15.',
    applications:
      'Gallium arsenide (GaAs) is an ultra-high-speed semiconductor used in radars, space solar cells and red LEDs. Traditionally used as wood preservative (CCA — copper, chromium, arsenic) for poles and outdoor decks, now banned for residential use in the U.S., EU and Brazil. Historical pesticides and herbicides (now banned). Salvarsan, the first effective syphilis treatment (Paul Ehrlich, 1909), was an organoarsenic. Small additions harden lead alloys in ammunition.',
    curiosity:
      'In 2008, Bangladesh faced the largest mass-poisoning event in history — about 70 million people exposed to naturally arsenic-contaminated well water. International NGOs had helped dig millions of wells in the 1970s-80s to escape contaminated surface water, without testing for arsenic in the subsoil. Decades later, millions of Bangladeshis suffer from cancer, skin lesions and other chronic symptoms. It is called "the greatest unintentional mass poisoning in history".',
  },
  34: {
    overview:
      'Selenium is a dark red to metallic-black non-metal known for a rare combination: it is photoconductive (changes conductivity with light) and essential to life in trace amounts (a critical antioxidant). It became famous through the xerography technology that gave rise to Xerox photocopiers, and today appears in solar panels, red glass and nutritional supplements.',
    history:
      'Discovered in 1817 by Swedish chemist Jöns Jacob Berzelius in residues from sulfuric acid manufacturing. Initially confused with tellurium (from Latin "tellus", earth), Berzelius decided to name it from the Greek "selene" (Moon) — as a poetic counterpart to earthly tellurium. The photoconductive effect of selenium was discovered in 1873, and in 1938 Chester Carlson used it to invent xerography, the basis of all modern photocopiers.',
    properties:
      'A non-metal with several allotropic forms — the most common is metallic gray (a semiconductor). Melts at 221 °C. Its electrical conductivity increases dramatically when exposed to light (photoconductivity), one of the first observed links between light and electrons. In trace amounts it is an essential nutrient: antioxidant enzymes (glutathione peroxidase) depend on it. In excess it is toxic, with symptoms similar to arsenic.',
    applications:
      'CdSe/CdTe solar panels (cadmium-selenium) compete with silicon in efficiency. Red and yellow pigments in glass and ceramics (cadmium ruby). Nutritional supplements for deficiency (especially in regions with selenium-poor soils, like central China). Catalysts in chemical synthesis. In chemical photography, selenium toner converts sepia tones into metallic silver for long-term archival. Photosensitive drums in old photocopiers (now replaced by organic compounds).',
    curiosity:
      'The first commercial photocopier, Xerox 914 (launched in 1959), used a drum of amorphous selenium to hold the image. When exposed to light reflected from a document, the drum\'s bright areas lost electric charge, retaining charge only where the writing was — this charge attracted powdered toner that was then transferred to paper. It was so revolutionary that "Xerox" became a verb: "to xerox". Selenium reigned in photocopier drums for decades before being replaced by cheaper polymers.',
  },
  35: {
    overview:
      'Bromine is the only non-metal element liquid under normal conditions — along with mercury (a metal), it forms the curious club of only two elements liquid at room temperature. It is a dense reddish-brown liquid with toxic orange-yellow vapor and a pungent odor. As a halogen it is extremely reactive and used in flame retardants, agrochemicals and medicines.',
    history:
      'Discovered in 1826 by French chemist Antoine-Jérôme Balard from seaweed — he noticed a red liquid forming when treating salt-extraction residues with chlorine. The name comes from the Greek "bromos" (stench), referring to the unpleasant and penetrating odor of the gas. It was one of the first elements identified by its optical spectrum. Balard was just 23 years old when he made the discovery.',
    properties:
      'Dense reddish-brown liquid (3.1 times the density of water), with toxic orange-yellow vapor already at room temperature. Melts at -7 °C and boils at 59 °C. It is the third most reactive halogen (after fluorine and chlorine). Forms the bromide anion (Br⁻) in ionic compounds. Slightly soluble in water but dissolves well in organic solvents. As a solid, it forms dark brittle crystals.',
    applications:
      'Brominated flame retardants (in electronic plastics, furniture foams, textiles) — though many are being banned due to bioaccumulation. Bromide salts were common sedatives in the 19th and early 20th centuries. Agrochemicals: pesticides and fumigants (methyl bromide, now restricted). In photographic chemistry, silver bromide is the light-sensitive agent in emulsions. Pool additives as an alternative to chlorine.',
    curiosity:
      'Ancient Romans extracted an extremely rare purple pigment — "Tyrian purple" — from small marine snails of the Murex species. About 12,000 snails were needed to produce 1.4 g of dye, and the secret of the chemical compound (a brominated derivative) was only decoded in 1909 by German chemist Paul Friedländer. The color was so expensive that only emperors could wear it — hence the expression "born in the purple" for Roman royalty.',
  },
  36: {
    overview:
      'Krypton is a noble gas, colorless, odorless and chemically inert — the fourth most abundant noble gas in Earth\'s atmosphere, yet still very rare (about 1 ppm). Although its name recalls Superman\'s fictional "kryptonite", real krypton is completely benign — just a gas that glows intense blue-violet in electric discharges. Applications concentrate on lighting and high-precision time measurement.',
    history:
      'Discovered in 1898 by William Ramsay and Morris Travers in London, during fractional distillation of liquid air — the same year they discovered neon and xenon. The name comes from the Greek "kryptos" (hidden), because the substance was "concealed" among other noble gases and only revealed through careful spectral analysis. Superman\'s "kryptonite" was named in 1943 inspired by the word, but it is fictional — unrelated to the real element.',
    properties:
      'Monoatomic noble gas (Kr), colorless and inert under normal conditions, although it forms some compounds under extreme conditions (KrF₂ is stable at low temperature). Liquefies at -153 °C. Has six stable isotopes. When electrically excited, it emits bright blue-violet light with several well-defined spectral lines. The orange-red line of Kr-86 was used from 1960 to 1983 to define the meter as an international standard.',
    applications:
      'Fluorescent lamps and professional photography flashes use krypton to increase brightness and durability. Krypton lasers produce visible light at specific wavelengths for medical and scientific applications. High-performance insulating windows (filled with krypton instead of argon) reduce heat loss by up to 27%. Radioactive leak detectors use Kr-85.',
    curiosity:
      'From 1960 to 1983, the international standard meter was officially defined as 1,650,763.73 wavelengths of the orange-red line of the Kr-86 isotope in vacuum. It was the first definition not based on a physical artifact — previously, the meter was the distance between two marks on a platinum-iridium bar in Paris. Krypton was then replaced by the speed of light as the current reference, but during those decades the gas was literally the ruler of the world.',
  },
  37: {
    overview:
      'Rubidium is a soft, silvery alkali metal, the second of the heavier alkali family — it melts at just 39 °C, melting in a closed hand. It is extremely reactive, but its modern applications concentrate on secondary atomic clocks (cheaper than cesium), quantum physics research, and photoelectric cells. It has a naturally radioactive isotope (Rb-87) used in geological dating.',
    history:
      'Discovered in 1861 by Robert Bunsen and Gustav Kirchhoff through spectroscopic analysis of lepidolite (a lithium mineral), one year after they had discovered cesium with the same technique. The name comes from the Latin "rubidus" (dark red) — for the two characteristic red spectral lines that identified it. It was one of the first successes of spectroscopy as a tool for discovering elements, a technique that revolutionized 19th-century chemistry.',
    properties:
      'Pale silvery alkali metal with a faint golden tone, so soft it can be molded with the fingers. Melts at 39.3 °C (melts in a closed hand). Reacts violently with water and oxygen — stored under mineral oil or vacuum. In flames it emits an intense red-violet color. Has two natural isotopes: Rb-85 (stable, 72%) and Rb-87 (radioactive, 28%, half-life of 49 billion years — three times the age of the universe).',
    applications:
      'Rubidium atomic clocks are a cheaper alternative to cesium ones in GPS, cellular network synchronization, and scientific timing — less precise than cesium but enough for many applications. In specialty glasses and ceramics to reduce thermal conductivity. Photoelectric cells in light sensors. In Bose-Einstein condensates (Nobel 2001) that study quantum phenomena at temperatures near absolute zero. Rb-Sr dating is standard for rocks older than 100 million years.',
    curiosity:
      'Rb-Sr (rubidium-strontium) dating is one of the most accurate techniques for dating ancient rocks — including lunar samples brought by the Apollo missions and Martian rocks in meteorites. Rb-87 decays into Sr-87 with such a long half-life that it is still detectable in rocks formed shortly after the Big Bang. It was this technique that confirmed Earth is 4.54 billion years old — a figure derived directly from rubidium chemistry.',
  },
  38: {
    overview:
      'Strontium is a yellowish-silvery alkaline-earth metal, mainly known for the brilliant red color it gives to fireworks. Its most famous application is in that industry, but it is also used in toothpaste for sensitive teeth (strontium chloride), in magnets, and in geological dating paired with rubidium. In radioactive form (Sr-90) it is one of the most dangerous contaminants in nuclear fallout.',
    history:
      'Discovered in 1790 by Adair Crawford and William Cruickshank in samples of the mineral strontianite collected at Strontian, a small village in Scotland (which gives the element its name). Humphry Davy isolated the metal in 1808 by electrolysis, alongside barium and calcium in the same series of experiments. Strontian is the only village in the world to give its name to a chemical element — a fact local tourists proudly display on signs and t-shirts.',
    properties:
      'Yellowish-silvery soft metal, more reactive than calcium but less than barium. Melts at 777 °C. Density 2.64 g/cm³. In flames it emits an intense crimson-red color — the "fire-engine red" of fireworks. Chemically similar to calcium (it replaces calcium in bones when absorbed). Has four natural stable isotopes and several radioactive ones. Sr-90, a byproduct of nuclear fission, has a half-life of 28.9 years and is particularly dangerous because it accumulates in bones.',
    applications:
      'In pyrotechnics, strontium salts (especially nitrate and carbonate) produce the intense red color — nearly impossible to achieve with other elements. In toothpaste for sensitive teeth (strontium chloride), blocking dentinal tubules. In strontium-ferrite magnets used in speakers and motors. Crystal glass with strontium (replacing lead) in older TV screens. Sr-90 as a heat source in remote thermoelectric generators (Arctic lighthouses).',
    curiosity:
      'After atmospheric nuclear explosions in 1945-1963, Sr-90 from fallout spread globally and was incorporated into the bones of children born then — preserved in the enamel of baby teeth. This fact gave rise to the "Baby Tooth Survey," a 1960s public-health project that collected 320,000 teeth in the U.S. The results pressured President Kennedy into signing the Partial Nuclear Test Ban Treaty in 1963 — a rare case where dental science changed nuclear geopolitics.',
  },
  39: {
    overview:
      'Yttrium is a silvery-gray transition metal, classified among the "rare earths" although it is relatively abundant. Its most famous role was in the red LED of the first colored LEDs (1960s) and in the red phosphors of old CRT TVs. Today it remains strategic in YAG lasers (surgery, welding), high-temperature superconductors, and refractory alloys.',
    history:
      'Discovered in 1794 by Finnish chemist Johan Gadolin in the mineral ytterbite, collected near the small village of Ytterby in Sweden — one of the most chemically fertile localities in history. From that small quarry came four elements with names derived from the village: yttrium (Y), ytterbium (Yb), terbium (Tb) and erbium (Er). It was the first "rare earth" element identified, and marked the start of the long exploration of the lanthanides.',
    properties:
      'Silvery-gray metal with metallic luster, ductile and light for a transition metal (density 4.47 g/cm³). Melts at 1,526 °C. Reasonably stable in air at room temperature, forming a protective oxide layer. Chemically similar to lanthanides. Has only one stable natural isotope (Y-89). Forms important compounds with oxygen (Y₂O₃) and garnets (YAG, YIG) used in lasers and magnetic devices.',
    applications:
      'Yttrium-aluminum garnet (Y₃Al₅O₁₂, "YAG"), doped with neodymium or other elements, is the most widely used crystal in industrial and surgical lasers (Nd:YAG). In phosphors: the red in old CRT TVs came from yttrium oxide doped with europium. YBCO (yttrium-barium-copper) high-temperature superconductors operate at 92 K, above liquid nitrogen. In alloys with aluminum and magnesium it increases mechanical strength. Microwave filters (YIG, yttrium-iron garnet).',
    curiosity:
      'The small Ytterby quarry (about 19 km from Stockholm) is considered the most "chemically fertile" place in the world: it yielded 7 elements discovered between 1794 and 1907 — yttrium, erbium, terbium, ytterbium, holmium, thulium and gadolinium. No other place on the planet has given its name to so many elements. The quarry is now exhausted, but a commemorative plaque stands there, and chemists from around the world make pilgrimage to the site — a kind of "chemical Mecca" of the lanthanides.',
  },
  40: {
    overview:
      'Zirconium is a silvery-gray transition metal, known to the public for "cubic zirconia" gemstones (which imitate diamonds) but strategically vital in nuclear reactors — pure zirconium tubes contain the uranium fuel because they absorb very few neutrons. It also appears in medical implants and chemical equipment because of its exceptional corrosion resistance.',
    history:
      'Zirconium compounds (especially zircon, ZrSiO₄) were known as gems for millennia. The element was identified in 1789 by Martin Heinrich Klaproth while analyzing zircons from Sri Lanka. The name comes from Persian "zargun" (golden color), describing the color of some zircons. The pure metal was only isolated in 1824 by Jöns Jacob Berzelius. The purity needed for nuclear use (separation from hafnium) was only achieved in the 1940s.',
    properties:
      'Silvery-gray metal with metallic luster, ductile. Melts at 1,855 °C. Extraordinarily resistant to corrosion by water, acids and alkalis — forms a very thin, stable oxide layer (ZrO₂). Has extremely low thermal-neutron absorption, a critical property for reactors. Chemically similar to hafnium (they form solid solutions in all proportions), but in nuclear behavior they are opposites: zirconium "lets neutrons pass", hafnium absorbs them.',
    applications:
      'Fuel tubes and cladding in nuclear reactors — the most critical use, with zircaloy alloys (Zr + Sn + Fe + Cr) combining mechanical strength, corrosion resistance and low neutron absorption. Zirconia (ZrO₂) is an impact-resistant ceramic used in knives, dental prosthetics and orthopedic implants. Cubic zirconia is the most convincing diamond imitation in jewelry. Catalysts in refineries. High-refraction optical lenses. Photography flash (zirconium powder burns brightly).',
    curiosity:
      'The Fukushima disaster in 2011 exposed a dangerous side of zirconium: when overheated in contact with steam above 1,200 °C, it reacts producing hydrogen (Zr + 2H₂O → ZrO₂ + 2H₂). It was precisely this reaction that produced the hydrogen which exploded in buildings of reactors 1, 3 and 4 at the Japanese plant after the tsunami. The metal chosen for decades as the symbol of "nuclear safety" turned into a catastrophe vector when cooling systems failed.',
  },
  41: {
    overview:
      'Niobium is a bright gray transition metal, globally rare but of immense strategic importance — Brazil holds about 90% of world reserves. It is essential in high-strength specialty steels (pipelines, automobiles, skyscrapers), low-temperature superconductors, and jet-engine alloys. Its industrial history is full of geopolitics: few countries produce it at scale, giving Brazil unique influence in the global market.',
    history:
      'Discovered in 1801 by English chemist Charles Hatchett from a mineral collected in Connecticut — he initially called it "columbium" (in honor of the U.S., then known as Columbia). For decades confused with tantalum (group 5, very similar properties) until Heinrich Rose proved in 1844 that they were distinct elements. Rose renamed it "niobium" — after Niobe, daughter of Tantalus in Greek mythology — but the U.S. kept using "columbium" until 1949, when IUPAC standardized the name.',
    properties:
      'Bright silvery-gray metal, ductile, with a high melting point (2,477 °C). Density 8.57 g/cm³. Resistant to corrosion thanks to a protective oxide layer. Chemically similar to tantalum. Has two natural isotopes, with stable Nb-93 dominant. Becomes superconducting at very low temperatures (9.3 K), with the highest critical temperature among pure (type I) superconductors.',
    applications:
      'HSLA (High-Strength Low-Alloy) steels — small additions of niobium (0.01-0.1%) produce much stronger steels for pipelines, offshore platforms, civil construction and automobiles. About 90% of world production goes here. Niobium-titanium alloys (Nb-Ti) in superconductors for MRI machines, particle accelerators (LHC at CERN) and nuclear fusion (ITER). Components in jet engines and turbines. Jewelry for being hypoallergenic.',
    curiosity:
      'Brazil produces about 90% of the world\'s niobium, mainly in the state of Minas Gerais. CBMM (Companhia Brasileira de Metalurgia e Mineração) controls most of this production, giving Brazil unique geopolitical influence — without Brazilian niobium, projects like CERN\'s LHC, hospital MRI systems and modern pipelines would face severe difficulties. Despite this, Brazil mostly exports it as raw ferro-niobium alloy (cheap commodity) rather than refined high-value products — a recurring national economic debate.',
  },
  42: {
    overview:
      'Molybdenum is a silvery-gray transition metal with the sixth highest melting point of all elements (2,623 °C). Its main industrial function is to strengthen steels — steels with a little molybdenum resist extreme temperatures and pressures, making them essential in oil refineries, pipelines, jet engines and nuclear reactors. Biologically, it is a cofactor of life-essential enzymes.',
    history:
      'For centuries, molybdenite (MoS₂) was confused with graphite and lead (in Greek "molybdos" means lead). In 1778, Swedish chemist Carl Wilhelm Scheele proved it was a distinct mineral, and Peter Jacob Hjelm isolated the metal in 1781 by reducing molybdenum trioxide. The name — inherited from the historical confusion — was kept. During World War I, the British Mark V tank used molybdenum-steel armor that withstood projectiles which pierced common steel.',
    properties:
      'Silvery-gray metal, hard, with a melting point of 2,623 °C — beaten only by tantalum, tungsten, rhenium, osmium and carbon. Density 10.28 g/cm³. Resistant to corrosion by acids and alkalis under normal conditions. Has multiple oxidation states (+2 to +6). Forms compounds with intense colors ("molybdenum blue" in various products). Like many refractory metals, it evaporates very slowly even near its melting point.',
    applications:
      'About 75% of production goes to specialty steels and alloys — molybdenum steels resist temperature, pressure and corrosion. Stainless 316 steels (with Mo) are used in pharmaceutical and marine equipment. Filaments in high-temperature electric furnaces. Solid molybdenum disulfide (MoS₂) lubricants in motors and machinery. Catalysts in refineries (oil desulfurization). Cofactor in enzymes like nitrogenase (nitrogen fixation in legume roots).',
    curiosity:
      'In 2017, researchers discovered that molybdenum in the primitive Earth\'s crust may have been a key factor for the emergence of complex life. The nitrogenase enzyme, which fixes atmospheric nitrogen into biologically usable forms, depends absolutely on molybdenum. Without molybdenum dissolved in the ancient oceans (about 2 billion years ago), bacteria would not have been able to fix nitrogen on a scale sufficient to sustain complex cells — there would barely be life on the planet as we know it.',
  },
  43: {
    overview:
      'Technetium is the first element created artificially in the laboratory (1937) and the only element without stable isotopes among those with atomic number below 83. It does not exist naturally on Earth — every atom formed in the Big Bang or in supernovas has long since decayed. Its name comes from the Greek "tekhnetos" (artificial). Despite this rarity, Tc-99m is today the most-used radioisotope in nuclear medicine worldwide, present in about 30 million exams per year.',
    history:
      'It was the element that "filled" the famous hole number 43 in Mendeleev\'s periodic table, predicted since 1869 but resistant to every mineral search. Successive "discoveries" were false alarms throughout the 19th and early 20th centuries. Only in 1937 did Carlo Perrier and Emilio Segrè synthesize it in Palermo, Italy, by bombarding molybdenum with deuterons in a cyclotron — Ernest Lawrence sent the sample from Berkeley by mail. It was the first confirmed synthetic element in history.',
    properties:
      'Silvery-gray transition metal, solid at room temperature, with a melting point of 2,157 °C. All 22 known isotopes are radioactive. The most stable (Tc-98) has a half-life of 4.2 million years — long on a human scale but short on a geological scale, hence its absence on Earth. Chemically similar to manganese (above) and rhenium (below) in the periodic table. Forms compounds such as the pertechnetate ion (TcO₄⁻), surprisingly soluble and mobile.',
    applications:
      'Tc-99m (metastable, half-life of 6 hours) is the most-used radioisotope in diagnostic medicine — bone, cardiac, renal and thyroid scintigraphy. Approximately 30 million procedures per year depend on it globally. Produced in generators that extract Tc-99m from the decay of Mo-99 (a nuclear reactor byproduct). In tiny amounts it is a tracer for corrosion studies in industrial pipeline steels. Scientifically, a marker of ancient fission in stars.',
    curiosity:
      'In 1952, astronomer Paul Merrill detected spectral lines of technetium in red giant stars — something impossible if technetium were only an Earth curiosity. The discovery was revolutionary: since Tc-98 has a half-life of only millions of years, its presence in these stars proved that heavy elements are produced INSIDE stars and expelled into space, not just formed at the Big Bang. Technetium was the irrefutable evidence of stellar nucleosynthesis.',
  },
  44: {
    overview:
      'Ruthenium is a hard, silvery-white metal, a member of the platinum group (PGM, platinum group metals). It is extremely rare in Earth\'s crust — one of the scarcest elements — but technologically strategic in computer hard disks, chemical catalysts and electrical contacts. Almost all of these depend on it in tiny but irreplaceable quantities.',
    history:
      'Discovered in 1844 by Russian-Baltic chemist Karl Karlovich Klaus in Kazan, Russia, while analyzing platinum ores from the Urals. The name comes from "Ruthenia", the Latin name for Rus (ancient Russia). Klaus spent years isolating it from the other platinoids — the chemistry of the six elements in the family is so similar that separating them was one of the greatest analytical challenges of the 19th century.',
    properties:
      'Silvery-white metal with strong metallic luster, hard and brittle. Melts at 2,334 °C. Density 12.45 g/cm³. Forms a protective oxide layer that resists corrosion under normal conditions — however ruthenium tetroxide (RuO₄) is volatile, toxic and dangerous. Chemically similar to osmium and iron. Has seven natural stable isotopes. It is a powerful catalyst in many reactions, even in parts-per-million quantities.',
    applications:
      'Catalysts in ammonia production (alternative to iron in the Haber process), in hydrocarbon synthesis (Fischer-Tropsch) and in fuel cells. Recording coatings on modern magnetic hard disks — data density depends on ultra-thin ruthenium films. Resistant electrodes in microelectronics. Platinum alloys (95% Pt + 5% Ru) in jewelry and electrical contacts. In research, ruthenium complexes are light-sensitive dyes for experimental solar cells.',
    curiosity:
      'The presence of ruthenium in European air in October 2017 alarmed scientists — concentrations up to 1,000 times above normal were detected in dozens of countries. Investigations traced the source to a nuclear plant in Russia (Mayak), probably an accident during production of cerium-144 for satellites. Despite the unusual volume, levels were too low to cause public health harm. It was the largest "radioactive ruthenium leak" without an officially acknowledged origin.',
  },
  45: {
    overview:
      'Rhodium is the most expensive metal in the world — often more valuable than gold or platinum, with prices that have exceeded US$ 30,000 per ounce during shortages. It is a bright silvery-white noble metal, known for its absolute corrosion resistance and catalytic properties. Its dominant application is in automotive catalytic converters, where it reduces toxic nitrogen oxides (NOx) to harmless nitrogen.',
    history:
      'Discovered in 1803 by English chemist William Hyde Wollaston from South American platinum ores — the same year he discovered palladium. The name comes from the Greek "rhodon" (rose), for the characteristic rosy colors of its compounds in solution. Wollaston was brilliant at isolating individual platinoids, and his techniques remained industrial foundations for over a century.',
    properties:
      'Silvery-white metal with intense luster (reflectivity higher than silver at certain wavelengths). Melts at 1,964 °C. Density 12.4 g/cm³. Does not react with most acids, including aqua regia under normal conditions (a rare property — usually only gold resists). Forms compounds in varied oxidation states. Excellent catalyst, especially for reactions involving C-H bonds and nitrogen oxides.',
    applications:
      'Automotive catalytic converters consume about 80% of world rhodium production — small quantities reduce NOx emissions in combustion engines, especially gasoline-powered ones. Reflective coatings in jewelry (rhodium plating on silver and white gold for lasting shine) and in scientific mirrors. Resistant electrodes in chemical equipment. Catalyst in nitric acid and acetic acid production. Pure jewelry in extreme luxury pieces.',
    curiosity:
      'In March 2021, the price of rhodium hit a historic peak of US$ 29,800 per ounce — about 17 times the price of gold at the same time. The cause: stricter environmental regulations (especially Euro 6d and China 6) required more rhodium per car to reduce emissions. Combined with mining strikes in South Africa (90% of world production) and the post-pandemic automotive recovery, it created one of the largest precious-metal shortages in modern history. Jewelers temporarily suspended rhodium-plating services.',
  },
  46: {
    overview:
      'Palladium is a silvery-white noble metal of the platinum group, known for a singular property: it absorbs hydrogen like a sponge, up to 900 times its own volume. This makes it fundamental in catalysts, fuel cells and hydrogen-storage technologies. It is also irreplaceable in automotive catalytic converters and increasingly valuable as the auto industry pursues zero emissions.',
    history:
      'Discovered in 1803 by William Hyde Wollaston from raw South American platinum — the same year he discovered rhodium. The name comes from the asteroid Pallas, discovered in 1802 by astronomer Heinrich Olbers — a still-recent honor when Wollaston named the element. Pallas, in turn, comes from the Greek goddess Athena (Pallas Athena). It is one of the few elements whose name honors a celestial body discovered at the time.',
    properties:
      'Bright silvery-white metal, ductile and malleable (more so than platinum). Melts at 1,555 °C. Density 12.02 g/cm³. Has an extraordinary property: at room temperature, it absorbs gaseous hydrogen in quantities equivalent to 900 times its volume — storing the gas in its crystalline structure. Resistant to corrosion by common acids. Forms alloys with gold, silver and platinum widely used in jewelry.',
    applications:
      'Automotive catalytic converters (along with platinum and rhodium) consume about half of world production — palladium is especially effective in gasoline engines. In electronics: reliable electrical contacts in premium connectors, ceramic capacitors and solder layers. Jewelry: "white gold" alloy and hypoallergenic jewelry. Chemical catalysts in pharmaceutical production (Suzuki-Miyaura, Heck, Negishi reactions — all awarded the Nobel Prize in 2010). In dentistry, dental prosthetics.',
    curiosity:
      'In 1989, Stanley Pons and Martin Fleischmann announced they had achieved "cold fusion" — nuclear energy at room temperature — in palladium electrodes absorbing deuterium. The discovery promised an energy revolution and made headlines worldwide. But independent experiments failed to reproduce the result, and within months "cold fusion" was rejected by the scientific community as experimental error. Although discredited, the story lives on — small laboratories still investigate the phenomenon, now called "LENR" (Low Energy Nuclear Reactions).',
  },
  47: {
    overview:
      'Silver is the metal with the highest electrical and thermal conductivity of all elements — second only to gold in malleability among the noble metals. Bright and white when freshly polished, it tarnishes over time by forming sulfides when reacting with sulfur compounds in the air. Used by humans for millennia in coins, jewelry and cutlery, today it is irreplaceable in precision electronics and solar panels.',
    history:
      'Known since antiquity — silver mines in Laurion fueled the Athenian empire, and Spanish silver from the Americas (especially Potosí, in Bolivia) sustained global trade for centuries. The symbol Ag comes from the Latin "argentum", which also gave its name to Argentina due to Spanish silver-seeking in the Río de la Plata region. The word for silver in various Romance languages derives from this same "argentum".',
    properties:
      'Silvery white with the highest metallic luster among all elements. It is the best known electrical and thermal conductor — it is not used more widely in wiring only because copper is hundreds of times cheaper. Extremely malleable and ductile (one gram can be drawn into a 1.8 km wire). It reacts with atmospheric sulfides to form dark silver sulfide — the characteristic "tarnish" of antique silverware.',
    applications:
      'Jewelry, cutlery and traditional coinage. In electronics it is used in high-reliability contacts, solders and conductive pastes. Photovoltaic solar panels depend on silver paste to collect current from the cells. In medicine, silver compounds are powerful antibacterials — used in burn dressings, water filters and medical coatings. Fine mirrors are made with a silver layer applied to glass.',
    curiosity:
      'The ancients knew that food and drink spoiled more slowly in silver containers — without understanding why. Today we know: silver ions destroy the cell membrane of bacteria and viruses. In the American Civil War, soldiers dropped silver coins into water barrels to keep them drinkable. This effect is why modern water filters often have colloidal silver embedded in them.',
  },
  48: {
    overview:
      'Cadmium is a bluish-silvery transition metal known for a duality: useful industrial applications (batteries, pigments) and significant toxicity that justifies growing bans. It shares chemistry with zinc but is much more dangerous — concentrating in kidneys and bones, it can cause chronic kidney disease and cancer. Most countries have already restricted its use in consumer products.',
    history:
      'Discovered in 1817 by Friedrich Stromeyer in Göttingen, Germany, while analyzing zinc oxide samples showing strange behavior. The name comes from the Latin "cadmia" — an old term for zinc ore — derived in turn from "Kadmos", a figure in Greek mythology who discovered zinc deposits near Thebes. It was one of the first metals whose industrial toxicity was systematically documented in the 20th century.',
    properties:
      'Bluish-silvery metal, soft (can be cut with a knife), malleable and ductile. Melts at 321 °C. Density 8.65 g/cm³. Resistant to corrosion in dry air but oxidizes in moist air. Chemically similar to zinc, but with much greater toxicity. In flames it emits an orange-red color. Concentrates in living organisms by bioaccumulation — the higher in the food chain, the more cadmium accumulated.',
    applications:
      'Ni-Cd (nickel-cadmium) batteries were the standard for decades in power tools, toys and cameras before being replaced by lithium-ion. Bright yellow, orange and red pigments (cadmium yellow in Van Gogh and Monet paintings). Anti-corrosion steel coatings (banned in many countries). In CdTe solar panels (cadmium telluride), which compete with silicon in efficiency. In low-melting-point alloys for special solders.',
    curiosity:
      'The most famous cadmium poisoning in history is "Itai-Itai disease" in Japan, identified in the 1950s. Victims — mostly post-menopausal women — suffered bone pain so severe they cried out "itai, itai!" (ouch, ouch!). The cause: zinc/cadmium mining on the Jinzū river contaminated rice grown in the floodplains for decades, and the cadmium accumulated in consumers\' bones and kidneys. The case became a landmark of Japanese and worldwide environmental legislation on industrial pollution.',
  },
  49: {
    overview:
      'Indium is a silvery-gray post-transition metal, soft enough to be cut with a fingernail. Although rare, its most recognizable modern application is in every smartphone, tablet and TV screen: indium-tin oxide (ITO) is the transparent, conducting coating that makes touchscreens work. Without indium, the touchscreen era would not exist as we know it.',
    history:
      'Discovered in 1863 by Ferdinand Reich and Hieronymous Theodor Richter in Freiberg, Germany, using spectroscopy on zinc minerals. The name comes from the characteristic indigo-blue spectral line they identified. For decades it was a laboratory curiosity, and only after World War II did industrial applications begin. The demand explosion came in 1970-2000 with LCD screens and later touchscreens.',
    properties:
      'A bright silvery-white metal, very soft (can be scratched with a fingernail), malleable, with a melting point of just 156 °C. Density 7.31 g/cm³. Forms a protective oxide layer that resists oxidation at room temperature. Emits a "cry" when bent (like tin). Rare but widely distributed — virtually all commercial indium is a byproduct of zinc extraction. Has two natural isotopes, with In-115 being weakly radioactive.',
    applications:
      'Indium-tin oxide (ITO) is the dominant application — transparent conductive coating on LCD, OLED, touchscreens, solar panels and electrochromic windows. Solder in microelectronics (pure indium melts at 156 °C, ideal for sensitive joints). Low-temperature sealing alloys. Reflective mirrors in telescopes (alternative to silver). In semiconductor production (indium arsenide and nitride).',
    curiosity:
      'Global annual indium production is so small (~900 tons in 2024) that critical shortages are predicted by 2050 — and literally every smartphone in the world depends on it. Screen-recycling has become a strategic sector, with some companies extracting indium from discarded LCD panels. Scientists are searching for alternatives (graphene, silver nanowires) but so far none match the combination of transparency, conductivity and durability of ITO.',
  },
  50: {
    overview:
      'Tin is a silvery, soft and ductile post-transition metal, used by humanity for over 5,000 years. Its alloy with copper formed bronze, lending its name to an entire era of civilization. Today it is best known as the protective coating on tin cans, in electronic solders, and in pewter alloys for decorative ware.',
    history:
      'Known since the early Bronze Age (about 3,300 BCE), when it was discovered that adding tin to copper created a much harder metal. The Phoenicians traded tin from Cornwall (England) and ancient Brittany (France). The name "tin" is of Germanic origin, but the symbol Sn comes from the Latin "stannum". It was one of the seven metals known to classical alchemy, alongside gold, silver, copper, mercury, iron and lead.',
    properties:
      'Silvery-white metal, soft, ductile and malleable — it can be hammered into very thin foils. Melts at just 232 °C, low for a metal. Has two allotropic forms: α-tin ("gray tin", powdery, below 13 °C) and β-tin ("white tin", metallic, above 13 °C). Resistant to corrosion by air and water, hence its use in cans. When bent, it emits a characteristic sound called the "tin cry" — due to crystal restructuring.',
    applications:
      'Protective coating on tin cans — a thin layer of tin over steel prevents corrosion from acidic foods. Solder for electronics (originally tin-lead alloy, now pure tin or tin-silver due to health concerns). Bronze (tin + copper), pewter (tin + antimony + copper) for decorative items. Flat glass sheets float on a bath of liquid tin during industrial manufacturing.',
    curiosity:
      '"Tin pest" is a phenomenon in which metallic tin objects turn to gray powder when exposed to intense cold for long periods. Above 13 °C tin is stable (β form), but below this temperature it tends to convert to the brittle α form. During the siege of Stalingrad in 1942, the tin buttons on German soldiers\' uniforms disintegrated in the extreme cold — a real logistical problem that contributed to the troops\' vulnerability.',
  },
  51: {
    overview:
      'Antimony is a lustrous silvery-gray metalloid, known since antiquity — used in Egyptian eyeliner (kohl) and in often-fatal medieval medicines. Today its dominant application is as a flame retardant in plastics, textiles and electronic products: about half of global production goes into formulas that prevent fires. It is brittle, toxic in soluble compounds, and chemically similar to arsenic.',
    history:
      'Known for over 5,000 years in compounds — antimony sulfide (stibnite) was used as eye pigment and makeup in ancient Egypt. The name "antimony" comes from Greek/Latin "antimonium" (disputed origin), and the symbol Sb derives from "stibium". German alchemist Basil Valentine described it in metallic form in the 15th century. It was one of the seven metals known to medieval alchemy, alongside gold, silver, mercury, copper, iron and lead.',
    properties:
      'Lustrous silvery-gray metalloid, brittle — it can be cut but shatters when deformed. Melts at 631 °C. Has a rare property among metals: it expands on solidifying (like bismuth and water). Chemically similar to arsenic and bismuth (group 15). Forms colored sulfides and oxides, and compounds with hydrogen (stibine, a toxic gas). Has two stable isotopes (Sb-121 and Sb-123).',
    applications:
      'Antimony trioxide (Sb₂O₃) is a flame retardant in plastics (PVC, polypropylene), carpets, curtains, furniture foams and children\'s clothing — about 60% of global production. Lead alloys increase hardness in car batteries, solders and ammunition. Catalysts in PET (plastic bottle) manufacturing. Antimony semiconductors in infrared sensors. Historically used in cosmetics (Egyptian kohl) and emetic medicines.',
    curiosity:
      'For centuries, in the Middle Ages and Renaissance, doctors used antimony pills to induce vomiting as a treatment — a practice called "heroic purging". Since antimony is toxic, the pills usually survived the digestive tract intact and could be retrieved, washed and reused indefinitely. Families passed these "perpetual pills" down as heirlooms across generations. Mozart and perhaps Beethoven may have suffered chronic antimony poisoning from the medicines of their era.',
  },
  52: {
    overview:
      'Tellurium is a silvery-white metalloid, rare in Earth\'s crust but with increasingly strategic applications: high-efficiency solar panels (CdTe) represent about 5% of the global photovoltaic market. It is a "shy" element — chemically similar to sulfur and selenium but much less familiar. When absorbed by the body, it gives off a characteristic garlic odor that can persist for weeks.',
    history:
      'Discovered in 1782 by Franz Joseph Müller von Reichenstein in the Alps (in modern-day Romania), in strange gold ores he could not identify. The name came in 1798 from German chemist Martin Heinrich Klaproth, from the Latin "tellus" (Earth) — a name complementary to selenium ("moon") which Berzelius later named. It is one of the rarest elements in Earth\'s crust, even rarer than platinum or gold.',
    properties:
      'Silvery-white metalloid with metallic luster, brittle. Melts at 450 °C. A semiconductor that behaves like a metal in certain crystalline directions. Chemically similar to sulfur and selenium (group 16). Forms tellurium sulfide (TeS₂) and oxides. When absorbed by the body in small doses, it is metabolized into dimethyl telluride, which gives a persistent garlic odor — a telling symptom of exposure.',
    applications:
      'CdTe solar panels (cadmium telluride) compete with silicon in efficiency and cost — manufactured at scale by First Solar. Tellurium alloys with copper and steel improve machinability (easier to cut). Rubber vulcanization (an alternative to sulfur in specific formulas). Special semiconductors in infrared sensors and night vision. Alloy with bismuth in thermoelectric generators (Peltier coolers).',
    curiosity:
      'Workers handling tellurium often suffer from "tellurium garlic breath" — a persistent odor that escapes through breath, skin and sweat, and can last weeks even after minimal exposure. The culprit is dimethyl telluride, a compound the body produces in an attempt to eliminate the metal. At high concentrations the odor is so strong it socially isolates the worker. Historically, some complained that wives refused to sleep in the same bedroom.',
  },
  53: {
    overview:
      'Iodine is a halogen, solid under normal conditions — lustrous dark gray crystals that sublime directly into violet vapor when heated. It is essential for human life: the thyroid gland uses it to produce hormones that regulate metabolism. Its deficiency causes goiter and developmental delays, one reason table salt is iodized in almost every country.',
    history:
      'Discovered in 1811 by French chemist Bernard Courtois, who noticed violet vapor when treating seaweed ashes with sulfuric acid. The name comes from the Greek "iodes" (violet), referring to the vapor color. Joseph Louis Gay-Lussac confirmed it was a new element in 1813. Goiter (enlarged thyroid) was endemic in mountainous regions poor in iodine until 1924, when Switzerland introduced iodized salt — reducing cases by more than 90% in one generation.',
    properties:
      'Dark gray-violet crystalline solid at room temperature, with metallic luster. Melts at 114 °C, but partially sublimes at room temperature, forming toxic violet vapor. It is the least reactive halogen (after astatine). Forms the iodide anion (I⁻) in ionic compounds. Has about 37 isotopes, but only I-127 is stable. I-131 is radioactive, used in nuclear medicine for diagnosis and treatment of thyroid diseases.',
    applications:
      'Iodized salt (NaCl + KI or KIO₃) — a public-health policy that has nearly eliminated goiter in the developed world. Topical antiseptic ("povidone-iodine" in clinics and bandages). Medical diagnostics: iodinated contrasts in X-rays and CT scans. Radioactive I-131 in radiotherapy for thyroid cancer. In organic chemistry, iodinated reagents are fundamental in synthesizing medicines and dyes. Iodine halogen lamps (brighter than common incandescent).',
    curiosity:
      'After nuclear accidents like Chernobyl (1986) and Fukushima (2011), authorities distribute potassium iodide (KI) tablets to the nearby population. The logic is simple: by saturating the thyroid with non-radioactive iodine, it rejects the radioactive iodine released by damaged reactors, preventing thyroid cancer. It is the only effective measure against iodine radioactive contamination — and it is time-limited: it must be taken within the first hours after exposure.',
  },
  54: {
    overview:
      'Xenon is a dense and extremely rare noble gas in the atmosphere (only 0.087 ppm), but with unique properties that justify premium applications — from luxury-car headlights to ion thrusters on space probes. It was the first noble gas humanity managed to make react with other elements (in 1962), overturning the dogma that "noble gases are inert". Despite the name (Greek for "stranger"), it is present in any environment containing air.',
    history:
      'Discovered in 1898 by William Ramsay and Morris Travers, alongside krypton and neon, in fractional distillation of liquid air. The name comes from the Greek "xenos" (stranger), due to its rarity — Ramsay considered it "the stranger gas" among the components of air. In 1962, Neil Bartlett managed for the first time to make a noble gas react, producing XePtF₆ — a discovery that rewrote textbooks and opened the field of noble-gas chemistry.',
    properties:
      'Monoatomic gas (Xe), colorless and odorless, with a density 4.5 times that of air. Liquefies at -108 °C. Forms compounds with fluorine and oxygen under extreme conditions (XeF₂, XeF₄, XeO₃). Has nine stable isotopes. When electrically excited, it emits a bright bluish-white light with a broad continuous spectrum — hence its use in lamps that mimic sunlight. Its density is such that submerging the head in pure xenon would cause rapid suffocation.',
    applications:
      'High-intensity discharge headlights (HID, "xenon") in luxury automobiles use electric arcs in xenon to produce bright sunlight-like light. Flash lamps in professional cameras and stroboscopes. General anesthetic in medicine (expensive, but with an excellent safety profile). Fuel in ion thrusters on space probes (Dawn, BepiColombo) — ionized and electromagnetically accelerated produces highly efficient thrust. Positron emission tomography uses Xe-129.',
    curiosity:
      'NASA\'s Dawn probe, launched in 2007, traveled more than 5.6 billion kilometers visiting the asteroids Vesta and Ceres — using only 425 kg of xenon as ion propellant. For comparison, a chemical rocket would need tons of fuel for the same journey. The ion engines accelerate ionized xenon atoms to 145,000 km/h, generating tiny but constant thrust for months — space\'s "time equals distance" tradeoff.',
  },
  55: {
    overview:
      'Cesium is a silvery-gold alkali metal, the most reactive among the common metals — it melts almost at body temperature (28 °C) and explodes on contact with water with a violet flame. Its main application is not industrial but scientific: it is the "metronome" that defines the second in the International System. Every atomic clock in the world is calibrated by the frequency of a quantum transition in the cesium atom.',
    history:
      'Discovered in 1860 by Robert Bunsen and Gustav Kirchhoff in German mineral waters, using the then-new technique of spectroscopy that the same scientists had invented. The sky-blue spectral lines gave it its name — from Latin "caesius" (sky-blue). It was the first element discovered by spectroscopic analysis, even before being physically isolated. Bunsen and Kirchhoff also discovered rubidium the following year using the same technique.',
    properties:
      'A soft gold-silvery metal (can be cut with a knife), so reactive that it oxidizes in microseconds in air and explodes violently in water. Melts at just 28 °C — it melts in the palm of your hand. Density 1.93 g/cm³. In flames it emits an intense blue-violet color. Stored in vacuum-sealed ampoules. It has the largest atomic radius among all stable elements. Cs-137, a radioactive isotope and byproduct of nuclear fission, is one of the most dangerous contaminants in nuclear accidents.',
    applications:
      'International standard for the second: 1 second = 9,192,631,770 cycles of the radiation emitted by a specific transition in the Cs-133 atom. Every GPS, internet, bank transaction and industrial synchronization depends on this measurement. Catalysts in chemical production. In oil prospecting, cesium formate (CsHCOO) is a dense, non-corrosive drilling fluid. In photocells and infrared detectors (CsI). Cs-137 in radiotherapy (gradually replaced by accelerators).',
    curiosity:
      'In 1987, in the city of Goiânia, Brazil, one of the worst civilian radioactive accidents in history occurred: scrap-metal dealers opened an abandoned cesium-137 chloride capsule used in radiotherapy, scattering bright blue powder across entire neighborhoods. Children played with the "glow", adults rubbed the powder on their bodies thinking it was magical. The result: 4 direct deaths, more than 250 people contaminated, and entire neighborhoods had to be demolished. It was one of the first cases to enter the IAEA\'s INES scale.',
  },
  56: {
    overview:
      'Barium is a silvery, dense, highly reactive alkaline-earth metal. In its sulfate form (BaSO₄) it is the famous "contrast medium" used in digestive-tract X-ray exams — the dense, insoluble substance that appears bright white in radiographs. In other compounds it is toxic, but the sulfate is so insoluble it passes through the body intact. In fireworks it produces the characteristic green color.',
    history:
      'Barium compounds (especially sulfate and carbonate) were known since antiquity. In 1602, an Italian shoemaker noticed that stones from Bologna glowed in the dark after being heated — they were barium sulfate crystals with impurities (the "phosphorescent Bologna stone"). Carl Wilhelm Scheele identified barium oxide in 1774, and Humphry Davy isolated the metal in 1808 by electrolysis. The name comes from the Greek "barys" (heavy), for the high density of the minerals.',
    properties:
      'Soft silvery-white metal, but so reactive it oxidizes quickly in air and reacts violently with water. Melts at 727 °C. Density 3.51 g/cm³ — high among alkaline-earth metals. In flames it emits a characteristic yellow-green color. Soluble compounds (chloride, nitrate) are extremely toxic — they interfere with nerve and cardiac conduction. Barium sulfate (BaSO₄) is practically insoluble — hence its safe medical use.',
    applications:
      'Barium sulfate in medicine: the white "contrast medium" swallowed before stomach and bowel X-rays. In fireworks, barium salts produce the characteristic green color. In oil wells, barite drilling mud (natural BaSO₄) controls pressure and stabilizes the borehole. White pigments (lithopone). Chemical catalysts. In photosensitive material for X-ray tubes.',
    curiosity:
      'The famous 17th-century "Bologna stone" was one of the first phosphorescent substances ever discovered — it glowed in the dark after exposure to light. For decades alchemists tried to unravel the magic, without success. Today we know: it was barium sulfate (BaSO₄) with traces of copper, and the phosphorescence came from the impurities, not from the barium. Even so, it was scientifically crucial: the Bologna stone inspired the first systematic studies of light emission in solids, centuries before quantum physics.',
  },
  57: {
    overview:
      'Lanthanum is the first element in the lanthanide series — the "rare earths" of the f-block. Despite its name, it is not particularly rare: it is more abundant in the crust than lead or mercury. Its chemical properties are so similar to other lanthanides that historically they were considered inseparable "twin brothers". Today it is used in hybrid batteries, fluid catalysts in refineries, and in premium optical lenses.',
    history:
      'Discovered in 1839 by Swedish chemist Carl Gustaf Mosander while treating cerium nitrate with dilute nitric acid. Mosander noticed that part of the material reacted differently — there was an element "hidden" in cerium. The name comes from the Greek "lanthanein" (to lie hidden), referring precisely to that discovery. Mosander was a pioneer in separating individual lanthanides, also isolating terbium and erbium in the same research phase.',
    properties:
      'Soft silvery-white metal, malleable and ductile. Melts at 920 °C. Density 6.15 g/cm³. Oxidizes rapidly in moist air, forming a yellow-greenish layer. Reacts with hot water releasing hydrogen. It is the first f-block element — its chemistry defines the standard behavior of lanthanides. Nearly impossible to separate from other lanthanides without modern chromatography, due to nearly identical chemistry.',
    applications:
      'Negative electrodes in nickel-metal hydride (NiMH) batteries — the batteries in Toyota Prius hybrids and older cell phones. Fluid catalytic cracking (FCC) catalysts in oil refineries: about 30% of world use goes to "cracking" heavy oil fractions into gasoline. High-refraction glass for premium optical lenses (binoculars, cameras). Lighter flints (mischmetal — alloy of lanthanum, cerium and others).',
    curiosity:
      'A kilogram of pure lanthanum powder in contact with water releases enough energy to cause spontaneous fire. For this reason, metallic lanthanum is stored submerged in mineral oil or in vacuum glass ampoules. But that same "danger" became the basis of a useful application: lighter flints made of mischmetal (cerium-lanthanum-iron alloy) spark when struck, producing the flame that has lit cigarettes and gas stoves for over a century.',
  },
  58: {
    overview:
      'Cerium is the most abundant of all lanthanides — more common in the crust than copper. It was the first lanthanide discovered and the only one that forms stable compounds in the +4 oxidation state, a property that makes it a unique catalyst. It appears in automotive catalytic converters, polishing of optical glass, lighter flints and refinery catalytic fluids.',
    history:
      'Discovered in 1803 simultaneously by two independent groups: Jöns Jacob Berzelius and Wilhelm Hisinger in Sweden, and Martin Heinrich Klaproth in Germany. The name comes from the asteroid Ceres (discovered in 1801 by Giuseppe Piazzi) — astronomy influencing chemistry, the pattern of the era. It was among the first lanthanides isolated, but only in 1875 did American William Hillebrand obtain pure metallic cerium by electrolysis.',
    properties:
      'Silvery-white metal, ductile and relatively soft. Melts at 798 °C. Density 6.77 g/cm³. Oxidizes very rapidly in air and can even burn spontaneously when scratched. It has a unique property among lanthanides: it forms the stable Ce⁴⁺ ion (not just the typical Ce³⁺), making it a powerful oxidant in analytical chemistry. Pyrophoric — discharges of cerium particles can ignite.',
    applications:
      'Automotive catalytic converters contain cerium oxide (CeO₂), which stores and releases oxygen to optimize combustion and reduce emissions. Optical glass polishing: cerium oxide ("jeweler\'s rouge") is the standard agent for fine polishing of lenses and screens. Mischmetal lighter flints (50% cerium + 25% lanthanum + others). Fluid catalytic cracking in oil refineries. UV-blocking glass (LCD, eyewear).',
    curiosity:
      'When a lighter flint scrapes against metal, what produces the spark is not ordinary friction: it is microscopic cerium particles that spontaneously ignite when exposed to air — a pyrophoric reaction. Metallic cerium is so reactive that powder particles can ignite simply by contact with oxygen at room temperature. It is this peculiar chemistry — discovered over a century ago — that makes lighters work to this day.',
  },
  59: {
    overview:
      'Praseodymium is a silvery, soft and malleable lanthanide whose salts form a characteristic yellow-green solution — hence its name, "green twin" in Greek. Although little known outside industry, it shows up in high-performance magnets, special glass lenses for welders, and alloys ranging from aircraft engines to lighter flints.',
    history:
      'For decades, chemists believed they had isolated a single element called "didymium" from cerite ore. In 1885, the Austrian Carl Auer von Welsbach showed that didymium was in fact a mixture of two new elements — separating them by exhaustive fractional crystallization and naming them praseodymium ("green twin") and neodymium ("new twin"). It was one of the most difficult separations of 19th-century chemistry and demonstrated the almost brutal similarity between neighboring lanthanides.',
    properties:
      'Silvery-yellow metal, soft enough to be cut with a knife, density 6.77 g/cm³, melts at 931 °C. In air it forms a green oxide layer that flakes off, exposing fresh metal — so it is stored under mineral oil. Its Pr³⁺ ions in solution have a distinctive light green color. It is paramagnetic at all temperatures above 1 K.',
    applications:
      'Alloyed with magnesium it produces lightweight, strong components for aircraft engines. Didymium glass (a Pr+Nd mix) is used in goggles for welders and glassblowers because it selectively absorbs the yellow sodium light without darkening overall vision. Small additions of praseodymium in Nd-Fe-B magnets (in electric cars and wind turbines) increase coercivity. Canary-yellow ceramic pigments (PrZrSiO₄) color tiles and tableware.',
    curiosity:
      'Glassblowers have a classic problem: the sodium flame of the torch emits a yellow so intense that it dazzles the eye and masks the precise moment when molten glass starts to collapse. Didymium lenses solve this elegantly — praseodymium absorbs that specific band of the spectrum and nothing else, leaving the glass visible in its true color. It is a band filter so precise that no synthetic rare-earth-free glass has yet matched it.',
  },
  60: {
    overview:
      'Neodymium is a silvery-white lanthanide metal, a member of the so-called "rare earths". Its most famous application is the strongest permanent magnets known to humanity — neodymium magnets (NdFeB) are so powerful that small discs can support many times their own weight. They are in electric motors, headphones, speakers, hospital MRIs and wind turbines. China dominates over 85% of world production.',
    history:
      'Discovered in 1885 by Austrian chemist Carl Auer von Welsbach by separating "didymium" — a mixture that had been considered a single element since 1841. Auer showed that didymium was actually a combination of two distinct elements, which he named: praseodymium (from Greek "prasios didymos", green twin) and neodymium (from Greek "neos didymos", new twin). The discovery paved the way for systematic separation of the lanthanides, considered "twin elements" because of their nearly identical chemistry.',
    properties:
      'Silvery-yellowish lanthanide metal, oxidizes in air forming a yellow-green oxide layer. Melts at 1,024 °C. Density 7.01 g/cm³. Has extraordinary magnetic properties when alloyed with iron and boron (Nd₂Fe₁₄B) — the basis of neodymium magnets. Forms colored compounds: oxide (Nd₂O₃) is gray-blue; salts vary from pink to violet. Has seven stable isotopes. In flames it emits a pink-yellowish color.',
    applications:
      'Neodymium magnets (Nd₂Fe₁₄B) are the dominant application — the world\'s strongest, with strength up to 1.4 tesla, used in electric-car motors, wind turbines, headphone speakers, hard disks, hospital MRIs and generators. Nd:YAG lasers (crystal doped with neodymium) in eye surgery, industrial marking and military weapons. Pink-violet pigments in glass and ceramics. Light filters in welding (neodymium glass blocks infrared).',
    curiosity:
      'In 2010, China cut rare-earth exports (including neodymium) to Japan during a diplomatic dispute over the Senkaku/Diaoyu Islands. The impact was immediate: neodymium prices quadrupled in months, and the world\'s auto and wind-turbine industries panicked. This episode accelerated the search for alternative mines in Australia, the US, Brazil and Africa, but to this day China processes about 90% of refined lanthanides — a near-monopoly that sets the pace of the global energy transition.',
  },
  61: {
    overview:
      'Promethium is the only radioactive lanthanide and the only element in the periodic table between hydrogen and uranium that is essentially synthetic — there are no exploitable deposits in the Earth\'s crust. It was named after Prometheus, the Greek titan who stole fire from the gods, reflecting the drama of an "absent" element that was only confirmed after decades of fruitless searching.',
    history:
      'Several chemists in the early 20th century announced they had discovered element 61, but none of the claims held up under review. Only in 1945, at Oak Ridge National Laboratory (part of the Manhattan Project), did Jacob Marinsky, Lawrence Glendenin and Charles Coryell isolate it from uranium fission products in a reactor. They only announced the feat in 1947, after the Second World War. The name came from Coryell\'s wife Grace, alluding to the dangers of "playing with nuclear fire".',
    properties:
      'Silvery-white metal, dense (7.26 g/cm³), melts at 1,042 °C. All 38 known isotopes are radioactive — the most stable, Pm-145, has a half-life of 17.7 years. Pm-147 (half-life 2.62 years) is the most commonly used in the lab. In pure quantities, it glows faintly blue-green due to its own radiation ionizing the air — the glow is not from a phosphor but from the metal itself.',
    applications:
      'Pm-147 powers miniature nuclear batteries used in older pacemakers, satellites and space instruments — converting beta radiation to electricity via phosphors and photovoltaic cells. It has been used in luminescent paints for watch dials and military instruments (replacing the more dangerous radium). Calibrated beta-ray source in thickness gauges for paper and plastic industries. Few other uses given its cost and radioactivity.',
    curiosity:
      'The total quantity of promethium that exists naturally in the Earth\'s crust at any given time is estimated at less than 600 grams — formed by ultra-rare spontaneous fission in uranium deposits. Everything used industrially is produced artificially in nuclear reactors. It is the rarest element in the periodic table below uranium: if you could collect all the promethium on Earth, it would fit in a single coffee mug.',
  },
  62: {
    overview:
      'Samarium is a silvery-yellowish lanthanide metal, best known for its samarium-cobalt (SmCo) permanent magnets — second in strength only to neodymium magnets, but with a decisive advantage: they retain magnetism up to 350 °C, versus only 80 °C for neodymium. They are therefore used in military aircraft motors, satellites, and medical equipment where high temperatures destroy other magnets.',
    history:
      'Discovered in 1879 by French chemist Paul Émile Lecoq de Boisbaudran (the same one who discovered gallium) in the mineral samarskite — hence the name. Samarskite was named in honor of Russian engineer Vasili Samarsky-Bykhovets, who collected samples in Kazakhstan in 1847. Samarium was thus the first element in history indirectly named after a living person (though via the mineral name, not directly).',
    properties:
      'Silvery-yellowish lanthanide metal, moderately soft, oxidizes in air forming a protective yellow layer. Melts at 1,072 °C. Density 7.52 g/cm³. Has 7 natural isotopes — three of which are alpha-radioactive with such long half-lives (Sm-147 = 106 billion years) that they are treated as stable for practical purposes. Forms pale pink colored compounds. In flames it emits a pale yellow color.',
    applications:
      'Samarium-cobalt magnets (SmCo₅ and Sm₂Co₁₇) are standard in high-temperature applications: military aircraft motors, satellites, medical equipment in hostile environments. Catalyst in industrial chemical reactions. In nuclear reactors as a neutron poison in control rods. In specialized lasers. High-refraction optical lenses with samarium-doped glass absorb infrared.',
    curiosity:
      'Samarium-neodymium (Sm-Nd) dating is one of the most accurate techniques for dating rocks over 1 billion years old. Sm-147 decays into Nd-143 with such a long half-life that the Nd/Sm ratio in rocks can reveal the exact age of formation. Scientists used this technique on lunar rocks brought by Apollo, determining that the Moon is 4.42 billion years old — younger than Earth by about 100 million years, consistent with the giant-impact theory.',
  },
  63: {
    overview:
      'Europium is a pale silvery lanthanide metal, best known as the "red color element" in screens — europium phosphors produce the bright red in LCD/CRT screens, OLED TVs and white fluorescent lamps. It is also the invisible anti-counterfeiting marker in euro banknotes: shine ultraviolet light on a bill and you will see yellow-green fluorescence patterns from europium.',
    history:
      'Its existence was suspected for decades but resisted isolation — confused with samarium and gadolinium in mixed samples. It was finally identified in 1896 by French chemist Eugène-Anatole Demarçay, who proved it was a distinct element via spectroscopy. The name honors Europe, partly as a counterpoint to samarium (Russian honor) and gadolinium (honoring the Finn Gadolin). It was isolated in pure form in 1901.',
    properties:
      'Pale silvery lanthanide metal, the most reactive of all lanthanides — it oxidizes and reacts with water almost as quickly as calcium. Melts at 822 °C. Density 5.24 g/cm³ — the lowest among lanthanides. Has two natural isotopes (Eu-151 and Eu-153). It is the only lanthanide whose +2 state compounds are stable in water (an interesting anomaly). Has a high neutron-capture cross section.',
    applications:
      'Color phosphors: europium-doped yttrium oxide (Y₂O₃:Eu) produces the bright red in old CRT TVs. Today, europium in barium-magnesium fluoride gives the red in white LEDs and fluorescent lamps. Anti-counterfeiting: euro banknotes contain europium fluorescent markers that glow under UV in specific patterns. In nuclear reactors as a neutron poison. In specialized lasers of specific wavelength.',
    curiosity:
      'Euro banknotes were carefully designed with europium precisely because the element has very specific fluorescence that is hard to imitate. Each bill has patterns printed with europium ink that glow yellow-green under UV light. European central banks can detect counterfeits by analyzing the fluorescence spectrum: even counterfeits with similar pigments have spectral signatures different from pure europium. It is one of the most subtle and effective security systems in any currency in the world.',
  },
  64: {
    overview:
      'Gadolinium is the lantanide with the highest known neutron-capture ability — any thermal neutron passing nearby is absorbed with almost magical greed. This makes it useful in nuclear reactor control rods and in MRI contrast agents, where it literally lights up tumors in the human body. It is also the "strangest" ferromagnetic element in the table: it becomes magnetic only at low temperatures, near freezing.',
    history:
      'Isolated in 1880 by the Swiss Jean Charles Galissard de Marignac from samarskite ore, but only obtained in pure form in 1886 by Paul Émile Lecoq de Boisbaudran. It was named in honor of the Finnish chemist Johan Gadolin, who in 1794 identified the first rare-earth mineral (gadolinite) in a mine near Ytterby, Sweden — the starting point of all lanthanide chemistry.',
    properties:
      'Silvery-white metal, malleable and ductile, density 7.9 g/cm³, melts at 1,313 °C. It is ferromagnetic below 19 °C (Curie point) — loses magnetism on a warm day. It has the largest thermal neutron capture cross-section of any stable element (about 49,000 barns for Gd-157, versus 600 for boron). It shows the strongest known magnetocaloric effect near room temperature: heats up when magnetized, cools down when demagnetized.',
    applications:
      'MRI contrast agents (gadolinium chelated with EDTA or DTPA) highlight blood vessels, tumors and inflammations — used in millions of scans per year. Control rods and burnable poisons in nuclear reactors regulate the chain reaction. Research into gasless magnetocaloric refrigerators — more efficient and quieter cooling, still pre-commercial. Green phosphors in screens and in X-ray intensifying screens enhance brightness.',
    curiosity:
      'The gadolinium injected into patients for MRI is highly toxic in its free form — Gd³⁺ has an ionic radius close to that of calcium and blocks cellular channels. The trick is wrapping it in organic chelators that make it inert and excretable by the kidneys within hours. In patients with severely reduced kidney function, these agents can accumulate and cause a rare disease called nephrogenic systemic fibrosis — discovered only in 2006, and which changed hospital protocols worldwide.',
  },
  65: {
    overview:
      'Terbium is an unassuming silvery lanthanide, but indispensable: it produces the green color of the screens we look at every day and the magnetism of alloys that deform under a magnetic field — the basis of modern submarine sonars and precision actuators. It is also one of the four elements named after the tiny Swedish village of Ytterby, along with yttrium, erbium and ytterbium.',
    history:
      'Discovered in 1843 by the Swedish chemist Carl Gustaf Mosander while analyzing the "yttria" extracted from minerals of Ytterby. Mosander showed that what was believed to be a single oxide was actually three fractions with different properties — yellow, pink and white earths. The name came directly from the village of Ytterby (along with yttrium, erbium and ytterbium), probably the largest naming tribute any place has ever received from the periodic table.',
    properties:
      'Silvery-gray metal, ductile and moderately reactive — oxidizes slowly in air. Density 8.23 g/cm³, melts at 1,356 °C. Tb³⁺ compounds emit bright green light when excited by UV or X-rays — the basis of display phosphors. The Terfenol-D alloy (Tb-Dy-Fe) has the highest magnetostriction at room temperature of any known material: changes length by up to 0.2% when placed in a magnetic field.',
    applications:
      'Green phosphors in compact fluorescent lamps and LED screens are indispensable to produce pure green color. Terfenol-D in naval sonars, underwater loudspeakers and micrometer actuators for precision industry. Small doses in Nd-Fe-B magnets increase thermal resistance — crucial for electric-car motors. Medical X-ray detectors and solid oxide fuel cells.',
    curiosity:
      'The village of Ytterby, on the island of Resarö (near Stockholm), now has about 800 residents and a small museum — but it is the most "productive" place in the world in terms of chemical element discoveries. Four elements are named directly after it (Y, Tb, Er, Yb), and the nearby mine also yielded four others discovered there (Ho, Tm, Sc, Gd). No other geographic point on the planet gives its name to so many points of the periodic table.',
  },
  66: {
    overview:
      'Dysprosium is a silvery lanthanide whose name in Greek means "hard to get" — fitting, since separating it from chemical neighbors is particularly laborious. Today, it is one of the most geopolitically sensitive elements in the world: without it, neodymium magnets in electric car motors and wind turbines lose strength at high temperatures. China controls more than 95% of production, making dysprosium a critical chokepoint in the energy transition.',
    history:
      'Discovered in 1886 by the Frenchman Paul Émile Lecoq de Boisbaudran after more than 30 successive fractional crystallizations — an extraordinary amount even for the chemistry of the period. Frustrated by the difficulty, he named it from the Greek "dysprositos" (hard to get). It was only isolated in pure metallic form in 1950, using modern ion-exchange techniques. Until then, all applications used oxides or mixtures.',
    properties:
      'Silvery-white soft metal, dense (8.55 g/cm³), melts at 1,407 °C. Has one of the largest known atomic magnetic moments. Retains magnetic properties even at moderately high temperatures — exactly where neodymium fails. Forms a dark oxide layer in air. Reacts slowly with cold water, rapidly with hot water. Has seven stable natural isotopes.',
    applications:
      'Essential additive in high-performance Nd-Fe-B magnets — between 1% and 6% dysprosium keeps the magnet magnetized at 200 °C, a typical condition inside electric motors. Each electric vehicle carries about 100 g of dysprosium; each offshore wind turbine, several kilograms. Control rods in nuclear reactors (high neutron absorption). Thermoluminescent dosimeters. Infrared lasers with dysprosium fluoride.',
    curiosity:
      'Without dysprosium, the entire global plan to transition to electric cars faces a non-negotiable physical bottleneck. The US, EU and Japan classify it as a "critical element" — strategic material on lists equivalent to those for oil during the Cold War. In 2010, during a China–Japan diplomatic crisis, the price of dysprosium multiplied 20-fold in months. It is perhaps the only element that defense ministers and automaker CEOs regularly talk about.',
  },
  67: {
    overview:
      'Holmium has the most extreme magnetic property in the periodic table: no other stable element has such a high atomic magnetic moment. Despite this, it is mostly used far from magnets — its most visible application is the Ho:YAG surgical laser, which pulverizes kidney stones without cutting the patient. It is named after the city of Stockholm (Holmia in Latin).',
    history:
      'Identified in 1878 simultaneously by Marc Delafontaine and Jacques-Louis Soret in Geneva (who called it "element X"), and independently in 1879 by the Swedish Per Teodor Cleve, in Uppsala. Cleve, who was able to isolate more material, was credited with the naming and chose "holmium" as a veiled reference to Stockholm, his hometown. Pure holmium was only obtained in 1911 — decades after the discovery.',
    properties:
      'Silvery-white, soft and malleable metal, density 8.79 g/cm³, melts at 1,461 °C. Has the largest atomic magnetic moment of any naturally occurring element — the basis of research electromagnets generating the most intense fields in the world. In solid compounds it exhibits complex magnetic orders such as magnetic helices that change direction with temperature. Solutions of Ho³⁺ have a yellow-pink color.',
    applications:
      'Magnetic pole pieces in research electromagnets (fields above 4 T) for ultra-high-energy physics experiments. Ho:YAG (holmium-doped yttrium-aluminum garnet) lasers in urology — vaporize kidney stones and treat prostate hyperplasia without open surgery. Similar lasers in dentistry and dermatology. Control rods in nuclear reactors. Calibration standard for UV-visible spectrophotometers.',
    curiosity:
      'The Ho:YAG laser revolutionized urology in the 1990s: it emits at 2,100 nm, a wavelength strongly absorbed by water. Since kidney stones are bathed in water from surrounding tissue, energy is deposited precisely on the stone, breaking it into powder without burning adjacent tissue. Before this laser, patients with large stones required surgery. Today the treatment is outpatient, with a flexible scope introduced through the urethra.',
  },
  68: {
    overview:
      'Erbium is the element that makes the internet work between continents. Without it, optical signals in submarine fibers would fade after a few hundred kilometers. Erbium-doped fiber amplifiers (EDFAs) regenerate light pulses every few dozen kilometers in the depths of the ocean — the invisible backbone of intercontinental data traffic.',
    history:
      'Discovered in 1842 by Carl Gustaf Mosander, in the same work that also separated terbium. The name comes once again from Ytterby — the Swedish village that yielded four elements. Curiously, in the original nomenclature, erbium and terbium had their names swapped at some point in the 19th century due to confusion between laboratories — the current names were arbitrarily fixed after no one could reconstruct which element Mosander had originally called what.',
    properties:
      'Silvery-white metal, ductile and relatively stable in air, density 9.07 g/cm³, melts at 1,529 °C. Er³⁺ ions in solution have a distinctive light-pink color. The most commercially important property: Er³⁺ has an electronic transition at 1,530 nm — exactly the lowest-attenuation window for silica optical fibers. When pumped by 980 nm light, it emits coherently in this telecommunications band.',
    applications:
      'Erbium-doped fiber amplifiers (EDFAs) in submarine and terrestrial fiber networks — there is no economic alternative for optical amplification at 1,550 nm. Pink pigment in glasses and porcelains (cadmium-free, environmentally preferred). Er:YAG lasers in dentistry (cut enamel without heating) and dermatological surgery (ablative skin rejuvenation). Optical filters in welder protective goggles.',
    curiosity:
      'Every few kilometers in the depths of the oceans, inside the submarine cable, there is a section containing a few meters of fiber doped with erbium atoms. When the weakened signal arrives, pump lasers installed there excite the erbium, which returns the energy to the signal — amplifying it coherently without having to convert to electricity and back. This trick, invented in 1986, is the reason intercontinental internet traffic is feasible and cheap.',
  },
  69: {
    overview:
      'Thulium is the second rarest lanthanide (after promethium) and one of the most expensive elements in the periodic table — often worth more than gold by weight. Despite this, it has found valuable niches: portable X-ray devices for field inspection (with no electricity required), surgical lasers and high-precision oscillating crystals. Its name comes from Thule, the mythical northern land in classical geography.',
    history:
      'Discovered in 1879 by the Swede Per Teodor Cleve, who separated it from erbium oxides. Cleve named it in reference to Thule, a legendary place cited by Greek and Roman geographers as the "end of the world" in the North Atlantic — probably Iceland or Norway. It was a poetic way to mark the remote and elusive character of the element. Pure thulium was only obtained in 1911, three decades later.',
    properties:
      'Silvery-gray metal, soft, malleable and quite reactive — oxidizes in air and reacts slowly with cold water, density 9.32 g/cm³. Melts at 1,545 °C. Has only one stable isotope (Tm-169), which makes it unusual among lanthanides. Tm-170 (artificial, half-life 128 days) emits medium-energy gamma rays on decay — precisely the useful range for industrial radiography.',
    applications:
      'Tm-170 in portable X-ray sources for industrial radiography in remote locations without electricity (inspection of welds in pipelines, aerospace parts). Thulium lasers (Tm:YAG, doped fibers) emit at 2,000 nm for urological surgery and soft tissue ablation. Research on qubits for quantum computing using trapped thulium ions. Small additions in high-temperature ceramic superconductors.',
    curiosity:
      'Before the era of portable electronic detectors, technicians who needed to radiograph welds in pipelines in the Arctic or remote refineries carried thulium-170 pellets in shielded containers. Hung near the part, the pellet emits gamma rays for months, exposing radiographic film placed on the other side. No need for electricity, generator or X-ray tube — just slow nuclear physics, enough to inspect kilometers of piping where nothing else would work.',
  },
  70: {
    overview:
      'Ytterbium is a relatively soft heavy lanthanide, best known for two extreme uses: the most precise optical atomic clocks in the world and industrial fiber lasers used in steel cutting. In both cases, its electronic transitions have an almost ridiculous stability — varying so little that they serve as a fundamental reference for time and frequency.',
    history:
      'Identified in 1878 by the Swiss Jean Charles Galissard de Marignac, who separated a new oxide from what was believed to be just erbium. It was another element named in reference to Ytterby, the Swedish village. In 1907, it was discovered that Marignac\'s "ytterbium" was actually a mixture — Georges Urbain separated it into ytterbium (Yb) and lutetium (Lu). Pure ytterbium was only obtained in 1953.',
    properties:
      'Silvery-bright metal, soft and malleable, with the lowest density among the heavy lanthanides (6.90 g/cm³). Melts at 824 °C, an exceptionally low point among lanthanides. Has three allotropic phases with different crystal structures. The electrical resistance of ytterbium under pressure has abrupt changes exploited in pressure sensors. Yb³⁺ ions in solids have extremely narrow and stable electronic transitions.',
    applications:
      'Optical atomic clocks based on trapped-ytterbium lattices — define the second with precision of 10⁻¹⁸, more than a thousand times better than cesium clocks. Yb-doped fiber lasers in industrial cutting and welding (hundreds of continuous kilowatts). Pressure sensors and strain gauges for geophysics and structural engineering. Doping in stainless steel for mechanical strength. Research in quantum computing with atomic qubits.',
    curiosity:
      'In 2020, physicists at NIST and JILA demonstrated an ytterbium optical clock so precise that, had it started counting at the Big Bang, today it would be off by less than half a second. This level of precision is no longer just for experiments: it begins to enable gravitational measurements — by the principle of general relativity, clocks at slightly different altitudes tick at different rates. Ytterbium has, in practice, turned time into a ruler for altitude.',
  },
  71: {
    overview:
      'Lutetium is the last and heaviest of the lanthanides — the most difficult to obtain, the most expensive to produce, and historically the one that closed the series. Despite this, it has gained a hugely important role in nuclear medicine: Lu-177 is used in radioligand therapy, selectively binding to tumor cells and destroying them with beta radiation with minimal collateral damage. It is one of the most remarkable oncological advances of the last 20 years.',
    history:
      'Discovered independently in 1907 by three scientists: the Frenchman Georges Urbain, the Austrian Carl Auer von Welsbach and the American Charles James — all separating lutetium from what was previously called only "ytterbium". Urbain was given the official priority and named it in honor of Lutetia, the Latin name for Paris. For decades there was a bitter dispute over priority — typical of the era when rare earths were the most difficult frontier of chemistry.',
    properties:
      'Silvery-white metal, dense (9.84 g/cm³, the densest of the lanthanides) and relatively hard. Melts at 1,652 °C — the highest melting point in the series. Has two natural isotopes: Lu-175 (97.4%, stable) and Lu-176 (radioactive, half-life 3.8 × 10¹⁰ years). It is the least abundant lanthanide in the Earth\'s crust and the most expensive to purify, requiring dozens of ion-exchange steps.',
    applications:
      'Lu-177 in targeted radiotherapy — bound to antibodies or peptides that attach to receptors on cancer cells (Pluvicto for metastatic prostate cancer, Lutathera for neuroendocrine tumors). Lutetium oxyorthosilicate (LSO) crystals in PET-CT detectors, with response time superior to older scintillators. Catalysts in oil refining. Geological dating by Lu–Hf decay, complementary to the U–Pb system.',
    curiosity:
      'Pluvicto, approved by the FDA in 2022, is a revolutionary treatment for hormone-resistant metastatic prostate cancer. The molecule combines lutetium-177 with a peptide that binds selectively to a protein expressed by cancer cells (PSMA). Injected into the bloodstream, the compound accumulates in tumors and destroys them from within, with short-range beta radiation. In clinical trials, it significantly prolonged survival — radioligand therapy is considered the next major chapter of oncology.',
  },
  72: {
    overview:
      'Hafnium is a silvery, rare transition metal with chemistry almost identical to zirconium — so similar that it took 134 years after zirconium\'s discovery for hafnium to be identified as a distinct element. Today it is strategic in two very different industries: nuclear reactors (neutron absorber) and computer chips (insulating gate in Intel transistors).',
    history:
      'Predicted by Mendeleev, but only discovered in 1923 by Dirk Coster and George de Hevesy in Copenhagen, Denmark, using X-ray spectral analysis of zirconium minerals. The name "hafnium" comes from "Hafnia", the Latin name of Copenhagen. Its identification was one of the first practical successes of quantum mechanics: atomic number 72 was predicted by Bohr\'s atomic model before the experimental discovery.',
    properties:
      'Silvery-gray, shiny, ductile metal with properties almost identical to zirconium — they form solid solutions in all proportions. Melts at 2,233 °C (very high). Resistant to corrosion by water and acids. Excellent absorber of thermal neutrons — which limits its use in alloys with zirconium in reactors (zirconium is desirable, hafnium needs to be separated). Forms an extremely stable HfO₂ oxide, a high-k dielectric.',
    applications:
      'Control rods in nuclear reactors (especially submarines), where they absorb neutrons to regulate fission. In modern computer chips (from 2007 onwards, Intel processors), hafnium oxide (HfO₂) replaced silicon dioxide as the gate insulator in transistors — allowing Moore\'s Law to continue when SiO₂ reached its physical limit. Electrodes in plasma lighting and in discharge tube cathodes. Alloys in rocket engines.',
    curiosity:
      'When Intel announced in 2007 that it would replace silicon dioxide with hafnium oxide in the transistors of the Penryn processor, it was described as "the biggest change in silicon transistors in 40 years". The reason: as transistors shrank, the SiO₂ layer became so thin (~1 nm) that electrons "leaked" through quantum tunneling, wasting energy. HfO₂, with its denser structure, blocks this leak — allowing entire generations of more efficient chips.',
  },
  73: {
    overview:
      'Tantalum is a dense, blue-gray metal, extremely corrosion-resistant and with one of the highest melting points in the periodic table. Inconspicuous in everyday life, it is inside virtually every smartphone, digital camera and hearing aid on the planet — in compact capacitors that store electric charge with unmatched density. Its mining concentrates on the coltan ore from the Democratic Republic of Congo, tying it to debates about "conflict minerals".',
    history:
      'Discovered in 1802 by the Swede Anders Gustaf Ekeberg while analyzing Scandinavian minerals. For decades it was confused with niobium (discovered the year before) due to their nearly perfect chemical similarity — only in 1866 did Switzerland\'s Jean Charles Galissard de Marignac separate the two for good. The name came from the Greek myth of Tantalus, a king condemned to stand forever between water and fruit he could never reach — an ironic reference to the fact that the element\'s oxide was so inert that no acid could "quench" it and dissolve it.',
    properties:
      'Blue-gray metal, dense (16.65 g/cm³) and malleable. Melts at 3,017 °C — the fifth-highest melting point among all elements. Forms an extraordinarily stable surface layer of Ta₂O₅, making it virtually impervious to acids at room temperature (resists aqua regia, which dissolves gold). It is biocompatible: living tissues do not react with it, and for that reason it is used in medical implants.',
    applications:
      'Tantalum electrolytic capacitors in smartphones, laptops, cameras, hearing aids and pacemakers — unmatched capacitance density in small volumes. Orthopedic and dental implants: screws, plates, hip prostheses. Chemical process equipment (reactors, heat exchangers) where stainless steel would corrode. Alloys for jet engine and missile turbine blades. Welding electrodes for extreme conditions.',
    curiosity:
      'Most of the world\'s tantalum comes from coltan ore (columbite-tantalite), mined chiefly in the eastern Democratic Republic of Congo — a region historically plagued by armed conflicts partly funded by ore exports. In 2010, the U.S. Dodd-Frank Act began requiring companies to certify that their tantalum did not come from mines controlled by militias. Today, manufacturers like Apple and Intel publish annual reports tracing the origin of every gram — one of the first cases where supply-chain traceability became a global regulatory requirement.',
  },
  74: {
    overview:
      'Tungsten is a steel-gray transition metal with the highest melting point of all pure elements (3,422 °C) — almost 1,000 °C above iron. Its hardness, density (19.3 g/cm³, like gold) and refractoriness make it essential in lamp filaments, electrodes, projectiles and high-performance metallurgy. The symbol W comes from the German "Wolfram", a name still used in several languages.',
    history:
      'Identified in 1781 by Swedish chemist Carl Wilhelm Scheele from the mineral scheelite, and isolated in 1783 by Spanish brothers Juan José and Fausto Elhuyar from wolframite. The name "tungsten" comes from the Swedish "tung sten" (heavy stone), due to the mineral\'s high density. "Wolfram", the original German name, comes from "Wolfsrahm" (wolf foam) — because the mineral interfered with tin smelting like a wolf devours sheep.',
    properties:
      'Steel-gray metal with the highest melting point of all pure elements (3,422 °C) and the second highest among all materials (only carbon beats it). Density 19.3 g/cm³ — equal to gold. Extremely hard and corrosion-resistant, with very low thermal expansion. Almost chemically inert under normal conditions. Forms tungsten carbide (WC), one of the hardest known materials.',
    applications:
      'Filaments in incandescent lamps were the classic application — the only metal capable of operating above 2,500 °C without rapidly evaporating. X-ray filaments and cathodes in electron tubes. Tungsten carbide in industrial cutting and drilling tools — tungsten bits cut steel like butter. Anti-tank projectiles (depleted uranium being gradually replaced by tungsten). TIG welding electrodes. Counterweight in golf clubs and dart formulas.',
    curiosity:
      'During World War II, tungsten became a critical strategic resource — used in projectiles and armor. Portugal and Spain, officially neutral, controlled significant reserves and sold tungsten to both sides. In Portugal, the "tungsten fever" generated a parallel economy in mining villages in the north of the country, with fortunes made and lost in months. It was one of the few cases where a backward agricultural economy had a brief moment of global economic prominence.',
  },
  75: {
    overview:
      'Rhenium is one of the rarest elements in the Earth\'s crust — scarcer than gold, platinum or any rare earth. It was the last stable element to be discovered on Earth, in 1925. Today, its most critical role is inside the turbine blades of modern jet engines: alloys with rhenium withstand temperatures that would destroy any other material, enabling more efficient engines and more economical flights.',
    history:
      'Identified in 1925 by Walter Noddack, Ida Tacke and Otto Berg in Germany, after processing tons of molybdenum ore to extract milligrams of the element. It was named after the Rhine river (Rhenus in Latin), near the laboratory where the Noddacks worked. Its identification closed the last gap among stable elements in the periodic table — everything that came afterward (up to uranium) was either radioactive or already known.',
    properties:
      'Silvery-white metal, dense (21.02 g/cm³), with the third-highest melting point in the table (3,186 °C, behind only tungsten and carbon) and the highest boiling point of any element (5,596 °C). Resistant to corrosion and thermal fatigue, it maintains mechanical properties at temperatures where almost all other metals lose strength. It has one slightly radioactive natural isotope (Re-187, half-life 4.1 × 10¹⁰ years), used in geological dating.',
    applications:
      'Turbine blades of modern jet engines contain 3 to 6% rhenium in nickel-based superalloys — without it, engines like the GE90 or Trent XWB would not reach their operating temperatures. Pt-Re catalysts in refineries produce high-octane gasoline through catalytic reforming. Filaments in mass spectrometers and thermocouples for extreme temperatures (up to 2,200 °C). Electrodes in photographic flashes.',
    curiosity:
      'Demand for rhenium is so concentrated in jet engines that, when Boeing and Airbus ramp up production, the price of rhenium reacts within weeks. About 80% of the world\'s rhenium goes to the aerospace industry — one of the most critical and quiet dependencies of modern aviation. As a by-product of molybdenum (which itself is a by-product of copper), its supply cannot easily be expanded: extracting it means extracting three mineral chains in series. Countries like Chile, the U.S. and Poland dominate production.',
  },
  76: {
    overview:
      'Osmium is the densest known element — a 10 cm cube would weigh 22.6 kg, more than two gallons of water. It is a blue-gray metal of the platinum family, extremely hard and brittle, with a characteristic smell in its compounds (literally "smelly", in Greek). Rarely used pure because of its brittleness, it gains relevance in alloys for fountain-pen tips, long-lasting electrical contacts and as a histological fixative in electron microscopy.',
    history:
      'Discovered in 1803 by the English chemist Smithson Tennant while analyzing the dark residue left when crude platinum was dissolved in aqua regia. In the same work, Tennant also isolated iridium. The name came from the Greek "osme" (odor), in reference to the acrid, pungent smell of osmium tetroxide (OsO₄) — a highly volatile and toxic compound that forms when the metal is exposed to air.',
    properties:
      'Blue-gray metal with a slight metallic tone, density 22.59 g/cm³ (the densest of all elements). Melts at 3,033 °C. Extremely hard but brittle — it cannot be worked by forging. OsO₄ is highly toxic, volatile at room temperature, and attacks eye and respiratory tissue — handling requires a fume hood and rigorous protection. It resists most acids in bulk metallic form.',
    applications:
      'Os-Ir alloys in luxury fountain-pen tips, precision instrument pivots and old phonograph needles — durable for decades of intense use. Osmium tetroxide (OsO₄) as a tissue fixative in electron microscopy (stains fats and preserves cellular ultrastructures). Catalyst in pharmaceutical synthesis (Sharpless asymmetric hydroxylation — 2001 Nobel Prize). Electrical contacts in equipment that needs an extremely long service life.',
    curiosity:
      'Worldwide annual osmium production rarely exceeds 1 ton — produced only as a by-product of platinum and nickel refining. It is so rare and specific that researchers must order individual grams from specialized suppliers. Curiously, even though it is the densest element, metallic osmium is not radioactive or particularly toxic — the danger is all from its tetroxide, which can form slowly on parts exposed to air and silently contaminate labs over months.',
  },
  77: {
    overview:
      'Iridium is the second densest element (right behind osmium) and the most corrosion-resistant metal on the planet — not attacked by any acid alone, not even by the aqua regia that dissolves gold. That is why it is used in extreme environments: tips of high-performance spark plugs, crucibles for growing sapphire crystals, and as the measurement standard of the original meter. Its most famous mark, however, is geological: a layer of iridium buried across the planet marks the impact of the asteroid that wiped out the dinosaurs.',
    history:
      'Discovered in 1803 by the Englishman Smithson Tennant alongside osmium, while analyzing platinum refining residues. The name comes from the Greek "iris" (rainbow), in reference to the varied colors of its salts — red, yellow, blue, brown, depending on oxidation state. In 1889, it was chosen to be part of the platinum-iridium (90/10) alloy of the international prototype meter and kilogram — physical standards kept at Sèvres, France.',
    properties:
      'Silvery-white metal with a slight yellow tint, density 22.56 g/cm³ (only slightly less than osmium). Melts at 2,466 °C. It is the most corrosion-resistant metal known — only attacked by molten oxidizing salts at extremely high temperatures. Extremely hard and brittle, difficult to work. Has two natural isotopes (Ir-191 and Ir-193). It is rare: about 0.001 parts per million in the crust — similar to platinum concentration.',
    applications:
      'Spark-plug electrodes in high-performance engines (Formula 1, sport motorcycles) and in aircraft engines — they last much longer than platinum or tungsten. Iridium crucibles for growing single crystals of sapphire and garnets for lasers at extremely high temperatures. Platinum-iridium alloy in fountain-pen tips and in the original international measurement standards. Medical implants and electrical contacts in corrosive environments. Catalysts for industrial asymmetric hydrogenation.',
    curiosity:
      'In 1980, physicist Luis Alvarez and his geologist son Walter published a bombshell study: a thin clay layer dated to 66 million years ago, found in diverse sites around the planet, contained iridium concentrations up to 30 times higher than the normal terrestrial level. Since iridium is rare in the crust but relatively common in asteroids, they proposed that this layer — today called the K-Pg boundary — was the record of a cataclysmic impact that extinguished the dinosaurs. The theory was controversial for a decade, until the 1990 confirmation of the Chicxulub crater in Mexico. Iridium solved the greatest paleontological mystery of the century.',
  },
  78: {
    overview:
      'Platinum is a silvery-gray noble metal, dense and shiny — one of the rarest and most valuable elements in Earth\'s crust. Known for extremely high corrosion resistance, high melting point and unique catalytic properties, it is used in luxury jewelry, automotive catalytic converters, medical electrodes and chemical laboratories. Its name comes from the Spanish "platina" (little silver), originally a dismissive term.',
    history:
      'Known to pre-Columbian South American peoples (especially Ecuadorians), who made platinum jewelry before the Spaniards arrived. The 16th-century Spanish conquistadors considered platinum a "nuisance" — it was mistaken for silver but impossible to melt. Antonio de Ulloa scientifically described it in 1748, and William Hyde Wollaston developed the method to purify it in 1803. It became valuable when its catalytic use was discovered in the 19th century.',
    properties:
      'Silvery-white metal, dense (21.4 g/cm³, more than gold) and ductile. Melts at 1,768 °C — high among metals. Extremely corrosion-resistant: does not react with most acids (it only dissolves in aqua regia, like gold). It is one of the most powerful known catalysts: it accelerates chemical reactions without being consumed. Has 6 stable isotopes and frequently occurs associated with other platinum-group metals (palladium, rhodium, iridium, osmium, ruthenium).',
    applications:
      'Automotive catalytic converters — about 40% of global demand. Platinum, palladium and rhodium convert toxic exhaust gases (CO, NOx, hydrocarbons) into CO₂, N₂ and water. Luxury jewelry (especially wedding bands). Medical electrodes in pacemakers and implants (biocompatible). Catalysts in oil refineries and nitric acid production. Financial reserves alongside gold and silver. Precision thermometers (platinum resistance).',
    curiosity:
      'The old standards of the kilogram and meter kept in Paris (1889-1960) were made of an alloy of 90% platinum + 10% iridium — chosen for absolute chemical immutability. They were retired when the kilogram was redefined in 2019 based on the Planck constant. Before that, every laboratory in the world calibrated its measurements against the "International Prototype of the Kilogram", a single physical object of platinum-iridium kept under three nested glass jars in a vault near Paris.',
  },
  79: {
    overview:
      'Gold is a dense, brilliant, yellow metal that humans have prized for over eight thousand years thanks to a rare combination: it is nearly indestructible, easy to shape and stunningly beautiful. It is rare in Earth\'s crust — only about 4 parts per billion — but concentrated in deposits that have justified empires, wars and mass migrations. It does not rust, does not tarnish, and reacts with almost nothing.',
    history:
      'Worked since at least 6,000 BCE. Egyptian pharaohs were buried with tons of gold. Spanish conquests in the New World were driven by the metal hoarded by Aztec and Inca civilizations. The California Gold Rush (1849) and the Klondike Gold Rush (1896) displaced millions. The symbol Au comes from the Latin "aurum" (shining dawn), a reference to its warm yellow shine.',
    properties:
      'The most malleable known metal — one gram can be stretched into a sheet nearly 1 m² in area. It does not react with most acids (only aqua regia, a mixture of nitric and hydrochloric acid, dissolves it). Density 19.3 times that of water — a ball the size of an orange weighs over 7 kg. Excellent electrical conductor, used in high-reliability electronics.',
    applications:
      'Jewelry and financial reserves (about half of global demand). Electronics: connector contacts, processors and satellites (resists space radiation). Dentistry: crowns, prosthetics and restorations. Medicine: gold nanoparticles are being tested in cancer treatments and drug delivery. Yellow and red architectural glass uses colloidal gold.',
    curiosity:
      'All the gold ever mined in human history would fit in a cube about 22 meters per side. Most of that gold reached Earth during neutron-star collisions over 4 billion years ago — cataclysmic events that forge heavy elements and scatter them across the universe. The gold in your ring may have been created in a stellar collision more violent than any supernova.',
  },
  80: {
    overview:
      'Mercury is the only metal that is liquid at room temperature — a property so unique that it fascinated alchemists and scientists for centuries. Heavy, silvery and highly toxic, it was used for millennia in medicines, industrial processes and scientific instruments before we discovered the catastrophic neurological damage it causes. Today it is progressively banned in almost all uses.',
    history:
      'Known since antiquity — Egyptian tombs from 1500 BCE contain mercury. It was central to alchemy: the search for the "philosopher\'s stone" involved transmutations using mercury and sulfur. Chinese emperor Qin Shi Huang reportedly died in 210 BCE drinking mercury elixirs for immortality. The symbol Hg comes from the Latin "hydrargyrum" (liquid silver), and the name mercury came from the Roman god of speed — for its fluidity.',
    properties:
      'A dense silvery liquid (13.5 times denser than water — a person would float on it). Melts at -39 °C and boils at 357 °C. Forms "amalgams" — metallic solutions with almost every other metal (except iron), dissolving them as if they were sugar in water. The vapors are extremely toxic: inhalation causes cumulative brain damage. Organic compounds like methylmercury accumulate in fish.',
    applications:
      'For centuries thermometers, barometers and manometers used mercury for its linear thermal expansion. Fluorescent lamps contain a small amount to emit ultraviolet light that excites the phosphor coating. Amalgamation is still used in artisanal gold mining (with severe environmental consequences). It was used in felt hats in the 19th century — hence the phrase "mad as a hatter".',
    curiosity:
      'The expression "mad as a hatter" from Alice in Wonderland has a real origin: 19th-century hatters used mercury nitrate to cure felt for fur hats. Years of exposure to the vapors caused tremors, irritability, speech problems and dementia — a syndrome known as "hatter\'s disease". The Mad Hatter character is a caricature of these cases.',
  },
  81: {
    overview:
      'Thallium is a silvery-gray post-transition metal, soft enough to be cut with a knife — and one of the most sinister poisons in chemistry. Tasteless, odorless and water-soluble, its compounds were historically used as rat poison and insecticide, before it was discovered that they killed humans as readily as pests. Novels by Agatha Christie and real-life crimes made it famous as the "poisoner\'s poison", precisely because of how hard it is to detect after the fact.',
    history:
      'Discovered in 1861 by the Englishman William Crookes while examining residues from a sulfuric acid factory with a spectroscope — he noticed an intense emerald-green line that did not match any known element. He named it from the Greek "thallos" (green shoot), in reference to the color of the spectral line. It was one of the first elements discovered by the then-recent spectroscopic method, which revolutionized analytical chemistry in the 19th century.',
    properties:
      'Silvery-gray metal, soft (can be cut with a knife, softer than lead), density 11.85 g/cm³, melts at 304 °C. In moist air it oxidizes rapidly, forming a blue-gray layer. It has two important oxidation states: Tl⁺ (more stable, behaves like potassium in biological systems — hence its toxicity) and Tl³⁺. Thallium compounds are absorbed through the skin and orally, with a lethal dose of about 1 gram in adults.',
    applications:
      'Tl-201 in nuclear medicine for myocardial perfusion scintigraphy — detects areas of the heart with reduced blood flow in cardiac patients. Sodium iodide crystals doped with thallium in scintillation detectors for gamma rays (used in hospital gamma cameras and in nuclear material detection). High-refractive-index optical glasses with Tl₂O. Historically, in rat poisons and insecticides — banned in most countries since the 1970s because of accidental and criminal poisonings.',
    curiosity:
      'In 1961, Agatha Christie published "The Pale Horse" describing in detail the symptoms of thallium poisoning — hair loss, leg pain, progressive neurological failure. Almost two decades later, a doctor in London recognized these same symptoms in a child and saved her life thanks to having read the novel. Darker still: Saddam Hussein reportedly used thallium to poison dissidents in the 1980s, and in 2006 Russian journalist Anna Politkovskaya was treated for suspected thallium poisoning before being assassinated. Literature, in the case of this element, became clinical diagnosis.',
  },
  82: {
    overview:
      'Lead is a heavy, soft, blue-gray metal that was one of the first metals worked by humanity. Roman plumbing, gun bullets, solders, car batteries, paint and cosmetics — its versatility powered entire civilizations before we discovered it is a cumulative poison affecting the nervous system, especially in children.',
    history:
      'Used for over 8,000 years. The Romans produced it on a large scale — plumbing, roofs, wine containers. The English word "plumbing" comes from "plumbum", the Latin name for lead. The fall of Rome has been partly attributed to chronic lead poisoning of the elite. Its toxicity was only scientifically recognized in the 20th century, leading to bans in gasoline (1970-2000) and residential paints.',
    properties:
      'Dense (11.3 times that of water), soft enough to be cut with a knife, with a low melting point (327 °C). Resistant to corrosion by common acids — hence its use in plumbing and lead-acid batteries. It efficiently blocks ionizing radiation, being the standard material in X-ray aprons and nuclear reactor shielding. Chemically versatile: it forms compounds in both +2 and +4 oxidation states.',
    applications:
      'Lead-acid batteries in cars still represent the biggest global use — about 80% of production. Ammunition, counterweights for boats and diving, and submarine cable sheathing. In nuclear medicine and radiology, radiation shielding. Lead crystal (glass with lead oxide) has exceptional brilliance due to high refraction. Alloys with tin form solders — but lead solders have been banned in consumer electronics.',
    curiosity:
      'Lead is so effective at blocking radiation that forensic detectives analyze ancient bones by the amount of lead absorbed during life. The Roman elite had such high skeletal levels that this has been proposed as a partial cause of dementia and infertility among patricians. Conversely, in commoner bones the levels were much lower — one of the earliest examples of "toxic inequality" in history.',
  },
  83: {
    overview:
      'Bismuth is a silvery-gray post-transition metal with pinkish tones, known for very low toxicity despite being close to lead in the periodic table. It forms stair-step crystals with vibrant iridescent colors — one of the most beautiful crystal structures among metals. It is used in gastric medications (Pepto-Bismol), cosmetics, solders and as a safe substitute for lead in various products.',
    history:
      'Bismuth compounds have been used since antiquity (in Egyptian makeup), but it was only recognized as a distinct element in the 15th century — before that it was confused with lead or tin. German metallurgist Georgius Agricola described it in 1546. The name probably comes from German "wismut" (white mass). Curiously, for centuries it was considered the heaviest stable element, until precise measurements in 2003 showed that Bi-209 decays with a half-life of 10¹⁹ years — billions of billions of times the age of the universe.',
    properties:
      'A silvery-gray metal with pinkish tones, brittle and crystalline. Melts at 271 °C (low for a metal). Density 9.78 g/cm³. Has a rare property among metals: it expands on solidifying (like water). It is the most diamagnetic known element (repels magnetic fields). When oxidized in controlled crystals, it exhibits iridescent rainbow colors due to the "thin film" of oxide on the surface.',
    applications:
      'Bismuth subsalicylate (Pepto-Bismol) treats gastric problems like diarrhea and indigestion — it combines antibacterial action with gastric coating. Cosmetics: bismuth oxychloride (pearlescent in eyeshadows, lipsticks and nail polishes). Low melting point solders and alloys (replacing lead). In production of decorative crystals for collectors (Bi-crystals). Heat carriers in experimental nuclear reactors. In chemical catalysts.',
    curiosity:
      'For decades, textbooks said bismuth-209 was the heaviest stable element — the last non-radioactive natural isotope. In 2003, French scientists discovered that it actually decays, with a half-life of 1.9 × 10¹⁹ years — about 1 billion billion times the age of the universe. Technically it is radioactive, but if you waited for 100 consecutive universes to die, only a tiny fraction of atoms would have decayed. It is "stability that is not stable".',
  },
  84: {
    overview:
      'Polonium is a rare, highly toxic radioactive metal, discovered by Marie and Pierre Curie in 1898 — the first element named for political reasons, in honor of Marie\'s native Poland, then under Russian rule. It has no significant industrial applications, but it became infamous in 2006 when former Russian spy Alexander Litvinenko was assassinated in London by Po-210 poisoning — one of the most elaborate murders in the history of espionage.',
    history:
      'Discovered in 1898 by Marie and Pierre Curie while analyzing pitchblende (uranium ore), it was the first element they isolated and the first of many to be identified by radioactivity. Marie chose the name "polonium" to draw international attention to her oppressed homeland — Poland had been partitioned between the Russian Empire, Germany and Austria. It was a subtle political statement at a time when Poland did not exist as an independent nation.',
    properties:
      'Bright silvery-gray metal, rare (one of the scarcest natural substances — 100 micrograms per ton of uranium ore). Melts at 254 °C. All 33 known isotopes are radioactive — the most "stable" is Po-209 with a half-life of 124 years. Po-210 is the most notorious: a strong alpha emitter with a half-life of 138 days. Extremely toxic: a grain-of-salt-sized amount can be lethal if inhaled or ingested.',
    applications:
      'Practically no industrial applications — too rare, expensive and dangerous. Po-210 was used in industrial anti-static air ionizers (to dissipate charges in textile and paper factories), now replaced by safer alternatives. As a heat source in Soviet space probes (Lunokhod). Basic nuclear research. In fission initiators of older nuclear weapons (replaced by other technologies).',
    curiosity:
      'In November 2006, Alexander Litvinenko — a former KGB agent who became a Putin critic — was poisoned in London with tea laced with Po-210. The choice of poison was surgical: practically undetectable in standard toxicology screens, with no known antidote, and easy to transport discreetly in lethal quantities. Litvinenko died three weeks later in hospital, but had time to identify the culprit. Radioactive traces across the UK allowed police to trace the assassin back to Russia — Andrei Lugovoy, still protected by the Kremlin to this day.',
  },
  85: {
    overview:
      'Astatine is the rarest natural element in the Earth\'s crust — it is estimated that, adding up all the atoms scattered across the planet, there is less than 25 grams at any given moment. It is a radioactive halogen whose isotopes have such short half-lives that no one has ever seen a visible sample: all knowledge of its properties comes from quantities of a few hundred atoms, handled for minutes before they decay.',
    history:
      'Synthesized in 1940 by Dale Corson, Kenneth MacKenzie and Emilio Segrè at the University of California in Berkeley, bombarding bismuth-209 with alpha particles in a cyclotron. It was named from the Greek "astatos" (unstable) — fitting, since all 39 known isotopes are radioactive. Years later, natural traces were detected as intermediate products of uranium and thorium decay, but in negligible amounts.',
    properties:
      'The heaviest halogen, with behavior intermediate between iodine and metallic features. The longest-lived isotope, At-210, has a half-life of only 8.1 hours; At-211, used in medical research, lasts 7.2 hours. Since it has never been obtained in macroscopic quantity, properties such as color, melting point and crystal structure are extrapolated — it is probably a dark semi-metallic solid that would rapidly sublimate at room temperature.',
    applications:
      'Astatine-211 is being intensely studied as a therapeutic agent in targeted alpha radiotherapy — it emits very-high-energy, short-range alpha particles capable of destroying individual tumor cells without damaging neighboring tissue. Bound to monoclonal antibodies or peptides, it goes directly to tumors such as leukemia, glioma and ovarian cancer. Clinical trials began in the 2010s with promising results. Outside of this application, there is practically no industrial use.',
    curiosity:
      'If you could collect all the astatine that naturally exists in the Earth\'s crust into a single vial, you would have less than fits on the tip of a pin — and it would evaporate by radioactivity before you could screw on the cap. All the known chemistry of the element was reconstructed from experiments with a few hundred to a few thousand atoms, detected individually in counting chambers after seconds of handling. It is perhaps the extreme case of an element "known but inaccessible": it exists, but humanity has never been able to hold it in its hands.',
  },
  86: {
    overview:
      'Radon is the heaviest noble gas of all — colorless, odorless and radioactive. It forms naturally from the decay of radium in rocks and soil, and accumulates in basements and enclosed spaces. It is the second largest cause of lung cancer after cigarettes, ironically because it is so hard to detect: "invisible" noble gases are worse than visible smoke.',
    history:
      'Discovered in 1900 by German chemist Friedrich Ernst Dorn as a gaseous radioactive product of radium — not long after Marie and Pierre Curie had isolated radium. It was initially called "radium emanation". The current name came in 1923 from the word "radium" + suffix "-on" common to noble gases. Its importance in public health was only recognized in the 1980s, when engineers measured alarming levels in American homes.',
    properties:
      'Monoatomic gas (Rn) at room temperature, colorless and odorless, with a density 9.7 times that of air. Liquefies at -62 °C. All 35 of its known isotopes are radioactive — the most common, Rn-222, has a half-life of 3.8 days. It belongs to the noble gas group but forms some fluorides under extreme conditions. It emits alpha radiation, particularly dangerous when inhaled because it deposits energy directly into the lungs.',
    applications:
      'Practically no industrial applications — it is rare, expensive and too dangerous. In some countries it was used in radioactive sources for radiotherapy, now replaced by accelerators and safer isotopes. Geological studies use radon measurements to detect tectonic faults and predict volcanic eruptions — radon spikes in soil precede some earthquakes. Radon detection is a small equipment market for real-estate inspections.',
    curiosity:
      'In 1985, Stanley Watras, a nuclear engineer, set off the radioactivity detectors at the nuclear plant where he worked — but he was ARRIVING at work, not leaving. He was contaminated by radon from his own home in Pennsylvania, where levels were 700 times above the recommended limit. After this case, the EPA started recommending radon testing in all U.S. homes. It is estimated that radon causes 21,000 lung cancer deaths per year in the U.S. alone.',
  },
  87: {
    overview:
      'Francium is the last element discovered in nature (not synthesized) and the second rarest in the Earth\'s crust, second only to astatine. It is estimated that less than 30 grams of francium exist scattered across the entire planet at any moment — formed continuously by the decay of actinium in uranium ores. It is the heaviest alkali metal, and by extrapolation, the most reactive: it would explode violently in contact with water, if anyone could gather a sufficient amount.',
    history:
      'Discovered in 1939 by the French chemist Marguerite Perey, then an assistant to Marie Curie at the Radium Institute in Paris. Perey identified it after noticing a form of radioactive decay of actinium-227 that produced an isotope with alkali-metal chemical properties. She named it in honor of France, her homeland. It was the last discovery of a naturally occurring element on Earth — every element synthesized afterward came from accelerators or reactors.',
    properties:
      'Heaviest alkali metal, with properties extrapolated from very few atoms ever brought together in the lab (no more than 300,000 simultaneously). The most stable isotope, Fr-223, has a half-life of just 22 minutes. It would probably be liquid around 27 °C, with metallic luster, but would oxidize instantly in air. It has the largest atomic radius among the alkalis (the most diffuse electronic cloud) and the lowest ionization potential — hence why it is theoretically the most reactive.',
    applications:
      'No practical applications: producing and storing francium in useful quantities is physically impossible with current technology — it decays faster than it is made. Its only "use" is in basic atomic physics research: spectroscopic measurements of isolated atoms help test quantum electrodynamics predictions and search for fundamental symmetry violations. Universities such as Stony Brook maintain magneto-optical traps that hold a few hundred atoms at a time.',
    curiosity:
      'Marguerite Perey began as a lab technician for Marie Curie, without a formal university degree — a typical situation for women in 1920s science. Her discovery of francium made her, in 1962, the first woman elected to the French Académie des Sciences in nearly 300 years of the institution\'s existence. She died of bone cancer in 1975, almost certainly caused by prolonged exposure to the very radiation she studied — a fate she shares with her mentor.',
  },
  88: {
    overview:
      'Radium is a silvery alkaline-earth metal, intensely radioactive, that emits a ghostly blue-green glow in the dark — the radioluminescence that fascinated scientists and charlatans in the early 20th century. For decades it was treated as a miracle substance, sold in tonics, creams, toothpaste and "everlasting glow" watches, until the link between radium and cancer became tragically clear. Today, it stands as a symbol of the dangers of technological euphoria without scientific grounding.',
    history:
      'Isolated in 1898 by Marie and Pierre Curie from tons of pitchblende processed by hand in an unheated shed in Paris. The name comes from the Latin "radius" (ray), for its intense radiation. Marie would take another four years to purify a decigram of pure radium chloride, work that earned her the 1911 Nobel Prize in Chemistry (her second Nobel, after the 1903 Physics prize). The radioactivity of radium is about one million times greater than that of uranium.',
    properties:
      'Silvery-white metal, shiny when freshly cut, but quickly darkens in air forming a nitride. Density 5.5 g/cm³, melts at 700 °C. All 33 known isotopes are radioactive — Ra-226, the most common, has a half-life of 1,600 years. Emits alpha, beta and gamma radiation. In pure form in the dark, it emits a visible blue-green luminescence to the naked eye — not by external fluorescence, but from the radiation itself exciting the surrounding air.',
    applications:
      'Virtually all old applications have been discontinued. It was used in luminescent paints for watch dials, military instruments, gun sights — replaced by tritium or non-radioactive phosphors. In medicine, radium sources (brachytherapy) treated tumors — replaced by iridium-192 and other safer isotopes. Only residual use in nuclear research and as a neutron source in laboratories (Ra-Be) remains.',
    curiosity:
      'In the 1920s, factories such as U.S. Radium Corporation hired young women to paint watch dials with radium paint. To make fine tips, the workers "sharpened" the brushes in their mouths — swallowing micrograms of radium every day. When they began dying of bone cancer, anemia and jaw necrosis, the company denied responsibility. The "Radium Girls" case became a landmark in labor law: five women sued the company in 1927 and won, setting precedents that changed industrial regulation in the U.S. The victims\' bodies, even decades after burial, still emit detectable radiation.',
  },
  89: {
    overview:
      'Actinium is a silvery radioactive metal that gives its name to an entire series of elements in the periodic table — the actinides, from Z 89 to 103. It emits a sky-blue glow in the dark due to its intense alpha radiation, and it is about 150 times more radioactive than radium. Almost unknown outside nuclear research, it has recently gained prominence in medicine: Ac-225 is considered one of the most promising isotopes for targeted alpha radiation therapy against metastatic cancers.',
    history:
      'Discovered in 1899 by the French chemist André-Louis Debierne, a Curie collaborator, in residues of pitchblende processing. In 1902, the German Friedrich Oskar Giesel also isolated it independently. The name comes from the Greek "aktinos" (ray), in reference to the radiation emitted. Despite the old discovery, practical applications only began to develop in the late 20th century, when production techniques in accelerators made Ac-225 accessible for medical research.',
    properties:
      'Silvery-white metal, soft, dense (10.07 g/cm³), melts at 1,050 °C. All 36 known isotopes are radioactive. Ac-227 is the most stable, with a half-life of 21.77 years; Ac-225, used in medicine, decays in 9.9 days. The intense alpha radiation of pure actinium excites the air around it, producing the characteristic sky-blue glow — a phenomenon similar to that of radium but even more vivid. It is extremely rare: traces in uranium ore (about 0.2 micrograms per ton).',
    applications:
      'Targeted alpha therapy with Ac-225 is the most promising application: bound to antibodies or peptides, it carries very-high-energy alpha particles (short range, about 50 micrometers) directly to tumor cells, destroying them without affecting nearby tissues. Clinical trials in leukemia, metastatic prostate cancer and glioma have shown remarkable results. Small amounts of Ac-227 serve as a neutron source in research laboratories (Ac-Be). Practically no industrial use.',
    curiosity:
      'Global production of Ac-225 is among the most limited in medicine: about 1.7 grams per year in 2024, coming mainly from the decay of thorium-229 stockpiled in the U.S. and Russia since the Cold War. Medical demand far outstrips supply — a clinical trial for prostate cancer can consume milligrams, and each patient receives doses in micrograms. Efforts to produce Ac-225 in commercial accelerators are growing, but the bottleneck is so severe that oncologists call the isotope "the gold of nuclear medicine".',
  },
  90: {
    overview:
      'Thorium is a silvery radioactive metal, more abundant in the Earth\'s crust than uranium (about 3 to 4 times more). Although not yet used commercially as nuclear fuel, it is considered one of the most promising alternatives for the next generation of reactors — safer, harder to turn into weapons, and with less long-lived waste. India, China and the U.S. have active thorium reactor research programs, and India in particular has strategic reserves that could fuel its electrical grid for centuries.',
    history:
      'Discovered in 1828 by the Swedish chemist Jöns Jakob Berzelius in a rock sent by a friend from Norway. He named it in honor of Thor, the Norse god of thunder. For decades it was seen merely as a scientific curiosity, until in 1885 Carl Auer von Welsbach invented luminescent gas mantles ("Welsbach mantles") impregnated with thorium dioxide — which lit streets and homes around the world until the arrival of the electric lamp. Thorium\'s radioactivity was only recognized in 1898, by Marie Curie and Gerhard Schmidt independently.',
    properties:
      'Silvery-white metal, soft, ductile, density 11.72 g/cm³, melts at 1,750 °C. Has a practically unique natural isotope (Th-232, 100%), with a half-life of 14 billion years — roughly the age of the universe. Decays through a 10-step chain until becoming stable Pb-208. In pure form it emits weak alpha radiation; it can be handled with gloves, but thorium powder is flammable and dangerous when inhaled. Forms a protective oxide layer in air.',
    applications:
      'Nuclear fuel in experimental molten-salt reactors (LFTR) and in Indian heavy-water reactors — safer, more abundant, with shorter-half-life waste than the uranium cycle. Magnesium-thorium alloy in lightweight, heat-resistant aerospace components (largely replaced due to radioactivity concerns). Thorium dioxide (ThO₂) in gas lighting mantles (household use extinct, still in some camping lanterns). Catalyst in oil refining. TIG welding electrodes (being replaced by lanthanum or yttrium alternatives).',
    curiosity:
      'India holds about 25% of the world\'s thorium reserves, concentrated in monazite sands on the beaches of Kerala state. In 1954, physicist Homi Bhabha designed a three-stage nuclear strategy for the country, culminating in thorium-based reactors that would exploit this abundance. Seven decades later, India operates the world\'s only commercial reactor prototype partially fueled by thorium, the KAPS, and plans to scale up thorium technologies by 2050 — a long-term vision that is rare in global energy policy.',
  },
  91: {
    overview:
      'Protactinium is one of the rarest and most difficult natural elements to study — produced only in tiny amounts as an intermediate decay product of uranium in ores. It is radioactive, extremely toxic and very expensive: extracting milligrams requires processing tons of ore. Despite this, it was historically crucial for radiometric dating of marine sediments and for understanding the structure of the actinide series.',
    history:
      'Its existence was predicted by Mendeleev in his 1869 periodic table, in the gap between thorium and uranium. First isolated as Pa-234 in 1913 by Kasimir Fajans and Oswald Helmuth Göhring, who called it "brevium" (short, for its half-life of minutes). In 1917–1918, Otto Hahn and Lise Meitner in Germany (and independently Frederick Soddy and John Cranston in Scotland) isolated the longer-lived Pa-231 isotope and proposed the name "protoactinium" (precursor of actinium), later simplified to protactinium. In 1934, Aristid von Grosse finally produced the first pure protactinium metal sample — about 2 milligrams.',
    properties:
      'Silvery-white metal with metallic luster, dense (15.37 g/cm³), melts at 1,568 °C. All 29 known isotopes are radioactive. Pa-231, the most stable, has a half-life of 32,760 years; it is an alpha emitter. In pure form it is as dense as lead and has hardness comparable to uranium. In the +5 oxidation state (most common), it behaves chemically like tantalum and niobium, its family neighbors.',
    applications:
      'No significant industrial application due to extreme rarity, cost (estimated around US$ 280,000 per gram in 1960s operations) and severe radiological toxicity. In geophysics, the Pa-231/Th-230 ratio in marine sediments was used to date samples up to 175,000 years old, helping reconstruct paleoclimate and ocean currents. Basic research in actinide chemistry and nuclear models.',
    curiosity:
      'In 1961, the United Kingdom extracted 125 grams of protactinium-231 from 60 tons of Atomic Energy Authority waste — an effort that cost £500,000 (about US$ 14 million in today\'s money). It was the largest amount of the element ever gathered in one place, and for decades it served as the world\'s reserve for any experiment that needed protactinium. The operation is often cited as an example of the disproportionate cost of research on extremely rare elements: enormous financial and radiological investment for a handful of basic experiments.',
  },
  92: {
    overview:
      'Uranium is the heaviest natural element on Earth, silvery and weakly radioactive. It is the basis of nuclear power, atomic weapons, and geological dating. Although associated with 20th-century tragedies (Hiroshima, Chernobyl, Fukushima), it is also the most energy-dense fuel humans can use — one gram of enriched uranium contains the energy of a ton of coal.',
    history:
      'Discovered in 1789 by German chemist Martin Heinrich Klaproth, who named it after the planet Uranus, discovered eight years earlier. Uranium\'s radioactivity was discovered by accident in 1896 by Henri Becquerel, opening the path to nuclear physics. The first controlled chain reaction took place in Chicago in 1942 (Manhattan Project), leading to the Hiroshima and Nagasaki bombs and the nuclear era.',
    properties:
      'Dense metal (19.1 times the density of water, near gold), silvery when freshly cut, it oxidizes rapidly in air. It has three natural isotopes: U-238 (99.27%, very slow decay), U-235 (0.72%, fissionable in reactors) and U-234 (trace). Only U-235 sustains chain reactions, and enriching it is the largest technical obstacle for nuclear programs. It decays through a 14-step chain until becoming stable lead.',
    applications:
      'Fuel in nuclear reactors produces about 10% of global electricity — France, South Korea and Sweden rely heavily on it. Nuclear weapons use U-235 or plutonium (derived from U-238 in reactors). Depleted uranium (without U-235) is used in armor-piercing projectiles and counterweights due to its extreme density. Uranium-lead dating is the most precise method for dating rocks billions of years old.',
    curiosity:
      'The "island of stability" is a hypothetical region of the periodic table with superheavy elements (around Z=114) that would be stable enough to exist for years. So far we have only created atoms that last milliseconds. All this research began with uranium — the last natural element before the realm of synthetic elements born in particle accelerators.',
  },
  93: {
    overview:
      'Neptunium is the first transuranic element — synthesized in 1940, it marks the beginning of the chemistry of elements that do not naturally exist in appreciable quantities on Earth. It was named after Neptune, following uranium in the table just as the planet Neptune follows Uranus in the solar system. It has limited practical importance, but it is the essential precursor for producing plutonium in nuclear reactors.',
    history:
      'Synthesized in 1940 by Edwin McMillan and Philip Abelson at the Lawrence Berkeley National Laboratory, by bombarding uranium with slow neutrons. It was the first unambiguous confirmation that it was possible to create elements beyond uranium. McMillan shared the 1951 Nobel Prize in Chemistry with Glenn Seaborg for the discovery and the subsequent work on transuranics. Small natural amounts were later detected in uranium ores, formed by spontaneous neutron capture.',
    properties:
      'Silvery metal with typical actinide appearance, dense (20.45 g/cm³, denser than uranium), melts at 644 °C. All 20 known isotopes are radioactive — Np-237 is the most stable, with a half-life of 2.14 million years. It has five possible oxidation states (+3 to +7), which makes it chemically versatile. In reactors, Np-237 absorbs neutrons and becomes Pu-238, the critical isotope for space thermoelectric generators.',
    applications:
      'Main industrial application: production of Pu-238 for nuclear batteries (RTGs) used in deep-space probes. In specialized neutron detectors. In small amounts, as a tracer for radiochemical processes. Almost all neptunium in the world is generated as a by-product of plutonium production for weapons and nuclear fuel — tons accumulated in long-term nuclear waste stockpiles.',
    curiosity:
      'Np-237 has a half-life of 2.14 million years — relatively short in geological terms, but too long to be treated as disposable waste. Because more than 60 tons have accumulated globally in nuclear waste, it is one of the main "problems" of permanent atomic waste repositories like Yucca Mountain. Some proposals suggest "transmuting" neptunium in fast reactors, converting it into much shorter-half-life isotopes — shrinking the problem from millions to a few hundred years.',
  },
  94: {
    overview:
      'Plutonium is the most famous transuranic in history — fuel of the first nuclear weapons (the "Fat Man" bomb dropped on Nagasaki in 1945 was made of plutonium) and energy source of nearly every space probe that leaves the inner solar system. It has some of the strangest chemistry and metallurgy known: six allotropic phases in just 600 °C, expanding and contracting unpredictably. It is radioactive, toxic, militarily regulated — and at the same time, without it humanity would not have left Jupiter.',
    history:
      'Synthesized in 1940 by Glenn Seaborg, Arthur Wahl, Joseph Kennedy and Edwin McMillan at Berkeley, by bombarding uranium with deuterons in a cyclotron. The discovery was kept under military secrecy until the end of World War II. It was named after the planet Pluto, continuing the Uranus-Neptune-Pluto series. It was first mass-produced at the Hanford Site, Washington, during the Manhattan Project, in reactors specially built for that purpose.',
    properties:
      'Silvery-gray metal, dense (19.8 g/cm³ in its main phase), melts at 640 °C. It has six allotropic phases between room temperature and the melting point — each with different density and crystal structure — behavior unmatched among metals. Pu-239 (half-life 24,100 years) is fissile and sustains chain reactions with a critical mass of about 10 kg. Pu-238 (half-life 88 years) generates heat by alpha decay, enough to power thermoelectric generators.',
    applications:
      'Pu-239 in nuclear warheads and as fuel in fast reactors and MOX (mixed oxide of Pu and U). Pu-238 in radioisotope thermoelectric generators (RTGs) — powers probes such as Voyager 1 and 2, Cassini, New Horizons and the Curiosity and Perseverance rovers on Mars. Without the decay heat of Pu-238, these missions would not have energy to operate in regions beyond Jupiter, where solar panels are unfeasible.',
    curiosity:
      'Pu-238 production in the U.S. was interrupted in 1988 after the closure of the Savannah River reactor, and for decades NASA relied on stockpiles inherited from the Cold War. In 2013, the Department of Energy resumed production at Oak Ridge — only 1.5 kg per year, on a slow recovery path. Each Mars rover consumes about 4.8 kg, and the total quantity available worldwide literally determines how many interplanetary missions can be done per decade. Plutonium is, perhaps surprisingly, a bottleneck of modern space exploration.',
  },
  95: {
    overview:
      'Americium is the most common transuranic in everyday life — there are probably micrograms of it within a few meters of you right now, inside the smoke detector on the ceiling. Its alpha radiation ionizes the air, and when smoke particles disrupt the ion flow, the alarm triggers. It is one of the rare cases in which a synthesized lab element became a cheap industrial commodity, with billions of units produced annually for a life-saving application.',
    history:
      'Synthesized in 1944 by Glenn Seaborg, Ralph James, Leon Morgan and Albert Ghiorso at the University of Chicago, as part of the Manhattan Project. The name came from the Americas — Seaborg followed a geographic logic, naming it as a counterpart to europium (Z 63). Curiously, Seaborg "revealed" the discovery on a children\'s radio show called "Quiz Kids" in 1945, days before the formal scientific publication — when a child asked if any new elements had been discovered during the war, he simply answered yes.',
    properties:
      'Silvery-white metal, dense (12 g/cm³), melts at 1,176 °C. More malleable than uranium and neptunium. All isotopes are radioactive: Am-241 (most used) has a half-life of 432.2 years and emits medium-energy alpha, ideal for controlled ionization. Am-243 lasts 7,370 years and is important in nuclear research. In air it oxidizes slowly, forming an oxide layer.',
    applications:
      'Residential ionization smoke detectors: about 0.2 micrograms of Am-241 per unit — billions of detectors worldwide. Sources for geophysical logging in oil and gas wells (measure rock density and humidity). In industrial thickness gauges (paper, plastic, metal). Research into transmutation of nuclear waste. Considered as an alternative fuel for deep-space probe batteries, as a partial substitute for the scarce Pu-238.',
    curiosity:
      'In 2010, the 31-year-old Swede Hannes Vagn-Bonde tried to build a homemade nuclear reactor in his kitchen in Ängelholm, extracting americium from smoke detectors and radium from old watches. When neighbors noticed radioactive material, police called the Swedish Nuclear Authority. Luckily, he never came close to critical mass, but he became one of the most famous cases of "amateur nuclear experimentation" — highlighting, in dangerous fashion, just how accessible americium has become, and the ethical limits of scientific DIY.',
  },
  96: {
    overview:
      'Curium is a silvery actinide that emits so much alpha radiation that it glows autonomously red-purple in the dark — a phenomenon similar to that of radium, but even more intense. It was named in honor of Marie and Pierre Curie, and plays a discreet but crucial role in Mars exploration: NASA rovers use Cm-244 sources in spectrometers to identify the chemical composition of Martian rocks, millions of kilometers from any Earth laboratory.',
    history:
      'Discovered in 1944 by Glenn Seaborg, Ralph James and Albert Ghiorso at Berkeley, simultaneously with americium, during the Manhattan Project. It was the third transuranic identified. The name honors the Curie couple, pioneers of radioactivity — one of the few times two people (a man and a woman) named an element. The discovery was kept under military secrecy until 1945, and was publicly announced on November 11 that year by Seaborg on a children\'s radio show.',
    properties:
      'Silvery-white metal, dense (13.52 g/cm³), melts at 1,345 °C. Magnetic and quite reactive — oxidizes in air forming yellow oxide. All 19 known isotopes are radioactive. Cm-244 (half-life 18.1 years) is most used in applications; Cm-247 (15.6 million years) is the most stable. Cm-244 can accumulate enough heat to partially melt itself without an external source. In pure form it emits alpha radiation so intense that the material heats up to hundreds of degrees.',
    applications:
      'Cm-244 in APXS (Alpha Particle X-ray Spectrometer) instruments on the Mars rovers Sojourner, Spirit, Opportunity, Curiosity and Perseverance — bombards rocks with alpha particles and measures returning X-rays to identify elements. Compact heat sources for long-duration space missions. Small amounts in production of other heavy transuranics in reactors. Fundamental research in actinide chemistry and physics.',
    curiosity:
      'The APXS spectrometer, the size of a soda can, contains just a few grams of Cm-244 — but it is the "lab tool" that has identified minerals such as hematite, jarosite and clays on Mars, helping confirm that the Martian surface once had abundant liquid water. Each analysis takes a few hours, and the rover presses the instrument against the rock like a geologist pressing a magnifying glass. Without curium, much of what we know about Mars geochemistry would have been out of reach.',
  },
  97: {
    overview:
      'Berkelium is an extremely rare synthetic actinide, produced in milligrams per year worldwide. Its most important role in science is to serve as the "raw material" for creating even heavier elements: it was from berkelium targets bombarded with calcium that tennessine (Z 117) was synthesized in 2010. It was named in honor of the California city of Berkeley, home of the lab where so many transuranics were discovered.',
    history:
      'Synthesized in 1949 by Stanley Thompson, Albert Ghiorso and Glenn Seaborg at Berkeley, bombarding americium-241 with alpha particles in a cyclotron. It was the fifth transuranic discovered. Ghiorso and Seaborg established the tradition of naming elements after the labs where they were created — hence berkelium (Berkeley), californium (California) and later dubnium (Dubna, Russia) followed the pattern.',
    properties:
      'Silvery metal (presumed, based on chemical properties), dense (about 14.78 g/cm³), probably melts around 986 °C. All 11 known isotopes are radioactive. Bk-247 is the most stable (half-life 1,380 years), while Bk-249 (half-life 330 days) is the most used in research due to its availability. Typical actinide chemical behavior: stable +3 and +4 states.',
    applications:
      'Practically no practical applications outside research: production is so limited and cost so high that it only makes sense as a target for synthesizing heavier elements. Bk-249 was crucial in the discovery of tennessine (Z 117) in 2010, in a collaboration between Oak Ridge (USA) and Dubna (Russia): 22 mg of berkelium were sent to the Russians to be bombarded with calcium-48 ions. The decades-restricted international shipment of radioactive material required complex diplomatic logistics.',
    curiosity:
      'Worldwide annual berkelium production is approximately 1 gram, coming exclusively from the HFIR reactor at Oak Ridge, Tennessee, USA. To create the 22 milligrams used in the discovery of tennessine, about two years of continuous reactor operation were needed. This small batch traveled by commercial plane from the USA to Russia in the mid-2000s, packed in shielded containers — perhaps the most expensive trip ever made by a little more than half a teaspoon of any substance in the history of chemistry.',
  },
  98: {
    overview:
      'Californium is a synthetic actinide notable for a rare property: its isotope Cf-252 emits neutrons spontaneously in impressive amounts — about 170 million per microgram per minute. This makes it a portable neutron source without needing a reactor, used in mineral prospecting, port cargo analysis, detector calibration and radiotherapy for resistant tumors. It is also one of the most expensive substances on the planet: about US$ 27 million per gram.',
    history:
      'Synthesized in 1950 by Stanley Thompson, Kenneth Street, Albert Ghiorso and Glenn Seaborg at Berkeley, bombarding curium with alpha particles. It was the sixth transuranic identified. Like berkelium, it received a geographic name — California — honoring the state and the university that hosted the lab. Commercial production began at Oak Ridge in the 1960s, in quantities of micrograms to a few milligrams per year.',
    properties:
      'Presumed silvery-gray metal, dense (15.1 g/cm³), melts at 900 °C. All 20 known isotopes are radioactive. Cf-251 is the most stable (half-life 898 years), but Cf-252 (half-life 2.645 years) is the one with practical applications — it emits about 3 neutrons per spontaneous fission. One gram of Cf-252 emits as many neutrons as several research reactors, in portable powder form.',
    applications:
      'Neutron source in port cargo scanning to detect illicit nuclear materials. Geophysical logging in oil wells to measure hydrogen and oxygen content of rocks. Internal brachytherapy radiotherapy for brain and cervical tumors resistant to conventional sources. Calibration of neutron detectors in laboratories. Startup initiator in nuclear reactors to generate the first "burst" of neutrons that sustains the chain reaction.',
    curiosity:
      'World Cf-252 production is about 250 milligrams per year — almost all at the HFIR reactor in Oak Ridge, and in small quantity in Dimitrovgrad, Russia. Because of the astronomical price (US$ 27 million/gram) and industrial usefulness, Cf-252 sources are individually tracked by the International Atomic Energy Agency. Each capsule contains a few micrograms and is cataloged from factory to user and back to recycling — a system stricter than that of any other industrial substance in the world.',
  },
  99: {
    overview:
      'Einsteinium is a synthetic actinide discovered in dramatic circumstances: it was found in the debris of the first hydrogen bomb detonation, "Ivy Mike", at Enewetak Atoll in 1952. The thermonuclear test produced conditions so extreme that uranium atoms captured dozens of neutrons in fractions of a second, creating heavy transuranic elements never before seen. It was named in honor of Albert Einstein, who had died just a month before the public announcement of the discovery in 1955.',
    history:
      'Identified in 1952 by Albert Ghiorso and colleagues at the Lawrence Livermore Laboratory, by analyzing corals and dust collected from the debris of the Ivy Mike explosion — the first thermonuclear test in history. The discovery was kept under military secrecy for three years. Only in 1955 was the work published, with the name in honor of Einstein. Curiously, later reactor methods managed to reproduce einsteinium synthesis in slightly larger quantities, but always in the nanogram to microgram range.',
    properties:
      'Presumed silvery metal (some properties extrapolated), dense (8.84 g/cm³), melts at 860 °C. All 19 known isotopes are radioactive. Es-252 is the most stable (half-life 471.7 days) — unusual among heavy actinides, where longer half-lives are typically rare. Emits intense alpha radiation: macroscopic samples would self-heat to hundreds of degrees and glow by radioluminescence.',
    applications:
      'Practically no practical applications — the total amount ever produced in history is a few milligrams, and the short half-life limits uses. In 2021, Berkeley Lab scientists performed the first detailed chemical characterization of einsteinium (spectroscopic studies with 233 nanograms of Es-254) — almost 70 years after the discovery. The work helped understand chemical bonds in heavy actinides, with implications for nuclear waste treatment.',
    curiosity:
      'The story of the einsteinium discovery could only be published after the end of the U.S. thermonuclear program secrecy. Curiously, Albert Einstein — a committed pacifist and critic of the nuclear arms race — was honored with an element discovered in what was, at the time, the most devastating explosion ever caused by humans. Einstein died in April 1955, before the official announcement, and probably never knew that an element on the periodic table had been named in his honor from the remains of an H-bomb.',
  },
  100: {
    overview:
      'Fermium is the last element that can be produced in macroscopic quantities (even if still in nanograms) by neutron bombardment in nuclear reactors — all heavier elements must be synthesized atom by atom in particle accelerators. This physical limit marks a transition in the chemistry of elements: the end of the era in which humans could "make" new matter in weighable amounts. It was discovered, along with einsteinium, in the debris of the first H-bomb in 1952.',
    history:
      'Identified in 1952 by Albert Ghiorso and colleagues in debris samples from the Ivy Mike explosion at Enewetak Atoll, simultaneously with the discovery of einsteinium. The discovery remained under military secrecy until 1955. The name honors Enrico Fermi, an Italian-American physicist who built the first nuclear reactor (Chicago Pile-1, 1942) and played a central role in the Manhattan Project. Fermi died in November 1954, before the formal scientific publication of the element.',
    properties:
      'Presumed silvery metal (never observed in visible quantity), with properties estimated from a few atoms. All 20 known isotopes are radioactive. Fm-257 is the most stable (half-life 100.5 days). It is the last actinide that can be produced by successive neutron capture; from there on, the probability of producing heavier nuclei by this route drops to practically zero, creating a "fermium barrier".',
    applications:
      'No practical applications: production limited to a few picograms in dedicated nuclear reactors, and a half-life too short for any industrial use. Its entire existence is justified by basic research in nuclear structure and chemistry of heavy actinides. In high-neutron-flux reactors such as HFIR, fermium appears as a residual product of californium and einsteinium production.',
    curiosity:
      'The "fermium barrier" is an interesting physical obstacle: from fermium onward, successive neutron captures in reactors do not generate heavier elements — instead, they lead to isotopes that undergo spontaneous fission very quickly, fragmenting back into lighter elements. For this reason, to create mendelevium (Z 101) onward, physicists must use direct fusion of heavy nuclei in particle accelerators — a process that produces individual atoms, not milligrams. Fermium is, in a literal sense, the last "manufacturable" element of the table.',
  },
  101: {
    overview:
      'Mendelevium is a synthetic transuranic, named in honor of Dmitri Mendeleev, author of the modern periodic table. It was the first element in history produced literally one atom at a time — a revolutionary technique in the 1950s that paved the way for the era of superheavy elements. It has no practical application, but its discovery was a methodological milestone, demonstrating that chemistry could be done on an individual atomic scale.',
    history:
      'Synthesized in 1955 by Albert Ghiorso, Bernard Harvey, Greg Choppin, Stanley Thompson and Glenn Seaborg at Berkeley, by bombarding an einsteinium-253 target (only 1 billion atoms available) with alpha particles in a cyclotron. Only 17 atoms were identified in three experiments. The choice of name, in the middle of the Cold War, was politically charged: honoring a Soviet scientist in an American element. The international committee approved it — Mendeleev was a universal symbol of chemistry.',
    properties:
      'No observable macroscopic quantity — all properties are extrapolated from measurements with a few isolated atoms. Density is estimated around 10.3 g/cm³, melting point 827 °C. All 17 known isotopes are radioactive. Md-258 is the most stable (half-life 51.5 days). Curiously, Md exhibits a stable +2 oxidation state in solution — unusual among actinides, which generally prefer +3.',
    applications:
      'No practical applications: total production across all experiments in history is perhaps a few hundred thousand atoms — a quantity that does not even register on nanogram balances. Mendelevium\'s entire existence is in basic research on the electronic structure of heavy actinides and individual atomic detection methods.',
    curiosity:
      'The "one atom at a time" technique developed by Ghiorso and Seaborg to identify mendelevium became the standard for all subsequent superheavy elements. Instead of trying to accumulate visible mass, researchers set up detection chambers that recognize the unique radioactive decay of each individual atom milliseconds after it is produced. Every new element "discovery" since 1955 has been based on a few dozen atoms at most — one of the few areas of science where one can publish based on a statistical sample smaller than twenty.',
  },
  102: {
    overview:
      'Nobelium is a synthetic transuranic with a controversial discovery history: three different groups — Swedish, American and Soviet — claimed to have synthesized it first in the late 1950s. After years of international disputes, the final credit was attributed to the Soviet group at Dubna, but the name proposed by the Swedes — in honor of Alfred Nobel — was kept. It has an unusual chemical property: it prefers the +2 oxidation state, unlike the standard +3 of actinides.',
    history:
      'In 1957, researchers at the Nobel Institute of Physics in Stockholm announced they had synthesized it, but the result was not reproducible. In 1958, the Berkeley group confirmed the synthesis of a different isotope. In 1966, the Dubna Institute (USSR) finally produced the isotope whose existence was definitively established. The IUPAC, in a controversial 1997 decision, attributed the discovery to Dubna but kept the name "nobelium" coined by the Swedes — a rare case in which the discoverer does not name the element.',
    properties:
      'Not observed in macroscopic quantity — properties extrapolated. Density is estimated near 9.9 g/cm³, melting point around 827 °C. All 18 known isotopes are radioactive. No-259 is the most stable (half-life 58 minutes). Characteristically, in aqueous solutions it exists predominantly as No²⁺ — behavior that makes it chemically closer to barium and radium, rather than to neighboring actinides.',
    applications:
      'No known practical applications. Production limited to a few atoms per experiment in specialized accelerators. Use restricted to fundamental research in heavy actinide chemistry, methods of producing superheavy elements, and studies of nuclear symmetry.',
    curiosity:
      'The controversy of the nobelium discovery (and of other transuranics such as rutherfordium, dubnium, seaborgium) lasted decades and became known as the "Transfermium Wars" — a Cold War dispute between American (Berkeley, Livermore), Soviet (Dubna) and German (GSI Darmstadt) laboratories over who had the right to name elements. The IUPAC only managed to definitively resolve all names in 1997, after international committees and multiple votes. It was the biggest scientific naming dispute of the 20th century.',
  },
  103: {
    overview:
      'Lawrencium is the last element of the actinide series and the last on the periodic table before the beginning of the transactinide (superheavy) series. It was named in honor of Ernest Lawrence, an American physicist who invented the cyclotron — the machine that made the synthesis of practically all transuranics possible. It symbolically marks the end of the actinide era and the beginning of the exploration of elements with unprecedented electronic configurations.',
    history:
      'Synthesized in 1961 by Albert Ghiorso and colleagues at Berkeley, bombarding a californium target with boron ions in a heavy cyclotron. The researchers proposed the name "lawrencium" in honor of Ernest Lawrence, founder of the Berkeley lab and dead five years earlier. The Dubna group, in 1965, contested precedence and proposed the name "rutherfordium". The IUPAC decided in 1997: lawrencium for Z 103, rutherfordium for Z 104 — a Solomonic solution to the Transfermium War.',
    properties:
      'Not observed in macroscopic quantity. Estimated density around 15.6 g/cm³, melting point 1,627 °C. All 13 known isotopes are radioactive. Lr-266 is the most stable (half-life about 11 hours). It is the element that closes the 5f¹⁴ electronic configuration typical of actinides — hence the consensus that it belongs to the series, despite some chemical properties bringing it closer to group 3 (scandium, yttrium, lutetium).',
    applications:
      'No practical applications. Production limited to a few atoms per experiment. All the relevance of lawrencium is theoretical and fundamental: it serves to refine electronic structure models in heavy elements, where relativistic effects (the inner electrons move at fractions of the speed of light) begin to distort the behavior predicted by the classical periodic table.',
    curiosity:
      'In 2015, Japanese physicists at RIKEN measured the ionization energy of lawrencium for the first time — an experiment of extreme technical difficulty done with a few dozen atoms. The result was surprising: the value (4.96 eV) was the lowest of the entire actinide series, suggesting that lawrencium\'s outermost electron is less bound to the nucleus than expected. This experimental data reignited the debate over whether lawrencium "really" belongs to the actinides or should be reclassified as the first member of a new category — one of the few cases in which individual atomic measurements influence the structure of the periodic table.',
  },
  104: {
    overview:
      'Rutherfordium is the first transactinide element — it opens the "era of superheavies", a region of the periodic table where atoms are so massive that relativistic effects begin to dominate chemistry. It was also the spark of the "Transfermium War" between the U.S. and USSR: two groups claimed the discovery, with different names, in the midst of the Cold War. The current name honors Ernest Rutherford, the New Zealand physicist whose gold-foil experiment revealed the existence of the atomic nucleus.',
    history:
      'First synthesized in 1964 at the Joint Institute for Nuclear Research in Dubna (USSR) by Georgy Flerov\'s group, bombarding plutonium with neon ions. In 1969, Albert Ghiorso\'s group at Berkeley claimed independent discovery. The Russians proposed "kurchatovium" (in honor of Igor Kurchatov, father of the Soviet nuclear program); the Americans proposed "rutherfordium". The dispute was arbitrated only in 1997 by the IUPAC, which adopted the American name and the symbol Rf.',
    properties:
      'No macroscopically observable quantity. Estimated density around 23.2 g/cm³, melting point 2,100 °C. All 16 known isotopes are radioactive. Rf-267 is the most stable (half-life about 1.3 hours). Chemical experiments with a handful of atoms confirm behavior similar to hafnium (group 4 element, directly above it in the table): forms volatile chlorides and stable +4 states.',
    applications:
      'No practical applications. Produced only in individual-atom quantities for research in transactinide chemistry and the study of relativistic effects in heavy elements. Each experiment requires weeks of continuous operation of heavy-ion accelerators to generate a few dozen atoms.',
    curiosity:
      'Rutherford\'s most famous experiment — in 1909, bombarding a thin gold foil with alpha particles — revealed that atoms have a dense nucleus surrounded by empty space. A hundred years later, physicists use exactly the same technique (with vastly more powerful accelerators) to synthesize elements that honor Rutherford himself. Rutherfordium is a perfect example of the circularity of science: created by nuclear bombardment, named after the inventor of that very type of experiment.',
  },
  105: {
    overview:
      'Dubnium is a synthetic superheavy element that carries the name of the Russian laboratory where it was discovered: the Joint Institute for Nuclear Research in Dubna, near Moscow. Along with rutherfordium, it was a pivot of the Cold War dispute over who would name the transfermium elements. The IUPAC\'s final agreement, in 1997, balanced scientific egos: rutherfordium for the Americans, dubnium for the Russians, seaborgium for the most influential living scientist in transuranic synthesis.',
    history:
      'First synthesized in 1968 at Dubna by Georgy Flerov, bombarding americium-243 with neon ions. In 1970, the Berkeley group confirmed the synthesis of a different isotope, and claimed the name "hahnium" in honor of Otto Hahn (discoverer of fission). After decades of dispute, the IUPAC adopted "dubnium" in 1997 — recognition to the Soviet laboratory that alone discovered six of the transactinides of the first decade.',
    properties:
      'No macroscopic observation. Estimated density 29.3 g/cm³ (one of the theoretically densest elements), melting point around 1,477 °C. All 15 known isotopes are radioactive. Db-268 is the most stable (half-life about 28 hours). Chemical experiments suggest behavior similar to tantalum (group 5): forms volatile halides, dominant +5 state.',
    applications:
      'No practical applications. Exclusive use in transactinide chemistry research. The Dubna Institute maintains regular production of the element for comparative experiments with niobium and tantalum, testing whether periodic trends hold at such large masses.',
    curiosity:
      'The Dubna laboratory, founded in 1956 under Soviet direction, was for decades Berkeley\'s main rival in the race for transuranics. Under the leadership of Georgy Flerov and later Yuri Oganessian, the institute discovered or co-discovered no fewer than 9 of the 15 superheavy elements (Z 104–118). In 2017, Oganessian became only the second living person to have an element (Z 118) named in his honor — after only Seaborg. "Soviet Dubna" was, without competition, the most productive laboratory in history for discovering new elements.',
  },
  106: {
    overview:
      'Seaborgium is a synthetic element whose name carries historical controversy: when proposed in 1994 in honor of Glenn Seaborg — the American chemist who led the discovery of 9 transuranics —, it marked the first time an element would be named after a living person. The IUPAC initially resisted, but after years of debate approved the name in 1997, three years before Seaborg\'s death. It became a symbol of the in-life recognition of one of the most important chemists of the 20th century.',
    history:
      'Synthesized in 1974 simultaneously by Berkeley/Livermore (USA) and Dubna (USSR) groups. The Americans bombarded californium-249 with oxygen-18 ions, and the Russians used lead-208 with chromium-54. After cross-confirmation, the IUPAC recognized the discovery as joint. The choice of name in honor of a living scientist was unprecedented — Seaborg himself attended a ceremony where they "updated" the periodic table in his presence, saying it was "the coolest thing that ever happened to me, better than winning the Nobel".',
    properties:
      'No macroscopic observation. Estimated density 35.0 g/cm³ (probably the densest element in the table), melting point estimated at 1,927 °C. All 12 known isotopes are radioactive. Sg-269 is the most stable (half-life about 14 minutes). Chemical experiments with a handful of atoms confirm behavior similar to tungsten (group 6): forms volatile oxychlorides with +6 oxidation state.',
    applications:
      'No practical applications. Research in superheavy element chemistry and the study of relativistic effects on periodic behavior. The chemical experiments with seaborgium were a methodological milestone: they demonstrated that "chemistry" was possible with elements whose half-life is a few minutes and whose total quantity is just a handful of atoms.',
    curiosity:
      'Glenn Seaborg was one of the most decorated scientists of the 20th century: Nobel Prize in Chemistry 1951, director of the U.S. Atomic Energy Commission under 10 presidents, and oversaw the discovery of plutonium, americium, curium, berkelium, californium, einsteinium, fermium, mendelevium and nobelium. When seaborgium received his name in 1997, Seaborg joked: "now I can say there are five elements from the periodic table at my home address — I live in Berkeley (Bk), California (Cf), in America (Am), near the (Pacific) ocean, and my name is Seaborg (Sg)." He died two years later, in 1999.',
  },
  107: {
    overview:
      'Bohrium is a synthetic superheavy element named in honor of the Danish physicist Niels Bohr — father of the modern atomic model, creator of early quantum theory, and spiritual leader of the generation that built 20th-century physics. It was synthesized in 1981 at the German GSI Darmstadt laboratory, marking the start of a string of German discoveries that would give the institute six elements on the periodic table.',
    history:
      'Synthesized in 1981 by Peter Armbruster and Gottfried Münzenberg at the GSI Center for Heavy Ion Research in Darmstadt, Germany, by bombarding bismuth-209 with chromium-54 ions. The proposed name was "nielsbohrium", later simplified to "bohrium" by the IUPAC in 1997. Only six atoms were observed in the original experiment — a typical quantity for the era of superheavies synthesized by "cold fusion".',
    properties:
      'No macroscopic observation. Estimated density 37.1 g/cm³, melting point probably above 2,500 °C. All 12 known isotopes are radioactive. Bh-270 is the most stable (half-life about 1 minute, exceptional for a superheavy). Chemical experiments in 2000 showed that bohrium behaves like rhenium (group 7), forming volatile oxychlorides — confirming that the classical periodic table still predicts trends in elements synthesized with so many protons.',
    applications:
      'No practical applications. Fundamental research in chemistry and nuclear stability of superheavy elements. The GSI group continued producing bohrium in later experiments to test properties and search for isotopes with longer half-lives.',
    curiosity:
      'Niels Bohr was a central figure not only in physics but in the moral history of the 20th century: he fled Nazi-occupied Denmark in 1943, helped Jewish scientists, worked on the Manhattan Project, and after the war used his prestige to defend openness and international control of nuclear weapons. The element bohrium is the only superheavy named after a scientist whose work spans both pure physics and the ethics of science — a name choice with more symbolic weight than appears at first glance.',
  },
  108: {
    overview:
      'Hassium is a synthetic superheavy element named after the Latin name for the German state of Hessen (Hassia) — where the GSI Darmstadt institute that synthesized it in 1984 is located. It is one of the most chemically well-studied transactinides: experiments confirmed that it behaves like osmium, its group 8 neighbor, validating periodic table predictions at extreme masses.',
    history:
      'Synthesized in 1984 by Peter Armbruster, Gottfried Münzenberg and colleagues at GSI Darmstadt, by bombarding lead-208 with iron-58 ions. Only three atoms were detected in the original experiment. The choice of name — Hessen, the state where Darmstadt is located — sparked debate at the IUPAC, but was approved in 1997. The symbol Hs is an abbreviation for "Hassia", the Latin form of the Germanic name.',
    properties:
      'No macroscopic observation. Estimated density 41.0 g/cm³ (perhaps the densest element in the table, exceeding even seaborgium in the most recent predictions). Melting point estimated above 100 °C. All 15 known isotopes are radioactive. Hs-269 is the most stable (half-life about 10 seconds). Experiments in 2001–2002 chemically confirmed that it forms a volatile HsO₄ tetroxide — direct analog of the OsO₄ used in microscopy.',
    applications:
      'No practical applications. Fundamental research: the experiment that confirmed HsO₄ was one of the methodological milestones of superheavy chemistry — it demonstrated that it was possible to observe specific chemical reactions with just six atoms of the element during a few seconds each.',
    curiosity:
      'The 2001–2002 experiment that confirmed the chemistry of hassium is a fascinating technical achievement: GSI researchers synthesized hassium atoms one by one, let them react with oxygen to form volatile HsO₄ tetroxide, and used that volatility to "deposit" the atoms in a series of detectors cooled at progressively lower temperatures — exactly as osmium behaves. Each atom detected was an independent confirmation that periodic chemistry works up to Z=108. The precision achieved was remarkable: a handful of atoms, each weighing 4.5 × 10⁻²² grams, generated data publishable in high-impact scientific journals.',
  },
  109: {
    overview:
      'Meitnerium is a synthetic superheavy element named in honor of the Austrian physicist Lise Meitner — one of the people chiefly responsible for the discovery of nuclear fission in 1938, but who was excluded from the 1944 Nobel Prize in Chemistry, received only by her collaborator Otto Hahn. The element\'s name is a posthumous recognition: a late attempt by the scientific community to correct one of the most well-known injustices in the history of the Nobel prizes.',
    history:
      'Synthesized in 1982 by Peter Armbruster, Gottfried Münzenberg and colleagues at GSI Darmstadt, by bombarding bismuth-209 with iron-58 ions. Only a single atom was observed in the original experiment — an extreme example of "discovery from a sample of size one". The name "meitnerium" was proposed by the discoverers themselves and ratified by the IUPAC in 1997, along with bohrium, hassium and others.',
    properties:
      'No macroscopic observation. Estimated density 37.4 g/cm³, melting point above 1,700 °C. All 8 known isotopes are radioactive. Mt-278 is the most stable (half-life about 7 seconds). By analogy with iridium (group 9, periodic neighbor), noble metal chemical behavior is expected. No definitive chemical experiment has been done yet.',
    applications:
      'No practical applications. Fundamental research on nuclear stability of superheavy elements.',
    curiosity:
      'Lise Meitner was one of the first women to earn a doctorate in physics in Austria (1906) and the first female full professor of physics in Germany (1926). In 1938, she calculated together with Otto Frisch that the uranium nucleus bombarded with neutrons was fragmenting — an interpretation she named "fission". When the Nobel was granted in 1944 only to Otto Hahn (her lab colleague who had conducted the experiment), the error shocked the scientific community and was never corrected. Meitner died in 1968 without the prize. The element meitnerium, named in 1997, is an uncomfortable tribute, a permanent reminder that the Nobel also gets it wrong.',
  },
  110: {
    overview:
      'Darmstadtium is a synthetic superheavy element whose name honors the German city of Darmstadt, home of the GSI institute where it was discovered in 1994. It is one of six elements in the periodic table named after the city or laboratory of discovery — along with berkelium, californium, dubnium, livermorium and hassium (this last indirectly). Together with roentgenium and copernicium, it opened the German series of elements discovered via "cold fusion".',
    history:
      'Synthesized in November 1994 by Sigurd Hofmann and colleagues at GSI Darmstadt, by bombarding lead-208 with nickel-62 ions. Only three atoms were observed in the original experiment. The name "darmstadtium" was chosen by the discoverers and ratified by the IUPAC in 2003. Other names proposed during the process included "wixhausium" (Wixhausen, a Darmstadt district) and "policium" (in honor of 110, the German police emergency number).',
    properties:
      'No macroscopic observation. Estimated density 34.8 g/cm³, melting point above 1,500 °C. All 11 known isotopes are radioactive. Ds-281 is the most stable (half-life about 13 seconds). By analogy with platinum (group 10), noble metal chemical behavior is expected — but experiments with darmstadtium have not been conclusive yet because of the short half-life.',
    applications:
      'No practical applications. Fundamental research.',
    curiosity:
      'GSI researchers joked for years with the alternative name "policium" — a reference to the German 110, equivalent to the U.S. 911. The joke became serious when international colleagues officially proposed the name at a meeting, but the IUPAC vetoed it claiming that element names should not be linked to public emergency services. In compensation, the name "darmstadtium" became local pride: the city of Darmstadt has a commemorative sculpture in its main square, and GSI visitors are invited to see the small underground detector where the element was first observed.',
  },
  111: {
    overview:
      'Roentgenium is a synthetic superheavy element named in honor of the German physicist Wilhelm Conrad Röntgen, discoverer of X-rays in 1895. The tribute is particularly fitting: it was the discovery of X-rays that opened the way to nuclear and atomic physics, without which it would be impossible to synthesize elements such as roentgenium itself. It is one of the most symbolically happy cases of naming in the history of the periodic table.',
    history:
      'Synthesized in December 1994 by Sigurd Hofmann and colleagues at GSI Darmstadt, by bombarding bismuth-209 with nickel-64 ions. Only three atoms were observed. The name "roentgenium" was chosen by the discoverers in honor of the 110th anniversary of the discovery of X-rays by Röntgen (which would be approved in 2005 — a perfect mathematical coincidence). The IUPAC ratified the name in 2004.',
    properties:
      'No macroscopic observation. Estimated density 28.7 g/cm³, melting point estimated at 2,700 °C. All 9 known isotopes are radioactive. Rg-282 is the most stable (half-life about 2 minutes — relatively long for a superheavy, due to effects of nuclear shell closure). By analogy with gold (group 11), noble metal behavior is expected. Relativistic calculations suggest that roentgenium could be even less reactive than gold.',
    applications:
      'No practical applications. Research in nuclear stability of superheavy elements and the search for the "island of stability".',
    curiosity:
      'When Wilhelm Röntgen discovered X-rays in 1895, he transformed medicine in a few months — by 1896, surgeons were already using radiography to locate fractures and bullets in living bodies. Röntgen refused to patent his discovery, saying it belonged to all humanity, and won the first Nobel Prize in Physics in 1901. He donated all of his prize money to the university where he worked. More than a century later, German physicists synthesize superheavy elements using direct descendants of the techniques Röntgen opened — a chain of scientific gift-giving that culminates in element number 111.',
  },
  112: {
    overview:
      'Copernicium is a synthetic superheavy element named in honor of Nicolaus Copernicus, the Polish astronomer who revolutionized the worldview in the 16th century by proposing the heliocentric model — Earth orbiting the Sun, and not the other way around. The name was proposed in 2009, the 500th anniversary year of the publication of "On the Revolutions of the Heavenly Bodies". It is perhaps the only element named after such an ancient and founding figure of modern science.',
    history:
      'Synthesized in 1996 by Sigurd Hofmann and colleagues at GSI Darmstadt, by bombarding lead-208 with zinc-70 ions. Only two atoms were initially observed. The IUPAC ratified the name "copernicium" in 2010, with an official ceremony at GSI. The symbol Cn was chosen because "Co" and "Cp" were already in use. The tribute to Copernicus was proposed in recognition of his role in triggering the scientific revolution that led, centuries later, to modern physics.',
    properties:
      'No macroscopic observation. Estimated density 23.7 g/cm³, melting point perhaps close to zero or negative — calculations suggest copernicium may be liquid or gaseous at room temperature, which would be revolutionary among metals. All 7 known isotopes are radioactive. Cn-285 is the most stable (half-life about 30 seconds). Chemical experiments in 2007 suggested behavior similar to mercury (group 12), with possibly even greater volatility.',
    applications:
      'No practical applications. Research in transactinide chemistry and extreme relativistic effects — copernicium is one of the cases where quantum relativistic effects can be most visible, profoundly altering the behavior expected for a transition metal.',
    curiosity:
      'More advanced relativistic calculations suggest that copernicium may be the first post-actinide metal to be gaseous or liquid at standard conditions — a striking anomaly in the periodic table. This would happen because the inner electrons of the atom move at a significant fraction of the speed of light and become relativistically "contracted", shielding the valence electrons and reducing metallic cohesion. If experimentally confirmed (which has not yet been done because the atoms decay too fast), copernicium would visually resemble argon — an impossibly inert gas, instead of the expected transition metal.',
  },
  113: {
    overview:
      'Nihonium is the first element discovered in an Asian laboratory — synthesized by the Japanese team at RIKEN, near Tokyo. Its name comes from "Nihon", one of the Japanese ways to refer to the country (the other is "Nippon"). It is a historical milestone: after decades of discoveries dominated by the U.S., Russia and Germany, Asia joined the exclusive club of countries that name elements on the periodic table.',
    history:
      'Synthesized from 2003 onward by Kosuke Morita\'s team at RIKEN, by bombarding bismuth-209 with zinc-70 ions. Only three atoms were observed in nine years of continuous experiments — a discovery rate of approximately one atom every three years. In parallel, a Russian-American group (Dubna + Livermore) also produced nihonium in 2003 as a decay product of moscovium (Z 115). After a precedence dispute, the IUPAC gave the discovery credit to RIKEN in 2015. The choice of "nihonium" honors Japan, giving Asia its first element on the table.',
    properties:
      'No macroscopic observation. Estimated density 16 g/cm³, melting point perhaps around 430 °C. All 6 known isotopes are radioactive. Nh-286 is the most stable (half-life about 10 seconds). By analogy with thallium (group 13), post-transition metal behavior is expected — but relativistic predictions suggest that nihonium could be surprisingly less reactive than thallium, due to contraction of the outer electronic shell.',
    applications:
      'No practical applications.',
    curiosity:
      'The discovery of nihonium was celebrated in Japan as a moment of national pride. When the IUPAC announced the name in 2016, Prime Minister Shinzo Abe personally congratulated the team, and Japanese television broadcast the announcement in prime time. The research leader, Kosuke Morita, dedicated the discovery to the victims of the 2011 tsunami, which devastated the Fukushima region — not far from RIKEN. Japan\'s presence in the periodic table began to be taught in schools as an example of scientific perseverance: 553 days of accelerators working 24 hours straight just to confirm the existence of three atoms.',
  },
  114: {
    overview:
      'Flerovium is a synthetic superheavy element initially considered the "center" of the hypothetical "island of stability" — a region of the periodic table where superheavy elements could have significantly longer half-lives (up to years or decades) thanks to particularly stable nuclear configurations. The isotopes synthesized so far have fallen short of expectations, but the search for the island remains one of the major goals of nuclear physics.',
    history:
      'Synthesized in 1998 by Yuri Oganessian and colleagues at the Joint Institute for Nuclear Research in Dubna, in partnership with Lawrence Livermore National Laboratory. The bombardment of plutonium-244 with calcium-48 ions produced a single atom of the isotope Fl-289. The name "flerovium" honors Georgy Flerov, the Soviet physicist founder of the Dubna laboratory, discoverer of spontaneous fission and leader of several transuranic synthesis campaigns. It was ratified by the IUPAC in 2012.',
    properties:
      'No macroscopic observation. Estimated density 14 g/cm³, melting point perhaps around -73 °C — suggesting that flerovium could be liquid or gaseous at room temperature, behavior closer to a noble gas than to the metal predicted by group 14. All 6 known isotopes are radioactive. Fl-289 is the most stable (half-life about 2.6 seconds). Recent calculations show such intense relativistic effects that flerovium could, in theory, have a more noble character than lead (group 14, periodic neighbor).',
    applications:
      'No practical applications. Research in nuclear stability of superheavies and search for the island of stability.',
    curiosity:
      'The "island of stability" was predicted in the 1960s by Glenn Seaborg and colleagues, based on nuclear models that suggested magic numbers of protons (Z = 114, 120 or 126) with particularly stable shell closures. The hope was that these elements could have half-lives of millions of years, sufficient to be found in small quantities in nature. After decades of searching in meteorites and geological samples, no trace has been found. Experiments on flerovium showed half-lives of seconds — far from the island. But if more neutron-rich isotopes are synthesized (with 184 or more neutrons), the island could still be real. The hunt continues.',
  },
  115: {
    overview:
      'Moscovium is a synthetic superheavy element named after the Moscow Oblast region (where the Joint Institute for Nuclear Research in Dubna is located). Synthesized in 2003, it was one of the first elements discovered in partnership between Dubna and Lawrence Livermore National Laboratory — a collaboration that marked the end of the Transfermium War and the beginning of a cooperative era in superheavy physics.',
    history:
      'Synthesized in 2003 by Yuri Oganessian and colleagues at Dubna, in partnership with Ken Moody\'s group at Livermore, by bombarding americium-243 with calcium-48 ions. Only four atoms were observed in the original experiment. The IUPAC ratified the name "moscovium" in 2016, together with tennessine (Z 117) and oganesson (Z 118) — the latest official batch of periodic table names to date.',
    properties:
      'No macroscopic observation. Estimated density 13.5 g/cm³, melting point perhaps around 400 °C. All 5 known isotopes are radioactive. Mc-290 is the most stable (half-life about 16 milliseconds). By analogy with bismuth (group 15), post-transition metal behavior is expected, but relativistic calculations suggest properties closer to those of a metalloid.',
    applications:
      'No practical applications.',
    curiosity:
      'In 2013, a former Canadian military scientist named Bob Lazar claimed in a TV interview that "element 115" was the fuel for the flying saucers allegedly recovered at Roswell, New Mexico. The story became a conspiracy pop-culture meme — and the IUPAC chose not to avoid the name coincidence when ratifying "moscovium" as Z 115 in 2016. Today, pseudoscientific videos about "Element 115 antigravity engines" coexist on the internet with serious scientific publications about the nuclear properties of Mc-290. It was perhaps the only element in the table whose scientific discovery preceded — and inadvertently contradicted — a pre-existing popular conspiracy theory.',
  },
  116: {
    overview:
      'Livermorium is a synthetic superheavy element named after the Lawrence Livermore National Laboratory, in California — a nuclear research institution founded in 1952 that, together with the Dubna Institute in Russia, has led superheavy element discoveries since the 1990s. It is the second element in the table with a name linked to Livermore, after californium (Z 98) — although the latter honors the state, not the laboratory.',
    history:
      'Synthesized in 2000 by Yuri Oganessian at Dubna, in collaboration with Ken Moody at Lawrence Livermore National Laboratory, by bombarding curium-248 with calcium-48 ions. Only a single atom was observed in the original experiment — later confirmed by other experiments. The IUPAC ratified the name "livermorium" in 2012, in recognition of the U.S.-Russia collaboration that produced four new elements (114, 115, 116 and 118) in the first decade of the 21st century.',
    properties:
      'No macroscopic observation. Estimated density 12.9 g/cm³, melting point perhaps around 380 °C. All 4 known isotopes are radioactive. Lv-293 is the most stable (half-life about 57 milliseconds). By analogy with polonium (group 16), metalloid behavior is expected, but theoretical predictions suggest livermorium might be even more metallic — behavior altered by heavy relativistic effects.',
    applications:
      'No practical applications.',
    curiosity:
      'The Lawrence Livermore National Laboratory has a controversial trajectory: founded in 1952 as the second U.S. nuclear laboratory (after Los Alamos), initially focused on thermonuclear weapon design, and gradually transformed into a center for research in applied physics, biology and energy. Its participation in transuranic discoveries is part of a cultural transition: scientists who once designed bombs today collaborate with Russian colleagues to discover elements. Livermorium is, in a symbolic sense, part of the peaceful legacy of institutions born of the Cold War.',
  },
  117: {
    overview:
      'Tennessine is the second-heaviest element ever synthesized and the last halogen synthesized in the periodic table (so far). It received its name in honor of the American state of Tennessee, where Oak Ridge National Laboratory is located — supplier of the extremely rare berkelium isotope that was essential for the synthesis. It is also an example of advanced international cooperation: the discovery involved scientists from the U.S. and Russia, and used 22 mg of Bk-249 transported in shielded containers via commercial airplane.',
    history:
      'Synthesized in 2010 by a collaboration between Dubna, Oak Ridge, Vanderbilt University and Livermore, by bombarding a berkelium-249 target (produced at Oak Ridge over two years in the HFIR reactor) with calcium-48 ions (at Dubna). Six atoms were observed in the experiment. The IUPAC ratified the name "tennessine" in 2016 — the "-ine" ending follows the halogen tradition (fluorine, chlorine, bromine, iodine, astatine). It is the only superheavy element to receive a halogen suffix.',
    properties:
      'No macroscopic observation. Estimated density 7.2 g/cm³, melting point perhaps around 600 °C. All 2 known isotopes are radioactive. Ts-294 has a half-life of about 80 milliseconds. By analogy with astatine (group 17), behavior intermediate between halogen and metalloid is expected. Relativistic calculations suggest that tennessine may not exhibit classical halogen properties: it could be a solid metal or metalloid instead of a diatomic gas, due to relativistic contraction of the outer electrons.',
    applications:
      'No practical applications.',
    curiosity:
      'The synthesis of tennessine is one of the most notable examples of international scientific cooperation amid geopolitical tensions. In 2009, at the height of sanctions between the U.S. and Russia, Oak Ridge produced 22 mg of Bk-249 — a quantity that cost US$ 3.5 million and required two years of continuous HFIR reactor operation. The material was shipped to Dubna in certified nuclear packaging, crossing the Atlantic on a commercial flight. The Russians bombarded the berkelium target for 150 days, observing six atoms of the new element. Each tennessine atom detected cost, adding everything up, about US$ 600,000 — one of the most expensive scientific discoveries ever made per unit of observed mass.',
  },
  118: {
    overview:
      'Oganesson is the heaviest element ever synthesized and the last to be officially recognized by the IUPAC (in 2016). It marks the current human limit of creating matter, and was named in honor of the Armenian-Russian physicist Yuri Oganessian — leader of the Dubna experiments, responsible for more superheavy element discoveries than any other living scientist. It is only the second element in history to receive the name of a living person, after seaborgium.',
    history:
      'Synthesized in 2002 by Yuri Oganessian at Dubna, in collaboration with Livermore, by bombarding californium-249 with calcium-48 ions. Only one atom was observed in the initial experiment; a few more were confirmed in 2005 and 2006. The discovery was confirmed by the IUPAC in 2015, and the name "oganesson" was ratified in 2016 — together with nihonium, moscovium and tennessine, completing the seventh and last row of the periodic table. Oganessian, then 83 years old, attended the official naming ceremony.',
    properties:
      'No macroscopic observation. Estimated density 4.9–5.1 g/cm³ (extremely low for a heavy element), melting point perhaps close to 50 °C. Only 5 atoms of the isotope Og-294 have ever been detected. Half-life of about 700 microseconds. It belongs formally to group 18 (noble gases), but relativistic calculations suggest that oganesson may actually be a semiconductor solid at room temperature — not a gas. Extreme relativistic effects invert expectations based on the classical periodic table.',
    applications:
      'No practical applications. All relevance is in fundamental research on the limits of the periodic table and the possibility of even heavier elements (Z=119, 120 and beyond).',
    curiosity:
      'Yuri Oganessian is a singular figure: born in 1933 in Rostov-on-Don, under the Soviet Union, he was trained in nuclear physics in Moscow, joined the Dubna Institute in 1956 and never left — he spent 70 years at the same institution. Under his leadership, Dubna synthesized six elements (Z 113, 114, 115, 116, 117, 118), a number without parallel in the history of the periodic table. In 2016, at 83, he saw his name eternalized in the heaviest element ever created by humans. Like Glenn Seaborg before him, he is one of the very few scientists to witness his own name turn into a permanent part of chemistry. In 2024, at 91, he is still actively working at Dubna, planning experiments to synthesize element 119 and to push beyond the seventh row of the table.',
  },
};

// ── Public API ────────────────────────────────────────────────────
// elContentFor(z) returns the section object for the active language,
// falling back to the other language if one of them is missing, or
// null if no content exists for this element yet.
function elContentFor(z) {
  if (z == null) return null;
  const lang = (window.I18N && window.I18N.lang) || 'en';
  if (lang === 'en') return _ELEMENT_CONTENT_EN[z] || _ELEMENT_CONTENT_PT[z] || null;
  return _ELEMENT_CONTENT_PT[z] || _ELEMENT_CONTENT_EN[z] || null;
}

// Expose globally for element-page.js.
window.ELEMENT_CONTENT_PT = _ELEMENT_CONTENT_PT;
window.ELEMENT_CONTENT_EN = _ELEMENT_CONTENT_EN;
window.elContentFor = elContentFor;
