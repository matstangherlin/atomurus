"use strict";

const PHASES = [
  {
    id: "sistema",
    number: "01",
    title: "Entender o Sistema",
    duration: "1 semana",
    target: "Sistema",
    subtitle: "Pare de ver desenhos aleatorios e comece a ver estrutura.",
    mentor: "Nesta fase voce entende o mapa: Hanzi, Pinyin, tons, teclado, radicais e frase simples."
  },
  {
    id: "pinyin",
    number: "02",
    title: "Pronuncia e Pinyin",
    duration: "2 semanas",
    target: "Sons",
    subtitle: "Construa ouvido antes de tentar memorizar tudo.",
    mentor: "Treine iniciais, finais e tons todos os dias. A pronuncia e o motor do mandarim."
  },
  {
    id: "sobrevivencia",
    number: "03",
    title: "Sobrevivencia",
    duration: "1 mes",
    target: "300 palavras",
    subtitle: "Frases uteis primeiro, personagens depois.",
    mentor: "Aqui a meta e conseguir se apresentar, agradecer, pedir ajuda e reconhecer frases reais."
  },
  {
    id: "caracteres",
    number: "04",
    title: "Primeiros Caracteres",
    duration: "1 mes",
    target: "100 hanzi",
    subtitle: "Comece pequeno: numeros, pessoa, boca, montanha, agua, fogo e arvore.",
    mentor: "Escreva pouco, mas escreva com intencao. O traco vira memoria muscular."
  },
  {
    id: "radicais",
    number: "05",
    title: "Construcao Logica",
    duration: "2 meses",
    target: "Radicais",
    subtitle: "Desmonte caracteres em pecas visuais e semanticas.",
    mentor: "Radicais nem sempre contam a historia literal, mas quase sempre ajudam a organizar a memoria."
  },
  {
    id: "conversa",
    number: "06",
    title: "Conversacao",
    duration: "continuo",
    target: "5 minutos",
    subtitle: "Familia, comida, trabalho, viagens, hobbies e compras.",
    mentor: "Respostas curtas e corretas valem mais do que frases enormes travadas."
  },
  {
    id: "leitura",
    number: "07",
    title: "Leitura Expandida",
    duration: "continuo",
    target: "500+ hanzi",
    subtitle: "Saia de frases isoladas para textos pequenos.",
    mentor: "Quando 500 caracteres ficam familiares, leitura deixa de parecer parede e vira trilha."
  }
];

const TABS = [
  { id: "sistema", label: "Visao geral" },
  { id: "pinyin", label: "Pinyin e tons" },
  { id: "sobrevivencia", label: "Frases praticas" },
  { id: "caracteres", label: "Caracteres" },
  { id: "radicais", label: "Radicais" },
  { id: "conversa", label: "Tutor IA" }
];

const DAILY = [
  {
    id: "aquecimento",
    label: "Aquecimento de tons",
    short: "Tons",
    icon: "声",
    goal: 10,
    xp: 10,
    tab: "pinyin",
    description: "Ouvir e repetir ma, ma, ma, ma ate o ouvido acordar."
  },
  {
    id: "pinyin",
    label: "Iniciais e finais",
    short: "Pinyin",
    icon: "拼",
    goal: 15,
    xp: 15,
    tab: "pinyin",
    description: "Treinar combinacoes simples antes de ver caracteres."
  },
  {
    id: "frases",
    label: "Frases de sobrevivencia",
    short: "Frases",
    icon: "话",
    goal: 15,
    xp: 15,
    tab: "sobrevivencia",
    description: "Virar cards uteis: ola, obrigado, nao entendo, fale de novo."
  },
  {
    id: "logica-hanzi",
    label: "Desmontar um Hanzi",
    short: "Logica",
    icon: "休",
    goal: 15,
    xp: 20,
    tab: "caracteres",
    description: "Entender como pecas visuais viram significado."
  },
  {
    id: "escrita",
    label: "Lousa de escrita",
    short: "Escrita",
    icon: "字",
    goal: 15,
    xp: 20,
    tab: "caracteres",
    description: "Praticar tracos sem pressa, com memoria muscular."
  },
  {
    id: "conversa",
    label: "Mini conversa IA",
    short: "IA",
    icon: "说",
    goal: 10,
    xp: 20,
    tab: "conversa",
    description: "Responder tres frases curtas e terminar o ciclo do dia."
  }
];

const INITIALS = [
  ["b", "八", "ba"], ["p", "怕", "pa"], ["m", "妈", "ma"], ["f", "发", "fa"],
  ["d", "大", "da"], ["t", "他", "ta"], ["n", "你", "ni"], ["l", "来", "lai"],
  ["g", "高", "gao"], ["k", "看", "kan"], ["h", "好", "hao"], ["j", "家", "jia"],
  ["q", "请", "qing"], ["x", "谢", "xie"], ["zh", "中", "zhong"], ["ch", "吃", "chi"],
  ["sh", "是", "shi"], ["r", "人", "ren"], ["z", "在", "zai"], ["c", "菜", "cai"],
  ["s", "三", "san"], ["y", "一", "yi"], ["w", "我", "wo"]
];

