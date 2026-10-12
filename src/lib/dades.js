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
    if (it.og !== undefined && !tresIdiomes(it.og)) e.push(`${it.id}: og`);
  }
  return e;
}
