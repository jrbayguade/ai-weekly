// src/lib/og.js -- la imatge OG (opció A v2, docs/superpowers/specs/2026-10-12-ai-weekly-mockups/ai-weekly-og-v2.html).
// Pressupost d'espai FIX, en tres franges: capçalera 92 px, les files dels
// titulars al mig i el peu de 54 px (amb el segell). Res no flota sobre res.
import fs from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { fonts, encaixa, FITXERS } from './og-encaix.js';
import { T, numSetmana, segell } from './i18n.js';

export const AMPLE = 1200;
export const ALT = 630;
const PAD_V = 36;
const PAD_H = 44;
const ALT_CAP = 92;
const ALT_PEU = 54;
const SEPARACIO = 22; // entre franges
export const AMPLE_PEU = AMPLE - 2 * PAD_H; // l'ample útil de capçalera i peu (1112)
const ALT_MIG = ALT - 2 * PAD_V - ALT_CAP - ALT_PEU - 2 * SEPARACIO; // 368
const FILES = 3;
const ENTRE_FILES = 16;
// Alçada FIXA de cada fila (vora inclosa): 3 × 112 + 2 × 16 = 368. Amb menys
// de tres titulars les files no s'estiren: la lletra és la mateixa cada setmana.
export const ALT_FILA = (ALT_MIG - (FILES - 1) * ENTRE_FILES) / FILES;
const VORA = 6;

export const AMPLE_TITOL = 920;
export const ALT_TITOL = 100;

const TEXT_DEFECTE = 'Weekly AI news from 30 newsletters. In català, español & English.';

const h = (type, style, ...children) => ({ type, props: { style, children: children.length === 1 ? children[0] : children } });

let cauSatori;
export const fontsSatori = () => {
  if (!cauSatori) {
    cauSatori = [
      { name: 'Archivo Black', data: fs.readFileSync(FITXERS.display), weight: 400, style: 'normal' },
      { name: 'Inter', data: fs.readFileSync(FITXERS.text), weight: 800, style: 'normal' },
      { name: 'JetBrains Mono', data: fs.readFileSync(FITXERS.mono), weight: 700, style: 'normal' },
    ];
  }
  return cauSatori;
};

async function png(arbre) {
  const svg = await satori(arbre, { width: AMPLE, height: ALT, fonts: fontsSatori() });
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: AMPLE } }).render().asPng());
}

const capcalera = (dreta) => h('div', { display: 'flex', height: ALT_CAP, flexShrink: 0, justifyContent: 'space-between', alignItems: 'center' },
  h('div', { fontFamily: 'Archivo Black', fontSize: 76, letterSpacing: -3, lineHeight: 1 }, 'AI WEEKLY'),
  h('div', { fontFamily: 'Archivo Black', fontSize: 30, background: '#000', color: '#fff35c', padding: '10px 18px', whiteSpace: 'nowrap' }, dreta));

const segellDiv = (text) => h('div', { fontFamily: 'Archivo Black', fontSize: 28, border: '5px solid #000', background: '#ff6b9d',
  padding: '4px 16px', transform: 'rotate(-3deg)', whiteSpace: 'nowrap' }, text);

const peu = (esquerra, dreta) => h('div', { display: 'flex', height: ALT_PEU, flexShrink: 0, marginTop: SEPARACIO,
  justifyContent: esquerra ? 'space-between' : 'flex-end', alignItems: 'center' },
  ...(esquerra ? [h('div', { fontFamily: 'JetBrains Mono', fontSize: 24, background: '#000', color: '#fff35c', padding: '6px 12px', whiteSpace: 'nowrap' }, esquerra)] : []),
  segellDiv(dreta));

const marc = (...fills) => h('div', { width: AMPLE, height: ALT, display: 'flex', flexDirection: 'column',
  background: '#fff35c', color: '#000', padding: `${PAD_V}px ${PAD_H}px`, fontFamily: 'Inter' }, ...fills);

// El mig de la imatge per defecte: la frase, encaixada a la franja (mai en surt).
function migDefecte() {
  const e = encaixa(fonts().display, TEXT_DEFECTE, { ample: AMPLE_PEU, alt: ALT_MIG, max: 64, min: 40, maxLinies: 4 });
  return h('div', { display: 'flex', flexDirection: 'column', justifyContent: 'center', height: ALT_MIG, flexShrink: 0, marginTop: SEPARACIO,
    fontFamily: 'Archivo Black', fontSize: e.mida, lineHeight: 1.05 },
    ...e.linies.map((l) => h('div', { whiteSpace: 'nowrap' }, l)));
}

export async function pngSetmana(s, lang) {
  const t = T[lang];
  const F = fonts();
  const top = s.items.filter((i) => i.og).slice(0, FILES);
  const resta = Math.max(0, s.items.length - top.length);
  const wk = t.setmana(numSetmana(s.week));
  const peuSetmana = peu(t.mes(resta, s.newsletters), segell(lang, s.week));
  // Cap item amb títol curt (p. ex. tots duien l'adreça de l'usuari): la imatge per defecte, amb la capçalera i el peu de la setmana.
  if (!top.length) return png(marc(capcalera(wk), migDefecte(), peuSetmana));

  const files = top.map((i, k) => {
    const e = encaixa(F.text, i.og[lang], { ample: AMPLE_TITOL, alt: ALT_TITOL });
    return h('div', { display: 'flex', height: ALT_FILA, flexShrink: 0, marginTop: k ? ENTRE_FILES : 0, alignItems: 'center',
      background: '#fff', border: `${VORA}px solid #000`, boxShadow: '10px 10px 0 #000', padding: '0 22px 0 18px', overflow: 'hidden' },
      h('div', { fontFamily: 'Archivo Black', fontSize: 46, width: 128, flexShrink: 0 }, `×${i.n}`),
      h('div', { display: 'flex', flexDirection: 'column', fontSize: e.mida, fontWeight: 800, lineHeight: 1.05, width: AMPLE_TITOL, flexShrink: 0 },
        ...e.linies.map((l) => h('div', { whiteSpace: 'nowrap' }, l))));
  });
  return png(marc(
    capcalera(wk),
    // Les files tenen alçada fixa; si n'hi ha menys de tres, el grup es centra a la franja.
    h('div', { display: 'flex', flexDirection: 'column', justifyContent: 'center', height: ALT_MIG, flexShrink: 0,
      marginTop: SEPARACIO, paddingRight: 12 }, ...files),
    peuSetmana,
  ));
}

export async function pngDefecte() {
  return png(marc(capcalera('KEEP UP WITH IT'), migDefecte(), peu(null, 'ZERO HYPE (LIES)')));
}
