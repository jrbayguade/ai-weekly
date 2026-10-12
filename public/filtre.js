// filtre.js -- el filtre per empresa, el globus del mapa i els mesos plegables.
// Sense JS la pàgina funciona igual, només sense filtre.
(() => {
  const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ves = (el) => el.scrollIntoView({ behavior: reduit ? 'auto' : 'smooth', block: 'start' });
  // Obre tots els <details> (mes i setmana) que contenen un element.
  const desplega = (el) => {
    for (let d = el.closest('details'); d; d = d.parentElement?.closest('details')) d.open = true;
  };

  // Un enllaç antic a una notícia o a una setmana d'un mes plegat: obrir-ho abans de fer-hi scroll.
  const hash = decodeURIComponent(location.hash.slice(1));
  const desti = hash && document.getElementById(hash);
  if (desti && desti.closest('#setmanes')) {
    desplega(desti);
    if (desti.matches('details')) desti.open = true;
    desti.scrollIntoView({ block: 'start' });
  }
  // A la permanent d'una setmana que no és la més nova: que es vegi la setmana compartida en obrir l'enllaç.
  const obre = document.getElementById('setmanes')?.dataset.obre;
  if (obre && !location.hash) {
    const s = document.getElementById(`s-${obre}`);
    if (s) ves(s);
  }

  const mp = document.querySelector('.mapa');
  if (!mp) return;
  const setmanes = JSON.parse(mp.dataset.setmanes);
  const N = setmanes.length;
  const scroll = mp.querySelector('.mapa-scroll');
  const caselles = [...mp.querySelectorAll('.casella')];
  const estat = { co: null, cat: null };
  mp.classList.add('js-on');
  // Al mòbil la graella pot ser més ampla que la pantalla: les setmanes més noves, a la vista.
  const alFinal = () => { scroll.scrollLeft = scroll.scrollWidth; };
  alFinal();
  document.fonts?.ready.then(alFinal);
  addEventListener('load', alFinal);

  function aplica() {
    const { co, cat } = estat;
    caselles.forEach((c) => {
      c.classList.toggle('off', !!co && c.dataset.co !== co);
    });
    mp.querySelectorAll('.empresa').forEach((b) => {
      b.classList.toggle('on', b.dataset.co === co);
      b.classList.toggle('off', !!co && b.dataset.co !== co);
      b.setAttribute('aria-pressed', String(b.dataset.co === co));
    });
    mp.querySelectorAll('.cat-btn').forEach((b) => {
      b.classList.toggle('on', b.dataset.cat === cat);
      b.setAttribute('aria-pressed', String(b.dataset.cat === cat));
    });
    document.querySelectorAll('.setmana[data-week]').forEach((d) => {
      // Un resum (permanent d'una altra setmana) no té items: diu les seves empreses a data-cos.
      let alguna = d.dataset.pars !== undefined && d.dataset.pars.split('|').some((p) => {
        const [pc, pk] = p.split('~');
        return (!co || pc === co) && (!cat || pk === cat);
      });
      d.querySelectorAll('li.item').forEach((li) => {
        const ok = (!co || li.dataset.co === co) && (!cat || li.dataset.cat === cat);
        li.hidden = !ok;
        alguna ||= ok;
      });
      d.querySelectorAll('section.categoria').forEach((s) => {
        s.hidden = ![...s.querySelectorAll('li.item')].some((li) => !li.hidden);
      });
      d.hidden = !alguna;
    });
    // Un mes sense cap setmana visible tampoc no es mostra.
    document.querySelectorAll('details.mes').forEach((m) => {
      m.hidden = ![...m.querySelectorAll('.setmana[data-week]')].some((d) => !d.hidden);
    });
  }

  mp.querySelectorAll('.empresa').forEach((b) => b.addEventListener('click', () => {
    estat.co = estat.co === b.dataset.co ? null : b.dataset.co;
    aplica();
  }));

  mp.querySelectorAll('.cat-btn').forEach((b) => b.addEventListener('click', () => {
    estat.cat = estat.cat === b.dataset.cat ? null : b.dataset.cat;
    aplica();
  }));

  // El globus negre d'una casella: la setmana i els títols dels llançaments (sempre textContent).
  const globus = document.createElement('div');
  globus.className = 'globus';
  globus.hidden = true;
  globus.setAttribute('role', 'tooltip');
  document.body.appendChild(globus);
  let ambGlobus = null;
  const mostra = (c) => {
    globus.replaceChildren();
    const cap = document.createElement('div');
    cap.className = 'g-setmana';
    cap.textContent = c.dataset.t;
    globus.appendChild(cap);
    const titols = JSON.parse(c.dataset.ts);
    if (titols.length) {
      const ul = document.createElement('ul');
      for (const t of titols) { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); }
      globus.appendChild(ul);
    }
    // Mai sobre els noms d'empresa (esquerra) ni el títol i la llegenda (a dalt).
    const r = c.getBoundingClientRect();
    const esq = mp.querySelector('.empresa').getBoundingClientRect().right + 8;
    const dre = scroll.getBoundingClientRect().right;
    globus.style.maxWidth = `${Math.max(120, Math.min(280, dre - esq))}px`;
    globus.hidden = false;
    const w = globus.offsetWidth, h = globus.offsetHeight;
    const sostre = mp.querySelector('.mapa-cap').getBoundingClientRect().bottom + 2;
    const terra = scroll.getBoundingClientRect().bottom;
    let x = Math.min(Math.max(r.left + r.width / 2 - w / 2, esq), dre - w);
    let y;
    if (r.top - 6 - h >= sostre) y = r.top - 6 - h;            // a sobre
    else if (r.bottom + 6 + h <= terra) y = r.bottom + 6;      // a sota
    else {
      // No hi cap ni a sobre ni a sota: al costat de la casella, entre la capçalera i el peu del mapa.
      x = r.left - 8 - w >= esq ? r.left - 8 - w : Math.min(r.right + 8, dre - w);
      y = Math.max(sostre, Math.min(r.top + r.height / 2 - h / 2, terra - h));
    }
    globus.style.left = `${x + scrollX}px`;
    globus.style.top = `${y + scrollY}px`;
    ambGlobus = c;
  };
  const amaga = () => { globus.hidden = true; ambGlobus = null; };
  addEventListener('scroll', amaga, { passive: true });
  scroll.addEventListener('scroll', amaga, { passive: true });
  addEventListener('resize', amaga);

  // Teclat: una sola casella a l'ordre de tabulació (la més nova de la primera fila); les fletxes s'hi mouen.
  const cols = N;
  caselles.forEach((c) => { c.tabIndex = -1; });
  const inicial = caselles[cols - 1];
  if (inicial) inicial.tabIndex = 0;
  const enfoca = (c) => {
    caselles.forEach((x) => { x.tabIndex = -1; });
    c.tabIndex = 0;
    c.focus();
    c.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  // Un toc mostra el globus; un segon toc a la mateixa casella l'obre (al dit no hi ha «passar per sobre»).
  let tactil = false;
  caselles.forEach((c, k) => {
    c.addEventListener('mouseenter', () => mostra(c));
    c.addEventListener('mouseleave', amaga);
    c.addEventListener('focus', () => mostra(c));
    c.addEventListener('blur', amaga);
    c.addEventListener('pointerdown', (e) => { tactil = e.pointerType === 'touch'; });
    c.addEventListener('keydown', (e) => {
      const f = Math.floor(k / cols), i = k % cols;
      const salt = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
      let nou = null;
      if (salt) nou = caselles[(f + salt[0]) * cols + i + salt[1]];
      if (salt && (i + salt[1] < 0 || i + salt[1] >= cols)) nou = null;
      if (e.key === 'Home') nou = caselles[f * cols];
      if (e.key === 'End') nou = caselles[f * cols + cols - 1];
      if (salt || e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        if (nou) enfoca(nou);
      }
    });
    c.addEventListener('click', (e) => {
      if (tactil && ambGlobus !== c) { e.preventDefault(); mostra(c); return; }
      tactil = false;
      // Una altra setmana a la permanent: l'enllaç hi navega.
      if (!c.getAttribute('href').startsWith('#')) return;
      e.preventDefault();
      // Una casella apagada (d'una altra empresa o categoria): estat coherent abans d'obrir-la.
      if (estat.co && estat.co !== c.dataset.co) estat.co = null;
      if (estat.cat && !document.querySelector(`details.setmana[data-week="${c.dataset.week}"] li.item[data-co="${CSS.escape(c.dataset.co)}"][data-cat="${estat.cat}"]`)) estat.cat = null;
      aplica();
      const d = document.querySelector(`details.setmana[data-week="${c.dataset.week}"]`);
      if (!d) return;
      d.hidden = false;
      desplega(d);
      d.open = true;
      d.querySelectorAll(`li.item[data-co="${CSS.escape(c.dataset.co)}"]`).forEach((li) => {
        li.classList.add('flaix');
        setTimeout(() => li.classList.remove('flaix'), 1500);
      });
      amaga();
      ves(d);
    });
  });
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.casella')) amaga(); });

  aplica();
})();
