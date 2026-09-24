/* Shell + app-feature strings, EN/PT. Kept small on purpose: the public site
   keeps its own i18n dictionaries; these are only the app shell's words. */

export const STRINGS = {
  en: {
    'nav.home': 'Home', 'nav.explore': 'Explore', 'nav.lab': 'Lab', 'nav.study': 'Study', 'nav.account': 'Account',
    'net.offline': 'You are offline. Saved content still opens; changes need a connection.',
    'net.slow': 'The connection is slow. Still trying…',
    'net.server_error': 'Atomurus is having trouble right now. Try again in a moment.',
    'net.auth_expired': 'Your session ended. Sign in again to keep studying.',
    'state.loading': 'Loading…', 'state.failed': 'This part of Atomurus could not open.', 'state.retry': 'Try again',
    'home.title': 'What do you want to do now?',
    'home.review': 'Continue studying', 'home.reviewHint': 'Your sets and due cards',
    'home.table': 'Open the periodic table', 'home.tableHint': 'Elements, properties and trends',
    'home.lab': 'Go to the Lab', 'home.labHint': 'Build and run experiments',
    'home.molecule': 'See a molecule in 3D',
    'explore.title': 'Explore',
    'study.title': 'Study', 'study.signIn': 'Sign in to see your sets, reviews and progress.', 'study.signInCta': 'Sign in',
    'study.offline': 'Study needs a connection to load your sets.', 'study.start': 'Start review', 'study.sets': 'Study Sets',
    'study.due': 'due now', 'study.items': 'saved items', 'study.more': 'More in Study',
    'table.title': 'Periodic table', 'table.search': 'Search element, symbol or Z', 'table.list': 'List', 'table.grid': 'Table', 'table.property': 'Properties',
    'table.sortBy': 'Sort by', 'table.mass': 'Atomic mass', 'table.en': 'Electronegativity', 'table.z': 'Atomic number',
    'mol.title': 'Water · H₂O', 'mol.close': 'Back to Explore',
    'lab.title': 'Lab', 'lab.pick': 'Pick a tool', 'lab.openWeb': 'Open in the Lab',
    'account.title': 'Account', 'account.email': 'Email or username', 'account.password': 'Password', 'account.signIn': 'Sign in',
    'account.signingIn': 'Signing in…', 'account.signOut': 'Sign out', 'account.signedInAs': 'Signed in as',
    'account.badCredentials': 'Email or password is incorrect.', 'account.offline': 'You are offline. Connect to sign in.',
    'account.unavailable': 'Sign-in is temporarily unavailable. Try again shortly.',
    'account.plan': 'Plan',
    'legacy.body': 'This area is still served by the web workspace.', 'legacy.open': 'Open'
  },
  pt: {
    'nav.home': 'Início', 'nav.explore': 'Explorar', 'nav.lab': 'Lab', 'nav.study': 'Estudo', 'nav.account': 'Conta',
    'net.offline': 'Você está offline. O conteúdo salvo abre; alterações precisam de conexão.',
    'net.slow': 'A conexão está lenta. Tentando de novo…',
    'net.server_error': 'O Atomurus está com problemas agora. Tente novamente em instantes.',
    'net.auth_expired': 'Sua sessão terminou. Entre novamente para continuar estudando.',
    'state.loading': 'Carregando…', 'state.failed': 'Esta parte do Atomurus não abriu.', 'state.retry': 'Tentar de novo',
    'home.title': 'O que você quer fazer agora?',
    'home.review': 'Continuar estudando', 'home.reviewHint': 'Seus conjuntos e cartões pendentes',
    'home.table': 'Abrir a tabela periódica', 'home.tableHint': 'Elementos, propriedades e tendências',
    'home.lab': 'Ir para o Lab', 'home.labHint': 'Monte e rode experimentos',
    'home.molecule': 'Ver uma molécula em 3D',
    'explore.title': 'Explorar',
    'study.title': 'Estudo', 'study.signIn': 'Entre para ver seus conjuntos, revisões e progresso.', 'study.signInCta': 'Entrar',
    'study.offline': 'O Estudo precisa de conexão para carregar seus conjuntos.', 'study.start': 'Começar revisão', 'study.sets': 'Conjuntos',
    'study.due': 'pendentes', 'study.items': 'itens salvos', 'study.more': 'Mais no Estudo',
    'table.title': 'Tabela periódica', 'table.search': 'Buscar elemento, símbolo ou Z', 'table.list': 'Lista', 'table.grid': 'Tabela', 'table.property': 'Propriedades',
    'table.sortBy': 'Ordenar por', 'table.mass': 'Massa atômica', 'table.en': 'Eletronegatividade', 'table.z': 'Número atômico',
    'mol.title': 'Água · H₂O', 'mol.close': 'Voltar para Explorar',
    'lab.title': 'Lab', 'lab.pick': 'Escolha uma ferramenta', 'lab.openWeb': 'Abrir no Lab',
    'account.title': 'Conta', 'account.email': 'E-mail ou usuário', 'account.password': 'Senha', 'account.signIn': 'Entrar',
    'account.signingIn': 'Entrando…', 'account.signOut': 'Sair', 'account.signedInAs': 'Conectado como',
    'account.badCredentials': 'E-mail ou senha incorretos.', 'account.offline': 'Você está offline. Conecte-se para entrar.',
    'account.unavailable': 'O login está indisponível no momento. Tente em instantes.',
    'account.plan': 'Plano',
    'legacy.body': 'Esta área ainda é servida pelo workspace web.', 'legacy.open': 'Abrir'
  }
};

export function createTranslator(lang) {
  const dict = STRINGS[lang === 'pt' ? 'pt' : 'en'];
  return (key) => dict[key] || STRINGS.en[key] || key;
}
