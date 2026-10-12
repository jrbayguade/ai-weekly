// src/pages/og/default.png.js -- la imatge OG per defecte (inici, «com es fa»).
import { pngDefecte } from '../../lib/og.js';
export async function GET() {
  return new Response(await pngDefecte(), { headers: { 'Content-Type': 'image/png' } });
}
