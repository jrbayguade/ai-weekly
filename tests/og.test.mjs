// tests/og.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.AI_WEEKLY_DATA = 'tests/fixtures/data';
const { fonts, encaixa, linies, glifsQueFalten, pngSetmana, pngDefecte, fontsSatori, AMPLE_TITOL, ALT_TITOL, ALT_FILA,
  AMPLE_PEU, textPeu, netejaPerFont, titolsOg } = await import('../src/lib/og-encaix.js')
  .then(async (m) => ({ ...m, ...(await import('../src/lib/og.js')) }));
const { setmanes } = await import('../src/lib/dades.js');
const { T, LANGS } = await import('../src/lib/i18n.js');

const F = fonts();

const midesPng = (png) => [png.readUInt32BE(16), png.readUInt32BE(20)];
const esPng = (png) => png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

test('un titular curt hi cap a 46 px en una línia', () => {
  const r = encaixa(F.text, 'Claude Opus 5.5 ja és aquí', { ample: AMPLE_TITOL, alt: ALT_TITOL });
  assert.equal(r.mida, 46); assert.equal(r.linies.length, 1); assert.equal(r.tallat, false);
});

test('un titular llarg baixa de mida i mai passa de dues línies ni de l’ample', () => {
  const llarg = 'L’Agència Espanyola de Supervisió de la IA multa una empresa per primera vegada a la història';
  const r = encaixa(F.text, llarg, { ample: AMPLE_TITOL, alt: ALT_TITOL });
  assert.ok(r.linies.length <= 2);
  for (const l of r.linies) assert.ok(F.text.getAdvanceWidth(l, r.mida) <= AMPLE_TITOL);
});

test('un text impossible es talla amb «…»', () => {
  const r = encaixa(F.text, 'paraula '.repeat(60), { ample: AMPLE_TITOL, alt: ALT_TITOL });
  assert.equal(r.tallat, true); assert.equal(r.mida, 30); assert.ok(r.linies.at(-1).endsWith('…'));
  for (const l of r.linies) assert.ok(F.text.getAdvanceWidth(l, r.mida) <= AMPLE_TITOL);
});

test('una sola paraula més ampla que la caixa es talla dins l’ample', () => {
  const r = encaixa(F.text, 'Supercal·lifragilísticexpialidòcicament'.repeat(3), { ample: AMPLE_TITOL, alt: ALT_TITOL });
  assert.equal(r.tallat, true);
  for (const l of r.linies) assert.ok(F.text.getAdvanceWidth(l, r.mida) <= AMPLE_TITOL);
});

test('linies parteix per paraules i cap línia de més d’una paraula passa de l’ample', () => {
  const l = linies(F.text, 'u dos tres quatre cinc sis set vuit nou deu onze dotze tretze', 40, 300);
  assert.ok(l.length > 1);
  for (const x of l) if (x.includes(' ')) assert.ok(F.text.getAdvanceWidth(x, 40) <= 300);
});

test('les dues línies de 46 px caben dins la fila (el pressupost de franges)', () => {
  assert.ok(2 * 46 * 1.05 <= ALT_TITOL);
  assert.ok(ALT_TITOL <= ALT_FILA - 2 * 6, 'el titular no pot ser més alt que l’interior de la fila');
});

test('les fonts de l’OG tenen tots els caràcters (català, espanyol)', () => {
  assert.deepEqual(glifsQueFalten(F.text, 'L·LÚGUBRE ÇÀÑ ¿¡ àèéíòóúïü l·l €$×'), []);
  assert.deepEqual(glifsQueFalten(F.display, 'AI WEEKLY SETMANA SEMANA WEEK KEEP UP WITH IT 0123456789 ×ÇÀÉ'), []);
  for (const l of LANGS) for (const s of T[l].segells) assert.deepEqual(glifsQueFalten(F.display, s), [], s);
  for (const l of LANGS) assert.deepEqual(glifsQueFalten(F.mono, T[l].mes(28, 30)), [], l);
  assert.deepEqual(glifsQueFalten(F.display, 'Weekly AI news from 30 newsletters. In català, español & English.'), []);
});

test('glifsQueFalten detecta un caràcter que la font no té', () => {
  assert.deepEqual(glifsQueFalten(F.text, 'hola 漢'), ['漢']);
});

test('el peu sense resta no diu «+0»: només el nombre de newsletters', () => {
  assert.equal(textPeu('ca', 0, 30), 'de 30 newsletters');
  assert.equal(textPeu('es', 0, 30), 'de 30 newsletters');
  assert.equal(textPeu('en', 0, 30), 'from 30 newsletters');
  for (const l of LANGS) assert.equal(textPeu(l, 5, 30), T[l].mes(5, 30));
});

test('el peu hi cap: «+N més» (o només el total) i el segell més llarg no se superposen', () => {
  for (const l of LANGS) for (const peu of [textPeu(l, 40, 31), textPeu(l, 0, 31), textPeu(l, 999, 999)]) {
    assert.deepEqual(glifsQueFalten(F.mono, peu), [], peu);
    for (const s of T[l].segells) {
      const mes = F.mono.getAdvanceWidth(peu, 24) + 24;
      const seg = F.display.getAdvanceWidth(s, 28) + 32 + 10;
      assert.ok(mes + seg + 40 <= AMPLE_PEU, `${l}: ${peu} + ${s}`);
    }
  }
});

// Una font de mentida: només té els caràcters que se li diuen.
const fontAmb = (cars) => ({ charToGlyphIndex: (c) => (cars.includes(c) ? 1 : 0) });

