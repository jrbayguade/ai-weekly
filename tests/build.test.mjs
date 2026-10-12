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
