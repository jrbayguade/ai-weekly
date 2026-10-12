// src/lib/i18n.js -- TOTS els textos fixos (i l'humor) de la web i de l'OG.
export const BASE = '/ai-weekly';

export const T = {
  ca: {
    nomIdioma: 'Català', seg: 'setmana', about: 'com-es-fa',
    tagline: "KEEP UP WITH IT. OR DON'T. WE DID IT FOR YOU.",
    setmana: (n) => `SETMANA ${n}`, novetats: (n) => (n === 1 ? '1 novetat' : `${n} novetats`), top: 'top',
    buit: "Encara no hi ha cap setmana: ens estem llegint les newsletters.",
    nota: "✍️ NOTA DE L'EDITOR", senseNota: "(Sense nota aquesta setmana: l'editor era a la platja.)",
    cats: { models: 'MODELS', products: 'PRODUCTES', money: 'DINERS', research: 'RECERCA', society: 'SOCIETAT I REGULACIÓ' },
    quiHaTret: '🚀 Qui ha tret què',
    mostrant: '📅 Mostrant:', rangs: { u: 'Última setmana', m: 'Últim mes', t: '3 mesos', tot: 'Tot' },
    setmanes: (n) => (n === 1 ? "1 setmana" : `${n} setmanes`), nomes: (c) => `només ${c}`,
    peu: 'Fet amb massa newsletters, un model de llenguatge i massa cafè.',
    newslettersN: (n) => `de ${n} newsletters`, enParlen: 'newsletters que en parlen',
    segells: ['ZERO HYPE (MENTIDA)', 'FET AMB MASSA CAFÈ', 'LLEGIT PER TU', 'SENSE CLICKBAIT (GAIREBÉ)'],
    mes: (n, total) => `+${n} més · de ${total} newsletters`,
    aboutTitol: 'Com es fa',
    aboutText: [
      "Cada setmana llegim unes trenta newsletters d'IA perquè tu no ho hagis de fer.",
      'Un model en treu les notícies, les ajunta quan diverses newsletters parlen del mateix i les tradueix.',
      'El «×N» de cada notícia és quantes newsletters diferents en parlen: és la nostra mesura del soroll.',
      'Les notícies són factuals i enllacen la font. Les bromes són nostres.',
    ],
  },
  es: {
    nomIdioma: 'Español', seg: 'semana', about: 'como-se-hace',
    tagline: "KEEP UP WITH IT. OR DON'T. WE DID IT FOR YOU.",
    setmana: (n) => `SEMANA ${n}`, novetats: (n) => (n === 1 ? '1 novedad' : `${n} novedades`), top: 'top',
    buit: 'Todavía no hay ninguna semana: aún nos estamos leyendo las newsletters.',
    nota: '✍️ NOTA DEL EDITOR', senseNota: '(Sin nota esta semana: el editor estaba en la playa.)',
    cats: { models: 'MODELOS', products: 'PRODUCTOS', money: 'DINERO', research: 'INVESTIGACIÓN', society: 'SOCIEDAD Y REGULACIÓN' },
    quiHaTret: '🚀 Quién ha sacado qué',
    mostrant: '📅 Mostrando:', rangs: { u: 'Última semana', m: 'Último mes', t: '3 meses', tot: 'Todo' },
    setmanes: (n) => (n === 1 ? "1 semana" : `${n} semanas`), nomes: (c) => `solo ${c}`,
    peu: 'Hecho con demasiadas newsletters, un modelo de lenguaje y demasiado café.',
    newslettersN: (n) => `de ${n} newsletters`, enParlen: 'newsletters que hablan de ello',
    segells: ['CERO HYPE (MENTIRA)', 'HECHO CON DEMASIADO CAFÉ', 'LEÍDO POR TI', 'SIN CLICKBAIT (CASI)'],
    mes: (n, total) => `+${n} más · de ${total} newsletters`,
    aboutTitol: 'Cómo se hace',
    aboutText: [
      'Cada semana leemos unas treinta newsletters de IA para que tú no tengas que hacerlo.',
      'Un modelo extrae las noticias, las junta cuando varias newsletters hablan de lo mismo y las traduce.',
      'El «×N» de cada noticia es cuántas newsletters distintas hablan de ella: nuestra medida del ruido.',
      'Las noticias son factuales y enlazan la fuente. Los chistes son nuestros.',
    ],
  },
  en: {
    nomIdioma: 'English', seg: 'week', about: 'how-its-made',
    tagline: "KEEP UP WITH IT. OR DON'T. WE DID IT FOR YOU.",
    setmana: (n) => `WEEK ${n}`, novetats: (n) => (n === 1 ? '1 story' : `${n} stories`), top: 'top',
    buit: "No weeks yet: we're still reading the newsletters.",
    nota: "✍️ EDITOR'S NOTE", senseNota: '(No note this week: the editor was at the beach.)',
    cats: { models: 'MODELS', products: 'PRODUCTS', money: 'MONEY', research: 'RESEARCH', society: 'SOCIETY & POLICY' },
    quiHaTret: '🚀 Who shipped what',
    mostrant: '📅 Showing:', rangs: { u: 'Last week', m: 'Last month', t: '3 months', tot: 'All' },
    setmanes: (n) => (n === 1 ? "1 week" : `${n} weeks`), nomes: (c) => `only ${c}`,
    peu: 'Made with too many newsletters, a language model and too much coffee.',
    newslettersN: (n) => `from ${n} newsletters`, enParlen: 'newsletters covering it',
    segells: ['ZERO HYPE (LIES)', 'MADE WITH TOO MUCH COFFEE', 'READ FOR YOU', 'NO CLICKBAIT (MOSTLY)'],
    mes: (n, total) => `+${n} more · from ${total} newsletters`,
    aboutTitol: "How it's made",
    aboutText: [
      'Every week we read about thirty AI newsletters so you do not have to.',
      'A model extracts the stories, merges them when several newsletters cover the same thing, and translates them.',
      'The “×N” on each story is how many different newsletters cover it: our noise meter.',
      'Stories are factual and link to the source. The jokes are ours.',
    ],
  },
};

