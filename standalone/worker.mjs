import {handle} from '../server/api.mjs';
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if(url.pathname.startsWith('/api/achi/')) return handle(request, env.DB);
    if(url.pathname === '/') return Response.redirect(url.origin + '/game/index.html' + url.search, 302);
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    if(url.pathname.endsWith('/sw.js')) headers.set('Cache-Control', 'no-cache');
    return new Response(response.body, {status:response.status, headers});
  }
};
