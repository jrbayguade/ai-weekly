// src/lib/dades.js -- llegir i validar les dades (data/weeks/*.json).
import fs from 'node:fs';
import path from 'node:path';

export const LANGS = ['ca', 'es', 'en'];
export const CATEGORIES = ['models', 'products', 'money', 'research', 'society'];

export function arrelDades() {
  return path.resolve(process.cwd(), process.env.AI_WEEKLY_DATA ?? 'data');
}

export function setmanes() {
  const dir = path.join(arrelDades(), 'weeks');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}\.json$/.test(f))
    .sort()
    .reverse()
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
}

// La subscripció per correu: l'URL del Worker i la site key PÚBLICA de Turnstile.
// Sense el fitxer (o amb un camp buit), la web no n'ensenya res.
export function subs() {
  const f = path.join(arrelDades(), 'subs.json');
  if (!fs.existsSync(f)) return null;
  const s = JSON.parse(fs.readFileSync(f, 'utf8'));
  return s && typeof s.worker === 'string' && s.worker && typeof s.turnstile === 'string' && s.turnstile ? s : null;
}

export function empreses() {
  return JSON.parse(fs.readFileSync(path.join(arrelDades(), 'empreses.json'), 'utf8'));
}

const tresIdiomes = (o) => o && LANGS.every((l) => typeof o[l] === 'string');

export function errorsSetmana(s) {
  const e = [];
  if (!/^\d{4}-\d{2}$/.test(s.week ?? '')) e.push('week');
  if (s.note !== null && !tresIdiomes(s.note)) e.push('note');
  for (const it of s.items ?? []) {
    if (!CATEGORIES.includes(it.category)) e.push(`${it.id}: category`);
    if (!tresIdiomes(it.title)) e.push(`${it.id}: title`);
    if (!tresIdiomes(it.line)) e.push(`${it.id}: line`);
    if (it.hot !== undefined && typeof it.hot !== 'boolean') e.push(`${it.id}: hot`);
    if (it.rumor !== undefined && typeof it.rumor !== 'boolean') e.push(`${it.id}: rumor`);
    if (it.og !== undefined && !tresIdiomes(it.og)) e.push(`${it.id}: og`);
  }
  return e;
}

// El mes d'una setmana és el del seu DIJOUS (conveni ISO): així cap setmana es parteix entre dos mesos.
export function mesDeSetmana(s) {
  const d = new Date(`${s.from}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 3);
  return d.toISOString().slice(0, 7);
}

// Les setmanes (de la més nova a la més vella) agrupades per mes, del més nou al més vell.
export function agrupaPerMes(ss) {
  const mesos = [];
  for (const s of ss) {
    const mes = mesDeSetmana(s);
    if (mesos.at(-1)?.mes !== mes) mesos.push({ mes, setmanes: [] });
    mesos.at(-1).setmanes.push(s);
  }
  return mesos;
}
