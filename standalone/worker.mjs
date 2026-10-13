import {handle} from '../server/api.mjs';
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if(url.pathname.startsWith('/api/achi/')) return handle(request, env.DB);
    if(url.pathname === '/' || url.pathname === '/akye' || url.pathname === '/akye/index.html')
      return Response.redirect(url.origin + '/akye/' + url.search, 302);
    if(url.pathname === '/game' || url.pathname.startsWith('/game/')) {
      const suffix = url.pathname.slice('/game'.length);
      const path = suffix === '' || suffix === '/' || suffix === '/index.html' ? '/akye/' : '/akye' + suffix;
      return Response.redirect(url.origin + path + url.search, 302);
    }
    const assetUrl = new URL(request.url);
    if(url.pathname.startsWith('/akye/'))
      assetUrl.pathname = url.pathname === '/akye/' ? '/game/' : '/game/' + url.pathname.slice('/akye/'.length);
    const response = await env.ASSETS.fetch(new Request(assetUrl, request));
    const headers = new Headers(response.headers);
    const location = headers.get('Location');
    if(location) {
      const target = new URL(location, url);
      if(target.origin === url.origin && target.pathname.startsWith('/game/')) {
        target.pathname = target.pathname.replace('/game/', '/akye/');
        headers.set('Location', target.href);
      }
    }
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    if(url.pathname.endsWith('/sw.js')) headers.set('Cache-Control', 'no-cache');
    return new Response(response.body, {status:response.status, headers});
  }
};