const FINALS = [
  ["a", "阿", "a"], ["o", "哦", "o"], ["e", "饿", "e"], ["i", "一", "yi"],
  ["u", "五", "wu"], ["ü", "女", "nu"], ["ai", "爱", "ai"], ["ei", "杯", "bei"],
  ["ao", "好", "hao"], ["ou", "口", "kou"], ["an", "安", "an"], ["en", "人", "ren"],
  ["ang", "忙", "mang"], ["eng", "冷", "leng"], ["ong", "中", "zhong"]
];

const TONES = [
  { tone: "1o tom", pinyin: "mā", hanzi: "妈", name: "alto e plano", meaning: "mae" },
  { tone: "2o tom", pinyin: "má", hanzi: "麻", name: "subindo", meaning: "canhamo" },
  { tone: "3o tom", pinyin: "mǎ", hanzi: "马", name: "desce e sobe", meaning: "cavalo" },
  { tone: "4o tom", pinyin: "mà", hanzi: "骂", name: "descendo", meaning: "xingar" }
];

const PHRASES = [
  { hanzi: "你好", pinyin: "Ni hao", tone: "Nǐ hǎo", pt: "Ola.", category: "Saudacoes" },
  { hanzi: "谢谢", pinyin: "Xiexie", tone: "Xièxie", pt: "Obrigado.", category: "Cortesia" },
  { hanzi: "我叫马修", pinyin: "Wo jiao Maxiu", tone: "Wǒ jiào Mǎxiū", pt: "Meu nome e Matheus.", category: "Apresentacao" },
  { hanzi: "我是巴西人", pinyin: "Wo shi Baxi ren", tone: "Wǒ shì Bāxī rén", pt: "Sou brasileiro.", category: "Apresentacao" },
  { hanzi: "我不会说中文", pinyin: "Wo bu hui shuo Zhongwen", tone: "Wǒ bú huì shuō Zhōngwén", pt: "Eu nao falo chines.", category: "Sobrevivencia" },
  { hanzi: "这个多少钱", pinyin: "Zhe ge duo shao qian", tone: "Zhè ge duōshao qián", pt: "Quanto custa isto?", category: "Compras" },
  { hanzi: "请再说一遍", pinyin: "Qing zai shuo yi bian", tone: "Qǐng zài shuō yí biàn", pt: "Por favor, fale de novo.", category: "Sobrevivencia" },
  { hanzi: "我不明白", pinyin: "Wo bu ming bai", tone: "Wǒ bù míngbai", pt: "Eu nao entendo.", category: "Sobrevivencia" },
  { hanzi: "你会说英语吗", pinyin: "Ni hui shuo Yingyu ma", tone: "Nǐ huì shuō Yīngyǔ ma", pt: "Voce fala ingles?", category: "Perguntas" },
  { hanzi: "很高兴认识你", pinyin: "Hen gaoxing renshi ni", tone: "Hěn gāoxìng rènshi nǐ", pt: "Prazer em conhecer voce.", category: "Cortesia" }
];

const CHARACTERS = [
  { hanzi: "一", pinyin: "yi", tone: "yī", pt: "um", strokes: 1, origin: "linha unica" },
  { hanzi: "二", pinyin: "er", tone: "èr", pt: "dois", strokes: 2, origin: "duas linhas" },
  { hanzi: "三", pinyin: "san", tone: "sān", pt: "tres", strokes: 3, origin: "tres linhas" },
  { hanzi: "人", pinyin: "ren", tone: "rén", pt: "pessoa", strokes: 2, origin: "figura humana andando" },
  { hanzi: "口", pinyin: "kou", tone: "kǒu", pt: "boca", strokes: 3, origin: "abertura da boca" },
  { hanzi: "山", pinyin: "shan", tone: "shān", pt: "montanha", strokes: 3, origin: "picos ligados por base" },
  { hanzi: "水", pinyin: "shui", tone: "shuǐ", pt: "agua", strokes: 4, origin: "fluxo de agua" },
  { hanzi: "火", pinyin: "huo", tone: "huǒ", pt: "fogo", strokes: 4, origin: "chamas" },
  { hanzi: "木", pinyin: "mu", tone: "mù", pt: "arvore", strokes: 4, origin: "tronco e galhos" },
  { hanzi: "日", pinyin: "ri", tone: "rì", pt: "sol; dia", strokes: 4, origin: "sol em forma de quadro" },
  { hanzi: "月", pinyin: "yue", tone: "yuè", pt: "lua; mes", strokes: 4, origin: "lua crescente estilizada" },
  { hanzi: "心", pinyin: "xin", tone: "xīn", pt: "coracao", strokes: 4, origin: "coracao visto como centro emocional" }
];

const COMBOS = [
  {
    left: { hanzi: "人", label: "pessoa" },
    right: { hanzi: "木", label: "arvore" },
    result: "休",
    tone: "xiū",
    meaning: "descansar",
    story: "Uma pessoa encostada em uma arvore. A imagem vira a ideia de repouso."
  },
  {
    left: { hanzi: "日", label: "sol" },
    right: { hanzi: "月", label: "lua" },
    result: "明",
    tone: "míng",
    meaning: "brilhante; claro",
    story: "Sol e lua juntos formam uma imagem de claridade."
  },
  {
    left: { hanzi: "木", label: "arvore" },
    right: { hanzi: "木", label: "arvore" },
    result: "林",
    tone: "lín",
    meaning: "bosque",
    story: "Uma arvore ao lado de outra cria a ideia de conjunto de arvores."
  }
];

