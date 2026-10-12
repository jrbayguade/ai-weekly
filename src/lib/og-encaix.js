// src/lib/og-encaix.js -- mides reals de les fonts de l'OG. Satori no avisa
// d'un glif que falta (surt un quadradet o res): ho comprovem nosaltres.
import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';

// Les fonts surten de node_modules (paquets @fontsource, OFL): mai de la xarxa.
const NM = path.resolve(process.cwd(), 'node_modules/@fontsource');
export const FITXERS = {
  display: path.join(NM, 'archivo-black/files/archivo-black-latin-400-normal.woff'),
  text: path.join(NM, 'inter/files/inter-latin-800-normal.woff'),
  mono: path.join(NM, 'jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff'),
};

let cau;
export function fonts() {
  if (!cau) {
    const carrega = (f) => { const b = fs.readFileSync(f); return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
    cau = { display: carrega(FITXERS.display), text: carrega(FITXERS.text), mono: carrega(FITXERS.mono) };
  }
  return cau;
}

export function glifsQueFalten(font, text) {
  return [...new Set([...text])].filter((c) => !/\s/.test(c) && font.charToGlyphIndex(c) === 0);
}

// Substituts d'un caràcter que la font no tingui (només s'apliquen si falta).
const SUBSTITUTS = {
  '‘': "'", '’': "'", '‚': "'", '‛': "'", '′': "'",
  '“': '"', '”': '"', '„': '"', '″': '"', '«': '"', '»': '"',
  '→': '->', '⇒': '->', '⟶': '->', '←': '<-', '⇐': '<-', '↔': '<->',
  '–': '-', '—': '-', '―': '-', '−': '-', '…': '...',
};

// Les dades REALS poden dur un caràcter que la font no té (un emoji, «→», CJK):
// a la imatge sortiria un quadradet. No fem fallar el build (es quedaria sense
// publicar tota la setmana): el substituïm si hi ha substitut i, si no, el
// traiem. `trets` diu què s'ha tret, per avisar-ne.
export function netejaPerFont(font, text) {
  const te = (c) => /\s/.test(c) || font.charToGlyphIndex(c) !== 0;
  const trets = [];
  let out = '';
  for (const c of String(text)) {
    if (te(c)) { out += c; continue; }
    const sub = SUBSTITUTS[c];
    if (sub && [...sub].every(te)) { out += sub; continue; }
    if (!trets.includes(c)) trets.push(c);
  }
  return { text: out.replace(/\s+/g, ' ').trim(), trets };
}

// Parteix per paraules. Una paraula sola més ampla que `ample` queda sola a
// la seva línia (i sobresurt): és `encaixa` qui ho detecta i ho talla.
export function linies(font, text, mida, ample) {
  const paraules = text.trim().split(/\s+/);
  const out = [];
  let actual = '';
  for (const p of paraules) {
    const prova = actual ? `${actual} ${p}` : p;
    if (font.getAdvanceWidth(prova, mida) <= ample || !actual) actual = prova;
    else { out.push(actual); actual = p; }
  }
  if (actual) out.push(actual);
  return out;
}

// Retalla per la dreta fins que `línia…` hi cap.
function ambPunts(font, linia, mida, ample) {
  let l = linia;
  while (l.length && font.getAdvanceWidth(`${l}…`, mida) > ample) l = [...l].slice(0, -1).join('').trimEnd();
  return `${l}…`;
}

export function encaixa(font, text, { ample, alt, max = 46, min = 30, maxLinies = 2, interlineat = 1.05 }) {
  for (let mida = max; mida >= min; mida--) {
    const l = linies(font, text, mida, ample);
    const capParaulaMassaLlarga = l.every((x) => font.getAdvanceWidth(x, mida) <= ample);
    if (l.length <= maxLinies && l.length * mida * interlineat <= alt && capParaulaMassaLlarga) {
      return { mida, linies: l, tallat: false };
    }
  }
  // No hi cap ni a la mida mínima: a `min`, les primeres `maxLinies` línies, i
  // l'última (o qualsevol que sobresurti, si és una paraula sola) acaba amb «…».
  const totes = linies(font, text, min, ample);
  const l = totes.slice(0, maxLinies).map((x, i, arr) =>
    (i === arr.length - 1 || font.getAdvanceWidth(x, min) > ample ? ambPunts(font, x, min, ample) : x));
  return { mida: min, linies: l, tallat: true };
}
