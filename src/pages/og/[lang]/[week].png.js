// src/pages/og/[lang]/[week].png.js -- la imatge OG de cada setmana i idioma.
import { setmanes } from '../../../lib/dades.js';
import { LANGS } from '../../../lib/i18n.js';
import { pngSetmana } from '../../../lib/og.js';

export function getStaticPaths() {
  return LANGS.flatMap((lang) => setmanes().map((s) => ({ params: { lang, week: s.week }, props: { s } })));
}
export async function GET({ params, props }) {
  return new Response(await pngSetmana(props.s, params.lang), { headers: { 'Content-Type': 'image/png' } });
}
