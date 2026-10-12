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

test('setmanes: singular per a 1 i plural per a 2 en els tres idiomes', async () => {
  const { T } = await import('../src/lib/i18n.js');
  assert.deepEqual([T.ca.setmanes(1), T.ca.setmanes(2)], ['1 setmana', '2 setmanes']);
  assert.deepEqual([T.es.setmanes(1), T.es.setmanes(2)], ['1 semana', '2 semanas']);
  assert.deepEqual([T.en.setmanes(1), T.en.setmanes(2)], ['1 week', '2 weeks']);
});

test('idiomaPreferit compara el subtag primari exacte', () => {
  assert.equal(idiomaPreferit(['cat', 'es']), 'es');
  assert.equal(idiomaPreferit(['ca-ES']), 'ca');
});

test('el text del globus: «títol · data», i només el títol si no hi ha data', () => {
  const ss = setmanes().map((s) => ({ ...s, items: s.items.map((i) => (i.company === 'Anthropic' ? { ...i, date: '' } : i)) }));
  const c = cronologia(ss, empreses(), 'ca');
  const [openai, anthropic] = c.carrils.map((k) => k.punts[0]);
  assert.equal(openai.globus, `${openai.title} · ${openai.date}`);
  assert.equal(anthropic.globus, anthropic.title);
});
