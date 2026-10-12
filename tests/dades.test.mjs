// tests/dades.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

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

test('errorsSetmana accepta hot i rumor opcionals i exigeix booleans si hi són', async () => {
  const s = JSON.parse(fs.readFileSync('tests/fixtures/data-hot/weeks/2026-42.json', 'utf8'));
  assert.deepEqual(errorsSetmana(s), []);
  const dolenta = structuredClone(s);
  dolenta.items[0].hot = 'sí';
  dolenta.items[1].rumor = 1;
  assert.deepEqual(errorsSetmana(dolenta).sort(), ['2026-42-01: hot', '2026-42-02: rumor']);
});

test('esCalent: el booleà hot mana; sense hot, el llindar d’n', async () => {
  const { esCalent } = await import('../src/lib/i18n.js');
  assert.equal(esCalent({ n: 1, hot: true }), true);
  assert.equal(esCalent({ n: 9, hot: false }), false);
  assert.equal(esCalent({ n: 3 }), true);
  assert.equal(esCalent({ n: 2 }), false);
  assert.equal(esCalent({ n: 9, hot: true, rumor: true }), false);
  assert.equal(esCalent({ n: 9, rumor: true }), false);
});

test('empreses reals: les noves hi són, amb àlies, i les anteriors segueixen al davant', () => {
  process.env.AI_WEEKLY_DATA = 'data';
  try {
    const e = empreses();
    assert.deepEqual(e.slice(0, 10).map((x) => x.name),
      ['OpenAI', 'Anthropic', 'Google', 'Meta', 'DeepSeek', 'Mistral', 'xAI', 'Microsoft', 'Alibaba', 'NVIDIA']);
    const per = Object.fromEntries(e.map((x) => [x.name, x.aliases]));
    for (const [n, a] of [['Apple', null], ['Amazon', 'aws'], ['ByteDance', 'tiktok'], ['ByteDance', 'doubao'], ['Tencent', 'hunyuan'],
      ['Moonshot', 'kimi'], ['Z.ai', 'zhipu'], ['Z.ai', 'glm'], ['Cursor', 'anysphere'], ['Cognition', 'devin'],
      ['Perplexity', null], ['Hugging Face', null], ['Cerebras', null]]) {
      assert.ok(per[n], n);
      if (a) assert.ok(per[n].includes(a), `${n}: ${a}`);
    }
  } finally {
    process.env.AI_WEEKLY_DATA = 'tests/fixtures/data';
  }
});
