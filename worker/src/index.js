// worker/src/index.js -- les dues rutes del Worker de subscripció d'AI Weekly.
import { subscriu, confirma, preflight } from './logica.js';

export default {
  async fetch(req, env) {
    const { pathname } = new URL(req.url);
    try {
      if (pathname === '/subscriu' && req.method === 'OPTIONS') return preflight(req, env);
      if (pathname === '/subscriu' && req.method === 'POST') return await subscriu(req, env);
      if (pathname === '/confirma' && req.method === 'GET') return await confirma(req, env);
      return new Response('Not found', { status: 404 });
    } catch {
      return new Response(null, { status: 500 });   // mai el detall
    }
  },
};