const RADICALS = [
  { hanzi: "氵", pinyin: "shui", pt: "agua", hint: "rios, liquidos, lavar, mar" },
  { hanzi: "木", pinyin: "mu", pt: "madeira", hint: "arvores, materiais, objetos de madeira" },
  { hanzi: "火", pinyin: "huo", pt: "fogo", hint: "calor, queimar, luz" },
  { hanzi: "忄", pinyin: "xin", pt: "coracao", hint: "emocao, mente, sentimento" },
  { hanzi: "口", pinyin: "kou", pt: "boca", hint: "fala, comer, abertura" },
  { hanzi: "亻", pinyin: "ren", pt: "pessoa", hint: "gente, acao humana, relacao" },
  { hanzi: "日", pinyin: "ri", pt: "sol", hint: "dia, tempo, brilho" },
  { hanzi: "女", pinyin: "nu", pt: "mulher", hint: "pessoas, familia, antigo papel social" },
  { hanzi: "言", pinyin: "yan", pt: "fala", hint: "palavras, linguagem, prometer" }
];

const VOCAB = [
  { hanzi: "的", pinyin: "de", pt: "particula possessiva / adjetiva", radical: "白", strokes: 8 },
  { hanzi: "是", pinyin: "shi", pt: "ser; confirmar; sim", radical: "日", strokes: 9 },
  { hanzi: "不", pinyin: "bu", pt: "nao; prefixo de negacao", radical: "一", strokes: 4 },
  { hanzi: "我", pinyin: "wo", pt: "eu; me; meu", radical: "戈", strokes: 7 },
  { hanzi: "一", pinyin: "yi", pt: "um; unico; inteiro", radical: "一", strokes: 1 },
  { hanzi: "有", pinyin: "you", pt: "ter; existir; possuir", radical: "月", strokes: 6 },
  { hanzi: "大", pinyin: "da", pt: "grande; alto; vasto", radical: "大", strokes: 3 },
  { hanzi: "在", pinyin: "zai", pt: "estar em; localizado", radical: "土", strokes: 6 },
  { hanzi: "人", pinyin: "ren", pt: "pessoa; gente; humano", radical: "人", strokes: 2 },
  { hanzi: "你", pinyin: "ni", pt: "voce", radical: "亻", strokes: 7 },
  { hanzi: "好", pinyin: "hao", pt: "bom; bem; otimo", radical: "女", strokes: 6 },
  { hanzi: "来", pinyin: "lai", pt: "vir; chegar", radical: "木", strokes: 7 },
  { hanzi: "学", pinyin: "xue", pt: "estudar; aprender", radical: "子", strokes: 8 },
  { hanzi: "说", pinyin: "shuo", pt: "falar; dizer", radical: "讠", strokes: 9 },
  { hanzi: "看", pinyin: "kan", pt: "olhar; ver", radical: "目", strokes: 9 },
  { hanzi: "请", pinyin: "qing", pt: "por favor; convidar", radical: "讠", strokes: 10 },
  { hanzi: "小", pinyin: "xiao", pt: "pequeno", radical: "小", strokes: 3 },
  { hanzi: "想", pinyin: "xiang", pt: "pensar; querer", radical: "心", strokes: 13 },
  { hanzi: "谢", pinyin: "xie", pt: "agradecer", radical: "讠", strokes: 12 },
  { hanzi: "中", pinyin: "zhong", pt: "meio; centro; China", radical: "丨", strokes: 4 }
];

const DEFAULT_CHAT = [
  { role: "tutor", text: "你好! Vamos treinar uma apresentacao curta. Responda: 我叫..." },
  { role: "tutor", text: "Modelo: 我叫 Matheus. Depois tente: 我是巴西人." }
];

const STORAGE_KEY = "hanzi-logic-state-v1";

function localDateKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const defaultState = {
  activePhase: 0,
  activeTab: "sistema",
  activePhrase: 0,
  phraseFlipped: false,
  activeCombo: 0,
  selectedCharacter: 5,
  dailyDate: localDateKey(),
  daily: Object.fromEntries(DAILY.map((item) => [item.id, 0])),
  skipped: [],
  favorites: [],
  chat: DEFAULT_CHAT
};

