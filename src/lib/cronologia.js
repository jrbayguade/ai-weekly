// src/lib/cronologia.js -- la geometria de «Qui ha tret què» (pur).
import { dataCurta } from './i18n.js';

const dia = (iso) => Date.parse(`${iso}T12:00:00Z`);

export function cronologia(setmanes, empreses, lang) {
  const asc = [...setmanes].sort((a, b) => a.week.localeCompare(b.week));
  if (!asc.length) return { setmanesAsc: [], carrils: [], mesos: [] };
  const t0 = dia(asc[0].from), t1 = dia(asc.at(-1).to);
  const pct = (iso) => (t1 === t0 ? 50 : Math.min(100, Math.max(0, ((dia(iso) - t0) / (t1 - t0)) * 100)));
  const idx = Object.fromEntries(asc.map((s, i) => [s.week, i]));
  const carrils = empreses.map((e) => ({
    name: e.name,
    punts: asc.flatMap((s) => s.items
      .filter((i) => i.is_release && i.company === e.name)
      .map((i) => ({ week: s.week, idx: idx[s.week], x: pct(i.date || s.from), r: 6 + Math.min(i.n, 16) / 2,
                     title: i.title[lang], date: i.date, id: i.id }))),
  })).filter((k) => k.punts.length);
  const mesos = [];
  const d = new Date(t0); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + 1);
  while (d.getTime() <= t1) {
    mesos.push({ x: pct(d.toISOString().slice(0, 10)), etiqueta: dataCurta(d.toISOString().slice(0, 10), lang).replace(/^\d+\s*/, '') });
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return { setmanesAsc: asc.map((s) => s.week), carrils, mesos };
}
