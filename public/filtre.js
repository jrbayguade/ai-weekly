// filtre.js -- la pinça (rang de setmanes), el filtre per empresa i el globus dels punts.
// Sense JS la pàgina funciona igual, només sense filtre.
(() => {
  const cr = document.querySelector('.cronologia');
  if (!cr) return;
  const setmanes = JSON.parse(cr.dataset.setmanes);
  const txt = JSON.parse(cr.dataset.txt);
  const N = setmanes.length;
  const fila = cr.querySelector('.pinca-fila');
  const pinca = cr.querySelector('.pinca');
  const estat = { r0: 0, r1: N, co: null };

  function aplica() {
    const { r0, r1, co } = estat;
    pinca.style.left = `${(r0 / N) * 100}%`;
    pinca.style.width = `${((r1 - r0) / N) * 100}%`;
    pinca.setAttribute('aria-valuemin', 1);
    pinca.setAttribute('aria-valuemax', N);
    pinca.setAttribute('aria-valuenow', r1 - r0);
    cr.querySelectorAll('.punt').forEach((p) => {
      const i = +p.dataset.idx;
      p.classList.toggle('apagat', i < r0 || i >= r1);
    });
    cr.querySelectorAll('.empresa').forEach((b) => {
      b.classList.toggle('on', b.dataset.co === co);
      b.classList.toggle('off', !!co && b.dataset.co !== co);
    });
    document.querySelectorAll('details.setmana').forEach((d) => {
      const i = setmanes.indexOf(d.dataset.week);
      const visible = i >= r0 && i < r1;
      let alguna = false;
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
    cr.querySelector('.rang-txt').textContent =
      (tot ? txt.tot : txt.setmanes.replace('{n}', r1 - r0)) + (co ? ` · ${txt.nomes.replace('{c}', co)}` : '');
    // El select i els botons segueixen la pinça: «on» només si el rang coincideix amb un preset.
    const preset = tot ? 'tot' : r1 === N ? String(r1 - r0) : null;
    const sel = cr.querySelector('.rang-mobil');
    if ([...sel.options].some((o) => o.value === preset)) sel.value = preset;
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
    if (e.key === 'ArrowLeft' && estat.r0 > 0) { estat.r0--; estat.r1 = estat.r0 + len; aplica(); }
    if (e.key === 'ArrowRight' && estat.r1 < N) { estat.r1++; estat.r0 = estat.r1 - len; aplica(); }
  });

  // El globus negre amb el títol d'un punt: ratolí, focus i toc.
  const globus = document.createElement('div');
  globus.className = 'globus';
  globus.hidden = true;
  globus.setAttribute('role', 'tooltip');
  document.body.appendChild(globus);
  const mostra = (p) => {
    const r = p.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const marge = 90;
    globus.textContent = p.dataset.t;
    globus.style.left = `${Math.min(Math.max(cx, marge), document.documentElement.clientWidth - marge) + scrollX}px`;
    globus.style.top = `${r.top + scrollY}px`;
    globus.hidden = false;
  };
  const amaga = () => { globus.hidden = true; };

  // Un clic a un punt obre la seva setmana, hi ressalta la notícia i en mostra el títol.
  cr.querySelectorAll('.punt').forEach((p) => {
    p.addEventListener('mouseenter', () => mostra(p));
    p.addEventListener('mouseleave', amaga);
    p.addEventListener('focus', () => mostra(p));
    p.addEventListener('blur', amaga);
    p.addEventListener('click', () => {
      const d = document.querySelector(`details.setmana[data-week="${p.dataset.week}"]`);
      if (d) {
        d.hidden = false;
        d.open = true;
        const li = d.querySelector(`[id="${p.getAttribute('href').slice(1)}"]`);
        if (li) { li.hidden = false; li.classList.add('flaix'); setTimeout(() => li.classList.remove('flaix'), 1500); }
      }
      mostra(p);
    });
  });
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.punt')) amaga(); });

  aplica();
})();
