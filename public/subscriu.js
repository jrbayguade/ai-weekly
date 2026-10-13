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
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = widget !== null ? window.turnstile.getResponse(widget) : '';
    if (!form.email.checkValidity() || !form.email.value) {
      estat.textContent = dlg.dataset.msgFalta;
      return;
    }
    if (!token) {
      estat.textContent = dlg.dataset.msgEspera;
      return;
    }
    boto.disabled = true;
    estat.textContent = '';
    try {
      const r = await fetch(`${dlg.dataset.worker}/subscriu`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.value, lang: document.documentElement.lang, turnstile: token }) });
      if (r.status !== 202) throw new Error(String(r.status));
      form.hidden = true;
      estat.textContent = dlg.dataset.msgOk;
    } catch {
      estat.textContent = dlg.dataset.msgError;
      boto.disabled = false;
      if (widget !== null) window.turnstile.reset(widget);
    }
  });
})();
