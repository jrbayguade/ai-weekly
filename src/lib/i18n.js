// src/lib/i18n.js -- TOTS els textos fixos (i l'humor) de la web i de l'OG.
export const BASE = '/ai-weekly';

export const T = {
  ca: {
    nomIdioma: 'Català', seg: 'setmana', about: 'com-es-fa', confirmat: 'confirmat', privacitat: 'privacitat',
    tagline: "KEEP UP WITH IT. OR DON'T. WE DID IT FOR YOU.",
    setmana: (n) => `SETMANA ${n}`,
    mesos: ['GENER', 'FEBRER', 'MARÇ', 'ABRIL', 'MAIG', 'JUNY', 'JULIOL', 'AGOST', 'SETEMBRE', 'OCTUBRE', 'NOVEMBRE', 'DESEMBRE'],
    ariaCasella: (co, n, k) => `${co}, setmana ${n}: ${k === 1 ? '1 llançament' : `${k} llançaments`}`,
    tornar: '← Tornar a les setmanes', suggeriments: 'Suggeriments', noQuadra: 'Alguna cosa no quadra?',
    titolIssue: (n, week) => `Setmana ${n} (${week})`,
    buit: "Encara no hi ha cap setmana: ens estem llegint les newsletters.",
    nota: "✍️ NOTA DE L'EDITOR", senseNota: "(Sense nota aquesta setmana: l'editor era a la platja.)",
    cats: { models: 'MODELS', products: 'PRODUCTES', money: 'DINERS', research: 'RECERCA', society: 'SOCIETAT I REGULACIÓ' },
    quiHaTret: 'Qui ha tret què',
    setmanes: (n) => (n === 1 ? "1 setmana" : `${n} setmanes`),
    peu: 'Fet amb massa newsletters, un model de llenguatge i massa cafè.',
    newslettersN: (n) => `de ${n} newsletters`, calent: 'tema calent',
    segells: ['ZERO HYPE (MENTIDA)', 'FET AMB MASSA CAFÈ', 'LLEGIT PER TU', 'SENSE CLICKBAIT (GAIREBÉ)'],
    mes: (n, total) => `+${n} més · de ${total} newsletters`,
    aboutTitol: 'Com es fa',
    autoria: 'Fet per', rumor: 'no confirmat',
    categories: 'Categories',
    subsCap: '✉ SUBSCRIU-TE', subsSetmana: '✉ Rep-ho cada dilluns', subsPeu: 'Subscriu-te',
    subsTitol: 'CADA DILLUNS, AL CORREU', subsBoto: "APUNTA-M'HI", subsCamp: 'Correu', subsPlaceholder: 'el-teu@correu.cat',
    subsOk: 'Mira el correu per confirmar-ho.', subsError: 'No ha funcionat. Torna-ho a provar.', subsFalta: 'Escriu un correu vàlid.', subsEspera: 'Un moment, encara carrega.',
    tanca: 'Tanca', privacitatTitol: 'Privacitat', confirmatTitol: 'Fet ✓',
    confirmatOk: "Des de dilluns que ve, AI Weekly t'arriba al correu.",
    confirmatCaducat: "L'enllaç ha caducat. Torna-t'hi a apuntar.",
    confirmatError: "No s'ha pogut confirmar. Torna-ho a provar d'aquí a una estona.",
    privacitatText: [
      "Responsable: Jesús Bosch, Sant Cugat del Vallès. Contacte: hi@zinkforge.com.",
      "Si t'apuntes al correu, guardem la teva adreça i l'idioma, només per enviar-te AI Weekly cada dilluns. No la cedim a ningú.",
      "Base: el teu consentiment, que confirmes amb l'enllaç que t'enviem.",
      "Encarregats: Resend (enviament i llista de subscriptors; als EUA, amb clàusules contractuals tipus) i Cloudflare Turnstile (contra els bots, només quan envies el formulari).",
      "Les guardem fins que et donis de baixa, amb l'enllaç de qualsevol correu. Per exercir els teus drets, escriu a hi@zinkforge.com; també pots reclamar a l'AEPD.",
      "La web no fa servir galetes ni analítica, i els correus no tenen seguiment d'obertures ni de clics.",
    ],
    aboutText: [
      "Cada diumenge llegim unes trenta newsletters d'IA perquè tu no ho hagis de fer: The Neuron, The Deep View, TLDR AI, Towards Data Science, AI Adopters Club i unes quantes més.",
      "Un model en treu les notícies, les ajunta quan diverses newsletters parlen del mateix i les tradueix.",
      "El mapa compta els llançaments de models i productes de cada empresa cada setmana: 0, 1, 2 o 3 i més.",
      "El 🔥 marca els temes que surten a més newsletters, com a molt 5 per setmana.",
      "«No confirmat» vol dir que és un rumor: s'hi diu, però ningú no ho ha confirmat.",
      "Les notícies són factuals i enllacen la font. Les bromes són meves.",
    ],
  },
  es: {
    nomIdioma: 'Español', seg: 'semana', about: 'como-se-hace', confirmat: 'confirmado', privacitat: 'privacidad',
    tagline: "KEEP UP WITH IT. OR DON'T. WE DID IT FOR YOU.",
    setmana: (n) => `SEMANA ${n}`,
    mesos: ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'],
    ariaCasella: (co, n, k) => `${co}, semana ${n}: ${k === 1 ? '1 lanzamiento' : `${k} lanzamientos`}`,
    tornar: '← Volver a las semanas', suggeriments: 'Sugerencias', noQuadra: '¿Algo no cuadra?',
    titolIssue: (n, week) => `Semana ${n} (${week})`,
    buit: 'Todavía no hay ninguna semana: aún nos estamos leyendo las newsletters.',
    nota: '✍️ NOTA DEL EDITOR', senseNota: '(Sin nota esta semana: el editor estaba en la playa.)',
    cats: { models: 'MODELOS', products: 'PRODUCTOS', money: 'DINERO', research: 'INVESTIGACIÓN', society: 'SOCIEDAD Y REGULACIÓN' },
    quiHaTret: 'Quién ha sacado qué',
    setmanes: (n) => (n === 1 ? "1 semana" : `${n} semanas`),
    peu: 'Hecho con demasiadas newsletters, un modelo de lenguaje y demasiado café.',
    newslettersN: (n) => `de ${n} newsletters`, calent: 'tema caliente',
    segells: ['CERO HYPE (MENTIRA)', 'HECHO CON DEMASIADO CAFÉ', 'LEÍDO POR TI', 'SIN CLICKBAIT (CASI)'],
    mes: (n, total) => `+${n} más · de ${total} newsletters`,
    aboutTitol: 'Cómo se hace',
    autoria: 'Hecho por', rumor: 'no confirmado',
    categories: 'Categorías',
    subsCap: '✉ SUSCRÍBETE', subsSetmana: '✉ Recíbelo cada lunes', subsPeu: 'Suscríbete',
    subsTitol: 'CADA LUNES, EN TU CORREO', subsBoto: 'APÚNTAME', subsCamp: 'Correo', subsPlaceholder: 'tu@correo.es',
    subsOk: 'Revisa tu correo para confirmarlo.', subsError: 'No ha funcionado. Vuelve a intentarlo.', subsFalta: 'Escribe un correo válido.', subsEspera: 'Un momento, todavía carga.',
    tanca: 'Cerrar', privacitatTitol: 'Privacidad', confirmatTitol: 'Hecho ✓',
    confirmatOk: 'Desde el lunes que viene, AI Weekly te llega al correo.',
    confirmatCaducat: 'El enlace ha caducado. Vuelve a apuntarte.',
    confirmatError: 'No se ha podido confirmar. Vuelve a intentarlo dentro de un rato.',
    privacitatText: [
      'Responsable: Jesús Bosch, Sant Cugat del Vallès. Contacto: hi@zinkforge.com.',
      'Si te apuntas al correo, guardamos tu dirección y el idioma, solo para enviarte AI Weekly cada lunes. No la cedemos a nadie.',
      'Base: tu consentimiento, que confirmas con el enlace que te enviamos.',
      'Encargados: Resend (envío y lista de suscriptores; en EE. UU., con cláusulas contractuales tipo) y Cloudflare Turnstile (contra los bots, solo cuando envías el formulario).',
      'Los guardamos hasta que te des de baja, con el enlace de cualquier correo. Para ejercer tus derechos, escribe a hi@zinkforge.com; también puedes reclamar ante la AEPD.',
      'La web no usa cookies ni analítica, y los correos no tienen seguimiento de aperturas ni de clics.',
    ],
    aboutText: [
      "Cada domingo leemos unas treinta newsletters de IA para que tú no tengas que hacerlo: The Neuron, The Deep View, TLDR AI, Towards Data Science, AI Adopters Club y unas cuantas más.",
      "Un modelo extrae las noticias, las junta cuando varias newsletters hablan de lo mismo y las traduce.",
      "El mapa cuenta los lanzamientos de modelos y productos de cada empresa cada semana: 0, 1, 2 o 3 y más.",
      "El 🔥 marca los temas que salen en más newsletters, como mucho 5 por semana.",
      "«No confirmado» significa que es un rumor: se dice por ahí, pero nadie lo ha confirmado.",
      "Las noticias son factuales y enlazan la fuente. Los chistes son míos.",
    ],
  },
  en: {
    nomIdioma: 'English', seg: 'week', about: 'how-its-made', confirmat: 'confirmed', privacitat: 'privacy',
    tagline: "KEEP UP WITH IT. OR DON'T. WE DID IT FOR YOU.",
    setmana: (n) => `WEEK ${n}`,
    mesos: ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'],
    ariaCasella: (co, n, k) => `${co}, week ${n}: ${k === 1 ? '1 release' : `${k} releases`}`,
    tornar: '← Back to the weeks', suggeriments: 'Feedback', noQuadra: 'Something off?',
    titolIssue: (n, week) => `Week ${n} (${week})`,
    buit: "No weeks yet: we're still reading the newsletters.",
    nota: "✍️ EDITOR'S NOTE", senseNota: '(No note this week: the editor was at the beach.)',
    cats: { models: 'MODELS', products: 'PRODUCTS', money: 'MONEY', research: 'RESEARCH', society: 'SOCIETY & POLICY' },
    quiHaTret: 'Who shipped what',
    setmanes: (n) => (n === 1 ? "1 week" : `${n} weeks`),
    peu: 'Made with too many newsletters, a language model and too much coffee.',
    newslettersN: (n) => `from ${n} newsletters`, calent: 'hot topic',
    segells: ['ZERO HYPE (LIES)', 'MADE WITH TOO MUCH COFFEE', 'READ FOR YOU', 'NO CLICKBAIT (MOSTLY)'],
    mes: (n, total) => `+${n} more · from ${total} newsletters`,
    aboutTitol: "How it's made",
    autoria: 'Made by', rumor: 'unconfirmed',
    categories: 'Categories',
    subsCap: '✉ SUBSCRIBE', subsSetmana: '✉ Get it every Monday', subsPeu: 'Subscribe',
    subsTitol: 'EVERY MONDAY, IN YOUR INBOX', subsBoto: 'SIGN ME UP', subsCamp: 'Email', subsPlaceholder: 'you@email.com',
    subsOk: 'Check your inbox to confirm.', subsError: "That didn't work. Try again.", subsFalta: 'Enter a valid email.', subsEspera: 'One moment, still loading.',
    tanca: 'Close', privacitatTitol: 'Privacy', confirmatTitol: 'Done ✓',
    confirmatOk: 'From next Monday, AI Weekly lands in your inbox.',
    confirmatCaducat: 'The link has expired. Sign up again.',
    confirmatError: 'Could not confirm. Try again in a while.',
    privacitatText: [
      'Controller: Jesús Bosch, Sant Cugat del Vallès (Spain). Contact: hi@zinkforge.com.',
      'If you sign up, we keep your email address and language, only to send you AI Weekly every Monday. We never share it.',
      'Legal basis: your consent, which you confirm with the link we send you.',
      'Processors: Resend (sending and the subscriber list; in the US, under standard contractual clauses) and Cloudflare Turnstile (anti-bot, only when you submit the form).',
      'We keep them until you unsubscribe, with the link in any email. To exercise your rights, write to hi@zinkforge.com; you can also complain to the Spanish DPA (AEPD).',
      'The site uses no cookies or analytics, and the emails have no open or click tracking.',
    ],
    aboutText: [
      "Every Sunday we read about thirty AI newsletters so you do not have to: The Neuron, The Deep View, TLDR AI, Towards Data Science, AI Adopters Club and a few more.",
      "A model extracts the stories, merges them when several newsletters cover the same thing, and translates them.",
      "The map counts each company's model and product launches every week: 0, 1, 2 or 3 and more.",
      "The 🔥 marks the topics that appear in the most newsletters, at most 5 per week.",
      "\"Unconfirmed\" means it is a rumor: people are saying it, but nobody has confirmed it.",
      "Stories are factual and link to the source. The jokes are mine.",
    ],
  },
};