export const LANGS = ['ca', 'es', 'en'];
export const urlInici = (lang) => `${BASE}/${lang}/`;
export const urlSetmana = (lang, week) => `${BASE}/${lang}/${T[lang].seg}/${week}/`;
export const urlAbout = (lang) => `${BASE}/${lang}/${T[lang].about}/`;
export const numSetmana = (week) => String(parseInt(week.split('-')[1], 10));
export const segell = (lang, week) => T[lang].segells[parseInt(week.split('-')[1], 10) % T[lang].segells.length];

export function dataCurta(iso, lang) {
  // Dia i mes per separat: en català, el format conjunt dona «6 d’oct.».
  const d = new Date(`${iso}T12:00:00Z`);
  const mes = new Intl.DateTimeFormat(lang, { month: 'short', timeZone: 'UTC' })
    .format(d).replace(/\.$/, '').toUpperCase();
  return `${d.getUTCDate()} ${mes}`;
}

// «5 OCT–11 OCT 2026»; si la setmana travessa l'any, l'any als dos extrems.
export function rangSetmana(from, to, lang) {
  const any = (iso) => iso.slice(0, 4);
  if (any(from) === any(to)) return `${dataCurta(from, lang)}–${dataCurta(to, lang)} ${any(to)}`;
  return `${dataCurta(from, lang)} ${any(from)}–${dataCurta(to, lang)} ${any(to)}`;
}

// Primer idioma de navigator.languages (EN ORDRE) que sigui ca o es; si cap, en.
export function idiomaPreferit(llista) {
  for (const l of llista ?? []) {
    const x = String(l).toLowerCase().split('-')[0];
    if (x === 'ca') return 'ca';
    if (x === 'es') return 'es';
  }
  return 'en';
}