let state = loadState();
let activeTimer = null;
let lastTick = 0;
let tickHandle = null;
let drawing = false;
let canvasContext = null;

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const merged = { ...defaultState, ...parsed };
    if (merged.dailyDate !== localDateKey()) {
      merged.dailyDate = localDateKey();
      merged.daily = Object.fromEntries(DAILY.map((item) => [item.id, 0]));
    }
    merged.daily = { ...defaultState.daily, ...merged.daily };
    merged.skipped = Array.isArray(merged.skipped) ? merged.skipped : [];
    merged.chat = Array.isArray(merged.chat) && merged.chat.length ? merged.chat : DEFAULT_CHAT;
    return merged;
  } catch (error) {
    return { ...defaultState, daily: { ...defaultState.daily }, skipped: [], chat: [...DEFAULT_CHAT] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getDailyProgress(item) {
  const goalSeconds = item.goal * 60;
  const skipped = state.skipped.includes(item.id);
  const done = skipped ? goalSeconds : Number(state.daily[item.id] || 0);
  return {
    done,
    goalSeconds,
    skipped,
    completed: done >= goalSeconds,
    percent: clamp((done / goalSeconds) * 100, 0, 100),
    minutes: Math.floor(done / 60),
    remaining: Math.max(0, Math.ceil((goalSeconds - done) / 60))
  };
}

function formatTimer(seconds) {
  const value = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(value / 60);
  const rest = String(value % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function getNextMission() {
  return DAILY.find((item) => !getDailyProgress(item).completed) || null;
}

function getDailyStats() {
  const completed = DAILY.filter((item) => getDailyProgress(item).completed).length;
  const xp = DAILY.reduce((sum, item) => {
    const progress = getDailyProgress(item);
    return sum + (progress.skipped ? 0 : Math.round(item.xp * (progress.percent / 100)));
  }, 0);
  const totalMinutes = DAILY.reduce((sum, item) => sum + item.goal, 0);
  const doneMinutes = DAILY.reduce((sum, item) => sum + Math.min(item.goal, getDailyProgress(item).minutes), 0);
  return {
    completed,
    total: DAILY.length,
    xp,
    totalXp: DAILY.reduce((sum, item) => sum + item.xp, 0),
    totalMinutes,
    doneMinutes,
    percent: Math.round((completed / DAILY.length) * 100)
  };
}

function totalProgress() {
  const dailyPercent = DAILY.reduce((sum, item) => sum + getDailyProgress(item).percent, 0) / DAILY.length;
  const phasePercent = (state.activePhase / (PHASES.length - 1)) * 100;
  return Math.round((dailyPercent * .7) + (phasePercent * .3));
}

function renderShell() {
  const phase = PHASES[state.activePhase];
  const nextMission = getNextMission();
  qs("#currentPhaseLabel").textContent = nextMission ? `Hoje - ${nextMission.short}` : "Rota concluida";
  qs("#phaseKicker").textContent = `Fase ${phase.number}`;
  qs("#lessonTitle").textContent = phase.title;
  qs("#lessonSubtitle").textContent = phase.subtitle;
  qs("#phaseDuration").textContent = phase.duration;
  qs("#phaseTarget").textContent = phase.target;
  qs("#mentorNote").textContent = phase.mentor;

  const progress = totalProgress();
  qs("#totalProgressBar").style.width = `${progress}%`;
  qs("#totalProgressText").textContent = `${progress}%`;

  renderPhases();
  renderTabs();
  renderDaily();
  renderLesson();
  renderVocab();
  updateMobileTabs();
}

function renderPhases() {
  qs("#phaseList").innerHTML = PHASES.map((phase, index) => `
    <button class="phase-button ${index === state.activePhase ? "active" : ""}" type="button" data-action="setPhase" data-phase="${index}">
      <span class="phase-number">${phase.number}</span>
      <span class="phase-copy">
        <strong>${phase.title}</strong>
        <small>${phase.target}</small>
      </span>
    </button>
  `).join("");
}

function renderTabs() {
  qs("#lessonTabs").innerHTML = TABS.map((tab, index) => `
    <button class="tab-button ${tab.id === state.activeTab ? "active" : ""}" type="button" data-action="setTab" data-tab="${tab.id}">
      ${String(index + 1).padStart(2, "0")} ${tab.label}
    </button>
  `).join("");
}

function renderDaily() {
  const stats = getDailyStats();
  const nextMission = getNextMission();
  qs("#dailySummary").textContent = nextMission
    ? `Proxima missao: ${nextMission.label}. ${stats.completed}/${stats.total} etapas concluidas.`
    : "Rota diaria completa. Agora voce pode revisar livremente nas abas.";

  qs("#dailyFocus").innerHTML = `
    <div class="daily-scoreboard" aria-label="Resumo da rota diaria">
      <span><b>${stats.completed}/${stats.total}</b> missoes</span>
      <span><b>${stats.xp}/${stats.totalXp}</b> XP</span>
      <span><b>3</b> dias</span>
      <span><b>${stats.doneMinutes}/${stats.totalMinutes}</b> min</span>
    </div>
    <div class="daily-path" aria-label="Rota diaria de estudos">
      ${DAILY.map((item, index) => renderMissionNode(item, index)).join("")}
    </div>
  `;

  qs("#routineList").innerHTML = `<div class="routine-list">${DAILY.map((item) => {
    const progress = getDailyProgress(item);
    return `
      <div class="routine-item">
        <div class="routine-row"><span>${item.short}</span><b>${progress.completed ? "ok" : `${progress.minutes}/${item.goal}m`}</b></div>
        <div class="bar" aria-hidden="true"><i style="width:${progress.percent}%"></i></div>
      </div>
    `;
  }).join("")}</div>`;
}

function renderMissionNode(item, index) {
  const progress = getDailyProgress(item);
  const isActive = activeTimer === item.id;
  const isNext = getNextMission()?.id === item.id;
  const status = progress.skipped ? "pulada" : progress.completed ? "feita" : isNext ? "agora" : "livre";
  const remainingSeconds = Math.max(0, progress.goalSeconds - progress.done);
  return `
    <article class="mission-node ${progress.completed ? "complete" : ""} ${isNext ? "next" : ""} ${isActive ? "running" : ""}">
      <button class="mission-orb" type="button" data-action="openMission" data-session="${item.id}" aria-label="Abrir ${item.label}">
        <span>${progress.completed ? "✓" : item.icon}</span>
      </button>
      <div class="mission-card">
        <div class="mission-main">
          <span class="mission-step">${String(index + 1).padStart(2, "0")} · ${status}</span>
          <h3>${item.label}</h3>
          <p>${item.description}</p>
          <div class="bar mission-bar" aria-hidden="true"><i style="width:${progress.percent}%"></i></div>
        </div>
        <div class="mission-actions">
          <span class="time-readout">${progress.completed ? `${item.goal}:00` : formatTimer(remainingSeconds)}</span>
          <button class="tiny-button" type="button" data-action="toggleTimer" data-session="${item.id}">${isActive ? "Pausar" : "Play"}</button>
          <button class="tiny-button" type="button" data-action="finishSession" data-session="${item.id}">Feito</button>
          <button class="tiny-button ghost-mini" type="button" data-action="skipMission" data-session="${item.id}">Pular</button>
        </div>
      </div>
    </article>
  `;
}

function renderLesson() {
  const pane = qs("#lessonPane");
  if (state.activeTab === "sistema") pane.innerHTML = systemView();
  if (state.activeTab === "pinyin") pane.innerHTML = pinyinView();
  if (state.activeTab === "sobrevivencia") pane.innerHTML = survivalView();
  if (state.activeTab === "caracteres") pane.innerHTML = charactersView();
  if (state.activeTab === "radicais") pane.innerHTML = radicalsView();
  if (state.activeTab === "conversa") pane.innerHTML = conversationView();
  if (state.activeTab === "caracteres") setupCanvas();
}

function systemView() {
  return `
    <div class="wide-grid">
      <article class="fact-card">
        <p class="eyebrow">Sistema visual</p>
        <h3>Hanzi nao e alfabeto</h3>
        <p>Cada caractere funciona como uma unidade de sentido. O som vem pelo Pinyin; a escrita guarda forma, pistas e historia.</p>
      </article>
      <article class="fact-card">
        <p class="eyebrow">Sistema sonoro</p>
        <h3>Pinyin e o mapa da fala</h3>
        <p>Voce digita e pronuncia com letras latinas, mas precisa ouvir os tons como parte da palavra.</p>
      </article>
      <article class="fact-card">
        <p class="eyebrow">Sistema logico</p>
        <h3>Radicais organizam memoria</h3>
        <p>As pecas ajudam a reconhecer familias de caracteres: agua, boca, pessoa, coracao, madeira.</p>
      </article>
    </div>

    <div class="pane-grid" style="margin-top:24px">
      <article class="fact-card">
        <p class="eyebrow">Evolucao do caractere agua</p>
        <h3>De imagem para simbolo</h3>
        <div class="system-chain">
          <span class="chain-box"><b>~</b><span>fluxo real</span></span>
          <span class="chain-plus">→</span>
          <span class="chain-box"><b>川</b><span>forma antiga</span></span>
          <span class="chain-plus">→</span>
          <span class="chain-box"><b>水</b><span>shui</span></span>
        </div>
      </article>
      <article class="fact-card">
        <p class="eyebrow">Primeira frase</p>
        <h3>Eu sou brasileiro</h3>
        <p><strong class="hanzi-inline">我是巴西人</strong></p>
        <p><span class="pinyin-tag">Wǒ shì Bāxī rén</span></p>
        <p>A ordem basica parece simples: eu + sou + Brasil + pessoa.</p>
        <button class="primary-button" type="button" data-action="speak" data-text="我是巴西人">Ouvir frase</button>
      </article>
    </div>
  `;
}

function pinyinView() {
  return `
    <div class="pane-grid">
      <section>
        <p class="eyebrow">Iniciais</p>
        <div class="sound-grid">
          ${INITIALS.map(([label, hanzi, pinyin]) => soundCard(label, hanzi, pinyin)).join("")}
        </div>
        <p class="eyebrow" style="margin-top:24px">Finais</p>
        <div class="sound-grid">
          ${FINALS.map(([label, hanzi, pinyin]) => soundCard(label, hanzi, pinyin)).join("")}
        </div>
      </section>
      <section>
        <p class="eyebrow">Treino de tons</p>
        <div class="tone-grid">
          ${TONES.map((tone) => `
            <article class="tone-card">
              <div class="tone-main">
                <div>
                  <strong>${tone.hanzi}</strong>
                  <span>${tone.pinyin}</span>
                </div>
                <button class="sound-button" type="button" data-action="speak" data-text="${tone.hanzi}" aria-label="Ouvir ${tone.pinyin}">▶</button>
              </div>
              <p><b>${tone.tone}</b>: ${tone.name}. Sentido: ${tone.meaning}.</p>
            </article>
          `).join("")}
        </div>
      </section>
    </div>
  `;
}

function soundCard(label, hanzi, pinyin) {
  return `
    <button class="sound-card" type="button" data-action="speak" data-text="${hanzi}">
      <strong>${label}</strong>
      <span>${pinyin} · ${hanzi}</span>
    </button>
  `;
}

function survivalView() {
  const phrase = PHRASES[state.activePhrase];
  return `
    <div class="phrase-layout">
      <section>
        <article class="flashcard">
          <button type="button" data-action="flipPhrase" aria-label="Virar cartao">
            ${state.phraseFlipped ? `
              <div class="phrase-back">
                <strong>${phrase.pt}</strong>
                <span>${phrase.tone}</span>
                <p>${phrase.category}</p>
              </div>
            ` : `
              <div class="phrase-front">
                <strong>${phrase.hanzi}</strong>
                <span>${phrase.tone}</span>
              </div>
            `}
          </button>
        </article>
        <div class="deck-controls">
          <button class="ghost-button" type="button" data-action="prevPhrase">Anterior</button>
          <span class="pinyin-tag">Cartao ${state.activePhrase + 1} de ${PHRASES.length}</span>
          <button class="primary-button" type="button" data-action="nextPhrase">Proximo</button>
        </div>
      </section>
      <aside class="phrase-list">
        ${PHRASES.map((item, index) => `
          <button class="phrase-list-button ${index === state.activePhrase ? "active" : ""}" type="button" data-action="selectPhrase" data-index="${index}">
            <strong>${item.hanzi}</strong>
            <span>${item.tone}</span>
            <span>${item.pt}</span>
          </button>
        `).join("")}
      </aside>
    </div>
  `;
}

function charactersView() {
  const combo = COMBOS[state.activeCombo];
  const selected = CHARACTERS[state.selectedCharacter];
  return `
    <div class="character-stage">
      <article class="logic-card">
        <p class="eyebrow">Desmontando caracteres</p>
        <div class="logic-equation">
          <div>
            <div class="logic-symbol">${combo.left.hanzi}</div>
            <div class="logic-label">${combo.left.label}</div>
          </div>
          <div class="logic-label">+</div>
          <div>
            <div class="logic-symbol">${combo.right.hanzi}</div>
            <div class="logic-label">${combo.right.label}</div>
          </div>
          <div class="logic-label">=</div>
          <div>
            <div class="logic-symbol logic-result">${combo.result}</div>
            <div class="logic-label">${combo.tone} · ${combo.meaning}</div>
          </div>
        </div>
        <p class="logic-story">${combo.story}</p>
        <div class="session-card-actions" style="justify-content:center">
          <button class="ghost-button" type="button" data-action="prevCombo">Anterior</button>
          <button class="primary-button" type="button" data-action="nextCombo">Proxima combinacao</button>
        </div>
      </article>

      <section>
        <div class="character-title">
          <div>
            <p class="eyebrow">Primeiros caracteres</p>
            <h3>${selected.hanzi} · ${selected.tone}</h3>
          </div>
          <button class="sound-button" type="button" data-action="speak" data-text="${selected.hanzi}">▶</button>
        </div>
        <div class="character-grid" style="margin-top:14px">
          ${CHARACTERS.map((item, index) => `
            <button class="character-tile ${index === state.selectedCharacter ? "active" : ""}" type="button" data-action="selectCharacter" data-index="${index}">
              <strong>${item.hanzi}</strong>
              <span>${item.tone}</span>
            </button>
          `).join("")}
        </div>

        <div class="writing-studio">
          <div class="writing-toolbar">
            <div>
              <p class="eyebrow" style="margin-bottom:4px">Lousa de escrita</p>
              <strong>${selected.pt}</strong>
            </div>
            <button class="ghost-button" type="button" data-action="clearCanvas">Limpar</button>
          </div>
          <div class="writing-board">
            <div class="canvas-ghost" id="canvasGhost">${selected.hanzi}</div>
            <canvas id="writingCanvas" aria-label="Lousa para praticar escrita"></canvas>
          </div>
        </div>
      </section>
    </div>
  `;
}

function radicalsView() {
  return `
    <div class="pane-grid">
      <section>
        <p class="eyebrow">Repertorio de pecas</p>
        <div class="radical-grid">
          ${RADICALS.map((radical) => `
            <article class="radical-card">
              <strong>${radical.hanzi}</strong>
              <b>${radical.pinyin}</b>
              <p>${radical.pt}: ${radical.hint}.</p>
            </article>
          `).join("")}
        </div>
      </section>
      <aside class="fact-card">
        <p class="eyebrow">Dica de mestre</p>
        <h3>Radical e pista, nao formula magica</h3>
        <p>Use radicais para criar ganchos de memoria. Alguns sao semanticos, outros historicos, outros so ajudam a procurar no dicionario.</p>
        <div class="system-chain">
          <span class="chain-box"><b>氵</b><span>agua</span></span>
          <span class="chain-plus">+</span>
          <span class="chain-box"><b>青</b><span>qing</span></span>
          <span class="chain-plus">→</span>
          <span class="chain-box"><b>清</b><span>claro</span></span>
        </div>
      </aside>
    </div>
  `;
}

function conversationView() {
  return `
    <div class="conversation-layout">
      <section class="chat-window">
        <div class="messages" id="chatMessages">
          ${state.chat.map((message) => `
            <article class="message ${message.role}">
              <strong>${message.role === "tutor" ? "Tutor IA" : "Voce"}</strong>
              ${escapeHtml(message.text)}
            </article>
          `).join("")}
        </div>
        <form class="chat-input-row" id="chatForm">
          <input id="chatInput" autocomplete="off" placeholder="Escreva uma resposta curta em portugues, pinyin ou hanzi">
          <button class="send-button" type="submit">Enviar</button>
        </form>
      </section>
      <aside class="coach-card">
        <p class="eyebrow">Treino de 5 minutos</p>
        <h3>Roteiro de hoje</h3>
        <ul>
          <li>Diga seu nome: 我叫...</li>
          <li>Diga sua nacionalidade: 我是巴西人.</li>
          <li>Peça repeticao: 请再说一遍.</li>
        </ul>
      </aside>
    </div>
  `;
}

function renderVocab() {
  const search = (qs("#vocabSearch")?.value || "").trim().toLowerCase();
  const filtered = VOCAB.filter((item) => {
    const haystack = `${item.hanzi} ${item.pinyin} ${item.pt} ${item.radical}`.toLowerCase();
    return haystack.includes(search);
  });

  qs("#libraryCount").textContent = filtered.length;
  qs("#characterGoalText").textContent = `${CHARACTERS.length} desbloqueados`;
  qs("#vocabGrid").innerHTML = filtered.map((item) => {
    const favorite = state.favorites.includes(item.hanzi);
    return `
      <article class="vocab-card">
        <div class="vocab-card-head">
          <div>
            <strong>${item.hanzi}</strong>
            <span class="pinyin-tag">${item.pinyin}</span>
          </div>
          <div class="vocab-actions">
            <button class="sound-button" type="button" data-action="speak" data-text="${item.hanzi}" aria-label="Ouvir ${item.hanzi}">▶</button>
            <button class="sound-button" type="button" data-action="favorite" data-hanzi="${item.hanzi}" aria-label="Favoritar ${item.hanzi}">${favorite ? "★" : "☆"}</button>
          </div>
        </div>
        <p>${item.pt}</p>
        <div class="vocab-meta">
          <span>radical: ${item.radical}</span>
          <span>tracos: ${item.strokes}</span>
        </div>
      </article>
    `;
  }).join("");
}

function updateMobileTabs() {
  qsa(".mobile-tabs button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === state.activeTab);
  });
}

function setTab(tab) {
  state.activeTab = tab;
  const phaseIndex = PHASES.findIndex((phase) => phase.id === tab);
  if (phaseIndex >= 0) state.activePhase = phaseIndex;
  saveState();
  renderShell();
  if (tab === "sistema") window.scrollTo({ top: 0, behavior: "smooth" });
}

function setPhase(index) {
  state.activePhase = clamp(index, 0, PHASES.length - 1);
  const phase = PHASES[state.activePhase];
  state.activeTab = TABS.some((tab) => tab.id === phase.id) ? phase.id : "sistema";
  saveState();
  renderShell();
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = .78;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function toggleTimer(id) {
  if (activeTimer === id) {
    stopTimer();
    return;
  }
  stopTimer(false);
  activeTimer = id;
  lastTick = Date.now();
  tickHandle = window.setInterval(updateTimer, 1000);
  renderDaily();
}

function stopTimer(shouldRender = true) {
  if (tickHandle) window.clearInterval(tickHandle);
  tickHandle = null;
  activeTimer = null;
  lastTick = 0;
  if (shouldRender) renderDaily();
}

function updateTimer() {
  if (!activeTimer) return;
  const item = DAILY.find((daily) => daily.id === activeTimer);
  if (!item) return;
  const now = Date.now();
  const delta = Math.max(0, Math.round((now - lastTick) / 1000));
  lastTick = now;
  state.daily[activeTimer] = Math.min(item.goal * 60, Number(state.daily[activeTimer] || 0) + delta);
  if (state.daily[activeTimer] >= item.goal * 60) stopTimer(false);
  saveState();
  renderDaily();
  const progress = totalProgress();
  qs("#totalProgressBar").style.width = `${progress}%`;
  qs("#totalProgressText").textContent = `${progress}%`;
}

function finishSession(id) {
  const item = DAILY.find((daily) => daily.id === id);
  if (!item) return;
  state.daily[id] = item.goal * 60;
  state.skipped = state.skipped.filter((itemId) => itemId !== id);
  if (activeTimer === id) stopTimer(false);
  saveState();
  renderShell();
}

function skipMission(id) {
  const item = DAILY.find((daily) => daily.id === id);
  if (!item) return;
  state.daily[id] = item.goal * 60;
  if (!state.skipped.includes(id)) state.skipped.push(id);
  if (activeTimer === id) stopTimer(false);
  saveState();
  renderShell();
}

function openMission(id, shouldStart = false) {
  const item = DAILY.find((daily) => daily.id === id);
  if (!item) return;
  setTab(item.tab);
  window.requestAnimationFrame(() => qs(".lesson-header")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  if (shouldStart && !getDailyProgress(item).completed) toggleTimer(item.id);
}

function startNextMission() {
  const mission = getNextMission() || DAILY[DAILY.length - 1];
  openMission(mission.id, true);
}

function setupCanvas() {
  const canvas = qs("#writingCanvas");
  if (!canvas) return;
  const context = canvas.getContext("2d");
  canvasContext = context;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineWidth = 8;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#25231f";
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas, { once: true });

  canvas.addEventListener("pointerdown", (event) => {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    const point = pointerPoint(canvas, event);
    context.beginPath();
    context.moveTo(point.x, point.y);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!drawing) return;
    const point = pointerPoint(canvas, event);
    context.lineTo(point.x, point.y);
    context.stroke();
  });

  canvas.addEventListener("pointerup", () => {
    drawing = false;
  });

  canvas.addEventListener("pointercancel", () => {
    drawing = false;
  });
}

function pointerPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function clearCanvas() {
  const canvas = qs("#writingCanvas");
  if (!canvas || !canvasContext) return;
  canvasContext.clearRect(0, 0, canvas.width, canvas.height);
}

function handleChatSubmit(event) {
  event.preventDefault();
  const input = qs("#chatInput");
  const text = input.value.trim();
  if (!text) return;
  state.chat.push({ role: "user", text });
  state.chat.push({ role: "tutor", text: nextTutorReply(text) });
  input.value = "";
  saveState();
  renderLesson();
  const messages = qs("#chatMessages");
  if (messages) messages.scrollTop = messages.scrollHeight;
}

function nextTutorReply(text) {
  const normalized = text.toLowerCase();
  if (text.includes("我叫") || normalized.includes("wo jiao")) {
    return "Muito bom. Agora acrescente nacionalidade: 我是巴西人.";
  }
  if (text.includes("巴西") || normalized.includes("baxi")) {
    return "Perfeito para sobrevivencia. Agora tente pedir repeticao: 请再说一遍.";
  }
  if (text.includes("请") || normalized.includes("qing")) {
    return "Boa. Frase util e educada. Ultimo passo: diga que ainda nao entende tudo: 我不明白.";
  }
  return "Resposta registrada. Mantenha frases curtas: sujeito + verbo + complemento. Tente repetir com Pinyin e depois Hanzi.";
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const action = button.dataset.action;
  if (action === "setPhase") setPhase(Number(button.dataset.phase));
  if (action === "setTab" || action === "openDailyTab") setTab(button.dataset.tab);
  if (action === "speak") speak(button.dataset.text);
  if (action === "toggleTimer") toggleTimer(button.dataset.session);
  if (action === "finishSession") finishSession(button.dataset.session);
  if (action === "skipMission") skipMission(button.dataset.session);
  if (action === "openMission") openMission(button.dataset.session);
  if (action === "startNextMission") startNextMission();
  if (action === "resetDaily") {
    stopTimer(false);
    state.daily = Object.fromEntries(DAILY.map((item) => [item.id, 0]));
    state.skipped = [];
    saveState();
    renderShell();
  }
  if (action === "flipPhrase") {
    state.phraseFlipped = !state.phraseFlipped;
    saveState();
    renderLesson();
  }
  if (action === "nextPhrase") {
    state.activePhrase = (state.activePhrase + 1) % PHRASES.length;
    state.phraseFlipped = false;
    saveState();
    renderLesson();
  }
  if (action === "prevPhrase") {
    state.activePhrase = (state.activePhrase - 1 + PHRASES.length) % PHRASES.length;
    state.phraseFlipped = false;
    saveState();
    renderLesson();
  }
  if (action === "selectPhrase") {
    state.activePhrase = Number(button.dataset.index);
    state.phraseFlipped = false;
    saveState();
    renderLesson();
  }
  if (action === "nextCombo") {
    state.activeCombo = (state.activeCombo + 1) % COMBOS.length;
    saveState();
    renderLesson();
  }
  if (action === "prevCombo") {
    state.activeCombo = (state.activeCombo - 1 + COMBOS.length) % COMBOS.length;
    saveState();
    renderLesson();
  }
  if (action === "selectCharacter") {
    state.selectedCharacter = Number(button.dataset.index);
    saveState();
    renderLesson();
  }
  if (action === "clearCanvas") clearCanvas();
  if (action === "favorite") {
    const hanzi = button.dataset.hanzi;
    state.favorites = state.favorites.includes(hanzi)
      ? state.favorites.filter((item) => item !== hanzi)
      : [...state.favorites, hanzi];
    saveState();
    renderVocab();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "vocabSearch") renderVocab();
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "chatForm") handleChatSubmit(event);
});

renderShell();