// Des de quantes newsletters que en parlen una notícia porta el 🔥 (escala real: 1-4).
export const LLINDAR_CALENT = 3;
export const AUTOR = { nom: 'Jesús Bosch', url: 'https://www.linkedin.com/in/jboschayguade/' };
// 🔥: si l'ítem porta `hot` (booleà), mana; si no (dades velles), el llindar. Un rumor no en porta mai.
export const esCalent = (i) => i.rumor !== true && (typeof i.hot === 'boolean' ? i.hot : i.n >= LLINDAR_CALENT);
export const LANGS = ['ca', 'es', 'en'];
export const urlInici = (lang) => `${BASE}/${lang}/`;
export const urlSetmana = (lang, week) => `${BASE}/${lang}/${T[lang].seg}/${week}/`;
export const urlAbout = (lang) => `${BASE}/${lang}/${T[lang].about}/`;
export const urlPrivacitat = (lang) => `${BASE}/${lang}/${T[lang].privacitat}/`;
export const urlConfirmat = (lang) => `${BASE}/${lang}/${T[lang].confirmat}/`;
export const numSetmana = (week) => String(parseInt(week.split('-')[1], 10));
// «OCTUBRE 2026» a partir de «2026-10».
export const nomMes = (mes, lang) => `${T[lang].mesos[parseInt(mes.slice(5), 10) - 1]} ${mes.slice(0, 4)}`;
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

// El canal de feedback: GitHub Issues (cap adreça de correu a la web).
export const ISSUES = 'https://github.com/jrbayguade/ai-weekly/issues';
// Un issue nou amb el formulari de feedback, el títol i el camp «Setmana» ja omplerts.
export const urlIssue = (lang, week) =>
  `${ISSUES}/new?template=feedback.yml&title=${encodeURIComponent(T[lang].titolIssue(numSetmana(week), week))}&setmana=${week}`;
