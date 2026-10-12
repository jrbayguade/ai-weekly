// tests/build.test.mjs -- construeix la web amb les dades de mostra (i sense setmanes) i en llegeix l'HTML.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const arrel = path.resolve(import.meta.dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-weekly-build-'));

function construeix(dades, nom) {
  const out = path.join(tmp, nom);
  const r = spawnSync(process.execPath, [path.join(arrel, 'node_modules/astro/astro.js'), 'build', '--outDir', out],
    { cwd: arrel, env: { ...process.env, AI_WEEKLY_DATA: dades }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return (rel) => fs.readFileSync(path.join(out, rel), 'utf8');
}

const llegeix = construeix(path.join(arrel, 'tests/fixtures/data'), 'mostra');
const compta = (html, re) => (html.match(re) ?? []).length;
// Sense bolcar l'HTML sencer al missatge d'error.
const hi = (html, re) => assert.ok(re.test(html), `hi hauria de ser: ${re}`);
const no = (html, re) => assert.ok(!re.test(html), `no hi hauria de ser: ${re}`);

test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));

test('la permanent d’una setmana només porta el cos d’aquella setmana; la resta, en resum', () => {
  const html = llegeix('en/week/2026-40/index.html');
  assert.equal(compta(html, /class="cos"/g), 1);
  for (const id of ['2026-40-01', '2026-40-02']) hi(html, new RegExp(`<li[^>]*id="${id}"`));
  for (const id of ['2026-41-01', '2026-41-02', '2026-41-03']) no(html, new RegExp(`id="${id}"`));
  // La 41 hi és com a resum: enllaç a la seva permanent, amb les empreses que hi surten.
  const resum = html.match(/<a[^>]*class="setmana setmana-resum"[^>]*>/g) ?? [];
  assert.equal(resum.length, 1);
  assert.match(resum[0], /data-week="2026-41"/);
  assert.match(resum[0], /href="\/ai-weekly\/en\/week\/2026-41\/"/);
  assert.match(resum[0], /data-cos="Anthropic\|DeepSeek\|Other"/);
});

test('la permanent d’una setmana que no és la més nova demana fer-hi scroll; la més nova no', () => {
  hi(llegeix('ca/setmana/2026-40/index.html'), /<div id="setmanes" data-obre="2026-40"/);
  hi(llegeix('ca/setmana/2026-41/index.html'), /<div id="setmanes">/);
});

test('els punts de la cronologia d’una altra setmana enllacen a la seva permanent', () => {
  const html = llegeix('en/week/2026-40/index.html');
  hi(html, /class="punt" href="\/ai-weekly\/en\/week\/2026-41\/#2026-41-01"/);
  hi(html, /class="punt" href="#2026-40-01"/);
});

test('la portada continua amb totes les setmanes senceres', () => {
  for (const l of ['ca', 'es', 'en']) {
    const html = llegeix(`${l}/index.html`);
    assert.equal(compta(html, /class="cos"/g), 2, l);
    no(html, /setmana-resum/);
  }
});

test('l’arrel porta description, canonical, og:url, og:description i hreflang (amb x-default)', () => {
  const html = llegeix('index.html');
  const W = 'https://jrbayguade.github.io/ai-weekly';
  hi(html, /<meta name="description" content="[^"]+"/);
  hi(html, /<meta property="og:description" content="[^"]+"/);
  hi(html, new RegExp(`<link rel="canonical" href="${W}/"`));
  hi(html, new RegExp(`<meta property="og:url" content="${W}/"`));
  for (const l of ['ca', 'es', 'en']) hi(html, new RegExp(`<link rel="alternate" hreflang="${l}" href="${W}/${l}/"`));
  hi(html, new RegExp(`<link rel="alternate" hreflang="x-default" href="${W}/en/"`));
});

test('cada pàgina té hreflang x-default cap a la seva versió anglesa', () => {
  const W = 'https://jrbayguade.github.io/ai-weekly';
  hi(llegeix('ca/index.html'), new RegExp(`hreflang="x-default" href="${W}/en/"`));
  hi(llegeix('es/semana/2026-40/index.html'), new RegExp(`hreflang="x-default" href="${W}/en/week/2026-40/"`));
  hi(llegeix('ca/com-es-fa/index.html'), new RegExp(`hreflang="x-default" href="${W}/en/how-its-made/"`));
});

test('la portada sense setmanes diu una línia d’estat buit en cada idioma', async () => {
  const { T } = await import('../src/lib/i18n.js');
  const dades = path.join(tmp, 'dades-buides');
  fs.mkdirSync(path.join(dades, 'weeks'), { recursive: true });
  fs.copyFileSync(path.join(arrel, 'tests/fixtures/data/empreses.json'), path.join(dades, 'empreses.json'));
  const buida = construeix(dades, 'buida');
  for (const l of ['ca', 'es', 'en']) {
    const html = buida(`${l}/index.html`);
    const linia = `<p class="buit">${T[l].buit.replace(/'/g, '&#39;')}</p>`;
    assert.ok(html.includes(linia), `${l}: falta ${linia}`);
  }
  no(llegeix('ca/index.html'), /class="buit"/);
});

test('accessibilitat: un sol h1, aria-pressed als botons d’empresa i emojis amagats al lector', () => {
  for (const rel of ['ca/index.html', 'en/week/2026-40/index.html', 'ca/com-es-fa/index.html']) {
    assert.equal(compta(llegeix(rel), /<h1[\s>]/g), 1, rel);
  }
  const html = llegeix('ca/index.html');
  hi(html, /<h1 class="logo">/);
  const botons = html.match(/<button class="empresa"[^>]*>/g) ?? [];
  assert.ok(botons.length > 0);
  for (const b of botons) assert.match(b, /aria-pressed="false"/);
  for (const e of ['🔥', '📅', '🚀']) {
    assert.ok(html.includes(`<span aria-hidden="true">${e}</span>`), `${e} amagat`);
    assert.equal(html.split(e).length - 1, compta(html, new RegExp(`<span aria-hidden="true">${e}</span>`, 'g')), `${e} sempre amagat`);
  }
  const filtre = fs.readFileSync(path.join(arrel, 'public/filtre.js'), 'utf8');
  assert.match(filtre, /aria-pressed/);
});
