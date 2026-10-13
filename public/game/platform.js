// Shared browser shell; no store-specific payment or identity assumptions.
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/game/sw.js', {scope:'/game/'}).catch(() => {});
  });
}
