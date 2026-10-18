// subscriu.js -- la finestra de subscripció. S'obre des de la capçalera, el final de cada
// setmana i el peu. Turnstile (Cloudflare) només es carrega quan s'obre la finestra.
(() => {
  const dlg = document.getElementById('subscriu');
  if (!dlg) return;
  const form = dlg.querySelector('form');
  const boto = form.querySelector('button[type="submit"]');
  const estat = dlg.querySelector('.subs-estat');
  const caixaTs = dlg.querySelector('.subs-ts');
  let widget = null;
  let carregat = false;
  const carregaTurnstile = () => {
    if (carregat) return;
    carregat = true;
    window.aiWeeklyTurnstile = () => {
      widget = window.turnstile.render(caixaTs, { sitekey: dlg.dataset.sitekey, size: 'flexible' });
    };
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=aiWeeklyTurnstile&render=explicit';
    s.async = true;
    document.head.append(s);
  };
  document.querySelectorAll('[data-subscriu]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    carregaTurnstile();
    dlg.showModal();
    form.email.focus();
  }));
  dlg.querySelector('.tanca').addEventListener('click', () => dlg.close());
  // un clic al fons (fora de .subs-cos) arriba al mateix <dialog>
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  // Al mòbil el teclat tapa la part de baix de la finestra, on surt l'estat: es tanca el teclat,
  // el botó diu que està enviant i el missatge es porta a la vista.
  const digues = (msg) => {
    estat.textContent = msg;
    estat.scrollIntoView({ block: 'nearest' });
  };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    form.email.blur();
    const token = widget !== null ? window.turnstile.getResponse(widget) : '';
    if (!form.email.checkValidity() || !form.email.value) {
      digues(dlg.dataset.msgFalta);
      return;
    }
    if (!token) {
      digues(dlg.dataset.msgEspera);
      return;
    }
    const text = boto.textContent;
    boto.disabled = true;
    boto.textContent = dlg.dataset.msgEnviant;
    estat.textContent = '';
    try {
      const r = await fetch(`${dlg.dataset.worker}/subscriu`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.value, lang: document.documentElement.lang, turnstile: token }),
        signal: AbortSignal.timeout(20000) });   // mai un botó penjat sense resposta
      if (r.status !== 202) throw new Error(String(r.status));
      form.hidden = true;
      digues(dlg.dataset.msgOk);
      estat.focus();   // el botó que tenia el focus ja no hi és
    } catch {
      digues(dlg.dataset.msgError);
      if (widget !== null) window.turnstile.reset(widget);
    } finally {
      boto.disabled = false;
      boto.textContent = text;
    }
  });
})();
