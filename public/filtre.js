// filtre.js -- la pinça (rang de setmanes), el filtre per empresa i el globus dels punts.
// Sense JS la pàgina funciona igual, només sense filtre.
(() => {
  // A la permanent d'una setmana que no és la més nova: que es vegi la setmana compartida en obrir l'enllaç.
  const obre = document.getElementById('setmanes')?.dataset.obre;
  if (obre && !location.hash) {
    const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(`s-${obre}`)?.scrollIntoView({ behavior: reduit ? 'auto' : 'smooth', block: 'start' });
  }

  const cr = document.querySelector('.cronologia');
  if (!cr) return;
  const setmanes = JSON.parse(cr.dataset.setmanes);
  const txt = JSON.parse(cr.dataset.txt);
  const N = setmanes.length;
  const fila = cr.querySelector('.pinca-fila');
  const pinca = cr.querySelector('.pinca');
  const estat = { r0: 0, r1: N, co: null };
  cr.classList.add('js-on');

  const comptaSetmanes = (n) => (n === 1 ? txt.setmana1 : txt.setmanes.replace('{n}', n));

  function aplica() {
    const { r0, r1, co } = estat;
    pinca.style.left = `${(r0 / N) * 100}%`;
    pinca.style.width = `${((r1 - r0) / N) * 100}%`;
    pinca.setAttribute('aria-valuenow', r1 - r0);
    pinca.setAttribute('aria-valuetext', `${setmanes[r0]} → ${setmanes[r1 - 1]} (${comptaSetmanes(r1 - r0)})`);
    cr.querySelectorAll('.punt').forEach((p) => {
      const i = +p.dataset.idx;
      p.classList.toggle('apagat', i < r0 || i >= r1);
    });
    cr.querySelectorAll('.empresa').forEach((b) => {
      b.classList.toggle('on', b.dataset.co === co);
      b.classList.toggle('off', !!co && b.dataset.co !== co);
      b.setAttribute('aria-pressed', String(b.dataset.co === co));
    });
    document.querySelectorAll('.setmana[data-week]').forEach((d) => {
      const i = setmanes.indexOf(d.dataset.week);
      const visible = i >= r0 && i < r1;
      // Un resum (permanent d'una altra setmana) no té items: diu les seves empreses a data-cos.
      let alguna = d.dataset.cos !== undefined && (!co || d.dataset.cos.split('|').includes(co));
      d.querySelectorAll('li.item').forEach((li) => {
        const ok = !co || li.dataset.co === co;
        li.hidden = !ok;
        alguna ||= ok;
      });
      d.querySelectorAll('section.categoria').forEach((s) => {
        s.hidden = ![...s.querySelectorAll('li.item')].some((li) => !li.hidden);
      });
      d.hidden = !visible || !alguna;
    });
    const tot = r0 === 0 && r1 === N;
    const badge = cr.querySelector('.rang-txt');
    badge.hidden = tot && !co;
    badge.textContent = (tot ? txt.tot : comptaSetmanes(r1 - r0)) + (co ? ` · ${txt.nomes.replace('{c}', co)}` : '');
    // El select i els botons segueixen la pinça: «on» només si el rang coincideix amb un preset.
    const preset = tot ? 'tot' : r1 === N ? String(r1 - r0) : null;
    const sel = cr.querySelector('.rang-mobil');
    sel.value = [...sel.options].some((o) => o.value === preset) ? preset : '';
    cr.querySelectorAll('[data-rang]').forEach((b) => b.classList.toggle('on', b.dataset.rang === preset));
  }

  const rang = (v) => {
    if (v === 'tot') { estat.r0 = 0; estat.r1 = N; } else { estat.r1 = N; estat.r0 = Math.max(0, N - +v); }
    aplica();
  };
  cr.querySelectorAll('[data-rang]').forEach((b) => b.addEventListener('click', () => rang(b.dataset.rang)));
  cr.querySelector('.rang-mobil').addEventListener('change', (e) => rang(e.target.value));
  cr.querySelectorAll('.empresa').forEach((b) => b.addEventListener('click', () => {
    estat.co = estat.co === b.dataset.co ? null : b.dataset.co;
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

  // El globus negre amb el títol d'un punt: ratolí, focus i toc.
  const globus = document.createElement('div');
  globus.className = 'globus';
  globus.hidden = true;
  globus.setAttribute('role', 'tooltip');
  document.body.appendChild(globus);
  const mostra = (p) => {
    const r = p.getBoundingClientRect();
    const pista = p.parentElement.getBoundingClientRect();
    globus.textContent = p.dataset.t;
    globus.style.maxWidth = `${Math.min(180, pista.width)}px`;
    globus.hidden = false;
    const w = globus.offsetWidth;
    // Mai fora de la pista: així no tapa els botons d'empresa de l'esquerra.
    const cx = Math.min(Math.max(r.left + r.width / 2, pista.left + w / 2), pista.right - w / 2);
    // Sota el punt si a sobre no hi cap sense tapar el títol (carril de dalt).
    const sota = r.top - globus.offsetHeight - 6 < cr.querySelector('.h').getBoundingClientRect().bottom + 2;
    globus.classList.toggle('sota', sota);
    globus.style.left = `${cx + scrollX}px`;
    globus.style.top = `${(sota ? r.bottom : r.top) + scrollY}px`;
  };
  const amaga = () => { globus.hidden = true; };
  addEventListener('scroll', amaga, { passive: true });
  addEventListener('resize', amaga);

  // Un clic a un punt obre la seva setmana, hi ressalta la notícia i en mostra el títol.
  cr.querySelectorAll('.punt').forEach((p) => {
    p.addEventListener('mouseenter', () => mostra(p));
    p.addEventListener('mouseleave', amaga);
    p.addEventListener('focus', () => mostra(p));
    p.addEventListener('blur', amaga);
    p.addEventListener('click', () => {
      // Un punt apagat (fora del rang o d'un carril filtrat): estat coherent abans d'obrir-lo.
      const idx = +p.dataset.idx;
      if (idx < estat.r0) estat.r0 = idx;
      if (idx >= estat.r1) estat.r1 = idx + 1;
      if (estat.co && estat.co !== p.closest('.carril').querySelector('.empresa').dataset.co) estat.co = null;
      aplica();
      const d = document.querySelector(`details.setmana[data-week="${p.dataset.week}"]`);
      if (d) {
        d.hidden = false;
        d.open = true;
        const li = document.getElementById(p.getAttribute('href').slice(1));
        if (li) { li.hidden = false; li.classList.add('flaix'); setTimeout(() => li.classList.remove('flaix'), 1500); }
      }
      mostra(p);
    });
  });
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.punt')) amaga(); });

  aplica();
})();
