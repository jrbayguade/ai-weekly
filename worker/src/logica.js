// worker/src/logica.js -- la subscripció a AI Weekly: doble confirmació SENSE estat
// (l'enllaç porta, signat, el correu, l'idioma i la caducitat) i el contacte a Resend.
// Aquí no hi ha cap secret: arriben per `env` (wrangler secret put).
export const LANGS = ['ca', 'es', 'en'];
export const PAG_CONFIRMAT = { ca: 'confirmat', es: 'confirmado', en: 'confirmed' };
const TTL_MS = 48 * 3600 * 1000;
const RESEND = 'https://api.resend.com';
const enc = new TextEncoder();

const b64u = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deB64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
const clau = (secret) => crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

export const esCorreu = (e) => typeof e === 'string' && e.length <= 254
  && /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:.]{2,}$/.test(e);

export async function signa(dades, secret) {
  const p = b64u(enc.encode(JSON.stringify(dades)));
  const f = new Uint8Array(await crypto.subtle.sign('HMAC', await clau(secret), enc.encode(p)));
  return `${p}.${b64u(f)}`;
}

export async function verifica(token, secret, ara) {
  if (typeof token !== 'string' || token.length > 2000) return { error: 'invalid' };
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { error: 'invalid' };
  let d;
  try {
    // crypto.subtle.verify compara en temps constant
    if (!(await crypto.subtle.verify('HMAC', await clau(secret), deB64u(parts[1]), enc.encode(parts[0])))) return { error: 'invalid' };
    d = JSON.parse(new TextDecoder().decode(deB64u(parts[0])));
  } catch {
    return { error: 'invalid' };
  }
  if (!LANGS.includes(d?.l) || !esCorreu(d?.e) || typeof d?.x !== 'number') return { error: 'invalid' };
  if (ara > d.x) return { error: 'caducat', lang: d.l };
  return { email: d.e, lang: d.l };
}

const cors = (env) => ({ 'Access-Control-Allow-Origin': env.ORIGEN, Vary: 'Origin' });
const json = (status, env) => new Response(status === 202 ? '{}' : null,
  { status, headers: { ...cors(env), 'Content-Type': 'application/json' } });

export function preflight(req, env) {
  if (req.headers.get('Origin') !== env.ORIGEN) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: { ...cors(env), 'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } });
}

const CONFIRMACIO = {
  ca: { assumpte: 'Confirma la subscripció a AI Weekly', cos: 'Clica per rebre AI Weekly cada dilluns:', peu: 'Si no has estat tu, ignora aquest correu.' },
  es: { assumpte: 'Confirma la suscripción a AI Weekly', cos: 'Haz clic para recibir AI Weekly cada lunes:', peu: 'Si no has sido tú, ignora este correo.' },
  en: { assumpte: 'Confirm your AI Weekly subscription', cos: 'Click to get AI Weekly every Monday:', peu: "If this wasn't you, ignore this email." },
};

const resend = (f, clauApi, metode, ruta, cos) => f(`${RESEND}${ruta}`, { method: metode,
  headers: { Authorization: `Bearer ${clauApi}`, 'Content-Type': 'application/json' },
  body: cos === undefined ? undefined : JSON.stringify(cos) });

export async function subscriu(req, env, { fetch: f = fetch, ara = Date.now() } = {}) {
  if (req.headers.get('Origin') !== env.ORIGEN) return json(403, env);
  let cos;
  try { cos = await req.json(); } catch { return json(400, env); }
  const email = typeof cos?.email === 'string' ? cos.email.trim().toLowerCase() : '';
  const lang = cos?.lang;
  if (!esCorreu(email) || !LANGS.includes(lang) || typeof cos?.turnstile !== 'string' || !cos.turnstile) return json(400, env);
  let tj;
  try {
    const tv = await f('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST',
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: cos.turnstile,
        remoteip: req.headers.get('CF-Connecting-IP') || '' }) });
    tj = await tv.json().catch(() => ({}));
  } catch { return json(502, env); }
  if (tj.success !== true || tj.hostname !== new URL(env.ORIGEN).hostname) return json(403, env);
  const token = await signa({ e: email, l: lang, x: ara + TTL_MS }, env.SIGNATURA);
  const url = `${new URL(req.url).origin}/confirma?t=${token}`;
  const c = CONFIRMACIO[lang];
  let r;
  try {
    r = await resend(f, env.RESEND_KEY, 'POST', '/emails', { from: env.REMITENT, reply_to: (env.REMITENT.match(/<([^>]+)>/) || [])[1] || env.REMITENT, to: [email], subject: c.assumpte,
      text: `${c.cos}\n\n${url}\n\n${c.peu}`,
      html: `<p>${c.cos}</p><p><a href="${url}">${url}</a></p><p>${c.peu}</p>` });
  } catch { return json(502, env); }
  return json(r.ok ? 202 : 502, env);
}

export async function afegeix(email, segment, clauApi, f) {
  const r = await resend(f, clauApi, 'POST', '/contacts', { email, unsubscribed: false, segments: [{ id: segment }] });
  if (r.ok) return true;
  // només si el contacte existeix de debò (no un 401/429/500): torna a subscriure'l i posa'l al segment
  const e = encodeURIComponent(email);
  const g = await resend(f, clauApi, 'GET', `/contacts/${e}`);
  if (!g.ok) return false;
  const p = await resend(f, clauApi, 'PATCH', `/contacts/${e}`, { unsubscribed: false });
  if (!p.ok) return false;
  const s = await resend(f, clauApi, 'POST', `/contacts/${e}/segments/${segment}`);
  return s.ok || s.status === 409;
}

export async function confirma(req, env, { fetch: f = fetch, ara = Date.now() } = {}) {
  const v = await verifica(new URL(req.url).searchParams.get('t') || '', env.SIGNATURA, ara);
  const lang = v.lang || 'en';
  const desti = (e) => Response.redirect(`${env.WEB}/${lang}/${PAG_CONFIRMAT[lang]}/${e ? `?e=${e}` : ''}`, 303);
  if (v.error) return desti(v.error);
  let segment;
  try { segment = JSON.parse(env.SEGMENTS)[lang]; } catch { segment = ''; }
  if (!segment) return desti('error');
  const ok = await afegeix(v.email, segment, env.RESEND_KEY, f).catch(() => false);
  return desti(ok ? '' : 'error');
}
