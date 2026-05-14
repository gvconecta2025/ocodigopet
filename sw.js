// VERSÃO ANTI-CACHE: Este Service Worker força a limpeza total e desliga-se a si mesmo.
self.addEventListener('install', function(e) {
  self.skipWaiting(); // Força a instalação imediata
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // Apaga TODOS os caches antigos
          return caches.delete(cacheName);
        })
      );
    }).then(function() {
      // Desregistra o Service Worker
      self.registration.unregister();
    })
  );
  return self.clients.claim();
});

// Impede que as requisições usem cache
self.addEventListener('fetch', function(e) {
  e.respondWith(fetch(e.request));
});
