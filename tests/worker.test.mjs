// tests/worker.test.mjs -- el Worker de subscripció: funcions pures i handlers amb fetch fals.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as W from '../worker/src/logica.js';
import { T, LANGS } from '../src/lib/i18n.js';

const env = { ORIGEN: 'https://jrbayguade.github.io', WEB: 'https://jrbayguade.github.io/ai-weekly',
  REMITENT: 'AI Weekly <hi@zinkforge.com>', SEGMENTS: '{"ca":"s-ca","es":"s-es","en":"s-en"}',
  RESEND_KEY: 're_prova', SIGNATURA: 'una-signatura-de-prova-prou-llarga', TURNSTILE_SECRET: 'ts' };
const ARA = 1_800_000_000_000;

function fals(respostes = {}) {
  const crides = [];
  const f = async (url, opts = {}) => {
    crides.push({ url: String(url), opts });
    const m = opts.method || 'GET';
    const r = Object.entries(respostes).find(([k]) => {
      const mm = k.match(/^(GET|POST|PATCH) (.*)$/);
      return mm ? mm[1] === m && String(url).includes(mm[2]) : String(url).includes(k);
    });
    const [status, cos] = r ? r[1] : [200, {}];
    return new Response(JSON.stringify(cos), { status });
  };
  f.crides = crides;
  return f;
}
const peticio = (cos, origen = env.ORIGEN) => new Request('https://w.example/subscriu', {
  method: 'POST', headers: { Origin: origen, 'Content-Type': 'application/json' }, body: JSON.stringify(cos) });

test('les pàgines de confirmació del Worker són les de la web', () => {
  for (const l of LANGS) assert.equal(W.PAG_CONFIRMAT[l], T[l].confirmat);
});

test('signa i verifica: bo, manipulat, caducat', async () => {
  const t = await W.signa({ e: 'a@b.cat', l: 'ca', x: ARA + 1000 }, env.SIGNATURA);
  assert.deepEqual(await W.verifica(t, env.SIGNATURA, ARA), { email: 'a@b.cat', lang: 'ca' });
  const [p, f] = t.split('.');
  const altre = await W.signa({ e: 'x@b.cat', l: 'ca', x: ARA + 1000 }, env.SIGNATURA);
  assert.equal((await W.verifica(`${altre.split('.')[0]}.${f}`, env.SIGNATURA, ARA)).error, 'invalid');
  assert.equal((await W.verifica(t, 'una-altra-signatura', ARA)).error, 'invalid');
  assert.deepEqual(await W.verifica(t, env.SIGNATURA, ARA + 2000), { error: 'caducat', lang: 'ca' });
  for (const dolent of ['', 'x', 'a.b.c', `${p}.`, '%%%.%%%']) {
    assert.equal((await W.verifica(dolent, env.SIGNATURA, ARA)).error, 'invalid');
  }
});

test('esCorreu', () => {
  assert.ok(W.esCorreu('a.b+c@exemple.cat'));
  for (const d of ['', 'a', 'a@b', 'a b@c.cat', '<a@b.cat>', 'a@b.c', 'x'.repeat(250) + '@b.cat']) assert.ok(!W.esCorreu(d), d);
});

test('subscriu: orígen aliè 403, dades dolentes 400, Turnstile fallit 403', async () => {
  const f = fals({ siteverify: [200, { success: false }] });
  assert.equal((await W.subscriu(peticio({ email: 'a@b.cat', lang: 'ca', turnstile: 't' }, 'https://dolent.com'), env, { fetch: f, ara: ARA })).status, 403);
  assert.equal((await W.subscriu(peticio({ email: 'no', lang: 'ca', turnstile: 't' }), env, { fetch: f, ara: ARA })).status, 400);
  assert.equal((await W.subscriu(peticio({ email: 'a@b.cat', lang: 'fr', turnstile: 't' }), env, { fetch: f, ara: ARA })).status, 400);
  assert.equal((await W.subscriu(peticio({ email: 'a@b.cat', lang: 'ca', turnstile: 't' }), env, { fetch: f, ara: ARA })).status, 403);
  assert.ok(!f.crides.some((c) => c.url.includes('api.resend.com')));
});

test('subscriu: envia la confirmació amb un enllaç signat i respon 202', async () => {
  const f = fals({ siteverify: [200, { success: true, hostname: 'jrbayguade.github.io' }], '/emails': [200, { id: 'e1' }] });
  const r = await W.subscriu(peticio({ email: '  A@B.Cat ', lang: 'es', turnstile: 't' }), env, { fetch: f, ara: ARA });
  assert.equal(r.status, 202);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), env.ORIGEN);
  const correu = JSON.parse(f.crides.find((c) => c.url.endsWith('/emails')).opts.body);
  assert.deepEqual(correu.to, ['a@b.cat']);
  assert.equal(correu.from, env.REMITENT);
  assert.equal(correu.reply_to, 'hi@zinkforge.com');
  const enllac = correu.text.match(/https:\/\/w\.example\/confirma\?t=\S+/)[0];
  const t = new URL(enllac).searchParams.get('t');
  assert.deepEqual(await W.verifica(t, env.SIGNATURA, ARA), { email: 'a@b.cat', lang: 'es' });
  assert.ok(!JSON.stringify(correu).includes(env.RESEND_KEY));
});

test('subscriu: Resend caigut 502 (sense filtrar res)', async () => {
  const f = fals({ siteverify: [200, { success: true, hostname: 'jrbayguade.github.io' }], '/emails': [500, { message: 'x' }] });
  assert.equal((await W.subscriu(peticio({ email: 'a@b.cat', lang: 'ca', turnstile: 't' }), env, { fetch: f, ara: ARA })).status, 502);
});

