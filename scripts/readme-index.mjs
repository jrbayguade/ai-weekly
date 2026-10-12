// Regenera l'índex de setmanes del README. Només en local (`npm run index`):
// Actions no pot fer commit i la canonada no el necessita.
import fs from 'node:fs';
import { setmanes } from '../src/lib/dades.js';

const linies = setmanes().map(
  (s) =>
    `- [${s.week} · ${s.from} – ${s.to}](https://jrbayguade.github.io/ai-weekly/ca/setmana/${s.week}/) — ${s.items[0]?.title.en ?? ''}`,
);
const cos = linies.length ? `${linies.join('\n')}\n` : '';
const r = fs.readFileSync('README.md', 'utf8');
if (!/<!-- index -->[\s\S]*<!-- \/index -->/.test(r)) {
  throw new Error('README.md no té els marcadors <!-- index --> / <!-- /index -->');
}
fs.writeFileSync(
  'README.md',
  r.replace(/<!-- index -->[\s\S]*<!-- \/index -->/, () => `<!-- index -->\n${cos}<!-- /index -->`),
);
