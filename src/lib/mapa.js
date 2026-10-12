// src/lib/mapa.js -- el mapa de calor «Qui ha tret què»: empresa × setmana (pur).
import { T, numSetmana, rangSetmana, dataCurta } from './i18n.js';
import { mesDeSetmana } from './dades.js';

export function mapaCalor(setmanes, empreses, lang) {
  const t = T[lang];
  const asc = [...setmanes].sort((a, b) => a.week.localeCompare(b.week));
  const columnes = asc.map((s, idx) => ({
    week: s.week, idx, etiqueta: `${t.setmana(numSetmana(s.week))} · ${rangSetmana(s.from, s.to, lang)}`,
  }));
  const files = empreses.map((e) => ({
    name: e.name,
    caselles: asc.map((s, idx) => {
      const titols = s.items.filter((i) => i.is_release && i.company === e.name).map((i) => i.title[lang]);
      const n = titols.length;
      return { week: s.week, idx, n, nivell: Math.min(n, 3), titols, aria: t.ariaCasella(e.name, numSetmana(s.week), n) };
    }),
  })).filter((f) => f.caselles.some((c) => c.n > 0));
  // Les etiquetes de sota: una per mes (el del dijous), sobre les columnes que hi pertanyen.
  const mesos = [];
  asc.forEach((s, idx) => {
    const mes = mesDeSetmana(s);
    if (mesos.at(-1)?.mes === mes) mesos.at(-1).span += 1;
    else mesos.push({ mes, inici: idx, span: 1, etiqueta: dataCurta(`${mes}-15`, lang).replace(/^\d+\s*/, '') });
  });
  return { columnes, files, mesos: mesos.map(({ mes, ...m }) => m) };
}
