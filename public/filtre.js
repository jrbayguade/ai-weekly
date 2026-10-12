// filtre.js -- la pinça (rang de setmanes), el filtre per empresa, el globus del mapa i els mesos plegables.
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
  const txt = JSON.parse(mp.dataset.txt);
  const N = setmanes.length;
  const scroll = mp.querySelector('.mapa-scroll');
  const fila = mp.querySelector('.pinca-fila');
  const pinca = mp.querySelector('.pinca');
  const caselles = [...mp.querySelectorAll('.casella')];
  const estat = { r0: 0, r1: N, co: null, cat: null };
  mp.classList.add('js-on');
  // Al mòbil la graella pot ser més ampla que la pantalla: les setmanes més noves, a la vista.
  const alFinal = () => { scroll.scrollLeft = scroll.scrollWidth; };
  alFinal();
  document.fonts?.ready.then(alFinal);
  addEventListener('load', alFinal);

  const comptaSetmanes = (n) => (n === 1 ? txt.setmana1 : txt.setmanes.replace('{n}', n));

  function aplica() {
    const { r0, r1, co, cat } = estat;
    pinca.style.left = `${(r0 / N) * 100}%`;
    pinca.style.width = `${((r1 - r0) / N) * 100}%`;
    pinca.setAttribute('aria-valuenow', r1 - r0);
    pinca.setAttribute('aria-valuetext', `${setmanes[r0]} → ${setmanes[r1 - 1]} (${comptaSetmanes(r1 - r0)})`);
    caselles.forEach((c) => {
      const i = +c.dataset.idx;
      c.classList.toggle('apagat', i < r0 || i >= r1);
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
      const i = setmanes.indexOf(d.dataset.week);
      const visible = i >= r0 && i < r1;
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
      d.hidden = !visible || !alguna;
    });
    // Un mes sense cap setmana visible tampoc no es mostra.
    document.querySelectorAll('details.mes').forEach((m) => {
      m.hidden = ![...m.querySelectorAll('.setmana[data-week]')].some((d) => !d.hidden);
    });
    const tot = r0 === 0 && r1 === N;
    const filtres = [co && txt.nomes.replace('{c}', co), cat && txt.cats[cat]].filter(Boolean);
    const badge = mp.querySelector('.rang-txt');
    badge.hidden = tot && !filtres.length;
    badge.textContent = [tot ? txt.tot : comptaSetmanes(r1 - r0), ...filtres].join(' · ');
    // El select i els botons segueixen la pinça: «on» només si el rang coincideix amb un preset.
    const preset = tot ? 'tot' : r1 === N ? String(r1 - r0) : null;
    const sel = mp.querySelector('.rang-mobil');
    sel.value = [...sel.options].some((o) => o.value === preset) ? preset : '';
    mp.querySelectorAll('[data-rang]').forEach((b) => b.classList.toggle('on', b.dataset.rang === preset));
  }

  const rang = (v) => {
    if (v === 'tot') { estat.r0 = 0; estat.r1 = N; } else { estat.r1 = N; estat.r0 = Math.max(0, N - +v); }
    aplica();
  };
  mp.querySelectorAll('[data-rang]').forEach((b) => b.addEventListener('click', () => rang(b.dataset.rang)));
  mp.querySelector('.rang-mobil').addEventListener('change', (e) => rang(e.target.value));
  mp.querySelectorAll('.empresa').forEach((b) => b.addEventListener('click', () => {
    estat.co = estat.co === b.dataset.co ? null : b.dataset.co;
    aplica();
  }));

  mp.querySelectorAll('.cat-btn').forEach((b) => b.addEventListener('click', () => {
    estat.cat = estat.cat === b.dataset.cat ? null : b.dataset.cat;
    aplica();
  }));

  // La pinça: arrossegar el cos la mou; les mans l'estiren. Ratolí i dit (Pointer Events).
  let drag = null;
  pinca.addEventListener('pointerdown', (e) => {
    const mode = e.target.classList.contains('esq') ? 'esq' : e.target.classList.contains('dre') ? 'dre' : 'mou';
    drag = { mode, x: e.clientX, r0: estat.r0, r1: estat.r1, w: fila.getBoundingClientRect().width };
    pinca.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  pinca.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const d = Math.round(((e.clientX - drag.x) / drag.w) * N);
    if (drag.mode === 'mou') {
      const len = drag.r1 - drag.r0;
      estat.r0 = Math.max(0, Math.min(N - len, drag.r0 + d));
      estat.r1 = estat.r0 + len;
    } else if (drag.mode === 'esq') {
      estat.r0 = Math.max(0, Math.min(drag.r1 - 1, drag.r0 + d));
    } else {
      estat.r1 = Math.min(N, Math.max(drag.r0 + 1, drag.r1 + d));
    }
    aplica();
  });
  const fi = () => { drag = null; };
  pinca.addEventListener('pointerup', fi);
  pinca.addEventListener('pointercancel', fi);
  pinca.addEventListener('keydown', (e) => {
    const len = estat.r1 - estat.r0;
    let fet = true;
    if (e.shiftKey && e.key === 'ArrowRight') estat.r1 = Math.min(N, estat.r1 + 1);
    else if (e.shiftKey && e.key === 'ArrowLeft') estat.r1 = Math.max(estat.r0 + 1, estat.r1 - 1);
    else if (e.key === 'ArrowLeft') { estat.r0 = Math.max(0, estat.r0 - 1); estat.r1 = estat.r0 + len; }
    else if (e.key === 'ArrowRight') { estat.r1 = Math.min(N, estat.r1 + 1); estat.r0 = estat.r1 - len; }
    else if (e.key === 'Home') { estat.r0 = 0; estat.r1 = len; }
    else if (e.key === 'End') { estat.r1 = N; estat.r0 = N - len; }
    else fet = false;
    if (fet) { e.preventDefault(); aplica(); }
  });

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
    // Mai sobre els noms d'empresa (esquerra), el títol i la llegenda (a dalt) ni la pinça i els botons (a sota).
    const r = c.getBoundingClientRect();
    const esq = mp.querySelector('.empresa').getBoundingClientRect().right + 8;
    const dre = scroll.getBoundingClientRect().right;
    globus.style.maxWidth = `${Math.max(120, Math.min(280, dre - esq))}px`;
    globus.hidden = false;
    const w = globus.offsetWidth, h = globus.offsetHeight;
    const sostre = mp.querySelector('.mapa-cap').getBoundingClientRect().bottom + 2;
    const terra = fila.getBoundingClientRect().top - 2;
    let x = Math.min(Math.max(r.left + r.width / 2 - w / 2, esq), dre - w);
    let y;
    if (r.top - 6 - h >= sostre) y = r.top - 6 - h;            // a sobre
    else if (r.bottom + 6 + h <= terra) y = r.bottom + 6;      // a sota
    else {
      // No hi cap ni a sobre ni a sota: al costat de la casella, entre la capçalera i la pinça.
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
      // Una casella apagada (fora del rang o d'una altra empresa): estat coherent abans d'obrir-la.
      const idx = +c.dataset.idx;
      if (idx < estat.r0) estat.r0 = idx;
      if (idx >= estat.r1) estat.r1 = idx + 1;
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
