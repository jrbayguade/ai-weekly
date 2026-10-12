import test from 'node:test';
import assert from 'node:assert/strict';

process.env.AI_WEEKLY_DATA = 'tests/fixtures/data';
const { setmanes, empreses } = await import('../src/lib/dades.js');
const { cronologia } = await import('../src/lib/cronologia.js');
const { idiomaPreferit } = await import('../src/lib/i18n.js');

test('només llançaments, carrils en l’ordre d’empreses.json i x dins de 0-100', () => {
  const c = cronologia(setmanes(), empreses(), 'ca');
  assert.deepEqual(c.setmanesAsc, ['2026-40', '2026-41']);
  assert.deepEqual(c.carrils.map((k) => k.name), ['OpenAI', 'Anthropic']);  // DeepSeek no és llançament
  for (const k of c.carrils) for (const p of k.punts) assert.ok(p.x >= 0 && p.x <= 100 && p.r >= 6 && p.r <= 14);
  const opus = c.carrils[1].punts[0];
  assert.equal(opus.week, '2026-41'); assert.equal(opus.idx, 1);
});

test('sense setmanes o sense llançaments no hi ha carrils', () => {
  assert.deepEqual(cronologia([], empreses(), 'ca').carrils, []);
  const sense = setmanes().map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, is_release: false })) }));
  assert.deepEqual(cronologia(sense, empreses(), 'ca').carrils, []);
});

test('idiomaPreferit recorre navigator.languages EN ORDRE', () => {
  assert.equal(idiomaPreferit(['es-ES', 'ca']), 'es');
  assert.equal(idiomaPreferit(['en-US', 'ca-ES']), 'ca');
  assert.equal(idiomaPreferit(['fr', 'de']), 'en');
  assert.equal(idiomaPreferit([]), 'en');
});