test('netejaPerFont: substitucions deterministes només si falta el glif', () => {
  const sense = fontAmb('abc <->\'".');
  assert.deepEqual(netejaPerFont(sense, '‘a’ “b” c → a ← b – c — a… b'),
    { text: '\'a\' "b" c -> a <- b - c - a... b', trets: [] });
  const amb = fontAmb('abc ‘’“”→–—…');
  assert.deepEqual(netejaPerFont(amb, '‘a’ “b” → – — …'), { text: '‘a’ “b” → – — …', trets: [] });
});

test('netejaPerFont: el que no té glif ni substitut es treu, sense espais dobles', () => {
  const r = netejaPerFont(F.text, 'Claude 🚀 arriba 漢字 → ja');
  assert.equal(r.text, 'Claude arriba -> ja');
  assert.deepEqual(r.trets, ['🚀', '漢', '字']);
  assert.deepEqual(glifsQueFalten(F.text, r.text), []);
  assert.deepEqual(netejaPerFont(F.text, 'L·LÚGUBRE ÇÀÑ ¿¡ €'), { text: 'L·LÚGUBRE ÇÀÑ ¿¡ €', trets: [] });
});

test('titolsOg: els títols surten nets i encaixats (cap glif que falti arriba a la imatge)', () => {
  const s = { week: '2026-41', newsletters: 30, items: [{ n: 3, og: { ca: 'Nou model 🤖 → més ràpid', es: 'x', en: 'x' } }] };
  const [t] = titolsOg(s, 'ca');
  assert.deepEqual(t.linies, ['Nou model -> més ràpid']);
  assert.deepEqual(t.trets, ['🤖']);
});

test('dades REALS (data/): cada caràcter tret i cada títol curt tallat de l’OG s’avisa (passa si no n’hi ha)', () => {
  const abans = process.env.AI_WEEKLY_DATA;
  delete process.env.AI_WEEKLY_DATA;
  try {
    for (const s of setmanes()) for (const l of LANGS) for (const t of titolsOg(s, l)) {
      for (const c of t.trets) console.warn(`AVÍS: ${s.week} ${l} «${c}» (U+${c.codePointAt(0).toString(16).toUpperCase()}) tret de l’OG`);
      if (t.tallat) console.warn(`AVÍS: ${s.week} ${l} «${t.linies.join(' ')}» s'ha tallat a l’OG: refer el títol curt`);
      assert.deepEqual(glifsQueFalten(F.text, t.linies.join(' ')), [], `${s.week} ${l}`);
    }
  } finally {
    process.env.AI_WEEKLY_DATA = abans;
  }
});

test('la capçalera hi cap: logo i etiqueta de setmana', () => {
  for (const l of LANGS) {
    const logo = F.display.getAdvanceWidth('AI WEEKLY', 76) - 3 * 8;
    const wk = F.display.getAdvanceWidth(T[l].setmana(53), 30) + 36;
    assert.ok(logo + wk + 40 <= AMPLE_PEU, l);
  }
});

test('totes les setmanes: glifs i encaix dels títols curts (avís si es talla)', () => {
  for (const s of setmanes()) for (const l of LANGS) for (const it of s.items.filter((i) => i.og)) {
    assert.deepEqual(glifsQueFalten(F.text, it.og[l]), [], `${s.week} ${l}`);
    const r = encaixa(F.text, it.og[l], { ample: AMPLE_TITOL, alt: ALT_TITOL });
    if (r.tallat) console.warn(`AVÍS: ${s.week} ${l} «${it.og[l]}» s'ha tallat: refer el títol curt`);
  }
});

test('fontsSatori dona les tres famílies', () => {
  assert.deepEqual(fontsSatori().map((f) => f.name), ['Archivo Black', 'Inter', 'JetBrains Mono']);
});

test('genera un PNG de 1200×630', async () => {
  const png = await pngSetmana(setmanes()[0], 'ca');
  assert.ok(esPng(png)); assert.deepEqual(midesPng(png), [1200, 630]);
});

test('una setmana amb un sol item amb og també dona un PNG de 1200×630', async () => {
  const s = setmanes()[0];
  const una = { ...s, items: [s.items[0], ...s.items.slice(1).map(({ og, ...r }) => r)] };
  for (const l of LANGS) { const png = await pngSetmana(una, l); assert.ok(esPng(png)); assert.deepEqual(midesPng(png), [1200, 630]); }
});

test('una setmana sense cap og cau al contingut per defecte, i és un PNG de 1200×630', async () => {
  const s = setmanes()[0];
  const cap = { ...s, items: s.items.map(({ og, ...r }) => r) };
  for (const l of LANGS) { const png = await pngSetmana(cap, l); assert.ok(esPng(png)); assert.deepEqual(midesPng(png), [1200, 630]); }
});

test('la imatge per defecte és un PNG de 1200×630', async () => {
  const png = await pngDefecte();
  assert.ok(esPng(png)); assert.deepEqual(midesPng(png), [1200, 630]);
});

test('AMPLE_TITOL surt de la caixa fixa de la fila, i el titular més llarg hi cap línia a línia', () => {
  assert.equal(AMPLE_TITOL, 1048);
  for (const s of setmanes()) for (const l of LANGS) for (const t of titolsOg(s, l)) {
    for (const ln of t.linies) assert.ok(F.text.getAdvanceWidth(ln, t.mida) <= AMPLE_TITOL, `${s.week} ${l}`);
  }
});
