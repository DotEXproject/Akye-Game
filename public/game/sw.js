const CACHE = 'akye-shell-v6';
const SHELL = ['./index.html','./game.js','./experience.js','./online.js','./play-layout.js','./platform.js','./soundscape.js','./arrival.js','./arrival.css','./assets/jubilation-hurray.mp3','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('akye-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Never cache profiles, matches, leaderboards, purchases or cross-origin traffic.
  if(event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith('/game/')) return;
  event.respondWith(fetch(event.request).then(response => {
    if(response.ok && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy)));
    }
    return response;
  }).catch(async () => {
    const cached = await caches.match(event.request);
    if(cached) return cached;
    if(event.request.mode === 'navigate') return caches.match('/game/index.html');
    return new Response('This resource is unavailable offline.', {status:503});
  }));
});
