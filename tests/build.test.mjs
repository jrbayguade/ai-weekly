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
const llegeixHot = construeix(path.join(arrel, 'tests/fixtures/data-hot'), 'hot');
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

test('les caselles del mapa d’una altra setmana enllacen a la seva permanent; les de la pròpia, a la setmana', () => {
  const html = llegeix('en/week/2026-40/index.html');
  hi(html, /<a class="casella[^"]*" href="\/ai-weekly\/en\/week\/2026-41\/"[^>]*data-week="2026-41"/);
  hi(html, /<a class="casella[^"]*" href="#s-2026-40"[^>]*data-week="2026-40"/);
  no(html, /class="punt"/);
});

test('mapa de calor: una casella per empresa × setmana, amb nivell i aria-label; a la portada, cap a la setmana', () => {
  const html = llegeix('ca/index.html');
  hi(html, /<section class="caixa mapa"/);
  const caselles = html.match(/<a class="casella[^>]*>/g) ?? [];
  assert.equal(caselles.length, 2 * 2);  // OpenAI i Anthropic × 2026-40 i 2026-41
  hi(html, /<a class="casella n1" href="#s-2026-40" aria-label="OpenAI, setmana 40: 1 llançament"/);
  hi(html, /<a class="casella n0" href="#s-2026-41" aria-label="OpenAI, setmana 41: 0 llançaments"/);
  // El globus llegeix la setmana i els títols de data-*; mai HTML.
  hi(html, /data-t="SETMANA 40 · 28 SET–4 OCT 2026" data-ts="\[&#34;OpenAI presenta Sora 3&#34;\]"/);
  // La llegenda: només els quadradets de l'escala.
  hi(html, /<div class="llegenda"[^>]*>(?:(?!<\/div>)[\s\S])*>0<(?:(?!<\/div>)[\s\S])*>3\+</);
  // La cronologia de punts ja no hi és.
  no(html, /class="(punt|carril|pista|eix)"/);
});

test('la portada continua amb totes les setmanes senceres', () => {
  for (const l of ['ca', 'es', 'en']) {
    const html = llegeix(`${l}/index.html`);
    assert.equal(compta(html, /class="cos"/g), 2, l);
    no(html, /setmana-resum/);
  }
});

test('resum d’una setmana: només la setmana i el títol de la principal, sense «novetats» ni «top:»', () => {
  const top = { ca: 'OpenAI presenta Sora 3', es: 'OpenAI presenta Sora 3', en: 'OpenAI unveils Sora 3' };
  for (const [pag, l] of [['ca/index.html', 'ca'], ['es/index.html', 'es'], ['en/index.html', 'en'], ['ca/setmana/2026-41/index.html', 'ca']]) {
    const html = llegeix(pag);
    no(html, /top:/i);
    no(html, /novetat|novedad|stories/);
    const teases = html.match(/<span class="tease">[^<]*<\/span>/g) ?? [];
    assert.ok(teases.includes(`<span class="tease">${top[l]}</span>`), `${pag}: ${teases}`);
  }
});

test('agrupació per mes: a la portada, el mes més nou obert; a la permanent, el de la setmana', () => {
  // Les dades de mostra són d'octubre; s'hi afegeix una setmana que comença a l'agost però és de SETEMBRE (dijous 3).
  const dades = path.join(tmp, 'dades-mesos');
  fs.cpSync(path.join(arrel, 'tests/fixtures/data'), dades, { recursive: true });
  const s40 = JSON.parse(fs.readFileSync(path.join(dades, 'weeks/2026-40.json'), 'utf8'));
  const s36 = { ...s40, week: '2026-36', from: '2026-08-31', to: '2026-09-06',
    items: s40.items.map((i) => ({ ...i, id: i.id.replace('2026-40', '2026-36') })) };
  fs.writeFileSync(path.join(dades, 'weeks/2026-36.json'), JSON.stringify(s36));
  const mesos = construeix(dades, 'mesos');
  const mesosDe = (html) => (html.match(/<details class="mes"[^>]*>/g) ?? []);
  const portada = mesos('ca/index.html');
  assert.deepEqual(mesosDe(portada).map((d) => [/data-mes="([^"]+)"/.exec(d)[1], / open/.test(d)]),
    [['2026-10', true], ['2026-09', false]]);
  hi(portada, /<span class="mes-nom">OCTUBRE 2026<\/span>/);
  hi(portada, /<span class="mes-nom">SETEMBRE 2026<\/span>/);
  hi(mesos('en/index.html'), /<span class="mes-nom">OCTOBER 2026<\/span>/);
  hi(mesos('es/index.html'), /<span class="mes-nom">SEPTIEMBRE 2026<\/span>/);
  // La capçalera de mes no porta cap comptador de setmanes (ni a la portada ni a la permanent).
  assert.doesNotMatch(portada, /class="mes-n"/);
  assert.doesNotMatch(mesos('ca/setmana/2026-36/index.html'), /class="mes-n"/);
  // Només la setmana més nova oberta.
  assert.deepEqual((portada.match(/<details class="setmana"[^>]*>/g) ?? []).map((d) => / open/.test(d)), [true, false, false]);
  // La setmana 36 és dins del mes de setembre, encara que comenci a l'agost.
  hi(portada, /<details class="mes" data-mes="2026-09"(?:(?!<details class="mes")[\s\S])*id="s-2026-36"/);
  const perm = mesos('ca/setmana/2026-36/index.html');
  assert.deepEqual(mesosDe(perm).map((d) => / open/.test(d)), [false, true]);
  // El mapa: tres columnes i dos mesos a sota.
  assert.equal((portada.match(/<a class="casella/g) ?? []).length, 2 * 3);
  assert.equal((portada.match(/<span class="mes-mapa"/g) ?? []).length, 2);
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
  // Sense setmanes, l'OG torna a ser el per defecte (arrel i portades).
  for (const rel of ['index.html', 'ca/index.html', 'es/index.html', 'en/index.html']) {
    hi(buida(rel), /<meta property="og:image" content="https:\/\/[^"]*\/og\/default\.png"/);
  }
});

test('les portades i l’arrel porten l’OG de la darrera setmana (arrel: en anglès)', () => {
  for (const l of ['ca', 'es', 'en']) {
    const html = llegeix(`${l}/index.html`);
    hi(html, new RegExp(`<meta property="og:image" content="https://[^"]*/og/${l}/2026-41\.png"`));
    hi(html, new RegExp(`<meta name="twitter:image" content="https://[^"]*/og/${l}/2026-41\.png"`));
    hi(html, /<meta property="og:title" content="AI Weekly · [^"]*41[^"]*"/);
    hi(html, /<meta property="og:image:width" content="1200"/);
    no(html, /og\/default\.png/);
  }
  const arrelHtml = llegeix('index.html');
  hi(arrelHtml, /<meta property="og:image" content="https:\/\/[^"]*\/og\/en\/2026-41\.png"/);
  hi(arrelHtml, /<meta name="twitter:image" content="https:\/\/[^"]*\/og\/en\/2026-41\.png"/);
  hi(arrelHtml, /og:image:width/);
  hi(arrelHtml, /location\.replace/);
  hi(arrelHtml, /hreflang="x-default"/);
  no(arrelHtml, /og\/default\.png/);
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
  for (const e of ['🔥', '🚀']) {
    assert.ok(html.includes(`<span aria-hidden="true">${e}</span>`), `${e} amagat`);
    assert.equal(html.split(e).length - 1, compta(html, new RegExp(`<span aria-hidden="true">${e}</span>`, 'g')), `${e} sempre amagat`);
  }
  const filtre = fs.readFileSync(path.join(arrel, 'public/filtre.js'), 'utf8');
  assert.match(filtre, /aria-pressed/);
});

test('el recompte «×N» no es mostra enlloc: només el 🔥 (amagat al lector) amb el seu text accessible', () => {
  for (const pag of ['en/index.html', 'ca/index.html', 'es/index.html', 'en/week/2026-41/index.html', 'ca/week/2026-41/index.html']) {
    let html; try { html = llegeix(pag); } catch { continue; }
    no(html, /×\s*\d/);
  }
  // La flama va a l'esquerra, just abans del títol; l'etiqueta d'empresa és sempre l'última de la fila.
  const html = llegeix('en/week/2026-41/index.html');
  hi(html, /<div class="tx"><span class="calent"><span aria-hidden="true">🔥<\/span><span class="sr-only">hot topic<\/span><\/span> <a href="https:\/\/example.com\/opus"/);
  no(html, /class="n"/);
  const files = html.match(/<li class="item"[\s\S]*?<\/li>/g) ?? [];
  assert.ok(files.length >= 3);
  for (const li of files) {
    if (/data-co="Other"/.test(li)) continue;
    assert.match(li, /<span class="co">[^<]+<\/span><\/li>$/, li);
  }
});

test('«Com es fa» ja no explica el «×N»', async () => {
  const { T, LANGS } = await import('../src/lib/i18n.js');
  for (const l of LANGS) {
    assert.ok(!T[l].aboutText.join(' ').includes('×'), l);
    assert.ok(T[l].aboutText.join(' ').includes('🔥'), l);
  }
});

test('«Com es fa»: les bromes són meves, i un enllaç per tornar a les setmanes', async () => {
  const { T } = await import('../src/lib/i18n.js');
  assert.match(T.ca.aboutText.join(' '), /Les bromes són meves/);
  assert.match(T.es.aboutText.join(' '), /Los chistes son míos/);
  assert.match(T.en.aboutText.join(' '), /The jokes are mine/);
  hi(llegeix('ca/com-es-fa/index.html'), /<a class="tornar" href="\/ai-weekly\/ca\/">← Tornar a les setmanes<\/a>/);
  hi(llegeix('es/como-se-hace/index.html'), /<a class="tornar" href="\/ai-weekly\/es\/">← Volver a las semanas<\/a>/);
  hi(llegeix('en/how-its-made/index.html'), /<a class="tornar" href="\/ai-weekly\/en\/">← Back to the weeks<\/a>/);
});

test('el logo enllaça a la portada de l’idioma a totes les pàgines', () => {
  for (const [rel, l] of [['ca/index.html', 'ca'], ['es/semana/2026-40/index.html', 'es'], ['en/how-its-made/index.html', 'en']]) {
    hi(llegeix(rel), new RegExp(`class="logo"><a href="/ai-weekly/${l}/">AI<br>WEEKLY</a>`));
  }
});

test('feedback per GitHub Issues: «Suggeriments» al peu de tot arreu i «Alguna cosa no quadra?» a cada setmana oberta', () => {
  const ISSUES = 'https://github.com/jrbayguade/ai-weekly/issues';
  for (const [rel, txt] of [['ca/index.html', 'Suggeriments'], ['es/semana/2026-40/index.html', 'Sugerencias'], ['en/how-its-made/index.html', 'Feedback']]) {
    const html = llegeix(rel);
    hi(html, new RegExp(`<footer class="peu">[\\s\\S]*<a href="${ISSUES}/new/choose">${txt}</a>`));
    no(html.split('https://www.linkedin.com/in/jboschayguade/').join(''), /mailto:|@gmail|jbosc/);
  }
  const html = llegeix('ca/index.html');
  // Una per setmana amb cos (dues a la portada), amb la plantilla i el títol preomplert.
  const enllacos = html.match(/<a class="no-quadra"[^>]*>[^<]*<\/a>/g) ?? [];
  assert.equal(enllacos.length, 2);
  assert.ok(enllacos[0].includes(`href="${ISSUES}/new?template=feedback.yml&title=Setmana%2041%20(2026-41)&setmana=2026-41"`), enllacos[0]);
  assert.ok(enllacos[0].endsWith('>Alguna cosa no quadra?</a>'));
  hi(llegeix('en/week/2026-40/index.html'), /<a class="no-quadra" href="[^"]*title=Week%2040%20\(2026-40\)[^"]*"[^>]*>Something off\?<\/a>/);
  // La permanent només en porta una: la de la setmana amb cos.
  assert.equal((llegeix('en/week/2026-40/index.html').match(/class="no-quadra"/g) ?? []).length, 1);
});

test('el formulari d’issue: tres camps i el desplegable de tipus; issues en blanc permesos', () => {
  const f = fs.readFileSync(path.join(arrel, '.github/ISSUE_TEMPLATE/feedback.yml'), 'utf8');
  for (const x of ['id: setmana', 'id: que', 'id: tipus', 'type: dropdown', 'type: textarea', 'type: input']) assert.ok(f.includes(x), x);
  const c = fs.readFileSync(path.join(arrel, '.github/ISSUE_TEMPLATE/config.yml'), 'utf8');
  assert.match(c, /blank_issues_enabled: true/);
});

const LINKEDIN = 'https://www.linkedin.com/in/jboschayguade/';


test('autoria: «Jesús Bosch» enllaçat a LinkedIn al peu de totes les pàgines, i a «Com es fa»', async () => {
  const { T } = await import('../src/lib/i18n.js');
  const enllac = `<a href="${LINKEDIN}" rel="me noopener" target="_blank">Jesús Bosch</a>`;
  for (const rel of ['ca/index.html', 'es/index.html', 'en/index.html', 'ca/setmana/2026-40/index.html', 'en/week/2026-40/index.html', 'ca/com-es-fa/index.html', 'es/como-se-hace/index.html', 'en/how-its-made/index.html']) {
    const html = llegeix(rel);
    hi(html, /<footer class="peu">[\s\S]*<\/footer>/);
    assert.ok(html.match(/<footer class="peu">[\s\S]*<\/footer>/)[0].includes(enllac), `peu ${rel}`);
  }
  hi(llegeix('ca/com-es-fa/index.html'), new RegExp(`Fet per ${enllac.replace(/[.*+?^${}()|[\]\/]/g, '\$&')}`));
  hi(llegeix('es/como-se-hace/index.html'), /Hecho por <a href="https:\/\/www\.linkedin\.com\/in\/jboschayguade\/"/);
  hi(llegeix('en/how-its-made/index.html'), /Made by <a href="https:\/\/www\.linkedin\.com\/in\/jboschayguade\/"/);
  // Cap altra mostra de nom o contacte: tret d'aquesta URL exacta, res de jbosc, mailto ni gmail.
  for (const rel of ['ca/index.html', 'ca/com-es-fa/index.html']) {
    no(llegeix(rel).split(LINKEDIN).join(''), /mailto:|@gmail|jbosc/);
  }
  assert.ok(T.ca.autoria && T.es.autoria && T.en.autoria);
});

test('🔥: el booleà hot mana si hi és; si no, el llindar d’n; un rumor no en porta mai', () => {
  const html = llegeixHot('en/week/2026-42/index.html');
  const li = (id) => html.match(new RegExp(`<li class="item"[^>]*id="${id}".*?</li>`, 's'))[0];
  hi(li('2026-42-01'), /class="calent"/);      // n=1 però hot
  no(li('2026-42-02'), /class="calent"/);      // n=7 però hot:false
  no(li('2026-42-03'), /class="calent"/);      // hot + rumor: res de flama
  no(li('2026-42-04'), /class="calent"/);
  // Dades velles (sense hot): la regla d'abans.
  hi(llegeix('en/week/2026-41/index.html'), /class="calent"/);
});

test('rumor: etiqueta discreta «no confirmat» al costat del títol, en els tres idiomes', () => {
  for (const [rel, txt] of [['ca/setmana/2026-42/index.html', 'no confirmat'], ['es/semana/2026-42/index.html', 'no confirmado'], ['en/week/2026-42/index.html', 'unconfirmed']]) {
    const html = llegeixHot(rel);
    assert.equal(compta(html, /class="rumor"/g), 2, rel);
    hi(html, new RegExp(`<span class="rumor">${txt}</span>`));
  }
  const li = llegeixHot('en/week/2026-42/index.html').match(/<li class="item"[^>]*id="2026-42-03"[\s\S]*?<\/li>/)[0];
  hi(li, /<a [^>]*>Google is preparing Gemini 4<\/a> <span class="rumor">unconfirmed<\/span>/);
  no(llegeix('en/week/2026-41/index.html'), /class="rumor"/);
});

test('filtre per categoria: cinc botons amb aria-pressed, i els resums porten els parells empresa-categoria', () => {
  for (const [rel, txt] of [['ca/index.html', 'MODELS'], ['es/index.html', 'MODELOS'], ['en/index.html', 'MODELS']]) {
    const html = llegeix(rel);
    const botons = html.match(/<button class="cat-btn"[^>]*>[^<]*<\/button>/g) ?? [];
    assert.equal(botons.length, 5, rel);
    for (const b of botons) assert.match(b, /aria-pressed="false"/);
    assert.ok(botons[0].includes('data-cat="models"') && botons[0].includes(`>${txt}<`), botons[0]);
  }
  const resum = llegeix('en/week/2026-40/index.html').match(/<a[^>]*class="setmana setmana-resum"[^>]*>/)[0];
  assert.match(resum, /data-pars="[^"]*Anthropic~models/);
  const filtre = fs.readFileSync(path.join(arrel, 'public/filtre.js'), 'utf8');
  assert.match(filtre, /cat-btn/);
  assert.match(filtre, /estat\.cat|cat:/);
});

test('«Com es fa» ampliat: newsletters, cadència, mapa, 🔥, no confirmat i autoria', async () => {
  const { T, LANGS } = await import('../src/lib/i18n.js');
  for (const l of LANGS) {
    const t = T[l].aboutText.join(' ');
    for (const x of ['The Neuron', 'The Deep View', 'TLDR AI', 'Towards Data Science', 'AI Adopters Club', '🔥', '5']) assert.ok(t.includes(x), `${l}: ${x}`);
    assert.match(t, new RegExp(l === 'ca' ? 'diumenge' : l === 'es' ? 'domingo' : 'Sunday'));
    assert.match(t, new RegExp(l === 'ca' ? 'no confirmat' : l === 'es' ? 'no confirmado' : 'unconfirmed', 'i'));
    assert.ok(t.includes('3'), l);
    assert.ok(!t.includes('×'), l);
  }
});

test('favicon: el robot SVG és a dist i l’enllacen l’arrel, la portada, una setmana i «Com es fa», amb el base /ai-weekly', () => {
  const svg = llegeix('favicon.svg');
  hi(svg, /<svg[^>]*width="64"[^>]*height="64"/);
  hi(svg, /fill="#fff35c"/);
  hi(svg, /<text[^>]*>🤖<\/text>/);
  const LINK = /<link rel="icon" type="image\/svg\+xml" href="\/ai-weekly\/favicon\.svg"\s*\/?>/;
  for (const pag of ['index.html', 'ca/index.html', 'en/week/2026-40/index.html', 'ca/com-es-fa/index.html']) {
    hi(llegeix(pag), LINK);
  }
});
