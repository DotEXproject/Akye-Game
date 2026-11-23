import {handle} from '../server/api.mjs';
const secure=response=>{
 const headers=new Headers(response.headers);
 headers.set('Content-Security-Policy', "default-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; font-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'");
 headers.set('X-Content-Type-Options','nosniff');
 headers.set('X-Frame-Options','DENY');
 headers.set('Referrer-Policy','no-referrer');
 headers.set('Strict-Transport-Security','max-age=31536000');
 headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=(), payment=(), usb=()');
 headers.set('Cross-Origin-Resource-Policy','same-origin');
 headers.set('Cross-Origin-Opener-Policy','same-origin');
 headers.set('X-Akye-Release','2026-11-04-security-1');
 if((headers.get('content-type')||'').includes('text/html'))headers.set('Cache-Control','no-cache');
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
};
export default {
 async fetch(request,env){
  try{return secure(await this.route(request,env));}
  catch{return secure(new Response('Service temporarily unavailable.',{status:503,headers:{'Cache-Control':'no-store'}}));}
 },
  async route(request, env) {
    const url = new URL(request.url);
    if(url.pathname.startsWith('/api/achi/')) return handle(request, env.DB, env);
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