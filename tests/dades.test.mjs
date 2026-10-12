// tests/dades.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.AI_WEEKLY_DATA = 'tests/fixtures/data';
const { setmanes, empreses, errorsSetmana } = await import('../src/lib/dades.js');

test('les setmanes de mostra són vàlides i surten de la més nova a la més vella', () => {
  const s = setmanes();
  assert.deepEqual(s.map((x) => x.week), ['2026-41', '2026-40']);
  for (const x of s) assert.deepEqual(errorsSetmana(x), [], x.week);
});

test('errorsSetmana detecta camps dolents', () => {
  const dolenta = structuredClone(setmanes()[0]);
  dolenta.items[0].category = 'weather';
  dolenta.items[1].title = { ca: 'x' };
  dolenta.note = { ca: 'x' };
  assert.equal(errorsSetmana(dolenta).length, 3);
});

test('empreses', () => {
  assert.equal(empreses()[0].name, 'OpenAI');
});

test('les dades REALS també són vàlides', () => {
  process.env.AI_WEEKLY_DATA = 'data';  // dades.js llegeix l'entorn a cada crida
  try {
    for (const x of setmanes()) assert.deepEqual(errorsSetmana(x), [], x.week);
  } finally {
    process.env.AI_WEEKLY_DATA = 'tests/fixtures/data';
  }
});
