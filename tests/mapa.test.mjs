// tests/mapa.test.mjs -- el mapa de calor empresa × setmana i l'agrupació per mes (purs).
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.AI_WEEKLY_DATA = 'tests/fixtures/data';
const { setmanes, empreses, mesDeSetmana, agrupaPerMes } = await import('../src/lib/dades.js');
const { mapaCalor } = await import('../src/lib/mapa.js');
const { idiomaPreferit, nomMes } = await import('../src/lib/i18n.js');

// Una setmana sintètica: només el que el mapa i l'agrupació llegeixen.
const S = (week, from, to, items = []) => ({ week, from, to, items });
const L = (company, title, is_release = true) => ({ company, is_release, title: { ca: title, es: title, en: title } });

test('una setmana és del mes del seu DIJOUS (ISO): cap setmana es parteix', () => {
  assert.equal(mesDeSetmana(S('2026-36', '2026-08-31', '2026-09-06')), '2026-09');  // dijous 3 de setembre
  assert.equal(mesDeSetmana(S('2026-35', '2026-08-24', '2026-08-30')), '2026-08');
  assert.equal(mesDeSetmana(S('2026-40', '2026-09-28', '2026-10-04')), '2026-10');  // dijous 1 d'octubre
  assert.equal(mesDeSetmana(S('2026-53', '2026-12-28', '2027-01-03')), '2026-12');  // dijous 31 de desembre
  assert.equal(mesDeSetmana(S('2027-01', '2027-01-04', '2027-01-10')), '2027-01');
});

test('agrupaPerMes: del mes més nou al més vell, i les setmanes en el mateix ordre que entren', () => {
  const ss = [
    S('2026-41', '2026-10-05', '2026-10-11'), S('2026-40', '2026-09-28', '2026-10-04'),
    S('2026-39', '2026-09-21', '2026-09-27'), S('2026-36', '2026-08-31', '2026-09-06'),
    S('2026-35', '2026-08-24', '2026-08-30'),
  ];
  const g = agrupaPerMes(ss);
  assert.deepEqual(g.map((m) => m.mes), ['2026-10', '2026-09', '2026-08']);
  assert.deepEqual(g.map((m) => m.setmanes.map((s) => s.week)), [['2026-41', '2026-40'], ['2026-39', '2026-36'], ['2026-35']]);
  assert.deepEqual(agrupaPerMes([]), []);
});

test('nomMes: «OCTUBRE 2026» en els tres idiomes', () => {
  assert.equal(nomMes('2026-10', 'ca'), 'OCTUBRE 2026');
  assert.equal(nomMes('2026-10', 'es'), 'OCTUBRE 2026');
  assert.equal(nomMes('2026-10', 'en'), 'OCTOBER 2026');
  assert.equal(nomMes('2027-01', 'ca'), 'GENER 2027');
  assert.equal(nomMes('2026-08', 'es'), 'AGOSTO 2026');
});

test('mapa: files = empreses amb algun llançament, en l’ordre d’empreses.json; columnes de la més vella a la més nova', () => {
  const m = mapaCalor(setmanes(), empreses(), 'ca');
  assert.deepEqual(m.columnes.map((c) => c.week), ['2026-40', '2026-41']);
  assert.deepEqual(m.files.map((f) => f.name), ['OpenAI', 'Anthropic']);  // DeepSeek no és llançament; Other no és fila
  for (const f of m.files) assert.equal(f.caselles.length, 2);
  const [openai, anthropic] = m.files;
  assert.deepEqual(openai.caselles.map((c) => c.n), [1, 0]);
  assert.deepEqual(anthropic.caselles.map((c) => c.n), [0, 1]);
  assert.deepEqual(anthropic.caselles.map((c) => c.idx), [0, 1]);
});

test('mapa: recompte per casella, nivell 0/1/2/3+ i aria-label', () => {
  const ss = [
    S('2026-41', '2026-10-05', '2026-10-11', [L('OpenAI', 'A'), L('OpenAI', 'B'), L('OpenAI', 'C'), L('OpenAI', 'D'), L('Google', 'G'), L('OpenAI', 'no', false)]),
    S('2026-40', '2026-09-28', '2026-10-04', [L('OpenAI', 'E'), L('OpenAI', 'F'), L('Other', 'X')]),
    S('2026-39', '2026-09-21', '2026-09-27', []),
  ];
  const m = mapaCalor(ss, empreses(), 'ca');
  assert.deepEqual(m.files.map((f) => f.name), ['OpenAI', 'Google']);
  const openai = m.files[0].caselles;
  assert.deepEqual(openai.map((c) => [c.n, c.nivell]), [[0, 0], [2, 2], [4, 3]]);
  assert.deepEqual(openai[2].titols, ['A', 'B', 'C', 'D']);
  assert.equal(openai[2].aria, 'OpenAI, setmana 41: 4 llançaments');
  assert.equal(m.files[1].caselles[2].aria, 'Google, setmana 41: 1 llançament');
  assert.equal(openai[0].aria, 'OpenAI, setmana 39: 0 llançaments');
  assert.equal(mapaCalor(ss, empreses(), 'en').files[1].caselles[2].aria, 'Google, week 41: 1 release');
  assert.equal(mapaCalor(ss, empreses(), 'es').files[0].caselles[1].aria, 'OpenAI, semana 40: 2 lanzamientos');
  // El globus: la setmana amb l'any.
  assert.equal(m.columnes[2].etiqueta, 'SETMANA 41 · 5 OCT–11 OCT 2026');
});

test('mapa: els mesos de sota agrupen les columnes pel mes del dijous', () => {
  const ss = [
    S('2026-41', '2026-10-05', '2026-10-11'), S('2026-40', '2026-09-28', '2026-10-04'),
    S('2026-39', '2026-09-21', '2026-09-27'), S('2026-36', '2026-08-31', '2026-09-06'), S('2026-35', '2026-08-24', '2026-08-30'),
  ].map((s) => ({ ...s, items: [L('OpenAI', 'x')] }));
  const m = mapaCalor(ss, empreses(), 'ca');
  assert.deepEqual(m.mesos.map((x) => [x.inici, x.span]), [[0, 1], [1, 2], [3, 2]]);
  assert.match(m.mesos[0].etiqueta, /^AG/);
  assert.match(m.mesos[2].etiqueta, /^OCT/);
});

test('mapa: sense setmanes o sense llançaments no hi ha files', () => {
  assert.deepEqual(mapaCalor([], empreses(), 'ca').files, []);
  const sense = setmanes().map((s) => ({ ...s, items: s.items.map((i) => ({ ...i, is_release: false })) }));
  assert.deepEqual(mapaCalor(sense, empreses(), 'ca').files, []);
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
