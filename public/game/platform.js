// Shared browser shell; no store-specific payment or identity assumptions.
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/akye/sw.js', {scope:'/akye/'}).catch(() => {});
  });
}