test('confirma: crea el contacte al segment i redirigeix a la web', async () => {
  const t = await W.signa({ e: 'a@b.cat', l: 'en', x: ARA + 1000 }, env.SIGNATURA);
  const f = fals({ '/contacts': [201, { id: 'c1' }] });
  const r = await W.confirma(new Request(`https://w.example/confirma?t=${t}`), env, { fetch: f, ara: ARA });
  assert.equal(r.status, 303);
  assert.equal(r.headers.get('Location'), `${env.WEB}/en/confirmed/`);
  const cos = JSON.parse(f.crides[0].opts.body);
  assert.deepEqual(cos, { email: 'a@b.cat', unsubscribed: false, segments: [{ id: 's-en' }] });
});

test('confirma: un contacte que ja existia (o s’havia donat de baixa) queda subscrit', async () => {
  const t = await W.signa({ e: 'a@b.cat', l: 'ca', x: ARA + 1000 }, env.SIGNATURA);
  const f = fals({ '/contacts/a%40b.cat/segments': [200, {}], '/contacts/a%40b.cat': [200, {}], '/contacts': [409, {}] });
  const r = await W.confirma(new Request(`https://w.example/confirma?t=${t}`), env, { fetch: f, ara: ARA });
  assert.equal(r.headers.get('Location'), `${env.WEB}/ca/confirmat/`);
  const patch = f.crides.find((c) => c.opts.method === 'PATCH');
  assert.deepEqual(JSON.parse(patch.opts.body), { unsubscribed: false });
  assert.ok(f.crides.some((c) => c.url.endsWith('/contacts/a%40b.cat/segments/s-ca')));
});

test('confirma: caducat, invàlid i error mai no posen el correu a la URL', async () => {
  const t = await W.signa({ e: 'a@b.cat', l: 'es', x: ARA - 1 }, env.SIGNATURA);
  let r = await W.confirma(new Request(`https://w.example/confirma?t=${t}`), env, { fetch: fals(), ara: ARA });
  assert.equal(r.headers.get('Location'), `${env.WEB}/es/confirmado/?e=caducat`);
  r = await W.confirma(new Request('https://w.example/confirma?t=brossa'), env, { fetch: fals(), ara: ARA });
  assert.equal(r.headers.get('Location'), `${env.WEB}/en/confirmed/?e=invalid`);
  const bo = await W.signa({ e: 'a@b.cat', l: 'ca', x: ARA + 1000 }, env.SIGNATURA);
  r = await W.confirma(new Request(`https://w.example/confirma?t=${bo}`), env, { fetch: fals({ '/contacts': [500, {}] }), ara: ARA });
  assert.equal(r.headers.get('Location'), `${env.WEB}/ca/confirmat/?e=error`);
  assert.ok(!r.headers.get('Location').includes('b.cat'));
});

test('preflight només per a l’orígen de la web', () => {
  const bo = W.preflight(new Request('https://w.example/subscriu', { method: 'OPTIONS', headers: { Origin: env.ORIGEN } }), env);
  assert.equal(bo.status, 204);
  assert.equal(bo.headers.get('Access-Control-Allow-Methods'), 'POST');
  const dolent = W.preflight(new Request('https://w.example/subscriu', { method: 'OPTIONS', headers: { Origin: 'https://x.com' } }), env);
  assert.equal(dolent.status, 403);
});

const confirmaReq = async (l = 'ca') => new Request(`https://w.example/confirma?t=${await W.signa({ e: 'a@b.cat', l, x: ARA + 1000 }, env.SIGNATURA)}`);

test('confirma: POST /contacts caigut i el contacte no existeix -> error, sense PATCH', async () => {
  const f = fals({ 'GET /contacts/a%40b.cat': [404, {}], '/contacts': [500, {}] });
  const r = await W.confirma(await confirmaReq(), env, { fetch: f, ara: ARA });
  assert.equal(r.headers.get('Location'), `${env.WEB}/ca/confirmat/?e=error`);
  assert.ok(!f.crides.some((c) => c.opts.method === 'PATCH'));
});

test('confirma: 422 en afegir al segment és error', async () => {
  const f = fals({ '/contacts/a%40b.cat/segments': [422, {}], '/contacts/a%40b.cat': [200, {}], '/contacts': [409, {}] });
  const r = await W.confirma(await confirmaReq(), env, { fetch: f, ara: ARA });
  assert.equal(r.headers.get('Location'), `${env.WEB}/ca/confirmat/?e=error`);
});

test('confirma: segment buit a l’entorn -> error sense cridar Resend', async () => {
  const f = fals();
  const r = await W.confirma(await confirmaReq(), { ...env, SEGMENTS: '{"ca":"","es":"","en":""}' }, { fetch: f, ara: ARA });
  assert.equal(r.headers.get('Location'), `${env.WEB}/ca/confirmat/?e=error`);
  assert.equal(f.crides.length, 0);
});

test('subscriu: Turnstile d’un altre hostname és 403', async () => {
  const f = fals({ siteverify: [200, { success: true, hostname: 'evil.com' }] });
  assert.equal((await W.subscriu(peticio({ email: 'a@b.cat', lang: 'ca', turnstile: 't' }), env, { fetch: f, ara: ARA })).status, 403);
});

test('subscriu: fetch que llença -> 502 amb CORS', async () => {
  const f = async () => { throw new Error('xarxa'); };
  const r = await W.subscriu(peticio({ email: 'a@b.cat', lang: 'ca', turnstile: 't' }), env, { fetch: f, ara: ARA });
  assert.equal(r.status, 502);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), env.ORIGEN);
});
