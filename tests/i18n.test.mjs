// tests/i18n.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { T, urlSetmana, dataCurta, rangSetmana } from '../src/lib/i18n.js';

test('els tres idiomes tenen les mateixes claus', () => {
  const claus = (o) => Object.keys(o).sort();
  assert.deepEqual(claus(T.ca), claus(T.es));
  assert.deepEqual(claus(T.ca), claus(T.en));
  assert.deepEqual(claus(T.ca.cats), claus(T.en.cats));
  assert.equal(T.ca.segells.length, T.en.segells.length);
});

test('URL de setmana per idioma', () => {
  assert.equal(urlSetmana('ca', '2026-41'), '/ai-weekly/ca/setmana/2026-41/');
  assert.equal(urlSetmana('es', '2026-41'), '/ai-weekly/es/semana/2026-41/');
  assert.equal(urlSetmana('en', '2026-41'), '/ai-weekly/en/week/2026-41/');
});

test('data curta en majúscules', () => {
  assert.match(dataCurta('2026-10-06', 'ca'), /^6 OCT/);
});

test('rang de setmana amb any', () => {
  assert.equal(rangSetmana('2026-10-05', '2026-10-11', 'ca'), '5 OCT–11 OCT 2026');
  assert.equal(rangSetmana('2026-12-28', '2027-01-03', 'ca'), '28 DES 2026–3 GEN 2027');
  assert.equal(rangSetmana('2026-12-28', '2027-01-03', 'es'), '28 DIC 2026–3 ENE 2027');
});

test('el marcador 🔥 surt a partir de 3 newsletters (escala real 1-4)', async () => {
  const { LLINDAR_CALENT } = await import('../src/lib/i18n.js');
  assert.equal(LLINDAR_CALENT, 3);
});

test('les claus de la subscripció existeixen als tres idiomes', () => {
  const claus = 'subsCap subsSetmana subsPeu subsTitol subsBoto subsCamp subsPlaceholder subsOk subsError subsFalta tanca privacitatTitol privacitatText confirmatTitol confirmatOk confirmatCaducat confirmatError'.split(' ');
  for (const l of ['ca', 'es', 'en']) for (const k of claus) assert.ok(T[l][k], `${l}.${k}`);
});
